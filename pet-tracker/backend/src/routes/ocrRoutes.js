import express from 'express';
import { processImageText } from '../controllers/ocrController.js';

const router = express.Router();

router.post('/process-image', processImageText);

export default router;
