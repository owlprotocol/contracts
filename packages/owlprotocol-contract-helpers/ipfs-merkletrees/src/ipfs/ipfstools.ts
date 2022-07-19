import { IPFSHTTPClient, CID } from 'ipfs-http-client';
import { concat, toString } from 'uint8arrays';
import MerkleTree from 'merkletreejs';
import { ethers } from 'ethers';

export async function loadFromIpfs(ipfsHash: CID, ipfsClient: IPFSHTTPClient) {
    const leaves = await fetchIpfsJson(ipfsHash, ipfsClient);

    const tree = new MerkleTree(leaves, ethers.utils.keccak256, {
        hashLeaves: false, // already hashed before
        sortPairs: true,
    });

    return tree;
}

export async function dumpToIpfs(tree: MerkleTree, ipfsClient: IPFSHTTPClient) {
    const treeDump = JSON.stringify(tree.getHexLeaves());
    const upload = await ipfsClient.add(treeDump);

    return upload.cid;
}

export async function createMerkleFromUsers(addresses: string[]) {
    const leaves = addresses.map((a) => formatAddress(a));

    const tree = new MerkleTree(leaves, ethers.utils.keccak256, {
        hashLeaves: true, // first time loading, so hash
        sortPairs: true,
    });

    return tree;
}

export function formatAddress(address: string) {
    return ethers.utils.hexZeroPad(address.toLowerCase(), 32);
}

export function getLeaf(address: string) {
    return ethers.utils.keccak256(formatAddress(address));
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
