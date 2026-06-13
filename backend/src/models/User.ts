import { Schema, model, models, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  password: string; // hashed password (bcrypt) or placeholder for Google-only users
  allowAI: boolean;
  username: string;
  resumeGcsKey?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true }, // we will store a hash or placeholder
    allowAI: { type: Boolean, default: false },
    username: { type: String, required: true, unique: true, trim: true },
    resumeGcsKey: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

// Ensure model is not overwritten during hot reloads in development
export const User = models.User || model<IUser>('User', UserSchema);
export default User;