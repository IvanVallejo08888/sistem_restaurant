"use client";
import { useRef } from "react";
import { Camera } from "lucide-react";

// Lee una imagen local y la convierte a dataURL (persistible en LocalStorage).
export function PhotoInput({
  value, onChange,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const handle = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  };
  return (
    <div className="flex items-center gap-4">
      <div className="h-20 w-20 overflow-hidden rounded-2xl border border-sand bg-sand">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Foto" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-cocoa/30">
            <Camera size={26} />
          </div>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="rounded-full bg-sand px-4 py-2 text-sm font-bold text-cocoa hover:bg-raspberry-light"
        >
          Subir foto
        </button>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handle(e.target.files?.[0])}
        />
        <p className="mt-1 text-xs text-cocoa/50">JPG o PNG</p>
      </div>
    </div>
  );
}
