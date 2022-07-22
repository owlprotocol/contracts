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

    // Constructor
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

    function __MinterAutoId_init_unchained() internal onlyInitializing {}

    /**
     * @dev Create a new type of species and define attributes.
     * @return nextTokenId
     */
    function mint(address buyer) public virtual returns (uint256) {
        MinterCore._mintForFee(buyer, nextTokenId++);
        return nextTokenId;
    }

    /**
     * @dev Create a new type of species and define attributes.
     * @return nextTokenId
     */
    function safeMint(address buyer) public virtual returns (uint256) {
        MinterCore._safeMintForFee(buyer, nextTokenId++);
        return nextTokenId;
    }

    /**
     * @dev Used to set the starting nextTokenId value.
     * Used to save situtations where someone mints directly
     * and we get out of sync.
     * @param nextTokenId_ next token id to be minted
     */
    function setNextTokenId(uint256 nextTokenId_) public onlyRole(DEFAULT_ADMIN_ROLE) {
        nextTokenId = nextTokenId_;
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
