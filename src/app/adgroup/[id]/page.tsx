import { ContextNavbar } from "@/components/navbar/ContextNavbar";
import { ScoreBadge } from "@/components/detail/ScoreBadge";
import { EvidenceSlot } from "@/components/detail/EvidenceSlot";
import { AdsPerformancePanel } from "@/components/detail/AdsPerformancePanel";
import { AiCopilotPanel } from "@/components/detail/AiCopilotPanel";
import { DailyTrendChart } from "@/components/detail/DailyTrendChart";
import { getAdGroupDetail } from "@/lib/data/review";
import { formatCurrency } from "@/lib/utils/metrics";

type Params = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ periodDays?: string }>;
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
  if (value == null) return "ไม่มีข้อมูล";
  if (metricLabel === "ROAS") return `${value.toFixed(1)}x`;
  if (metricLabel.includes("Rate") || metricLabel.includes("CTR")) {
    return `${(value * 100).toFixed(2)}%`;
  }
  if (metricLabel === "Cost per Result") return formatCurrency(value);
  return value.toFixed(2);
};

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
            ไม่พบกลุ่มโฆษณา
          </div>
        </main>
      </div>
    );
  }

  const periodLabel = `ย้อนหลัง ${detail.period.days} วัน`;
  const compareLabel = `เทียบกับ ${detail.period.days} วันก่อนหน้า`;
  const costPercent = detail.costDelta.percent
    ? Math.round(detail.costDelta.percent * 100)
    : 0;
  const costPercentLabel = `${costPercent > 0 ? "+" : ""}${costPercent}%`;
  const costDescription = costPercent >= 0 ? "ต้นทุนสูงขึ้น" : "ต้นทุนลดลง";

  return (
    <div className="min-h-screen">
      <ContextNavbar
        backHref={`/campaign/${detail.campaign.id}?periodDays=${detail.period.days}`}
        backLabel="กลับ"
        contextTop={`แคมเปญ: ${detail.campaign.name}`}
        contextMain={`กลุ่มโฆษณา: ${detail.adGroup.name}`}
        contextIconClass="fa-regular fa-folder-open text-slate-500"
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
                สรุปจาก Evidence
              </h3>
              <span className="text-[10px] text-slate-500 font-medium">
                สรุปอัตโนมัติจากตัวเลข
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
                    prevText={`ก่อนหน้า: ${prevValue}`}
                    changePill={{
                      text:
                        slot.id === "E3" && slot.metricLabel === "Frequency"
                          ? "สูง"
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

        <AiCopilotPanel
          adGroupId={resolvedParams.id}
          periodDays={detail.period.days}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <i className="fa-solid fa-chart-area text-slate-500"></i>
                แนวโน้มรายวัน
              </h3>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  ต้นทุน/ผลลัพธ์
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  ยอดใช้จ่าย
                </span>
              </div>
            </div>
            <div className="relative h-64 w-full bg-slate-50 rounded-lg border border-slate-100 p-2">
              <DailyTrendChart rows={detail.daily} />
            </div>
          </div>

          <AdsPerformancePanel
            periodDays={detail.period.days}
            adGroupBaseline={{
              name: detail.adGroup.name,
              derived: detail.derived,
            }}
            ads={detail.ads}
          />
        </div>
      </main>
    </div>
  );
}
