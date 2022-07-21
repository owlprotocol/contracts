//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '../OwlBase.sol';

/**
 * @dev **INTERNAL TOOL**
 * Used to factory ERC721 NFTs for unit testing
 */
contract FactoryERC721 is OwlBase, ERC721 {
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
        for (uint256 i = 0; i < count; i++) {
            _mint(_msgSender(), lastTokenId++);
        }
    }

    /**
     * @dev Mints a token and assigns it to `to`.
     * doesn't require permissions.
     * @param to add
     * @param tokenId token
     */
    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }

    /**
     * @dev Mints a token and assigns it to `to`.
     * doesn't require permissions.
     * @param to add
     * @param tokenId token
     */
    function safeMint(address to, uint256 tokenId) public {
        _safeMint(to, tokenId);
    }

    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    // Used for testing ONLY
    function setTrustedForwarder(address forwarder) public {
        grantRouter(forwarder);
    }

    /**
     * @notice the following 3 functions are all required for OpenGSN integration
     */
    function _msgSender() internal view override(OwlBase, Context) returns (address sender) {
        sender = OwlBase._msgSender();
    }

    function _msgData() internal view override(OwlBase, Context) returns (bytes calldata) {
        return OwlBase._msgData();
    }

    function versionRecipient() external pure override returns (string memory) {
        return '2.2.6';
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControlUpgradeable, ERC721)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
