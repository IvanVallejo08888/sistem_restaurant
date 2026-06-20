"use client";
import { useState } from "react";
import { ReceiptText, History } from "lucide-react";
import { AreaShell } from "@/components/layout/AreaShell";
import { SideNav } from "@/components/layout/SideNav";
import { Facturar } from "@/components/facturacion/Facturar";
import { Historial } from "@/components/facturacion/Historial";
import { ModoFacturacion } from "@/types";

type Tab = "facturar" | "historial";

export function FacturacionArea({ modo }: { modo: ModoFacturacion }) {
  const [tab, setTab] = useState<Tab>("facturar");
  const nav = [
    { key: "facturar", label: "Facturar", icon: <ReceiptText size={18} /> },
    { key: "historial", label: "Historial", icon: <History size={18} /> },
  ];
  const titulo = modo === "mesas" ? "Facturación · Mesas y para llevar" : "Facturación · Domicilios y más";
  return (
    <AreaShell
      title={titulo}
      sidebar={<SideNav items={nav} active={tab} onSelect={(k) => setTab(k as Tab)} />}
    >
      {tab === "facturar" && <Facturar modo={modo} />}
      {tab === "historial" && <Historial modo={modo} />}
    </AreaShell>
  );
}
