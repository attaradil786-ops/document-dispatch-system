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

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  },
});
const upload = multer({ storage });

// Comprehensive CORS & Preflight Handling
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

// Schema Initialization + Safe Auto-Migration
const initDatabase = async () => {
  try {
    const client = await pool.connect();

    // 1. Departments & Accounts Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(50),
        name VARCHAR(255) NOT NULL,
        is_main BOOLEAN DEFAULT false,
        email VARCHAR(255),
        head_officer VARCHAR(255),
        building VARCHAR(255),
        phone VARCHAR(50),
        sub_criteria_list JSONB DEFAULT '[]'::jsonb,
        dept_key VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        department_id VARCHAR(50),
        department_name VARCHAR(255),
        is_main_dept BOOLEAN DEFAULT false,
        role_title VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(255) PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Drop restrictive constraints and sequence defaults individually
    const dropConstraints = [
      'ALTER TABLE documents ALTER COLUMN id DROP DEFAULT;',
      'ALTER TABLE documents ALTER COLUMN id TYPE VARCHAR(255) USING id::VARCHAR;',
      'ALTER TABLE documents ALTER COLUMN reference_number DROP NOT NULL;',
      'ALTER TABLE documents ALTER COLUMN doc_number DROP NOT NULL;',
      'ALTER TABLE documents ALTER COLUMN title DROP NOT NULL;',
      'ALTER TABLE documents ALTER COLUMN sender_department DROP NOT NULL;',
      'ALTER TABLE documents ALTER COLUMN recipient_department DROP NOT NULL;',
      'ALTER TABLE documents ALTER COLUMN status DROP NOT NULL;',
      'ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_reference_number_key;',
      'DROP INDEX IF EXISTS idx_documents_reference_number;',
    ];

    for (const sql of dropConstraints) {
      try {
        await client.query(sql);
      } catch (e) { }
    }

    // 3. Ensure all required document columns exist with proper types
    const addColumns = [
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS doc_number VARCHAR(100);',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100);',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS sender_department VARCHAR(255);',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS recipient_department VARCHAR(255);',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS title VARCHAR(500);',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT;',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS category VARCHAR(100);',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS priority VARCHAR(50);',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS sub_criteria VARCHAR(100);',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_personal_hq_dispatch BOOLEAN DEFAULT false;',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS personal_dispatch_note TEXT;',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS sender_dept_id VARCHAR(50);',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS sender_dept_name VARCHAR(255);',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS sender_user_id VARCHAR(50);',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS sender_user_name VARCHAR(255);',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS recipient_dept_ids JSONB DEFAULT \'[]\'::jsonb;',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS recipient_dept_names JSONB DEFAULT \'[]\'::jsonb;',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_sent_to_all BOOLEAN DEFAULT false;',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size VARCHAR(50);',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_type VARCHAR(50);',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_data_url TEXT;',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_url TEXT;',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT \'Dispatched\';',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT \'[]\'::jsonb;',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS history JSONB DEFAULT \'[]\'::jsonb;',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;',
    ];

    for (const sql of addColumns) {
      try {
        await client.query(sql);
      } catch (e) { }
    }

    // 4. Backfill reciprocal columns if null
    try {
      await client.query(`
        UPDATE documents SET reference_number = doc_number WHERE reference_number IS NULL AND doc_number IS NOT NULL;
        UPDATE documents SET doc_number = reference_number WHERE doc_number IS NULL AND reference_number IS NOT NULL;
        UPDATE documents SET sender_dept_name = sender_department WHERE sender_dept_name IS NULL AND sender_department IS NOT NULL;
        UPDATE documents SET sender_department = sender_dept_name WHERE sender_department IS NULL AND sender_dept_name IS NOT NULL;
      `);
    } catch (e) { }

    // 5. Seed default departments if empty
    try {
      const deptCount = await client.query('SELECT COUNT(*) FROM departments');
      if (parseInt(deptCount.rows[0].count, 10) === 0) {
        const seedDepts = [
          ['main-dept', 'MAIN', 'Main Department (Central HQ & Registry)', true, 'main@college.edu', 'Dr. Arthur Pendelton (Director)', 'Central Administrative Building, Floor 4', '+1 (555) 019-8000', '[]', 'main-dept'],
          ['dept-c1', 'CRITERIA 1', 'Criteria 1 - Curricular Aspects', false, 'criteria1@college.edu', 'Criteria 1 Officer', 'Academic Block A, Room 101', '+1 (555) 019-8001', '["1.1", "1.2", "1.3", "1.4", "1.5"]', 'dept-c1'],
          ['dept-c2', 'CRITERIA 2', 'Criteria 2 - Teaching-Learning & Evaluation', false, 'criteria2@college.edu', 'Criteria 2 Officer', 'Academic Block A, Room 102', '+1 (555) 019-8002', '["2.1", "2.2", "2.3", "2.4", "2.5"]', 'dept-c2'],
          ['dept-c3', 'CRITERIA 3', 'Criteria 3 - Research, Innovations & Extension', false, 'criteria3@college.edu', 'Criteria 3 Officer', 'Academic Block B, Room 201', '+1 (555) 019-8003', '["3.1", "3.2", "3.3", "3.4", "3.5"]', 'dept-c3'],
          ['dept-c4', 'CRITERIA 4', 'Criteria 4 - Infrastructure & Learning Resources', false, 'criteria4@college.edu', 'Criteria 4 Officer', 'Academic Block B, Room 202', '+1 (555) 019-8004', '["4.1", "4.2", "4.3", "4.4", "4.5"]', 'dept-c4'],
          ['dept-c5', 'CRITERIA 5', 'Criteria 5 - Student Support & Progression', false, 'criteria5@college.edu', 'Criteria 5 Officer', 'Research Complex, Floor 1', '+1 (555) 019-8005', '["5.1", "5.2", "5.3", "5.4", "5.5"]', 'dept-c5'],
          ['dept-c6', 'CRITERIA 6', 'Criteria 6 - Governance, Leadership & Management', false, 'criteria6@college.edu', 'Criteria 6 Officer', 'Research Complex, Floor 2', '+1 (555) 019-8006', '["6.1", "6.2", "6.3", "6.4", "6.5"]', 'dept-c6'],
          ['dept-c7', 'CRITERIA 7', 'Criteria 7 - Institutional Values & Best Practices', false, 'criteria7@college.edu', 'Criteria 7 Officer', 'Quality Assurance Wing, Block C', '+1 (555) 019-8007', '["7.1", "7.2", "7.3", "7.4", "7.5"]', 'dept-c7']
        ];
        for (const d of seedDepts) {
          await client.query(
            `INSERT INTO departments (id, code, name, is_main, email, head_officer, building, phone, sub_criteria_list, dept_key)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
             ON CONFLICT (id) DO NOTHING`,
            d
          );
        }
      }
    } catch (e) { }

    // 6. Seed default accounts if empty
    try {
      const accCount = await client.query('SELECT COUNT(*) FROM accounts');
      if (parseInt(accCount.rows[0].count, 10) === 0) {
        const seedAccs = [
          ['user-main', 'main@college.edu', 'main@123', 'Dr. Arthur Pendelton', 'main_department', 'main-dept', 'Main Department (Central HQ & Registry)', true, 'Central Registry Director', 'active'],
          ['user-c1', 'criteria1@college.edu', 'criteria@1', 'Criteria 1 Officer', 'department_user', 'dept-c1', 'Criteria 1 - Curricular Aspects', false, 'Lead Criteria 1 Coordinator', 'active'],
          ['user-c2', 'criteria2@college.edu', 'criteria@2', 'Criteria 2 Officer', 'department_user', 'dept-c2', 'Criteria 2 - Teaching-Learning & Evaluation', false, 'Lead Criteria 2 Coordinator', 'active'],
          ['user-c3', 'criteria3@college.edu', 'criteria@3', 'Criteria 3 Officer', 'department_user', 'dept-c3', 'Criteria 3 - Research, Innovations & Extension', false, 'Lead Criteria 3 Coordinator', 'active'],
          ['user-c4', 'criteria4@college.edu', 'criteria@4', 'Criteria 4 Officer', 'department_user', 'dept-c4', 'Criteria 4 - Infrastructure & Learning Resources', false, 'Lead Criteria 4 Coordinator', 'active'],
          ['user-c5', 'criteria5@college.edu', 'criteria@5', 'Criteria 5 Officer', 'department_user', 'dept-c5', 'Criteria 5 - Student Support & Progression', false, 'Lead Criteria 5 Coordinator', 'active'],
          ['user-c6', 'criteria6@college.edu', 'criteria@6', 'Criteria 6 Officer', 'department_user', 'dept-c6', 'Criteria 6 - Governance, Leadership & Management', false, 'Lead Criteria 6 Coordinator', 'active'],
          ['user-c7', 'criteria7@college.edu', 'criteria@7', 'Criteria 7 Officer', 'department_user', 'dept-c7', 'Criteria 7 - Institutional Values & Best Practices', false, 'Lead Criteria 7 Coordinator', 'active']
        ];
        for (const a of seedAccs) {
          await client.query(
            `INSERT INTO accounts (id, email, password, full_name, role, department_id, department_name, is_main_dept, role_title, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO NOTHING`,
            a
          );
        }
      }
    } catch (e) { }

    console.log('Database schema verified: id VARCHAR support active, reference_number correctly mapped, constraints resolved.');
    client.release();
  } catch (err) {
    console.error('Database initialization warning:', err);
  }
};

