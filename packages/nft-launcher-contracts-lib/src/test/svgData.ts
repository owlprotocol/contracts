import { SpecieMetadata, SpecieTrait } from '../metadata';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import { writeFileSync } from 'fs';
import exMetadata from '../exMetadata.json';

const client = ipfsHttpClient({
    url: 'https://ipfs.infura.io:5001/api/v0',
});

let redSquare, blueTriangle;

let squareTraits: SpecieTrait, triangleTraits: SpecieTrait;

let metadata: SpecieMetadata;

redSquare = { value_name: 'red', image: 'http://localhost:3000/square.svg' };
blueTriangle = { value_name: 'blue', image: 'http://localhost:3000/triangle.svg' };

squareTraits = new SpecieTrait('Square', 'Image', [redSquare]);
triangleTraits = new SpecieTrait('Triangle', 'Image', [blueTriangle]);

//Order in array matters
metadata = new SpecieMetadata([squareTraits, triangleTraits]);
const json = metadata.getJsonMetadata();
writeFileSync('./src/metadataSVG.json', JSON.stringify(json));

(async () => {
    const { cid } = await client.add(JSON.stringify(json));
    console.log(cid);
})();

const uploadedIPFSHash = 'QmRLe5ar7aizCTaHuC9d8b8QgmSf8LMsP6cvGunQ6twKtY';

const exMetadataIPFS = 'Qmf7gUJunZVdxGpZC8YNYjWkvjric8aWMHN6rqAWh78t8u';
