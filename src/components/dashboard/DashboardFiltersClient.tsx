"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type DashboardPreset = "attention" | "fatigue" | "learning" | "top";

type DashboardFiltersClientProps = {
  accounts: Array<{ id: string; name: string }>;
  accountId: string;
  periodDays: number;
  query: string;
  preset: DashboardPreset;
};

const DEFAULT_PRESET: DashboardPreset = "attention";

const PRESET_OPTIONS: Array<{ key: DashboardPreset; label: string }> = [
  { key: "attention", label: "ต้องแก้ไข (Needs Attention)" },
  { key: "fatigue", label: "ครีเอทีฟเริ่มล้า (Creative Fatigue)" },
  { key: "learning", label: "Learning จำกัด (Learning Limited)" },
  { key: "top", label: "ผลงานดี (Top Performer)" },
];

const buildDashboardHref = (params: {
  accountId: string;
  periodDays: number;
  query: string;
  preset: DashboardPreset;
}) => {
  const search = new URLSearchParams();
  search.set("accountId", params.accountId);
  search.set("periodDays", String(params.periodDays));
  const trimmed = params.query.trim();
  if (trimmed) search.set("q", trimmed);
  if (params.preset !== DEFAULT_PRESET) search.set("preset", params.preset);
  return `/?${search.toString()}`;
};

export const DashboardFiltersClient = ({
  accounts,
  accountId,
  periodDays,
  query,
  preset,
}: DashboardFiltersClientProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localQuery, setLocalQuery] = useState(query);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const currentHref = useMemo(() => {
    return buildDashboardHref({
      accountId,
      periodDays,
      query: localQuery,
      preset,
    });
  }, [accountId, localQuery, periodDays, preset]);

  return (
    <form
      className="flex flex-wrap gap-3 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(() => {
          router.push(currentHref);
        });
      }}
    >
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i className="fa-solid fa-briefcase text-slate-500 text-xs"></i>
        </div>
        <label htmlFor="dashboard-account" className="sr-only">
          เลือกบัญชีโฆษณา
        </label>
        <select
          id="dashboard-account"
          className="appearance-none bg-slate-50 border border-slate-200 hover:border-blue-400 text-slate-700 py-2 pl-9 pr-8 rounded leading-tight focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm font-medium w-48 transition-all cursor-pointer"
          value={accountId}
          onChange={(event) => {
            const nextAccountId = event.target.value;
            const href = buildDashboardHref({
              accountId: nextAccountId,
              periodDays,
              query: localQuery,
              preset,
            });
            startTransition(() => {
              router.push(href);
            });
          }}
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
          <i className="fa-solid fa-chevron-down text-[10px]"></i>
        </div>
      </div>

      <div className="w-px bg-slate-200 my-1 hidden sm:block"></div>

      <div className="relative flex-1 min-w-[220px]">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i className="fa-solid fa-magnifying-glass text-slate-500 text-xs"></i>
        </div>
        <label htmlFor="dashboard-search" className="sr-only">
          ค้นหาแคมเปญหรือกลุ่มโฆษณา
        </label>
        <input
          id="dashboard-search"
          value={localQuery}
          onChange={(event) => setLocalQuery(event.target.value)}
          placeholder="ค้นหาแคมเปญ/กลุ่มโฆษณา…"
          className="w-full bg-slate-50 border border-slate-200 hover:border-blue-400 text-slate-700 py-2 pl-9 pr-9 rounded leading-tight focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm transition-all"
        />
        <button
          type="submit"
          className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-blue-700"
          aria-label="ค้นหา"
          disabled={isPending}
        >
          <i
            className={
              isPending
                ? "fa-solid fa-rotate fa-spin"
                : "fa-solid fa-arrow-right"
            }
          ></i>
        </button>
      </div>

      <div
        className="flex items-center gap-1 bg-slate-100 p-1 rounded"
        role="group"
        aria-label="พรีเซ็ต (Preset)"
      >
        {PRESET_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => {
              const href = buildDashboardHref({
                accountId,
                periodDays,
                query: localQuery,
                preset: option.key,
              });
              startTransition(() => {
                router.push(href);
              });
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
              option.key === preset
                ? "text-blue-700 bg-white shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
            disabled={isPending}
            aria-pressed={option.key === preset}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded">
        {[3, 7, 14].map((days) => (
          <button
            key={days}
            type="button"
            onClick={() => {
              const href = buildDashboardHref({
                accountId,
                periodDays: days,
                query: localQuery,
                preset,
              });
              startTransition(() => {
                router.push(href);
              });
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
              days === periodDays
                ? "text-blue-700 bg-white shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
            disabled={isPending}
          >
            {days} วัน
          </button>
        ))}
      </div>

      <div className="flex items-center px-2 text-xs text-slate-600 font-medium">
        อิงจาก {periodDays} วันล่าสุด • เทียบ {periodDays} วันก่อนหน้า
      </div>
    </form>
  );
};