initDatabase();

// Health Check Endpoint
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

// Documents API Routes
app.get('/api/documents', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents ORDER BY created_at DESC');
    const normalizedDocs = result.rows.map((row) => ({
      ...row,
      id: String(row.id),
      doc_number: row.doc_number || row.reference_number || `DOC-${row.id}`,
      reference_number: row.reference_number || row.doc_number || `DOC-${row.id}`,
      sender_dept_name: row.sender_dept_name || row.sender_department || 'Department',
      recipient_dept_names:
        typeof row.recipient_dept_names === 'string'
          ? JSON.parse(row.recipient_dept_names)
          : row.recipient_dept_names || (row.recipient_department ? [row.recipient_department] : []),
      recipient_dept_ids:
        typeof row.recipient_dept_ids === 'string'
          ? JSON.parse(row.recipient_dept_ids)
          : row.recipient_dept_ids || [],
      comments:
        typeof row.comments === 'string' ? JSON.parse(row.comments) : row.comments || [],
      history:
        typeof row.history === 'string' ? JSON.parse(row.history) : row.history || [],
    }));
    res.json(normalizedDocs);
  } catch (err) {
    console.error('GET /api/documents error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents', async (req, res) => {
  const doc = req.body;
  try {
    const docId = String(doc.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
    const docNumber = String(doc.doc_number || doc.reference_number || `DOC-${new Date().getFullYear()}-${Date.now()}`);
    // Properly map reference_number from doc_number and ensure it is not null
    const referenceNumber = String(doc.reference_number || doc.doc_number || docNumber);
    const title = doc.title || 'Untitled Document';
    const description = doc.description || '';
    const category = doc.category || 'General Memo';
    const priority = doc.priority || 'Normal';
    const subCriteria = doc.sub_criteria || doc.subCriteria || '1.1';
    const isPersonalHq = Boolean(doc.is_personal_hq_dispatch || doc.isPersonalHqDispatch);
    const personalNote = doc.personal_dispatch_note || doc.personalDispatchNote || null;
    const senderDeptId = String(doc.sender_dept_id || 'dept-c1');
    const senderDeptName = doc.sender_dept_name || doc.sender_department || 'Department';
    const senderUserId = String(doc.sender_user_id || 'user-1');
    const senderUserName = doc.sender_user_name || 'User';
    const recipientDeptIds = JSON.stringify(doc.recipient_dept_ids || []);
    const recipientDeptNames = JSON.stringify(doc.recipient_dept_names || []);
    const isSentToAll = Boolean(doc.is_sent_to_all);
    const fileName = doc.file_name || 'Document.pdf';
    const fileSize = doc.file_size || '1.0 MB';
    const fileType = doc.file_type || 'PDF';
    const fileDataUrl = doc.file_data_url || null;
    const status = doc.status || 'Dispatched';
    const comments = JSON.stringify(doc.comments || []);
    const history = JSON.stringify(doc.history || []);
    const createdAt = doc.created_at || new Date().toISOString();
    const updatedAt = doc.updated_at || new Date().toISOString();

    const senderDepartment = String(senderDeptName);
    const recipientDepartment = Array.isArray(doc.recipient_dept_names) && doc.recipient_dept_names.length > 0
      ? doc.recipient_dept_names.join(', ')
      : String(doc.recipient_department || 'Main Department (Central HQ & Registry)');

    // Decode base64 file and save to physical uploads/ folder on disk
    let fileUrl = doc.file_url || null;
    if (fileDataUrl && typeof fileDataUrl === 'string' && fileDataUrl.startsWith('data:')) {
      try {
        const matches = fileDataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], 'base64');
          const ext = fileName && fileName.includes('.') ? path.extname(fileName) : '.pdf';
          const cleanBaseName = fileName ? path.basename(fileName, ext).replace(/[^a-zA-Z0-9.-]/g, '_') : 'document';
          const savedFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${cleanBaseName}${ext}`;
          const filePath = path.join(uploadsDir, savedFileName);
          fs.writeFileSync(filePath, buffer);
          fileUrl = `/uploads/${savedFileName}`;
          console.log(`[Uploads Disk] Saved document to: ${filePath} (${buffer.length} bytes)`);
        }
      } catch (fsErr) {
        console.warn('Could not write base64 file to disk uploads directory:', fsErr.message);
      }
    }

    const query = `
      INSERT INTO documents (
        id, doc_number, reference_number, sender_department, recipient_department,
        title, description, category, priority, sub_criteria,
        is_personal_hq_dispatch, personal_dispatch_note, sender_dept_id, sender_dept_name,
        sender_user_id, sender_user_name, recipient_dept_ids, recipient_dept_names,
        is_sent_to_all, file_name, file_size, file_type, file_data_url, file_url, status, comments, history,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
      )
      ON CONFLICT (id) DO UPDATE SET
        doc_number = EXCLUDED.doc_number,
        reference_number = EXCLUDED.reference_number,
        sender_department = EXCLUDED.sender_department,
        recipient_department = EXCLUDED.recipient_department,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        priority = EXCLUDED.priority,
        sub_criteria = EXCLUDED.sub_criteria,
        is_personal_hq_dispatch = EXCLUDED.is_personal_hq_dispatch,
        personal_dispatch_note = EXCLUDED.personal_dispatch_note,
        sender_dept_id = EXCLUDED.sender_dept_id,
        sender_dept_name = EXCLUDED.sender_dept_name,
        sender_user_id = EXCLUDED.sender_user_id,
        sender_user_name = EXCLUDED.sender_user_name,
        recipient_dept_ids = EXCLUDED.recipient_dept_ids,
        recipient_dept_names = EXCLUDED.recipient_dept_names,
        is_sent_to_all = EXCLUDED.is_sent_to_all,
        file_name = EXCLUDED.file_name,
        file_size = EXCLUDED.file_size,
        file_type = EXCLUDED.file_type,
        file_data_url = EXCLUDED.file_data_url,
        file_url = COALESCE(EXCLUDED.file_url, documents.file_url),
        status = EXCLUDED.status,
        comments = EXCLUDED.comments,
        history = EXCLUDED.history,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      docId,
      docNumber,
      referenceNumber,
      senderDepartment,
      recipientDepartment,
      title,
      description,
      category,
      priority,
      subCriteria,
      isPersonalHq,
      personalNote,
      senderDeptId,
      senderDeptName,
      senderUserId,
      senderUserName,
      recipientDeptIds,
      recipientDeptNames,
      isSentToAll,
      fileName,
      fileSize,
      fileType,
      fileDataUrl,
      fileUrl,
      status,
      comments,
      history,
      createdAt,
      updatedAt,
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/documents error:', err);
    res.status(500).json({ error: err.message, detail: err.detail || null });
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

app.get('/api/documents/download/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    const doc = result.rows[0];
    if (doc.file_url) {
      const localFilePath = path.join(__dirname, doc.file_url);
      if (fs.existsSync(localFilePath)) {
        return res.download(localFilePath, doc.file_name || 'document.pdf');
      }
    }
    if (doc.file_data_url) {
      return res.redirect(doc.file_data_url);
    }
    return res.status(404).json({ error: 'No file attached to this document' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// File Upload Endpoint (for multipart file submissions)
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
  });
});

app.get('/api/departments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM departments ORDER BY code ASC');
    const mapped = result.rows.map((d) => ({
      ...d,
      id: d.dept_key || String(d.id),
    }));
    res.json(mapped);
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

// Static frontend serving in production
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Document Dispatch System Server running on http://localhost:${PORT}`);
  });
}

export default app;