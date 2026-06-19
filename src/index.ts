import express from 'express';
import dotenv from 'dotenv';
import { getSummary, getBreakdown } from './controllers/revenue.controller';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Metrics Endpoints
app.get('/api/revenue/summary', getSummary);
app.get('/api/revenue/breakdown', getBreakdown);

app.listen(PORT, () => {
  console.log(`[Server] Running cleanly on http://localhost:${PORT}`);
});