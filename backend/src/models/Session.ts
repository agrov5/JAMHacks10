import { Schema, model, models, Document, Types } from 'mongoose';

export interface ISession extends Document {
  userId: Types.ObjectId;
  videoUrl: string;
  transcript: string;
  goals: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    videoUrl:   { type: String, required: true },
    transcript: { type: String, default: '' },
    goals:      { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Session = models.Session || model<ISession>('Session', SessionSchema);
export default Session;
