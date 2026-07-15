# Version 1 UI/UX Visual Design Specification
## Shelly Sharma – Professional Teacher Portfolio & Online English Academy

This document defines the complete visual design system, page-by-page layouts, spatial grids, typography pairings, component styling, content blocks, micro-interactions, and conversion pathways for Shelly Sharma's high-end personal brand website. 

---

## 1. Visual Identity & Brand Guidelines

### The "Hydrangea Academic Luxury" Aesthetic
The visual theme is designed to feel prestigious, feminine, warm, scholarly, and modern. It avoids cold tech-bro minimalisms or standard blue-toned tutor profiles. Instead, it takes inspiration from elite Swiss schools, classical British academies, and high-end personal portfolio showcases featured on Awwwards.

### Core Brand Colors (Hydrangea Palette)
*   **Primary Accent/Glow (Rose Pink):** `#FF8DA1` — Used for critical CTAs, active cursor highlights, key interactive states, and focal badges.
*   **Warm Background Layer (Soft Peach):** `#FFC2BA` — Used in 5% to 10% opacity fills for container cards, soft section dividers, and subtle gradient backdrops.
*   **High-End Accent/Flap (Luminous Orchid):** `#FF9CE9` — Used for decorative glowing rings, high-contrast text underscores, and hover-triggered micro-effects.
*   **Base Authority Tone (Warm Violet):** `#AD56C4` — Used for secondary headings, institutional borders, active timeline connectors, and academic tags.
*   **Deep Contrast Foundation (Charcoal Deep):** `#23152B` — The main text and core structural color, replacing harsh `#000000` with a deep, luxury purple-black.
*   **Pure Canvas Base (Alabaster White):** `#FAFAFA` and `#FFFFFF` — Establishes generous white space, cleanliness, and breathing room.

---

## 2. Typography System & Font Pairing Rules

*   **Display / Editorial Headers (Font Family: "Playfair Display", serif)**
    *   *Sizing:* `H1` (3.75rem / 60px), `H2` (2.5rem / 40px), `H3` (1.75rem / 28px)
    *   *Weight:* SemiBold (600) or Medium (500)
    *   *Application:* Page titles, high-impact quotes, and primary section headers. Evokes academic pedigree, Loreto Day School heritage, and classical literature expertise.
*   **System / Interface Text (Font Family: "Inter", sans-serif)**
    *   *Sizing:* Body (1rem / 16px), Labels (0.875rem / 14px), Mini Labels (0.75rem / 12px)
    *   *Weight:* Regular (400) for body, Medium (500) for UI lists, SemiBold (600) for buttons.
    *   *Application:* Paragraphs, lists, form inputs, button labels, and universal navigation links. Guarantees perfect readability across all screens.
*   **Metadata / Technical Accents (Font Family: "JetBrains Mono", monospace)**
    *   *Sizing:* Labels (0.8125rem / 13px)
    *   *Weight:* Medium (500)
    *   *Application:* Years on the career timeline, numerical stats, program category tags, and duration meta-labels.

---

## 3. Spatial System, Container Widths & Grids

*   **Standard Section Gaps:** `clamp(4.5rem, 8vw, 8rem)` — Ensures a spacious feel that builds trust and highlights core content.
*   **Maximum Page Width:** `1280px` (`max-w-7xl` in Tailwind) — Pinned to the center of the screen with a fluid side margin of `px-6` (24px) on mobile and `px-12` (48px) on desktop.
*   **Grid Framework:** Standard 12-column grid system for desktop layouts:
    *   *Hero Section:* Split into two asymmetrical columns: Left (7 columns) and Right (5 columns).
    *   *Course Programs Grid:* 3-column layout (4 columns per card) with a gap of `2rem` (32px).
    *   *Qualifications Grid:* 2-column or 4-column balanced bento layout depending on viewport width.
    *   *Contact Form Grid:* Split 50/50: Left column for communication details and a custom map; right column for the interactive input form.

---

## 4. Homepage Visual Layout Flow (Section-by-Section Spec)

### [SECTION 1] Global Sticky Navigation Header
*   **Desktop Layout:** Centered horizontal container (`h-20` / 80px), pinned to the viewport top.
    *   *Left:* Logo text `Shelly Sharma` in Playfair Display (22px, Medium, Charcoal Deep). Includes a small, elegant decorative peach dot.
    *   *Center:* Navigation menu (About, Experience, Programs, Credentials, Contact) with a subtle violet hover indicator.
    *   *Right:* Action button with a smooth Rose Pink transition ("Apply Now").
*   **Mobile Layout:** Compact menu header with a right-aligned hamburger menu. Tapping the menu triggers a full-screen glassmorphic overlay containing staggered nav links.
*   **Visual Details:** Background uses an ultra-clean translucent fill (`rgba(255, 255, 255, 0.75)`) with a backdrop blur of `16px` and a bottom border matching the warm violet palette.

---

