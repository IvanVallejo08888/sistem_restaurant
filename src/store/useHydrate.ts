"use client";
import { useEffect, useState } from "react";
import { useData } from "./dataStore";
import { useSession } from "./sessionStore";

// Hidrata los stores desde la capa de servicios en el cliente.
export function useHydrate() {
  const [ready, setReady] = useState(false);
  const hydrateData = useData((s) => s.hydrate);
  const hydrateSession = useSession((s) => s.hydrate);
  useEffect(() => {
    let active = true;
    hydrateSession();
    hydrateData().finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [hydrateData, hydrateSession]);
  return ready;
}
