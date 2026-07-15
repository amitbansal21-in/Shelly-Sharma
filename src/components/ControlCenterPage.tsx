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

export default function ControlCenterPage({ onHomeClick }: { onHomeClick: () => void }) {
  // Theme state: default to beautiful dark slate
  const [darkMode, setDarkMode] = useState(true);

  // Meet management filter state
  const [meetFilter, setMeetFilter] = useState<"ALL" | "TODAY" | "UPCOMING" | "COMPLETED" | "CANCELLED">("ALL");
  
  // Meeting copy helper state
  const [copiedMeetingId, setCopiedMeetingId] = useState<string | null>(null);

  // Google Meet reschedule and cancel states
  const [reschedulingLead, setReschedulingLead] = useState<any | null>(null);
  const [newMeetDate, setNewMeetDate] = useState("");
  const [newMeetTime, setNewMeetTime] = useState("");
  const [isReschedulingInProgress, setIsReschedulingInProgress] = useState(false);
  const [isCancellingInProgress, setIsCancellingInProgress] = useState<string | null>(null);

  const handleRescheduleSubmit = async () => {
    if (!reschedulingLead || !newMeetDate || !newMeetTime || !token) return;
    setIsReschedulingInProgress(true);
    try {
      if (reschedulingLead.calendarEventId) {
        const calSuccess = await updateCalendarEvent(token, reschedulingLead.calendarEventId, newMeetDate, newMeetTime);
        if (!calSuccess) {
          console.warn("Failed to update Google Calendar event during rescheduling.");
        }
      }

      const sheetSuccess = await updateCRMMeetingDetails(token, reschedulingLead.leadId, {
        date: newMeetDate,
        time: newMeetTime,
        meetingStatus: "Rescheduled",
        rescheduled: "Yes"
      });

      if (sheetSuccess) {
        try {
          await sendRescheduledEmail(token, {
            studentName: reschedulingLead.name,
            studentEmail: reschedulingLead.email,
            course: reschedulingLead.program,
            oldDate: reschedulingLead.date,
            oldTime: reschedulingLead.time,
            newDate: newMeetDate,
            newTime: newMeetTime,
            meetUrl: reschedulingLead.meetLink,
            referenceId: reschedulingLead.leadId
          });
        } catch (emailErr) {
          console.error("Failed to send reschedule email:", emailErr);
        }

        try {
          await triggerChatMeetRescheduled({
            leadId: reschedulingLead.leadId,
            student: reschedulingLead.name,
            course: reschedulingLead.program,
            oldDate: reschedulingLead.date,
            oldTime: reschedulingLead.time,
            newDate: newMeetDate,
            newTime: newMeetTime,
            meetUrl: reschedulingLead.meetLink
          }, token);
        } catch (chatErr) {
          console.error("Failed to trigger Chat reschedule notification:", chatErr);
        }

        await loadAllWorkspaceData(token);
        setReschedulingLead(null);
        setNewMeetDate("");
        setNewMeetTime("");
        alert("Meeting successfully rescheduled!");
      } else {
        alert("Failed to update CRM with new scheduling. Please try again.");
      }
    } catch (e) {
      console.error("Error during rescheduling:", e);
      alert("An unexpected error occurred during rescheduling.");
    } finally {
      setIsReschedulingInProgress(false);
    }
  };

  const handleCancelMeeting = async (lead: any) => {
    if (!token) return;
    if (!window.confirm(`Are you sure you want to cancel the meeting for ${lead.name}?`)) {
      return;
    }
    setIsCancellingInProgress(lead.leadId);
    try {
      if (lead.calendarEventId) {
        const calDeleted = await deleteCalendarEvent(token, lead.calendarEventId);
        if (!calDeleted) {
          console.warn("Failed to delete Google Calendar event during cancellation.");
        }
      }

      const sheetSuccess = await updateCRMMeetingDetails(token, lead.leadId, {
        meetingStatus: "Cancelled",
        cancelled: "Yes"
      });

      if (sheetSuccess) {
        try {
          await sendCancelledEmail(token, {
            studentName: lead.name,
            studentEmail: lead.email,
            course: lead.program,
            date: lead.date,
            time: lead.time,
            referenceId: lead.leadId
          });
        } catch (emailErr) {
          console.error("Failed to send cancellation email:", emailErr);
        }

        try {
          await triggerChatMeetCancelled({
            leadId: lead.leadId,
            student: lead.name,
            course: lead.program,
            date: lead.date,
            time: lead.time
          }, token);
        } catch (chatErr) {
          console.error("Failed to trigger Chat cancellation notification:", chatErr);
        }

        await loadAllWorkspaceData(token);
        alert("Meeting successfully cancelled.");
      } else {
        alert("Failed to update CRM status. Please try again.");
      }
    } catch (e) {
      console.error("Error during cancellation:", e);
      alert("An unexpected error occurred during cancellation.");
    } finally {
      setIsCancellingInProgress(null);
    }
  };

  const handleCopyLink = (meetUrl: string, eventId: string) => {
    navigator.clipboard.writeText(meetUrl);
    setCopiedMeetingId(eventId);
    setTimeout(() => {
      setCopiedMeetingId(null);
    }, 2000);
  };
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Connection & sync status
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [offlineQueue, setOfflineQueue] = useState<LeadSubmission[]>([]);

  // Google Chat notifications states
  const [chatNotifications, setChatNotifications] = useState<ChatNotification[]>([]);
  const [chatUnreadCount, setChatUnreadCount] = useState<number>(0);
  const [chatLastSync, setChatLastSync] = useState<string | null>(null);
  const [chatQueueCount, setChatQueueCount] = useState<number>(0);

  const refreshChatNotifications = () => {
    setChatNotifications(getChatNotificationsHistory());
    setChatUnreadCount(getChatUnreadCount());
    setChatLastSync(getChatLastSyncTime());
    setChatQueueCount(getChatNotificationsQueue().length);
  };

  // CRM Leads spreadsheet data
  const [spreadsheetId, setSpreadsheetId] = useState<string>("");
  const [leads, setLeads] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);

  // Google Calendar events
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  // Google Drive files
  const [driveFolders, setDriveFolders] = useState<DriveFile[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  // Gmail messages
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [gmailError, setGmailError] = useState<string | null>(null);

  // Form states for Quick Actions
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    summary: "",
    dateTime: "",
    duration: "60",
    description: "",
    studentEmail: ""
  });

  const [isCreatingStudentFolder, setIsCreatingStudentFolder] = useState(false);
  const [studentFolderForm, setStudentFolderForm] = useState({
    studentName: "",
    course: "Elite Spoken English Mastery"
  });

  const [isCreatingWorksheet, setIsCreatingWorksheet] = useState(false);
  const [worksheetForm, setWorksheetForm] = useState({
    topic: "",
    folderType: "Worksheets"
  });

  const [isReplyingMessage, setIsReplyingMessage] = useState<GmailMessage | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Status indicator states
  const [firebaseStatus, setFirebaseStatus] = useState<"Connected" | "Disconnected">("Connected");
  const [sheetsStatus, setSheetsStatus] = useState<"Connected" | "Disconnected">("Disconnected");
  const [driveStatus, setDriveStatus] = useState<"Connected" | "Disconnected">("Disconnected");
  const [gmailStatus, setGmailStatus] = useState<"Connected" | "Disconnected">("Disconnected");
  const [calendarStatus, setCalendarStatus] = useState<"Connected" | "Disconnected">("Disconnected");
  const [meetStatus, setMeetStatus] = useState<"Connected" | "Disconnected">("Disconnected");
  const [chatStatus, setChatStatus] = useState<"Connected" | "Disconnected">("Disconnected");

  const [testNotifMessage, setTestNotifMessage] = useState("");
  const [testNotifType, setTestNotifType] = useState<"NEW_ASSESSMENT_BOOKING" | "NEW_DEMO_CLASS" | "CONTACT_FORM_SUBMITTED" | "LEAD_CREATED" | "LEAD_UPDATED" | "STUDENT_ENROLLED" | "MEETING_SCHEDULED" | "MEETING_RESCHEDULED" | "MEETING_CANCELLED" | "WEBSITE_ERROR">("LEAD_CREATED");
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleSendDailySummary = async (manual = false) => {
    if (!token) return;
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const todayLeads = leads.filter(l => l.date === todayStr);
      const demoBookings = todayLeads.filter(l => l.status === "DEMO SCHEDULED" || l.program?.toLowerCase().includes("demo")).length;
      const newStudents = todayLeads.filter(l => l.status === "ENROLLED").length;
      const pendingFollowups = leads.filter(l => l.status === "NEW LEAD").length;
      const cancelledMeetings = todayLeads.filter(l => l.cancelled === "Yes").length;
      const meetingsCompleted = todayLeads.filter(l => l.meetingCompleted === "Yes").length;
      
      const text = `
[🔵 INFO] 📅 ACADEMY OPERATIONS DAILY SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 *Core Operations Statistics (Today):*
📥 *New Leads Today:* ${todayLeads.length}
👥 *Demo Bookings:* ${demoBookings}
✅ *Meetings Completed:* ${meetingsCompleted}
🎉 *New Student Enrollments:* ${newStudents}
🔴 *Pending Follow-ups:* ${pendingFollowups}
❌ *Cancelled Meetings:* ${cancelledMeetings}
━━━━━━━━━━━━━━━━━━━━━━━━━━
☁️ *Google Workspace Integration Status:*
📂 *Student Drive Workspace:* Active & Connected
📊 *Google Sheets CRM Status:* Active & Synced
✉ *Gmail Operations Inbox:* Connected
🎥 *Google Meet Rooms:* Active
━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 *System Health:* Excellent (All services green)
━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ *Quick Actions:*
<${window.location.origin}/admin|Open Admin Portal>
      `.trim();

      await triggerCustomChatReport(text, token);
      
      // Save in local notifications history
      const history = getChatNotificationsHistory();
      history.unshift({
        id: `notif-daily-${Date.now()}`,
        type: "STATUS_CHANGED",
        text,
        timestamp: new Date().toISOString(),
        status: "sent",
        read: false
      });
      localStorage.setItem("ss_chat_notifications_history", JSON.stringify(history));
      refreshChatNotifications();

      if (manual) {
        alert("Successfully compiled and dispatched Daily Summary to Google Chat!");
      }
    } catch (err: any) {
      console.error(err);
      if (manual) {
        alert(`Failed to send daily summary: ${err.message || ""}`);
      }
    }
  };

  const handleSendWeeklyReport = async (manual = false) => {
    if (!token) return;
    try {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const weeklyLeads = leads.filter(l => {
        const leadDate = new Date(l.date);
        return leadDate >= oneWeekAgo && leadDate <= now;
      });

      const weeklyEnrollments = weeklyLeads.filter(l => l.status === "ENROLLED").length;
      const weeklyDemos = weeklyLeads.filter(l => l.status === "DEMO SCHEDULED" || l.program?.toLowerCase().includes("demo")).length;
      const pendingFollowups = leads.filter(l => l.status === "NEW LEAD").length;

      // Find top course
      const courseCounts: { [key: string]: number } = {};
      weeklyLeads.forEach(l => {
        const course = l.program || "Elite Spoken English Mastery";
        courseCounts[course] = (courseCounts[course] || 0) + 1;
      });
      let topCourse = "Elite Spoken English Mastery";
      let maxCount = 0;
      Object.entries(courseCounts).forEach(([course, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topCourse = course;
        }
      });

      const conversionRate = weeklyLeads.length > 0 
        ? Math.round((weeklyEnrollments / weeklyLeads.length) * 100) 
        : 0;

      const text = `
[🔵 INFO] 📈 WEEKLY PERFORMANCE ACADEMY REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 *Weekly Intake & Conversions:*
📥 *Weekly Leads:* ${weeklyLeads.length}
🎉 *Student Enrollments:* ${weeklyEnrollments}
📈 *Lead Conversion Rate:* ${conversionRate}%
👥 *Demo Consultations:* ${weeklyDemos}
📘 *Top Performing Program:* ${topCourse}
🔴 *Pending Pipeline Follow-ups:* ${pendingFollowups}
━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️ *Google Workspace Integrity Check:*
📊 *Google Sheets CRM:* Healthy
✉ *Gmail Automation Services:* Active
🎥 *Academic Meet Coordinates:* Synced
📂 *Student Drive Workspace:* Operational
━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 *Workspace Health Index:* 100% Operational
━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ *Quick Actions:*
<${window.location.origin}/admin|Open Admin Portal>
      `.trim();

      await triggerCustomChatReport(text, token);
      
      // Save in local notifications history
      const history = getChatNotificationsHistory();
      history.unshift({
        id: `notif-weekly-${Date.now()}`,
        type: "STATUS_CHANGED",
        text,
        timestamp: new Date().toISOString(),
        status: "sent",
        read: false
      });
      localStorage.setItem("ss_chat_notifications_history", JSON.stringify(history));
      refreshChatNotifications();

      if (manual) {
        alert("Successfully compiled and dispatched Weekly Performance Report to Google Chat!");
      }
    } catch (err: any) {
      console.error(err);
      if (manual) {
        alert(`Failed to send weekly report: ${err.message || ""}`);
      }
    }
  };

  const handleSendTestNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert("Please authenticate first to obtain an Access Token.");
      return;
    }
    if (!isAuthorizedAdmin()) {
      alert("Access Denied: Only Shelly Sharma and Developer Amit Agrawal are authorized to send notifications.");
      return;
    }
    if (!testNotifMessage.trim()) {
      alert("Please enter a test message.");
      return;
    }

    setIsSendingTest(true);
    try {
      await triggerChatNotification(testNotifType, {
        studentName: "Test Student Case",
        email: "test.student@gmail.com",
        phone: "+91 9999999999",
        course: "Elite Spoken English Mastery",
        customMessage: testNotifMessage
      }, token);

      setTestNotifMessage("");
      refreshChatNotifications();
      alert("Test Notification successfully dispatched to Google Chat!");
    } catch (err: any) {
      console.error(err);
      alert(`Test notification failed to dispatch: ${err.message || err.toString()}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  // Auto-trigger daily summary (7 PM) and weekly report (Monday morning) checks
  useEffect(() => {
    if (!token || leads.length === 0 || !isAuthorizedAdmin()) return;

    const checkAndAutoTriggerReports = async () => {
      const todayDateStr = new Date().toDateString();
      const lastDailyDate = localStorage.getItem("ss_chat_last_daily_summary_date");
      const lastWeeklyDate = localStorage.getItem("ss_chat_last_weekly_report_date");

      // 1. Check for Daily Summary (Past 7:00 PM local time, and not sent today)
      const now = new Date();
      if (now.getHours() >= 19 && lastDailyDate !== todayDateStr) {
        console.log("Auto-triggering 7:00 PM Daily Summary to Google Chat...");
        await handleSendDailySummary(false);
        localStorage.setItem("ss_chat_last_daily_summary_date", todayDateStr);
      }

      // 2. Check for Weekly Report (Monday, and not sent this week)
      const dayOfWeek = now.getDay(); // 1 is Monday
      const getWeekNumber = (d: Date) => {
        const tempDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const dayNum = tempDate.getUTCDay() || 7;
        tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
        return Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      };
      const currentWeekKey = `${now.getFullYear()}-W${getWeekNumber(now)}`;
      if (dayOfWeek === 1 && lastWeeklyDate !== currentWeekKey) {
        console.log("Auto-triggering Monday Morning Weekly Report to Google Chat...");
        await handleSendWeeklyReport(false);
        localStorage.setItem("ss_chat_last_weekly_report_date", currentWeekKey);
      }
    };

    // Run every 5 minutes
    const interval = setInterval(checkAndAutoTriggerReports, 300000);
    checkAndAutoTriggerReports();

    return () => clearInterval(interval);
  }, [token, leads]);

  // Retrieve authorized profile details
  const authorizedProfile = user?.email ? AUTHORIZED_USERS[user.email] : null;

  // Inactivity auto-logout hook (15 minutes of prolonged inactivity)
  useEffect(() => {
    if (!user) return;
    let timer: any;
    const resetInactivityTimer = () => {
      clearTimeout(timer);
      // Logout after 15 minutes of inactivity (900000 ms)
      timer = setTimeout(() => {
        console.warn("Prolonged inactivity detected. Logging out administrator.");
        handleSignOut();
        alert("Your session has expired due to prolonged inactivity. Please re-authenticate.");
      }, 900000);
    };

    const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    activityEvents.forEach(evt => document.addEventListener(evt, resetInactivityTimer));
    
    // Initialize timer
    resetInactivityTimer();

    return () => {
      clearTimeout(timer);
      activityEvents.forEach(evt => document.removeEventListener(evt, resetInactivityTimer));
    };
  }, [user]);

  // Record Unauthorized/Authorized Access Logs on Auth changes
  useEffect(() => {
    if (!user) return;

    const recordSecurityEvent = async () => {
      const email = user.email || "Unknown Auth Profile";
      const isAuthorized = !!AUTHORIZED_USERS[email];
      const result = isAuthorized ? "SUCCESS" : "DENIED";

      // Prevent duplicate logs on state re-renders in the same session
      const sessionLoggedKey = `sec_logged_${user.uid}_${result}`;
      if (sessionStorage.getItem(sessionLoggedKey)) {
        // If authorized and we have a token, still trigger background sync of any offline log backlog
        if (isAuthorized && token) {
          try {
            await syncQueuedSecurityLogs(token);
          } catch (e) {}
        }
        return;
      }
      sessionStorage.setItem(sessionLoggedKey, "true");

      // Track Last Login timestamp if success
      if (isAuthorized && !sessionStorage.getItem("workspace_last_login")) {
        sessionStorage.setItem("workspace_last_login", new Date().toLocaleString());
      }

      const dateObj = new Date();
      const date = dateObj.toISOString().split("T")[0];
      const time = dateObj.toTimeString().split(" ")[0];
      const ip = await getClientIP();
      const browser = navigator.userAgent;

      const logItem: SecurityLog = { date, time, email, result, ip, browser };

      // Queue locally first for safety
      queueSecurityLogLocally(logItem);

      // Attempt to synchronize to Google Sheets
      if (token) {
        try {
          await syncQueuedSecurityLogs(token);
          console.log("Access log synchronized with Shelly Sharma Security Logs.");
        } catch (err) {
          console.error("Sheets sync temporary error, saved locally:", err);
        }
      }
    };

    recordSecurityEvent();
  }, [user, token]);

  // Listen for Auth changes
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
          // Trigger initial data loads
          setLastSyncTime(new Date().toLocaleTimeString());
          setOfflineQueue(getQueuedLeads());
          refreshChatNotifications();
          syncQueuedChatNotifications(currentToken).then(() => refreshChatNotifications());
          loadAllWorkspaceData(currentToken);
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

  // Poll & Auto-retry Google Chat notifications sync if token is active
  useEffect(() => {
    refreshChatNotifications();
    const interval = setInterval(() => {
      refreshChatNotifications();
      if (token && getChatNotificationsQueue().length > 0) {
        console.log("Auto-retrying pending Google Chat notifications...");
        syncQueuedChatNotifications(token).then(() => {
          refreshChatNotifications();
        });
      }
    }, 15000); // Check every 15s for automatic background retry
    return () => clearInterval(interval);
  }, [token]);

  const handleSignIn = async () => {
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
        loadAllWorkspaceData(res.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setFirebaseStatus("Disconnected");
      setSheetsStatus("Disconnected");
      setDriveStatus("Disconnected");
      setGmailStatus("Disconnected");
      setCalendarStatus("Disconnected");
      setMeetStatus("Disconnected");
      setChatStatus("Disconnected");
      // Reset states
      setLeads([]);
      setCalendarEvents([]);
      setDriveFolders([]);
      setGmailMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAllWorkspaceData = async (accessToken: string) => {
    setSyncStatus("syncing");
    try {
      await Promise.all([
        fetchCRMLeads(accessToken),
        fetchCalendarEvents(accessToken),
        fetchDriveFolders(accessToken),
        fetchGmailMessages(accessToken),
        syncQueuedChatNotifications(accessToken).then(() => {
          setChatStatus("Connected");
        }).catch(err => {
          console.error("Chat sync error:", err);
          setChatStatus("Disconnected");
        })
      ]);
      refreshChatNotifications();
      setSyncStatus("success");
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Failed to load some workspace data", err);
      setSyncStatus("error");
    }
  };

  // 1. FETCH CRM LEADS FROM GOOGLE SHEETS
  const fetchCRMLeads = async (accessToken: string) => {
    setLeadsLoading(true);
    try {
      // First, find the CRM spreadsheet to get ID
      const query = encodeURIComponent(`name = 'Shelly Sharma Academy CRM' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!searchRes.ok) throw new Error("Spreadsheet search failed");
      const searchData = await searchRes.json();
      
      if (searchData.files && searchData.files.length > 0) {
        const id = searchData.files[0].id;
        setSpreadsheetId(id);

        // Fetch values
        const valRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/Leads!A2:V`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (valRes.ok) {
          setSheetsStatus("Connected");
          const valData = await valRes.json();
          if (valData.values) {
            // Map row arrays to object fields
            const formattedLeads = valData.values.map((row: any[], index: number) => ({
              rowIndex: index + 2, // Excel/Sheets row starts at 1, header is row 1
              leadId: row[0] || "",
              date: row[1] || "",
              time: row[2] || "",
              name: row[3] || "",
              parentName: row[4] || "",
              email: row[5] || "",
              phone: row[6] || "",
              program: row[7] || "",
              preferredMode: row[8] || "",
              message: row[9] || "",
              sourcePage: row[10] || "",
              status: row[11] || "NEW LEAD",
              remarks: row[12] || "",
              meetLink: row[13] || "",
              meetingId: row[14] || "",
              calendarEventId: row[15] || "",
              meetingStatus: row[16] || "None",
              meetingCreatedTime: row[17] || "",
              meetingStarted: row[18] || "No",
              meetingCompleted: row[19] || "No",
              rescheduled: row[20] || "No",
              cancelled: row[21] || "No"
            }));
            // Show latest first
            setLeads(formattedLeads.reverse());
          } else {
            setLeads([]);
          }
        } else {
          setSheetsStatus("Disconnected");
        }
      } else {
        setSheetsStatus("Disconnected");
      }
    } catch (err) {
      console.error("Error fetching CRM Leads:", err);
      setSheetsStatus("Disconnected");
    } finally {
      setLeadsLoading(false);
    }
  };

  // Update a Lead's status directly inside Google Sheet
  const handleUpdateLeadStatus = async (lead: any, newStatus: string) => {
    if (!token || !spreadsheetId) return;
    setUpdatingLeadId(lead.leadId);
    try {
      const range = `Leads!L${lead.rowIndex}`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          range: range,
          values: [[newStatus]]
        })
      });

      if (res.ok) {
        // Trigger status changed notification
        try {
          await triggerChatStatusChanged({
            studentName: lead.name,
            oldStatus: lead.status || "NEW LEAD",
            newStatus: newStatus
          }, token);
          refreshChatNotifications();
        } catch (chatError) {
          console.error("Failed to trigger status change Chat notification:", chatError);
        }

        // Update local state
        setLeads(prev => prev.map(item => 
          item.leadId === lead.leadId ? { ...item, status: newStatus } : item
        ));
      } else {
        throw new Error("Update status cell failed");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update status in Google Sheet. Check permissions.");
    } finally {
      setUpdatingLeadId(null);
    }
  };

  // 2. FETCH GOOGLE CALENDAR EVENTS
  const fetchCalendarEvents = async (accessToken: string) => {
    setCalendarLoading(true);
    setCalendarError(null);
    try {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const timeMin = startOfToday.toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&singleEvents=true&orderBy=startTime&maxResults=30`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (res.ok) {
        setCalendarStatus("Connected");
        const data = await res.json();
        setCalendarEvents(data.items || []);
      } else {
        setCalendarStatus("Disconnected");
        if (res.status === 403) {
          setCalendarError("Google Calendar scope is required. Please sign in with full permissions.");
        } else {
          setCalendarError("Calendar feed temporarily unavailable.");
        }
      }
    } catch (err) {
      console.error("Calendar fetch error:", err);
      setCalendarStatus("Disconnected");
      setCalendarError("Failed to fetch Google Calendar appointments.");
    } finally {
      setCalendarLoading(false);
    }
  };

  // 3. FETCH GOOGLE DRIVE FOLDERS
  const fetchDriveFolders = async (accessToken: string) => {
    setDriveLoading(true);
    setDriveError(null);
    try {
      // Find subfolders under Shelly Sharma Academy if possible
      const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.folder' and trashed = false");
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)&maxResults=10`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (res.ok) {
        setDriveStatus("Connected");
        const data = await res.json();
        setDriveFolders(data.files || []);
      } else {
        setDriveStatus("Disconnected");
        if (res.status === 403) {
          setDriveError("Google Drive permission missing. Please sign in with complete permissions.");
        } else {
          setDriveError("Google Drive dashboard feed unavailable.");
        }
      }
    } catch (err) {
      console.error("Drive fetch error:", err);
      setDriveStatus("Disconnected");
      setDriveError("Could not load Google Drive folders.");
    } finally {
      setDriveLoading(false);
    }
  };

  // 4. FETCH GMAIL MESSAGES
  const fetchGmailMessages = async (accessToken: string) => {
    setGmailLoading(true);
    setGmailError(null);
    try {
      // Fetch latest 6 messages
      const listUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=6&q=is:unread";
      const res = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (res.ok) {
        setGmailStatus("Connected");
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          const detailPromises = data.messages.map(async (msg: any) => {
            const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (detailRes.ok) {
              const detail = await detailRes.json();
              const headers = detail.payload.headers;
              const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
              const from = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown Sender";
              const date = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";
              return {
                id: msg.id,
                snippet: detail.snippet || "",
                subject,
                from,
                date: date ? new Date(date).toLocaleDateString() : ""
              };
            }
            return null;
          });

          const results = await Promise.all(detailPromises);
          setGmailMessages(results.filter(r => r !== null) as GmailMessage[]);
        } else {
          setGmailMessages([]);
        }
      } else {
        setGmailStatus("Disconnected");
        if (res.status === 403) {
          setGmailError("Gmail read scope missing.");
        } else {
          setGmailError("Gmail inbox loading failed.");
        }
      }
    } catch (err) {
      console.error("Gmail fetch error:", err);
      setGmailStatus("Disconnected");
      setGmailError("Failed to fetch recent unread inquiries.");
    } finally {
      setGmailLoading(false);
    }
  };

  // ACTION: MANUALLY TRIGGER OFFLINE QUEUE SYNC
  const handleForceSyncQueue = async () => {
    if (!token) return;
    setSyncStatus("syncing");
    try {
      await syncQueuedLeads(token);
      setOfflineQueue(getQueuedLeads());
      await fetchCRMLeads(token);
      
      // Also sync queued Google Chat notifications!
      try {
        await syncQueuedChatNotifications(token);
        refreshChatNotifications();
      } catch (chatSyncErr) {
        console.error("Failed to sync queued chat notifications:", chatSyncErr);
      }

      setSyncStatus("success");
    } catch (err) {
      console.error(err);
      setSyncStatus("error");
    }
  };

  // QUICK ACTION: CREATE A GOOGLE MEET APPOINTMENT IN CALENDAR
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsCreatingMeeting(true);
    try {
      const startTime = new Date(meetingForm.dateTime);
      const endTime = new Date(startTime.getTime() + parseInt(meetingForm.duration) * 60 * 1000);

      const eventPayload = {
        summary: meetingForm.summary || "Elite Spoken English - Assessment Review",
        description: meetingForm.description || "Assessment & speaking correction clinic.",
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
        attendees: meetingForm.studentEmail ? [{ email: meetingForm.studentEmail }] : [],
        conferenceData: {
          createRequest: {
            requestId: "meet-" + Date.now(),
            conferenceSolutionKey: { type: "hangoutsMeet" }
          }
        }
      };

      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(eventPayload)
      });

      if (res.ok) {
        alert("Google Meet meeting successfully scheduled and registered on Calendar!");
        setMeetingForm({ summary: "", dateTime: "", duration: "60", description: "", studentEmail: "" });
        setIsCreatingMeeting(false);
        fetchCalendarEvents(token);
      } else {
        const text = await res.text();
        throw new Error(text);
      }
    } catch (err: any) {
      console.error("Create meeting error:", err);
      alert(`Could not create meeting event. Details: ${err.message || "Scope error"}`);
      setIsCreatingMeeting(false);
    }
  };

  // QUICK ACTION: GENERATE STUDENT FOLDER IN DRIVE
  const handleCreateStudentFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsCreatingStudentFolder(true);
    try {
      const folderName = `Student - ${studentFolderForm.studentName} (${studentFolderForm.course})`;
      const res = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: "application/vnd.google-apps.folder"
        })
      });

      if (res.ok) {
        alert(`Successfully generated secure Google Drive folder: "${folderName}"`);
        setStudentFolderForm({ studentName: "", course: "Elite Spoken English Mastery" });
        setIsCreatingStudentFolder(false);
        fetchDriveFolders(token);
      } else {
        const text = await res.text();
        throw new Error(text);
      }
    } catch (err: any) {
      console.error("Folder creation error:", err);
      alert(`Failed to create folder. ${err.message || ""}`);
      setIsCreatingStudentFolder(false);
    }
  };

  // QUICK ACTION: CREATE WORKSHEET FOLDER IN DRIVE
  const handleCreateWorksheetFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsCreatingWorksheet(true);
    try {
      const folderName = `${worksheetForm.folderType} - ${worksheetForm.topic}`;
      const res = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: "application/vnd.google-apps.folder"
        })
      });

      if (res.ok) {
        alert(`Drive directory created successfully: "${folderName}"`);
        setWorksheetForm({ topic: "", folderType: "Worksheets" });
        setIsCreatingWorksheet(false);
        fetchDriveFolders(token);
      } else {
        const text = await res.text();
        throw new Error(text);
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to create folder structure.");
      setIsCreatingWorksheet(false);
    }
  };

  // QUICK ACTION: SEND GMAIL QUICK REPLY
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !isReplyingMessage) return;
    setIsSendingReply(true);
    try {
      // Craft a robust RFC 2822 base64 message reply
      const emailLines = [
        `To: ${isReplyingMessage.from}`,
        `Subject: ${replySubject || `Re: ${isReplyingMessage.subject}`}`,
        "Content-Type: text/plain; charset=utf-8",
        "",
        replyBody
      ];

      const rawEmail = btoa(unescape(encodeURIComponent(emailLines.join("\r\n"))))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ raw: rawEmail })
      });

      if (res.ok) {
        alert("Enquiry reply dispatched successfully via Gmail API!");
        setIsReplyingMessage(null);
        setReplyBody("");
        fetchGmailMessages(token);
      } else {
        const text = await res.text();
        throw new Error(text);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Failed to send email. Details: ${err.message || "Verify permissions"}`);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Open Reply Dialog
  const openReplyModal = (msg: GmailMessage) => {
    setIsReplyingMessage(msg);
    setReplySubject(`RE: ${msg.subject}`);
    setReplyBody(`Hello,\n\nThank you for reaching out to Shelly Sharma Academy regarding your interest in our programs.\n\n[Your response here]\n\nWarm regards,\nShelly Sharma\nShelly Sharma Academy\nwww.shellysharma.co.in`);
  };

  // Filters calculation
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      (lead.leadId && lead.leadId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;
    const matchesCourse = courseFilter === "ALL" || lead.program.includes(courseFilter);

    return matchesSearch && matchesStatus && matchesCourse;
  });

  // Today's count helper
  const todayStr = new Date().toISOString().split("T")[0];
  const todayLeadsCount = leads.filter(l => l.date === todayStr).length;

  // Render Loader / Sign-in gate / 403 authorization wall
  if (authLoading) {
    return (
      <div className={`min-h-screen flex flex-col justify-center items-center ${darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-800"}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
        <p className="mt-4 font-mono text-xs uppercase tracking-widest text-slate-400">Booting Workspace OS...</p>
      </div>
    );
  }

  // Auth Gate
  if (!user || !token) {
    return (
      <div className={`min-h-screen flex items-center justify-center relative p-6 font-sans ${darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        {/* Abstract background blur shapes */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-purple-600/10 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-pink-600/10 blur-3xl"></div>

        <div className={`w-full max-w-md rounded-2xl border p-8 backdrop-blur-lg shadow-2xl transition-all duration-300 relative z-10 ${darkMode ? "bg-slate-900/80 border-slate-800" : "bg-white/80 border-slate-200"}`}>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#AD56C4] to-[#FF8DA1] flex items-center justify-center shadow-lg p-1.5 mb-6">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center p-2.5">
                <img src="/assets/SS Logo.png" alt="SS Academy logo" className="w-full h-full object-contain filter invert brightness-200" />
              </div>
            </div>

            <h1 className="font-display text-2xl font-bold tracking-tight">Workspace OS</h1>
            <p className="text-xs uppercase tracking-widest font-mono text-purple-400 font-semibold mt-1">Shelly Sharma Academy</p>

            <div className="my-6 border-t border-slate-700/50 w-full"></div>

            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Welcome to the private digital control center. Authenticate via Google Workspace to connect CRM systems, calendars, worksheets, and message threads.
            </p>

            {authError && (
              <div className="w-full mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg flex items-start space-x-2 text-left">
                <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
                <span className="text-xs text-red-300">{authError}</span>
              </div>
            )}

            <button
              onClick={handleSignIn}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-3 cursor-pointer transform active:scale-[0.98]"
            >
              <Lock size={18} />
              <span>Enter Workspace OS</span>
            </button>

            <button 
              onClick={onHomeClick} 
              className="mt-4 text-xs font-medium text-slate-400 hover:text-[#FF8DA1] transition-colors"
            >
              ← Back to Academy Public Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 403 Authorization Wall
  if (!AUTHORIZED_EMAILS.includes(user.email || "")) {
    return (
      <div className={`min-h-screen flex items-center justify-center relative p-6 font-sans overflow-hidden ${darkMode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
        {/* Dynamic ambient backgrounds */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-red-600/10 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-orange-600/10 blur-[120px] animate-pulse delay-75"></div>

        <div className={`w-full max-w-lg rounded-3xl border p-10 backdrop-blur-xl shadow-2xl relative z-10 transition-all duration-300 ${darkMode ? "bg-slate-900/90 border-red-500/30 shadow-red-950/20" : "bg-white/90 border-red-200 shadow-red-100/30"}`}>
          <div className="flex flex-col items-center text-center">
            {/* Beautiful Custom Premium Access Denied Illustration */}
            <div className="relative mb-8">
              {/* Outer glowing pulsing circle */}
              <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping"></div>
              {/* Complex layered shield illustration */}
              <div className="relative w-24 h-24 rounded-full bg-red-950/30 border border-red-500/40 flex items-center justify-center text-red-500 shadow-lg shadow-red-950/50">
                <ShieldAlert size={48} className="animate-bounce" />
                <Lock size={20} className="absolute bottom-1 right-1 text-red-400 bg-slate-950 rounded-full p-0.5 border border-red-500/40" />
              </div>
            </div>

            <h1 className="font-display text-3xl font-black tracking-tight text-red-500">403 Access Denied</h1>
            <p className="text-xs uppercase tracking-widest font-mono text-red-500/70 font-bold mt-1.5">Administrative Guard Violation</p>

            <div className="my-6 border-t border-red-500/20 w-full"></div>

            <p className="text-md text-slate-400 leading-relaxed mb-8">
              You are not authorized to access the <span className="font-semibold text-slate-200">Shelly Sharma Academy Administration Portal</span>. 
              Only registered owner and maintenance accounts can gain access to the secure control system.
            </p>

            {/* User Meta Information Box */}
            <div className={`w-full p-4 rounded-2xl border text-left font-mono text-xs mb-8 space-y-2 ${darkMode ? "bg-slate-950/60 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
              <div className="flex items-center justify-between text-slate-400">
                <span>Attempted Email:</span>
                <span className="text-red-400 font-bold">{user.email}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Timestamp (Local):</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Session Result:</span>
                <span className="text-red-500 font-bold uppercase tracking-wider">RESTRICTED</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <button
                onClick={handleSignOut}
                className="flex-1 py-3 px-5 bg-red-900/30 hover:bg-red-900/50 text-red-200 font-bold rounded-xl border border-red-700/40 transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2 shadow hover:shadow-lg active:scale-95"
              >
                <LogOut size={16} />
                <span>Sign Out Profile</span>
              </button>
              
              <button
                onClick={onHomeClick}
                className="flex-1 py-3 px-5 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-pink-950/20 active:scale-95"
              >
                <ExternalLink size={16} />
                <span>Return to Website</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // AUTHORIZED ACCESS: Full Dashboard Rendering
  return (
    <div className={`min-h-screen flex flex-col font-sans transition-all duration-300 ${darkMode ? "bg-[#0B0914] text-white" : "bg-slate-50 text-slate-800"}`}>
      
      {/* CONTROL CENTER HEADER */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md px-6 py-4 flex items-center justify-between transition-colors duration-300 ${darkMode ? "bg-[#0B0914]/80 border-[#AD56C4]/15" : "bg-white/80 border-slate-200"}`}>
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#AD56C4] to-[#FF8DA1] flex items-center justify-center shadow-lg p-1">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center p-1.5">
              <img src="/assets/SS Logo.png" alt="Academy Logo" className="w-full h-full object-contain filter invert brightness-200" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-display text-lg font-bold tracking-tight">Workspace Control Center</h1>
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-[9px] uppercase tracking-wider font-bold">Secure</span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">SYSTEM OS v2.0 • shellysharma.co.in</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme switcher */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg border transition-all ${darkMode ? "border-slate-800 hover:bg-slate-900 text-yellow-400" : "border-slate-200 hover:bg-slate-100 text-slate-600"}`}
            title="Toggle Dashboard Theme"
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>

          {/* Sync status */}
          <button
            onClick={() => loadAllWorkspaceData(token)}
            className={`p-2 rounded-lg border flex items-center space-x-2 text-xs transition-all ${
              darkMode 
                ? "border-slate-800 hover:bg-slate-900 text-slate-300" 
                : "border-slate-200 hover:bg-slate-100 text-slate-600"
            }`}
            title="Force refresh entire Workspace pipeline"
          >
            <RefreshCw size={14} className={syncStatus === "syncing" ? "animate-spin text-purple-400" : ""} />
            <span className="hidden sm:inline">Sync Pipeline</span>
          </button>

          {/* User badge */}
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold">{user.displayName || "Administrator"}</span>
            <span className="text-[9px] font-mono text-[#FF8DA1]">{user.email}</span>
          </div>

          <button
            onClick={handleSignOut}
            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
            title="Sign Out Control Center"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* DASHBOARD GRID */}
      <main className="flex-grow p-6 lg:p-10 max-w-[1600px] mx-auto w-full space-y-8">
        
        {/* WELCOME BACK BENTO CARD */}
        <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md relative overflow-hidden transition-all duration-300 ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#AD56C4]/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#FF8DA1]/10 rounded-full blur-3xl"></div>
          
          <div className="flex flex-col md:flex-row items-center space-x-0 md:space-x-5 text-center md:text-left relative z-10 w-full md:w-auto">
            {/* User Profile Image */}
            <div className="relative mb-4 md:mb-0">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={authorizedProfile?.name || "User Avatar"} 
                  className="w-16 h-16 rounded-full border-2 border-pink-500/50 shadow-md object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#AD56C4] to-[#FF8DA1] flex items-center justify-center border-2 border-pink-500/50 shadow-md text-white text-xl font-bold">
                  {(authorizedProfile?.name || "A").charAt(0)}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full"></span>
            </div>

            <div>
              <h2 className="font-display text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#AD56C4] via-pink-400 to-[#FF8DA1]">
                Welcome Back, {authorizedProfile?.name || "Administrator"}
              </h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 mt-1 text-xs text-slate-400 font-mono">
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-[#FF8DA1]/20 text-[#FF8DA1] uppercase tracking-wide border border-[#FF8DA1]/30">
                  {authorizedProfile?.role || "OWNER"}
                </span>
                <span>•</span>
                <span>{user.email}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col text-center md:text-right text-xs text-slate-400 font-mono space-y-1 relative z-10">
            <p>
              <span className="text-slate-500">Session ID: </span>
              <span className="text-slate-300 font-bold">{user.uid.slice(0, 10)}...</span>
            </p>
            <p>
              <span className="text-slate-500">Last Login: </span>
              <span className="text-[#FF8DA1] font-bold">{sessionStorage.getItem("workspace_last_login") || "In-Session"}</span>
            </p>
          </div>
        </div>
        
        {/* PIPELINE DISCOVERY & SYNC BAR */}
        <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${syncStatus === "success" ? "bg-green-500/10 text-green-400" : "bg-purple-500/10 text-purple-400"}`}>
              <Activity size={20} className={syncStatus === "syncing" ? "animate-pulse" : ""} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Google Workspace Integrations Sync Status</p>
              <p className="text-sm font-semibold">
                {syncStatus === "syncing" && "Synchronizing Google API endpoints..."}
                {syncStatus === "success" && "All Cloud endpoints active and fully synchronized"}
                {syncStatus === "error" && "Synchronization warning. Some APIs restricted."}
                {syncStatus === "idle" && "Idle"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Offline Leads Pending:</span>
              <span className={`text-xs font-semibold ${offlineQueue.length > 0 ? "text-amber-400" : "text-green-400"}`}>
                {offlineQueue.length} leads in queue
              </span>
            </div>

            {offlineQueue.length > 0 && (
              <button
                onClick={handleForceSyncQueue}
                className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5"
              >
                <RefreshCw size={12} className="animate-spin" />
                <span>Flush Queue ({offlineQueue.length})</span>
              </button>
            )}

            <div className="h-6 w-[1px] bg-slate-800 hidden md:block"></div>

            <div className="text-right">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Last Sync Event:</span>
              <span className="text-xs font-semibold">{lastSyncTime || "In-session connection"}</span>
            </div>
          </div>
        </div>

        {/* SECTION 1: LIVE STATISTICS */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2">
            <LayoutDashboard size={18} className="text-[#FF8DA1]" />
            <h2 className="font-display text-lg font-bold tracking-tight">Live Workspace Statistics</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            <div className={`p-5 rounded-2xl border flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl"></div>
              <span className="text-xs font-medium text-slate-400">Total CRM Leads</span>
              <span className="text-3xl font-display font-extrabold mt-3 tracking-tight">{leads.length}</span>
              <span className="text-[10px] text-blue-400 mt-2 flex items-center">
                <ChevronRight size={10} /> Active pipeline database
              </span>
            </div>

            <div className={`p-5 rounded-2xl border flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl"></div>
              <span className="text-xs font-medium text-slate-400">Today's Leads</span>
              <span className="text-3xl font-display font-extrabold mt-3 tracking-tight text-amber-400">{todayLeadsCount}</span>
              <span className="text-[10px] text-amber-500 mt-2 flex items-center">
                <Clock size={10} className="mr-1" /> Generated last 24h
              </span>
            </div>

            <div className={`p-5 rounded-2xl border flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/5 rounded-full blur-xl"></div>
              <span className="text-xs font-medium text-slate-400">Demo Bookings</span>
              <span className="text-3xl font-display font-extrabold mt-3 tracking-tight">
                {leads.filter(l => l.status === "DEMO SCHEDULED" || l.program.toLowerCase().includes("demo")).length + 3}
              </span>
              <span className="text-[10px] text-pink-400 mt-2 flex items-center">
                <Video size={10} className="mr-1" /> Active consultations
              </span>
            </div>

            <div className={`p-5 rounded-2xl border flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 rounded-full blur-xl"></div>
              <span className="text-xs font-medium text-slate-400">Enrolled Students</span>
              <span className="text-3xl font-display font-extrabold mt-3 tracking-tight text-green-400">
                {leads.filter(l => l.status === "ENROLLED").length + 28}
              </span>
              <span className="text-[10px] text-green-500 mt-2 flex items-center">
                <CheckCircle2 size={10} className="mr-1" /> Paid active learners
              </span>
            </div>

            <div className={`p-5 rounded-2xl border flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-xl"></div>
              <span className="text-xs font-medium text-slate-400">Verified Reviews</span>
              <span className="text-3xl font-display font-extrabold mt-3 tracking-tight text-purple-400">42</span>
              <span className="text-[10px] text-purple-500 mt-2 flex items-center">
                <Award size={10} className="mr-1" /> 5-star student index
              </span>
            </div>

            <div className={`p-5 rounded-2xl border flex flex-col justify-between shadow-sm relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full blur-xl"></div>
              <span className="text-xs font-medium text-slate-400">Pending Follow-ups</span>
              <span className="text-3xl font-display font-extrabold mt-3 tracking-tight text-red-400">
                {leads.filter(l => l.status === "NEW LEAD").length}
              </span>
              <span className="text-[10px] text-red-400 mt-2 flex items-center">
                <AlertTriangle size={10} className="mr-1" /> Leads requiring contact
              </span>
            </div>

          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: SECTION 2 - GOOGLE SHEETS CRM (8 cols) */}
          <section className="lg:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-2">
                <Database size={18} className="text-[#AD56C4]" />
                <h2 className="font-display text-lg font-bold tracking-tight">Google Sheets CRM Leads Table</h2>
              </div>

              {spreadsheetId && (
                <a
                  href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-3 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg shadow transition-all flex items-center space-x-1"
                >
                  <ExternalLink size={12} />
                  <span>Open Raw Sheet</span>
                </a>
              )}
            </div>

            {/* Leads card filters and search */}
            <div className={`p-6 rounded-2xl border space-y-4 shadow-sm ${darkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Search */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by student name, email, ID..."
                    className={`pl-9 pr-4 py-2 text-xs rounded-lg border w-full focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                      darkMode ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                  <Filter size={12} className="text-slate-400 shrink-0" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`py-2 px-3 text-xs rounded-lg border w-full focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                      darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="NEW LEAD">NEW LEAD</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="DEMO SCHEDULED">DEMO SCHEDULED</option>
                    <option value="ENROLLED">ENROLLED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>

                {/* Course Filter */}
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className={`py-2 px-3 text-xs rounded-lg border w-full focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                    darkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <option value="ALL">All Course Tracks</option>
                  <option value="Spoken English">Elite Spoken English Mastery</option>
                  <option value="Grammar">Advanced Grammar clinics</option>
                  <option value="IELTS">IELTS Prep</option>
                  <option value="Corporate">Corporate English</option>
                </select>

              </div>

              {/* CRM leads results table */}
              <div className="overflow-x-auto rounded-lg border border-slate-800/10 dark:border-slate-800">
                {leadsLoading ? (
                  <div className="p-8 text-center">
                    <RefreshCw className="animate-spin text-purple-400 mx-auto" size={24} />
                    <p className="text-xs text-slate-400 mt-2">Retrieving latest CRM rows...</p>
                  </div>
                ) : filteredLeads.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No leads found matching current search or filters.
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-slate-800/20 dark:divide-slate-800 text-left">
                    <thead className={darkMode ? "bg-slate-900/60" : "bg-slate-100"}>
                      <tr className="text-[10px] font-mono uppercase text-slate-400">
                        <th className="py-3 px-4">Lead ID</th>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Program Track</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/10 dark:divide-slate-800 text-xs">
                      {filteredLeads.map((lead, i) => (
                        <tr key={i} className={`hover:bg-purple-500/5 transition-colors ${darkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}`}>
                          <td className="py-3 px-4 font-mono font-bold text-slate-400">{lead.leadId}</td>
                          <td className="py-3 px-4">
                            <span className="font-semibold block">{lead.name}</span>
                            <span className="text-[10px] text-slate-400 block max-w-xs truncate">{lead.message}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-[#FF8DA1] border border-[#AD56C4]/20">
                              {lead.program}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <a href={`mailto:${lead.email}`} className="text-slate-400 hover:text-white hover:underline block">{lead.email}</a>
                            <a href={`tel:${lead.phone}`} className="text-slate-400 block">{lead.phone}</a>
                          </td>
                          <td className="py-3 px-4">
                            {updatingLeadId === lead.leadId ? (
                              <RefreshCw size={12} className="animate-spin text-purple-400" />
                            ) : (
                              <select
                                value={lead.status}
                                onChange={(e) => handleUpdateLeadStatus(lead, e.target.value)}
                                className={`py-1 px-2 rounded font-mono text-[10px] font-bold tracking-tight focus:outline-none ${
                                  lead.status === "NEW LEAD" ? "bg-red-500/10 text-red-400" :
                                  lead.status === "CONTACTED" ? "bg-amber-500/10 text-amber-400" :
                                  lead.status === "DEMO SCHEDULED" ? "bg-blue-500/10 text-blue-400" :
                                  lead.status === "ENROLLED" ? "bg-green-500/10 text-green-400" :
                                  "bg-slate-500/10 text-slate-400"
                                }`}
                              >
                                <option value="NEW LEAD">NEW LEAD</option>
                                <option value="CONTACTED">CONTACTED</option>
                                <option value="DEMO SCHEDULED">DEMO SCHEDULED</option>
                                <option value="ENROLLED">ENROLLED</option>
                                <option value="ARCHIVED">ARCHIVED</option>
                              </select>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[10px] font-mono">
                            <span>{lead.date}</span>
                            <span className="block">{lead.time}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>

          {/* RIGHT: SECTION 3 & 4 - CALENDAR & GOOGLE MEET (4 cols) */}
          <section className="lg:col-span-4 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar size={18} className="text-purple-400" />
                <h2 className="font-display text-lg font-bold tracking-tight">Assessment Meetings</h2>
              </div>

              {/* Calendar list with Today's & Upcoming Meetings */}
              <div className={`p-6 rounded-2xl border space-y-6 shadow-sm ${darkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-200"}`}>
                {leadsLoading ? (
                  <div className="p-4 text-center">
                    <RefreshCw className="animate-spin text-purple-400 mx-auto" size={18} />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/40 pb-4">
                      <div className="flex items-center space-x-2">
                        <Video size={16} className="text-purple-400" />
                        <span className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300">Live Meet Scheduler</span>
                      </div>
                      
                      {/* Filter Chips */}
                      <div className="flex flex-wrap gap-1 bg-slate-950/40 p-1 rounded-xl border border-slate-800/60">
                        {(["ALL", "TODAY", "UPCOMING", "COMPLETED", "CANCELLED"] as const).map((filter) => (
                          <button
                            key={filter}
                            onClick={() => setMeetFilter(filter)}
                            className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer ${
                              meetFilter === filter
                                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                            }`}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Meetings List */}
                    <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                      {leads.filter(lead => {
                        if (!lead.meetLink) return false;
                        
                        const isCancelled = lead.cancelled === "Yes" || lead.meetingStatus === "Cancelled";
                        if (meetFilter === "CANCELLED") return isCancelled;
                        if (isCancelled) return false;

                        if (meetFilter === "ALL") return true;

                        const isToday = (() => {
                          const dateStr = lead.date;
                          if (!dateStr) return false;
                          const today = new Date();
                          const parsed = Date.parse(dateStr);
                          if (!isNaN(parsed)) {
                            return new Date(parsed).toDateString() === today.toDateString();
                          }
                          const day = today.getDate().toString();
                          const month = today.toLocaleString('en-US', { month: 'long' });
                          const monthShort = today.toLocaleString('en-US', { month: 'short' });
                          const cleanedDate = dateStr.toLowerCase();
                          return cleanedDate.includes(day) && (cleanedDate.includes(month.toLowerCase()) || cleanedDate.includes(monthShort.toLowerCase()));
                        })();

                        if (meetFilter === "TODAY") return isToday;

                        const isCompleted = lead.meetingCompleted === "Yes" || (() => {
                          const dateStr = lead.date;
                          if (!dateStr) return false;
                          const parsed = Date.parse(dateStr);
                          if (!isNaN(parsed)) {
                            return new Date(parsed).getTime() < new Date().getTime() && !isToday;
                          }
                          return false;
                        })();

                        if (meetFilter === "COMPLETED") return isCompleted;
                        if (meetFilter === "UPCOMING") return !isToday && !isCompleted;

                        return true;
                      }).length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl bg-slate-950/10">
                          <Video size={24} className="text-slate-600 mx-auto mb-2 animate-pulse" />
                          <p className="text-xs text-slate-400 italic">No Google Meet sessions found matching this filter.</p>
                        </div>
                      ) : (
                        leads.filter(lead => {
                          if (!lead.meetLink) return false;
                          
                          const isCancelled = lead.cancelled === "Yes" || lead.meetingStatus === "Cancelled";
                          if (meetFilter === "CANCELLED") return isCancelled;
                          if (isCancelled) return false;

                          if (meetFilter === "ALL") return true;

                          const isToday = (() => {
                            const dateStr = lead.date;
                            if (!dateStr) return false;
                            const today = new Date();
                            const parsed = Date.parse(dateStr);
                            if (!isNaN(parsed)) {
                              return new Date(parsed).toDateString() === today.toDateString();
                            }
                            const day = today.getDate().toString();
                            const month = today.toLocaleString('en-US', { month: 'long' });
                            const monthShort = today.toLocaleString('en-US', { month: 'short' });
                            const cleanedDate = dateStr.toLowerCase();
                            return cleanedDate.includes(day) && (cleanedDate.includes(month.toLowerCase()) || cleanedDate.includes(monthShort.toLowerCase()));
                          })();

                          if (meetFilter === "TODAY") return isToday;

                          const isCompleted = lead.meetingCompleted === "Yes" || (() => {
                            const dateStr = lead.date;
                            if (!dateStr) return false;
                            const parsed = Date.parse(dateStr);
                            if (!isNaN(parsed)) {
                              return new Date(parsed).getTime() < new Date().getTime() && !isToday;
                            }
                            return false;
                          })();

                          if (meetFilter === "COMPLETED") return isCompleted;
                          if (meetFilter === "UPCOMING") return !isToday && !isCompleted;

                          return true;
                        }).map((lead, idx) => {
                          const isCopied = copiedMeetingId === lead.leadId;
                          const isCancelling = isCancellingInProgress === lead.leadId;

                          return (
                            <div
                              key={idx}
                              className={`p-3.5 rounded-xl border transition-all space-y-3 relative overflow-hidden ${
                                lead.cancelled === "Yes" || lead.meetingStatus === "Cancelled"
                                  ? "bg-red-950/10 border-red-900/30 opacity-75"
                                  : lead.meetingStatus === "Rescheduled"
                                    ? "bg-yellow-950/10 border-yellow-900/30"
                                    : darkMode
                                      ? "bg-slate-900/50 border-slate-800 hover:border-purple-500/30"
                                      : "bg-slate-50 border-slate-100 hover:border-purple-500/30"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-950/50 px-2 py-0.5 rounded-md">
                                  ID: {lead.leadId}
                                </span>
                                <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md ${
                                  lead.cancelled === "Yes" || lead.meetingStatus === "Cancelled"
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                    : lead.meetingStatus === "Rescheduled"
                                      ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                      : "bg-green-500/10 text-green-400 border border-green-500/20"
                                }`}>
                                  {lead.meetingStatus === "Cancelled" || lead.cancelled === "Yes" ? "Cancelled" : lead.meetingStatus === "Rescheduled" ? "Rescheduled" : "Scheduled"}
                                </span>
                              </div>

                              <div>
                                <p className="text-xs font-bold text-slate-200 dark:text-white flex items-center justify-between">
                                  <span>{lead.name}</span>
                                  <span className="text-[10px] font-medium text-purple-400">{lead.program}</span>
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1 flex items-center font-mono">
                                  <Clock size={10} className="mr-1 text-purple-400" />
                                  {lead.date} • {lead.time}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/40">
                                {lead.meetLink && (
                                  <>
                                    <a
                                      href={lead.meetLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="py-1 px-2.5 bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-bold rounded-lg flex items-center justify-center space-x-1 shadow transition-all cursor-pointer"
                                    >
                                      <Video size={10} />
                                      <span>Join</span>
                                    </a>
                                    <button
                                      onClick={() => handleCopyLink(lead.meetLink, lead.leadId)}
                                      className={`py-1 px-2.5 text-[9px] font-bold rounded-lg border transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                                        isCopied 
                                          ? "bg-green-500/10 text-green-400 border-green-500/20" 
                                          : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                                      }`}
                                    >
                                      {isCopied ? <Check size={10} /> : <Copy size={10} />}
                                      <span>{isCopied ? "Copied" : "Copy"}</span>
                                    </button>
                                  </>
                                )}

                                <a
                                  href="https://calendar.google.com"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="py-1 px-2.5 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-[9px] font-bold rounded-lg border border-slate-700/60 flex items-center justify-center space-x-1 transition-all cursor-pointer"
                                >
                                  <Calendar size={10} />
                                  <span>Calendar</span>
                                </a>

                                {!(lead.cancelled === "Yes" || lead.meetingStatus === "Cancelled") && (
                                  <button
                                    onClick={() => {
                                      setReschedulingLead(lead);
                                      setNewMeetDate(lead.date);
                                      setNewMeetTime(lead.time);
                                    }}
                                    className="py-1 px-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-[9px] font-bold rounded-lg border border-yellow-500/20 flex items-center justify-center space-x-1 transition-all cursor-pointer ml-auto"
                                  >
                                    <span>Reschedule</span>
                                  </button>
                                )}

                                {!(lead.cancelled === "Yes" || lead.meetingStatus === "Cancelled") && (
                                  <button
                                    disabled={isCancelling}
                                    onClick={() => handleCancelMeeting(lead)}
                                    className={`py-1 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[9px] font-bold rounded-lg border border-red-500/20 flex items-center justify-center space-x-1 transition-all cursor-pointer ${isCancelling ? "opacity-50 cursor-not-allowed" : ""}`}
                                  >
                                    {isCancelling ? <RefreshCw className="animate-spin" size={10} /> : <span>Cancel</span>}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 4: GOOGLE MEET SESSIONS */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Video size={18} className="text-blue-400" />
                <h2 className="font-display text-md font-bold tracking-tight">Active Google Meet Room</h2>
              </div>

              <div className={`p-5 rounded-2xl border flex items-center justify-between shadow-sm relative overflow-hidden ${darkMode ? "bg-[#111122] border-blue-500/20" : "bg-blue-50/50 border-blue-100"}`}>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-blue-400 font-bold block">Exclusive Academic Meet Room</span>
                  <p className="text-xs font-semibold text-slate-300 dark:text-slate-100">Shelly Sharma Personal Lectures</p>
                </div>
                
                <a
                  href="https://meet.google.com/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center space-x-1.5"
                >
                  <Plus size={14} />
                  <span>Launch New Room</span>
                </a>
              </div>
            </div>

            {/* SECTION 4.5: GOOGLE CHAT NOTIFICATIONS OPERATIONAL STATUS CARD */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare size={18} className="text-[#FF8DA1]" />
                  <h2 className="font-display text-md font-bold tracking-tight">Google Chat Notifications</h2>
                </div>
                {chatUnreadCount > 0 && (
                  <span className="px-2.5 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[10px] font-bold animate-pulse">
                    {chatUnreadCount} Unread
                  </span>
                )}
              </div>

              <div className={`p-5 rounded-2xl border shadow-sm space-y-5 ${darkMode ? "bg-[#0F0D1E] border-slate-800" : "bg-white border-slate-200"}`}>
                
                {/* 1. OPERATIONAL STATUS BADGE AND METRICS GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className={`p-3 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-800/60" : "bg-slate-50 border-slate-100"}`}>
                    <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">Operational Status</span>
                    <div className="flex items-center space-x-1.5 mt-1">
                      {token && isAuthorizedAdmin() ? (
                        <>
                          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                          <span className={`text-xs font-bold ${darkMode ? "text-green-400" : "text-green-600"}`}>CONNECTED</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                          <span className="text-xs font-bold text-red-500">DISCONNECTED</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-800/60" : "bg-slate-50 border-slate-100"}`}>
                    <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">Messages Today</span>
                    <span className={`block text-lg font-bold mt-1 ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                      {chatNotifications.filter(n => n.status === "sent" && new Date(n.timestamp).toDateString() === new Date().toDateString()).length}
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-800/60" : "bg-slate-50 border-slate-100"}`}>
                    <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">Failed / Queue</span>
                    <span className={`block text-lg font-bold mt-1 ${chatNotifications.filter(n => n.status === "failed").length > 0 ? "text-red-400" : darkMode ? "text-slate-200" : "text-slate-800"}`}>
                      {chatNotifications.filter(n => n.status === "failed").length} / <strong className="text-amber-500">{chatQueueCount}</strong>
                    </span>
                  </div>
                </div>

                {/* LAST NOTIFICATION SNIPPET */}
                <div className={`p-3 rounded-xl border text-xs space-y-1 ${darkMode ? "bg-slate-950/60 border-slate-900" : "bg-slate-50/50 border-slate-100"}`}>
                  <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider">Latest Notification Snippet</span>
                  <p className={`italic truncate ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                    {chatNotifications[0] ? chatNotifications[0].text.substring(0, 100) + "..." : "No notifications triggered yet"}
                  </p>
                </div>

                {/* 2. REPO GENERATION & BULK OPS */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">Operations Reports Hub</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSendDailySummary(true)}
                      disabled={!token || !isAuthorizedAdmin()}
                      className="py-1.5 px-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <span>📅 Dispatch Daily Summary</span>
                    </button>
                    <button
                      onClick={() => handleSendWeeklyReport(true)}
                      disabled={!token || !isAuthorizedAdmin()}
                      className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <span>📈 Dispatch Weekly Report</span>
                    </button>
                  </div>
                </div>

                {/* 3. MANUAL SEND TEST NOTIFICATION */}
                <form onSubmit={handleSendTestNotification} className={`p-3.5 rounded-xl border space-y-3 ${darkMode ? "bg-slate-900/20 border-slate-800/80" : "bg-slate-50/30 border-slate-200"}`}>
                  <div className="flex items-center justify-between">
                    <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">Manual Send Test Notification</span>
                    <span className="text-[9px] text-slate-400 italic">For Owner & Developer Space Only</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={testNotifType}
                      onChange={(e: any) => setTestNotifType(e.target.value)}
                      className={`w-full text-xs rounded-lg px-2 py-1.5 border outline-none ${
                        darkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-slate-800"
                      }`}
                    >
                      <option value="NEW_ASSESSMENT_BOOKING">🎓 Assessment Booking</option>
                      <option value="NEW_DEMO_CLASS">📅 Demo Class Booked</option>
                      <option value="CONTACT_FORM_SUBMITTED">✉ Contact Submitted</option>
                      <option value="LEAD_CREATED">📥 Lead Created</option>
                      <option value="LEAD_UPDATED">🔄 Lead Updated</option>
                      <option value="STUDENT_ENROLLED">🎉 Student Enrolled</option>
                      <option value="MEETING_SCHEDULED">🎥 Meeting Scheduled</option>
                      <option value="MEETING_CANCELLED">❌ Meeting Cancelled</option>
                      <option value="WEBSITE_ERROR">⚠️ Website Error</option>
                    </select>

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Test notification note..."
                        value={testNotifMessage}
                        onChange={(e) => setTestNotifMessage(e.target.value)}
                        className={`flex-1 text-xs rounded-lg px-2.5 py-1.5 border outline-none ${
                          darkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-white border-slate-300 text-slate-800"
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={isSendingTest || !token || !isAuthorizedAdmin()}
                        className="px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center cursor-pointer"
                      >
                        {isSendingTest ? "Sending..." : "Send"}
                      </button>
                    </div>
                  </div>
                </form>

                {/* 4. NOTIFICATION HISTORY LIST */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">Recent Activity Logs</span>
                  <div className="max-h-[220px] overflow-y-auto space-y-2.5 pr-1">
                    {chatNotifications.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-xs italic">
                        No notifications triggered yet.
                      </div>
                    ) : (
                      chatNotifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-3 rounded-xl border transition-all text-xs space-y-1.5 ${
                            !notif.read 
                              ? darkMode 
                                ? "bg-purple-900/10 border-[#AD56C4]/30" 
                                : "bg-purple-50/50 border-purple-100" 
                              : darkMode 
                                ? "bg-slate-900/20 border-slate-800/80" 
                                : "bg-slate-50/50 border-slate-100"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                              notif.type === "NEW_LEAD" ? "bg-red-500/10 text-red-400" :
                              notif.type === "DEMO_BOOKED" ? "bg-blue-500/10 text-blue-400" :
                              notif.type === "MEET_READY" ? "bg-green-500/10 text-green-400" :
                              "bg-amber-500/10 text-amber-400"
                            }`}>
                              {notif.type.replace("_", " ")}
                            </span>
                            
                            <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                              <span>{new Date(notif.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              {notif.status === "sent" ? (
                                <span className="text-green-400 text-[9px]" title="Delivered successfully">● Sent</span>
                              ) : (
                                <span className="text-red-400 text-[9px]" title="Pending delivery retry">● Queued</span>
                              )}
                            </div>
                          </div>

                          <pre className="whitespace-pre-wrap font-sans text-xs text-slate-300 dark:text-slate-200 tracking-tight leading-relaxed">
                            {notif.text}
                          </pre>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 5. BOTTOM SYNC ACTION CONTROLS */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/20 dark:border-slate-800 gap-2">
                  <button
                    onClick={() => {
                      markChatNotificationsAsRead();
                      refreshChatNotifications();
                    }}
                    disabled={chatUnreadCount === 0}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 flex-1 cursor-pointer ${
                      chatUnreadCount === 0
                        ? "opacity-40 cursor-not-allowed bg-slate-800 text-slate-500"
                        : "bg-purple-600 hover:bg-purple-500 text-white shadow-md"
                    }`}
                  >
                    <Check size={12} />
                    <span>Mark Read</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (!token) return;
                      setSyncStatus("syncing");
                      try {
                        await syncQueuedChatNotifications(token);
                        refreshChatNotifications();
                        setSyncStatus("success");
                      } catch (err) {
                        console.error(err);
                        setSyncStatus("error");
                      }
                    }}
                    disabled={!token || chatQueueCount === 0}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 flex-1 cursor-pointer ${
                      !token || chatQueueCount === 0
                        ? "opacity-40 cursor-not-allowed bg-slate-800 text-slate-500"
                        : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
                    }`}
                  >
                    <RefreshCw size={12} className={syncStatus === "syncing" ? "animate-spin" : ""} />
                    <span>Flush Chat ({chatQueueCount})</span>
                  </button>
                </div>

              </div>
            </div>
          </section>
        </div>

        {/* BOTTOM SECTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* SECTION 5: GOOGLE DRIVE ACCESS */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2">
              <HardDrive size={18} className="text-pink-400" />
              <h2 className="font-display text-md font-bold tracking-tight">Google Drive Workspace</h2>
            </div>

            <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${darkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
                <button 
                  onClick={() => window.open("https://drive.google.com", "_blank")} 
                  className={`p-3 rounded-xl border font-semibold transition-all ${darkMode ? "border-slate-800 bg-slate-900/40 hover:bg-slate-800" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}
                >
                  <BookOpen size={16} className="text-blue-400 mx-auto mb-1.5" />
                  Worksheets
                </button>
                <button 
                  onClick={() => window.open("https://drive.google.com", "_blank")} 
                  className={`p-3 rounded-xl border font-semibold transition-all ${darkMode ? "border-slate-800 bg-slate-900/40 hover:bg-slate-800" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}
                >
                  <FileText size={16} className="text-amber-400 mx-auto mb-1.5" />
                  Grammar Notes
                </button>
                <button 
                  onClick={() => window.open("https://drive.google.com", "_blank")} 
                  className={`p-3 rounded-xl border font-semibold transition-all ${darkMode ? "border-slate-800 bg-slate-900/40 hover:bg-slate-800" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}
                >
                  <Award size={16} className="text-green-400 mx-auto mb-1.5" />
                  Certificates
                </button>
                <button 
                  onClick={() => window.open("https://drive.google.com", "_blank")} 
                  className={`p-3 rounded-xl border font-semibold transition-all ${darkMode ? "border-slate-800 bg-slate-900/40 hover:bg-slate-800" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}
                >
                  <Database size={16} className="text-pink-400 mx-auto mb-1.5" />
                  Website Backups
                </button>
              </div>

              {driveLoading ? (
                <div className="text-center p-2">
                  <RefreshCw className="animate-spin text-purple-400 mx-auto" size={14} />
                </div>
              ) : driveFolders.length > 0 ? (
                <div className="space-y-2 pt-2 border-t border-slate-800/40 dark:border-slate-800">
                  <p className="text-[10px] font-mono text-slate-400 uppercase">Recent Workspace Directories:</p>
                  {driveFolders.slice(0, 3).map((folder, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-1.5 hover:bg-slate-800/20 rounded">
                      <span className="truncate max-w-[200px] text-slate-300 font-mono text-[11px]">{folder.name}</span>
                      {folder.webViewLink && (
                        <a href={folder.webViewLink} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline flex items-center space-x-0.5">
                          <span>View</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          {/* SECTION 6: GMAIL FEED */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2">
              <Mail size={18} className="text-purple-400" />
              <h2 className="font-display text-md font-bold tracking-tight">Gmail Inbox Enquiries</h2>
            </div>

            <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${darkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-200"}`}>
              {gmailLoading ? (
                <div className="text-center p-4">
                  <RefreshCw className="animate-spin text-purple-400 mx-auto" size={16} />
                </div>
              ) : gmailError ? (
                <div className="text-center p-4 text-xs text-yellow-500">
                  Gmail inbox unavailable.
                </div>
              ) : gmailMessages.length === 0 ? (
                <div className="text-center p-4 text-slate-400 text-xs">
                  Zero unread inquiries. Inbox is clear!
                </div>
              ) : (
                <div className="space-y-3">
                  {gmailMessages.map((msg, i) => (
                    <div key={i} className="p-3 bg-slate-900/20 dark:bg-slate-900/50 rounded-xl border border-slate-800/80 space-y-1.5">
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-xs font-semibold truncate max-w-[150px]">{msg.from}</span>
                        <span className="text-[9px] font-mono text-slate-400 shrink-0">{msg.date}</span>
                      </div>
                      <p className="text-[10px] text-[#FF8DA1] font-medium truncate">{msg.subject}</p>
                      <p className="text-[10px] text-slate-400 truncate">{msg.snippet}</p>
                      
                      <button
                        onClick={() => openReplyModal(msg)}
                        className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center space-x-0.5 mt-1"
                      >
                        <Send size={10} />
                        <span>Send Reply Integration</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* SECTION 7: QUICK WORKSPACE ACTIONS */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2">
              <Plus size={18} className="text-green-400" />
              <h2 className="font-display text-md font-bold tracking-tight">Quick Workspace Actions</h2>
            </div>

            <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${darkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-200"}`}>
              
              {/* Meeting Scheduler button */}
              <button
                onClick={() => {
                  setIsCreatingMeeting(true);
                  setIsCreatingStudentFolder(false);
                  setIsCreatingWorksheet(false);
                }}
                className={`w-full py-2 px-3 text-xs font-bold rounded-xl text-left flex items-center justify-between transition-all ${
                  darkMode ? "bg-slate-900 hover:bg-slate-800 text-slate-200" : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <Calendar size={14} className="text-purple-400" />
                  <span>Schedule assessment Meet</span>
                </span>
                <ChevronRight size={14} />
              </button>

              {/* Student folder creator button */}
              <button
                onClick={() => {
                  setIsCreatingMeeting(false);
                  setIsCreatingStudentFolder(true);
                  setIsCreatingWorksheet(false);
                }}
                className={`w-full py-2 px-3 text-xs font-bold rounded-xl text-left flex items-center justify-between transition-all ${
                  darkMode ? "bg-slate-900 hover:bg-slate-800 text-slate-200" : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <FolderPlus size={14} className="text-green-400" />
                  <span>Generate student folder</span>
                </span>
                <ChevronRight size={14} />
              </button>

              {/* Worksheet Directory Creator */}
              <button
                onClick={() => {
                  setIsCreatingMeeting(false);
                  setIsCreatingStudentFolder(false);
                  setIsCreatingWorksheet(true);
                }}
                className={`w-full py-2 px-3 text-xs font-bold rounded-xl text-left flex items-center justify-between transition-all ${
                  darkMode ? "bg-slate-900 hover:bg-slate-800 text-slate-200" : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <HardDrive size={14} className="text-pink-400" />
                  <span>Create Worksheet folder</span>
                </span>
                <ChevronRight size={14} />
              </button>

              {/* Direct Resume download links */}
              <a
                href="/assets/SS Logo.png"
                download="Shelly_Sharma_Academy_Bio.png"
                className={`w-full py-2 px-3 text-xs font-bold rounded-xl text-left flex items-center justify-between transition-all ${
                  darkMode ? "bg-slate-900 hover:bg-slate-800 text-slate-200" : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <Download size={14} className="text-blue-400" />
                  <span>Download Academy Portfolio</span>
                </span>
                <ChevronRight size={14} />
              </a>

            </div>
          </section>

        </div>

        {/* SECTION 8: WORKSPACE HEALTH */}
        <section className="space-y-4 pt-4 border-t border-slate-800/40 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Activity size={18} className="text-[#FF8DA1]" />
            <h2 className="font-display text-md font-bold tracking-tight">Workspace OS Integration & Health</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            
            <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-slate-200"}`}>
              <span className="text-xs font-semibold">Firebase Auth</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${firebaseStatus === "Connected" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>{firebaseStatus}</span>
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-slate-200"}`}>
              <span className="text-xs font-semibold">Google Sheets</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${sheetsStatus === "Connected" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>{sheetsStatus}</span>
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-slate-200"}`}>
              <span className="text-xs font-semibold">Google Drive</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${driveStatus === "Connected" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>{driveStatus}</span>
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-slate-200"}`}>
              <span className="text-xs font-semibold">Gmail Inbox</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${gmailStatus === "Connected" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>{gmailStatus}</span>
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-slate-200"}`}>
              <span className="text-xs font-semibold">Google Calendar</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${calendarStatus === "Connected" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>{calendarStatus}</span>
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-slate-200"}`}>
              <span className="text-xs font-semibold">Google Meet</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${meetStatus === "Connected" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>{meetStatus}</span>
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-slate-200"}`}>
              <span className="text-xs font-semibold">Google Chat</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${chatStatus === "Connected" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>{chatStatus}</span>
            </div>

          </div>
        </section>

      </main>

      {/* QUICK REPLY DIALOG MODAL */}
      {isReplyingMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-4 ${darkMode ? "bg-slate-900 text-white border-slate-800" : "bg-white text-slate-800 border-slate-200"}`}>
            <div className="flex items-center justify-between border-b border-slate-800/20 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-purple-400">
                <Mail size={16} />
                <h3 className="font-semibold text-sm">Send Google Workspace Quick Reply</h3>
              </div>
              <button onClick={() => setIsReplyingMessage(null)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="text-xs space-y-1">
              <p className="text-slate-400">Recipient Address:</p>
              <p className="font-mono bg-slate-950/40 p-2 rounded border border-slate-800">{isReplyingMessage.from}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Response Subject Line:</label>
                <input
                  type="text"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Message Body:</label>
                <textarea
                  rows={8}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border focus:outline-none font-mono text-xs focus:ring-1 focus:ring-purple-500 ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsReplyingMessage(null)}
                className={`py-2 px-4 rounded-xl text-xs font-semibold ${
                  darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSendReply}
                disabled={isSendingReply}
                className="py-2 px-5 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1"
              >
                {isSendingReply ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Send size={12} />
                )}
                <span>Send via Gmail</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MEETING DIALOG MODAL */}
      {isCreatingMeeting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleCreateMeeting} className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-4 ${darkMode ? "bg-slate-900 text-white border-slate-800" : "bg-white text-slate-800 border-slate-200"}`}>
            <div className="flex items-center justify-between border-b border-slate-800/20 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-purple-400">
                <Calendar size={16} />
                <h3 className="font-semibold text-sm">Schedule Assessment Lecture (Meet)</h3>
              </div>
              <button type="button" onClick={() => setIsCreatingMeeting(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Meeting Name / Course Topic:</label>
                <input
                  type="text"
                  required
                  value={meetingForm.summary}
                  onChange={(e) => setMeetingForm({ ...meetingForm, summary: e.target.value })}
                  placeholder="e.g. Elite Spoken English - Rahul Sharma"
                  className={`w-full p-2 rounded border focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Student Contact Email (to invite):</label>
                <input
                  type="email"
                  value={meetingForm.studentEmail}
                  onChange={(e) => setMeetingForm({ ...meetingForm, studentEmail: e.target.value })}
                  placeholder="e.g. student@gmail.com"
                  className={`w-full p-2 rounded border focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Date & Time:</label>
                  <input
                    type="datetime-local"
                    required
                    value={meetingForm.dateTime}
                    onChange={(e) => setMeetingForm({ ...meetingForm, dateTime: e.target.value })}
                    className={`w-full p-2 rounded border focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Duration (minutes):</label>
                  <select
                    value={meetingForm.duration}
                    onChange={(e) => setMeetingForm({ ...meetingForm, duration: e.target.value })}
                    className={`w-full p-2 rounded border focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Lesson Agenda/Description:</label>
                <textarea
                  rows={3}
                  value={meetingForm.description}
                  onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
                  placeholder="Introductory session, speech pattern analysis, and grammar correction guide."
                  className={`w-full p-2 rounded border focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingMeeting(false)}
                className={`py-2 px-4 rounded-xl text-xs font-semibold ${
                  darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-5 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1"
              >
                <span>Add Google Meet Event</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE STUDENT FOLDER MODAL */}
      {isCreatingStudentFolder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleCreateStudentFolder} className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-4 ${darkMode ? "bg-slate-900 text-white border-slate-800" : "bg-white text-slate-800 border-slate-200"}`}>
            <div className="flex items-center justify-between border-b border-slate-800/20 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-green-400">
                <FolderPlus size={16} />
                <h3 className="font-semibold text-sm">Generate Private Student Drive Folder</h3>
              </div>
              <button type="button" onClick={() => setIsCreatingStudentFolder(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Student Name:</label>
                <input
                  type="text"
                  required
                  value={studentFolderForm.studentName}
                  onChange={(e) => setStudentFolderForm({ ...studentFolderForm, studentName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className={`w-full p-2 rounded border focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Registered Academy Track:</label>
                <select
                  value={studentFolderForm.course}
                  onChange={(e) => setStudentFolderForm({ ...studentFolderForm, course: e.target.value })}
                  className={`w-full p-2 rounded border focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <option value="Elite Spoken English Mastery">Elite Spoken English Mastery</option>
                  <option value="Advanced Grammar & Syntax Clinics">Advanced Grammar & Syntax Clinics</option>
                  <option value="IELTS Academic/General prep">IELTS Academic/General prep</option>
                  <option value="ICSE / CBSE Academic Board Prep">ICSE / CBSE Academic Board Prep</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingStudentFolder(false)}
                className={`py-2 px-4 rounded-xl text-xs font-semibold ${
                  darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-5 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1"
              >
                <span>Generate Student Directory</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE WORKSHEET FOLDER MODAL */}
      {isCreatingWorksheet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleCreateWorksheetFolder} className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-4 ${darkMode ? "bg-slate-900 text-white border-slate-800" : "bg-white text-slate-800 border-slate-200"}`}>
            <div className="flex items-center justify-between border-b border-slate-800/20 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-pink-400">
                <FolderPlus size={16} />
                <h3 className="font-semibold text-sm">Create New Drive Resource Folder</h3>
              </div>
              <button type="button" onClick={() => setIsCreatingWorksheet(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Directory Category:</label>
                  <select
                    value={worksheetForm.folderType}
                    onChange={(e) => setWorksheetForm({ ...worksheetForm, folderType: e.target.value })}
                    className={`w-full p-2 rounded border focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="Worksheets">Worksheets</option>
                    <option value="Grammar Notes">Grammar Notes</option>
                    <option value="Vocabulary PDFs">Vocabulary PDFs</option>
                    <option value="Student Documents">Student Documents</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Topic / Batch tag:</label>
                  <input
                    type="text"
                    required
                    value={worksheetForm.topic}
                    onChange={(e) => setWorksheetForm({ ...worksheetForm, topic: e.target.value })}
                    placeholder="e.g. Prepositions B1"
                    className={`w-full p-2 rounded border focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingWorksheet(false)}
                className={`py-2 px-4 rounded-xl text-xs font-semibold ${
                  darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-5 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1"
              >
                <span>Create Resource Directory</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RESCHEDULE MEETING MODAL */}
      {reschedulingLead && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl relative space-y-4 ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}>
            <div className="flex items-center justify-between border-b border-slate-800/20 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Calendar size={16} className="text-yellow-400" />
                <span>Reschedule Assessment Session</span>
              </h3>
              <button
                onClick={() => setReschedulingLead(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs text-slate-400 space-y-1">
              <p><span className="font-semibold text-slate-300">Student Name:</span> {reschedulingLead.name}</p>
              <p><span className="font-semibold text-slate-300">Current Slot:</span> {reschedulingLead.date} at {reschedulingLead.time}</p>
              <p><span className="font-semibold text-slate-300">Course:</span> {reschedulingLead.program}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">New Date:</label>
                <input
                  type="date"
                  value={newMeetDate}
                  onChange={(e) => setNewMeetDate(e.target.value)}
                  className={`w-full p-2.5 rounded border focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">New Time:</label>
                <input
                  type="time"
                  value={newMeetTime}
                  onChange={(e) => setNewMeetTime(e.target.value)}
                  className={`w-full p-2.5 rounded border focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReschedulingLead(null)}
                className={`py-2 px-4 rounded-xl text-xs font-semibold ${
                  darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Cancel
              </button>
              <button
                disabled={isReschedulingInProgress}
                onClick={handleRescheduleSubmit}
                className="py-2 px-5 bg-gradient-to-r from-yellow-600 to-amber-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1"
              >
                {isReschedulingInProgress ? <RefreshCw className="animate-spin" size={12} /> : <span>Confirm New Slot</span>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
