/**
 * Shelly Sharma Academy - Supabase Production CRM Integration
 * File: /src/lib/supabaseProductionClient.ts
 * Description: Complete, typed, production-ready Supabase client.
 * Supabase is the ONLY Source of Truth. Reads/writes occur directly here.
 * Google Sheets serves purely as a live mirrored reporting view updated upon successful transactions.
 */

import { createClient } from "@supabase/supabase-js";

// =========================================================================
// 1. TYPESCRIPT SCHEMAS (PRODUCTION DATABASE SCHEMAS)
// =========================================================================

export type InquiryStatus = "NEW LEAD" | "CONTACTED" | "DEMO SCHEDULED" | "ENROLLED" | "COMPLETED" | "NO RESPONSE";
export type Priority = "HIGH" | "MEDIUM" | "LOW";
export type LeadSource = "Google" | "Website" | "WhatsApp" | "Referral" | "Instagram" | "Facebook" | "Others";
export type PaymentMode = "Cash" | "UPI" | "Bank Transfer" | "Card";
export type AdmissionStatus = "None" | "Admitted" | "Rejected";

export interface AcademicYearRow {
  id: string; // YYYY-YY
  start_date: string;
  end_date: string;
  created_at?: string;
}

export interface InquirySequenceRow {
  academic_year: string;
  current_number: number;
  updated_at?: string;
}

export interface CourseRow {
  id: string;
  title: string;
  category: string;
  duration?: string;
  price: number;
  is_active: boolean;
  created_at?: string;
}

export interface CounselorRow {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at?: string;
}

export interface ParentRow {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  created_at?: string;
}

export interface LeadRow {
  id: string; // SSA/YYYY-YY/00001
  academic_year: string;
  created_date: string; // YYYY-MM-DD
  created_time: string; // HH:MM:SS
  student_name: string;
  parent_id?: string;
  parent_name?: string;
  mobile: string;
  email: string;
  inquiry_type: string;
  selected_course_id?: string;
  selected_course_title: string;
  other_query?: string;
  status: InquiryStatus;
  priority: Priority;
  assigned_counselor_id?: string;
  assigned_counselor_name?: string;
  lead_source: LeadSource;
  
  // Follow-ups state variables
  last_follow_up_date?: string;
  last_follow_up_comment?: string;
  next_follow_up_date?: string;
  next_follow_up_comment?: string;
  
  // Enrollment State
  admission_status: AdmissionStatus;
  student_id?: string;
  
  createdBy: string;
  remarks?: string;
  
  // Google Meet schedule fields
  date?: string;
  time?: string;
  calendarEventId?: string;
  meetLink?: string;
  meetingStatus?: string;
  meetingCompleted: boolean;
  cancelled: boolean;
  
  // Soft Delete & Archival
  is_archived: boolean;
  is_deleted: boolean;
  created_at?: string;
  updated_at?: string;
  archived_at?: string;
  archived_by?: string;
  deleted_at?: string;
  deleted_by?: string;
}

export interface AdmissionRow {
  id: string;
  student_id: string; // SSA/STU/YYYY-YY/00035
  inquiry_id: string; // SSA/YYYY-YY/00035
  student_name: string;
  parent_name?: string;
  mobile: string;
  email: string;
  enrolled_course: string;
  admission_date: string;
  admission_fee: number;
  payment_mode: PaymentMode;
  remarks?: string;
  created_at?: string;
}

export interface StudentRow {
  student_id: string;
  inquiry_id: string;
  name: string;
  email: string;
  mobile: string;
  parent_id?: string;
  created_at?: string;
}

export interface LeadRemarkRow {
  id: string;
  lead_id: string;
  author: string;
  text: string;
  created_at?: string;
}

export interface LeadTimelineRow {
  id: string;
  lead_id: string;
  date: string;
  time: string;
  status: string;
  updated_by: string;
  comments: string;
  created_at?: string;
}

export interface FollowUpRow {
  id: string;
  lead_id: string;
  scheduled_date: string;
  scheduled_comment?: string;
  status: string; // 'Pending', 'Completed', 'Overdue'
  created_at?: string;
}

export interface AuditLogRow {
  id: string;
  operator: string;
  action: string;
  old_value?: string;
  new_value?: string;
  target_id: string;
  ip?: string;
  browser?: string;
  device?: string;
  created_at?: string;
}

