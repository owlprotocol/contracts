//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';
import './MinterAutoId.sol';

/**
 * @dev Decentralized NFT Minter contract
 *
 */
contract MinterSimpleMerkle is MinterAutoId {
    // Specification + ERC165
    bytes4 private constant ERC165TAG =
        bytes4(keccak256(abi.encodePacked('OWLProtocol://MinterSimpleMerkle/', version)));

    // Merkle Root
    bytes32 public merkleRoot;

    event SetMerkleRoot(bytes32 merkleRoot);

    // Constructor
    function initialize(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr,
        bytes32 _merkleRoot
    ) external initializer {
        __MinterSimpleMerkle_init(
            _admin,
            _mintFeeToken,
            _mintFeeAddress,
            _mintFeeAmount,
            _nftContractAddr,
            _merkleRoot
        );
    }

    function proxyInitialize(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr,
        bytes32 _merkleRoot
    ) external onlyInitializing {
        __MinterSimpleMerkle_init(
            _admin,
            _mintFeeToken,
            _mintFeeAddress,
            _mintFeeAmount,
            _nftContractAddr,
            _merkleRoot
        );
    }

    function __MinterSimpleMerkle_init(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr,
        bytes32 _merkleRoot
    ) internal onlyInitializing {
        __MinterSimpleMerkle_init_unchained(_merkleRoot);
        __MinterAutoId_init(_admin, _mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr);
    }

    function __MinterSimpleMerkle_init_unchained(bytes32 _merkleRoot) internal onlyInitializing {
        merkleRoot = _merkleRoot;
        emit SetMerkleRoot(merkleRoot);
    }

    // Disable MinterAutoId.mint()
    function mint(address buyer) public override returns (uint256) {
        revert('Must include merkleProof');
    }

    // Disable MinterAutoId.safeMint()
    function safeMint(address buyer) public override returns (uint256) {
        revert('Must include merkleProof');
    }

    /**
     * @dev Create a new type of species and define attributes.
     * @param tokenId minted token id
     */
    function mint(
        address buyer,
        uint256 tokenId,
        bytes32[] calldata merkleProof
    ) public {
        require(_verifyMerkle(merkleProof), 'Not member of merkleTree!');
        MinterAutoId.mint(buyer);
    }

    /**
     * @dev Create a new type of species and define attributes.
     * @param tokenId minted token id
     */
    function safeMint(
        address buyer,
        uint256 tokenId,
        bytes32[] calldata merkleProof
    ) public {
        require(_verifyMerkle(merkleProof), 'Not member of merkleTree!');
        MinterAutoId.mint(buyer);
    }

    function updateMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function _verifyMerkle(bytes32[] calldata merkleProof) internal view returns (bool) {
        bytes32 leaf = keccak256(abi.encode(msg.sender));
        return MerkleProof.verify(merkleProof, merkleRoot, leaf);
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
