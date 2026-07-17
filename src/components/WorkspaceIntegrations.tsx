import React, { useState, useEffect } from "react";
import { 
  Calendar, Video, HardDrive, Mail, Clock, RefreshCw, Send, Copy, 
  Trash2, Plus, X, FolderPlus, Database, ShieldAlert, CheckCircle2, ChevronRight, Activity, MessageSquare, Shield, Eye
} from "lucide-react";
import { Inquiry, getSupabaseAuditLogs, AuditLog } from "../lib/supabaseClient";

interface WorkspaceIntegrationsProps {
  leads: Inquiry[];
  calendarEvents: any[];
  driveFolders: any[];
  gmailMessages: any[];
  chatNotifications: any[];
  securityLogs: any[];
  darkMode: boolean;
  token: string | null;
  onRescheduleMeeting: (lead: Inquiry, newDate: string, newTime: string) => Promise<void>;
  onCancelMeeting: (lead: Inquiry) => Promise<void>;
  onCreateWorksheet: (studentName: string, folderType: string, topic: string) => Promise<void>;
  onSendGmailReply: (threadId: string, replyBody: string, toEmail: string, subject: string) => Promise<void>;
  syncStatus: "idle" | "syncing" | "success" | "error";
  onForceSync: () => void;
}

export default function WorkspaceIntegrations({
  leads,
  calendarEvents,
  driveFolders,
  gmailMessages,
  chatNotifications,
  securityLogs,
  darkMode,
  token,
  onRescheduleMeeting,
  onCancelMeeting,
  onCreateWorksheet,
  onSendGmailReply,
  syncStatus,
  onForceSync
}: WorkspaceIntegrationsProps) {
  
  const [activeTab, setActiveTab] = useState<"MEET" | "GMAIL" | "DRIVE" | "CHAT" | "LOGS" | "AUDIT">("MEET");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Refresh system audit logs dynamically
  useEffect(() => {
    if (activeTab === "AUDIT") {
      setAuditLogs(getSupabaseAuditLogs());
    }
  }, [activeTab, leads]);
  
  // Meet schedule filters
  const [meetFilter, setMeetFilter] = useState<"ALL" | "TODAY" | "UPCOMING">("ALL");
  const [rescheduleLead, setRescheduleLead] = useState<Inquiry | null>(null);
  const [newMeetDate, setNewMeetDate] = useState("");
  const [newMeetTime, setNewMeetTime] = useState("");

  // Drive worksheet creator form
  const [showDriveForm, setShowDriveForm] = useState(false);
  const [driveForm, setDriveForm] = useState({
    studentName: "",
    folderType: "Worksheets & Grammar Clinic",
    topic: ""
  });

  // Gmail reply form
  const [selectedMail, setSelectedMail] = useState<any | null>(null);
  const [gmailReplyText, setGmailReplyText] = useState("");
  const [isSendingMail, setIsSendingMail] = useState(false);

  const [copiedMeetingId, setCopiedMeetingId] = useState<string | null>(null);

  const handleCopyMeetLink = (leadId: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedMeetingId(leadId);
    setTimeout(() => setCopiedMeetingId(null), 2000);
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleLead) return;
    await onRescheduleMeeting(rescheduleLead, newMeetDate, newMeetTime);
    setRescheduleLead(null);
    setNewMeetDate("");
    setNewMeetTime("");
  };

  const handleCreateWorksheetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateWorksheet(driveForm.studentName, driveForm.folderType, driveForm.topic);
    setShowDriveForm(false);
    setDriveForm({ studentName: "", folderType: "Worksheets & Grammar Clinic", topic: "" });
  };

  const handleGmailReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMail) return;
    setIsSendingMail(true);
    
    // Extract thread ID and metadata
    const threadId = selectedMail.id;
    const toEmail = selectedMail.from || "";
    const subject = selectedMail.subject || "Reply regarding your Shelly Sharma Academy inquiry";

    await onSendGmailReply(threadId, gmailReplyText, toEmail, subject);
    setIsSendingMail(false);
    setSelectedMail(null);
    setGmailReplyText("");
  };

  return (
    <div className={`p-6 rounded-3xl border backdrop-blur-md ${darkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-200"}`}>
      
      {/* 1. COMPACT INTEGRATION TAB NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
        <div className="flex flex-wrap gap-1 bg-slate-950/40 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab("MEET")}
            className={`px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "MEET" ? "bg-[#AD56C4] text-white" : "text-slate-400 hover:text-white"}`}
          >
            <Video size={13} />
            <span>Meet Calendars</span>
          </button>
          
          <button
            onClick={() => setActiveTab("GMAIL")}
            className={`px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "GMAIL" ? "bg-[#AD56C4] text-white" : "text-slate-400 hover:text-white"}`}
          >
            <Mail size={13} />
            <span>Gmail Client</span>
          </button>
          
          <button
            onClick={() => setActiveTab("DRIVE")}
            className={`px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "DRIVE" ? "bg-[#AD56C4] text-white" : "text-slate-400 hover:text-white"}`}
          >
            <HardDrive size={13} />
            <span>Drive Resources</span>
          </button>

          <button
            onClick={() => setActiveTab("CHAT")}
            className={`px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "CHAT" ? "bg-[#AD56C4] text-white" : "text-slate-400 hover:text-white"}`}
          >
            <MessageSquare size={13} />
            <span>Chat Logs</span>
          </button>

          <button
            onClick={() => setActiveTab("LOGS")}
            className={`px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "LOGS" ? "bg-[#AD56C4] text-white" : "text-slate-400 hover:text-white"}`}
          >
            <ShieldAlert size={13} />
            <span>Security Audit</span>
          </button>

          <button
            onClick={() => setActiveTab("AUDIT")}
            className={`px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "AUDIT" ? "bg-[#AD56C4] text-white" : "text-slate-400 hover:text-white"}`}
          >
            <Database size={13} />
            <span>System Audit Trail</span>
          </button>
        </div>

        {/* Sync Trigger */}
        <button
          onClick={onForceSync}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#AD56C4]/30 text-slate-300 hover:text-white text-xs font-mono transition-all cursor-pointer"
        >
          <RefreshCw size={12} className={syncStatus === "syncing" ? "animate-spin text-purple-400" : ""} />
          <span>Sync Workspace</span>
        </button>
      </div>

      {/* 2. TAB WORKSPACES CONTENT PANEL */}
      <div className="min-h-80">
        
        {/* --- GOOGLE MEET TAB --- */}
        {activeTab === "MEET" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Scheduled Consultations Scheduler</span>
              <div className="flex gap-1 bg-slate-950/40 p-1 rounded-xl border border-white/5 text-[9px] font-mono">
                {(["ALL", "TODAY", "UPCOMING"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setMeetFilter(f)}
                    className={`px-2 py-0.5 rounded uppercase font-bold transition-all ${meetFilter === f ? "bg-[#AD56C4] text-white" : "text-slate-400 hover:text-white"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leads.filter(l => !!l.meetLink).length === 0 ? (
                <div className="col-span-2 text-center py-12 border border-dashed border-white/5 rounded-2xl">
                  <Video size={24} className="text-slate-600 mx-auto mb-2 animate-pulse" />
                  <p className="text-xs text-slate-400 italic">No scheduled Google Meet consultations found.</p>
                </div>
              ) : (
                leads.filter(l => {
                  if (!l.meetLink) return false;
                  if (meetFilter === "ALL") return true;
                  const isToday = l.date === new Date().toISOString().split("T")[0];
                  if (meetFilter === "TODAY") return isToday;
                  return !isToday;
                }).map((lead) => (
                  <div key={lead.id} className="p-4 rounded-2xl border border-white/5 bg-slate-950/20 space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#FF8DA1] bg-[#FF8DA1]/10 px-2 py-0.5 rounded">
                        {lead.id}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        {lead.date} at {lead.time || "TBA"}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-white text-xs">{lead.studentName}</h4>
                      <p className="text-[10px] text-slate-400">{lead.selectedCourse}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleCopyMeetLink(lead.id, lead.meetLink || "")}
                        className="flex-1 py-1.5 px-2 bg-[#AD56C4]/10 hover:bg-[#AD56C4]/15 border border-[#AD56C4]/20 rounded-lg text-[10px] font-mono font-bold text-[#FF8DA1] flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <Copy size={11} />
                        <span>{copiedMeetingId === lead.id ? "Copied!" : "Copy Link"}</span>
                      </button>
                      
                      <button
                        onClick={() => setRescheduleLead(lead)}
                        className="py-1.5 px-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-mono text-slate-300 transition-all cursor-pointer"
                        title="Reschedule Meet"
                      >
                        Reschedule
                      </button>

                      <button
                        onClick={() => onCancelMeeting(lead)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 rounded-lg transition-all cursor-pointer"
                        title="Cancel Meet"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Reschedule Dialogue Overlay Modal */}
            {rescheduleLead && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                <div className="w-full max-w-sm p-6 rounded-3xl border border-white/5 bg-[#140E24] shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1">
                      <Calendar size={13} className="text-amber-400" />
                      <span>Reschedule Consultation</span>
                    </h3>
                    <button onClick={() => setRescheduleLead(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
                  </div>
                  <form onSubmit={handleRescheduleSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">New Date</label>
                      <input
                        type="date"
                        required
                        value={newMeetDate}
                        onChange={(e) => setNewMeetDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-white/5 bg-white/5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">New Time</label>
                      <input
                        type="time"
                        required
                        value={newMeetTime}
                        onChange={(e) => setNewMeetTime(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-white/5 bg-white/5 text-white"
                      />
                    </div>
                    <button type="submit" className="w-full py-2.5 px-4 bg-[#AD56C4] hover:bg-[#9c4bb1] text-white rounded-xl font-bold font-mono uppercase text-[10px]">
                      Confirm Rescheduled Slot
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- GMAIL CLIENT TAB --- */}
        {activeTab === "GMAIL" && (
          <div className="space-y-4">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Academy Inbound Emails</span>

            <div className="space-y-2">
              {gmailMessages.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl">
                  <Mail size={24} className="text-slate-600 mx-auto mb-2 animate-pulse" />
                  <p className="text-xs text-slate-400 italic">Google API Inbox clean. No threads found.</p>
                </div>
              ) : (
                gmailMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    onClick={() => setSelectedMail(msg)}
                    className="p-3.5 rounded-xl border border-white/5 bg-slate-950/20 hover:bg-slate-950/40 cursor-pointer flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-xs">{msg.from || "Potential Client"}</span>
                        <span className="text-[9px] font-mono text-slate-400">{msg.date}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-300 truncate max-w-md">{msg.subject || "(No Subject)"}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-lg">{msg.snippet}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>
                ))
              )}
            </div>

            {/* Email reply overlay drawer */}
            {selectedMail && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="w-full max-w-lg p-6 rounded-3xl border border-white/5 bg-[#140E24] shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Inbound Thread Reader</h3>
                    <button onClick={() => setSelectedMail(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
                  </div>
                  
                  <div className="space-y-1.5 p-3.5 rounded-xl bg-white/5 text-xs">
                    <p><span className="text-slate-400">From:</span> <strong className="text-white">{selectedMail.from}</strong></p>
                    <p><span className="text-slate-400">Subject:</span> <strong className="text-[#FF8DA1]">{selectedMail.subject}</strong></p>
                    <p className="pt-2 text-[#E2DBEA] italic">"{selectedMail.snippet}"</p>
                  </div>

                  <form onSubmit={handleGmailReplySubmit} className="space-y-3">
                    <textarea
                      required
                      rows={4}
                      value={gmailReplyText}
                      onChange={(e) => setGmailReplyText(e.target.value)}
                      placeholder="Compose your reply on behalf of Shelly Sharma Academy..."
                      className="w-full p-3.5 rounded-xl border border-white/5 bg-white/5 text-xs text-white"
                    />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setSelectedMail(null)} className="py-2 px-3 bg-slate-800 text-slate-300 text-xs rounded-xl font-bold">Close</button>
                      <button type="submit" disabled={isSendingMail} className="py-2 px-4 bg-[#AD56C4] hover:bg-[#9c4bb1] text-white text-xs rounded-xl font-bold flex items-center gap-1">
                        <Send size={12} />
                        <span>{isSendingMail ? "Sending..." : "Send Reply"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- GOOGLE DRIVE RESOURCE CREATOR TAB --- */}
        {activeTab === "DRIVE" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Student Academic Directories</span>
              <button
                onClick={() => setShowDriveForm(true)}
                className="py-1.5 px-3 bg-[#AD56C4]/20 hover:bg-[#AD56C4]/30 text-[#FF8DA1] border border-[#AD56C4]/30 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <FolderPlus size={12} />
                <span>Create Student Folder</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {driveFolders.length === 0 ? (
                <div className="col-span-3 text-center py-12 border border-dashed border-white/5 rounded-2xl">
                  <HardDrive size={24} className="text-slate-600 mx-auto mb-2 animate-pulse" />
                  <p className="text-xs text-slate-400 italic">No worksheets folders synchronized.</p>
                </div>
              ) : (
                driveFolders.map((folder) => (
                  <a 
                    key={folder.id} 
                    href={folder.webViewLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3.5 rounded-xl border border-white/5 bg-slate-950/20 hover:border-[#AD56C4]/25 flex items-center gap-2 text-slate-300 hover:text-white transition-all text-xs font-medium"
                  >
                    <FolderPlus className="text-yellow-400 shrink-0" size={16} />
                    <span className="truncate">{folder.name}</span>
                  </a>
                ))
              )}
            </div>

            {/* Custom Student Folder overlay */}
            {showDriveForm && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                <div className="w-full max-w-sm p-6 rounded-3xl border border-white/5 bg-[#140E24] shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Create Student workspace</h3>
                    <button onClick={() => setShowDriveForm(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
                  </div>
                  <form onSubmit={handleCreateWorksheetSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Student Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aradhya Goel"
                        value={driveForm.studentName}
                        onChange={(e) => setDriveForm({ ...driveForm, studentName: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-white/5 bg-white/5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Workspace Structure</label>
                      <select
                        value={driveForm.folderType}
                        onChange={(e) => setDriveForm({ ...driveForm, folderType: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-white/5 bg-white/5 text-white"
                      >
                        <option value="Worksheets & Grammar Clinic">Worksheets & Grammar Clinic</option>
                        <option value="IELTS Assessment Papers">IELTS Assessment Papers</option>
                        <option value="Executive Vocabulary PDFs">Executive Vocabulary PDFs</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Topic / Batch tag</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Prepositions B1"
                        value={driveForm.topic}
                        onChange={(e) => setDriveForm({ ...driveForm, topic: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-white/5 bg-white/5 text-white"
                      />
                    </div>
                    <button type="submit" className="w-full py-2.5 px-4 bg-[#AD56C4] hover:bg-[#9c4bb1] text-white rounded-xl font-bold font-mono uppercase text-[10px]">
                      Build Resource Folder
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- CHAT COMMUNICATION FEED LOGS TAB --- */}
        {activeTab === "CHAT" && (
          <div className="space-y-4">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Google Chat Notification History</span>
            
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {chatNotifications.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl">
                  <MessageSquare size={24} className="text-slate-600 mx-auto mb-2 animate-pulse" />
                  <p className="text-xs text-[#A79CB7] italic">No notifications generated in this workspace session.</p>
                </div>
              ) : (
                chatNotifications.map((chat) => (
                  <div key={chat.id} className="p-3.5 rounded-xl border border-white/5 bg-slate-950/25 flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-[#A79CB7]">
                        <span>{chat.timestamp || "Just Now"}</span>
                        <span>•</span>
                        <span className="uppercase text-[#FF8DA1] font-semibold">{chat.type || "NOTIFICATION"}</span>
                      </div>
                      <p className="text-xs text-white leading-relaxed">
                        {chat.message || chat.snippet}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- SECURITY AUDIT TAB --- */}
        {activeTab === "LOGS" && (
          <div className="space-y-4">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Admin Security Audit Trail</span>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {securityLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 italic border border-white/5 rounded-2xl">
                  No logs generated in this session.
                </div>
              ) : (
                securityLogs.map((log, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-white/5 bg-slate-950/20 text-xs font-mono flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-[#FF8DA1] font-semibold">{log.email}</p>
                      <p className="text-[10px] text-slate-500">{log.browser}</p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className={`font-bold uppercase ${log.result === "SUCCESS" ? "text-green-400" : "text-red-400"}`}>
                        {log.result}
                      </p>
                      <p className="text-[10px] text-slate-500">IP: {log.ip || "127.0.0.1"} ({log.date} {log.time})</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- SYSTEM AUDIT TRAIL TAB --- */}
        {activeTab === "AUDIT" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Database Action Audit Trail</span>
              <span className="text-[10px] font-mono text-[#AD56C4]">Supabase Source of Truth (Live Audit Logs)</span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 italic border border-white/5 rounded-2xl">
                  No system modifications logged yet. Logs will generate automatically as actions occur.
                </div>
              ) : (
                auditLogs.map((log) => {
                  let actionColor = "text-blue-400 bg-blue-500/10 border-blue-500/15";
                  if (log.action.includes("CREATE")) actionColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/15";
                  if (log.action.includes("UPDATE")) actionColor = "text-amber-400 bg-amber-500/10 border-amber-500/15";
                  if (log.action.includes("CONVERT")) actionColor = "text-[#FF8DA1] bg-[#FF8DA1]/10 border-[#FF8DA1]/15";
                  if (log.action.includes("ARCHIVE")) actionColor = "text-[#AD56C4] bg-[#AD56C4]/10 border-[#AD56C4]/15";
                  if (log.action.includes("DELETE")) actionColor = "text-red-400 bg-red-500/10 border-red-500/15";
                  if (log.action.includes("RESTORE")) actionColor = "text-teal-400 bg-teal-500/10 border-teal-500/15";

                  return (
                    <div key={log.id} className="p-4 rounded-xl border border-white/5 bg-slate-950/30 space-y-3 transition-colors hover:bg-slate-950/50">
                      
                      {/* Top Row: User, Action, Timestamp */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{log.user}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${actionColor}`}>
                            {log.action}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                          <Clock size={11} className="text-[#FF8DA1]" />
                          <span>{log.date} {log.time}</span>
                        </div>
                      </div>

                      {/* Detail Section: Value diffs and Targets */}
                      <div className="p-2.5 rounded-lg bg-slate-950/40 text-xs font-mono space-y-1.5 border border-white/5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Target Record:</span>
                          <span className="text-[#FF8DA1] font-bold">{log.targetId}</span>
                        </div>
                        <div className="border-t border-white/5 pt-1.5 text-slate-300 leading-normal break-all">
                          <span className="text-slate-500 mr-1 font-bold">Details:</span>
                          {log.newValue}
                        </div>
                      </div>

                      {/* Client metadata footer */}
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1">
                        <span>IP: {log.ip || "127.0.0.1"}</span>
                        <span className="truncate max-w-xs md:max-w-md">Agent: {log.browser}</span>
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
  );
}
