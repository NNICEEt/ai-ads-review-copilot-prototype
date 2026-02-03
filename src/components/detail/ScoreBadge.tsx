type ScoreBadgeProps = {
  score: number;
  max?: number;
  label: string;
  description: string;
  progressColorClass: string;
  badgeClass: string;
  badgeDotClass: string;
};

export const ScoreBadge = ({
  score,
  max = 100,
  label,
  description,
  progressColorClass,
  badgeClass,
  badgeDotClass,
}: ScoreBadgeProps) => {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / max) * circumference;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wide">
          คะแนนความสำคัญ
        </span>
      </div>

      <div className="relative w-32 h-32 mb-4 mt-2">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="#F1F5F9"
            strokeWidth="12"
            fill="none"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            className={progressColorClass}
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center flex-col">
          <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
            {score}
          </span>
          <span className="text-xs font-medium text-slate-400">/{max}</span>
        </div>
      </div>

      <div className={badgeClass}>
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${badgeDotClass} opacity-75`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${badgeDotClass}`}
          ></span>
        </span>
        {label}
      </div>
      <p className="text-xs text-slate-500 font-thai max-w-50 leading-relaxed">
        {description}
      </p>
    </div>
  );
};
