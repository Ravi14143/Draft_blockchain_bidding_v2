# tests/test_evaluation.py
import pytest
from types import SimpleNamespace

from src.services import evaluation

# ---- Mock Models ----
class DummyRFQ:
    def __init__(self, id=1):
        self.id = id
        self.title = "Website Development RFQ"
        self.scope = "Develop a responsive website with e-commerce features."
        self.evaluation_criteria = "Experience with web projects; methodology; certifications"
        self.eligibility_requirements = "Company must have 3+ years experience; compliance with security standards"
        self.evaluation_weights = '{"price": 0.4, "timeline": 0.2, "experience": 0.2, "semantic": 0.2}'
        self.budget_min = 10000
        self.budget_max = 20000
        self.start_date = "2025-09-01"
        self.end_date = "2025-12-01"

class DummyRFQFile:
    def __init__(self, text):
        self._text = text
    def extract_text(self):
        return self._text

class DummyBidFile:
    def __init__(self, text):
        self._text = text
    def extract_text(self):
        return self._text

# ---- Monkeypatch DB calls ----
@pytest.fixture(autouse=True)
def patch_models(monkeypatch):
    rfq = DummyRFQ()
    rfq_files = [DummyRFQFile("Additional RFQ details about scope and deliverables.")]
    bid_files = [DummyBidFile("Our proposal includes methodology and compliance approach.")]

    monkeypatch.setattr(evaluation, "RFQ", SimpleNamespace(query=SimpleNamespace(get=lambda id: rfq)))
    monkeypatch.setattr(evaluation, "RFQFile", SimpleNamespace(query=SimpleNamespace(filter_by=lambda **kwargs: rfq_files)))
    monkeypatch.setattr(evaluation, "BidFile", SimpleNamespace(query=SimpleNamespace(filter_by=lambda **kwargs: bid_files)))

    yield

# ---- Tests ----
def test_phase1():
    qualifications = "We have 5 years of experience, methodology for agile development, and certifications in security."
    result = evaluation.evaluate_phase1(qualifications, rfq_id=1)
    print("\nPhase 1 Result:", result)
    assert "status" in result
    assert isinstance(result["reasons"], list)

def test_phase2():
    qualifications = "We have case studies, references, and certifications. Timeline is 10 weeks."
    price = 15000
    timeline = "10 weeks"
    result = evaluation.evaluate_phase2(bid_id=1, rfq_id=1, qualifications_text=qualifications, price=price, timeline=timeline)
    print("\nPhase 2 Result:", result)
    assert "status" in result
    assert "score" in result
    assert "breakdown" in result
    assert "reasons" in result

# ---- Mock Models ----
class DummyRFQ:
    def __init__(self, id=1):
        self.id = id
        self.title = "Website Development RFQ"
        self.scope = "Develop a responsive website with e-commerce features."
        self.evaluation_criteria = "Experience with web projects; methodology; certifications"
        self.eligibility_requirements = "Company must have 3+ years experience; compliance with security standards"
        self.evaluation_weights = '{"price": 0.4, "timeline": 0.2, "experience": 0.2, "semantic": 0.2}'
        self.budget_min = 10000
        self.budget_max = 20000
        self.start_date = "2025-09-01"
        self.end_date = "2025-12-01"

class DummyRFQFile:
    def __init__(self, text):
        self._text = text
    def extract_text(self):
        return self._text

class DummyBidFile:
    def __init__(self, text):
        self._text = text
    def extract_text(self):
        return self._text

# ---- Monkeypatch DB calls ----
@pytest.fixture(autouse=True)
def patch_models(monkeypatch):
    rfq = DummyRFQ()
    rfq_files = [DummyRFQFile("Additional RFQ details about scope and deliverables.")]
    bid_files = [DummyBidFile("Our proposal includes methodology and compliance approach.")]

    monkeypatch.setattr(evaluation, "RFQ", SimpleNamespace(query=SimpleNamespace(get=lambda id: rfq)))
    monkeypatch.setattr(evaluation, "RFQFile", SimpleNamespace(query=SimpleNamespace(filter_by=lambda **kwargs: rfq_files)))
    monkeypatch.setattr(evaluation, "BidFile", SimpleNamespace(query=SimpleNamespace(filter_by=lambda **kwargs: bid_files)))

    yield

# ---- Tests ----
def test_phase1():
    qualifications = "We have 5 years of experience, methodology for agile development, and certifications in security."
    result = evaluation.evaluate_phase1(qualifications, rfq_id=1)
    print("\nPhase 1 Result:", result)
    assert "status" in result
    assert isinstance(result["reasons"], list)

def test_phase2():
    qualifications = "We have case studies, references, and certifications. Timeline is 10 weeks."
    price = 15000
    timeline = "10 weeks"
    result = evaluation.evaluate_phase2(bid_id=1, rfq_id=1, qualifications_text=qualifications, price=price, timeline=timeline)
    print("\nPhase 2 Result:", result)
    assert "status" in result
    assert "score" in result
    assert "breakdown" in result
