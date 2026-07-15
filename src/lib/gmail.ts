import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";
import { syncQueuedLeads } from "./crm";
import { triggerChatNotification } from "./chat";

// Initialize Firebase app if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// We add the gmail.send scope to send emails on the user's behalf
provider.addScope("https://www.googleapis.com/auth/gmail.send");
provider.addScope("https://www.googleapis.com/auth/spreadsheets");
provider.addScope("https://www.googleapis.com/auth/drive.file");
provider.addScope("https://www.googleapis.com/auth/calendar.events");
provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
provider.addScope("https://www.googleapis.com/auth/drive");
provider.addScope("https://www.googleapis.com/auth/chat.spaces");
provider.addScope("https://www.googleapis.com/auth/chat.messages.create");

export interface AssessmentData {
  name: string;
  email: string;
  phone: string;
  program: string;
  message: string;
}

// In-memory cache for the access token
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Authenticate with Google and get access token
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get access token from Firebase Auth");
    }

    cachedAccessToken = credential.accessToken;
    // Trigger background sync for queued offline leads
    syncQueuedLeads(cachedAccessToken).catch(err => {
      console.error("Background lead sync failed:", err);
    });
    
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Listen for auth state change
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
        // Trigger background sync for queued offline leads
        syncQueuedLeads(cachedAccessToken).catch(err => {
          console.error("Background lead sync failed:", err);
        });
      } else {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Generate reference number SSA-YYYYMMDD-XXXX
export function generateReferenceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const randomSeq = String(Math.floor(1000 + Math.random() * 9000));
  return `SSA-${year}${month}${day}-${randomSeq}`;
}

