import { getAccessToken, sendGmailEmails } from "./gmail";
import { triggerChatNewLead, triggerChatNotification } from "./chat";
import { addSupabaseInquiry } from "./supabaseClient";

export interface LeadSubmission {
  id?: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  message: string;
  sourcePage: string;
  date?: string;
  time?: string;
  parentName?: string;
  remarks?: string;
  status?: string;
  otherQuery?: string;
}

const OFFLINE_QUEUE_KEY = "ss_crm_offline_leads";
const SPREADSHEET_NAME = "Shelly Sharma Academy CRM";

// Save a lead to local storage queue
export function queueLeadLocally(lead: Omit<LeadSubmission, "id">): string {
  try {
    const queue = getQueuedLeads();
    
    const dateObj = new Date();
    const yy = String(dateObj.getFullYear()).slice(-2);
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const dateStr = `${yy}${mm}${dd}`;
    const randSuffix = String(Math.floor(1000 + Math.random() * 9000));
    
    // Generate an offline-style reference number for immediate UI feedback
    const tempId = `SSA-OFF${dateStr}-${randSuffix}`;
    const date = dateObj.toISOString().split("T")[0];
    const time = dateObj.toTimeString().split(" ")[0];

    const queuedLead: LeadSubmission = {
      ...lead,
      id: tempId,
      date,
      time
    };

    queue.push(queuedLead);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    console.log("Lead queued locally:", queuedLead);
    
    // Trigger Google Chat notification queueing
    try {
      triggerChatNewLead(queuedLead);
    } catch (chatError) {
      console.error("Failed to queue Chat notification:", chatError);
    }
    
    return tempId;
  } catch (error) {
    console.error("Failed to queue lead locally:", error);
    return `SSA-${Date.now()}`;
  }
}

// Get all queued leads from local storage
export function getQueuedLeads(): LeadSubmission[] {
  try {
    const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to parse queued leads:", error);
    return [];
  }
}

// Clear or set the queued leads in local storage
export function setQueuedLeads(queue: LeadSubmission[]) {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Failed to update queued leads:", error);
  }
}

// Search for Shelly Sharma Academy CRM spreadsheet, create it if missing
async function getOrCreateSpreadsheet(accessToken: string): Promise<string> {
  // 1. Search for existing spreadsheet
  const query = encodeURIComponent(`name = '${SPREADSHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`;
  
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!searchRes.ok) {
    throw new Error(`Failed to search spreadsheet: ${searchRes.statusText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // 2. Not found, create it with Sheets API to include all tabs in a single call
  const createUrl = "https://sheets.googleapis.com/v4/spreadsheets";
  const createRes = await fetch(createUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      properties: {
        title: SPREADSHEET_NAME
      },
      sheets: [
        { properties: { title: "Dashboard" } },
        { properties: { title: "Leads" } },
        { properties: { title: "Demo Bookings" } },
        { properties: { title: "Students" } },
        { properties: { title: "Reviews" } },
        { properties: { title: "Follow Ups" } },
        { properties: { title: "Website Analytics" } }
      ]
    })
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create spreadsheet: ${createRes.statusText}`);
  }

  const createData = await createRes.json();
  const spreadsheetId = createData.spreadsheetId;

  // 3. Initialize column headers for all sheets
  await initializeSpreadsheetHeaders(accessToken, spreadsheetId);

  return spreadsheetId;
}

// Write the required headers to all sheets in the workbook
async function initializeSpreadsheetHeaders(accessToken: string, spreadsheetId: string): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      valueInputOption: "RAW",
      data: [
        {
          range: "Leads!A1:V1",
          values: [[
            "Lead ID", "Date", "Time", "Student Name", "Parent Name", 
            "Email", "Phone", "Selected Course", "Preferred Mode", 
            "Message", "Source Page", "Status", "Remarks",
            "Meet Link", "Meeting ID", "Calendar Event ID", "Meeting Status",
            "Meeting Created Time", "Meeting Started", "Meeting Completed",
            "Rescheduled", "Cancelled"
          ]]
        },
        {
          range: "Demo Bookings!A1:J1",
          values: [[
            "Booking ID", "Date", "Time", "Student Name", "Email", 
            "Phone", "Course", "Preferred Date", "Preferred Time", "Status"
          ]]
        },
        {
          range: "Students!A1:H1",
          values: [[
            "Student ID", "Enrollment Date", "Name", "Email", 
            "Phone", "Course", "Status", "Payment Status"
          ]]
        },
        {
          range: "Reviews!A1:F1",
          values: [[
            "Review ID", "Date", "Name", "Rating", "Comment", "Status"
          ]]
        },
        {
          range: "Follow Ups!A1:F1",
          values: [[
            "Follow-Up ID", "Lead ID", "Date", "Notes", "Next Follow-Up Date", "Status"
          ]]
        },
        {
          range: "Website Analytics!A1:E1",
          values: [[
            "Event ID", "Timestamp", "Page", "Event Type", "Description"
          ]]
        }
      ]
    })
  });

  if (!response.ok) {
    console.error("Failed to write spreadsheet headers:", await response.text());
  }
}

