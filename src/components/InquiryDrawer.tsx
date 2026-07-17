import React, { useState } from "react";
import { 
  X, Check, Clock, User, Phone, Mail, BookOpen, Layers, Info, History, 
  Plus, Calendar, Shield, CreditCard, ChevronRight, UserCheck, Award
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Inquiry, Admission } from "../lib/supabaseClient";

interface InquiryDrawerProps {
  inquiry: Inquiry | null;
  onClose: () => void;
  onUpdateInquiry: (id: string, updatedFields: Partial<Inquiry>, comment: string) => Promise<void>;
  onRegisterAdmission: (inquiryId: string, fee: number, payMode: "Cash" | "UPI" | "Bank Transfer" | "Card", remarks: string) => Promise<void>;
  darkMode: boolean;
  isSubmitting: boolean;
}

export default function InquiryDrawer({
  inquiry,
  onClose,
  onUpdateInquiry,
  onRegisterAdmission,
  darkMode,
  isSubmitting
}: InquiryDrawerProps) {
  
  const [activeSubTab, setActiveSubTab] = useState<"DETAILS" | "ENROLL">("DETAILS");
  
  // Follow up state
  const [newStatus, setNewStatus] = useState<string>("");
  const [newPriority, setNewPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("LOW");
  const [assignedCounselor, setAssignedCounselor] = useState<string>("");
  const [followUpComment, setFollowUpComment] = useState<string>("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>("");
  const [nextFollowUpComment, setNextFollowUpComment] = useState<string>("");

  // Enrollment form state
  const [enrollFee, setEnrollFee] = useState<number>(15000);
  const [enrollPayMode, setEnrollPayMode] = useState<"Cash" | "UPI" | "Bank Transfer" | "Card">("UPI");
  const [enrollRemarks, setEnrollRemarks] = useState<string>("Enrolled in Batch Alpha (Evening).");

  // Sync state with selected inquiry on load
  React.useEffect(() => {
    if (inquiry) {
      setNewStatus(inquiry.status);
      setNewPriority(inquiry.priority);
      setAssignedCounselor(inquiry.assignedCounselor || "Shelly Sharma");
      setFollowUpComment("");
      setNextFollowUpDate(inquiry.nextFollowUpDate || "");
      setNextFollowUpComment(inquiry.nextFollowUpComment || "");
      setActiveSubTab("DETAILS");
    }
  }, [inquiry]);

  if (!inquiry) return null;

  const handleLogFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const updateData: Partial<Inquiry> = {
      status: newStatus as any,
      priority: newPriority,
      assignedCounselor,
      remarks: followUpComment || inquiry.remarks
    };

    if (nextFollowUpDate) {
      updateData.nextFollowUpDate = nextFollowUpDate;
      updateData.nextFollowUpComment = nextFollowUpComment;
    }

    // Build timeline log text
    let logText = `Updated status to ${newStatus} with ${newPriority} priority. Assigned to ${assignedCounselor}.`;
    if (followUpComment) logText += ` Remarks: ${followUpComment}`;
    if (nextFollowUpDate) logText += ` Scheduled next follow-up on ${nextFollowUpDate}.`;

    await onUpdateInquiry(inquiry.id, updateData, logText);
    setFollowUpComment("");
  };

  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRegisterAdmission(inquiry.id, enrollFee, enrollPayMode, enrollRemarks);
    setActiveSubTab("DETAILS");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Background overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Drawer content box */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={`relative w-full max-w-lg h-full shadow-2xl flex flex-col z-10 border-l border-[#AD56C4]/15 ${darkMode ? "bg-[#0F0A1F]/95 backdrop-blur-md text-white" : "bg-white text-slate-800"}`}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#180F2E] to-[#0E071F]">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#FF8DA1] bg-[#FF8DA1]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {inquiry.id}
            </span>
            <h2 className="font-display text-xl font-black mt-1.5 leading-none">
              {inquiry.studentName}
            </h2>
            <p className="text-xs text-slate-400 mt-1">{inquiry.selectedCourse}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/5 bg-slate-950/20 p-1">
          <button
            onClick={() => setActiveSubTab("DETAILS")}
            className={`flex-1 py-3 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer ${activeSubTab === "DETAILS" ? "bg-[#AD56C4]/15 text-[#FF8DA1] shadow-inner" : "text-slate-400 hover:text-slate-200"}`}
          >
            📋 Profile & Logs
          </button>
          <button
            disabled={inquiry.status === "ENROLLED" || inquiry.admissionStatus === "Admitted"}
            onClick={() => setActiveSubTab("ENROLL")}
            className={`flex-1 py-3 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              inquiry.status === "ENROLLED" || inquiry.admissionStatus === "Admitted"
                ? "opacity-40 cursor-not-allowed text-slate-500"
                : activeSubTab === "ENROLL"
                  ? "bg-gradient-to-r from-[#AD56C4]/20 to-[#FF8DA1]/20 text-[#FF8DA1]"
                  : "text-slate-400 hover:text-[#FF8DA1]"
            }`}
          >
            <UserCheck size={13} />
            <span>Admit / Enroll Student</span>
          </button>
        </div>

        {/* Scrollable area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence mode="wait">
            {activeSubTab === "DETAILS" ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* 1. BASIC STUDENT INFOCARD */}
                <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-400 block font-mono uppercase text-[9px] tracking-wider">Parent Name</span>
                      <strong className="text-white font-semibold">{inquiry.parentName || "Not Provided"}</strong>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 block font-mono uppercase text-[9px] tracking-wider">Mobile Number</span>
                      <a href={`tel:${inquiry.mobile}`} className="text-[#FF8DA1] font-semibold hover:underline flex items-center gap-1">
                        <Phone size={10} />
                        <span>{inquiry.mobile}</span>
                      </a>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 block font-mono uppercase text-[9px] tracking-wider">Email Address</span>
                      <a href={`mailto:${inquiry.email}`} className="text-[#AD56C4] font-semibold hover:underline flex items-center gap-1 break-all">
                        <Mail size={10} />
                        <span>{inquiry.email}</span>
                      </a>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 block font-mono uppercase text-[9px] tracking-wider">Acquisition Channel</span>
                      <strong className="text-emerald-400 font-semibold">{inquiry.leadSource || "Website"}</strong>
                    </div>
                  </div>
                  
                  {inquiry.inquiryType === "Others" && (
                    <div className="mt-4 pt-3 border-t border-white/5 space-y-1">
                      <span className="text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider block">Custom B2B / Other Query:</span>
                      <p className="text-xs text-white bg-amber-500/10 p-3 rounded-xl border border-amber-500/15 leading-relaxed">
                        {inquiry.otherQuery || inquiry.remarks}
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. INTERACTIVE FOLLOW-UP LOGGER FORM */}
                <form onSubmit={handleLogFollowUpSubmit} className="space-y-4">
                  <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Layers size={12} className="text-[#AD56C4]" />
                    <span>Log Counselor Call & Update status</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 text-[10px] font-mono uppercase block mb-1">Lead Status</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                      >
                        <option value="NEW LEAD">NEW LEAD</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="DEMO SCHEDULED">DEMO SCHEDULED</option>
                        <option value="ENROLLED">ENROLLED</option>
                        <option value="NO RESPONSE">NO RESPONSE</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 text-[10px] font-mono uppercase block mb-1">Priority Index</label>
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as any)}
                        className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                      >
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-[10px] font-mono uppercase block mb-1">Assigned Counselor</label>
                    <select
                      value={assignedCounselor}
                      onChange={(e) => setAssignedCounselor(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                    >
                      <option value="Shelly Sharma">Shelly Sharma</option>
                      <option value="Counselor Team">Counselor Team</option>
                      <option value="Support Desk">Support Desk</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 text-[10px] font-mono uppercase block mb-1">Next Follow-up Date</label>
                      <input
                        type="date"
                        value={nextFollowUpDate}
                        onChange={(e) => setNextFollowUpDate(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[10px] font-mono uppercase block mb-1">Follow-up Objective</label>
                      <input
                        type="text"
                        value={nextFollowUpComment}
                        placeholder="e.g. Call to confirm attendance"
                        onChange={(e) => setNextFollowUpComment(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-[10px] font-mono uppercase block mb-1">Add Counselor Comment (Timeline Log)</label>
                    <textarea
                      rows={2}
                      value={followUpComment}
                      onChange={(e) => setFollowUpComment(e.target.value)}
                      placeholder="Add remarks about your last conversation or details discussed..."
                      className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#AD56C4] hover:bg-[#9c4bb1] text-white text-xs font-mono font-bold uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Clock className="animate-spin" size={14} />
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Update Inquiry & Save call log</span>
                      </>
                    )}
                  </button>
                </form>

                {/* 3. HISTORIC ACTIVITY TIMELINE */}
                <div className="space-y-4">
                  <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 border-t border-white/5 pt-4">
                    <History size={12} className="text-[#FF8DA1]" />
                    <span>Inquiry Audit History (Activity Timeline)</span>
                  </div>

                  <div className="space-y-4 pl-2 relative border-l border-white/5 ml-2.5 pt-1">
                    {inquiry.timeline && inquiry.timeline.map((item, index) => (
                      <div key={item.id || index} className="relative pl-6 space-y-1">
                        {/* Timeline node */}
                        <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-[#FF8DA1] border border-slate-900" />
                        
                        <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                          <span>{item.date} {item.time}</span>
                          <span className="bg-[#AD56C4]/15 text-[#AD56C4] px-1.5 py-0.5 rounded uppercase font-bold text-[8px]">{item.status}</span>
                        </div>
                        <p className="text-xs text-[#E2DBEA] leading-relaxed">
                          {item.comments}
                        </p>
                        <p className="text-[9px] text-[#A79CB7] italic font-mono">
                          Updated By: {item.updatedBy}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="enroll"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-5"
              >
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#AD56C4]/10 to-[#FF8DA1]/10 border border-[#AD56C4]/15 space-y-1 text-center">
                  <Award size={28} className="text-[#FF8DA1] mx-auto animate-pulse" />
                  <h4 className="font-display text-base font-black text-white">Enrollment Register Form</h4>
                  <p className="text-xs text-[#E2DBEA]">Admitting student into their respective academic track.</p>
                </div>

                <form onSubmit={handleAdmissionSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-400 text-[10px] font-mono uppercase block mb-1">Enrolling Course Track</label>
                    <input
                      type="text"
                      disabled
                      value={inquiry.selectedCourse}
                      className="w-full p-2.5 rounded-xl border border-white/5 bg-white/5 text-[#E2DBEA] cursor-not-allowed font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-[10px] font-mono uppercase block mb-1">Inquiry ID Referrer Reference</label>
                    <input
                      type="text"
                      disabled
                      value={inquiry.id}
                      className="w-full p-2.5 rounded-xl border border-white/5 bg-white/5 text-slate-400 cursor-not-allowed font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 text-[10px] font-mono uppercase block mb-1">Tuition Fee Amount (INR)</label>
                      <input
                        type="number"
                        required
                        value={enrollFee}
                        onChange={(e) => setEnrollFee(Number(e.target.value))}
                        className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[10px] font-mono uppercase block mb-1">Payment Mode Selection</label>
                      <select
                        value={enrollPayMode}
                        onChange={(e) => setEnrollPayMode(e.target.value as any)}
                        className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                      >
                        <option value="UPI">UPI (GPay / PhonePe)</option>
                        <option value="Cash">Cash Handover</option>
                        <option value="Bank Transfer">Bank NEFT/IMPS</option>
                        <option value="Card">Credit/Debit Card</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-[10px] font-mono uppercase block mb-1">Receipt & Enrollment Comments</label>
                    <textarea
                      rows={3}
                      required
                      value={enrollRemarks}
                      onChange={(e) => setEnrollRemarks(e.target.value)}
                      placeholder="Add registration batch name, payment transaction ID, class days, or curriculum customized targets..."
                      className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/15 text-xs text-[#E2DBEA] space-y-2 font-sans">
                    <p className="font-mono font-bold text-amber-400 text-[10px] uppercase">⚠️ IMPORTANT RECONCILIATION NOTICE</p>
                    <p>Admitting this student will permanently link their original inquiry reference and auto-generate a sequential **Student ID** (e.g. `SSA-STU-260002`). This record will mirror straight into Google Sheets CRM.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#AD56C4] to-[#FF8DA1] hover:opacity-90 text-white text-xs font-mono font-bold uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
                  >
                    {isSubmitting ? (
                      <Clock className="animate-spin" size={14} />
                    ) : (
                      <>
                        <UserCheck size={14} />
                        <span>Register Admission & Sync Mirror</span>
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
