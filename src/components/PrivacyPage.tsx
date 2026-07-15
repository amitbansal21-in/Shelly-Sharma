import React from "react";
import { motion } from "motion/react";
import Breadcrumbs from "./Breadcrumbs";

interface PrivacyPageProps {
  onHomeClick: () => void;
}

export default function PrivacyPage({ onHomeClick }: PrivacyPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-4xl mx-auto px-6 py-12"
    >
      <Breadcrumbs items={[{ label: "Privacy Policy" }]} onHomeClick={onHomeClick} />

      <div className="space-y-8 text-[#23152B]/90">
        <div className="border-b border-[#AD56C4]/15 pb-6">
          <h1 className="font-display text-4xl font-bold text-[#AD56C4]">Academy Privacy Protocols</h1>
          <p className="text-xs font-mono text-[#23152B]/50 mt-2">Last Revised: July 2026</p>
        </div>

        <p className="text-sm sm:text-base leading-relaxed text-[#23152B]/85">
          Shelly Sharma Online English Academy operates under direct pedagogical privacy protocols designed to safeguard personal data, student identities, evaluation records, and lesson sheets submitted by parents and professional adult clients.
        </p>

        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#23152B]">1. Secure Data Channels</h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#23152B]/80">
              All personal names, educational history, student grades, email addresses, contact numbers, and invoice details submitted via enrollment forms are routed using TLS encryption. We never sell, lease, or distribute student details to third-party advertising or marketing portals.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#23152B]">2. Class Recording & Video Room Policies</h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#23152B]/80">
              Interactive video sessions, diagnostic level assessments, and grammar review meetings hosted on Google Meet or Zoom are locked to invited students. Lectures are never recorded, published, or shared online unless direct, explicit, written authorization has been signed by the adult client or parent guardian.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-[#23152B]">3. Google API Data Usage</h2>
            <p className="text-xs sm:text-sm leading-relaxed text-[#23152B]/80">
              Our scheduling automation coordinates directly with Google Calendar, Gmail, and Google Drive to manage booking links and files. This information is accessed solely to organize course calendars and learning resources in strict compliance with Google Developer Security Policies.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
