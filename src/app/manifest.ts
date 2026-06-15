import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Heladería Antojos",
    short_name: "Antojos",
    description: "Sistema de operación para Heladería Antojos",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF6EF",
    theme_color: "#D63B6A",
    orientation: "portrait",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
