import { NextResponse } from "next/server";
import { execSync } from "child_process";
import archiver from "archiver";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  unlinkSync,
} from "fs";
import { join } from "path";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { tmpdir } from "os";

const BACKUPS_DIR = join(process.cwd(), "backups");
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || "3", 10);

function ensureBackupsDir() {
  if (!existsSync(BACKUPS_DIR)) mkdirSync(BACKUPS_DIR, { recursive: true });
}

function getBackupFiles() {
  if (!existsSync(BACKUPS_DIR)) return [];
  return readdirSync(BACKUPS_DIR)
    .filter((f) => f.endsWith(".zip"))
    .map((f) => {
      const s = statSync(join(BACKUPS_DIR, f));
      return { name: f, time: s.mtime.getTime(), size: s.size };
    })
    .sort((a, b) => b.time - a.time);
}

function pruneOldBackups() {
  getBackupFiles()
    .slice(MAX_BACKUPS)
    .forEach((f) => unlinkSync(join(BACKUPS_DIR, f.name)));
}

const MONGODB_TOOLS_PATH = process.env.MONGODB_TOOLS_PATH || "C:\\Program Files\\MongoDB\\Tools\\100\\bin";

function getToolPath(tool: string) {
  // 1. Check if tool is in system PATH
  try {
    const checkCmd = process.platform === "win32" ? "where" : "which";
    execSync(`${checkCmd} ${tool}`, { stdio: "ignore" });
    return tool;
  } catch {
    // 2. Fallback for Windows default installation path
    if (process.platform === "win32") {
      const fallbackPath = join(MONGODB_TOOLS_PATH, `${tool}.exe`);
      if (existsSync(fallbackPath)) {
        return `"${fallbackPath}"`;
      }
    }
    return null;
  }
}

// ── GET — return all backup files ─────────────────────────────────────────────
export async function GET() {
  const auth = await authorizeRequest("backup.manage");
  if (!auth.ok) return auth.response;

  const files = getBackupFiles();
  return NextResponse.json({
    maxBackups: MAX_BACKUPS,
    files: files.map((f) => ({
      name: f.name,
      date: new Date(f.time).toISOString(),
      size: f.size,
    })),
  });
}

// ── POST — create a new backup using mongodump ────────────────────────────────
export async function POST() {
  const auth = await authorizeRequest("backup.manage");
  if (!auth.ok) return auth.response;

  // Check if mongodump is installed
  const mongodumpPath = getToolPath("mongodump");
  if (!mongodumpPath) {
    return NextResponse.json(
      {
        error: "MongoDB Database Tools not found",
        details: "The 'mongodump' command is not recognized and was not found in the default installation path. Please install MongoDB Database Tools: https://www.mongodb.com/try/download/database-tools",
      },
      { status: 500 }
    );
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    return NextResponse.json(
      { error: "MONGODB_URI is not set in environment variables" },
      { status: 500 }
    );
  }

  // Create a unique temp directory for the dump
  const tempDir = join(tmpdir(), `mongobackup_${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });

  try {
    ensureBackupsDir();

    // 1. Run mongodump — produces native .bson + .metadata.json files
    execSync(
      `${mongodumpPath} --uri="${mongoUri}" --out="${tempDir}"`,
      { stdio: "pipe" } // suppress output in logs
    );

    // 2. Build the zip
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf8")
    );
    const projectName = packageJson.name || "project";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${projectName}_backup_on_${timestamp}.zip`;
    const filepath = join(BACKUPS_DIR, filename);

    await new Promise<void>((resolve, reject) => {
      const output = createWriteStream(filepath);
      const archive = archiver("zip", { zlib: { level: 6 } });

      output.on("close", resolve);
      archive.on("error", reject);
      archive.pipe(output);

      // Add the mongodump output directory as "db/" inside the zip
      archive.directory(tempDir, "db");

      // Add the uploads folder
      const uploadsDir = join(process.cwd(), "public", "uploads");
      if (existsSync(uploadsDir)) {
        archive.directory(uploadsDir, "uploads");
      }

      archive.finalize();
    });

    // 3. Keep only last MAX_BACKUPS
    pruneOldBackups();

    return NextResponse.json({ success: true, filename });
  } catch (error: any) {
    console.error("Backup error:", error);
    return NextResponse.json(
      { error: `Backup failed: ${error?.message ?? "Unknown error"}` },
      { status: 500 }
    );
  } finally {
    // Always clean up temp dir
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

// ── DELETE — delete a backup file ─────────────────────────────────────────────
export async function DELETE(req: Request) {
  const auth = await authorizeRequest("backup.manage");
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    // Basic security: ensure it's a .zip and doesn't contain path traversal
    if (!filename.endsWith(".zip") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const filepath = join(BACKUPS_DIR, filename);

    if (!existsSync(filepath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    unlinkSync(filepath);

    return NextResponse.json({ success: true, message: "Backup deleted" });
  } catch (error: any) {
    console.error("Delete backup error:", error);
    return NextResponse.json(
      { error: `Failed to delete backup: ${error?.message ?? "Unknown error"}` },
      { status: 500 }
    );
  }
}
