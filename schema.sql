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

-- 3. DOCUMENTS TABLE (Primary key is id)
CREATE TABLE IF NOT EXISTS public.documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  reference_number VARCHAR(100),
  sender_department VARCHAR(255),
  recipient_department VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Dispatched',
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
