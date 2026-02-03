import Link from "next/link";

type PriorityVariant = "critical" | "warning" | "top" | "normal";

type PriorityRowProps = {
  variant: PriorityVariant;
  score: string;
  name: string;
  campaign: string;
  campaignHref?: string;
  issue?: {
    label: string;
    iconClass: string;
  };
  cost: string;
  costSubLabel: string;
  trend: {
    value: string;
    iconClass?: string;
    className: string;
  };
  statusLabel?: string;
  href?: string;
};

const variantStyles: Record<
  PriorityVariant,
  {
    row: string;
    score: string;
    badge: string;
  }
> = {
  critical: {
    row: "hover:bg-red-50/30 transition-colors group cursor-pointer border-l-4 border-l-red-500 bg-red-50/10",
    score:
      "w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold mx-auto border-2 border-white shadow-sm ring-1 ring-red-200",
    badge:
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide",
  },
  warning: {
    row: "hover:bg-amber-50/30 transition-colors group cursor-pointer border-l-4 border-l-amber-400 bg-amber-50/10",
    score:
      "w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold mx-auto border-2 border-white shadow-sm ring-1 ring-amber-200",
    badge:
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wide",
  },
  top: {
    row: "hover:bg-emerald-50/30 transition-colors group cursor-pointer border-l-4 border-l-emerald-500",
    score:
      "w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold mx-auto border-2 border-white shadow-sm ring-1 ring-emerald-200",
    badge:
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wide",
  },
  normal: {
    row: "hover:bg-slate-50 transition-colors group cursor-pointer border-l-4 border-l-transparent",
    score:
      "w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold mx-auto border-2 border-white shadow-sm",
    badge:
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide",
  },
};

const statusLabelByVariant: Record<PriorityVariant, string> = {
  critical: "ต้องแก้ไข",
  warning: "เฝ้าระวัง",
  top: "ผลงานดี",
  normal: "ปกติ",
};

export const PriorityRow = ({
  variant,
  score,
  name,
  campaign,
  campaignHref,
  issue,
  cost,
  costSubLabel,
  trend,
  statusLabel,
  href,
}: PriorityRowProps) => {
  const styles = variantStyles[variant];
  return (
    <tr className={styles.row}>
      <td className="p-4 text-center">
        <div className={styles.score}>{score}</div>
      </td>
      <td className="p-4">
        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
          {name}
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          <i className="fa-solid fa-folder-open mr-1"></i>แคมเปญ:{" "}
          {campaignHref ? (
            <Link
              href={campaignHref}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {campaign}
            </Link>
          ) : (
            campaign
          )}
        </div>
      </td>
      <td className="p-4">
        <span className={styles.badge}>
          {statusLabel ?? statusLabelByVariant[variant]}
        </span>
        {issue ? (
          <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1 font-thai">
            <i className={issue.iconClass}></i>
            {issue.label}
          </div>
        ) : null}
      </td>
      <td className="p-4 text-right">
        <div className="font-bold text-slate-800">{cost}</div>
        <div className="text-[10px] text-slate-400">{costSubLabel}</div>
      </td>
      <td className="p-4 text-right">
        <div
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${trend.className}`}
        >
          {trend.iconClass ? (
            <i className={`${trend.iconClass} mr-1`}></i>
          ) : null}
          {trend.value}
        </div>
      </td>
      <td className="p-4 text-center">
        {href ? (
          <Link
            href={href}
            className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 w-8 h-8 rounded-full transition-all flex items-center justify-center mx-auto"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </Link>
        ) : (
          <button className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 w-8 h-8 rounded-full transition-all flex items-center justify-center mx-auto">
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        )}
      </td>
    </tr>
  );
};
