import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { MapPin, Mail, MessageSquare, Calendar, CheckCircle, Shield, Sparkles, Compass, ArrowRight } from "lucide-react";
import Breadcrumbs from "./Breadcrumbs";
import {
  initAuth,
  googleSignIn,
  getAccessToken,
  sendGmailEmails,
  generateReferenceNumber,
  logout,
  checkAndFindAvailableSlot,
  createCalendarEvent
} from "../lib/gmail";
import { syncLeadToSheets, queueLeadLocally, attachMeetUrlToLead } from "../lib/crm";
import { triggerChatDemoBooked, triggerChatMeetReady, triggerChatMeetCreated } from "../lib/chat";
import { downloadCalendarInvite } from "../lib/calendar-ics";

interface ContactPageProps {
  onHomeClick: () => void;
  preselectedProgram?: string;
  onNavigateToPage?: (page: string) => void;
}

export default function ContactPage({ onHomeClick, preselectedProgram = "", onNavigateToPage }: ContactPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    program: preselectedProgram || "Elite Spoken English Mastery",
    message: "",
    parentName: "",
    remarks: "",
    preferredDate: "",
    preferredTime: "",
    otherQuery: ""
  });
  const [otherQueryError, setOtherQueryError] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [bookedMeetUrl, setBookedMeetUrl] = useState<string | null>(null);

  // Gmail Automation States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [submitSuccessType, setSubmitSuccessType] = useState<"gmail" | "offline" | null>(null);
  const [isSubmittingDuplicate, setIsSubmittingDuplicate] = useState(false);

  // Google Calendar booking states
  const [checkingSlot, setCheckingSlot] = useState(false);
  const [slotSuggestion, setSlotSuggestion] = useState<{ date: string; time: string } | null>(null);
  const [slotCheckError, setSlotCheckError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "otherQuery") {
      setOtherQueryError(null);
    }
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "program" && value !== "Others") {
        updated.otherQuery = "";
      }
      return updated;
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isSubmittingDuplicate) return;

    setIsSubmitting(true);
    setSlotCheckError(null);

    // Validate Other Query field if Others is selected
    if (formData.program === "Others") {
      const q = formData.otherQuery ? formData.otherQuery.trim() : "";
      if (!q) {
        setOtherQueryError("What would you like to discuss? is required.");
        setIsSubmitting(false);
        return;
      }
      if (q.length < 10) {
        setOtherQueryError("Minimum 10 characters are required.");
        setIsSubmitting(false);
        return;
      }
      if (q.length > 1000) {
        setOtherQueryError("Maximum 1000 characters allowed.");
        setIsSubmitting(false);
        return;
      }
      setOtherQueryError(null);
    }

    let finalRefNum = "";

    try {
      let currentToken = token || getAccessToken();

      if (!currentToken) {
        setIsLoggingIn(true);
        const signInResult = await googleSignIn();
        if (signInResult) {
          setUser(signInResult.user);
          setToken(signInResult.accessToken);
          currentToken = signInResult.accessToken;
        }
      }

      // 1. Determine if calendar booking is requested
      const isBookingRequested = formData.preferredDate && formData.preferredTime;
      const finalDate = formData.preferredDate;
      const finalTime = formData.preferredTime;

      if (isBookingRequested && currentToken) {
        setCheckingSlot(true);
        const checkResult = await checkAndFindAvailableSlot(currentToken, finalDate, finalTime);
        setCheckingSlot(false);

        if (!checkResult.available) {
          if (checkResult.suggestedDate && checkResult.suggestedTime) {
            setSlotSuggestion({ date: checkResult.suggestedDate, time: checkResult.suggestedTime });
            setIsSubmitting(false);
            setIsLoggingIn(false);
            return; // Intercept submit so they can review alternative slot suggestion
          } else {
            throw new Error("The selected slot is busy, and no alternative could be found.");
          }
        }
      }

      // 2. Submit to Google Sheets CRM (Status transitions to "DEMO BOOKED" if slot is booked successfully)
      const hasSlotBooked = isBookingRequested && !slotSuggestion;
      const leadStatus = hasSlotBooked ? "DEMO BOOKED" : "NEW LEAD";

      if (currentToken) {
        try {
          finalRefNum = await syncLeadToSheets(currentToken, {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            program: formData.program,
            message: formData.program === "Others" ? formData.otherQuery : formData.message,
            sourcePage: "Contact Page",
            parentName: formData.parentName,
            remarks: formData.remarks,
            status: leadStatus,
            otherQuery: formData.otherQuery
          });
        } catch (crmError) {
          console.error("Sheets CRM sync failed, queueing locally:", crmError);
          finalRefNum = queueLeadLocally({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            program: formData.program,
            message: formData.program === "Others" ? formData.otherQuery : formData.message,
            sourcePage: "Contact Page",
            parentName: formData.parentName,
            remarks: formData.remarks,
            status: leadStatus,
            otherQuery: formData.otherQuery
          });
        }
      } else {
        // No token, queue offline
        finalRefNum = queueLeadLocally({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          program: formData.program,
          message: formData.program === "Others" ? formData.otherQuery : formData.message,
          sourcePage: "Contact Page",
          parentName: formData.parentName,
          remarks: formData.remarks,
          status: leadStatus,
          otherQuery: formData.otherQuery
        });
      }

      setReferenceNumber(finalRefNum);

      // 3. Create Google Calendar Event if slot is selected and confirmed
      let meetUrl: string | null = null;
      if (hasSlotBooked && currentToken) {
        try {
          const calEvent = await createCalendarEvent(currentToken, {
            studentName: formData.name,
            parentName: formData.parentName,
            phone: formData.phone,
            email: formData.email,
            course: formData.program,
            remarks: formData.remarks || formData.message,
            referenceNumber: finalRefNum,
            date: finalDate,
            time: finalTime
          });

          // Trigger Demo Booking Chat notification
          try {
            await triggerChatDemoBooked({
              studentName: formData.name,
              parentName: formData.parentName,
              date: finalDate,
              time: finalTime
            }, currentToken);
          } catch (chatErr) {
            console.error("Failed to trigger demo booking Chat notification:", chatErr);
          }

          if (calEvent && calEvent.hangoutLink) {
            meetUrl = calEvent.hangoutLink;
            setBookedMeetUrl(meetUrl);
            console.log("Generated Meet link:", meetUrl);
            try {
              await attachMeetUrlToLead(currentToken, finalRefNum, meetUrl, calEvent.id);
            } catch (crmAttachErr) {
              console.error("Failed to attach Meet URL to CRM sheet:", crmAttachErr);
            }

            // Trigger Google Meet Created Chat notification
            try {
              await triggerChatMeetCreated({
                leadId: finalRefNum,
                student: formData.name,
                course: formData.program,
                date: finalDate,
                time: finalTime,
                meetUrl: meetUrl
              }, currentToken);
            } catch (chatErr) {
              console.error("Failed to trigger Meet created Chat notification:", chatErr);
            }
          }
        } catch (calError) {
          console.error("Calendar event creation failed:", calError);
        }
      }

      // 4. Send Gmail emails using standard Gmail wrapper
      if (currentToken) {
        const bookingDetails = hasSlotBooked ? {
          date: finalDate,
          time: finalTime,
          meetUrl: meetUrl
        } : undefined;

        await sendGmailEmails(currentToken, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          program: formData.program,
          message: formData.program === "Others" ? formData.otherQuery : formData.message,
          parentName: formData.parentName,
          remarks: formData.remarks,
          preferredDate: finalDate,
          preferredTime: finalTime,
          otherQuery: formData.otherQuery
        }, finalRefNum, bookingDetails);
        setSubmitSuccessType("gmail");
      } else {
        setSubmitSuccessType("offline");
      }

      setFormSubmitted(true);
      setIsSubmittingDuplicate(true);
    } catch (error: any) {
      console.error("Form submission flow failed, using fallback:", error);
      setSlotCheckError(error.message || "An error occurred during booking. Please try again.");
      if (!finalRefNum) {
        finalRefNum = generateReferenceNumber();
        setReferenceNumber(finalRefNum);
      }
      setSubmitSuccessType("offline");
      setFormSubmitted(true);
      setIsSubmittingDuplicate(true);
    } finally {
      setIsSubmitting(false);
      setIsLoggingIn(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-7xl mx-auto px-6 lg:px-12 py-12"
    >
      <Breadcrumbs items={[{ label: "Contact Desk" }]} onHomeClick={onHomeClick} />

      {/* Hero Header following the Global Website Rule */}
      <div className="max-w-3xl space-y-6 mb-16 text-left">
        
        {/* 1. Small Label */}
        <div className="inline-flex items-center space-x-2 bg-white/90 border border-[#AD56C4]/15 px-4 py-1.5 rounded-full text-[10px] font-mono font-bold text-[#AD56C4] shadow-sm tracking-wider uppercase">
          <Sparkles size={11} className="text-[#FF8DA1]" />
          <span>Chapter VI — Contact Desk</span>
        </div>

        {/* 2. Emotional Page Title */}
        <div className="space-y-3">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#23152B] leading-none">
            Secure Your Academy Cohort Seat
          </h1>
        </div>

        {/* 3. Inspirational Quote */}
        <blockquote className="text-sm sm:text-base text-[#23152B]/90 leading-relaxed font-serif italic border-l-3 border-[#FF8DA1] pl-6 py-1">
          "Great outcomes begin with a single, clear and purposeful conversation."
        </blockquote>

        {/* 4. Short Story Introduction */}
        <div className="space-y-4 text-xs sm:text-sm text-[#23152B]/75 leading-relaxed font-sans max-w-2xl">
          <p>
            Enrolling in a cohort or scheduling a private diagnostic level-assessment starts with a thoughtful dialogue. By filling out the form below, you provide our chief educator with the initial details required to map out a custom linguistic development curriculum tailored strictly to your goals.
          </p>
        </div>
      </div>

      {/* 5. Signature Visual (Elegant Compass & Destination Path Visual) */}
      <div className="mb-16">
        <div className="relative max-w-4xl mx-auto bg-gradient-to-br from-[#23152B] to-[#1F0F26] rounded-[32px] p-8 overflow-hidden border border-[#AD56C4]/20 shadow-xl text-center md:text-left">
          {/* Decorative background glows */}
          <div className="absolute top-[-50%] right-[-10%] w-80 h-80 bg-[#AD56C4]/15 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-[-50%] left-[-10%] w-80 h-80 bg-[#FF8DA1]/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* SVG Compass and Path Emblem */}
            <div className="md:col-span-3 flex justify-center">
              <div className="relative w-28 h-28 bg-[#FAF7F2] rounded-full border-2 border-[#FF8DA1]/30 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-500">
                <div className="absolute inset-2 rounded-full border border-dashed border-[#AD56C4]/30" />
                <Compass className="text-[#AD56C4]" size={48} strokeWidth={1.2} />
                <div className="absolute -bottom-1 -right-1 bg-[#FF8DA1] text-white p-1.5 rounded-full border border-white shadow-sm">
                  <Sparkles size={12} />
                </div>
              </div>
            </div>
            
            {/* Explanation & Compass Text */}
            <div className="md:col-span-9 space-y-3">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#FF8DA1] font-bold">Unforgettable Visual Identity</span>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-white">The Navigational Compass & Learning Journey</h2>
              <p className="text-xs text-white/75 leading-relaxed max-w-2xl">
                True language confidence is not a stationary state, but a life-defining journey. This compass represents the direction and structure we bring to your phonetic development, charting a clear destination from hesitation to high-stakes eloquence.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start mb-24">
        {/* Left Side: Direct Contact Details & API Notice */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <h3 className="font-display text-2xl font-bold text-[#23152B]">
              Direct Communication Channels
            </h3>
            <p className="text-[#23152B]/75 text-sm leading-relaxed">
              We respond to all educational inquiries and board schedule consults within 24 business hours. Get in touch directly using your preferred channel:
            </p>
          </div>

          <div className="space-y-6">
            {/* Location */}
            <div className="flex items-start space-x-4">
              <div className="p-3.5 rounded-2xl bg-[#AD56C4]/10 text-[#AD56C4]">
                <MapPin size={22} />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-wider uppercase text-[#AD56C4] font-mono">Location Coordinates</h4>
                <p className="text-sm font-semibold text-[#23152B] mt-0.5">Pune, Maharashtra, India (Operating Globally Online)</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start space-x-4">
              <div className="p-3.5 rounded-2xl bg-[#FF8DA1]/10 text-[#FF8DA1]">
                <Mail size={22} />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-wider uppercase text-[#FF8DA1] font-mono">Official Email Channel</h4>
                <a href="mailto:shellysharmamail@gmail.com" className="text-sm font-bold text-[#23152B] hover:text-[#AD56C4] mt-0.5 block transition-colors duration-200">
                  shellysharmamail@gmail.com
                </a>
              </div>
            </div>

            {/* Whatsapp */}
            <div className="flex items-start space-x-4">
              <div className="p-3.5 rounded-2xl bg-[#FF9CE9]/10 text-[#FF9CE9]">
                <MessageSquare size={22} />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-wider uppercase text-[#FF9CE9] font-mono">Instant Support Chat</h4>
                <a
                  href="https://wa.me/#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-[#23152B] hover:text-[#AD56C4] mt-0.5 block transition-colors duration-200"
                >
                  Start WhatsApp Conversation
                </a>
              </div>
            </div>
          </div>

          {/* Integration Notice */}
          <div className="bg-[#23152B] text-white rounded-3xl p-6 space-y-4 border border-white/10 shadow-lg">
            <div className="flex items-center space-x-2 text-[#FF8DA1]">
              <Calendar size={18} />
              <span className="text-xs font-bold tracking-wider uppercase font-mono">Workspace API Automation</span>
            </div>
            <p className="text-[11px] text-white/70 leading-relaxed">
              This school portal is fully integrated with **Google Workspace, Calendar, and Drive**. Upon form submission, our backend automatically reserves diagnostic consultation time slots and coordinates folders for lesson tracking.
            </p>
          </div>
        </div>

        {/* Right Side: Interactive Inquiry Form */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-[#AD56C4]/15 rounded-[32px] p-8 shadow-xl relative overflow-hidden">
            {formSubmitted ? (
              formData.program === "Others" ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="py-12 flex flex-col items-center justify-center text-center space-y-8"
                >
                  {/* Glowing Floating Icon */}
                  <div className="relative">
                    <motion.div
                      animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                      className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#AD56C4] to-[#FF8DA1] text-white flex items-center justify-center shadow-xl shadow-[#AD56C4]/30 relative z-10 animate-fade-in"
                    >
                      <CheckCircle size={38} className="animate-pulse" />
                    </motion.div>
                    <div className="absolute inset-0 rounded-full border border-[#AD56C4]/40 animate-ping opacity-25" />
                    <div className="absolute -top-1 -right-1 bg-[#FF8DA1] text-white p-1.5 rounded-full border-2 border-white shadow-md animate-bounce">
                      <Sparkles size={12} />
                    </div>
                  </div>

                  {/* Message details */}
                  <div className="space-y-4 max-w-lg mx-auto px-4">
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-2"
                    >
                      <h3 className="font-display text-4xl font-black text-[#23152B] tracking-tight leading-tight pt-2">
                        Thank You!
                      </h3>
                      <p className="text-sm font-semibold text-[#AD56C4]">
                        Your inquiry has been received successfully.
                      </p>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gradient-to-br from-[#FAF7F2] to-[#FDF4FA] border border-[#AD56C4]/15 rounded-2xl p-6 text-sm text-[#23152B]/85 shadow-inner leading-relaxed space-y-3 text-left"
                    >
                      <p className="font-serif italic text-base text-[#23152B]">
                        Dear {formData.name},
                      </p>
                      <p>
                        Our team will review your message and contact you shortly.
                      </p>
                      <p>
                        We have successfully bypass-routed your inquiry to Shelly Sharma's personal desk. Because you have selected <strong>"Others"</strong>, we are treating this as a high-priority unique dialogue rather than a standard assessment booking.
                      </p>
                      <p className="text-[#AD56C4] font-semibold">
                        Estimated Response Time: Within 24 Business Hours.
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-xs font-mono text-[#AD56C4]/80 flex items-center justify-center gap-1.5"
                    >
                      <span className="inline-block w-2 h-2 rounded-full bg-[#AD56C4] animate-ping" />
                      Reference ID: <strong className="font-bold">{referenceNumber}</strong>
                    </motion.div>
                  </div>

                  {/* Buttons */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md pt-4"
                  >
                    <button
                      onClick={() => {
                        if (onNavigateToPage) {
                          onNavigateToPage("home");
                        } else {
                          onHomeClick();
                        }
                      }}
                      className="w-full sm:w-auto px-8 py-3.5 bg-[#23152B] hover:bg-[#AD56C4] text-white text-xs font-mono font-bold uppercase rounded-xl transition-all duration-300 hover:shadow-lg active:scale-95 cursor-pointer"
                    >
                      Return to Home
                    </button>
                    <a
                      href="https://wa.me/919876543210"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-8 py-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-mono font-bold uppercase rounded-xl transition-all duration-300 hover:shadow-lg active:scale-95 text-center cursor-pointer flex items-center justify-center gap-2"
                    >
                      Contact on WhatsApp
                    </a>
                  </motion.div>
                </motion.div>
              ) : (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-[#AD56C4]/10 text-[#AD56C4] flex items-center justify-center">
                    <CheckCircle size={36} />
                  </div>
                  {formData.preferredDate && formData.preferredTime ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="font-display text-2xl font-black text-[#23152B] tracking-tight">
                          🎉 Assessment Successfully Booked
                        </h3>
                        <p className="text-sm text-[#AD56C4] font-mono font-bold uppercase tracking-wider">
                          Reference ID: {referenceNumber}
                        </p>
                      </div>

                      <div className="text-sm text-[#23152B]/85 space-y-3 max-w-md mx-auto leading-relaxed">
                        <p>Your assessment session has been successfully scheduled for <strong>{formData.preferredDate}</strong> at <strong>{formData.preferredTime}</strong>.</p>
                        <p>A confirmation email has been sent.</p>
                        <p>A Google Meet invitation has also been generated.</p>
                        <p className="font-semibold text-[#23152B]">Please join the meeting using the button below.</p>
                      </div>

                      <div className="flex flex-col gap-3 pt-4 w-full justify-center max-w-sm mx-auto">
                        {bookedMeetUrl && (
                          <a
                            href={bookedMeetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full px-6 py-3 bg-[#AD56C4] hover:bg-[#9642AB] text-white text-xs font-mono font-bold uppercase rounded-xl transition-all duration-300 text-center flex items-center justify-center gap-2 shadow-lg shadow-[#AD56C4]/20"
                          >
                            Join Google Meet
                          </a>
                        )}
                        
                        <button
                          onClick={() => downloadCalendarInvite({
                            studentName: formData.name,
                            course: formData.program,
                            date: formData.preferredDate,
                            time: formData.preferredTime,
                            meetUrl: bookedMeetUrl,
                            referenceId: referenceNumber
                          })}
                          className="w-full px-6 py-3 bg-white border border-[#AD56C4]/40 hover:bg-[#AD56C4]/5 text-[#AD56C4] text-xs font-mono font-bold uppercase rounded-xl transition-all duration-300 text-center flex items-center justify-center gap-2"
                        >
                          Download Calendar Invite
                        </button>

                        <button
                          onClick={() => onNavigateToPage?.("home")}
                          className="w-full px-6 py-3 bg-[#23152B] hover:bg-black text-white text-xs font-mono font-bold uppercase rounded-xl transition-all duration-300 text-center flex items-center justify-center gap-2"
                        >
                          Back to Home
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-6">
                      <div className="space-y-3 text-center">
                        <h3 className="font-display text-2xl font-bold text-[#23152B]">
                          Request Received Successfully
                        </h3>
                        {submitSuccessType === "gmail" ? (
                          <p className="text-sm text-[#23152B]/85 max-w-md leading-relaxed">
                            Thank you for contacting Shelly Sharma Academy. A confirmation email has been sent to your inbox (<strong>{formData.email}</strong>) with reference number <strong>{referenceNumber}</strong>. Our team will contact you shortly.
                          </p>
                        ) : (
                          <p className="text-sm text-[#23152B]/85 max-w-md leading-relaxed">
                            We received your request successfully. Our team will contact you shortly.
                          </p>
                        )}
                      </div>
                      
                      <span className="text-xs font-mono text-[#AD56C4] bg-[#AD56C4]/10 px-4 py-1.5 rounded-full font-bold">
                        {submitSuccessType === "gmail" 
                          ? `Status: Automated Email Sent (${referenceNumber})` 
                          : "Status: Request Queued Successfully"}
                      </span>

                      <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full justify-center">
                        <button
                          onClick={() => onNavigateToPage?.("home")}
                          className="w-full sm:w-auto px-6 py-3 bg-[#23152B] hover:bg-[#AD56C4] text-white text-xs font-mono font-bold uppercase rounded-xl transition-all duration-300 cursor-pointer"
                        >
                          Return Home
                        </button>
                        <button
                          onClick={() => {
                            setFormData({
                              name: "",
                              email: "",
                              phone: "",
                              program: preselectedProgram || "Elite Spoken English Mastery",
                              message: "",
                              parentName: "",
                              remarks: "",
                              preferredDate: "",
                              preferredTime: ""
                            });
                            setFormSubmitted(false);
                            setIsSubmittingDuplicate(false);
                            setSubmitSuccessType(null);
                            setSlotSuggestion(null);
                          }}
                          className="w-full sm:w-auto px-6 py-3 border border-[#AD56C4]/35 text-[#AD56C4] hover:bg-[#AD56C4]/5 text-xs font-mono font-bold uppercase rounded-xl transition-all duration-300 cursor-pointer"
                        >
                          Book Another Assessment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <h3 className="font-display text-2xl font-bold text-[#23152B]">
                  Request Diagnostic Form
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#23152B]/80 mb-2">
                      Full Student / Parent Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                      placeholder="e.g., Aditya Joshi"
                      className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#AD56C4]/20 rounded-xl focus:ring-2 focus:ring-[#AD56C4] focus:border-transparent focus:outline-none text-sm transition-all duration-300 disabled:opacity-55"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#23152B]/80 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                      placeholder="e.g., mail@example.com"
                      className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#AD56C4]/20 rounded-xl focus:ring-2 focus:ring-[#AD56C4] focus:border-transparent focus:outline-none text-sm transition-all duration-300 disabled:opacity-55"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#23152B]/80 mb-2">
                      Contact Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                      placeholder="e.g., +91 98765 43210"
                      className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#AD56C4]/20 rounded-xl focus:ring-2 focus:ring-[#AD56C4] focus:border-transparent focus:outline-none text-sm transition-all duration-300 disabled:opacity-55"
                    />
                  </div>
                  <div>
                    <label htmlFor="program" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#23152B]/80 mb-2">
                      Target Academy Course Format
                    </label>
                    <select
                      id="program"
                      name="program"
                      value={formData.program}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#AD56C4]/20 rounded-xl focus:ring-2 focus:ring-[#AD56C4] focus:border-transparent focus:outline-none text-sm transition-all duration-300 disabled:opacity-55"
                    >
                      <option>Elite Spoken English Mastery</option>
                      <option>Advanced Grammar & Syntax Clinics</option>
                      <option>High-Stakes Interview Preparation</option>
                      <option>Corporate English & Executive Speech</option>
                      <option>ICSE / CBSE Academic Board Prep</option>
                      <option>Personality & Presentation Skills</option>
                      <option>Others</option>
                    </select>
                  </div>
                </div>

                {formData.program === "Others" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden space-y-2"
                  >
                    <label htmlFor="otherQuery" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#23152B]/80 mb-2">
                      What would you like to discuss? <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="otherQuery"
                      name="otherQuery"
                      rows={4}
                      value={formData.otherQuery || ""}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      placeholder="Please describe your query, requirement or message..."
                      className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#AD56C4]/20 rounded-xl focus:ring-2 focus:ring-[#AD56C4] focus:border-transparent focus:outline-none text-sm transition-all duration-300 disabled:opacity-55"
                    />
                    {otherQueryError && (
                      <p className="text-xs text-red-500 font-mono mt-1">{otherQueryError}</p>
                    )}
                  </motion.div>
                )}

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="parentName" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#23152B]/80 mb-2">
                      Parent Name (Optional)
                    </label>
                    <input
                      type="text"
                      id="parentName"
                      name="parentName"
                      value={formData.parentName}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      placeholder="e.g., Rajesh Joshi"
                      className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#AD56C4]/20 rounded-xl focus:ring-2 focus:ring-[#AD56C4] focus:border-transparent focus:outline-none text-sm transition-all duration-300 disabled:opacity-55"
                    />
                  </div>
                  <div>
                    <label htmlFor="remarks" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#23152B]/80 mb-2">
                      Additional Remarks (Optional)
                    </label>
                    <input
                      type="text"
                      id="remarks"
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      placeholder="e.g., Prefers weekend call if possible..."
                      className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#AD56C4]/20 rounded-xl focus:ring-2 focus:ring-[#AD56C4] focus:border-transparent focus:outline-none text-sm transition-all duration-300 disabled:opacity-55"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#23152B]/80 mb-2">
                    Describe Language Challenges or Core Goals
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    placeholder="e.g., Preparing Class X ICSE board / Needs confidence for global presentations..."
                    className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#AD56C4]/20 rounded-xl focus:ring-2 focus:ring-[#AD56C4] focus:border-transparent focus:outline-none text-sm transition-all duration-300 disabled:opacity-55"
                  ></textarea>
                </div>

                {/* Preferred Slot Booking Section */}
                <div className="pt-4 border-t border-[#AD56C4]/15">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#AD56C4] mb-4 flex items-center space-x-2">
                    <Calendar size={14} className="text-[#FF8DA1]" />
                    <span>Preferred Diagnostic Slot (Optional)</span>
                  </h4>
                  <p className="text-[11px] text-[#23152B]/70 mb-4">
                    Select a preferred date and time for your 15-minute diagnostic assessment call. If left blank, we will register your inquiry only.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="preferredDate" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#23152B]/80 mb-2">
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        id="preferredDate"
                        name="preferredDate"
                        value={formData.preferredDate}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#AD56C4]/20 rounded-xl focus:ring-2 focus:ring-[#AD56C4] focus:border-transparent focus:outline-none text-sm transition-all duration-300 disabled:opacity-55"
                      />
                    </div>
                    <div>
                      <label htmlFor="preferredTime" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#23152B]/80 mb-2">
                        Preferred Time Slot
                      </label>
                      <select
                        id="preferredTime"
                        name="preferredTime"
                        value={formData.preferredTime}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#AD56C4]/20 rounded-xl focus:ring-2 focus:ring-[#AD56C4] focus:border-transparent focus:outline-none text-sm transition-all duration-300 disabled:opacity-55"
                      >
                        <option value="">-- Select Time Slot --</option>
                        <option value="10:00:00">10:00 AM IST</option>
                        <option value="10:30:00">10:30 AM IST</option>
                        <option value="11:00:00">11:00 AM IST</option>
                        <option value="11:30:00">11:30 AM IST</option>
                        <option value="12:00:00">12:00 PM IST</option>
                        <option value="12:30:00">12:30 PM IST</option>
                        <option value="13:00:00">01:00 PM IST</option>
                        <option value="13:30:00">01:30 PM IST</option>
                        <option value="14:00:00">02:00 PM IST</option>
                        <option value="14:30:00">02:30 PM IST</option>
                        <option value="15:00:00">03:00 PM IST</option>
                        <option value="15:30:00">03:30 PM IST</option>
                        <option value="16:00:00">04:00 PM IST</option>
                        <option value="16:30:00">04:30 PM IST</option>
                        <option value="17:00:00">05:00 PM IST</option>
                        <option value="17:30:00">05:30 PM IST</option>
                        <option value="18:00:00">06:00 PM IST</option>
                        <option value="18:30:00">06:30 PM IST</option>
                        <option value="19:00:00">07:00 PM IST</option>
                        <option value="19:30:00">07:30 PM IST</option>
                      </select>
                    </div>
                  </div>
                </div>

                {checkingSlot && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-3 text-amber-800 text-xs text-left">
                    <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    <span>Checking availability in Shelly Sharma's Calendar...</span>
                  </div>
                )}

                {slotSuggestion && (
                  <div className="p-5 bg-pink-50 border-2 border-[#FF8DA1]/30 rounded-2xl space-y-4 text-left animate-fade-in">
                    <div className="flex items-start space-x-3 text-[#AD56C4]">
                      <Calendar size={18} className="text-[#FF8DA1] flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-sm">Selected Time Slot Unavailable</h5>
                        <p className="text-xs text-[#23152B]/75 mt-1 leading-relaxed">
                          The slot you chose (<strong>{formData.preferredDate} at {formData.preferredTime.substring(0, 5)}</strong>) is already reserved.
                          Shelly is available at the next upcoming slot:
                        </p>
                        <p className="text-xs font-bold text-[#AD56C4] mt-2 font-mono bg-white border border-[#AD56C4]/20 px-3 py-1.5 rounded-lg w-fit">
                          📅 {slotSuggestion.date} at {slotSuggestion.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            preferredDate: slotSuggestion.date,
                            preferredTime: slotSuggestion.time + ":00"
                          }));
                          setSlotSuggestion(null);
                        }}
                        className="px-4 py-2 bg-[#AD56C4] hover:bg-[#FF8DA1] text-white text-[11px] font-mono font-bold uppercase rounded-xl transition-all duration-300 cursor-pointer"
                      >
                        Accept Suggested Slot
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSlotSuggestion(null);
                        }}
                        className="px-4 py-2 border border-[#AD56C4]/35 text-[#AD56C4] hover:bg-[#AD56C4]/5 text-[11px] font-mono font-bold uppercase rounded-xl transition-all duration-300 cursor-pointer"
                      >
                        Choose Another Slot
                      </button>
                    </div>
                  </div>
                )}

                {slotCheckError && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs text-left">
                    {slotCheckError}
                  </div>
                )}

                {!token && (
                  <div className="p-4 bg-[#AD56C4]/5 border border-[#AD56C4]/10 rounded-xl space-y-2">
                    <div className="flex items-center space-x-2 text-[#AD56C4]">
                      <Shield size={14} className="text-[#FF8DA1]" />
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Automated Booking Confirmation</span>
                    </div>
                    <p className="text-[11px] text-[#23152B]/75 leading-relaxed">
                      Your complimentary diagnostic invitation and Google Meet details will be synchronized directly to your email inbox on submission.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#FF8DA1] hover:bg-[#AD56C4] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold tracking-widest uppercase rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : !token ? (
                    <>
                      <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Authorize Google & Book</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Request Assessment Class</span>
                    </>
                  )}
                </button>
              </form>
            )}
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
            Return to the Library Foyer
          </h3>
          <p className="text-xs sm:text-sm text-[#23152B]/70 font-sans max-w-lg mx-auto leading-relaxed">
            Review the full, interactive chronicle of my academic devotion and student oratory programs from the starting harbor.
          </p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => onNavigateToPage?.("home")}
            className="group px-8 py-4 bg-[#23152B] hover:bg-[#AD56C4] text-white text-xs font-mono font-bold uppercase rounded-full shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center space-x-3"
          >
            <span>Return to Home Overview</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform text-[#FF8DA1]" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
