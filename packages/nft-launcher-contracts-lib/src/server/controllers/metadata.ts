import { Request, Response, NextFunction } from 'express';
import { SpecieMetadata, SpecieTrait, validateAndGetSchema } from '../../metadata';
import { BadRequest } from 'http-errors';
import { writeFileSync, existsSync, mkdir, createWriteStream, readFileSync, mkdirSync } from 'fs';
import path from 'path';
import axios, { AxiosError } from 'axios';
import { merge } from '../../images';
import { Canvas, Image } from 'canvas';
import { ValueOption } from '../../types';

export default async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { specieMetadataHash, tokenId: idString } = req.params;
        const tokenId: number = parseInt(idString);
        let specieMetadata: SpecieMetadata | null = null;

        try {
            const { data } = await axios.get(`${process.env.IPFS_GATEWAY}/${specieMetadataHash}`);
            specieMetadata = validateAndGetSchema(data);
        } catch (err) {
            if (err instanceof AxiosError) throw new BadRequest(err.response?.data);
            throw err;
        }

        const cachePath = path.join(__dirname, '..', '..', '..', 'cache', specieMetadataHash);

        //creating cache entry if doesn't exist
        if (!existsSync(cachePath)) {
            mkdirSync(cachePath);
            mkdirSync(cachePath + '/layers');
            mkdirSync(cachePath + '/tokens');
            if (specieMetadata === null) throw new BadRequest();
            specieMetadata.getSpecieMetadata().forEach(async (e) => {
                if (e.getType() === 'Image') {
                    if (!existsSync(cachePath + '/layers/' + e.getTraitType()))
                        await mkdir(cachePath + `/layers/${e.getTraitType()}`, () => {});
                    e.getValueOptions().forEach(async (o: ValueOption) => {
                        const imgLink = o.image;
                        if (imgLink === undefined)
                            throw new BadRequest("A trait_value of trait_type 'Image' is missing 'image' field");
                        await downloadFile(imgLink, `${cachePath}/layers/${e.getTraitType()}/${o.value_name}.png`);
                    });
                }
            });
        }

        if (isNaN(tokenId)) throw new BadRequest('tokenId is not a number');

        const tokenPath = `${cachePath}/tokens/${tokenId}.json`;
        if (existsSync(tokenPath)) return res.status(200).send(readFileSync(tokenPath));

        const tokenMetadata = specieMetadata.dnaToMetadata(tokenId);
        const mergedImg = await merge(tokenMetadata, specieMetadata, {
            Canvas,
            Image,
        });

        const instance = { attributes: tokenMetadata, image: mergedImg };
        writeFileSync(`./cache/${specieMetadataHash}/tokens/${tokenId}.json`, JSON.stringify(instance));
        res.status(200).send(instance);
    } catch (err) {
        next(err);
    }
};

const downloadFile = async (url: string, path: string) => {
    if (url.startsWith('ipfs://')) url = `https://ipfs.io/${url.replace('ipfs://', '')}`;
    const writer = createWriteStream(path);

    return axios({
        method: 'get',
        url,
        responseType: 'stream',
    }).then((response) => {
        //ensure that the user can call `then()` only when the file has
        //been downloaded entirely.

        return new Promise((resolve, reject) => {
            response.data.pipe(writer);
            let error: Error | null = null;
            writer.on('error', (err) => {
                error = err;
                writer.close();
                reject(err);
            });
            writer.on('close', () => {
                if (!error) resolve(true);

                //no need to call the reject here, as it will have been called in the
                //'error' stream;
            });
        });
    });
};