export interface GoogleWorkspaceSyncQueueRow {
  id: string;
  service_type: "SHEETS" | "DRIVE" | "MEET" | "GMAIL";
  action_type: "CREATE_LEAD" | "UPDATE_LEAD" | "CREATE_ADMISSION";
  payload: any;
  status: "PENDING" | "SUCCESS" | "FAILED";
  attempts: number;
  last_error?: string;
  created_at?: string;
  updated_at?: string;
}

// =========================================================================
// 2. SUPABASE CLIENT INITIALIZATION (LAZY / FAIL-SAFE FOR DEV CONTAINER)
// =========================================================================

let supabaseInstance: any = null;

export function getSupabase(): any {
  if (supabaseInstance) return supabaseInstance;

  // Read environment variables (will fall back to placeholders to prevent crashes)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-key";

  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn(
      "Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing. " +
      "The CRM is currently falling back to placeholder connections."
    );
  }

  supabaseInstance = createClient<any>(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

// =========================================================================
// 3. ENTERPRISE CRM DATABASE SERVICES (CRUD LAYER)
// =========================================================================

/**
 * Fetch all leads from Supabase active pipeline (not soft-deleted or archived)
 */
export async function fetchProductionLeads(): Promise<LeadRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("is_deleted", false)
    .eq("is_archived", false)
    .order("created_date", { ascending: false });

  if (error) {
    console.error("Supabase Error fetching production leads:", error);
    throw error;
  }
  return data || [];
}

/**
 * Fetch archived inquiries from Supabase
 */
export async function fetchProductionArchivedLeads(): Promise<LeadRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("is_deleted", false)
    .eq("is_archived", true)
    .order("archived_at", { ascending: false });

  if (error) {
    console.error("Supabase Error fetching archived leads:", error);
    throw error;
  }
  return data || [];
}

/**
 * Fetch soft-deleted inquiries (Trash Folder) from Supabase
 */
export async function fetchProductionTrashLeads(): Promise<LeadRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("is_deleted", true)
    .order("deleted_at", { ascending: false });

  if (error) {
    console.error("Supabase Error fetching soft deleted leads:", error);
    throw error;
  }
  return data || [];
}

/**
 * Create a new inquiry in Supabase.
 * NOTE: The serial Inquiry ID and Academic Year are automatically generated and locked database-side
 * via the `t_set_lead_identifiers` trigger and `generate_next_inquiry_id()` PL/pgSQL function.
 * 
 * After successful database save, it updates the Google Sheets reporting mirror.
 */
export async function createProductionInquiry(
  inquiry: Omit<LeadRow, "id" | "academic_year" | "created_at" | "updated_at">,
  googleAccessToken?: string,
  googleSpreadsheetId?: string
): Promise<LeadRow> {
  const supabase = getSupabase();

  // Insert Lead Row in Supabase (ID, Academic Year and Initial Timeline automatically logged database-side)
  const { data, error } = await supabase
    .from("leads")
    .insert([inquiry])
    .select()
    .single();

  if (error) {
    console.error("Supabase Error inserting new lead:", error);
    throw error;
  }

  const savedLead = data as LeadRow;

  // 1-way Push to Google Sheets Reporting Mirror (Supabase is the absolute Source of Truth)
  if (googleAccessToken && googleSpreadsheetId) {
    try {
      await mirrorLeadToSheets(googleAccessToken, googleSpreadsheetId, savedLead);
    } catch (sheetErr) {
      console.error("Failed to sync new lead to Google Sheets mirror:", sheetErr);
      // Log failure in queue for async re-run
      await logSyncQueueFailure("SHEETS", "CREATE_LEAD", savedLead, sheetErr);
    }
  }

  return savedLead;
}

/**
 * Update Inquiry fields in Supabase.
 * Automatically appends Timeline item and logs to Immutable Audit Logs database-side via triggers.
 */
