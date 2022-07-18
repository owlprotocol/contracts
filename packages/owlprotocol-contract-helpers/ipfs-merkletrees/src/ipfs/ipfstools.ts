// eslint-disable-next-line import/no-unresolved
import { IPFSHTTPClient } from 'ipfs-http-client/src/types';
import { getInfuraIPFS } from './ipfsconfig';
import { concat, toString } from 'uint8arrays';
import MerkleTree from 'merkletreejs';
import { ethers } from 'ethers';

export async function loadFromIpfs(ipfsHash: string, ipfsClient?: IPFSHTTPClient) {
    if (ipfsClient === undefined) ipfsClient = getInfuraIPFS();

    const treeData = await fetchIpfsJson(ipfsHash, ipfsClient);

    return treeData;
}

export async function dumpToIpfs(tree: MerkleTree, ipfsClient?: IPFSHTTPClient) {
    if (ipfsClient === undefined) ipfsClient = getInfuraIPFS();

    const treeDump = JSON.stringify(tree.getHexLeaves());
    const ipfsHash = await ipfsClient.add(treeDump);

    return ipfsHash;
}

export async function createMerkleFromUsers(addresses: string[]) {
    const leaves = addresses.map((address) => ethers.utils.hexZeroPad(address.toLowerCase(), 32));

    const tree = new MerkleTree([]);
    // const tree = new MerkleTree(leaves, ethers.utils.keccak256, {
    //     hashLeaves: true,
    //     sortPairs: true,
    // });

    return tree;
}

async function fetchIpfsJson(ipfsHash: string, ipfsClient: IPFSHTTPClient) {
    const download = [];
    const stream = await ipfsClient.cat(ipfsHash);
    for await (const data of stream) download.push(data);
    const dataString = toString(concat(download));
    const parsed = JSON.parse(dataString);

    if (parsed === undefined) throw 'no data at hash!';
    return parsed;
}
