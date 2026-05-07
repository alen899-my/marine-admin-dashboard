import path from "path";
import { existsSync } from "fs";
import { copyFile, mkdir, writeFile } from "fs/promises";
import { put } from "@vercel/blob";

function sanitizeFilePart(value: string, fallback = "file") {
  const sanitized = value
    .trim()
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "");

  return sanitized || fallback;
}

function extractCode(segment: string | undefined, fallback: string) {
  if (!segment) return fallback;

  const normalized = segment
    .split("_")[0]
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();

  return (normalized.slice(0, 2) || fallback).padEnd(2, fallback[0] || "x");
}

function inferModuleCode(folder: string) {
  const moduleSegment = folder.split("/").filter(Boolean)[1]?.toLowerCase() || "";
  if (moduleSegment.startsWith("applications")) return "ja";
  return extractCode(moduleSegment, "fl");
}

function stripStoredFilenamePrefix(fileName: string) {
  return fileName
    .replace(/^\d{10,}-/, "")
    .replace(/^[a-z0-9]{2}_[a-z0-9]{2}_/i, "");
}

function buildUploadFilename(originalName: string, folder: string) {
  const cleanOriginalName = stripStoredFilenamePrefix(originalName);
  const parsed = path.parse(cleanOriginalName);
  const companyCode = extractCode(folder.split("/").filter(Boolean)[0], "co");
  const moduleCode = inferModuleCode(folder);
  const safeBase = sanitizeFilePart(parsed.name, "file");
  const safeExt = parsed.ext
    ? `.${parsed.ext.replace(/^\./, "").replace(/[^a-z0-9]/gi, "").toLowerCase()}`
    : "";

  return `${companyCode}_${moduleCode}_${safeBase}${safeExt}`;
}

export async function handleUpload(file: File, folder: string): Promise<{ url: string; name: string }> {
  const filename = buildUploadFilename(file.name, folder);
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

export async function cloneUploadedFile(
  fileUrl: string,
  folder: string,
  fallbackName = "file"
): Promise<{ url: string; name: string }> {
  const parsedName = fileUrl.split("/").pop() || fallbackName;
  const filename = buildUploadFilename(parsedName, folder);
  const useLocal = process.env.UPLOAD_PROVIDER === "local";

  if (useLocal) {
    let urlPath = fileUrl;
    if (fileUrl.startsWith("http")) {
      urlPath = new URL(fileUrl).pathname;
    }

    const uploadsPrefix = "/uploads/";
    if (!urlPath.startsWith(uploadsPrefix)) {
      throw new Error(`Unsupported local upload URL: ${fileUrl}`);
    }

    const relativePath = urlPath.slice(uploadsPrefix.length);
    const sourcePath = path.join(process.cwd(), "public", "uploads", relativePath);
    if (!existsSync(sourcePath)) {
      throw new Error(`Source file not found: ${sourcePath}`);
    }

    const uploadDir = path.join(process.cwd(), "public/uploads", folder);
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

    const destinationPath = path.join(uploadDir, filename);
    await copyFile(sourcePath, destinationPath);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    return { url: `${baseUrl}/uploads/${folder}/${filename}`, name: filename };
  }

  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch source file: ${response.status}`);
  }

  const blobData = await response.blob();
  const blob = await put(`${folder}/${filename}`, blobData, {
    access: "public",
    addRandomSuffix: true,
  });

  return { url: blob.url, name: filename };
}
