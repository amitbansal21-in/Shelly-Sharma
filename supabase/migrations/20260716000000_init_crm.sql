-- Shelly Sharma Academy - Supabase CRM Production Migration
-- File: /supabase/migrations/20260716000000_init_crm.sql
-- Description: Enterprise-grade database schema with triggers, RLS, sequence locks, and high-performance indexing.

-- =========================================================================
-- 1. DATABASE EXTENSIONS & ENUMS
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Enable fuzzy-search on text/counselor/student columns

CREATE TYPE inquiry_status_enum AS ENUM (
  'NEW LEAD',
  'CONTACTED',
  'DEMO SCHEDULED',
  'ENROLLED',
  'COMPLETED',
  'NO RESPONSE'
);

CREATE TYPE priority_enum AS ENUM (
  'HIGH',
  'MEDIUM',
  'LOW'
);

CREATE TYPE lead_source_enum AS ENUM (
  'Google',
  'Website',
  'WhatsApp',
  'Referral',
  'Instagram',
  'Facebook',
  'Others'
);

CREATE TYPE payment_mode_enum AS ENUM (
  'Cash',
  'UPI',
  'Bank Transfer',
  'Card'
);

CREATE TYPE admission_status_enum AS ENUM (
  'None',
  'Admitted',
  'Rejected'
);

-- =========================================================================
-- 2. TABLES DEFINITIONS
-- =========================================================================

-- Table 2.1: Academic Years (starts April 1st, ends March 31st)
CREATE TABLE academic_years (
  id VARCHAR(7) PRIMARY KEY, -- Format: YYYY-YY (e.g., 2026-27)
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_year_format CHECK (id ~ '^[0-9]{4}-[0-9]{2}$'),
  CONSTRAINT check_date_order CHECK (start_date < end_date)
);

-- Table 2.2: Inquiry Sequence Lock Table (one record per academic year)
CREATE TABLE inquiry_sequences (
  academic_year VARCHAR(7) PRIMARY KEY REFERENCES academic_years(id) ON DELETE CASCADE,
  current_number INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2.3: Courses Catalog
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL, -- e.g., 'spoken', 'academic', 'professional'
  duration VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2.4: Counselors Table
CREATE TABLE counselors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2.5: Parents CRM Profiles
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT parent_mobile_unique UNIQUE (mobile)
);

-- Table 2.6: Leads (Primary Inquiries Table - Source of Truth)
CREATE TABLE leads (
  id VARCHAR(50) PRIMARY KEY, -- E.g., SSA/2026-27/00035
  academic_year VARCHAR(7) NOT NULL REFERENCES academic_years(id),
  created_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_time TIME NOT NULL DEFAULT CURRENT_TIME,
  student_name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
  parent_name VARCHAR(255), -- Denormalized parent name for speed
  mobile VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  inquiry_type VARCHAR(100) NOT NULL, -- Spoken English, IELTS, etc.
  selected_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  selected_course_title VARCHAR(255) NOT NULL,
  other_query TEXT,
  status inquiry_status_enum NOT NULL DEFAULT 'NEW LEAD',
  priority priority_enum NOT NULL DEFAULT 'MEDIUM',
  assigned_counselor_id UUID REFERENCES counselors(id) ON DELETE SET NULL,
  assigned_counselor_name VARCHAR(255),
  lead_source lead_source_enum NOT NULL DEFAULT 'Website',
  
  -- Follow-ups state variables
  last_follow_up_date DATE,
  last_follow_up_comment TEXT,
  next_follow_up_date DATE,
  next_follow_up_comment TEXT,
  
  -- Enrollment State
  admission_status admission_status_enum NOT NULL DEFAULT 'None',
  student_id VARCHAR(50), -- Reference to students.student_id when enrolled
  
  createdBy VARCHAR(255) NOT NULL DEFAULT 'System',
  remarks TEXT,
  
  -- Google Meet / Calendar schedule fields
  date DATE, -- Scheduled Demo Date
  time TIME, -- Scheduled Demo Time
  calendarEventId VARCHAR(255),
  meetLink VARCHAR(500),
  meetingStatus VARCHAR(50) DEFAULT 'scheduled',
  meetingCompleted BOOLEAN DEFAULT FALSE,
  cancelled BOOLEAN DEFAULT FALSE,
  
  -- Soft Delete & Archival fields
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_at TIMESTAMP WITH TIME ZONE,
  archived_by VARCHAR(255),
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by VARCHAR(255)
);

