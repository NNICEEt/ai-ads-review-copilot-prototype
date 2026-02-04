import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizePeriodDays } from "@/lib/analysis/period";
import { getAiSummary } from "@/lib/ai/summary";

const RequestSchema = z.object({
  adGroupId: z.string().min(1),
  periodDays: z.union([z.number(), z.string()]).optional(),
  mode: z.enum(["insight", "full"]).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const periodDays = normalizePeriodDays(parsed.data.periodDays);
  const result = await getAiSummary({
    adGroupId: parsed.data.adGroupId,
    periodDays,
    mode: parsed.data.mode,
  });
  return NextResponse.json(result);
}
