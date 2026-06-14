// Punto único de selección de implementación.
// Para migrar a backend real: importa HttpService y cámbialo aquí.
// Nada más en la app necesita cambiar.

import { DataService } from "./types";
import { LocalStorageService } from "./localStorageService";
import { HttpService } from "./httpService";

const USE_BACKEND = process.env.NEXT_PUBLIC_USE_BACKEND === "true";
export const dataService: DataService = USE_BACKEND ? new HttpService() : new LocalStorageService();

export type { DataService };
