import type { MetadataRoute } from "next";

// Icons are cached for a year, so bump ?v= whenever the icon artwork changes.

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wobs",
    short_name: "Wobs",
    description: "When a class wobbles, Wobs steadies it. Last-minute Pilates cover, filled in minutes.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#120A33",
    theme_color: "#120A33",
    icons: [
      { src: "/app-icon/192?v=wobs1", sizes: "192x192", type: "image/png" },
      { src: "/app-icon/512?v=wobs1", sizes: "512x512", type: "image/png" },
      { src: "/app-icon/maskable-512?v=wobs1", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
