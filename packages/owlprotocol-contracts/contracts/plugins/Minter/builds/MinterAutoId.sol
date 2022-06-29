//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

import '../MinterCore.sol';

/**
 * @dev Decentralized NFT Minter contract
 *
 */
contract MinterAutoId is MinterCore, OwnableUpgradeable, UUPSUpgradeable {
    // Track our next tokenId for each species
    uint256 nextTokenId;

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
        address _nftContractAddr
    ) external initializer {
        __MinterAutoId_init(_admin, _mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr);
    }

    function proxyInitialize(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr
    ) external onlyInitializing {
        __MinterAutoId_init(_admin, _mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr);
    }

    function __MinterAutoId_init(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr
    ) internal onlyInitializing {
        __MinterAutoId_init_unchained(_admin);
        __MinterCore_init(_mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr);

        __Ownable_init();
    }

    function __MinterAutoId_init_unchained(address _admin) internal onlyInitializing {
        // Register ERC1820 Private Interface
        bytes32 interfaceName = keccak256('OWLProtocol://MinterAutoId');
        ERC1820ImplementerAuthorizeAll._registerInterfaceForAddress(interfaceName);
        // Register ERC165 Interface
        ERC165Storage._registerInterface(type(IMinterAutoId).interfaceId);

        _transferOwnership(_admin);
    }

    /**
     * @dev Create a new type of species and define attributes.
     * @return nextTokenId
     */
    function mint(address buyer) public returns (uint256) {
        MinterCore._mintForFee(buyer, nextTokenId++);
        return nextTokenId;
    }

    /**
     * @dev Create a new type of species and define attributes.
     * @return nextTokenId
     */
    function safeMint(address buyer) public returns (uint256) {
        MinterCore._safeMintForFee(buyer, nextTokenId++);
        return nextTokenId;
    }

    /**
     * @dev Used to set the starting nextTokenId value.
     * Used to save situtations where someone mints directly
     * and we get out of sync.
     * @param nextTokenId_ next token id to be minted
     */
    function setNextTokenId(uint256 nextTokenId_) public onlyOwner {
        nextTokenId = nextTokenId_;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function getImplementation() external view returns (address) {
        return _getImplementation();
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
