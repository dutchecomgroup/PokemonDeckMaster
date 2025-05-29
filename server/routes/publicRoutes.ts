import express from 'express';
import { getRegistrationStatus, getPublicStats } from '../controllers/publicController';

const router = express.Router();

// Public endpoint to check if registration is enabled
router.get('/registration-status', getRegistrationStatus);

// Public endpoint to get site stats
router.get('/stats', getPublicStats);

export default router;