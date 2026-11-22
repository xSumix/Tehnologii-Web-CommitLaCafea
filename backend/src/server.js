import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize, Request } from './db.js';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Aprobari Administrative si Conformitate API',
    packages: ['AUD', 'SEC'],
    timestamp: new Date().toISOString(),
  });
});

// Initial Requests list endpoint (paginated skeleton)
app.get('/api/requests', async (req, res) => {
  try {
    const requests = await Request.findAll();
    res.status(200).json({ data: requests, total: requests.length });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sync database and start server
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
});