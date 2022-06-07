import { Value } from '../types';
import { SpecieMetadata } from '../metadata';
import mergeImages, { Options as MergeOptions } from 'merge-images';
import axios from 'axios';
import colormap from 'colormap';
import { existsSync, mkdir, readFileSync, writeFileSync } from 'fs';
import path from 'path';

async function merge(
    layers: Value[],
    specieMetadata: SpecieMetadata,
    ipfsHash: string,
    mergeOptions?: MergeOptions,
): Promise<string> {
    const cachePath = path.join(__dirname, '..', '..', '..', 'cache', ipfsHash);

    const imageMapping = layers.map((layer) => {
        const option = specieMetadata.getSpecieMetadata().find((option) => option.getTraitType() === layer.trait_type);

        if (!option) throw new Error(`${layer.trait_type} not found in provided specie metadata`);
        if (option.getType() !== 'Image') return layer;
        //@ts-ignore
        const imageMapping = option.getValueOptions().find((valueOptions) => valueOptions.value_name === layer.value);

        if (!imageMapping)
            throw new Error(
                `Value "${layer.value}" not found in provided specie metadata for trait_type "${layer.value}"`,
            );
        return imageMapping;
    });

    const colMap: string = imageMapping.find((e) => e.trait_type === 'colormap').value;

    const colors = colormap({
        colormap: colMap || 'jet',
        nshades: 256,
        format: 'hex',
        alpha: 1,
    });

    const images = imageMapping.filter((res) => 'image' in res && res.image !== undefined);
    const nonImages = imageMapping.filter((res) => !('image' in res));

    const imgFetch = await Promise.all(
        images.map(async (img) => {
            const { value_name, image } = img;
            const imgPath = `./cache/${ipfsHash}/layers/${value_name}.${image.split('.').pop()}`;

            //hit layers cache
            if (existsSync(imgPath)) return readFileSync(imgPath);

            let imgVal: string = (
                await axios.get(img.image, {
                    responseType: 'text',
                })
            ).data;
            nonImages.forEach(({ trait_type, value }) => {
                imgVal = imgVal.replaceAll(`{${trait_type}}`, `${colors[value]}`);
            });

            const imgBuffer = Buffer.from(imgVal);
            cacheImg(ipfsHash, imgPath, imgBuffer);
            return imgBuffer;
        }),
    );

    //@ts-ignore
    const combinedBinary = mergeImages(imgFetch, mergeOptions);
    return combinedBinary; //returns promise
}

export async function cacheImg(ipfsHash: string, imgPath: string, imgBuffer: Buffer) {
    const cachePath = path.join(__dirname, '..', '..', 'cache', ipfsHash);

    mkdir(cachePath + '/layers', { recursive: true }, (err) => {
        if (err) throw err;
        writeFileSync(imgPath, imgBuffer);
    });
}

export default merge;
