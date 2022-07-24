//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

import '@opengsn/contracts/src/BaseRelayRecipient.sol';
import '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';

import '../MinterCore.sol';

/**
 * @dev Decentralized NFT Minter contract
 *
 * Simple Minter contract to expose `mint` functionality behind an ERC20 payment.
 *
 * As all Minter contracts interact with existing NFTs, MinterCore expects two
 * standard functions exposed by the NFT:
 * - `mint(address to, uint256 tokenId)`
 * - `safeMint(address to, uint256 tokenId)`
 *
 * Additionally, Minter contracts must have required permissions for minting. In
 * the case that you're using ERC721Owl, you'll do that with
 * {ERC721Owl#grantMinter}.
 */
contract MinterSimple is MinterCore {
    // Specification + ERC165
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://MinterSimple/', _version)));

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice This function is usually called through ERC1167Factory cloning and not directly.
     * @dev MinterAutoId initialization parameters.
     * @param _admin user to grant admin privileges
     * @param _mintFeeToken ERC20 token address to use for minting (ZeroAddress if none)
     * @param _mintFeeAddress address to transfer minting payments to
     * @param _mintFeeAmount Number of tokens to charge users (0 if none)
     * @param _nftContractAddr NFT address to mint
     * @param _forwarder OpenGSN forwarder address to use
     */
    function initialize(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr,
        address _forwarder
    ) external initializer {
        __MinterSimple_init(_admin, _mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr, _forwarder);
    }

    /**
     * @notice This function is usually called through ERC1167Factory cloning and not directly.
     * @dev MinterAutoId initialization parameters.
     * @param _admin user to grant admin privileges
     * @param _mintFeeToken ERC20 token address to use for minting (ZeroAddress if none)
     * @param _mintFeeAddress address to transfer minting payments to
     * @param _mintFeeAmount Number of tokens to charge users (0 if none)
     * @param _nftContractAddr NFT address to mint
     * @param _forwarder OpenGSN forwarder address to use
     */
    function proxyInitialize(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr,
        address _forwarder
    ) external onlyInitializing {
        __MinterSimple_init(_admin, _mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr, _forwarder);
    }

    /**
     * @notice This function is usually called through ERC1167Factory cloning and not directly.
     * @dev MinterAutoId initialization parameters.
     * @param _admin user to grant admin privileges
     * @param _mintFeeToken ERC20 token address to use for minting (ZeroAddress if none)
     * @param _mintFeeAddress address to transfer minting payments to
     * @param _mintFeeAmount Number of tokens to charge users (0 if none)
     * @param _nftContractAddr NFT address to mint
     * @param _forwarder OpenGSN forwarder address to use
     */
    function __MinterSimple_init(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr,
        address _forwarder
    ) internal onlyInitializing {
        __MinterCore_init(_admin, _mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr, _forwarder);
        __MinterSimple_init_unchained();
    }

    /**
     * @dev For future implementations.
     */
    function __MinterSimple_init_unchained() private onlyInitializing {}

    /**
     * @dev Allow minting for `_mintFeeAmount`
     * @param buyer address who pays and receives mint
     * @param tokenId mint token id
     */
    function mint(address buyer, uint256 tokenId) public {
        // Mint Operation
        MinterCore._mintForFee(buyer, tokenId);
    }

    /**
     * @dev Allow minting for `_mintFeeAmount`
     * @param buyer address who pays and receives mint
     * @param tokenId mint token id
     */
    function safeMint(address buyer, uint256 tokenId) public {
        // Mint Operation
        MinterCore._safeMintForFee(buyer, tokenId);
    }

    /**
     * @dev ERC165 Support
     * @param interfaceId hash of the interface testing for
     * @return bool whether interface is supported
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == ERC165TAG || super.supportsInterface(interfaceId);
    }
}

interface IMinterSimple is IERC165Upgradeable {
    /**
     * @dev
     * @param tokenId minted token id
     */
    function mint(uint256 tokenId) external;

    /**
     * @dev
     * @param tokenId minted token id
     */
    function safeMint(uint256 tokenId) external;
}
