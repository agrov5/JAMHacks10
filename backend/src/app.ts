import express, { type Express } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';

export const app: Express = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.get('/hello', (_req, res) => {
  res.send('Hello World!');
});

// Auth routes
app.use('/api/auth', authRoutes);
