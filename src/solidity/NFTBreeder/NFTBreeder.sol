//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";

import "./NFTBreederLibrary.sol";
import "../Utils/SourceRandom.sol";

/**
 * @dev Decentralized NFT Breeder contract
 *
 */
contract NFTBreeder {

    // Data Storage
    using Counters for Counters.Counter;
    Counters.Counter private speciesIds;

    mapping(uint256 => NFTBreederLibrary.Species) public species;

    function createSpecies(
        bytes32 name,
        address contractAddress,
        NFTBreederLibrary.SpeciesFeature[] calldata specieFeatures
    ) public {

        // Species Counter
        speciesIds.increment();

        // Save our pointer
        NFTBreederLibrary.Species storage s = species[speciesIds.current()];
        s.name = name;
        s.contractAddr = contractAddress;
        s.owner = msg.sender;

        for (uint i = 0; i < specieFeatures.length; i++)
            s.speciesFeatures.push(specieFeatures[i]);

    }

    // TODO - specimen exists

    function registerSpecimen(
        uint256 speciesId,
        uint256 tokenId,
        NFTBreederLibrary.SpecimenFeature[] calldata specimenFeatures
    ) public {

        NFTBreederLibrary.Specimen storage s = species[speciesId].specimen[tokenId];

        s.createdBlock = block.number;
        // s.cooldownEndBlock =
        // s.parent1Id =
        // s.parent2Id =
        // s.isPregnantWith =
        s.generation = 0;

        for (uint i = 0; i < specimenFeatures.length; i++)
            s.features.push(specimenFeatures[i]);

    }

    function breedSpecies(
        uint256 speciesId,
        uint256 tokenId1,
        uint256 tokenId2
    ) public returns (uint256) {

        // Generate random seed
        uint256 random = SourceRandom.getRandomDebug();

        return random;
    }

}
