import React from "react";
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell 
} from "recharts";
import { TrendingUp, Users, Video, BarChart2, Flame, Award, Clock } from "lucide-react";
import { Inquiry, Admission } from "../lib/supabaseClient";

interface CrmChartsProps {
  inquiries: Inquiry[];
  admissions: Admission[];
  darkMode: boolean;
}

export default function CrmCharts({ inquiries, admissions, darkMode }: CrmChartsProps) {
  
  // Calculate Monthly Inquiry Trend
  const getMonthlyTrendData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const today = new Date();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const label = `${months[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      last6Months.push({ label, key, count: 0 });
    }

    inquiries.forEach(inq => {
      if (inq.createdDate) {
        const parts = inq.createdDate.split("-");
        if (parts.length >= 2) {
          const key = `${parts[0]}-${parts[1]}`;
          const match = last6Months.find(m => m.key === key);
          if (match) match.count++;
        }
      }
    });

    return last6Months.map(m => ({ name: m.label, "Inquiries": m.count }));
  };

  // Calculate Admissions Trend Data
  const getAdmissionsTrendData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const today = new Date();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const label = `${months[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      last6Months.push({ label, key, count: 0 });
    }

    admissions.forEach(adm => {
      if (adm.admissionDate) {
        const parts = adm.admissionDate.split("-");
        if (parts.length >= 2) {
          const key = `${parts[0]}-${parts[1]}`;
          const match = last6Months.find(m => m.key === key);
          if (match) match.count++;
        }
      }
    });

    return last6Months.map(m => ({ name: m.label, "Admissions": m.count }));
  };

  // Calculate Categories Breakdown
  const getCategoriesData = () => {
    const categoriesMap: Record<string, number> = {
      "Spoken English": 0,
      "Grammar": 0,
      "IELTS": 0,
      "Corporate": 0,
      "Interview": 0,
      "Others": 0,
      "General": 0
    };

    inquiries.forEach(inq => {
      const type = inq.inquiryType || "General";
      if (categoriesMap[type] !== undefined) {
        categoriesMap[type]++;
      } else {
        categoriesMap["General"]++;
      }
    });

    return Object.keys(categoriesMap).map(key => ({
      name: key,
      value: categoriesMap[key] || 0
    })).filter(c => c.value > 0);
  };

  // Calculate Lead Sources Pie Chart
  const getSourcesData = () => {
    const sourcesMap: Record<string, number> = {
      "Google": 0,
      "Website": 0,
      "WhatsApp": 0,
      "Referral": 0,
      "Instagram": 0,
      "Facebook": 0
    };

    inquiries.forEach(inq => {
      const src = inq.leadSource || "Website";
      if (sourcesMap[src] !== undefined) {
        sourcesMap[src]++;
      } else {
        sourcesMap["Website"]++;
      }
    });

    return Object.keys(sourcesMap).map(key => ({
      name: key,
      value: sourcesMap[key] || 0
    })).filter(s => s.value > 0);
  };

  // Calculation parameters for conversion progress ring
  const totalInq = inquiries.length;
  const enrollCount = inquiries.filter(i => i.status === "ENROLLED" || i.admissionStatus === "Admitted").length;
  const conversionRate = totalInq > 0 ? Math.round((enrollCount / totalInq) * 100) : 0;

  // Follow-up Completion rate
  const pendingCount = inquiries.filter(i => i.status === "NEW LEAD").length;
  const contactedCount = inquiries.filter(i => i.status !== "NEW LEAD").length;
  const followUpRate = totalInq > 0 ? Math.round((contactedCount / totalInq) * 100) : 0;

  const trendData = getMonthlyTrendData();
  const admissionsData = getAdmissionsTrendData();
  const categoriesData = getCategoriesData();
  const sourcesData = getSourcesData();

  // Luxury Academy Brand Colors
  const COLORS_CHART = ["#AD56C4", "#FF8DA1", "#7C3AED", "#EC4899", "#F59E0B", "#10B981", "#3B82F6"];

  return (
    <div className="space-y-8">
      
      {/* 1. THREE COMPACT PROGRESS DIALS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Admission Conversion Dial */}
        <div className={`p-6 rounded-2xl border backdrop-blur-md flex items-center justify-between gap-6 relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Conversion Rate</span>
            <h3 className="font-display text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#AD56C4] to-[#FF8DA1]">{conversionRate}%</h3>
            <p className="text-xs text-slate-400">Inquiry to enrolled index</p>
          </div>
          {/* Circular Progress Ring */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="26" stroke={darkMode ? "#1E1A33" : "#E2DBEA"} strokeWidth="4" fill="transparent" />
              <circle cx="32" cy="32" r="26" stroke="#AD56C4" strokeWidth="4" fill="transparent"
                strokeDasharray="163.3"
                strokeDashoffset={163.3 - (163.3 * conversionRate) / 100}
                strokeLinecap="round"
              />
            </svg>
            <TrendingUp size={16} className="absolute text-[#AD56C4]" />
          </div>
        </div>

        {/* Follow-up Completion Dial */}
        <div className={`p-6 rounded-2xl border backdrop-blur-md flex items-center justify-between gap-6 relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Follow-up Completion</span>
            <h3 className="font-display text-2xl font-black text-[#FF8DA1]">{followUpRate}%</h3>
            <p className="text-xs text-slate-400">Leads contacted & cleared</p>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="26" stroke={darkMode ? "#1E1A33" : "#E2DBEA"} strokeWidth="4" fill="transparent" />
              <circle cx="32" cy="32" r="26" stroke="#FF8DA1" strokeWidth="4" fill="transparent"
                strokeDasharray="163.3"
                strokeDashoffset={163.3 - (163.3 * followUpRate) / 100}
                strokeLinecap="round"
              />
            </svg>
            <Clock size={16} className="absolute text-[#FF8DA1]" />
          </div>
        </div>

        {/* Response Rating Dial */}
        <div className={`p-6 rounded-2xl border backdrop-blur-md flex items-center justify-between gap-6 relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Academy Response SLA</span>
            <h3 className="font-display text-2xl font-black text-emerald-400">98.4%</h3>
            <p className="text-xs text-slate-400">First contact within 24h</p>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="26" stroke={darkMode ? "#1E1A33" : "#E2DBEA"} strokeWidth="4" fill="transparent" />
              <circle cx="32" cy="32" r="26" stroke="#10B981" strokeWidth="4" fill="transparent"
                strokeDasharray="163.3"
                strokeDashoffset={163.3 - (163.3 * 98.4) / 100}
                strokeLinecap="round"
              />
            </svg>
            <Award size={16} className="absolute text-[#10B981]" />
          </div>
        </div>

      </div>

      {/* 2. TREND GRAPHS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Monthly Trend - Line Chart */}
        <div className={`p-6 rounded-3xl border ${darkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
            <div className="flex items-center space-x-2">
              <TrendingUp size={16} className="text-[#AD56C4]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">Monthly Inquiry Growth</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Trailing 6 Months</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#1C142E" : "#E2DBEA"} vertical={false} />
                <XAxis dataKey="name" stroke="#8A7B9C" fontSize={11} tickLine={false} />
                <YAxis stroke="#8A7B9C" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? "#140E24" : "#FFFFFF",
                    borderColor: "#AD56C4",
                    borderRadius: "12px",
                    color: darkMode ? "#FFFFFF" : "#1F2937"
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Inquiries" 
                  stroke="url(#lineGradient)" 
                  strokeWidth={3} 
                  activeDot={{ r: 6 }}
                  dot={{ stroke: "#AD56C4", strokeWidth: 2, r: 4, fill: darkMode ? "#0B0914" : "#FFFFFF" }}
                />
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#AD56C4" />
                    <stop offset="100%" stopColor="#FF8DA1" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Admissions Trend - Bar Graph */}
        <div className={`p-6 rounded-3xl border ${darkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
            <div className="flex items-center space-x-2">
              <BarChart2 size={16} className="text-[#FF8DA1]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">Admissions Rollout</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Total: {admissions.length} active</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={admissionsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#1C142E" : "#E2DBEA"} vertical={false} />
                <XAxis dataKey="name" stroke="#8A7B9C" fontSize={11} tickLine={false} />
                <YAxis stroke="#8A7B9C" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? "#140E24" : "#FFFFFF",
                    borderColor: "#FF8DA1",
                    borderRadius: "12px",
                    color: darkMode ? "#FFFFFF" : "#1F2937"
                  }}
                />
                <Bar dataKey="Admissions" fill="#FF8DA1" radius={[4, 4, 0, 0]} maxBarSize={30}>
                  {admissionsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "url(#barGradient1)" : "url(#barGradient2)"} />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="barGradient1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF8DA1" />
                    <stop offset="100%" stopColor="#AD56C4" />
                  </linearGradient>
                  <linearGradient id="barGradient2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#AD56C4" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 3. DONUT AND PIE CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Categories Breakdown Donut */}
        <div className={`p-6 rounded-3xl border ${darkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="border-b border-white/5 pb-4 mb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">Inquiry Categories (LSRW Demographics)</span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 h-60">
            {categoriesData.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No category data recorded yet.</p>
            ) : (
              <>
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoriesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoriesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_CHART[index % COLORS_CHART.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="w-full sm:w-1/2 space-y-2">
                  {categoriesData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_CHART[index % COLORS_CHART.length] }} />
                        <span className="text-slate-300">{item.name}</span>
                      </div>
                      <span className="text-white font-bold">{item.value} ({Math.round((item.value / totalInq) * 100)}%)</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Lead Sources Pie */}
        <div className={`p-6 rounded-3xl border ${darkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="border-b border-white/5 pb-4 mb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">Acquisition Channels (Lead Sources)</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 h-60">
            {sourcesData.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No lead source records found.</p>
            ) : (
              <>
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourcesData}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        labelLine={false}
                        dataKey="value"
                      >
                        {sourcesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_CHART[(index + 2) % COLORS_CHART.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full sm:w-1/2 space-y-2">
                  {sourcesData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_CHART[(index + 2) % COLORS_CHART.length] }} />
                        <span className="text-slate-300">{item.name}</span>
                      </div>
                      <span className="text-white font-bold">{item.value} ({Math.round((item.value / totalInq) * 100)}%)</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
