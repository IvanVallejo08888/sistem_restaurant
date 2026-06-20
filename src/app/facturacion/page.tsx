"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Armchair, Bike, LogOut } from "lucide-react";
import { useHydrate } from "@/store/useHydrate";
import { useSession } from "@/store/sessionStore";
import { useData } from "@/store/dataStore";
import { Button } from "@/components/ui/Button";

// Pantalla intermedia al entrar a Facturación: elige qué categorías se
// mostrarán en "¿Qué deseas facturar?" y en el Historial.
export default function SeleccionFacturacionPage() {
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
          Facturación · {local.nombre}
        </p>
        <h1 className="mt-2 font-display text-4xl font-black text-cocoa sm:text-5xl">
          ¿Qué vas a facturar?
        </h1>
        <p className="mx-auto mt-3 max-w-md text-cocoa/60">
          Elige el tipo de operación para continuar.
        </p>
      </header>

      <section className="mx-auto grid max-w-3xl gap-5 px-6 sm:grid-cols-2">
        <button
          onClick={() => router.push("/facturacion/mesas")}
          className="group animate-fade-up rounded-xl2 border border-sand bg-gradient-to-br from-mint/10 to-mint/30 p-8 text-left shadow-card transition-all hover:-translate-y-1 hover:shadow-soft focus:outline-none"
        >
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-mint shadow-card transition-transform group-hover:scale-110">
            <Armchair size={28} strokeWidth={1.8} />
          </div>
          <h2 className="font-display text-2xl font-semibold text-cocoa">Mesas</h2>
          <p className="mt-1 text-sm text-cocoa/60">y para llevar</p>
        </button>

        <button
          onClick={() => router.push("/facturacion/domicilios")}
          style={{ animationDelay: "60ms" }}
          className="group animate-fade-up rounded-xl2 border border-sand bg-gradient-to-br from-raspberry/10 to-raspberry-light/40 p-8 text-left shadow-card transition-all hover:-translate-y-1 hover:shadow-soft focus:outline-none"
        >
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-raspberry shadow-card transition-transform group-hover:scale-110">
            <Bike size={28} strokeWidth={1.8} />
          </div>
          <h2 className="font-display text-2xl font-semibold text-cocoa">Domicilios</h2>
          <p className="mt-1 text-sm text-cocoa/60">y más</p>
        </button>
      </section>

      <div className="flex justify-center pb-12 pt-10">
        <button
          onClick={() => router.push("/workspace")}
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-cocoa/50 transition-colors hover:bg-sand hover:text-cocoa/80"
        >
          <LogOut size={14} strokeWidth={2} />
          Salir
        </button>
      </div>
    </main>
  );
}
