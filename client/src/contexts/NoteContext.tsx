import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface NoteContextType {
  notes: Note[];
  createNote: (title: string, content: string) => Promise<void>;
  updateNote: (id: string, title: string, content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  loading: boolean;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export const useNotes = () => {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NoteProvider');
  }
  return context;
};

interface NoteProviderProps {
  children: ReactNode;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const NoteProvider: React.FC<NoteProviderProps> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const fetchNotes = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(response.data.notes);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [token]);

  const createNote = async (title: string, content: string) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/notes`,
        { title, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotes(prev => [response.data.note, ...prev]);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create note');
    }
  };

  const updateNote = async (id: string, title: string, content: string) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/notes/${id}`,
        { title, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotes(prev => prev.map(note => 
        note.id === id ? response.data.note : note
      ));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update note');
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete note');
    }
  };

  const value: NoteContextType = {
    notes,
    createNote,
    updateNote,
    deleteNote,
    loading
  };

  return <NoteContext.Provider value={value}>{children}</NoteContext.Provider>;
};
