/**
 * Supabase client and CRM sync architecture.
 * Designed specifically for Shelly Sharma Academy.
 * Admin Dashboard reads/writes from this layer, which serves as the Source of Truth.
 * Updates are automatically mirrored to Google Sheets in the background.
 */

import { createClient } from "@supabase/supabase-js";

export interface ActivityTimelineItem {
  id: string;
  date: string;
  time: string;
  status: string;
  updatedBy: string;
  comments: string;
}

export interface Inquiry {
  id: string; // E.g., SSA/2026-27/00001
  academicYear: string; // E.g., 2026-27
  createdDate: string; // YYYY-MM-DD
  createdTime: string; // HH:MM:SS
  studentName: string;
  parentName: string;
  mobile: string;
  email: string;
  inquiryType: string; // Others, Grammar, Interview, Corporate, General, Spoken English, IELTS
  selectedCourse: string;
  otherQuery?: string;
  status: "NEW LEAD" | "CONTACTED" | "DEMO SCHEDULED" | "ENROLLED" | "COMPLETED" | "NO RESPONSE";
  priority: "HIGH" | "MEDIUM" | "LOW";
  assignedCounselor: string;
  leadSource: "Google" | "Website" | "WhatsApp" | "Referral" | "Instagram" | "Facebook" | "Others";
  lastFollowUpDate?: string;
  lastFollowUpComment?: string;
  nextFollowUpDate?: string;
  nextFollowUpComment?: string;
  admissionStatus: "None" | "Admitted" | "Rejected";
  studentId?: string;
  createdBy: string;
  remarks: string;
  timeline: ActivityTimelineItem[];
  
  // Meeting Calendar Fields
  date?: string; 
  time?: string;
  calendarEventId?: string;
  meetLink?: string;
  meetingStatus?: string;
  meetingCompleted?: string;
  cancelled?: string;

  // Soft Delete & Archive Policy
  isArchived?: boolean;
  isDeleted?: boolean;
}

export interface Admission {
  studentId: string; // E.g., SSA-STU-260001
  inquiryId: string; // SSA/2026-27/00035
  studentName: string;
  parentName: string;
  mobile: string;
  email: string;
  enrolledCourse: string;
  admissionDate: string;
  admissionFee: number;
  paymentMode: "Cash" | "UPI" | "Bank Transfer" | "Card";
  remarks: string;
}

export interface AuditLog {
  id: string;
  user: string;
  date: string;
  time: string;
  targetId: string;
  action: string;
  oldValue: string;
  newValue: string;
  ip?: string;
  browser?: string;
}

const STORAGE_INQUIRIES_KEY = "ssa_supabase_inquiries";
const STORAGE_ADMISSIONS_KEY = "ssa_supabase_admissions";
const STORAGE_AUDIT_LOGS_KEY = "ssa_supabase_audit_logs";

// =========================================================================
// 1. SUPABASE CLIENT INITIALIZATION
// =========================================================================

let supabaseInstance: any = null;

export function getSupabase(): any {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
      console.error("Failed to initialize Supabase client:", e);
    }
  }
  return supabaseInstance;
}

// =========================================================================
// 2. MAPPER HELPERS (camelCase React Models <-> snake_case SQL Tables)
// =========================================================================

