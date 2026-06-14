import dotenv from 'dotenv';
dotenv.config({ path: './environments/.env' });

import { app } from './app';
import mongoose from 'mongoose';
import cron from 'node-cron';
import https from 'https';

const port = Number(process.env.PORT ?? 3000);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URL || '')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err: any) => console.error('MongoDB connection error:', err));

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Ping Render every 10 minutes to prevent cold starts
cron.schedule('*/10 * * * *', () => {
  https.get('https://jamhacks10.onrender.com', (res) => {
    console.log(`Keep-alive ping: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error('Keep-alive ping failed:', err.message);
  });
});
