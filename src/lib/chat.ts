import { LeadSubmission } from "./crm";
import { getAuth } from "firebase/auth";

export interface ChatNotification {
  id: string;
  type: "NEW_LEAD" | "DEMO_BOOKED" | "MEET_READY" | "STATUS_CHANGED";
  text: string;
  timestamp: string;
  status: "sent" | "failed" | "pending";
  read: boolean;
}

export type ChatEventType =
  | "NEW_ASSESSMENT_BOOKING"
  | "NEW_DEMO_CLASS"
  | "CONTACT_FORM_SUBMITTED"
  | "LEAD_CREATED"
  | "LEAD_UPDATED"
  | "STUDENT_ENROLLED"
  | "MEETING_SCHEDULED"
  | "MEETING_RESCHEDULED"
  | "MEETING_CANCELLED"
  | "GMAIL_SENT_SUCCESS"
  | "CRM_UPDATED_SUCCESS"
  | "DRIVE_FOLDER_CREATED"
  | "WORKSHEET_UPLOADED"
  | "WEBSITE_ERROR"
  | "GMAIL_SEND_FAILED"
  | "CALENDAR_SYNC_FAILED"
  | "DRIVE_UPLOAD_FAILED";

const HISTORY_KEY = "ss_chat_notifications_history";
const QUEUE_KEY = "ss_chat_notifications_queue";
const LAST_SYNC_KEY = "ss_chat_notifications_last_sync";

// Verify if the active Firebase Auth user is an authorized administrator
export function isAuthorizedAdmin(): boolean {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user || !user.email) return false;
    const email = user.email.toLowerCase();
    return email === "shellysharmamail@gmail.com" || email === "amitbansal21@gmail.com";
  } catch (error) {
    return false;
  }
}

// Retrieve recent notifications from history
export function getChatNotificationsHistory(): ChatNotification[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to parse chat notification history:", error);
    return [];
  }
}

// Retrieve unread count
export function getChatUnreadCount(): number {
  const history = getChatNotificationsHistory();
  return history.filter(n => !n.read).length;
}

// Mark all history notifications as read
export function markChatNotificationsAsRead(): void {
  try {
    const history = getChatNotificationsHistory();
    const updated = history.map(n => ({ ...n, read: true }));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to mark chat notifications as read:", error);
  }
}

// Retrieve last sync time
export function getChatLastSyncTime(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}

// Save last sync time
function saveChatLastSyncTime(): void {
  const now = new Date().toLocaleString();
  localStorage.setItem(LAST_SYNC_KEY, now);
}

// Retrieve the unsent queue
export function getChatNotificationsQueue(): ChatNotification[] {
  try {
    const data = localStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to parse chat notification queue:", error);
    return [];
  }
}

// Save queue
function saveChatNotificationsQueue(queue: ChatNotification[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Failed to save chat notification queue:", error);
  }
}

// Save history
function saveChatNotificationsHistory(history: ChatNotification[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save chat notification history:", error);
  }
}

// Get or dynamically create a Google Chat space named "SSA Notifications"
async function getOrCreateChatSpace(accessToken: string): Promise<string> {
  const listUrl = "https://chat.googleapis.com/v1/spaces";
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!listRes.ok) {
    throw new Error(`Failed to list Google Chat spaces: ${listRes.statusText}`);
  }

  const listData = await listRes.json();
  const spaces = listData.spaces || [];

  const existingSpace = spaces.find(
    (s: any) => s.displayName === "SSA Notifications" && s.spaceType === "SPACE"
  );

  if (existingSpace) {
    return existingSpace.name;
  }

  console.log("Space 'SSA Notifications' not found. Creating a new Google Chat space...");
  const createRes = await fetch(listUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      spaceType: "SPACE",
      displayName: "SSA Notifications"
    })
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create Google Chat space: ${createRes.statusText}`);
  }

  const createData = await createRes.json();
  return createData.name;
}

// Direct API call to send a message to a specific space
async function sendChatMessageToSpace(
  accessToken: string,
  spaceName: string,
  text: string
): Promise<boolean> {
  const url = `https://chat.googleapis.com/v1/${spaceName}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  });

  return res.ok;
}

