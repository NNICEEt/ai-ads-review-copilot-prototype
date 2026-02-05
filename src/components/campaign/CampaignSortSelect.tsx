"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";

type CampaignSortKey = "cpr_desc" | "roas_asc" | "spend_desc";

const DEFAULT_SORT: CampaignSortKey = "cpr_desc";

const normalizeCampaignSortKey = (value: string | null): CampaignSortKey => {
  if (value === "cpr_desc") return value;
  if (value === "roas_asc") return value;
  if (value === "spend_desc") return value;
  return DEFAULT_SORT;
};

export const CampaignSortSelect = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSort = useMemo(() => {
    return normalizeCampaignSortKey(searchParams.get("sort"));
  }, [searchParams]);

  return (
    <select
      id="campaign-sort"
      className="appearance-none bg-transparent py-1 pl-2 pr-6 focus:outline-none font-bold text-slate-700 cursor-pointer"
      value={currentSort}
      disabled={isPending}
      onChange={(event) => {
        const nextSort = normalizeCampaignSortKey(event.target.value);
        const nextParams = new URLSearchParams(searchParams.toString());

        if (nextSort === DEFAULT_SORT) nextParams.delete("sort");
        else nextParams.set("sort", nextSort);

        const suffix = nextParams.toString();
        const href = suffix ? `${pathname}?${suffix}` : pathname;

        startTransition(() => {
          router.push(href, { scroll: false });
        });
      }}
    >
      <option value="cpr_desc">ต้นทุนต่อผลลัพธ์ (CPR): สูง → ต่ำ</option>
      <option value="roas_asc">ผลตอบแทนโฆษณา (ROAS): ต่ำ → สูง</option>
      <option value="spend_desc">ยอดใช้จ่าย (Spend): สูง → ต่ำ</option>
    </select>
  );
};
