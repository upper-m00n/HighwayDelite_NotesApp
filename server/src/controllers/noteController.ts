import { Request, Response } from 'express';
import { Note } from '../models/Note';
import { IUser } from '../models/User';
import { authenticateToken } from '../middleware/auth';

export const createNote = async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    const user = req.user as IUser;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    if (title.length > 100) {
      return res.status(400).json({ error: 'Title must be less than 100 characters' });
    }

    if (content.length > 5000) {
      return res.status(400).json({ error: 'Content must be less than 5000 characters' });
    }

    const note = new Note({
      title,
      content,
      userId: user._id
    });

    await note.save();

    res.status(201).json({
      message: 'Note created successfully',
      note: {
        id: note._id,
        title: note.title,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt
      }
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getNotes = async (req: Request, res: Response) => {
  try {
    const user = req.user as IUser;
    const notes = await Note.find({ userId: user._id })
      .sort({ updatedAt: -1 })
      .select('-userId');

    res.json({
      notes: notes.map(note => ({
        id: note._id,
        title: note.title,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const user = req.user as IUser;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    if (title.length > 100) {
      return res.status(400).json({ error: 'Title must be less than 100 characters' });
    }

    if (content.length > 5000) {
      return res.status(400).json({ error: 'Content must be less than 5000 characters' });
    }

    const note = await Note.findOneAndUpdate(
      { _id: id, userId: user._id },
      { title, content },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({
      message: 'Note updated successfully',
      note: {
        id: note._id,
        title: note.title,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt
      }
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as IUser;

    const note = await Note.findOneAndDelete({ _id: id, userId: user._id });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};