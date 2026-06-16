"use client";
import { useEffect, useState } from "react";
import { useData } from "./dataStore";
import { useSession } from "./sessionStore";

// Cada cuántos ms se vuelve a consultar Supabase para sincronizar datos entre dispositivos.
// Solo activo cuando NEXT_PUBLIC_USE_BACKEND=true (en localStorage no tiene sentido).
const POLL_INTERVAL_MS = 5_000;
const USE_BACKEND = process.env.NEXT_PUBLIC_USE_BACKEND === "true";

// Hidrata los stores desde la capa de servicios en el cliente.
// Si el backend está activo, mantiene los datos sincronizados con polling automático.
export function useHydrate() {
  const [ready, setReady] = useState(false);
  const hydrateData = useData((s) => s.hydrate);
  const refresh = useData((s) => s.refresh);
  const hydrateSession = useSession((s) => s.hydrate);

  useEffect(() => {
    let active = true;
    hydrateSession();
    hydrateData().finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [hydrateData, hydrateSession]);

  // Polling: solo cuando hay backend real y la pestaña está visible
  useEffect(() => {
    if (!USE_BACKEND) return;

    const tick = () => {
      if (document.visibilityState === "visible") refresh();
    };

    const id = setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", tick);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);

  return ready;
}
