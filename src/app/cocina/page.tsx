"use client";
import { AreaShell } from "@/components/layout/AreaShell";
import { CocinaBoard } from "@/components/cocina/CocinaBoard";

export default function CocinaPage() {
  return (
    <AreaShell title="Cocina">
      <CocinaBoard />
    </AreaShell>
  );
}
