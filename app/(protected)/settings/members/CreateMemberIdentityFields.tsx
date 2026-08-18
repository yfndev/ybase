import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { YFN_ORGANIZATION } from "@/lib/organization";

interface Props {
  name: string;
  email: string;
  children: ReactNode;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
}

export function CreateMemberIdentityFields({
  name,
  email,
  children,
  onNameChange,
  onEmailChange,
}: Props) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="manual-member-name">Name*</Label>
        <Input
          id="manual-member-name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Vor- und Nachname"
          autoComplete="name"
          maxLength={120}
          required
          autoFocus
        />
      </div>
      {children}
      <div className="flex flex-col gap-2">
        <Label htmlFor="manual-member-email">YFN-E-Mail*</Label>
        <Input
          id="manual-member-email"
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder={`vorname.nachname@${YFN_ORGANIZATION.domain}`}
          autoComplete="email"
          required
        />
      </div>
    </>
  );
}
