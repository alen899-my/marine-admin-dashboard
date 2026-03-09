import { Metadata } from "next";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import Job from "@/models/Job";
import Company from "@/models/Company";
import JobsTable from "./JobsTable";
import AddJobButton from "./AddJob";
import ComponentCard from "@/components/common/ComponentCard";
import TableCount from "@/components/common/TableCount";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Job Postings | ADMIN",
    description: "View and manage job postings.",
};

export default async function JobPostingsPage(props: {
    searchParams?: Promise<{ [key: string]: string | undefined }>;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/signin");
    }

    const userRole = session.user.role?.toLowerCase() || "";
    const isSuperAdmin = userRole === "super_admin" || userRole === "super-admin";
    const userCompanyId = session.user.company?.id;

    // RBAC permissions check:
    if (!isSuperAdmin && !userCompanyId) {
        return (
            <div className="p-8 text-center text-red-500 font-semibold bg-red-50 rounded-lg border border-red-200 mt-6 mx-4">
                You do not have a company assigned. Access denied to Jobs module.
            </div>
        );
    }

    const searchParams = typeof props.searchParams === "object" && props.searchParams !== null
        ? await props.searchParams
        : {};

    const pageStr = searchParams?.page || "1";
    const page = parseInt(pageStr, 10);
    const limit = 10;
    const skip = (page - 1) * limit;

    await dbConnect();

    // 1) Build Query based on RBAC & Filters
    const query: any = {};

    if (!isSuperAdmin) {
        query.companyId = userCompanyId;
    } else if (searchParams?.company) {
        // If Super Admin and filtering by company
        query.companyId = searchParams.company;
    }

    if (searchParams?.status) {
        query.status = searchParams.status;
    }

    if (searchParams?.search) {
        query.title = { $regex: searchParams.search, $options: "i" };
    }

    // 2) Fetch Data & Total
    // Populate company so we can display the company name in the table
    let dataRaw: any[] = [];
    let totalRaw = 0;

    try {
        const [fetchedData, fetchedCount] = await Promise.all([
            Job.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("companyId", "name")
                .lean(),
            Job.countDocuments(query),
        ]);
        dataRaw = fetchedData;
        totalRaw = fetchedCount;
    } catch (e) {
        console.error("Error fetching jobs:", e);
    }

    const totalPages = Math.ceil(totalRaw / limit) || 1;

    // NextJS server components require plain objects for child client components
    const parsedData = JSON.parse(JSON.stringify(dataRaw));

    // 3) IF super admin, fetch all companies for the Add/Edit dropdowns
    let companies: { value: string; label: string }[] = [];
    if (isSuperAdmin) {
        const allCompanies = await Company.find({ status: "active", deletedAt: null }).select("name").lean();
        companies = allCompanies.map((c: any) => ({
            value: c._id.toString(),
            label: c.name,
        }));
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                        Job Postings
                    </h2>
                </div>
                <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="w-full sm:w-auto">
                        <AddJobButton
                            className="w-full justify-center"
                            isSuperAdmin={isSuperAdmin}
                            userCompanyId={userCompanyId}
                            companies={companies}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pr-2 pt-2">
                <TableCount count={totalRaw} label="jobs" />
            </div>

            <JobsTable
                data={parsedData}
                pagination={{ page, limit, totalPages }}
                isSuperAdmin={isSuperAdmin}
                companyOptions={companies}
            />
        </div>
    );
}