// Send a custom formatted report message directly to Google Chat
export async function triggerCustomChatReport(
  text: string,
  accessToken: string
): Promise<boolean> {
  if (!isAuthorizedAdmin()) {
    console.warn("Blocked custom report: admin is not authorized.");
    return false;
  }
  try {
    const spaceName = await getOrCreateChatSpace(accessToken);
    const success = await sendChatMessageToSpace(accessToken, spaceName, text);
    if (success) {
      saveChatLastSyncTime();
    }
    return success;
  } catch (err) {
    console.error("Failed to send custom chat report:", err);
    return false;
  }
}

// Internal function to add a notification to history and pending queue, then try sending it
async function dispatchNotification(
  notification: ChatNotification,
  accessToken?: string
): Promise<void> {
  const history = getChatNotificationsHistory();
  const queue = getChatNotificationsQueue();

  // Add to history (always show in dashboard)
  history.unshift(notification);
  saveChatNotificationsHistory(history);

  // If no accessToken is provided, or if the active user is not an authorized administrator,
  // we keep the notification queued locally as "pending" for safety and data privacy.
  if (!accessToken || !isAuthorizedAdmin()) {
    console.warn("Unauthorized user or missing token. Keeping Chat notification in local queue/history...");
    queue.push(notification);
    saveChatNotificationsQueue(queue);
    return;
  }

  try {
    const spaceName = await getOrCreateChatSpace(accessToken);
    const success = await sendChatMessageToSpace(accessToken, spaceName, notification.text);

    if (success) {
      console.log(`Successfully delivered Chat notification: ${notification.id}`);
      const updatedHistory = getChatNotificationsHistory().map(n => 
        n.id === notification.id ? { ...n, status: "sent" as const } : n
      );
      saveChatNotificationsHistory(updatedHistory);
      saveChatLastSyncTime();
    } else {
      throw new Error("Chat send returned false/error status");
    }
  } catch (error) {
    console.error("Failed to send Google Chat notification immediately:", error);
    const updatedHistory = getChatNotificationsHistory().map(n => 
      n.id === notification.id ? { ...n, status: "failed" as const } : n
    );
    saveChatNotificationsHistory(updatedHistory);

    queue.push({ ...notification, status: "failed" });
    saveChatNotificationsQueue(queue);
  }
}

// Sync/flush any pending notifications in the queue
export async function syncQueuedChatNotifications(accessToken: string): Promise<void> {
  const queue = getChatNotificationsQueue();
  if (queue.length === 0) return;

  if (!isAuthorizedAdmin()) {
    console.warn("Blocked sync: Current administrator is not authorized to deliver to Google Chat.");
    return;
  }

  console.log(`Syncing ${queue.length} pending Google Chat notifications...`);
  const remaining: ChatNotification[] = [];

  try {
    const spaceName = await getOrCreateChatSpace(accessToken);
    
    for (const notif of queue) {
      try {
        const success = await sendChatMessageToSpace(accessToken, spaceName, notif.text);
        if (success) {
          console.log(`Successfully sent queued notification: ${notif.id}`);
          const history = getChatNotificationsHistory();
          const updatedHistory = history.map(n => 
            n.id === notif.id ? { ...n, status: "sent" as const } : n
          );
          saveChatNotificationsHistory(updatedHistory);
          saveChatLastSyncTime();
        } else {
          remaining.push(notif);
        }
      } catch (err) {
        console.error(`Error sending queued notification ${notif.id}:`, err);
        remaining.push(notif);
      }
    }
  } catch (spaceErr) {
    console.error("Failed to resolve space for queue sync:", spaceErr);
    return;
  }

  saveChatNotificationsQueue(remaining);
}

