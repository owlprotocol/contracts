//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';

/**
 * @dev **INTERNAL TOOL**
 * Used to factory ERC721 NFTs for unit testing
 */
contract FactoryERC1155 is ERC1155 {
    // ID Tracking
    uint256 lastTokenId = 0;
    uint256 constant defaultTokenMint = 10;

    /**
     * @dev Creates ERC721 token
     * @param uri associate
     */
    constructor(string memory uri, uint256[] memory initialMint) ERC1155(uri) {
        if (initialMint.length == 0) {
            initialMint = new uint256[](defaultTokenMint);
            for (uint256 i = 0; i < defaultTokenMint; i++) initialMint[i] = 100;
        }
        mintTokens(initialMint);
    }

    /**
     * @dev Creates and gives a token to whoever calls the method
     * @param amounts array of token amounts to mint for each tokenID
     */
    function mintTokens(uint256[] memory amounts) public {
        // Loop and assign tokens
        for (uint256 i = 0; i < amounts.length; i++) {
            _mint(msg.sender, ++lastTokenId, amounts[i], new bytes(0));
        }
    }

    /**
     * @dev Mints a token and assigns it to `to`.
     * doesn't require permissions.
     * @param to add
     * @param tokenId token
     */
    function mint(
        address to,
        uint256 tokenId,
        uint256 amount
    ) public {
        _mint(to, tokenId, amount, new bytes(0));
    }

    /**
     * @notice Must have MINTER_ROLE
     * @dev Allows caller to mint NFTs (safeMint)
     * @param to address to
     * @param ids id values
     * @param amounts to mint
     * @param data for hooks
     */
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public {
        _mintBatch(to, ids, amounts, data);
    }
}
