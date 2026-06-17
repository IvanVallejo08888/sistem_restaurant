"use client";
import { AreaShell } from "@/components/layout/AreaShell";
import { EnviarRecomendacion } from "@/components/recomendaciones/EnviarRecomendacion";

export default function RecomendacionesPage() {
  return (
    <AreaShell title="Recomendaciones">
      <EnviarRecomendacion />
    </AreaShell>
  );
}
