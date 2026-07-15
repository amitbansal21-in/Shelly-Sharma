const SECURITY_QUEUE_KEY = "ss_security_logs_queue";

export interface SecurityLog {
  date: string;
  time: string;
  email: string;
  result: "SUCCESS" | "DENIED";
  ip: string;
  browser: string;
}

export async function getClientIP(): Promise<string> {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    if (res.ok) {
      const data = await res.json();
      return data.ip || "Unknown IP";
    }
  } catch (e) {
    console.warn("Could not fetch external IP:", e);
  }
  return "Client IP (Offline/LAN)";
}

export function queueSecurityLogLocally(log: SecurityLog) {
  try {
    const queue = getQueuedSecurityLogs();
    queue.push(log);
    localStorage.setItem(SECURITY_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Failed to queue security log locally:", e);
  }
}

export function getQueuedSecurityLogs(): SecurityLog[] {
  try {
    const data = localStorage.getItem(SECURITY_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function clearQueuedSecurityLogs() {
  try {
    localStorage.removeItem(SECURITY_QUEUE_KEY);
  } catch (e) {}
}

const SHEET_NAME = "Shelly Sharma Security Logs";

async function getOrCreateSecuritySpreadsheet(accessToken: string): Promise<string> {
  // 1. Search for existing spreadsheet
  const query = encodeURIComponent(`name = '${SHEET_NAME}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`;
  
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!searchRes.ok) {
    throw new Error(`Failed to search spreadsheet: ${searchRes.statusText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // 2. Not found, create it with Sheets API
  const createUrl = "https://sheets.googleapis.com/v4/spreadsheets";
  const createRes = await fetch(createUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      properties: {
        title: SHEET_NAME
      },
      sheets: [
        { properties: { title: "Logs" } }
      ]
    })
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create spreadsheet: ${createRes.statusText}`);
  }

  const createData = await createRes.json();
  const id = createData.spreadsheetId;

  // 3. Set headers
  const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/Logs!A1:F1?valueInputOption=USER_ENTERED`;
  await fetch(headerUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      values: [["Date", "Time", "Attempted Email", "Result", "IP Address", "Browser/User Agent"]]
    })
  });

  return id;
}

export async function syncSecurityLog(accessToken: string, log: SecurityLog): Promise<void> {
  const spreadsheetId = await getOrCreateSecuritySpreadsheet(accessToken);
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Logs!A:F:append?valueInputOption=USER_ENTERED`;
  const appendRes = await fetch(appendUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      values: [[log.date, log.time, log.email, log.result, log.ip, log.browser]]
    })
  });

  if (!appendRes.ok) {
    throw new Error(`Failed to append security log: ${appendRes.statusText}`);
  }
}

export async function syncQueuedSecurityLogs(accessToken: string): Promise<void> {
  const queue = getQueuedSecurityLogs();
  if (queue.length === 0) return;

  console.log(`Syncing ${queue.length} security logs to Google Sheets...`);
  const remaining: SecurityLog[] = [];
  for (const log of queue) {
    try {
      await syncSecurityLog(accessToken, log);
    } catch (e) {
      console.error("Failed to sync queued security log:", e);
      remaining.push(log);
    }
  }

  if (remaining.length > 0) {
    localStorage.setItem(SECURITY_QUEUE_KEY, JSON.stringify(remaining));
  } else {
    clearQueuedSecurityLogs();
  }
}
