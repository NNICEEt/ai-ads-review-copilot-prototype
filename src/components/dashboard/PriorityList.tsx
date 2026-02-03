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
          รายการสิ่งที่ต้องทำก่อน
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-thai">
          จัดลำดับความสำคัญโดย AI อิงจากประสิทธิภาพต้นทุนและแนวโน้ม
        </p>
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors">
          <i className="fa-solid fa-filter mr-1"></i> ตัวกรอง
        </button>
        <button className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition-colors">
          ดูทั้งหมด
        </button>
      </div>
    </div>

    <div className="overflow-y-auto custom-scrollbar flex-1">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
          <tr className="text-slate-500 text-xs uppercase tracking-wider">
            <th className="p-4 font-semibold w-20 text-center">คะแนน</th>
            <th className="p-4 font-semibold w-1/3">กลุ่มโฆษณา / แคมเปญ</th>
            <th className="p-4 font-semibold w-1/4">สถานะ / ประเด็น</th>
            <th className="p-4 font-semibold text-right">ต้นทุน/ผลลัพธ์</th>
            <th className="p-4 font-semibold text-right">แนวโน้ม</th>
            <th className="p-4 font-semibold text-center w-20">ดูรายละเอียด</th>
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
                ไม่มีรายการที่ต้องจัดลำดับในช่วงเวลานี้
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    <div className="bg-slate-50 p-4 border-t border-slate-200 text-center text-xs text-slate-500">
      แสดง 5 รายการสำคัญที่สุด
      <button className="text-blue-600 font-bold hover:underline ml-1">
        ดูเพิ่มเติม
      </button>
    </div>
  </div>
);
