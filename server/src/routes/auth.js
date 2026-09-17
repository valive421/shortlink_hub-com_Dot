import {Router} from 'express';
import {signup,verifyEmail,login,refresh,logout,forgotPassword,resetPassword} from '../controllers/authController.js';
import {authLimiter} from '../middleware/rateLimit.js';
const r=Router();r.post('/signup',authLimiter,signup);r.post('/verify-email',authLimiter,verifyEmail);r.post('/login',authLimiter,login);r.post('/refresh',authLimiter,refresh);r.post('/logout',logout);r.post('/forgot-password',authLimiter,forgotPassword);r.post('/reset-password',authLimiter,resetPassword);export default r;