function mapInquiryToRow(inquiry: Partial<Inquiry>): any {
  const row: any = {};
  if (inquiry.id !== undefined) row.id = inquiry.id;
  if (inquiry.academicYear !== undefined) row.academic_year = inquiry.academicYear;
  if (inquiry.createdDate !== undefined) row.created_date = inquiry.createdDate;
  if (inquiry.createdTime !== undefined) row.created_time = inquiry.createdTime;
  if (inquiry.studentName !== undefined) row.student_name = inquiry.studentName;
  if (inquiry.parentName !== undefined) row.parent_name = inquiry.parentName;
  if (inquiry.mobile !== undefined) row.mobile = inquiry.mobile;
  if (inquiry.email !== undefined) row.email = inquiry.email;
  if (inquiry.inquiryType !== undefined) row.inquiry_type = inquiry.inquiryType;
  if (inquiry.selectedCourse !== undefined) row.selected_course_title = inquiry.selectedCourse;
  if (inquiry.otherQuery !== undefined) row.other_query = inquiry.otherQuery;
  if (inquiry.status !== undefined) row.status = inquiry.status;
  if (inquiry.priority !== undefined) row.priority = inquiry.priority;
  if (inquiry.assignedCounselor !== undefined) row.assigned_counselor_name = inquiry.assignedCounselor;
  if (inquiry.leadSource !== undefined) row.lead_source = inquiry.leadSource;
  if (inquiry.lastFollowUpDate !== undefined) row.last_follow_up_date = inquiry.lastFollowUpDate;
  if (inquiry.lastFollowUpComment !== undefined) row.last_follow_up_comment = inquiry.lastFollowUpComment;
  if (inquiry.nextFollowUpDate !== undefined) row.next_follow_up_date = inquiry.nextFollowUpDate;
  if (inquiry.nextFollowUpComment !== undefined) row.next_follow_up_comment = inquiry.nextFollowUpComment;
  if (inquiry.admissionStatus !== undefined) row.admission_status = inquiry.admissionStatus;
  if (inquiry.studentId !== undefined) row.student_id = inquiry.studentId;
  if (inquiry.createdBy !== undefined) row.createdBy = inquiry.createdBy;
  if (inquiry.remarks !== undefined) row.remarks = inquiry.remarks;
  
  if (inquiry.date !== undefined) row.date = inquiry.date;
  if (inquiry.time !== undefined) row.time = inquiry.time;
  if (inquiry.calendarEventId !== undefined) row.calendarEventId = inquiry.calendarEventId;
  if (inquiry.meetLink !== undefined) row.meetLink = inquiry.meetLink;
  if (inquiry.meetingStatus !== undefined) row.meetingStatus = inquiry.meetingStatus;
  
  if (inquiry.meetingCompleted !== undefined) {
    row.meetingCompleted = (inquiry.meetingCompleted === "true");
  }
  if (inquiry.cancelled !== undefined) {
    row.cancelled = (inquiry.cancelled === "true");
  }
  
  if (inquiry.isArchived !== undefined) row.is_archived = inquiry.isArchived;
  if (inquiry.isDeleted !== undefined) row.is_deleted = inquiry.isDeleted;
  
  return row;
}

