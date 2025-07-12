import express from 'express';
import { signup, login, officerLogin, sendOtp, verifyOtp } from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/officer/login', officerLogin);
router.post('/otp-send', sendOtp);
router.post('/otp-verify', verifyOtp);

export default router;
