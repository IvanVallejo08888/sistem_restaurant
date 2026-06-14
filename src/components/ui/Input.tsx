"use client";
import { cx } from "@/lib/utils";
import { forwardRef, InputHTMLAttributes } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { error?: string; label?: string }
>(({ className, error, label, id, ...props }, ref) => (
  <div className="w-full">
    {label && (
      <label htmlFor={id} className="mb-1 block text-sm font-bold text-cocoa/80">
        {label}
      </label>
    )}
    <input
      id={id}
      ref={ref}
      className={cx(
        "w-full rounded-xl border bg-white px-4 py-2.5 text-cocoa placeholder:text-cocoa/40 transition focus:outline-none",
        error ? "border-raspberry" : "border-sand focus:border-raspberry",
        className
      )}
      {...props}
    />
    {error && <p className="mt-1 text-xs font-semibold text-raspberry">{error}</p>}
  </div>
));
Input.displayName = "Input";
