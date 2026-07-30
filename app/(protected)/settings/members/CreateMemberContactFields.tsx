import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  privateEmail: string;
  phone: string;
  onPrivateEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}

export function CreateMemberContactFields({
  privateEmail,
  phone,
  onPrivateEmailChange,
  onPhoneChange,
}: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="manual-member-private-email">Private E-Mail</Label>
        <Input
          id="manual-member-private-email"
          type="email"
          value={privateEmail}
          onChange={(event) => onPrivateEmailChange(event.target.value)}
          placeholder="name@beispiel.de"
          autoComplete="email"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="manual-member-phone">Telefonnummer</Label>
        <Input
          id="manual-member-phone"
          type="tel"
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          placeholder="+49 170 1234567"
          autoComplete="tel"
          maxLength={40}
        />
      </div>
    </div>
  );
}
