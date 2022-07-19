import { create } from 'ipfs-http-client';
import dotenv from 'dotenv';
dotenv.config();

export function getInfuraIPFS(projectId: string, projectSecret: string) {
    const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

    const ipfsConfig = {
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https',
        headers: {
            authorization: auth,
        },
    };

    return create(ipfsConfig);
}
