import { Value } from '../types';
import { SpecieMetadata } from '../metadata';
import mergeImages, { Options as MergeOptions } from 'merge-images';
import axios from 'axios';
import colormap from 'colormap';
const colors = colormap({
    colormap: 'cool',
    nshades: 256,
    format: 'hex',
    alpha: 1,
});

async function merge(layers: Value[], specieMetadata: SpecieMetadata, mergeOptions?: MergeOptions): Promise<string> {
    const imageMapping = layers.map((layer) => {
        const option = specieMetadata.getSpecieMetadata().find((option) => option.getTraitType() === layer.trait_type);

        if (!option) throw new Error(`${layer.trait_type} not found in provided specie metadata`);
        if (option.getType() !== 'Image') return layer;
        //@ts-ignore
        const imageMapping = option.getValueOptions().find((valueOptions) => valueOptions.value_name === layer.value);
        // console.log(imageMapping);
        if (!imageMapping)
            throw new Error(
                `Value "${layer.value}" not found in provided specie metadata for trait_type "${layer.value}"`,
            );
        return imageMapping;
    });
    const images = imageMapping.filter((res) => 'image' in res && res.image !== undefined);
    const nonImages = imageMapping.filter((res) => !('image' in res));

    const imgFetch = await Promise.all(
        images.map(async (img) => {
            let imgVal: string = (
                await axios.get(img.image, {
                    responseType: 'text',
                })
            ).data;

            nonImages.forEach(({ trait_type, value }) => {
                imgVal = imgVal.replaceAll(`{${trait_type}}`, `${colors[value]}`);
            });

            return Buffer.from(imgVal);
        }),
    );

    // console.log('img', imageMapping);
    // console.log(images);
    // console.log(nonImages);
    // console.log(imgFetch);
    //@ts-ignore
    const combinedBinary = mergeImages(imgFetch, mergeOptions);
    return combinedBinary; //returns promise
}

export default merge;
