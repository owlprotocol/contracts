import { Value } from '../types';
import { SpecieMetadata } from '../metadata';
import mergeImages, { Options as MergeOptions } from 'merge-images';

function merge(layers: Value[], specieMetadata: SpecieMetadata, mergeOptions?: MergeOptions): Promise<string> {
    const imageMapping = layers.map((layer) => {
        const option = specieMetadata.getSpecieMetadata().find((option) => option.getTraitType() === layer.trait_type);

        if (!option) throw new Error(`${layer.trait_type} not found in provided specie metadata`);
        const imageMapping = option.getValueOptions().find((valueOptions) => valueOptions.value_name === layer.value);
        if (!imageMapping)
            throw new Error(
                `Value "${layer.value}" not found in provided specie metadata for trait_type "${layer.value}"`,
            );
        return imageMapping;
    });
    const images = imageMapping.filter((res) => res.image !== undefined).map((res) => res.image);

    console.log(images);
    //@ts-ignore
    const combinedBinary = mergeImages(images, mergeOptions);
    return combinedBinary; //returns promise
}

export default merge;
