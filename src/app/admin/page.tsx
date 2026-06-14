"use client";
import { useState } from "react";
import { Store, Croissant, Bike, Armchair, TrendingUp } from "lucide-react";
import { AreaShell } from "@/components/layout/AreaShell";
import { SideNav } from "@/components/layout/SideNav";
import { LocalesPanel } from "@/components/admin/LocalesPanel";
import { CartaPanel } from "@/components/admin/CartaPanel";
import { DomiciliariosPanel } from "@/components/admin/DomiciliariosPanel";
import { MesasPanel } from "@/components/admin/MesasPanel";
import { LocalSelector } from "@/components/admin/LocalSelector";
import { ReportesPanel } from "@/components/admin/ReportesPanel";
import { Empty } from "@/components/ui/Empty";

type Tab = "locales" | "reportes" | "carta" | "domiciliarios" | "mesas";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("locales");
  const [localId, setLocalId] = useState("");

  const nav = [
    { key: "locales", label: "Locales", icon: <Store size={18} /> },
    { key: "reportes", label: "Reportes", icon: <TrendingUp size={18} /> },
    { key: "carta", label: "Carta", icon: <Croissant size={18} /> },
    { key: "domiciliarios", label: "Domiciliarios", icon: <Bike size={18} /> },
    { key: "mesas", label: "Mesas", icon: <Armchair size={18} /> },
  ];

  const requiereLocal = tab === "carta" || tab === "domiciliarios" || tab === "mesas";

  return (
    <AreaShell
      title="Panel Admin"
      requireKind="admin"
      sidebar={<SideNav items={nav} active={tab} onSelect={(k) => setTab(k as Tab)} />}
    >
      {tab === "locales" && <LocalesPanel />}
      {tab === "reportes" && <ReportesPanel />}

      {requiereLocal && (
        <>
          <LocalSelector value={localId} onChange={setLocalId} />
          {!localId ? (
            <Empty title="Selecciona un local" hint="Elige el local sobre el que deseas trabajar." />
          ) : (
            <>
              {tab === "carta" && <CartaPanel localId={localId} />}
              {tab === "domiciliarios" && <DomiciliariosPanel localId={localId} />}
              {tab === "mesas" && <MesasPanel localId={localId} />}
            </>
          )}
        </>
      )}
    </AreaShell>
  );
}
