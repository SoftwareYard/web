import cron from "node-cron";
import { spawn } from "child_process";
import { sendSlackMessage } from "../lib/slack";

const BACKUP_FOLDER = "db";
const BACKUPS_TO_KEEP = 10;

function storageBaseUrl(): string {
  const zone = process.env.BUNNY_BACKUP_STORAGE_ZONE;
  if (!zone || !process.env.BUNNY_BACKUP_API_KEY) {
    throw new Error("BUNNY_BACKUP_STORAGE_ZONE and BUNNY_BACKUP_API_KEY must be set");
  }
  const region = process.env.BUNNY_BACKUP_REGION || "storage";
  return `https://${region}.bunnycdn.com/${zone}/${BACKUP_FOLDER}/`;
}

// Custom format (-Fc) is compressed and restored with pg_restore
function dumpDatabase(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pgDump = spawn("pg_dump", [
      "--format=custom",
      "--no-owner",
      "--no-privileges",
      `--dbname=${process.env.DATABASE_URL}`,
    ]);

    const chunks: Buffer[] = [];
    let stderr = "";
    pgDump.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    pgDump.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
    pgDump.on("error", reject);
    pgDump.on("close", (code) => {
      if (code === 0) resolve(Buffer.concat(chunks));
      else reject(new Error(`pg_dump exited with code ${code}: ${stderr.trim()}`));
    });
  });
}

async function uploadBackup(fileName: string, data: Buffer): Promise<void> {
  const response = await fetch(`${storageBaseUrl()}${fileName}`, {
    method: "PUT",
    headers: {
      AccessKey: process.env.BUNNY_BACKUP_API_KEY!,
      "Content-Type": "application/octet-stream",
    },
    body: new Uint8Array(data),
  });
  if (!response.ok) {
    throw new Error(`Bunny upload failed (${response.status}): ${await response.text()}`);
  }
}

interface BunnyFile {
  ObjectName: string;
  IsDirectory: boolean;
  Length: number;
  LastChanged: string;
}

// Oldest first — file names start with the date, so sorting by name sorts by date
async function listBackups(): Promise<BunnyFile[]> {
  const response = await fetch(storageBaseUrl(), {
    headers: { AccessKey: process.env.BUNNY_BACKUP_API_KEY! },
  });
  if (!response.ok) {
    throw new Error(`Bunny list failed (${response.status}): ${await response.text()}`);
  }
  const files = (await response.json()) as BunnyFile[];
  return files
    .filter((f) => !f.IsDirectory && f.ObjectName.endsWith(".dump"))
    .sort((a, b) => a.ObjectName.localeCompare(b.ObjectName));
}

async function deleteOldBackups(): Promise<number> {
  const backups = await listBackups();
  const toDelete = backups.slice(0, Math.max(0, backups.length - BACKUPS_TO_KEEP));

  for (const file of toDelete) {
    await fetch(`${storageBaseUrl()}${file.ObjectName}`, {
      method: "DELETE",
      headers: { AccessKey: process.env.BUNNY_BACKUP_API_KEY! },
    });
  }
  return toDelete.length;
}

export async function getLatestBackup(): Promise<{
  fileName: string;
  sizeBytes: number;
  createdAt: string;
} | null> {
  const backups = await listBackups();
  const latest = backups[backups.length - 1];
  if (!latest) return null;
  // Bunny returns LastChanged as UTC without a timezone suffix
  const createdAt = new Date(`${latest.LastChanged.replace(/Z$/, "")}Z`).toISOString();
  return { fileName: latest.ObjectName, sizeBytes: latest.Length, createdAt };
}

export async function runDatabaseBackup(): Promise<{ fileName: string; sizeBytes: number }> {
  const date = new Date().toISOString().split("T")[0];
  const fileName = `${date}-sy-web.dump`;

  try {
    const data = await dumpDatabase();
    await uploadBackup(fileName, data);
    const deleted = await deleteOldBackups();

    const sizeMb = (data.length / 1024 / 1024).toFixed(2);
    console.log(`[db-backup] Uploaded ${fileName} (${sizeMb} MB), removed ${deleted} old backup(s).`);
    await sendSlackMessage(`:floppy_disk: Weekly database backup done — *${fileName}* (${sizeMb} MB)`);
    return { fileName, sizeBytes: data.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await sendSlackMessage(`:x: Weekly database backup *failed*: ${message}`).catch((slackErr) =>
      console.error("[db-backup] Failed to send Slack alert:", slackErr)
    );
    throw err;
  }
}

// Runs at 02:00 every Friday
export function startDatabaseBackupCron() {
  cron.schedule(
    "0 2 * * 5",
    () => {
      console.log("[db-backup] Running weekly database backup...");
      runDatabaseBackup().catch((err) => console.error("[db-backup] Error:", err));
    },
    { timezone: "Europe/Skopje" }
  );

  console.log("[db-backup] Cron scheduled (Fridays at 02:00).");
}
