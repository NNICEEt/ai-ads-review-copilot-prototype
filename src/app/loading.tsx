import { DashboardNavbar } from "@/components/navbar/DashboardNavbar";

export default function Loading() {
  return (
    <div className="min-h-screen">
      <DashboardNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-500 text-sm">
          Loading dashboard…
        </div>
      </main>
    </div>
  );
}
