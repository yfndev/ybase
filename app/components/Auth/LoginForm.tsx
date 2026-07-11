"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

type LoginFormProps = {
  isDevelopmentLoginEnabled: boolean;
};

const DEVELOPMENT_USER = {
  email: "info@youngfounders.network",
  name: "Local Developer",
};

export function LoginForm({ isDevelopmentLoginEnabled }: LoginFormProps) {
  function handleSignIn() {
    if (isDevelopmentLoginEnabled) {
      void signIn("development", {
        ...DEVELOPMENT_USER,
        callbackUrl: "/dashboard",
      });
      return;
    }

    void signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <div className="flex flex-col items-center gap-12 text-center">
      <Image
        src="/LoginIllustration.svg"
        alt="YBase"
        width={350}
        height={350}
        priority
      />
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          Willkommen bei <span className="text-primary">YBase</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          {isDevelopmentLoginEnabled
            ? "Lokale Entwicklungsumgebung"
            : "Melde dich mit deinem Google Konto an, um direkt loszulegen."}
        </p>
      </div>

      <Button
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleSignIn}
      >
        {isDevelopmentLoginEnabled ? null : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="size-5"
            aria-hidden="true"
          >
            <path
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              fill="currentColor"
            />
          </svg>
        )}
        {isDevelopmentLoginEnabled ? "Lokal anmelden" : "Mit Google anmelden"}
      </Button>

      <p className="text-xs text-muted-foreground">
        Durch das Anmelden stimmst du unseren{" "}
        <Link href="/datenschutz" className="underline hover:text-foreground">
          Datenschutzrichtlinien
        </Link>{" "}
        zu.
      </p>
    </div>
  );
}
