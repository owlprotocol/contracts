import { IPFSHTTPClient, CID } from 'ipfs-http-client';
import { getInfuraIPFS } from './ipfsconfig';
import { concat, toString } from 'uint8arrays';
import MerkleTree from 'merkletreejs';
import { ethers } from 'ethers';

export async function loadFromIpfs(ipfsHash: CID, ipfsClient?: IPFSHTTPClient) {
    if (ipfsClient === undefined) ipfsClient = getInfuraIPFS();

    const leaves = await fetchIpfsJson(ipfsHash, ipfsClient);

    const tree = new MerkleTree(leaves, ethers.utils.keccak256, {
        hashLeaves: false, // already hashed before
        sortPairs: true,
    });

    return tree;
}

export async function dumpToIpfs(tree: MerkleTree, ipfsClient?: IPFSHTTPClient) {
    if (ipfsClient === undefined) ipfsClient = getInfuraIPFS();

    const treeDump = JSON.stringify(tree.getHexLeaves());
    const upload = await ipfsClient.add(treeDump);

    return upload.cid;
}

export async function createMerkleFromUsers(addresses: string[]) {
    const leaves = formatAddresses(addresses);

    const tree = new MerkleTree(leaves, ethers.utils.keccak256, {
        hashLeaves: true, // first time loading, so hash
        sortPairs: true,
    });

    return tree;
}

export function formatAddresses(addresses: string[]) {
    return addresses.map((address) => ethers.utils.hexZeroPad(address.toLowerCase(), 32));
}

export function getLeaf(address: string) {
    return ethers.utils.keccak256(formatAddresses([address])[0]);
}

async function fetchIpfsJson(ipfsHash: CID, ipfsClient: IPFSHTTPClient) {
    const download = [];
    const stream = await ipfsClient.cat(ipfsHash);
    for await (const data of stream) download.push(data);
    const dataString = toString(concat(download));
    const parsed = JSON.parse(dataString);

    if (parsed === undefined) throw 'no data at hash!';
    return parsed;
}
