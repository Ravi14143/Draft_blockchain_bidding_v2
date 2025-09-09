# src/services/evaluation.py
"""
Phase 1 and Phase 2 AI evaluation with:
- Free local LLM (flan-t5-base) for JSON decisions, red flags, clarifications
- Free local embeddings (sentence-transformers/all-MiniLM-L6-v2) for semantic similarity
- Robust fallbacks so the system continues working even if models fail

Assumptions:
- RFQFile and BidFile models expose .extract_text() (safe; return '' if cannot parse)
"""

import json
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional

import numpy as np

from src.models.user import RFQ, RFQFile, BidFile, Bid
from src.services.llm import ask_llm_json, ask_llm

# ---- Embeddings (free local) ----
# We lazy-load the model to keep startup fast
_SENTS_MODEL = None

def _get_sentence_model():
    global _SENTS_MODEL
    if _SENTS_MODEL is None:
        from sentence_transformers import SentenceTransformer
        _SENTS_MODEL = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    return _SENTS_MODEL

def _embed(text: str) -> np.ndarray:
    model = _get_sentence_model()
    vec = model.encode([text or ""], normalize_embeddings=True)[0]
    return np.asarray(vec, dtype=np.float32)

def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    if a is None or b is None or a.size == 0 or b.size == 0:
        return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))


# ---------------------------
# Helpers
# ---------------------------
def _parse_weights(weights_str: str) -> Dict[str, float]:
    try:
        w = json.loads(weights_str or "{}")
        s = float(sum(w.values())) or 1.0
        # normalize
        return {k: float(v) / s for k, v in w.items()}
    except Exception:
        # default balanced weights with semantic signal
        return {"price": 0.3, "timeline": 0.2, "experience": 0.2, "semantic": 0.3}


def _days_between(start_iso: Optional[str], end_iso: Optional[str]) -> int:
    if not start_iso or not end_iso:
        return 0
    try:
        s = datetime.fromisoformat(start_iso)
        e = datetime.fromisoformat(end_iso)
        return max(0, (e - s).days)
    except Exception:
        return 0


def _safe_join_texts(items: List[str], limit_chars: int = 12000) -> str:
    """Join and cap text length so we don't overload the models."""
    text = "\n\n".join([x for x in items if x])[:limit_chars]
    return text


def _timeline_days(timeline: str) -> int:
    tl = (timeline or "").lower()
    digits = "".join(c for c in tl if c.isdigit())
    try:
        n = int(digits) if digits else 0
    except Exception:
        return 0

    if "day" in tl:
        return n
    if "week" in tl:
        return n * 7
    if "month" in tl:
        return n * 30
    return 0


# ---------------------------
# Phase 1 – Criteria / Eligibility (LLM)
# ---------------------------
def evaluate_phase1(qualifications_text: str, rfq_id: int) -> Dict[str, Any]:
    rfq = RFQ.query.get(rfq_id)
    crit = rfq.evaluation_criteria or ""
    elig = rfq.eligibility_requirements or ""
    title = rfq.title or ""
    scope = rfq.scope or ""

    prompt = f"""
You are an RFQ pre-qualification checker.

RFQ Title: {title}
Scope (summary): {scope}

Evaluation Criteria (owner-provided):
{crit}

Eligibility Requirements (owner-provided):
{elig}

Bidder Submission (free text):
{qualifications_text}

Task:
1) Determine if the bidder MEETS minimum criteria & eligibility.
2) Identify what's missing relative to criteria/eligibility.
3) Identify any risks/red flags.
4) If something essential is unclear/missing, request clarification.

Return STRICT JSON with keys:
{{
  "status": "pass" | "reject" | "clarify",
  "reasons": string[],             // 2-6 bullet reasons
  "missing": string[],             // concrete missing items (if any)
  "red_flags": string[],           // risks/concerns (if any)
  "clarifications": string[]       // specific clarification questions (if any)
}}
Only return JSON.
"""
    # Try LLM first
    result = ask_llm_json(prompt, default={})

    # Fallback if model fails -> conservative clarify
    if not result or "status" not in result:
        # Simple heuristic fallback
        text = (qualifications_text or "").lower()
        crit_l = (crit or "").lower()
        musts = []
        for kw in ["experience", "methodology", "approach", "team", "compliance", "certification", "past performance"]:
            if kw in crit_l:
                musts.append(kw)
        missing = [m for m in musts if m not in text]
        status = "pass" if not missing else "clarify"
        result = {
            "status": status,
            "reasons": ["Heuristic fallback decision"],
            "missing": missing,
            "red_flags": [],
            "clarifications": [f"Please provide details about '{m}'." for m in missing],
        }

    # Sanitize types
    def as_list(x):
        return x if isinstance(x, list) else ([] if x is None else [str(x)])

    return {
        "status": str(result.get("status", "clarify")),
        "reasons": as_list(result.get("reasons")),
        "missing": as_list(result.get("missing")),
        "red_flags": as_list(result.get("red_flags")),
        "clarifications": as_list(result.get("clarifications") or result.get("clarification_needed")),
    }


