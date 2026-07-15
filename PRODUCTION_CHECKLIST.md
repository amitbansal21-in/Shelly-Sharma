# Production-Ready Quality Checklist

This checklist contains all recommended audits, checks, and configurations required to launch **Shelly Sharma Academy** with elite stability, security, and performance.

---

## 💻 1. Core Website & UI
- [ ] **Dynamic Pricing Calculations**: Check that the assessment calculator renders and runs correctly under various student parameters.
- [ ] **Cross-Browser Verification**: Check layout responsiveness, sticky headers, and backdrop blurs on Safari, Chrome, Firefox, and Edge.
- [ ] **Responsive Fluidity**: Test touch targets, bento cards, and scrolling behaviors on narrow mobile sizes (e.g., iPhone SE) up to ultra-wide desktop monitors.
- [ ] **404 Fallback**: Enter an invalid URL and verify that the user is presented with the customized `NotFoundPage` with a CTA to return home.

---

## 📈 2. SEO (Search Engine Optimization)
- [ ] **Page Title & Meta Descriptions**: Verify each route has optimized metadata length (Titles < 60 chars, Descriptions < 160 chars).
- [ ] **Single H1 Rule**: Ensure every page has exactly one `<h1>` containing primary search keywords.
- [ ] **JSON-LD Validation**: Pass the homepage HTML through the [Google Rich Results Test](https://search.google.com/test/rich-results) to verify all 7 schemas compile without errors.
- [ ] **Canonical Links**: Verify that canonical link attributes are present in the page `<head>` pointing back to the primary domain.
- [ ] **Sitemap Accessibility**: Confirm `/sitemap.xml` returns valid XML and that `/robots.txt` points directly to the sitemap URL.

---

## ⚡ 3. Performance & Core Web Vitals
- [ ] **Preload Key Assets**: Verify that `index.html` preloads the hero image (`/assets/Shelly.png`) to reduce Largest Contentful Paint (LCP) time.
- [ ] **Preconnect Font Servers**: Ensure preconnect links are active for Google Fonts API and static files.
- [ ] **Vite Asset Bundler**: Run `npm run build` and check that output bundle sizes are minified and code-split.
- [ ] **Lighthouse Audit**: Aim for score metrics of **95+** for Performance, SEO, and Best Practices.

---

## ♿ 4. Accessibility (WCAG 2.2 Alignment)
- [ ] **Contrast Ratios**: Verify text elements meet contrast requirements of at least **4.5:1** against backgrounds.
- [ ] **Keyboard Navgability**: Check that keyboard users can tab through all buttons, form fields, and FAQ accordions.
- [ ] **Alt Attributes**: Ensure all images under `/assets/` have descriptive alternative text for screen readers.
- [ ] **Focus Rings**: Confirm that active elements display focus outline rings during keyboard navigation.

---

## 🔒 5. Security Protocols
- [ ] **Content Security Policy (CSP)**: Verify CSP headers prevent script injections and unauthorized frames.
- [ ] **X-Content-Type-Options**: Confirm the `nosniff` header is present to protect users from content type sniffing attacks.
- [ ] **No Client-Side API Keys**: Ensure no private Google Cloud or Firebase server secrets are exposed in client-side code.
- [ ] **OAuth Scopes**: Restrict requested scopes to only what is required (`gmail.send`, `spreadsheets`, `calendar.events`).

---

## 🔌 6. Google Workspace & GCP
- [ ] **Google Cloud App Verification**: Complete Google Cloud Brand verification to remove warnings on the OAuth screen.
- [ ] **Spreadsheet CRM Target ID**: Confirm your CRM script points to the correct Google Sheet spreadsheet ID in production.
- [ ] **Active APIs Check**: Verify Gmail, Sheets, Calendar, and Chat APIs are enabled in the GCP Console.
- [ ] **Authorized Origins**: Ensure origins (`https://www.shellysharma.co.in`) are registered under OAuth Client Credentials.

---

## 🔥 7. Firebase Integration
- [ ] **Domain Authorization**: Add `www.shellysharma.co.in` and `shellysharma.co.in` to the authorized redirect list in the Firebase Console.
- [ ] **Firestore Rules**: Deploy secure read/write rules to prevent unauthorized database access.

---

## 🌐 8. Domain, SSL, & Search Console
- [ ] **Apex & Subdomain Redirects**: Configure 301 redirects to ensure `shellysharma.co.in` automatically forwards to `www.shellysharma.co.in` (or vice-versa).
- [ ] **Let’s Encrypt SSL**: Confirm SSL is active and redirecting HTTP traffic to HTTPS.
- [ ] **Google Search Console**: Verify domain ownership in Google Search Console and submit `/sitemap.xml`.
- [ ] **Google Analytics (GA4)**: Deploy GA4 tracking IDs via custom script tags or environment variables.

---

## 💾 9. Backup & Version Control
- [ ] **Local Storage Fallback**: Test that lead submissions are stored in local client memory if the network drops.
- [ ] **Git Backup**: Verify that all documentation, configurations, and core source files are tracked under the `main` branch on GitHub.
- [ ] **ZIP Archive**: Store a clean local copy of the code without build folders or `node_modules`.
