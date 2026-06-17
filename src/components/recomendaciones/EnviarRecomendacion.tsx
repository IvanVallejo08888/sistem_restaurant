"use client";
import { useState } from "react";
import { Check, CircleAlert, Send } from "lucide-react";
import { useData } from "@/store/dataStore";
import { useSession } from "@/store/sessionStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function EnviarRecomendacion() {
  const localId = useSession((s) => s.localId)!;
  const local = useData((s) => s.locales.find((l) => l.id === localId));
  const addRecomendacion = useData((s) => s.addRecomendacion);

  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = async () => {
    if (!mensaje.trim() || enviando) return;
    setError(null);
    setEnviando(true);
    try {
      await addRecomendacion({
        localId,
        localNombre: local?.nombre ?? "",
        mensaje: mensaje.trim(),
      });
      setMensaje("");
      setOk(true);
      setTimeout(() => setOk(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar la recomendación.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      {ok && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-pistachio/30 px-4 py-3 font-bold text-cocoa animate-fade-up">
          <Check size={18} /> Recomendación enviada correctamente.
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-100 px-4 py-3 font-bold text-red-700 animate-fade-up">
          <CircleAlert size={18} /> No se pudo enviar: {error}
        </div>
      )}

      <Card className="p-6">
        <h2 className="font-display text-2xl font-black text-cocoa">
          ¡Escribe las recomendaciones que tienes para el jefe!
        </h2>
        <p className="mt-1 text-sm text-cocoa/50">Surtir local, etc.</p>

        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Escribe aquí lo que debe traer el jefe en este punto…"
          rows={6}
          className="mt-5 w-full rounded-xl2 border border-sand bg-vanilla px-4 py-3 text-center text-cocoa placeholder:text-cocoa/40 transition focus:border-raspberry focus:outline-none"
        />

        <Button
          className="mt-4 w-full"
          size="lg"
          disabled={!mensaje.trim() || enviando}
          onClick={enviar}
        >
          <Send size={16} /> {enviando ? "Enviando…" : "Enviar recomendación"}
        </Button>
      </Card>
    </div>
  );
}
