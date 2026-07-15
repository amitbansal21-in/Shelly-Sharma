import React, { useState } from "react";
import { motion } from "motion/react";
import {
  BookOpen,
  Award,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Bookmark,
  Compass,
  Scroll,
  PenTool
} from "lucide-react";
import Breadcrumbs from "./Breadcrumbs";

interface QualificationsPageProps {
  onHomeClick: () => void;
  onContactClick: () => void;
  onNavigateToPage?: (page: string) => void;
}

interface MilestoneItem {
  id: number;
  stage: string;
  qualification: string;
  institution: string;
  university: string;
  year: string;
  division: string;
  icon: any;
  color: string;
  glowColor: string;
  sentence: string;
  chapter: string;
}

export default function QualificationsPage({ onHomeClick, onContactClick, onNavigateToPage }: QualificationsPageProps) {
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);

  // Chronological academic history
  const academicMilestones: MilestoneItem[] = [
    {
      id: 1,
      chapter: "Chapter I: Foundation",
      stage: "Secondary Education",
      qualification: "Secondary School Certification (ICSE)",
      institution: "St. Agnes' Convent School",
      university: "Kolkata Pre-University Division",
      year: "1997",
      division: "First Division with Distinction",
      icon: BookOpen,
      color: "from-[#AD56C4] to-[#C97AD6]",
      glowColor: "rgba(173, 86, 196, 0.15)",
      sentence: "Formed my lifelong love for elocution, syntax precision, and the beautiful discipline of classical English speech in rigorous convent classrooms."
    },
    {
      id: 2,
      chapter: "Chapter II: Knowledge",
      stage: "Higher Secondary",
      qualification: "Higher Secondary Certification (H.S.)",
      institution: "Loreto Day School",
      university: "Kolkata Board of Secondary Education",
      year: "1999",
      division: "English Subject Topper Honors",
      icon: PenTool,
      color: "from-[#FF8DA1] to-[#FFAAB8]",
      glowColor: "rgba(255, 141, 161, 0.15)",
      sentence: "Discovered the analytical power of prose composition and the lyrical beauty of Romantic literature under visionary classical mentors."
    },
    {
      id: 3,
      chapter: "Chapter III: Literature Mastery",
      stage: "Undergraduate Degree",
      qualification: "B.A. (Honours) in English Literature",
      institution: "Calcutta University",
      university: "University of Calcutta",
      year: "2003",
      division: "First Class Honours with Distinction",
      icon: Scroll,
      color: "from-[#FF9CE9] to-[#FFBCEE]",
      glowColor: "rgba(255, 156, 233, 0.15)",
      sentence: "Immersed deeply in classical British literature, phonetic sound structures, and the historical evolution of the lexicon."
    },
    {
      id: 4,
      chapter: "Chapter IV: Advanced Scholarship",
      stage: "Postgraduate Degree",
      qualification: "M.A. in English Literature",
      institution: "IGNOU",
      university: "Indira Gandhi National University",
      year: "2007",
      division: "High First Division",
      icon: GraduationCap,
      color: "from-[#AD56C4] to-[#FF8DA1]",
      glowColor: "rgba(173, 86, 196, 0.2)",
      sentence: "Explored the deep socio-linguistic impacts of Shakespearean rhetoric, Victorian prose, and global English dialect configurations."
    },
    {
      id: 5,
      chapter: "Chapter V: Pedagogy & Practice",
      stage: "Professional Certification",
      qualification: "Bachelor of Education (B.Ed.)",
      institution: "Pune University",
      university: "University of Pune",
      year: "2014",
      division: "First Class with Distinction Honors",
      icon: Award,
      color: "from-[#FF8DA1] to-[#FF9CE9]",
      glowColor: "rgba(255, 141, 161, 0.2)",
      sentence: "Unified classical literature scholarship with modern scientific teaching methodologies, child psychology, and the balanced LSRW framework."
    }
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#FAF8F5] via-white to-[#FDFBF9] text-[#23152B] py-16 px-6 lg:px-12 overflow-hidden selection:bg-[#AD56C4] selection:text-white">
      
      {/* Decorative Luxury Architectural Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(#AD56C4/0.015_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      {/* Luxury Radial Glow Backgrounds */}
      <div className="absolute top-[15%] right-[-5%] w-[450px] h-[450px] bg-gradient-to-br from-[#AD56C4]/4 to-[#FF8DA1]/4 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-5%] w-[400px] h-[400px] bg-gradient-to-tr from-[#FF9CE9]/3 to-[#AD56C4]/3 rounded-full blur-[120px] pointer-events-none" />

      {/* Editorial Watermark Lettering */}
      <div className="absolute top-44 left-[4%] text-[150px] font-serif italic text-[#AD56C4]/[0.012] select-none pointer-events-none tracking-tighter">
        humanitas
      </div>
      <div className="absolute bottom-60 right-[4%] text-[130px] font-sans font-black text-[#FF8DA1]/[0.012] select-none pointer-events-none tracking-widest uppercase">
        paedagogia
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Navigation Breadcrumbs */}
        <Breadcrumbs items={[{ label: "The Academic Journey" }]} onHomeClick={onHomeClick} />

        {/* Storytelling Introductory Header following the Global Website Rule */}
        <div className="max-w-3xl space-y-6 mb-16 text-left">
          
          {/* 1. Small Label */}
          <div className="inline-flex items-center space-x-2 bg-white/90 border border-[#AD56C4]/15 px-4 py-1.5 rounded-full text-[10px] font-mono font-bold text-[#AD56C4] shadow-sm tracking-wider uppercase">
            <Sparkles size={11} className="text-[#FF8DA1]" />
            <span>Chapter II — The Academic Journey</span>
          </div>
          
          {/* 2. Emotional Page Title */}
          <div className="space-y-3">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#23152B] leading-none">
              Every milestone shaped the educator I am today.
            </h1>
          </div>

          {/* 3. Inspirational Quote */}
          <blockquote className="text-sm sm:text-base text-[#23152B]/90 leading-relaxed font-serif italic border-l-3 border-[#AD56C4] pl-6 py-1">
            "My scholarship was never a mere pursuit of credentials. From the quiet convent classrooms of Kolkata to the systematic study of English pedagogy, each qualification was a vital chapter—tempering my understanding of literature, language psychology, and communication."
          </blockquote>

          {/* 4. Short Story Introduction */}
          <div className="space-y-4 text-xs sm:text-sm text-[#23152B]/75 leading-relaxed font-sans max-w-2xl">
            <p>
              Academic excellence is not a collection of certificates—it is the careful cultivation of intellectual empathy. This page documents the chronological milestones that transformed a passionate student of Victorian literature into a highly qualified, certified leader of modern English classrooms.
            </p>
          </div>
        </div>

        {/* 5. Signature Visual (Prestige Academic Pedigree Crest Visual) */}
        <div className="mb-16">
          <div className="relative max-w-4xl mx-auto bg-gradient-to-br from-[#23152B] to-[#1F0F26] rounded-[32px] p-8 overflow-hidden border border-[#AD56C4]/20 shadow-xl text-center md:text-left">
            {/* Decorative background glows */}
            <div className="absolute top-[-50%] right-[-10%] w-80 h-80 bg-[#AD56C4]/15 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-[-50%] left-[-10%] w-80 h-80 bg-[#FF8DA1]/10 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* SVG Graduation / Crest Emblem */}
              <div className="md:col-span-3 flex justify-center">
                <div className="relative w-28 h-28 bg-[#FAF7F2] rounded-full border-2 border-[#FF8DA1]/30 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-500">
                  <div className="absolute inset-2 rounded-full border border-dashed border-[#AD56C4]/30" />
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-[#23152B]">
                    {/* Academic Cap / Diploma */}
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" className="stroke-[#AD56C4]" strokeWidth="1.5" />
                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" className="stroke-[#FF8DA1]" strokeWidth="1.5" />
                    <circle cx="12" cy="10" r="1" className="fill-[#AD56C4]" />
                  </svg>
                </div>
              </div>
              
              {/* Explanation & Crest Text */}
              <div className="md:col-span-9 space-y-3">
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#FF8DA1] font-bold">Unforgettable Visual Identity</span>
                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">The Academic Pedigree & Distinction Crest</h2>
                <p className="text-xs text-white/75 leading-relaxed max-w-2xl">
                  Tracing continuous university-certified credentials, including a First Class Distinction in Bachelor of Education (B.Ed) from Pune University and a Master of Arts in English Literature. Every single degree represents a certified mastery of speech, syntactic structure, and educational psychology.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Main Content (Vertical Editorial Academic Timeline) */}
        <div className="relative mt-16 mb-28">
          
          {/* Timeline Backbone / Spine Line */}
          {/* Desktop & Tablet Spine Centered */}
          <div className="absolute left-4 md:left-1/2 -translate-x-1/2 top-12 bottom-12 w-[1px] bg-gradient-to-b from-[#AD56C4]/30 via-[#FF8DA1]/20 to-transparent hidden sm:block pointer-events-none" />

          {/* Mobile Only Left-Aligned Spine */}
          <div className="absolute left-4 top-12 bottom-12 w-[1px] bg-gradient-to-b from-[#AD56C4]/30 via-[#FF8DA1]/20 to-transparent block sm:hidden pointer-events-none" />

          {/* SYMBOLIC BEGINNING: Premium Mini-Pencil Illustration */}
          <div className="flex justify-start sm:justify-center w-full mb-16 relative z-20 pl-1 md:pl-0">
            <div className="flex flex-col items-center">
              {/* Elegant small premium pencil icon sphere */}
              <div className="w-10 h-10 rounded-full bg-white border border-[#AD56C4]/20 flex items-center justify-center text-[#AD56C4] shadow-md hover:border-[#AD56C4]/40 transition-colors duration-300">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform rotate-45 text-[#AD56C4]">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </div>
              <span className="text-[9px] font-mono font-bold tracking-widest text-[#AD56C4]/60 uppercase mt-2 select-none">Origin</span>
            </div>
          </div>

          {/* Sequential Timeline Chapter Cards Container */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.25
                }
              }
            }}
            className="space-y-16 md:space-y-24"
          >
            {academicMilestones.map((item, index) => {
              const isEven = index % 2 === 0;
              const Icon = item.icon;
              const isHovered = hoveredCardId === item.id;

              return (
                <div
                  key={item.id}
                  className={`relative flex flex-col sm:flex-row items-center justify-between w-full ${
                    isEven ? "sm:flex-row" : "sm:flex-row-reverse"
                  }`}
                >
                  
                  {/* Left / Right Card Alignment Wrapper */}
                  <div className="w-full sm:w-[46%] pl-12 sm:pl-0 flex justify-start sm:even:justify-end sm:odd:justify-start">
                    
                    <motion.div
                      variants={{
                        hidden: { opacity: 0, y: 25, scale: 0.98 },
                        visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 50, damping: 15 } }
                      }}
                      onMouseEnter={() => setHoveredCardId(item.id)}
                      onMouseLeave={() => setHoveredCardId(null)}
                      className={`relative bg-white/70 backdrop-blur-md border border-[#AD56C4]/10 rounded-3xl p-6 sm:p-7 transition-all duration-500 max-w-[360px] w-full shadow-sm cursor-default ${
                        isHovered
                          ? "shadow-xl border-[#AD56C4]/30 -translate-y-1.5 bg-white/90"
                          : "hover:border-[#AD56C4]/20"
                      }`}
                      style={{
                        boxShadow: isHovered ? `0 12px 30px -10px ${item.glowColor}` : ""
                      }}
                    >
                      {/* Interactive Subtle Color Pin */}
                      <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r ${item.color} opacity-80`} />

                      {/* Timeline Dot attached to the card on Mobile */}
                      <div className="absolute left-[-37px] top-[26px] w-3.5 h-3.5 rounded-full bg-white border-2 border-[#AD56C4] sm:hidden flex items-center justify-center pointer-events-none">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#AD56C4]" />
                      </div>

                      {/* Header Column */}
                      <div className="space-y-4">
                        
                        {/* Chapter & Stage Indicator */}
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold tracking-widest text-[#AD56C4]/80 uppercase">
                            {item.chapter}
                          </span>
                          
                          {/* Year Badge */}
                          <span className={`text-[11px] font-mono font-extrabold tracking-wider transition-all duration-300 ${
                            isHovered ? "text-[#FF8DA1] scale-105" : "text-[#23152B]/40"
                          }`}>
                            {item.year}
                          </span>
                        </div>

                        {/* Qualification Title */}
                        <div className="space-y-1">
                          <h3 className="font-display text-lg font-bold text-[#23152B] tracking-tight group-hover:text-[#AD56C4] transition-colors duration-200">
                            {item.qualification}
                          </h3>
                        </div>

                        {/* Institution Pedigree Badge */}
                        <div className="flex items-center space-x-3.5 py-3 border-y border-[#AD56C4]/5">
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-sm shrink-0`}>
                            <Icon size={14} className={`transition-transform duration-300 ${isHovered ? "scale-125 rotate-6" : ""}`} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-[#23152B] truncate">{item.institution}</h4>
                            <p className="text-[9px] text-[#23152B]/50 font-semibold truncate font-mono uppercase tracking-wide">{item.university}</p>
                          </div>
                        </div>

                        {/* Thoughtful Single Sentence story block */}
                        <p className="text-xs sm:text-[13px] text-[#23152B]/85 leading-relaxed font-serif italic py-1">
                          "{item.sentence}"
                        </p>

                        {/* Division Honors Tag */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-[#AD56C4]/5 border border-[#AD56C4]/10 rounded-full">
                            <span className="text-[8px] font-mono font-extrabold text-[#AD56C4] uppercase tracking-wider">{item.division}</span>
                          </div>
                          <span className="text-[9px] font-mono font-bold text-[#23152B]/35 tracking-widest uppercase select-none">Verified</span>
                        </div>

                      </div>
                    </motion.div>
                  </div>

                  {/* Centered Timeline Connectors (Desktop/Tablet only) */}
                  <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 w-12 items-center justify-center select-none pointer-events-none">
                    
                    {/* Ring attached to the spine */}
                    <div className={`w-3.5 h-3.5 rounded-full border bg-white transition-all duration-500 z-10 flex items-center justify-center ${
                      isHovered ? "border-[#FF8DA1] scale-125 bg-gradient-to-tr from-[#AD56C4] to-[#FF8DA1]" : "border-[#AD56C4]"
                    }`}>
                      {isHovered && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    
                    {/* Horizontal spine link path line */}
                    <div className={`h-[1px] bg-gradient-to-r from-[#AD56C4]/40 to-transparent transition-all duration-500 ${
                      isEven ? "w-6" : "w-6 rotate-180"
                    } ${isHovered ? "opacity-100" : "opacity-30"}`} />
                  </div>

                  {/* Right Spacer Column (Desktop Alignment spacer) */}
                  <div className="w-[46%] hidden sm:block pointer-events-none" />

                </div>
              );
            })}
          </motion.div>

        </div>

        {/* Premium Call to Action Drawer */}
        <div className="bg-white/40 backdrop-blur-md border border-[#AD56C4]/10 rounded-[32px] p-8 md:p-10 shadow-sm relative overflow-hidden text-center max-w-4xl mx-auto mb-12">
          <div className="space-y-4 max-w-2xl mx-auto">
            <span className="text-[10px] font-mono tracking-widest text-[#FF8DA1] font-bold uppercase">Continuous Growth</span>
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#23152B]">
              Ready to begin your language chapter?
            </h2>
            <p className="text-xs sm:text-sm text-[#23152B]/75 leading-relaxed font-sans">
              Shelly Sharma translates classical subject rigor into structured speaking confidence. Schedule a direct diagnostic evaluation to assess your current level and explore custom curriculum structures.
            </p>
            <div className="pt-4 flex justify-center">
              <button
                onClick={onContactClick}
                className="px-8 py-3.5 bg-[#AD56C4] hover:bg-[#FF8DA1] text-white text-xs font-mono font-bold uppercase rounded-full shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center space-x-2"
              >
                <span>Request Assessment Class</span>
                <ArrowRight size={13} />
              </button>
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
              Chapter III — The Path of Excellence
            </h3>
            <p className="text-xs sm:text-sm text-[#23152B]/70 font-sans max-w-lg mx-auto leading-relaxed">
              Follow my decade-long tenure leading classrooms and lecturing oratory confidence at India’s premier world boarding academies.
            </p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => onNavigateToPage?.("experience")}
              className="group px-8 py-4 bg-[#23152B] hover:bg-[#AD56C4] text-white text-xs font-mono font-bold uppercase rounded-full shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center space-x-3"
            >
              <span>Explore Teaching Experience</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform text-[#FF8DA1]" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
