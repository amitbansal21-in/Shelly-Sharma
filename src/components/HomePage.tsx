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
  Shield,
  Upload,
  X,
  Mail
} from "lucide-react";
const shellyImg = "/assets/shelly.png";
import { courses, testimonials as initialTestimonials } from "../data";
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

function AnimatedCounter({ value, duration = 1.5, suffix = "" }: { value: string; duration?: number; suffix?: string }) {
  const [count, setCount] = React.useState(0);
  const ref = React.useRef<HTMLSpanElement>(null);
  
  React.useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let animationFrame: number;
    
    if (ref.current) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            const startTime = performance.now();
            const numericValue = parseInt(value.replace(/[^0-9]/g, ""), 10) || 0;
            
            const animate = (now: number) => {
              const progress = Math.min((now - startTime) / (duration * 1000), 1);
              const easeProgress = 1 - Math.pow(1 - progress, 3); // cubic ease out
              setCount(Math.floor(easeProgress * numericValue));
              
              if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
              } else {
                setCount(numericValue);
              }
            };
            
            animationFrame = requestAnimationFrame(animate);
            if (observer) observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      
      observer.observe(ref.current);
    }
    
    return () => {
      if (observer) observer.disconnect();
      cancelAnimationFrame(animationFrame);
    };
  }, [value, duration]);
  
  const formatted = count >= 1000 ? count.toLocaleString() : count;
  
  return (
    <span ref={ref}>
      {formatted}
      {suffix}
    </span>
  );
}

function ScrollReveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

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

  // Dynamic Testimonials States
  const [localTestimonials, setLocalTestimonials] = useState<any[]>([]);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [testimonialSubmitted, setTestimonialSubmitted] = useState(false);
  const [isSubmittingTestimonial, setIsSubmittingTestimonial] = useState(false);
  const [testimonialForm, setTestimonialForm] = useState({
    name: "",
    relation: "",
    board: "",
    text: "",
    rating: 5
  });
  const [testimonialPhotoPreview, setTestimonialPhotoPreview] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("shelly_testimonials");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLocalTestimonials([...initialTestimonials, ...parsed]);
      } catch (err) {
        setLocalTestimonials(initialTestimonials);
      }
    } else {
      setLocalTestimonials(initialTestimonials);
    }
  }, []);

  const getInitials = (name: string): string => {
    if (!name) return "SS";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      const first = parts[0][0] || "";
      const second = parts[parts.length - 1][0] || "";
      return (first + second).toUpperCase();
    } else if (parts.length === 1) {
      const single = parts[0];
      return single.substring(0, 2).toUpperCase();
    }
    return "SS";
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTestimonialPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTestimonialPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTestimonialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialForm.name || !testimonialForm.text) return;

    setIsSubmittingTestimonial(true);
    
    // Simulate slight lag for realistic save
    setTimeout(() => {
      const newTestimonialItem = {
        text: testimonialForm.text,
        author: testimonialForm.name,
        relation: testimonialForm.relation || "Student / Parent",
        rating: testimonialForm.rating,
        board: testimonialForm.board || "Academy Program",
        photoUrl: testimonialPhotoPreview || undefined
      };

      const saved = localStorage.getItem("shelly_testimonials");
      let customList = [];
      if (saved) {
        try {
          customList = JSON.parse(saved);
        } catch (err) {
          customList = [];
        }
      }
      
      const updatedCustom = [...customList, newTestimonialItem];
      localStorage.setItem("shelly_testimonials", JSON.stringify(updatedCustom));
      
      const newFullList = [...initialTestimonials, ...updatedCustom];
      setLocalTestimonials(newFullList);
      
      // Select the newly added testimonial instantly!
      setActiveTestimonial(newFullList.length - 1);
      
      setIsSubmittingTestimonial(false);
      setTestimonialSubmitted(true);
    }, 800);
  };

  const resetTestimonialForm = () => {
    setTestimonialForm({
      name: "",
      relation: "",
      board: "",
      text: "",
      rating: 5
    });
    setTestimonialPhotoPreview("");
    setTestimonialSubmitted(false);
  };

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
              <span className="text-[10px] font-mono font-bold tracking-wider text-[#23152B] uppercase">New Batches Commencing • Enquire Now</span>
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

      {/* 1.5 Premium Trust Strip */}
      <section className="relative z-20 -mt-8 mb-4 px-6 lg:px-12 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-white/90 backdrop-blur-md rounded-[24px] p-6 sm:p-8 shadow-xl shadow-[#AD56C4]/5 border border-[#AD56C4]/10 relative overflow-hidden"
        >
          {/* Thin gradient top border */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#AD56C4] via-[#FF8DA1] to-[#AD56C4]" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4 flex-1">
              <div className="space-y-1">
                <h3 className="font-display text-lg sm:text-xl font-bold text-[#23152B] tracking-tight">
                  Trusted by Learners Across India
                </h3>
                <p className="text-xs sm:text-sm text-[#23152B]/70 font-medium">
                  "Helping students, professionals and board aspirants build lifelong English confidence."
                </p>
              </div>
              
              {/* Location chips */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                {[
                  { name: "Pune", icon: "📍" },
                  { name: "Mumbai", icon: "📍" },
                  { name: "Kolkata", icon: "📍" },
                  { name: "Howrah", icon: "📍" },
                  { name: "Raipur", icon: "📍" },
                  { name: "Bilaspur", icon: "📍" },
                  { name: "Online Across India", icon: "📍" }
                ].map((loc, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -4, scale: 1.05, boxShadow: "0 10px 15px -3px rgba(173, 86, 196, 0.15), 0 4px 6px -4px rgba(173, 86, 196, 0.15)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="inline-flex items-center space-x-1.5 bg-white border border-[#AD56C4]/15 px-3.5 py-1.5 rounded-full text-[11px] font-mono font-bold text-[#23152B]/80 shadow-sm cursor-default hover:border-[#AD56C4]/30 hover:text-[#AD56C4] transition-all"
                  >
                    <span>{loc.icon}</span>
                    <span>{loc.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right side: Subtle animated line */}
            <div className="flex items-center space-x-3 shrink-0 lg:border-l lg:border-[#AD56C4]/15 lg:pl-8 py-2">
              <div className="space-y-1 text-left">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#AD56C4]">
                    Growing Every Day
                  </span>
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  >
                    <Sparkles size={14} className="text-[#FF8DA1]" fill="currentColor" />
                  </motion.div>
                </div>
                {/* Subtle animated bar */}
                <div className="h-1 w-24 bg-gradient-to-r from-[#AD56C4] to-[#FF8DA1] rounded-full overflow-hidden relative">
                  <motion.div
                    animate={{ x: [-96, 96] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="absolute top-0 left-0 w-12 h-full bg-white/40 blur-[2px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 2. Key Statistics Banner (Trust Metrics) */}
      <section className="bg-[#23152B] text-white py-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
          <div className="space-y-1">
            <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-[#FF8DA1]">
              <AnimatedCounter value="10" suffix="+" /> Years
            </h3>
            <p className="text-[10px] font-mono tracking-wider uppercase text-white/60 font-semibold">Classroom Experience</p>
          </div>
          <div className="space-y-1 border-l border-white/10">
            <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-[#AD56C4]">
              <AnimatedCounter value="1000" suffix="+" />
            </h3>
            <p className="text-[10px] font-mono tracking-wider uppercase text-white/60 font-semibold">Pupils Guided</p>
          </div>
          <div className="space-y-1 border-l border-white/10">
            <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-[#FF9CE9]">
              <AnimatedCounter value="100" suffix="%" />
            </h3>
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
        <ScrollReveal>
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
      </ScrollReveal>
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

        <ScrollReveal>
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
                    src="/assets/introduction_video.mp4"
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

        </ScrollReveal>
      </section>

      {/* 4. Academy Spotlights */}
      <section className="py-24 bg-gradient-to-b from-[#FAFAFA] to-transparent border-t border-b border-[#AD56C4]/10 relative">
        <ScrollReveal>
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
                className="bg-white border border-[#AD56C4]/15 rounded-[32px] p-8 hover:shadow-2xl hover:shadow-[#AD56C4]/10 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between relative group"
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
      </ScrollReveal>
    </section>

      {/* 5. Highlighted Student Review */}
      <section className="py-24 bg-white relative">
        <ScrollReveal>
          <div className="max-w-5xl mx-auto px-6 relative text-center space-y-8">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#AD56C4] px-3 py-1 bg-[#AD56C4]/10 rounded-full">
            Social Proof
          </span>
          
          <div className="max-w-4xl mx-auto relative">
            {(() => {
              const currentList = localTestimonials.length > 0 ? localTestimonials : initialTestimonials;
              const currentItem = currentList[activeTestimonial] || currentList[0] || initialTestimonials[0];
              return (
                <>
                  <div className="bg-[#FAFAFA] border border-[#AD56C4]/15 rounded-[32px] p-8 md:p-12 shadow-sm relative flex flex-col justify-between min-h-[220px]">
                    <div className="absolute top-6 right-8 text-[#FF8DA1]/30 font-display text-7xl font-serif pointer-events-none">
                      “
                    </div>

                    <div className="space-y-6 text-center">
                      <div className="flex space-x-1 justify-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={i < (currentItem.rating || 5) ? "text-[#FF8DA1]" : "text-[#23152B]/10"}
                            fill={i < (currentItem.rating || 5) ? "currentColor" : "none"}
                          />
                        ))}
                      </div>

                      <p className="text-[#23152B]/90 text-sm sm:text-lg leading-relaxed font-medium italic max-w-3xl mx-auto">
                        "{currentItem.text}"
                      </p>
                    </div>

                    <div className="pt-6 mt-8 border-t border-[#AD56C4]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-4 text-left">
                        {currentItem.photoUrl ? (
                          <img
                            src={currentItem.photoUrl}
                            alt={currentItem.author}
                            className="w-12 h-12 rounded-full object-cover border-2 border-[#AD56C4]/20 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#AD56C4] to-[#FF8DA1] text-white flex items-center justify-center font-display font-bold text-xs tracking-wide shadow-sm border border-[#AD56C4]/10 shrink-0">
                            {getInitials(currentItem.author)}
                          </div>
                        )}
                        <div className="text-left">
                          <h4 className="font-display text-base font-bold text-[#23152B]">
                            {currentItem.author}
                          </h4>
                          <p className="text-xs text-[#23152B]/70 mt-0.5">
                            {currentItem.relation}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono tracking-wider text-[#AD56C4] bg-[#AD56C4]/10 px-3 py-1.5 rounded-full font-bold uppercase w-fit h-fit self-start sm:self-center">
                        {currentItem.board}
                      </span>
                    </div>
                  </div>

                  {/* Slider Navigation Dots */}
                  <div className="flex justify-center space-x-2 mt-8">
                    {currentList.map((_, index) => (
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
                </>
              );
            })()}
          </div>

          {/* Add Testimonial Action CTA */}
          <div className="pt-4 flex justify-center">
            <button
              onClick={() => {
                resetTestimonialForm();
                setShowTestimonialModal(true);
              }}
              className="px-6 py-3 bg-white hover:bg-[#AD56C4]/5 border border-[#AD56C4]/35 text-[#AD56C4] text-xs font-mono font-bold uppercase rounded-full transition-all duration-300 cursor-pointer flex items-center space-x-2 shadow-sm"
            >
              <MessageSquare size={14} className="text-[#FF8DA1]" />
              <span>Share Your Academic Review</span>
            </button>
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* 6. Quick Interactive Assessment Booking card */}
      <section className="py-24 bg-gradient-to-b from-transparent to-[#FFC2BA]/10 border-t border-[#AD56C4]/10 relative">
        <ScrollReveal>
          <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white border border-[#AD56C4]/15 rounded-[40px] p-8 md:p-12 shadow-xl relative overflow-hidden">
            
            {formSubmitted ? (
              formData.program === "Others" ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="py-12 flex flex-col items-center justify-center text-center space-y-8 w-full"
                >
                  {/* Glowing Floating Icon */}
                  <div className="relative">
                    <motion.div
                      animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                      className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#AD56C4] to-[#FF8DA1] text-white flex items-center justify-center shadow-xl shadow-[#AD56C4]/30 relative z-10"
                    >
                      <Mail size={38} className="animate-pulse" />
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
                      <span className="text-xs font-mono font-bold tracking-widest text-[#AD56C4] bg-[#AD56C4]/10 px-3 py-1.5 rounded-full uppercase">
                        Conversation Initiated
                      </span>
                      <h3 className="font-display text-3xl font-black text-[#23152B] tracking-tight leading-tight pt-2">
                        Your Query Has Been Safely Received!
                      </h3>
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
                        We have successfully bypass-routed your inquiry to Shelly Sharma's personal desk. Because you have selected <strong>"Others"</strong>, we are treating this as a high-priority unique dialogue rather than a standard assessment booking.
                      </p>
                      <p>
                        A direct notification has been dispatched to <strong>shellysharmamail@gmail.com</strong>.
                      </p>
                      <p className="text-[#AD56C4] font-semibold">
                        A personalized reply will arrive in your inbox ({formData.email}) within 24 business hours.
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-xs font-mono text-[#AD56C4]/80 flex items-center justify-center gap-1.5"
                    >
                      <span className="inline-block w-2 h-2 rounded-full bg-[#AD56C4] animate-ping" />
                      Inquiry Ticket: <strong className="font-bold">{referenceNumber}</strong>
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
                      onClick={() => onNavigateToPage?.("home")}
                      className="w-full sm:w-auto px-8 py-3.5 bg-[#23152B] hover:bg-[#AD56C4] text-white text-xs font-mono font-bold uppercase rounded-xl transition-all duration-300 hover:shadow-lg active:scale-95 cursor-pointer"
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
                      className="w-full sm:w-auto px-8 py-3.5 border border-[#AD56C4]/35 text-[#AD56C4] hover:bg-[#AD56C4]/5 text-xs font-mono font-bold uppercase rounded-xl transition-all duration-300 cursor-pointer"
                    >
                      Ask Another Question
                    </button>
                  </motion.div>
                </motion.div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in w-full">
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
              )
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
                      <option>Others</option>
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
        </ScrollReveal>
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

      {/* Testimonial Submission Modal */}
      {showTestimonialModal && (
        <div className="fixed inset-0 bg-[#23152B]/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#AD56C4]/20 rounded-[28px] w-full max-w-lg p-5 sm:p-6 relative shadow-2xl flex flex-col max-h-[90vh] animate-fade-in text-center sm:text-left">
            <button
              onClick={() => setShowTestimonialModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors z-10"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>

            <div className="overflow-y-auto pr-1 -mr-1 space-y-4">
              {!testimonialSubmitted ? (
                <form onSubmit={handleTestimonialSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <h3 className="font-display text-lg sm:text-xl font-black text-[#23152B] tracking-tight">
                      Share Your Academy Review
                    </h3>
                    <p className="text-[11px] text-[#23152B]/70 leading-relaxed">
                      We would love to hear how Shelly Sharma Academy helped in your learning or speaking journey!
                    </p>
                  </div>

                  {/* Rating Stars & Full Name - 2 Column Row on sm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono tracking-wider text-[#AD56C4] font-bold uppercase text-left">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Pranoy Sharma"
                        value={testimonialForm.name}
                        onChange={e => setTestimonialForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-[#AD56C4]/20 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#AD56C4] placeholder-gray-400 text-left"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono tracking-wider text-[#AD56C4] font-bold uppercase text-left">
                        Your Rating *
                      </label>
                      <div className="flex space-x-1.5 justify-center sm:justify-start py-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setTestimonialForm(prev => ({ ...prev, rating: star }))}
                            className="p-0.5 hover:scale-110 transition-transform"
                          >
                            <Star
                              size={18}
                              className={star <= testimonialForm.rating ? "text-[#FF8DA1]" : "text-gray-200"}
                              fill={star <= testimonialForm.rating ? "currentColor" : "none"}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Designation & Location / Board - 2 Column Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono tracking-wider text-[#AD56C4] font-bold uppercase text-left">
                        Designation / Relation *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Parent of Class X Student"
                        value={testimonialForm.relation}
                        onChange={e => setTestimonialForm(prev => ({ ...prev, relation: e.target.value }))}
                        className="w-full px-3 py-2 border border-[#AD56C4]/20 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#AD56C4] placeholder-gray-400 text-left"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono tracking-wider text-[#AD56C4] font-bold uppercase text-left">
                        Location / Board
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Raipur (ICSE Board)"
                        value={testimonialForm.board}
                        onChange={e => setTestimonialForm(prev => ({ ...prev, board: e.target.value }))}
                        className="w-full px-3 py-2 border border-[#AD56C4]/20 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#AD56C4] placeholder-gray-400 text-left"
                      />
                    </div>
                  </div>

                  {/* Photo Upload with Drag & Drop - Slimmed down drastically */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono tracking-wider text-[#AD56C4] font-bold uppercase text-left">
                      Your Photo (Optional)
                    </label>
                    
                    {testimonialPhotoPreview ? (
                      <div className="flex items-center space-x-3 p-2 bg-[#AD56C4]/5 border border-[#AD56C4]/15 rounded-xl">
                        <img
                          src={testimonialPhotoPreview}
                          alt="Preview"
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#AD56C4]/30"
                        />
                        <div className="flex-1 text-left">
                          <p className="text-xs font-bold text-gray-700">Photo attached</p>
                          <p className="text-[9px] text-gray-400 font-mono">testimonial_images/uploaded</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTestimonialPhotoPreview("")}
                          className="text-[10px] text-red-500 hover:underline font-mono font-bold uppercase"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`border border-dashed rounded-xl p-2.5 text-center cursor-pointer transition-all ${
                          dragActive
                            ? "border-[#AD56C4] bg-[#AD56C4]/5"
                            : "border-gray-200 hover:border-[#AD56C4]/50 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                          id="testimonial-file-input"
                        />
                        <label htmlFor="testimonial-file-input" className="cursor-pointer flex items-center justify-center space-x-2 text-left">
                          <Upload size={14} className="text-[#AD56C4]" />
                          <span className="text-xs text-gray-600 font-medium">
                            <span className="text-[#AD56C4] font-bold underline">Click to upload</span> or drag and drop a image
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Testimonial Message */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono tracking-wider text-[#AD56C4] font-bold uppercase text-left">
                      Your Message / Review *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Describe how Shelly ma'am targeted your spoken English or class board exams..."
                      value={testimonialForm.text}
                      onChange={e => setTestimonialForm(prev => ({ ...prev, text: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#AD56C4]/20 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#AD56C4] placeholder-gray-400 resize-none leading-relaxed text-left"
                    />
                  </div>

                  {/* Actions */}
                  <div className="pt-1 flex flex-col sm:flex-row gap-2">
                    <button
                      type="submit"
                      disabled={isSubmittingTestimonial}
                      className="flex-1 py-2.5 bg-[#AD56C4] hover:bg-[#9642AB] disabled:bg-gray-200 text-white text-[11px] font-mono font-bold uppercase rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      {isSubmittingTestimonial ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Submit Review</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTestimonialModal(false)}
                      className="py-2.5 px-4 border border-gray-200 text-gray-600 hover:bg-gray-50 text-[11px] font-mono font-bold uppercase rounded-xl transition-all duration-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                // SUCCESS STATE: Beautiful Message with a Custom Book Illustration SVG
                <div className="py-4 flex flex-col items-center justify-center text-center space-y-4">
                  
                  {/* Custom Glowing Orator/Book Illustration SVG */}
                  <div className="relative">
                    <svg className="w-32 h-32 text-[#AD56C4] mx-auto" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="successBookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#AD56C4" />
                          <stop offset="100%" stopColor="#FF8DA1" />
                        </linearGradient>
                      </defs>
                      
                      {/* Floating magical particles */}
                      <circle cx="45" cy="55" r="4" fill="#FF8DA1" className="animate-ping" />
                      <circle cx="155" cy="45" r="5" fill="#AD56C4" className="animate-ping" style={{ animationDelay: "0.4s" }} />
                      <path d="M100 20 L104 28 L112 28 L106 34 L108 42 L100 37 L92 42 L94 34 L88 28 L96 28 Z" fill="#FF8DA1" className="animate-pulse" />

                      {/* Book Cover Background */}
                      <path
                        d="M25 135 C 55 145, 100 135, 100 135 C 100 135, 145 145, 175 135 L 175 75 C 145 85, 100 75, 100 75 C 100 75, 55 85, 25 75 Z"
                        fill="url(#successBookGrad)"
                        opacity="0.1"
                      />

                      {/* Main Left Page */}
                      <path
                        d="M32 128 C 57 138, 98 129, 98 129 L 98 69 C 98 69, 57 78, 32 68 Z"
                        fill="#FFFFFF"
                        stroke="#AD56C4"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                      />

                      {/* Main Right Page */}
                      <path
                        d="M168 128 C 143 138, 102 129, 102 129 L 102 69 C 102 69, 143 78, 168 68 Z"
                        fill="#FFFFFF"
                        stroke="#AD56C4"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                      />

                      {/* Decorative Leaves/Laurels framing the book */}
                      <path d="M20 100 C15 120 30 140 40 145" stroke="#FF8DA1" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
                      <path d="M180 100 C185 120 170 140 160 145" stroke="#FF8DA1" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />

                      {/* Written lines in pages */}
                      <path d="M45 82 H85" stroke="#AD56C4" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
                      <path d="M45 94 H78" stroke="#AD56C4" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
                      <path d="M45 106 H82" stroke="#AD56C4" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
                      <path d="M45 118 H68" stroke="#AD56C4" strokeWidth="2" strokeLinecap="round" opacity="0.4" />

                      <path d="M115 82 H155" stroke="#AD56C4" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
                      <path d="M115 94 H145" stroke="#AD56C4" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
                      <path d="M115 106 H152" stroke="#AD56C4" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
                      <path d="M115 118 H132" stroke="#AD56C4" strokeWidth="2" strokeLinecap="round" opacity="0.4" />

                      {/* Sparkle of excellence */}
                      <path
                        d="M100 55 C100 55 94 49 94 45 C94 45 97 42 101 42 C104 42 107 44 109 47 C111 44 114 42 117 42 C121 42 124 45 124 45 C124 45 119 51 119 55 L109 63 Z"
                        fill="url(#successBookGrad)"
                        className="animate-pulse"
                      />
                      
                      {/* Silk Ribbon Bookmark */}
                      <path d="M100 68 L100 136 L104 130 L108 136 L108 68 Z" fill="#FF8DA1" />
                      
                      {/* Spine Divider */}
                      <line x1="100" y1="69" x2="100" y2="129" stroke="#AD56C4" strokeWidth="2" opacity="0.7" />
                    </svg>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-display text-xl font-black text-[#23152B] tracking-tight">
                      Review Submitted Successfully!
                    </h3>
                    <p className="text-[10px] text-[#AD56C4] font-mono font-bold uppercase tracking-wider">
                      🎉 Thank You For Sharing Your Story
                    </p>
                  </div>

                  <p className="text-xs text-[#23152B]/85 max-w-sm leading-relaxed">
                    Your feedback is instantly featured in the Student Review showcase, helping inspire our next cohort of confident English speakers!
                  </p>

                  <div className="pt-2">
                    <button
                      onClick={() => setShowTestimonialModal(false)}
                      className="px-6 py-2.5 bg-[#23152B] hover:bg-[#AD56C4] text-white text-[10px] font-mono font-bold uppercase rounded-xl transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg"
                    >
                      Return to Showcase
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
