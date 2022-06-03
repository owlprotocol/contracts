import { Request, Response, NextFunction } from 'express';
import { SpecieMetadata, SpecieTrait } from '../../metadata';
import { BadRequest } from 'http-errors';
import { writeFileSync, existsSync, mkdir, createWriteStream, readFileSync } from 'fs';
import path from 'path';
import axios from 'axios';
import { merge } from '../../images';
import { Canvas, Image } from 'canvas';

let orangeBody, yellowBody, greenBody;

let smallEyes, mediumEyes, largeEyes;

let blueMouth, redMouth, pinkMouth;

let bodyTraits: SpecieTrait, eyeTraits: SpecieTrait, mouthTraits: SpecieTrait;

let metadata: SpecieMetadata;

orangeBody = { value_name: 'orange', image: 'http://localhost:3000/body/orange_body.png' };
yellowBody = { value_name: 'yellow', image: 'http://localhost:3000/body/yellow_body.png' };
greenBody = { value_name: 'rectangle', image: 'http://localhost:3000/body/green_body.png' };

smallEyes = { value_name: 'small', image: 'http://localhost:3000/eyes/eyes_1.png' };
mediumEyes = { value_name: 'medium', image: 'http://localhost:3000/eyes/eyes_2.png' };
largeEyes = { value_name: 'large', image: 'http://localhost:3000/eyes/eyes_3.png' };

blueMouth = { value_name: 'blue', image: 'http://localhost:3000/mouth/mouth_1.png' };
redMouth = { value_name: 'red', image: 'http://localhost:3000/mouth/mouth_2.png' };
pinkMouth = { value_name: 'pink', image: 'http://localhost:3000/mouth/mouth_3.png' };

bodyTraits = new SpecieTrait('Body', 'Image', [orangeBody, yellowBody, greenBody]);
eyeTraits = new SpecieTrait('Eyes', 'Image', [smallEyes, mediumEyes, largeEyes]);
mouthTraits = new SpecieTrait('Mouth', 'Image', [blueMouth, redMouth, pinkMouth]);

//Order in array matters
metadata = new SpecieMetadata([bodyTraits, eyeTraits, mouthTraits]);
const json = metadata.getJsonMetadata();
writeFileSync('./metadataLH.json', JSON.stringify(json));

export default async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { specieMetadata, tokenId: idString } = req.params;
        const tokenId: number = parseInt(idString);

        const cachePath = path.join(__dirname, '..', '..', '..', 'cache', specieMetadata);

        if (!existsSync(cachePath)) {
            await mkdir(cachePath, () => {});
            await mkdir(cachePath + '/layers', () => {});
            await mkdir(cachePath + '/tokens', () => {});
            json.traits.forEach(async (e) => {
                if (e.type === 'Image') {
                    if (!existsSync(cachePath + '/layers/' + e.trait_type))
                        await mkdir(cachePath + `/layers/${e.trait_type}`, () => {});
                    e.value_options.forEach(async (o, i) => {
                        const imgLink = o.image;
                        if (imgLink === undefined)
                            throw new BadRequest("A trait_value of trait_type 'Image' is missing 'image' field");

                        const res = await downloadFile(
                            imgLink,
                            `${cachePath}/layers/${e.trait_type}/${o.value_name}.png`,
                        );
                    });
                }
            });
        }

        if (isNaN(tokenId)) throw new BadRequest('tokenId is not a number');

        const tokenPath = `${cachePath}/tokens/${tokenId}.json`;
        if (existsSync(tokenPath)) return res.status(200).send(readFileSync(tokenPath));

        const tokenMetadata = metadata.dnaToMetadata(tokenId);

        const mergedImg = await merge(tokenMetadata, metadata, {
            Canvas,
            Image,
        });

        const instance = { attributes: tokenMetadata, image: mergedImg };
        writeFileSync(`./cache/${specieMetadata}/tokens/${tokenId}.json`, JSON.stringify(instance));

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
