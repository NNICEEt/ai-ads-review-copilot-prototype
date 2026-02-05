"use client";

import { useMemo, useState } from "react";
import type {
  CreativeType,
  DerivedMetrics,
  Totals,
} from "@/lib/types/canonical";
import { formatCurrency } from "@/lib/utils/metrics";
import { AdsPerformanceItem } from "@/components/detail/AdsPerformanceItem";
import { AdDetailModal } from "@/components/detail/AdDetailModal";

type Diagnosis = {
  label: string;
  severity: "low" | "med" | "high";
  reason: string;
};

type DeltaValue = {
  current: number | null;
  previous: number | null;
  absolute: number | null;
  percent: number | null;
};

type AdRow = {
  id: string;
  name: string;
  creativeType?: CreativeType | null;
  creativeKey?: string | null;
  totals: Totals;
  derived: DerivedMetrics;
  previous?: DerivedMetrics;
  deltas?: {
    costPerResult?: DeltaValue;
    cpc?: DeltaValue;
    ctr?: DeltaValue;
    frequency?: DeltaValue;
    roas?: DeltaValue;
    conversionRate?: DeltaValue;
  };
  diagnosis?: Diagnosis;
};

type AdsPerformancePanelProps = {
  periodDays: number;
  adGroupBaseline: {
    name: string;
    derived: DerivedMetrics;
  };
  ads: AdRow[];
};

const typeBadge = (type: CreativeType | null | undefined) => {
  if (type === "VIDEO") return "VID";
  if (type === "IMAGE") return "IMG";
  if (type === "CAROUSEL") return "CAR";
  return "AD";
};

const ctrText = (ctr: number | null | undefined) => {
  if (ctr == null) return "ไม่มีข้อมูล";
  return `${(ctr * 100).toFixed(2)}%`;
};

export const AdsPerformancePanel = ({
  periodDays,
  adGroupBaseline,
  ads,
}: AdsPerformancePanelProps) => {
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null);

  const adsWithVariant = useMemo(() => {
    const sortedByCpr = [...ads].sort((a, b) => {
      const aCpr = a.derived.costPerResult ?? Number.NEGATIVE_INFINITY;
      const bCpr = b.derived.costPerResult ?? Number.NEGATIVE_INFINITY;
      return bCpr - aCpr;
    });

    const worstId = sortedByCpr[0]?.id ?? null;
    const bestId = sortedByCpr.length ? (sortedByCpr.at(-1)?.id ?? null) : null;

    return ads.map((ad) => {
      const variant: "bad" | "good" | "average" =
        ad.id === worstId ? "bad" : ad.id === bestId ? "good" : "average";
      return { ...ad, variant };
    });
  }, [ads]);

  const selectedAd = useMemo(() => {
    if (!selectedAdId) return null;
    return ads.find((ad) => ad.id === selectedAdId) ?? null;
  }, [ads, selectedAdId]);

  const close = () => setSelectedAdId(null);

  return (
    <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h3 className="font-bold text-slate-900 text-sm">ประสิทธิภาพโฆษณา</h3>
        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
          {ads.length} โฆษณาใช้งาน
        </span>
      </div>

      <div className="divide-y divide-slate-100 overflow-y-auto max-h-75 custom-scrollbar">
        {adsWithVariant.length > 0 ? (
          adsWithVariant.map((ad) => (
            <AdsPerformanceItem
              key={ad.id}
              typeLabel={typeBadge(ad.creativeType)}
              name={ad.name}
              cpr={`CPR ${formatCurrency(ad.derived.costPerResult ?? null)}`}
              ctr={ctrText(ad.derived.ctr)}
              spend={formatCurrency(ad.totals.spend)}
              variant={ad.variant}
              recommendation={
                ad.variant === "bad"
                  ? "ตรวจครีเอทีฟ (Creative) / พิจารณา Pause (หยุดโฆษณา)"
                  : undefined
              }
              onClick={() => setSelectedAdId(ad.id)}
            />
          ))
        ) : (
          <div className="p-6 text-center text-slate-500 text-xs font-thai">
            ยังไม่มีข้อมูลโฆษณา (Ads) ในช่วงเวลานี้
          </div>
        )}
      </div>

      <div className="p-3 text-center border-t border-slate-100 mt-auto">
        <div className="text-[11px] text-slate-600 font-thai">
          คลิกที่รายการเพื่อดูรายละเอียด (เทียบ {periodDays} วันก่อนหน้า)
        </div>
      </div>

      <AdDetailModal
        open={Boolean(selectedAdId)}
        onClose={close}
        periodDays={periodDays}
        ad={selectedAd}
        adGroupBaseline={adGroupBaseline}
      />
    </div>
  );
};
