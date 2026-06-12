import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { FloatingChat } from "@/components/FloatingChat";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Grupo RAMMAN",
  description: "Sistema de Gestão de Consignados",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <AuthProvider>
          {children}
          <FloatingChat />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
