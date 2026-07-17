import React, { useState } from "react";
import { Sparkles, Calendar, Bell, Shield, CheckCircle, Clock, Info, AlertTriangle, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface GoodMorningBannerProps {
  userName: string;
  userRole: string;
  userEmail: string;
  pendingFollowUps: number;
  todayDemosCount: number;
  admissionsCount: number;
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    time: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
  }>;
  darkMode: boolean;
  onClearNotifications: () => void;
}

export default function GoodMorningBanner({
  userName,
  userRole,
  userEmail,
  pendingFollowUps,
  todayDemosCount,
  admissionsCount,
  notifications,
  darkMode,
  onClearNotifications
}: GoodMorningBannerProps) {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Dynamic greeting based on current local time
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning, Shelly 🌸";
    if (hr < 17) return "Good Afternoon, Shelly 🌸";
    return "Good Evening, Shelly 🌸";
  };

  // Formatted date string
  const getFormattedDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="relative rounded-3xl overflow-hidden p-8 border border-[#AD56C4]/25 shadow-xl shadow-[#AD56C4]/5 backdrop-blur-xl bg-gradient-to-br from-[#1C1430]/90 via-[#130B24]/95 to-[#090514]/98">
      {/* Visual background lights representing Lavender & Rose Pink theme */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#AD56C4]/15 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-[#FF8DA1]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-[#FF8DA1]/5 rounded-full blur-2xl"></div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Title, Greeting, and Summary */}
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#FF8DA1] uppercase bg-[#FF8DA1]/10 px-3 py-1 rounded-full w-fit">
            <Sparkles size={12} className="animate-pulse" />
            <span>Shelly Sharma Academy CRM</span>
          </div>

          <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
            {getGreeting()}
          </h2>

          <p className="text-[#E2DBEA] text-sm md:text-base font-normal leading-relaxed">
            Welcome to your executive dashboard. All core integrations are active. 
            Today, you have <strong className="text-[#FF8DA1] font-bold">{pendingFollowUps} Follow-ups</strong> to address, 
            and <strong className="text-[#AD56C4] font-bold">{todayDemosCount} Demo Consultations</strong> scheduled.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#A79CB7] pt-2">
            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <Calendar size={14} className="text-[#FF8DA1]" />
              <span>{getFormattedDate()}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              <Shield size={14} className="text-[#AD56C4]" />
              <span>Role: <strong className="text-white font-bold">{userRole}</strong></span>
            </div>
          </div>
        </div>

        {/* Dynamic Focus Desk Card & Notification Center */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-end relative">
          
          {/* Today's Focus Widget */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2 text-left w-full md:w-64">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#A79CB7]">
              🌸 Today's Focus Desk
            </div>
            <div className="space-y-1.5 text-xs text-[#E2DBEA]">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${pendingFollowUps > 0 ? "bg-amber-400" : "bg-green-400"}`} />
                <span>{pendingFollowUps > 0 ? `${pendingFollowUps} Follow-ups Pending` : "Follow-ups Cleared! 🎉"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-400" />
                <span>{todayDemosCount} Demo classes scheduled</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span>{admissionsCount} Admissions registered</span>
              </div>
            </div>
          </div>

          {/* Luxury Animated Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="p-3.5 rounded-2xl bg-white/5 hover:bg-[#AD56C4]/15 border border-white/10 hover:border-[#AD56C4]/30 transition-all duration-300 relative text-white hover:text-[#FF8DA1] cursor-pointer"
            >
              <Bell size={20} className={notifications.length > 0 ? "animate-bounce" : ""} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-tr from-[#AD56C4] to-[#FF8DA1] text-white text-[10px] font-mono font-bold flex items-center justify-center rounded-full border border-slate-900 shadow-md">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown Container */}
            <AnimatePresence>
              {showNotifDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-80 rounded-2xl border border-[#AD56C4]/20 shadow-2xl bg-[#140E24] backdrop-blur-xl z-50 overflow-hidden text-left"
                >
                  <div className="p-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#1E1235] to-[#130922]">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Smart Notifications</span>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => {
                          onClearNotifications();
                          setShowNotifDropdown(false);
                        }}
                        className="text-[10px] font-mono text-[#FF8DA1] hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#A79CB7] space-y-2">
                        <CheckCircle size={24} className="text-green-400 mx-auto" />
                        <p>Inbox clean! No new reminders.</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className="p-3.5 hover:bg-white/5 transition-colors space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono font-semibold uppercase text-[#FF8DA1] flex items-center gap-1">
                              {notif.type === "HIGH_PRIORITY" && <AlertTriangle size={10} className="text-red-400" />}
                              {notif.type === "NEW_LEAD" && <Sparkles size={10} className="text-yellow-400" />}
                              {notif.type === "ADMISSION" && <UserCheck size={10} className="text-green-400" />}
                              {notif.title}
                            </span>
                            <span className="text-[9px] font-mono text-[#A79CB7]">{notif.time}</span>
                          </div>
                          <p className="text-xs text-[#E2DBEA] leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
