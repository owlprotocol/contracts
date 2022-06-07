import express from 'express';
import { getMetadata, getImage } from '../controllers';

const router = express.Router();

router.get('/getMetadata/:specieMetadataHash/:tokenId', getMetadata);
router.get('/getImage/:specieMetadataHash/:tokenId', getImage);

export default router;
