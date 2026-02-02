type SummaryCardProps = {
  label: string;
  value: string;
  iconClass: string;
  iconWrapperClass: string;
  trendPillClass: string;
  trendIconClass: string;
  trendValue: string;
  comparisonText: string;
  accentBarClass?: string;
  labelIconClass?: string;
};

export const SummaryCard = ({
  label,
  value,
  iconClass,
  iconWrapperClass,
  trendPillClass,
  trendIconClass,
  trendValue,
  comparisonText,
  accentBarClass,
  labelIconClass,
}: SummaryCardProps) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
    {accentBarClass ? (
      <div
        className={`absolute top-0 right-0 w-1 h-full ${accentBarClass}`}
      ></div>
    ) : null}
    <div className="flex justify-between items-start mb-3">
      <div className="flex flex-col">
        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
          {label}
          {labelIconClass ? <i className={labelIconClass}></i> : null}
        </span>
        <span className="text-2xl font-bold text-slate-900 mt-1">{value}</span>
      </div>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${iconWrapperClass}`}
      >
        <i className={iconClass}></i>
      </div>
    </div>
    <div className="flex items-center text-xs border-t border-slate-50 pt-3">
      <span
        className={`${trendPillClass} px-1.5 py-0.5 rounded flex items-center gap-1 mr-2`}
      >
        <i className={trendIconClass}></i> {trendValue}
      </span>
      <span className="text-slate-400">{comparisonText}</span>
    </div>
  </div>
);
