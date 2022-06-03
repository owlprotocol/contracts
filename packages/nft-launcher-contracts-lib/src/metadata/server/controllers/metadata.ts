import { Request, Response, NextFunction } from 'express';
import { SpecieMetadata, SpecieTrait } from '../../metadata';
import { BadRequest } from 'http-errors';

let orangeBody, yellowBody, greenBody;

let smallEyes, mediumEyes, largeEyes;

let blueMouth, redMouth, pinkMouth;

let bodyTraits: SpecieTrait, eyeTraits: SpecieTrait, mouthTraits: SpecieTrait;

let metadata: SpecieMetadata;

orangeBody = { value_name: 'orange', image: __dirname + '/testimages/body/orange_body.png' };
yellowBody = { value_name: 'yellow', image: __dirname + '/testimages/body/yellow_body.png' };
greenBody = { value_name: 'rectangle', image: __dirname + '/testimages/body/green_body.png' };

smallEyes = { value_name: 'small', image: __dirname + '/testimages/eyes/eyes_1.png' };
mediumEyes = { value_name: 'medium', image: __dirname + '/testimages/eyes/eyes_2.png' };
largeEyes = { value_name: 'large', image: __dirname + '/testimages/eyes/eyes_3.png' };

blueMouth = { value_name: 'blue', image: __dirname + '/testimages/mouth/mouth_1.png' };
redMouth = { value_name: 'red', image: __dirname + '/testimages/mouth/mouth_2.png' };
pinkMouth = { value_name: 'pink', image: __dirname + '/testimages/mouth/mouth_3.png' };

bodyTraits = new SpecieTrait('Body', 'Image', [orangeBody, yellowBody, greenBody]);
eyeTraits = new SpecieTrait('Eyes', 'Image', [smallEyes, mediumEyes, largeEyes]);
mouthTraits = new SpecieTrait('Mouth', 'Image', [blueMouth, redMouth, pinkMouth]);

//Order in array matters
metadata = new SpecieMetadata([bodyTraits, eyeTraits, mouthTraits]);

export default async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { tokenId: idString } = req.params;
        const tokenId: number = parseInt(idString);

        if (isNaN(tokenId)) throw new BadRequest('tokenId is not a number');

        const tokenMetadata = metadata.dnaToMetadata(tokenId);
        res.status(200).send({ metadata: tokenMetadata });
    } catch (err) {
        next(err);
    }
};
