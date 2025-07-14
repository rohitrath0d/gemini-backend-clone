import express from 'express';
import { changePassword, forgotPassword, sendOtp, signUp, verifyOtp } from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';


const router = express.Router();

router.post('/sign-up', signUp)
router.post('/send-otp', sendOtp)
router.post('/verify-otp', verifyOtp)
router.post('/forgot-password', forgotPassword)
router.post('/change-password', authMiddleware, changePassword)


export default router;