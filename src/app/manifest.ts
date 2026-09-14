import type { MetadataRoute } from "next";

import { brand } from "@/config/brand";

/**
 * PWA web app manifest — icons already generated under /brand/icons.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.name,
    description:
      "Majetio — analytická realitní platforma. Než koupíte, mějte jasno.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1419",
    theme_color: "#0f1419",
    lang: "cs",
    icons: [
      {
        src: "/brand/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/brand/icons/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
