import express, { type Express } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import interviewRoutes from './routes/interview';
import adminRoutes from './routes/admin';
import userRoutes from './routes/user';
import jobRoutes from './routes/jobs';

export const app: Express = express();

app.use(cors({
  origin: [process.env.CORS_ORIGIN1 || "", process.env.CORS_ORIGIN2 || "",'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.get('/hello', (_req, res) => {
  res.send('Hello World!');
});

// Auth routes
app.use('/api/auth', authRoutes);

// Interview routes
app.use('/api/interview', interviewRoutes);

// Admin routes (Basic Auth protected)
app.use('/api/admin', adminRoutes);

// User routes (resume, profile)
app.use('/api/user', userRoutes);

// Jobs routes
app.use('/api/jobs', jobRoutes);
