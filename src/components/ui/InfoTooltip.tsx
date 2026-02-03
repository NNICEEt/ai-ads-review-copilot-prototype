"use client";

import { useEffect, useId, useRef, useState } from "react";

type InfoTooltipProps = {
  label: string;
  content: string;
  className?: string;
};

export const InfoTooltip = ({
  label,
  content,
  className,
}: InfoTooltipProps) => {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrapperRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current) return;
      if (wrapperRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <span
      ref={wrapperRef}
      className={`relative inline-flex ${className ?? ""}`}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-slate-500 hover:text-slate-700 hover:bg-white/70 border border-transparent hover:border-slate-200 transition-colors"
      >
        <i className="fa-solid fa-circle-info text-[10px]"></i>
      </button>

      {open ? (
        <span
          id={id}
          role="tooltip"
          className="absolute z-50 top-full mt-1 left-1/2 -translate-x-1/2 w-64 max-w-[70vw] rounded-lg border border-slate-200 bg-white shadow-lg p-2 text-[11px] text-slate-700 font-thai whitespace-pre-line"
        >
          {content}
        </span>
      ) : null}
    </span>
  );
};
