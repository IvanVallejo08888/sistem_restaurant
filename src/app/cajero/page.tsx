"use client";
import { AreaShell } from "@/components/layout/AreaShell";
import { CajeroBoard } from "@/components/cajero/CajeroBoard";

export default function CajeroPage() {
  return (
    <AreaShell title="Cajero">
      <CajeroBoard />
    </AreaShell>
  );
}
