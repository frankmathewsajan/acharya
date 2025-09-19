const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying MarksRecord contract to local network...");
  
  // Get the contract factory
  const MarksRecord = await ethers.getContractFactory("MarksRecord");
  
  // Deploy the contract
  console.log("📦 Deploying contract...");
  const marksRecord = await MarksRecord.deploy();
  
  // Wait for deployment to complete
  await marksRecord.waitForDeployment();
  
  const contractAddress = await marksRecord.getAddress();
  
  console.log("✅ Contract deployed successfully!");
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🔗 Network: Local Hardhat Network`);
  console.log(`⛓️  Chain ID: 31337`);
  
  console.log("\n📋 Next steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Update the CONTRACT_ADDRESS in frontend/src/contexts/MarksContext.tsx");
  console.log("3. Make sure Hardhat is running: npx hardhat node");
  console.log("4. Access the blockchain marks page at: http://localhost:8080/blockchain-marks");
  
  console.log("\n🧪 Testing the contract...");
  
  // Test setting marks
  try {
    const [deployer] = await ethers.getSigners();
    const tx = await marksRecord.setMarks(85);
    await tx.wait();
    console.log("✅ Test: Successfully set marks to 85");
    
    // Test retrieving marks
    const marks = await marksRecord.getMarks(deployer.address);
    console.log(`📊 Retrieved marks for deployer: ${marks}`);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });