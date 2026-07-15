# Google Workspace Integration & Architecture Documentation

This document outlines the design, architecture, and configurations of the **Google Workspace API Suite** and the **Google Cloud Console** integration.

---

## 🔌 Core Integrations

### 1. Gmail API Integration
- **Purpose**: Automatic communication dispatch on student bookings.
- **Workflow**:
  - Automatically dispatches high-end, customized HTML enrollment confirmations to students.
  - Sends immediate email notification alerts containing registration details to the administrator's inbox.
  - Formulates payment invoice notifications and course joining parameters.
- **Service Layer**: `/src/lib/gmail.ts` (REST-based Gmail API dispatch).

### 2. Google Sheets CRM Integration
- **Purpose**: Direct lead tracking and student data logging.
- **Workflow**:
  - Direct logs of prospective student entries: Name, Email, Phone number, Chosen courses, Availability preferences, and UTM source parameters.
  - Acts as a decentralized, zero-cost customer relationship management (CRM) logging station.
- **Service Layer**: `/src/lib/crm.ts`.

### 3. Google Calendar API Integration
- **Purpose**: Automatic booking reservations.
- **Workflow**:
  - Checks slot availability and schedules interactive 1-on-1 consultations directly onto the Admin's calendar.
  - Pushes ICS file generation as a fallback option for offline systems.
- **Service Layer**: `/src/lib/calendar-ics.ts`.

### 4. Google Meet API Integration
- **Purpose**: Virtual classrooms and meeting credentials.
- **Workflow**:
  - Automatically appends a secure video conferencing meeting link to any Calendar event reservation.
  - Dispatches meeting IDs and access passcodes in the Gmail confirmation mail.

### 5. Google Drive API Integration
- **Purpose**: File submission and syllabus downloads.
- **Workflow**:
  - Upload folder triggers for students' diagnostics results, writing worksheets, and placement essays.
  - Serves direct, secure download pointers for learning resources.

### 6. Google Chat API Integration
- **Purpose**: Real-time admin workspace alerts.
- **Workflow**:
  - Webhook pipeline transmitting card messages to the Admin's Google Chat spaces on any form submission.
- **Service Layer**: `/src/lib/chat.ts`.

### 7. Firebase Authentication
- **Purpose**: Secure client access and administrative portals.
- **Workflow**:
  - Handles administrative credentials securely via Firebase auth tokens.

---

## 🔑 OAuth & Authentication Flow

The application integrates with the standard Google Identity services.

```
[ User UI Booking ] ──► [ Request Access ] ──► [ Google Account Sign In ]
                                                      │
[ CRM Updated ] ◄─────── [ Authorized Token ] ◄───────┘
```

---

## 📦 Required APIs & Scopes

### Google Cloud Console APIs to Enable:
1. **Gmail API**
2. **Google Sheets API**
3. **Google Calendar API**
4. **Google Drive API**
5. **Google Chat API**

### Required OAuth Scopes:
- `https://www.googleapis.com/auth/gmail.send` (Send emails on behalf of the user)
- `https://www.googleapis.com/auth/spreadsheets` (Read/write access to Google Sheets CRM)
- `https://www.googleapis.com/auth/calendar.events` (Manage calendar reservations)
- `https://www.googleapis.com/auth/drive.file` (Store and retrieve student worksheets)

---

## ⚙️ Environment Variables

Add these to your production hosting panels or `.env` files:

```env
# Client Side Variables
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_API_KEY=your_google_api_key_here

# Admin Profile Information
VITE_ADMIN_EMAILS=amitbansal21@gmail.com,mail.shelly.sharma@gmail.com
```

---

## 🏗️ Google Cloud Platform Setup Steps

1. **Create a GCP Project**: Open the [Google Cloud Console](https://console.cloud.google.com/) and create a project.
2. **Enable APIs**: Navigate to **APIs & Services > Library**, search for the APIs listed above, and enable them.
3. **Configure OAuth Consent Screen**:
   - Set User Type to **External**.
   - Input **App Name** as `Shelly Sharma Academy`.
   - Add authorized domains (e.g., `shellysharma.co.in`).
   - Add the required scopes.
   - Set **Publishing Status** to production and request Google verification (optional, skips warning screens).
4. **Create Credentials**:
   - Go to **Credentials > Create Credentials > OAuth Client ID**.
   - Select application type **Web application**.
   - Add **Authorized JavaScript origins**:
     - `http://localhost:3000` (Dev)
     - `https://shellysharma.co.in` (Production)
   - Add **Authorized redirect URIs**:
     - `http://localhost:3000` (Dev redirects)
     - `https://shellysharma.co.in`
5. Copy the generated **Client ID** and save it in your project as `VITE_GOOGLE_CLIENT_ID`.