// Build MIME message safely for base64 encoding
function buildMimeMessage(
  to: string,
  fromName: string,
  fromEmail: string,
  subject: string,
  htmlBody: string
): string {
  const boundary = "boundary_" + Math.random().toString(36).substring(2);
  const subjectEncoded = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const fromHeader = fromName
    ? `From: ${fromName} <${fromEmail}>`
    : `From: ${fromEmail}`;
  const parts = [
    `To: ${to}`,
    fromHeader,
    `Subject: ${subjectEncoded}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    btoa(unescape(encodeURIComponent(htmlBody))),
    `--${boundary}--`,
  ];
  return parts.join("\r\n");
}

// Send both assessment and confirmation emails
export async function sendGmailEmails(
  accessToken: string,
  data: AssessmentData,
  referenceNumber: string,
  bookingDetails?: {
    date: string;
    time: string;
    meetUrl?: string | null;
  }
): Promise<boolean> {
  const visitorEmail = data.email;
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "mail.shelly.sharma@gmail.com";

  // Capture user-agent and metadata
  const userAgent = navigator.userAgent;
  const timezone = `${Intl.DateTimeFormat().resolvedOptions().timeZone} (${navigator.language})`;
  const submissionTime = new Date().toLocaleString();

  // Clean phone number for WhatsApp and call links
  const rawPhone = data.phone || "";
  const waPhone = rawPhone.replace(/[^0-9]/g, "");

  // 1. Build Shelly Sharma Admin Email Content
  const adminHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid rgba(173,86,196,0.15); border-radius: 24px; background-color: #FAF7F2; color: #23152B;">
  <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #AD56C4; padding-bottom: 16px;">
    <h2 style="margin: 0; font-family: Georgia, serif; color: #23152B; font-size: 24px;">Shelly Sharma Academy</h2>
    <span style="font-family: monospace; font-size: 10px; letter-spacing: 2px; color: #AD56C4; text-transform: uppercase; font-weight: bold;">New Assessment Booking</span>
  </div>
  
  <p style="font-size: 14px; line-height: 1.6;">You have received a new level diagnostic assessment request. Below are the details of the student/parent:</p>
  
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px;">
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); font-weight: bold; width: 35%;">Submission Time:</td>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); color: #23152B;">${submissionTime}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); font-weight: bold;">Reference Number:</td>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); font-weight: bold; color: #AD56C4;">${referenceNumber}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); font-weight: bold;">Student / Parent Name:</td>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); font-weight: bold; color: #23152B;">${data.name}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); font-weight: bold;">Email Address:</td>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1);"><a href="mailto:${visitorEmail}" style="color: #AD56C4; text-decoration: none;">${visitorEmail}</a></td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); font-weight: bold;">Phone Number:</td>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); color: #23152B;">${data.phone}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); font-weight: bold;">Selected Course:</td>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); font-weight: bold; color: #23152B;">${data.program}</td>
    </tr>
    ${bookingDetails ? `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); font-weight: bold;">Assessment Date:</td>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); font-weight: bold; color: #23152B;">${bookingDetails.date}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); font-weight: bold;">Assessment Time:</td>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); font-weight: bold; color: #23152B;">${bookingDetails.time}</td>
    </tr>
    ${bookingDetails.meetUrl ? `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); font-weight: bold;">Google Meet Link:</td>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); font-weight: bold; color: #AD56C4;"><a href="${bookingDetails.meetUrl}" style="color: #AD56C4; text-decoration: underline;">${bookingDetails.meetUrl}</a></td>
    </tr>
    ` : ""}
    ` : ""}
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); font-weight: bold;">Language Challenges:</td>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); color: #23152B; font-style: italic;">${data.message || "None specified"}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); font-weight: bold;">Browser & OS:</td>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); color: #666; font-size: 11px;">${userAgent}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); font-weight: bold;">Timezone / Locale:</td>
      <td style="padding: 10px; border-bottom: 1px solid rgba(173,86,196,0.1); color: #666; font-size: 11px;">${timezone}</td>
    </tr>
  </table>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="tel:${rawPhone}" style="display: inline-block; padding: 12px 24px; margin: 8px; background-color: #23152B; color: white; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Call Student</a>
    <a href="https://wa.me/${waPhone}" style="display: inline-block; padding: 12px 24px; margin: 8px; background-color: #25D366; color: white; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Send WhatsApp</a>
  </div>
  
  <div style="text-align: center; color: #888; font-size: 11px; margin-top: 30px; border-top: 1px solid rgba(173,86,196,0.1); padding-top: 15px;">
    This is an automated notification from the Shelly Sharma Academy Inquiry portal.
  </div>
</div>
`;

  // 2. Build Visitor Confirmation Email Content
  const visitorHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid rgba(173,86,196,0.15); border-radius: 32px; background-color: #ffffff; color: #23152B; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
  <div style="background: linear-gradient(135deg, #FAF7F2 0%, #F3EBF5 50%, #FCEEF2 100%); padding: 30px 20px; border-radius: 24px; text-align: center; margin-bottom: 24px; border: 1px solid rgba(173,86,196,0.1);">
    <h1 style="margin: 0; font-family: Georgia, serif; color: #23152B; font-size: 26px; font-weight: bold;">Shelly Sharma Academy</h1>
    <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 10px; letter-spacing: 3px; color: #AD56C4; text-transform: uppercase; font-weight: bold;">Eloquence & High-Stakes English</p>
  </div>

  <div style="padding: 0 10px;">
    <p style="font-size: 15px; line-height: 1.6; font-weight: 500;">Dear ${data.name},</p>
    
    <p style="font-size: 14px; line-height: 1.6; color: #23152B;">
      Thank you for requesting an English Assessment Session at the <strong>Shelly Sharma Academy</strong>. We are thrilled to accompany you on your path from hesitation to high-stakes eloquence.
    </p>

    ${bookingDetails ? `
    <div style="background: linear-gradient(135deg, #FFF0F2 0%, #F5E6F7 100%); padding: 24px; border-radius: 24px; border: 2.5px solid #AD56C4; margin: 24px 0; text-align: center;">
      <span style="font-family: monospace; font-size: 10px; letter-spacing: 2px; color: #AD56C4; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 8px;">🎉 Assessment Session Confirmed</span>
      <h3 style="margin: 0 0 16px 0; font-family: Georgia, serif; color: #23152B; font-size: 18px; font-weight: bold;">Your Diagnostic Call is Reserved</h3>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; margin-bottom: 16px;">
        <tr>
          <td style="padding: 6px 0; color: #666; font-weight: 500;">Date:</td>
          <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #23152B;">${bookingDetails.date}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666; font-weight: 500;">Time Slot:</td>
          <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #23152B;">${bookingDetails.time} (IST)</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666; font-weight: 500;">Selected Course:</td>
          <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #23152B;">${data.program}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666; font-weight: 500;">Reference ID:</td>
          <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #AD56C4;">${referenceNumber}</td>
        </tr>
      </table>

      ${bookingDetails.meetUrl ? `
      <div style="margin-top: 15px; border-top: 1px dashed rgba(173,86,196,0.3); padding-top: 15px;">
        <p style="font-size: 12px; color: #23152B; margin: 0 0 12px 0; font-weight: bold;">Click below to join Google Meet on your chosen slot:</p>
        <a href="${bookingDetails.meetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #AD56C4; color: white; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Join Google Meet</a>
        <p style="font-family: monospace; font-size: 10px; color: #666; margin: 10px 0 0 0; word-break: break-all;">${bookingDetails.meetUrl}</p>
      </div>
      ` : `
      <p style="font-size: 11px; color: #666; margin: 10px 0 0 0; font-weight: bold;">Our team will connect you to provide joining details shortly.</p>
      `}
    </div>
    ` : `
    <p style="font-size: 14px; line-height: 1.6; color: #23152B;">
      Your request has been received successfully. Our academic desk will review your details and contact you within <strong>24 business hours</strong> to finalize your diagnostic call coordinates.
    </p>

    <div style="background-color: #FAF7F2; padding: 20px; border-radius: 20px; border: 1px solid rgba(173,86,196,0.1); margin: 24px 0;">
      <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 14px; font-family: Georgia, serif; color: #23152B; border-bottom: 1px solid rgba(173,86,196,0.15); padding-bottom: 8px;">Inquiry Reference Details</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #666;">Reference Number:</td>
          <td style="padding: 6px 0; font-weight: bold; color: #AD56C4; text-align: right;">${referenceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;">Selected Course:</td>
          <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #23152B;">${data.program}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;">Office Hours:</td>
          <td style="padding: 6px 0; text-align: right; color: #23152B;">10:00 AM – 7:00 PM (IST)</td>
        </tr>
      </table>
    </div>
    `}

    <div style="margin: 28px 0; text-align: center;">
      <a href="https://wa.me/919876543210" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #AD56C4, #FF8DA1); color: white; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 12px rgba(173,86,196,0.25);">Connect via WhatsApp</a>
    </div>

    <div style="border-top: 1px solid rgba(173,86,196,0.15); padding-top: 20px; margin-top: 30px; font-size: 12px; line-height: 1.6; color: #666;">
      <p style="margin: 0 0 8px 0; font-weight: bold; color: #23152B;">Contact Desk Coordinates:</p>
      <p style="margin: 0;">• <strong>Official Email:</strong> <a href="mailto:mail.shelly.sharma@gmail.com" style="color: #AD56C4; text-decoration: none;">mail.shelly.sharma@gmail.com</a></p>
      <p style="margin: 4px 0 0 0;">• <strong>Official Website:</strong> <a href="https://shellysharma.academy" style="color: #AD56C4; text-decoration: none;">shellysharma.academy</a></p>
    </div>

    <div style="margin-top: 40px; border-top: 1px solid rgba(173,86,196,0.1); padding-top: 20px; font-size: 13px;">
      <p style="margin: 0 0 4px 0; font-weight: bold; color: #23152B;">Warm Regards,</p>
      <p style="margin: 0; font-family: Georgia, serif; font-size: 16px; font-weight: bold; color: #AD56C4;">Shelly Sharma</p>
      <p style="margin: 2px 0 0 0; font-size: 11px; color: #666; font-family: monospace; letter-spacing: 1px; text-transform: uppercase;">Founder & Chief Educator</p>
      <p style="margin: 2px 0 0 0; font-size: 11px; color: #999;">Shelly Sharma Academy for Lifelong Learning</p>
    </div>
  </div>