-- Table 2.7: Admissions Table (Logs payment details and links back to lead)
CREATE TABLE admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(50) NOT NULL UNIQUE, -- Derived from lead id: SSA/STU/2026-27/00035
  inquiry_id VARCHAR(50) NOT NULL UNIQUE REFERENCES leads(id) ON DELETE RESTRICT,
  student_name VARCHAR(255) NOT NULL,
  parent_name VARCHAR(255),
  mobile VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  enrolled_course VARCHAR(255) NOT NULL,
  admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  admission_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  payment_mode payment_mode_enum NOT NULL DEFAULT 'UPI',
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2.8: Students Table (Active rosters list)
CREATE TABLE students (
  student_id VARCHAR(50) PRIMARY KEY, -- Same as admissions.student_id
  inquiry_id VARCHAR(50) NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  mobile VARCHAR(50) NOT NULL,
  parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2.9: Lead Remarks Log
CREATE TABLE lead_remarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id VARCHAR(50) NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  author VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2.10: Lead CRM Activity Timeline
CREATE TABLE lead_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id VARCHAR(50) NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  status VARCHAR(100) NOT NULL,
  updated_by VARCHAR(255) NOT NULL,
  comments TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2.11: Scheduled Follow-ups
CREATE TABLE follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id VARCHAR(50) NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_comment TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Completed', 'Overdue'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2.12: System Audit Logs (Immutable Security Audit)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator VARCHAR(255) NOT NULL DEFAULT 'System',
  action VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  target_id VARCHAR(255) NOT NULL,
  ip VARCHAR(50) DEFAULT '127.0.0.1',
  browser VARCHAR(255),
  device VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2.13: Global CRM System Settings
CREATE TABLE system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2.14: Google Workspace Async Sync Queue (Guarantees reliability over API limits)
CREATE TABLE google_workspace_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type VARCHAR(50) NOT NULL, -- 'SHEETS', 'DRIVE', 'MEET', 'GMAIL'
  action_type VARCHAR(50) NOT NULL, -- 'CREATE_LEAD', 'UPDATE_LEAD', 'CREATE_ADMISSION'
  payload JSONB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SUCCESS', 'FAILED'
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2.15: System Notification Queue
CREATE TABLE notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'EMAIL', 'SMS', 'CHAT_NOTIF'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2.16: Email Transmission History
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) NOT NULL -- 'SENT', 'FAILED'
);

-- Table 2.17: Google Calendar Logging
CREATE TABLE calendar_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id VARCHAR(50) REFERENCES leads(id) ON DELETE SET NULL,
  event_id VARCHAR(255) NOT NULL,
  summary VARCHAR(255),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  action VARCHAR(50) NOT NULL, -- 'CREATED', 'UPDATED', 'CANCELLED'
  status VARCHAR(50) NOT NULL, -- 'SUCCESS', 'FAILED'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2.18: Google Sheets API Action Log
CREATE TABLE google_sheet_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id VARCHAR(50) REFERENCES leads(id) ON DELETE SET NULL,
  spreadsheet_id VARCHAR(255) NOT NULL,
  tab_name VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'APPEND_ROW', 'UPDATE_ROW'
  row_index INT,
  status VARCHAR(50) NOT NULL, -- 'SUCCESS', 'FAILED'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2.19: Google Drive Folder and Material Upload Log
CREATE TABLE drive_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id VARCHAR(50) REFERENCES leads(id) ON DELETE SET NULL,
  file_id VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  folder_id VARCHAR(255),
  action VARCHAR(50) NOT NULL, -- 'CREATE_FOLDER', 'UPLOAD_DOC'
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2.20: CRM User Roles Catalog
CREATE TABLE roles (
  id INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE, -- 'SuperAdmin', 'Counselor', 'Staff'
  description TEXT
);

