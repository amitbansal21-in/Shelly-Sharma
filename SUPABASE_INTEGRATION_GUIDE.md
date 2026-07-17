# Shelly Sharma Academy (SSA) - Supabase CRM Integration Guide

This guide outlines the production-ready Supabase database architecture designed specifically for **Shelly Sharma Academy**.

All client reads and writes happen through Supabase as the **absolute Source of Truth**, while Google Sheets serves purely as a **live reporting mirror** updated after successful database transactions.

---

## 1. Database Schema & Architecture

The database is structured as a set of fully normalized relational tables optimized to scale to **100,000+** records. It is defined in `/supabase/migrations/20260716000000_init_crm.sql`.

### Table Summary
* **`academic_years`**: Stores academic years (April 1 to March 31).
* **`inquiry_sequences`**: Keeps a secure running counter per academic year to prevent duplicate/skipped IDs.
* **`leads`**: Central CRM inquires, with support for soft archival, soft deletion, and Google Meet integration.
* **`admissions`**: Stores financial logs for enrolled students linked back to their original inquiries.
* **`students`**: Rosters of current active students.
* **`parents`**: CRM profiles for parents.
* **`courses`**: School catalogs.
* **`counselors`**: Profiles for academic coordinators.
* **`lead_remarks`**: Detailed logs of communication history.
* **`lead_timeline`**: Auto-generated CRM status changes.
* **`follow_ups`**: Scheduled follow-up calendars.
* **`audit_logs`**: Immutable, append-only security logs.
* **`google_workspace_sync_queue`**: Reliability buffer for background syncing.
* **`system_settings`**: Application variables.

---

## 2. Advanced PL/pgSQL Database Functions & Triggers

### 2.1 Academic Year Auto-Calculator
Returns the academic year as `YYYY-YY` (e.g. `2026-27`) based on standard April 1st bounds:
```sql
SELECT calculate_academic_year('2026-07-16'::DATE); -- Returns '2026-27'
SELECT calculate_academic_year('2027-02-15'::DATE); -- Returns '2026-27'
```

### 2.2 No-Gap & No-Duplicate Inquiry ID Sequencer
Computes academic year, creates the year record dynamically, logs a database lock on the sequence table, increments the sequence, and formats the output ID as `SSA/YYYY-YY/NNNNN`:
```sql
SELECT * FROM generate_next_inquiry_id(); -- E.g., ('SSA/2026-27/00035', '2026-27')
```

### 2.3 Automated Student Conversion Trigger
When an inquiry converts to an admission:
1. Student ID is derived directly from Inquiry ID (e.g., `SSA/2026-27/00035` -> `SSA/STU/2026-27/00035`).
2. Row is added to `students` table.
3. Original `leads` row status is updated to `ENROLLED` with an `Admitted` flag.
All of this is completed atomically via database triggers (`t_create_student_profile`).

### 2.4 Immutable Audit Logging Trigger
Every insert, update, archive, or soft-delete operation is captured and written to the immutable `audit_logs` table via the `t_audit_lead_changes` trigger, maintaining an un-falsifiable record of system edits.

---

## 3. High-Performance Indexing Strategy
Optimized for high-volume read workloads (over **100,000+** records):
* **Fuzzy Text Search**: Leverages PostgreSQL `pg_trgm` GIN indexes for lightning-fast prefix and infix autocomplete on Student Name, Parent Mobile, and Emails.
* **Compound Performance Index**: Indexes key combinations like `(is_deleted, is_archived, created_date DESC)` to make pipeline screens load instantly.
* **Foreign Key Indexes**: Placed on all relational constraints (`parent_id`, `selected_course_id`, `assigned_counselor_id`) to optimize nested queries and joins.

---

## 4. Production Transition Steps

### Step 1: Execute SQL Migration
Paste the full contents of `/supabase/migrations/20260716000000_init_crm.sql` directly into your **Supabase SQL Editor** and click **Run**.

### Step 2: Set Environment Variables
Add your production Supabase keys into your secrets manager or `.env`:
```env
VITE_SUPABASE_URL="sb_publishable_WGR-eieYnC7akJ_1p1oStQ_Ljlfa7fL"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoaGF3eXRneXF5enN1c2lwZm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMTQ1OTIsImV4cCI6MjA5OTc5MDU5Mn0.e5fip05k2-A8OH3V_XQ5csF5yLV3_SpmptIBfbH3RwU"
```

### Step 3: Wire client functions
Replace your imports from `supabaseClient.ts` to `supabaseProductionClient.ts` in your app routes. The function names are fully typed and aligned to allow a drop-in replacement!
