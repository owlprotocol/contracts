import { Request, Response, NextFunction } from 'express';
import { SpecieMetadata, validateAndGetSchema, validateSchema } from '../../metadata';
import { BadRequest } from 'http-errors';
import { writeFileSync, existsSync, mkdir, createWriteStream, readFileSync, mkdirSync } from 'fs';
import path from 'path';
import axios, { AxiosError } from 'axios';
import { merge } from '../../images';
import { Canvas, Image } from 'canvas';
import { toBN } from 'web3-utils';
import { ValueOption } from '../../types';

export default async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { specieMetadataHash, tokenId: idString } = req.params;
        const tokenId: string = idString;
        let specieMetadata: SpecieMetadata | null = null;

        try {
            const { data } = await axios.get(`${process.env.IPFS_GATEWAY}/${specieMetadataHash}`);
            specieMetadata = validateAndGetSchema(data);
        } catch (err) {
            if (err instanceof AxiosError) throw new BadRequest(err.response?.data);
            throw err;
        }

        if (specieMetadata === null) throw new BadRequest('Invalid SpecieMetadata');

        const cachePath = path.join(__dirname, '..', '..', '..', 'cache', specieMetadataHash);

        //creating cache entry if doesn't exist
        if (!existsSync(cachePath)) {
            mkdirSync(cachePath);
            mkdirSync(cachePath + '/tokens');
        }

        if (!/^[0-9]+$/.test(tokenId)) throw new BadRequest('tokenId is not a number');

        const tokenPath = `${cachePath}/tokens/${tokenId}.json`;
        //@ts-ignore
        if (existsSync(tokenPath)) return res.status(200).send(JSON.parse(readFileSync(tokenPath)));

        const tokenMetadata = specieMetadata.dnaToMetadata(toBN(tokenId));

        const mergedImg = await merge(tokenMetadata, specieMetadata, {
            Canvas,
            Image,
        });

        const instance = { attributes: tokenMetadata, image: mergedImg };
        writeFileSync(`./cache/${specieMetadataHash}/tokens/${tokenId}.json`, JSON.stringify(instance));
        // console.log(instance.image);
        res.status(200).send(instance);
    } catch (err) {
        next(err);
    }
};