</div>
`;

  const sendUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

  try {
    // 1. Send Admin Notification Email
    const adminMime = buildMimeMessage(
      adminEmail,
      data.name,
      visitorEmail,
      `New Assessment Request - ${data.name} (${referenceNumber})`,
      adminHtml
    );
    const adminRaw = btoa(unescape(encodeURIComponent(adminMime)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const adminRes = await fetch(sendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: adminRaw }),
    });

    if (!adminRes.ok) {
      const errText = await adminRes.text();
      console.error("Gmail Admin Send failed:", errText);
      throw new Error(`Admin Send failed: ${adminRes.statusText}`);
    }

    // 2. Send Visitor Confirmation Email
    const visitorSubject = bookingDetails 
      ? `Assessment Session Confirmed – Shelly Sharma Academy` 
      : "Thank You for Contacting Shelly Sharma Academy";
    const visitorMime = buildMimeMessage(
      visitorEmail,
      "Shelly Sharma Academy",
      adminEmail,
      visitorSubject,
      visitorHtml
    );
    const visitorRaw = btoa(unescape(encodeURIComponent(visitorMime)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const visitorRes = await fetch(sendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: visitorRaw }),
    });

    if (!visitorRes.ok) {
      const errText = await visitorRes.text();
      console.error("Gmail Visitor Send failed:", errText);
      throw new Error(`Visitor Send failed: ${visitorRes.statusText}`);
    }

    // Trigger Gmail Sent Success Notification
    try {
      await triggerChatNotification("GMAIL_SENT_SUCCESS", {
        studentName: data.name,
        email: visitorEmail,
        phone: data.phone,
        course: data.program,
        id: referenceNumber,
        gmailStatus: "Sent Successfully"
      }, accessToken);
    } catch (chatErr) {
      console.error("Failed to trigger Chat notification for Gmail success:", chatErr);
    }

    return true;
  } catch (err: any) {
    // Trigger Gmail Send Failed Notification
    try {
      await triggerChatNotification("GMAIL_SEND_FAILED", {
        studentName: data.name,
        email: visitorEmail,
        phone: data.phone,
        course: data.program,
        id: referenceNumber,
        errorType: "Gmail Send Error",
        errorMessage: err.message || err.toString(),
        suggestedRetry: "Check Google Account OAuth token validation and permission scopes."
      }, accessToken);
    } catch (chatErr) {
      console.error("Failed to trigger Chat notification for Gmail error:", chatErr);
    }
    throw err;
  }
}

// Google Calendar Helper: Check slot availability and find next available slot if taken
export async function checkAndFindAvailableSlot(
  accessToken: string,
  dateStr: string, // e.g. "2026-07-16"
  timeStr: string  // e.g. "14:00"
): Promise<{ available: boolean; bookedSlot: string; suggestedDate?: string; suggestedTime?: string }> {
  const startObj = new Date(`${dateStr}T${timeStr}`);
  if (isNaN(startObj.getTime())) {
    return { available: true, bookedSlot: `${dateStr} ${timeStr}` };
  }

  // Helper to check conflict for a given start/end date object
  const checkConflict = async (start: Date, end: Date): Promise<boolean> => {
    const timeMin = start.toISOString();
    const timeMax = end.toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`;
    
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) {
        console.error("Calendar conflict check failed:", res.statusText);
        return false; // Treat as no conflict on API error
      }
      const data = await res.json();
      const activeEvents = (data.items || []).filter((evt: any) => evt.status !== "cancelled");
      return activeEvents.length > 0;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const endObj = new Date(startObj.getTime() + 30 * 60 * 1000); // Default duration 30 minutes
  const hasConflict = await checkConflict(startObj, endObj);

  if (!hasConflict) {
    return { available: true, bookedSlot: `${dateStr} ${timeStr}` };
  }

  // Find next available slot: scan forward in 30-minute intervals
  let testStart = new Date(startObj.getTime() + 30 * 60 * 1000);
  let found = false;
  
  // Max 48 attempts (24 hours) to find a slot
  for (let i = 0; i < 48; i++) {
    const testEnd = new Date(testStart.getTime() + 30 * 60 * 1000);
    
    // Check school working hours: 09:00 AM to 08:00 PM local time
    const hour = testStart.getHours();
    if (hour < 9 || hour >= 20) {
      // Skip to 09:00 AM of the next day
      testStart.setDate(testStart.getDate() + 1);
      testStart.setHours(9, 0, 0, 0);
      continue;
    }

    const conflict = await checkConflict(testStart, testEnd);
    if (!conflict) {
      found = true;
      break;
    }
    testStart = new Date(testStart.getTime() + 30 * 60 * 1000);
  }

  if (found) {
    const yyyy = testStart.getFullYear();
    const mm = String(testStart.getMonth() + 1).padStart(2, "0");
    const dd = String(testStart.getDate()).padStart(2, "0");
    const suggestedDate = `${yyyy}-${mm}-${dd}`;
    
    const hours = String(testStart.getHours()).padStart(2, "0");
    const mins = String(testStart.getMinutes()).padStart(2, "0");
    const suggestedTime = `${hours}:${mins}`;

    return {
      available: false,
      bookedSlot: `${dateStr} ${timeStr}`,
      suggestedDate,
      suggestedTime
    };
  }

  return { available: false, bookedSlot: `${dateStr} ${timeStr}` };
}

