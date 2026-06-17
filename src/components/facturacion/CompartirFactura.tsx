"use client";
import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Share2, FileText, Loader2 } from "lucide-react";
import { Factura } from "@/types";
import { folio } from "@/lib/factura";
import { generarFacturaPDF } from "@/lib/generarFacturaPDF";
import { useData } from "@/store/dataStore";
import { FacturaView } from "./FacturaView";
import { Button } from "@/components/ui/Button";

// Factura electrónica con dos formas de compartir:
// - "Compartir factura": imagen PNG simple (comportamiento original, sin cambios).
// - "Factura electrónica PRO": PDF con el formato de factura de venta completo.
// generarPng() se mantiene exportada vía el componente porque otros módulos
// (o una futura opción "Descargar PNG") pueden seguir necesitándola.
export function CompartirFactura({ factura }: { factura: Factura }) {
  const ref = useRef<HTMLDivElement>(null);
  const local = useData((s) => s.locales.find((l) => l.id === factura.localId));
  const [busy, setBusy] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const generarPng = async (): Promise<Blob | null> => {
    if (!ref.current) return null;
    const dataUrl = await toPng(ref.current, { pixelRatio: 2, backgroundColor: "#FFFBF4" });
    const res = await fetch(dataUrl);
    return res.blob();
  };

  const descargarPng = async (): Promise<void> => {
    const blob = await generarPng();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `factura-${folio(factura)}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const compartirFactura = async () => {
    setBusy(true);
    try {
      const blob = await generarPng();
      if (!blob) return;
      const file = new File([blob], `factura-${folio(factura)}.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: `Factura ${folio(factura)}` });
      } else {
        await descargarPng(); // respaldo si el dispositivo no soporta compartir archivos
      }
    } catch {
      /* el usuario canceló el diálogo de compartir */
    } finally {
      setBusy(false);
    }
  };

  const compartirFacturaPro = async () => {
    setGenerandoPDF(true);
    try {
      const pdfFile = await generarFacturaPDF(factura, local?.nombre || "Heladería Antojos");
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.share && nav.canShare && nav.canShare({ files: [pdfFile] })) {
        await nav.share({ files: [pdfFile], title: `Factura ${folio(factura)}` });
      } else {
        // Sin soporte de compartir archivos (típico en escritorio): abrir el PDF en una pestaña nueva.
        const url = URL.createObjectURL(pdfFile);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } catch (e) {
      console.error("No se pudo generar la factura electrónica PRO:", e);
    } finally {
      setGenerandoPDF(false);
    }
  };

  return (
    <div>
      <div ref={ref}>
        <FacturaView factura={factura} />
      </div>
      <div className="mt-4 flex gap-3">
        <Button className="flex-1" onClick={compartirFactura} disabled={busy || generandoPDF}>
          <Share2 size={16} /> Compartir factura
        </Button>
        <Button variant="outline" className="flex-1" onClick={compartirFacturaPro} disabled={busy || generandoPDF}>
          {generandoPDF ? (
            <><Loader2 size={16} className="animate-spin" /> Generando PDF…</>
          ) : (
            <><FileText size={16} /> Factura electrónica PRO</>
          )}
        </Button>
      </div>
    </div>
  );
}
