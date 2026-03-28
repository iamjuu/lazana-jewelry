import type { Metadata } from "next";
import localFont from "next/font/local";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import WhatsAppFloating from "@/components/WhatsAppFloating";

// Adobe Typekit - The Seasons Bold (licensed)
// Font family: "the-seasons", Weight: 700, Style: normal
// Stylesheet loaded via <link> tag in metadata

// Google Fonts - Playfair Display (free fallback if Typekit fails)
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-playfair-display",
  display: "swap",
});

// Touvlo Regular font configuration
const touvloRegular = localFont({
  src: [
    {
      path: "../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/touvlo-regular-maisfontes.464c/touvlo-regular.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-touvlo-regular",
  display: "swap",
});

// Ivy Mode font configuration
const ivyMode = localFont({
  src: [
    {
      path: "../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/ivy-mode/IvyMode-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/ivy-mode/IvyMode-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/ivy-mode/IvyMode-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/ivy-mode/IvyMode-LightItalic.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/ivy-mode/IvyMode-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/ivy-mode/IvyMode-SemiBoldItalic.woff2",
      weight: "600",
      style: "italic",
    },
    {
      path: "../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/ivy-mode/IvyMode-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../font/Cinzel,DM_Sans,Inter,Manrope,Montserrat,etc (7)/ivy-mode/IvyMode-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-ivy-mode",
  display: "swap",
});

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
  title: "Lazana Jewelry",
  description: "Discover fine jewelry and curated pieces at Lazana Jewelry",
  icons: {
    icon: [
      { url: "/assets/icon/android-chrome-512x512.png", sizes: "16x16", type: "image/png" },
      { url: "/assets/icon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/icon/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/icon/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/assets/icon/favicon-32x32.png",
    apple: [
      { url: "/assets/icon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  other: {
    "typekit-link": '<link rel="stylesheet" href="https://use.typekit.net/kwh6vpp.css" />',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/kwh6vpp.css" />
      </head>
      <body className={`${montserrat.variable} ${touvloRegular.variable} ${ivyMode.variable} ${playfairDisplay.variable}`}>
        {children}  
        <WhatsAppFloating />
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
