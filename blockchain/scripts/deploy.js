const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying RFQRegistry...");

  const RFQRegistry = await hre.ethers.getContractFactory("RFQRegistry");
  const contract = await RFQRegistry.deploy();
  await contract.waitForDeployment(); // ethers v6

  const address = await contract.getAddress();
  console.log("RFQRegistry deployed to:", address);

  const artifact = await hre.artifacts.readArtifact("RFQRegistry");
  const out = { address, abi: artifact.abi };

  // Write to backend folder
  const target = path.join(__dirname, "..", "blockchain-bidding-backend", "src", "blockchain");
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(path.join(target, "RFQRegistry.json"), JSON.stringify(out, null, 2));

  console.log("Wrote ABI+address to backend src/blockchain/RFQRegistry.json");
}

main().catch((e) => { console.error("Deployment error:", e); process.exit(1); });
