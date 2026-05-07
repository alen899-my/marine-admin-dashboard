import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getDashboardLayout,
  saveDashboardLayout,
} from "@/lib/services/dashboard-layout.server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const layout = await getDashboardLayout(session.user.id);
    return NextResponse.json(layout ?? {});
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load dashboard layout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const payload: {
      sectionOrder?: string[];
      widgetOrders?: Record<string, string[]>;
      widgetHeights?: Record<string, number>;
      widgetSpans?: Record<string, Record<string, number>>;
    } = {};

    if (Array.isArray(body?.sectionOrder)) {
      payload.sectionOrder = body.sectionOrder.filter(
        (id: unknown) => typeof id === "string",
      );
    }
    if (body?.widgetOrders && typeof body.widgetOrders === "object") {
      payload.widgetOrders = body.widgetOrders;
    }
    if (body?.widgetHeights && typeof body.widgetHeights === "object") {
      payload.widgetHeights = body.widgetHeights;
    }
    if (body?.widgetSpans && typeof body.widgetSpans === "object") {
      payload.widgetSpans = body.widgetSpans;
    }

    await saveDashboardLayout(session.user.id, payload);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to save dashboard layout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
