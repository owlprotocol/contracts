import express from 'express';
import { getMetadata } from '../controllers';

const router = express.Router();

router.get('/:specieMetadata/:tokenId', getMetadata);

export default router;
