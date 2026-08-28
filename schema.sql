-- ====================================================================
-- INTER-DEPARTMENT DOCUMENT DISPATCH SYSTEM - POSTGRESQL SCHEMA (DDL)
-- Database: dispatch_db
-- ====================================================================

-- 1. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  department_type VARCHAR(100) DEFAULT 'academic',
  parent_id INTEGER,
  is_main BOOLEAN DEFAULT FALSE,
  email VARCHAR(255),
  head_officer VARCHAR(255),
  building VARCHAR(255),
  phone VARCHAR(50),
  sub_criteria_list JSONB DEFAULT '[]'::jsonb,
  dept_key VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns and relaxed constraints exist on departments if table was pre-existing
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS is_main BOOLEAN DEFAULT FALSE;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS head_officer VARCHAR(255);
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS building VARCHAR(255);
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS sub_criteria_list JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS dept_key VARCHAR(50);
ALTER TABLE public.departments ALTER COLUMN department_type DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_dept_key ON public.departments(dept_key);

-- 2. ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.accounts (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('main_department', 'department_user')),
  department_id VARCHAR(50),
  department_name VARCHAR(255) NOT NULL,
  is_main_dept BOOLEAN DEFAULT FALSE,
  role_title VARCHAR(255),
  avatar_url TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.documents (
  id SERIAL PRIMARY KEY,
  doc_id VARCHAR(50),
  doc_number VARCHAR(100),
  reference_number VARCHAR(100),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'Work Report',
  priority VARCHAR(50) DEFAULT 'Normal',
  sub_criteria VARCHAR(100),
  is_personal_hq_dispatch BOOLEAN DEFAULT FALSE,
  personal_dispatch_note TEXT,
  sender_department VARCHAR(255),
  sender_dept_id VARCHAR(50),
  sender_dept_name VARCHAR(255),
  sender_user_id VARCHAR(50),
  sender_user_name VARCHAR(255),
  recipient_department VARCHAR(255),
  recipient_dept_ids JSONB DEFAULT '[]'::jsonb,
  recipient_dept_names JSONB DEFAULT '[]'::jsonb,
  is_sent_to_all BOOLEAN DEFAULT FALSE,
  file_name VARCHAR(255),
  file_size VARCHAR(50),
  file_type VARCHAR(50),
  file_data_url TEXT,
  file_url TEXT,
  status VARCHAR(50) DEFAULT 'Dispatched',
  comments JSONB DEFAULT '[]'::jsonb,
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on documents if table was pre-existing
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS doc_id VARCHAR(50);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS doc_number VARCHAR(100);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Work Report';
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'Normal';
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS sub_criteria VARCHAR(100);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS is_personal_hq_dispatch BOOLEAN DEFAULT FALSE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS personal_dispatch_note TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS sender_department VARCHAR(255);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS sender_dept_id VARCHAR(50);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS sender_dept_name VARCHAR(255);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS sender_user_id VARCHAR(50);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS sender_user_name VARCHAR(255);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS recipient_department VARCHAR(255);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS recipient_dept_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS recipient_dept_names JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS is_sent_to_all BOOLEAN DEFAULT FALSE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_size VARCHAR(50);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_type VARCHAR(50);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_data_url TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Dispatched';
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_doc_id ON public.documents(doc_id);

-- 4. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  performed_by VARCHAR(255) NOT NULL,
  department_id VARCHAR(50),
  department_name VARCHAR(255),
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_accounts_email ON public.accounts(email);

-- ====================================================================
-- INITIAL SEED DATA
-- ====================================================================

-- Seed Departments
INSERT INTO public.departments (dept_key, code, name, department_type, is_main, email, head_officer, building, phone, sub_criteria_list)
VALUES 
  ('main-dept', 'MAIN', 'Main Department (Central HQ & Registry)', 'administrative', TRUE, 'main@college.edu', 'Dr. Arthur Pendelton (Director)', 'Central Administrative Building, Floor 4', '+1 (555) 019-8000', '[]'::jsonb),
  ('dept-c1', 'CRITERIA 1', 'Criteria 1 - Curricular Aspects', 'academic', FALSE, 'criteria1@college.edu', 'Criteria 1 Officer', 'Academic Block A, Room 101', '+1 (555) 019-8001', '["1.1", "1.2", "1.3", "1.4", "1.5"]'::jsonb),
  ('dept-c2', 'CRITERIA 2', 'Criteria 2 - Teaching-Learning & Evaluation', 'academic', FALSE, 'criteria2@college.edu', 'Criteria 2 Officer', 'Academic Block A, Room 102', '+1 (555) 019-8002', '["2.1", "2.2", "2.3", "2.4", "2.5"]'::jsonb),
  ('dept-c3', 'CRITERIA 3', 'Criteria 3 - Research, Innovations & Extension', 'academic', FALSE, 'criteria3@college.edu', 'Criteria 3 Officer', 'Academic Block B, Room 201', '+1 (555) 019-8003', '["3.1", "3.2", "3.3", "3.4", "3.5"]'::jsonb),
  ('dept-c4', 'CRITERIA 4', 'Criteria 4 - Infrastructure & Learning Resources', 'academic', FALSE, 'criteria4@college.edu', 'Criteria 4 Officer', 'Academic Block B, Room 202', '+1 (555) 019-8004', '["4.1", "4.2", "4.3", "4.4", "4.5"]'::jsonb),
  ('dept-c5', 'CRITERIA 5', 'Criteria 5 - Student Support & Progression', 'academic', FALSE, 'criteria5@college.edu', 'Criteria 5 Officer', 'Research Complex, Floor 1', '+1 (555) 019-8005', '["5.1", "5.2", "5.3", "5.4", "5.5"]'::jsonb),
  ('dept-c6', 'CRITERIA 6', 'Criteria 6 - Governance, Leadership & Management', 'academic', FALSE, 'criteria6@college.edu', 'Criteria 6 Officer', 'Research Complex, Floor 2', '+1 (555) 019-8006', '["6.1", "6.2", "6.3", "6.4", "6.5"]'::jsonb),
  ('dept-c7', 'CRITERIA 7', 'Criteria 7 - Institutional Values & Best Practices', 'academic', FALSE, 'criteria7@college.edu', 'Criteria 7 Officer', 'Quality Assurance Wing, Block C', '+1 (555) 019-8007', '["7.1", "7.2", "7.3", "7.4", "7.5"]'::jsonb)
ON CONFLICT (dept_key) DO UPDATE SET
  name = EXCLUDED.name,
  head_officer = EXCLUDED.head_officer,
  sub_criteria_list = EXCLUDED.sub_criteria_list;

-- Seed Accounts
INSERT INTO public.accounts (id, email, password, full_name, role, department_id, department_name, is_main_dept, role_title, status)
VALUES
  ('user-main', 'main@college.edu', 'main@123', 'Dr. Arthur Pendelton', 'main_department', 'main-dept', 'Main Department (Central HQ & Registry)', TRUE, 'Central Registry Director', 'active'),
  ('user-c1', 'criteria1@college.edu', 'criteria@1', 'Criteria 1 Officer', 'department_user', 'dept-c1', 'Criteria 1 - Curricular Aspects', FALSE, 'Lead Criteria 1 Coordinator', 'active'),
  ('user-c2', 'criteria2@college.edu', 'criteria@2', 'Criteria 2 Officer', 'department_user', 'dept-c2', 'Criteria 2 - Teaching-Learning & Evaluation', FALSE, 'Lead Criteria 2 Coordinator', 'active'),
  ('user-c3', 'criteria3@college.edu', 'criteria@3', 'Criteria 3 Officer', 'department_user', 'dept-c3', 'Criteria 3 - Research, Innovations & Extension', FALSE, 'Lead Criteria 3 Coordinator', 'active'),
  ('user-c4', 'criteria4@college.edu', 'criteria@4', 'Criteria 4 Officer', 'department_user', 'dept-c4', 'Criteria 4 - Infrastructure & Learning Resources', FALSE, 'Lead Criteria 4 Coordinator', 'active'),
  ('user-c5', 'criteria5@college.edu', 'criteria@5', 'Criteria 5 Officer', 'department_user', 'dept-c5', 'Criteria 5 - Student Support & Progression', FALSE, 'Lead Criteria 5 Coordinator', 'active'),
  ('user-c6', 'criteria6@college.edu', 'criteria@6', 'Criteria 6 Officer', 'department_user', 'dept-c6', 'Criteria 6 - Governance, Leadership & Management', FALSE, 'Lead Criteria 6 Coordinator', 'active'),
  ('user-c7', 'criteria7@college.edu', 'criteria@7', 'Criteria 7 Officer', 'department_user', 'dept-c7', 'Criteria 7 - Institutional Values & Best Practices', FALSE, 'Lead Criteria 7 Coordinator', 'active')
ON CONFLICT (id) DO UPDATE SET
  password = EXCLUDED.password,
  full_name = EXCLUDED.full_name,
  department_name = EXCLUDED.department_name;

-- Seed Sample Documents
INSERT INTO public.documents (
  doc_id, doc_number, reference_number, title, description, category, priority, sub_criteria,
  sender_department, sender_dept_id, sender_dept_name, sender_user_id, sender_user_name,
  recipient_department, recipient_dept_ids, recipient_dept_names, is_sent_to_all,
  file_name, file_size, file_type, status, comments, history, created_at, updated_at
)
VALUES
  (
    'doc-001',
    'DOC-2026-MAIN-001',
    'REF-2026-HQ-001',
    'Annual Academic Quality & Resource Planning Directive 2026-27',
    'Official institutional circular requesting all department leads to submit consolidated academic reports and infrastructure requests for the upcoming academic year.',
    'Policy & Circular',
    'Urgent',
    '1.1',
    'Main Department (Central HQ & Registry)',
    'main-dept',
    'Main Department (Central HQ & Registry)',
    'user-main',
    'Dr. Arthur Pendelton',
    'All Sub-Departments',
    '["all"]'::jsonb,
    '["All Sub-Departments"]'::jsonb,
    TRUE,
    'Annual_Planning_Directive_2026.pdf',
    '2.4 MB',
    'PDF',
    'Dispatched',
    '[{"id":"c-1","doc_id":"doc-001","sender_dept_id":"main-dept","sender_dept_name":"Main Department","author_name":"Dr. Arthur Pendelton","message":"Please submit work reports by end of month.","created_at":"2026-08-01T09:05:00Z"}]'::jsonb,
    '[{"id":"h-1","doc_id":"doc-001","action":"Document Broadcast to All Departments","performed_by":"Dr. Arthur Pendelton","dept_name":"Main Department","timestamp":"2026-08-01 09:00 AM"}]'::jsonb,
    '2026-08-01T09:00:00Z',
    '2026-08-01T09:00:00Z'
  ),
  (
    'doc-002',
    'DOC-2026-C1-004',
    'REF-2026-C1-004',
    'Criteria 1 Curriculum Design & Feedback Analysis Dossier',
    'Consolidated feedback report from academic stakeholders, syllabus revision recommendations, and outcome mapping for Criteria 1.',
    'Work Report',
    'Normal',
    '1.2',
    'Criteria 1 - Curricular Aspects',
    'dept-c1',
    'Criteria 1 - Curricular Aspects',
    'user-c1',
    'Criteria 1 Officer',
    'Main Department (Central HQ & Registry)',
    '["main-dept"]'::jsonb,
    '["Main Department (Central HQ & Registry)"]'::jsonb,
    FALSE,
    'Criteria1_Curriculum_Dossier.pdf',
    '4.8 MB',
    'PDF',
    'Approved',
    '[{"id":"c-2","doc_id":"doc-002","sender_dept_id":"dept-c1","sender_dept_name":"Criteria 1","author_name":"Criteria 1 Officer","message":"Submitting Criteria 1 work progress report.","created_at":"2026-08-05T11:32:00Z"},{"id":"c-3","doc_id":"doc-002","sender_dept_id":"main-dept","sender_dept_name":"Main Department","author_name":"Dr. Arthur Pendelton","message":"Work report approved. Documentation verified.","created_at":"2026-08-06T14:20:00Z"}]'::jsonb,
    '[{"id":"h-2","doc_id":"doc-002","action":"Work Document Uploaded & Sent to Main Department","performed_by":"Criteria 1 Officer","dept_name":"Criteria 1","timestamp":"2026-08-05 11:30 AM"},{"id":"h-3","doc_id":"doc-002","action":"Reviewed and Approved by Main Department","performed_by":"Dr. Arthur Pendelton","dept_name":"Main Department","timestamp":"2026-08-06 02:20 PM"}]'::jsonb,
    '2026-08-05T11:30:00Z',
    '2026-08-06T14:20:00Z'
  )
ON CONFLICT (doc_id) DO NOTHING;
