import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';
import multer from 'multer';

dotenv.config();

const { Pool } = pg;
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');
const uploadsDir = path.join(__dirname, 'uploads');
const PORT = process.env.PORT || 3000;

// Ensure local SSD storage directory (./uploads) is initialized
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer disk storage setup for local SSD file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  },
});
const upload = multer({ storage });

// Comprehensive CORS & Preflight Handling (Allows Ngrok and Vercel)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, ngrok-skip-browser-warning'
  );
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'ngrok-skip-browser-warning',
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(uploadsDir));

// PostgreSQL Database Connection Pool
const pool = process.env.DATABASE_URL
  ? new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  })
  : new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'adilattar@07',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'dispatch_db',
    ssl: false,
  });

// Database Schema Initialization
const initDatabase = async () => {
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        is_main BOOLEAN DEFAULT false,
        email VARCHAR(255),
        head_officer VARCHAR(255),
        building VARCHAR(255),
        phone VARCHAR(50),
        sub_criteria_list JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        department_id VARCHAR(50) REFERENCES departments(id),
        department_name VARCHAR(255),
        is_main_dept BOOLEAN DEFAULT false,
        role_title VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(100) PRIMARY KEY,
        doc_number VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        priority VARCHAR(50),
        sub_criteria VARCHAR(50),
        is_personal_hq_dispatch BOOLEAN DEFAULT false,
        personal_dispatch_note TEXT,
        sender_dept_id VARCHAR(50),
        sender_dept_name VARCHAR(255),
        sender_user_id VARCHAR(50),
        sender_user_name VARCHAR(255),
        recipient_dept_ids JSONB DEFAULT '[]'::jsonb,
        recipient_dept_names JSONB DEFAULT '[]'::jsonb,
        is_sent_to_all BOOLEAN DEFAULT false,
        file_name VARCHAR(255),
        file_size VARCHAR(50),
        file_type VARCHAR(50),
        file_data_url TEXT,
        status VARCHAR(50) DEFAULT 'Dispatched',
        comments JSONB DEFAULT '[]'::jsonb,
        history JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database schema verified and connected successfully.');
    client.release();
  } catch (err) {
    console.error('Database schema initialization error:', err);
  }
};

initDatabase();

// --- Health Check Endpoint ---
app.get(['/api/health', '/health'], async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'online',
      database: 'connected',
      timestamp: result.rows[0].now,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

// --- File Upload Route ---
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    fileName: req.file.originalname,
    fileSize: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
    fileType: req.file.mimetype,
    fileDataUrl: fileUrl,
  });
});

// --- Documents API Routes ---
app.get('/api/documents', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents', async (req, res) => {
  const doc = req.body;
  try {
    const query = `
      INSERT INTO documents (
        id, doc_number, title, description, category, priority, sub_criteria,
        is_personal_hq_dispatch, personal_dispatch_note, sender_dept_id, sender_dept_name,
        sender_user_id, sender_user_name, recipient_dept_ids, recipient_dept_names,
        is_sent_to_all, file_name, file_size, file_type, file_data_url, status, comments, history,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
      ) RETURNING *;
    `;
    const values = [
      doc.id,
      doc.doc_number,
      doc.title,
      doc.description,
      doc.category,
      doc.priority,
      doc.sub_criteria || null,
      doc.is_personal_hq_dispatch || false,
      doc.personal_dispatch_note || null,
      doc.sender_dept_id,
      doc.sender_dept_name,
      doc.sender_user_id,
      doc.sender_user_name,
      JSON.stringify(doc.recipient_dept_ids || []),
      JSON.stringify(doc.recipient_dept_names || []),
      doc.is_sent_to_all || false,
      doc.file_name,
      doc.file_size,
      doc.file_type,
      doc.file_data_url || null,
      doc.status || 'Dispatched',
      JSON.stringify(doc.comments || []),
      JSON.stringify(doc.history || []),
      doc.created_at || new Date().toISOString(),
      doc.updated_at || new Date().toISOString(),
    ];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/documents/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, remark, user_name, dept_name, sender_dept_id } = req.body;
  try {
    const docResult = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = docResult.rows[0];
    const history = typeof doc.history === 'string' ? JSON.parse(doc.history) : doc.history || [];
    const comments = typeof doc.comments === 'string' ? JSON.parse(doc.comments) : doc.comments || [];

    history.unshift({
      id: `hist-${Date.now()}`,
      doc_id: id,
      action: `Status updated to "${status}"${remark ? `: ${remark}` : ''}`,
      performed_by: user_name,
      dept_name: dept_name,
      timestamp: new Date().toLocaleString(),
    });

    if (remark) {
      comments.push({
        id: `comment-${Date.now()}`,
        doc_id: id,
        sender_dept_id: sender_dept_id,
        sender_dept_name: dept_name,
        author_name: user_name,
        message: `Status set to ${status}. Note: ${remark}`,
        created_at: new Date().toISOString(),
      });
    }

    const updateQuery = `
      UPDATE documents
      SET status = $1, history = $2, comments = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *;
    `;
    const updatedResult = await pool.query(updateQuery, [
      status,
      JSON.stringify(history),
      JSON.stringify(comments),
      id,
    ]);
    res.json(updatedResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { message, author_name, sender_dept_id, sender_dept_name } = req.body;
  try {
    const docResult = await pool.query('SELECT comments FROM documents WHERE id = $1', [id]);
    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const comments =
      typeof docResult.rows[0].comments === 'string'
        ? JSON.parse(docResult.rows[0].comments)
        : docResult.rows[0].comments || [];

    comments.push({
      id: `comment-${Date.now()}`,
      doc_id: id,
      sender_dept_id,
      sender_dept_name,
      author_name,
      message,
      created_at: new Date().toISOString(),
    });

    const updateQuery = `
      UPDATE documents
      SET comments = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;
    const updatedResult = await pool.query(updateQuery, [JSON.stringify(comments), id]);
    res.json(updatedResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/documents/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM documents WHERE id = $1', [id]);
    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Departments & Accounts Routes ---
app.get('/api/departments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM departments ORDER BY code ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/accounts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM accounts ORDER BY full_name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend build if dist folder exists
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Document Dispatch System Server running on http://localhost:${PORT}`);
});