import { create } from "zustand";
import { storage } from "@/lib/storage";

// Sesión de acceso. "admin" o un localId concreto.
type Session = {
  kind: "admin" | "local" | null;
  localId: string | null;
  hydrated: boolean;
  hydrate: () => void;
  loginAdmin: () => void;
  loginLocal: (localId: string) => void;
  logout: () => void;
};

const KEY = "session";

type Persisted = Pick<Session, "kind" | "localId">;

const persist = (s: Session) =>
  storage.save<Persisted>(KEY, { kind: s.kind, localId: s.localId });

export const useSession = create<Session>((set, get) => ({
  kind: null,
  localId: null,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    const d = storage.load<Persisted>(KEY, { kind: null, localId: null });
    set({ ...d, hydrated: true });
  },
  loginAdmin: () => set((s) => { const ns = { ...s, kind: "admin" as const, localId: null }; persist(ns); return ns; }),
  loginLocal: (localId) => set((s) => { const ns = { ...s, kind: "local" as const, localId }; persist(ns); return ns; }),
  logout: () => set((s) => { const ns = { ...s, kind: null, localId: null }; persist(ns); return ns; }),
}));
