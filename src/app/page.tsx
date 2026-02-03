import { Suspense } from "react";
import { DashboardNavbar } from "@/components/navbar/DashboardNavbar";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { PriorityList } from "@/components/dashboard/PriorityList";
import { DashboardFiltersClient } from "@/components/dashboard/DashboardFiltersClient";
import { getAccounts, getDashboardData } from "@/lib/data/review";
import { formatCurrency, formatNumber } from "@/lib/utils/metrics";
import { SCORING_CONFIG } from "@/lib/config/scoring";

export const dynamic = "force-dynamic";

type SearchParams = {
  accountId?: string;
  periodDays?: string;
  q?: string;
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const SkeletonBlock = ({ className }: { className: string }) => (
  <div className={`bg-slate-200/70 rounded ${className}`} />
);

const trendInfo = (ratio: number | null) => {
  if (ratio == null) {
    return {
      iconClass: "fa-solid fa-minus",
      className: "text-slate-500 font-bold bg-slate-100",
      label: "0%",
    };
  }
  const value = Math.round(ratio * 100);
  if (value > 0) {
    return {
      iconClass: "fa-solid fa-arrow-up",
      className: "text-red-600 font-bold bg-red-50",
      label: `${value}%`,
    };
  }
  if (value < 0) {
    return {
      iconClass: "fa-solid fa-arrow-down",
      className: "text-emerald-600 font-bold bg-emerald-50",
      label: `${Math.abs(value)}%`,
    };
  }
  return {
    iconClass: "fa-solid fa-minus",
    className: "text-slate-500 font-bold bg-slate-100",
    label: "0%",
  };
};

const issueIcon = (label: string) => {
  if (label === "Fatigue Detected") {
    return "fa-solid fa-triangle-exclamation text-amber-500";
  }
  if (label === "Cost Creeping") {
    return "fa-solid fa-money-bill-wave text-slate-500";
  }
  if (label === "Top Performer") {
    return "fa-solid fa-check text-emerald-500";
  }
  return "fa-solid fa-minus text-slate-500";
};

const diagnosisLabelTh = (label: string) => {
  if (label === "Fatigue Detected") return "Creative Fatigue";
  if (label === "Cost Creeping") return "ต้นทุนเริ่มไหลขึ้น";
  if (label === "Learning Limited") return "Learning จำกัด";
  if (label === "Top Performer") return "ผลงานโดดเด่น";
  if (label === "Stable") return "ปกติ";
  return label;
};

const DashboardFiltersSkeleton = () => (
  <div className="flex flex-wrap gap-3 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 animate-pulse">
    <div className="w-48">
      <SkeletonBlock className="h-9 w-full" />
    </div>
    <div className="w-px bg-slate-200 my-1 hidden sm:block"></div>
    <div className="flex-1 min-w-[200px]">
      <SkeletonBlock className="h-9 w-full" />
    </div>
    <div className="hidden sm:flex items-center px-2">
      <SkeletonBlock className="h-3 w-28" />
    </div>
  </div>
);

const DashboardSummarySkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    {Array.from({ length: 4 }, (_, index) => (
      <div
        key={`summary-skeleton-${index}`}
        className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-pulse"
      >
        <div className="flex items-center justify-between">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-10 w-10 rounded-lg" />
        </div>
        <div className="mt-4">
          <SkeletonBlock className="h-7 w-28" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-5 w-12 rounded" />
        </div>
      </div>
    ))}
  </div>
);

const DashboardPrioritySkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-150">
    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <i className="fa-solid fa-list-check text-blue-600"></i>
          รายการสิ่งที่ต้องทำก่อน
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-thai">
          จัดลำดับด้วยคะแนนจากตัวเลขและแนวโน้ม • AI ช่วยสรุป Insight ต่อรายการ
        </p>
      </div>
      <div className="flex gap-2 animate-pulse">
        <SkeletonBlock className="h-8 w-20 rounded" />
        <SkeletonBlock className="h-8 w-20 rounded" />
      </div>
    </div>

    <div className="overflow-y-auto custom-scrollbar flex-1">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
          <tr className="text-slate-500 text-xs uppercase tracking-wider">
            <th className="p-4 font-semibold w-20 text-center">คะแนน</th>
            <th className="p-4 font-semibold w-1/3">กลุ่มโฆษณา / แคมเปญ</th>
            <th className="p-4 font-semibold w-1/4">สถานะ / ประเด็น</th>
            <th className="p-4 font-semibold text-right">ต้นทุน/ผลลัพธ์</th>
            <th className="p-4 font-semibold text-right">แนวโน้ม</th>
            <th className="p-4 font-semibold text-center w-20">ดูรายละเอียด</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {Array.from({ length: 6 }, (_, index) => (
            <tr key={`priority-skeleton-${index}`} className="animate-pulse">
              <td className="p-4 text-center">
                <SkeletonBlock className="w-9 h-9 rounded-full mx-auto" />
              </td>
              <td className="p-4">
                <SkeletonBlock className="h-3 w-48" />
                <div className="mt-2">
                  <SkeletonBlock className="h-2.5 w-40" />
                </div>
              </td>
              <td className="p-4">
                <SkeletonBlock className="h-5 w-24 rounded-full" />
                <div className="mt-2">
                  <SkeletonBlock className="h-2.5 w-28" />
                </div>
              </td>
              <td className="p-4 text-right">
                <SkeletonBlock className="h-3 w-20 ml-auto" />
                <div className="mt-2">
                  <SkeletonBlock className="h-2.5 w-28 ml-auto" />
                </div>
              </td>
              <td className="p-4 text-right">
                <SkeletonBlock className="h-6 w-16 rounded ml-auto" />
              </td>
              <td className="p-4 text-center">
                <SkeletonBlock className="h-8 w-8 rounded-full mx-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="bg-slate-50 p-4 border-t border-slate-200 text-center text-xs text-slate-500">
      แสดง 5 รายการสำคัญที่สุด
      <span className="text-blue-600 font-bold ml-1 opacity-50">
        ดูเพิ่มเติม
      </span>
    </div>
  </div>
);

const DashboardFilters = async ({
  accountsPromise,
  dashboardPromise,
  query,
}: {
  accountsPromise: ReturnType<typeof getAccounts>;
  dashboardPromise: ReturnType<typeof getDashboardData>;
  query: string;
}) => {
  const delayPromise = sleep(150);
  const [accounts, dashboard] = await Promise.all([
    accountsPromise,
    dashboardPromise,
  ]);
  await delayPromise;

  if (!dashboard) return null;
  const periodDays = dashboard.period.days;

  return (
    <DashboardFiltersClient
      accounts={accounts}
      accountId={dashboard.accountId}
      periodDays={periodDays}
      query={query}
    />
  );
};

const DashboardSummarySection = async ({
  dashboardPromise,
}: {
  dashboardPromise: ReturnType<typeof getDashboardData>;
}) => {
  const delayPromise = sleep(350);
  const dashboard = await dashboardPromise;
  await delayPromise;

  if (!dashboard) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-500 text-sm">
        ไม่พบข้อมูลบัญชี
      </div>
    );
  }

  const spendTrend = trendInfo(dashboard.summary.spend.percent ?? null);
  const cprTrend = trendInfo(dashboard.summary.costPerResult.percent ?? null);
  const roasTrend = trendInfo(dashboard.summary.roas.percent ?? null);
  const resultTrend = trendInfo(dashboard.summary.results.percent ?? null);

  const summaryCards = [
    {
      label: "ยอดใช้จ่าย",
      value: formatCurrency(dashboard.summary.spend.current ?? null),
      iconClass: "fa-solid fa-wallet",
      iconWrapperClass: "bg-blue-50 text-blue-600",
      trendPillClass: spendTrend.className,
      trendIconClass: spendTrend.iconClass,
      trendValue: spendTrend.label,
      comparisonText: `เทียบกับ ${formatCurrency(dashboard.summary.spend.previous ?? null)}`,
    },
    {
      label: "CPR (ต้นทุน/ผลลัพธ์)",
      value: formatCurrency(dashboard.summary.costPerResult.current ?? null),
      iconClass: "fa-solid fa-chart-line",
      iconWrapperClass: "bg-red-50 text-red-600",
      trendPillClass: cprTrend.className,
      trendIconClass: cprTrend.iconClass,
      trendValue: cprTrend.label,
      comparisonText: `เทียบกับ ${formatCurrency(dashboard.summary.costPerResult.previous ?? null)}`,
      accentBarClass: "bg-red-500",
      labelIconClass: "fa-solid fa-circle-info text-slate-500 text-[10px]",
    },
    {
      label: "ROAS (ผลตอบแทน)",
      value:
        dashboard.summary.roas.current != null
          ? `${dashboard.summary.roas.current.toFixed(1)}x`
          : "ไม่มีข้อมูล",
      iconClass: "fa-solid fa-sack-dollar",
      iconWrapperClass: "bg-emerald-50 text-emerald-600",
      trendPillClass: roasTrend.className,
      trendIconClass: roasTrend.iconClass,
      trendValue: roasTrend.label,
      comparisonText:
        dashboard.summary.roas.previous != null
          ? `เทียบกับ ${dashboard.summary.roas.previous.toFixed(1)}x`
          : "เทียบกับ ไม่มีข้อมูล",
    },
    {
      label: "ผลลัพธ์รวม",
      value: formatNumber(dashboard.summary.results.current ?? null),
      iconClass: "fa-solid fa-bullseye",
      iconWrapperClass: "bg-indigo-50 text-indigo-600",
      trendPillClass: resultTrend.className,
      trendIconClass: resultTrend.iconClass,
      trendValue: resultTrend.label,
      comparisonText:
        dashboard.summary.results.percent === 0 ? "คงที่" : "เทียบช่วงก่อนหน้า",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {summaryCards.map((card) => (
        <SummaryCard key={card.label} {...card} />
      ))}
    </div>
  );
};

const DashboardPrioritySection = async ({
  dashboardPromise,
  query,
}: {
  dashboardPromise: ReturnType<typeof getDashboardData>;
  query: string;
}) => {
  const delayPromise = sleep(650);
  const dashboard = await dashboardPromise;
  await delayPromise;

  if (!dashboard) return null;
  const periodDays = dashboard.period.days;

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? dashboard.priority.filter((item) => {
        const haystack =
          `${item.adGroupName} ${item.campaignName}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
    : dashboard.priority;

  const priorityItems = filtered.slice(0, 5).map((item) => {
    const trendPercent = item.deltas.costPerResult.percent
      ? Math.round(item.deltas.costPerResult.percent * 100)
      : 0;
    const trendClass =
      trendPercent > 0
        ? "bg-red-50 text-red-600 border border-red-100"
        : trendPercent < 0
          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
          : "text-slate-500 bg-slate-100 border border-slate-200";
    const trendIcon =
      trendPercent > 0
        ? "fa-solid fa-arrow-trend-up"
        : trendPercent < 0
          ? "fa-solid fa-arrow-trend-down"
          : "fa-solid fa-minus";

    const variant: "critical" | "warning" | "top" | "normal" =
      item.label === SCORING_CONFIG.labels.needsAttention
        ? "critical"
        : item.diagnosis.label === "Cost Creeping"
          ? "warning"
          : item.diagnosis.label === "Top Performer"
            ? "top"
            : "normal";

    const chipNeutral = "bg-white/80 text-slate-600 border-slate-200";
    const chipWarn = "bg-amber-50 text-amber-800 border-amber-200";
    const chipDanger = "bg-red-50 text-red-700 border-red-200";
    const chipSuccess = "bg-emerald-50 text-emerald-700 border-emerald-200";

    const ctrLabel =
      item.derived.ctr != null
        ? `${(item.derived.ctr * 100).toFixed(2)}%`
        : "—";
    const ctrDeltaLabel =
      item.deltas.ctr.percent != null
        ? `${item.deltas.ctr.percent > 0 ? "+" : ""}${Math.round(item.deltas.ctr.percent * 100)}%`
        : null;
    const ctrDeltaClass =
      ctrDeltaLabel == null
        ? chipNeutral
        : item.deltas.ctr.percent && item.deltas.ctr.percent > 0
          ? chipSuccess
          : item.deltas.ctr.percent && item.deltas.ctr.percent < 0
            ? chipDanger
            : chipNeutral;

    const freq = item.derived.frequency;
    const freqLabel = freq != null ? freq.toFixed(1) : "—";
    const freqClass =
      freq != null && freq >= SCORING_CONFIG.thresholds.frequencyHigh
        ? chipDanger
        : freq != null && freq >= SCORING_CONFIG.thresholds.frequencyWarning
          ? chipWarn
          : chipNeutral;

    const resultsClass =
      item.totals.spend > 0 && item.totals.results < 50
        ? chipWarn
        : chipNeutral;

    const roasLabel =
      item.derived.roas != null ? `${item.derived.roas.toFixed(1)}x` : null;
    const roasClass =
      item.derived.roas != null &&
      item.derived.roas >= SCORING_CONFIG.thresholds.roasTarget
        ? chipSuccess
        : chipWarn;

    return {
      variant,
      score: String(item.score),
      name: item.adGroupName,
      campaign: item.campaignName,
      campaignHref: `/campaign/${item.campaignId}?periodDays=${periodDays}`,
      ai: {
        adGroupId: item.adGroupId,
        periodDays,
      },
      issue: {
        label: diagnosisLabelTh(item.diagnosis.label),
        iconClass: issueIcon(item.diagnosis.label),
        detail: item.diagnosis.reason,
      },
      signals: [
        {
          label: "CTR",
          value: ctrDeltaLabel ? `${ctrLabel} (${ctrDeltaLabel})` : ctrLabel,
          iconClass: "fa-solid fa-arrow-pointer",
          className: ctrDeltaClass,
          helpText:
            "CTR (Click-through rate)\n= Clicks ÷ Impressions\nยิ่งสูงยิ่งดี (คนสนใจ/กดคลิกมากขึ้น)\nตัวเลขในวงเล็บคือ % เทียบช่วงก่อนหน้า",
        },
        {
          label: "Freq",
          value: freqLabel,
          iconClass: "fa-solid fa-repeat",
          className: freqClass,
          helpText:
            "Frequency (ความถี่)\n= Impressions ÷ Reach\nเฉลี่ย 1 คนเห็นโฆษณากี่ครั้ง\nสูงเกินไปอาจเสี่ยง Creative Fatigue",
        },
        {
          label: "ผลลัพธ์",
          value: formatNumber(item.totals.results),
          iconClass: "fa-solid fa-bullseye",
          className: resultsClass,
          helpText:
            "ผลลัพธ์ (Results)\nคือจำนวนเหตุการณ์หลักตาม Objective เช่น Purchase/Lead/Message\nใช้ดูว่าได้ผลลัพธ์ “มากพอ” หรือยังในช่วงเวลานี้",
        },
        ...(roasLabel
          ? [
              {
                label: "ROAS",
                value: roasLabel,
                iconClass: "fa-solid fa-sack-dollar",
                className: roasClass,
                helpText:
                  "ROAS (Return on Ad Spend)\n= Revenue ÷ Spend\nเช่น 3.0x แปลว่าใช้ 1 บาท ได้รายได้ 3 บาท\nยิ่งสูงยิ่งดี",
              },
            ]
          : []),
      ],
      cost: formatCurrency(item.derived.costPerResult ?? null),
      costSubLabel: `เป้าหมาย: ${formatCurrency(SCORING_CONFIG.thresholds.costPerResultTarget)}`,
      trend: {
        value: `${trendPercent > 0 ? "+" : ""}${trendPercent}%`,
        iconClass: trendIcon,
        className: trendClass,
      },
      statusLabel:
        variant === "critical"
          ? "ต้องแก้ไข"
          : variant === "warning"
            ? "เฝ้าระวัง"
            : variant === "top"
              ? "ผลงานดี"
              : "ปกติ",
      href: `/adgroup/${item.adGroupId}?periodDays=${periodDays}`,
    };
  });

  return <PriorityList items={priorityItems} />;
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const accountsPromise = getAccounts();
  const dashboardPromise = getDashboardData({
    accountId: resolvedParams.accountId ?? null,
    periodDays: resolvedParams.periodDays ?? null,
  });
  const query = resolvedParams.q ?? "";

  return (
    <div className="min-h-screen">
      <DashboardNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              ภาพรวมแดชบอร์ด
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-thai">
              สรุปภาพรวมและจัดลำดับสิ่งที่ต้องปรับปรุง (เน้นลงมือทำ)
            </p>
          </div>
          <Suspense fallback={<DashboardFiltersSkeleton />}>
            <DashboardFilters
              accountsPromise={accountsPromise}
              dashboardPromise={dashboardPromise}
              query={query}
            />
          </Suspense>
        </div>

        <Suspense fallback={<DashboardSummarySkeleton />}>
          <DashboardSummarySection dashboardPromise={dashboardPromise} />
        </Suspense>

        <Suspense fallback={<DashboardPrioritySkeleton />}>
          <DashboardPrioritySection
            dashboardPromise={dashboardPromise}
            query={query}
          />
        </Suspense>
      </main>
    </div>
  );
}
