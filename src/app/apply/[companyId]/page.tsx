import { dbConnect } from "@/lib/db";
import Company from "@/models/Company";
import CrewApplicationForm from "@/components/Jobs/Application";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { Metadata } from "next";

interface PageProps {
    params: Promise<{ companyId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { companyId } = await params;
    if (!mongoose.isValidObjectId(companyId)) {
        return { title: "Application Form" };
    }
    await dbConnect();
    const company = await Company.findOne({
        _id: companyId,
        status: "active",
        deletedAt: null,
    })
        .select("name")
        .lean();

    return {
        title: company
            ? `Crew Application | ${(company as any).name}`
            : "Crew Application Form",
        description: "Submit your crew application online.",
    };
}

export default async function PublicApplicationPage({ params }: PageProps) {
    const { companyId } = await params;

    if (!mongoose.isValidObjectId(companyId)) {
        notFound();
    }

    await dbConnect();

    const raw = await Company.findOne({
        _id: companyId,
        status: "active",
        deletedAt: null,
    })
        .select("name logo")
        .lean();

    if (!raw) notFound();

    const company = JSON.parse(JSON.stringify(raw));

    return (
        <CrewApplicationForm
            companyId={company._id}
            companyName={company.name}
            companyLogo={company.logo}
            mode="create"
            isPublic={true}
        />
    );
}
