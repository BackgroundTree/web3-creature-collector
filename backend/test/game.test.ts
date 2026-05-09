import { expect } from "chai";
import { network } from "hardhat";

describe("Creature Collector Economy & Settler", function () {
  let ethers: any;
  let relicCoin: any;
  let creatureNFT: any;
  let gameSettler: any;
  let owner: any; // The secure backend server
  let player: any; // The user

  let INITIAL_RELIC: any;
  let MINT_FEE: any;

  // Helper object to represent a valid Pokémon to mint
  const dummyCreature = {
    speciesId: 1, // Bulbasaur
    level: 5,
    ivs: [31, 31, 31, 31, 31, 31], // Flawless IVs!
    heldItemIds: [],
  };

  beforeEach(async function () {
    // 1. Grab ethers exactly like we did in deploy.ts!
    const networkEnv = await network.create();
    ethers = networkEnv.ethers;

    INITIAL_RELIC = ethers.parseEther("100"); // 100 $RELIC signup bonus
    MINT_FEE = ethers.parseEther("500"); // Matches the MINT_FEE in GameSettler

    // 2. Get our test accounts
    [owner, player] = await ethers.getSigners();

    // 3. Deploy Contracts
    const RelicCoin = await ethers.getContractFactory("RelicCoin");
    relicCoin = await RelicCoin.deploy();
    await relicCoin.waitForDeployment();

    const CreatureNFT = await ethers.getContractFactory("CreatureNFT");
    creatureNFT = await CreatureNFT.deploy();
    await creatureNFT.waitForDeployment();

    const GameSettler = await ethers.getContractFactory("GameSettler");
    gameSettler = await GameSettler.deploy(
      await relicCoin.getAddress(),
      await creatureNFT.getAddress()
    );
    await gameSettler.waitForDeployment();

    // 4. Configure Permissions
    const settlerAddress = await gameSettler.getAddress();
    await relicCoin.setMinter(settlerAddress, true);
    await relicCoin.setMinter(owner.address, true); // Allow owner to give signup bonuses
    
    // Bypass TypeScript for the Ownable functions just like in deploy.ts
    await (creatureNFT as any).transferOwnership(settlerAddress);

    // 5. Simulate User Sign-up (Give 100 $RELIC)
    await relicCoin.mint(player.address, INITIAL_RELIC);
  });

  describe("Deployment & Setup", function () {
    it("Should set the right initial balances and permissions", async function () {
      expect(await relicCoin.balanceOf(player.address)).to.equal(INITIAL_RELIC);
      expect(await creatureNFT.owner()).to.equal(await gameSettler.getAddress());
    });
  });

  describe("Settling Runs: Net Profit Scenarios", function () {
    it("Should mint extra $RELIC if the player earned more than they spent", async function () {
      const baseEarned = ethers.parseEther("1000");
      const isFlawless = false;
      const spentOnItems = ethers.parseEther("100");
      
      const creaturesToMint = [dummyCreature];

      await gameSettler.settleRun(
        player.address,
        baseEarned,
        isFlawless,
        spentOnItems,
        creaturesToMint
      );

      expect(await relicCoin.balanceOf(player.address)).to.equal(ethers.parseEther("500"));
      expect(await creatureNFT.balanceOf(player.address)).to.equal(1);
    });

    it("Should apply the 1.5x Flawless multiplier correctly", async function () {
      const baseEarned = ethers.parseEther("1000"); // Will become 1500
      const isFlawless = true;
      const spentOnItems = 0;
      const creaturesToMint: any[] = []; 

      await gameSettler.settleRun(
        player.address,
        baseEarned,
        isFlawless,
        spentOnItems,
        creaturesToMint
      );

      expect(await relicCoin.balanceOf(player.address)).to.equal(ethers.parseEther("1600"));
    });
  });

  describe("Settling Runs: Deduction Scenarios (Spending Wallet Balance)", function () {
    it("Should deduct $RELIC if the player spent more than they earned", async function () {
      await relicCoin.mint(player.address, ethers.parseEther("2000"));

      // The crucial step: The player MUST approve the GameSettler to spend their tokens!
      await relicCoin.connect(player).approve(await gameSettler.getAddress(), ethers.MaxUint256);

      const baseEarned = ethers.parseEther("100");
      const isFlawless = false;
      const spentOnItems = ethers.parseEther("50");
      
      const creaturesToMint = [dummyCreature, dummyCreature];

      await gameSettler.settleRun(
        player.address,
        baseEarned,
        isFlawless,
        spentOnItems,
        creaturesToMint
      );

      expect(await relicCoin.balanceOf(player.address)).to.equal(ethers.parseEther("1150"));
      expect(await creatureNFT.balanceOf(player.address)).to.equal(2);
    });

    it("Should REVERT if the player owes money but hasn't approved the contract", async function () {
      await relicCoin.mint(player.address, ethers.parseEther("2000"));
      
      const baseEarned = 0;
      const isFlawless = false;
      const spentOnItems = 0;
      const creaturesToMint = [dummyCreature]; 

      await expect(
        gameSettler.settleRun(player.address, baseEarned, isFlawless, spentOnItems, creaturesToMint)
      ).to.be.revertedWithCustomError(relicCoin, "ERC20InsufficientAllowance");
    });
  });

  describe("Security and Edge Cases", function () {
    it("Should ONLY allow the owner to call settleRun", async function () {
       await expect(
         gameSettler.connect(player).settleRun(player.address, ethers.parseEther("9999"), false, 0, [])
       ).to.be.revertedWithCustomError(gameSettler, "OwnableUnauthorizedAccount");
    });

    it("Should enforce the MAX_STORAGE limit of 30 creatures", async function () {
      const baseEarned = ethers.parseEther("50000"); 
      
      const tooManyCreatures = Array(31).fill(dummyCreature);

      await expect(
        gameSettler.settleRun(player.address, baseEarned, false, 0, tooManyCreatures)
      ).to.be.revertedWith("Box storage full!");
    });
  });
});