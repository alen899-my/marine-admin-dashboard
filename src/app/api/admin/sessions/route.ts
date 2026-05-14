import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
import { dbConnect } from "@/lib/db";
import UserSession from "@/models/UserSession";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  const authz = await authorizeRequest("sessions.view");
  if (!authz.ok || !authz.session) return authz.response;
  
  const search = req.nextUrl.searchParams.get("search");
  const companyId = req.nextUrl.searchParams.get("companyId");
  const startDate = req.nextUrl.searchParams.get("startDate");
  const endDate = req.nextUrl.searchParams.get("endDate");
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  await dbConnect();

  const userQuery: any = {};
  if (search) {
    userQuery.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  if (companyId && companyId !== "all") {
    userQuery.company = companyId;
  }

  // Find users first to handle name/email or company filtering
  let matchedUserIds: any[] | null = null;
  if (Object.keys(userQuery).length > 0) {
    const matchedUsers = await User.find(userQuery).select("_id");
    matchedUserIds = matchedUsers.map((u) => u._id);
  }

  // Now build the Session query
  const sessionQuery: any = { isValid: true };

  // Helper to safely parse DD/MM/YYYY or fallback
  const parseDate = (dateStr: string) => {
    if (dateStr.includes("/")) {
      const [day, month, year] = dateStr.split("/");
      return new Date(`${year}-${month}-${day}`);
    }
    return new Date(dateStr);
  };

  if (matchedUserIds !== null) {
    sessionQuery.userId = { $in: matchedUserIds };
  }
  if (startDate) {
    sessionQuery.loginAt = { $gte: parseDate(startDate) };
  }
  if (endDate) {
    const end = parseDate(endDate);
    end.setHours(23, 59, 59, 999);
    sessionQuery.loginAt = { ...sessionQuery.loginAt, $lte: end };
  }

  // Get total count for pagination
  const total = await UserSession.countDocuments(sessionQuery);

  // Only sessions created within the last 7 days and still valid
  const sessions = await UserSession.find(sessionQuery)
    .populate({
      path: "userId",
      model: User,
      select: "fullName email role profilePicture status company",
      populate: [
        { path: "role", select: "name" },
        { path: "company", select: "name" }
      ],
    })
    .sort({ lastSeenAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const mapped = sessions.map((s) => ({
    id: s._id.toString(),
    sessionId: s.sessionId,
    user: s.userId
      ? {
          id: (s.userId as any)._id.toString(),
          fullName: (s.userId as any).fullName,
          email: (s.userId as any).email,
          role: (s.userId as any).role?.name ?? "user",
          profilePicture: (s.userId as any).profilePicture,
          status: (s.userId as any).status,
          company: (s.userId as any).company?.name ?? null,
        }
      : null,
    ip: s.ip,
    userAgent: s.userAgent,
    loginAt: s.loginAt,
    lastSeenAt: s.lastSeenAt,
  }));

  return NextResponse.json({
    sessions: mapped,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}
