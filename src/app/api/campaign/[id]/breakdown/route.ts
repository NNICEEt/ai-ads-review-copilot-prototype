import { NextResponse, type NextRequest } from "next/server";
import { getCampaignBreakdown } from "@/lib/data/review";

type Params = {
  params: { id: string } | Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  const resolvedParams = await params;
  const { searchParams } = new URL(request.url);
  const periodDays = searchParams.get("periodDays");

  const data = await getCampaignBreakdown({
    campaignId: resolvedParams.id,
    periodDays,
  });

  return NextResponse.json(data);
}
