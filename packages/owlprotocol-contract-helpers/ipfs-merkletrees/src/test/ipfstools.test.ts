// eslint-disable-next-line import/no-unresolved
import { IPFSHTTPClient } from 'ipfs-http-client';
import { expect } from 'chai';
import { createMerkleFromUsers } from '../ipfs/ipfstools';
import { getInfuraIPFS } from '..';
import MerkleTree from 'merkletreejs';

describe('ipfstools.ts', async () => {
    let ipfsClient: IPFSHTTPClient;

    before(async () => {
        ipfsClient = getInfuraIPFS();
    });

    describe('Test IPFS Tools', async () => {
        let dummyIPFS: string;
        const dummyAccounts = [
            '0x' + '0'.repeat(39) + '0',
            '0x' + '0'.repeat(39) + '1',
            '0x' + '0'.repeat(39) + '2',
            '0x' + '0'.repeat(39) + '3',
            '0x' + '0'.repeat(39) + '4',
        ];

        it('createMerkleFromUsers(...)', async () => {
            const tree = new MerkleTree([]);
            // const tree = await createMerkleFromUsers(dummyAccounts);
            console.log('Got root: ', tree.getHexRoot());
        });

        // it('test downloads', async () => {
        //     const download = [];
        //     const stream = await ipfsClient.cat(dummyFile);
        //     for await (const data of stream)
        //         download.push(data);
        //     const dataString = toString(concat(download));
        //     const parsed = JSON.parse(dataString);
        //     expect(parsed).to.deep.equal(dummyData, 'downloaded file not the same!');
        // });
    })
});
