import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Clock, Calendar, ArrowRight, BookOpen, Share2 } from "lucide-react";
import { blogPosts } from "../data";
import { BlogPostItem } from "../types";
import Breadcrumbs from "./Breadcrumbs";

interface BlogPageProps {
  onHomeClick: () => void;
  onNavigateToPage?: (page: string) => void;
}

export default function BlogPage({ onHomeClick, onNavigateToPage }: BlogPageProps) {
  const [selectedPost, setSelectedPost] = useState<BlogPostItem | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-7xl mx-auto px-6 lg:px-12 py-12"
    >
      <AnimatePresence mode="wait">
        {!selectedPost ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Breadcrumbs items={[{ label: "Strategy Insights" }]} onHomeClick={onHomeClick} />

            {/* Header following the Global Website Rule */}
            <div className="max-w-3xl space-y-6 mb-16 text-left">
              
              {/* 1. Small Label */}
              <div className="inline-flex items-center space-x-2 bg-white/90 border border-[#AD56C4]/15 px-4 py-1.5 rounded-full text-[10px] font-mono font-bold text-[#AD56C4] shadow-sm tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF8DA1] animate-pulse" />
                <span>Chapter V — Strategy Insights</span>
              </div>

              {/* 2. Emotional Page Title */}
              <div className="space-y-3">
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#23152B] leading-none">
                  Pillar Strategies, Grammar Clinics & Study Guides
                </h1>
              </div>

              {/* 3. Inspirational Quote */}
              <blockquote className="text-sm sm:text-base text-[#23152B]/90 leading-relaxed font-serif italic border-l-3 border-[#FF8DA1] pl-6 py-1">
                "To write is to carve one's intellect into permanent, crystalline structures of communication."
              </blockquote>

              {/* 4. Short Story Introduction */}
              <div className="space-y-4 text-xs sm:text-sm text-[#23152B]/75 leading-relaxed font-sans max-w-2xl">
                <p>
                  True mentorship is not guarded behind high paywalls—it must be shared with the broader community to elevate our collective literacy standards. These articles offer comprehensive, rigorous lesson logs, common pronunciation solutions, and board exam guides curated straight from Shelly's daily teaching logs.
                </p>
              </div>
            </div>

            {/* 5. Signature Visual (Prestige Crystalline Inkwell Visual) */}
            <div className="mb-16">
              <div className="relative max-w-4xl mx-auto bg-gradient-to-br from-[#23152B] to-[#1F0F26] rounded-[32px] p-8 overflow-hidden border border-[#AD56C4]/20 shadow-xl text-center md:text-left">
                {/* Decorative background glows */}
                <div className="absolute top-[-50%] right-[-10%] w-80 h-80 bg-[#AD56C4]/15 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-[-50%] left-[-10%] w-80 h-80 bg-[#FF8DA1]/10 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  {/* SVG Crystalline Inkwell Emblem */}
                  <div className="md:col-span-3 flex justify-center">
                    <div className="relative w-28 h-28 bg-[#FAF7F2] rounded-full border-2 border-[#FF8DA1]/30 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-500">
                      <div className="absolute inset-2 rounded-full border border-dashed border-[#AD56C4]/30" />
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-[#23152B]">
                        {/* Crystalline Inkwell / Book */}
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" className="stroke-[#AD56C4]" strokeWidth="1.5" />
                        <path d="M6 6h10" className="stroke-[#FF8DA1]" />
                        <path d="M6 10h10" className="stroke-[#AD56C4]" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Explanation & Inkwell Text */}
                  <div className="md:col-span-9 space-y-3">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-[#FF8DA1] font-bold">Unforgettable Visual Identity</span>
                    <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">The Crystalline Inkwell of Insight</h2>
                    <p className="text-xs text-white/75 leading-relaxed max-w-2xl">
                      Sharing clinical literature guides, IELTS patterns, and advanced English worksheets to standardize classroom excellence. Each entry serves as a reference manual for rigorous self-assessment.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Main Content (Articles Grid Title) */}
            <h2 className="text-xs font-mono font-bold tracking-widest uppercase text-[#FF8DA1] mb-8">
              Pillar Strategies & Guides
            </h2>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
              {blogPosts.map((post, idx) => (
                <article
                  key={idx}
                  onClick={() => {
                    setSelectedPost(post);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="bg-[#FAFAFA] border border-[#AD56C4]/15 rounded-[32px] p-6 hover:shadow-2xl hover:shadow-[#AD56C4]/10 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group cursor-pointer overflow-hidden"
                >
                  <div className="space-y-4">
                    {post.image && (
                      <div className="w-full h-44 overflow-hidden rounded-[20px] relative mb-2">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#23152B]/20 via-transparent to-transparent pointer-events-none" />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono tracking-wider text-[#AD56C4] bg-[#AD56C4]/10 px-2.5 py-1 rounded-full uppercase font-bold">
                        {post.category}
                      </span>
                      <span className="text-[10px] font-mono text-[#23152B]/50 font-semibold">
                        {post.readTime}
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-bold text-[#23152B] group-hover:text-[#AD56C4] transition-colors duration-200 leading-snug">
                      {post.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#23152B]/75 leading-relaxed">
                      {post.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-[#AD56C4]/10 flex items-center justify-between text-xs font-semibold text-[#23152B]/60">
                    <span className="flex items-center space-x-1 font-mono">
                      <Calendar size={12} className="text-[#FF8DA1]" />
                      <span>{post.date}</span>
                    </span>
                    <span className="text-[#AD56C4] flex items-center space-x-1 font-bold">
                      <span>Read Guide</span>
                      <ArrowRight size={14} className="transform group-hover:translate-x-1.5 transition-transform duration-300" />
                    </span>
                  </div>
                </article>
              ))}
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
          </motion.div>
        ) : (
          <motion.div
            key="reader"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto py-4"
          >
            {/* Breadcrumbs for Reader View */}
            <Breadcrumbs
              items={[
                { label: "Strategy Insights", onClick: () => setSelectedPost(null) },
                { label: selectedPost.title }
              ]}
              onHomeClick={onHomeClick}
            />

            {/* Back Button */}
            <button
              onClick={() => setSelectedPost(null)}
              className="inline-flex items-center space-x-2 text-xs font-bold text-[#AD56C4] hover:text-[#FF8DA1] transition-colors duration-200 mb-8 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to Strategy Guides</span>
            </button>

            {/* Core Blog Content */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 text-xs font-mono text-[#AD56C4]">
                <span className="bg-[#AD56C4]/10 px-2.5 py-1 rounded-full uppercase font-bold">
                  {selectedPost.category}
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Clock size={12} />
                  <span>{selectedPost.readTime}</span>
                </span>
                <span>•</span>
                <span>{selectedPost.date}</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#23152B] leading-tight">
                {selectedPost.title}
              </h1>

              {/* Author bio row */}
              <div className="flex items-center space-x-3 py-6 border-t border-b border-[#AD56C4]/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#AD56C4] to-[#FF8DA1] flex items-center justify-center text-white font-bold text-sm">
                  SS
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#23152B] uppercase font-mono">Authored by Shelly Sharma</h4>
                  <p className="text-[11px] text-[#23152B]/60 font-semibold">Certified Language Architect & Academy Founder</p>
                </div>
              </div>

              {/* Rich Body Content */}
              <div className="text-[#23152B]/90 text-sm sm:text-base leading-relaxed space-y-6 pt-6 whitespace-pre-line font-serif">
                {selectedPost.content || selectedPost.description}
              </div>

              {/* Callout box inside article */}
              <div className="mt-12 bg-[#FAFAFA] border border-[#AD56C4]/15 rounded-3xl p-8 space-y-4">
                <div className="flex items-center space-x-2 text-[#AD56C4]">
                  <BookOpen size={20} />
                  <h3 className="font-display text-lg font-bold text-[#23152B]">
                    Want custom worksheets and exercises?
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#23152B]/80 leading-relaxed">
                  Shelly Sharma Online English Academy cohorts study using original, comprehensive worksheet sets mapping standard board criteria, corporate vocabulary files, and interactive speaking logs. Request a consultation call to get started.
                </p>
                <button
                  onClick={onHomeClick}
                  className="px-6 py-3 bg-[#AD56C4] hover:bg-[#FF8DA1] text-white text-xs font-mono font-bold rounded-full transition-all duration-300 cursor-pointer flex items-center space-x-2"
                >
                  <span>Return to Academy Home</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
