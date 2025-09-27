import express from 'express';
import { register, verifyOTP, login, getProfile } from '../controllers/authController';
import { createNote, getNotes, updateNote, deleteNote } from '../controllers/noteController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);

// Note routes
router.post('/notes', authenticateToken, createNote);
router.get('/notes', authenticateToken, getNotes);
router.put('/notes/:id', authenticateToken, updateNote);
router.delete('/notes/:id', authenticateToken, deleteNote);

export default router;