// Unified Rich Trigger Notification Engine
export async function triggerChatNotification(
  eventType: ChatEventType,
  data: {
    studentName?: string;
    name?: string;
    phone?: string;
    email?: string;
    course?: string;
    program?: string;
    leadId?: string;
    id?: string;
    date?: string;
    meetingDate?: string;
    time?: string;
    meetLink?: string;
    meetUrl?: string;
    driveFolder?: string;
    driveFolderUrl?: string;
    crmStatus?: string;
    gmailStatus?: string;
    errorType?: string;
    errorMessage?: string;
    suggestedRetry?: string;
    worksheetName?: string;
    customMessage?: string;
  },
  accessToken?: string
): Promise<void> {
  const name = data.studentName || data.name || "N/A";
  const phone = data.phone || "N/A";
  const email = data.email || "N/A";
  const course = data.course || data.program || "N/A";
  const leadId = data.leadId || data.id || "N/A";
  const date = data.meetingDate || data.date || "N/A";
  const time = data.time || "N/A";
  const meetLink = data.meetLink || data.meetUrl || "N/A";
  const driveFolder = data.driveFolder || data.driveFolderUrl || "N/A";
  const crmStatus = data.crmStatus || "Active Pipeline";
  const gmailStatus = data.gmailStatus || "Success";

  let title = "Notification";
  let priority: "success" | "warning" | "error" | "info" = "success";
  let icon = "🟢";

  switch (eventType) {
    case "NEW_ASSESSMENT_BOOKING":
      title = "🎓 New Assessment Booking";
      priority = "success";
      icon = "🟢";
      break;
    case "NEW_DEMO_CLASS":
      title = "📅 New Demo Class Booked";
      priority = "success";
      icon = "🟢";
      break;
    case "CONTACT_FORM_SUBMITTED":
      title = "✉ Contact Form Submitted";
      priority = "success";
      icon = "🟢";
      break;
    case "LEAD_CREATED":
      title = "📥 New Lead Created";
      priority = "success";
      icon = "🟢";
      break;
    case "LEAD_UPDATED":
      title = "🔄 Lead Updated";
      priority = "warning";
      icon = "🟡";
      break;
    case "STUDENT_ENROLLED":
      title = "🎉 Student Enrolled";
      priority = "success";
      icon = "🟢";
      break;
    case "MEETING_SCHEDULED":
      title = "🎥 Meeting Scheduled";
      priority = "success";
      icon = "🟢";
      break;
    case "MEETING_RESCHEDULED":
      title = "🔄 Meeting Rescheduled";
      priority = "warning";
      icon = "🟡";
      break;
    case "MEETING_CANCELLED":
      title = "❌ Meeting Cancelled";
      priority = "error";
      icon = "🔴";
      break;
    case "GMAIL_SENT_SUCCESS":
      title = "✉ Gmail Sent Successfully";
      priority = "success";
      icon = "🟢";
      break;
    case "CRM_UPDATED_SUCCESS":
      title = "📊 CRM Sheet Updated Successfully";
      priority = "success";
      icon = "🟢";
      break;
    case "DRIVE_FOLDER_CREATED":
      title = "📂 Drive Folder Created";
      priority = "success";
      icon = "🟢";
      break;
    case "WORKSHEET_UPLOADED":
      title = "📝 Worksheet Uploaded";
      priority = "success";
      icon = "🟢";
      break;
    case "WEBSITE_ERROR":
      title = "⚠️ Website System Error";
      priority = "error";
      icon = "🔴";
      break;
    case "GMAIL_SEND_FAILED":
      title = "❌ Failed Gmail Delivery";
      priority = "error";
      icon = "🔴";
      break;
    case "CALENDAR_SYNC_FAILED":
      title = "❌ Failed Calendar Sync";
      priority = "error";
      icon = "🔴";
      break;
    case "DRIVE_UPLOAD_FAILED":
      title = "❌ Failed Drive Folder/File Upload";
      priority = "error";
      icon = "🔴";
      break;
  }

  let text = `
[${icon} ${priority.toUpperCase()}] ${title}
━━━━━━━━━━━━━━━━━━━━━━━━━━
🎓 *Student Name:* ${name}
📞 *Phone:* ${phone}
📧 *Email:* ${email}
📘 *Course:* ${course}
🆔 *Lead ID:* ${leadId}
📅 *Meeting Date:* ${date}
🕒 *Time:* ${time}
🎥 *Meet Link:* ${meetLink !== "N/A" ? `<${meetLink}|Join Meet>` : "N/A"}
📂 *Drive Folder:* ${driveFolder !== "N/A" ? `<${driveFolder}|Open Folder>` : "N/A"}
📊 *CRM Status:* ${crmStatus}
✉ *Gmail Status:* ${gmailStatus}
`.trim();

  if (data.worksheetName) {
    text += `\n📝 *Worksheet:* ${data.worksheetName}`;
  }
  if (data.errorType || data.errorMessage) {
    text += `\n⚠️ *Error:* ${data.errorType || "System Error"} - ${data.errorMessage || ""}`;
  }
  if (data.suggestedRetry) {
    text += `\n🔄 *Suggested Action:* ${data.suggestedRetry}`;
  }
  if (data.customMessage) {
    text += `\nℹ️ *Info:* ${data.customMessage}`;
  }

  text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n⚡ *Quick Actions:*`;
  
  const actionsList = [];
  actionsList.push(`<https://docs.google.com|Open CRM>`);
  actionsList.push(`<https://calendar.google.com|Open Calendar>`);
  if (meetLink !== "N/A") actionsList.push(`<${meetLink}|Join Google Meet>`);
  if (driveFolder !== "N/A") actionsList.push(`<${driveFolder}|Open Drive Folder>`);
  if (email !== "N/A") actionsList.push(`<mailto:${email}?subject=Shelly%20Sharma%20Academy%20Update|Reply via Gmail>`);
  actionsList.push(`<${window.location.origin}/admin|Mark Follow-up Done>`);

  text += `\n${actionsList.join("  |  ")}`;

  const timestamp = new Date().toISOString();
  const notification: ChatNotification = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: eventType.includes("LEAD") ? "NEW_LEAD" : eventType.includes("DEMO") ? "DEMO_BOOKED" : eventType.includes("MEET") ? "MEET_READY" : "STATUS_CHANGED",
    text,
    timestamp,
    status: "pending",
    read: false
  };

  await dispatchNotification(notification, accessToken);
}

