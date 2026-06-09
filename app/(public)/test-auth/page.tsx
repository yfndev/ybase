"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TestAuthPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState("user@test.com");
  const [name, setName] = useState("Test User");
  const [status, setStatus] = useState("");

  const handleSubmit = async () => {
    setStatus("Authenticating...");
    try {
      await signIn("testing", { email, name });
      router.push("/reimbursements");
    } catch (error) {
      setStatus(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Test Authentication</h1>
        <p className="text-muted-foreground">
          Only available in test environments.
        </p>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="test-auth-email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="test-auth-name"
          />
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full"
          data-testid="test-auth-submit"
        >
          Authenticate
        </Button>

        {status && <div data-testid="test-auth-status">{status}</div>}
      </div>
    </div>
  );
}
