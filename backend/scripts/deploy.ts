import { network } from "hardhat";

async function main() {
  console.log("Starting deployment to local network...\n");

  // THIS is the magic line in Hardhat 3! 
  // We explicitly create a network connection which hands us `ethers`.
  const { ethers } = await network.create();

  // Get the first account from the 20 fake accounts Hardhat created
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);

  // 1. Deploy RelicCoin
  console.log("\nDeploying RelicCoin...");
  const RelicCoin = await ethers.getContractFactory("RelicCoin");
  const relicCoin = await RelicCoin.deploy();
  await relicCoin.waitForDeployment();
  const relicAddress = await relicCoin.getAddress();
  console.log(`✅ RelicCoin deployed to: ${relicAddress}`);

  // 2. Deploy CreatureNFT
  console.log("\nDeploying CreatureNFT...");
  const CreatureNFT = await ethers.getContractFactory("CreatureNFT");
  const creatureNFT = await CreatureNFT.deploy();
  await creatureNFT.waitForDeployment();
  const nftAddress = await creatureNFT.getAddress();
  console.log(`✅ CreatureNFT deployed to: ${nftAddress}`);

  // 3. Deploy GameSettler (Needs the addresses of the first two)
  console.log("\nDeploying GameSettler...");
  const GameSettler = await ethers.getContractFactory("GameSettler");
  const gameSettler = await GameSettler.deploy(relicAddress, nftAddress);
  await gameSettler.waitForDeployment();
  const settlerAddress = await gameSettler.getAddress();
  console.log(`✅ GameSettler deployed to: ${settlerAddress}`);

  // 4. Setup Permissions
  console.log("\nConfiguring Contract Permissions...");
  
  // Let GameSettler print RelicCoins
  await relicCoin.setMinter(settlerAddress, true);
  console.log("✅ GameSettler authorized to mint $RELIC.");

  // Transfer Ownership of the NFT contract to GameSettler so it can mint monsters
  await (creatureNFT as any).transferOwnership(settlerAddress);
  console.log("✅ GameSettler granted ownership of CreatureNFT.");

  console.log("\n🎉 Deployment Complete! Ready for the frontend.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});