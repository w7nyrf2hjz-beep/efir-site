import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ЭФИР — Доставка еды",
    template: "%s | ЭФИР",
  },
  description:
    "Казахская кухня с доставкой на дом. Ресторан ЭФИР — готовим с любовью из натуральных продуктов.",
  keywords: ["ЭФИР", "ресторан", "доставка еды", "казахская кухня", "Казахстан"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ЭФИР",
  },
  openGraph: {
    title: "ЭФИР — Доставка еды",
    description: "Казахская кухня с доставкой на дом",
    type: "website",
    locale: "ru_KZ",
  },
};

export const viewport: Viewport = {
  themeColor: "#f59e0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-zinc-950 text-white antialiased font-inter">
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#18181b",
              color: "#fff",
              border: "1px solid #3f3f46",
              borderRadius: "12px",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "#f59e0b", secondary: "#000" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
