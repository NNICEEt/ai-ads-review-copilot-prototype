type AdsPerformanceItemProps = {
  typeLabel: string;
  name: string;
  cpr: string;
  ctr: string;
  spend: string;
  variant: "bad" | "good" | "average";
  recommendation?: string;
};

const variantStyles = {
  bad: "border-l-2 border-l-red-500 bg-red-50/5 hover:bg-red-50/30",
  good: "border-l-2 border-l-emerald-500 bg-emerald-50/5 hover:bg-emerald-50/30",
  average: "border-l-2 border-l-slate-200 hover:bg-slate-50",
};

const cprStyles = {
  bad: "bg-red-100 text-red-600",
  good: "bg-emerald-100 text-emerald-600",
  average: "bg-slate-100 text-slate-600",
};

const ctrStyles = {
  bad: "text-red-500 font-bold",
  good: "text-emerald-600 font-bold",
  average: "text-slate-500",
};

export const AdsPerformanceItem = ({
  typeLabel,
  name,
  cpr,
  ctr,
  spend,
  variant,
  recommendation,
}: AdsPerformanceItemProps) => (
  <div
    className={`p-3 transition-colors cursor-pointer group ${variantStyles[variant]}`}
  >
    <div className="flex justify-between items-start mb-1">
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="w-6 h-6 bg-slate-200 rounded text-[8px] flex items-center justify-center text-slate-500 font-bold shrink-0">
          {typeLabel}
        </div>
        <span
          className={`text-xs ${variant === "average" ? "font-medium text-slate-700" : "font-bold text-slate-900"} truncate`}
        >
          {name}
        </span>
      </div>
      <span
        className={`text-[10px] px-1.5 rounded font-bold whitespace-nowrap ${cprStyles[variant]}`}
      >
        {cpr}
      </span>
    </div>
    <div className="flex justify-between text-[10px] text-slate-500 pl-8">
      <span className="flex items-center gap-1">
        <i className="fa-solid fa-arrow-pointer text-slate-300"></i>
        CTR: <span className={ctrStyles[variant]}>{ctr}</span>
      </span>
      <span>ใช้ไป: {spend}</span>
    </div>
    {recommendation ? (
      <div className="pl-8 mt-1 text-[9px] text-red-400 hidden group-hover:block transition-all">
        <i className="fa-solid fa-circle-xmark mr-1"></i>
        คำแนะนำ: {recommendation}
      </div>
    ) : null}
  </div>
);
