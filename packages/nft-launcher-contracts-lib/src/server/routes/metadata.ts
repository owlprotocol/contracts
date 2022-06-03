import express from 'express';
import { getMetadata } from '../controllers';

const router = express.Router();

router.get('/:specieMetadataHash/:tokenId', getMetadata);

export default router;
