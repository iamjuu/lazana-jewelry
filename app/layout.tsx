import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import WhatsAppFloating from "@/components/WhatsAppFloating";

// Montserrat font configuration
const montserrat = localFont({
  src: [
    {
      path: "../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/Montserrat/static/Montserrat-Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/Montserrat/static/Montserrat-ExtraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/Montserrat/static/Montserrat-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/Montserrat/static/Montserrat-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/Montserrat/static/Montserrat-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/Montserrat/static/Montserrat-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/Montserrat/static/Montserrat-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/Montserrat/static/Montserrat-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/Montserrat/static/Montserrat-Black.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Crystal Bowl Studio - Healing Through Sound",
  description: "Experience the healing power of crystal singing bowls and yoga sessions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} font-montserrat antialiased`}>
        {children}
        <WhatsAppFloating />
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
