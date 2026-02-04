import Image from "next/image";
import { BusinessContextButton } from "@/components/ai/BusinessContextButton";

export const DashboardNavbar = () => (
  <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 brand-gradient rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-900/20">
            <i className="fa-solid fa-infinity"></i>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">
            AI Ads Review{" "}
            <span className="text-blue-600 font-light">Copilot</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <BusinessContextButton />
          <button
            type="button"
            className="text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="การแจ้งเตือน"
          >
            <i className="fa-regular fa-bell text-xl"></i>
          </button>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end text-sm">
              <span className="font-medium text-slate-900">Media Team</span>
              <span className="text-slate-500 text-xs">สิทธิ์แอดมิน</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden border border-slate-300 shadow-sm">
              <Image
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                alt="ผู้ใช้"
                width={36}
                height={36}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
);
