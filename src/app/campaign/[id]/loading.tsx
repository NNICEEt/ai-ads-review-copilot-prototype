import { ContextNavbar } from "@/components/navbar/ContextNavbar";

export default function Loading() {
  return (
    <div className="min-h-screen">
      <ContextNavbar
        backHref="/"
        backLabel="Back to Dashboard"
        contextTop="Account: -"
        contextMain="Campaign: -"
        contextIconClass="fa-solid fa-layer-group text-blue-600"
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-500 text-sm">
          Loading campaign…
        </div>
      </main>
    </div>
  );
}
