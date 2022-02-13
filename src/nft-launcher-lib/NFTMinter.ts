import { hexToUtf8 } from 'web3-utils';

export enum FeatureType {
    recessive,
    dominant,
}

export interface Species {
    name: string;
    contractAddr: string;
    owner: string;
    speciesFeatures: SpeciesFeatures[];
}

export interface SpeciesFeatures {
    name: string;
    minValue: string;
    maxValue: string;
}

export interface Specimen {
    createdBlock: string;
    features: SpecimenFeature[];
}

export interface SpecimenFeature {
    featureValue: string;
    featureType: FeatureType;
}

export function parseSpecies(species: Record<string, unknown>) {
    const parsed: Species = {
        name: '',
        contractAddr: '',
        owner: '',
        speciesFeatures: [],
    };

    if (typeof species.name != 'string') throw 'Mis-constructed name!';
    parsed.name = hexToUtf8(species.name);

    if (typeof species.contractAddr != 'string') throw 'Mis-constructed contractAddr!';
    parsed.contractAddr = species.contractAddr;

    if (typeof species.owner != 'string') throw 'Mis-constructed owner!';
    parsed.owner = species.owner;

    // SpeciesFeatures
    if (!Array.isArray(species.features)) throw 'Mis-constructed SpeciesFeatures list!';
    for (const feature of species.features) {
        if (feature.length != 3) throw 'Mis-constructed SpeciesFeature!';

        parsed.speciesFeatures.push({
            name: String(feature[0]),
            minValue: String(feature[1]),
            maxValue: String(feature[2]),
        });
    }

    return parsed;
}

export function parseSpecimen(specimen: Record<string, unknown>) {
    const parsed: Specimen = {
        createdBlock: '',
        features: [],
    };

    if (specimen.createdBlock == undefined) throw 'Mis-constructed createdBlock!';
    parsed.createdBlock = String(specimen.createdBlock);

    // SpeciesFeatures
    if (!Array.isArray(specimen.features)) throw 'Mis-constructed SpecimenFeatures list!';
    for (const feature of specimen.features) {
        if (feature.length != 2) throw 'Mis-constructed SpecimenFeature!';

        parsed.features.push({
            featureValue: String(feature[0]),
            featureType: Number(feature[1]),
        });
    }

    return parsed;
}
