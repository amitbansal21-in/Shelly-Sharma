# Shelly Sharma Academy - Oratory & Spoken English Mentor

A high-performance, responsive web application for **Shelly Sharma Academy**, a premium platform specializing in elite spoken English coaching, public speaking mastery, IELTS preparation, and advanced grammar clinics. The application is built using React (Vite), TypeScript, and Tailwind CSS, featuring full Google Workspace integration (Gmail, Sheets, Calendar, Meet, Drive, Chat) and production-grade SEO, performance, and security configurations.

---

## 🚀 Live URLs
- **Development App**: [Live Demo](https://ais-dev-bbqt637cvaoh22zmhssnsl-23270869285.asia-east1.run.app)
- **Shared App**: [Staging Preview](https://ais-pre-bbqt637cvaoh22zmhssnsl-23270869285.asia-east1.run.app)

---

## ✨ Features

### 📖 Academic Pages & Sections
- **Home**: A visually polished landing page featuring a professional hero section, high-stakes introduction video, customizable assessment calculator, and elegant call-to-actions.
- **About**: Extensive background details on Shelly Sharma's university credentials, teaching pedigree, and structural methodologies.
- **Experience**: Highlighting 10+ years of institutional tenure at premier schools like N.H. Goel World School, Kaanger Valley Academy, and Aptech.
- **Teaching Philosophy**: Detailing the research-backed **LSRW Framework** (Listening, Speaking, Reading, Writing) and individualized diagnostics.
- **Qualifications**: Documented certifications including B.Ed. (Distinction, Pune University) and B.A. English (Honours, Calcutta University).
- **Academy**: Overview of core offerings: *Elite Spoken English Mastery*, *Advanced Grammar Clinics*, and *High-Stakes Interview Prep*.
- **Insights / Blog**: Rich informational articles providing free actionable tips on confidence, syntax precision, and academic IELTS strategies.
- **Contact & Booking**: Interactive online booking interface connected with Google Calendar and Gmail for automated admissions confirmation.
- **Policies**: Regulatory-compliant Privacy Policy and Terms and Conditions pages.

### ⚙️ Admin Control Center
- **Durable Dashboard**: Secure administrative cockpit allowing real-time status tracking for booking requests, CRM sheets sync, and API communication logs.
- **OAuth Management**: Integrated Google OAuth client synchronization to authorize API integrations.

### 🔌 Google Workspace Integrations
- **Gmail API**: Automatic multi-party dispatch of enrollment confirmations, secure invoice templates, and system alert updates.
- **Google Sheets API**: Real-time customer relationship management (CRM) synchronization, logging student leads, course selections, and timestamps instantly.
- **Google Calendar API**: Dynamic event dispatch and schedule creation for live consultation sessions.
- **Google Meet API**: Automated generation of secure conference credentials attached to booking slots.
- **Google Drive API**: File submission pipeline for storing writing worksheets and diagnostic tests securely inside designated folders.
- **Google Chat API**: Integrated webhook bot alerting the admin channel on form submissions.

---

## 🛠️ Technology Stack
- **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Motion (Framer Motion)](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **SEO Elements**: Comprehensive JSON-LD structured data schemas (Organization, Person, Course, FAQ, Breadcrumbs, LocalBusiness, WebSite) and fully optimized `sitemap.xml` and `robots.txt`.

---

## 📦 Project Directory Structure

```bash
├── assets/                  # Local images, certificates, and logos
├── public/                  # Static assets (favicon, sitemap, robots, JSON-LD schemas)
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── components/          # Modular page components (Home, About, Contact, Academy, etc.)
│   ├── lib/                 # Core Google API wrappers (CRM, Calendar, Gmail, Chat)
│   ├── App.tsx              # Main routing and navigation controller
│   ├── data.ts              # Local centralized mock datasets and metadata
│   ├── index.css            # Tailwind global stylesheets and typography configuration
│   ├── main.tsx             # Application bootstrap file
│   └── types.ts             # Shared TypeScript structures and interface definitions
├── index.html               # Primary DOM entrypoint with preloads and security headers
├── package.json             # NPM package dependencies and automation scripts
├── tsconfig.json            # TypeScript engine rules
└── vite.config.ts           # Vite Bundler configurations
```

---

## ⚙️ Setup & Installation

### Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18+) and `npm` installed.

1. **Clone the Repository**
   ```bash
   git clone https://github.com/amitbansal21-in/Shelly-Sharma.git
   cd Shelly-Sharma
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

---

## 💻 Development & Build Scripts

1. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) inside your browser.

2. **Build for Production**
   ```bash
   npm run build
   ```

3. **Code Quality Controls**
   ```bash
   npm run lint
   ```

---

## 🌍 Environment Variables Configuration

Create a `.env` file at the root of the project using `.env.example` as a template:
```env
# Google Workspace API Credentials
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_GOOGLE_API_KEY=your_api_key_here

# Admin White-listed Emails
VITE_ADMIN_EMAILS=amitbansal21@gmail.com,mail.shelly.sharma@gmail.com
```

---

## 🔌 Google Workspace Setup
1. Enable Sheets, Gmail, Calendar, and Chat APIs in the Google Cloud Console.
2. Obtain OAuth 2.0 Web Client Credentials and update the JS Authorized Origins to match your production domain.
3. Configure `VITE_GOOGLE_CLIENT_ID` in your production environments.

---

## 🛠️ Admin Control Center Guide
The Admin Panel is fully accessible via `/control-center`. 
- Log in securely via Google Account authentication.
- Access the **CRM Lead Management**, **Google API Sync Checks**, and **Meeting Generation** blocks.

---

## 🛡️ Production Quality Controls
- **SEO Optimized**: Compliant with standard schema specifications. Contains single primary H1 hierarchy with logical heading flow.
- **Accessibility Friendly**: Complete keyboard tab focus management, semantic ARIA roles, and high-contrast color balances.
- **Highly Secure**: Fortified with client-side Content Security Policy (CSP) headers protecting from script injects and XSS.
- **Optimized Performance**: DNS Prefetch, Font Preconnects, and preloaded Critical Hero Graphics ensure strong Core Web Vitals (FCP/LCP) scores.

---

## 📞 Support & Maintenance
For system support, updates, or maintenance queries:
- **Project Lead**: Amit Bansal ([amitbansal21@gmail.com](mailto:amitbansal21@gmail.com))
- **Primary Educator**: Shelly Sharma ([mail.shelly.sharma@gmail.com](mailto:mail.shelly.sharma@gmail.com))

---

## 📄 License
This project is proprietary and custom-built for **Shelly Sharma Academy**. All rights reserved.
