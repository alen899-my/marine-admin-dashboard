// src/lib/upload-provider.ts
import { put } from "@vercel/blob";

export async function uploadFile(file: File, path: string) {
  // Currently using Vercel Blob
  const blob = await put(`${path}/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });
  
  return {
    url: blob.url,
    name: file.name,
    size: file.size,
  };
}