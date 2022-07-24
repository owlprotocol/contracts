//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/cryptography/MerkleProof.sol';
import './MinterAutoId.sol';

/**
 * @dev Decentralized NFT Minter contract
 *
 * Simple Minter contract to expose `mint` functionality behind an optional
 * ERC20 payment and a MerkleTree allowlist.
 *
 * TODO - mint IPFS-MERKLE library
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
contract MinterSimpleMerkle is MinterAutoId {
    // Specification + ERC165
    bytes4 private constant ERC165TAG =
        bytes4(keccak256(abi.encodePacked('OWLProtocol://MinterSimpleMerkle/', _version)));

    // Merkle Root
    bytes32 public merkleRoot;
    string public uri;

    event SetMerkleRoot(bytes32 merkleRoot);

    // No constructor as inheriting from MinterAutoId
    // constructor() {
    //     _disableInitializers();
    // }

    /**
     * @notice This function is usually called through ERC1167Factory cloning and not directly.
     * @dev MinterAutoId initialization parameters.
     * @param _admin user to grant admin privileges
     * @param _mintFeeToken ERC20 token address to use for minting (ZeroAddress if none)
     * @param _mintFeeAddress address to transfer minting payments to
     * @param _mintFeeAmount Number of tokens to charge users (0 if none)
     * @param _nftContractAddr NFT address to mint
     * @param _merkleRoot Merkle root of the allowlist
     * @param _uri identifier for generating merkle proofs
     * @param _forwarder OpenGSN forwarder address to use
     */
    function initialize(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr,
        bytes32 _merkleRoot,
        string calldata _uri,
        address _forwarder
    ) external initializer {
        __MinterSimpleMerkle_init(
            _admin,
            _mintFeeToken,
            _mintFeeAddress,
            _mintFeeAmount,
            _nftContractAddr,
            _merkleRoot,
            _uri,
            _forwarder
        );
    }

    /**
     * @notice This function is usually called through ERC1167Factory cloning and not directly.
     * @dev MinterAutoId initialization parameters.
     * @param _admin user to grant admin privileges
     * @param _mintFeeToken ERC20 token address to use for minting (ZeroAddress if none)
     * @param _mintFeeAddress address to transfer minting payments to
     * @param _mintFeeAmount Number of tokens to charge users (0 if none)
     * @param _nftContractAddr NFT address to mint
     * @param _merkleRoot Merkle root of the allowlist
     * @param _uri Resource identifier for generating merkle proofs
     * @param _forwarder OpenGSN forwarder address to use
     */
    function proxyInitialize(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr,
        bytes32 _merkleRoot,
        string calldata _uri,
        address _forwarder
    ) external onlyInitializing {
        __MinterSimpleMerkle_init(
            _admin,
            _mintFeeToken,
            _mintFeeAddress,
            _mintFeeAmount,
            _nftContractAddr,
            _merkleRoot,
            _uri,
            _forwarder
        );
    }

    /**
     * @notice This function is usually called through ERC1167Factory cloning and not directly.
     * @dev MinterAutoId initialization parameters.
     * @param _admin user to grant admin privileges
     * @param _mintFeeToken ERC20 token address to use for minting (ZeroAddress if none)
     * @param _mintFeeAddress address to transfer minting payments to
     * @param _mintFeeAmount Number of tokens to charge users (0 if none)
     * @param _nftContractAddr NFT address to mint
     * @param _merkleRoot Merkle root of the allowlist
     * @param _uri Resource identifier for generating merkle proofs
     * @param _forwarder OpenGSN forwarder address to use
     */
    function __MinterSimpleMerkle_init(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr,
        bytes32 _merkleRoot,
        string calldata _uri,
        address _forwarder
    ) internal onlyInitializing {
        __MinterAutoId_init(_admin, _mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr, _forwarder);
        __MinterSimpleMerkle_init_unchained(_merkleRoot, _uri);
    }

    /**
     * @notice This function is usually called through ERC1167Factory cloning and not directly.
     * @dev MinterAutoId initialization parameters.
     * @param _merkleRoot Merkle root of the allowlist
     * @param _uri Resource identifier for generating merkle proofs
     */
    function __MinterSimpleMerkle_init_unchained(bytes32 _merkleRoot, string calldata _uri) internal onlyInitializing {
        merkleRoot = _merkleRoot;
        uri = _uri;
        emit SetMerkleRoot(merkleRoot);
    }

    /**
     * @notice mint(address,bytes[]) must be called with proof
     * @dev This function only reverts.
     */
    function mint(address buyer) public pure override returns (uint256) {
        (buyer);
        revert('Must include merkleProof');
    }

    /**
     * @notice safeMint(address,bytes[]) must be called with proof
     * @dev This function only reverts.
     */
    function safeMint(address buyer) public pure override returns (uint256) {
        (buyer);
        revert('Must include merkleProof');
    }

    /**
     * @dev Mint a new auto-incremented id for a user in the Merkle tree.
     * @param buyer address who pays the optional ERC20 fee
     * @param merkleProof merkleProof generated for on-chain verification
     */
    function mint(address buyer, bytes32[] calldata merkleProof) public {
        require(_verifyMerkle(merkleProof), 'Not member of merkleTree!');
        MinterAutoId.mint(buyer);
    }

    /**
     * @dev Mint a new auto-incremented id for a user in the Merkle tree.
     * @param buyer address who pays the optional ERC20 fee
     * @param merkleProof merkleProof generated for on-chain verification
     */
    function safeMint(address buyer, bytes32[] calldata merkleProof) public {
        require(_verifyMerkle(merkleProof), 'Not member of merkleTree!');
        MinterAutoId.safeMint(buyer);
    }

    /**
     * @dev Allows updating Merkle root and identifier for clients
     * @param _merkleRoot new merkle root
     * @param _uri new URI for clients to refer to
     */
    function updateMerkleRoot(bytes32 _merkleRoot, string calldata _uri) public onlyRole(DEFAULT_ADMIN_ROLE) {
        merkleRoot = _merkleRoot;
        uri = _uri;
    }

    /**
     * @dev Internal function to verify merkle proofs
     */
    function _verifyMerkle(bytes32[] calldata merkleProof) internal view returns (bool) {
        bytes32 leaf = keccak256(abi.encode(_msgSender()));
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
