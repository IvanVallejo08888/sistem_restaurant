"use client";
import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Share2 } from "lucide-react";
import { Factura } from "@/types";
import { folio } from "@/lib/factura";
import { FacturaView } from "./FacturaView";
import { Button } from "@/components/ui/Button";

// Factura electrónica con exportación a PNG y compartir nativo.
export function CompartirFactura({ factura }: { factura: Factura }) {
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
      a.download = `factura-${folio(factura)}.png`;
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
      const file = new File([blob], `factura-${folio(factura)}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: `Factura ${folio(factura)}` });
      } else {
        await descargar(); // respaldo si el dispositivo no soporta compartir archivos
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
        <FacturaView factura={factura} />
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
