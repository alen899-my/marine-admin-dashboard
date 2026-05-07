// import { NextResponse } from "next/server";
// import { authorizeRequest } from "@/lib/authorizeRequest";
// import { execSync } from "child_process";
// import AdmZip from "adm-zip";
// import {
//   existsSync,
//   mkdirSync,
//   rmSync,
//   writeFileSync,
// } from "fs";
// import { dirname, join } from "path";
// import { tmpdir } from "os";

// export const dynamic = "force-dynamic";

// const MONGODB_TOOLS_PATH = process.env.MONGODB_TOOLS_PATH || "C:\\Program Files\\MongoDB\\Tools\\100\\bin";

// function getToolPath(tool: string) {
//   // 1. Check if tool is in system PATH
//   try {
//     const checkCmd = process.platform === "win32" ? "where" : "which";
//     execSync(`${checkCmd} ${tool}`, { stdio: "ignore" });
//     return tool;
//   } catch {
//     // 2. Fallback for Windows default installation path
//     if (process.platform === "win32") {
//       const fallbackPath = join(MONGODB_TOOLS_PATH, `${tool}.exe`);
//       if (existsSync(fallbackPath)) {
//         return `"${fallbackPath}"`;
//       }
//     }
//     return null;
//   }
// }

// export async function POST(request: Request) {
//   const auth = await authorizeRequest("backup.manage");
//   if (!auth.ok) return auth.response;

//   // Check if mongorestore is installed
//   const mongorestorePath = getToolPath("mongorestore");
//   if (!mongorestorePath) {
//     return NextResponse.json(
//       {
//         error: "MongoDB Database Tools not found",
//         details: "The 'mongorestore' command is not recognized and was not found in the default installation path. Please install MongoDB Database Tools: https://www.mongodb.com/try/download/database-tools",
//       },
//       { status: 500 }
//     );
//   }

//   const mongoUri = process.env.MONGODB_URI;
//   if (!mongoUri) {
//     return NextResponse.json(
//       { error: "MONGODB_URI is not set in environment variables" },
//       { status: 500 }
//     );
//   }

//   // Unique temp dir for extraction
//   const tempDir = join(tmpdir(), `mongorestore_${Date.now()}`);
//   mkdirSync(tempDir, { recursive: true });

//   try {
//     const formData = await request.formData();
//     const file = formData.get("backup") as File | null;

//     if (!file) {
//       return NextResponse.json(
//         { error: "No backup file provided" },
//         { status: 400 }
//       );
//     }

//     // 1. Extract the zip into tempDir
//     const buffer = Buffer.from(await file.arrayBuffer());
//     const zip = new AdmZip(buffer);
//     zip.extractAllTo(tempDir, /* overwrite */ true);

//     // 2. Restore MongoDB using mongorestore
//     //    The dump lives at tempDir/db/ (matches how we packed it)
//     const dbDumpPath = join(tempDir, "db");

//     if (!existsSync(dbDumpPath)) {
//       return NextResponse.json(
//         { error: "Invalid backup: missing 'db' folder inside zip" },
//         { status: 400 }
//       );
//     }

//     execSync(
//       `${mongorestorePath} --uri="${mongoUri}" --drop "${dbDumpPath}"`,
//       { stdio: "pipe" }
//     );

//     // 3. Restore uploads
//     const uploadsDir = join(process.cwd(), "public", "uploads");
//     const uploadsSource = join(tempDir, "uploads");

//     if (existsSync(uploadsSource)) {
//       if (existsSync(uploadsDir)) {
//         rmSync(uploadsDir, { recursive: true, force: true });
//       }
//       mkdirSync(uploadsDir, { recursive: true });

//       // Re-extract just the uploads entries directly to their target path
//       const entries = zip.getEntries().filter(
//         (e) => e.entryName.startsWith("uploads/") && !e.isDirectory
//       );

//       for (const entry of entries) {
//         const rel = entry.entryName.replace(/^uploads\//, "");
//         const target = join(uploadsDir, rel);
//         const dir = dirname(target);
//         if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
//         writeFileSync(target, entry.getData());
//       }
//     }

//     return NextResponse.json({
//       success: true,
//       message: "Restore completed successfully. Please refresh the page.",
//     });
//   } catch (error: any) {
//     console.error("Restore error:", error);
//     return NextResponse.json(
//       { error: `Restore failed: ${error?.message ?? "Unknown error"}` },
//       { status: 500 }
//     );
//   } finally {
//     // Always clean up temp dir
//     if (existsSync(tempDir)) {
//       rmSync(tempDir, { recursive: true, force: true });
//     }
//   }
// }
export async function GET() {}