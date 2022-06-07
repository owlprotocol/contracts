import { Request, Response, NextFunction } from 'express';
import { SpecieMetadata, validateAndGetSchema } from '../../metadata';
import { BadRequest } from 'http-errors';
import { writeFileSync, existsSync, readFileSync, mkdir, mkdirSync } from 'fs';
import path from 'path';
import axios, { AxiosError } from 'axios';
import { merge } from '../../images';
import { Canvas, Image } from 'canvas';
import { toBN } from 'web3-utils';

export default async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { specieMetadataHash, tokenId } = req.params;

        if (!/^[0-9]+$/.test(tokenId)) throw new BadRequest('tokenId is not a number');

        let specieMetadata: SpecieMetadata | null = null;

        const cachePath = path.join(__dirname, '..', '..', '..', 'cache', specieMetadataHash);

        //creating cache entry if doesn't exist
        if (!existsSync(cachePath)) {
            mkdir(cachePath + '/tokens', { recursive: true }, () => {});
        }

        //token cache
        const tokenCacheHit = hitTokenCache(cachePath, tokenId);
        if (tokenCacheHit !== null) {
            console.log(tokenCacheHit.attributes);
            return res.status(200).send(tokenCacheHit);
        }

        //specieMetadata cache
        const specieMetadataCacheHit = hitSpecieMetadataCache(cachePath);

        if (specieMetadataCacheHit !== null) specieMetadata = specieMetadataCacheHit;
        else specieMetadata = await fetchSpecieMetadata(cachePath, specieMetadataHash);

        //layers cache

        if (specieMetadata === null) throw new BadRequest('Invalid SpecieMetadata');

        const tokenMetadata = specieMetadata.dnaToMetadata(toBN(tokenId));

        const mergedImg = await merge(tokenMetadata, specieMetadata, {
            Canvas,
            Image,
        });

        const instance = { attributes: tokenMetadata, image: mergedImg };
        writeFileSync(`./cache/${specieMetadataHash}/tokens/${tokenId}.json`, JSON.stringify(instance));
        console.log(instance.attributes);
        res.status(200).send(instance);
    } catch (err) {
        next(err);
    }
};

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
        mkdir(cachePath + '/specieMetadata', { recursive: true }, async () => {
            let specieMetadata: SpecieMetadata | null = null;
            try {
                const { data } = await axios.get(`${process.env.IPFS_GATEWAY}/${specieMetadataHash}`);
                specieMetadata = validateAndGetSchema(data);
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
