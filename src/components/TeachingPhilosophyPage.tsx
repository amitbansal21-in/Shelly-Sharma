import React, { useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  Compass,
  MessageSquare,
  Network,
  Activity,
  Lightbulb,
  TrendingUp,
  Award,
  Star,
  Quote,
  CheckCircle,
  HelpCircle,
  Play,
  Check,
  ChevronRight,
  BookOpen
} from "lucide-react";
import Breadcrumbs from "./Breadcrumbs";

interface TeachingPhilosophyPageProps {
  onHomeClick: () => void;
  onContactClick: () => void;
  onAcademyClick: () => void;
  onNavigateToPage?: (page: string) => void;
}

export default function TeachingPhilosophyPage({
  onHomeClick,
  onContactClick,
  onAcademyClick,
  onNavigateToPage
}: TeachingPhilosophyPageProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  
  // Track scroll for dynamic golden lamp glow intensity & background light spreading
  const { scrollYProgress } = useScroll({
    target: pageRef,
    offset: ["start start", "end end"]
  });

  // Calculate warm glow values based on scroll progression
  const glowOpacity = useTransform(scrollYProgress, [0, 0.4, 0.8, 1], [0.15, 0.4, 0.65, 0.8]);
  const glowScale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);
  const lightRadius = useTransform(scrollYProgress, [0, 1], ["500px", "800px"]);
  const bulbPulse = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.05, 1.12]);

  // Selected persona state for Section 3 (Every Student is Different)
  const [selectedPersona, setSelectedPersona] = useState<number>(0);

  // Selected LSRW circle state for the interactive special feature
  const [activeLsrw, setActiveLsrw] = useState<string>("listening");

  // Persona data
  const personas = [
    {
      id: 0,
      title: "The Silent Thinker",
      needs: "High passive vocabulary, hesitates to initiate speech due to grammar anxiety.",
      approach: "Psychological safe-zones where syntax errors are reframed as natural linguistic steps. High-frequency conversational prompts built on their current interests.",
      result: "Learns to initiate dialogue spontaneously, finding speech flow before correcting minor tense structural errors.",
      color: "border-purple-200 bg-purple-50/40 text-purple-700"
    },
    {
      id: 1,
      title: "The Academic Purist",
      needs: "Scores high on written tests, but struggles with natural rhythm, phonetic accuracy, and conversational speech.",
      approach: "Oral declamation training, listening logs from native sources, and active phonetic drill practices to soften regional accents.",
      result: "Translates analytical reading knowledge into crisp, fluid, and natural-sounding public declarations.",
      color: "border-teal-200 bg-teal-50/40 text-teal-700"
    },
    {
      id: 2,
      title: "The Expressive Creator",
      needs: "Full of brilliant, rapid-fire ideas, but structures sentences poorly, resulting in convoluted communication.",
      approach: "Curriculum scaffolding, structured paragraph frameworks (OREO method), and constructive speech organizing templates.",
      result: "Learns to pace their delivery, delivering high-impact academic discourse with clear, concise, and structured authority."
    }
  ];

  // LSRW Data
  const lsrwFramework = [
    {
      id: "listening",
      title: "Listening (Decoding)",
      tagline: "The Foundation of Language Retention",
      importance: "Before a child speaks, they decode. Listening forms the mental standard for correct pronunciation, rhythm, and word pauses.",
      method: "Students analyze native podcasts, dictation exercises, and custom audio registers to build deep phonetic familiarity before active production.",
      bg: "from-indigo-500/10 to-purple-500/10 border-indigo-200",
      accent: "text-indigo-600 bg-indigo-50"
    },
    {
      id: "speaking",
      title: "Speaking (Production)",
      tagline: "The Gateway to Personal Confidence",
      importance: "Language lives in speech. Speaking turns passive vocabulary into active, agile, and spontaneous communication.",
      method: "Immersive virtual debates, picture descriptions, structured monologues, and real-time pronunciation tweaks under conversational flow.",
      bg: "from-purple-500/10 to-pink-500/10 border-purple-200",
      accent: "text-[#AD56C4] bg-purple-50"
    },
    {
      id: "reading",
      title: "Reading (Assimilation)",
      tagline: "Expanding the Cognitive Lexicon",
      importance: "Reading exposes students to advanced sentence formats, narrative structures, and stylistic devices naturally.",
      method: "Custom editorial literature reviews, reading aloud for breath-control coaching, and close comprehension analysis of premium essays.",
      bg: "from-pink-500/10 to-rose-500/10 border-pink-200",
      accent: "text-pink-600 bg-pink-50"
    },
    {
      id: "writing",
      title: "Writing (Exposition)",
      tagline: "The Ultimate Test of Structured Clarity",
      importance: "Writing crystallizes thoughts. It forces precise word selections and rigorous adherence to syntactical standards.",
      method: "Interactive paragraph structuring, creative essay journals, formal letter audits, and self-editing workshops with detailed grammar breakdowns.",
      bg: "from-rose-500/10 to-amber-500/10 border-rose-200",
      accent: "text-rose-600 bg-rose-50"
    }
  ];

  return (
    <div 
      ref={pageRef}
      className="min-h-screen bg-[#FAF7F2] text-[#23152B] selection:bg-[#FF8DA1] selection:text-white font-sans antialiased relative overflow-hidden"
    >
      
      {/* ==================== SCIENTIFIC PAPER TEXTURE & FLOATING PARTICLES ==================== */}
      <div className="absolute inset-0 bg-[radial-gradient(#23152B/0.015_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none z-0 opacity-70" />
      
      {/* Dynamic light glow background spreading - increases with scroll */}
      <motion.div 
        className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(253,224,71,0.18)_0%,transparent_70%)] pointer-events-none z-0 mix-blend-color-dodge"
        style={{
          width: lightRadius,
          height: lightRadius,
          opacity: glowOpacity,
          scale: glowScale,
        }}
      />

      {/* Floating Sparkle Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-[#FF8DA1]/30"
            style={{
              top: `${15 + i * 14}%`,
              left: `${10 + (i * 23) % 80}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.25, 1],
            }}
            transition={{
              duration: 6 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-12 relative z-10 pt-10 pb-24">
        
        {/* Navigation Breadcrumbs */}
        <Breadcrumbs items={[{ label: "Teaching Philosophy" }]} onHomeClick={onHomeClick} />

        {/* ==================== PAGE HEADER ==================== */}
        <div className="max-w-4xl mx-auto text-center mt-8 mb-20 space-y-6">
          
          {/* Small Section Label */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 bg-white/90 border border-[#AD56C4]/15 px-4 py-1.5 rounded-full text-[10px] font-mono font-bold text-[#AD56C4] shadow-sm tracking-wider uppercase"
          >
            <Sparkles size={11} className="text-[#FF8DA1]" />
            <span>EDUCATIONAL VISION</span>
          </motion.div>

          {/* Emotional H1 Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#23152B] leading-none"
          >
            The Light of Learning
          </motion.h1>

          {/* Inspirational Quote */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-xl mx-auto py-2 border-y border-[#AD56C4]/10"
          >
            <blockquote className="text-sm sm:text-base text-[#23152B]/85 font-serif italic font-medium leading-relaxed">
              "Education is not the transfer of information; it is the awakening of confidence."
            </blockquote>
          </motion.div>

          {/* Story Introduction */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-2xl mx-auto text-xs sm:text-sm text-[#23152B]/75 leading-relaxed font-sans space-y-4"
          >
            <p>
              Teaching is far more than completing a syllabus. Every lesson should build confidence. 
              Every conversation should improve communication. Every learner deserves encouragement, 
              curiosity, and the courage to express ideas clearly.
            </p>
            <p className="font-serif italic font-medium text-[#AD56C4]">
              Shelly Sharma believes that language is not memorized—it is experienced through listening, speaking, reading, and writing.
            </p>
          </motion.div>
        </div>

        {/* ==================== SIGNATURE VISUAL: THE GUIDING LIGHT ==================== */}
        <div className="flex flex-col items-center justify-center mb-28 relative">
          
          {/* Hanging Cord */}
          <div className="w-0.5 h-16 bg-[#23152B]/15" />

          {/* Custom vector styled Study Lamp */}
          <motion.div 
            style={{ scale: bulbPulse }}
            className="relative flex flex-col items-center"
          >
            {/* Lamp Shade brass connector */}
            <div className="w-5 h-2 bg-[#D97706] rounded-t-sm" />
            
            {/* Lamp Shade body */}
            <div className="w-14 h-8 bg-gradient-to-b from-[#23152B] to-[#160B1C] rounded-b-xl flex items-center justify-center relative shadow-md z-20">
              {/* Gold Ring */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#D97706]/70 rounded-b-xl" />
            </div>

            {/* Glowing Golden Bulb */}
            <div className="w-6 h-6 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 shadow-[0_0_20px_rgba(251,191,36,0.8)] -mt-1 relative z-10 flex items-center justify-center">
              {/* Filament */}
              <div className="w-1 h-2 bg-white/60 rounded-full" />
            </div>

            {/* Radiant light cone outline (Aesthetic) */}
            <div className="absolute top-12 w-64 h-32 bg-gradient-to-b from-amber-400/10 via-amber-300/5 to-transparent clip-path-cone rounded-b-full pointer-events-none z-0" />
          </motion.div>

          <p className="text-[10px] font-mono tracking-widest text-[#23152B]/40 uppercase font-bold mt-4">
            The Guiding Light
          </p>
        </div>

        {/* ==================== THE SIX PREMIUM PHILOSOPHY SECTIONS ==================== */}
        <div className="space-y-28 mb-32">
          
          <div className="border-b border-[#AD56C4]/10 pb-6">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-[#23152B]">
              The Six Pillars of Shelly's Pedagogy
            </h2>
            <p className="text-xs text-[#23152B]/50 font-mono uppercase tracking-wider mt-1">
              Distinctive approaches designed for lifetime confidence
            </p>
          </div>

          {/* PILLAR 01: CONFIDENCE BEFORE GRAMMAR */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center" id="philosophy-01">
            <div className="md:col-span-6 space-y-6">
              <div className="flex items-center space-x-3">
                <span className="font-serif italic text-4xl font-extrabold text-[#AD56C4]/30">01</span>
                <span className="h-px bg-[#AD56C4]/20 w-12" />
                <span className="text-[10px] font-mono tracking-wider text-[#AD56C4] font-bold uppercase">The Expression First Rule</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-black text-[#23152B] leading-tight">
                Confidence Before Grammar
              </h3>
              <p className="text-xs sm:text-sm text-[#23152B]/75 leading-relaxed font-sans">
                Many conventional classrooms strangle fluency by correcting mistakes too early. 
                Our core standard is simple: **Students must first learn to express thoughts with conviction.** 
                Once a child loses the fear of vocalizing their ideas, grammar becomes a meaningful framework for polish, rather than a barrier to entry.
              </p>
              <div className="p-4 bg-[#AD56C4]/5 rounded-2xl border border-[#AD56C4]/10 font-serif italic text-xs text-[#23152B]/85">
                "When a student speaks with conviction, the grammar corrections that follow feel like tools of empowerment, not weapons of criticism."
              </div>
            </div>

            {/* Visual: Confidence Bridge Communication Illustration */}
            <div className="md:col-span-6 flex justify-center">
              <div className="relative w-full max-w-sm bg-white p-6 rounded-3xl border border-[#23152B]/10 shadow-lg overflow-hidden">
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <h4 className="font-mono text-[9px] uppercase text-[#23152B]/40 tracking-wider mb-4 font-bold">
                  Fluency Bridge Simulation
                </h4>
                
                {/* Visual grid illustration */}
                <div className="space-y-4">
                  {/* Step 1: Self-doubt */}
                  <div className="flex items-center space-x-3 bg-red-50/50 p-2.5 rounded-lg border border-red-100">
                    <span className="text-[10px] font-mono font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded">RULISM</span>
                    <p className="text-[11px] text-[#23152B]/70 italic">"Am I using past continuous tense correctly?" (Hesitant silence)</p>
                  </div>
                  {/* Arrow down */}
                  <div className="h-4 w-px bg-dashed border-l border-gray-300 ml-8" />
                  {/* Step 2: The Expression Awakening */}
                  <div className="flex items-center space-x-3 bg-purple-50/70 p-2.5 rounded-lg border border-purple-100">
                    <span className="text-[10px] font-mono font-bold text-[#AD56C4] bg-purple-100 px-2 py-0.5 rounded">VOICE</span>
                    <p className="text-[11px] text-[#23152B]/80 font-bold">"I think we must preserve books because they store old stories!"</p>
                  </div>
                  {/* Arrow down */}
                  <div className="h-4 w-px bg-dashed border-l border-gray-300 ml-8" />
                  {/* Step 3: Polish after fluency */}
                  <div className="flex items-center space-x-3 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">POLISH</span>
                    <p className="text-[11px] text-[#23152B]/70 italic">"Excellent! Now let's elevate 'preserve' to 'safeguard' to make it stronger."</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* PILLAR 02: LEARNING THROUGH CONVERSATION */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center" id="philosophy-02">
            
            {/* Visual Speech Bubbles left */}
            <div className="md:col-span-6 order-2 md:order-1 flex justify-center">
              <div className="space-y-4 w-full max-w-sm">
                
                {/* Bubble 1 */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="bg-white p-4 rounded-t-2xl rounded-r-2xl shadow-md border border-[#23152B]/5 max-w-[85%] relative"
                >
                  <p className="text-xs text-[#23152B]/85 font-sans leading-relaxed">
                    "Shelly Ma'am, what's the best way to explain a complicated scientific theory on stage?"
                  </p>
                  <span className="text-[9px] font-mono text-indigo-500 font-bold mt-1 block">STUDENT PROMPT</span>
                </motion.div>

                {/* Bubble 2 */}
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 }}
                  className="bg-[#23152B] text-white p-4 rounded-t-2xl rounded-l-2xl shadow-lg border border-[#AD56C4]/15 max-w-[85%] ml-auto relative"
                >
                  <p className="text-xs text-white/90 font-serif italic leading-relaxed">
                    "Do not list details first. Hook them with a simple comparison they can touch, then open the complexity."
                  </p>
                  <span className="text-[9px] font-mono text-[#FF8DA1] font-bold mt-1 block text-right">SHELLY'S MENTORSHIP</span>
                </motion.div>
                
              </div>
            </div>

            {/* Editorial text right */}
            <div className="md:col-span-6 order-1 md:order-2 space-y-6">
              <div className="flex items-center space-x-3">
                <span className="font-serif italic text-4xl font-extrabold text-[#AD56C4]/30">02</span>
                <span className="h-px bg-[#AD56C4]/20 w-12" />
                <span className="text-[10px] font-mono tracking-wider text-[#AD56C4] font-bold uppercase">Natural Acquisition</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-black text-[#23152B] leading-tight">
                Learning Through Conversation
              </h3>
              <p className="text-xs sm:text-sm text-[#23152B]/75 leading-relaxed font-sans">
                English is a living, breathing tool—not a specimen preserved inside dry textbooks. 
                We structure every session around active, peer-to-peer discourse, open intellectual debates, 
                and structured storytelling prompts. By treating speaking as a default habit rather than a sporadic test, 
                our students develop intuitive sentence structures and natural conversational fluidity.
              </p>
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#AD56C4] hover:text-[#FF8DA1] transition-colors cursor-pointer">
                <span>View Our Active Discourse Patterns</span>
                <ArrowRight size={13} />
              </div>
            </div>
          </section>

          {/* PILLAR 03: EVERY STUDENT IS DIFFERENT */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center" id="philosophy-03">
            <div className="md:col-span-6 space-y-6">
              <div className="flex items-center space-x-3">
                <span className="font-serif italic text-4xl font-extrabold text-[#AD56C4]/30">03</span>
                <span className="h-px bg-[#AD56C4]/20 w-12" />
                <span className="text-[10px] font-mono tracking-wider text-[#AD56C4] font-bold uppercase">Linguistic Personalization</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-black text-[#23152B] leading-tight">
                Every Student Is Different
              </h3>
              <p className="text-xs sm:text-sm text-[#23152B]/75 leading-relaxed font-sans">
                A standardized curriculum designed for everyone serves no one. 
                Some students have rich passive vocabularies but lack the physical courage to speak. 
                Others are fluent conversationalists but require rigorous structured paragraph formulas to survive academic examinations. 
                We diagnose each child's individual learning psychology to shape the exact exercises they need.
              </p>
              
              {/* Branching pathway selector button tabs */}
              <div className="flex flex-wrap gap-2 pt-2">
                {personas.map((persona, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPersona(index)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-[9px] font-bold uppercase transition-all duration-300 cursor-pointer ${
                      selectedPersona === index 
                        ? "bg-[#23152B] text-white shadow-md"
                        : "bg-white text-[#23152B]/70 border border-[#23152B]/10 hover:border-[#AD56C4]/30"
                    }`}
                  >
                    {persona.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual: Branching learning paths display block */}
            <div className="md:col-span-6 flex justify-center">
              <div className="relative w-full max-w-sm bg-white p-6 rounded-3xl border border-[#23152B]/10 shadow-lg overflow-hidden min-h-[220px] flex flex-col justify-between">
                
                {/* Decorative node connector path */}
                <div className="absolute top-0 bottom-0 left-8 w-0.5 bg-dashed border-l border-indigo-100" />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedPersona}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 relative z-10"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[#AD56C4]" />
                      <h4 className="font-display font-bold text-sm text-[#23152B]">
                        {personas[selectedPersona].title}
                      </h4>
                    </div>

                    <div className="space-y-2 text-xs">
                      <p className="text-[#23152B]/55 font-mono text-[9px] uppercase tracking-wider">Linguistic Block:</p>
                      <p className="text-[#23152B]/80 font-sans italic">"{personas[selectedPersona].needs}"</p>
                    </div>

                    <div className="space-y-2 text-xs">
                      <p className="text-[#AD56C4] font-mono text-[9px] uppercase tracking-wider font-bold">Custom Remedial Path:</p>
                      <p className="text-[#23152B]/85 font-sans leading-relaxed">{personas[selectedPersona].approach}</p>
                    </div>

                    <div className="pt-2 border-t border-[#23152B]/5 text-xs text-emerald-600 font-medium flex items-center space-x-1.5">
                      <CheckCircle size={12} className="text-emerald-500" />
                      <span>{personas[selectedPersona].result}</span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </section>

          {/* PILLAR 04: LEARNING BY PRACTICE */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center" id="philosophy-04">
            
            {/* Elegant progress visualization left */}
            <div className="md:col-span-6 order-2 md:order-1 flex justify-center">
              <div className="relative w-full max-w-sm bg-white p-6 rounded-3xl border border-[#23152B]/10 shadow-lg">
                <h4 className="font-mono text-[9px] uppercase text-[#23152B]/40 tracking-wider mb-4 font-bold">
                  Compounding Fluency Growth
                </h4>

                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1 text-[#23152B]/75">
                      <span>Day 1 — Vocal Resistance</span>
                      <span className="font-bold">15%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: "15%" }} />
                    </div>
                    <p className="text-[9px] text-red-500 font-medium mt-1">Nervous hesitations, rigid translation block.</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1 text-[#23152B]/75">
                      <span>Day 30 — Conversational Comfort</span>
                      <span className="font-bold">60%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-[#AD56C4] rounded-full" style={{ width: "60%" }} />
                    </div>
                    <p className="text-[9px] text-[#AD56C4] font-medium mt-1">Initiates replies spontaneously, comfortable rhythm.</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1 text-[#23152B]/75">
                      <span>Day 90 — Authentic Declamation</span>
                      <span className="font-bold">95%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#AD56C4] to-[#FF8DA1] rounded-full" style={{ width: "95%" }} />
                    </div>
                    <p className="text-[9px] text-emerald-600 font-medium mt-1">Rigorous syntax, expressive projection, board-ready confidence.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Editorial text right */}
            <div className="md:col-span-6 order-1 md:order-2 space-y-6">
              <div className="flex items-center space-x-3">
                <span className="font-serif italic text-4xl font-extrabold text-[#AD56C4]/30">04</span>
                <span className="h-px bg-[#AD56C4]/20 w-12" />
                <span className="text-[10px] font-mono tracking-wider text-[#AD56C4] font-bold uppercase">Compound Habits</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-black text-[#23152B] leading-tight">
                Learning By Practice
              </h3>
              <p className="text-xs sm:text-sm text-[#23152B]/75 leading-relaxed font-sans">
                Spectacular speech cannot be crammed overnight. Deep conversational agility is built through structured daily rituals. 
                We leverage continuous mini-practice logs—ranging from active vocabulary journals to 30-second speech recordings submitted daily—to 
                create strong muscle memory. Constant, small feedback adjustments yield breathtaking long-term results.
              </p>
              <div className="p-4 border border-dashed border-[#AD56C4]/30 rounded-2xl bg-white/50 text-xs text-[#23152B]/70 italic">
                Our average student submits 12 micro-vocal recording challenges per module, ensuring constant, incremental muscle adaptation.
              </div>
            </div>
          </section>

          {/* PILLAR 05: CURIOSITY CREATES CONFIDENCE */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center" id="philosophy-05">
            <div className="md:col-span-6 space-y-6">
              <div className="flex items-center space-x-3">
                <span className="font-serif italic text-4xl font-extrabold text-[#AD56C4]/30">05</span>
                <span className="h-px bg-[#AD56C4]/20 w-12" />
                <span className="text-[10px] font-mono tracking-wider text-[#AD56C4] font-bold uppercase">Intellectual Freedom</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-black text-[#23152B] leading-tight">
                Curiosity Creates Confidence
              </h3>
              <p className="text-xs sm:text-sm text-[#23152B]/75 leading-relaxed font-sans">
                A passive classroom is a dying environment. We cultivate high-inquiry spaces where students are actively encouraged to question meanings, 
                challenge viewpoints, and voice unconventional thoughts. Intellectual curiosity is the fuel of language; when a child is genuinely 
                eager to explore a topic, the language tools to express that discovery follow naturally.
              </p>
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#AD56C4] hover:text-[#FF8DA1] transition-colors cursor-pointer">
                <span>Discover How We Spark Questions</span>
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Glowing curiosity illustration */}
            <div className="md:col-span-6 flex justify-center">
              <div className="relative w-full max-w-sm bg-gradient-to-br from-[#23152B] to-[#120517] p-6 rounded-3xl border border-[#AD56C4]/20 shadow-xl overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF8DA1]/5 rounded-full blur-2xl" />
                
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#FF8DA1]/20 flex items-center justify-center">
                    <Lightbulb size={16} className="text-[#FF8DA1] animate-pulse" />
                  </div>
                  <h4 className="font-display text-sm font-bold text-white">The Inquiry Catalyst</h4>
                </div>

                <p className="text-xs text-white/80 font-serif italic mb-4 leading-relaxed">
                  "Every question asked is a sign of an active mind forging permanent language pathways. We never say 'Not now'."
                </p>

                <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-[11px] text-white/70 space-y-2">
                  <p className="font-bold text-[#FF8DA1]">Socratic Challenge Drill:</p>
                  <p className="italic">Instead of lecturing, Shelly presents the 'Why Paradox' where students lead the synthesis by defending their points against standard answers.</p>
                </div>
              </div>
            </div>
          </section>

          {/* PILLAR 06: EDUCATION NEVER ENDS */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center" id="philosophy-06">
            
            {/* Upward growth visualization left */}
            <div className="md:col-span-6 order-2 md:order-1 flex justify-center">
              <div className="relative w-full max-w-sm bg-white p-6 rounded-3xl border border-[#23152B]/10 shadow-lg text-left overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#AD56C4]/5 to-transparent rounded-bl-full pointer-events-none" />
                
                <h4 className="font-mono text-[9px] uppercase text-[#23152B]/40 tracking-wider mb-6 font-bold">
                  Lifelong Success Architecture
                </h4>

                {/* Vertical Step list */}
                <div className="space-y-4 relative">
                  {/* Step line */}
                  <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-100" />

                  {/* Node 1 */}
                  <div className="flex items-start space-x-4 relative">
                    <div className="w-6.5 h-6.5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-mono text-[#23152B]/60 font-bold border-2 border-white">
                      01
                    </div>
                    <div>
                      <h5 className="font-display font-bold text-xs text-[#23152B]">Foundational Accents</h5>
                      <p className="text-[10px] text-[#23152B]/55">Overcoming immediate classroom public speaking hurdles.</p>
                    </div>
                  </div>

                  {/* Node 2 */}
                  <div className="flex items-start space-x-4 relative">
                    <div className="w-6.5 h-6.5 rounded-full bg-purple-100 text-[#AD56C4] flex items-center justify-center text-[10px] font-mono font-bold border-2 border-white">
                      02
                    </div>
                    <div>
                      <h5 className="font-display font-bold text-xs text-[#23152B]">Board and Academic Superiority</h5>
                      <p className="text-[10px] text-[#23152B]/55">Developing the technical analysis needed for critical exams.</p>
                    </div>
                  </div>

                  {/* Node 3 */}
                  <div className="flex items-start space-x-4 relative">
                    <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-tr from-[#AD56C4] to-[#FF8DA1] text-white flex items-center justify-center text-[10px] font-mono font-bold border-2 border-white">
                      03
                    </div>
                    <div>
                      <h5 className="font-display font-bold text-xs text-[#23152B]">Global Leadership Carriage</h5>
                      <p className="text-[10px] text-[#23152B]/55">Articulating views clearly in universities and global workspaces.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Editorial text right */}
            <div className="md:col-span-6 order-1 md:order-2 space-y-6">
              <div className="flex items-center space-x-3">
                <span className="font-serif italic text-4xl font-extrabold text-[#AD56C4]/30">06</span>
                <span className="h-px bg-[#AD56C4]/20 w-12" />
                <span className="text-[10px] font-mono tracking-wider text-[#AD56C4] font-bold uppercase">Infinite Growth</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-black text-[#23152B] leading-tight">
                Education Never Ends
              </h3>
              <p className="text-xs sm:text-sm text-[#23152B]/75 leading-relaxed font-sans">
                Our pedagogical endpoint is never simply passing a grade or getting a course certificate. 
                Language training is a gateway skill that shapes a student’s lifelong career opportunities, social networks, and mental clarity. 
                We prepare students not just to survive next week's examinations, but to navigate global university halls and boardrooms with confidence.
              </p>
              <div className="p-4 border-l-3 border-[#FF8DA1] bg-[#FAF7F2] font-serif italic text-xs text-[#23152B]/85">
                "Our students don't just speak English; they command it. The habits of self-monitoring and expressive articulation learned here serve them forever."
              </div>
            </div>
          </section>

        </div>

        {/* ==================== SPECIAL FEATURE: THE LSRW LEARNING FRAMEWORK ==================== */}
        <div className="bg-gradient-to-br from-[#23152B] to-[#1F0F26] text-white rounded-[32px] p-8 md:p-12 border border-[#AD56C4]/25 shadow-2xl relative overflow-hidden mb-28">
          
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#AD56C4]/5 rounded-bl-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#FF8DA1]/5 rounded-tr-full pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto space-y-8">
            
            <div className="text-center space-y-3">
              <span className="text-[9px] font-mono tracking-widest text-[#FF8DA1] font-bold uppercase">
                Interactive Special Feature
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-black text-white leading-tight">
                The LSRW Learning Framework
              </h2>
              <p className="text-xs text-white/70 max-w-2xl mx-auto">
                Shelly Sharma implements a tight, interconnected four-pillared circle. Hover or click each core language element below to reveal how we synchronize these active skills.
              </p>
            </div>

            {/* Interactive Circles Cluster Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
              {lsrwFramework.map((item) => (
                <button
                  key={item.id}
                  onMouseEnter={() => setActiveLsrw(item.id)}
                  onClick={() => setActiveLsrw(item.id)}
                  className={`p-6 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden focus:outline-none cursor-pointer ${
                    activeLsrw === item.id 
                      ? "bg-white/10 border-[#FF8DA1] shadow-lg scale-102"
                      : "bg-white/2 border-white/5 hover:bg-white/5"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                      activeLsrw === item.id ? "bg-[#FF8DA1] text-[#23152B]" : "bg-white/10 text-white"
                    }`}>
                      {item.title[0]}
                    </span>
                    {activeLsrw === item.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF8DA1] animate-ping" />
                    )}
                  </div>
                  <h4 className="font-display font-black text-sm text-white mt-4">{item.title}</h4>
                  <p className="text-[10px] text-white/50 font-mono mt-1 uppercase tracking-wider">{item.id}</p>
                </button>
              ))}
            </div>

            {/* Explanatory dynamic content block with smooth transitions */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[160px] flex items-center">
              <AnimatePresence mode="wait">
                {lsrwFramework.map((item) => {
                  if (item.id !== activeLsrw) return null;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full"
                    >
                      <div className="md:col-span-5 space-y-2 text-left">
                        <span className="text-[9px] font-mono text-[#FF8DA1] tracking-widest uppercase font-bold">
                          {item.tagline}
                        </span>
                        <h4 className="font-display font-black text-xl text-white">
                          {item.title}
                        </h4>
                        <p className="text-xs text-white/70 leading-relaxed font-sans">
                          {item.importance}
                        </p>
                      </div>

                      <div className="md:col-span-7 bg-white/3 p-4 rounded-xl border border-white/5 flex flex-col justify-center text-left">
                        <p className="text-[9px] font-mono text-[#AD56C4] tracking-widest uppercase font-bold mb-2">
                          Shelly Sharma's Integration Model
                        </p>
                        <p className="text-xs text-white/90 leading-relaxed italic font-serif">
                          "{item.method}"
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

          </div>
        </div>

        {/* ==================== PARENT TRUST SECTION ==================== */}
        <div className="mb-28 text-center space-y-12">
          
          <div className="max-w-2xl mx-auto space-y-3">
            <span className="text-[9px] font-mono tracking-widest text-[#AD56C4] font-bold uppercase">
              REPUTATION & VERACITY
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-[#23152B] tracking-tight">
              Why Parents Trust My Teaching
            </h2>
            <p className="text-xs text-[#23152B]/60 font-sans max-w-xl mx-auto">
              Behind every high-performing student is a parent seeking transparent progress and genuine personal mentorship. Here are the active philosophies that anchor our parent-educator partnerships.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            
            {/* Trust Stat 1 */}
            <div className="bg-white p-6 rounded-3xl border border-[#23152B]/10 shadow-md relative hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center space-x-2 text-[#AD56C4] mb-3">
                <Star size={14} className="fill-[#AD56C4]" />
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#23152B]">
                  Individual Attention
                </h4>
              </div>
              <p className="text-xs text-[#23152B]/75 leading-relaxed font-sans">
                We maintain strictly capped batch sizes. This ensures that every student speaks during every single session, receiving personalized pronunciation corrections and tailored syntax guidance. No student is left sitting in silence.
              </p>
            </div>

            {/* Trust Stat 2 */}
            <div className="bg-white p-6 rounded-3xl border border-[#23152B]/10 shadow-md relative hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center space-x-2 text-[#AD56C4] mb-3">
                <Star size={14} className="fill-[#AD56C4]" />
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#23152B]">
                  Practical Communication
                </h4>
              </div>
              <p className="text-xs text-[#23152B]/75 leading-relaxed font-sans">
                Parents choose us because we bridge the gap between written test marks and spoken charm. While we cover school syllabus structures rigorously, the absolute focus remains on raising eloquent, real-world communicators.
              </p>
            </div>

            {/* Trust Stat 3 */}
            <div className="bg-white p-6 rounded-3xl border border-[#23152B]/10 shadow-md relative hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center space-x-2 text-[#AD56C4] mb-3">
                <Star size={14} className="fill-[#AD56C4]" />
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#23152B]">
                  Regular Progress
                </h4>
              </div>
              <p className="text-xs text-[#23152B]/75 leading-relaxed font-sans">
                We believe in total transparency. Parents receive detailed developmental reports, active feedback logs, and recorded snippets showcasing their children's real physical progress in voice modulation and vocabulary strength.
              </p>
            </div>

          </div>

          {/* Testimonial Statement */}
          <div className="max-w-2xl mx-auto p-6 bg-white rounded-3xl border border-dashed border-[#AD56C4]/20 italic font-serif text-xs text-[#23152B]/85 relative">
            <Quote size={20} className="absolute -top-3 left-6 text-[#FF8DA1]/30" />
            "Finding a tutor who teaches English with high-convent conversational elegance rather than sterile school workbook drills was a miracle. My son went from absolute classroom hesitation to hosting his high school debate competition within nine months."
            <span className="block font-sans text-[10px] font-mono tracking-wider font-bold uppercase mt-2 text-[#AD56C4]">
              — Parent of Grade 9 ICSE Student, Kolkata
            </span>
          </div>

        </div>

        {/* ==================== STUDENT EXPERIENCE TRANSFORMATION ==================== */}
        <div className="bg-[#FAF7F2] border border-[#23152B]/10 rounded-[32px] p-8 md:p-12 mb-28 relative overflow-hidden">
          
          <div className="max-w-xl space-y-3 mb-10 text-left">
            <span className="text-[9px] font-mono tracking-widest text-[#AD56C4] font-bold uppercase">
              STUDENT METAMORPHOSIS
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-[#23152B]">
              The Lifecycle of a Shelly Sharma Student
            </h2>
            <p className="text-xs text-[#23152B]/60">
              A chronological view of how a quiet, self-conscious learner transforms into a commanding global voice.
            </p>
          </div>

          {/* Horizontal transformation cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl border border-red-100 space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold uppercase text-red-500 bg-red-50 px-2 py-0.5 rounded">
                  Phase 1: Entry
                </span>
                <span className="font-serif italic text-sm font-semibold text-red-400">Before Joining</span>
              </div>
              <h4 className="font-display font-bold text-sm text-[#23152B]">The Vocabulary Jail</h4>
              <p className="text-xs text-[#23152B]/70 leading-relaxed font-sans">
                The student knows vocabulary but is paralyzed by rules. They translate words silently in their head before speaking, resulting in choppy pauses and high social anxiety.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl border border-purple-100 space-y-3 text-left relative">
              {/* Connector line for desktop */}
              <div className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 z-10 text-[#AD56C4]">
                <ChevronRight size={20} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold uppercase text-[#AD56C4] bg-purple-50 px-2 py-0.5 rounded">
                  Phase 2: Practice
                </span>
                <span className="font-serif italic text-sm font-semibold text-[#AD56C4]">The Journey</span>
              </div>
              <h4 className="font-display font-bold text-sm text-[#23152B]">Vocal Liberation</h4>
              <p className="text-xs text-[#23152B]/70 leading-relaxed font-sans">
                Through interactive debates, Socratic drills, and phonetic games, the student starts speaking instantly. We gently adjust grammar rules as they find their voice.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl border border-emerald-100 space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Phase 3: Outcome
                </span>
                <span className="font-serif italic text-sm font-semibold text-emerald-500">The Confident Voice</span>
              </div>
              <h4 className="font-display font-bold text-sm text-[#23152B]">Articulate Command</h4>
              <p className="text-xs text-[#23152B]/70 leading-relaxed font-sans">
                The student expresses viewpoints spontaneously, pacing their voice with authentic rhythm, rich descriptive idioms, and a confident, poised stature.
              </p>
            </div>

          </div>
        </div>

        {/* ==================== ENDING CALL TO ACTION ==================== */}
        <div className="bg-gradient-to-br from-[#23152B] to-[#14081A] text-white rounded-[40px] p-8 md:p-16 border border-[#AD56C4]/30 shadow-2xl relative overflow-hidden text-center space-y-8">
          
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#AD56C4]/10 rounded-bl-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#FF8DA1]/10 rounded-tr-full pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <span className="text-[10px] font-mono tracking-widest text-[#FF8DA1] font-bold uppercase">
              EDUCATIONAL STEWARDSHIP
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
              Teaching with Purpose
            </h2>
            <p className="text-sm sm:text-base text-white/80 font-serif italic max-w-xl mx-auto leading-relaxed">
              "Every lesson is designed to help learners communicate with confidence, think independently, and succeed academically as well as professionally."
            </p>
            <p className="text-xs text-white/60 max-w-lg mx-auto">
              Our virtual cohorts are carefully curated to ensure peak high-touch standard. Register early to claim a seat in our upcoming scholastic slots.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4 relative z-10">
            <button
              onClick={onAcademyClick}
              className="px-8 py-4 bg-[#FF8DA1] hover:bg-white hover:text-[#23152B] text-white text-xs font-mono font-bold uppercase rounded-full shadow-lg transition-all duration-300 cursor-pointer flex items-center space-x-2.5 group"
            >
              <span>Explore the Academy</span>
              <ArrowRight size={13} className="text-[#23152B] group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onContactClick}
              className="px-8 py-4 bg-transparent border border-white/20 hover:border-white text-white text-xs font-mono font-bold uppercase rounded-full transition-all duration-300 cursor-pointer"
            >
              Consult with Shelly Sharma
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
              Chapter V — The Curriculum Model
            </h3>
            <p className="text-xs sm:text-sm text-[#23152B]/70 font-sans max-w-lg mx-auto leading-relaxed">
              Explore our structured interactive program levels, timing configurations, and student admission guidelines inside the virtual academy.
            </p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => onNavigateToPage?.("academy")}
              className="group px-8 py-4 bg-[#23152B] hover:bg-[#AD56C4] text-white text-xs font-mono font-bold uppercase rounded-full shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center space-x-3"
            >
              <span>Explore Academy Courses</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform text-[#FF8DA1]" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
