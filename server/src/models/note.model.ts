import { Schema, model, Document, Types } from 'mongoose';
import { IUser } from './user.model';

export interface INote extends Document {
  user: Types.ObjectId | IUser; 
  title: string;
  content: string;
}


const noteSchema = new Schema<INote>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Note content cannot be empty'],
    trim: true,
  },
}, {

  timestamps: true,
});

const Note = model<INote>('Note', noteSchema);

export default Note;
import mongoose, { Document, Schema } from 'mongoose';

export interface INote extends Document {
  title: string;
  content: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export const Note = mongoose.model<INote>('Note', NoteSchema);
