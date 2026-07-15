import React from "react";
import { motion } from "motion/react";
import { CheckCircle, ShieldCheck, Heart, Users, Star, ArrowRight } from "lucide-react";
import Breadcrumbs from "./Breadcrumbs";

interface AboutPageProps {
  onHomeClick: () => void;
  onContactClick: () => void;
  onAcademyClick: () => void;
  onNavigateToPage?: (page: string) => void;
}

export default function AboutPage({ onHomeClick, onContactClick, onAcademyClick, onNavigateToPage }: AboutPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-7xl mx-auto px-6 lg:px-12 py-12"
    >
      <Breadcrumbs items={[{ label: "About Shelly" }]} onHomeClick={onHomeClick} />

      {/* Header section following the Global Website Rule */}
      <div className="max-w-3xl space-y-6 mb-16 text-left">
        
        {/* 1. Small Label */}
        <div className="inline-flex items-center space-x-2 bg-white/90 border border-[#AD56C4]/15 px-4 py-1.5 rounded-full text-[10px] font-mono font-bold text-[#AD56C4] shadow-sm tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF8DA1] animate-pulse" />
          <span>Chapter I — The Educator</span>
        </div>

        {/* 2. Emotional Page Title */}
        <div className="space-y-3">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#23152B] leading-none">
            Meet Shelly Sharma: A Devotion to the Spoken Word
          </h1>
        </div>

        {/* 3. Inspirational Quote */}
        <blockquote className="text-sm sm:text-base text-[#23152B]/90 leading-relaxed font-serif italic border-l-3 border-[#FF8DA1] pl-6 py-1">
          "Elegant language is not merely an academic skill; it is the absolute architecture of personal confidence and freedom."
        </blockquote>

        {/* 4. Short Story Introduction */}
        <div className="space-y-4 text-xs sm:text-sm text-[#23152B]/75 leading-relaxed font-sans max-w-2xl">
          <p>
            Long before standing at the lecterns of India's elite residential academies, my worldview was forged within the quiet, discipline-rich stone corridors of Kolkata’s historic convent schools. There, the meticulous cadence of the English language was taught not as a subject, but as a moral standard of clarity, posture, and poise.
          </p>
        </div>
      </div>

      {/* 5. Signature Visual (Prestige Convent Seal & Calligraphy Quill Visual) */}
      <div className="mb-16">
        <div className="relative max-w-4xl mx-auto bg-gradient-to-br from-[#23152B] to-[#1F0F26] rounded-[32px] p-8 overflow-hidden border border-[#AD56C4]/20 shadow-xl text-center md:text-left">
          {/* Decorative background glows */}
          <div className="absolute top-[-50%] right-[-10%] w-80 h-80 bg-[#AD56C4]/15 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-[-50%] left-[-10%] w-80 h-80 bg-[#FF8DA1]/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* SVG Seal and Quill Emblem */}
            <div className="md:col-span-3 flex justify-center">
              <div className="relative w-28 h-28 bg-[#FAF7F2] rounded-full border-2 border-[#FF8DA1]/30 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-500">
                <div className="absolute inset-2 rounded-full border border-dashed border-[#AD56C4]/30" />
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-[#23152B]">
                  {/* Styled Shield */}
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" className="stroke-[#AD56C4]" strokeWidth="1.5" />
                  {/* Inside Quill Pen */}
                  <path d="m14 10-2.12 2.12a3 3 0 0 1-4.24 0l-.71-.71" className="stroke-[#FF8DA1]" strokeWidth="2" />
                  <path d="m18 6-6.5 6.5" className="stroke-[#AD56C4]" strokeWidth="2" />
                  <path d="m12 6 2 2" className="stroke-[#FF8DA1]" />
                </svg>
              </div>
            </div>
            
            {/* Explanation & Seal Text */}
            <div className="md:col-span-9 space-y-3">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#FF8DA1] font-bold">Unforgettable Visual Identity</span>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">The Convent Seal of Linguistic Discipline</h2>
              <p className="text-xs text-white/75 leading-relaxed max-w-2xl">
                Representing the synthesis of historic convent boarding standards, university honors scholarship, and modern child-centered psychology. This visual signature underpins every lesson plan, phonetic worksheet, and cohort module designed by Shelly Sharma.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Main Content (Two column grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start mb-24">
        {/* Left Column: Biography Details */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4 text-sm text-[#23152B]/80 leading-relaxed">
            <h2 className="font-display text-2xl font-bold text-[#23152B]">My Story & Pedagogical Roots</h2>
            <p>
              Born and raised under the strict academic rigor of historic convent institutions, including <strong>St. Agnes' Convent</strong> and <strong>Loreto Day School</strong> in Kolkata, my relationship with English has always been grounded in classical precision and oratory clarity. Here, perfect spelling, phonetic accuracy, and elegant speaking were not optional—they were the foundational elements of character development.
            </p>
            <p>
              This background inspired me to pursue formal academic studies. I completed my <strong>Bachelor of Arts (B.A.) in English with Honours</strong> from Calcutta University, followed by a <strong>Master of Arts (M.A.) in English Literature</strong>, and finally my <strong>Bachelor of Education (B.Ed.) from Pune University with First Class Distinction</strong>.
            </p>
            <p>
              Over the last ten years, I have taught as senior residential and day boarding faculty at several of India's most prestigious schools, including <strong>Kaanger Valley Academy</strong>, <strong>N.H. Goel World School</strong>, and <strong>Orchids International School</strong>.
            </p>
          </div>

          {/* Pillars of Teaching */}
          <div className="bg-[#FAFAFA] border border-[#AD56C4]/15 rounded-3xl p-8 space-y-6">
            <h3 className="font-display text-xl font-bold text-[#23152B]">My Teaching Manifesto</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-[#AD56C4]">
                  <ShieldCheck size={18} />
                  <h4 className="font-display font-bold text-sm text-[#23152B]">Convent Standard Pedigree</h4>
                </div>
                <p className="text-xs text-[#23152B]/75 leading-relaxed">
                  Infusing the classical, impeccable oral style and grammatical standards of traditional convent boarding schools.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-[#FF8DA1]">
                  <Heart size={18} />
                  <h4 className="font-display font-bold text-sm text-[#23152B]">Empathetic Accountability</h4>
                </div>
                <p className="text-xs text-[#23152B]/75 leading-relaxed">
                  Creating safe, supportive environments where mistake-making is viewed as a necessary catalyst for speaking success.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-[#FF9CE9]">
                  <Users size={18} />
                  <h4 className="font-display font-bold text-sm text-[#23152B]">Micro-Cohort Tracking</h4>
                </div>
                <p className="text-xs text-[#23152B]/75 leading-relaxed">
                  Strictly limiting batches to 8 students so that every vocal error is documented, corrected, and improved.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-[#AD56C4]">
                  <Star size={18} />
                  <h4 className="font-display font-bold text-sm text-[#23152B]">Certified Competence</h4>
                </div>
                <p className="text-xs text-[#23152B]/75 leading-relaxed">
                  No casual chat sessions. Classes follow structured lesson plans and worksheets compiled by a certified teacher.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: LSRW Framework Interactive Presentation */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#23152B] text-white rounded-[32px] p-8 md:p-10 border border-[#AD56C4]/25 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#AD56C4]/10 rounded-full pointer-events-none" />
            
            <h3 className="font-display text-2xl font-bold tracking-tight mb-2">The Balanced LSRW Framework</h3>
            <p className="text-xs text-white/75 mb-6">
              Our classrooms don't rely on boring rote memorization. We balance the four primary language gears systematically:
            </p>

            <div className="space-y-6">
              <div className="border-l-2 border-[#FF8DA1] pl-4 py-1 space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#FF8DA1] font-bold">L — Listening (Auditory Assimilation)</span>
                <p className="text-xs text-white/80 leading-relaxed">
                  Listening to premium, clear spoken modules, audio essays, and phonics sets to train the ear to detect proper syllables.
                </p>
              </div>

              <div className="border-l-2 border-[#AD56C4] pl-4 py-1 space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#AD56C4] font-bold">S — Speaking (Active Presentation)</span>
                <p className="text-xs text-white/80 leading-relaxed">
                  Daily oratory exercises, vocabulary debates, and accent reduction drills to convert intellectual thoughts into rapid physical speech.
                </p>
              </div>

              <div className="border-l-2 border-[#FF9CE9] pl-4 py-1 space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#FF9CE9] font-bold">R — Reading (Lexical Enrichment)</span>
                <p className="text-xs text-white/80 leading-relaxed">
                  Analyzing high-end literature scripts, newspapers, and Victorian essays to expand vocabulary naturally without flashcards.
                </p>
              </div>

              <div className="border-l-2 border-[#FF8DA1] pl-4 py-1 space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#FF8DA1] font-bold">W — Writing (Syntactic Composition)</span>
                <p className="text-xs text-white/80 leading-relaxed">
                  Mastering the architectural structures of essays, reports, corporate emails, and complex sentence agreements.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-[#AD56C4]/20 rounded-3xl p-6 bg-[#FFC2BA]/5 flex flex-col items-center text-center space-y-4">
            <h4 className="font-display font-bold text-base text-[#23152B]">Ready to evaluate your current English level?</h4>
            <p className="text-xs text-[#23152B]/75 leading-relaxed max-w-sm">
              Schedule a private 1-on-1 diagnostic call with Shelly. She will assess your speaking speed, vocabulary, and grammar, and design a customized curriculum plan.
            </p>
            <button
              onClick={onContactClick}
              className="px-6 py-3 bg-[#AD56C4] hover:bg-[#FF8DA1] text-white text-xs font-mono font-bold rounded-full transition-all duration-300 w-full cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Book 1-on-1 Level Assessment</span>
              <ArrowRight size={14} />
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
            Chapter II — The Academic Journey
          </h3>
          <p className="text-xs sm:text-sm text-[#23152B]/70 font-sans max-w-lg mx-auto leading-relaxed">
            Discover the rigorous, university-certified credentials and deep pedagogical studies that form the scientific backing of my interactive language models.
          </p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => onNavigateToPage?.("qualifications")}
            className="group px-8 py-4 bg-[#23152B] hover:bg-[#AD56C4] text-white text-xs font-mono font-bold uppercase rounded-full shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center space-x-3"
          >
            <span>Explore Academic Credentials</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform text-[#FF8DA1]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
