"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initializeOrganization } from "@/lib/server/organizations/actions";

export function OrgOnboarding() {
  const { update } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await initializeOrganization({
        organizationName: name.trim() || undefined,
      });
      await update();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Etwas ist schiefgelaufen");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">Wie heißt dein Verein?</h1>
        <p className="text-muted-foreground text-sm">
          Lege deinen Verein an, um loszulegen.
        </p>
        <Input
          aria-label="Wie heißt dein Verein?"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Young Founders Network"
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleSubmit();
          }}
        />
        <Button className="w-full" onClick={handleSubmit} disabled={loading}>
          Loslegen
        </Button>
      </div>
    </div>
  );
}
