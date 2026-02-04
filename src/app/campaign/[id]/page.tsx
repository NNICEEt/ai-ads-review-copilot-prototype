import { Suspense } from "react";
import { AiInsightSnippet } from "@/components/ai/AiInsightSnippet";
import { CampaignAiRecommendation } from "@/components/campaign/CampaignAiRecommendation";
import { ContextNavbar } from "@/components/navbar/ContextNavbar";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { getCampaignBreakdown } from "@/lib/data/review";
import { formatCurrency, formatNumber } from "@/lib/utils/metrics";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ periodDays?: string }>;
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const SkeletonBlock = ({ className }: { className: string }) => (
  <div className={`bg-slate-200/70 rounded ${className}`} />
);

const diagnosisStyles = (label: string) => {
  if (label === "Fatigue Detected") {
    return {
      row: "bg-red-50/10 hover:bg-red-50/20 transition-colors group",
      badge: "bg-red-50 border border-red-100 text-red-700",
      icon: "fa-solid fa-triangle-exclamation",
      text: "text-red-700",
    };
  }
  if (label === "Cost Creeping") {
    return {
      row: "hover:bg-slate-50 transition-colors group",
      badge: "bg-amber-50 border border-amber-100 text-amber-700",
      icon: "fa-solid fa-money-bill-wave",
      text: "text-amber-700",
    };
  }
  if (label === "Top Performer") {
    return {
      row: "hover:bg-slate-50 transition-colors group bg-emerald-50/10",
      badge: "bg-emerald-50 border border-emerald-100 text-emerald-700",
      icon: "fa-solid fa-crown",
      text: "text-emerald-700",
    };
  }
  return {
    row: "hover:bg-slate-50 transition-colors group",
    badge: "bg-slate-50 border border-slate-100 text-slate-500",
    icon: "fa-solid fa-minus",
    text: "text-slate-500",
  };
};

const diagnosisLabelTh = (label: string) => {
  if (label === "Fatigue Detected") return "Creative Fatigue";
  if (label === "Cost Creeping") return "ต้นทุนเริ่มไหลขึ้น";
  if (label === "Learning Limited") return "Learning จำกัด";
  if (label === "Top Performer") return "ผลงานโดดเด่น";
  if (label === "Stable") return "ปกติ";
  return label;
};

const CampaignBreakdownSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr className="text-slate-500 text-xs uppercase tracking-wider text-right">
            <th className="p-4 text-left w-1/4">ชื่อกลุ่มโฆษณา</th>
            <th className="p-4 text-left w-1/4">AI วิเคราะห์ (Insight)</th>
            <th className="p-4">ยอดใช้จ่าย</th>
            <th className="p-4 text-center">ผลลัพธ์</th>
            <th className="p-4">CPR</th>
            <th className="p-4">ROAS</th>
            <th className="p-4">CTR</th>
            <th className="p-4 text-center">ดูรายละเอียด</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {Array.from({ length: 5 }, (_, index) => (
            <tr key={`campaign-row-skeleton-${index}`}>
              <td className="p-4">
                <SkeletonBlock className="h-3 w-48" />
                <div className="mt-2">
                  <SkeletonBlock className="h-2.5 w-20" />
                </div>
              </td>
              <td className="p-4">
                <SkeletonBlock className="h-14 w-full rounded-lg" />
              </td>
              <td className="p-4 text-right">
                <SkeletonBlock className="h-3 w-20 ml-auto" />
              </td>
              <td className="p-4 text-center">
                <SkeletonBlock className="h-3 w-12 mx-auto" />
              </td>
              <td className="p-4 text-right">
                <SkeletonBlock className="h-3 w-20 ml-auto" />
                <div className="mt-2">
                  <SkeletonBlock className="h-2.5 w-12 ml-auto" />
                </div>
              </td>
              <td className="p-4 text-right">
                <SkeletonBlock className="h-3 w-12 ml-auto" />
              </td>
              <td className="p-4 text-right">
                <SkeletonBlock className="h-3 w-12 ml-auto" />
              </td>
              <td className="p-4 text-center">
                <SkeletonBlock className="h-8 w-8 rounded-full mx-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="bg-slate-50 border-t border-slate-200 p-4">
      <div className="flex items-center gap-3 text-sm">
        <span className="font-bold text-slate-700">
          คำแนะนำจาก AI สำหรับแคมเปญ:
        </span>
        <SkeletonBlock className="h-3 w-96 max-w-full" />
      </div>
    </div>
  </div>
);

const CampaignNavbar = async ({
  breakdownPromise,
}: {
  breakdownPromise: ReturnType<typeof getCampaignBreakdown>;
}) => {
  const data = await breakdownPromise;
  const campaignName = data.campaign?.name ?? "-";
  const accountName = data.campaign?.account?.name ?? "-";

  return (
    <ContextNavbar
      backHref="/"
      backLabel="กลับสู่แดชบอร์ด"
      contextTop={`บัญชี: ${accountName}`}
      contextMain={`แคมเปญ: ${campaignName}`}
      contextIconClass="fa-solid fa-layer-group text-blue-600"
    />
  );
};

const CampaignSummaryCard = ({
  summary,
}: {
  summary: Awaited<ReturnType<typeof getCampaignBreakdown>>["summary"];
}) => {
  if (!summary) return null;

  const counts = summary.diagnosisCounts;
  const actions = summary.actions ?? [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <i className="fa-solid fa-bolt text-blue-600"></i>
            ภาพรวมแคมเปญ (Deterministic)
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-thai">
            สรุปจากตัวเลขจริง (ไม่พึ่ง AI) เพื่อช่วยตัดสินใจเร็วขึ้น
          </p>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-slate-500">ยอดใช้จ่ายรวม</div>
          <div className="text-sm font-bold text-slate-900">
            {formatCurrency(summary.spendTotal)}
          </div>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] text-slate-500 font-medium">
                Winner (CPR ต่ำ)
              </div>
              <div className="mt-1 font-bold text-slate-900">
                {summary.bestCprName ?? "—"}
              </div>
              <div className="text-xs text-slate-600 font-thai">
                {summary.bestCpr != null
                  ? `CPR ${formatCurrency(summary.bestCpr)}`
                  : "ไม่มีข้อมูล CPR"}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] text-slate-500 font-medium">
                Loser (CPR สูง)
              </div>
              <div className="mt-1 font-bold text-slate-900">
                {summary.worstCprName ?? "—"}
              </div>
              <div className="text-xs text-slate-600 font-thai">
                {summary.worstCpr != null
                  ? `CPR ${formatCurrency(summary.worstCpr)}`
                  : "ไม่มีข้อมูล CPR"}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] text-slate-500 font-medium">
                Best ROAS
              </div>
              <div className="mt-1 font-bold text-slate-900">
                {summary.bestRoasName ?? "—"}
              </div>
              <div className="text-xs text-slate-600 font-thai">
                {summary.bestRoas != null
                  ? `ROAS ${summary.bestRoas.toFixed(1)}x`
                  : "ไม่มีข้อมูล ROAS"}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] text-slate-500 font-medium">
                Worst ROAS
              </div>
              <div className="mt-1 font-bold text-slate-900">
                {summary.worstRoasName ?? "—"}
              </div>
              <div className="text-xs text-slate-600 font-thai">
                {summary.worstRoas != null
                  ? `ROAS ${summary.worstRoas.toFixed(1)}x`
                  : "ไม่มีข้อมูล ROAS"}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-list-check text-slate-500"></i>
              สถานะโดยรวม
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded px-2 py-1">
                <span className="text-red-700 font-bold">Fatigue</span>
                <span className="text-red-700 font-bold">{counts.fatigue}</span>
              </div>
              <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded px-2 py-1">
                <span className="text-amber-800 font-bold">Cost</span>
                <span className="text-amber-800 font-bold">
                  {counts.costCreeping}
                </span>
              </div>
              <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded px-2 py-1">
                <span className="text-indigo-700 font-bold">Learning</span>
                <span className="text-indigo-700 font-bold">
                  {counts.learningLimited}
                </span>
              </div>
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded px-2 py-1">
                <span className="text-emerald-700 font-bold">Top</span>
                <span className="text-emerald-700 font-bold">
                  {counts.topPerformer}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                สิ่งที่ควรทำก่อน
              </div>
              {actions.length > 0 ? (
                <ul className="mt-2 space-y-2 text-xs text-slate-600 font-thai">
                  {actions.map((text) => (
                    <li key={text} className="flex gap-2">
                      <span className="text-blue-600 mt-0.5">
                        <i className="fa-solid fa-circle-check"></i>
                      </span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-slate-500 font-thai">
                  ยังไม่พบสัญญาณที่ชัดเจนจากข้อมูลช่วงนี้
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CampaignBreakdownCard = async ({
  breakdownPromise,
}: {
  breakdownPromise: ReturnType<typeof getCampaignBreakdown>;
}) => {
  const delayPromise = sleep(500);
  const data = await breakdownPromise;
  await delayPromise;

  if (!data.campaign) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-500 text-sm">
        ไม่พบแคมเปญ
      </div>
    );
  }

  const adGroupsWithCpr = data.adGroups.filter(
    (group) => group.derived.costPerResult != null,
  );
  const byCprDesc = [...adGroupsWithCpr].sort((a, b) => {
    const aCpr = a.derived.costPerResult ?? Number.NEGATIVE_INFINITY;
    const bCpr = b.derived.costPerResult ?? Number.NEGATIVE_INFINITY;
    return bCpr - aCpr;
  });
  const fromAdGroup = byCprDesc[0] ?? null;
  const toAdGroup = byCprDesc.length > 1 ? (byCprDesc.at(-1) ?? null) : null;

  const fromCpr = fromAdGroup?.derived.costPerResult ?? null;
  const toCpr = toAdGroup?.derived.costPerResult ?? null;

  const improvementPercent =
    fromCpr != null && toCpr != null && fromCpr > 0
      ? Math.max(0, Math.round((1 - toCpr / fromCpr) * 100))
      : null;

  return (
    <div className="space-y-4">
      <CampaignSummaryCard summary={data.summary} />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-500 text-xs uppercase tracking-wider text-right">
                <th className="p-4 text-left w-1/4">ชื่อกลุ่มโฆษณา</th>
                <th className="p-4 text-left w-1/4">
                  <div className="inline-flex items-center gap-1">
                    AI วิเคราะห์ (Insight)
                    <InfoTooltip
                      label="คำอธิบาย AI วิเคราะห์"
                      content={
                        "AI ช่วยสรุป Insight จากตัวเลขและ evidence ของกลุ่มโฆษณานี้\nเพื่อให้ตัดสินใจได้เร็วขึ้น (ยังควรตรวจสอบก่อนลงมือทำจริง)"
                      }
                    />
                  </div>
                </th>
                <th className="p-4">
                  <div className="inline-flex items-center gap-1 justify-end w-full">
                    ยอดใช้จ่าย
                    <InfoTooltip
                      label="คำอธิบายยอดใช้จ่าย"
                      content={"ยอดเงินที่ใช้จริงในช่วงเวลาที่เลือก (Spend)"}
                    />
                  </div>
                </th>
                <th className="p-4 text-center">
                  <div className="inline-flex items-center gap-1 justify-center w-full">
                    ผลลัพธ์
                    <InfoTooltip
                      label="คำอธิบายผลลัพธ์"
                      content={
                        "จำนวนผลลัพธ์หลักตาม Objective เช่น Purchase/Lead/Message\nใช้ดูว่าได้ผลลัพธ์ “มากพอ” หรือยัง"
                      }
                    />
                  </div>
                </th>
                <th className="p-4">
                  <div className="inline-flex items-center gap-1 justify-end w-full">
                    CPR
                    <InfoTooltip
                      label="คำอธิบาย CPR"
                      content={
                        "CPR (Cost per Result)\n= ยอดใช้จ่าย ÷ ผลลัพธ์\nยิ่งต่ำยิ่งดี"
                      }
                    />
                  </div>
                </th>
                <th className="p-4">
                  <div className="inline-flex items-center gap-1 justify-end w-full">
                    ROAS
                    <InfoTooltip
                      label="คำอธิบาย ROAS"
                      content={"ROAS (Revenue ÷ Spend)\nยิ่งสูงยิ่งดี"}
                    />
                  </div>
                </th>
                <th className="p-4">
                  <div className="inline-flex items-center gap-1 justify-end w-full">
                    CTR
                    <InfoTooltip
                      label="คำอธิบาย CTR"
                      content={"CTR (Clicks ÷ Impressions)\nยิ่งสูงยิ่งดี"}
                    />
                  </div>
                </th>
                <th className="p-4 text-center">ดูรายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {data.adGroups.length > 0 ? (
                data.adGroups.map((group) => {
                  const styles = diagnosisStyles(group.diagnosis.label);
                  const costTrend = group.costDelta.percent
                    ? Math.round(group.costDelta.percent * 100)
                    : 0;
                  const dotClass =
                    group.diagnosis.label === "Fatigue Detected"
                      ? "bg-red-500"
                      : group.diagnosis.label === "Cost Creeping"
                        ? "bg-amber-400"
                        : group.diagnosis.label === "Top Performer"
                          ? "bg-emerald-500"
                          : "bg-slate-400";
                  const aiTone =
                    group.diagnosis.label === "Top Performer"
                      ? "success"
                      : group.diagnosis.label === "Stable"
                        ? "neutral"
                        : group.diagnosis.label === "Cost Creeping" ||
                            group.diagnosis.label === "Learning Limited"
                          ? "warn"
                          : "danger";
                  return (
                    <tr key={group.id} className={styles.row}>
                      <td className="p-4 align-top">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`w-2 h-2 rounded-full ${dotClass}`}
                          ></span>
                          <span className="font-bold text-slate-900">
                            {group.name}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 pl-4">
                          ใช้งานอยู่
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <AiInsightSnippet
                          adGroupId={group.id}
                          periodDays={data.period.days}
                          fallbackTitle={diagnosisLabelTh(
                            group.diagnosis.label,
                          )}
                          fallbackDetail={group.diagnosis.reason}
                          variant="card"
                          tone={aiTone}
                          autoLoad={false}
                        />
                      </td>
                      <td className="p-4 text-right font-medium text-slate-600">
                        {formatCurrency(group.totals.spend)}
                      </td>
                      <td className="p-4 text-center font-medium text-slate-600">
                        {formatNumber(group.totals.results)}
                      </td>
                      <td className="p-4 text-right">
                        <span className="block font-bold text-slate-700">
                          {formatCurrency(group.derived.costPerResult ?? null)}
                        </span>
                        <span className="text-[10px] text-slate-500 flex justify-end items-center gap-1">
                          <i className="fa-solid fa-arrow-trend-up"></i>
                          {costTrend > 0 ? "+" : ""}
                          {costTrend}%
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="block font-medium text-slate-700">
                          {group.derived.roas
                            ? `${group.derived.roas.toFixed(1)}x`
                            : "ไม่มีข้อมูล"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="block font-medium text-slate-700">
                          {group.derived.ctr
                            ? `${(group.derived.ctr * 100).toFixed(2)}%`
                            : "ไม่มีข้อมูล"}
                        </span>
                      </td>
                      <td className="p-4 text-center align-middle">
                        <a
                          href={`/adgroup/${group.id}?periodDays=${data.period.days}`}
                          className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 w-8 h-8 rounded-full transition-all inline-flex items-center justify-center"
                          aria-label="ดูรายละเอียด"
                        >
                          <i className="fa-solid fa-chevron-right"></i>
                        </a>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="p-10 text-center text-slate-500 text-sm font-thai"
                  >
                    ยังไม่มีข้อมูลกลุ่มโฆษณาสำหรับแคมเปญนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50 border-t border-slate-200 p-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-bold text-slate-700">
              คำแนะนำจาก AI สำหรับแคมเปญ:
            </span>
            <CampaignAiRecommendation
              key={`${data.campaign.id}:${fromAdGroup?.id ?? "none"}:${toAdGroup?.id ?? "none"}:${improvementPercent ?? "none"}`}
              fromAdGroupId={fromAdGroup?.id ?? null}
              periodDays={data.period.days}
              fromAdGroupName={fromAdGroup?.name ?? null}
              fromSpendLabel={
                fromAdGroup ? formatCurrency(fromAdGroup.totals.spend) : null
              }
              toAdGroupName={toAdGroup?.name ?? null}
              improvementPercent={improvementPercent}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default async function CampaignDetailPage({
  params,
  searchParams,
}: Params) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const breakdownPromise = getCampaignBreakdown({
    campaignId: resolvedParams.id,
    periodDays: resolvedSearchParams.periodDays ?? null,
  });

  return (
    <div className="min-h-screen">
      <Suspense
        fallback={
          <ContextNavbar
            backHref="/"
            backLabel="กลับสู่แดชบอร์ด"
            contextTop="บัญชี: กำลังโหลด…"
            contextMain="แคมเปญ: กำลังโหลด…"
            contextIconClass="fa-solid fa-layer-group text-blue-600"
          />
        }
      >
        <CampaignNavbar breakdownPromise={breakdownPromise} />
      </Suspense>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-end justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              เปรียบเทียบกลุ่มโฆษณา
            </h1>
            <p className="text-sm text-slate-500 font-thai">
              เปรียบเทียบประสิทธิภาพรายกลุ่มเป้าหมาย
            </p>
          </div>
          <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex items-center text-sm">
            <span className="px-3 py-1 text-slate-500 font-medium border-r border-slate-100">
              จัดเรียง:
            </span>
            <label htmlFor="campaign-sort" className="sr-only">
              จัดเรียงรายการ
            </label>
            <select
              id="campaign-sort"
              className="appearance-none bg-transparent py-1 pl-2 pr-6 focus:outline-none font-bold text-slate-700 cursor-pointer"
            >
              <option>CPA (มาก → น้อย)</option>
              <option>ROAS (น้อย → มาก)</option>
              <option>ยอดใช้จ่าย (มาก → น้อย)</option>
            </select>
            <i className="fa-solid fa-chevron-down text-xs text-slate-500 -ml-4 mr-2 pointer-events-none"></i>
          </div>
        </div>

        <Suspense fallback={<CampaignBreakdownSkeleton />}>
          <CampaignBreakdownCard breakdownPromise={breakdownPromise} />
        </Suspense>
      </main>
    </div>
  );
}
