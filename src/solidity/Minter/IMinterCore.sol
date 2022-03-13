//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @dev Decentralized NFT Minter contract
 *
 */
interface IMinterCore is IERC165 {

    /**
     * @dev Create a new type of species and define attributes.
     * @param contractAddress address of associated NFT
     * @param mintFeeToken ERC20 token used for mint expenses
     * @param mintFeeAddress ERC20 address to send minting funds to
     * @param mintFeeAmount ERC20 token amount to charge when minting
     */
    function createSpecies(
        address contractAddress,
        address mintFeeToken,
        address mintFeeAddress,
        uint256 mintFeeAmount
    ) external;

    /**
     * @dev Returns features created for a species
     * @param speciesId species identifier
     */
    function getSpecies(
        uint256 speciesId
    ) external view returns (
        address contractAddr,
        address owner,
        address mintFeeToken,
        uint256 mintFeeAmount,
        address mintFeeAddress
    );
}
