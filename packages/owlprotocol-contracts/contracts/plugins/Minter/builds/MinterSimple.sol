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
contract MinterSimple is MinterCore, OwnableUpgradeable, UUPSUpgradeable {
    // Specification + ERC165
    string private constant VERSION = 'v0.1';
    bytes4 private constant ERC165TAG = bytes4(keccak256(abi.encodePacked('OWLProtocol://MinterSimple/', VERSION)));

    // Events

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
        __MinterSimple_init(_admin, _mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr);
    }

    function proxyInitialize(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr
    ) external onlyInitializing {
        __MinterSimple_init(_admin, _mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr);
    }

    function __MinterSimple_init(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr
    ) internal onlyInitializing {
        __MinterSimple_init_unchained(_admin);
        __MinterCore_init(_mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr);

        __Ownable_init();
    }

    function __MinterSimple_init_unchained(address _admin) internal onlyInitializing {
        // Register ERC1820 Private Interface
        bytes32 interfaceName = keccak256('OWLProtocol://MinterSimple');
        ERC1820ImplementerAuthorizeAll._registerInterfaceForAddress(interfaceName);
        // Register ERC165 Interface
        ERC165Storage._registerInterface(type(IMinterSimple).interfaceId);

        _transferOwnership(_admin);
    }

    /**
     * @dev
     * @param tokenId minted token id
     */
    function mint(uint256 tokenId) public {
        // Mint Operation
        MinterCore._mintForFee(msg.sender, tokenId);
    }

    /**
     * @dev
     * @param tokenId minted token id
     */
    function safeMint(uint256 tokenId) public {
        // Mint Operation
        MinterCore._safeMintForFee(msg.sender, tokenId);
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
