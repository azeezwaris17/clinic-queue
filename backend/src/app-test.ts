// backend/src/app-test.ts - npx ts-node app-test.ts
import express from 'express';

const app = express();
const PORT = 5000;

app.use(express.json());

app.get('/api/health', (_req, res) => {
  console.log('✅ Health check called!');
  res.json({ status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(`🚀 Ultra-simple server on port ${PORT}`);
});