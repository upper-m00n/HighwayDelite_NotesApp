import { Schema, model, Document } from 'mongoose';


export interface IUser extends Document {
  name: string;
  email: string;
  authMethod: 'email' | 'google';
  googleId?: string; 
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'User name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true, 
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.'],
  },
  authMethod: {
    type: String,
    enum: ['email', 'google'],
    required: true,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, 
  },
}, {
  timestamps: true,
});

const User = model<IUser>('User', userSchema);

export default User;
