"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  name: string;
  email: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
};

export function SubmitterSection(props: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Deine Angaben</h2>
      <div className="grid gap-4">
        <div>
          <Label>Name *</Label>
          <Input
            value={props.name}
            onChange={(e) => props.onNameChange(e.target.value)}
            placeholder="Vor- und Nachname"
          />
        </div>
        <div>
          <Label>E-Mail *</Label>
          <Input
            type="email"
            value={props.email}
            onChange={(e) => props.onEmailChange(e.target.value)}
            placeholder="deine@email.de"
          />
        </div>
      </div>
    </div>
  );
}
