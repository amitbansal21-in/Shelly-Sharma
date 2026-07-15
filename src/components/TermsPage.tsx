import React from "react";
import { motion } from "motion/react";
import Breadcrumbs from "./Breadcrumbs";

interface TermsPageProps {
  onHomeClick: () => void;
}

export default function TermsPage({ onHomeClick }: TermsPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-4xl mx-auto px-6 py-12"
    >
      <Breadcrumbs items={[{ label: "Terms & Conditions" }]} onHomeClick={onHomeClick} />

      <div className="space-y-8 text-[#23152B]/90">
        <div className="border-b border-[#AD56C4]/15 pb-6">
          <h1 className="font-display text-4xl font-bold text-[#AD56C4]">Terms & Conditions of Service</h1>
          <p className="text-xs font-mono text-[#23152B]/50 mt-2">Last Revised: July 2026</p>
        </div>

        <p className="text-sm sm:text-base leading-relaxed text-[#23152B]/85">
          Welcome to the Shelly Sharma Online English Academy. By utilizing our learning worksheets, reserving class slots, or accessing resource drives, you agree to comply with the following institutional frameworks:
        </p>

        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#23152B]">1. Cohort Attendance & Cancellations</h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#23152B]/80">
              Class session times are locked before batch starts. Rescheduling of private 1-on-1 language coaching sessions requires a minimum 24-hour notice directly to Shelly Sharma. Classes missed without advance notification will be counted as completed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#23152B]">2. Intellectual Property & Curricula Copyrights</h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#23152B]/80">
              All workbook files, grammar cheat sheets, vocabulary tables, literature essay templates, and slide files distributed via Google Drive are protected copyright materials authored by Shelly Sharma. Re-distributing, duplicating, selling, or modifying these materials outside active academy cohorts is strictly prohibited.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#23152B]">3. Classroom Ethics & Code of Conduct</h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#23152B]/80">
              We cultivate a encouraging, positive, and polite space for language learners. Continual disturbance, inappropriate behavior, or offensive language inside spelling circles and mock interview debates will result in immediate cohort cancellation without fee refunds.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
