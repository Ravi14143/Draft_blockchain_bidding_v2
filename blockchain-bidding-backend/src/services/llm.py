# src/services/llm.py
"""
Local, free LLM utilities using Hugging Face Transformers.

- Uses google/flan-t5-base (free) for instruction-following text2text generation
- Provides ask_llm (raw text) and ask_llm_json (robust JSON with fallback)
"""

import json
import re
from typing import Any, Dict, Optional

import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline

# -------- Config --------
# Free, light, instruction-tuned model that runs on CPU/GPU
MODEL_NAME = "google/flan-t5-base"

# GPU if available, else CPU
DEVICE = 0 if torch.cuda.is_available() else -1

# -------- Load once --------
_tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=True)
_model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
_generator = pipeline(
    task="text2text-generation",
    model=_model,
    tokenizer=_tokenizer,
    device=DEVICE,
)


def ask_llm(prompt: str, max_new_tokens: int = 512, temperature: float = 0.0) -> str:
    """
    Run a prompt through the local model and return the raw string output.
    """
    out = _generator(
        prompt,
        max_new_tokens=max_new_tokens,
        temperature=temperature,
        do_sample=temperature > 0,
        num_return_sequences=1,
    )
    return out[0]["generated_text"]


def _extract_json_blob(text: str) -> Optional[str]:
    """
    Try to extract a JSON object/array from arbitrary text (handles code fences etc.)
    """
    # Remove code fences if present
    cleaned = re.sub(r"```(?:json)?", "", text, flags=re.IGNORECASE).strip()

    # Try the simplest: if the whole string is JSON
    try:
        json.loads(cleaned)
        return cleaned
    except Exception:
        pass

    # Otherwise, find the first balanced {...} or [...]
    # This is a simple heuristic that works well for model outputs.
    stack = []
    start_idx = None
    for i, ch in enumerate(cleaned):
        if ch in "{[":
            if not stack:
                start_idx = i
            stack.append(ch)
        elif ch in "}]":
            if not stack:
                continue
            open_ch = stack.pop()
            if (open_ch == "{" and ch != "}") or (open_ch == "[" and ch != "]"):
                # Mismatched; reset
                stack = []
                start_idx = None
                continue
            if not stack and start_idx is not None:
                candidate = cleaned[start_idx : i + 1]
                # Validate
                try:
                    json.loads(candidate)
                    return candidate
                except Exception:
                    # keep scanning
                    start_idx = None
    return None


def ask_llm_json(
    prompt: str,
    max_new_tokens: int = 512,
    temperature: float = 0.0,
    default: Optional[Dict[str, Any]] = None,
    retry: int = 1,
) -> Dict[str, Any]:
    """
    Ask the model for a JSON response. Tries to coerce valid JSON from the output.
    On failure, optionally retries with stronger instructions, then returns `default` (or {}).
    """
    suffix = (
        "\n\nReturn ONLY valid JSON. Do not include any prose. "
        "Use double-quoted keys/strings and proper JSON types."
    )
    text = ask_llm(prompt + suffix, max_new_tokens=max_new_tokens, temperature=temperature)
    blob = _extract_json_blob(text)
    if blob:
        try:
            return json.loads(blob)
        except Exception:
            pass

    # Retry with much stricter instruction
    if retry > 0:
        strict_prompt = (
            prompt
            + "\n\nReturn STRICT JSON only. No extra text. "
              "Example: {\"status\":\"pass\",\"reasons\":[],\"missing\":[],\"red_flags\":[]}"
        )
        text = ask_llm(strict_prompt, max_new_tokens=max_new_tokens, temperature=temperature)
        blob = _extract_json_blob(text)
        if blob:
            try:
                return json.loads(blob)
            except Exception:
                pass

    return default or {}
