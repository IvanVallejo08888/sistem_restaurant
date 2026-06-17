"use client";
import { ChevronDown } from "lucide-react";
import { ReactNode, useRef, useState } from "react";
import { cx } from "@/lib/utils";

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between"
        aria-expanded={open}
      >
        <p className="font-bold text-cocoa">{title}</p>
        <ChevronDown
          size={18}
          className={cx("text-cocoa/60 transition-transform duration-300", open && "rotate-180")}
        />
      </button>
      <div
        style={{
          maxHeight: open ? contentRef.current?.scrollHeight ?? 1000 : 0,
        }}
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
      >
        <div ref={contentRef} className="pt-3">
          {children}
        </div>
      </div>
    </div>
  );
}
