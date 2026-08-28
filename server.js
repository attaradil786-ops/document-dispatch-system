import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');
const port = Number(process.env.PORT || 3000);

app.disable('x-powered-by');

app.use(express.static(distPath, {
  index: false,
  maxAge: '1h',
  redirect: false,
}));

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'inter-department-document-dispatch-system' });
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/@') || req.path.includes('.')) {
    return next();
  }

  res.sendFile(path.join(distPath, 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ ok: false, message: 'Internal server error' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Production server running on http://0.0.0.0:${port}`);
});
