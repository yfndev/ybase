import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MemberDrawerFormState } from "./useMemberDrawerForm";

export function MemberContactFields({ form }: { form: MemberDrawerFormState }) {
  return (
    <fieldset className="space-y-3 rounded-md border p-4">
      <legend className="px-1 text-sm font-medium">Private Kontaktdaten</legend>
      <div className="flex flex-col gap-2">
        <Label htmlFor="member-private-email">Private E-Mail</Label>
        <Input
          id="member-private-email"
          type="email"
          value={form.privateEmail}
          onChange={(event) => form.setPrivateEmail(event.target.value)}
          placeholder="name@beispiel.de"
          autoComplete="email"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="member-phone">Telefonnummer</Label>
        <Input
          id="member-phone"
          type="tel"
          value={form.phone}
          onChange={(event) => form.setPhone(event.target.value)}
          placeholder="+49 170 1234567"
          autoComplete="tel"
          maxLength={40}
        />
      </div>
    </fieldset>
  );
}
