-- ====================================================================
-- COLLEGE DEPARTMENT MIS - SUPABASE POSTGRESQL SCHEMA WITH RLS
-- ====================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  head_faculty_id UUID,
  building VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  established_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PROFILES TABLE (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'hod', 'faculty', 'student')),
  department_id UUID REFERENCES public.departments(id),
  avatar_url TEXT,
  phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Helper function for RLS to get current user's department_id
CREATE OR REPLACE FUNCTION public.current_department_id()
RETURNS UUID AS $$
  SELECT department_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function for RLS to get current user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. FACULTY TABLE
CREATE TABLE IF NOT EXISTS public.faculty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  faculty_id_code VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  photo_url TEXT,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  qualification VARCHAR(255),
  designation VARCHAR(100),
  experience_years INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Active',
  joining_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for head_faculty_id on departments
ALTER TABLE public.departments
  ADD CONSTRAINT fk_head_faculty
  FOREIGN KEY (head_faculty_id)
  REFERENCES public.faculty(id)
  ON DELETE SET NULL;

-- 4. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  roll_number VARCHAR(50) UNIQUE NOT NULL,
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  photo_url TEXT,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 8),
  section VARCHAR(10) NOT NULL,
  gender VARCHAR(20),
  dob DATE,
  address TEXT,
  parent_name VARCHAR(255),
  parent_phone VARCHAR(50),
  admission_year INTEGER,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  degree VARCHAR(50) NOT NULL,
  total_semesters INTEGER DEFAULT 8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  credits INTEGER NOT NULL DEFAULT 3,
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  type VARCHAR(50) DEFAULT 'Theory',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  section VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. MARKS TABLE
CREATE TABLE IF NOT EXISTS public.marks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  internal NUMERIC(5,2) DEFAULT 0,
  practical NUMERIC(5,2) DEFAULT 0,
  mid_sem NUMERIC(5,2) DEFAULT 0,
  end_sem NUMERIC(5,2) DEFAULT 0,
  total_marks NUMERIC(5,2) GENERATED ALWAYS AS (internal + practical + mid_sem + end_sem) STORED,
  percentage NUMERIC(5,2),
  grade VARCHAR(5),
  gpa NUMERIC(4,2),
  academic_year VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TIMETABLE TABLE
CREATE TABLE IF NOT EXISTS public.timetables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  section VARCHAR(10) NOT NULL,
  day_of_week VARCHAR(20) NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE CASCADE,
  room_number VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. NOTICES TABLE
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE, -- NULL or 'all' for college-wide
  published_by VARCHAR(255) NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_college_wide BOOLEAN DEFAULT FALSE,
  attachment_url TEXT,
  attachment_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location VARCHAR(255),
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  is_college_wide BOOLEAN DEFAULT FALSE,
  organizer VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL,
  section VARCHAR(10) NOT NULL,
  due_date DATE NOT NULL,
  total_points INTEGER DEFAULT 100,
  attachment_url TEXT,
  attachment_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_url TEXT,
  file_name VARCHAR(255),
  comments TEXT,
  marks_obtained NUMERIC(5,2),
  grade VARCHAR(10),
  status VARCHAR(20) DEFAULT 'submitted'
);

-- 14. FEES TABLE
CREATE TABLE IF NOT EXISTS public.fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  fee_type VARCHAR(100) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Paid', 'Pending', 'Overdue')),
  transaction_id VARCHAR(100),
  payment_method VARCHAR(50),
  semester INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. LEAVE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_id UUID NOT NULL,
  applicant_name VARCHAR(255) NOT NULL,
  applicant_type VARCHAR(20) NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  leave_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  approved_by VARCHAR(255),
  applied_at DATE DEFAULT CURRENT_DATE
);