// Fetch all existing Lead IDs to generate next sequential auto-incremented ID
async function fetchExistingLeadIds(accessToken: string, spreadsheetId: string): Promise<string[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Leads!A2:A?majorDimension=COLUMNS`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  if (data.values && data.values.length > 0) {
    return data.values[0];
  }
  return [];
}

// Core sequence generator: SSA2507150001, incrementing dynamically based on current day
function generateSequentialLeadId(existingIds: string[]): string {
  const dateObj = new Date();
  const yy = String(dateObj.getFullYear()).slice(-2);
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const dateStr = `${yy}${mm}${dd}`; // "260714"
  const prefix = `SSA${dateStr}`;

  const dailyIds = existingIds.filter(id => id && id.startsWith(prefix));
  let nextSeq = 1;

  if (dailyIds.length > 0) {
    const suffixes = dailyIds.map(id => {
      const suffixStr = id.slice(prefix.length);
      const num = parseInt(suffixStr, 10);
      return isNaN(num) ? 0 : num;
    });
    nextSeq = Math.max(...suffixes) + 1;
  }

  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}

// Push a lead directly to Google Sheets CRM (Now Supabase-First, One-Way Mirror to Sheets)
export async function syncLeadToSheets(
  accessToken: string,
  lead: Omit<LeadSubmission, "id">
): Promise<string> {
  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  
  // Create in Supabase first (which acts as source of truth and generates sequential ID)
  const mappedInquiryData = {
    studentName: lead.name,
    parentName: lead.parentName || "",
    email: lead.email,
    mobile: lead.phone,
    inquiryType: lead.program,
    selectedCourse: lead.program,
    otherQuery: lead.program === "Others" ? (lead.otherQuery || lead.message || "") : "",
    remarks: lead.remarks || lead.message || "",
    status: (lead.status || "NEW LEAD") as any,
    priority: "MEDIUM" as const,
    leadSource: (lead.sourcePage === "Contact Page" ? "Website" : "Google") as any,
    assignedCounselor: "Shelly Sharma",
    createdBy: "System",
    admissionStatus: "None" as const,
  };

  const newInquiry = await addSupabaseInquiry(mappedInquiryData, accessToken, spreadsheetId);
  const leadId = newInquiry.id;

  console.log(`Lead ${leadId} successfully written to Supabase and mirrored to Google Sheets CRM`);
  
  // Trigger Google Chat notifications
  try {
    await triggerChatNewLead({ ...lead, id: leadId }, accessToken);
    await triggerChatNotification("CRM_UPDATED_SUCCESS", {
      studentName: lead.name,
      phone: lead.phone,
      email: lead.email,
      course: lead.program,
      id: leadId,
      crmStatus: "Appended Row Successfully (Leads tab)"
    }, accessToken);
  } catch (chatError) {
    console.error("Failed to trigger Chat notification for new lead or CRM update:", chatError);
  }

  return leadId;
}

// Background sync function for queued offline leads
export async function syncQueuedLeads(accessToken: string): Promise<void> {
  const queue = getQueuedLeads();
  if (queue.length === 0) return;

  console.log(`Attempting to sync ${queue.length} offline leads...`);
  const remaining: LeadSubmission[] = [];

  for (const lead of queue) {
    try {
      // Re-push using CRM sheets sync, which assigns proper sequential IDs
      const leadId = await syncLeadToSheets(accessToken, {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        program: lead.program,
        message: lead.message,
        sourcePage: lead.sourcePage || "Contact Page",
        parentName: lead.parentName,
        remarks: lead.remarks,
        status: lead.status || "NEW LEAD",
        otherQuery: lead.otherQuery
      });

      // Trigger automatic Gmail notification on synchronization
      try {
        await sendGmailEmails(accessToken, {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          program: lead.program,
          message: lead.otherQuery || lead.message || "",
          parentName: lead.parentName,
          remarks: lead.remarks,
          preferredDate: lead.date,
          preferredTime: lead.time,
          otherQuery: lead.otherQuery
        }, leadId);
      } catch (emailError) {
        console.error(`Failed to dispatch automatic email notification during sync for lead ${leadId}:`, emailError);
      }
    } catch (error) {
      console.error(`Failed to sync queued lead ${lead.id}:`, error);
      remaining.push(lead); // Keep in queue for next attempt
    }
  }

  setQueuedLeads(remaining);
}

// Update specific meeting columns for a lead inside Google Sheets CRM
export async function updateCRMMeetingDetails(
  accessToken: string,
  leadId: string,
  fields: {
    meetLink?: string;
    meetingId?: string;
    calendarEventId?: string;
    meetingStatus?: string;
    meetingCreatedTime?: string;
    meetingStarted?: string;
    meetingCompleted?: string;
    rescheduled?: string;
    cancelled?: string;
    date?: string; // Column B
    time?: string; // Column C
    status?: string; // Column L
    remarks?: string; // Column M
  }
): Promise<boolean> {
  try {
    const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
    const existingIds = await fetchExistingLeadIds(accessToken, spreadsheetId);
    const index = existingIds.indexOf(leadId);
    if (index === -1) {
      console.warn(`Lead ID ${leadId} not found in sheet for meeting update.`);
      return false;
    }
    const rowIndex = index + 2;

    const data = [];
    if (fields.date !== undefined) {
      data.push({ range: `Leads!B${rowIndex}`, values: [[fields.date]] });
    }
    if (fields.time !== undefined) {
      data.push({ range: `Leads!C${rowIndex}`, values: [[fields.time]] });
    }
    if (fields.status !== undefined) {
      data.push({ range: `Leads!L${rowIndex}`, values: [[fields.status]] });
    }
    if (fields.remarks !== undefined) {
      data.push({ range: `Leads!M${rowIndex}`, values: [[fields.remarks]] });
    }
    if (fields.meetLink !== undefined) {
      data.push({ range: `Leads!N${rowIndex}`, values: [[fields.meetLink]] });
    }
    if (fields.meetingId !== undefined) {
      data.push({ range: `Leads!O${rowIndex}`, values: [[fields.meetingId]] });
    }
    if (fields.calendarEventId !== undefined) {
      data.push({ range: `Leads!P${rowIndex}`, values: [[fields.calendarEventId]] });
    }
    if (fields.meetingStatus !== undefined) {
      data.push({ range: `Leads!Q${rowIndex}`, values: [[fields.meetingStatus]] });
    }
    if (fields.meetingCreatedTime !== undefined) {
      data.push({ range: `Leads!R${rowIndex}`, values: [[fields.meetingCreatedTime]] });
    }
    if (fields.meetingStarted !== undefined) {
      data.push({ range: `Leads!S${rowIndex}`, values: [[fields.meetingStarted]] });
    }
    if (fields.meetingCompleted !== undefined) {
      data.push({ range: `Leads!T${rowIndex}`, values: [[fields.meetingCompleted]] });
    }
    if (fields.rescheduled !== undefined) {
      data.push({ range: `Leads!U${rowIndex}`, values: [[fields.rescheduled]] });
    }
    if (fields.cancelled !== undefined) {
      data.push({ range: `Leads!V${rowIndex}`, values: [[fields.cancelled]] });
    }

    if (data.length === 0) return true;

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        valueInputOption: "USER_ENTERED",
        data
      })
    });

    return res.ok;
  } catch (error) {
    console.error(`Failed to update CRM meeting details for lead ${leadId}:`, error);
    return false;
  }
}

// Attach a Google Meet URL directly to a lead's row inside the Google Sheet CRM
export async function attachMeetUrlToLead(
  accessToken: string,
  leadId: string,
  meetUrl: string,
  calendarEventId?: string
): Promise<boolean> {
  try {
    const meetingId = meetUrl.split("/").pop() || "";
    const success = await updateCRMMeetingDetails(accessToken, leadId, {
      status: "DEMO BOOKED",
      remarks: `Meet Link: ${meetUrl}`,
      meetLink: meetUrl,
      meetingId: meetingId,
      calendarEventId: calendarEventId || "",
      meetingStatus: "Confirmed",
      meetingCreatedTime: new Date().toLocaleString(),
      meetingStarted: "No",
      meetingCompleted: "No",
      rescheduled: "No",
      cancelled: "No"
    });
    console.log(`Successfully attached Meet link ${meetUrl} to Lead ${leadId}`);
    return success;
  } catch (error) {
    console.error(`Failed to attach Meet URL to lead row for ${leadId}:`, error);
    return false;
  }
}

