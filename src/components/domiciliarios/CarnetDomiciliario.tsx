import { Domiciliario } from "@/types";

// Número de contacto de la empresa para el carnet. No es un dato fiscal (ver
// lib/configuracionEmpresa.ts), así que vive aparte como constante simple.
const TELEFONO_EMPRESA = "312 2676577";

// Carnet profesional de domiciliario, pensado para rasterizarse con
// html-to-image y empotrarse en un PDF (ver generarCarnetPDF en
// DomiciliariosPanel.tsx). Tamaño fijo en px para que la captura sea
// consistente sin depender del layout de la página donde se monte.
export function CarnetDomiciliario({
  domiciliario,
  nombreLocal,
}: {
  domiciliario: Domiciliario;
  nombreLocal: string;
}) {
  return (
    <div
      className="flex flex-col overflow-hidden bg-vanilla"
      style={{ width: 320, height: 520 }}
    >
      {/* Encabezado de marca */}
      <div className="flex items-center gap-2 bg-raspberry px-4 py-3">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-original.jpeg" alt="Logo" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-black leading-tight text-white">{nombreLocal || "-"}</p>
          <p className="text-[10px] leading-tight text-white/80">{TELEFONO_EMPRESA}</p>
        </div>
      </div>

      <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-raspberry">
        Carnet de domiciliario
      </p>

      {/* Foto */}
      <div className="mt-3 flex justify-center">
        <div className="h-32 w-32 overflow-hidden rounded-2xl border-4 border-raspberry-light bg-sand">
          {domiciliario.fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={domiciliario.fotoUrl} alt={domiciliario.nombreCompleto} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-3xl font-black text-cocoa/30">
              {domiciliario.nombreCompleto.charAt(0).toUpperCase() || "?"}
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 px-3 text-center font-display text-lg font-black leading-tight text-cocoa">
        {domiciliario.nombreCompleto}
      </p>

      {/* Datos */}
      <div className="mx-4 mt-3 flex-1 space-y-2 rounded-xl bg-white/70 p-3">
        <FilaCarnet label="Identificación" valor={domiciliario.identificacion} />
        <FilaCarnet label="Correo" valor={domiciliario.correo} />
        <FilaCarnet label="Teléfono" valor={domiciliario.whatsapp} />
        <FilaCarnet label="Tipo de sangre" valor={domiciliario.tipoSangre} />
        <FilaCarnet label="Local" valor={nombreLocal} />
      </div>

      <div className="bg-raspberry py-2 text-center text-[10px] font-bold text-white">
        {nombreLocal || "-"}
      </div>
    </div>
  );
}

function FilaCarnet({ label, valor }: { label: string; valor?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-sand pb-1 last:border-b-0">
      <span className="text-[10px] font-semibold text-cocoa/60">{label}</span>
      <span className="truncate text-right text-xs font-bold text-cocoa">{valor || "-"}</span>
    </div>
  );
}
