"use client";
import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { useData } from "@/store/dataStore";
import { useSession } from "@/store/sessionStore";
import { Rol } from "@/types";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";

// Compuerta de acceso. Admin usa contraseña global; los demás roles
// requieren la contraseña de un local activo y fijan la sesión a ese local.
export function AccessGate({
  rol, onClose, onSuccess, titulo,
}: {
  rol: Rol;
  onClose: () => void;
  onSuccess: () => void;
  titulo?: string;
}) {
  const locales = useData((s) => s.locales);
  const loginAdmin = useSession((s) => s.loginAdmin);
  const loginLocal = useSession((s) => s.loginLocal);
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");

  const esAdmin = rol === "admin";

  const intentar = () => {
    if (esAdmin) {
      if (pwd === ADMIN_PASSWORD) { loginAdmin(); onSuccess(); }
      else setError("Contraseña de administrador incorrecta.");
      return;
    }
    const local = locales.find((l) => l.activo && l.password === pwd);
    if (local) { loginLocal(local.id); onSuccess(); }
    else setError("No hay ningún local activo con esa contraseña.");
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={titulo ?? (esAdmin ? "Acceso de Administrador" : `Acceso · ${labelRol(rol)}`)}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={intentar}>Ingresar</Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-cocoa/70">
        {esAdmin
          ? "Ingresa la contraseña de administrador."
          : "Ingresa la contraseña del local. Cada local funciona como un usuario independiente."}
      </p>
      <Input
        type="password"
        label="Contraseña"
        value={pwd}
        autoFocus
        onChange={(e) => { setPwd(e.target.value); setError(""); }}
        onKeyDown={(e) => e.key === "Enter" && intentar()}
        error={error}
        placeholder="••••••"
      />
    </Modal>
  );
}

function labelRol(rol: Rol) {
  const m: Record<Rol, string> = {
    cocina: "Cocina", facturacion: "Facturación", despachador: "Despachador",
    admin: "Admin", cajero: "Cajero",
  };
  return m[rol];
}
