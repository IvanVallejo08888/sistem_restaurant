// Datos legales/fiscales de la empresa para la "Factura electrónica PRO" (PDF).
// El nombre del local ya se toma de la tabla `locales` (ver generarFacturaPDF.ts);
// estos son los datos que NO existen en el modelo de datos y deben llenarse a mano.
//
// IMPORTANTE: los campos de resolución DIAN/NIT se dejan vacíos a propósito.
// Mostrar un número de resolución DIAN inventado en un documento que se llama
// "factura electrónica" sería presentar un dato fiscal falso. generarFacturaPDF.ts
// solo imprime estas líneas si el campo correspondiente no está vacío.
export const EMPRESA = {
  nit: "",
  telefono: "",
  ciudad: "",
  resolucionDIAN: "",
  resolucionFecha: "",
  rangoDesde: "",
  rangoHasta: "",
  mensajePie: "¡Gracias por su compra!",
};
