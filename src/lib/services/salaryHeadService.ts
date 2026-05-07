import { dbConnect } from "@/lib/db";
import { hydrateSalaryHeadRecord } from "@/lib/salaryHead.server";
import SalaryHead from "@/models/SalaryHead";

interface GetSalaryHeadsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  companyId?: string;
}

export async function getSalaryHeads({
  page = 1,
  limit = 20,
  search = "",
  status = "all",
  companyId = "",
}: GetSalaryHeadsParams) {
  await dbConnect();

  const skip = (page - 1) * limit;
  const query: Record<string, unknown> = { deletedAt: null };

  if (companyId && companyId !== "all") {
    query.companyId = companyId;
  }

  if (search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: "i" } },
      { description: { $regex: search.trim(), $options: "i" } },
    ];
  }

  if (status && status !== "all") {
    query.status = status.toLowerCase();
  }

  const [data, total] = await Promise.all([
      SalaryHead.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("companyId", "name")
        .select(
          "title description periodFrom periodTo otherAllowance allowances totalAllowance deductions bondedStore cashAdvance telDeduction otherDeductions totalDeductions status createdAt updatedAt companyId",
        )
        .lean(),
    SalaryHead.countDocuments(query),
  ]);

  return {
    data: JSON.parse(JSON.stringify(data)).map((record: any) =>
      hydrateSalaryHeadRecord(record),
    ),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
