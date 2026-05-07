import { dbConnect } from "@/lib/db";
import Candidate, { APPLICATION_STATUSES } from "@/models/Candidate";
import Job from "@/models/Job";
import User from "@/models/User";
import mongoose from "mongoose";

export async function getRecruitmentMetrics(user: any, selectedCompanyId?: string) {
  await dbConnect();

  const isSuperAdmin = user.role?.toLowerCase() === "super-admin";
  const userCompanyId = user.company?.id || user.company;

  const filter: any = { deletedAt: null };
  if (!isSuperAdmin) {
    if (!userCompanyId) throw new Error("No company assigned");
    filter.company = new mongoose.Types.ObjectId(userCompanyId);
  } else if (selectedCompanyId && selectedCompanyId !== "" && selectedCompanyId !== "all") {
    filter.company = new mongoose.Types.ObjectId(selectedCompanyId);
  }

  // 1. Pipeline Funnel Data
  const pipelineData = await Candidate.aggregate([
    { $match: filter },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  const funnelStages = [
    "draft", "submitted", "hr_review", "shortlisted", 
    "interview_scheduled", "interview_completed", 
    "selected", "offer_sea_issued", "accepted", 
    "onboarding_ready", "onboarded"
  ];

  const funnel = funnelStages.map(status => {
    const found = pipelineData.find(d => d._id === status);
    return {
      stage: status,
      count: found ? found.count : 0
    };
  });

  // 2. Recent Applications (Top 5)
  const recentApplicationsRaw = await Candidate.find(filter)
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("assignedTo", "fullName")
    .populate("jobId", "title")
    .lean();

  const recentApplications = recentApplicationsRaw.map((app: any) => ({
    id: app._id.toString(),
    name: `${app.firstName} ${app.lastName}`,
    rank: app.rank || "N/A",
    jobTitle: app.jobId?.title || app.positionApplied || "N/A",
    status: app.status,
    appliedDate: app.createdAt,
    assignedTo: app.assignedTo?.fullName || "Unassigned"
  }));

  // 3. Jobs Overview
  const jobFilter: any = { deletedAt: null };
  if (filter.company) {
    jobFilter.companyId = filter.company;
  }

  const jobs = await Job.find(jobFilter)
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("companyId", "logo")
    .lean();

  const jobCandidateCounts = await Candidate.aggregate([
    { $match: filter },
    { $group: { _id: "$jobId", count: { $sum: 1 } } }
  ]);

  const jobsOverview = jobs.map((job: any) => {
    const candidateCount = jobCandidateCounts.find(c => c._id?.toString() === job._id.toString())?.count || 0;
    return {
      id: job._id.toString(),
      title: job.title,
      isAccepting: job.isAccepting,
      deadline: job.deadline,
      candidateCount,
      companyLogo: job.companyId?.logo || null
    };
  });

  return {
    funnel,
    recentApplications,
    jobsOverview
  };
}
