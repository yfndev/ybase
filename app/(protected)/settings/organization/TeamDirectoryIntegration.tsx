"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Check, Copy, KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export function TeamDirectoryIntegration() {
  const [token, setToken] = useState("");
  const [isRotating, setIsRotating] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const rotateToken = async () => {
    setIsRotating(true);
    setHasCopied(false);
    try {
      const response = await fetch("/api/team-directory-token", {
        method: "POST",
      });
      const body = (await response.json()) as {
        data?: { token?: string };
        error?: string;
      };
      if (!response.ok || !body.data?.token) {
        throw new Error(body.error || "Token konnte nicht erstellt werden");
      }
      setToken(body.data.token);
      toast.success("Team-Directory-Token erstellt");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Erstellen",
      );
    } finally {
      setIsRotating(false);
    }
  };

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setHasCopied(true);
      toast.success("Token kopiert");
    } catch {
      toast.error("Token konnte nicht kopiert werden");
    }
  };

  return (
    <section className="mt-10 space-y-4 border-t pt-8">
      <div className="flex items-start gap-3">
        <div className="bg-muted rounded-md p-2">
          <KeyRound className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-medium">Team-Seiten-Integration</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Erstellt den serverseitigen Leseschlüssel für yfn-landing. Ein neuer
            Schlüssel macht einen bestehenden sofort ungültig.
          </p>
        </div>
      </div>

      {token ? (
        <div className="bg-muted/40 grid gap-3 rounded-md border p-4">
          <p className="text-sm font-medium">
            Jetzt kopieren – der Schlüssel wird nur einmal angezeigt.
          </p>
          <div className="flex gap-2">
            <Input
              aria-label="Team-Directory-Token"
              value={token}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              onClick={copyToken}
              aria-label="Token kopieren"
            >
              {hasCopied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              Kopieren
            </Button>
          </div>
        </div>
      ) : null}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="outline" disabled={isRotating}>
            {isRotating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" />
            )}
            Neuen Leseschlüssel erstellen
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leseschlüssel neu erstellen?</AlertDialogTitle>
            <AlertDialogDescription>
              Ein bestehender Schlüssel wird sofort ungültig. Aktualisiere
              anschließend YBASE_TEAM_DIRECTORY_TOKEN auf yfn-landing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={rotateToken}>
              Schlüssel erstellen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
