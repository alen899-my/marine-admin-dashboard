import { dbConnect } from "@/lib/db";
import Crew from "@/models/Crew";
import Candidate from "@/models/Candidate";
import Contract from "@/models/Contract";
import Vessel from "@/models/Vessel";
import mongoose from "mongoose";

export async function getCrewStatusMetrics(user: any, companyId?: string) {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = user.company?.id || user.company;

  const companyFilter: any = { deletedAt: null };
  if (!isSuperAdmin) {
    companyFilter.company = new mongoose.Types.ObjectId(userCompanyId);
  } else if (companyId && companyId !== "all") {
    companyFilter.company = new mongoose.Types.ObjectId(companyId);
  }

  const [distribution, crewList] = await Promise.all([
    // 1. Donut Chart Data
    Crew.aggregate([
      { $match: companyFilter },
      { $group: { _id: "$crewStatus", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1, _id: 0 } },
    ]),

    // 2. Table Data
    Crew.aggregate([
      { $match: companyFilter },
      {
        $lookup: {
          from: "candidates",
          localField: "applicationId",
          foreignField: "_id",
          as: "candidate",
        },
      },
      { $unwind: "$candidate" },
      {
        $lookup: {
          from: "contracts",
          localField: "contractId",
          foreignField: "_id",
          as: "contract",
        },
      },
      { $unwind: { path: "$contract", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "vessels",
          localField: "contract.vesselId",
          foreignField: "_id",
          as: "vessel",
        },
      },
      { $unwind: { path: "$vessel", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $concat: ["$candidate.firstName", " ", "$candidate.lastName"] },
          rank: "$candidate.rank",
          profilePhoto: "$candidate.profilePhoto",
          vesselName: { $ifNull: ["$vessel.name", "N/A"] },
          crewStatus: 1,
          contractEnd: 1,
        },
      },
      { $sort: { crewStatus: 1, name: 1 } },
    ]),
  ]);

  return {
    distribution,
    crewList: crewList.map((c: any) => ({
      ...c,
      _id: c._id.toString(),
      contractEnd: c.contractEnd ? new Date(c.contractEnd).toISOString() : null,
    })),
  };
}
