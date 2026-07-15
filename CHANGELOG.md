# CHANGELOG

## [1.0.0] - 2026-07-15
Official Production-Ready Release candidate backup.

### Completed Features

#### 🔌 Google Workspace Integrations
- **Gmail API Integration**: Implemented custom REST-based triggers for admissions, invoice triggers, and multi-party automated confirmations.
- **Google Sheets CRM Sync**: Designed full synchronizer logs for student contacts, interest metrics, selected courses, and submission timestamp records.
- **Google Calendar API**: Connected live booking inputs to reserve scheduling blocks directly on the administrator's Google calendar.
- **Google Meet API**: Generated unique, dynamic meeting invitation codes and secure conference URLs mapped to reservations.
- **Google Drive API**: Upload pipelines for diagnostic writing sheets, files, and placement tests.
- **Google Chat API**: Integrated webhook bots dispatching notifications to administrator alert spaces for new leads.

#### 🛠️ Admin Control Center (Dashboard)
- **Interactive Control Cockpit**: Developed administrative panels displaying recent inquiries, status checklists, and system metrics.
- **OAuth Sync Tracker**: Built interface displays indicating active Google API authentication tokens and sync status.
- **Lead CRM & Booking Panels**: Allows real-time curation of booked appointments, notes addition, and custom manual meeting overrides.

#### 🎨 Pages & Routing
- **12 Full Pages + Modular Navigation**:
  - **Home Page**: Complete with high-impact video, curriculum grids, pricing matrices, and call-to-actions.
  - **About Page**: Showcasing credentials, Loreto Day School heritage, and background timelines.
  - **Experience Page**: Highlighting institutional boarding school tenures with visual badges.
  - **Teaching Philosophy Page**: Explaining the customized LSRW framework and pedagogical blueprints.
  - **Qualifications Page**: Detailed presentation of B.Ed (Distinction) and M.A. English degrees.
  - **Academy Page**: Catalog listing of speaking mastery courses, clinics, and interview coaching.
  - **Blog / Insights**: Placeholders and template setups ready for organic search content delivery.
  - **Contact Page**: Interactive booking forms connected with Workspace schedulers.
  - **Privacy Page**: Fully compliant legal terms protecting student privacy.
  - **Terms Page**: Legal requirements, cohort guidelines, and rules of engagement.
  - **Control Center**: Secured admin panel.
  - **NotFound Page**: 404 page for route fallback.

#### 📈 SEO & Search Dominance
- **Structured JSON-LD Schema**:
  - `WebSite` Schema
  - `EducationalOrganization` Schema
  - `Person` (Shelly Sharma) Schema
  - `LocalBusiness` Schema (localized to Pune)
  - `Course` List Schema
  - `FAQPage` Schema (answering core enrollment questions)
  - `BreadcrumbList` Schema
- **Crawling Files**: Updated `/robots.txt` and `/public/sitemap.xml` with absolute page lists and optimal crawlers directions.

#### 🔒 Security
- **Content Security Policy (CSP)**: Added rigid CSP headers to the main DOM, preventing external script injections, XSS vulnerabilities, and unauthorized frame embeds.
- **X-Content-Type-Options**: Explicitly configured `nosniff` preventing browser content sniffing.

#### 🚀 Performance
- **Preloading & Preconnecting**: Built preconnect links for high-speed font load from Google, and preloaded the critical hero image `/assets/Shelly.png` to maximize LCP speeds.
- **Asset Optimization**: Sized, structured, and organized high-resolution graphics and media resources under `/assets/`.

#### ✨ Animations
- **Motion (Framer Motion)**: Standardized soft, elegant page-entry fades, bento-grid expansions, and timeline line fill animations using hardware-accelerated Bezier curves.

---

### Known Production Tasks
- **OAuth Consent Verification**: Complete official Google Cloud Brand Verification to clear the "unverified app" screen for OAuth login.
- **Firebase Deployment**: Deploy security rules for authenticated firestore operations when transitioning beyond basic client-side queues.
- **Production Email Configuration**: Verify domain DNS records (SPF, DKIM, DMARC) for SMTP/REST mail deliveries.
