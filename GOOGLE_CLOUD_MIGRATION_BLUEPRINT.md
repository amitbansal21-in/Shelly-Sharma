# Google Cloud Production Migration Blueprint (v1.0)

This document contains the official production configuration guide, security architecture, and step-by-step checklist to migrate the **Shelly Sharma Academy** platform from the sandbox environment to the official production Google Cloud project owned by **`shellysharmamail@gmail.com`**.

---

## 👥 1. Production Ownership & Identity

To transition to production, the Google Cloud Project and Firebase App must be owned, administered, and authorized by the official academy email:
- **Primary Owner Account**: `shellysharmamail@gmail.com`
- **Authorized Developers / Admins**:
  - `amitbansal21@gmail.com` (System Integrator / Lead Developer)
  - `mail.shelly.sharma@gmail.com` (Academic Principal / Primary Educator)

The application code is already configured to restrict admin dashboard access to these exact accounts. No code changes are required.

---

## 🔌 2. Enabled Google Cloud APIs Checklist

Verify that the following APIs are explicitly enabled in the production Google Cloud project under **APIs & Services > Library**:

- [ ] **Gmail API**: Handles automated admissions email delivery, confirmation dispatches, and invoice notifications.
- [ ] **Google Sheets API**: Powering the real-time student CRM logging leads and schedules.
- [ ] **Google Calendar API**: Syncing user booking selections directly into Shelly Sharma's calendar.
- [ ] **Google Meet API**: Instantly generating secure classroom conference links appended to scheduled lessons.
- [ ] **Google Drive API**: Creating workspace folder structures for students' files, diagnostic tests, and essay worksheets.
- [ ] **Google Chat API**: Powering immediate system warning and booking logs to the admin Google Chat space.

---

## 🔑 3. Production Environment Variables

Ensure that the production hosting dashboard (e.g., Vercel, Netlify) is configured with these exact keys:

| Environment Variable Name | Value / Format | Exposure | Purpose |
| :--- | :--- | :--- | :--- |
| `VITE_GOOGLE_CLIENT_ID` | `[your-production-oauth-client-id].apps.googleusercontent.com` | Public Client | Google Account authorization flow |
| `VITE_GOOGLE_API_KEY` | `[your-production-google-api-key]` | Public Client | Sheets and Calendar reading operations |
| `VITE_ADMIN_EMAILS` | `shellysharmamail@gmail.com,amitbansal21@gmail.com,mail.shelly.sharma@gmail.com` | Public Client | Strict admin dashboard gatekeeping |
| `VITE_ADMIN_EMAIL` | `mail.shelly.sharma@gmail.com` | Public Client | Recipient address for course inquiries |

---

## 🏛️ 4. OAuth Consent Screen Configuration

To avoid warning screens and ensure seamless onboarding, configure the OAuth Consent Screen in the production GCP Console as follows:

- [ ] **User Type**: Set to **External**.
- [ ] **App Name**: `Shelly Sharma Academy`
- [ ] **User Support Email**: `shellysharmamail@gmail.com` (or `mail.shelly.sharma@gmail.com`)
- [ ] **Developer Contact Email**: `amitbansal21@gmail.com`
- [ ] **Authorized Domains**:
  - `shellysharma.co.in`
  - `www.shellysharma.co.in`
- [ ] **Required OAuth Scopes**:
  - `https://www.googleapis.com/auth/gmail.send`
  - `https://www.googleapis.com/auth/spreadsheets`
  - `https://www.googleapis.com/auth/calendar.events`
  - `https://www.googleapis.com/auth/drive.file`
- [ ] **Publishing Status**: Promote to **Production** and submit for official verification to remove the "Unverified App" screen.

---

## 🌐 5. Credentials & Redirect URI Setup

Create the Web OAuth Client under **Credentials > Create Credentials > OAuth Client ID > Web Application**:

### Authorized JavaScript Origins:
- `http://localhost:3000` (Local developer testing)
- `https://shellysharma.co.in` (Production Apex)
- `https://www.shellysharma.co.in` (Production Subdomain)

### Authorized Redirect URIs:
- `http://localhost:3000`
- `https://shellysharma.co.in`
- `https://www.shellysharma.co.in`

---

## 🛡️ 6. Post-Migration Verification Steps

Once production variables are active, execute this validation suite:

1. **Gatekeeper Validation**: Attempt to log in to `/control-center` with a non-whitelisted email. The system must block access. Log in with `shellysharmamail@gmail.com` or `amitbansal21@gmail.com` to confirm dashboard authorization.
2. **CRM Flow Check**: Fill out a booking reservation form on the live homepage. Confirm that the data is appended to the correct production Google Sheet instantly.
3. **Calendar Verification**: Open Google Calendar for `shellysharmamail@gmail.com` and verify that the scheduled diagnostic slot has been created with a secure Google Meet link attached.
4. **Gmail Dispatch Verification**: Verify that the student receives a styled HTML confirmation email, and that the administrator receives an alert mail.
5. **Offline Queue Sync Check**: Turn off internet access, submit a form, verify local storage queuing, restore connection, and verify automatic background synchronization.
