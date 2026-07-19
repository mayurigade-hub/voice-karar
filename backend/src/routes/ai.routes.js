import express from 'express';
import protect from '../middleware/auth.middleware.js';
import validate from '../middleware/validation.middleware.js';
import { generateAgreement } from '../controllers/ai.controller.js';
import aiValidation from '../validations/ai.validation.js';

const router = express.Router();

router.use(protect);
router.post('/generate', validate(aiValidation.generateAgreementSchema), generateAgreement);

export default router;
