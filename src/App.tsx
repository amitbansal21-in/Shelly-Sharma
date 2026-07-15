import React, { useState, useEffect } from "react";
import { Menu, X, Shield } from "lucide-react";
import HomePage from "./components/HomePage";
import AboutPage from "./components/AboutPage";
import ExperiencePage from "./components/ExperiencePage";
import QualificationsPage from "./components/QualificationsPage";
import AcademyPage from "./components/AcademyPage";
import BlogPage from "./components/BlogPage";
import ContactPage from "./components/ContactPage";
import PrivacyPage from "./components/PrivacyPage";
import TermsPage from "./components/TermsPage";
import NotFoundPage from "./components/NotFoundPage";
import TeachingPhilosophyPage from "./components/TeachingPhilosophyPage";
import ControlCenterPage from "./components/ControlCenterPage";

export default function App() {
  const [activePage, setActivePage] = useState<string>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [preselectedProgram, setPreselectedProgram] = useState("");

  // Synchronize state with URL pathname on load and popstate
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname.replace(/^\/|\/$/g, "");
      if (path === "teaching-philosophy") {
        setActivePage("teaching-philosophy");
      } else if (path === "about") {
        setActivePage("about");
      } else if (path === "experience") {
        setActivePage("experience");
      } else if (path === "qualifications") {
        setActivePage("qualifications");
      } else if (path === "academy") {
        setActivePage("academy");
      } else if (path === "blog") {
        setActivePage("blog");
      } else if (path === "contact") {
        setActivePage("contact");
      } else if (path === "privacy") {
        setActivePage("privacy");
      } else if (path === "terms") {
        setActivePage("terms");
      } else if (path === "control-center") {
        // Automatically redirect to /admin
        try {
          window.history.replaceState(null, "", "/admin");
        } catch (e) {}
        setActivePage("admin");
      } else if (path === "admin") {
        setActivePage("admin");
      } else if (path === "" || path === "home") {
        setActivePage("home");
      }
    };

    handleUrlChange();
    window.addEventListener("popstate", handleUrlChange);
    return () => window.removeEventListener("popstate", handleUrlChange);
  }, []);

  // Scroll to top on page change, and handle SEO robots metadata & canonical tags
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setMobileMenuOpen(false);

    // Robots and Canonical handling
    if (activePage === "admin") {
      // Add meta noindex for admin route
      let meta = document.querySelector('meta[name="robots"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'robots');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', 'noindex,nofollow,noarchive,nosnippet');

      // Update canonical url
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', 'https://shellysharma.co.in/admin');
    } else {
      // Restore normal or remove meta for public pages
      const meta = document.querySelector('meta[name="robots"]');
      if (meta) {
        meta.parentNode?.removeChild(meta);
      }
      
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        const path = activePage === "home" ? "" : activePage;
        canonical.setAttribute('href', `https://shellysharma.co.in/${path}`);
      }
    }
  }, [activePage]);

  const handleEnrollInCourse = (courseTitle: string) => {
    setPreselectedProgram(courseTitle);
    setActivePage("contact");
    try {
      window.history.pushState(null, "", "/contact");
    } catch (e) {}
  };

  const navigateToPage = (page: string) => {
    setPreselectedProgram(""); // Clear preselection when navigating normally
    setActivePage(page);
    try {
      const targetPath = page === "home" ? "/" : `/${page}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, "", targetPath);
      }
    } catch (e) {
      // Avoid sandbox security warnings
    }
  };

  // Render sub-components dynamically
  const renderActivePage = () => {
    switch (activePage) {
      case "home":
        return (
          <HomePage
            onNavigateToPage={navigateToPage}
            onEnrollInCourse={handleEnrollInCourse}
          />
        );
      case "about":
        return (
          <AboutPage
            onHomeClick={() => navigateToPage("home")}
            onContactClick={() => navigateToPage("contact")}
            onAcademyClick={() => navigateToPage("academy")}
            onNavigateToPage={navigateToPage}
          />
        );
      case "experience":
        return (
          <ExperiencePage
            onHomeClick={() => navigateToPage("home")}
            onContactClick={() => navigateToPage("contact")}
            onAboutClick={() => navigateToPage("teaching-philosophy")}
            onNavigateToPage={navigateToPage}
          />
        );
      case "teaching-philosophy":
        return (
          <TeachingPhilosophyPage
            onHomeClick={() => navigateToPage("home")}
            onContactClick={() => navigateToPage("contact")}
            onAcademyClick={() => navigateToPage("academy")}
            onNavigateToPage={navigateToPage}
          />
        );
      case "qualifications":
        return (
          <QualificationsPage
            onHomeClick={() => navigateToPage("home")}
            onContactClick={() => navigateToPage("contact")}
            onNavigateToPage={navigateToPage}
          />
        );
      case "academy":
        return (
          <AcademyPage
            onHomeClick={() => navigateToPage("home")}
            onEnrollClick={handleEnrollInCourse}
            onNavigateToPage={navigateToPage}
          />
        );
      case "blog":
        return (
          <BlogPage
            onHomeClick={() => navigateToPage("home")}
            onNavigateToPage={navigateToPage}
          />
        );
      case "contact":
        return (
          <ContactPage
            onHomeClick={() => navigateToPage("home")}
            preselectedProgram={preselectedProgram}
            onNavigateToPage={navigateToPage}
          />
        );
      case "privacy":
        return <PrivacyPage onHomeClick={() => setActivePage("home")} />;
      case "terms":
        return <TermsPage onHomeClick={() => setActivePage("home")} />;
      case "admin":
        return <ControlCenterPage onHomeClick={() => navigateToPage("home")} />;
      default:
        return <NotFoundPage onHomeClick={() => setActivePage("home")} />;
    }
  };

  if (activePage === "admin") {
    return <ControlCenterPage onHomeClick={() => navigateToPage("home")} />;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-[#FAFAFA] text-[#23152B] selection:bg-[#FF8DA1] selection:text-white font-sans antialiased">
      
      {/* 1. Sticky Premium Glassmorphism Header */}
      <header className="sticky top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-[#AD56C4]/15 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          
          {/* Logo / Personal Brand Name */}
          <button
            className="flex items-center space-x-2 cursor-pointer text-left focus:outline-none"
            onClick={() => navigateToPage("home")}
          >
            <div className="w-10 h-10 rounded-full bg-[#FAF7F2] flex items-center justify-center shadow-md overflow-hidden border border-[#AD56C4]/20 p-1">
              <img src="/assets/SS Logo.png" alt="Shelly Sharma Academy Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-display text-xl font-bold tracking-tight text-[#23152B] hover:text-[#AD56C4] transition-colors duration-300">
                Shelly Sharma
              </span>
              <span className="block text-[10px] uppercase tracking-widest font-mono text-[#AD56C4] font-semibold">
                Online Academy
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8" aria-label="Main Navigation">
            <button
              onClick={() => navigateToPage("about")}
              className={`text-sm font-medium transition-colors duration-200 cursor-pointer ${
                activePage === "about" ? "text-[#AD56C4] font-bold" : "text-[#23152B]/85 hover:text-[#AD56C4]"
              }`}
            >
              About
            </button>
            <button
              onClick={() => navigateToPage("experience")}
              className={`text-sm font-medium transition-colors duration-200 cursor-pointer ${
                activePage === "experience" ? "text-[#AD56C4] font-bold" : "text-[#23152B]/85 hover:text-[#AD56C4]"
              }`}
            >
              Experience
            </button>
            <button
              onClick={() => navigateToPage("teaching-philosophy")}
              className={`text-sm font-medium transition-colors duration-200 cursor-pointer ${
                activePage === "teaching-philosophy" ? "text-[#AD56C4] font-bold" : "text-[#23152B]/85 hover:text-[#AD56C4]"
              }`}
            >
              Philosophy
            </button>
            <button
              onClick={() => navigateToPage("qualifications")}
              className={`text-sm font-medium transition-colors duration-200 cursor-pointer ${
                activePage === "qualifications" ? "text-[#AD56C4] font-bold" : "text-[#23152B]/85 hover:text-[#AD56C4]"
              }`}
            >
              Qualifications
            </button>
            <button
              onClick={() => navigateToPage("academy")}
              className={`text-sm font-medium transition-colors duration-200 cursor-pointer ${
                activePage === "academy" ? "text-[#AD56C4] font-bold" : "text-[#23152B]/85 hover:text-[#AD56C4]"
              }`}
            >
              Academy
            </button>
            <button
              onClick={() => navigateToPage("blog")}
              className={`text-sm font-medium transition-colors duration-200 cursor-pointer ${
                activePage === "blog" ? "text-[#AD56C4] font-bold" : "text-[#23152B]/85 hover:text-[#AD56C4]"
              }`}
            >
              Insights
            </button>
            <button
              onClick={() => navigateToPage("contact")}
              className={`text-sm font-medium transition-colors duration-200 cursor-pointer ${
                activePage === "contact" ? "text-[#AD56C4] font-bold" : "text-[#23152B]/85 hover:text-[#AD56C4]"
              }`}
            >
              Contact
            </button>
          </nav>

          {/* Desktop Right Action */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => navigateToPage("contact")}
              className="px-6 py-2.5 bg-[#FF8DA1] hover:bg-[#AD56C4] text-white text-xs font-bold tracking-wider uppercase rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
            >
              Join Academy
            </button>
          </div>

          {/* Hamburger Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#23152B] hover:text-[#AD56C4] transition-colors duration-200 focus:outline-none"
            aria-label="Toggle Mobile Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Premium Full-Screen Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#23152B]/95 backdrop-blur-lg flex flex-col justify-center items-center text-white transition-all duration-500 animate-fade-in">
          <div className="absolute top-6 right-6">
            <button onClick={() => setMobileMenuOpen(false)} className="p-3 text-white/80 hover:text-white cursor-pointer">
              <X size={32} />
            </button>
          </div>
          <nav className="flex flex-col space-y-6 text-center text-xl font-display font-medium">
            <button onClick={() => navigateToPage("home")} className="hover:text-[#FF8DA1] transition-colors duration-300 cursor-pointer">Home</button>
            <button onClick={() => navigateToPage("about")} className="hover:text-[#FF8DA1] transition-colors duration-300 cursor-pointer">About Shelly</button>
            <button onClick={() => navigateToPage("experience")} className="hover:text-[#FF8DA1] transition-colors duration-300 cursor-pointer">Career Journey</button>
            <button onClick={() => navigateToPage("teaching-philosophy")} className="hover:text-[#FF8DA1] transition-colors duration-300 cursor-pointer">Teaching Philosophy</button>
            <button onClick={() => navigateToPage("qualifications")} className="hover:text-[#FF8DA1] transition-colors duration-300 cursor-pointer">Academics</button>
            <button onClick={() => navigateToPage("academy")} className="hover:text-[#FF8DA1] transition-colors duration-300 cursor-pointer">Academy Programs</button>
            <button onClick={() => navigateToPage("blog")} className="hover:text-[#FF8DA1] transition-colors duration-300 cursor-pointer">Insights Blog</button>
            <button onClick={() => navigateToPage("contact")} className="hover:text-[#FF8DA1] transition-colors duration-300 cursor-pointer">Contact Desk</button>
            <button
              onClick={() => navigateToPage("contact")}
              className="mt-4 px-8 py-3 bg-[#FF8DA1] hover:bg-[#AD56C4] text-white text-sm font-bold tracking-wider uppercase rounded-full shadow-lg transition-all duration-300 cursor-pointer"
            >
              Secure Batch Slot
            </button>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main id="main-content" className="flex-grow">
        {renderActivePage()}
      </main>

      {/* Luxury Brand Footer */}
      <footer className="bg-[#23152B] text-white py-16 px-6 lg:px-12 border-t border-white/10 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Column 1: Brand Info */}
          <div className="md:col-span-4 space-y-6">
            <button
              onClick={() => navigateToPage("home")}
              className="flex items-center space-x-2 text-left focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center overflow-hidden border border-white/10 p-1">
                <img src="/assets/SS Logo.png" alt="Shelly Sharma Academy Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-display text-xl font-bold text-white tracking-tight">Shelly Sharma</span>
            </button>
            <p className="text-xs text-white/70 leading-relaxed">
              University certified English teacher (B.Ed Distinction, M.A. English) with over 10 years of classroom instruction inside India’s premier residential and boarding academies. Developing spoken confidence and academic excellence globally.
            </p>
            <div className="text-[10px] font-mono text-white/40">
              <p>Pune, Maharashtra, India</p>
              <p className="mt-1">Active Hours: 9:00 AM – 7:00 PM IST</p>
            </div>
          </div>

          {/* Column 2: Sitemap Navigation */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="font-mono text-xs font-bold tracking-wider uppercase text-[#FF8DA1]">Sitemap</h4>
            <ul className="space-y-2 text-xs text-white/70 font-medium">
              <li>
                <button onClick={() => navigateToPage("home")} className="hover:text-white transition-colors cursor-pointer text-left">Academy Home</button>
              </li>
              <li>
                <button onClick={() => navigateToPage("about")} className="hover:text-white transition-colors cursor-pointer text-left">About Shelly</button>
              </li>
              <li>
                <button onClick={() => navigateToPage("experience")} className="hover:text-white transition-colors cursor-pointer text-left">Career Track</button>
              </li>
              <li>
                <button onClick={() => navigateToPage("teaching-philosophy")} className="hover:text-white transition-colors cursor-pointer text-left">Teaching Philosophy</button>
              </li>
              <li>
                <button onClick={() => navigateToPage("qualifications")} className="hover:text-white transition-colors cursor-pointer text-left">Qualifications</button>
              </li>
              <li>
                <button onClick={() => navigateToPage("academy")} className="hover:text-white transition-colors cursor-pointer text-left">Academy Courses</button>
              </li>
              <li>
                <button onClick={() => navigateToPage("blog")} className="hover:text-white transition-colors cursor-pointer text-left">Strategy Blog</button>
              </li>
              <li>
                <button onClick={() => navigateToPage("contact")} className="hover:text-white transition-colors cursor-pointer text-left">Contact Desk</button>
              </li>
            </ul>
          </div>

          {/* Column 3: Academy Courses Spotlights */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="font-mono text-xs font-bold tracking-wider uppercase text-[#FF8DA1]">Academy Programs</h4>
            <ul className="space-y-2 text-xs text-white/70 font-medium">
              <li>
                <button onClick={() => handleEnrollInCourse("Elite Spoken English Mastery")} className="hover:text-white transition-colors cursor-pointer text-left">Elite Spoken English</button>
              </li>
              <li>
                <button onClick={() => handleEnrollInCourse("Advanced Grammar & Syntax Clinics")} className="hover:text-white transition-colors cursor-pointer text-left">Advanced Grammar Clinics</button>
              </li>
              <li>
                <button onClick={() => handleEnrollInCourse("High-Stakes Interview Preparation")} className="hover:text-white transition-colors cursor-pointer text-left">High-Stakes Interviews</button>
              </li>
              <li>
                <button onClick={() => handleEnrollInCourse("ICSE / CBSE Academic Board Prep")} className="hover:text-white transition-colors cursor-pointer text-left">CBSE / ICSE Board Prep</button>
              </li>
              <li>
                <button onClick={() => handleEnrollInCourse("Corporate English & Executive Speech")} className="hover:text-white transition-colors cursor-pointer text-left">Executive Business Speech</button>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter & Security Signatures */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="font-mono text-xs font-bold tracking-wider uppercase text-[#FF8DA1]">Insights Newsletter</h4>
            <p className="text-xs text-white/70 leading-relaxed">
              Subscribe to receive free literature guides, pronunciation worksheets, and batch notifications directly from an educator.
            </p>
            
            {/* Minimal newsletter form */}
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder="Enter email..."
                className="bg-white/10 border border-white/20 px-3 py-2 rounded-lg text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#FF8DA1] w-full"
              />
              <button
                onClick={() => alert("Thank you for subscribing to our pedagogical newsletter!")}
                className="px-3 py-2 bg-[#FF8DA1] hover:bg-[#AD56C4] text-white text-xs font-bold rounded-lg transition-colors duration-200 cursor-pointer"
              >
                Join
              </button>
            </div>
            
            <div className="pt-2 flex items-center space-x-2 text-[9px] font-mono text-white/40 uppercase">
              <Shield size={12} className="text-[#FF8DA1]" />
              <span>Secure & Privacy Protected</span>
            </div>
          </div>

        </div>

        {/* Legal and Copyright bar */}
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50 font-medium">
          <p>© 2026 Shelly Sharma Online English Academy. All Rights Reserved.</p>
          <div className="flex space-x-6">
            <button onClick={() => navigateToPage("privacy")} className="hover:text-white transition-colors cursor-pointer">
              Privacy Policy
            </button>
            <button onClick={() => navigateToPage("terms")} className="hover:text-white transition-colors cursor-pointer">
              Terms & Conditions
            </button>
            <button onClick={() => navigateToPage("404")} className="hover:text-white transition-colors cursor-pointer">
              Sitemap Node
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
