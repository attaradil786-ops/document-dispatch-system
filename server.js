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
  console.log('📁 Local SSD storage directory initialized at:', uploadsDir);
}

// Multer Disk Storage Configuration for local ./uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// CORS Configuration for local, Vercel, Cloudflare tunnels, and external origins
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Content-Disposition');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control', 'Pragma'],
  credentials: false,
}));
app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static serving for local uploads directory
app.use('/uploads', express.static(uploadsDir));

// PostgreSQL Connection Pool Setup
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'dispatch_db',
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT) || 5432,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    };

export const pool = new Pool(poolConfig);

// Helper function to normalize document rows for frontend consumption
function normalizeDocumentRow(row) {
  if (!row) return null;
  const docId = row.doc_id || String(row.id);
  const docNumber = row.doc_number || row.reference_number || `DOC-2026-${String(row.id).padStart(3, '0')}`;
  
  let recipientDeptIds = [];
  try {
    recipientDeptIds = typeof row.recipient_dept_ids === 'string' ? JSON.parse(row.recipient_dept_ids) : (row.recipient_dept_ids || []);
  } catch {
    recipientDeptIds = row.recipient_department ? [row.recipient_department] : ['main-dept'];
  }

  let recipientDeptNames = [];
  try {
    recipientDeptNames = typeof row.recipient_dept_names === 'string' ? JSON.parse(row.recipient_dept_names) : (row.recipient_dept_names || []);
  } catch {
    recipientDeptNames = row.recipient_department ? [row.recipient_department] : ['Main Department (Central HQ & Registry)'];
  }

  let comments = [];
  try {
    comments = typeof row.comments === 'string' ? JSON.parse(row.comments) : (row.comments || []);
  } catch {
    comments = [];
  }

  let history = [];
  try {
    history = typeof row.history === 'string' ? JSON.parse(row.history) : (row.history || []);
  } catch {
    history = [];
  }

  return {
    ...row,
    id: docId,
    doc_id: docId,
    doc_number: docNumber,
    reference_number: row.reference_number || docNumber,
    sender_department: row.sender_department || row.sender_dept_name || 'Department',
    sender_dept_id: row.sender_dept_id || 'dept-c1',
    sender_dept_name: row.sender_dept_name || row.sender_department || 'Department',
    sender_user_id: row.sender_user_id || 'user-1',
    sender_user_name: row.sender_user_name || 'Department Officer',
    recipient_dept_ids: recipientDeptIds,
    recipient_dept_names: recipientDeptNames,
    recipient_department: row.recipient_department || (recipientDeptNames[0] || 'Main Department'),
    category: row.category || 'Work Report',
    priority: row.priority || 'Normal',
    status: row.status || 'Dispatched',
    file_name: row.file_name || 'Document.pdf',
    file_size: row.file_size || '1.2 MB',
    file_type: row.file_type || 'PDF',
    file_url: row.file_url || (row.file_data_url ? `/api/documents/download/${docId}` : undefined),
    comments,
    history,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || row.created_at || new Date().toISOString(),
  };
}

// Auto-initialize DB schema and seeds if needed
export async function initDatabase() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const ddl = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(ddl);
      console.log('✅ Database schema verified and connected successfully.');
    }
  } catch (err) {
    console.warn('⚠️ Database auto-initialization notice:', err.message);
  }
}

initDatabase();

// ==========================================
// API ROUTES
// ==========================================

// Dedicated Health-Check Endpoint (Verifies PostgreSQL connection & returns status: "connected")
app.get('/api/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, current_database(), current_user');
    res.status(200).json({
      status: 'connected',
      database: 'PostgreSQL',
      timestamp: new Date(),
      db_name: result.rows[0]?.current_database || 'dispatch_db',
      user: result.rows[0]?.current_user || 'postgres',
    });
  } catch (err) {
    res.status(200).json({
      status: 'disconnected',
      database: 'PostgreSQL',
      timestamp: new Date(),
      error: err.message,
    });
  }
});

