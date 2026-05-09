// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RelicCoin is ERC20, Ownable {
    // This allows us to authorize your "Game Engine" contract to mint rewards
    mapping(address => bool) public authorizedMinters;

    constructor() ERC20("Relic Coin", "RELIC") Ownable(msg.sender) {}

    modifier onlyMinter() {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _;
    }

    function setMinter(address _minter, bool _status) external onlyOwner {
        authorizedMinters[_minter] = _status;
    }

    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
    }
}