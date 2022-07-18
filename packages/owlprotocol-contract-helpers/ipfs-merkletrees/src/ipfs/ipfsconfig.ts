import { create } from 'ipfs-http-client';
import dotenv from 'dotenv';
dotenv.config();

export function getInfuraIPFS(_projectId?: string, _projectSecret?: string) {
    // Load environments
    const projectId = process.env.INFURA_PROJECT_ID || _projectId;
    if (!projectId) throw 'INFURA_PROJECT_ID must be set!';
    const projectSecret = process.env.INFURA_PROJECT_SECRET || _projectSecret;
    if (!projectSecret) throw 'INFURA_PROJECT_SECRET must be set!';
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
