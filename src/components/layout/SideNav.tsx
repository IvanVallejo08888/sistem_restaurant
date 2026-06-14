"use client";
import { cx } from "@/lib/utils";

export type NavItem = { key: string; label: string; icon?: React.ReactNode };

export function SideNav({
  items, active, onSelect,
}: {
  items: NavItem[];
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-sand bg-vanilla px-3 py-3 md:w-56 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:px-3 md:py-5">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onSelect(it.key)}
          className={cx(
            "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors md:w-full",
            active === it.key
              ? "bg-raspberry text-white shadow-card"
              : "text-cocoa/70 hover:bg-sand"
          )}
        >
          {it.icon}
          {it.label}
        </button>
      ))}
    </nav>
  );
}
