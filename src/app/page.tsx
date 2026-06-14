"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChefHat, ReceiptText, Bike, Shield, Wallet, IceCream2,
} from "lucide-react";
import { AccessGate } from "@/components/AccessGate";
import { useHydrate } from "@/store/useHydrate";
import { Rol } from "@/types";

const BUSINESS = process.env.NEXT_PUBLIC_BUSINESS_NAME || "Heladería Antojos";

const roles: { rol: Rol; label: string; desc: string; icon: typeof ChefHat; ruta: string; color: string }[] = [
  { rol: "cocina", label: "Cocina", desc: "Pedidos en preparación", icon: ChefHat, ruta: "/cocina", color: "from-raspberry/10 to-raspberry-light/40" },
  { rol: "facturacion", label: "Facturación", desc: "Crear e historial", icon: ReceiptText, ruta: "/facturacion", color: "from-pistachio/10 to-pistachio/30" },
  { rol: "despachador", label: "Despachador", desc: "Entrega de pedidos", icon: Bike, ruta: "/despachador", color: "from-mint/10 to-mint/30" },
  { rol: "admin", label: "Admin", desc: "Configuración general", icon: Shield, ruta: "/admin", color: "from-cocoa/10 to-cocoa/20" },
  { rol: "cajero", label: "Cajero", desc: "Cuadre de caja", icon: Wallet, ruta: "/cajero", color: "from-raspberry/10 to-sand" },
];

export default function Home() {
  const ready = useHydrate();
  const router = useRouter();
  const [gate, setGate] = useState<{ rol: Rol; ruta: string } | null>(null);

  return (
    <main className="min-h-screen">
      {/* Encabezado */}
      <header className="px-6 pt-12 pb-8 text-center sm:pt-16">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-xl2 bg-raspberry text-white shadow-soft">
          <IceCream2 size={42} strokeWidth={1.8} />
        </div>
        <p className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-raspberry">
          Sistema de operación
        </p>
        <h1 className="mt-2 font-display text-4xl font-black text-cocoa sm:text-5xl">
          {BUSINESS}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-cocoa/60">
          Elige tu área de trabajo para comenzar.
        </p>
      </header>

      {/* Tarjetas de rol */}
      <section className="mx-auto grid max-w-5xl gap-5 px-6 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((r, i) => {
          const Icon = r.icon;
          return (
            <button
              key={r.rol}
              disabled={!ready}
              onClick={() => setGate({ rol: r.rol, ruta: r.ruta })}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`group animate-fade-up rounded-xl2 border border-sand bg-gradient-to-br ${r.color} p-6 text-left shadow-card transition-all hover:-translate-y-1 hover:shadow-soft focus:outline-none disabled:opacity-60`}
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-raspberry shadow-card transition-transform group-hover:scale-110">
                <Icon size={28} strokeWidth={1.8} />
              </div>
              <h2 className="font-display text-2xl font-semibold text-cocoa">{r.label}</h2>
              <p className="mt-1 text-sm text-cocoa/60">{r.desc}</p>
            </button>
          );
        })}
      </section>

      {gate && (
        <AccessGate
          rol={gate.rol}
          onClose={() => setGate(null)}
          onSuccess={() => router.push(gate.ruta)}
        />
      )}
    </main>
  );
}
