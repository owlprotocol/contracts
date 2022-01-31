//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";

import "./NFTBreederLibrary.sol";

/**
 * @dev Decentralized NFT Breeder contract
 *
 */
contract NFTBreeder {

    // Data Storage
    using Counters for Counters.Counter;
    Counters.Counter private speciesIds;

    mapping(uint256 => NFTBreeder.Species) public species;

    // function createSpecies(
    //     bytes32 name,
    //     address contractAddress,
    //     NFTBreederLibrary.SpeciesFeature[] features)
    // public {}

    // function registerSpecimen(
    //     uint256 speciesId,
    //     uint256 tokenId,
    //     NFTBreederLibrary.SpecimenFeature[]
    // ) public {

    // }

    // function breedSpecies(
    //     uint256 speciesId,
    //     uint256 tokenId1,
    //     uint256 tokenId2
    // ) public {

    // }

}
