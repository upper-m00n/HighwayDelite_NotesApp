import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Mailjet from 'node-mailjet';
import { IUser, User } from '../models/user.model';

const generateOTP = (): string => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
  const apiKey = process.env.MAILJET_API_KEY;
  const apiSecret = process.env.MAILJET_API_SECRET;
  const from = process.env.EMAIL_FROM;
  if (!apiKey) throw new Error('MAILJET_API_KEY is not set');
  if (!apiSecret) throw new Error('MAILJET_API_SECRET is not set');
  if (!from) throw new Error('EMAIL_FROM is not set');

  const mj = new Mailjet({ apiKey, apiSecret });
  const res = await mj
    .post('send', { version: 'v3.1' })
    .request({
      Messages: [
        {
          From: { Email: from, Name: 'HighwayDelite' },
          To: [{ Email: email }],
          Subject: 'OTP Verification',
          HTMLPart: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">OTP Verification</h2>
              <p>Your OTP is:</p>
              <h1 style="color: #007bff; font-size: 32px; text-align: center; margin: 20px 0;">${otp}</h1>
              <p>This OTP will expire in 10 minutes.</p>
            </div>
          `,
        },
      ],
    });

  if (res.response.status !== 200) {
    throw new Error(`Mailjet error: ${res.response.status} ${res.response.statusText}`);
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, name, dob } = req.body;
    if (!email || !name) return res.status(400).json({ error: 'Email and name are required' });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const otp = generateOTP();
    const user = new User({ email, name, otp, otpExpires: new Date(Date.now() + 10 * 60 * 1000), dob });
    await user.save();
    await sendOTPEmail(email, otp);
    return res.status(201).json({ message: 'User registered. Check email for OTP.', userId: user._id });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ error: 'User already verified' });
    if (user.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    if (user.otpExpires && user.otpExpires < new Date()) return res.status(400).json({ error: 'OTP expired' });
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    return res.json({
      message: 'Email verified successfully',
      token,
      user: { id: user._id, email: user.email, name: user.name, isVerified: user.isVerified }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    if (!user.password) return res.status(400).json({ error: 'Please use Google login' });
    if (!user.isVerified) return res.status(400).json({ error: 'Please verify your email first' });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    return res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email, name: user.name, isVerified: user.isVerified }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    res.json({ user: { id: user._id, email: user.email, name: user.name, isVerified: user.isVerified } });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const loginWithOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });
    if (!user.isVerified) return res.status(400).json({ error: 'Please verify your email first' });
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendOTPEmail(email, otp);
    return res.json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('Login OTP error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyLoginOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });
    if (!user.isVerified) return res.status(400).json({ error: 'Please verify your email first' });
    if (user.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    if (user.otpExpires && user.otpExpires < new Date()) return res.status(400).json({ error: 'OTP expired' });
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    return res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email, name: user.name, isVerified: user.isVerified }
    });
  } catch (error) {
    console.error('Verify login OTP error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};