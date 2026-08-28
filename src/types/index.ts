export type Role = 'main_department' | 'department_user';

export interface Department {
  id: string;
  code: string; // e.g. 'MAIN', 'CRITERIA 1'
  name: string;
  is_main: boolean;
  email: string;
  head_officer: string;
  building: string;
  phone: string;
  created_at: string;
  sub_criteria_list?: string[]; // e.g. ['1.1', '1.2', '1.3', '1.4', '1.5']
}

export interface UserAccount {
  id: string;
  email: string;
  password?: string;
  full_name: string;
  role: Role;
  department_id: string;
  department_name: string;
  is_main_dept: boolean;
  role_title: string; // e.g. "Director of Central Registry", "HOD Computer Science"
  avatar_url?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export type DocumentCategory =
  | 'Work Report'
  | 'Audit & Finance'
  | 'Policy & Circular'
  | 'Project Request'
  | 'HR & Staffing'
  | 'Academic Record'
  | 'General Memo';

export type DocumentPriority = 'Normal' | 'Urgent' | 'Confidential';

export type DocumentStatus =
  | 'Dispatched'
  | 'Under Review'
  | 'Action Taken'
  | 'Approved'
  | 'Revision Requested'
  | 'Archived';

export interface DocumentComment {
  id: string;
  doc_id: string;
  sender_dept_id: string;
  sender_dept_name: string;
  author_name: string;
  message: string;
  attachment_url?: string;
  created_at: string;
}

export interface DocumentHistoryEvent {
  id: string;
  doc_id: string;
  action: string;
  performed_by: string;
  dept_name: string;
  timestamp: string;
}

export interface DocumentItem {
  id: string;
  doc_number: string; // e.g. 'DOC-2026-MAIN-001'
  title: string;
  description: string;
  category: DocumentCategory;
  priority: DocumentPriority;
  sub_criteria?: string; // e.g. '1.1', '1.2', '2.1', etc.
  is_personal_hq_dispatch?: boolean;
  personal_dispatch_note?: string;
  sender_dept_id: string;
  sender_dept_name: string;
  sender_user_id: string;
  sender_user_name: string;
  recipient_dept_ids: string[]; // ['main-dept'] or ['dept-cs', 'dept-me'] or ['all']
  recipient_dept_names: string[];
  is_sent_to_all: boolean;
  file_name: string;
  file_size: string;
  file_type: string; // 'PDF' | 'DOCX' | 'XLSX' | 'PNG' | 'ZIP'
  file_data_url?: string;
  file_url?: string;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
  comments: DocumentComment[];
  history: DocumentHistoryEvent[];
}

export interface SecurityAuditResult {
  test_name: string;
  user_dept: string;
  target_dept: string;
  attempted_action: string;
  expected_outcome: 'Allowed' | 'Blocked (Isolated)';
  actual_outcome: 'Allowed' | 'Blocked (Isolated)';
  passed: boolean;
  message: string;
}

export interface DispatchStats {
  totalDispatched: number;
  receivedCount: number;
  pendingCount: number;
  approvedCount: number;
  urgentCount: number;
  confidentialCount: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'notice' | 'system' | 'assignment';
  is_read: boolean;
  created_at: string;
}
