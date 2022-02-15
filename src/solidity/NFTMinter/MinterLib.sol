//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev NFT Minter common data types
 *
 */
library MinterLib {

    // TODO - remove recessive / dominant traits once
    // gene mixing algorithm complete
    enum FeatureType {
        recessive,
        dominant
    }

    struct Species {
        address contractAddr;
        address owner;
        address mintFeeToken;
        uint256 mintFeeAmount;
        address mintFeeAddress;
        SpeciesFeature[] speciesFeatures;
        mapping(uint256 => Specimen) specimen;
    }

    struct SpeciesFeature {
        uint8 minValue;
        uint8 maxValue;
    }

    struct Specimen {
        uint64 createdBlock;
        uint256 dna;
        SpecimenFeature[] features;
    }

    struct SpecimenFeature {
        uint128 featureValue;
        FeatureType featureType;
    }

}