# ---------------------------
# Phase 2 – Semantic + Weighted Scoring + AI red flags
# ---------------------------
def evaluate_phase2(bid: Bid) -> dict:
    rfq = RFQ.query.get(bid.rfq_id)
    weights = _parse_weights(rfq.evaluation_weights or {})

    # --- Gather text from files (owner RFQ vs bidder submission)
    rfq_files = RFQFile.query.filter_by(rfq_id=rfq.id).all()
    bid_files = BidFile.query.filter_by(bid_id=bid.id).all()

    # --- Collect RFQ text
    rfq_texts = [rfq.scope or "", rfq.evaluation_criteria or "", rfq.eligibility_requirements or ""]
    for f in rfq_files:
        try:
            rfq_texts.append(f.extract_text() or "")
        except Exception:
            pass
    rfq_text = _safe_join_texts(rfq_texts)

    # --- Collect bidder text
    bid_texts = [bid.qualifications or ""]
    for f in bid_files:
        try:
            bid_texts.append(f.extract_text() or "")
        except Exception:
            pass
    bid_text = _safe_join_texts(bid_texts)

    # --- Semantic similarity
    try:
        if rfq_text and bid_text:
            emb_rfq = _embed(rfq_text)
            emb_bid = _embed(bid_text)
            semantic_score = max(0.0, min(1.0, _cosine(emb_rfq, emb_bid)))
        else:
            semantic_score = 0.0
    except Exception:
        semantic_score = 0.0

    # --- Numeric scoring: price, timeline, experience
    bmin = rfq.budget_min or 0
    bmax = rfq.budget_max or (bmin + 1 if bmin else 1)
    price_score = max(0.0, min(1.0, (bmax - float(bid.price)) / (bmax - bmin))) if bid.price > 0 and bmax > bmin else 0.5

    window_days = _days_between(rfq.start_date, rfq.end_date)
    bid_days = _days_between(bid.timeline_start, bid.timeline_end)
    timeline_score = 1.0 if not window_days else max(0.0, min(1.0, (window_days - abs(window_days - bid_days)) / window_days))

    text_l = (bid.qualifications or "").lower()
    exp_hits = sum(kw in text_l for kw in ["experience", "methodology", "case study", "reference", "certification", "compliance"])
    experience_score = max(0.0, min(1.0, 0.3 + 0.1 * exp_hits))
    if len(text_l) < 200:
        experience_score *= 0.85

    breakdown = {
        "price": round(price_score, 3),
        "timeline": round(timeline_score, 3),
        "experience": round(experience_score, 3),
        "semantic": round(semantic_score, 3),
    }
    total = max(0.0, min(1.0, sum(breakdown[k] * weights.get(k, 0.25) for k in breakdown)))

    # --- AI analysis for missing points / red flags / clarifications
    ai_prompt = f"""
You compare an RFQ document to a bidder proposal.

Return STRICT JSON with:
{{
  "missing": string[],         
  "red_flags": string[],       
  "clarification_needed": string[] 
}}

RFQ TEXT:
{rfq_text[:6000]}

BID TEXT:
{bid_text[:6000]}
"""
    extra = ask_llm_json(ai_prompt, default={"missing": [], "red_flags": [], "clarification_needed": []})

    # Ensure it's a dict
    if not isinstance(extra, dict):
        extra = {"missing": [], "red_flags": [], "clarification_needed": []}

    # --- Decide status using score + AI signals
    has_red_flags = bool(extra.get("red_flags"))
    print(has_red_flags)
    if total >= 0.72 and not has_red_flags:
        status = "pass"
    elif total >= 0.5:
        status = "clarify"
    else:
        status = "reject"

    return {
        "status": status,
        "score": round(total, 3),
        "breakdown": breakdown,
        "missing": extra.get("missing", []),
        "red_flags": extra.get("red_flags", []),
        "clarification_needed": extra.get("clarification_needed", []),
    }
