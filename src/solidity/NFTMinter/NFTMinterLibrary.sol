//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev NFT Minter common data types
 *
 */
library NFTMinterLibrary {

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
        // Because we use mod operator to calculate random values,
        // values will not be generated greater than sqrt(2**256-1).
        // This results in uint128 values. 
        uint128 minValue;
        uint128 maxValue;
    }

    struct Specimen {
        uint256 createdBlock;
        SpecimenFeature[] features;
    }

    struct SpecimenFeature {
        uint128 featureValue;
        FeatureType featureType;
    }

}
