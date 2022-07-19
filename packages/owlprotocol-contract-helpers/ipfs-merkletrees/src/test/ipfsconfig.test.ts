import { expect } from 'chai';
import { IPFSHTTPClient } from 'ipfs-http-client';
import { concat, toString } from 'uint8arrays';
import { getInfuraIPFS } from '../index';
import { projectId, projectSecret } from './infura.test';

describe('ipfsconfig.ts', async () => {
    let ipfsClient: IPFSHTTPClient;

    before(async () => {
        ipfsClient = getInfuraIPFS(projectId, projectSecret);
    });

    describe('Test IPFS client', async () => {
        let dummyFile: string;
        const dummyData = { a: 1, b: 2, c: 3 };

        it('test uploads', async () => {
            const dataString = JSON.stringify(dummyData);
            const hash = await ipfsClient.add(dataString);
            dummyFile = hash.path;
            expect(dummyFile.length !== 0, 'file not uploaded!');
        });

        it('test downloads', async () => {
            const download = [];
            const stream = await ipfsClient.cat(dummyFile);
            for await (const data of stream) download.push(data);
            const dataString = toString(concat(download));
            const parsed = JSON.parse(dataString);
            expect(parsed).to.deep.equal(dummyData, 'downloaded file not the same!');
        });
    });
});
