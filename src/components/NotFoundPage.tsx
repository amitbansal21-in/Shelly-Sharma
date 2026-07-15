import React from "react";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import Breadcrumbs from "./Breadcrumbs";

interface NotFoundPageProps {
  onHomeClick: () => void;
}

export default function NotFoundPage({ onHomeClick }: NotFoundPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-4xl mx-auto px-6 py-24 text-center space-y-6"
    >
      <Breadcrumbs items={[{ label: "Sitemap Node Error" }]} onHomeClick={onHomeClick} />

      <div className="space-y-4">
        <span className="font-mono text-8xl font-extrabold text-[#AD56C4]">404</span>
        <h1 className="font-display text-3xl font-bold text-[#23152B]">Syllabus Path Not Found</h1>
        <p className="text-sm sm:text-base text-[#23152B]/70 max-w-md mx-auto leading-relaxed">
          The requested classroom, guide file, or sitemap link does not exist. It may have been moved or updated to align with our latest curriculum format.
        </p>
      </div>

      <button
        onClick={onHomeClick}
        className="px-6 py-3 bg-[#AD56C4] hover:bg-[#FF8DA1] text-white text-xs font-mono font-bold rounded-full transition-all duration-300 cursor-pointer inline-flex items-center space-x-2 shadow-md"
      >
        <ArrowLeft size={14} />
        <span>Return to Academy Home</span>
      </button>
    </motion.div>
  );
}
