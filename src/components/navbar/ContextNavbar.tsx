import Link from "next/link";

type ContextNavbarProps = {
  backHref: string;
  backLabel: string;
  contextTop: string;
  contextMain: string;
  contextIconClass: string;
  period?: {
    label: string;
    compareLabel: string;
  };
};

export const ContextNavbar = ({
  backHref,
  backLabel,
  contextTop,
  contextMain,
  contextIconClass,
  period,
}: ContextNavbarProps) => (
  <nav className="bg-white border-b border-slate-200 h-16 flex items-center px-4 sm:px-6 lg:px-8 sticky top-0 z-50 shadow-sm">
    <Link
      href={backHref}
      className="text-slate-400 hover:text-slate-600 mr-4 transition-colors flex items-center gap-1 text-sm font-medium"
    >
      <i className="fa-solid fa-arrow-left"></i> {backLabel}
    </Link>
    <div className="h-6 w-px bg-slate-200 mx-2"></div>
    <div className="flex flex-col ml-2">
      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
        {contextTop}
      </span>
      <span className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
        <i className={contextIconClass}></i> {contextMain}
      </span>
    </div>
    {period ? (
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <i className="fa-regular fa-calendar text-slate-400"></i>
          <span className="text-xs font-bold text-slate-700">
            {period.label}
          </span>
          <span className="text-[10px] text-slate-400 border-l border-slate-300 pl-2">
            {period.compareLabel}
          </span>
        </div>
      </div>
    ) : null}
  </nav>
);
