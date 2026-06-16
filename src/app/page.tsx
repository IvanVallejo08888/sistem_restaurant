"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Shield, Home as HomeIcon } from "lucide-react";
import { AccessGate } from "@/components/AccessGate";
import { useHydrate } from "@/store/useHydrate";
import { Rol } from "@/types";

const BUSINESS = process.env.NEXT_PUBLIC_BUSINESS_NAME || "Heladería Antojos";

export default function Home() {
  const ready = useHydrate();
  const router = useRouter();
  const [gate, setGate] = useState<{ rol: Rol; ruta?: string; titulo?: string } | null>(null);

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
          Sistema de operación
        </p>
        <h1 className="mt-2 font-display text-4xl font-black text-cocoa sm:text-5xl">
          {BUSINESS}
        </h1>
        <p className="mx-auto mt-3 max-w-sm font-sans text-base text-cocoa/70">
          Gestiona tu negocio de forma rápida y organizada.
        </p>
        <p className="mt-1 text-sm text-cocoa/50">
          Selecciona cómo deseas ingresar al sistema.
        </p>
      </header>

      <section className="mx-auto grid max-w-2xl gap-5 px-6 pb-16 sm:grid-cols-2">
        {/* Administrador */}
        <button
          disabled={!ready}
          onClick={() => setGate({ rol: "admin", ruta: "/admin" })}
          style={{ animationDelay: "0ms" }}
          className="group animate-fade-up rounded-xl2 border border-sand bg-gradient-to-br from-cocoa/10 to-cocoa/20 p-6 text-left shadow-card transition-all hover:-translate-y-1 hover:shadow-soft focus:outline-none disabled:opacity-60"
        >
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-raspberry shadow-card transition-transform group-hover:scale-110">
            <Shield size={28} strokeWidth={1.8} />
          </div>
          <h2 className="font-display text-2xl font-semibold text-cocoa">Administrador</h2>
          <p className="mt-1 text-sm text-cocoa/60">Configuración, reportes y control del sistema.</p>
        </button>

        {/* Área de Trabajo */}
        <button
          disabled={!ready}
          onClick={() => setGate({ rol: "facturacion", titulo: "Acceso · Área de Trabajo", ruta: "/workspace" })}
          style={{ animationDelay: "60ms" }}
          className="group animate-fade-up rounded-xl2 border border-sand bg-gradient-to-br from-pistachio/10 to-mint/20 p-6 text-left shadow-card transition-all hover:-translate-y-1 hover:shadow-soft focus:outline-none disabled:opacity-60"
        >
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-raspberry shadow-card transition-transform group-hover:scale-110">
            <HomeIcon size={28} strokeWidth={1.8} />
          </div>
          <h2 className="font-display text-2xl font-semibold text-cocoa">Área de Trabajo</h2>
          <p className="mt-1 text-sm text-cocoa/60">Ingresa para comenzar tu jornada de trabajo.</p>
        </button>
      </section>

      {gate && (
        <AccessGate
          rol={gate.rol}
          titulo={gate.titulo}
          onClose={() => setGate(null)}
          onSuccess={() => { setGate(null); router.push(gate.ruta!); }}
        />
      )}
    </main>
  );
}
