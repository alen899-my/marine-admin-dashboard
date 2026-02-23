// app/api/applications/admin/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// ADMIN crew application — JSON body POST, requires authenticated session.
// Uses auth() from @/auth (Auth.js v5) — same pattern as the rest of the project.
// ─────────────────────────────────────────────────────────────────────────────

import { auth } from "@/auth";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import { uploadFile } from "@/lib/upload-provider";
import Crew from "@/models/Application";
import Company from "@/models/Company";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { randomBytes } from "crypto";
import type { ICrew } from "@/models/Application";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

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

// ─────────────────────────────────────────────────────────────────────────────
// POST — admin creates a new crew application
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth check (Auth.js v5 style) ──────────────────────────────────
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 2. Permission check ────────────────────────────────────────────────
    const authz = await authorizeRequest("jobs.create");
    if (!authz.ok) return authz.response;

    // ── 3. Parse body — support both JSON and FormData ───────────────────────
    let body: Record<string, unknown>;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      // JSON request (from admin panel with file refs)
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
      }
    } else if (contentType.includes("multipart/form-data")) {
      // FormData request (from public form with file uploads)
      const formData = await req.formData();
      body = {};

      // Handle file uploads
      const companyId = formData.get("companyId") as string;
      const uploadPath = `applications/${companyId || "temp"}`;

      // Validate file size (max 2MB = 2 * 1024 * 1024 bytes)
      const MAX_FILE_SIZE = 2 * 1024 * 1024;

      // Upload profile photo if present
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

      // Upload resume if present
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
            // File key present in metadata but no actual file — clear the new-file flags
            extraDocsMeta[i] = { name: meta.name, uploadStatus: "not_uploaded" };
          }
        }
      }

      // Remove internal tracking fields before saving
      const cleanedExtraDocs = extraDocsMeta.map(({ _hasNewFile, _fileIdx, ...rest }) => rest);

      if (cleanedExtraDocs.length > 0) {
        body.extraDocs = cleanedExtraDocs;
      }

      // Handle all other form fields
      formData.forEach((value, key) => {
        // Skip already handled fields
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

        // Handle nested JSON strings (e.g., "licences", "passports")
        if (typeof value === "string" && (value.startsWith("[") || value.startsWith("{"))) {
          try {
            body[key] = JSON.parse(value);
          } catch {
            body[key] = value;
          }
        } else {
          body[key] = value;
        }
      });
    } else {
      return NextResponse.json({ error: "Unsupported content type." }, { status: 400 });
    }

    // ── 4. Resolve companyId ───────────────────────────────────────────────
    // Super-admin can pass any companyId; regular admin is locked to their own
    const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
    const rawCompanyId = str(body.companyId) || session.user.company?.id || "";

    if (!rawCompanyId || !mongoose.isValidObjectId(rawCompanyId)) {
      return NextResponse.json(
        { error: "Invalid or missing companyId." },
        { status: 400 }
      );
    }

    // Prevent regular admin from creating for another company
    if (!isSuperAdmin && session.user.company?.id !== rawCompanyId) {
      return NextResponse.json(
        { error: "Forbidden: You can only create applications for your own company." },
        { status: 403 }
      );
    }

    await dbConnect();

    const companyExists = await Company.findOne({ _id: rawCompanyId, deletedAt: null });
    if (!companyExists) {
      return NextResponse.json({ error: "Company not found." }, { status: 404 });
    }

    const companyId = new mongoose.Types.ObjectId(rawCompanyId);

    // ── 5. Validate required fields ────────────────────────────────────────
    const firstName = str(body.firstName);
    const lastName = str(body.lastName);
    const rank = str(body.rank);
    const email = str(body.email).toLowerCase();
    const nationality = str(body.nationality);
    const presentAddress = str(body.presentAddress);
    const dateOfBirth = validDate(str(body.dateOfBirth));

    const missing: string[] = [];
    if (!firstName) missing.push("firstName");
    if (!lastName) missing.push("lastName");
    if (!rank) missing.push("rank");
    if (!email) missing.push("email");
    if (!nationality) missing.push("nationality");
    if (!presentAddress) missing.push("presentAddress");
    if (!dateOfBirth) missing.push("dateOfBirth");

    if (missing.length) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 422 }
      );
    }

    // ── 6. Duplicate check ─────────────────────────────────────────────────
    const exists = await Crew.exists({ company: companyId, email });
    if (exists) {
      return NextResponse.json(
        { error: "A crew member with this email already exists in this company." },
        { status: 409 }
      );
    }

    // ── 7. Parse document arrays ───────────────────────────────────────────
    const licencesRaw = arr<Record<string, string>>(body, "licences");
    const passportsRaw = arr<Record<string, string>>(body, "passports");
    const seamansRaw = arr<Record<string, string>>(body, "seamansBooks");
    const visasRaw = arr<Record<string, string>>(body, "visas");
    const endorsementsRaw = arr<Record<string, string>>(body, "endorsements");
    const stcwRaw = arr<Record<string, string>>(body, "stcwCertificates");
    const otherCertsRaw = arr<Record<string, string>>(body, "otherCertificates");
    const seaExpRaw = arr<Record<string, string>>(body, "seaExperience");

    const licences = licencesRaw
      .filter((l) => l.country && l.grade && l.number)
      .map((l) => ({
        licenceType: l.licenceType === "coe" ? "coe" : "coc",
        country: l.country,
        grade: l.grade,
        number: l.number,
        placeIssued: l.placeIssued || undefined,
        dateIssued: validDate(l.dateIssued),
        dateExpired: validDate(l.dateExpired) ?? null,
        uploadStatus: "not_uploaded" as const,
      }));

    const passports = passportsRaw
      .filter((p) => p.number)
      .map((p) => ({
        number: p.number,
        country: p.country || "",
        placeIssued: p.placeIssued || undefined,
        dateIssued: validDate(p.dateIssued),
        dateExpired: validDate(p.dateExpired),
        uploadStatus: "not_uploaded" as const,
      }));

    const seamansBooks = seamansRaw
      .filter((s) => s.number && s.country)
      .map((s) => ({
        number: s.number,
        country: s.country,
        placeIssued: s.placeIssued || undefined,
        dateIssued: validDate(s.dateIssued),
        dateExpired: validDate(s.dateExpired) ?? null,
        uploadStatus: "not_uploaded" as const,
      }));

    const visas = visasRaw
      .filter((v) => v.country && v.visaType && v.number)
      .map((v) => ({
        country: v.country,
        visaType: v.visaType,
        number: v.number,
        placeIssued: v.placeIssued || undefined,
        dateIssued: validDate(v.dateIssued),
        dateExpired: validDate(v.dateExpired) ?? null,
        uploadStatus: "not_uploaded" as const,
      }));

    const endorsements = endorsementsRaw
      .filter((e) => e.name)
      .map((e) => ({
        name: e.name,
        country: e.country || undefined,
        number: e.number || undefined,
        placeIssued: e.placeIssued || undefined,
        dateIssued: validDate(e.dateIssued),
        dateExpired: validDate(e.dateExpired) ?? null,
        uploadStatus: "not_uploaded" as const,
      }));

    const mapCert = (c: Record<string, string>) => ({
      name: c.name,
      courseNumber: c.courseNumber || undefined,
      placeIssued: c.placeIssued || undefined,
      dateIssued: validDate(c.dateIssued),
      dateExpired: validDate(c.dateExpired) ?? null,
      uploadStatus: "not_uploaded" as const,
    });

    const stcwCertificates = stcwRaw.filter((c) => c.name).map(mapCert);
    const otherCertificates = otherCertsRaw.filter((c) => c.name).map(mapCert);

    const seaExperience = seaExpRaw
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

    // ── 8. Next-of-kin ─────────────────────────────────────────────────────
    const nokRaw = body.nextOfKin as Record<string, string> | undefined;
    const nextOfKin = nokRaw?.name
      ? {
        name: nokRaw.name,
        relationship: nokRaw.relationship || "",
        phone: nokRaw.phone || undefined,
        address: nokRaw.address || undefined,
      }
      : undefined;

    // ── 9. Languages (accept array OR comma-separated string) ──────────────
    const languages = Array.isArray(body.languages)
      ? (body.languages as string[]).filter(Boolean)
      : typeof body.languages === "string"
        ? (body.languages as string).split(",").map((l) => l.trim()).filter(Boolean)
        : [];

    // ── 10. Create document ────────────────────────────────────────────────
    const crew = await Crew.create({
      company: companyId,
      submissionToken: generateToken(),
      formSource: "admin_created",
      lastEditedBy: session.user.id,
      status: (str(body.status) as ICrew["status"]) || "draft",

      firstName,
      lastName,
      rank,
      positionApplied: str(body.positionApplied) || undefined,
      dateOfAvailability: validDate(str(body.dateOfAvailability)),
      availabilityNote: str(body.availabilityNote) || undefined,
      profilePhoto: str(body.profilePhoto) || undefined,
      resume: body.resume ?? { uploadStatus: "not_uploaded" },

      nationality,
      dateOfBirth,
      placeOfBirth: str(body.placeOfBirth) || undefined,
      maritalStatus: (str(body.maritalStatus) as ICrew["maritalStatus"]) || undefined,
      fatherName: str(body.fatherName) || undefined,
      motherName: str(body.motherName) || undefined,

      presentAddress,
      email,
      cellPhone: str(body.cellPhone) || undefined,
      homePhone: str(body.homePhone) || undefined,

      nearestAirport: str(body.nearestAirport) || undefined,
      kmFromAirport: typeof body.kmFromAirport === "number" ? body.kmFromAirport : (typeof body.kmFromAirport === "string" ? Number(body.kmFromAirport) || undefined : undefined),
      languages,

      weightKg: typeof body.weightKg === "number" ? body.weightKg : (typeof body.weightKg === "string" ? Number(body.weightKg) || undefined : undefined),
      heightCm: typeof body.heightCm === "number" ? body.heightCm : (typeof body.heightCm === "string" ? Number(body.heightCm) || undefined : undefined),
      hairColor: str(body.hairColor) || undefined,
      eyeColor: str(body.eyeColor) || undefined,
      coverallSize: str(body.coverallSize) || undefined,
      shoeSize: str(body.shoeSize) || undefined,
      medicalCertIssuedDate: validDate(str(body.medicalCertIssuedDate)),
      medicalCertExpiredDate: validDate(str(body.medicalCertExpiredDate)),

      nextOfKin,

      licences,
      passports,
      seamansBooks,
      visas,
      endorsements,
      stcwCertificates,
      otherCertificates,
      extraDocs: Array.isArray(body.extraDocs)
        ? (body.extraDocs as Array<{ name?: string }>).filter((d) => d.name?.trim())
        : [],

      seaExperience,

      additionalInfo: str(body.additionalInfo) || undefined,
      seaExperienceDetail: str(body.seaExperienceDetail) || undefined,

      adminNotes: [],
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: crew._id,
          submissionToken: crew.submissionToken,
          status: crew.status,
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: "A crew member with this email already exists." },
        { status: 409 }
      );
    }
    console.error("CREATE CREW (ADMIN) ERROR →", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — admin lists applications for a company
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    // ── 1. Auth ────────────────────────────────────────────────────────────
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 2. Permission check ────────────────────────────────────────────────
    const authz = await authorizeRequest("jobs.view");
    if (!authz.ok) return authz.response;

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";

    // ── 3. Resolve companyId ───────────────────────────────────────────────
    // Super-admin can pass ?companyId=...; regular admin always uses their own
    const rawCompanyId = isSuperAdmin
      ? (searchParams.get("companyId") || "")
      : (session.user.company?.id || "");

    if (!rawCompanyId || !mongoose.isValidObjectId(rawCompanyId)) {
      return NextResponse.json(
        { error: "Valid companyId is required." },
        { status: 400 }
      );
    }

    const companyId = new mongoose.Types.ObjectId(rawCompanyId);

    // ── 4. Build filter ────────────────────────────────────────────────────
    const query: Record<string, unknown> = {
      company: companyId,
      deletedAt: null,
    };

    const status = searchParams.get("status");
    const rank = searchParams.get("rank");
    const nationality = searchParams.get("nationality");
    const search = searchParams.get("search")?.trim();

    if (status) query.status = status;
    if (rank) query.rank = { $regex: rank, $options: "i" };
    if (nationality) query.nationality = { $regex: nationality, $options: "i" };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { rank: { $regex: search, $options: "i" } },
        { nationality: { $regex: search, $options: "i" } },
      ];
    }

    // ── 5. Pagination ──────────────────────────────────────────────────────
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Number(searchParams.get("limit")) || 20);
    const skip = (page - 1) * limit;

    const [total, applications] = await Promise.all([
      Crew.countDocuments(query),
      Crew.find(query)
        .select("-adminNotes -__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      data: applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error: any) {
    console.error("GET CREW (ADMIN) ERROR →", error);
    return NextResponse.json(
      { error: "Failed to fetch crew applications" },
      { status: 500 }
    );
  }
}