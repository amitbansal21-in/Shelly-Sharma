# SEO Structure & Indexation Blueprint

This document details the search engine optimization (SEO), metadata, semantic schema, and web crawling configuration for the **Shelly Sharma Academy** platform.

---

## 📈 Search Architecture Overview

To secure maximum topical authority in the English teaching, public speaking, and IELTS coaching space, the platform incorporates a zero-error technical SEO framework.

```
       [ Crawler Entry (robots.txt) ]
                      │
                      ▼
        [ XML Index Mapping (sitemap.xml) ]
                      │
                      ▼
  [ HTML Landmarks (H1-H6) & Schema.org JSON-LD (head) ]
```

---

## 📝 Document Head Structure

Every route served by the platform includes customized HTML headers in the main DOM.

### 1. Title & Meta Structure
- **Global Home Target**: `Shelly Sharma Academy | Oratory & Spoken English Mentor`
- **Dynamic Descriptions**: Max 160 characters describing Shelly Sharma's 10+ year pedigree, first-class B.Ed distinction, and custom academy curriculum.
- **Open Graph (OG) Tags**: Configured for social card platforms (Facebook, LinkedIn, X/Twitter) to display brand imagery (`SS Logo.png`), absolute URL destinations, and formatted descriptions.

### 2. Canonical URLs
- **Strategy**: Every routing page points back to its clean self-referential canonical destination.
- **Implementation**:
  ```html
  <link rel="canonical" href="https://www.shellysharma.co.in/" />
  ```
  This eliminates duplicate indexation issues and helps consolidate page rank.

---

## 🤖 Web Crawling Configurations

### 1. robots.txt
Located at `/public/robots.txt` / `/robots.txt`:
```txt
User-agent: *
Allow: /

Sitemap: https://www.shellysharma.co.in/sitemap.xml
```
- **Allow Rules**: Allows general crawler bots (Googlebot, Bingbot, etc.) to traverse all pages.
- **Sitemap Declaration**: Directs crawlers to the absolute location of the XML sitemap.

### 2. sitemap.xml
Located at `/public/sitemap.xml` / `/sitemap.xml`. It includes priority weighting for primary routes:
- `/` - **Priority 1.0** (weekly frequency)
- `/about` - **Priority 0.8** (weekly frequency)
- `/experience` - **Priority 0.8** (monthly frequency)
- `/teaching-philosophy` - **Priority 0.8** (monthly frequency)
- `/qualifications` - **Priority 0.7** (monthly frequency)
- `/academy` - **Priority 0.9** (weekly frequency)
- `/blog` - **Priority 0.8** (weekly frequency)
- `/contact` - **Priority 0.9** (weekly frequency)

---

## 🏛️ Structured Data Schema (JSON-LD)

The application injects seven highly structured schemas into `/index.html` to feed AI crawlers, knowledge graph engines, and rich-snippet displays:

1. **WebSite**: Establishes global URL name and search targets.
2. **EducationalOrganization**: Maps the physical address in Pune, India, along with contact types, admissions numbers, and brand logos.
3. **Person**: Highlights Shelly Sharma's professional role, background, work experience, and university alumni details (B.Ed distinction from Pune University, B.A. Honours Calcutta University).
4. **LocalBusiness**: Integrates localized coordinates (latitude: 18.5204, longitude: 73.8567) and hours of operations.
5. **Course list**: Enumerates individual course options (*Elite Spoken English Mastery*, *Advanced Grammar Clinics*, *High-Stakes Interview Prep*).
6. **FAQPage**: Supplies immediate answers to frequent learner queries to populate direct Google Search result tabs.
7. **BreadcrumbList**: Sets the relative directory structure.

---

## 🏷️ Content Hierarchy & Semantic Formatting

### 1. Heading Structure Strategy
- **Primary Page Target (H1)**: There must be exactly one high-priority `<h1>` per page.
  - *Home Example*: `<h1>Shelly Sharma Academy</h1>`
- **Subheadings Cascading**: Nested logical order (`H1` -> `H2` -> `H3`). Never skip heading levels.
- **Alphanumeric ID Rules**: Every major layout header includes a matching `id` attribute, facilitating indexation and section navigation anchor support.

### 2. Breadcrumbs Architecture
- **Helper Component**: `/src/components/Breadcrumbs.tsx`.
- **Purpose**: Generates visual, keyboard-focusable trail indicators showing nested pathing (e.g., `Home > Academy > Spoken English`).
- **Semantic Tags**: Mapped using `<nav aria-label="Breadcrumb">` wrapper with standard list formatting to enhance screen-reader indexation.