### [SECTION 2] The Personal Brand Hero (Split Canvas)
An elegant, asymmetrical split layout designed to instantly communicate Shelly Sharma's elite teaching credentials.

```
+-----------------------------------------------------------------------------------------+
| [LOGO] Shelly Sharma .                 [ABOUT] [EXPERIENCE] [PROGRAMS]    [APPLY NOW]   |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  (Badge) 10+ Years Academic Excellence                                                  |
|                                                                                         |
|  <h1>Master English with a             +-----------------------------------------+      |
|      Distinguished Educator</h1>       |  [FLOATING CARD: B.Ed Distinction]       |      |
|                                        |                                         |      |
|  (Subtitle) Certified PGT Teacher      |             [PORTRAIT IMAGE]            |      |
|  (Description) Elevate your spoken     |               Shelly Sharma             |      |
|  English, academic scores, and         |          (Pink/Brown Saree Portrait)    |      |
|  conversational confidence under       |                                         |      |
|  a master mentor.                      |     [FLOATING CARD: 1000+ Students]     |      |
|                                        +-----------------------------------------+      |
|  [BOOK DEMO]  [DOWNLOAD RESUME]                                                         |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

*   **Left Column (7 Columns - Copy & Core Interaction):**
    *   *Strategic Badge:* Small, elegant tag stating `10+ Years Academic Excellence` in monospace type.
    *   *Primary Heading (H1):* Playfair Display text reading "Master English with a Distinguished Educator."
    *   *Animated Professional Subtitle (H2-Level):* Typed transition rotating through: `Academy Founder`, `Certified PGT Teacher`, `Grammar & Spoken English Mentor`.
    *   *Primary Copy:* "Elevate your spoken confidence, academic grades, and business communication under a certified educator with a B.Ed (Distinction) and MA in English."
    *   *CTA Group:* A primary Rose Pink button ("Book Free Demo") paired with a secondary outline button ("Download Resume").
*   **Right Column (5 Columns - Portrait & Floating Cards):**
    *   *The Portrait:* Displays the primary transparent portrait of Shelly Sharma wearing a pink/brown saree.
    *   *The Geometric Backdrop:* Placed behind the portrait, featuring a subtle purple hexagonal overlay with soft orange stripes.
    *   *Floating Cards System (Absolute Positioning - Balanced Layout):*
        *   *Card A (Top-Left):* `B.Ed Distinction` — Pinned to the top-left area. Includes a mini gold medallion icon.
        *   *Card B (Top-Right):* `MA English` — Floating in the upper-right region.
        *   *Card C (Middle-Left):* `10+ Years Experience` — Pinned near the left center.
        *   *Card D (Bottom-Right):* `1000+ Students Guided` — Anchored at the bottom-right corner.

---

### [SECTION 3] Why Learn from Shelly? (Core Value Rail)
*   **Visual Structure:** A horizontal row of three high-contrast benefit panels styled in 5% Warm Violet backgrounds.
*   **Core Panels:**
    *   *Pillar 1: Proven Pedagogical Success:* Highlighting her distinction degree and extensive school board experience.
    *   *Pillar 2: Output-Based LSRW Framework:* Highlighting her dynamic approach to Listening, Speaking, Reading, and Writing.
    *   *Pillar 3: Personalized Coaching:* Focusing on customized learning plans and student-centered lessons.

---

### [SECTION 4] The Classroom Methodology (Interactive LSRW Blueprint)
*   **Visual Structure:** Split container with a left column displaying a descriptive text module, and a right column containing a vertical stack of interactive methodology blocks.
*   **Methodology Cards:**
    *   `L` — **Listening Clinics:** "Developing active comprehension through curated auditory resources and vocabulary exercises."
    *   `S` — **Speaking Workshops:** "Developing conversational ease through debates, impromptu speeches, and structured discussions."
    *   `R` — **Reading Comprehension:** "Building advanced analytical skills through guided literature analysis and academic texts."
    *   `W` — **Writing Formats:** "Developing precise composition skills through essays, letters, and CBSE/ICSE writing exercises."

---

### [SECTION 5] The Academic Timeline (Full Career Journey)
A clean, vertical timeline path that showcases Shelly's extensive institutional teaching career since 2003.

```
       [2016 - 2018]  Kaanger Valley Academy (CBSE Affiliated)
                      PGT English Faculty for Grades XI & XII
                            │
       [2016 - 2016]  N.H.Goel World School (CBSE/Cambridge)
                      English and Social Studies Teacher
                            │
       [2014 - 2014]  Orchid International School (ICSE Affiliated)
                      Full-time Senior Residential English Faculty
                            │
       [2012 - 2012]  Ideal EduSystem & Aptech, Mumbai
                      Authoring Assignment & visiting English Professor
                            │
       [2010 - 2012]  The Learning Institute, Kolkata
                      Full-time Grades 7 to 12 English Teacher
                            │
       [2006 - 2010]  St. Dominic Savio School, Howrah (ICSE)
                      Senior English Instructor & Exam Supervisor
                            │
       [2003 - 2006]  I.P. Memorial School, Kolkata (ICSE)
                      Foundational Spoken & Written English Teacher
