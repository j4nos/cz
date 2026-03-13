// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title AssetToken20
/// @notice Minimal ERC-20 for asset fractional ownership; minting is restricted to the contract owner.
contract AssetToken20 is ERC20, Ownable {
    constructor(string memory name_, string memory symbol_, address owner_) ERC20(name_, symbol_) Ownable(owner_) {}

    /// @notice Mint `amount` tokens to `to`. Only callable by owner (platform or asset controller).
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
