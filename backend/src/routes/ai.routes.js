import express from 'express';
import protect from '../middleware/auth.middleware.js';
import { generateAgreement } from '../controllers/ai.controller.js';

const router = express.Router();

router.use(protect);
router.post('/generate', generateAgreement);

export default router;
