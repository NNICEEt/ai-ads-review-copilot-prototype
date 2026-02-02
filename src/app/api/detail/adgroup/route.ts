import { NextResponse } from "next/server";
import { getAdGroupDetail } from "@/lib/data/review";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const adGroupId = searchParams.get("id");
  const periodDays = searchParams.get("periodDays");

  if (!adGroupId) {
    return NextResponse.json({ error: "Missing adGroup id." }, { status: 400 });
  }

  const data = await getAdGroupDetail({ adGroupId, periodDays });
  if (!data) {
    return NextResponse.json({ error: "AdGroup not found." }, { status: 404 });
  }

  return NextResponse.json(data);
}
