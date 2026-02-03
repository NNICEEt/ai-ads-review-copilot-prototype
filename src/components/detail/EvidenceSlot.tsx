type EvidenceSlotProps = {
  title: string;
  value: string;
  metricLabel: string;
  iconClass: string;
  containerClass: string;
  iconClassName: string;
  prevText: string;
  changePill: {
    text: string;
    className: string;
    iconClass?: string;
  };
};

const metricLabelTh = (label: string) => {
  if (label === "Cost per Result") return "ต้นทุนต่อผลลัพธ์";
  if (label === "Conversion Rate") return "อัตรา Conversion";
  if (label === "Frequency") return "ความถี่";
  if (label === "CTR Trend") return "แนวโน้ม CTR";
  return label;
};

export const EvidenceSlot = ({
  title,
  value,
  metricLabel,
  iconClass,
  containerClass,
  iconClassName,
  prevText,
  changePill,
}: EvidenceSlotProps) => (
  <div
    className={`p-4 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between group ${containerClass}`}
  >
    <div>
      <div className="flex justify-between items-start mb-1">
        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          {title}
        </div>
        <i className={`${iconClass} ${iconClassName}`}></i>
      </div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
      <div className="text-xs text-slate-500">{metricLabelTh(metricLabel)}</div>
    </div>
    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
      <span className="text-[10px] text-slate-500">{prevText}</span>
      <span
        className={`text-xs font-bold px-1.5 py-0.5 rounded flex items-center ${changePill.className}`}
      >
        {changePill.iconClass ? (
          <i className={`${changePill.iconClass} text-[10px] mr-1`}></i>
        ) : null}
        {changePill.text}
      </span>
    </div>
  </div>
);
