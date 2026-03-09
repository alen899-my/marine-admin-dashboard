import path from "path";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { put } from "@vercel/blob";

export async function handleUpload(file: File, folder: string): Promise<{ url: string; name: string }> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
  const filename = `${timestamp}-${safeName}`;
  const useLocal = process.env.UPLOAD_PROVIDER === "local";

  if (useLocal) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), "public/uploads", folder);
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";

   
    return { url: `${baseUrl}/uploads/${folder}/${filename}`, name: filename };
  } else {
    const blob = await put(`${folder}/${filename}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return { url: blob.url, name: filename };
  }
}