import { DashboardNavbar } from "@/components/navbar/DashboardNavbar";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { PriorityList } from "@/components/dashboard/PriorityList";
import { getAccounts, getDashboardData } from "@/lib/data/review";
import { formatCurrency, formatNumber } from "@/lib/utils/metrics";
import { SCORING_CONFIG } from "@/lib/config/scoring";

type SearchParams = {
  accountId?: string;
  periodDays?: string;
};

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
    return "fa-solid fa-money-bill-wave text-slate-400";
  }
  if (label === "Top Performer") {
    return "fa-solid fa-check text-emerald-500";
  }
  return "fa-solid fa-minus text-slate-400";
};

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams | Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const [accounts, dashboard] = await Promise.all([
    getAccounts(),
    getDashboardData({
      accountId: resolvedParams.accountId ?? null,
      periodDays: resolvedParams.periodDays ?? null,
    }),
  ]);

  if (!dashboard) {
    return (
      <div className="min-h-screen">
        <DashboardNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-500 text-sm">
            No account data available.
          </div>
        </main>
      </div>
    );
  }

  const periodDays = dashboard.period.days;
  const spendTrend = trendInfo(dashboard.summary.spend.percent ?? null);
  const cprTrend = trendInfo(dashboard.summary.costPerResult.percent ?? null);
  const roasTrend = trendInfo(dashboard.summary.roas.percent ?? null);
  const resultTrend = trendInfo(dashboard.summary.results.percent ?? null);

  const summaryCards = [
    {
      label: "Amount Spent",
      value: formatCurrency(dashboard.summary.spend.current ?? null),
      iconClass: "fa-solid fa-wallet",
      iconWrapperClass: "bg-blue-50 text-blue-600",
      trendPillClass: spendTrend.className,
      trendIconClass: spendTrend.iconClass,
      trendValue: spendTrend.label,
      comparisonText: `vs ${formatCurrency(dashboard.summary.spend.previous ?? null)}`,
    },
    {
      label: "CPR (Cost/Res)",
      value: formatCurrency(dashboard.summary.costPerResult.current ?? null),
      iconClass: "fa-solid fa-chart-line",
      iconWrapperClass: "bg-red-50 text-red-600",
      trendPillClass: cprTrend.className,
      trendIconClass: cprTrend.iconClass,
      trendValue: cprTrend.label,
      comparisonText: `vs ${formatCurrency(dashboard.summary.costPerResult.previous ?? null)}`,
      accentBarClass: "bg-red-500",
      labelIconClass: "fa-solid fa-circle-info text-slate-300 text-[10px]",
    },
    {
      label: "ROAS (Return)",
      value: dashboard.summary.roas.current
        ? `${dashboard.summary.roas.current.toFixed(1)}x`
        : "N/A",
      iconClass: "fa-solid fa-sack-dollar",
      iconWrapperClass: "bg-emerald-50 text-emerald-600",
      trendPillClass: roasTrend.className,
      trendIconClass: roasTrend.iconClass,
      trendValue: roasTrend.label,
      comparisonText: `vs ${dashboard.summary.roas.previous?.toFixed(1) ?? "N/A"}x`,
    },
    {
      label: "Total Results",
      value: formatNumber(dashboard.summary.results.current ?? null),
      iconClass: "fa-solid fa-bullseye",
      iconWrapperClass: "bg-indigo-50 text-indigo-600",
      trendPillClass: resultTrend.className,
      trendIconClass: resultTrend.iconClass,
      trendValue: resultTrend.label,
      comparisonText:
        dashboard.summary.results.percent === 0 ? "Stable" : "vs previous",
    },
  ];

  const priorityItems = dashboard.priority.map((item) => {
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
      item.label === "Needs attention"
        ? "critical"
        : item.diagnosis.label === "Cost Creeping"
          ? "warning"
          : item.diagnosis.label === "Top Performer"
            ? "top"
            : "normal";

    return {
      variant,
      score: String(item.score),
      name: item.adGroupName,
      campaign: item.campaignName,
      campaignHref: `/campaign/${item.campaignId}?periodDays=${periodDays}`,
      issue: {
        label: item.diagnosis.label,
        iconClass: issueIcon(item.diagnosis.label),
      },
      cost: formatCurrency(item.derived.costPerResult ?? null),
      costSubLabel: `Target: ${formatCurrency(SCORING_CONFIG.thresholds.costPerResultTarget)}`,
      trend: {
        value: `${trendPercent > 0 ? "+" : ""}${trendPercent}%`,
        iconClass: trendIcon,
        className: trendClass,
      },
      statusLabel:
        variant === "critical"
          ? "Needs Attention"
          : variant === "warning"
            ? "Warning"
            : variant === "top"
              ? "Top Performer"
              : "Normal",
      href: `/adgroup/${item.adGroupId}?periodDays=${periodDays}`,
    };
  });

  return (
    <div className="min-h-screen">
      <DashboardNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Overview Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-thai">
              สรุปภาพรวมและจัดลำดับสิ่งที่ต้องปรับปรุง (Action-First)
            </p>
          </div>

          <div className="flex flex-wrap gap-3 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fa-solid fa-briefcase text-slate-400 text-xs"></i>
              </div>
              <select
                className="appearance-none bg-slate-50 border border-slate-200 hover:border-blue-400 text-slate-700 py-2 pl-9 pr-8 rounded leading-tight focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm font-medium w-48 transition-all cursor-pointer"
                defaultValue={dashboard.accountId}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <i className="fa-solid fa-chevron-down text-[10px]"></i>
              </div>
            </div>

            <div className="w-px bg-slate-200 my-1 hidden sm:block"></div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded">
              {[3, 7, 14].map((days) => (
                <a
                  key={days}
                  href={`/?accountId=${dashboard.accountId}&periodDays=${days}`}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                    days === periodDays
                      ? "text-blue-700 bg-white shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-800 hover:bg-white"
                  }`}
                >
                  {days} Days
                </a>
              ))}
            </div>

            <div className="flex items-center px-2 text-xs text-slate-400 font-medium">
              vs Previous Period
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {summaryCards.map((card) => (
            <SummaryCard key={card.label} {...card} />
          ))}
        </div>

        <PriorityList items={priorityItems} />
      </main>
    </div>
  );
}
