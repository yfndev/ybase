import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { GeistMono } from "geist/font/mono";
import { Lexend_Deca } from "next/font/google";
import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";

import "./globals.css";
import { ConvexClientProvider } from "./provider/ConvexClientProvider";

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
    <ConvexAuthNextjsServerProvider>
      <html lang="en">
        <body
          className={`${lexendDeca.variable} ${GeistMono.variable} antialiased`}
          suppressHydrationWarning
        >
          <ConvexClientProvider>
            {children}
            <Toaster position="bottom-center" />
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