// Google Calendar Helper: Create primary calendar event
export async function createCalendarEvent(
  accessToken: string,
  eventData: {
    studentName: string;
    parentName?: string;
    phone: string;
    email: string;
    course: string;
    remarks?: string;
    referenceNumber: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
  }
): Promise<{ id: string; htmlLink?: string; hangoutLink?: string | null } | null> {
  const startDateTime = new Date(`${eventData.date}T${eventData.time}`);
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000); // 30 minutes duration

  const title = `Shelly Sharma Academy – Assessment Session`;
  const description = `
Student Details: ${eventData.studentName}
Parent Details: ${eventData.parentName || "N/A"}
Course: ${eventData.course}
Lead ID: ${eventData.referenceNumber}
Website: https://shellysharma.co.in
Phone: ${eventData.phone}
Email: ${eventData.email}
  `.trim();

  const attendeeName = eventData.parentName 
    ? `${eventData.studentName} (Parent: ${eventData.parentName})`
    : eventData.studentName;

  const eventPayload = {
    summary: title,
    description: description,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    attendees: [
      { email: eventData.email, displayName: attendeeName },
      { email: "shellysharmamail@gmail.com", displayName: "Shelly Sharma" }
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 30 },
        { method: "popup", minutes: 10 }
      ]
    },
    colorId: "3", // Academy theme (lavender/purple)
    status: "confirmed",
    conferenceData: {
      createRequest: {
        requestId: `ssa-${eventData.referenceNumber}-${Date.now()}`,
        conferenceSolutionKey: {
          type: "hangoutsMeet"
        }
      }
    }
  };

  const createUrl = "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1";
  try {
    const res = await fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(eventPayload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Failed to create Calendar event:", errText);
      throw new Error(`Calendar Event creation failed: ${res.statusText}`);
    }

    const data = await res.json();
    let hangoutLink = data.hangoutLink || (data.conferenceData && data.conferenceData.entryPoints && data.conferenceData.entryPoints[0] ? data.conferenceData.entryPoints[0].uri : null);

    // Auto-retry Meet link generation if not present initially (Google Calendar can be asynchronous in generating Meet links)
    if (!hangoutLink) {
      console.warn("Meet link was not generated in the first attempt. Retrying Meet generation automatically...");
      for (let attempt = 1; attempt <= 3; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 1500 * attempt)); // wait 1.5s, 3s, 4.5s
        try {
          const patchUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${data.id}?conferenceDataVersion=1`;
          const patchRes = await fetch(patchUrl, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              conferenceData: {
                createRequest: {
                  requestId: `ssa-retry-${eventData.referenceNumber}-${attempt}-${Date.now()}`,
                  conferenceSolutionKey: {
                    type: "hangoutsMeet"
                  }
                }
              }
            })
          });

          if (patchRes.ok) {
            const patchData = await patchRes.json();
            const foundLink = patchData.hangoutLink || (patchData.conferenceData && patchData.conferenceData.entryPoints && patchData.conferenceData.entryPoints[0] ? patchData.conferenceData.entryPoints[0].uri : null);
            if (foundLink) {
              hangoutLink = foundLink;
              console.log(`Google Meet link successfully generated on attempt ${attempt}: ${hangoutLink}`);
              break;
            }
          }
        } catch (patchErr) {
          console.error(`Meet generation retry attempt ${attempt} failed:`, patchErr);
        }
      }
    }

    return {
      id: data.id,
      htmlLink: data.htmlLink,
      hangoutLink: hangoutLink || null
    };
  } catch (err: any) {
    try {
      await triggerChatNotification("CALENDAR_SYNC_FAILED", {
        studentName: eventData.studentName,
        phone: eventData.phone,
        email: eventData.email,
        course: eventData.course,
        id: eventData.referenceNumber,
        errorType: "Google Calendar Sync Failed",
        errorMessage: err.message || err.toString(),
        suggestedRetry: "Verify Google Calendar scopes and write access to primary calendar."
      }, accessToken);
    } catch (e) {
      console.error("Failed to trigger Chat notification for Calendar failure:", e);
    }
    throw err;
  }
}

// Google Calendar Helper: Update a calendar event's date and time (Reschedule)
export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  date: string,
  time: string
): Promise<boolean> {
  try {
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000); // 30 mins duration

    const updateUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
    const res = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        status: "confirmed"
      })
    });

    if (!res.ok) {
      console.error("Failed to update Google Calendar event:", await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error updating Calendar event:", error);
    return false;
  }
}

// Google Calendar Helper: Delete/Cancel a calendar event
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<boolean> {
  try {
    const deleteUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
    const res = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!res.ok) {
      console.error("Failed to delete Google Calendar event:", await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error deleting Calendar event:", error);
    return false;
  }
}

// Gmail Helper: Send beautiful HTML email for rescheduled session
export async function sendRescheduledEmail(
  accessToken: string,
  data: {
    studentName: string;
    studentEmail: string;
    course: string;
    oldDate: string;
    oldTime: string;
    newDate: string;
    newTime: string;
    meetUrl: string;
    referenceId: string;
  }
): Promise<boolean> {
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "mail.shelly.sharma@gmail.com";
  
  const htmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid rgba(173,86,196,0.15); border-radius: 32px; background-color: #ffffff; color: #23152B; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
  <div style="background: linear-gradient(135deg, #FAF7F2 0%, #F3EBF5 50%, #FCEEF2 100%); padding: 30px 20px; border-radius: 24px; text-align: center; margin-bottom: 24px; border: 1px solid rgba(173,86,196,0.1);">
    <h1 style="margin: 0; font-family: Georgia, serif; color: #23152B; font-size: 26px; font-weight: bold;">Shelly Sharma Academy</h1>
    <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 10px; letter-spacing: 3px; color: #AD56C4; text-transform: uppercase; font-weight: bold;">Eloquence & High-Stakes English</p>
  </div>

  <div style="padding: 0 10px;">
    <p style="font-size: 15px; line-height: 1.6; font-weight: 500;">Dear ${data.studentName},</p>
    
    <p style="font-size: 14px; line-height: 1.6; color: #23152B;">
      Please note that your diagnostic assessment session at the <strong>Shelly Sharma Academy</strong> has been rescheduled to a new time. Here are your updated coordinates:
    </p>

    <div style="background: linear-gradient(135deg, #FFF0F2 0%, #F5E6F7 100%); padding: 24px; border-radius: 24px; border: 2.5px solid #AD56C4; margin: 24px 0; text-align: center;">
      <span style="font-family: monospace; font-size: 10px; letter-spacing: 2px; color: #AD56C4; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 8px;">🔄 Session Rescheduled</span>
      <h3 style="margin: 0 0 16px 0; font-family: Georgia, serif; color: #23152B; font-size: 18px; font-weight: bold;">Your Diagnostics Schedule is Updated</h3>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; margin-bottom: 16px;">
        <tr>
          <td style="padding: 6px 0; color: #666; font-weight: 500;">New Date:</td>
          <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #23152B;">${data.newDate}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666; font-weight: 500;">New Time Slot:</td>
          <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #23152B;">${data.newTime} (IST)</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666; font-weight: 500;">Selected Course:</td>
          <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #23152B;">${data.course}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666; font-weight: 500;">Reference ID:</td>
          <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #AD56C4;">${data.referenceId}</td>
        </tr>
        <tr style="border-top: 1px dashed rgba(173,86,196,0.15);">
          <td style="padding: 6px 0; color: #888; font-style: italic;">Previous Slot:</td>
          <td style="padding: 6px 0; text-align: right; color: #888; font-style: italic;">${data.oldDate} at ${data.oldTime}</td>
        </tr>
      </table>

      <div style="margin-top: 15px; border-top: 1px dashed rgba(173,86,196,0.3); padding-top: 15px;">
        <p style="font-size: 12px; color: #23152B; margin: 0 0 12px 0; font-weight: bold;">Join the Google Meet at the updated slot:</p>
        <a href="${data.meetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #AD56C4; color: white; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Join Google Meet</a>
        <p style="font-family: monospace; font-size: 10px; color: #666; margin: 10px 0 0 0; word-break: break-all;">${data.meetUrl}</p>
      </div>
    </div>

    <div style="margin: 28px 0; text-align: center;">
      <a href="https://wa.me/919876543210" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #AD56C4, #FF8DA1); color: white; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Connect via WhatsApp</a>
    </div>

    <div style="border-top: 1px solid rgba(173,86,196,0.15); padding-top: 20px; margin-top: 30px; font-size: 12px; line-height: 1.6; color: #666;">
      <p style="margin: 0 0 8px 0; font-weight: bold; color: #23152B;">Contact Desk Coordinates:</p>
      <p style="margin: 0;">• <strong>Official Email:</strong> <a href="mailto:mail.shelly.sharma@gmail.com" style="color: #AD56C4; text-decoration: none;">mail.shelly.sharma@gmail.com</a></p>
      <p style="margin: 4px 0 0 0;">• <strong>Official Website:</strong> <a href="https://shellysharma.academy" style="color: #AD56C4; text-decoration: none;">shellysharma.academy</a></p>
    </div>

    <div style="margin-top: 40px; border-top: 1px solid rgba(173,86,196,0.1); padding-top: 20px; font-size: 13px;">
      <p style="margin: 0 0 4px 0; font-weight: bold; color: #23152B;">Warm Regards,</p>
      <p style="margin: 0; font-family: Georgia, serif; font-size: 16px; font-weight: bold; color: #AD56C4;">Shelly Sharma</p>
      <p style="margin: 2px 0 0 0; font-size: 11px; color: #666; font-family: monospace; letter-spacing: 1px; text-transform: uppercase;">Founder & Chief Educator</p>
      <p style="margin: 2px 0 0 0; font-size: 11px; color: #999;">Shelly Sharma Academy for Lifelong Learning</p>
    </div>
  </div>
</div>
  `;

  const mime = buildMimeMessage(
    data.studentEmail,
    "Shelly Sharma Academy",
    adminEmail,
    `Assessment Session Updated – Shelly Sharma Academy`,
    htmlBody
  );
  
  const raw = btoa(unescape(encodeURIComponent(mime)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const sendUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
  const res = await fetch(sendUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  return res.ok;
}

// Gmail Helper: Send beautiful HTML email for cancelled session
export async function sendCancelledEmail(
  accessToken: string,
  data: {
    studentName: string;
    studentEmail: string;
    course: string;
    date: string;
    time: string;
    referenceId: string;
  }
): Promise<boolean> {
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "mail.shelly.sharma@gmail.com";
  
  const htmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid rgba(220,38,38,0.15); border-radius: 32px; background-color: #ffffff; color: #23152B; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
  <div style="background: #FFF5F5; padding: 30px 20px; border-radius: 24px; text-align: center; margin-bottom: 24px; border: 1px solid rgba(220,38,38,0.1);">
    <h1 style="margin: 0; font-family: Georgia, serif; color: #9B1C1C; font-size: 26px; font-weight: bold;">Shelly Sharma Academy</h1>
    <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 10px; letter-spacing: 3px; color: #DC2626; text-transform: uppercase; font-weight: bold;">Session Cancellation Notice</p>
  </div>

  <div style="padding: 0 10px;">
    <p style="font-size: 15px; line-height: 1.6; font-weight: 500;">Dear ${data.studentName},</p>
    
    <p style="font-size: 14px; line-height: 1.6; color: #23152B;">
      Please be informed that your upcoming diagnostics assessment session has been cancelled. We apologize for any inconvenience caused.
    </p>

    <div style="background: #FFF5F5; padding: 24px; border-radius: 24px; border: 2.5px solid #DC2626; margin: 24px 0; text-align: center;">
      <span style="font-family: monospace; font-size: 10px; letter-spacing: 2px; color: #DC2626; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 8px;">❌ Session Cancelled</span>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; margin-bottom: 8px;">
        <tr>
          <td style="padding: 6px 0; color: #666; font-weight: 500;">Original Date:</td>
          <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #23152B;">${data.date}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666; font-weight: 500;">Original Time Slot:</td>
          <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #23152B;">${data.time} (IST)</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666; font-weight: 500;">Course:</td>
          <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #23152B;">${data.course}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666; font-weight: 500;">Reference ID:</td>
          <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #DC2626;">${data.referenceId}</td>
        </tr>
      </table>
      
      <p style="font-size: 12px; color: #666; margin: 15px 0 0 0; line-height: 1.5;">
        If you wish to schedule a new assessment session, please visit our website or get in touch with our academy coordinator.
      </p>
    </div>

    <div style="margin: 28px 0; text-align: center;">
      <a href="https://wa.me/919876543210" style="display: inline-block; padding: 12px 24px; background: #DC2626; color: white; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Connect via WhatsApp</a>
    </div>

    <div style="border-top: 1px solid rgba(220,38,38,0.15); padding-top: 20px; margin-top: 30px; font-size: 12px; line-height: 1.6; color: #666;">
      <p style="margin: 0 0 8px 0; font-weight: bold; color: #23152B;">Contact Desk Coordinates:</p>
      <p style="margin: 0;">• <strong>Official Email:</strong> <a href="mailto:mail.shelly.sharma@gmail.com" style="color: #AD56C4; text-decoration: none;">mail.shelly.sharma@gmail.com</a></p>
      <p style="margin: 4px 0 0 0;">• <strong>Official Website:</strong> <a href="https://shellysharma.academy" style="color: #AD56C4; text-decoration: none;">shellysharma.academy</a></p>
    </div>

    <div style="margin-top: 40px; border-top: 1px solid rgba(220,38,38,0.1); padding-top: 20px; font-size: 13px;">
      <p style="margin: 0 0 4px 0; font-weight: bold; color: #23152B;">Warm Regards,</p>
      <p style="margin: 0; font-family: Georgia, serif; font-size: 16px; font-weight: bold; color: #AD56C4;">Shelly Sharma</p>
      <p style="margin: 2px 0 0 0; font-size: 11px; color: #666; font-family: monospace; letter-spacing: 1px; text-transform: uppercase;">Founder & Chief Educator</p>
      <p style="margin: 2px 0 0 0; font-size: 11px; color: #999;">Shelly Sharma Academy for Lifelong Learning</p>
    </div>
  </div>
</div>
  `;

  const mime = buildMimeMessage(
    data.studentEmail,
    "Shelly Sharma Academy",
    adminEmail,
    `Assessment Session Cancelled – Shelly Sharma Academy`,
    htmlBody
  );
  
  const raw = btoa(unescape(encodeURIComponent(mime)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const sendUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
  const res = await fetch(sendUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  return res.ok;
}
