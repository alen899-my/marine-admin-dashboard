import { dbConnect } from "@/lib/db";
import { uploadFile } from "@/lib/upload-provider";
import Crew from "@/models/Application";
import Company from "@/models/Company";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { randomBytes } from "crypto";

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
// POST — public creates a new crew application
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── 1. Parse body — support both JSON and FormData ───────────────────────
    let body: Record<string, unknown>;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
      }
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = {};

      const companyId = formData.get("companyId") as string;
      const uploadPath = `applications/${companyId || "temp"}`;
      const MAX_FILE_SIZE = 2 * 1024 * 1024;

      const profilePhotoFile = formData.get("profilePhoto") as File | null;
      if (profilePhotoFile && profilePhotoFile.size > 0) {
        if (profilePhotoFile.size > MAX_FILE_SIZE) {
          return NextResponse.json({ error: "Profile photo exceeds maximum size of 2MB" }, { status: 400 });
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
          return NextResponse.json({ error: "Resume exceeds maximum size of 2MB" }, { status: 400 });
        }
        try {
          const uploaded = await uploadFile(resumeFile, `${uploadPath}/resumes`);
          body.resume = { fileUrl: uploaded.url, fileName: uploaded.name, uploadStatus: "pending" };
        } catch (err) {
          console.error("Resume upload failed:", err);
        }
      }

      const extraDocsStr = formData.get("extraDocs") as string | null;
      let extraDocsMeta: Array<{ name: string; fileUrl?: string; fileName?: string; uploadStatus: string; _hasNewFile?: boolean; _fileIdx?: number }> = [];
      if (extraDocsStr) {
        try { extraDocsMeta = JSON.parse(extraDocsStr); } catch { extraDocsMeta = []; }
      }

      for (let i = 0; i < extraDocsMeta.length; i++) {
        const meta = extraDocsMeta[i];
        if (meta._hasNewFile && meta._fileIdx !== undefined) {
          const file = formData.get(`extraDocs[${meta._fileIdx}][file]`) as File | null;
          const docName = formData.get(`extraDocs[${meta._fileIdx}][name]`) as string | null || meta.name || "";
          if (file && file.size > 0) {
            if (file.size > MAX_FILE_SIZE) {
              return NextResponse.json({ error: `Extra document "${docName || i + 1}" exceeds maximum size of 2MB` }, { status: 400 });
            }
            try {
              const uploaded = await uploadFile(file, `${uploadPath}/extra`);
              extraDocsMeta[i] = { name: docName, fileUrl: uploaded.url, fileName: uploaded.name, uploadStatus: "pending" };
            } catch (err) {
              console.error("Extra document upload failed:", err);
              extraDocsMeta[i] = { name: docName, uploadStatus: "not_uploaded" };
            }
          } else {
            extraDocsMeta[i] = { name: meta.name, uploadStatus: "not_uploaded" };
          }
        }
      }

      const cleanedExtraDocs = extraDocsMeta.map(({ _hasNewFile, _fileIdx, ...rest }) => rest);
      if (cleanedExtraDocs.length > 0) body.extraDocs = cleanedExtraDocs;

      formData.forEach((value, key) => {
        if (key === "profilePhoto" || key === "resume" || key === "extraDocs" || key.startsWith("extraDocs[")) return;
        if (key.includes(".")) {
          const [parent, child] = key.split(".");
          if (!body[parent]) body[parent] = {};
          (body[parent] as Record<string, unknown>)[child] = value;
          return;
        }
        if (typeof value === "string" && (value.startsWith("[") || value.startsWith("{"))) {
          try { body[key] = JSON.parse(value); } catch { body[key] = value; }
        } else {
          body[key] = value;
        }
      });
    } else {
      return NextResponse.json({ error: "Unsupported content type." }, { status: 400 });
    }

    // ── 2. Resolve companyId ───────────────────────────────────────────────
    const rawCompanyId = str(body.companyId);

    if (!rawCompanyId || !mongoose.isValidObjectId(rawCompanyId)) {
      return NextResponse.json({ error: "Invalid or missing companyId." }, { status: 400 });
    }

    await dbConnect();

    const companyExists = await Company.findOne({ _id: rawCompanyId, deletedAt: null });
    if (!companyExists) {
      return NextResponse.json({ error: "Company not found." }, { status: 404 });
    }

    const companyId = new mongoose.Types.ObjectId(rawCompanyId);

    // ── 3. Validate required fields ────────────────────────────────────────
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
      return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 422 });
    }

    // ── 4. Duplicate check ─────────────────────────────────────────────────
    const exists = await Crew.exists({ company: companyId, email });
    if (exists) {
      return NextResponse.json({ error: "A crew member with this email already exists." }, { status: 409 });
    }

    // ── 5. Parse document arrays ───────────────────────────────────────────
    const mapDoc = <T extends Record<string, any>>(items: Record<string, unknown>[], mapFn: (i: Record<string, string>) => T | null): T[] => {
      return items.map(i => mapFn(i as Record<string, string>)).filter((x): x is T => x !== null);
    };

    const licencesRaw = arr<Record<string, string>>(body, "licences");
    const licences = mapDoc(licencesRaw, l => l.country && l.grade && l.number ? {
      licenceType: l.licenceType === "coe" ? "coe" : "coc",
      country: l.country,
      grade: l.grade,
      number: l.number,
      placeIssued: l.placeIssued || undefined,
      dateIssued: validDate(l.dateIssued),
      dateExpired: validDate(l.dateExpired) ?? null,
      uploadStatus: "not_uploaded" as const,
    } : null);

    const passportsRaw = arr<Record<string, string>>(body, "passports");
    const passports = mapDoc(passportsRaw, p => p.number ? {
      number: p.number,
      country: p.country || "",
      placeIssued: p.placeIssued || undefined,
      dateIssued: validDate(p.dateIssued),
      dateExpired: validDate(p.dateExpired) ?? null,
      uploadStatus: "not_uploaded" as const,
    } : null);

    const seamansRaw = arr<Record<string, string>>(body, "seamansBooks");
    const seamansBooks = mapDoc(seamansRaw, s => s.number && s.country ? {
      number: s.number,
      country: s.country,
      placeIssued: s.placeIssued || undefined,
      dateIssued: validDate(s.dateIssued),
      dateExpired: validDate(s.dateExpired) ?? null,
      uploadStatus: "not_uploaded" as const,
    } : null);

    const visasRaw = arr<Record<string, string>>(body, "visas");
    const visas = mapDoc(visasRaw, v => v.country && v.visaType && v.number ? {
      country: v.country,
      visaType: v.visaType,
      number: v.number,
      placeIssued: v.placeIssued || undefined,
      dateIssued: validDate(v.dateIssued),
      dateExpired: validDate(v.dateExpired) ?? null,
      uploadStatus: "not_uploaded" as const,
    } : null);

    const endorsementsRaw = arr<Record<string, string>>(body, "endorsements");
    const endorsements = mapDoc(endorsementsRaw, e => e.name ? {
      name: e.name,
      country: e.country || undefined,
      number: e.number || undefined,
      placeIssued: e.placeIssued || undefined,
      dateIssued: validDate(e.dateIssued),
      dateExpired: validDate(e.dateExpired) ?? null,
      uploadStatus: "not_uploaded" as const,
    } : null);

    const mapCert = (c: Record<string, string>) => c.name ? {
      name: c.name,
      courseNumber: c.courseNumber || undefined,
      placeIssued: c.placeIssued || undefined,
      dateIssued: validDate(c.dateIssued),
      dateExpired: validDate(c.dateExpired) ?? null,
      uploadStatus: "not_uploaded" as const,
    } : null;

    const stcwCertificates = mapDoc(arr<Record<string, string>>(body, "stcwCertificates"), mapCert);
    const otherCertificates = mapDoc(arr<Record<string, string>>(body, "otherCertificates"), mapCert);

    const seaExpRaw = arr<Record<string, string>>(body, "seaExperience");
    const seaExperience = mapDoc(seaExpRaw, s => s.vesselName && s.vesselType && s.company && s.rank && s.periodFrom ? {
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
    } : null);

    // ── 6. Next-of-kin ─────────────────────────────────────────────────────
    const nokRaw = body.nextOfKin as Record<string, string> | undefined;
    const nextOfKin = nokRaw?.name ? {
      name: nokRaw.name,
      relationship: nokRaw.relationship || "",
      phone: nokRaw.phone || undefined,
      address: nokRaw.address || undefined,
    } : undefined;

    // ── 7. Languages (accept array OR comma-separated string) ──────────────
    const languages = Array.isArray(body.languages)
      ? (body.languages as string[]).filter(Boolean)
      : typeof body.languages === "string" ? (body.languages as string).split(",").map(l => l.trim()).filter(Boolean) : [];

    // ── 8. Create document ────────────────────────────────────────────────
    const crew = await Crew.create({
      company: companyId,
      submissionToken: generateToken(),
      formSource: "public_form",
      status: "submitted", // Force 'submitted' for public form

      firstName, lastName, rank,
      positionApplied: str(body.positionApplied) || undefined,
      dateOfAvailability: validDate(str(body.dateOfAvailability)),
      availabilityNote: str(body.availabilityNote) || undefined,
      profilePhoto: str(body.profilePhoto) || undefined,
      resume: body.resume ?? { uploadStatus: "not_uploaded" },

      nationality, dateOfBirth,
      placeOfBirth: str(body.placeOfBirth) || undefined,
      maritalStatus: str(body.maritalStatus) || undefined,
      fatherName: str(body.fatherName) || undefined,
      motherName: str(body.motherName) || undefined,

      presentAddress, email,
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
      licences, passports, seamansBooks, visas, endorsements,
      stcwCertificates, otherCertificates,
      extraDocs: Array.isArray(body.extraDocs) ? (body.extraDocs as Array<{ name?: string }>).filter(d => d.name?.trim()) : [],
      seaExperience,
      additionalInfo: str(body.additionalInfo) || undefined,
      seaExperienceDetail: str(body.seaExperienceDetail) || undefined,

      adminNotes: [],
    });

    return NextResponse.json({ success: true, data: { id: crew._id, submissionToken: crew.submissionToken, status: crew.status } }, { status: 201 });

  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: "A crew member with this email already exists." }, { status: 409 });
    }
    console.error("CREATE CREW (PUBLIC) ERROR →", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
