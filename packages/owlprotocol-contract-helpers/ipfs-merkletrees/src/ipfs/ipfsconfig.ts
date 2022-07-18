import dotenv from 'dotenv';
dotenv.config();

export async function getInfuraIPFS() {
    // eslint-disable-next-line import/no-unresolved
    const { create } = await import('ipfs-http-client');

    const projectId = process.env.INFURA_PROJECT_ID;
    if (!projectId) throw 'INFURA_PROJECT_ID must be set!';
    const projectSecret = process.env.INFURA_PROJECT_SECRET;
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
