import { ContextNavbar } from "@/components/navbar/ContextNavbar";
import { ScoreBadge } from "@/components/detail/ScoreBadge";
import { EvidenceSlot } from "@/components/detail/EvidenceSlot";
import { AdsPerformanceItem } from "@/components/detail/AdsPerformanceItem";
import { getAdGroupDetail } from "@/lib/data/review";
import { formatCurrency } from "@/lib/utils/metrics";
import { getAiSummary } from "@/lib/ai/summary";
import type { ReactNode } from "react";

type Params = {
  params: { id: string } | Promise<{ id: string }>;
  searchParams: { periodDays?: string } | Promise<{ periodDays?: string }>;
};

const evidenceStyles = {
  E1: {
    icon: "fa-solid fa-money-bill-trend-up",
    iconClass: "text-red-400 group-hover:text-red-500",
    container: "hover:border-red-200 transition-colors",
    pillClass: "text-red-600 bg-red-100",
    pillIcon: "fa-solid fa-arrow-up",
  },
  E2: {
    icon: "fa-solid fa-arrow-pointer",
    iconClass: "text-red-400 group-hover:text-red-500",
    container: "hover:border-red-200 transition-colors",
    pillClass: "text-red-600 bg-red-100",
    pillIcon: "fa-solid fa-arrow-down",
  },
  E3: {
    icon: "fa-solid fa-rotate",
    iconClass: "text-amber-400 group-hover:text-amber-500",
    container: "hover:border-amber-200 transition-colors",
    pillClass: "text-amber-600 bg-amber-100",
    pillIcon: undefined,
  },
};

const formatEvidenceValue = (metricLabel: string, value: number | null) => {
  if (value == null) return "N/A";
  if (metricLabel === "ROAS") return `${value.toFixed(1)}x`;
  if (metricLabel.includes("Rate") || metricLabel.includes("CTR")) {
    return `${(value * 100).toFixed(2)}%`;
  }
  if (metricLabel === "Cost per Result") return formatCurrency(value);
  return value.toFixed(2);
};

type AiInsightItem = {
  title: string;
  detail: ReactNode;
  iconWrapperClass: string;
  iconClass: string;
};

type AiRecommendationItem = {
  title: string;
  detail: ReactNode;
  iconWrapperClass: string;
  iconClass: string;
};

const insightStyles = {
  high: {
    iconWrapperClass:
      "mt-0.5 bg-amber-100 w-6 h-6 rounded shrink-0 flex items-center justify-center text-amber-500",
    iconClass: "fa-solid fa-triangle-exclamation text-xs",
  },
  med: {
    iconWrapperClass:
      "mt-0.5 bg-red-100 w-6 h-6 rounded shrink-0 flex items-center justify-center text-red-500",
    iconClass: "fa-solid fa-arrow-trend-up text-xs",
  },
  low: {
    iconWrapperClass:
      "mt-0.5 bg-slate-100 w-6 h-6 rounded shrink-0 flex items-center justify-center text-slate-500",
    iconClass: "fa-solid fa-minus text-xs",
  },
};

const recommendationStyles = {
  high: {
    iconWrapperClass:
      "mt-0.5 bg-indigo-100 w-6 h-6 rounded shrink-0 flex items-center justify-center text-indigo-500",
    iconClass: "fa-solid fa-wand-magic-sparkles text-xs",
  },
  med: {
    iconWrapperClass:
      "mt-0.5 bg-blue-100 w-6 h-6 rounded shrink-0 flex items-center justify-center text-blue-500",
    iconClass: "fa-solid fa-users text-xs",
  },
  low: {
    iconWrapperClass:
      "mt-0.5 bg-slate-100 w-6 h-6 rounded shrink-0 flex items-center justify-center text-slate-500",
    iconClass: "fa-solid fa-lightbulb text-xs",
  },
};

const fallbackInsights: AiInsightItem[] = [
  {
    title: "Creative Fatigue Detected",
    detail: (
      <>
        Frequency สูงแตะ <span className="font-medium text-slate-900">4.2</span>{" "}
        ทำให้ CTR ตกลงอย่างรวดเร็ว{" "}
        <span className="text-red-500 font-medium">(-29%)</span> เป็นสัญญาณว่า
        กลุ่มเป้าหมายเดิมเห็นโฆษณาซ้ำจนเกิดอาการ “ตาบอดโฆษณา” (Banner Blindness)
      </>
    ),
    ...insightStyles.high,
  },
  {
    title: "Cost Efficiency Dropped",
    detail: (
      <>
        Cost per Result เพิ่มขึ้น{" "}
        <span className="text-red-500 font-medium">+22%</span> ทำให้ประสิทธิภาพ
        โดยรวมของแคมเปญลดลง
      </>
    ),
    ...insightStyles.med,
  },
];

