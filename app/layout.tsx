import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo",
});

const DESCRIPCION =
  "El motor conversacional que automatiza el recambio de vehículos en " +
  "concesionarias uruguayas. Dejá tu número y el agente te llama ahora.";

export const metadata: Metadata = {
  metadataBase: new URL("https://auglo.uy"),
  title: "Auglo — agentes de voz para concesionarias",
  description: DESCRIPCION,
  openGraph: {
    title: "Auglo",
    description: DESCRIPCION,
    url: "https://auglo.uy",
    siteName: "Auglo",
    locale: "es_UY",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#14100f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-UY" className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
