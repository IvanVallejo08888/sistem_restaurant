"use client";
import { AreaShell } from "@/components/layout/AreaShell";
import { DespachadorBoard } from "@/components/despachador/DespachadorBoard";

export default function DespachadorPage() {
  return (
    <AreaShell title="Despachador">
      <DespachadorBoard />
    </AreaShell>
  );
}
