"use client";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut } from "lucide-react";
import { useHydrate } from "@/store/useHydrate";
import { useSession } from "@/store/sessionStore";
import { useData } from "@/store/dataStore";
import { Button } from "@/components/ui/Button";

// Cáscara común para todas las áreas. Verifica acceso y muestra el local activo.
export function AreaShell({
  title, requireKind = "local", children, sidebar,
}: {
  title: string;
  requireKind?: "admin" | "local";
  children: ReactNode;
  sidebar?: ReactNode;
}) {
  const ready = useHydrate();
  const router = useRouter();
  const { kind, localId, logout } = useSession();
  const local = useData((s) => s.locales.find((l) => l.id === localId));

  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-cocoa/50">Cargando…</div>;
  }

  const autorizado =
    requireKind === "admin" ? kind === "admin" : kind === "local" && !!local;

  if (!autorizado) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <p className="font-display text-2xl font-semibold text-cocoa">Acceso requerido</p>
          <p className="mt-2 text-cocoa/60">Vuelve al inicio e ingresa con la contraseña correspondiente.</p>
          <Button className="mt-6" onClick={() => router.push("/")}>Ir al inicio</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sand bg-cream/90 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/")} className="rounded-full p-2 hover:bg-sand" aria-label="Inicio">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-display text-xl font-semibold leading-tight text-cocoa">{title}</h1>
            {local && <p className="text-xs text-cocoa/60">{local.nombre}</p>}
            {requireKind === "admin" && <p className="text-xs text-cocoa/60">Administrador</p>}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { logout(); router.push("/"); }}>
          <LogOut size={16} /> Salir
        </Button>
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        {sidebar}
        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
