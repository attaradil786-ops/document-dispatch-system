-- ====================================================================
-- COLLEGE DEPARTMENT MIS - MULTI-DEPARTMENT SEED DATA
-- ====================================================================

-- 1. SEED DEPARTMENTS
INSERT INTO public.departments (id, code, name, building, phone, email, established_year) VALUES
  ('11111111-1111-1111-1111-111111111111', 'CS', 'Computer Science & Engineering', 'Alan Turing Block', '+1 (555) 019-2831', 'cs.dept@college.edu', 1995),
  ('22222222-2222-2222-2222-222222222222', 'IT', 'Information Technology', 'Info Systems Hall', '+1 (555) 019-2832', 'it.dept@college.edu', 2001),
  ('33333333-3333-3333-3333-333333333333', 'ME', 'Mechanical Engineering', 'James Watt Complex', '+1 (555) 019-2833', 'me.dept@college.edu', 1988),
  ('44444444-4444-4444-4444-444444444444', 'CE', 'Civil Engineering', 'Sitaram Infrastructure Block', '+1 (555) 019-2834', 'ce.dept@college.edu', 1985),
  ('55555555-5555-5555-5555-555555555555', 'ECE', 'Electronics & Comm. Engineering', 'Tesla Microelectronics Lab', '+1 (555) 019-2835', 'ece.dept@college.edu', 1998),
  ('66666666-6666-6666-6666-666666666666', 'EEE', 'Electrical Engineering', 'Faraday High Voltage Lab', '+1 (555) 019-2836', 'eee.dept@college.edu', 1990)
ON CONFLICT (code) DO NOTHING;

-- 2. SEED COURSES
INSERT INTO public.courses (id, code, name, department_id, degree, total_semesters) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'BTECH-CS', 'B.Tech Computer Science & Engineering', '11111111-1111-1111-1111-111111111111', 'B.Tech', 8),
  ('c2222222-2222-2222-2222-222222222222', 'BTECH-ME', 'B.Tech Mechanical Engineering', '33333333-3333-3333-3333-333333333333', 'B.Tech', 8)
ON CONFLICT (code) DO NOTHING;

-- 3. SEED NOTICES
INSERT INTO public.notices (title, content, department_id, published_by, is_pinned, is_college_wide) VALUES
  ('Mid-Semester Examination Schedule - Fall 2026', 'The Mid-Semester examinations for Semesters 3, 5, and 7 will commence from August 25, 2026.', NULL, 'Dr. Eleanor Vance (Super Admin)', TRUE, TRUE),
  ('CS Department AI & Hackathon 2026', 'The Computer Science department is organizing the Annual 24-Hour AI & Hackathon on September 5th.', '11111111-1111-1111-1111-111111111111', 'Dr. Robert Langdon (CS HOD)', TRUE, FALSE),
  ('Mechanical Workshop Safety Protocols', 'All Sem 3 and Sem 5 Mechanical students must attend the compulsory Workshop Safety Briefing on Friday.', '33333333-3333-3333-3333-333333333333', 'Dr. Marcus Brody (Mechanical HOD)', FALSE, FALSE);

-- 4. SEED EVENTS
INSERT INTO public.events (title, description, event_type, start_date, end_date, location, department_id, is_college_wide, organizer) VALUES
  ('International Conference on Next-Gen Computing', 'A 2-day international symposium featuring keynote speakers.', 'Seminar', '2026-08-20', '2026-08-21', 'Main Auditorium', NULL, TRUE, 'Academic Affairs'),
  ('Cloud Infrastructure & Kubernetes Workshop', 'Technical workshop covering Docker containerization & K8s.', 'Workshop', '2026-08-15', '2026-08-15', 'CS Lab 301', '11111111-1111-1111-1111-111111111111', FALSE, 'CS Tech Club');
