import express from 'express';
import { getMetadata } from '../controllers';

const router = express.Router();

router.get('/:tokenId', getMetadata);

export default router;
