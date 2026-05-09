// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CreatureNFT is ERC721Enumerable, Ownable {
    uint256 private _nextTokenId;
    uint256 public constant MAX_STORAGE = 30;

    struct Stats {
        uint16 speciesId;
        uint8 level;
        uint8[6] ivs; // HP, Atk, Def, SpA, SpD, Spe (0-31)
        uint16[] heldItemIds; // Stacking buffs
    }

    // Mapping from Token ID to its Pokemon Data
    mapping(uint256 => Stats) public creatureData;

    constructor() ERC721("Relic Monster", "REMON") Ownable(msg.sender) {}

    function mintCreature(
        address to, 
        uint16 _speciesId, 
        uint8 _level, 
        uint8[6] memory _ivs,
        uint16[] memory _items
    ) external onlyOwner {
        require(balanceOf(to) < MAX_STORAGE, "Box storage full!");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        creatureData[tokenId] = Stats({
            speciesId: _speciesId,
            level: _level,
            ivs: _ivs,
            heldItemIds: _items
        });
    }

    // Function for the frontend to easily fetch a monster's stats
    function getCreature(uint256 tokenId) external view returns (Stats memory) {
        return creatureData[tokenId];
    }

    /** * @dev Returns all creature IDs and their stats for a specific owner.
    * Since we use ERC721Enumerable, this is much more efficient!
    */
    function getOwnedCreatures(address owner) external view returns (uint256[] memory ids, Stats[] memory allStats) {
        uint256 balance = balanceOf(owner);
        ids = new uint256[](balance);
        allStats = new Stats[](balance);
        
        for (uint256 i = 0; i < balance; i++) {
            // tokenOfOwnerByIndex is a built-in Enumerable function
            uint256 tokenId = tokenOfOwnerByIndex(owner, i);
            ids[i] = tokenId;
            allStats[i] = creatureData[tokenId];
        }
    }
}