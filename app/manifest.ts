import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DARSHAN.AI - Smart Pilgrimage System",
    short_name: "DARSHAN.AI",
    description: "Intelligent crowd control and safety management for pilgrimages",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#93623f",
    icons: [
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshot1.png",
        sizes: "540x720",
        form_factor: "narrow",
        type: "image/png",
      },
      {
        src: "/screenshot2.png",
        sizes: "1280x720",
        form_factor: "wide",
        type: "image/png",
      },
    ],
    categories: ["utilities", "productivity"],
    prefer_related_applications: false,
  }
}
