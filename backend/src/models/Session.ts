import { Schema, model, models, Document, Types } from 'mongoose';

export interface ISession extends Document {
  userId: Types.ObjectId;
  question: string;
  videoUrl: string;
  transcript: string;
  feedback: string;
  goals: string[];
  overallScore: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    question:     { type: String, default: '' },
    videoUrl:     { type: String, required: true },
    transcript:   { type: String, default: '' },
    feedback:     { type: String, default: '' },
    goals:        { type: [String], default: [] },
    overallScore: { type: Number, default: null },
  },
  { timestamps: true }
);

export const Session = models.Session || model<ISession>('Session', SessionSchema);
export default Session;
