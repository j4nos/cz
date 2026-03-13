// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title AssetToken721
/// @notice Minimal ERC-721 for asset representation; minting is restricted to the contract owner.
contract AssetToken721 is ERC721, Ownable {
    uint256 private _nextTokenId = 1;

    constructor(string memory name_, string memory symbol_, address owner_)
        ERC721(name_, symbol_)
        Ownable(owner_)
    {}

    /// @notice Mint a new token to `to`. Only callable by owner.
    function mint(address to) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId;
        _nextTokenId = tokenId + 1;
        _safeMint(to, tokenId);
        return tokenId;
    }
}
