"use client";

import { useEffect, useMemo } from "react";
import type {
  DerivedMetrics,
  Totals,
  CreativeType,
} from "@/lib/types/canonical";
import { formatCurrency, formatNumber } from "@/lib/utils/metrics";

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

type AdForModal = {
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

type AdDetailModalProps = {
  open: boolean;
  onClose: () => void;
  periodDays: number;
  ad: AdForModal | null;
  adGroupBaseline: {
    name: string;
    derived: DerivedMetrics;
  };
};

const diagnosisLabelTh = (label: string) => {
  if (label === "Fatigue Detected")
    return "ครีเอทีฟเริ่มล้า (Creative Fatigue)";
  if (label === "Cost Creeping") return "ต้นทุนเริ่มไหลขึ้น (Cost Creeping)";
  if (label === "Learning Limited") return "Learning จำกัด (Learning Limited)";
  if (label === "Top Performer") return "ผลงานโดดเด่น (Top Performer)";
  if (label === "Stable") return "ปกติ (Stable)";
  return label;
};

const typeLabel = (type: CreativeType | null | undefined) => {
  if (type === "VIDEO") return "วิดีโอ";
  if (type === "IMAGE") return "รูปภาพ";
  if (type === "CAROUSEL") return "คารูเซล";
  return "โฆษณา";
};

const deltaLabel = (delta: DeltaValue | undefined, suffix = "%") => {
  const percent = delta?.percent;
  if (percent == null) return "—";
  const value = Math.round(percent * 100);
  return `${value > 0 ? "+" : ""}${value}${suffix}`;
};

const deltaPillClass = (delta: DeltaValue | undefined) => {
  const percent = delta?.percent;
  if (percent == null || percent === 0) {
    return "bg-slate-100 text-slate-600 border border-slate-200";
  }
  return percent > 0
    ? "bg-red-50 text-red-700 border border-red-200"
    : "bg-emerald-50 text-emerald-700 border border-emerald-200";
};

const diagnosisTone = (label: string | undefined) => {
  if (label === "Top Performer") {
    return {
      pill: "bg-emerald-50 text-emerald-800 border border-emerald-200",
      icon: "fa-solid fa-crown",
    };
  }
  if (label === "Cost Creeping" || label === "Learning Limited") {
    return {
      pill: "bg-amber-50 text-amber-900 border border-amber-200",
      icon: "fa-solid fa-circle-exclamation",
    };
  }
  if (label === "Fatigue Detected") {
    return {
      pill: "bg-red-50 text-red-800 border border-red-200",
      icon: "fa-solid fa-triangle-exclamation",
    };
  }
  return {
    pill: "bg-slate-50 text-slate-700 border border-slate-200",
    icon: "fa-solid fa-minus",
  };
};

const decideFixLevel = (params: {
  ad: AdForModal;
  adGroupBaseline: DerivedMetrics;
}) => {
  const adCtr = params.ad.derived.ctr ?? null;
  const groupCtr = params.adGroupBaseline.ctr ?? null;
  const adFreq = params.ad.derived.frequency ?? null;
  const label = params.ad.diagnosis?.label;

  if (label === "Fatigue Detected") return "creative";
  if (label === "Learning Limited") return "adgroup";
  if (label === "Cost Creeping") return "adgroup";
  if (label === "Top Performer") return "ad";

  if (adFreq != null && adFreq >= 4) return "creative";
  if (adCtr != null && groupCtr != null && groupCtr > 0) {
    if (adCtr < groupCtr * 0.85) return "creative";
  }
  return "adgroup";
};

const suggestionLines = (params: {
  fixLevel: "creative" | "adgroup" | "ad";
  diagnosisLabel?: string;
}) => {
  if (params.fixLevel === "ad") {
    return [
      "เพิ่มงบ/ขยายกลุ่มเป้าหมาย (Audience) แบบค่อยเป็นค่อยไป (กัน Learning Reset)",
      "ทำเป็นชุดทดสอบเพื่อหาโฆษณาที่ชนะ (Winner) เพิ่ม (Creative/Audience)",
    ];
  }

  if (params.fixLevel === "creative") {
    return [
      "รีเฟรชครีเอทีฟ (Creative): เปลี่ยน Hook/Thumbnail/ข้อความ และทำ A/B Test อย่างน้อย 2–3 ชิ้น",
      "ถ้าความถี่ (Frequency) สูง: กระจายครีเอทีฟ (Creative) ใหม่ + ขยายกลุ่มเป้าหมาย (Audience) เพื่อลดความถี่",
      "พิจารณา Pause โฆษณานี้ ถ้าอัตราคลิก (CTR) ต่ำ และต้นทุนต่อผลลัพธ์ (CPR) แพงกว่ากลุ่มอย่างชัดเจน",
    ];
  }

  if (params.diagnosisLabel === "Learning Limited") {
    return [
      "รวม/ลดจำนวนชุดโฆษณา เพื่อให้ผลลัพธ์ต่อชุดมากขึ้น (ผ่านช่วง Learning)",
      "ขยายกลุ่มเป้าหมาย (Audience) หรือเพิ่มงบเล็กน้อย เพื่อให้ได้ปริมาณ (Volume) เพิ่ม",
    ];
  }

  return [
    "ตรวจกลุ่มเป้าหมาย (Audience) / ตำแหน่ง (Placement): ลองขยายกลุ่มหรือปรับ Placement เพื่อลดต้นทุนต่อผลลัพธ์ (CPR)",
    "โยกงบไปยังโฆษณาที่ต้นทุนต่อผลลัพธ์ (CPR) ถูกกว่าในกลุ่มเดียวกัน",
    "ถ้าอัตราคลิก (CTR) ไม่ดีขึ้น: ค่อย ๆ ทดลองครีเอทีฟ (Creative) ใหม่เพิ่มเติม",
  ];
};

export const AdDetailModal = ({
  open,
  onClose,
  periodDays,
  ad,
  adGroupBaseline,
}: AdDetailModalProps) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  const content = useMemo(() => {
    if (!ad) return null;
    const fixLevel = decideFixLevel({
      ad,
      adGroupBaseline: adGroupBaseline.derived,
    });
    const diagnosis = ad.diagnosis;
    const tone = diagnosisTone(diagnosis?.label);

    const groupCtr = adGroupBaseline.derived.ctr ?? null;
    const adCtr = ad.derived.ctr ?? null;

    const ctrVsGroup =
      adCtr != null && groupCtr != null && groupCtr > 0
        ? Math.round((adCtr / groupCtr - 1) * 100)
        : null;

    return {
      fixLevel,
      diagnosis,
      tone,
      ctrVsGroup,
      suggestions: suggestionLines({
        fixLevel,
        diagnosisLabel: diagnosis?.label,
      }),
    };
  }, [ad, adGroupBaseline]);

  if (!open || !ad || !content) return null;

  const diagnosis = content.diagnosis;
  const compareLabel = `เทียบกับ ${periodDays} วันก่อนหน้า`;
  const titleId = `ad-detail-title-${ad.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
        aria-label="ปิดหน้าต่างรายละเอียดโฆษณา"
        onClick={onClose}
      ></button>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
      >
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-800">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {typeLabel(ad.creativeType)}
              </span>
              {diagnosis ? (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${content.tone.pill}`}
                >
                  <i className={content.tone.icon}></i>
                  {diagnosisLabelTh(diagnosis.label)}
                </span>
              ) : null}
            </div>
            <h4 id={titleId} className="font-bold text-slate-900 truncate">
              {ad.name}
            </h4>
            <p className="text-xs text-slate-600 font-thai mt-0.5">
              {compareLabel}
            </p>
          </div>

          <button
            type="button"
            className="w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors inline-flex items-center justify-center shrink-0"
            aria-label="ปิด"
            onClick={onClose}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {diagnosis ? (
            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-bold text-slate-900 mb-1">
                ทำไมถึงน่าสนใจ
              </div>
              <div className="text-sm text-slate-700 font-thai">
                {diagnosis.reason}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl border border-slate-200 p-3 bg-white">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                ยอดใช้จ่าย (Spend)
              </div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {formatCurrency(ad.totals.spend)}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 bg-white">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                ผลลัพธ์ (Results)
              </div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {formatNumber(ad.totals.results)}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 bg-white">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                ต้นทุนต่อผลลัพธ์ (CPR)
              </div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {formatCurrency(ad.derived.costPerResult ?? null)}
              </div>
              <span
                className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${deltaPillClass(ad.deltas?.costPerResult)}`}
              >
                {deltaLabel(ad.deltas?.costPerResult)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 bg-white">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                ต้นทุนต่อคลิก (CPC)
              </div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {formatCurrency(ad.derived.cpc ?? null)}
              </div>
              <span
                className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${deltaPillClass(ad.deltas?.cpc)}`}
              >
                {deltaLabel(ad.deltas?.cpc)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 bg-white">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                อัตราคลิก (CTR)
              </div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {ad.derived.ctr != null
                  ? `${(ad.derived.ctr * 100).toFixed(2)}%`
                  : "ไม่มีข้อมูล"}
              </div>
              <span
                className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${deltaPillClass(ad.deltas?.ctr)}`}
              >
                {deltaLabel(ad.deltas?.ctr)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 bg-white">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                ความถี่ (Frequency)
              </div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {ad.derived.frequency != null
                  ? ad.derived.frequency.toFixed(1)
                  : "ไม่มีข้อมูล"}
              </div>
              <span
                className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${deltaPillClass(ad.deltas?.frequency)}`}
              >
                {deltaLabel(ad.deltas?.frequency)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 bg-white">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                ผลตอบแทนโฆษณา (ROAS)
              </div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {ad.derived.roas != null
                  ? `${ad.derived.roas.toFixed(1)}x`
                  : "ไม่มีข้อมูล"}
              </div>
              <span
                className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${deltaPillClass(ad.deltas?.roas)}`}
              >
                {deltaLabel(ad.deltas?.roas)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 bg-white">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                การแสดงผล (Impressions)
              </div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {formatNumber(ad.totals.impressions)}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 bg-white">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                คลิก (Clicks)
              </div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {formatNumber(ad.totals.clicks)}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 bg-white">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                การเข้าถึง (Reach)
              </div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {formatNumber(ad.totals.reach ?? null)}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mb-5">
            <div className="text-xs font-bold text-slate-900 mb-2">
              ระดับที่ควรแก้
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
                  content.fixLevel === "creative"
                    ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                <i className="fa-solid fa-image"></i>
                ครีเอทีฟ (Creative)
              </span>
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
                  content.fixLevel === "adgroup"
                    ? "bg-amber-50 text-amber-900 border-amber-200"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                <i className="fa-solid fa-users"></i>
                กลุ่มโฆษณา (Audience/Placement)
              </span>
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
                  content.fixLevel === "ad"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                <i className="fa-solid fa-chart-line"></i>
                เพิ่มงบ/ขยายผล
              </span>
            </div>

            <div className="mt-3 text-xs text-slate-700 font-thai">
              {content.ctrVsGroup != null ? (
                <span>
                  CTR เทียบกับค่าเฉลี่ยของกลุ่ม:{" "}
                  <span
                    className={
                      content.ctrVsGroup >= 0
                        ? "text-emerald-700 font-bold"
                        : "text-red-700 font-bold"
                    }
                  >
                    {content.ctrVsGroup > 0 ? "+" : ""}
                    {content.ctrVsGroup}%
                  </span>
                </span>
              ) : (
                <span>ยังไม่พอข้อมูลในการเทียบกับค่าเฉลี่ยของกลุ่ม</span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-bold text-slate-900 mb-2">
              ข้อเสนอแนะ (POC)
            </div>
            <ul className="space-y-2 text-sm text-slate-700 font-thai">
              {content.suggestions.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 text-[11px] text-slate-600 font-thai">
              หมายเหตุ: เป็นข้อเสนอแนะเพื่อเดโม
              (ควรตรวจสอบกับบริบทจริงก่อนลงมือ)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
