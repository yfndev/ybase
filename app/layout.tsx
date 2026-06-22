import { QueryProvider } from "@/lib/query/QueryProvider";
import { GeistMono } from "geist/font/mono";
import type { Metadata } from "next";
import { Lexend_Deca } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

import "./globals.css";

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "YBase",
  description: "Budget management for organizations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${lexendDeca.variable} ${GeistMono.variable} antialiased`}
        suppressHydrationWarning
      >
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
