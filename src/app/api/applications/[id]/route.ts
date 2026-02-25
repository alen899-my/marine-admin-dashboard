// ─────────────────────────────────────────────────────────────────────────────
// PATCH — admin updates an existing crew application
// app/api/applications/admin/[id]/route.ts  (or merge into admin/route.ts)
// ─────────────────────────────────────────────────────────────────────────────

import { auth } from "@/auth";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import { uploadFile } from "@/lib/upload-provider";
import Crew from "@/models/Application";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import type { ICrew } from "@/models/Application";

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

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    // ── 1. Auth ──────────────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 2. Permission ────────────────────────────────────────────────────
    const authz = await authorizeRequest("jobs.edit");
    if (!authz.ok) return authz.response;

    // ── 3. Validate ID ───────────────────────────────────────────────────
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid application ID." }, { status: 400 });
    }

    // ── 4. Parse body ────────────────────────────────────────────────────
    let body: Record<string, unknown> = {};
    try {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        body = await req.json();
      } else if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();

        // Get companyId for upload path
        const companyId = (formData.get("companyId") as string) || "";
        const uploadPath = `applications/${companyId || "temp"}`;

        // Validate file size (max 2MB = 2 * 1024 * 1024 bytes)
        const MAX_FILE_SIZE = 2 * 1024 * 1024;

        // Handle file uploads
        const profilePhotoFile = formData.get("profilePhoto") as File | null;
        if (profilePhotoFile && profilePhotoFile.size > 0) {
          if (profilePhotoFile.size > MAX_FILE_SIZE) {
            return NextResponse.json(
              { error: "Profile photo exceeds maximum size of 2MB" },
              { status: 400 }
            );
          }
          try {
            const uploaded = await uploadFile(profilePhotoFile, `${uploadPath}/photos`);
            body.profilePhoto = uploaded.url;
          } catch (err) {
            console.error("Profile photo upload failed:", err);
          }
        }

        const resumeFile = formData.get("resume") as File | null;
        if (resumeFile && resumeFile.size > 0) {
          if (resumeFile.size > MAX_FILE_SIZE) {
            return NextResponse.json(
              { error: "Resume exceeds maximum size of 2MB" },
              { status: 400 }
            );
          }
          try {
            const uploaded = await uploadFile(resumeFile, `${uploadPath}/resumes`);
            body.resume = { fileUrl: uploaded.url, fileName: uploaded.name, uploadStatus: "pending" };
          } catch (err) {
            console.error("Resume upload failed:", err);
          }
        }

        // Handle extraDocs file uploads
        // Parse extraDocs metadata JSON sent from the form
        const extraDocsStr = formData.get("extraDocs") as string | null;
        let extraDocsMeta: Array<{
          name: string;
          fileUrl?: string;
          fileName?: string;
          uploadStatus: string;
          _hasNewFile?: boolean;
          _fileIdx?: number;
        }> = [];

        if (extraDocsStr) {
          try {
            extraDocsMeta = JSON.parse(extraDocsStr);
          } catch {
            extraDocsMeta = [];
          }
        }

        // Process new file uploads using sequential indices stored in metadata
        for (let i = 0; i < extraDocsMeta.length; i++) {
          const meta = extraDocsMeta[i];
          if (meta._hasNewFile && meta._fileIdx !== undefined) {
            const file = formData.get(`extraDocs[${meta._fileIdx}][file]`) as File | null;
            const docName = formData.get(`extraDocs[${meta._fileIdx}][name]`) as string || meta.name || "";

            if (file && file.size > 0) {
              if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json(
                  { error: `Extra document "${docName || i + 1}" exceeds maximum size of 2MB` },
                  { status: 400 }
                );
              }
              try {
                const uploaded = await uploadFile(file, `${uploadPath}/extra`);
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

        // Remove internal tracking fields before saving
        const cleanedExtraDocs = extraDocsMeta.map(({ _hasNewFile, _fileIdx, ...rest }) => rest);

        if (cleanedExtraDocs.length > 0) {
          body.extraDocs = cleanedExtraDocs;
        }

        // Handle other form fields
        formData.forEach((value, key) => {
          if (key === "profilePhoto" || key === "resume") return;

          // Skip extraDocs (already processed above — both the JSON metadata and file entries)
          if (key === "extraDocs" || key.startsWith("extraDocs[")) return;

          // Handle nested keys like "nextOfKin.name", "nextOfKin.relationship"
          if (key.includes(".")) {
            const [parent, child] = key.split(".");
            if (!body[parent]) {
              body[parent] = {};
            }
            (body[parent] as Record<string, unknown>)[child] = value;
            return;
          }

          body[key] = value;
        });

        const jsonFields = [
          "licences", "passports", "seamansBooks", "visas",
          "endorsements", "stcwCertificates", "otherCertificates", "seaExperience", "extraDocs", "nextOfKin"
        ];
        for (const field of jsonFields) {
          if (typeof body[field] === "string") {
            try { body[field] = JSON.parse(body[field] as string); } catch { }
          }
        }
      } else {
        const formData = await req.formData();
        formData.forEach((value, key) => {
          body[key] = value;
        });
        const jsonFields = [
          "licences", "passports", "seamansBooks", "visas",
          "endorsements", "stcwCertificates", "otherCertificates", "seaExperience", "extraDocs", "nextOfKin"
        ];
        for (const field of jsonFields) {
          if (typeof body[field] === "string") {
            try { body[field] = JSON.parse(body[field] as string); } catch { }
          }
        }
      }
    } catch {
      return NextResponse.json({ error: "Invalid request body format." }, { status: 400 });
    }

    await dbConnect();

    // ── 5. Find existing document ────────────────────────────────────────
    const existing = await Crew.findOne({ _id: id, deletedAt: null });
    if (!existing) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    // ── 6. Prevent regular admin from editing another company's record ───
    const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
    if (!isSuperAdmin && existing.company.toString() !== session.user.company?.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    // ── 7. Build update payload (only include fields present in body) ────
    const update: Record<string, unknown> = {
      lastEditedBy: session.user.id,
      updatedAt: new Date(),
    };

    // Scalar string fields
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

    // Email (lowercase)
    if ("email" in body) {
      const newEmail = str(body.email).toLowerCase();
      if (newEmail && newEmail !== existing.email) {
        // Check duplicate for same company
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

    // Status
    if ("status" in body) update.status = str(body.status) as ICrew["status"];

    // Date fields
    const dateFields: Array<keyof ICrew> = [
      "dateOfBirth", "dateOfAvailability",
      "medicalCertIssuedDate", "medicalCertExpiredDate",
    ];
    dateFields.forEach((f) => {
      if (f in body) update[f] = validDate(str(body[f]));
    });

    // Numeric fields
    if ("weightKg" in body) update.weightKg = Number(body.weightKg) || undefined;
    if ("heightCm" in body) update.heightCm = Number(body.heightCm) || undefined;
    if ("kmFromAirport" in body) update.kmFromAirport = Number(body.kmFromAirport) || undefined;

    // Languages
    if ("languages" in body) {
      update.languages = Array.isArray(body.languages)
        ? (body.languages as string[]).filter(Boolean)
        : typeof body.languages === "string"
          ? (body.languages as string).split(",").map((l) => l.trim()).filter(Boolean)
          : [];
    }

    // Next of kin
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

    // Resume (only update if a new file was uploaded)
    if ("resume" in body && body.resume) {
      update.resume = body.resume as { fileUrl: string; fileName: string; uploadStatus: string };
    }

    // ── 8. Document arrays (replace entire array if key present in body) ──
    if ("licences" in body) {
      const raw = arr<Record<string, string>>(body, "licences");
      update.licences = raw
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
      // Form now sends full extraDocs metadata including existing fileUrl/fileName
      // New file uploads have been merged in the parsing step above.
      // Filter out entries without a name (required by schema).
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

    // ── 9. Apply update ──────────────────────────────────────────────────
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
    console.error("PATCH CREW (ADMIN) ERROR →", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — soft-delete (sets deletedAt timestamp)
// ─────────────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    // ── 1. Auth ──────────────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 2. Permission ────────────────────────────────────────────────────
    const authz = await authorizeRequest("jobs.delete");
    if (!authz.ok) return authz.response;

    // ── 3. Validate ID ───────────────────────────────────────────────────
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid application ID." }, { status: 400 });
    }

    await dbConnect();

    // ── 4. Find document ─────────────────────────────────────────────────
    const existing = await Crew.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    // ── 5. Company scope check ───────────────────────────────────────────
    const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
    if (!isSuperAdmin && existing.company.toString() !== session.user.company?.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    // ── 6. Hard delete ────────────────────────────────────────────────────
    await Crew.deleteOne({ _id: id });

    return NextResponse.json({ success: true, message: "Application permanently deleted." });

  } catch (error: any) {
    console.error("DELETE CREW (ADMIN) ERROR →", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
