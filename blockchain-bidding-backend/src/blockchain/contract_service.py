import os
import json
from datetime import datetime
from web3 import Web3
from dotenv import load_dotenv
from decimal import Decimal
from flask import current_app

load_dotenv()

# ---------------------------
# Environment & Web3 setup
# ---------------------------
GANACHE_URL = os.getenv("GANACHE_URL", "http://127.0.0.1:8545")
GANACHE_PRIVATE_KEY = os.getenv("GANACHE_PRIVATE_KEY")
GANACHE_ADDRESS = os.getenv("GANACHE_ADDRESS")

if not GANACHE_ADDRESS or not GANACHE_PRIVATE_KEY:
    raise Exception("⚠️ Please set GANACHE_ADDRESS and GANACHE_PRIVATE_KEY in .env")

if GANACHE_PRIVATE_KEY.startswith("0x"):
    GANACHE_PRIVATE_KEY = GANACHE_PRIVATE_KEY[2:]

w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
assert w3.is_connected(), f"❌ Web3 failed to connect to {GANACHE_URL}"

# ---------------------------
# Load contract ABI & address
# ---------------------------
THIS_DIR = os.path.dirname(__file__)
with open(os.path.join(THIS_DIR, "RFQRegistry.json")) as f:
    info = json.load(f)

contract_address = Web3.to_checksum_address(info.get("address"))
contract_abi = info.get("abi")

if not contract_address or not contract_abi:
    raise Exception("⚠️ RFQRegistry.json missing 'address' or 'abi'")

contract = w3.eth.contract(address=contract_address, abi=contract_abi)

# ---------------------------
# Helpers
# ---------------------------
def to_unix_seconds(deadline_iso: str) -> int:
    if not deadline_iso:
        return 0
    try:
        dt = datetime.fromisoformat(deadline_iso)
    except ValueError:
        dt = datetime.strptime(deadline_iso, "%Y-%m-%d")
    return int(dt.timestamp())

def str_keccak(text: str) -> str:
    """Compute keccak256 hash of a string."""
    if isinstance(text, str):
        return w3.keccak(text=text).hex()
    elif isinstance(text, bytes):
        return w3.keccak(text=text.decode("utf-8")).hex()
    return w3.keccak(text=b"").hex()

def _sign_and_send(tx):
    """Sign a transaction and send it on-chain (Web3.py v6 compatible)."""
    signed_txn = w3.eth.account.sign_transaction(tx, private_key=GANACHE_PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    if receipt.status != 1:
        raise Exception("Transaction failed on-chain!")
    return tx_hash, receipt

# ---------------------------
# RFQ Functions
# ---------------------------
def create_rfq_onchain(title: str, meta_hash: str, deadline_iso: str,
                       category: str, budget: int, location: str):
    """Create a new RFQ on-chain."""
    deadline_secs = to_unix_seconds(deadline_iso)
    nonce = w3.eth.get_transaction_count(GANACHE_ADDRESS)

    tx = contract.functions.createRFQ(
        title or "", meta_hash or "", int(deadline_secs),
        category or "", int(budget or 0), location or ""
    ).build_transaction({
        "from": GANACHE_ADDRESS,
        "nonce": nonce,
        "gas": 500000,
        "gasPrice": w3.to_wei("10", "gwei")
    })

    tx_hash, receipt = _sign_and_send(tx)

    # Parse RFQCreated event
    try:
        events = contract.events.RFQCreated().process_receipt(receipt)
        if not events:
            raise Exception("No RFQCreated event found")
        rfq_id = int(events[0]["args"]["id"])
    except Exception as e:
        print("⚠️ Event parsing failed:", str(e))
        rfq_id = None

    return {"rfqId": rfq_id, "txHash": tx_hash.hex(), "logs": receipt.logs}

def close_rfq_onchain(rfq_id: int):
    nonce = w3.eth.get_transaction_count(GANACHE_ADDRESS)
    tx = contract.functions.closeRFQ(int(rfq_id)).build_transaction({
        "from": GANACHE_ADDRESS,
        "nonce": nonce,
        "gas": 200000,
        "gasPrice": w3.to_wei("10", "gwei")
    })
    tx_hash, receipt = _sign_and_send(tx)
    return {"txHash": tx_hash.hex(), "logs": receipt.logs}




# Assuming these are already initialized elsewhere in your project
# w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
# contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

def submit_bid_onchain(rfq_id: int, price: Decimal, doc_hash: str):
    """
    Submits a bid to the blockchain smart contract.

    Args:
        rfq_id (int): The RFQ ID (matches off-chain DB).
        price (Decimal): The bid price in USD (supports decimals).
        doc_hash (str): Hash of uploaded bid documents.

    Returns:
        dict: { "bidId": <int>, "txHash": <str> }
    """

    try:
        if not doc_hash:
            raise ValueError("Document hash is required for on-chain submission")

        # --- Ensure price is integer-compatible for Solidity ---
        # Example: store in cents (multiply by 100)
        price_int = int(Decimal(price) * 100)

        # Get nonce for account
        nonce = w3.eth.get_transaction_count(GANACHE_ADDRESS)

        # Build transaction
        tx = contract.functions.submitBid(
            int(rfq_id),
            price_int,
            doc_hash
        ).build_transaction({
            "from": GANACHE_ADDRESS,
            "nonce": nonce,
            "gas": 500000,  # TODO: adjust or estimate
            "gasPrice": w3.to_wei("10", "gwei"),
        })

        # Sign transaction
        signed_txn = w3.eth.account.sign_transaction(tx, private_key=GANACHE_PRIVATE_KEY)

        # Send transaction
        tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)

        # Wait for confirmation
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

        if receipt.status != 1:
            raise Exception("Bid transaction failed on-chain!")

        # Process events
        events = contract.events.BidSubmitted().process_receipt(receipt)
        if not events:
            raise Exception("No BidSubmitted event found in receipt")

        bid_id = int(events[0]["args"]["id"])

        return {"bidId": bid_id, "txHash": tx_hash.hex()}

    except Exception as e:
        current_app.logger.error(f"On-chain bid submission failed: {e}", exc_info=True)
        raise
