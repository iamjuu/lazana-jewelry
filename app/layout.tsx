import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import WhatsAppFloating from "@/components/WhatsAppFloating";

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
      <body className="antialiased">
        {children}
        <WhatsAppFloating />
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
