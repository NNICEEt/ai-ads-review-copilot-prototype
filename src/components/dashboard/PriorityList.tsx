import { PriorityRow } from "./PriorityRow";

type PriorityItem = {
  variant: "critical" | "warning" | "top" | "normal";
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
};

type PriorityListProps = {
  items: PriorityItem[];
};

export const PriorityList = ({ items }: PriorityListProps) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-150">
    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <i className="fa-solid fa-list-check text-blue-600"></i>
          Priority Action List
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-thai">
          จัดลำดับความสำคัญโดย AI อิงจาก Cost Efficiency และ Trend
        </p>
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors">
          <i className="fa-solid fa-filter mr-1"></i> Filter
        </button>
        <button className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition-colors">
          View All
        </button>
      </div>
    </div>

    <div className="overflow-y-auto custom-scrollbar flex-1">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
          <tr className="text-slate-500 text-xs uppercase tracking-wider">
            <th className="p-4 font-semibold w-20 text-center">Score</th>
            <th className="p-4 font-semibold w-1/3">
              Ad Group Name / Campaign
            </th>
            <th className="p-4 font-semibold w-1/4">Status / Issue</th>
            <th className="p-4 font-semibold text-right">Cost/Res.</th>
            <th className="p-4 font-semibold text-right">Trend</th>
            <th className="p-4 font-semibold text-center w-20">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {items.length > 0 ? (
            items.map((item) => <PriorityRow key={item.name} {...item} />)
          ) : (
            <tr>
              <td
                colSpan={6}
                className="p-10 text-center text-slate-400 text-sm"
              >
                No priority items for this period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    <div className="bg-slate-50 p-4 border-t border-slate-200 text-center text-xs text-slate-500">
      Displaying top 5 priority items.
      <button className="text-blue-600 font-bold hover:underline ml-1">
        Load more
      </button>
    </div>
  </div>
);
