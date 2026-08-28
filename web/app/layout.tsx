import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "../components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "NyayaFlow — File with confidence",
  description: "A clear, citizen-friendly path for government grievances.",
  applicationName: "NyayaFlow",
};

export const viewport: Viewport = {
  themeColor: "#F6F2E9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
