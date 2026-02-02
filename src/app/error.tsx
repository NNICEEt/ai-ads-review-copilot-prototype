"use client";

import { useEffect } from "react";
import { DashboardNavbar } from "@/components/navbar/DashboardNavbar";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen">
      <DashboardNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-500 text-sm">
          <div className="font-bold text-slate-800 mb-2">
            Something went wrong.
          </div>
          <p className="mb-4 font-thai">
            ขออภัย เกิดข้อผิดพลาดระหว่างโหลดข้อมูล
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition-colors"
          >
            Try again
          </button>
        </div>
      </main>
    </div>
  );
}
