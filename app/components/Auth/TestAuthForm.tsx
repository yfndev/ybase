"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TestAuthForm({
  callbackUrl = "/dashboard",
}: {
  callbackUrl?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("user@test.com");
  const [name, setName] = useState("Test User");
  const [status, setStatus] = useState("");

  async function handleSubmit() {
    setStatus("Authenticating...");
    const result = await signIn("testing", {
      email,
      name,
      redirect: false,
    });
    if (result?.error) {
      setStatus(`Error: ${result.error}`);
      return;
    }
    router.push(callbackUrl);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Test Authentication</h1>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          data-testid="test-auth-email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
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

      {status ? <div data-testid="test-auth-status">{status}</div> : null}
    </div>
  );
}
