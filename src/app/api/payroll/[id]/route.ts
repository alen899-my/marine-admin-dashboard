import { NextRequest, NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/authorizeRequest";
import {
  deletePayrollRecord,
  updatePayrollRecord,
} from "@/lib/services/payrollService";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authz = await authorizeRequest("payroll.edit");
    if (!authz.ok) return authz.response;
    const session = authz.session;
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const result = await updatePayrollRecord({
      user: session.user,
      id,
      input: body || {},
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update payroll";

    return NextResponse.json(
      { error: message },
      { status: message.toLowerCase().includes("not found") ? 404 : 409 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authz = await authorizeRequest("payroll.delete");
    if (!authz.ok) return authz.response;
    const session = authz.session;
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await deletePayrollRecord({
      user: session.user,
      id,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete payroll";

    return NextResponse.json(
      { error: message },
      { status: message.toLowerCase().includes("not found") ? 404 : 409 },
    );
  }
}
