//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/utils/introspection/ERC165Storage.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

// import './modules/MintGuard/IMintGuard.sol';
import '../../assets/ERC721/ERC721Owl.sol';
import '../../utils/ERC1820/ERC1820ImplementerAuthorizeAll.sol';

/**
 * @dev Decentralized NFT Minter contract
 *
 */
abstract contract MinterCore is Initializable, ERC165Storage, ERC1820ImplementerAuthorizeAll {
    address mintFeeToken;
    address mintFeeAddress;
    uint256 mintFeeAmount;
    address nftContractAddr;

    modifier mintAllowedMerkle(
        uint256 speciesId,
        bytes32 merkleRoot,
        bytes32[] calldata merkleProof
    ) {
        // Verify mint guard function (WITH merkle overload)
        // _verifyMintGuard(speciesId, merkleRoot, merkleProof);
        _;
    }

    // Constructor
    function initialize(
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr
    ) external virtual initializer {
        __MinterCore_init(_mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr);
    }

    function proxyInitialize(
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr
    ) external virtual onlyInitializing {
        __MinterCore_init(_mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr);
    }

    function __MinterCore_init(
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr
    ) internal onlyInitializing {
        // Register Private Name
        bytes32 interfaceName = keccak256('OWLProtocol://MinterCore');
        ERC1820ImplementerAuthorizeAll._registerInterfaceForAddress(interfaceName);
        // Register ERC165 Interface
        ERC165Storage._registerInterface(type(MinterCore).interfaceId);
        __MinterCore_init_unchained(_mintFeeToken, _mintFeeAddress, _mintFeeAmount, _nftContractAddr);
    }

    function __MinterCore_init_unchained(
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr
    ) internal onlyInitializing {
        mintFeeToken = _mintFeeToken;
        mintFeeAddress = _mintFeeAddress;
        mintFeeAmount = _mintFeeAmount;
        nftContractAddr = _nftContractAddr;
    }

    /**
     * @dev Base minting function (not safeMint). Called
     * by implementation contracts.
     * @param buyer who's paying the ERC20 fee / gets the ERC721 token
     * @param tokenId the token identifier to mint
     */
    function _mintForFee(address buyer, uint256 tokenId) internal {
        // Transfer ERC20
        SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(mintFeeToken), buyer, mintFeeAddress, mintFeeAmount);

        // Call minting operation
        ERC721Owl(nftContractAddr).mint(buyer, tokenId);
    }

    /**
     * @dev Base minting function (safeMint). Called
     * by implementation contracts.
     * @param buyer who's paying the ERC20 fee / gets the ERC721 token
     * @param tokenId the token identifier to mint
     */
    function _safeMintForFee(address buyer, uint256 tokenId) internal {
        // Transfer ERC20
        SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(mintFeeToken), buyer, mintFeeAddress, mintFeeAmount);

        // Call minting operation
        ERC721Owl(nftContractAddr).safeMint(buyer, tokenId);
    }

    // =================== Mint Guard =====================

    // function _verifyMintGuard(bytes32 merkleRoot, bytes32[] calldata merkleProof) private {
    //     // check mint guard
    //     address mintGuard = species[speciesId].mintGuard;
    //     if (mintGuard != address(0))
    //         // Verify mint guard (merkle proof overload func)
    //         require(
    //             IMintGuard(mintGuard).allowMint(speciesId, msg.sender, merkleRoot, merkleProof) == true,
    //             'Mint denied!'
    //         );
    // }
}
