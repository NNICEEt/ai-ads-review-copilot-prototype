import { PriorityRow } from "./PriorityRow";
import { PriorityAiBatchButton } from "@/components/dashboard/PriorityAiBatchButton";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

type PriorityItem = {
  variant: "critical" | "warning" | "top" | "normal";
  score: string;
  name: string;
  campaign: string;
  campaignHref?: string;
  impact: {
    spend: string;
    spendShare: string | null;
  };
  ai?: {
    adGroupId: string;
    periodDays: number;
    autoLoad?: boolean;
  };
  issue?: {
    label: string;
    iconClass: string;
    detail?: string | null;
  };
  signals?: Array<{
    label: string;
    value: string;
    iconClass?: string;
    className: string;
    helpText?: string | null;
  }>;
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

export const PriorityList = ({ items }: PriorityListProps) => {
  const aiItems = items.flatMap((item) =>
    item.ai
      ? [{ adGroupId: item.ai.adGroupId, periodDays: item.ai.periodDays }]
      : [],
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-150">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <i className="fa-solid fa-list-check text-blue-600"></i>
            รายการสิ่งที่ต้องทำก่อน
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-thai">
            จัดลำดับแบบความรุนแรง × ผลกระทบ (Severity × Impact) = คะแนน × ขนาดงบ
            • AI เป็นตัวช่วยเสริม
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
          >
            <i className="fa-solid fa-filter mr-1"></i> ตัวกรอง
          </button>
          <PriorityAiBatchButton items={aiItems} />
        </div>
      </div>

      <div className="overflow-y-auto custom-scrollbar flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr className="text-slate-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-semibold w-20 text-center">คะแนน</th>
              <th className="p-4 font-semibold w-1/3">กลุ่มโฆษณา / แคมเปญ</th>
              <th className="p-4 font-semibold w-1/4">
                <div className="inline-flex items-center gap-1">
                  สถานะ / ประเด็น
                  <InfoTooltip
                    label="คำอธิบายสถานะ/ประเด็น"
                    content={
                      "สรุปสิ่งที่ควรสนใจของกลุ่มโฆษณานี้\n- แสดงสถานะรวม (ต้องแก้ไข/เฝ้าระวัง/ผลงานดี)\n- AI ช่วยสรุปประเด็น (Insight) แบบกระชับ\n- มีสัญญาณสำคัญ: อัตราคลิก (CTR) / ความถี่ (Frequency) / ผลลัพธ์ (Results) / ผลตอบแทน (ROAS) เพื่อช่วยตัดสินใจก่อนกดดูรายละเอียด"
                    }
                  />
                </div>
              </th>
              <th className="p-4 font-semibold text-right">
                <div className="inline-flex items-center gap-1 justify-end w-full">
                  ยอดใช้จ่าย (Spend)
                  <InfoTooltip
                    label="คำอธิบายยอดใช้จ่าย"
                    content={
                      "ยอดใช้จ่าย (Spend) คือเงินที่ใช้จริงในช่วงเวลาที่เลือก\nใช้ประกอบการจัดลำดับความสำคัญแบบความรุนแรง × ผลกระทบ (Severity × Impact)"
                    }
                  />
                </div>
              </th>
              <th className="p-4 font-semibold text-right">
                <div className="inline-flex items-center gap-1 justify-end w-full">
                  ต้นทุนต่อผลลัพธ์ (CPR)
                  <InfoTooltip
                    label="คำอธิบายต้นทุนต่อผลลัพธ์"
                    content={
                      "ต้นทุนต่อผลลัพธ์ (CPR / Cost per Result)\n= ยอดใช้จ่าย (Spend) ÷ จำนวนผลลัพธ์ (Results)\nยิ่งต่ำยิ่งดี (คุ้มกว่า)"
                    }
                  />
                </div>
              </th>
              <th className="p-4 font-semibold text-right">
                <div className="inline-flex items-center gap-1 justify-end w-full">
                  แนวโน้ม
                  <InfoTooltip
                    label="คำอธิบายแนวโน้ม"
                    content={
                      "เทียบต้นทุนต่อผลลัพธ์ (CPR) กับช่วงก่อนหน้า (จำนวนวันเท่ากัน)\n- สีแดง: CPR แย่ลง (+)\n- สีเขียว: CPR ดีขึ้น (-)"
                    }
                  />
                </div>
              </th>
              <th className="p-4 font-semibold text-center w-20">
                ดูรายละเอียด
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {items.length > 0 ? (
              items.map((item) => (
                <PriorityRow key={item.ai?.adGroupId ?? item.name} {...item} />
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="p-10 text-center text-slate-500 text-sm"
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
};
