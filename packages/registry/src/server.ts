import { serve } from '@hono/node-server';
import { app } from './index';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3000;

serve({
  fetch: app.fetch,
  port: Number(port)
}, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});