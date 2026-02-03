import { ContextNavbar } from "@/components/navbar/ContextNavbar";

const SkeletonBlock = ({ className }: { className: string }) => (
  <div className={`bg-slate-200/70 rounded ${className}`} />
);

export default function Loading() {
  return (
    <div className="min-h-screen">
      <ContextNavbar
        backHref="/"
        backLabel="กลับสู่แดชบอร์ด"
        contextTop="บัญชี: กำลังโหลด…"
        contextMain="แคมเปญ: กำลังโหลด…"
        contextIconClass="fa-solid fa-layer-group text-blue-600"
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-end justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              เปรียบเทียบกลุ่มโฆษณา
            </h1>
            <p className="text-sm text-slate-500 font-thai">
              เปรียบเทียบประสิทธิภาพรายกลุ่มเป้าหมาย
            </p>
          </div>
          <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex items-center text-sm animate-pulse">
            <SkeletonBlock className="h-8 w-56" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-slate-500 text-xs uppercase tracking-wider text-right">
                  <th className="p-4 text-left w-1/4">ชื่อกลุ่มโฆษณา</th>
                  <th className="p-4 text-left w-1/4">
                    AI วิเคราะห์ (Insight)
                  </th>
                  <th className="p-4">ยอดใช้จ่าย</th>
                  <th className="p-4 text-center">ผลลัพธ์</th>
                  <th className="p-4">CPR</th>
                  <th className="p-4">ROAS</th>
                  <th className="p-4">CTR</th>
                  <th className="p-4 text-center">ดูรายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {Array.from({ length: 5 }, (_, index) => (
                  <tr key={`campaign-row-skeleton-${index}`}>
                    <td className="p-4">
                      <SkeletonBlock className="h-3 w-48" />
                      <div className="mt-2">
                        <SkeletonBlock className="h-2.5 w-20" />
                      </div>
                    </td>
                    <td className="p-4">
                      <SkeletonBlock className="h-14 w-full rounded-lg" />
                    </td>
                    <td className="p-4 text-right">
                      <SkeletonBlock className="h-3 w-20 ml-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <SkeletonBlock className="h-3 w-12 mx-auto" />
                    </td>
                    <td className="p-4 text-right">
                      <SkeletonBlock className="h-3 w-20 ml-auto" />
                      <div className="mt-2">
                        <SkeletonBlock className="h-2.5 w-12 ml-auto" />
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <SkeletonBlock className="h-3 w-12 ml-auto" />
                    </td>
                    <td className="p-4 text-right">
                      <SkeletonBlock className="h-3 w-12 ml-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <SkeletonBlock className="h-8 w-8 rounded-full mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 border-t border-slate-200 p-4">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-bold text-slate-700">
                คำแนะนำจาก AI สำหรับแคมเปญ:
              </span>
              <SkeletonBlock className="h-3 w-96 max-w-full" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