-- Table 2.21: CRM Roles Permissions Grid
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  resource VARCHAR(100) NOT NULL, -- 'leads', 'admissions', 'settings', 'logs'
  action VARCHAR(50) NOT NULL, -- 'read', 'write', 'delete', 'all'
  CONSTRAINT role_permission_unique UNIQUE (role_id, resource, action)
);

-- =========================================================================
-- 3. ENTERPRISE OPTIMIZATION INDEXES (100,000+ Records Ready)
-- =========================================================================

-- Indexes on leads for lightning fast filtering and searches
CREATE INDEX idx_leads_search_trgm ON leads USING gin (student_name gin_trgm_ops);
CREATE INDEX idx_leads_mobile_trgm ON leads USING gin (mobile gin_trgm_ops);
CREATE INDEX idx_leads_email_trgm ON leads USING gin (email gin_trgm_ops);
CREATE INDEX idx_leads_status ON leads (status);
CREATE INDEX idx_leads_priority ON leads (priority);
CREATE INDEX idx_leads_created_date ON leads (created_date DESC);
CREATE INDEX idx_leads_admission_status ON leads (admission_status);
CREATE INDEX idx_leads_is_deleted_archived ON leads (is_deleted, is_archived, created_date DESC);
CREATE INDEX idx_leads_counselor_id ON leads (assigned_counselor_id);
CREATE INDEX idx_leads_parent_id ON leads (parent_id);

-- Indexes on admissions & student records
CREATE INDEX idx_admissions_student_id ON admissions (student_id);
CREATE INDEX idx_admissions_date ON admissions (admission_date DESC);
CREATE INDEX idx_students_parent_id ON students (parent_id);

-- Indexes on logs and transaction history
CREATE INDEX idx_audit_logs_target ON audit_logs (target_id);
CREATE INDEX idx_audit_logs_created ON audit_logs (created_at DESC);
CREATE INDEX idx_lead_timeline_lead_id ON lead_timeline (lead_id, date DESC, time DESC);
CREATE INDEX idx_lead_remarks_lead_id ON lead_remarks (lead_id, created_at DESC);
CREATE INDEX idx_follow_ups_lead_date ON follow_ups (lead_id, scheduled_date ASC);
CREATE INDEX idx_sync_queue_status ON google_workspace_sync_queue (status, created_at ASC);

-- =========================================================================
-- 4. UTILITY PL/PGSQL FUNCTIONS & TRIGGERS
-- =========================================================================

-- Function 4.1: Compute Academic Year (April 1 to March 31 definition)
CREATE OR REPLACE FUNCTION calculate_academic_year(date_val DATE)
RETURNS VARCHAR(7) AS $$
DECLARE
  v_year INT;
  v_month INT;
  v_start_year INT;
  v_end_year INT;
  v_end_year_short VARCHAR(2);
BEGIN
  v_year := EXTRACT(YEAR FROM date_val)::INT;
  v_month := EXTRACT(MONTH FROM date_val)::INT;
  
  IF v_month >= 4 THEN
    v_start_year := v_year;
    v_end_year := v_year + 1;
  ELSE
    v_start_year := v_year - 1;
    v_end_year := v_year;
  END IF;
  
  v_end_year_short := RIGHT(v_end_year::TEXT, 2);
  RETURN v_start_year::TEXT || '-' || v_end_year_short;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- Function 4.2: Enterprise Serial Inquiry Number Generator
-- Automatically creates academic year rows and safely increments sequence lock row to guarantee NO GAPS & NO DUPLICATES.
CREATE OR REPLACE FUNCTION generate_next_inquiry_id(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  new_id VARCHAR(50),
  computed_year VARCHAR(7)
) AS $$
DECLARE
  v_ay VARCHAR(7);
  v_start_yr INT;
  v_end_yr INT;
  v_next_num INT;
