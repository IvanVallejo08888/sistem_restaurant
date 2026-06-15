import { z } from "zod";

export const localSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres"),
  direccion: z.string().min(2, "Ingresa una dirección"),
  password: z.string().min(4, "Mínimo 4 caracteres"),
});
export type LocalForm = z.infer<typeof localSchema>;

export const productoSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  valor: z.coerce.number().min(0, "Valor inválido"),
});
export type ProductoForm = z.infer<typeof productoSchema>;

export const domiciliarioSchema = z.object({
  nombreCompleto: z.string().min(2, "Nombre requerido"),
  correo: z.string().email("Correo inválido"),
  whatsapp: z.string().min(7, "WhatsApp inválido"),
  identificacion: z.string().min(4, "Identificación inválida"),
  fotoUrl: z.string().optional().default(""),
});
export type DomiciliarioForm = z.infer<typeof domiciliarioSchema>;

export const mesaSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
});
export type MesaForm = z.infer<typeof mesaSchema>;

export const gastoSchema = z.object({
  descripcion: z.string().min(1, "Nombre requerido"),
  medioPago: z.enum(["efectivo", "nequi", "bancolombia", "daviplata", "datafono"]),
  valor: z.coerce.number().min(1, "Valor inválido"),
});
export type GastoForm = z.infer<typeof gastoSchema>;