export async function updateProductionInquiry(
  id: string,
  updatedFields: Partial<Omit<LeadRow, "id" | "academic_year" | "created_at" | "updated_at">>,
  googleAccessToken?: string,
  googleSpreadsheetId?: string
): Promise<LeadRow> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("leads")
    .update(updatedFields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Supabase Error updating lead ${id}:`, error);
    throw error;
  }

  const updatedLead = data as LeadRow;

  // Mirror Update to Google Sheets Reporting Mirror
  if (googleAccessToken && googleSpreadsheetId) {
    try {
      await mirrorLeadToSheets(googleAccessToken, googleSpreadsheetId, updatedLead);
    } catch (sheetErr) {
      console.error(`Failed to sync lead ${id} update to Google Sheets mirror:`, sheetErr);
      await logSyncQueueFailure("SHEETS", "UPDATE_LEAD", updatedLead, sheetErr);
    }
  }

  return updatedLead;
}

/**
 * Process Student Admission flow in Supabase.
 * Generates permanent Student ID derived from Inquiry ID (SSA/2026-27/00035 -> SSA/STU/2026-27/00035),
 * inserts admissions record, inserts students roster profile, and updates original inquiry.
 * Database transactions are automated via database triggers (`t_create_student_profile`).
 */
export async function createProductionAdmission(
  inquiryId: string,
  admissionDetails: Omit<AdmissionRow, "id" | "student_id" | "inquiry_id" | "student_name" | "parent_name" | "mobile" | "email" | "created_at">,
  googleAccessToken?: string,
  googleSpreadsheetId?: string
): Promise<AdmissionRow> {
  const supabase = getSupabase();

  // 1. Fetch Lead details from Supabase to construct student profile
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("*")
    .eq("id", inquiryId)
    .single();

  if (leadErr || !lead) {
    throw new Error(`Inquiry with ID ${inquiryId} not found in Supabase: ${leadErr?.message}`);
  }

  // Calculate Student ID: SSA/STU/YYYY-YY/00000
  const studentId = lead.id.replace("SSA/", "SSA/STU/");

  const newAdmission: Omit<AdmissionRow, "id" | "created_at"> = {
    student_id: studentId,
    inquiry_id: inquiryId,
    student_name: lead.student_name,
    parent_name: lead.parent_name || "",
    mobile: lead.mobile,
    email: lead.email,
    enrolled_course: lead.selected_course_title,
    admission_date: admissionDetails.admission_date,
    admission_fee: admissionDetails.admission_fee,
    payment_mode: admissionDetails.payment_mode,
    remarks: admissionDetails.remarks || ""
  };

  // 2. Insert into Admissions Table (Automatic student profile conversion & lead status updates triggered database-side)
  const { data: savedAdmission, error: admErr } = await supabase
    .from("admissions")
    .insert([newAdmission])
    .select()
    .single();

  if (admErr) {
    console.error("Supabase Error finalizing admission:", admErr);
    throw admErr;
  }

  // 3. Mirror Admission record to 'Admissions' sheet tab in Google Sheets
  if (googleAccessToken && googleSpreadsheetId) {
    try {
      await mirrorAdmissionToSheets(googleAccessToken, googleSpreadsheetId, savedAdmission as AdmissionRow);
      // Also update lead's final status inside Google Sheets reporting tab
      const { data: updatedLead } = await supabase.from("leads").select("*").eq("id", inquiryId).single();
      if (updatedLead) {
        await mirrorLeadToSheets(googleAccessToken, googleSpreadsheetId, updatedLead as LeadRow);
      }
    } catch (sheetErr) {
      console.error("Failed to sync admission row to Google Sheets mirror:", sheetErr);
      await logSyncQueueFailure("SHEETS", "CREATE_ADMISSION", savedAdmission, sheetErr);
    }
  }

  return savedAdmission as AdmissionRow;
}

/**
 * Soft Archive an inquiry (transfers it to long-term pipeline database)
 */
export async function archiveProductionInquiry(
  id: string,
  operatorName: string,
  googleAccessToken?: string,
  googleSpreadsheetId?: string
): Promise<LeadRow> {
  return updateProductionInquiry(
    id,
    {
      is_archived: true,
      archived_at: new Date().toISOString(),
      archived_by: operatorName,
      createdBy: operatorName // Sets trace identity for database triggers
    },
    googleAccessToken,
    googleSpreadsheetId
  );
}

/**
 * Soft Delete an inquiry (moves it to Trash bin queue)
 */
export async function softDeleteProductionInquiry(
  id: string,
  operatorName: string,
  googleAccessToken?: string,
  googleSpreadsheetId?: string
): Promise<LeadRow> {
  return updateProductionInquiry(
    id,
    {
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: operatorName,
      createdBy: operatorName
    },
    googleAccessToken,
    googleSpreadsheetId
  );
}

/**
 * Restore an inquiry from Archive or Trash
 */
export async function restoreProductionInquiry(
  id: string,
  operatorName: string,
  googleAccessToken?: string,
  googleSpreadsheetId?: string
): Promise<LeadRow> {
  return updateProductionInquiry(
    id,
    {
      is_deleted: false,
      is_archived: false,
      createdBy: operatorName
    },
    googleAccessToken,
    googleSpreadsheetId
  );
}

// =========================================================================
// 4. GOOGLE SHEETS MIRROR SYNC HELPERS (1-WAY EXCLUSIVE CRM SYNC)
// =========================================================================

/**
 * Writes/Updates Lead details inside the 'Leads' tab of Google Sheets
 */
async function mirrorLeadToSheets(
  accessToken: string,
  spreadsheetId: string,
  lead: LeadRow
): Promise<void> {
  // Check if Lead Row exists
  const checkUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Leads!A2:V?majorDimension=ROWS`;
  const res = await fetch(checkUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  let existingRows: any[][] = [];
  if (res.ok) {
    const data = await res.json();
    existingRows = data.values || [];
  }

  const rowIndex = existingRows.findIndex(row => row[0] === lead.id);
  
  const rowValues = [
    lead.id,
    lead.created_date,
    lead.created_time,
    lead.student_name,
    lead.parent_name || "",
    lead.email,
    lead.mobile,
    lead.selected_course_title,
    "Online",
    lead.inquiry_type === "Others" ? lead.other_query : lead.remarks,
    lead.lead_source,
    lead.status,
    lead.priority,
    lead.assigned_counselor_name || "",
    lead.last_follow_up_date || "",
    lead.last_follow_up_comment || "",
    lead.next_follow_up_date || "",
    lead.next_follow_up_comment || "",
    lead.admission_status,
    lead.student_id || "",
    lead.createdBy,
    lead.remarks || ""
  ];

  if (rowIndex !== -1) {
    // Overwrite existing row
    const sheetsRowNumber = rowIndex + 2; // header is row 1
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Leads!A${sheetsRowNumber}:V${sheetsRowNumber}?valueInputOption=USER_ENTERED`;
    await fetch(updateUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ values: [rowValues] })
    });
    
    await logSyncToDb(lead.id, spreadsheetId, "Leads", "UPDATE_ROW", sheetsRowNumber, "SUCCESS");
  } else {
    // Append new row
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Leads!A:V:append?valueInputOption=USER_ENTERED`;
    const appendRes = await fetch(appendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ values: [rowValues] })
    });

    let appendedRow = null;
    if (appendRes.ok) {
      const appendData = await appendRes.json();
      appendedRow = appendData.updates?.updatedRange;
    }
    await logSyncToDb(lead.id, spreadsheetId, "Leads", "APPEND_ROW", appendedRow ? 0 : undefined, appendRes.ok ? "SUCCESS" : "FAILED");
  }
}