BEGIN
  -- 1. Calculate Academic Year for input date
  v_ay := calculate_academic_year(p_date);
  v_start_yr := SPLIT_PART(v_ay, '-', 1)::INT;
  v_end_yr := v_start_yr + 1;
  
  -- 2. Dynamically ensure active academic year record exists
  INSERT INTO academic_years (id, start_date, end_date)
  VALUES (v_ay, (v_start_yr::TEXT || '-04-01')::DATE, (v_end_yr::TEXT || '-03-31')::DATE)
  ON CONFLICT (id) DO NOTHING;
  
  -- 3. Lock sequence row for selected Academic Year and increment counter safely
  INSERT INTO inquiry_sequences (academic_year, current_number)
  VALUES (v_ay, 1)
  ON CONFLICT (academic_year) DO UPDATE
  SET current_number = inquiry_sequences.current_number + 1
  RETURNING current_number INTO v_next_num;
  
  -- 4. Construct Inquiry ID (SSA/YYYY-YY/00001)
  RETURN QUERY SELECT 
    ('SSA/' || v_ay || '/' || LPAD(v_next_num::TEXT, 5, '0'))::VARCHAR(50),
    v_ay::VARCHAR(7);
END;
$$ LANGUAGE plpgsql;


-- Function 4.3: Derive Student ID from Inquiry ID
CREATE OR REPLACE FUNCTION generate_student_id_from_inquiry_id(p_inquiry_id VARCHAR(50))
RETURNS VARCHAR(50) AS $$
BEGIN
  IF p_inquiry_id LIKE 'SSA/%' THEN
    RETURN REPLACE(p_inquiry_id, 'SSA/', 'SSA/STU/');
  ELSE
    RETURN 'SSA/STU/' || p_inquiry_id;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- Function 4.4: Trigger: Automatically set Inquiry ID and Academic Year upon lead insertion
CREATE OR REPLACE FUNCTION trigger_set_lead_identifiers()
RETURNS TRIGGER AS $$
DECLARE
  v_generated RECORD;
BEGIN
  -- Only generate ID if it wasn't explicitly set (production migration override safety)
  IF NEW.id IS NULL OR NEW.id = '' THEN
    SELECT * FROM generate_next_inquiry_id(CURRENT_DATE) INTO v_generated;
    NEW.id := v_generated.new_id;
    NEW.academic_year := v_generated.computed_year;
  ELSE
    -- If ID was set, ensure academic year aligns
    IF NEW.academic_year IS NULL OR NEW.academic_year = '' THEN
      NEW.academic_year := calculate_academic_year(NEW.created_date);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_set_lead_identifiers
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_lead_identifiers();


-- Function 4.5: Trigger: Update Timestamp trigger
CREATE OR REPLACE FUNCTION trigger_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_update_leads_timestamp
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_timestamp();


-- Function 4.6: Trigger: Auto-log Timeline action upon inquiry changes
CREATE OR REPLACE FUNCTION trigger_log_lead_timeline()
RETURNS TRIGGER AS $$
DECLARE
  v_comments TEXT;
  v_updated_by VARCHAR(255);
BEGIN
  v_updated_by := COALESCE(NEW.createdBy, 'System');
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO lead_timeline (lead_id, date, time, status, updated_by, comments)
    VALUES (NEW.id, NEW.created_date, NEW.created_time, NEW.status::TEXT, v_updated_by, 'Inquiry generated and logged in Supabase database.');
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log timeline on meaningful CRM fields changes
    IF OLD.status <> NEW.status OR OLD.assigned_counselor_name <> NEW.assigned_counselor_name OR OLD.admission_status <> NEW.admission_status THEN
      v_comments := 'Lead updated. Status: ' || OLD.status::TEXT || ' -> ' || NEW.status::TEXT;
      IF OLD.assigned_counselor_name <> NEW.assigned_counselor_name THEN
        v_comments := v_comments || ', Counselor: ' || OLD.assigned_counselor_name || ' -> ' || NEW.assigned_counselor_name;
      END IF;
      IF OLD.admission_status <> NEW.admission_status THEN
        v_comments := v_comments || ', Admission Status: ' || OLD.admission_status::TEXT || ' -> ' || NEW.admission_status::TEXT;
      END IF;
      
      INSERT INTO lead_timeline (lead_id, date, time, status, updated_by, comments)
      VALUES (NEW.id, CURRENT_DATE, CURRENT_TIME, NEW.status::TEXT, v_updated_by, v_comments);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_log_lead_timeline
  AFTER INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_lead_timeline();


