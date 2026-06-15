"use client";
import { useState } from "react";
import { ReceiptText, History, CalendarClock } from "lucide-react";
import { AreaShell } from "@/components/layout/AreaShell";
import { SideNav } from "@/components/layout/SideNav";
import { Facturar } from "@/components/facturacion/Facturar";
import { Historial } from "@/components/facturacion/Historial";
import { ReservaDomicilio } from "@/components/facturacion/ReservaDomicilio";

type Tab = "facturar" | "reserva" | "historial";

export default function FacturacionPage() {
  const [tab, setTab] = useState<Tab>("facturar");
  const nav = [
    { key: "facturar", label: "Facturar", icon: <ReceiptText size={18} /> },
    { key: "reserva", label: "Reserva domicilio", icon: <CalendarClock size={18} /> },
    { key: "historial", label: "Historial", icon: <History size={18} /> },
  ];
  return (
    <AreaShell
      title="Facturación"
      sidebar={<SideNav items={nav} active={tab} onSelect={(k) => setTab(k as Tab)} />}
    >
      {tab === "facturar" && <Facturar />}
      {tab === "reserva" && <ReservaDomicilio />}
      {tab === "historial" && <Historial />}
    </AreaShell>
  );
}
