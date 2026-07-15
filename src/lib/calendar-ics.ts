export function downloadCalendarInvite(event: {
  studentName: string;
  course: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  meetUrl?: string | null;
  referenceId: string;
}) {
  const startDateTime = new Date(`${event.date}T${event.time}`);
  const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000);

  const formatICSDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const title = `Shelly Sharma Academy – Assessment Session`;
  const description = `Assessment Session with student ${event.studentName} for ${event.course}.\\nLead ID: ${event.referenceId}\\nGoogle Meet: ${event.meetUrl || "N/A"}\\nWebsite: https://shellysharma.co.in`;

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Shelly Sharma Academy//Booking System//EN",
    "BEGIN:VEVENT",
    `UID:ssa-${event.referenceId}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(startDateTime)}`,
    `DTEND:${formatICSDate(endDateTime)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${event.meetUrl || "Google Meet"}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT10M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ];

  const blob = new Blob([icsLines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `Assessment-Session-${event.referenceId}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
