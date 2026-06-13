import dotenv from 'dotenv';
dotenv.config({ path: './environments/.env' });

import { app } from './app';
import mongoose from 'mongoose';

const port = Number(process.env.PORT ?? 3000);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URL || '')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err: any) => console.error('MongoDB connection error:', err));

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
