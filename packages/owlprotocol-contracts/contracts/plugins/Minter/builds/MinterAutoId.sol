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
 * Auto-incrementing NFT minter contracts. Every time `mint` or `safeMint` is
 * called, the NFT id is automatically generated and minted on the fly. Great
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
 * `ERC721Owl.grantMinter(MinterContract)`.
 */
contract MinterAutoId is MinterCore {
    // Specification + ERC165
    string public constant version = 'v0.1';
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://MinterAutoId/', version)));

    // Track our next tokenId for each species
    uint256 public nextTokenId;

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
        __MinterAutoId_init(_admin, _mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr, _forwarder);
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
        __MinterAutoId_init(_admin, _mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr, _forwarder);
    }

    /**
     * @notice This function is never called directly.
     * @dev MinterAutoId initialization parameters.
     * @param _admin user to grant admin privileges
     * @param _mintFeeToken ERC20 token address to use for minting (ZeroAddress if none)
     * @param _mintFeeAddress address to transfer minting payments to
     * @param _mintFeeAmount Number of tokens to charge users (0 if none)
     * @param _nftContractAddr NFT address to mint
     * @param _forwarder OpenGSN forwarder address to use
     */
    function __MinterAutoId_init(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr,
        address _forwarder
    ) internal onlyInitializing {
        __MinterCore_init(_admin, _mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr, _forwarder);
        __MinterAutoId_init_unchained();
    }

    /**
     * @dev For future implementations.
     */
    function __MinterAutoId_init_unchained() private onlyInitializing {}

    /**
     * @dev Mint the next NFT at `nextTokenId`.
     * @param buyer user to pay for and send the NFT to
     * @return nextTokenId
     */
    function mint(address buyer) public virtual returns (uint256) {
        MinterCore._mintForFee(buyer, nextTokenId++);
        return nextTokenId;
    }

    /**
     * @dev Mint the next NFT at `nextTokenId`.
     * @param buyer user to pay for and send the NFT to
     * @return nextTokenId
     */
    function safeMint(address buyer) public virtual returns (uint256) {
        MinterCore._safeMintForFee(buyer, nextTokenId++);
        return nextTokenId;
    }

    /**
     * @dev Used to set the starting nextTokenId value. Used to save situtations
     * where someone mints directly and we get out of sync.
     * @param nextTokenId_ next token id to be minted
     */
    function setNextTokenId(uint256 nextTokenId_) public onlyRole(DEFAULT_ADMIN_ROLE) {
        nextTokenId = nextTokenId_;
    }
}

/**
 * @dev Decentralized NFT Minter contract
 *
 */
interface IMinterAutoId is IERC165Upgradeable {
    /**
     * @dev Create a new type of species and define attributes.
     */
    function mint() external returns (uint256 nextTokenId);

    /**
     * @dev Create a new type of species and define attributes.
     */
    function safeMint() external returns (uint256 nextTokenId);

    /**
     * @dev Used to set the starting nextTokenId value.
     * Used to save situtations where someone mints directly
     */
    function setNextTokenId(uint256 nextTokenId_) external;
}
