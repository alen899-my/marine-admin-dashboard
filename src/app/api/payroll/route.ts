import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
import {
  savePayrollRecords,
  transitionPayrollRecords,
} from "@/lib/services/payrollService";

export async function POST(req: NextRequest) {
  try {
    const authz = await authorizeRequest(["payroll.create", "payroll.edit"]);
    if (!authz.ok) return authz.response;
    const session = authz.session;
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = await savePayrollRecords({
      user: session.user,
      salaryHeadId: String(body.salaryHeadId || ""),
      payrollDate: String(body.payrollDate || ""),
      companyId: String(body.companyId || ""),
      items: Array.isArray(body.items) ? body.items : [],
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to save payroll";

    return NextResponse.json(
      { error: message },
      { status: message.toLowerCase().includes("cannot") ? 409 : 400 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action === "approve" ? "approve" : "verify";

    const authz = await authorizeRequest(
      action === "approve" ? "payroll.approve" : "payroll.verify",
    );
    if (!authz.ok) return authz.response;
    const session = authz.session;
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await transitionPayrollRecords({
      user: session.user,
      ids: Array.isArray(body.ids) ? body.ids : [],
      action,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update payroll status";

    return NextResponse.json(
      { error: message },
      { status: 409 },
    );
  }
}
