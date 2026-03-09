// ─────────────────────────────────────────────────────────────────────────────
// app/api/applications/public/[id]/route.ts
// Allows an authenticated career-portal user to PATCH their own application.
// No admin session or authorizeRequest — ownership is enforced via applicantId.
// ─────────────────────────────────────────────────────────────────────────────

import { auth } from "@/auth";           // same next-auth — career portal uses same provider
import { dbConnect } from "@/lib/db";
import Crew from "@/models/Application";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import type { ICrew } from "@/models/Application";
import { handleUpload } from "@/lib/handleUpload";
import { del } from "@vercel/blob";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// ─────────────────────────────────────────────────────────────────────────────
// File deletion — identical to admin route, never throws
// ─────────────────────────────────────────────────────────────────────────────

async function deleteFile(fileUrl: string | null | undefined): Promise<void> {
  if (!fileUrl) return;
  try {
    const isLocal = process.env.UPLOAD_PROVIDER === "local";
    if (isLocal) {
      let urlPath = fileUrl;
      if (fileUrl.startsWith("http")) urlPath = new URL(fileUrl).pathname;
      const uploadsPrefix = "/uploads/";
      if (urlPath.startsWith(uploadsPrefix)) {
        const relativePath = urlPath.slice(uploadsPrefix.length);
        const filePath = path.join(process.cwd(), "public", "uploads", relativePath);
        if (existsSync(filePath)) {
          await unlink(filePath);
        } else {
          console.warn("File not found on disk:", filePath);
        }
      }
    } else {
      await del(fileUrl);
    }
  } catch (err) {
    console.warn("Could not delete file:", fileUrl, err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — identical to admin route
// ─────────────────────────────────────────────────────────────────────────────

function validDate(s?: string | null): Date | undefined {
  if (!s || typeof s !== "string" || !s.trim()) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function arr<T>(body: Record<string, unknown>, key: string): T[] {
  const v = body[key];
  return Array.isArray(v) ? (v as T[]) : [];
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — career applicant updates their own application
// ─────────────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    // ── 1. Career session auth ───────────────────────────────────────────
    // We use the same auth() as the rest of the app.
    // The career portal sets session.user.id when the applicant logs in.
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 2. Validate ID ───────────────────────────────────────────────────
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid application ID." }, { status: 400 });
    }

    await dbConnect();

    // ── 3. Load existing doc early so we can check ownership BEFORE parsing body
    const existing = await Crew.findOne({ _id: id, deletedAt: null });
    if (!existing) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    // ── 4. Ownership guard ───────────────────────────────────────────────
    // userId is stored on the document when the public POST creates it.
    // A career user can only edit their own application.
    if (!existing.userId || existing.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    // ── 5. Editable-status guard ─────────────────────────────────────────
    // Prevent editing once an admin has actioned the application.
    if (!["draft", "submitted"].includes(existing.status)) {
      return NextResponse.json(
        { error: "This application can no longer be edited." },
        { status: 403 }
      );
    }

    // ── 6. Parse body ────────────────────────────────────────────────────
    let body: Record<string, unknown> = {};
    const urlsToDelete: string[] = [];

    try {
      const contentType = req.headers.get("content-type") || "";

      if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();

        const companyId = (formData.get("companyId") as string) || "";
        const uploadPath = `applications/${companyId || "temp"}`;
        const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

        // ── Profile photo ──────────────────────────────────────────────
        const profilePhotoFile = formData.get("profilePhoto") as File | null;
        if (profilePhotoFile && profilePhotoFile.size > 0) {
          if (profilePhotoFile.size > MAX_FILE_SIZE) {
            return NextResponse.json(
              { error: "Profile photo exceeds maximum size of 2MB" },
              { status: 400 }
            );
          }
          try {
            const uploaded = await handleUpload(profilePhotoFile, `${uploadPath}/photos`);
            body.profilePhoto = uploaded.url;
            const oldUrl = formData.get("oldProfilePhoto") as string | null;
            if (oldUrl) urlsToDelete.push(oldUrl);
          } catch (err) {
            console.error("Profile photo upload failed:", err);
          }
        }

        // ── Resume ─────────────────────────────────────────────────────
        const resumeFile = formData.get("resume") as File | null;
        if (resumeFile && resumeFile.size > 0) {
          if (resumeFile.size > MAX_FILE_SIZE) {
            return NextResponse.json(
              { error: "Resume exceeds maximum size of 2MB" },
              { status: 400 }
            );
          }
          try {
            const uploaded = await handleUpload(resumeFile, `${uploadPath}/resumes`);
            body.resume = { fileUrl: uploaded.url, fileName: uploaded.name, uploadStatus: "pending" };
            const oldUrl = formData.get("oldResumeUrl") as string | null;
            if (oldUrl) urlsToDelete.push(oldUrl);
          } catch (err) {
            console.error("Resume upload failed:", err);
          }
        }

        // ── Extra docs ─────────────────────────────────────────────────
        const extraDocsStr = formData.get("extraDocs") as string | null;
        let extraDocsMeta: Array<{
          name: string;
          fileUrl?: string;
          fileName?: string;
          uploadStatus: string;
          _hasNewFile?: boolean;
          _fileIdx?: number;
          _oldFileUrl?: string;
        }> = [];

        if (extraDocsStr) {
          try { extraDocsMeta = JSON.parse(extraDocsStr); } catch { extraDocsMeta = []; }
        }

        for (let i = 0; i < extraDocsMeta.length; i++) {
          const meta = extraDocsMeta[i];
          if (meta._hasNewFile && meta._fileIdx !== undefined) {
            const file = formData.get(`extraDocs[${meta._fileIdx}][file]`) as File | null;
            const docName =
              (formData.get(`extraDocs[${meta._fileIdx}][name]`) as string) || meta.name || "";

            if (file && file.size > 0) {
              if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json(
                  { error: `Extra document "${docName || i + 1}" exceeds maximum size of 2MB` },
                  { status: 400 }
                );
              }
              try {
                const uploaded = await handleUpload(file, `${uploadPath}/extra`);
                if (meta._oldFileUrl) urlsToDelete.push(meta._oldFileUrl);
                extraDocsMeta[i] = {
                  name: docName,
                  fileUrl: uploaded.url,
                  fileName: uploaded.name,
                  uploadStatus: "pending",
                };
              } catch (err) {
                console.error("Extra document upload failed:", err);
                extraDocsMeta[i] = { name: docName, uploadStatus: "not_uploaded" };
              }
            } else {
              extraDocsMeta[i] = { name: meta.name, uploadStatus: "not_uploaded" };
            }
          }
        }

        const cleanedExtraDocs = extraDocsMeta.map(
          ({ _hasNewFile, _fileIdx, _oldFileUrl, ...rest }) => rest
        );
        if (cleanedExtraDocs.length > 0) body.extraDocs = cleanedExtraDocs;

        // ── Remaining scalar form fields ───────────────────────────────
        formData.forEach((value, key) => {
          if (key === "profilePhoto" || key === "resume") return;
          if (key === "extraDocs" || key.startsWith("extraDocs[")) return;
          if (key === "oldProfilePhoto" || key === "oldResumeUrl") return;

          if (key.includes(".")) {
            const [parent, child] = key.split(".");
            if (!body[parent]) body[parent] = {};
            (body[parent] as Record<string, unknown>)[child] = value;
            return;
          }
          body[key] = value;
        });

        // Parse JSON-encoded array/object fields
        const jsonFields = [
          "licences", "passports", "seamansBooks", "visas",
          "endorsements", "stcwCertificates", "otherCertificates",
          "seaExperience", "extraDocs", "nextOfKin",
        ];
        for (const field of jsonFields) {
          if (typeof body[field] === "string") {
            try { body[field] = JSON.parse(body[field] as string); } catch { }
          }
        }

      } else if (contentType.includes("application/json")) {
        body = await req.json();
      } else {
        return NextResponse.json({ error: "Unsupported content type." }, { status: 415 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid request body format." }, { status: 400 });
    }

    // ── 7. Delete replaced files (uploads already succeeded at this point) ─
    await Promise.all(urlsToDelete.map(deleteFile));

    // ── 8. Build update payload ──────────────────────────────────────────
    const update: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Scalar string fields — applicant can update all personal fields
    const scalarFields: Array<keyof ICrew> = [
      "firstName", "lastName", "rank", "positionApplied", "availabilityNote",
      "nationality", "placeOfBirth", "maritalStatus", "fatherName", "motherName",
      "presentAddress", "cellPhone", "homePhone", "nearestAirport",
      "hairColor", "eyeColor", "coverallSize", "shoeSize",
      "profilePhoto", "seaExperienceDetail", "additionalInfo",
    ];
    scalarFields.forEach((f) => {
      if (f in body) update[f] = str(body[f]) || undefined;
    });

    // Email — check for conflicts within same company
    if ("email" in body) {
      const newEmail = str(body.email).toLowerCase();
      if (newEmail && newEmail !== existing.email) {
        const conflict = await Crew.exists({
          company: existing.company,
          email: newEmail,
          _id: { $ne: existing._id },
        });
        if (conflict) {
          return NextResponse.json(
            { error: "Another application with this email already exists." },
            { status: 409 }
          );
        }
        update.email = newEmail;
      }
    }

    // ── Status: applicant may only set draft → submitted, never other values ─
    // This prevents a public user from setting status to "approved" etc.
    if ("status" in body) {
      const requested = str(body.status);
      const allowedPublicStatuses = ["draft", "submitted"];
      if (allowedPublicStatuses.includes(requested)) {
        update.status = requested;
      }
      // Silently ignore any other value (e.g. "approved", "rejected")
    }

    // Date fields
    const dateFields: Array<keyof ICrew> = [
      "dateOfBirth", "dateOfAvailability",
      "medicalCertIssuedDate", "medicalCertExpiredDate",
    ];
    dateFields.forEach((f) => {
      if (f in body) update[f] = validDate(str(body[f]));
    });

    if ("weightKg" in body) update.weightKg = Number(body.weightKg) || undefined;
    if ("heightCm" in body) update.heightCm = Number(body.heightCm) || undefined;
    if ("kmFromAirport" in body) update.kmFromAirport = Number(body.kmFromAirport) || undefined;

    if ("languages" in body) {
      update.languages = Array.isArray(body.languages)
        ? (body.languages as string[]).filter(Boolean)
        : typeof body.languages === "string"
          ? (body.languages as string).split(",").map((l) => l.trim()).filter(Boolean)
          : [];
    }

    if ("nextOfKin" in body) {
      const nok = body.nextOfKin as Record<string, string> | undefined;
      update.nextOfKin = nok?.name
        ? {
            name: nok.name,
            relationship: nok.relationship || "",
            phone: nok.phone || undefined,
            address: nok.address || undefined,
          }
        : undefined;
    }

    if ("resume" in body && body.resume) {
      update.resume = body.resume as { fileUrl: string; fileName: string; uploadStatus: string };
    }

    // ── 9. Document arrays — identical mapping to admin route ────────────
    if ("licences" in body) {
      update.licences = arr<Record<string, string>>(body, "licences")
        .filter((l) => l.country && l.grade && l.number)
        .map((l) => ({
          licenceType: l.licenceType === "coe" ? "coe" : "coc",
          country: l.country,
          grade: l.grade,
          number: l.number,
          placeIssued: l.placeIssued || undefined,
          dateIssued: validDate(l.dateIssued),
          dateExpired: validDate(l.dateExpired) ?? null,
          uploadStatus: l.uploadStatus ?? "not_uploaded",
        }));
    }

    if ("passports" in body) {
      update.passports = arr<Record<string, string>>(body, "passports")
        .filter((p) => p.number)
        .map((p) => ({
          number: p.number,
          country: p.country || "",
          placeIssued: p.placeIssued || undefined,
          dateIssued: validDate(p.dateIssued),
          dateExpired: validDate(p.dateExpired),
          uploadStatus: p.uploadStatus ?? "not_uploaded",
        }));
    }

    if ("seamansBooks" in body) {
      update.seamansBooks = arr<Record<string, string>>(body, "seamansBooks")
        .filter((s) => s.number && s.country)
        .map((s) => ({
          number: s.number,
          country: s.country,
          placeIssued: s.placeIssued || undefined,
          dateIssued: validDate(s.dateIssued),
          dateExpired: validDate(s.dateExpired) ?? null,
          uploadStatus: s.uploadStatus ?? "not_uploaded",
        }));
    }

    if ("visas" in body) {
      update.visas = arr<Record<string, string>>(body, "visas")
        .filter((v) => v.country && v.visaType && v.number)
        .map((v) => ({
          country: v.country,
          visaType: v.visaType,
          number: v.number,
          placeIssued: v.placeIssued || undefined,
          dateIssued: validDate(v.dateIssued),
          dateExpired: validDate(v.dateExpired) ?? null,
          uploadStatus: v.uploadStatus ?? "not_uploaded",
        }));
    }

    if ("endorsements" in body) {
      update.endorsements = arr<Record<string, string>>(body, "endorsements")
        .filter((e) => e.name)
        .map((e) => ({
          name: e.name,
          country: e.country || undefined,
          number: e.number || undefined,
          placeIssued: e.placeIssued || undefined,
          dateIssued: validDate(e.dateIssued),
          dateExpired: validDate(e.dateExpired) ?? null,
          uploadStatus: e.uploadStatus ?? "not_uploaded",
        }));
    }

    const mapCert = (c: Record<string, string>) => ({
      name: c.name,
      courseNumber: c.courseNumber || undefined,
      placeIssued: c.placeIssued || undefined,
      dateIssued: validDate(c.dateIssued),
      dateExpired: validDate(c.dateExpired) ?? null,
      uploadStatus: c.uploadStatus ?? "not_uploaded",
    });

    if ("stcwCertificates" in body) {
      update.stcwCertificates = arr<Record<string, string>>(body, "stcwCertificates")
        .filter((c) => c.name).map(mapCert);
    }

    if ("otherCertificates" in body) {
      update.otherCertificates = arr<Record<string, string>>(body, "otherCertificates")
        .filter((c) => c.name).map(mapCert);
    }

    if ("extraDocs" in body) {
      update.extraDocs = Array.isArray(body.extraDocs)
        ? (body.extraDocs as Array<{ name?: string }>).filter((d) => d.name?.trim())
        : [];
    }

    if ("seaExperience" in body) {
      update.seaExperience = arr<Record<string, string>>(body, "seaExperience")
        .filter((s) => s.vesselName && s.vesselType && s.company && s.rank && s.periodFrom)
        .map((s) => ({
          vesselName: s.vesselName,
          flag: s.flag || undefined,
          grt: s.grt ? Number(s.grt) : undefined,
          vesselType: s.vesselType,
          engineType: s.engineType || undefined,
          engineKW: s.engineKW ? Number(s.engineKW) : undefined,
          company: s.company,
          rank: s.rank,
          periodFrom: new Date(s.periodFrom),
          periodTo: validDate(s.periodTo),
          areaOfOperation: s.areaOfOperation || undefined,
          jobDescription: s.jobDescription || undefined,
        }));
    }

    // ── 10. Apply update ─────────────────────────────────────────────────
    const updated = await Crew.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).select("-adminNotes -__v").lean();

    return NextResponse.json({ success: true, data: updated });

  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: "A crew member with this email already exists." },
        { status: 409 }
      );
    }
    console.error("PATCH CREW (PUBLIC) ERROR →", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}