import { dbConnect } from "@/lib/db";
import { cloneUploadedFile, handleUpload } from "@/lib/handleUpload";
import { buildCompanyUploadFolder } from "@/lib/uploadFolders";
import Candidate from "@/models/Candidate";
import Company from "@/models/Company";
import Job from "@/models/Job";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { randomBytes } from "crypto";
import { auth } from "@/auth";
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

function normalizeCompletedSteps(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((step) => Number(step))
        .filter((step) => Number.isInteger(step) && step >= 1 && step <= 11)
    )
  ).sort((a, b) => a - b);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — public creates a new candidate application
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── 1. Parse body — support both JSON and FormData ───────────────────────
    const session = await auth();
    const userId = session?.user?.id
      ? new mongoose.Types.ObjectId(session.user.id)
      : null;
    let applicationUploadFolder = "";
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
      const firstName = (formData.get("firstName") as string) || "";
      const lastName = (formData.get("lastName") as string) || "";
      const applicantName = `${firstName} ${lastName}`.trim() || "applicant";
      const MAX_FILE_SIZE = 2 * 1024 * 1024;
      applicationUploadFolder = buildCompanyUploadFolder({
        companyName: companyId || "company",
        module: "applications",
        subfolder: applicantName,
      });

      if (companyId && mongoose.isValidObjectId(companyId)) {
        await dbConnect();
        const companyForUpload = await Company.findById(companyId).select("name").lean();
        applicationUploadFolder = buildCompanyUploadFolder({
          companyName: companyForUpload?.name || companyId,
          module: "applications",
          subfolder: applicantName,
        });
      }

      const profilePhotoFile = formData.get("profilePhoto") as File | null;
      if (profilePhotoFile && profilePhotoFile.size > 0) {
        if (profilePhotoFile.size > MAX_FILE_SIZE) {
          return NextResponse.json({ error: "Profile photo exceeds maximum size of 2MB" }, { status: 400 });
        }
        try {
          const uploaded = await handleUpload(profilePhotoFile, `${applicationUploadFolder}/photos`);
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
          const uploaded = await handleUpload(resumeFile, `${applicationUploadFolder}/resumes`);

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
              const uploaded = await handleUpload(file, `${applicationUploadFolder}/extra`);
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

      const cleanedExtraDocs = extraDocsMeta.map((doc) => ({
        name: doc.name,
        fileUrl: doc.fileUrl,
        fileName: doc.fileName,
        uploadStatus: doc.uploadStatus,
      }));
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
    if (!applicationUploadFolder) {
      const applicantName =
        `${str(body.firstName)} ${str(body.lastName)}`.trim() || "applicant";
      applicationUploadFolder = buildCompanyUploadFolder({
        companyName: companyExists.name || rawCompanyId,
        module: "applications",
        subfolder: applicantName,
      });
    }

    // ── 3. Validate required fields ────────────────────────────────────────
    const rawJobId = str(body.jobId);
    const jobId = rawJobId && mongoose.isValidObjectId(rawJobId)
      ? new mongoose.Types.ObjectId(rawJobId)
      : null;
    const linkedJob = jobId
      ? await Job.findById(jobId).select("_id title company").lean()
      : null;
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

    if (jobId && !linkedJob) {
      return NextResponse.json({ error: "Selected job not found." }, { status: 404 });
    }

    if (
      linkedJob?.company &&
      linkedJob.company.toString() !== companyId.toString()
    ) {
      return NextResponse.json(
        { error: "Selected job does not belong to this company." },
        { status: 400 }
      );
    }

    // ── 4. Duplicate check & Upsert logic ──────────────────────────────────
    const requestedStatus = str(body.status) === "draft" ? "draft" : "submitted";

    // Upsert scope: same company + same email + same job.
    // This allows the same person to apply for multiple different jobs
    // without overwriting their previous applications.
    const upsertFilter: Record<string, unknown> = { company: companyId, email };
    if (jobId) upsertFilter.jobId = jobId;

    const existingCandidate = await Candidate.findOne(upsertFilter);

    // ── Reject re-application if previous attempt was rejected ────────────
    if (existingCandidate && existingCandidate.status === "rejected") {
      return NextResponse.json(
        { error: "Your application for this position was not successful. You are not eligible to re-apply." },
        { status: 403 }
      );
    }

    // ── 5. Parse document arrays ───────────────────────────────────────────
    const mapDoc = <T extends Record<string, unknown>>(items: Record<string, unknown>[], mapFn: (i: Record<string, string>) => T | null): T[] => {
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

    // ── 8. Create or Update document ──────────────────────────────────────
    const candidateData: Record<string, unknown> & {
      extraDocs: Array<Record<string, unknown>>;
    } = {
      company: companyId,
      formSource: "public_form",
      status: requestedStatus,
      completedSteps: normalizeCompletedSteps(body.completedSteps),

      firstName, lastName, rank,
      positionApplied:
        linkedJob?.title || str(body.positionApplied) || undefined,
      dateOfAvailability: validDate(str(body.dateOfAvailability)),
      availabilityNote: str(body.availabilityNote) || undefined,

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
      extraDocs: [],
      seaExperience,
      additionalInfo: str(body.additionalInfo) || undefined,
      seaExperienceDetail: str(body.seaExperienceDetail) || undefined,
      userId,

      jobId,
    };

    if (body.profilePhoto) {
      candidateData.profilePhoto = body.profilePhoto;
    } else {
      const existingPhotoUrl = str(body.existingProfilePhotoUrl);
      if (existingPhotoUrl) {
        try {
          const cloned = await cloneUploadedFile(
            existingPhotoUrl,
            `${applicationUploadFolder}/photos`,
            "profile_photo"
          );
          candidateData.profilePhoto = cloned.url;
        } catch (error) {
          console.error("Profile photo prefill clone failed:", error);
          candidateData.profilePhoto = existingPhotoUrl;
        }
      }
    }

    if (body.resume) {
      candidateData.resume = body.resume;
    } else {
      const existingResumeUrl = str(body.existingResumeUrl);
      const existingResumeFileName = str(body.existingResumeFileName);
      if (existingResumeUrl) {
        try {
          const cloned = await cloneUploadedFile(
            existingResumeUrl,
            `${applicationUploadFolder}/resumes`,
            existingResumeFileName || "resume"
          );
          candidateData.resume = {
            fileUrl: cloned.url,
            fileName: cloned.name,
            uploadStatus: "pending",
          };
        } catch (error) {
          console.error("Resume prefill clone failed:", error);
          candidateData.resume = {
            fileUrl: existingResumeUrl,
            fileName: existingResumeFileName || "",
            uploadStatus: "pending",
          };
        }
      }
    }

    const rawExtraDocs = Array.isArray(body.extraDocs)
      ? (body.extraDocs as Array<{
          name?: string;
          fileName?: string;
          fileUrl?: string;
          uploadStatus?: string;
        }>).filter((doc) => doc.name?.trim())
      : [];

    candidateData.extraDocs = [];
    for (const doc of rawExtraDocs) {
      if (!doc.fileUrl) {
        candidateData.extraDocs.push({
          name: doc.name,
          fileName: doc.fileName,
          fileUrl: undefined,
          uploadStatus: doc.uploadStatus || "not_uploaded",
        });
        continue;
      }

      try {
        const cloned = await cloneUploadedFile(
          doc.fileUrl,
          `${applicationUploadFolder}/extra`,
          doc.fileName || doc.name || "document"
        );
        candidateData.extraDocs.push({
          name: doc.name,
          fileName: cloned.name,
          fileUrl: cloned.url,
          uploadStatus: doc.uploadStatus || "pending",
        });
      } catch (error) {
        console.error(`Extra document prefill clone failed for "${doc.name}":`, error);
        candidateData.extraDocs.push({
          name: doc.name,
          fileName: doc.fileName,
          fileUrl: doc.fileUrl,
          uploadStatus: doc.uploadStatus || "pending",
        });
      }
    }

    let candidate: InstanceType<typeof Candidate> | null = null;

    if (existingCandidate) {
      candidate = await Candidate.findByIdAndUpdate(existingCandidate._id, { $set: candidateData }, { new: true });
    } else {
      candidateData.submissionToken = generateToken();
      candidateData.adminNotes = [];
      if (!candidateData.resume) candidateData.resume = { uploadStatus: "not_uploaded" };
      candidate = (await Candidate.create(candidateData)) as unknown as InstanceType<typeof Candidate>;
    }

    if (!candidate) {
      return NextResponse.json({ error: "Failed to save application. Please try again." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: candidate._id,
        submissionToken: candidate.submissionToken,
        status: candidate.status,
        profilePhoto: candidate.profilePhoto ?? null,
        resume: candidate.resume?.fileUrl
          ? { fileUrl: candidate.resume.fileUrl, fileName: candidate.resume.fileName ?? "" }
          : null,
        extraDocs: candidate.extraDocs,
      },
    }, { status: 201 });
  } catch (error: unknown) {
    const errorCode =
      typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;
    const message = error instanceof Error ? error.message : "Unknown error";
    if (errorCode === 11000) {
      return NextResponse.json({ error: "A candidate member with this email already exists." }, { status: 409 });
    }
    console.error("CREATE Candidate (PUBLIC) ERROR →", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
