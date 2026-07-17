import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Users, Calendar, Video, HardDrive, Mail, Activity, 
  Plus, FolderPlus, Download, Upload, Search, Filter, Check, X, Lock, 
  RefreshCw, LogOut, ExternalLink, AlertTriangle, Clock, Settings, 
  BookOpen, Award, FileText, Database, ShieldAlert, CheckCircle2, ChevronRight, Send, Shield, Copy,
  MessageSquare
} from "lucide-react";
import { auth, googleSignIn, logout, getAccessToken, updateCalendarEvent, deleteCalendarEvent, sendRescheduledEmail, sendCancelledEmail } from "../lib/gmail";
import { getQueuedLeads, syncQueuedLeads, LeadSubmission, updateCRMMeetingDetails } from "../lib/crm";
import { 
  queueSecurityLogLocally, 
  syncQueuedSecurityLogs, 
  getClientIP, 
  SecurityLog 
} from "../lib/security";
import {
  triggerChatStatusChanged,
  syncQueuedChatNotifications,
  getChatNotificationsHistory,
  getChatUnreadCount,
  markChatNotificationsAsRead,
  getChatLastSyncTime,
  getChatNotificationsQueue,
  ChatNotification,
  triggerChatMeetRescheduled,
  triggerChatMeetCancelled,
  triggerChatNotification,
  triggerCustomChatReport,
  isAuthorizedAdmin
} from "../lib/chat";
import { User, onAuthStateChanged } from "firebase/auth";

// Supabase Layer Imports
import { 
  Inquiry, 
  Admission, 
  getSupabaseInquiries, 
  getSupabaseAdmissions, 
  addSupabaseInquiry, 
  updateSupabaseInquiry, 
  createSupabaseAdmission,
  archiveSupabaseInquiry,
  restoreSupabaseInquiry,
  softDeleteSupabaseInquiry
} from "../lib/supabaseClient";

// Modular UI Block Imports
import GoodMorningBanner from "./GoodMorningBanner";
import CrmCharts from "./CrmCharts";
import CrmLeadsTable from "./CrmLeadsTable";
import InquiryDrawer from "./InquiryDrawer";
import WorkspaceIntegrations from "./WorkspaceIntegrations";
import { AnimatePresence } from "motion/react";

const AUTHORIZED_USERS: { [email: string]: { name: string; role: "OWNER" | "DEVELOPER" } } = {
  "shellysharmamail@gmail.com": { name: "Shelly Sharma", role: "OWNER" },
  "amitbansal21@gmail.com": { name: "Amit Agrawal", role: "DEVELOPER" }
};

const AUTHORIZED_EMAILS = Object.keys(AUTHORIZED_USERS);

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  hangoutLink?: string;
  htmlLink?: string;
}

interface DriveFile {
  id: string;
  name: string;
  webViewLink?: string;
}

interface GmailMessage {
  id: string;
  snippet: string;
  subject?: string;
  from?: string;
  date?: string;
}