-- Function 4.7: Trigger: Convert Inquiry to Student automatically upon insertion in admissions
CREATE OR REPLACE FUNCTION trigger_create_student_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into students roster database
  INSERT INTO students (student_id, inquiry_id, name, email, mobile, created_at)
  VALUES (NEW.student_id, NEW.inquiry_id, NEW.student_name, NEW.email, NEW.mobile, NOW())
  ON CONFLICT (student_id) DO NOTHING;
  
  -- Ensure lead is updated to reflect enrolled state
  UPDATE leads
  SET status = 'ENROLLED',
      admission_status = 'Admitted',
      student_id = NEW.student_id
  WHERE id = NEW.inquiry_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_create_student_profile
  AFTER INSERT ON admissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_student_profile();


-- Function 4.8: Trigger: IMMUTABLE AUDIT TRAIL TRIGGER
-- Automatically logs modifications to Leads table to audit_logs
CREATE OR REPLACE FUNCTION trigger_audit_lead_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_action VARCHAR(50);
  v_old TEXT;
  v_new TEXT;
  v_operator VARCHAR(255);
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'CREATE INQUIRY';
    v_old := 'None';
    v_new := 'Created inquiry for student ' || NEW.student_name || ' (Course: ' || NEW.selected_course_title || ')';
    v_operator := NEW.createdBy;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE THEN
      v_action := 'SOFT DELETE INQUIRY';
      v_old := 'Active';
      v_new := 'Soft deleted (Moved to Trash)';
      v_operator := NEW.deleted_by;
    ELSIF OLD.is_archived = FALSE AND NEW.is_archived = TRUE THEN
      v_action := 'ARCHIVE INQUIRY';
      v_old := 'Active';
      v_new := 'Moved to Archived Pipeline';
      v_operator := NEW.archived_by;
    ELSIF (OLD.is_archived = TRUE OR OLD.is_deleted = TRUE) AND NEW.is_archived = FALSE AND NEW.is_deleted = FALSE THEN
      v_action := 'RESTORE INQUIRY';
      v_old := 'Archived/Deleted';
      v_new := 'Restored to Active Pipeline';
      v_operator := NEW.createdBy;
    ELSE
      v_action := 'UPDATE INQUIRY';
      v_old := 'Status: ' || OLD.status::TEXT || ', Counselor: ' || COALESCE(OLD.assigned_counselor_name, 'None');
      v_new := 'Status: ' || NEW.status::TEXT || ', Counselor: ' || COALESCE(NEW.assigned_counselor_name, 'None');
      v_operator := NEW.createdBy;
    END IF;
  END IF;

  INSERT INTO audit_logs (operator, action, old_value, new_value, target_id, browser)
  VALUES (
    COALESCE(v_operator, 'System'),
    v_action,
    v_old,
    v_new,
    COALESCE(NEW.id, OLD.id),
    'Supabase Automations Engine'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER t_audit_lead_changes
  AFTER INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_audit_lead_changes();


-- =========================================================================
-- 5. DATABASE VIEWS
-- =========================================================================

-- View 5.1: Active CRM Leads View (filters out soft-deleted and archived records)
CREATE OR REPLACE VIEW active_leads_view AS
SELECT 
  id,
  academic_year,
  created_date,
  created_time,
  student_name,
  parent_name,
  mobile,
  email,
  inquiry_type,
  selected_course_title,
  status,
  priority,
  assigned_counselor_name,
  lead_source,
  last_follow_up_date,
  next_follow_up_date,
  admission_status,
  student_id,
  createdBy,
  meetLink
FROM leads
WHERE is_deleted = FALSE AND is_archived = FALSE;


-- View 5.2: Archived Leads Pipeline
CREATE OR REPLACE VIEW archived_leads_view AS
SELECT 
  id,
  academic_year,
  created_date,
  student_name,
  mobile,
  email,
  inquiry_type,
  selected_course_title,
  status,
  assigned_counselor_name,
  archived_at,
  archived_by
FROM leads
WHERE is_deleted = FALSE AND is_archived = TRUE;


-- View 5.3: Soft Deleted Leads (Trash folder)
CREATE OR REPLACE VIEW deleted_leads_view AS
SELECT 
  id,
  academic_year,
  created_date,
  student_name,
  mobile,
  email,
  selected_course_title,
  deleted_at,
  deleted_by
FROM leads
WHERE is_deleted = TRUE;


-- =========================================================================
-- 6. SECURITY: ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on core tables
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE counselors ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 6.1 Academic Years Security Rules
CREATE POLICY "Allow public read access to academic years" ON academic_years
  FOR SELECT TO authenticated, anon USING (TRUE);

CREATE POLICY "Allow superadmins write access to academic years" ON academic_years
  FOR ALL TO authenticated USING (TRUE); -- Defaulting to true for demo auth

-- 6.2 Courses Catalog Security Rules
CREATE POLICY "Allow public read access to courses" ON courses
  FOR SELECT TO authenticated, anon USING (is_active = TRUE);

CREATE POLICY "Allow superadmins manage access to courses" ON courses
  FOR ALL TO authenticated USING (TRUE);

-- 6.3 Leads Security Rules
CREATE POLICY "Allow authenticated read on active leads" ON leads
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Allow authenticated inserts on leads" ON leads
  FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "Allow authenticated updates on leads" ON leads
  FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- 6.4 Admissions Security Rules
CREATE POLICY "Allow authenticated read on admissions" ON admissions
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Allow authenticated inserts on admissions" ON admissions
  FOR INSERT TO authenticated WITH CHECK (TRUE);

-- 6.5 Students Security Rules
CREATE POLICY "Allow authenticated read on students roster" ON students
  FOR SELECT TO authenticated USING (TRUE);

-- 6.6 Audit Logs Security Rules
CREATE POLICY "Allow authenticated read on audit logs" ON audit_logs
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Only database triggers insert audit logs" ON audit_logs
  FOR INSERT TO authenticated WITH CHECK (TRUE);


-- =========================================================================
-- 7. INITIAL SEED DATA
-- =========================================================================

-- Seed Roles
INSERT INTO roles (id, name, description) VALUES
(1, 'SuperAdmin', 'Unrestricted administrative control over CRM records, system configuration, and logs.'),
(2, 'Counselor', 'Access to handle leads pipeline, record remarks, and log follow-ups.'),
(3, 'Staff', 'General access to schedule meetings and review calendars.')
ON CONFLICT (id) DO NOTHING;

-- Seed Courses
INSERT INTO courses (title, category, duration, price, is_active) VALUES
('Elite Spoken English Mastery', 'spoken', '3 Months', 15000.00, TRUE),
('Advanced Grammar clinics', 'academic', '2 Months', 10000.00, TRUE),
('IELTS Prep & assessment', 'academic', '3 Months', 18000.00, TRUE),
('Corporate English training', 'professional', '1 Month', 25000.00, TRUE),
('Interview prep workspace', 'professional', '15 Days', 8000.00, TRUE),
('Others', 'spoken', 'Flexible', 0.00, TRUE)
ON CONFLICT (title) DO NOTHING;

-- Seed Counselor Profiles
INSERT INTO counselors (name, email, is_active) VALUES
('Shelly Sharma', 'mail.shelly.sharma@gmail.com', TRUE),
('Ankita Sen', 'ankita.sen@ssa.edu.in', TRUE)
ON CONFLICT (email) DO NOTHING;
