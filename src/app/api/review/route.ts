import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/data/review";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  const periodDays = searchParams.get("periodDays");

  const data = await getDashboardData({ accountId, periodDays });
  if (!data) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  return NextResponse.json(data);
}
