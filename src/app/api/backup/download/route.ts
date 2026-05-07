import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const BACKUPS_DIR = join(process.cwd(), "backups");

export async function GET(req: Request) {
  const auth = await authorizeRequest("backup.manage");
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("filename");

  if (!existsSync(BACKUPS_DIR)) {
    return NextResponse.json({ error: "No backups found" }, { status: 404 });
  }

  const allFiles = readdirSync(BACKUPS_DIR)
    .filter((f) => f.endsWith(".zip"))
    .map((f) => ({
      name: f,
      time: statSync(join(BACKUPS_DIR, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  if (allFiles.length === 0) {
    return NextResponse.json({ error: "No backups found" }, { status: 404 });
  }

  const targetFile = filename 
    ? allFiles.find(f => f.name === filename)
    : allFiles[0];

  if (!targetFile) {
    return NextResponse.json({ error: "Backup file not found" }, { status: 404 });
  }

  const buffer = readFileSync(join(BACKUPS_DIR, targetFile.name));

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${targetFile.name}"`,
      "Content-Length": buffer.length.toString(),
    },
  });
}
