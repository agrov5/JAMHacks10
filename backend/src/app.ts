import express, { type Express } from 'express';

export const app: Express = express();

app.get('/', (_req, res) => {
  res.send('Hello World');
});
