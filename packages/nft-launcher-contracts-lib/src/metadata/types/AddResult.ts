import { CID } from 'ipfs-http-client';

interface AddResult {
    path: string;
    cid: CID;
    size: number;
}

export default AddResult;
