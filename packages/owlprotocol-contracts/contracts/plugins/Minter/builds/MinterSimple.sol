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
contract MinterSimple is BaseRelayRecipient, MinterCore, OwnableUpgradeable, UUPSUpgradeable {
    // Specification + ERC165
    string public constant version = 'v0.1';
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://MinterSimple/', version)));

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
        __MinterSimple_init(_admin, _mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr, _forwarder);
    }

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

    function __MinterSimple_init(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr,
        address _forwarder
    ) internal onlyInitializing {
        __MinterCore_init(_mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr);
        __MinterSimple_init_unchained(_admin, _forwarder);
    }

    function __MinterSimple_init_unchained(address _admin, address _forwarder) internal onlyInitializing {
        _transferOwnership(_admin);
        _setTrustedForwarder(_forwarder);
    }

    /**
     * @dev
     * @param tokenId minted token id
     */
    function mint(address buyer, uint256 tokenId) public {
        // Mint Operation
        MinterCore._mintForFee(buyer, tokenId);
    }

    /**
     * @dev
     * @param tokenId minted token id
     */
    function safeMint(address buyer, uint256 tokenId) public {
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
