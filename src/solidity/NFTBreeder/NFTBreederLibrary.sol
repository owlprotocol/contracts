//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev NFT Breeder common data types
 *
 */
library NFTBreederLibrary {

    enum FeatureType {
        recessive,
        dominant
    }

    struct Species {
        bytes32 name;
        address contractAddr;
        address owner;
        SpeciesFeature[] speciesFeatures;
        mapping(uint256 => Specimen) specimen;
    }

    struct SpeciesFeature {
        bytes32 name;
        uint8 mutationPercent;
        uint256 minValue;
        uint256 maxValue;
    }

    struct Specimen {
        uint256 createdBlock;
        uint256 cooldownEndBlock;
        uint256 parent1Id;
        uint256 parent2Id;
        uint256 isPregnantWith;
        uint256 generation;
        SpecimenFeature[] features;
    }

    struct SpecimenFeature {
        uint256 featureValue;
        FeatureType featureType;
    }

}
