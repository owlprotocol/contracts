//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

import '@opengsn/contracts/src/BaseRelayRecipient.sol';
import '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';

import '../MinterCore.sol';
import '../../../utils/SourceRandom.sol';

/**
 * @dev Decentralized NFT Minter contract
 *
 * Id-randomizing NFT minter contracts. Every time `mint` or `safeMint` is
 * called, the NFT id is randomly generated and minted on the fly. Great
 * for end-users to interact with without requiring clients to monitor the
 * blockchain.
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
contract MinterRandom is MinterCore {
    // Specification + ERC165
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://MinterRandom/', _version)));

    // Nonce
    uint256 private _numMinted;

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
        __MinterRandom_init(_admin, _mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr, _forwarder);
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
        __MinterRandom_init(_admin, _mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr, _forwarder);
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
    function __MinterRandom_init(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr,
        address _forwarder
    ) internal onlyInitializing {
        __MinterCore_init(_admin, _mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr, _forwarder);
        __MinterRandom_init_unchained();
    }

    /**
     * @dev To be implemented in the future.
     */
    function __MinterRandom_init_unchained() internal onlyInitializing {}

    /**
     * @dev Mint a new species with random id.
     * @param buyer address of the buyer
     */
    function mint(address buyer) public {
        // Generate tokenid
        uint256 random = SourceRandom.getRandomDebug();
        uint256 tokenId = SourceRandom.getSeededRandom(random, _numMinted++);

        // Mint Operation
        MinterCore._mintForFee(buyer, tokenId);
    }

    /**
     * @dev Mint a new species with random id.
     * @param buyer address of the buyer
     */
    function safeMint(address buyer) public {
        // Generate tokenId
        uint256 random = SourceRandom.getRandomDebug();
        uint256 tokenId = SourceRandom.getSeededRandom(random, _numMinted++);

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

interface IMinterRandom is IERC165Upgradeable {
    /**
     * @dev Create a new type of species and define attributes.
     */
    function mint(address buyer) external;

    /**
     * @dev Create a new type of species and define attributes.
     */
    function safeMint(address buyer) external;
}
