// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Interfaces to talk to the contracts we already built
interface IRelicCoin {
    function mint(address to, uint256 amount) external;
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface ICreatureNFT {
    function mintCreature(
        address to, 
        uint16 _speciesId, 
        uint8 _level, 
        uint8[6] memory _ivs,
        uint16[] memory _items
    ) external;
}

contract GameSettler is Ownable, ReentrancyGuard {
    IRelicCoin public relicToken;
    ICreatureNFT public creatureNFT;

    // Set the cost to mint an NFT at the end of a run (e.g., 500 $RELIC)
    // 10**18 is used because ERC20 tokens have 18 decimal places by default
    uint256 public constant MINT_FEE = 500 * 10**18; 

    // Struct to cleanly pass the array of Pokemon the user wants to mint
    struct MintData {
        uint16 speciesId;
        uint8 level;
        uint8[6] ivs;
        uint16[] heldItemIds;
    }

    // Connect this contract to your Token and NFT contracts
    constructor(address _relicToken, address _creatureNFT) Ownable(msg.sender) {
        require(_relicToken != address(0) && _creatureNFT != address(0), "Invalid addresses");
        relicToken = IRelicCoin(_relicToken);
        creatureNFT = ICreatureNFT(_creatureNFT);
    }

    /**
     * @dev Settles a completed run. 
     * ONLY the owner (your secure backend server) can call this to prevent players from spoofing results.
     */
    function settleRun(
        address player,
        uint256 baseRelicEarned,
        bool isFlawless,
        uint256 relicSpentOnItems,
        MintData[] calldata creaturesToMint
    ) external onlyOwner nonReentrant {
        require(player != address(0), "Invalid player address");
        
        // 1. Calculate Total Earnings with Flawless Multiplier
        uint256 totalEarned = baseRelicEarned;
        if (isFlawless) {
            // 1.5x Multiplier applied on-chain
            totalEarned = (totalEarned * 15) / 10; 
        }

        // 2. Calculate Total Deductions (Items bought + NFT Minting fees)
        uint256 totalMintCost = creaturesToMint.length * MINT_FEE;
        uint256 totalDeduction = relicSpentOnItems + totalMintCost;

        // 3. Process the Economy (Net Accounting)
        if (totalEarned >= totalDeduction) {
            // Player earned more than they spent. Mint the profit.
            uint256 netProfit = totalEarned - totalDeduction;
            if (netProfit > 0) {
                relicToken.mint(player, netProfit);
            }
        } else {
            // Player spent MORE than they earned this run. 
            // They must pay the difference from their existing wallet balance.
            uint256 amountOwed = totalDeduction - totalEarned;
            
            // Note: The player MUST have called `approve()` on the RelicCoin contract for this to work!
            // We transfer the owed tokens back to the treasury (the owner) or a burn address.
            bool success = relicToken.transferFrom(player, owner(), amountOwed);
            require(success, "RELIC deduction failed: Check balance and allowance");
        }

        // 4. Mint the chosen Pokémon NFTs
        // The CreatureNFT contract handles the 30-slot exception directly. 
        // If they try to mint #31, the transaction reverts and their money is saved.
        for (uint i = 0; i < creaturesToMint.length; i++) {
            creatureNFT.mintCreature(
                player,
                creaturesToMint[i].speciesId,
                creaturesToMint[i].level,
                creaturesToMint[i].ivs,
                creaturesToMint[i].heldItemIds
            );
        }
    }
}