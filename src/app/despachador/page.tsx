"use client";
import { useState } from "react";
import { Bike, Wallet } from "lucide-react";
import { AreaShell } from "@/components/layout/AreaShell";
import { SideNav } from "@/components/layout/SideNav";
import { DespachadorBoard } from "@/components/despachador/DespachadorBoard";
import { CajeroBoard } from "@/components/cajero/CajeroBoard";

const navItems = [
  { key: "despachar", label: "Despachar", icon: <Bike size={18} /> },
  { key: "caja", label: "Caja", icon: <Wallet size={18} /> },
];

export default function DespachadorPage() {
  const [tab, setTab] = useState("despachar");
  return (
    <AreaShell
      title="Despachador"
      sidebar={<SideNav items={navItems} active={tab} onSelect={setTab} />}
    >
      {tab === "despachar" && <DespachadorBoard />}
      {tab === "caja" && <CajeroBoard />}
    </AreaShell>
  );
}