const fallbackRecommendations: AiRecommendationItem[] = [
  {
    title: "Refresh Creative Assets",
    detail: (
      <>
        แนะนำให้ <u>หยุด (Pause)</u> Ads ที่ CTR ต่ำกว่า 0.6% และทดสอบ Creative
        ใหม่อย่างน้อย 2–3 ชิ้น
      </>
    ),
    ...recommendationStyles.high,
  },
  {
    title: "Expand Audience",
    detail: (
      <>
        พิจารณาขยาย LAL จาก 1% เป็น 3% หรือเพิ่ม Interest
        ใกล้เคียงเพื่อลดความถี่ หาก Creative ใหม่ยังไม่พร้อม
      </>
    ),
    ...recommendationStyles.med,
  },
];

export default async function AdGroupDetailPage({
  params,
  searchParams,
}: Params) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const detail = await getAdGroupDetail({
    adGroupId: resolvedParams.id,
    periodDays: resolvedSearchParams.periodDays ?? null,
  });

  if (!detail) {
    return (
      <div className="min-h-screen">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-500 text-sm">
            Ad group not found.
          </div>
        </main>
      </div>
    );
  }

  const aiSummary = await getAiSummary({
    adGroupId: resolvedParams.id,
    periodDays: detail.period.days,
    detail,
  });

  const periodLabel = `Last ${detail.period.days} Days`;
  const compareLabel = `vs Previous ${detail.period.days} Days`;
  const costPercent = detail.costDelta.percent
    ? Math.round(detail.costDelta.percent * 100)
    : 0;
  const costPercentLabel = `${costPercent > 0 ? "+" : ""}${costPercent}%`;
  const costDescription = costPercent >= 0 ? "ต้นทุนสูงขึ้น" : "ต้นทุนลดลง";

  const adsSorted = [...detail.ads].sort((a, b) => {
    const cprA = a.derived.costPerResult ?? 0;
    const cprB = b.derived.costPerResult ?? 0;
    return cprB - cprA;
  });

  const medianIndex = Math.floor(adsSorted.length / 2);
  const selectedAds = [
    adsSorted[0],
    adsSorted[adsSorted.length - 1],
    adsSorted[medianIndex],
  ]
    .filter(Boolean)
    .filter(
      (ad, index, self) =>
        self.findIndex((item) => item.id === ad.id) === index,
    );

  const adsToShow = selectedAds.map((ad, index) => {
    const cpr = ad.derived.costPerResult ?? 0;
    const ctr = ad.derived.ctr ?? 0;
    const variant: "bad" | "good" | "average" =
      index === 0 ? "bad" : index === 1 ? "good" : "average";
    return {
      id: ad.id,
      name: ad.name,
      typeLabel: ad.creativeType === "VIDEO" ? "VID" : "IMG",
      cpr: `CPR ${formatCurrency(cpr)}`,
      ctr: `${(ctr * 100).toFixed(2)}%`,
      spend: formatCurrency(ad.totals.spend),
      variant,
      recommendation: variant === "bad" ? "Pause" : undefined,
    };
  });

  const aiStatus =
    aiSummary.status === "ok"
      ? { label: "Ready", dot: "bg-green-400" }
      : aiSummary.status === "partial"
        ? { label: "Partial", dot: "bg-amber-400" }
        : aiSummary.status === "disabled"
          ? { label: "Disabled", dot: "bg-slate-400" }
          : { label: "Fallback", dot: "bg-amber-400" };

  const aiSubtitle =
    aiSummary.insight?.insightSummary ??
    "Analyzing patterns from evidence to actionable advice";

  const aiInsights: AiInsightItem[] = aiSummary.insight?.insights?.length
    ? aiSummary.insight.insights.map((insight) => ({
        title: insight.title,
        detail: insight.detail,
        ...insightStyles[insight.severity],
      }))
    : fallbackInsights;

  const aiRecommendations: AiRecommendationItem[] = aiSummary.recommendation
    ?.recommendations?.length
    ? aiSummary.recommendation.recommendations.map((item) => ({
        title: item.action,
        detail: item.reason,
        ...recommendationStyles[item.confidence],
      }))
    : fallbackRecommendations;

  const aiFooterText =
    aiSummary.status === "ok"
      ? "AI generated suggestions based on metrics snapshot. Please review before applying."
      : "ไม่สามารถสร้างสรุป AI ได้ในขณะนี้ (แสดงผลจาก deterministic logic เท่านั้น)";

  return (
    <div className="min-h-screen">
      <ContextNavbar
        backHref={`/campaign/${detail.campaign.id}?periodDays=${detail.period.days}`}
        backLabel="Back"
        contextTop={`Campaign: ${detail.campaign.name}`}
        contextMain={`Ad Group: ${detail.adGroup.name}`}
        contextIconClass="fa-regular fa-folder-open text-slate-400"
        period={{
          label: periodLabel,
          compareLabel,
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <ScoreBadge
            score={detail.score}
            label={detail.label}
            description={`${costDescription} ${costPercentLabel} และประสิทธิภาพลดลงอย่างมีนัยสำคัญ`}
            progressColorClass="text-red-500"
            badgeClass="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-red-50 text-red-700 border border-red-100 mb-3 shadow-sm"
            badgeDotClass="bg-red-500"
          />

          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <i className="fa-solid fa-magnifying-glass-chart text-blue-500"></i>
                Evidence-Based Diagnosis
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">
                Auto-generated from metrics
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
              {detail.evidence.map((slot) => {
                const style = evidenceStyles[slot.id];
                const currentValue = formatEvidenceValue(
                  slot.metricLabel,
                  slot.value.current,
                );
                const prevValue = formatEvidenceValue(
                  slot.metricLabel,
                  slot.value.previous,
                );
                const changePercent = slot.value.percent
                  ? Math.round(slot.value.percent * 100)
                  : 0;
                return (
                  <EvidenceSlot
                    key={slot.id}
                    title={`${slot.id}: ${slot.title}`}
                    value={currentValue}
                    metricLabel={slot.metricLabel}
                    iconClass={style.icon}
                    iconClassName={style.iconClass}
                    containerClass={style.container}
                    prevText={`Prev: ${prevValue}`}
                    changePill={{
                      text:
                        slot.id === "E3" && slot.metricLabel === "Frequency"
                          ? "High"
                          : `${Math.abs(changePercent)}%`,
                      className: style.pillClass,
                      iconClass: style.pillIcon,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl shadow-sm overflow-hidden mb-8 relative ring-1 ring-indigo-500/10">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-linear-to-b from-blue-500 to-indigo-600"></div>
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <i className="fa-solid fa-robot text-9xl text-indigo-900"></i>
          </div>

          <div className="p-6 relative z-10">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-indigo-200/50">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-indigo-900">
                  <i className="fa-solid fa-wand-magic-sparkles text-indigo-500"></i>
                  AI Copilot Analysis
                </h3>
                <p className="text-xs text-indigo-600/70 mt-0.5 font-medium ml-7">
                  {aiSubtitle}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-indigo-500 font-bold bg-white px-2 py-1 rounded border border-indigo-100 shadow-sm">
                  <span
                    className={`w-1.5 h-1.5 ${aiStatus.dot} rounded-full inline-block mr-1`}
                  ></span>
                  {aiStatus.label}
                </span>
                <button className="text-indigo-400 hover:text-indigo-600 transition-colors">
                  <i className="fa-solid fa-rotate-right"></i>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xs font-bold uppercase text-indigo-400 tracking-wider mb-3 flex items-center gap-2">
                  <span className="bg-indigo-100 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                    1
                  </span>
                  Situation Analysis
                </h4>
                <ul className="space-y-3">
                  {aiInsights.map((item, index) => (
                    <li
                      key={`${item.title}-${index}`}
                      className="group flex gap-3 text-sm text-slate-700 bg-white/80 p-3.5 rounded-lg border border-indigo-50 hover:border-indigo-200 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className={item.iconWrapperClass}>
                        <i className={item.iconClass}></i>
                      </div>
                      <div className="flex-1">
                        <span className="font-bold block text-slate-900 mb-1">
                          {item.title}
                        </span>
                        <span className="text-slate-600 font-thai text-sm leading-relaxed">
                          {item.detail}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-indigo-400 tracking-wider mb-3 flex items-center gap-2">
                  <span className="bg-indigo-100 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                    2
                  </span>
                  Actionable Recommendations
                </h4>
                <ul className="space-y-3">
                  {aiRecommendations.map((item, index) => (
                    <li
                      key={`${item.title}-${index}`}
                      className="group flex gap-3 text-sm text-slate-700 bg-white p-3.5 rounded-lg border border-indigo-100 hover:border-indigo-200 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className={item.iconWrapperClass}>
                        <i className={item.iconClass}></i>
                      </div>
                      <div className="flex-1">
                        <span className="font-bold block text-slate-900 mb-1">
                          {item.title}
                        </span>
                        <p className="text-slate-500 text-xs font-thai leading-relaxed">
                          {item.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/50 px-6 py-2 text-[10px] text-indigo-400 text-center border-t border-indigo-100 font-medium">
            <i className="fa-brands fa-markdown mr-1"></i> {aiFooterText}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <i className="fa-solid fa-chart-area text-slate-400"></i>
                Daily Trend
              </h3>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Cost/Result
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  Spend
                </span>
              </div>
            </div>
            <div className="relative h-64 w-full bg-slate-50 rounded-lg border border-slate-100 p-2">
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                Chart placeholder
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">
                Ads Performance
              </h3>
              <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                6 Active
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-75 custom-scrollbar">
              {adsToShow.length > 0 ? (
                adsToShow.map((ad) => (
                  <AdsPerformanceItem key={ad.id} {...ad} />
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs font-thai">
                  ยังไม่มีข้อมูล Ads ในช่วงเวลานี้
                </div>
              )}
            </div>

            <div className="p-3 text-center border-t border-slate-100 mt-auto">
              <button className="text-xs text-blue-600 font-bold hover:underline">
                View All 6 Ads
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
