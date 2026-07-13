import { QueryProvider } from "@/lib/query/QueryProvider";
import { GeistMono } from "geist/font/mono";
import type { Metadata } from "next";
import { Readex_Pro } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

import "./globals.css";

const readexPro = Readex_Pro({
  subsets: ["latin"],
  variable: "--font-readex",
});

export const metadata: Metadata = {
  title: "YBase",
  description: "Budgetverwaltung für Vereine und Organisationen",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${readexPro.variable} ${GeistMono.variable}`}>
      <body className="antialiased" suppressHydrationWarning>
        <SessionProvider>
          <QueryProvider>
            {children}
            <Toaster position="bottom-center" />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
