import React, { useState } from "react";
import { 
  Search, Filter, ChevronRight, AlertTriangle, CheckCircle, Clock, 
  HelpCircle, Download, Plus, X, ArrowUpRight, Video, FileText,
  Archive, RotateCcw, Trash2
} from "lucide-react";
import { Inquiry } from "../lib/supabaseClient";

interface CrmLeadsTableProps {
  inquiries: Inquiry[];
  onSelectInquiry: (inquiry: Inquiry) => void;
  onAddInquiry: (formData: any) => Promise<void>;
  onArchiveInquiry?: (id: string) => Promise<void>;
  onRestoreInquiry?: (id: string) => Promise<void>;
  onSoftDeleteInquiry?: (id: string) => Promise<void>;
  darkMode: boolean;
  isSubmitting: boolean;
}

export default function CrmLeadsTable({
  inquiries,
  onSelectInquiry,
  onAddInquiry,
  onArchiveInquiry,
  onRestoreInquiry,
  onSoftDeleteInquiry,
  darkMode,
  isSubmitting
}: CrmLeadsTableProps) {
  
  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [showOthersOnly, setShowOthersOnly] = useState(false);

  // Soft Delete & Archive Policy filter views
  const [archiveView, setArchiveView] = useState<"ACTIVE" | "ARCHIVED" | "DELETED">("ACTIVE");

  // Advanced CRM Filters
  const [parentNameSearch, setParentNameSearch] = useState("");
  const [assignedCounselorFilter, setAssignedCounselorFilter] = useState("ALL");
  const [admissionStatusFilter, setAdmissionStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // New Inquiry modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    studentName: "",
    parentName: "",
    mobile: "",
    email: "",
    selectedCourse: "Elite Spoken English Mastery",
    otherQuery: "",
    remarks: "",
    priority: "MEDIUM" as const,
    leadSource: "Website"
  });

  // Filter inquiry list
  const filteredInquiries = inquiries.filter((inq) => {
    // 0. Soft Delete & Archive policy checks
    if (archiveView === "ACTIVE") {
      if (inq.isArchived || inq.isDeleted) return false;
    } else if (archiveView === "ARCHIVED") {
      if (!inq.isArchived || inq.isDeleted) return false;
    } else if (archiveView === "DELETED") {
      if (!inq.isDeleted) return false;
    }

    // 1. Search term match (covers Inquiry ID, Student Name, Email, Mobile)
    const matchesSearch = 
      inq.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.mobile.includes(searchTerm);

    // 2. Status filter
    const matchesStatus = statusFilter === "ALL" || inq.status === statusFilter;

    // 3. Priority filter
    const matchesPriority = priorityFilter === "ALL" || inq.priority === priorityFilter;

    // 4. Course filter
    const matchesCourse = courseFilter === "ALL" || inq.selectedCourse === courseFilter;

    // 5. Others format filter (Feature 1 & Feature 2 requirement)
    const matchesOthersOnly = !showOthersOnly || inq.inquiryType === "Others" || inq.selectedCourse === "Others";

    // 6. Parent Name search match
    const matchesParent = !parentNameSearch || (inq.parentName && inq.parentName.toLowerCase().includes(parentNameSearch.toLowerCase()));

    // 7. Assigned Counselor filter
    const matchesCounselor = assignedCounselorFilter === "ALL" || inq.assignedCounselor === assignedCounselorFilter;

    // 8. Admission Status filter
    const matchesAdmissionStatus = admissionStatusFilter === "ALL" || inq.admissionStatus === admissionStatusFilter;

    // 9. Date Range filter
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && inq.createdDate >= startDate;
    }
    if (endDate) {
      matchesDate = matchesDate && inq.createdDate <= endDate;
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesCourse && matchesOthersOnly && matchesParent && matchesCounselor && matchesAdmissionStatus && matchesDate;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddInquiry(addForm);
    setShowAddModal(false);
    setAddForm({
      studentName: "",
      parentName: "",
      mobile: "",
      email: "",
      selectedCourse: "Elite Spoken English Mastery",
      otherQuery: "",
      remarks: "",
      priority: "MEDIUM",
      leadSource: "Website"
    });
  };

  // EXPORT CSV ROUTINE
  const exportToCSV = () => {
    const headers = ["Inquiry ID", "Date", "Time", "Student Name", "Parent Name", "Mobile", "Email", "Course", "Inquiry Type", "Other Query", "Status", "Priority", "Lead Source"];
    const rows = filteredInquiries.map(inq => [
      inq.id,
      inq.createdDate,
      inq.createdTime,
      inq.studentName,
      inq.parentName || "",
      inq.mobile,
      inq.email,
      inq.selectedCourse,
      inq.inquiryType || "General",
      inq.otherQuery || "",
      inq.status,
      inq.priority,
      inq.leadSource
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SSA_Leads_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EXPORT EXCEL TABULAR ROUTINE
  const exportToExcel = () => {
    let html = `<table><thead><tr>
      <th>Inquiry ID</th><th>Date</th><th>Student Name</th><th>Mobile</th><th>Email</th><th>Course</th><th>Status</th><th>Priority</th>
    </tr></thead><tbody>`;
    
    filteredInquiries.forEach(inq => {
      html += `<tr>
        <td>${inq.id}</td>
        <td>${inq.createdDate}</td>
        <td>${inq.studentName}</td>
        <td>${inq.mobile}</td>
        <td>${inq.email}</td>
        <td>${inq.selectedCourse}</td>
        <td>${inq.status}</td>
        <td>${inq.priority}</td>
      </tr>`;
    });
    html += `</tbody></table>`;

    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SSA_Leads_${new Date().toISOString().split("T")[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EXPORT PDF PRINTER REPORT ROUTINE
  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    let rowsHtml = "";
    filteredInquiries.forEach(inq => {
      rowsHtml += `
        <tr style="border-bottom: 1px solid #ddd; font-size: 11px;">
          <td style="padding: 8px; font-family: monospace; font-weight: bold;">${inq.id}</td>
          <td style="padding: 8px;">${inq.createdDate}</td>
          <td style="padding: 8px; font-weight: bold;">${inq.studentName}</td>
          <td style="padding: 8px;">${inq.mobile}</td>
          <td style="padding: 8px;">${inq.selectedCourse}</td>
          <td style="padding: 8px; font-weight: bold;">${inq.status}</td>
          <td style="padding: 8px; font-weight: bold; color: ${inq.priority === "HIGH" ? "red" : "orange"}">${inq.priority}</td>
        </tr>
      `;
    });

    const docHtml = `
      <html>
        <head>
          <title>Shelly Sharma Academy CRM - Leads Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 30px; color: #333; }
            h2 { color: #5a3791; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #5a3791; color: white; padding: 10px; text-align: left; font-size: 12px; }
          </style>
        </head>
        <body>
          <h2>Shelly Sharma Academy CRM — Inquiry Pipeline</h2>
          <p style="text-align: right; font-size: 11px; color: #666;">Generated on: ${new Date().toLocaleString()}</p>
          <p style="font-size: 12px; font-weight: bold;">Filter Criteria: Status(${statusFilter}), Priority(${priorityFilter}), Course(${courseFilter})</p>
          <hr />
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Date</th><th>Student Name</th><th>Mobile</th><th>Course Format</th><th>Status</th><th>Priority</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(docHtml);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4">
      
      {/* Soft Delete & Archive Policy Pipeline Tabs */}
      <div className="flex border-b border-white/5 space-x-6 pb-2 mb-2">
        <button
          onClick={() => setArchiveView("ACTIVE")}
          className={`pb-2 text-xs font-mono font-bold uppercase tracking-wider relative cursor-pointer transition-all ${archiveView === "ACTIVE" ? "text-[#FF8DA1] border-b-2 border-[#FF8DA1] font-extrabold" : "text-slate-400 hover:text-white"}`}
        >
          Active Leads ({inquiries.filter(i => !i.isArchived && !i.isDeleted).length})
        </button>
        <button
          onClick={() => setArchiveView("ARCHIVED")}
          className={`pb-2 text-xs font-mono font-bold uppercase tracking-wider relative cursor-pointer transition-all ${archiveView === "ARCHIVED" ? "text-[#AD56C4] border-b-2 border-[#AD56C4] font-extrabold" : "text-slate-400 hover:text-white"}`}
        >
          Archived Pipeline ({inquiries.filter(i => i.isArchived && !i.isDeleted).length})
        </button>
        <button
          onClick={() => setArchiveView("DELETED")}
          className={`pb-2 text-xs font-mono font-bold uppercase tracking-wider relative cursor-pointer transition-all ${archiveView === "DELETED" ? "text-red-400 border-b-2 border-red-400 font-extrabold" : "text-slate-400 hover:text-white"}`}
        >
          Trash (Soft Deleted) ({inquiries.filter(i => i.isDeleted).length})
        </button>
      </div>

      {/* Search Filter Header */}
      <div className="flex flex-col gap-4 bg-slate-950/20 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
        
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search inquiries by student name, email, mobile, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-900/50 border-slate-800 text-white placeholder-slate-500" : "bg-white border-slate-200 text-slate-800 placeholder-slate-400"}`}
            />
          </div>

          {/* Dropdown Filters and Actions */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`p-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
              >
                <option value="ALL">ALL STATUSES</option>
                <option value="NEW LEAD">NEW LEAD</option>
                <option value="CONTACTED">CONTACTED</option>
                <option value="DEMO SCHEDULED">DEMO SCHEDULED</option>
                <option value="ENROLLED">ENROLLED</option>
                <option value="NO RESPONSE">NO RESPONSE</option>
              </select>
            </div>

            {/* Priority Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Priority</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={`p-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
              >
                <option value="ALL">ALL PRIORITIES</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            {/* Course Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Format</span>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className={`p-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
              >
                <option value="ALL">ALL COURSES</option>
                <option value="Elite Spoken English Mastery">Spoken English Mastery</option>
                <option value="Advanced Grammar clinics">Advanced Grammar clinics</option>
                <option value="IELTS Prep & assessment">IELTS Prep</option>
                <option value="Corporate English training">Corporate English</option>
                <option value="Interview prep workspace">Interview Prep</option>
                <option value="Others">Others</option>
              </select>
            </div>

            {/* Others isolation Toggle (Feature 2) */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/15 p-2 rounded-xl transition-all">
              <input
                type="checkbox"
                checked={showOthersOnly}
                onChange={(e) => setShowOthersOnly(e.target.checked)}
                className="rounded accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wide">Others format only</span>
            </label>

            {/* Advanced Filters Button */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`p-2 border rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${showAdvancedFilters ? "bg-[#AD56C4]/15 border-[#AD56C4] text-white" : "bg-white/5 border-white/10 text-slate-300 hover:text-white"}`}
            >
              <Filter size={14} />
              <span>{showAdvancedFilters ? "Hide Filters" : "More Filters"}</span>
            </button>

            <div className="h-6 w-[1px] bg-white/10 hidden md:block"></div>

            {/* Export and Add Leads Button */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={exportToCSV}
                className="p-2 bg-white/5 hover:bg-[#AD56C4]/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Export CSV Leads"
              >
                <Download size={15} />
              </button>
              <button
                onClick={exportToExcel}
                className="p-2 bg-white/5 hover:bg-[#AD56C4]/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Export Excel Table"
              >
                <FileText size={15} />
              </button>
              <button
                onClick={exportToPDF}
                className="p-2 bg-white/5 hover:bg-[#AD56C4]/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Print PDF Report"
              >
                <ArrowUpRight size={15} />
              </button>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="py-2 px-3 bg-[#AD56C4] hover:bg-[#9c4bb1] text-white text-xs font-bold rounded-xl flex items-center space-x-1 transition-all cursor-pointer shadow-md shadow-[#AD56C4]/10"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Add Inquiry</span>
              </button>
            </div>

          </div>
        </div>

        {/* Collapsible Advanced CRM Filters Panel */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-white/5">
            {/* Parent Name Search */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Parent Name</span>
              <input
                type="text"
                placeholder="Search parent name..."
                value={parentNameSearch}
                onChange={(e) => setParentNameSearch(e.target.value)}
                className={`w-full p-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-900 border-slate-800 text-white placeholder-slate-500" : "bg-white border-slate-200 text-slate-800 placeholder-slate-400"}`}
              />
            </div>

            {/* Assigned Counselor Filter */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Assigned Counselor</span>
              <select
                value={assignedCounselorFilter}
                onChange={(e) => setAssignedCounselorFilter(e.target.value)}
                className={`w-full p-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
              >
                <option value="ALL">ALL COUNSELORS</option>
                <option value="Shelly Sharma">Shelly Sharma</option>
                <option value="System">System</option>
              </select>
            </div>

            {/* Admission Status Filter */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Admission Status</span>
              <select
                value={admissionStatusFilter}
                onChange={(e) => setAdmissionStatusFilter(e.target.value)}
                className={`w-full p-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
              >
                <option value="ALL">ALL STATUSES</option>
                <option value="None">None</option>
                <option value="Admitted">Admitted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Date Range Selection */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Date Range (Created At)</span>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-1/2 p-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-1/2 p-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Main CRM Leads Table Grid */}
      <div className={`overflow-x-auto rounded-2xl border ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"}`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-[10px] font-mono text-slate-400 uppercase tracking-widest bg-slate-950/20">
              <th className="p-4">Inquiry ID</th>
              <th className="p-4">Student Profile</th>
              <th className="p-4">Target Format</th>
              <th className="p-4">Inquiry Date</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Assigned Counselor</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {filteredInquiries.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                  No registered inquiries found matching this criteria.
                </td>
              </tr>
            ) : (
              filteredInquiries.map((inq) => (
                <tr 
                  key={inq.id}
                  onClick={() => onSelectInquiry(inq)}
                  className={`hover:bg-[#AD56C4]/5 transition-all duration-200 cursor-pointer ${inq.priority === "HIGH" && inq.status === "NEW LEAD" ? "bg-red-500/5 hover:bg-red-500/10" : ""}`}
                >
                  {/* Inquiry ID */}
                  <td className="p-4 font-mono font-bold text-[#FF8DA1]">
                    {inq.id}
                  </td>
                  
                  {/* Student Profile */}
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{inq.studentName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{inq.mobile}</span>
                    </div>
                  </td>
                  
                  {/* Target Format */}
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-[#E2DBEA]">{inq.selectedCourse}</span>
                      <span className="text-[9px] font-mono text-slate-400">Source: {inq.leadSource}</span>
                    </div>
                  </td>
                  
                  {/* Inquiry Date */}
                  <td className="p-4 text-slate-300">
                    <div className="flex flex-col">
                      <span>{inq.createdDate}</span>
                      <span className="text-[9px] font-mono text-slate-500">{inq.createdTime}</span>
                    </div>
                  </td>
                  
                  {/* Priority */}
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      inq.priority === "HIGH" 
                        ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                        : inq.priority === "MEDIUM"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}>
                      {inq.priority}
                    </span>
                  </td>
                  
                  {/* Counselor */}
                  <td className="p-4 text-slate-300 font-medium">
                    {inq.assignedCounselor || "Shelly Sharma"}
                  </td>
                  
                  {/* Status */}
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      inq.status === "ENROLLED" || inq.admissionStatus === "Admitted"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : inq.status === "NEW LEAD"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : inq.status === "DEMO SCHEDULED"
                            ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {inq.status === "ENROLLED" || inq.admissionStatus === "Admitted" ? "Admitted 🎓" : inq.status}
                    </span>
                  </td>
                  
                  {/* Action link */}
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* Active Actions */}
                      {!inq.isArchived && !inq.isDeleted && (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onArchiveInquiry) onArchiveInquiry(inq.id);
                            }}
                            title="Archive Inquiry"
                            className="p-1.5 rounded-lg hover:bg-[#AD56C4]/15 text-[#AD56C4] hover:scale-105 transition-all cursor-pointer"
                          >
                            <Archive size={14} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSoftDeleteInquiry) onSoftDeleteInquiry(inq.id);
                            }}
                            title="Soft Delete Inquiry"
                            className="p-1.5 rounded-lg hover:bg-red-500/15 text-red-400 hover:scale-105 transition-all cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}

                      {/* Archived Actions */}
                      {inq.isArchived && !inq.isDeleted && (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onRestoreInquiry) onRestoreInquiry(inq.id);
                            }}
                            title="Restore Inquiry"
                            className="p-1.5 rounded-lg hover:bg-[#FF8DA1]/15 text-[#FF8DA1] hover:scale-105 transition-all cursor-pointer"
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSoftDeleteInquiry) onSoftDeleteInquiry(inq.id);
                            }}
                            title="Soft Delete Inquiry"
                            className="p-1.5 rounded-lg hover:bg-red-500/15 text-red-400 hover:scale-105 transition-all cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}

                      {/* Deleted Actions */}
                      {inq.isDeleted && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onRestoreInquiry) onRestoreInquiry(inq.id);
                          }}
                          title="Restore Inquiry"
                          className="p-1.5 rounded-lg hover:bg-emerald-500/15 text-emerald-400 hover:scale-105 transition-all cursor-pointer"
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectInquiry(inq);
                        }}
                        title="View Details"
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* NEW INQUIRY DIALOG MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl relative space-y-4 ${darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}>
            <div className="flex items-center justify-between border-b border-slate-800/20 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Plus size={16} className="text-[#AD56C4]" />
                <span>Register Direct Student Inquiry</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={addForm.studentName}
                    onChange={(e) => setAddForm({ ...addForm, studentName: e.target.value })}
                    placeholder="e.g. Aradhya Goel"
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Parent Name</label>
                  <input
                    type="text"
                    value={addForm.parentName}
                    onChange={(e) => setAddForm({ ...addForm, parentName: e.target.value })}
                    placeholder="e.g. Mukesh Goel"
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={addForm.mobile}
                    onChange={(e) => setAddForm({ ...addForm, mobile: e.target.value })}
                    placeholder="e.g. +91 9812345678"
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="e.g. aradhya@gmail.com"
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Selected Course Format</label>
                  <select
                    value={addForm.selectedCourse}
                    onChange={(e) => setAddForm({ ...addForm, selectedCourse: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                  >
                    <option value="Elite Spoken English Mastery">Elite Spoken English Mastery</option>
                    <option value="Advanced Grammar clinics">Advanced Grammar clinics</option>
                    <option value="IELTS Prep & assessment">IELTS Prep & assessment</option>
                    <option value="Corporate English training">Corporate English training</option>
                    <option value="Interview prep workspace">Interview prep workspace</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Acquisition Source</label>
                  <select
                    value={addForm.leadSource}
                    onChange={(e) => setAddForm({ ...addForm, leadSource: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                  >
                    <option value="Website">Website Submission</option>
                    <option value="WhatsApp">Direct WhatsApp Chat</option>
                    <option value="Google">Google Search Page</option>
                    <option value="Referral">Student Referral</option>
                    <option value="Instagram">Instagram Campaign</option>
                  </select>
                </div>
              </div>

              {/* Others Dynamic Textarea required (Feature 2 Requirement) */}
              {addForm.selectedCourse === "Others" && (
                <div>
                  <label className="block text-amber-400 mb-1 font-mono uppercase text-[9px] font-bold">What would you like to discuss? (Required for Others)*</label>
                  <textarea
                    required
                    minLength={10}
                    maxLength={1000}
                    rows={2}
                    value={addForm.otherQuery}
                    onChange={(e) => setAddForm({ ...addForm, otherQuery: e.target.value })}
                    placeholder="Please describe your query, requirement or message..."
                    className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">Additional Remarks / Notes</label>
                <textarea
                  rows={2}
                  value={addForm.remarks}
                  onChange={(e) => setAddForm({ ...addForm, remarks: e.target.value })}
                  placeholder="Class timing availability, current level assessment, language goal..."
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#AD56C4] ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`py-2 px-4 rounded-xl font-semibold ${darkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-5 bg-[#AD56C4] hover:bg-[#9c4bb1] text-white font-bold rounded-xl flex items-center space-x-1"
                >
                  {isSubmitting ? "Creating..." : "Register Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
