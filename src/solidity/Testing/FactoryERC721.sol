//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @dev **INTERNAL TOOL**
 * Used to factory ERC721 NFTs for unit testing
 */
contract FactoryERC721 is ERC721 {

    // ID Tracking
    uint256 lastTokenId = 0;

    /**
     * @dev Creates ERC721 token
     * @param nftName name used to identify nft
     * @param nftSymbol ticker used to identify nft
     */
    constructor(string memory nftName, string memory nftSymbol) ERC721(nftName, nftSymbol) {}

    /**
     * @dev Creates and gives a token to whoever calls the method
     * @param count number of tokens to generate and give
     */
    function mintTokens(uint256 count) public {

        // Loop and assign tokens
        for (uint i = 0; i < count; i++) {
            _mint(msg.sender, ++lastTokenId);
        }

    }

    /**
     * @dev Mints a token and assigns it to `to`.
     * doesn't require permissions.
     * @param to add
     * @param tokenId token identifier
     */
    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}