export default function ControlCenterPage() {
  // Global States
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [firebaseStatus, setFirebaseStatus] = useState("Checking...");
  const [meetStatus, setMeetStatus] = useState("Checking...");
  const [chatStatus, setChatStatus] = useState("Checking...");
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [lastSyncTime, setLastSyncTime] = useState("");
  const [offlineQueue, setOfflineQueue] = useState<LeadSubmission[]>([]);
  const [darkMode, setDarkMode] = useState(true);

  // Core Data Lists
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [driveFolders, setDriveFolders] = useState<DriveFile[]>([]);
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
  const [chatNotifications, setChatNotifications] = useState<ChatNotification[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);

  // Selection & UI controllers
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [isSubmittingAdmission, setIsSubmittingAdmission] = useState(false);

  // Notifications Feed
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    time: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
  }>>([]);

  const spreadsheetId = localStorage.getItem("workspace_spreadsheet_id") || "1ZrYQ-s1TbuABiWtwxW1sv6DgX4JfCBqW9PJxkWJfBvk";

  // Security audit logger hook
  useEffect(() => {
    if (!user) return;
    const recordSecurityEvent = async () => {
      const email = user.email || "Unknown Auth Profile";
      const isAuthorized = !!AUTHORIZED_USERS[email];
      const result = isAuthorized ? "SUCCESS" : "DENIED";

      const sessionLoggedKey = `sec_logged_${user.uid}_${result}`;
      if (sessionStorage.getItem(sessionLoggedKey)) return;
      sessionStorage.setItem(sessionLoggedKey, "true");

      const dateObj = new Date();
      const date = dateObj.toISOString().split("T")[0];
      const time = dateObj.toTimeString().split(" ")[0];
      const ip = await getClientIP();
      const browser = navigator.userAgent;

      const logItem: SecurityLog = { date, time, email, result, ip, browser };
      queueSecurityLogLocally(logItem);

      if (token) {
        try {
          await syncQueuedSecurityLogs(token);
        } catch (err) {
          console.error("Sheets sync temporary error:", err);
        }
      }
      setSecurityLogs(prev => [logItem, ...prev]);
    };

    recordSecurityEvent();
  }, [user, token]);

  // Auth Changes Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      const currentToken = getAccessToken();
      setToken(currentToken);
      setAuthLoading(false);
      
      if (firebaseUser) {
        setFirebaseStatus("Connected");
        if (currentToken) {
          setMeetStatus("Connected");
          setChatStatus("Connected");
          setLastSyncTime(new Date().toLocaleTimeString());
          setOfflineQueue(getQueuedLeads());
          loadAllWorkspaceData(currentToken);
        } else {
          // If token not fully synchronized, load Supabase inquiries immediately!
          loadSupabaseDataOnly();
        }
      } else {
        setFirebaseStatus("Disconnected");
        setMeetStatus("Disconnected");
        setChatStatus("Disconnected");
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync / poll local offline queue length
  useEffect(() => {
    const interval = setInterval(() => {
      setOfflineQueue(getQueuedLeads());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll chat notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (token && getChatNotificationsQueue().length > 0) {
        syncQueuedChatNotifications(token).then(() => {
          setChatNotifications(getChatNotificationsHistory());
        });
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [token]);

  // Fallback direct local fetch if OAuth Token is absent
  const loadSupabaseDataOnly = async () => {
    try {
      const inqs = await getSupabaseInquiries();
      const adms = await getSupabaseAdmissions();
      setInquiries(inqs);
      setAdmissions(adms);
    } catch (e) {
      console.error("Failed to load local Supabase state:", e);
    }
  };

  // Google Sheets integration parser to sync with Supabase
  const fetchCRMLeadsFromSheets = async (accessToken: string): Promise<any[]> => {
    if (!spreadsheetId) return [];
    try {
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Leads!A2:V`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) throw new Error("Sheets fetch failed");
      const data = await res.json();
      if (!data.values) return [];
      
      return data.values.map((row: any) => ({
        leadId: row[0] || "",
        date: row[1] || "",
        time: row[2] || "",
        name: row[3] || "",
        mobile: row[4] || "",
        email: row[5] || "",
        program: row[6] || "",
        parentName: row[7] || "",
        leadSource: row[8] || "Website",
        status: row[9] || "NEW LEAD",
        priority: row[10] || "MEDIUM",
        remarks: row[11] || "",
        otherQuery: row[12] || ""
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  // 1. MASTER WORKSPACE DATA LOADER (Supabase + Google APIs Mirror)
  const loadAllWorkspaceData = async (accessToken: string) => {
    setSyncStatus("syncing");
    try {
      // Load Supabase records (Source of truth)
      const supabaseInq = await getSupabaseInquiries();
      const supabaseAdm = await getSupabaseAdmissions();
      
      const mergedInquiries = [...supabaseInq];
      
      setInquiries(mergedInquiries);
      setAdmissions(supabaseAdm);

      // Trigger Smart Notifications generation
      generateSmartNotifications(mergedInquiries, supabaseAdm);

      // Async fetch remaining google products
      await Promise.all([
        fetchCalendarEvents(accessToken),
        fetchDriveFolders(accessToken),
        fetchGmailMessages(accessToken),
        syncQueuedChatNotifications(accessToken).then(() => {
          setChatStatus("Connected");
        }).catch(err => {
          setChatStatus("Disconnected");
        })
      ]);

      setChatNotifications(getChatNotificationsHistory());
      setSyncStatus("success");
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Workspace sync error:", err);
      setSyncStatus("error");
    }
  };

  // Generate real-time academy reminders and smart alerts
  const generateSmartNotifications = (inqs: Inquiry[], adms: Admission[]) => {
    const list: typeof notifications = [];
    
    // High Priority reminders
    inqs.filter(i => i.priority === "HIGH" && i.status === "NEW LEAD").forEach(i => {
      list.push({
        id: `high-${i.id}`,
        type: "HIGH_PRIORITY",
        title: `Urgent Contact: ${i.studentName}`,
        message: `High-priority inquiry waiting for followup since ${i.createdDate}.`,
        time: "Action Required",
        priority: "HIGH"
      });
    });

    // Custom "Others" format queries (Feature 1 & Feature 2 requirement)
    inqs.filter(i => i.selectedCourse === "Others" && i.status === "NEW LEAD").forEach(i => {
      list.push({
        id: `other-${i.id}`,
        type: "NEW_LEAD",
        title: `Custom Query Received`,
        message: `${i.studentName} selected 'Others' course format to discuss custom curriculum targets.`,
        time: "Just Now",
        priority: "MEDIUM"
      });
    });

    // Recent Admissions
    adms.slice(-3).forEach(a => {
      list.push({
        id: `adm-${a.studentId}`,
        type: "ADMISSION",
        title: `Admitted: ${a.studentName}`,
        message: `Student registered under ID ${a.studentId}. Paid fees: ₹${a.admissionFee}.`,
        time: a.admissionDate,
        priority: "LOW"
      });
    });

    setNotifications(list);
  };

  // FETCH GOOGLE CALENDAR ENTRIES
  const fetchCalendarEvents = async (accessToken: string) => {
    try {
      const res = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=startTime&singleEvents=true",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setCalendarEvents(data.items || []);
      }
    } catch (e) {
      console.error("Calendar fetch error:", e);
    }
  };

  // FETCH GOOGLE DRIVE DIRECTORIES
  const fetchDriveFolders = async (accessToken: string) => {
    try {
      const res = await fetch(
        "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder'&pageSize=12",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setDriveFolders(data.files || []);
      }
    } catch (e) {
      console.error("Drive fetch error:", e);
    }
  };

  // FETCH GMAIL INBOX
  const fetchGmailMessages = async (accessToken: string) => {
    try {
      const res = await fetch(
        "https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=5",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.ok) {
        const data = await res.json();
        const messages = data.messages || [];
        const detailedMessages = await Promise.all(
          messages.map(async (m: any) => {
            const detailRes = await fetch(
              `https://www.googleapis.com/gmail/v1/users/me/messages/${m.id}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (!detailRes.ok) return m;
            const detail = await detailRes.json();
            
            // Parse Subject and From headers
            const subjectHeader = detail.payload.headers.find((h: any) => h.name.toLowerCase() === "subject");
            const fromHeader = detail.payload.headers.find((h: any) => h.name.toLowerCase() === "from");
            const dateHeader = detail.payload.headers.find((h: any) => h.name.toLowerCase() === "date");

            return {
              id: detail.id,
              snippet: detail.snippet,
              subject: subjectHeader ? subjectHeader.value : "No Subject",
              from: fromHeader ? fromHeader.value : "Unknown Sender",
              date: dateHeader ? new Date(dateHeader.value).toLocaleDateString() : "Unknown Date"
            };
          })
        );
        setGmailMessages(detailedMessages);
      }
    } catch (e) {
      console.error("Gmail fetch error:", e);
    }
  };

  // API EVENT HANDLER: ADD DIRECT STUDENT INQUIRY (SUPABASE SOURCE + MIRROR SYNC)
  const handleAddInquiry = async (formData: any) => {
    setIsSubmittingInquiry(true);
    try {
      const result = await addSupabaseInquiry(formData, token || undefined, spreadsheetId);
      
      // Update inquiries list
      setInquiries(prev => [result, ...prev]);

      // Trigger chat notification
      if (token) {
        try {
          await triggerChatNotification(
            "LEAD_CREATED",
            {
              id: result.id,
              studentName: result.studentName,
              course: result.selectedCourse,
              date: result.createdDate,
              time: result.createdTime
            },
            token
          );
        } catch (chatErr) {
          console.error("Chat notify error:", chatErr);
        }
      }

      alert(`Student inquiry successfully generated! Reference ID: ${result.id}`);
      if (token) await loadAllWorkspaceData(token);
    } catch (e) {
      console.error(e);
      alert("Failed to insert student inquiry.");
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  // API EVENT HANDLER: UPDATE INQUIRY FIELDS (SUPABASE SOURCE + MIRROR SYNC)
  const handleUpdateInquiry = async (id: string, updatedFields: Partial<Inquiry>, comment: string) => {
    setIsSubmittingInquiry(true);
    try {
      const operatorName = user?.displayName || currentProfile?.name || "Shelly Sharma";
      const updated = await updateSupabaseInquiry(id, updatedFields, operatorName, comment, token || undefined, spreadsheetId);
      
      // Map local states
      setInquiries(prev => prev.map(i => i.id === id ? updated : i));
      setSelectedInquiry(updated);

      alert(`Inquiry status updated successfully!`);
      if (token) await loadAllWorkspaceData(token);
    } catch (e) {
      console.error(e);
      alert("Failed to update inquiry status.");
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  // API EVENT HANDLER: REGISTER ADMISSION (SUPABASE + MIRROR SYNC)
  const handleRegisterAdmission = async (inquiryId: string, fee: number, payMode: "Cash" | "UPI" | "Bank Transfer" | "Card", remarks: string) => {
    setIsSubmittingAdmission(true);
    try {
      const result = await createSupabaseAdmission(
        inquiryId,
        {
          admissionFee: fee,
          paymentMode: payMode,
          remarks: remarks,
          admissionDate: new Date().toISOString().split("T")[0],
          enrolledCourse: ""
        },
        token || undefined,
        spreadsheetId
      );
      
      // Update states
      setAdmissions(prev => [...prev, result]);
      
      // Update inquiry status to ENROLLED
      const operatorName = user?.displayName || currentProfile?.name || "Shelly Sharma";
      const updatedInq = await updateSupabaseInquiry(inquiryId, { status: "ENROLLED" as any }, operatorName, `Student enrolled into course track. Generated Student ID: ${result.studentId}`, token || undefined, spreadsheetId);
      setInquiries(prev => prev.map(i => i.id === inquiryId ? updatedInq : i));
      setSelectedInquiry(updatedInq);

      alert(`Student enrollment registered! Permanent ID: ${result.studentId}`);
      if (token) await loadAllWorkspaceData(token);
    } catch (e) {
      console.error(e);
      alert("Failed to complete student enrollment.");
    } finally {
      setIsSubmittingAdmission(false);
    }
  };

  // API EVENT HANDLER: ARCHIVE INQUIRY (SOFT DELETE & ARCHIVE COMPLIANCE)
  const handleArchiveInquiry = async (id: string) => {
    const operatorName = user?.displayName || currentProfile?.name || "Shelly Sharma";
    try {
      await archiveSupabaseInquiry(id, operatorName, token || undefined, spreadsheetId);
      const updatedList = await getSupabaseInquiries();
      setInquiries(updatedList);
      
      // Update selected if active
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry(updatedList.find(i => i.id === id) || null);
      }

      setNotifications(prev => [
        {
          id: `notif_${Date.now()}`,
          type: "ARCHIVE",
          title: "Inquiry Archived",
          message: `Inquiry ID ${id} was moved to the archived pipeline database securely.`,
          time: "Just Now",
          priority: "LOW" as const
        },
        ...prev
      ]);
    } catch (e) {
      console.error("Archive error:", e);
      alert("Failed to archive inquiry.");
    }
  };

  // API EVENT HANDLER: RESTORE INQUIRY
  const handleRestoreInquiry = async (id: string) => {
    const operatorName = user?.displayName || currentProfile?.name || "Shelly Sharma";
    try {
      await restoreSupabaseInquiry(id, operatorName, token || undefined, spreadsheetId);
      const updatedList = await getSupabaseInquiries();
      setInquiries(updatedList);

      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry(updatedList.find(i => i.id === id) || null);
      }

      setNotifications(prev => [
        {
          id: `notif_${Date.now()}`,
          type: "RESTORE",
          title: "Inquiry Restored",
          message: `Inquiry ID ${id} restored back to active leads list successfully.`,
          time: "Just Now",
          priority: "LOW" as const
        },
        ...prev
      ]);
    } catch (e) {
      console.error("Restore error:", e);
      alert("Failed to restore inquiry.");
    }
  };

  // API EVENT HANDLER: SOFT DELETE INQUIRY
  const handleSoftDeleteInquiry = async (id: string) => {
    const operatorName = user?.displayName || currentProfile?.name || "Shelly Sharma";
    try {
      await softDeleteSupabaseInquiry(id, operatorName, token || undefined, spreadsheetId);
      const updatedList = await getSupabaseInquiries();
      setInquiries(updatedList);

      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry(updatedList.find(i => i.id === id) || null);
      }

      setNotifications(prev => [
        {
          id: `notif_${Date.now()}`,
          type: "TRASH",
          title: "Inquiry Soft Deleted",
          message: `Inquiry ID ${id} was soft-deleted and moved into the trash queue.`,
          time: "Just Now",
          priority: "MEDIUM" as const
        },
        ...prev
      ]);
    } catch (e) {
      console.error("Soft delete error:", e);
      alert("Failed to soft delete inquiry.");
    }
  };

  // API EVENT HANDLER: GOOGLE MEET RESCHEDULER
  const handleRescheduleMeeting = async (lead: Inquiry, newDate: string, newTime: string) => {
    if (!token) return;
    try {
      const calendarEventId = lead.calendarEventId;
      if (calendarEventId) {
        await updateCalendarEvent(token, calendarEventId, newDate, newTime);

        // Send email
        await sendRescheduledEmail(token, {
          studentName: lead.studentName,
          studentEmail: lead.email,
          course: lead.selectedCourse,
          oldDate: lead.date || "",
          oldTime: lead.time || "",
          newDate: newDate,
          newTime: newTime,
          meetUrl: lead.meetLink || "",
          referenceId: lead.id
        });
        
        // Log follow up
        await handleUpdateInquiry(lead.id, {
          date: newDate,
          time: newTime
        }, `Rescheduled Meet Consultation to ${newDate} at ${newTime}.`);
        
        alert("Consultation rescheduled and notification email sent!");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to reschedule consultation calendar event.");
    }
  };

  // API EVENT HANDLER: GOOGLE MEET CANCELLATION
  const handleCancelMeeting = async (lead: Inquiry) => {
    if (!token) return;
    if (!confirm("Are you sure you want to cancel this consultation meet session?")) return;
    try {
      const calendarEventId = lead.calendarEventId;
      if (calendarEventId) {
        await deleteCalendarEvent(token, calendarEventId);
      }
      await sendCancelledEmail(token, {
        studentName: lead.studentName,
        studentEmail: lead.email,
        course: lead.selectedCourse,
        date: lead.date || "",
        time: lead.time || "",
        referenceId: lead.id
      });
      
      await handleUpdateInquiry(lead.id, { status: "NO RESPONSE" as any }, "Consultation meeting cancelled.");
      alert("Consultation meeting cancelled successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to cancel consultation.");
    }
  };

  // API EVENT HANDLER: CREATE DRIVE WORKSHEET DIRECTORY
  const handleCreateWorksheet = async (studentName: string, folderType: string, topic: string) => {
    if (!token) return;
    try {
      const res = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: `SSA_Student_${studentName}_${topic}`,
          mimeType: "application/vnd.google-apps.folder"
        })
      });
      if (res.ok) {
        const folder = await res.json();
        alert(`Student directory created successfully on Google Drive! Folder ID: ${folder.id}`);
        await fetchDriveFolders(token);
      } else {
        alert("Failed to create Google Drive folder directory.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // API EVENT HANDLER: GMAIL SEND REPLY
  const handleSendGmailReply = async (threadId: string, replyBody: string, toEmail: string, subject: string) => {
    if (!token) return;
    try {
      const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
      const emailContent = [
        `To: ${toEmail}`,
        `Subject: ${utf8Subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=utf-8",
        "",
        replyBody
      ].join("\r\n");

      const base64Safe = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const res = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ raw: base64Safe, threadId })
      });

      if (res.ok) {
        alert("Email reply dispatched successfully!");
        await fetchGmailMessages(token);
      } else {
        alert("Failed to dispatch email reply.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleForceSyncQueue = async () => {
    if (!token) return;
    setSyncStatus("syncing");
    try {
      await syncQueuedLeads(token);
      setOfflineQueue([]);
      setSyncStatus("success");
      alert("Pending offline queue flushed and synced successfully!");
      await loadAllWorkspaceData(token);
    } catch (e) {
      setSyncStatus("error");
      alert("Failed to sync offline queue. Please try again.");
    }
  };

  const handleSignInGate = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setFirebaseStatus("Connected");
        setMeetStatus("Connected");
        setChatStatus("Connected");
        await loadAllWorkspaceData(res.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Sign in failed. Check permissions.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOutGate = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setInquiries([]);
      setAdmissions([]);
      setCalendarEvents([]);
      setDriveFolders([]);
      setGmailMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  // Authentication gateway checks
  const isAuthorized = user?.email ? AUTHORIZED_EMAILS.includes(user.email) : false;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#090514] flex flex-col items-center justify-center space-y-4">
        <RefreshCw size={36} className="animate-spin text-[#FF8DA1]" />
        <p className="text-xs font-mono text-slate-400">Loading Shelly Sharma Academy Workspace...</p>
      </div>
    );
  }

  // Gated Auth Page View
  if (!user || !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#090514] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Colorful backgrounds */}
        <div className="absolute -top-12 -right-12 w-96 h-96 bg-[#AD56C4]/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-12 w-96 h-96 bg-[#FF8DA1]/10 rounded-full blur-3xl" />
        
        <div className="w-full max-w-md p-8 rounded-3xl border border-[#AD56C4]/20 shadow-2xl backdrop-blur-xl bg-slate-900/40 text-center space-y-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#AD56C4] to-[#FF8DA1] mx-auto flex items-center justify-center text-white text-3xl font-black shadow-lg">
            🌸
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl font-black tracking-tight text-white">Shelly Sharma Academy</h1>
            <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">Luxury CRM & Admin Workspace</p>
          </div>

          <p className="text-xs text-[#E2DBEA] leading-relaxed">
            Please log in with your verified GSuite email to authorize Google Sheets CRM, Gmail API, Google Meet scheduler, and Drive worksheets synchronization.
          </p>

          {user && !isAuthorized && (
            <div className="p-3 bg-red-500/10 border border-red-500/15 rounded-xl text-red-400 text-[11px] font-mono leading-normal">
              🚫 Access Denied: <strong>{user.email}</strong> is not authorized to open this Control Desk.
            </div>
          )}

          {authError && (
            <div className="p-3 bg-red-500/10 border border-red-500/15 rounded-xl text-red-400 text-[11px] font-mono">
              Error: {authError}
            </div>
          )}

          <button
            onClick={handleSignInGate}
            className="w-full py-3 bg-gradient-to-r from-[#AD56C4] to-[#FF8DA1] hover:scale-[1.01] active:scale-[0.99] text-white text-xs font-mono font-bold uppercase rounded-xl transition-all shadow-lg cursor-pointer"
          >
            Authenticate with Google Workspace
          </button>

          {user && !isAuthorized && (
            <button 
              onClick={handleSignOutGate} 
              className="text-xs text-slate-400 hover:text-white underline font-mono"
            >
              Sign out from this profile
            </button>
          )}
        </div>
      </div>
    );
  }

  // Main Premium CRM Layout (Fully Authenticated and Authorized)
  const currentProfile = AUTHORIZED_USERS[user.email || ""];
  const pendingFollowUpsCount = inquiries.filter(i => i.status === "NEW LEAD").length;
  const todayDemosCount = inquiries.filter(i => i.status === "DEMO SCHEDULED" && i.date === new Date().toISOString().split("T")[0]).length;

  return (
    <div className={`min-h-screen ${darkMode ? "bg-[#090514] text-white" : "bg-[#FAF8FC] text-slate-900"} flex flex-col font-sans transition-all duration-300`}>
      
      {/* LUXURY CONTROL CENTER PANEL HEADER */}
      <header className={`px-6 py-4 border-b flex items-center justify-between backdrop-blur-md sticky top-0 z-40 ${darkMode ? "bg-[#090514]/80 border-slate-900" : "bg-[#FAF8FC]/80 border-slate-200"}`}>
        <div className="flex items-center space-x-3">
          <span className="text-xl">🌸</span>
          <div>
            <h1 className="font-display text-base font-black tracking-tight text-white leading-none">Shelly Sharma Academy</h1>
            <span className="text-[10px] font-mono text-[#FF8DA1] uppercase tracking-widest font-bold">Luxury Education CRM</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Offline Pending Leads Alert */}
          {offlineQueue.length > 0 && (
            <button
              onClick={handleForceSyncQueue}
              className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-mono font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={11} className="animate-spin" />
              <span>Sync Queue ({offlineQueue.length})</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white border border-white/5 transition-all text-xs font-mono cursor-pointer"
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>

          {/* Profile pill */}
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold">{currentProfile?.name || "Shelly Sharma"}</span>
            <span className="text-[9px] font-mono text-[#FF8DA1]">{user.email}</span>
          </div>

          {/* Sign Out */}
          <button
            onClick={handleSignOutGate}
            className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
            title="Sign Out Control Desk"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* DASHBOARD EXECUTION AREA */}
      <main className="flex-grow p-6 lg:p-10 max-w-[1600px] mx-auto w-full space-y-10">
        
        {/* 1. GOOD MORNING HERO BANNER */}
        <GoodMorningBanner
          userName={currentProfile?.name || "Shelly Sharma"}
          userRole={currentProfile?.role || "OWNER"}
          userEmail={user.email || ""}
          pendingFollowUps={pendingFollowUpsCount}
          todayDemosCount={todayDemosCount}
          admissionsCount={admissions.length}
          notifications={notifications}
          darkMode={darkMode}
          onClearNotifications={() => setNotifications([])}
        />

        {/* 2. RECHARTS CRM STATISTICS SMART INTERACTION AREA */}
        <CrmCharts
          inquiries={inquiries}
          admissions={admissions}
          darkMode={darkMode}
        />

        {/* 3. PRIMARY CRM LEADS PIPELINE GRID TABLE */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
            <Users size={18} className="text-[#AD56C4]" />
            <h2 className="font-display text-lg font-black tracking-tight text-white">Interactive Inquiry Pipeline</h2>
          </div>
          
          <CrmLeadsTable
            inquiries={inquiries}
            onSelectInquiry={(inq) => setSelectedInquiry(inq)}
            onAddInquiry={handleAddInquiry}
            onArchiveInquiry={handleArchiveInquiry}
            onRestoreInquiry={handleRestoreInquiry}
            onSoftDeleteInquiry={handleSoftDeleteInquiry}
            darkMode={darkMode}
            isSubmitting={isSubmittingInquiry}
          />
        </section>

        {/* 4. GOOGLE WORKSPACE API INTEGRATION TAB SET */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
            <Activity size={18} className="text-[#FF8DA1]" />
            <h2 className="font-display text-lg font-black tracking-tight text-white">Workspace Sync Gateways</h2>
          </div>
          
          <WorkspaceIntegrations
            leads={inquiries}
            calendarEvents={calendarEvents}
            driveFolders={driveFolders}
            gmailMessages={gmailMessages}
            chatNotifications={chatNotifications}
            securityLogs={securityLogs}
            darkMode={darkMode}
            token={token}
            onRescheduleMeeting={handleRescheduleMeeting}
            onCancelMeeting={handleCancelMeeting}
            onCreateWorksheet={handleCreateWorksheet}
            onSendGmailReply={handleSendGmailReply}
            syncStatus={syncStatus}
            onForceSync={() => token && loadAllWorkspaceData(token)}
          />
        </section>

      </main>

      {/* 5. INTERACTIVE INQUIRY DRAWER / PROFILE VIEW PANEL */}
      <AnimatePresence>
        {selectedInquiry && (
          <InquiryDrawer
            inquiry={selectedInquiry}
            onClose={() => setSelectedInquiry(null)}
            onUpdateInquiry={handleUpdateInquiry}
            onRegisterAdmission={handleRegisterAdmission}
            darkMode={darkMode}
            isSubmitting={isSubmittingInquiry || isSubmittingAdmission}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
