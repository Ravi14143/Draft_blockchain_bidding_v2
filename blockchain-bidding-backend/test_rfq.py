# test_rfq.py
import os
from datetime import datetime, timedelta
from src.blockchain.contract_service import create_rfq_onchain, submit_bid_onchain, str_keccak

# -----------------------------
# Test creating an RFQ on-chain
# -----------------------------

def test_create_rfq():
    title = "Test RFQ"
    scope = "This is the scope of work for testing"
    meta_hash = str_keccak(scope)  # hash scope for on-chain storage
    deadline_iso = (datetime.utcnow() + timedelta(days=7)).isoformat()
    category = "IT Services"
    budget = 1000
    location = "Remote"

    # Pass arguments POSITIONALLY, not as keywords
    rfq_result = create_rfq_onchain(
        title,
        meta_hash,
        deadline_iso,
        category,
        budget,
        location
    )

    print("RFQ Creation Result:")
    print("RFQ ID:", rfq_result.get("rfqId"))
    print("Transaction Hash:", rfq_result.get("txHash"))
    return rfq_result


# -----------------------------
# Test submitting a bid on-chain
# -----------------------------

def test_submit_bid(rfq_id):
    price = 900
    doc_hash = str_keccak("Bid proposal document content")

    bid_result = submit_bid_onchain(rfq_id, price, doc_hash)
    print("Bid Submission Result:")
    print("Bid ID:", bid_result.get("bidId"))
    print("Transaction Hash:", bid_result.get("txHash"))


# -----------------------------
# Run tests
# -----------------------------
if __name__ == "__main__":
    # Create RFQ first
    rfq_result = test_create_rfq()

    # Submit a bid for the RFQ created
    rfq_id = rfq_result.get("rfqId") if rfq_result else None
    if rfq_id:
        test_submit_bid(rfq_id)
    else:
        print("RFQ creation failed, skipping bid submission")
