# Administrative Console & System Documentation

This document describes the administrative controls, CRM mechanics, background synchronization protocols, and security strategies of the **Shelly Sharma Academy** platform.

---

## 🔐 Authentication & Access Control

### 1. Admin Login URL
The Admin Control Panel is accessed via the route:
- **`https://www.shellysharma.co.in/control-center`** (or `/control-center` relative to the environment root).

### 2. Admin Authentication Details
- **Google OAuth Login**: Access is granted strictly to accounts authenticated via Google Sign-In.
- **Whitelist Checks**: The authentication pipeline validates the authenticated email against the admin whitelist declared in:
  - `VITE_ADMIN_EMAILS=amitbansal21@gmail.com,mail.shelly.sharma@gmail.com`
- **Session Management**: Session tokens are verified client-side. Unauthorized users are dynamically redirected to the `/` fallback view with an error message.

---

## 🚀 Key Admin Cockpit Features

The administrative console consists of four main dashboards:

```
+─────────────────────────────────────────────────────────────+
|                     ADMIN CONTROL PANEL                     |
+─────────────────────────────────────────────────────────────+
| [CRM Dashboard]  [Workspace Sync]  [Meeting Panel]  [Logs]  |
+─────────────────────────────────────────────────────────────+
```

### 1. CRM Dashboard
- **Active Lead Log**: Display of student leads, including names, registration preferences (e.g., *Spoken English*, *Grammar Clinics*, *IELTS General/Academic*), phone details, and availability notes.
- **Lead Operations**: Allows editing status markers, updating lead stages (New, Contacted, Scheduled, Joined), adding private annotations, and logging follow-ups.

### 2. Google Workspace Dashboard
- **Authorization Health**: Displays a real-time connection card for Google Drive, Calendar, Sheets, and Gmail.
- **Sync Metrics**: Tracks the number of successful spreadsheet writes, email notifications dispatched, and meeting creation events.

### 3. Meeting & Cohort Management
- **Meet Link Generator**: Instantly generate Google Meet links for specific students.
- **Calendar Dispatcher**: Syncs student consultations and cohort session blocks onto the primary Google Calendar.

### 4. Background Security & Notification Network

#### Offline Synchronization Queue
- **Resilience**: If a write fails due to internet disconnection, the booking system places the registration state into local client memory (`localStorage`).
- **Sync Reconciliation**: On restoration of online status, the synchronization worker fires background requests to Google Sheets to clear out backlog queue entries.

#### Notification System
- **Immediate Dispatches**: Alerts the admin via Google Chat spaces immediately upon receiving a registration.
- **Multi-party Dispatch**: Distributes confirmation receipts to students and alert cards to Shelly Sharma's target admission inboxes.

---

## 🛡️ Administrative Security Guidelines

1. **Keep Whitelists Small**: Never hardcode admin addresses in client files. Always read them from `.env` environment variables.
2. **Prevent Token Leakage**: Keep OAuth refresh tokens and API keys secure. Never print sensitive raw credentials or tokens to browser `console.log` statements in production environments.
3. **Session Purging**: Implement auto-logout cycles upon closing the tab or after 30 minutes of idle status.
