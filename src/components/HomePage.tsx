import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  GraduationCap,
  Award,
  BookOpen,
  Users,
  ChevronDown,
  ArrowRight,
  Clock,
  Star,
  CheckCircle,
  Play,
  Calendar,
  Sparkles,
  MessageSquare,
  Shield
} from "lucide-react";
import shellyImg from "../../public/assets/Shelly.png";
import { courses, testimonials } from "../data";
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

interface HomePageProps {
  onNavigateToPage: (page: string) => void;
  onEnrollInCourse: (courseTitle: string) => void;
}

export default function HomePage({ onNavigateToPage, onEnrollInCourse }: HomePageProps) {
  // Title text loop animation
  const titles = [
    "Certified PGT English Teacher",
    "Academy Founder & Mentor",
    "Curriculum Design Specialist",
    "Grammar & Spoken English Expert"
  ];
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  // Testimonial slider index
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Video player state
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const handleVideoToggle = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        videoRef.current.play();
        setIsVideoPlaying(true);
      }
    }
  };

  const handleVideoPauseOrEnd = () => {
    setIsVideoPlaying(false);
  };

  // Contact form submission state
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [bookedMeetUrl, setBookedMeetUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    program: "Elite Spoken English Mastery",
    message: "",
    parentName: "",
    remarks: "",
    preferredDate: "",
    preferredTime: ""
  });

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

  // Typing effect hook
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const fullText = titles[currentTitleIndex];

    if (!isDeleting) {
      timer = setTimeout(() => {
        setCurrentText(fullText.substring(0, currentText.length + 1));
        setTypingSpeed(100);
      }, typingSpeed);

      if (currentText === fullText) {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2000);
      }
    } else {
      timer = setTimeout(() => {
        setCurrentText(fullText.substring(0, currentText.length - 1));
        setTypingSpeed(50);
      }, typingSpeed);

      if (currentText === "") {
        setIsDeleting(false);
        setCurrentTitleIndex((prev) => (prev + 1) % titles.length);
      }
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentTitleIndex]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isSubmittingDuplicate) return;

    setIsSubmitting(true);
    setSlotCheckError(null);
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
            message: formData.message,
            sourcePage: "Home Page",
            parentName: formData.parentName,
            remarks: formData.remarks,
            status: leadStatus
          });
        } catch (crmError) {
          console.error("Sheets CRM sync failed, queueing locally:", crmError);
          finalRefNum = queueLeadLocally({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            program: formData.program,
            message: formData.message,
            sourcePage: "Home Page",
            parentName: formData.parentName,
            remarks: formData.remarks,
            status: leadStatus
          });
        }
      } else {
        // No token, queue offline
        finalRefNum = queueLeadLocally({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          program: formData.program,
          message: formData.message,
          sourcePage: "Home Page",
          parentName: formData.parentName,
          remarks: formData.remarks,
          status: leadStatus
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
          message: formData.message
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

  // Select 3 spotlight courses for the homepage
  const spotlightCourses = courses.slice(0, 3);

  return (
    <div className="space-y-0">
      
      {/* 1. Hero Section (Visual Identity) */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-b from-[#23152B]/5 to-transparent pt-12 pb-24 overflow-hidden">
        {/* Abstract blurred background shapes */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#AD56C4]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-[300px] h-[300px] bg-[#FF8DA1]/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10 w-full">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex items-center space-x-2 bg-[#AD56C4]/10 border border-[#AD56C4]/20 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold text-[#AD56C4] shadow-sm animate-pulse">
              <Sparkles size={12} className="text-[#FF8DA1]" />
              <span>Convent Pedigree • University Distinction Honors</span>
            </div>

            <div className="space-y-4">
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#23152B] leading-[1.1]">
                Shelly Sharma
              </h1>
              
              {/* Auto Typing Title Loop */}
              <div className="h-8 flex items-center">
                <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-[#FF8DA1]">
                  {currentText}
                </span>
                <span className="w-1.5 h-4 bg-[#FF8DA1] ml-1 animate-ping" />
              </div>

              <p className="text-sm sm:text-base text-[#23152B]/85 max-w-2xl leading-relaxed">
                Developing spoken confidence, public speaking charm, and board examination distinctions globally. Experience standard academic instruction customized for ambitious students and working executives.
              </p>
            </div>

            {/* Quick credentials cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="bg-white border border-[#AD56C4]/10 rounded-2xl p-4 shadow-sm hover:border-[#AD56C4]/25 transition-all">
                <div className="w-8 h-8 rounded-xl bg-[#AD56C4]/10 text-[#AD56C4] flex items-center justify-center mb-2">
                  <GraduationCap size={16} />
                </div>
                <h4 className="font-display font-bold text-xs text-[#23152B]">B.Ed. Distinction</h4>
                <p className="text-[10px] text-[#23152B]/60 font-semibold mt-0.5">Pune University</p>
              </div>

              <div className="bg-white border border-[#AD56C4]/10 rounded-2xl p-4 shadow-sm hover:border-[#AD56C4]/25 transition-all">
                <div className="w-8 h-8 rounded-xl bg-[#FF8DA1]/10 text-[#FF8DA1] flex items-center justify-center mb-2">
                  <BookOpen size={16} />
                </div>
                <h4 className="font-display font-bold text-xs text-[#23152B]">M.A. English</h4>
                <p className="text-[10px] text-[#23152B]/60 font-semibold mt-0.5">Literature Specialist</p>
              </div>

              <div className="bg-white border border-[#AD56C4]/10 rounded-2xl p-4 shadow-sm hover:border-[#AD56C4]/25 transition-all">
                <div className="w-8 h-8 rounded-xl bg-[#FF9CE9]/10 text-[#FF9CE9] flex items-center justify-center mb-2">
                  <Award size={16} />
                </div>
                <h4 className="font-display font-bold text-xs text-[#23152B]">10+ Yrs Exp</h4>
                <p className="text-[10px] text-[#23152B]/60 font-semibold mt-0.5">Elite Boarding Schools</p>
              </div>

              <div className="bg-white border border-[#AD56C4]/10 rounded-2xl p-4 shadow-sm hover:border-[#AD56C4]/25 transition-all">
                <div className="w-8 h-8 rounded-xl bg-[#AD56C4]/10 text-[#AD56C4] flex items-center justify-center mb-2">
                  <Users size={16} />
                </div>
                <h4 className="font-display font-bold text-xs text-[#23152B]">1,000+ Pupils</h4>
                <p className="text-[10px] text-[#23152B]/60 font-semibold mt-0.5">Oratory Impact</p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={() => onNavigateToPage("contact")}
                className="px-8 py-4 bg-[#AD56C4] hover:bg-[#FF8DA1] text-white text-xs font-mono font-bold uppercase rounded-full shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Request Assessment Call</span>
                <ArrowRight size={14} />
              </button>
              <button
                onClick={() => onNavigateToPage("academy")}
                className="px-8 py-4 bg-white border border-[#AD56C4]/35 text-[#AD56C4] hover:bg-[#AD56C4]/5 text-xs font-mono font-bold uppercase rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center"
              >
                Explore Course Catalog
              </button>
            </div>
          </div>

          {/* Hero Right - Impeccable Portrait Layout */}
          <div className="lg:col-span-5 flex justify-center relative mt-8 lg:mt-0">
            {/* Soft glowing concentric rings */}
            <div className="absolute inset-0 border border-[#AD56C4]/10 rounded-full scale-110 pointer-events-none animate-spin-slow" />
            <div className="absolute inset-0 border border-[#FF8DA1]/5 rounded-full scale-125 pointer-events-none" />

            {/* Beautiful customized portrait frame */}
            <div className="relative w-72 sm:w-85 aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl bg-gradient-to-b from-[#23152B]/90 to-[#23152B] border-4 border-white/95">
              <img
                src={shellyImg}
                alt="Shelly Sharma - Elite English Teacher Portfolio"
                className="w-full h-full object-cover object-center scale-105 hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#23152B]/85 via-transparent to-transparent pointer-events-none" />

              {/* Floating microcards overlays */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-white/95 flex items-center justify-center text-[#23152B] shadow-md">
                  <Star size={16} fill="currentColor" className="text-[#FF8DA1]" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-xs text-white">Classrooms of Joy</h4>
                  <p className="text-[10px] text-white/70 font-semibold">Active LSRW Teaching Philosophy</p>
                </div>
              </div>
            </div>

            {/* Floating Trust Card Top-Right */}
            <div className="absolute -top-4 -right-2 bg-white/95 border border-[#AD56C4]/20 rounded-2xl py-2.5 px-4 shadow-xl backdrop-blur-md hidden sm:flex items-center space-x-2 animate-bounce-slow">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-[#23152B] uppercase">Active Intake • 1-on-1 Slots Open</span>
            </div>

            {/* Floating Card Left */}
            <div className="absolute top-1/3 -left-8 bg-white/95 border border-[#AD56C4]/15 rounded-2xl p-3 shadow-xl hidden sm:flex items-center space-x-2.5 max-w-[160px]">
              <div className="p-2 bg-[#AD56C4]/10 rounded-xl text-[#AD56C4]">
                <Award size={16} />
              </div>
              <div>
                <h5 className="font-display font-bold text-[10px] text-[#23152B]">95%+ Pass Rate</h5>
                <p className="text-[8px] text-[#23152B]/60 font-semibold leading-tight">Verified Academic Honors</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 2. Key Statistics Banner (Trust Metrics) */}
      <section className="bg-[#23152B] text-white py-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
          <div className="space-y-1">
            <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-[#FF8DA1]">10+ Years</h3>
            <p className="text-[10px] font-mono tracking-wider uppercase text-white/60 font-semibold">Classroom Experience</p>
          </div>
          <div className="space-y-1 border-l border-white/10">
            <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-[#AD56C4]">1,000+</h3>
            <p className="text-[10px] font-mono tracking-wider uppercase text-white/60 font-semibold">Pupils Guided</p>
          </div>
          <div className="space-y-1 border-l border-white/10">
            <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-[#FF9CE9]">100%</h3>
            <p className="text-[10px] font-mono tracking-wider uppercase text-white/60 font-semibold">Board Pass Ratio</p>
          </div>
          <div className="space-y-1 border-l border-white/10">
            <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-[#FF8DA1]">Pune, IN</h3>
            <p className="text-[10px] font-mono tracking-wider uppercase text-white/60 font-semibold">Operating Worldwide</p>
          </div>
        </div>
      </section>

      {/* 3. Core Philosophy & Why Choose Shelly */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#AD56C4] px-3 py-1 bg-[#AD56C4]/10 rounded-full">
              Why Choose Shelly
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#23152B]">
              Convent Standards Built Upon Pure Subject Rigor
            </h2>
            <p className="text-sm text-[#23152B]/80 leading-relaxed">
              Shelly Sharma's programs stand apart from traditional casual speaking apps. Grounded in her own classical convent education (Loreto Day School, St. Agnes') and validated by a first-class Bachelor of Education (B.Ed.) degree with English pedagogy distinction, Shelly translates linguistic concepts into systematic developmental structures.
            </p>
            <p className="text-sm text-[#23152B]/80 leading-relaxed">
              Using the balanced <strong>LSRW</strong> framework (Listening, Speaking, Reading, Writing), we design micro-cohorts where pupils transition from grammar memory drills into clear situational public presentations.
            </p>
            
            <div className="pt-4">
              <button
                onClick={() => onNavigateToPage("about")}
                className="px-6 py-3 border border-[#AD56C4]/35 text-[#AD56C4] hover:bg-[#AD56C4] hover:text-white text-xs font-mono font-bold uppercase rounded-full transition-all duration-300 cursor-pointer inline-flex items-center space-x-2"
              >
                <span>Read Teaching Manifesto</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-[#FAFAFA] border border-[#AD56C4]/15 rounded-[32px] p-8 md:p-10 space-y-6">
              <h3 className="font-display text-xl font-bold text-[#23152B]">The Academy Edge</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-[#AD56C4]/10 text-[#AD56C4] mt-1">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-[#23152B]">Original Workbook Files</h4>
                    <p className="text-xs text-[#23152B]/70 leading-relaxed mt-0.5">
                      No stock slide templates. Shelly authors original worksheets, literature character charts, and sample board models.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-[#FF8DA1]/10 text-[#FF8DA1] mt-1">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-[#23152B]">Micro-Cohort Attention</h4>
                    <p className="text-xs text-[#23152B]/70 leading-relaxed mt-0.5">
                      Classes are capped at 8 students to track grammatical errors and guide speech modulation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-[#FF9CE9]/10 text-[#FF9CE9] mt-1">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-[#23152B]">Google Workspace Tracking</h4>
                    <p className="text-xs text-[#23152B]/70 leading-relaxed mt-0.5">
                      Secure, dedicated student folder modules on Google Drive to archive class sheets, assessments, and score feedback.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* NEW SECTION: MEET SHELLY SHARMA */}
      <section className="relative overflow-hidden py-24 bg-gradient-to-tr from-[#FAF7F2] via-[#F3EBF5]/80 to-[#FCEEF2]/80 border-t border-b border-[#AD56C4]/10">
        
        {/* Soft Hydrangea radial blur backgrounds */}
        <div className="absolute top-1/4 left-10 w-[350px] h-[350px] bg-[#AD56C4]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-[350px] h-[350px] bg-[#FF8DA1]/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Elegant Abstract Floating Shapes & Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          {/* Floating Shape 1: Sparkle icon */}
          <motion.div
            animate={{ y: [0, -25, 0], x: [0, 10, 0], rotate: [0, 180, 360] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-12 left-[15%] text-[#AD56C4]/8"
          >
            <Sparkles size={24} />
          </motion.div>

          {/* Floating Shape 2: BookOpen icon */}
          <motion.div
            animate={{ y: [0, 20, 0], x: [0, -15, 0], rotate: [0, -90, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-16 left-[8%] text-[#FF8DA1]/6"
          >
            <BookOpen size={28} />
          </motion.div>

          {/* Floating Shape 3: Award icon */}
          <motion.div
            animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/3 right-[12%] text-[#AD56C4]/6"
          >
            <Award size={26} />
          </motion.div>

          {/* Floating Particle 1 */}
          <motion.div
            animate={{ y: [0, -15, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-24 left-[40%] w-3 h-3 rounded-full bg-[#FF8DA1]/15"
          />

          {/* Floating Particle 2 */}
          <motion.div
            animate={{ y: [0, 25, 0], opacity: [0.1, 0.4, 0.1] }}
            transition={{ duration: 11, repeat: Infinity }}
            className="absolute bottom-32 right-[35%] w-4 h-4 rounded-full bg-[#AD56C4]/10"
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* LEFT COLUMN: Large Premium Video Player */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <motion.div
                animate={{ 
                  y: isVideoPlaying ? 0 : [0, -8, 0],
                  scale: isVideoPlaying ? 1.03 : 1
                }}
                transition={{ 
                  y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                  scale: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
                }}
                className="relative rounded-[32px] overflow-hidden p-3 bg-gradient-to-b from-white/20 to-white/5 backdrop-blur-xl border border-white/30 shadow-[0_20px_50px_rgba(173,86,196,0.3)] hover:shadow-[0_20px_60px_rgba(255,141,161,0.4)] transition-all duration-500 group"
              >
                {/* Cinematic inner screen */}
                <div className="relative aspect-video rounded-[20px] overflow-hidden bg-[#1a0f21] border border-white/20 shadow-inner group-hover:border-white/30 transition-colors duration-500">
                  
                  {/* Glowing ambient light behind the video */}
                  <div className="absolute -inset-10 bg-gradient-to-tr from-[#AD56C4]/20 to-[#FF8DA1]/20 rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-700 pointer-events-none" />

                  <motion.video
                    ref={videoRef}
                    src="/assets/Introduction Video.mp4"
                    className="w-full h-full object-cover relative z-10"
                    controls={isVideoPlaying}
                    muted={true}
                    playsInline
                    animate={{ scale: isVideoPlaying ? 1.05 : 1 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={handleVideoPauseOrEnd}
                    onEnded={handleVideoPauseOrEnd}
                  />
                  
                  {/* Custom Poster Overlay */}
                  {!isVideoPlaying && (
                    <motion.div
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={handleVideoToggle}
                      className="absolute inset-0 z-20 cursor-pointer select-none overflow-hidden flex flex-col justify-between p-6 sm:p-8"
                    >
                      {/* High quality portrait of Shelly Sharma Smiling */}
                      <div 
                        className="absolute inset-0 bg-cover bg-[center_35%] transform group-hover:scale-105 transition-transform duration-1000 ease-out" 
                        style={{ backgroundImage: `url(${shellyImg})` }} 
                      />
                      {/* Premium cinematic vignettes and color grading */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1F0F26] via-[#1F0F26]/30 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#1F0F26]/40 via-transparent to-[#1F0F26]/40" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,#1F0F26_95%)] opacity-85" />

                      {/* Top Glassmorphic Tags */}
                      <div className="flex justify-between items-start relative z-30">
                        <span className="text-[9px] font-mono tracking-widest text-white/95 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full uppercase font-bold border border-white/20 shadow-sm">
                          Introduction Video
                        </span>
                        <span className="text-[9px] font-mono text-[#FF8DA1] bg-[#23152B]/40 backdrop-blur-md px-3 py-1.5 rounded-full font-bold border border-[#FF8DA1]/20 shadow-sm">
                          Interactive Preview
                        </span>
                      </div>

                      {/* Center Pulsing Netflix-style Premium Play Button */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center space-y-4 relative z-30">
                        <div className="relative flex items-center justify-center">
                          {/* Multiple luxurious glowing pulsating rings */}
                          <motion.div 
                            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute w-28 h-28 border border-[#FF8DA1]/40 rounded-full pointer-events-none" 
                          />
                          <motion.div 
                            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.1, 0.6] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute w-22 h-22 bg-[#AD56C4]/20 rounded-full blur-[2px] pointer-events-none" 
                          />
                          <motion.div 
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute w-18 h-18 bg-gradient-to-tr from-[#AD56C4] to-[#FF8DA1] rounded-full blur-[8px] opacity-75 pointer-events-none" 
                          />
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVideoToggle();
                            }}
                            className="relative w-16 h-16 rounded-full bg-white text-[#23152B] flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-gradient-to-tr hover:from-[#AD56C4] hover:to-[#FF8DA1] hover:text-white active:scale-95 cursor-pointer focus:outline-none border border-white/40"
                            aria-label="Play video"
                          >
                            <Play size={26} fill="currentColor" className="ml-1 transition-transform group-hover:scale-110" />
                          </button>
                        </div>
                        <span className="font-mono text-[9px] text-white/90 uppercase tracking-widest font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                          Click to Watch Trailer
                        </span>
                      </div>

                      {/* Bottom Title Info */}
                      <div className="space-y-1 relative z-30 text-left">
                        <h4 className="font-display text-base sm:text-lg font-bold text-white leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                          The Classroom Experience in Action
                        </h4>
                        <p className="text-[9px] text-[#FF8DA1] font-mono tracking-wider uppercase font-bold drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
                          Watch Shelly's Welcome Message & Teaching Vision
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* RIGHT COLUMN: Premium Information Panel */}
            <div className="lg:col-span-6 space-y-6 lg:pl-4 text-left">
              <span className="text-[10px] font-mono tracking-widest text-[#AD56C4] font-bold uppercase px-3 py-1.5 bg-[#AD56C4]/10 rounded-full w-fit inline-block">
                MEET SHELLY SHARMA
              </span>

              <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#23152B] leading-[1.15]">
                More Than a Teacher,<br className="hidden sm:inline" /> A Mentor for Lifelong Learning
              </h2>

              <div className="border-l-4 border-[#FF8DA1] pl-4 py-1 italic text-sm text-[#23152B]/75 font-sans leading-relaxed relative">
                <span className="absolute -top-3 -left-1 text-3xl font-serif text-[#FF8DA1]/30 select-none">“</span>
                Behind every confident learner is a teacher who believed in them first.
              </div>

              <div className="space-y-3.5 text-xs sm:text-sm text-[#23152B]/80 font-sans leading-relaxed">
                <p>
                  Before choosing a mentor, students and parents deserve to know the person behind the classroom.
                </p>
                <p>
                  Watch Shelly Sharma's short introduction to understand her teaching philosophy, classroom experience and vision for modern English education.
                </p>
              </div>

              {/* Checklist items */}
              <div className="space-y-3 pt-2">
                {[
                  "20+ Years of Teaching Journey",
                  "English Communication Expert",
                  "CBSE / ICSE / Cambridge Experience",
                  "Online English Speaking Mentor",
                  "Personalized Learning Methodology"
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * index, duration: 0.5 }}
                    className="flex items-center space-x-3 group/item"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#AD56C4]/10 text-[#AD56C4] flex items-center justify-center flex-shrink-0 group-hover/item:bg-[#AD56C4] group-hover/item:text-white transition-all duration-300">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="text-xs sm:text-sm text-[#23152B]/90 font-sans font-medium group-hover/item:text-[#AD56C4] transition-colors duration-200">
                      {item}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Elegant CTA button */}
              <div className="pt-4">
                <button
                  onClick={() => onNavigateToPage("academy")}
                  className="group px-8 py-4 bg-[#23152B] hover:bg-[#AD56C4] text-white text-xs font-mono font-bold uppercase rounded-full shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center space-x-3"
                >
                  <span>Explore the Academy</span>
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform text-[#FF8DA1]" />
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* Subtle Editorial Transition Divider */}
        <div className="relative w-full flex items-center justify-center pt-20 pb-4">
          <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#AD56C4]/15 to-transparent" />
          <div className="relative z-10 bg-white/80 backdrop-blur-md px-6 py-1.5 rounded-full border border-[#AD56C4]/10 shadow-sm flex items-center space-x-2">
            <Sparkles size={11} className="text-[#FF8DA1]" />
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#AD56C4]/80 font-bold">
              Pathways of Achievement
            </span>
          </div>
        </div>

      </section>

      {/* 4. Academy Spotlights */}
      <section className="py-24 bg-gradient-to-b from-[#FAFAFA] to-transparent border-t border-b border-[#AD56C4]/10 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-4 max-w-2xl">
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#AD56C4] px-3 py-1 bg-[#AD56C4]/10 rounded-full">
                Featured Programs
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#23152B]">
                Curriculum Programs Spotlight
              </h2>
              <p className="text-[#23152B]/80 text-sm">
                Cohort curriculum structures engineered by an expert teacher. Choose the format configured for your career milestones.
              </p>
            </div>
            
            <button
              onClick={() => onNavigateToPage("academy")}
              className="px-6 py-3 bg-[#AD56C4] hover:bg-[#FF8DA1] text-white text-xs font-mono font-bold uppercase rounded-full transition-all duration-300 cursor-pointer flex items-center space-x-2"
            >
              <span>View All Courses</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {spotlightCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white border border-[#AD56C4]/15 rounded-[32px] p-8 hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 flex flex-col justify-between relative group"
              >
                {course.popular && (
                  <span className="absolute -top-3.5 right-6 bg-gradient-to-r from-[#AD56C4] to-[#FF8DA1] text-white text-[9px] font-mono uppercase font-bold px-3 py-1.5 rounded-full shadow-md tracking-wider flex items-center space-x-1">
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

                  <h3 className="font-display text-lg font-bold text-[#23152B] group-hover:text-[#AD56C4] transition-colors duration-200">
                    {course.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#23152B]/80 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="space-y-2 pt-4 border-t border-[#AD56C4]/10">
                    <span className="block text-[10px] uppercase font-mono tracking-wider text-[#AD56C4] font-bold">Curriculum Snippet:</span>
                    <ul className="space-y-1">
                      {course.curriculum.slice(0, 2).map((item, idx) => (
                        <li key={idx} className="text-xs text-[#23152B]/85 flex items-center space-x-1.5">
                          <span className="text-[#FF8DA1] font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6 mt-8 border-t border-[#AD56C4]/10 flex items-center justify-between">
                  <span className="text-xs font-mono text-[#AD56C4] font-bold">{course.price}</span>
                  <button
                    onClick={() => onEnrollInCourse(course.title)}
                    className="px-4 py-2 bg-white hover:bg-[#FF8DA1] hover:text-white border border-[#AD56C4]/35 text-[#AD56C4] text-xs font-mono font-bold rounded-full transition-all duration-300 cursor-pointer"
                  >
                    Enquire
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. Highlighted Student Review */}
      <section className="py-24 bg-white relative">
        <div className="max-w-5xl mx-auto px-6 relative text-center space-y-8">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#AD56C4] px-3 py-1 bg-[#AD56C4]/10 rounded-full">
            Social Proof
          </span>
          
          <div className="max-w-4xl mx-auto relative">
            <div className="bg-[#FAFAFA] border border-[#AD56C4]/15 rounded-[32px] p-8 md:p-12 shadow-sm relative flex flex-col justify-between min-h-[200px]">
              <div className="absolute top-6 right-8 text-[#FF8DA1]/30 font-display text-7xl font-serif pointer-events-none">
                “
              </div>

              <div className="space-y-6">
                <div className="flex space-x-1 justify-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="text-[#FF8DA1]" fill="currentColor" />
                  ))}
                </div>

                <p className="text-[#23152B]/90 text-sm sm:text-lg leading-relaxed font-medium italic max-w-3xl mx-auto">
                  "{testimonials[activeTestimonial].text}"
                </p>
              </div>

              <div className="pt-6 mt-8 border-t border-[#AD56C4]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-left">
                  <h4 className="font-display text-base font-bold text-[#23152B]">
                    {testimonials[activeTestimonial].author}
                  </h4>
                  <p className="text-xs text-[#23152B]/70 mt-0.5">
                    {testimonials[activeTestimonial].relation}
                  </p>
                </div>
                <span className="text-[10px] font-mono tracking-wider text-[#AD56C4] bg-[#AD56C4]/10 px-3 py-1.5 rounded-full font-bold uppercase w-fit h-fit self-start sm:self-center">
                  {testimonials[activeTestimonial].board}
                </span>
              </div>
            </div>

            {/* Slider Navigation Dots */}
            <div className="flex justify-center space-x-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    activeTestimonial === index ? "w-8 bg-[#AD56C4]" : "w-2 bg-[#AD56C4]/20"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Quick Interactive Assessment Booking card */}
      <section className="py-24 bg-gradient-to-b from-transparent to-[#FFC2BA]/10 border-t border-[#AD56C4]/10 relative">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white border border-[#AD56C4]/15 rounded-[40px] p-8 md:p-12 shadow-xl relative overflow-hidden">
            
            {formSubmitted ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-[#AD56C4]/10 text-[#AD56C4] flex items-center justify-center animate-bounce">
                  <CheckCircle size={36} />
                </div>
                {formData.preferredDate && formData.preferredTime ? (
                  <div className="space-y-6 w-full">
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
                  <div className="flex flex-col items-center justify-center space-y-6 w-full">
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
                            program: "Elite Spoken English Mastery",
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
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="text-center space-y-2 mb-8">
                  <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#AD56C4] px-3 py-1 bg-[#AD56C4]/10 rounded-full">
                    Complementary Assessment
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#23152B]">
                    Request Level Diagnostics
                  </h3>
                  <p className="text-xs sm:text-sm text-[#23152B]/75 max-w-md mx-auto leading-relaxed">
                    A complimentary 15-minute diagnostic call with Shelly. Discover syntax errors and phonetic blocks to tailor your academy curriculum.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-xs font-mono font-bold uppercase tracking-wider text-[#23152B]/80 mb-2">
                      Parent / Student Name
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
                      Target Academy Format
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
                    </select>
                  </div>
                </div>

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

                {/* Preferred Slot Booking Section */}
                <div className="pt-4 border-t border-[#AD56C4]/15">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#AD56C4] mb-4 flex items-center space-x-2">
                    <Calendar size={14} className="text-[#FF8DA1]" />
                    <span>Preferred Diagnostic Slot (Optional)</span>
                  </h4>
                  <p className="text-[11px] text-[#23152B]/70 mb-4 text-left">
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
                  <div className="p-4 bg-[#AD56C4]/5 border border-[#AD56C4]/10 rounded-xl space-y-2 text-left">
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
                      <span>Authorize Google & Book Assessment</span>
                    </>
                  ) : (
                    <>
                      <Calendar size={14} />
                      <span>Request Assessment Call</span>
                    </>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>
      </section>

      {/* Continue the Journey Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pb-24 mt-8">
        <div className="mt-12 pt-12 border-t border-[#AD56C4]/15 text-center space-y-6">
          <span className="text-[9px] font-mono tracking-widest text-[#AD56C4] font-bold uppercase block">
            Continue the Journey
          </span>
          <div className="max-w-2xl mx-auto space-y-3">
            <h3 className="font-display text-2xl sm:text-3xl font-black text-[#23152B] tracking-tight">
              Chapter I — Meet Shelly Sharma
            </h3>
            <p className="text-xs sm:text-sm text-[#23152B]/70 font-sans max-w-lg mx-auto leading-relaxed">
              Explore the early roots and formative convent background that shaped my relationship with the spoken word.
            </p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => onNavigateToPage?.("about")}
              className="group px-8 py-4 bg-[#23152B] hover:bg-[#AD56C4] text-white text-xs font-mono font-bold uppercase rounded-full shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center space-x-3"
            >
              <span>Meet Shelly Sharma</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform text-[#FF8DA1]" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
