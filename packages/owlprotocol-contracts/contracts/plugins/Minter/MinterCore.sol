//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/utils/introspection/ERC165.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

// import './modules/MintGuard/IMintGuard.sol';
import '../../assets/ERC721/ERC721Owl.sol';
import '../../utils/ERC1820/ERC1820ImplementerAuthorizeAll.sol';
import '../../OwlBase.sol';

/**
 * @dev Decentralized NFT Minter contract
 *
 */
abstract contract MinterCore is OwlBase {
    address public mintFeeToken;
    address public mintFeeAddress;
    uint256 public mintFeeAmount;
    address public nftContractAddr;

    function __MinterCore_init(
        address _admin,
        address _mintFeeToken,
        address _mintFeeAddress,
        uint256 _mintFeeAmount,
        address _nftContractAddr,
        address _forwarder
    ) internal onlyInitializing {
        __OwlBase_init(_admin, _forwarder);
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
        if (mintFeeAmount != 0)
            SafeERC20Upgradeable.safeTransferFrom(
                IERC20Upgradeable(mintFeeToken),
                buyer,
                mintFeeAddress,
                mintFeeAmount
            );

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
        if (mintFeeAmount != 0)
            SafeERC20Upgradeable.safeTransferFrom(
                IERC20Upgradeable(mintFeeToken),
                buyer,
                mintFeeAddress,
                mintFeeAmount
            );

        // Call minting operation
        ERC721Owl(nftContractAddr).safeMint(buyer, tokenId);
    }

    uint256[46] private __gap;
}
