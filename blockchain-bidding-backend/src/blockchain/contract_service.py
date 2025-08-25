import os, json
from datetime import datetime
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

GANACHE_URL = os.getenv("GANACHE_URL", "http://127.0.0.1:7545")
GANACHE_PRIVATE_KEY = os.getenv("GANACHE_PRIVATE_KEY")
GANACHE_ADDRESS = os.getenv("GANACHE_ADDRESS")
print(GANACHE_ADDRESS)
# Safety checks
if not GANACHE_ADDRESS or not GANACHE_PRIVATE_KEY:
    raise Exception("⚠️ Please set GANACHE_ADDRESS and GANACHE_PRIVATE_KEY in .env")

# Normalize private key (strip leading "0x" if needed)
if GANACHE_PRIVATE_KEY.startswith("0x"):
    GANACHE_PRIVATE_KEY = GANACHE_PRIVATE_KEY[2:]

w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
assert w3.is_connected(), f"Web3 failed to connect to {GANACHE_URL}"

# Load ABI + deployed address (from Hardhat deployment)
THIS_DIR = os.path.dirname(__file__)
with open(os.path.join(THIS_DIR, "RFQRegistry.json"), "r") as f:
    info = json.load(f)

contract_address = info.get("address")
contract_abi = info.get("abi")

if not contract_address or not contract_abi:
    raise Exception("⚠️ RFQRegistry.json missing 'address' or 'abi'")

contract = w3.eth.contract(address=contract_address, abi=contract_abi)

# ---------- Helpers ----------

def str_keccak(text: str) -> str:
    return w3.keccak(text=(text or "")).hex()

def to_unix_seconds(deadline_iso: str) -> int:
    """
    Converts ISO string 'YYYY-MM-DDTHH:MM' or 'YYYY-MM-DDTHH:MM:SS' to epoch seconds.
    """
    if not deadline_iso:
        return 0
    try:
        dt = datetime.fromisoformat(deadline_iso)
    except Exception:
        try:
            dt = datetime.strptime(deadline_iso, "%Y-%m-%dT%H:%M")
        except Exception:
            dt = datetime.strptime(deadline_iso, "%Y-%m-%d")
    return int(dt.timestamp())

# ---------- Contract Calls ----------

def create_rfq_onchain(title: str, scope_hash: str, deadline_secs: int,
                       category: str, budget: int, location: str):
    nonce = w3.eth.get_transaction_count(GANACHE_ADDRESS)

    tx = contract.functions.createRFQ(
        title or "", scope_hash, int(deadline_secs),
        category or "", int(budget or 0), location or ""
    ).build_transaction({
        "from": GANACHE_ADDRESS,
        "nonce": nonce,
        "gas": 500000,
        "gasPrice": w3.to_wei("10", "gwei")
    })

    # Sign transaction
    signed = w3.eth.account.sign_transaction(tx, private_key=GANACHE_PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    # Parse emitted event
    evts = contract.events.RFQCreated().process_receipt(receipt)
    onchain_id = int(evts[0]["args"]["id"]) if evts else None

    return {
        "rfqId": onchain_id,
        "txHash": tx_hash.hex()
    }
