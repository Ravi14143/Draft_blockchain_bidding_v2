import os
import json
from datetime import datetime
from web3 import Web3
from dotenv import load_dotenv

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
print(THIS_DIR)
with open(os.path.join(THIS_DIR, "RFQRegistry.json")) as f:
    info = json.load(f)

contract_address = info.get("address")
contract_abi = info.get("abi")

if not contract_address or not contract_abi:
    raise Exception("⚠️ RFQRegistry.json missing 'address' or 'abi'")

contract = w3.eth.contract(address=contract_address, abi=contract_abi)

# ---------------------------
# Helpers
# ---------------------------
def to_unix_seconds(deadline_iso: str) -> int:
    """Convert ISO string to epoch seconds."""
    if not deadline_iso:
        return 0
    try:
        dt = datetime.fromisoformat(deadline_iso)
    except ValueError:
        try:
            dt = datetime.strptime(deadline_iso, "%Y-%m-%dT%H:%M")
        except ValueError:
            dt = datetime.strptime(deadline_iso, "%Y-%m-%d")
    return int(dt.timestamp())

def str_keccak(text: str) -> str:
    """Compute keccak256 hash of a string."""
    return w3.keccak(text=(text or "")).hex()


def _sign_and_send(tx):
    """Sign a transaction and return the receipt."""
    signed = w3.eth.account.sign_transaction(tx, private_key=GANACHE_PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    if receipt.status != 1:
        raise Exception("Transaction failed on-chain!")
    return tx_hash, receipt

# ---------------------------
# RFQ Functions
# ---------------------------
def create_rfq_onchain(title: str, meta_hash: str, deadline_iso: str,
                       category: str, budget: int, location: str):
    """Create a new RFQ on-chain and log raw receipt for debugging."""
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
    print("Backend contract address:", contract_address)
    print("Contract code:", w3.eth.get_code(contract_address))

    # Debug: log raw receipt and logs
    print("🔎 Tx Hash:", tx_hash.hex())
    print("🔎 Receipt Logs:", receipt.logs)

    try:
        events = contract.events.RFQCreated().process_receipt(receipt)
        print("✅ Parsed Events:", events)
    except Exception as e:
        print("⚠️ Event parsing failed:", str(e))
        events = []

    if not events:
        # Fallback: return receipt and let caller inspect
        return {"rfqId": None, "txHash": tx_hash.hex(), "logs": receipt.logs}

    # ✅ Correct key is "id"
    args = events[0]["args"]
    rfq_id = args.get("id")

    return {"rfqId": int(rfq_id), "txHash": tx_hash.hex()}


def close_rfq_onchain(rfq_id: int):
    """Close an RFQ on-chain (only owner can close)."""
    nonce = w3.eth.get_transaction_count(GANACHE_ADDRESS)

    tx = contract.functions.closeRFQ(int(rfq_id)).build_transaction({
        "from": GANACHE_ADDRESS,
        "nonce": nonce,
        "gas": 200000,
        "gasPrice": w3.to_wei("10", "gwei")
    })

    tx_hash, receipt = _sign_and_send(tx)
    return {"txHash": tx_hash.hex()}


# Bid Helpers
# -----------------------------
def submit_bid_onchain(rfq_id: int, price: int, doc_hash: str):
    """Submit a bid to a given RFQ on-chain."""
    nonce = w3.eth.get_transaction_count(GANACHE_ADDRESS)

    tx = contract.functions.submitBid(
        int(rfq_id), int(price), doc_hash or ""
    ).build_transaction({
        "from": GANACHE_ADDRESS,
        "nonce": nonce,
        "gas": 500000,
        "gasPrice": w3.to_wei("10", "gwei")
    })

    signed = w3.eth.account.sign_transaction(tx, private_key=GANACHE_PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    if receipt.status != 1:
        raise Exception("Bid transaction failed on-chain!")

    evts = contract.events.BidSubmitted().process_receipt(receipt)
    if not evts:
        raise Exception("No BidSubmitted event found!")

    bid_id = int(evts[0]["args"]["id"])
    return {"bidId": bid_id, "txHash": tx_hash.hex()}