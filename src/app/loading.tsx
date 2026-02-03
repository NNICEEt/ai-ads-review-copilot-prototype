import { DashboardNavbar } from "@/components/navbar/DashboardNavbar";

const SkeletonBlock = ({ className }: { className: string }) => (
  <div className={`bg-slate-200/70 rounded ${className}`} />
);

export default function Loading() {
  return (
    <div className="min-h-screen">
      <DashboardNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              ภาพรวมแดชบอร์ด
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-thai">
              สรุปภาพรวมและจัดลำดับสิ่งที่ต้องปรับปรุง (เน้นลงมือทำ)
            </p>
          </div>

          <div className="flex flex-wrap gap-3 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200">
            <div className="w-48">
              <SkeletonBlock className="h-9 w-full" />
            </div>
            <div className="w-px bg-slate-200 my-1 hidden sm:block"></div>
            <div className="flex-1 min-w-[200px]">
              <SkeletonBlock className="h-9 w-full" />
            </div>
            <div className="hidden sm:flex items-center px-2">
              <SkeletonBlock className="h-3 w-28" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={`summary-skeleton-${index}`}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-pulse"
            >
              <div className="flex items-center justify-between">
                <SkeletonBlock className="h-3 w-24" />
                <SkeletonBlock className="h-10 w-10 rounded-lg" />
              </div>
              <div className="mt-4">
                <SkeletonBlock className="h-7 w-28" />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <SkeletonBlock className="h-3 w-20" />
                <SkeletonBlock className="h-5 w-12 rounded" />
              </div>
            </div>
          ))}
        </div>

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
            <div className="flex gap-2 animate-pulse">
              <SkeletonBlock className="h-8 w-20 rounded" />
              <SkeletonBlock className="h-8 w-20 rounded" />
            </div>
          </div>

          <div className="overflow-y-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <tr className="text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold w-20 text-center">คะแนน</th>
                  <th className="p-4 font-semibold w-1/3">
                    กลุ่มโฆษณา / แคมเปญ
                  </th>
                  <th className="p-4 font-semibold w-1/4">สถานะ / ประเด็น</th>
                  <th className="p-4 font-semibold text-right">
                    ต้นทุน/ผลลัพธ์
                  </th>
                  <th className="p-4 font-semibold text-right">แนวโน้ม</th>
                  <th className="p-4 font-semibold text-center w-20">
                    ดูรายละเอียด
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {Array.from({ length: 6 }, (_, index) => (
                  <tr
                    key={`priority-skeleton-${index}`}
                    className="animate-pulse"
                  >
                    <td className="p-4 text-center">
                      <SkeletonBlock className="w-9 h-9 rounded-full mx-auto" />
                    </td>
                    <td className="p-4">
                      <SkeletonBlock className="h-3 w-48" />
                      <div className="mt-2">
                        <SkeletonBlock className="h-2.5 w-40" />
                      </div>
                    </td>
                    <td className="p-4">
                      <SkeletonBlock className="h-5 w-24 rounded-full" />
                      <div className="mt-2">
                        <SkeletonBlock className="h-2.5 w-28" />
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <SkeletonBlock className="h-3 w-20 ml-auto" />
                      <div className="mt-2">
                        <SkeletonBlock className="h-2.5 w-28 ml-auto" />
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <SkeletonBlock className="h-6 w-16 rounded ml-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <SkeletonBlock className="h-8 w-8 rounded-full mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 p-4 border-t border-slate-200 text-center text-xs text-slate-500">
            แสดง 5 รายการสำคัญที่สุด
            <span className="text-blue-600 font-bold ml-1 opacity-50">
              ดูเพิ่มเติม
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
