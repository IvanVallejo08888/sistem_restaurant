import { cx } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx("rounded-xl2 border border-sand bg-white shadow-card", className)}
      {...props}
    />
  );
}
