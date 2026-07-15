# Production Deployment & Migration Guide

This document provides step-by-step instructions for deploying and migrating the **Shelly Sharma Academy** application to production.

---

## 🚀 Deployment Destinations

The application is fully client-side and can be hosted on high-performance static hosting platforms such as **Vercel**, **Netlify**, or **Cloudflare Pages**. This guide focuses on **Vercel** as the primary deployment destination.

```
       [ Local Code / Git Push ]
                   │
                   ▼
       [ GitHub Repository ]
                   │
                   ▼
 [ Vercel Production Build Engine (Vite) ]
                   │
                   ▼
  [ Global CDN (Edge Network Distribution) ]
```

---

## 🛠️ Deployment Steps

### 1. Vercel Deployment
1. Log in to the [Vercel Dashboard](https://vercel.com).
2. Click **Add New > Project**.
3. Import your GitHub repository (`amitbansal21-in/Shelly-Sharma`).
4. **Configure Project Settings**:
   - **Framework Preset**: select **Vite**.
   - **Root Directory**: `./` (Root).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Add Environment Variables**: Paste the required credentials (see [Environment Variables](#environment-variables)).
6. Click **Deploy**. Vercel will build the project and serve it via a global CDN.

### 2. Custom Domain Setup
1. In Vercel, go to **Settings > Domains**.
2. Add your custom domain: **`www.shellysharma.co.in`** (or `shellysharma.co.in`).
3. **Configure DNS Records**:
   - For Apex (`shellysharma.co.in`): Add an **A Record** pointing to `76.76.21.21`.
   - For Subdomain (`www`): Add a **CNAME Record** pointing to `cname.vercel-dns.com`.
4. **SSL Provisioning**: Vercel automatically generates and renews a Let’s Encrypt SSL certificate once DNS records propagate (typically within 10–30 minutes).

---

## 🔑 Environment Variables Configuration

Ensure the following variables are configured in the Vercel Dashboard under **Project Settings > Environment Variables**:

| Variable Name | Description | Placement |
| :--- | :--- | :--- |
| `VITE_GOOGLE_CLIENT_ID` | OAuth Client ID from Google Cloud | Client Environment |
| `VITE_GOOGLE_API_KEY` | Public Google API Key | Client Environment |
| `VITE_ADMIN_EMAILS` | Comma-separated Admin Emails | Client Environment |

---

## 📁 Google Cloud & Firebase Configuration

Before deployment, ensure Google Cloud and Firebase are configured for your production domain.

### 1. Google Cloud Console Configuration
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project and navigate to **APIs & Services > Credentials**.
3. Under **OAuth 2.0 Client IDs**, edit your active Web Client ID.
4. Update the **Authorized JavaScript Origins** section to include your production domain:
   - `https://www.shellysharma.co.in`
   - `https://shellysharma.co.in`
5. Update the **Authorized Redirect URIs** section to include:
   - `https://www.shellysharma.co.in`
   - `https://shellysharma.co.in`
6. Save the settings. DNS authorization changes may take up to 10 minutes to sync across Google networks.

### 2. Firebase Applet Setup
Verify your `firebase-applet-config.json` is updated with your production credentials.
- Ensure authentication domain lists include `www.shellysharma.co.in` to allow secure redirects.

---

## 📈 Post-Deployment Validation Checklist

Once your deployment completes, perform the following validation steps:

- [ ] **SSL Verification**: Open `https://www.shellysharma.co.in` in your browser. Verify the padlock icon indicates a valid connection.
- [ ] **SEO Check**: Verify that `robots.txt` and `sitemap.xml` are accessible via:
  - `https://www.shellysharma.co.in/robots.txt`
  - `https://www.shellysharma.co.in/sitemap.xml`
- [ ] **Google OAuth flow**: Open the Admin Control Center (`/control-center`) and click the OAuth sync button. Confirm that the Google Sign-In popup opens and redirects correctly on your custom domain.
- [ ] **Lead Submission**: Fill out the booking form on the homepage. Confirm that the submission completes, the success animation plays, and the data is synced to the Google Sheet.

---

## 🔄 Rollback Instructions

If a critical error is detected in production, rollback using one of the following methods:

### Method 1: Vercel Rollback (Instant)
1. In Vercel, navigate to the **Deployments** tab.
2. Select the last-known stable deployment (e.g., the previous build).
3. Click the vertical ellipsis menu and select **Rollback**.
4. Confirm the rollback. The deployment will be reverted globally within seconds.

### Method 2: Git Rollback (Terminal)
1. Identify the last stable commit hash using `git log`.
2. Reset your local master branch to the stable commit:
   ```bash
   git reset --hard <commit-hash>
   ```
3. Force-push to GitHub to trigger an automated rebuild on Vercel:
   ```bash
   git push -f origin main
   ```
