import { fromString } from 'uint8arrays/from-string';
import { Canvas, Image as _Image } from 'canvas';
import { SpecieTrait, SpecieMetadata } from './metadata';
import { ERC721Metadata, MetadataList } from './types';
import { merge, uploadImage, uploadERC721Many } from './images';

describe('E2E Test', () => {
    let orangeBody, yellowBody, greenBody;

    let smallEyes, mediumEyes, largeEyes;

    let blueMouth, redMouth, pinkMouth;

    let bodyTraits, eyeTraits, mouthTraits;

    let metadata: SpecieMetadata;
    let allM: MetadataList;

    before(() => {
        orangeBody = { value_name: 'orange', image: __dirname + '/../testimages/body/orange_body.png' };
        yellowBody = { value_name: 'yellow', image: __dirname + '/../testimages/body/yellow_body.png' };
        greenBody = { value_name: 'rectangle', image: __dirname + '/../testimages/body/green_body.png' };

        smallEyes = { value_name: 'small', image: __dirname + '/../testimages/eyes/eyes_1.png' };
        mediumEyes = { value_name: 'medium', image: __dirname + '/../testimages/eyes/eyes_2.png' };
        largeEyes = { value_name: 'large', image: __dirname + '/../testimages/eyes/eyes_3.png' };

        blueMouth = { value_name: 'blue', image: __dirname + '/../testimages/mouth/mouth_1.png' };
        redMouth = { value_name: 'red', image: __dirname + '/../testimages/mouth/mouth_2.png' };
        pinkMouth = { value_name: 'pink', image: __dirname + '/../testimages/mouth/mouth_3.png' };

        bodyTraits = new SpecieTrait('Body', 'Image', [orangeBody, yellowBody, greenBody]);
        eyeTraits = new SpecieTrait('Eyes', 'Image', [smallEyes, mediumEyes, largeEyes]);
        mouthTraits = new SpecieTrait('Mouth', 'Image', [blueMouth, redMouth, pinkMouth]);

        //Order in array matters
        metadata = new SpecieMetadata([bodyTraits, eyeTraits, mouthTraits]);
        allM = metadata.generateAllInstances();
    });

    it.skip('UploadERC721Many', async function () {
        this.timeout(60000);
        const list: ERC721Metadata[] = [];

        for (const dna in allM) {
            console.log(dna);
            const mergedImage = await merge(allM[dna], metadata, {
                Canvas,
                Image: _Image,
            });

            // remove "data:image/png;base64,"
            const imgBinary = fromString(mergedImage.substring(mergedImage.indexOf(',') + 1), 'base64');

            //upload each image manually
            const { path } = await uploadImage(imgBinary);

            const token: ERC721Metadata = {
                name: `${dna}`,
                image: `ipfs://${path}`,
                attributes: allM[dna],
            };

            list.push(token);
        }

        const r = [];
        for await (const data of await uploadERC721Many(list, 'name')) {
            r.push(data);
        }
        const { cid } = r[r.length - 1];
        console.log(list);
        console.log('path:', cid);
        // check if ipfs://[cid] has all files in list
    });
});
