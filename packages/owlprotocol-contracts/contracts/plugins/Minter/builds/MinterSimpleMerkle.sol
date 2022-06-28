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
contract MinterSimpleMerkle is MinterCore, OwnableUpgradeable, UUPSUpgradeable {
    // @custom:oz-upgrades-unsafe-allow constructor
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
    ) external initializer {}

    function proxyInitialize(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr
    ) external onlyInitializing {}

    function __MinterSimpleMerkle_init(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr
    ) internal onlyInitializing {
        __MinterSimpleMerkle_init_unchained(_admin);
        __MinterCore_init(_mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr);

        __Ownable_init();
    }

    function __MinterSimpleMerkle_init_unchained(address _admin) internal onlyInitializing {
        // Register ERC1820 Private Interface
        bytes32 interfaceName = keccak256('OWLProtocol://MinterSimpleMerkle');
        ERC1820ImplementerAuthorizeAll._registerInterfaceForAddress(interfaceName);
        // Register ERC165 Interface
        ERC165Storage._registerInterface(type(IMinterSimpleMerkle).interfaceId);

        _transferOwnership(_admin);
    }

    /**
     * @dev Create a new type of species and define attributes.
     * @param tokenId minted token id
     */
    function mint(
        uint256 tokenId,
        bytes32 merkleRoot,
        bytes32[] calldata merkleProof
    ) public {
        MinterCore._mintForFee(msg.sender, tokenId);
    }

    /**
     * @dev Create a new type of species and define attributes.
     * @param tokenId minted token id
     */
    function safeMint(
        uint256 tokenId,
        bytes32 merkleRoot,
        bytes32[] calldata merkleProof
    ) public {
        MinterCore._safeMintForFee(msg.sender, tokenId);
    }

    function hashKeccakUser() public view returns (bytes32) {
        return keccak256(abi.encode(msg.sender));
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function getImplementation() external view returns (address) {
        return _getImplementation();
    }
}

interface IMinterSimpleMerkle is IERC165Upgradeable {
    /**
     * @dev
     * @param tokenId minted token id
     */
    function mint(
        uint256 tokenId,
        bytes32 merkleRoot,
        bytes32[] calldata merkleProof
    ) external;

    /**
     * @dev
     * @param tokenId minted token id
     */
    function safeMint(
        uint256 tokenId,
        bytes32 merkleRoot,
        bytes32[] calldata merkleProof
    ) external;
}
