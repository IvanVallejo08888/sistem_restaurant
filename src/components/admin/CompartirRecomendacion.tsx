"use client";
import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Share2 } from "lucide-react";
import { Recomendacion } from "@/types";
import { formatFechaCO, formatHoraCO } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

// Mismo patrón de "Compartir" que CompartirFactura.tsx: html-to-image (toPng) +
// Web Share API con fallback a descarga si el navegador no soporta compartir archivos.
export function CompartirRecomendacion({ recomendacion }: { recomendacion: Recomendacion }) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const generarPng = async (): Promise<Blob | null> => {
    if (!ref.current) return null;
    const dataUrl = await toPng(ref.current, { pixelRatio: 2, backgroundColor: "#FFFBF4" });
    const res = await fetch(dataUrl);
    return res.blob();
  };

  const descargar = async () => {
    setBusy(true);
    try {
      const blob = await generarPng();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recomendacion-${recomendacion.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  const compartir = async () => {
    setBusy(true);
    try {
      const blob = await generarPng();
      if (!blob) return;
      const file = new File([blob], `recomendacion-${recomendacion.id}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: `Recomendación · ${recomendacion.localNombre}` });
      } else {
        await descargar();
      }
    } catch {
      /* el usuario canceló el diálogo de compartir */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div ref={ref}>
        <div className="rounded-xl2 border border-sand bg-vanilla p-5">
          <div className="text-center">
            <p className="font-display text-xl font-black text-cocoa">{recomendacion.localNombre}</p>
            <p className="text-xs text-cocoa/60">
              {formatFechaCO(recomendacion.creadoEn)} · {formatHoraCO(recomendacion.creadoEn)}
            </p>
          </div>
          <div className="my-3 border-t border-dashed border-sand" />
          <p className="whitespace-pre-wrap text-sm text-cocoa/80">{recomendacion.mensaje}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={descargar} disabled={busy}>
          <Download size={16} /> Descargar PNG
        </Button>
        <Button className="flex-1" onClick={compartir} disabled={busy}>
          <Share2 size={16} /> Compartir
        </Button>
      </div>
    </div>
  );
}