/**
 * Appends student admission row to 'Admissions' tab of Google Sheets
 */
async function mirrorAdmissionToSheets(
  accessToken: string,
  spreadsheetId: string,
  admission: AdmissionRow
): Promise<void> {
  const rowValues = [
    admission.student_id,
    admission.inquiry_id,
    admission.student_name,
    admission.parent_name || "",
    admission.mobile,
    admission.email,
    admission.enrolled_course,
    admission.admission_date,
    admission.admission_fee,
    admission.payment_mode,
    admission.remarks || ""
  ];

  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Admissions!A:K:append?valueInputOption=USER_ENTERED`;
  const res = await fetch(appendUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ values: [rowValues] })
  });

  await logSyncToDb(admission.inquiry_id, spreadsheetId, "Admissions", "APPEND_ROW", undefined, res.ok ? "SUCCESS" : "FAILED");
}

// =========================================================================
// 5. CRM IMMUTABLE MONITORING LOG SERVICES
// =========================================================================

async function logSyncToDb(
  leadId: string,
  spreadsheetId: string,
  tabName: string,
  action: string,
  rowIndex?: number,
  status: "SUCCESS" | "FAILED" = "SUCCESS",
  errMsg?: string
) {
  try {
    const supabase = getSupabase();
    await supabase.from("google_sheet_sync_logs").insert([{
      lead_id: leadId,
      spreadsheet_id: spreadsheetId,
      tab_name: tabName,
      action,
      row_index: rowIndex,
      status,
      error_message: errMsg || null
    }]);
  } catch (e) {
    console.error("Failed logging Sheet Sync action to db:", e);
  }
}

async function logSyncQueueFailure(
  service: "SHEETS" | "DRIVE" | "MEET" | "GMAIL",
  action: string,
  payload: any,
  error: any
) {
  try {
    const supabase = getSupabase();
    await supabase.from("google_workspace_sync_queue").insert([{
      service_type: service,
      action_type: action,
      payload,
      status: "FAILED",
      last_error: error instanceof Error ? error.message : String(error),
      attempts: 1
    }]);
  } catch (e) {
    console.error("Failed updating sync queue failure:", e);
  }
}
