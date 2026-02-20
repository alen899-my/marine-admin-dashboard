// ─────────────────────────────────────────────────────────────────────────────
// PATCH — admin updates an existing crew application
// app/api/applications/admin/[id]/route.ts  (or merge into admin/route.ts)
// ─────────────────────────────────────────────────────────────────────────────

import { auth } from "@/auth";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
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
      } else {
        const formData = await req.formData();
        formData.forEach((value, key) => {
          body[key] = value;
        });
        const jsonFields = [
          "licences", "passports", "seamansBooks", "visas",
          "endorsements", "stcwCertificates", "otherCertificates", "seaExperience"
        ];
        for (const field of jsonFields) {
          if (typeof body[field] === "string") {
            try { body[field] = JSON.parse(body[field] as string); } catch {}
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
      updatedAt:    new Date(),
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
          company:  existing.company,
          email:    newEmail,
          _id:      { $ne: existing._id },
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
    if ("weightKg"      in body) update.weightKg      = Number(body.weightKg)      || undefined;
    if ("heightCm"      in body) update.heightCm      = Number(body.heightCm)      || undefined;
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
            name:         nok.name,
            relationship: nok.relationship || "",
            phone:        nok.phone || undefined,
            address:      nok.address || undefined,
          }
        : undefined;
    }

    // ── 8. Document arrays (replace entire array if key present in body) ──
    if ("licences" in body) {
      const raw = arr<Record<string, string>>(body, "licences");
      update.licences = raw
        .filter((l) => l.country && l.grade && l.number)
        .map((l) => ({
          licenceType:  l.licenceType === "coe" ? "coe" : "coc",
          country:      l.country,
          grade:        l.grade,
          number:       l.number,
          placeIssued:  l.placeIssued || undefined,
          dateIssued:   validDate(l.dateIssued),
          dateExpired:  validDate(l.dateExpired) ?? null,
          uploadStatus: l.uploadStatus ?? "not_uploaded",
        }));
    }

    if ("passports" in body) {
      update.passports = arr<Record<string, string>>(body, "passports")
        .filter((p) => p.number)
        .map((p) => ({
          number:       p.number,
          country:      p.country || "",
          placeIssued:  p.placeIssued || undefined,
          dateIssued:   validDate(p.dateIssued),
          dateExpired:  validDate(p.dateExpired),
          uploadStatus: p.uploadStatus ?? "not_uploaded",
        }));
    }

    if ("seamansBooks" in body) {
      update.seamansBooks = arr<Record<string, string>>(body, "seamansBooks")
        .filter((s) => s.number && s.country)
        .map((s) => ({
          number:       s.number,
          country:      s.country,
          placeIssued:  s.placeIssued || undefined,
          dateIssued:   validDate(s.dateIssued),
          dateExpired:  validDate(s.dateExpired) ?? null,
          uploadStatus: s.uploadStatus ?? "not_uploaded",
        }));
    }

    if ("visas" in body) {
      update.visas = arr<Record<string, string>>(body, "visas")
        .filter((v) => v.country && v.visaType && v.number)
        .map((v) => ({
          country:      v.country,
          visaType:     v.visaType,
          number:       v.number,
          placeIssued:  v.placeIssued || undefined,
          dateIssued:   validDate(v.dateIssued),
          dateExpired:  validDate(v.dateExpired) ?? null,
          uploadStatus: v.uploadStatus ?? "not_uploaded",
        }));
    }

    if ("endorsements" in body) {
      update.endorsements = arr<Record<string, string>>(body, "endorsements")
        .filter((e) => e.name)
        .map((e) => ({
          name:         e.name,
          country:      e.country || undefined,
          number:       e.number || undefined,
          placeIssued:  e.placeIssued || undefined,
          dateIssued:   validDate(e.dateIssued),
          dateExpired:  validDate(e.dateExpired) ?? null,
          uploadStatus: e.uploadStatus ?? "not_uploaded",
        }));
    }

    const mapCert = (c: Record<string, string>) => ({
      name:         c.name,
      courseNumber: c.courseNumber || undefined,
      placeIssued:  c.placeIssued || undefined,
      dateIssued:   validDate(c.dateIssued),
      dateExpired:  validDate(c.dateExpired) ?? null,
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

    if ("seaExperience" in body) {
      update.seaExperience = arr<Record<string, string>>(body, "seaExperience")
        .filter((s) => s.vesselName && s.vesselType && s.company && s.rank && s.periodFrom)
        .map((s) => ({
          vesselName:      s.vesselName,
          flag:            s.flag || undefined,
          grt:             s.grt ? Number(s.grt) : undefined,
          vesselType:      s.vesselType,
          engineType:      s.engineType || undefined,
          engineKW:        s.engineKW ? Number(s.engineKW) : undefined,
          company:         s.company,
          rank:            s.rank,
          periodFrom:      new Date(s.periodFrom),
          periodTo:        validDate(s.periodTo),
          areaOfOperation: s.areaOfOperation || undefined,
          jobDescription:  s.jobDescription || undefined,
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
    const existing = await Crew.findOne({ _id: id, deletedAt: null });
    if (!existing) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    // ── 5. Company scope check ───────────────────────────────────────────
    const isSuperAdmin = session.user.role?.toLowerCase() === "super-admin";
    if (!isSuperAdmin && existing.company.toString() !== session.user.company?.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    // ── 6. Soft-delete ───────────────────────────────────────────────────
    await Crew.findByIdAndUpdate(id, {
      $set: {
        deletedAt:    new Date(),
        lastEditedBy: session.user.id,
      },
    });

    return NextResponse.json({ success: true, message: "Application deleted." });

  } catch (error: any) {
    console.error("DELETE CREW (ADMIN) ERROR →", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}