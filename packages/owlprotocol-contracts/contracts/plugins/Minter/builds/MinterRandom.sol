//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/introspection/IERC165Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

import '../MinterCore.sol';
import '../../../utils/SourceRandom.sol';

/**
 * @dev Decentralized NFT Minter contract
 *
 */
contract MinterRandom is MinterCore, OwnableUpgradeable, UUPSUpgradeable {
    // Nonce
    uint256 private _numMinted;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {
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
        __MinterRandom_init(_admin, _mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr);
    }

    function proxyInitialize(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr
    ) external onlyInitializing {
        __MinterRandom_init(_admin, _mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr);
    }

    function __MinterRandom_init(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr
    ) internal onlyInitializing {
        __MinterRandom_init_unchained(_admin);
        __MinterCore_init(_mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr);

        __Ownable_init();
    }

    function __MinterRandom_init_unchained(address _admin) internal onlyInitializing {
        // Register ERC1820 Private Interface
        bytes32 interfaceName = keccak256('OWLProtocol://MinterRandom');
        ERC1820ImplementerAuthorizeAll._registerInterfaceForAddress(interfaceName);
        // Register ERC165 Interface
        ERC165Storage._registerInterface(type(IMinterRandom).interfaceId);

        _transferOwnership(_admin);
    }

    /**
     * @dev Create a new type of species and define attributes.
     */
    function mint(address buyer) public {
        // Generate tokenid
        uint256 random = SourceRandom.getRandomDebug();
        uint256 tokenId = SourceRandom.getSeededRandom(random, _numMinted++);

        // Mint Operation
        MinterCore._mintForFee(buyer, tokenId);
    }

    /**
     * @dev Create a new type of species and define attributes.
     */
    function safeMint(address buyer) public {
        // Generate tokenId
        uint256 random = SourceRandom.getRandomDebug();
        uint256 tokenId = SourceRandom.getSeededRandom(random, _numMinted++);

        // Mint Operation
        MinterCore._safeMintForFee(buyer, tokenId);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function getImplementation() external view returns (address) {
        return _getImplementation();
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