```

---

### [SECTION 6] Educational Qualifications & Academic Pedigree
*   **Visual Structure:** A balanced grid of structured cards detailing her university credentials and achievements.
*   **Core Cards:**
    *   *Bachelor in Education (B.Ed):* Pune University (2014) — Graduated with First Class with Distinction, specializing in English and History.
    *   *Masters of Arts (MA) in English:* IGNOU (2007) — Advanced studies in English Literature and Grammar.
    *   *Bachelor of Arts (BA) in English:* Calcutta University (2003).
    *   *Loreto Day School Alumna:* Pinned card celebrating her educational roots at St. Agnes' Convent and Loreto Day School.

---

### [SECTION 7] The Spoken English Academy (Program Offerings)
*   **Visual Structure:** A 3-column layout displaying premium, highly-polished program cards.
*   **Program Offerings:**
    1.  **Elite Spoken English:** Conversational fluency, pronunciation, and vocabulary for career growth.
    2.  **K-12 School Curriculum:** Comprehensive tutoring covering CBSE, ICSE, and Cambridge boards.
    3.  **Advanced Grammar Clinics:** Sentence structure, punctuation, and academic writing.
    4.  **Interview Preparation:** Answering interview questions confidently, public speaking, and self-presentation.
    5.  **Business Communication:** Writing professional emails, presentation skills, and corporate English.
    6.  **Personality Development:** Creative writing, public debates, and vocal projection.

---

### [SECTION 8] Featured Video Introduction
*   **Visual Structure:** A large, elegant center-aligned container displaying an interactive video placeholder frame.
*   **Visual Details:** Features a soft backdrop blur overlay, high-contrast play icons, and clear, welcoming labels.

---

### [SECTION 9] Verified Social Proof (Student & Parent Testimonials)
*   **Visual Structure:** A premium horizontal slider displaying glassmorphic review cards.
*   **Content Cards:** Features verified testimonials highlighting academic improvements and career advancements.

---

### [SECTION 10] Frequently Asked Questions (FAQ)
*   **Visual Structure:** A clean, vertical stack of expandable accordion components.
*   **Content Areas:** Addresses batch schedules, teaching formats (one-on-one/group), curriculum boards, and pricing options.

---

### [SECTION 11] High-Conversion Contact Station
*   **Visual Structure:** A 2-column layout. Left column displays physical address details (Pune, Maharashtra), email, and an interactive map card; right column contains the inquiry form.
*   **Form Elements:** Clean inputs, descriptive dropdown selections, and clear confirmation message areas.

---

### [SECTION 12] Global Footnote Footer
*   **Visual Structure:** A 4-column layout including quick links, courses, resources, social links, and licensing agreements.

---

## 5. UI Elements & Design Components

### Primary CTA Buttons
*   *Default State:* Solid Rose Pink (`#FF8DA1`) with sharp white typography. Rounded-full styling creates an approachable, modern feel.
*   *Hover State:* Translates up smoothly with an expanded shadow, transitioning into Warm Violet (`#AD56C4`).

### Program & Feature Cards
*   *Default State:* Soft borders with white card bodies and gentle shadows.
*   *Hover State:* Moves up by 4px, displaying a light colored border and a deep, spacious shadow.

---

## 6. Micro-interactions & Motion Rules

*   **Fades & Entrances:** Sections ease in from the bottom up as they enter the viewport, keeping page scrolls feeling natural.
*   **Orbiting Badges:** Floating cards in the hero section move slowly along subtle vertical paths to create visual interest.
*   **Interactive Controls:** Accordions expand with smooth transitions, and icons rotate elegantly to indicate their open states.

---

## 7. WordPress / Elementor Mapping Blueprint

Every section of the layout is designed to translate directly into independent, modular Elementor Pro Containers.

```
+-----------------------------------------------------------------------------------------+
| ELEMENTOR MASTER BLUEPRINT                                                              |
+-----------------------------------------------------------------------------------------+
| [Header_Section]    -> Sticky Flex Container with Backdrop Filter CSS.                 |
| [Hero_Section]      -> 2-Column Row Container with custom orbital card classes.         |
| [Pillars_Section]   -> 3-Column Column Grid Container.                                  |
| [Methodology_Sec]   -> Nested row containers mapping LSRW components.                   |
| [Timeline_Section]  -> Vertical alignment track with custom point offsets.              |
| [Academy_Programs]  -> 3-Column flex layouts with Card wrapper CSS.                     |
| [Testimonials_Sec]  -> Slider widget styled with custom CSS glassmorphic backgrounds.   |
| [Contact_Section]   -> 2-Column form template mapped to secure submission endpoints.    |
+-----------------------------------------------------------------------------------------+
```
