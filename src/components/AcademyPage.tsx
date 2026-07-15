import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Clock, CheckCircle, Info, ArrowRight } from "lucide-react";
import { courses } from "../data";
import Breadcrumbs from "./Breadcrumbs";

interface AcademyPageProps {
  onHomeClick: () => void;
  onEnrollClick: (courseTitle: string) => void;
  onNavigateToPage?: (page: string) => void;
}

type TabType = "all" | "spoken" | "academic" | "professional";

export default function AcademyPage({ onHomeClick, onEnrollClick, onNavigateToPage }: AcademyPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const filteredCourses = courses.filter((course) => {
    if (activeTab === "all") return true;
    return course.category === activeTab;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-7xl mx-auto px-6 lg:px-12 py-12"
    >
      <Breadcrumbs items={[{ label: "Academy Courses" }]} onHomeClick={onHomeClick} />

      {/* Hero Header following the Global Website Rule */}
      <div className="max-w-3xl space-y-6 mb-16 text-left">
        
        {/* 1. Small Label */}
        <div className="inline-flex items-center space-x-2 bg-white/90 border border-[#AD56C4]/15 px-4 py-1.5 rounded-full text-[10px] font-mono font-bold text-[#AD56C4] shadow-sm tracking-wider uppercase">
          <Sparkles size={11} className="text-[#FF8DA1]" />
          <span>Chapter IV — The Curriculum Model</span>
        </div>

        {/* 2. Emotional Page Title */}
        <div className="space-y-3">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#23152B] leading-none">
            Structured English Cohorts & Private Coaching
          </h1>
        </div>

        {/* 3. Inspirational Quote */}
        <blockquote className="text-sm sm:text-base text-[#23152B]/90 leading-relaxed font-serif italic border-l-3 border-[#FF8DA1] pl-6 py-1">
          "True communication is not a passive receipt of information; it is an active architecture of voice and intellect."
        </blockquote>

        {/* 4. Short Story Introduction */}
        <div className="space-y-4 text-xs sm:text-sm text-[#23152B]/75 leading-relaxed font-sans max-w-2xl">
          <p>
            The digital classroom should never be a place of sterile screen-sharing and monotone slides. In our academy, every batch is strictly capped to 8 minds to ensure that pronunciation, speech pacing, and syntactic precision are treated with the authentic rigor of private convent boarding schools.
          </p>
        </div>
      </div>

      {/* 5. Signature Visual (Prestige Global Academy Globe & Lectern Visual) */}
      <div className="mb-16">
        <div className="relative max-w-4xl mx-auto bg-gradient-to-br from-[#23152B] to-[#1F0F26] rounded-[32px] p-8 overflow-hidden border border-[#AD56C4]/20 shadow-xl text-center md:text-left">
          {/* Decorative background glows */}
          <div className="absolute top-[-50%] right-[-10%] w-80 h-80 bg-[#AD56C4]/15 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-[-50%] left-[-10%] w-80 h-80 bg-[#FF8DA1]/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* SVG Digital Globe Emblem */}
            <div className="md:col-span-3 flex justify-center">
              <div className="relative w-28 h-28 bg-[#FAF7F2] rounded-full border-2 border-[#FF8DA1]/30 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-500">
                <div className="absolute inset-2 rounded-full border border-dashed border-[#AD56C4]/30" />
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-[#23152B]">
                  {/* Digital Globe / Network Lectern */}
                  <circle cx="12" cy="12" r="10" className="stroke-[#AD56C4]" strokeWidth="1.5" />
                  <path d="M2 12h20" className="stroke-[#FF8DA1]" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" className="stroke-[#AD56C4]" />
                </svg>
              </div>
            </div>
            
            {/* Explanation & Lectern Text */}
            <div className="md:col-span-9 space-y-3">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#FF8DA1] font-bold">Unforgettable Visual Identity</span>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">The Virtual Lectern & Global Classroom</h2>
              <p className="text-xs text-white/75 leading-relaxed max-w-2xl">
                Bridging geographical boundaries to serve professional executives, competitive students, and academic aspirants across over 8+ countries. Our global classroom model ensures classical phonetic precision is accessible on demand.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Main Content (Dynamic Category Tabs & Content) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-6">
        <h2 className="text-xs font-mono font-bold tracking-widest uppercase text-[#FF8DA1]">
          Explore Active Cohorts
        </h2>

        {/* Dynamic Category Tabs */}
        <div className="flex flex-wrap gap-2 p-1 bg-[#FAFAFA] border border-[#AD56C4]/15 rounded-3xl w-fit h-fit">
          {(["all", "spoken", "academic", "professional"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all duration-300 uppercase cursor-pointer ${
                activeTab === tab
                  ? "bg-[#AD56C4] text-white shadow-md"
                  : "text-[#23152B]/70 hover:text-[#AD56C4]"
              }`}
            >
              {tab === "all" ? "All Programs" : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
        <AnimatePresence mode="popLayout">
          {filteredCourses.map((course) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              key={course.id}
              className="bg-white border border-[#AD56C4]/15 hover:border-[#AD56C4]/35 rounded-[32px] p-8 hover:shadow-2xl hover:shadow-[#AD56C4]/10 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between relative group"
            >
              {course.popular && (
                <span className="absolute -top-3.5 right-6 bg-gradient-to-r from-[#AD56C4] to-[#FF8DA1] text-white text-[9px] font-mono uppercase font-bold px-3 py-1.5 rounded-full shadow-md tracking-wider flex items-center space-x-1 z-10 group-hover:scale-105 transition-transform duration-300">
                  <Sparkles size={10} />
                  <span>Top Rated Program</span>
                </span>
              )}

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-wider text-[#AD56C4] bg-[#AD56C4]/10 px-2.5 py-1 rounded-full uppercase font-bold">
                    {course.ageGroup}
                  </span>
                  <span className="text-[10px] font-mono text-[#23152B]/60 flex items-center space-x-1 font-semibold">
                    <Clock size={12} className="text-[#FF8DA1]" />
                    <span>{course.duration}</span>
                  </span>
                </div>

                <h3 className="font-display text-xl font-bold text-[#23152B] group-hover:text-[#AD56C4] transition-colors duration-200">
                  {course.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#23152B]/80 leading-relaxed">
                  {course.description}
                </p>

                {/* Weekly Syllabus modules list */}
                <div className="space-y-2 pt-4 border-t border-[#AD56C4]/10">
                  <span className="block text-[10px] uppercase font-mono tracking-wider text-[#AD56C4] font-bold">
                    Weekly Curriculum Modules:
                  </span>
                  <ul className="space-y-2">
                    {course.curriculum.map((item, idx) => (
                      <li key={idx} className="text-xs text-[#23152B]/85 flex items-start space-x-2">
                        <span className="text-[#FF8DA1] font-bold mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6 mt-8 border-t border-[#AD56C4]/10 flex items-center justify-between">
                <span className="text-xs font-mono text-[#AD56C4] font-bold">
                  {course.price}
                </span>
                <button
                  onClick={() => onEnrollClick(course.title)}
                  className="px-5 py-2.5 bg-white hover:bg-[#FF8DA1] hover:text-white border border-[#AD56C4]/35 text-[#AD56C4] text-xs font-bold rounded-full transition-all duration-300 cursor-pointer flex items-center space-x-1"
                >
                  <span>Enquire Slot</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Important terms of admission */}
      <div className="bg-[#FAFAFA] border border-[#AD56C4]/15 rounded-[32px] p-8 md:p-12 space-y-6">
        <div className="flex items-center space-x-2 text-[#AD56C4]">
          <Info size={20} />
          <h3 className="font-display text-lg font-bold text-[#23152B]">
            Academy Enrollment & Admissions Guidance
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs sm:text-sm text-[#23152B]/80 leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-display font-bold text-[#23152B]">1. Complimentary Assessment</h4>
            <p>
              Every student or parent starts with a complimentary diagnostic call to identify specific writing or speaking bottlenecks before slot reservations.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-display font-bold text-[#23152B]">2. Small Cohort System</h4>
            <p>
              To maintain extreme personal interaction, batches are capped at 8 attendees max. 1-on-1 private slots are allocated under special scheduling requests.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-display font-bold text-[#23152B]">3. Class Resources Portal</h4>
            <p>
              Enrolled students receive dedicated folders on Google Drive containing Shelly's textbooks, worksheets, test templates, and feedback sheets.
            </p>
          </div>
        </div>
      </div>

      {/* Continue the Journey Section */}
      <div className="mt-24 pt-12 border-t border-[#AD56C4]/15 text-center space-y-6">
        <span className="text-[9px] font-mono tracking-widest text-[#AD56C4] font-bold uppercase block">
          Continue the Journey
        </span>
        <div className="max-w-2xl mx-auto space-y-3">
          <h3 className="font-display text-2xl sm:text-3xl font-black text-[#23152B] tracking-tight">
            Chapter VI — Begin Your Chapter
          </h3>
          <p className="text-xs sm:text-sm text-[#23152B]/70 font-sans max-w-lg mx-auto leading-relaxed">
            Ready to schedule a physical or digital level-diagnostic check? Connect directly with my virtual desk to begin your language transformation.
          </p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => onNavigateToPage?.("contact")}
            className="group px-8 py-4 bg-[#23152B] hover:bg-[#AD56C4] text-white text-xs font-mono font-bold uppercase rounded-full shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center space-x-3"
          >
            <span>Proceed to Contact Desk</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform text-[#FF8DA1]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