function mapRowToInquiry(row: any): Inquiry {
  return {
    id: row.id,
    academicYear: row.academic_year,
    createdDate: row.created_date,
    createdTime: row.created_time,
    studentName: row.student_name,
    parentName: row.parent_name || "",
    mobile: row.mobile,
    email: row.email,
    inquiryType: row.inquiry_type,
    selectedCourse: row.selected_course_title || row.inquiry_type,
    otherQuery: row.other_query || "",
    status: row.status,
    priority: row.priority || "MEDIUM",
    assignedCounselor: row.assigned_counselor_name || "Shelly Sharma",
    leadSource: row.lead_source || "Website",
    lastFollowUpDate: row.last_follow_up_date || undefined,
    lastFollowUpComment: row.last_follow_up_comment || undefined,
    nextFollowUpDate: row.next_follow_up_date || undefined,
    nextFollowUpComment: row.next_follow_up_comment || undefined,
    admissionStatus: row.admission_status || "None",
    studentId: row.student_id || undefined,
    createdBy: row.createdBy || "System",
    remarks: row.remarks || "",
    timeline: (row.lead_timeline || []).map((t: any) => ({
      id: t.id,
      date: t.date,
      time: t.time,
      status: t.status,
      updatedBy: t.updated_by || "System",
      comments: t.comments || ""
    })).sort((a: any, b: any) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    date: row.date || undefined,
    time: row.time || undefined,
    calendarEventId: row.calendarEventId || undefined,
    meetLink: row.meetLink || undefined,
    meetingStatus: row.meetingStatus || undefined,
    meetingCompleted: row.meetingCompleted !== undefined ? String(row.meetingCompleted) : undefined,
    cancelled: row.cancelled !== undefined ? String(row.cancelled) : undefined,
    isArchived: row.is_archived || false,
    isDeleted: row.is_deleted || false
  };
}

function mapAdmissionToRow(admission: Partial<Admission>): any {
  const row: any = {};
  if (admission.studentId !== undefined) row.student_id = admission.studentId;
  if (admission.inquiryId !== undefined) row.inquiry_id = admission.inquiryId;
  if (admission.studentName !== undefined) row.student_name = admission.studentName;
  if (admission.parentName !== undefined) row.parent_name = admission.parentName;
  if (admission.mobile !== undefined) row.mobile = admission.mobile;
  if (admission.email !== undefined) row.email = admission.email;
  if (admission.enrolledCourse !== undefined) row.enrolled_course = admission.enrolledCourse;
  if (admission.admissionDate !== undefined) row.admission_date = admission.admissionDate;
  if (admission.admissionFee !== undefined) row.admission_fee = admission.admissionFee;
  if (admission.paymentMode !== undefined) row.payment_mode = admission.paymentMode;
  if (admission.remarks !== undefined) row.remarks = admission.remarks;
  return row;
}

function mapRowToAdmission(row: any): Admission {
  return {
    studentId: row.student_id,
    inquiryId: row.inquiry_id,
    studentName: row.student_name,
    parentName: row.parent_name || "",
    mobile: row.mobile,
    email: row.email,
    enrolledCourse: row.enrolled_course,
    admissionDate: row.admission_date,
    admissionFee: Number(row.admission_fee),
    paymentMode: row.payment_mode,
    remarks: row.remarks || ""
  };
}

// =========================================================================
// 3. SEED DATA & LOCAL FALLBACKS
// =========================================================================

export function getSupabaseAuditLogs(): AuditLog[] {
  try {
    const data = localStorage.getItem(STORAGE_AUDIT_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to read audit logs", e);
    return [];
  }
}

export function saveSupabaseAuditLog(log: Omit<AuditLog, "id" | "date" | "time" | "ip" | "browser">) {
  try {
    const logs = getSupabaseAuditLogs();
    const dateObj = new Date();
    const date = dateObj.toISOString().split("T")[0];
    const time = dateObj.toTimeString().split(" ")[0];
    const browser = typeof navigator !== "undefined" ? navigator.userAgent : "Server";
    const ip = "127.0.0.1";

    const newLog: AuditLog = {
      ...log,
      id: `L_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      date,
      time,
      ip,
      browser
    };

    logs.unshift(newLog);
    localStorage.setItem(STORAGE_AUDIT_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error("Failed to save audit log", e);
  }
}

export function getAcademicYear(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  let startYear = year;
  if (month < 4) {
    startYear = year - 1;
  }
  const endYear = startYear + 1;
  const endYearShort = String(endYear).slice(-2);
  return `${startYear}-${endYearShort}`;
}

function generateInquiryId(existingInquiries: Inquiry[], date: Date = new Date()): { id: string; academicYear: string } {
  const academicYear = getAcademicYear(date);
  const yearInquiries = existingInquiries.filter(i => i.academicYear === academicYear);
  
  let nextSeq = 1;
  if (yearInquiries.length > 0) {
    const seqs = yearInquiries.map(i => {
      const parts = i.id.split("/");
      if (parts.length === 3) {
        const num = parseInt(parts[2], 10);
        return isNaN(num) ? 0 : num;
      }
      return 0;
    });
    nextSeq = Math.max(...seqs) + 1;
  }
  
  const paddedSeq = String(nextSeq).padStart(5, "0");
  const id = `SSA/${academicYear}/${paddedSeq}`;
  return { id, academicYear };
}

function generateStudentId(existingAdmissions: Admission[], academicYear: string): string {
  const yy = academicYear.split("-")[0].slice(-2);
  const prefix = `SSA-STU-${yy}`;
  const yearAdmissions = existingAdmissions.filter(a => a.studentId.startsWith(prefix));
  
  let nextSeq = 1;
  if (yearAdmissions.length > 0) {
    const seqs = yearAdmissions.map(a => {
      const suffix = a.studentId.slice(prefix.length);
      const num = parseInt(suffix, 10);
      return isNaN(num) ? 0 : num;
    });
    nextSeq = Math.max(...seqs) + 1;
  }
  
  const paddedSeq = String(nextSeq).padStart(4, "0");
  return `${prefix}${paddedSeq}`;
}

const SEED_INQUIRIES: Inquiry[] = [
  {
    id: "SSA/2026-27/00001",
    academicYear: "2026-27",
    createdDate: "2026-06-15",
    createdTime: "10:30:00",
    studentName: "Ananya Deshmukh",
    parentName: "Rajesh Deshmukh",
    mobile: "+91 98765 43210",
    email: "ananya.desh@gmail.com",
    inquiryType: "Spoken English",
    selectedCourse: "Elite Spoken English Mastery",
    otherQuery: "",
    status: "ENROLLED",
    priority: "HIGH",
    assignedCounselor: "Shelly Sharma",
    leadSource: "Instagram",
    lastFollowUpDate: "2026-06-18",
    lastFollowUpComment: "Enrolled successfully in spoken English batch",
    nextFollowUpDate: "",
    admissionStatus: "Admitted",
    studentId: "SSA-STU-260001",
    createdBy: "Shelly Sharma",
    remarks: "Wants to improve public speaking confidence.",
    timeline: [
      { id: "1", date: "2026-06-15", time: "10:30:00", status: "NEW LEAD", updatedBy: "System", comments: "Inquiry received from Website Form" },
      { id: "2", date: "2026-06-16", time: "14:15:00", status: "CONTACTED", updatedBy: "Shelly Sharma", comments: "Spoke to father. Very keen on grooming and vocabulary." },
      { id: "3", date: "2026-06-18", time: "11:00:00", status: "ENROLLED", updatedBy: "Shelly Sharma", comments: "Admission fee received. Student ID SSA-STU-260001 assigned." }
    ]
  },
  {
    id: "SSA/2026-27/00002",
    academicYear: "2026-27",
    createdDate: "2026-07-10",
    createdTime: "11:15:00",
    studentName: "Vihaan Malhotra",
    parentName: "Meenakshi Malhotra",
    mobile: "+91 91234 56789",
    email: "vihaan.mal@yahoo.com",
    inquiryType: "IELTS",
    selectedCourse: "IELTS Prep",
    otherQuery: "",
    status: "DEMO SCHEDULED",
    priority: "HIGH",
    assignedCounselor: "Shelly Sharma",
    leadSource: "Google",
    lastFollowUpDate: "2026-07-12",
    lastFollowUpComment: "Scheduled a demo session for IELTS speaking practice",
    nextFollowUpDate: "2026-07-17",
    nextFollowUpComment: "Confirm attendance for Tomorrow's demo session",
    admissionStatus: "None",
    createdBy: "Shelly Sharma",
    remarks: "Aiming for 8.0 Band. Target country is Canada.",
    timeline: [
      { id: "1", date: "2026-07-10", time: "11:15:00", status: "NEW LEAD", updatedBy: "System", comments: "Inquiry received from Website Google Search" },
      { id: "2", date: "2026-07-12", time: "16:00:00", status: "DEMO SCHEDULED", updatedBy: "Shelly Sharma", comments: "Demo session scheduled for 17th July, 4 PM" }
    ]
  },
  {
    id: "SSA/2026-27/00003",
    academicYear: "2026-27",
    createdDate: "2026-07-14",
    createdTime: "09:05:00",
    studentName: "Kabir Sen",
    parentName: "Sanjay Sen",
    mobile: "+91 88888 77777",
    email: "kabir.sen@gmail.com",
    inquiryType: "Others",
    selectedCourse: "Others",
    otherQuery: "Need custom corporate business etiquette and writing workshop for my startup team of 12 employees.",
    status: "NEW LEAD",
    priority: "HIGH",
    assignedCounselor: "Shelly Sharma",
    leadSource: "WhatsApp",
    lastFollowUpDate: "",
    nextFollowUpDate: "2026-07-16",
    nextFollowUpComment: "Call to understand exact team training requirements",
    admissionStatus: "None",
    createdBy: "System",
    remarks: "High priority B2B query routed to personal desk.",
    timeline: [
      { id: "1", date: "2026-07-14", time: "09:05:00", status: "NEW LEAD", updatedBy: "System", comments: "High priority 'Others' inquiry submitted via WhatsApp redirection" }
    ]
  },
  {
    id: "SSA/2026-27/00004",
    academicYear: "2026-27",
    createdDate: "2026-07-15",
    createdTime: "15:40:00",
    studentName: "Riya Kapoor",
    parentName: "Sangeeta Kapoor",
    mobile: "+91 99999 44444",
    email: "riya.kapoor@outlook.com",
    inquiryType: "Grammar",
    selectedCourse: "Advanced Grammar clinics",
    status: "CONTACTED",
    priority: "MEDIUM",
    assignedCounselor: "Shelly Sharma",
    leadSource: "Website",
    lastFollowUpDate: "2026-07-16",
    lastFollowUpComment: "Spoke on call. Child has grammar concepts confusion. Sent brochure.",
    nextFollowUpDate: "2026-07-20",
    nextFollowUpComment: "Follow up about the grammar diagnostic class feedback",
    admissionStatus: "None",
    createdBy: "System",
    remarks: "Wants conceptual clarity in tenses & prepositions.",
    timeline: [
      { id: "1", date: "2026-07-15", time: "15:40:00", status: "NEW LEAD", updatedBy: "System", comments: "Inquiry generated on Website Contact Page" },
      { id: "2", date: "2026-07-16", time: "10:00:00", status: "CONTACTED", updatedBy: "Shelly Sharma", comments: "Discussed batch timings. Sent Advanced Grammar course brochure." }
    ]
  }
];

const SEED_ADMISSIONS: Admission[] = [
  {
    studentId: "SSA-STU-260001",
    inquiryId: "SSA/2026-27/00001",
    studentName: "Ananya Deshmukh",
    parentName: "Rajesh Deshmukh",
    mobile: "+91 98765 43210",
    email: "ananya.desh@gmail.com",
    enrolledCourse: "Elite Spoken English Mastery",
    admissionDate: "2026-06-18",
    admissionFee: 15000,
    paymentMode: "UPI",
    remarks: "Admitted in Batch Alpha (Evening, 5 PM to 6 PM)"
  }
];

// =========================================================================
// 4. CORE DATA SERVICE ACTIONS
// =========================================================================

export async function getSupabaseInquiries(): Promise<Inquiry[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*, lead_timeline(*)")
        .eq("is_deleted", false)
        .order("created_date", { ascending: false });
      
      if (error) {
        console.error("Failed to fetch inquiries from real Supabase:", error);
        throw error;
      }
      return (data || []).map(mapRowToInquiry);
    } catch (e) {
      console.error("Supabase fetch inquiries failed, trying local storage:", e);
    }
  }

  try {
    const data = localStorage.getItem(STORAGE_INQUIRIES_KEY);
    if (data) {
      return JSON.parse(data);
    } else {
      localStorage.setItem(STORAGE_INQUIRIES_KEY, JSON.stringify(SEED_INQUIRIES));
      return SEED_INQUIRIES;
    }
  } catch (e) {
    console.error("Failed to read inquiries from storage", e);
    return SEED_INQUIRIES;
  }
}

export function saveSupabaseInquiries(inquiries: Inquiry[]) {
  try {
    localStorage.setItem(STORAGE_INQUIRIES_KEY, JSON.stringify(inquiries));
  } catch (e) {
    console.error("Failed to save inquiries to storage", e);
  }
}

export async function getSupabaseAdmissions(): Promise<Admission[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("admissions")
        .select("*")
        .order("admission_date", { ascending: false });
        
      if (error) {
        console.error("Failed to fetch admissions from real Supabase:", error);
        throw error;
      }
      return (data || []).map(mapRowToAdmission);
    } catch (e) {
      console.error("Supabase fetch admissions failed, trying local storage:", e);
    }
  }

  try {
    const data = localStorage.getItem(STORAGE_ADMISSIONS_KEY);
    if (data) {
      return JSON.parse(data);
    } else {
      localStorage.setItem(STORAGE_ADMISSIONS_KEY, JSON.stringify(SEED_ADMISSIONS));
      return SEED_ADMISSIONS;
    }
  } catch (e) {
    console.error("Failed to read admissions from storage", e);
    return SEED_ADMISSIONS;
  }
}

export function saveSupabaseAdmissions(admissions: Admission[]) {
  try {
    localStorage.setItem(STORAGE_ADMISSIONS_KEY, JSON.stringify(admissions));
  } catch (e) {
    console.error("Failed to save admissions to storage", e);
  }
}

export async function addSupabaseInquiry(
  inquiryData: any,
  accessToken?: string,
  spreadsheetId?: string
): Promise<Inquiry> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const mappedRow = mapInquiryToRow(inquiryData);
      
      // Let the database automatically calculate the sequential Inquiry ID and academic year
      if (!mappedRow.id) {
        delete mappedRow.id;
        delete mappedRow.academic_year;
      }
      
      // Force status back to standard enum-compatible cases
      if (mappedRow.status) {
        mappedRow.status = String(mappedRow.status).toUpperCase();
      }

      const { data, error } = await supabase
        .from("leads")
        .insert([mappedRow])
        .select("*, lead_timeline(*)")
        .single();
        
      if (error) {
        console.error("Failed to insert lead into real Supabase:", error);
        throw error;
      }
      
      const newInquiry = mapRowToInquiry(data);
      
      // Mirror to Google Sheets CRM if spreadsheet is linked
      if (accessToken && spreadsheetId) {
        try {
          await mirrorInquiryToSheets(accessToken, spreadsheetId, newInquiry);
        } catch (sheetErr) {
          console.error("Failed to sync new inquiry to Google Sheets mirror:", sheetErr);
        }
      }
      
      return newInquiry;
    } catch (e) {
      console.error("Supabase lead insertion failed, falling back to local storage:", e);
    }
  }

  const inquiries = await getSupabaseInquiries();
  const dateObj = new Date();
  
  const id = inquiryData.id || generateInquiryId(inquiries, dateObj).id;
  const academicYear = inquiryData.academicYear || generateInquiryId(inquiries, dateObj).academicYear;
  const createdDate = inquiryData.createdDate || dateObj.toISOString().split("T")[0];
  const createdTime = inquiryData.createdTime || dateObj.toTimeString().split(" ")[0];
  const status = inquiryData.status || "NEW LEAD";
  const admissionStatus = inquiryData.admissionStatus || "None";
  
  const newInquiry: Inquiry = {
    ...inquiryData,
    id,
    academicYear,
    createdDate,
    createdTime,
    status,
    admissionStatus,
    timeline: inquiryData.timeline || [
      {
        id: "t_init",
        date: createdDate,
        time: createdTime,
        status,
        updatedBy: inquiryData.createdBy || "System",
        comments: "Inquiry generated and logged in Supabase database."
      }
    ]
  };

  inquiries.push(newInquiry);
  saveSupabaseInquiries(inquiries);

  saveSupabaseAuditLog({
    user: inquiryData.createdBy || "System",
    targetId: id,
    action: "CREATE INQUIRY",
    oldValue: "None",
    newValue: `Created inquiry for student ${newInquiry.studentName} (Course: ${newInquiry.selectedCourse})`
  });

  if (accessToken && spreadsheetId) {
    try {
      await mirrorInquiryToSheets(accessToken, spreadsheetId, newInquiry);
    } catch (sheetErr) {
      console.error("Failed to sync new inquiry to Google Sheets mirror:", sheetErr);
    }
  }

  return newInquiry;
}

export async function updateSupabaseInquiry(
  id: string,
  updatedFields: Partial<Omit<Inquiry, "id" | "academicYear">>,
  updatedBy: string,
  comments: string,
  accessToken?: string,
  spreadsheetId?: string
): Promise<Inquiry> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const mappedRow = mapInquiryToRow(updatedFields);
      
      const { error: updateError } = await supabase
        .from("leads")
        .update(mappedRow)
        .eq("id", id);
        
      if (updateError) {
        console.error(`Failed to update lead ${id} in real Supabase:`, updateError);
        throw updateError;
      }
      
      // Let's retrieve the fully updated row from the database (timeline is auto-generated database-side)
      const { data: finalData, error: finalError } = await supabase
        .from("leads")
        .select("*, lead_timeline(*)")
        .eq("id", id)
        .single();
        
      if (finalError) {
        throw finalError;
      }
      
      const finalInquiry = mapRowToInquiry(finalData);
      
      if (accessToken && spreadsheetId) {
        try {
          await mirrorInquiryToSheets(accessToken, spreadsheetId, finalInquiry);
        } catch (sheetErr) {
          console.error(`Failed to sync lead ${id} update to Google Sheets mirror:`, sheetErr);
        }
      }
      
      return finalInquiry;
    } catch (e) {
      console.error("Supabase lead update failed, falling back to local storage:", e);
    }
  }

  const inquiries = await getSupabaseInquiries();
  const index = inquiries.findIndex(i => i.id === id);
  if (index === -1) {
    throw new Error(`Inquiry with ID ${id} not found`);
  }

  const oldInquiry = inquiries[index];
  const dateObj = new Date();
  const dateStr = dateObj.toISOString().split("T")[0];
  const timeStr = dateObj.toTimeString().split(" ")[0];

  const newTimelineItem: ActivityTimelineItem = {
    id: `t_${Date.now()}`,
    date: dateStr,
    time: timeStr,
    status: updatedFields.status || oldInquiry.status,
    updatedBy,
    comments: comments || "Inquiry updated."
  };

  const updatedInquiry: Inquiry = {
    ...oldInquiry,
    ...updatedFields,
    timeline: [...(oldInquiry.timeline || []), newTimelineItem]
  };

  inquiries[index] = updatedInquiry;
  saveSupabaseInquiries(inquiries);

  const changedFields: string[] = [];
  Object.keys(updatedFields).forEach(key => {
    const k = key as keyof typeof updatedFields;
    if (updatedFields[k] !== oldInquiry[k]) {
      changedFields.push(`${k}: '${oldInquiry[k]}' -> '${updatedFields[k]}'`);
    }
  });

  saveSupabaseAuditLog({
    user: updatedBy || "System",
    targetId: id,
    action: "UPDATE INQUIRY",
    oldValue: "Active State",
    newValue: changedFields.length > 0 ? changedFields.join(", ") : comments
  });

  if (accessToken && spreadsheetId) {
    try {
      await mirrorInquiryToSheets(accessToken, spreadsheetId, updatedInquiry);
    } catch (sheetErr) {
      console.error("Failed to sync updated inquiry to Google Sheets mirror:", sheetErr);
    }
  }

  return updatedInquiry;
}

export async function createSupabaseAdmission(
  inquiryId: string,
  admissionDetails: Omit<Admission, "studentId" | "inquiryId" | "studentName" | "parentName" | "mobile" | "email">,
  accessToken?: string,
  spreadsheetId?: string
): Promise<Admission> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: leadRow, error: leadErr } = await supabase
        .from("leads")
        .select("*")
        .eq("id", inquiryId)
        .single();
        
      if (leadErr || !leadRow) {
        throw new Error(`Inquiry with ID ${inquiryId} not found in Supabase: ${leadErr?.message}`);
      }
      
      const studentId = leadRow.id.replace("SSA/", "SSA/STU/");
      
      const newAdmissionRow = {
        student_id: studentId,
        inquiry_id: inquiryId,
        student_name: leadRow.student_name,
        parent_name: leadRow.parent_name || "",
        mobile: leadRow.mobile,
        email: leadRow.email,
        enrolled_course: leadRow.selected_course_title,
        admission_date: admissionDetails.admissionDate,
        admission_fee: admissionDetails.admissionFee,
        payment_mode: admissionDetails.paymentMode,
        remarks: admissionDetails.remarks || ""
      };
      
      const { data: savedRow, error: admErr } = await supabase
        .from("admissions")
        .insert([newAdmissionRow])
        .select()
        .single();
        
      if (admErr) {
        console.error("Failed to insert student admission into real Supabase:", admErr);
        throw admErr;
      }
      
      await updateSupabaseInquiry(
        inquiryId,
        {
          status: "ENROLLED",
          admissionStatus: "Admitted",
          studentId: studentId
        },
        leadRow.createdBy || "System",
        `Admission finalized. Assigned permanent Student ID ${studentId}. Payment mode: ${admissionDetails.paymentMode}`,
        accessToken,
        spreadsheetId
      );
      
      const newAdmission = mapRowToAdmission(savedRow);
      
      if (accessToken && spreadsheetId) {
        try {
          await mirrorAdmissionToSheets(accessToken, spreadsheetId, newAdmission);
        } catch (sheetErr) {
          console.error("Failed to sync admission row to Google Sheets mirror:", sheetErr);
        }
      }
      
      return newAdmission;
    } catch (e) {
      console.error("Supabase admission creation failed, falling back to local storage:", e);
    }
  }

  const inquiries = await getSupabaseInquiries();
  const inquiryIndex = inquiries.findIndex(i => i.id === inquiryId);
  if (inquiryIndex === -1) {
    throw new Error(`Inquiry with ID ${inquiryId} not found`);
  }

  const inquiry = inquiries[inquiryIndex];
  const admissions = await getSupabaseAdmissions();
  
  const studentId = generateStudentId(admissions, inquiry.academicYear);
  
  const newAdmission: Admission = {
    studentId,
    inquiryId,
    studentName: inquiry.studentName,
    parentName: inquiry.parentName,
    mobile: inquiry.mobile,
    email: inquiry.email,
    enrolledCourse: inquiry.selectedCourse,
    admissionDate: admissionDetails.admissionDate,
    admissionFee: admissionDetails.admissionFee,
    paymentMode: admissionDetails.paymentMode,
    remarks: admissionDetails.remarks
  };

  admissions.push(newAdmission);
  saveSupabaseAdmissions(admissions);

  const updatedBy = inquiry.createdBy || "System";

  saveSupabaseAuditLog({
    user: updatedBy,
    targetId: studentId,
    action: "CONVERT STUDENT",
    oldValue: `Inquiry ${inquiryId}`,
    newValue: `Created student ${studentId} (${inquiry.studentName}) originating from Inquiry ${inquiryId}`
  });

  await updateSupabaseInquiry(
    inquiryId,
    {
      status: "ENROLLED",
      admissionStatus: "Admitted",
      studentId
    },
    updatedBy,
    `Admission finalized. Assigned permanent Student ID ${studentId}. Payment mode: ${admissionDetails.paymentMode}`,
    accessToken,
    spreadsheetId
  );

  if (accessToken && spreadsheetId) {
    try {
      await mirrorAdmissionToSheets(accessToken, spreadsheetId, newAdmission);
    } catch (sheetErr) {
      console.error("Failed to sync admission row to Sheets mirror:", sheetErr);
    }
  }

  return newAdmission;
}

export async function archiveSupabaseInquiry(
  id: string,
  user: string,
  accessToken?: string,
  spreadsheetId?: string
): Promise<Inquiry> {
  const inquiry = await updateSupabaseInquiry(
    id,
    { isArchived: true } as any,
    user,
    "Inquiry archived successfully.",
    accessToken,
    spreadsheetId
  );
  
  saveSupabaseAuditLog({
    user,
    targetId: id,
    action: "ARCHIVE INQUIRY",
    oldValue: "Active",
    newValue: "Archived"
  });

  return inquiry;
}

export async function restoreSupabaseInquiry(
  id: string,
  user: string,
  accessToken?: string,
  spreadsheetId?: string
): Promise<Inquiry> {
  const inquiry = await updateSupabaseInquiry(
    id,
    { isArchived: false, isDeleted: false } as any,
    user,
    "Inquiry restored to active list.",
    accessToken,
    spreadsheetId
  );
  
  saveSupabaseAuditLog({
    user,
    targetId: id,
    action: "RESTORE INQUIRY",
    oldValue: "Archived/Deleted",
    newValue: "Active"
  });

  return inquiry;
}

export async function softDeleteSupabaseInquiry(
  id: string,
  user: string,
  accessToken?: string,
  spreadsheetId?: string
): Promise<Inquiry> {
  const inquiry = await updateSupabaseInquiry(
    id,
    { isDeleted: true } as any,
    user,
    "Inquiry soft deleted (moved to Trash).",
    accessToken,
    spreadsheetId
  );
  
  saveSupabaseAuditLog({
    user,
    targetId: id,
    action: "SOFT DELETE INQUIRY",
    oldValue: "Active",
    newValue: "Soft Deleted"
  });

  return inquiry;
}

// =========================================================================
// 5. GOOGLE SHEETS MIRROR SYNC HELPERS
// =========================================================================

async function mirrorInquiryToSheets(
  accessToken: string,
  spreadsheetId: string,
  inquiry: Inquiry
): Promise<void> {
  const checkUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Leads!A2:V?majorDimension=ROWS`;
  const res = await fetch(checkUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  let existingRows: any[][] = [];
  if (res.ok) {
    const data = await res.json();
    existingRows = data.values || [];
  }

  const rowIndex = existingRows.findIndex(row => row[0] === inquiry.id);
  
  const rowValues = [
    inquiry.id,
    inquiry.createdDate,
    inquiry.createdTime,
    inquiry.studentName,
    inquiry.parentName,
    inquiry.email,
    inquiry.mobile,
    inquiry.selectedCourse,
    "Online",
    inquiry.inquiryType === "Others" ? inquiry.otherQuery : inquiry.remarks,
    inquiry.leadSource,
    inquiry.status,
    inquiry.priority,
    inquiry.assignedCounselor,
    inquiry.lastFollowUpDate || "",
    inquiry.lastFollowUpComment || "",
    inquiry.nextFollowUpDate || "",
    inquiry.nextFollowUpComment || "",
    inquiry.admissionStatus,
    inquiry.studentId || "",
    inquiry.createdBy,
    inquiry.remarks
  ];

  if (rowIndex !== -1) {
    const sheetsRowNumber = rowIndex + 2;
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Leads!A${sheetsRowNumber}:V${sheetsRowNumber}?valueInputOption=USER_ENTERED`;
    await fetch(updateUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ values: [rowValues] })
    });
  } else {
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Leads!A:V:append?valueInputOption=USER_ENTERED`;
    await fetch(appendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ values: [rowValues] })
    });
  }
}

async function mirrorAdmissionToSheets(
  accessToken: string,
  spreadsheetId: string,
  admission: Admission
): Promise<void> {
  try {
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;
    const metaRes = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (metaRes.ok) {
      const metaData = await metaRes.json();
      const hasAdmissionsTab = metaData.sheets?.some((s: any) => s.properties?.title === "Admissions");
      
      if (!hasAdmissionsTab) {
        const addTabUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
        await fetch(addTabUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            requests: [{ addSheet: { properties: { title: "Admissions" } } }]
          })
        });

        const headersUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Admissions!A1:J1?valueInputOption=USER_ENTERED`;
        await fetch(headersUrl, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            values: [
              ["Student ID", "Inquiry ID", "Student Name", "Parent Name", "Mobile", "Email", "Enrolled Course", "Admission Date", "Admission Fee", "Payment Mode", "Remarks"]
            ]
          })
        });
      }
    }
  } catch (e) {
    console.error("Error creating admissions tab in Sheets:", e);
  }

  const rowValues = [
    admission.studentId,
    admission.inquiryId,
    admission.studentName,
    admission.parentName || "",
    admission.mobile,
    admission.email,
    admission.enrolledCourse,
    admission.admissionDate,
    admission.admissionFee,
    admission.paymentMode,
    admission.remarks || ""
  ];

  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Admissions!A:K:append?valueInputOption=USER_ENTERED`;
  await fetch(appendUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ values: [rowValues] })
  });
}
