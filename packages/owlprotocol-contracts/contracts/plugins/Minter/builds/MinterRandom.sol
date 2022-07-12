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
 */
contract MinterRandom is BaseRelayRecipient, MinterCore, OwnableUpgradeable, UUPSUpgradeable {
    // Specification + ERC165
    string public constant version = 'v0.1';
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://MinterRandom/', version)));

    // Nonce
    uint256 private _numMinted;

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
        __MinterRandom_init(_admin, _mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr, _forwarder);
    }

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

    function __MinterRandom_init(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr,
        address _forwarder
    ) internal onlyInitializing {
        __MinterCore_init(_mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr);
        __MinterRandom_init_unchained(_admin, _forwarder);
    }

    function __MinterRandom_init_unchained(address _admin, address _forwarder) internal onlyInitializing {
        // Register ERC1820 Private Interface
        bytes32 interfaceName = keccak256('OWLProtocol://MinterRandom');
        ERC1820ImplementerAuthorizeAll._registerInterfaceForAddress(interfaceName);
        // Register ERC165 Interface
        ERC165Storage._registerInterface(type(IMinterRandom).interfaceId);

        //set trusted forwarder for open gsn
        _setTrustedForwarder(_forwarder);

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

    /**
     * @notice the following 3 functions are all required for OpenGSN integration
     */
    function _msgSender() internal view override(BaseRelayRecipient, ContextUpgradeable) returns (address sender) {
        sender = BaseRelayRecipient._msgSender();
    }

    function _msgData() internal view override(BaseRelayRecipient, ContextUpgradeable) returns (bytes calldata) {
        return BaseRelayRecipient._msgData();
    }

    function versionRecipient() external pure override returns (string memory) {
        return '2.2.6';
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function getImplementation() external view returns (address) {
        return _getImplementation();
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
