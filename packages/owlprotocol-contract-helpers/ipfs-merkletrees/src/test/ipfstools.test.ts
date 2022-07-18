import { IPFSHTTPClient, CID } from 'ipfs-http-client';
import { expect } from 'chai';
import { createMerkleFromUsers, dumpToIpfs, formatAddresses, getLeaf, loadFromIpfs } from '../ipfs/ipfstools';
import { getInfuraIPFS } from '..';
import MerkleTree from 'merkletreejs';

describe('ipfstools.ts', async () => {
    let ipfsClient: IPFSHTTPClient;
    let tree: MerkleTree;
    let root: string;

    before(async () => {
        ipfsClient = await getInfuraIPFS();
    });

    describe('Test IPFS Tools', async () => {
        let ipfsHash: CID;
        const dummyAccounts = formatAddresses([
            '0x' + '0'.repeat(39) + '0',
            '0x' + '0'.repeat(39) + '1',
            '0x' + '0'.repeat(39) + '2',
            '0x' + '0'.repeat(39) + '3',
            '0x' + '0'.repeat(39) + '4',
        ]);
        const nonMember = formatAddresses(['0x' + 'a'.repeat(40)])[0];

        it('createMerkleFromUsers(...)', async () => {
            tree = await createMerkleFromUsers(dummyAccounts);
            root = tree.getHexRoot();
            expect(root).not.equals('0x', 'root not generated');
        });

        it('assert membership', async () => {
            for (const account of dummyAccounts) {
                const leaf = getLeaf(account);
                const proof = tree.getProof(leaf);
                const isMember = tree.verify(proof, leaf, root);
                expect(isMember, 'account is member of tree').to.be.true;
            }
        });

        it('assert nonmembership', async () => {
            const nonleaf = getLeaf(nonMember);
            const proof = tree.getProof(nonleaf);
            const isMember = tree.verify(proof, nonleaf, root);
            expect(isMember, 'nonmember account is member').to.be.false;
        });

        it('test dumpToIpfs(...)', async () => {
            ipfsHash = await dumpToIpfs(tree, ipfsClient);
            expect(ipfsHash.byteLength).not.equals(0);
        });

        it('test loadFromIpfs(...)', async () => {
            const loadedTree = await loadFromIpfs(ipfsHash, ipfsClient);
            expect(root).to.equal(loadedTree.getHexRoot(), 'trees not equal!');
        });
    });
});
