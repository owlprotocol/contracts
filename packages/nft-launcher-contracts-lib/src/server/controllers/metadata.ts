import { Request, Response, NextFunction } from 'express';
import { SpecieMetadata, validateAndGetSchema } from '../../metadata';
import { BadRequest } from 'http-errors';
import { writeFileSync, existsSync, readFileSync, mkdir } from 'fs';
import path from 'path';
import axios, { AxiosError } from 'axios';
import { merge } from '../../images';
import { Canvas, Image } from 'canvas';
import { toBN } from 'web3-utils';

export async function getMetadata(req: Request, res: Response, next: NextFunction) {
    try {
        const { specieMetadataHash, tokenId } = req.params;

        const instance = await getInstance(specieMetadataHash, tokenId);

        writeFileSync(`./cache/${specieMetadataHash}/tokens/${tokenId}.json`, JSON.stringify(instance));
        console.log(instance.attributes);
        res.status(200).send(instance);
    } catch (err) {
        next(err);
    }
}

export async function getImage(req: Request, res: Response, next: NextFunction) {
    try {
        const { specieMetadataHash, tokenId } = req.params;

        const instance = await getInstance(specieMetadataHash, tokenId);

        writeFileSync(`./cache/${specieMetadataHash}/tokens/${tokenId}.json`, JSON.stringify(instance));
        console.log(instance.attributes);
        res.status(200).send(`<img src="${instance.image}" />`);
    } catch (err) {
        next(err);
    }
}

export async function getInstance(ipfsHash: string, tokenId: string) {
    if (!/^[0-9]+$/.test(tokenId)) throw new BadRequest('tokenId is not a number');

    let specieMetadata: SpecieMetadata | null = null;

    const cachePath = path.join(__dirname, '..', '..', '..', 'cache', ipfsHash);

    //creating cache entry if doesn't exist
    if (!existsSync(cachePath)) {
        mkdir(cachePath + '/tokens', { recursive: true }, () => {});
    }

    //token cache
    const tokenCacheHit = hitTokenCache(cachePath, tokenId);
    if (tokenCacheHit !== null) return tokenCacheHit;

    //specieMetadata cache
    const specieMetadataCacheHit = hitSpecieMetadataCache(cachePath);

    if (specieMetadataCacheHit !== null) specieMetadata = specieMetadataCacheHit;
    else specieMetadata = await fetchSpecieMetadata(cachePath, ipfsHash);

    //layers cache

    if (specieMetadata === null) throw new BadRequest('Invalid SpecieMetadata');

    const tokenMetadata = specieMetadata.dnaToMetadata(toBN(tokenId));

    const mergedImg = await merge(tokenMetadata, specieMetadata, ipfsHash, {
        Canvas,
        Image,
    });


    const tokenOverrides = specieMetadata.getOverride(tokenId);

    const finalJson = { attributes: tokenMetadata, image: mergedImg };
    if (tokenOverrides !== undefined) Object.assign(finalJson, tokenOverrides);

    return finalJson;

}

export function hitTokenCache(cachePath: string, tokenId: string): any | null {
    const tokenPath = `${cachePath}/tokens/${tokenId}.json`;
    //@ts-ignore
    if (existsSync(tokenPath)) return JSON.parse(readFileSync(tokenPath));
    return null;
}

export function hitSpecieMetadataCache(cachePath: string): SpecieMetadata | null {
    const specieMetadataPath = `${cachePath}/specieMetadata/specieMetadata.json`;
    //@ts-ignore
    if (existsSync(specieMetadataPath)) return validateAndGetSchema(JSON.parse(readFileSync(specieMetadataPath)));
    return null;
}

export async function fetchSpecieMetadata(
    cachePath: string,
    specieMetadataHash: string,
): Promise<SpecieMetadata | null> {
    return new Promise((resolve, reject) =>
        mkdir(cachePath + '/specieMetadata', { recursive: true }, async (err) => {
            if (err) reject(err);

            try {
                const { data } = await axios.get(`${process.env.IPFS_GATEWAY}/${specieMetadataHash}`);
                const specieMetadata = validateAndGetSchema(data);
                writeFileSync(
                    `./cache/${specieMetadataHash}/specieMetadata/specieMetadata.json`,
                    JSON.stringify(specieMetadata),
                );
                resolve(specieMetadata);
            } catch (err) {
                if (err instanceof AxiosError) reject(new BadRequest(err.response?.data));
                reject(err);
            }
        }),
    );
}
