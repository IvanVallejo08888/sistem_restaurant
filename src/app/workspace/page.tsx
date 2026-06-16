"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChefHat, ReceiptText, Bike } from "lucide-react";
import { useHydrate } from "@/store/useHydrate";
import { useSession } from "@/store/sessionStore";
import { useData } from "@/store/dataStore";
import { Button } from "@/components/ui/Button";
import { Rol } from "@/types";

const roles: { rol: Rol; label: string; desc: string; icon: typeof ChefHat; ruta: string; color: string }[] = [
  { rol: "facturacion", label: "Facturación", desc: "Crear e historial de facturas", icon: ReceiptText, ruta: "/facturacion", color: "from-pistachio/10 to-pistachio/30" },
  { rol: "cocina", label: "Cocina", desc: "Pedidos en preparación", icon: ChefHat, ruta: "/cocina", color: "from-raspberry/10 to-raspberry-light/40" },
  { rol: "despachador", label: "Despachador", desc: "Entrega de pedidos", icon: Bike, ruta: "/despachador", color: "from-mint/10 to-mint/30" },
];

export default function WorkspacePage() {
  const ready = useHydrate();
  const router = useRouter();
  const { kind, localId } = useSession();
  const local = useData((s) => s.locales.find((l) => l.id === localId));

  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-cocoa/50">Cargando…</div>;
  }

  if (kind !== "local" || !local) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <p className="font-display text-2xl font-semibold text-cocoa">Acceso requerido</p>
          <p className="mt-2 text-cocoa/60">Ingresa con la contraseña del local desde el inicio.</p>
          <Button className="mt-6" onClick={() => router.push("/")}>Ir al inicio</Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="px-6 pt-12 pb-8 text-center sm:pt-16">
        <div className="mx-auto mb-5 flex justify-center animate-logo-float">
          <div className="relative h-28 w-28 overflow-hidden rounded-full shadow-logo-glow ring-4 ring-raspberry-light/60">
            <Image
              src="/logo-original.jpeg"
              alt="Logo Heladería Antojos"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
        <p className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-raspberry">
          Área de trabajo · {local.nombre}
        </p>
        <h1 className="mt-2 font-display text-4xl font-black text-cocoa sm:text-5xl">
          Centro de Operaciones
        </h1>
        <p className="mx-auto mt-3 max-w-md text-cocoa/60">
          Selecciona el área desde donde desempeñarás tus funciones.
        </p>
      </header>

      <section className="mx-auto grid max-w-5xl gap-5 px-6 pb-16 sm:grid-cols-3">
        {roles.map((r, i) => {
          const Icon = r.icon;
          return (
            <button
              key={r.rol}
              disabled={!ready}
              onClick={() => router.push(r.ruta)}
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
    </main>
  );
}
