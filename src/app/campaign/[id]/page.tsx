import { ContextNavbar } from "@/components/navbar/ContextNavbar";
import { getCampaignBreakdown } from "@/lib/data/review";
import { formatCurrency, formatNumber } from "@/lib/utils/metrics";

type Params = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ periodDays?: string }>;
};

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

export default async function CampaignDetailPage({
  params,
  searchParams,
}: Params) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const data = await getCampaignBreakdown({
    campaignId: resolvedParams.id,
    periodDays: resolvedSearchParams.periodDays ?? null,
  });
  if (!data.campaign) {
    return (
      <div className="min-h-screen">
        <ContextNavbar
          backHref="/"
          backLabel="Back to Dashboard"
          contextTop="Account: -"
          contextMain="Campaign: -"
          contextIconClass="fa-solid fa-layer-group text-blue-600"
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-500 text-sm">
            Campaign not found.
          </div>
        </main>
      </div>
    );
  }
  const campaignName = data.campaign?.name ?? "Campaign";
  const accountName = data.campaign?.account?.name ?? "Account";

  return (
    <div className="min-h-screen">
      <ContextNavbar
        backHref="/"
        backLabel="Back to Dashboard"
        contextTop={`Account: ${accountName}`}
        contextMain={`Campaign: ${campaignName}`}
        contextIconClass="fa-solid fa-layer-group text-blue-600"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-end justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Ad Group Comparison
            </h1>
            <p className="text-sm text-slate-500 font-thai">
              เปรียบเทียบประสิทธิภาพรายกลุ่มเป้าหมาย (5 Active Ad Sets)
            </p>
          </div>
          <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex items-center text-sm">
            <span className="px-3 py-1 text-slate-500 font-medium border-r border-slate-100">
              Sort by:
            </span>
            <select className="appearance-none bg-transparent py-1 pl-2 pr-6 focus:outline-none font-bold text-slate-700 cursor-pointer">
              <option>CPA (High to Low)</option>
              <option>ROAS (Low to High)</option>
              <option>Spend (High to Low)</option>
            </select>
            <i className="fa-solid fa-chevron-down text-xs text-slate-400 -ml-4 mr-2 pointer-events-none"></i>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-slate-500 text-xs uppercase tracking-wider text-right">
                  <th className="p-4 text-left w-1/4">Ad Group Name</th>
                  <th className="p-4 text-left w-1/4">
                    AI Diagnosis (Insight)
                  </th>
                  <th className="p-4">Spend</th>
                  <th className="p-4 text-center">Results</th>
                  <th className="p-4">CPR (Cost)</th>
                  <th className="p-4">ROAS</th>
                  <th className="p-4">CTR</th>
                  <th className="p-4 text-center">Action</th>
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
                          <div className="text-[10px] text-slate-400 pl-4">
                            Active
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          <div className={`rounded-lg p-2 ${styles.badge}`}>
                            <div
                              className={`flex items-center gap-1.5 text-xs font-bold mb-1 ${styles.text}`}
                            >
                              <i className={styles.icon}></i>
                              {group.diagnosis.label}
                            </div>
                            <p className="text-[10px] text-slate-600 font-thai leading-snug">
                              {group.diagnosis.reason}
                            </p>
                          </div>
                        </td>
                        <td className="p-4 text-right font-medium text-slate-600">
                          {formatCurrency(group.totals.spend)}
                        </td>
                        <td className="p-4 text-center font-medium text-slate-600">
                          {formatNumber(group.totals.results)}
                        </td>
                        <td className="p-4 text-right">
                          <span className="block font-bold text-slate-700">
                            {formatCurrency(
                              group.derived.costPerResult ?? null,
                            )}
                          </span>
                          <span className="text-[10px] text-slate-400 flex justify-end items-center gap-1">
                            <i className="fa-solid fa-arrow-trend-up"></i>
                            {costTrend > 0 ? "+" : ""}
                            {costTrend}%
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="block font-medium text-slate-700">
                            {group.derived.roas
                              ? `${group.derived.roas.toFixed(1)}x`
                              : "N/A"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="block font-medium text-slate-700">
                            {group.derived.ctr
                              ? `${(group.derived.ctr * 100).toFixed(2)}%`
                              : "N/A"}
                          </span>
                        </td>
                        <td className="p-4 text-center align-middle">
                          {group.diagnosis.label === "Fatigue Detected" ? (
                            <a
                              href={`/adgroup/${group.id}?periodDays=${data.period.days}`}
                              className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded text-xs font-bold transition-colors"
                            >
                              Fix
                            </a>
                          ) : (
                            <a
                              href={`/adgroup/${group.id}?periodDays=${data.period.days}`}
                              className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 w-8 h-8 rounded-full transition-all inline-flex items-center justify-center"
                            >
                              <i className="fa-solid fa-chevron-right"></i>
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-10 text-center text-slate-400 text-sm font-thai"
                    >
                      ยังไม่มีข้อมูล Ad Group สำหรับแคมเปญนี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 border-t border-slate-200 p-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-bold text-slate-700">
                AI Recommendation for Campaign:
              </span>
              <span className="text-slate-600 font-thai">
                ควรโยกงบจาก{" "}
                <span className="text-red-600 font-bold">
                  Retargeting_AddCart
                </span>{" "}
                (฿8,500) ไปใส่{" "}
                <span className="text-emerald-600 font-bold">LAL_1%</span> แทน
                เพราะ CPA ถูกกว่า 50%
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
