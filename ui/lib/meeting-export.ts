import * as XLSX from "xlsx";
import { Meeting, MEETING_FIELDS } from "./meeting";

export interface MeetingWithUser extends Meeting {
  user: { id: string; name: string };
}

function formatDateForSheet(val: string) {
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function sanitizeSheetName(name: string, used: Set<string>) {
  const base = (name.replace(/[\\/?*[\]:]/g, " ").trim() || "Sheet").slice(0, 31);
  let candidate = base;
  let n = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${n})`;
    candidate = base.slice(0, 31 - suffix.length) + suffix;
    n++;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

export function exportMeetingsToExcel(meetings: MeetingWithUser[], filename: string) {
  const byMember = new Map<string, { name: string; meetings: MeetingWithUser[] }>();
  for (const m of meetings) {
    const entry = byMember.get(m.user.id);
    if (entry) {
      entry.meetings.push(m);
    } else {
      byMember.set(m.user.id, { name: m.user.name, meetings: [m] });
    }
  }

  const wb = XLSX.utils.book_new();
  const usedNames = new Set<string>();
  const headers = ["Date", ...MEETING_FIELDS.map((f) => f.label)];

  for (const { name, meetings: memberMeetings } of byMember.values()) {
    const rows = memberMeetings.map((m) => [
      formatDateForSheet(m.date),
      ...MEETING_FIELDS.map((f) => m[f.key] ?? ""),
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(name, usedNames));
  }

  XLSX.writeFile(wb, filename);
}