-- 16. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_dept ON public.profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_students_dept ON public.students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_sem_sec ON public.students(semester, section);
CREATE INDEX IF NOT EXISTS idx_faculty_dept ON public.faculty(department_id);
CREATE INDEX IF NOT EXISTS idx_courses_dept ON public.courses(department_id);
CREATE INDEX IF NOT EXISTS idx_subjects_dept ON public.subjects(department_id);
CREATE INDEX IF NOT EXISTS idx_attendance_dept ON public.attendance(department_id);
CREATE INDEX IF NOT EXISTS idx_attendance_stud ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_dept ON public.marks(department_id);
CREATE INDEX IF NOT EXISTS idx_marks_stud ON public.marks(student_id);
CREATE INDEX IF NOT EXISTS idx_notices_dept ON public.notices(department_id);
CREATE INDEX IF NOT EXISTS idx_events_dept ON public.events(department_id);
CREATE INDEX IF NOT EXISTS idx_fees_dept ON public.fees(department_id);
CREATE INDEX IF NOT EXISTS idx_leave_dept ON public.leave_requests(department_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES RLS
CREATE POLICY "Super Admin full access profiles" ON public.profiles
  FOR ALL USING (current_user_role() = 'super_admin');

CREATE POLICY "Users read own profile or dept profiles" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR department_id = current_department_id()
  );

-- 2. STUDENTS RLS
CREATE POLICY "Super Admin full access students" ON public.students
  FOR ALL USING (current_user_role() = 'super_admin');

CREATE POLICY "HOD full access dept students" ON public.students
  FOR ALL USING (
    current_user_role() = 'hod' AND department_id = current_department_id()
  );

CREATE POLICY "Faculty view dept students" ON public.students
  FOR SELECT USING (
    current_user_role() = 'faculty' AND department_id = current_department_id()
  );

CREATE POLICY "Student view own profile" ON public.students
  FOR SELECT USING (
    current_user_role() = 'student' AND (user_id = auth.uid() OR id::text = auth.uid()::text)
  );

-- 3. FACULTY RLS
CREATE POLICY "Super Admin full access faculty" ON public.faculty
  FOR ALL USING (current_user_role() = 'super_admin');

CREATE POLICY "HOD manage dept faculty" ON public.faculty
  FOR ALL USING (
    current_user_role() = 'hod' AND department_id = current_department_id()
  );

CREATE POLICY "Users view dept faculty" ON public.faculty
  FOR SELECT USING (
    department_id = current_department_id()
  );

-- 4. ATTENDANCE & MARKS RLS
CREATE POLICY "Super Admin full access attendance" ON public.attendance FOR ALL USING (current_user_role() = 'super_admin');
CREATE POLICY "HOD read dept attendance" ON public.attendance FOR SELECT USING (current_user_role() = 'hod' AND department_id = current_department_id());
CREATE POLICY "Faculty manage assigned attendance" ON public.attendance FOR ALL USING (current_user_role() = 'faculty' AND department_id = current_department_id());
CREATE POLICY "Student view own attendance" ON public.attendance FOR SELECT USING (current_user_role() = 'student' AND student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Super Admin full access marks" ON public.marks FOR ALL USING (current_user_role() = 'super_admin');
CREATE POLICY "HOD read dept marks" ON public.marks FOR SELECT USING (current_user_role() = 'hod' AND department_id = current_department_id());
CREATE POLICY "Faculty manage marks" ON public.marks FOR ALL USING (current_user_role() = 'faculty' AND department_id = current_department_id());
CREATE POLICY "Student view own marks" ON public.marks FOR SELECT USING (current_user_role() = 'student' AND student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- 5. NOTICES & EVENTS RLS
CREATE POLICY "Read notices department scoped or college wide" ON public.notices
  FOR SELECT USING (
    current_user_role() = 'super_admin' OR
    is_college_wide = TRUE OR
    department_id = current_department_id()
  );

CREATE POLICY "HOD publish dept notice" ON public.notices
  FOR INSERT WITH CHECK (
    current_user_role() = 'hod' AND department_id = current_department_id()
  );

CREATE POLICY "Admin publish notice" ON public.notices
  FOR ALL USING (current_user_role() = 'super_admin');
