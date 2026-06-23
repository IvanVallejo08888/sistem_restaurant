"use client";
import { useState } from "react";
import { Bike, Wallet, UserPlus } from "lucide-react";
import { AreaShell } from "@/components/layout/AreaShell";
import { SideNav } from "@/components/layout/SideNav";
import { DespachadorBoard } from "@/components/despachador/DespachadorBoard";
import { CajeroBoard } from "@/components/cajero/CajeroBoard";
import { DomiciliarioFormModal } from "@/components/domiciliarios/DomiciliarioFormModal";
import { useData } from "@/store/dataStore";
import { useSession } from "@/store/sessionStore";
import { DomiciliarioForm } from "@/schemas";

const navItems = [
  { key: "despachar", label: "Despachar", icon: <Bike size={18} /> },
  { key: "caja", label: "Caja", icon: <Wallet size={18} /> },
  { key: "agregar-domiciliario", label: "Agregar domiciliario", icon: <UserPlus size={18} /> },
];

export default function DespachadorPage() {
  const [tab, setTab] = useState("despachar");
  const [nuevoDomiciliarioOpen, setNuevoDomiciliarioOpen] = useState(false);
  const localId = useSession((s) => s.localId)!;
  const addDomiciliario = useData((s) => s.addDomiciliario);

  // "Agregar domiciliario" no es una pestaña de contenido: solo abre el modal
  // de alta rápida, sin cambiar lo que ya se está mostrando (Despachar/Caja).
  const handleSelect = (key: string) => {
    if (key === "agregar-domiciliario") {
      setNuevoDomiciliarioOpen(true);
      return;
    }
    setTab(key);
  };

  const onSubmitNuevoDomiciliario = (d: DomiciliarioForm) => {
    addDomiciliario({ ...d, localId });
    setNuevoDomiciliarioOpen(false);
  };

  return (
    <AreaShell
      title="Despachador"
      sidebar={<SideNav items={navItems} active={tab} onSelect={handleSelect} />}
    >
      {tab === "despachar" && <DespachadorBoard />}
      {tab === "caja" && <CajeroBoard />}

      <DomiciliarioFormModal
        open={nuevoDomiciliarioOpen}
        onClose={() => setNuevoDomiciliarioOpen(false)}
        onSubmit={onSubmitNuevoDomiciliario}
      />
    </AreaShell>
  );
}
