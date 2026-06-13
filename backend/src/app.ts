import express, { type Express } from 'express';

export const app: Express = express();

app.get('/hello', (_req, res) => {
  res.send('Hello World!');
});
