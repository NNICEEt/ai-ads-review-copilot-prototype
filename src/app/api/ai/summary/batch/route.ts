import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizePeriodDays } from "@/lib/analysis/period";
import { getAiSummary } from "@/lib/ai/summary";

const RequestSchema = z.object({
  adGroupIds: z.array(z.string().min(1)).min(1).max(10),
  periodDays: z.union([z.number(), z.string()]).optional(),
  businessContext: z.string().max(2000).optional(),
});

const mapWithConcurrency = async <Input, Output>(
  items: Input[],
  limit: number,
  mapper: (item: Input) => Promise<Output>,
) => {
  const results: Output[] = new Array(items.length);
  let index = 0;

  const workers = Array.from({ length: Math.max(1, limit) }, async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await mapper(items[current]);
    }
  });

  await Promise.all(workers);
  return results;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const periodDays = normalizePeriodDays(parsed.data.periodDays);
  const uniqueIds = Array.from(new Set(parsed.data.adGroupIds)).slice(0, 10);

  const items = await mapWithConcurrency(uniqueIds, 3, async (adGroupId) => {
    const result = await getAiSummary({
      adGroupId,
      periodDays,
      mode: "insight",
      businessContext: parsed.data.businessContext,
    });
    return { adGroupId, result };
  });

  return NextResponse.json({ items, periodDays, mode: "insight" });
}
