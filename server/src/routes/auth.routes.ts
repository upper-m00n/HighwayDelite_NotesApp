import { Router } from 'express';
import { 
    requestOtpHandler, 
    verifyOtpAndCreateUserHandler,
    googleOauthHandler 
} from '../controllers/authController';

const router = Router();

/**
 * @route   
 * @desc    
 * @access
 */
router.post('/request-otp', requestOtpHandler);

/**
 * @route   
 * @desc   
 * @access 
 */
router.post('/verify-otp', verifyOtpAndCreateUserHandler);

/**
 * @route 
 * @desc   
 * @access 
 */
router.post('/google', googleOauthHandler);


export default router;
