import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NyayaFlow",
    short_name: "NyayaFlow",
    description: "A clear path for government grievances.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F2E9",
    theme_color: "#F6F2E9",
    orientation: "portrait",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