// Database Status
app.get('/api/db-status', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, current_database(), current_user, version()');
    res.status(200).json({
      ok: true,
      status: 'connected',
      connected: true,
      database: result.rows[0].current_database,
      user: result.rows[0].current_user,
      serverTime: result.rows[0].current_time,
      version: result.rows[0].version,
    });
  } catch (err) {
    res.status(200).json({
      ok: false,
      status: 'disconnected',
      connected: false,
      error: err.message,
    });
  }
});

// File Upload Endpoint (Direct to local ./uploads on SSD)
app.post('/api/documents/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      const { file_name, file_data_url } = req.body;
      if (file_data_url && file_name) {
        const base64Data = file_data_url.replace(/^data:.*?;base64,/, '');
        const safeName = `${Date.now()}_${file_name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const destPath = path.join(uploadsDir, safeName);
        fs.writeFileSync(destPath, Buffer.from(base64Data, 'base64'));
        return res.json({
          ok: true,
          fileName: file_name,
          savedFileName: safeName,
          fileUrl: `/uploads/${safeName}`,
          downloadUrl: `/api/documents/download/${encodeURIComponent(safeName)}`,
          size: fs.statSync(destPath).size,
        });
      }
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
      ok: true,
      fileName: req.file.originalname,
      savedFileName: req.file.filename,
      fileUrl: `/uploads/${req.file.filename}`,
      downloadUrl: `/api/documents/download/${encodeURIComponent(req.file.filename)}`,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (err) {
    console.error('File upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Alias for general file upload
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({
    ok: true,
    fileName: req.file.originalname,
    savedFileName: req.file.filename,
    fileUrl: `/uploads/${req.file.filename}`,
    downloadUrl: `/api/documents/download/${encodeURIComponent(req.file.filename)}`,
    size: req.file.size,
  });
});

// File Download Endpoint (Reads directly from local ./uploads on SSD)
app.get(['/api/documents/download/:id', '/api/documents/:id/download'], async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Check if id is a direct filename in ./uploads
    const directFilePath = path.join(uploadsDir, path.basename(id));
    if (fs.existsSync(directFilePath) && fs.statSync(directFilePath).isFile()) {
      return res.download(directFilePath);
    }

    // 2. Query document from DB
    const docRes = await pool.query(
      'SELECT * FROM documents WHERE id::text = $1 OR doc_id = $1 LIMIT 1',
      [id]
    );

    if (docRes.rows.length > 0) {
      const doc = docRes.rows[0];

      if (doc.file_url) {
        const localName = path.basename(doc.file_url);
        const localPath = path.join(uploadsDir, localName);
        if (fs.existsSync(localPath)) {
          return res.download(localPath, doc.file_name || localName);
        }
      }

      if (doc.file_data_url) {
        const base64Data = doc.file_data_url.replace(/^data:.*?;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        res.setHeader('Content-Disposition', `attachment; filename="${doc.file_name || 'document.pdf'}"`);
        res.setHeader('Content-Type', doc.file_type === 'PDF' ? 'application/pdf' : 'application/octet-stream');
        return res.send(buffer);
      }
    }

    res.status(404).json({ error: 'File not found on local storage' });
  } catch (err) {
    console.error('File download error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 1. Departments API
app.get('/api/departments', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM departments ORDER BY is_main DESC, id ASC');
    const normalized = result.rows.map(d => ({
      ...d,
      id: d.dept_key || String(d.id),
      sub_criteria_list: typeof d.sub_criteria_list === 'string' ? JSON.parse(d.sub_criteria_list) : (d.sub_criteria_list || []),
    }));
    res.json(normalized);
  } catch (err) {
    console.error('Error fetching departments:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. Accounts API
app.get('/api/accounts', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM accounts ORDER BY is_main_dept DESC, id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching accounts:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. GET all documents (sorted by created_at DESC)
app.get('/api/documents', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents ORDER BY created_at DESC');
    const normalized = result.rows.map(normalizeDocumentRow);
    res.json(normalized);
  } catch (err) {
    console.error('Error fetching documents:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 4. GET a single document by ID
app.get('/api/documents/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM documents WHERE id::text = $1 OR doc_id = $1 LIMIT 1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(normalizeDocumentRow(result.rows[0]));
  } catch (err) {
    console.error('Error fetching document:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 5. POST - Create / Dispatch a new document
app.post('/api/documents', async (req, res) => {
  const {
    id,
    doc_id,
    doc_number,
    reference_number,
    title,
    description = '',
    category = 'Work Report',
    priority = 'Normal',
    sub_criteria = '',
    is_personal_hq_dispatch = false,
    personal_dispatch_note = '',
    sender_department,
    sender_dept_id,
    sender_dept_name,
    sender_user_id,
    sender_user_name,
    recipient_department,
    recipient_dept_ids = [],
    recipient_dept_names = [],
    is_sent_to_all = false,
    file_name = 'Document.pdf',
    file_size = '1.2 MB',
    file_type = 'PDF',
    file_data_url,
    file_url,
    status = 'Dispatched',
    comments = [],
    history = [],
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const effectiveDocId = doc_id || id || `doc-${Date.now()}`;
  const effectiveSenderDept = sender_department || sender_dept_name || 'Department';
  const effectiveRecipientDept = recipient_department || (recipient_dept_names[0] || 'Main Department');
  const effectiveRefNum = reference_number || doc_number || `REF-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  // Save file to local ./uploads directory if base64 payload provided
  let effectiveFileUrl = file_url;
  if (file_data_url && (!effectiveFileUrl || !effectiveFileUrl.startsWith('/uploads'))) {
    try {
      const base64Data = file_data_url.replace(/^data:.*?;base64,/, '');
      const safeName = `${Date.now()}_${(file_name || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const destPath = path.join(uploadsDir, safeName);
      fs.writeFileSync(destPath, Buffer.from(base64Data, 'base64'));
      effectiveFileUrl = `/uploads/${safeName}`;
    } catch (err) {
      console.warn('Could not cache file to ./uploads SSD directory:', err.message);
    }
  }

  try {
    const query = `
      INSERT INTO documents (
        doc_id, doc_number, reference_number, title, description, category, priority, sub_criteria,
        is_personal_hq_dispatch, personal_dispatch_note,
        sender_department, sender_dept_id, sender_dept_name, sender_user_id, sender_user_name,
        recipient_department, recipient_dept_ids, recipient_dept_names, is_sent_to_all,
        file_name, file_size, file_type, file_data_url, file_url,
        status, comments, history, created_at, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18, $19,
        $20, $21, $22, $23, $24,
        $25, $26, $27, NOW(), NOW()
      )
      RETURNING *;
    `;

    const values = [
      effectiveDocId,
      effectiveRefNum,
      effectiveRefNum,
      title,
      description,
      category,
      priority,
      sub_criteria,
      is_personal_hq_dispatch,
      personal_dispatch_note,
      effectiveSenderDept,
      sender_dept_id || 'dept-c1',
      effectiveSenderDept,
      sender_user_id || 'user-1',
      sender_user_name || 'Officer',
      effectiveRecipientDept,
      JSON.stringify(recipient_dept_ids),
      JSON.stringify(recipient_dept_names),
      is_sent_to_all,
      file_name,
      file_size,
      file_type,
      file_data_url,
      effectiveFileUrl,
      status,
      JSON.stringify(comments),
      JSON.stringify(history),
    ];

    const result = await pool.query(query, values);
    res.status(201).json(normalizeDocumentRow(result.rows[0]));
  } catch (err) {
    console.error('Error creating document:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 6. PATCH - Update document status
app.patch('/api/documents/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, remark, user_name, dept_name, sender_dept_id } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status field is required' });
  }

  try {
    const docRes = await pool.query(
      'SELECT * FROM documents WHERE id::text = $1 OR doc_id = $1 LIMIT 1',
      [id]
    );
    if (docRes.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const currentDoc = docRes.rows[0];
    const comments = Array.isArray(currentDoc.comments) ? currentDoc.comments : JSON.parse(currentDoc.comments || '[]');
    const history = Array.isArray(currentDoc.history) ? currentDoc.history : JSON.parse(currentDoc.history || '[]');

    history.unshift({
      id: `hist-${Date.now()}`,
      doc_id: currentDoc.doc_id || String(currentDoc.id),
      action: `Status updated to "${status}"${remark ? `: ${remark}` : ''}`,
      performed_by: user_name || 'Authorized Officer',
      dept_name: dept_name || 'Main Department',
      timestamp: new Date().toLocaleString(),
    });

    if (remark) {
      comments.push({
        id: `comment-${Date.now()}`,
        doc_id: currentDoc.doc_id || String(currentDoc.id),
        sender_dept_id: sender_dept_id || 'main-dept',
        sender_dept_name: dept_name || 'Main Department',
        author_name: user_name || 'Authorized Officer',
        message: `Status set to ${status}. Note: ${remark}`,
        created_at: new Date().toISOString(),
      });
    }

    const updateQuery = `
      UPDATE documents 
      SET status = $1, comments = $2, history = $3, updated_at = NOW()
      WHERE id::text = $4 OR doc_id = $4
      RETURNING *;
    `;

    const result = await pool.query(updateQuery, [
      status,
      JSON.stringify(comments),
      JSON.stringify(history),
      id,
    ]);

    res.json(normalizeDocumentRow(result.rows[0]));
  } catch (err) {
    console.error('Error updating status:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 7. POST - Add Comment to document
app.post('/api/documents/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { message, author_name, sender_dept_id, sender_dept_name } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const docRes = await pool.query(
      'SELECT * FROM documents WHERE id::text = $1 OR doc_id = $1 LIMIT 1',
      [id]
    );
    if (docRes.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const currentDoc = docRes.rows[0];
    const comments = Array.isArray(currentDoc.comments) ? currentDoc.comments : JSON.parse(currentDoc.comments || '[]');

    comments.push({
      id: `comment-${Date.now()}`,
      doc_id: currentDoc.doc_id || String(currentDoc.id),
      sender_dept_id: sender_dept_id || 'dept',
      sender_dept_name: sender_dept_name || 'Department',
      author_name: author_name || 'Officer',
      message,
      created_at: new Date().toISOString(),
    });

    const updateQuery = `
      UPDATE documents 
      SET comments = $1, updated_at = NOW()
      WHERE id::text = $2 OR doc_id = $2
      RETURNING *;
    `;

    const result = await pool.query(updateQuery, [JSON.stringify(comments), id]);
    res.json(normalizeDocumentRow(result.rows[0]));
  } catch (err) {
    console.error('Error adding comment:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 8. DELETE - Remove a document
app.delete('/api/documents/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM documents WHERE id::text = $1 OR doc_id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ message: 'Document deleted successfully', document: normalizeDocumentRow(result.rows[0]) });
  } catch (err) {
    console.error('Error deleting document:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 9. Audit Logs API
app.post('/api/audit-logs', async (req, res) => {
  const { action, performed_by, department_id, department_name, details } = req.body;
  try {
    const id = `audit-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO audit_logs (id, action, performed_by, department_id, department_name, details, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [id, action, performed_by, department_id, department_name, details]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Production Static Serving
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    index: false,
    maxAge: '1h',
    redirect: false,
  }));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || req.path.startsWith('/@') || req.path.includes('.')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ ok: false, message: 'Internal server error' });
});

// Start Server
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Document Dispatch System Server running on http://localhost:${PORT}`);
  });
}

export default app;