// COMPATIBILITY TRIGGERS (Preserve existing API signatures to guarantee zero breakages)

export async function triggerChatNewLead(
  lead: LeadSubmission,
  accessToken?: string
): Promise<void> {
  await triggerChatNotification("LEAD_CREATED", lead, accessToken);
}

export async function triggerChatDemoBooked(
  booking: {
    studentName: string;
    parentName?: string;
    date: string;
    time: string;
  },
  accessToken?: string
): Promise<void> {
  await triggerChatNotification("NEW_DEMO_CLASS", booking, accessToken);
}

export async function triggerChatMeetReady(
  meetUrl: string,
  accessToken?: string
): Promise<void> {
  await triggerChatNotification("MEETING_SCHEDULED", { meetUrl }, accessToken);
}

export async function triggerChatStatusChanged(
  details: {
    studentName: string;
    oldStatus: string;
    newStatus: string;
  },
  accessToken?: string
): Promise<void> {
  await triggerChatNotification("LEAD_UPDATED", {
    studentName: details.studentName,
    customMessage: `Status transitioned from ${details.oldStatus} to ${details.newStatus}`
  }, accessToken);
}

export async function triggerChatMeetCreated(
  details: {
    leadId: string;
    student: string;
    course: string;
    date: string;
    time: string;
    meetUrl: string;
  },
  accessToken?: string
): Promise<void> {
  await triggerChatNotification("NEW_ASSESSMENT_BOOKING", {
    id: details.leadId,
    studentName: details.student,
    course: details.course,
    date: details.date,
    time: details.time,
    meetUrl: details.meetUrl
  }, accessToken);
}

export async function triggerChatMeetRescheduled(
  details: {
    leadId: string;
    student: string;
    course: string;
    oldDate: string;
    oldTime: string;
    newDate: string;
    newTime: string;
    meetUrl: string;
  },
  accessToken?: string
): Promise<void> {
  await triggerChatNotification("MEETING_RESCHEDULED", {
    id: details.leadId,
    studentName: details.student,
    course: details.course,
    date: details.newDate,
    time: details.newTime,
    meetUrl: details.meetUrl,
    customMessage: `Rescheduled from ${details.oldDate} ${details.oldTime}`
  }, accessToken);
}

export async function triggerChatMeetCancelled(
  details: {
    leadId: string;
    student: string;
    course: string;
    date: string;
    time: string;
  },
  accessToken?: string
): Promise<void> {
  await triggerChatNotification("MEETING_CANCELLED", {
    id: details.leadId,
    studentName: details.student,
    course: details.course,
    date: details.date,
    time: details.time
  }, accessToken);
}
