//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./MinterLib.sol";
import "../ERC721/IMintableERC721.sol";
import "../Utils/SourceRandom.sol";

/**
 * @dev Decentralized NFT Minter contract
 *
 */
contract Minter {

    // Data Storage
    using Counters for Counters.Counter;
    Counters.Counter private speciesIds;

    mapping (uint256 => MinterLib.Species) internal species;

    // Modifiers
    modifier speciesOwner(uint256 speciesId) {
        // also tests for existence with below require
        require(msg.sender == species[speciesId].owner, "You are not the owner!");
        _;
    }

    // Events
    event CreateSpecies(
        uint256 speciesId,
        address contractAddr,
        address indexed owner,
        address mintFeeToken,
        address mintFeeAddress,
        uint256 mintFeeAmount
    );

    event SpecimenCreated(
        uint256 indexed speciesId,
        uint256 tokenId,
        uint256 dna
    );

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
    ) public {
        // Species Counter
        speciesIds.increment();

        // Save our pointer
        MinterLib.Species storage s = species[speciesIds.current()];
        s.contractAddr = contractAddress;
        s.owner = msg.sender;
        s.mintFeeToken = mintFeeToken;
        s.mintFeeAddress = mintFeeAddress;
        s.mintFeeAmount = mintFeeAmount;

        emit CreateSpecies(
            speciesIds.current(),
            contractAddress,
            msg.sender,
            mintFeeToken,
            mintFeeAddress,
            mintFeeAmount
        );
    }

    /**
     * @dev Returns features created for a species
     * @param speciesId species identifier
     */
    function getSpecies(
        uint256 speciesId
    ) public view returns (
        address contractAddr,
        address owner,
        address mintFeeToken,
        uint256 mintFeeAmount,
        address mintFeeAddress
    ) {
        MinterLib.Species storage s = species[speciesId];
        return (
            s.contractAddr,
            s.owner,
            s.mintFeeToken,
            s.mintFeeAmount,
            s.mintFeeAddress
        );
    }

    /**
     * @dev Register an existing NFT and generate DNA for it.
     * Requires speciesOwner permissions! Used for developers to test/
     * migrate existing NFTs.
     * @param speciesId species to register NFT to
     * @param tokenId ID of associated NFT
     */
    function registerSpecimen(
        uint256 speciesId,
        uint256 tokenId
    ) public speciesOwner(speciesId) {
        // Set our species DNA
        uint256 randomDNA = SourceRandom.getRandomDebug();
        _createSpecimen(speciesId, tokenId, randomDNA);
    }

    /**
     * @dev Internal function used to check / create / emit on Specimen creation.
     * @param speciesId species identifier
     * @param tokenId token identifier
     * @param dna dna stored for specimen
     */
    function _createSpecimen(
        uint256 speciesId,
        uint256 tokenId,
        uint256 dna
    ) internal {
        require(species[speciesId].specimenDNA[tokenId] == 0, "Specimen already exists!");

        // Store DNA / emit event
        species[speciesId].specimenDNA[tokenId] = dna;
        emit SpecimenCreated(
            speciesId,
            tokenId,
            dna
        );

    }

    /**
     * @dev Returns DNA generated for a species
     * @param speciesId species identifier
     * @param tokenId NFT identifier
     */
    function tokenDNA(
        uint256 speciesId,
        uint256 tokenId
    ) public view returns (
        uint256 dna
    ) { return species[speciesId].specimenDNA[tokenId]; }
}
