import type { DerivedMetrics, Totals } from "@/lib/types/canonical";
import { formatCurrency } from "@/lib/utils/metrics";

type DailyTrendRow = {
  date: string; // YYYY-MM-DD
  totals: Totals;
  derived: DerivedMetrics;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const THAI_MONTH_ABBR = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
] as const;

const formatDayLabel = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-");
  void year;
  const dayNumber = Number(day);
  const monthNumber = Number(month);
  if (!Number.isFinite(dayNumber) || !Number.isFinite(monthNumber)) {
    return isoDate;
  }
  const monthLabel = THAI_MONTH_ABBR[monthNumber - 1];
  return `${dayNumber} ${monthLabel ?? month}`;
};

const buildLinePath = (points: Array<{ x: number; y: number }>) => {
  if (points.length === 0) return "";
  return points
    .map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`,
    )
    .join(" ");
};

export const DailyTrendChart = ({ rows }: { rows: DailyTrendRow[] }) => {
  if (!rows.length) {
    return (
      <div className="h-full w-full flex items-center justify-center text-xs text-slate-400 font-thai">
        ยังไม่มีข้อมูลแนวโน้มรายวัน
      </div>
    );
  }

  const width = 640;
  const height = 240;
  const paddingX = 26;
  const paddingTop = 18;
  const paddingBottom = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingTop - paddingBottom;
  const baselineY = paddingTop + chartHeight;
  const xStep = rows.length > 1 ? chartWidth / (rows.length - 1) : 0;

  const spendValues = rows.map((row) => row.totals.spend);
  const cprValues = rows.map((row) => row.derived.costPerResult ?? 0);

  const minSpend = Math.min(...spendValues);
  const maxSpend = Math.max(...spendValues);
  const spendRangeRaw = Math.max(1, maxSpend - minSpend);
  const spendRange = spendRangeRaw * 1.1;
  const spendMinScaled = Math.max(0, minSpend - spendRangeRaw * 0.05);

  const minCpr = Math.min(...cprValues);
  const maxCpr = Math.max(...cprValues);
  const cprRangeRaw = Math.max(1, maxCpr - minCpr);
  const cprRange = cprRangeRaw * 1.1;
  const cprMinScaled = Math.max(0, minCpr - cprRangeRaw * 0.05);

  const spendPoints = rows.map((row, index) => {
    const x = paddingX + index * xStep;
    const ratio = (row.totals.spend - spendMinScaled) / spendRange;
    const y = paddingTop + (1 - clamp(ratio, 0, 1)) * chartHeight;
    return { x, y, date: row.date };
  });

  const cprPoints = rows.map((row, index) => {
    const x = paddingX + index * xStep;
    const value = row.derived.costPerResult ?? 0;
    const ratio = (value - cprMinScaled) / cprRange;
    const y = paddingTop + (1 - clamp(ratio, 0, 1)) * chartHeight;
    return { x, y, date: row.date };
  });

  const spendLinePath = buildLinePath(spendPoints);
  const spendAreaPath = [
    `M ${spendPoints[0]?.x ?? paddingX} ${baselineY}`,
    spendLinePath.replace(/^M /, "L "),
    `L ${spendPoints.at(-1)?.x ?? paddingX} ${baselineY}`,
    "Z",
  ].join(" ");

  const cprLinePath = buildLinePath(cprPoints);

  const labelIndexes = Array.from(
    new Set([0, Math.floor((rows.length - 1) / 2), rows.length - 1]),
  );

  const last = rows.at(-1);
  const latestLabel = last ? formatDayLabel(last.date) : "-";
  const latestCprLabel = last
    ? formatCurrency(last.derived.costPerResult ?? null)
    : "ไม่มีข้อมูล";
  const latestSpendLabel = last
    ? formatCurrency(last.totals.spend)
    : "ไม่มีข้อมูล";

  return (
    <div className="relative h-full w-full">
      <div className="absolute top-2 right-2 bg-white/80 border border-slate-200 rounded-md px-2 py-1 text-[10px] text-slate-600 shadow-sm">
        <div className="font-bold text-slate-700">ล่าสุด: {latestLabel}</div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>CPR: {latestCprLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-slate-300"></span>
          <span>ใช้จ่าย: {latestSpendLabel}</span>
        </div>
      </div>

      <svg
        className="w-full h-full"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="แนวโน้มรายวัน: CPR และยอดใช้จ่าย"
      >
        <defs>
          <linearGradient id="spendArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="cprLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        <g className="text-slate-200">
          {Array.from({ length: 4 }, (_, index) => {
            const y = paddingTop + (chartHeight / 3) * index;
            return (
              <line
                key={`grid-${index}`}
                x1={paddingX}
                x2={width - paddingX}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
              />
            );
          })}
        </g>

        <path d={spendAreaPath} fill="url(#spendArea)" />
        <path
          d={spendLinePath}
          fill="none"
          stroke="#94A3B8"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.75"
        />

        <path
          d={cprLinePath}
          fill="none"
          stroke="url(#cprLine)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {cprPoints.map((point, index) => {
          const row = rows[index];
          const cprLabel = formatCurrency(row?.derived.costPerResult ?? null);
          const spendLabel = formatCurrency(row?.totals.spend ?? null);
          const resultLabel = row?.totals.results ?? 0;
          const dateLabel = formatDayLabel(point.date);

          const tooltipLines = [
            dateLabel,
            `CPR: ${cprLabel}`,
            `ผลลัพธ์: ${resultLabel}`,
            `ใช้จ่าย: ${spendLabel}`,
          ];
          const longestLine = tooltipLines.reduce(
            (max, line) => Math.max(max, line.length),
            0,
          );
          const tooltipWidth = clamp(longestLine * 6.5 + 28, 140, 230);
          const tooltipHeight = 18 + 14 * (tooltipLines.length - 1) + 16;

          const isNearRightEdge =
            point.x + tooltipWidth + 18 > width - paddingX;
          const isNearTopEdge = point.y - tooltipHeight - 12 < paddingTop;
          const tooltipX =
            point.x + (isNearRightEdge ? -(tooltipWidth + 12) : 12);
          const tooltipY =
            point.y + (isNearTopEdge ? 12 : -(tooltipHeight + 12));

          return (
            <g key={`point-${point.date}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="12"
                fill="#000"
                fillOpacity="0"
                className="peer cursor-pointer"
                pointerEvents="all"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r="3"
                fill="#3B82F6"
                stroke="#ffffff"
                strokeWidth="1.5"
                pointerEvents="none"
              />

              <circle
                cx={point.x}
                cy={point.y}
                r="7"
                fill="#3B82F6"
                opacity="0"
                className="peer-hover:opacity-20 transition-opacity"
                pointerEvents="none"
              />

              <g
                transform={`translate(${tooltipX} ${tooltipY})`}
                className="opacity-0 peer-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
              >
                <rect
                  width={tooltipWidth}
                  height={tooltipHeight}
                  rx="8"
                  fill="#ffffff"
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  opacity="0.95"
                />

                <text
                  x="12"
                  y="18"
                  fill="#0F172A"
                  fontSize="11"
                  fontWeight="700"
                >
                  {tooltipLines[0]}
                </text>

                {tooltipLines.slice(1).map((line, lineIndex) => (
                  <text
                    key={`tooltip-line-${point.date}-${lineIndex}`}
                    x="12"
                    y={18 + (lineIndex + 1) * 14}
                    fill="#334155"
                    fontSize="10"
                    fontWeight="500"
                  >
                    {line}
                  </text>
                ))}
              </g>
            </g>
          );
        })}

        {labelIndexes.map((index) => {
          const date = rows[index]?.date;
          if (!date) return null;
          const x = paddingX + index * xStep;
          return (
            <text
              key={`label-${date}`}
              x={x}
              y={height - 10}
              textAnchor={
                index === 0
                  ? "start"
                  : index === rows.length - 1
                    ? "end"
                    : "middle"
              }
              fill="#94A3B8"
              fontSize="10"
              fontWeight="600"
            >
              {formatDayLabel(date)}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
