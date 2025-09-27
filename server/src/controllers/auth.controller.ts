import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/user.model';
import { signJwt } from '../utils/jwt.utils';
import { sendOtpEmail, otpStore } from '../services/email.service';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
if (!googleClientId) {
  console.error("FATAL ERROR: GOOGLE_CLIENT_ID is not defined in the .env file.");
  process.exit(1);
}

const googleClient = new OAuth2Client(googleClientId);

export const requestOtpHandler = async (req: Request, res: Response) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ message: 'Name and email are required.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); 
    const expires = Date.now() + 10 * 60 * 1000; 

    otpStore[email] = { otp, expires, name };

    await sendOtpEmail(email, otp);

    res.status(200).json({ message: 'OTP sent to your email successfully.' });
  } catch (error) {
    console.error('Error in requestOtpHandler:', error);
    res.status(500).json({ message: 'Failed to send OTP. Please try again later.' });
  }
};


export const verifyOtpAndCreateUserHandler = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  const storedOtpData = otpStore[email];

  if (!storedOtpData) {
    return res.status(400).json({ message: 'OTP not requested for this email or has expired.' });
  }

  if (Date.now() > storedOtpData.expires) {
    delete otpStore[email];
    return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
  }

  if (storedOtpData.otp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP.' });
  }

  try {
    const newUser = await User.create({
      name: storedOtpData.name,
      email,
      authMethod: 'email',
    });

    const token = signJwt({ userId: newUser._id, name: newUser.name });
    
    delete otpStore[email];

    res.status(201).json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email } });
  } catch (error) {
    console.error('Error in verifyOtpAndCreateUserHandler:', error);
    res.status(500).json({ message: 'Error creating user. Please try again.' });
  }
};


export const googleOauthHandler = async (req: Request, res: Response) => {
    const { credential } = req.body; 

    if (!credential) {
        return res.status(400).json({ message: 'Google credential is required.' });
    }

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: googleClientId, 
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email || !payload.name) {
            return res.status(400).json({ message: 'Invalid Google token payload.' });
        }

        let user = await User.findOne({ email: payload.email });

        if (!user) {
            user = await User.create({
                name: payload.name,
                email: payload.email,
                googleId: payload.sub,
                authMethod: 'google',
            });
        } else {
            if (user.authMethod === 'email' && !user.googleId) {
                user.googleId = payload.sub;
                user.authMethod = 'google';
                await user.save();
            } else if (user.authMethod === 'email') {
                return res.status(409).json({ message: 'An account with this email already exists. Please log in with your original method.' });
            }
        }
        
        const token = signJwt({ userId: user._id, name: user.name });

        res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });

    } catch (error) {
        console.error('Google OAuth Error:', error);
        res.status(500).json({ message: 'Google authentication failed.' });
    }
};

