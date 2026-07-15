import React, { useRef } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import {
  BookOpen,
  Award,
  GraduationCap,
  Globe,
  Sparkles,
  Compass,
  PenTool,
  Flame,
  ArrowRight,
  MapPin,
  Check,
  Infinity as InfinityIcon
} from "lucide-react";
import Breadcrumbs from "./Breadcrumbs";

interface ExperiencePageProps {
  onHomeClick: () => void;
  onContactClick: () => void;
  onAboutClick?: () => void;
  onNavigateToPage?: (page: string) => void;
}

interface MilestoneItem {
  id: number;
  years: string;
  school: string;
  board: string;
  role: string;
  achievement: string;
  lesson: string;
  image: string | null;
  icon: any;
  color: string;
  glow: string;
  badgeText: string;
}

export default function ExperiencePage({
  onHomeClick,
  onContactClick,
  onAboutClick,
  onNavigateToPage
}: ExperiencePageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth scroll tracking for path growth animation
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const pathLength = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 25,
    restDelta: 0.001
  });

  // Milestones mapped chronologically from foundations in 2003 to global online academy today
  const milestones: MilestoneItem[] = [
    {
      id: 1,
      years: "2003 – 2006",
      school: "I.P. Memorial School",
      board: "ICSE Curriculum Preparatory, Howrah",
      role: "Foundational English Language Teacher",
      achievement: "Established the school's first public speaking society for young learners.",
      lesson: "Pedagogy must begin with structural confidence—where speech, posture, and phonetic accuracy are taught as life tools, not sterile workbook chapters.",
      image: null,
      icon: Compass,
      color: "from-purple-500 to-indigo-500",
      glow: "rgba(168, 85, 247, 0.25)",
      badgeText: "Elocution Pioneer"
    },
    {
      id: 2,
      years: "2006 – 2010",
      school: "St. Dominic Savio School",
      board: "ICSE Board Co-Educational School, Howrah",
      role: "Senior English Instructor & Board Supervisor",
      achievement: "Successfully guided over 400+ students through board examinations with distinction records.",
      lesson: "Rigor and discipline are forms of high-regard empathy. When teachers refuse to accept mediocrity, students learn to expect greatness from themselves.",
      image: "/assets/st-dominic-savio-school.jpg",
      icon: Award,
      color: "from-emerald-500 to-teal-500",
      glow: "rgba(16, 185, 129, 0.25)",
      badgeText: "Board Exam Supervisor"
    },
    {
      id: 3,
      years: "2010 – 2012",
      school: "The Learning Institute",
      board: "Elite Secondary Language Prep, Kolkata",
      role: "Grades 7 to 12 English Teacher",
      achievement: "Mentored top-scoring state-level debate champions.",
      lesson: "Direct individual feedback loops can completely rewrite a student’s self-concept as an articulate speaker.",
      image: "/assets/The Learing Institude.jpg",
      icon: BookOpen,
      color: "from-rose-500 to-pink-500",
      glow: "rgba(244, 63, 94, 0.25)",
      badgeText: "Rhetoric Master"
    },
    {
      id: 4,
      years: "2012 – 2013",
      school: "Ideal EduSystem & Aptech",
      board: "Curriculum Design & Corporate Training, Mumbai",
      role: "Education Consultant & Author",
      achievement: "Published corporate language guides adopted across multiple vocational centers.",
      lesson: "Standardized curriculum models must balance rigorous structure with intuitive, student-led exercises.",
      image: "/assets/Aptech_1.jpg",
      icon: PenTool,
      color: "from-amber-500 to-orange-500",
      glow: "rgba(245, 158, 11, 0.25)",
      badgeText: "Published Curriculum Author"
    },
    {
      id: 5,
      years: "2014",
      school: "Kalyani Charitable Trust School",
      board: "CBSE Day & Residential School, Nashik",
      role: "English Teacher & Literature Faculty",
      achievement: "Transformed foundational speaking confidence in multi-dialect classrooms.",
      lesson: "Learning expands far beyond the four walls of a classroom—it must live on stage, in theatrical arts, and residential boarding mentorship.",
      image: "/assets/Kalyani Charitable Trust’s Nashik.jpeg",
      icon: Sparkles,
      color: "from-[#AD56C4] to-[#C97AD6]",
      glow: "rgba(173, 86, 196, 0.25)",
      badgeText: "Elocution Standard Catalyst"
    },
    {
      id: 6,
      years: "2016",
      school: "N.H. Goel World School",
      board: "CBSE / Cambridge Affiliated Residential School, Raipur",
      role: "Social Studies & English Educator",
      achievement: "Authored specialized interactive worksheet manuals adopted across school levels.",
      lesson: "Synthesizing pronunciation training with cultural history builds deeply empathetic, world-ready scholars.",
      image: "/assets/N. H. Goel World School, Raipur.jpg",
      icon: Flame,
      color: "from-pink-500 to-rose-500",
      glow: "rgba(236, 72, 153, 0.25)",
      badgeText: "Active Pedagogy Pioneer"
    },
    {
      id: 7,
      years: "2016 – 2018",
      school: "Kaanger Valley Academy",
      board: "CBSE Affiliated, Day Boarding & Residential School, Raipur",
      role: "Post Graduate Teacher (PGT) English",
      achievement: "Optimized Board-Exam passing marks to a flawless 100% qualification rate.",
      lesson: "True leadership is about coaching other educators to maintain unwavering focus on individual learning differentials.",
      image: "/assets/Kaanger Valley Academy, Raipur.JPG",
      icon: GraduationCap,
      color: "from-blue-500 to-indigo-500",
      glow: "rgba(59, 130, 246, 0.25)",
      badgeText: "100% Board Success Coach"
    },
    {
      id: 8,
      years: "Present",
      school: "Shelly Sharma Online English Academy",
      board: "Founder & Chief Educator, Global Virtual Cohorts",
      role: "Founder & Master English Coach",
      achievement: "Empowered over 500+ global professionals and competitive students across 8+ countries.",
      lesson: "Digital platforms do not dilute high-touch convent standards; they democratize them, connecting global voices with precision training.",
      image: "/assets/Shelly.png",
      icon: Globe,
      color: "from-[#AD56C4] to-[#FF8DA1]",
      glow: "rgba(173, 86, 196, 0.25)",
      badgeText: "Global Digital Mentor"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-12 px-6 lg:px-12 relative overflow-hidden">
      
      {/* Decorative Floating Background Gradients (Atmospheric Auras) */}
      <div className="absolute top-1/4 left-[-10%] w-[500px] h-[500px] rounded-full bg-[#AD56C4]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-[-10%] w-[600px] h-[600px] rounded-full bg-[#FF8DA1]/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] rounded-full bg-purple-100/30 blur-[100px] pointer-events-none" />

      {/* SVG Definitions for Gradients used in Path Drawing */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#AD56C4" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#FF8DA1" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#AD56C4" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="activePathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#AD56C4" />
            <stop offset="50%" stopColor="#FF8DA1" />
            <stop offset="100%" stopColor="#AD56C4" />
          </linearGradient>
        </defs>
      </svg>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Navigation Breadcrumbs */}
        <Breadcrumbs items={[{ label: "The Path of Excellence" }]} onHomeClick={onHomeClick} />

        {/* Storytelling Introductory Header */}
        <div className="max-w-3xl space-y-6 mb-24 text-left">
          
          {/* Small Label */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 bg-white/90 border border-[#AD56C4]/15 px-4 py-1.5 rounded-full text-[10px] font-mono font-bold text-[#AD56C4] shadow-sm tracking-wider uppercase"
          >
            <Sparkles size={11} className="text-[#FF8DA1]" />
            <span>Chapter III — Professional Track</span>
          </motion.div>

          {/* Page Title */}
          <div className="space-y-3">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#23152B] leading-none"
            >
              The Path of Excellence
            </motion.h1>
          </div>

          {/* Inspirational Quote */}
          <motion.blockquote 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base text-[#23152B]/90 leading-relaxed font-serif italic border-l-3 border-[#FF8DA1] pl-6 py-1"
          >
            "Every classroom became a chapter of growth, purpose, and inspiration. Professional excellence is never written in sterile timelines—it is a live narrative theater where desks form the amphitheater and syllabus markers represent dramatic growth."
          </motion.blockquote>

          {/* Short Story Introduction */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4 text-xs sm:text-sm text-[#23152B]/75 leading-relaxed font-sans max-w-2xl"
          >
            <p>
              Pedagogy is not merely a succession of jobs; it is an active, continuous journey of intellectual refinement. 
              This chronicle traces Shelly Sharma’s twenty-year devotion to the spoken word—guiding students from historic convent prep rooms in Howrah, through regional CBSE and Cambridge institutions, to a global digital academy connecting minds across eight countries.
            </p>
          </motion.div>
        </div>

        {/* Journey Centerpiece Map */}
        <div ref={containerRef} className="relative mt-12 mb-32">
          
          {/* ==================== PATHWAY LINE GRAPHICS ==================== */}

          {/* DESKTOP CURVED WAVE SPINE (Sinusoidal background track) */}
          <div className="absolute inset-0 left-1/2 -translate-x-1/2 w-32 pointer-events-none z-0 hidden md:block">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 128 1000">
              {/* Static background rail */}
              <path
                d="M 64 0 
                   C 140 100, 140 150, 64 250 
                   C -12 350, -12 400, 64 500 
                   C 140 600, 140 650, 64 750 
                   C -12 850, -12 900, 64 1000"
                fill="none"
                stroke="url(#pathGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                className="opacity-80"
              />
              {/* Active scroll-animated drawing path */}
              <motion.path
                d="M 64 0 
                   C 140 100, 140 150, 64 250 
                   C -12 350, -12 400, 64 500 
                   C 140 600, 140 650, 64 750 
                   C -12 850, -12 900, 64 1000"
                fill="none"
                stroke="url(#activePathGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                style={{ pathLength }}
              />
            </svg>
          </div>

          {/* MOBILE STRAIGHT SPINE */}
          <div className="absolute left-8 top-12 bottom-12 w-1.5 pointer-events-none z-0 md:hidden bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              style={{ scaleY: pathLength }}
              className="w-full h-full bg-gradient-to-b from-[#AD56C4] via-[#FF8DA1] to-[#AD56C4] origin-top"
            />
          </div>

          {/* ==================== MILESTONE STATIONS ==================== */}
          <div className="space-y-24 md:space-y-40 relative z-10">
            {milestones.map((item, index) => {
              const isEven = index % 2 === 0;
              const IconComponent = item.icon;

              return (
                <div key={item.id} className="relative">
                  
                  {/* Grid Layout for Milestone Station */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-4 items-center">
                    
                    {/* LEFT SIDE CONTENT PANEL (Active on even items for desktop) */}
                    <div className={`md:col-span-5 order-2 ${isEven ? 'md:order-1 md:text-right' : 'md:order-3 md:text-left'} space-y-4 pl-16 md:pl-0`}>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="space-y-3"
                      >
                        {/* Milestone Year Display */}
                        <div className="inline-block">
                          <span className="font-serif italic text-base sm:text-lg font-semibold text-[#AD56C4]">
                            {item.years}
                          </span>
                        </div>

                        {/* Institution Name */}
                        <h2 className="font-display text-2xl sm:text-3xl font-black text-[#23152B] leading-tight">
                          {item.school}
                        </h2>

                        {/* Affiliation / Board */}
                        <p className="text-[10px] font-mono uppercase tracking-widest text-[#23152B]/45 font-bold">
                          {item.board}
                        </p>

                        {/* Professional Role */}
                        <div className={`flex items-center gap-2 ${isEven ? 'md:justify-end' : 'md:justify-start'}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF8DA1]" />
                          <p className="text-xs sm:text-sm font-semibold text-[#23152B]/85">
                            {item.role}
                          </p>
                        </div>

                        {/* Achievement Badge */}
                        <div className={`pt-1 flex flex-wrap gap-2 ${isEven ? 'md:justify-end' : 'md:justify-start'}`}>
                          <span className="inline-flex items-center space-x-1.5 bg-white border border-[#AD56C4]/15 px-3 py-1 rounded-full text-[9px] font-mono font-bold text-[#AD56C4] shadow-sm">
                            <Check size={10} className="text-[#FF8DA1]" />
                            <span>{item.badgeText}</span>
                          </span>
                        </div>

                        {/* Key Achievement */}
                        <div className={`text-xs text-[#23152B]/75 leading-relaxed font-sans max-w-sm ${isEven ? 'md:ml-auto' : 'md:mr-auto'}`}>
                          <strong className="text-[#23152B] font-medium">Milestone Achievement:</strong> {item.achievement}
                        </div>

                        {/* Lesson Learned quote layout */}
                        <div className={`pt-3 border-t border-[#23152B]/5 mt-4 max-w-sm ${isEven ? 'md:ml-auto' : 'md:mr-auto'}`}>
                          <p className="text-[10px] font-mono uppercase tracking-widest text-[#23152B]/40 font-bold mb-1">
                            Linguistic Lesson Learned
                          </p>
                          <blockquote className={`text-xs sm:text-[13px] text-[#23152B]/80 font-serif italic leading-relaxed border-[#FF8DA1]/30 pl-4 ${isEven ? 'md:border-r-2 md:border-l-0 md:pl-0 md:pr-4' : 'md:border-l-2'}`}>
                            "{item.lesson}"
                          </blockquote>
                        </div>
                      </motion.div>
                    </div>

                    {/* CENTER PATHWAY STATION NODE */}
                    <div className="absolute md:relative left-0 md:left-auto md:col-span-2 flex justify-center items-center z-20">
                      <motion.div
                        initial={{ scale: 0.7, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ type: "spring", stiffness: 120, delay: 0.1 }}
                        className="relative group cursor-pointer"
                      >
                        {/* Interactive Aura Blur on Node hover */}
                        <div 
                          className="absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                          style={{ backgroundColor: item.glow }}
                        />

                        {/* Outer Pulsing Path Circle */}
                        <div className="w-16 h-16 rounded-full bg-white border border-dashed border-[#AD56C4]/30 flex items-center justify-center p-1.5 shadow-md transform group-hover:scale-105 group-hover:rotate-12 transition-all duration-300">
                          
                          {/* Inner Circle displaying custom vector emblem */}
                          <div className={`w-full h-full rounded-full bg-gradient-to-tr ${item.color} flex items-center justify-center shadow-inner text-white`}>
                            <IconComponent size={20} className="transform group-hover:scale-110 transition-transform" />
                          </div>
                        </div>

                        {/* Sequential Index Flag */}
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#23152B] text-white text-[9px] font-mono font-bold flex items-center justify-center shadow">
                          {item.id}
                        </div>
                      </motion.div>
                    </div>

                    {/* RIGHT SIDE IMAGE GALLERY PANEL (Active on odd items for desktop) */}
                    <div className={`md:col-span-5 order-3 ${isEven ? 'md:order-3 md:text-left' : 'md:order-1 md:text-right'} pl-16 md:pl-0`}>
                      
                      {item.image ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true, margin: "-100px" }}
                          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
                          className={`relative group max-w-sm overflow-hidden rounded-[24px] bg-white p-2.5 border border-[#23152B]/10 shadow-md hover:shadow-xl transition-all duration-500 transform ${
                            isEven ? 'md:-rotate-1 hover:rotate-0 md:mr-auto' : 'md:rotate-1 hover:rotate-0 md:ml-auto'
                          }`}
                        >
                          {/* Fine luxury border inside the picture frame */}
                          <div className="absolute inset-2.5 rounded-[16px] border border-dashed border-[#AD56C4]/15 pointer-events-none z-10" />

                          <div className="relative h-40 sm:h-48 w-full overflow-hidden rounded-[16px] bg-gray-50">
                            <img
                              src={item.image}
                              alt={item.school}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            {/* Smooth overlay gradient inside photograph */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#23152B]/35 via-transparent to-transparent pointer-events-none" />
                          </div>

                          {/* Captioned hover badge */}
                          <div className="absolute bottom-4 left-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="inline-block bg-[#23152B]/90 backdrop-blur-sm text-white text-[8px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-md border border-white/10 shadow-sm">
                              {item.school}
                            </span>
                          </div>
                        </motion.div>
                      ) : (
                        // Placeholder decorative emblem if no specific photograph is uploaded
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true, margin: "-100px" }}
                          transition={{ duration: 0.7 }}
                          className={`relative max-w-xs h-36 border-2 border-dashed border-[#AD56C4]/15 rounded-[24px] flex flex-col items-center justify-center text-center p-6 bg-[#23152B]/2 ${
                            isEven ? 'md:mr-auto' : 'md:ml-auto'
                          }`}
                        >
                          <Compass size={28} className="text-[#AD56C4]/30 animate-pulse mb-2" />
                          <p className="text-[10px] font-mono tracking-widest text-[#23152B]/30 uppercase font-bold">
                            Vintage Educational Archive
                          </p>
                          <p className="text-[9px] text-[#23152B]/50 max-w-[180px] mt-1 font-serif italic">
                            Foundational school records and syllabus archives preserved in central files.
                          </p>
                        </motion.div>
                      )}
                    </div>

                  </div>

                </div>
              );
            })}
          </div>

          {/* ==================== THE JOURNEY CONTINUES (UNENDING MILESTONE) ==================== */}
          <div className="relative pt-24 md:pt-36">
            
            {/* Connection dot to final section */}
            <div className="absolute inset-0 left-1/2 -translate-x-1/2 w-32 pointer-events-none z-0 hidden md:block">
              <svg className="w-full h-full" viewBox="0 0 128 100" preserveAspectRatio="none">
                <path
                  d="M 64 0 L 64 100"
                  fill="none"
                  stroke="url(#pathGradient)"
                  strokeWidth="6"
                  strokeDasharray="6 6"
                  className="opacity-50"
                />
              </svg>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-2xl mx-auto text-center space-y-8 relative z-20"
            >
              {/* Infinity Node Marker */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#23152B] to-[#1F0F26] p-1 flex items-center justify-center shadow-xl border-2 border-[#FF8DA1]/40 transform hover:scale-105 transition-transform duration-300">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[#23152B]">
                    <InfinityIcon size={24} className="text-[#AD56C4] animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Station Texts */}
              <div className="space-y-4">
                <span className="text-[10px] font-mono tracking-widest text-[#FF8DA1] font-bold uppercase">
                  Continuous Devotion
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-black text-[#23152B] tracking-tight">
                  The Journey Continues...
                </h2>
                <p className="text-sm text-[#23152B]/80 font-serif italic max-w-xl mx-auto leading-relaxed">
                  "Pedagogy is not a series of rigid steps; it is a lifelong devotion. Each of these milestones represents a vital crucible where theoretical lesson design met the living energy of young minds, crystallizing into a high-touch, empathetic teaching method."
                </p>
                <p className="text-xs text-[#23152B]/60 max-w-lg mx-auto leading-relaxed">
                  To understand the core values, boarding school disciplines, and child psychology that bind these experience chapters into a unified curriculum structure, explore Shelly's full educational roadmap.
                </p>
              </div>

              {/* Dynamic CTA Navigation Button */}
              <div className="pt-4">
                <button
                  onClick={onAboutClick || onHomeClick}
                  className="inline-flex items-center space-x-3 bg-gradient-to-r from-[#23152B] to-[#1F0F26] text-white px-8 py-4 rounded-full shadow-lg hover:shadow-2xl hover:scale-102 transition-all duration-300 font-mono text-[10px] uppercase tracking-widest font-bold cursor-pointer group"
                >
                  <span>Explore Shelly's Teaching Philosophy</span>
                  <ArrowRight size={13} className="text-[#FF8DA1] group-hover:translate-x-1.5 transition-transform duration-300" />
                </button>
              </div>
            </motion.div>
          </div>

        </div>

        {/* Premium Corporate Consultation Spotlight footer */}
        <div className="bg-gradient-to-br from-[#23152B] to-[#1F0F26] text-white rounded-[32px] p-8 md:p-12 border border-[#AD56C4]/25 shadow-xl relative overflow-hidden mb-16">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#AD56C4]/5 rounded-bl-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FF8DA1]/5 rounded-tr-full pointer-events-none" />
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
            
            <div className="md:col-span-5 space-y-4 text-left">
              <span className="text-[9px] font-mono tracking-widest text-[#FF8DA1] font-bold uppercase">
                Institutional Consulting
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-white leading-tight">
                Collaborate on Customized Curriculum Projects
              </h2>
              <p className="text-xs text-white/70 leading-relaxed">
                Shelly Sharma partners with premier educational boards, colleges, and corporations to audit classroom timelines, design interactive lesson plans, and deliver intensive vocal confidence seminars.
              </p>
            </div>

            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 border-l border-white/10 md:pl-8">
              <div className="space-y-1.5 text-left">
                <div className="flex items-center space-x-2 text-[#FF8DA1]">
                  <Flame size={14} className="text-[#FF8DA1]" />
                  <h4 className="font-display font-bold text-sm text-white">Board-Standard Syllabi</h4>
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Integrating structural phonetics and intensive CBSE/ICSE board scaffolding patterns into public school systems.
                </p>
              </div>

              <div className="space-y-1.5 text-left">
                <div className="flex items-center space-x-2 text-[#AD56C4]">
                  <Flame size={14} className="text-[#AD56C4]" />
                  <h4 className="font-display font-bold text-sm text-white">Corporate Voice Mastery</h4>
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Neutralizing vocal hesitations and public speaking blocks inside high-stakes commercial executive programs.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Final CTA Footer */}
        <div className="text-center space-y-6 pt-8 pb-12 border-t border-[#AD56C4]/10">
          <h3 className="font-display text-2xl font-bold text-[#23152B]">
            Ready to design a standardized language framework?
          </h3>
          <p className="text-sm text-[#23152B]/75 max-w-xl mx-auto leading-relaxed">
            Connect to discuss school curriculum audits, private diagnostic cohort sessions, or specialized institutional training slots.
          </p>
          <div className="flex justify-center">
            <button
              onClick={onContactClick}
              className="px-8 py-3.5 bg-[#AD56C4] hover:bg-[#FF8DA1] text-white text-xs font-mono font-bold uppercase rounded-full shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center space-x-2"
            >
              <span>Schedule Institutional Inquiry</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Continue the Journey Section */}
        <div className="mt-24 pt-12 border-t border-[#AD56C4]/15 text-center space-y-6">
          <span className="text-[9px] font-mono tracking-widest text-[#AD56C4] font-bold uppercase block">
            Continue the Journey
          </span>
          <div className="max-w-2xl mx-auto space-y-3">
            <h3 className="font-display text-2xl sm:text-3xl font-black text-[#23152B] tracking-tight">
              Chapter IV — The Guiding Light
            </h3>
            <p className="text-xs sm:text-sm text-[#23152B]/70 font-sans max-w-lg mx-auto leading-relaxed">
              Step inside my pedagogical mind to discover why my students break through their vocabulary blocks and build genuine speaking courage.
            </p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => onNavigateToPage?.("teaching-philosophy")}
              className="group px-8 py-4 bg-[#23152B] hover:bg-[#AD56C4] text-white text-xs font-mono font-bold uppercase rounded-full shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center space-x-3"
            >
              <span>Explore Teaching Philosophy</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform text-[#FF8DA1]" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
