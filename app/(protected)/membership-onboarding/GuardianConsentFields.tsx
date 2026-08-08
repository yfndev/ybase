"use client";

import { Input } from "@/components/ui/input";
import { GUARDIAN_CONSENT_TEXT } from "@/lib/members/guardianConsent";
import { OnboardingSignatureField } from "./OnboardingSignatureField";
import { Field } from "./ProfileFields";

export interface GuardianValues {
  name: string;
  email: string;
  signature: string;
}

export function GuardianConsentFields({
  values,
  update,
}: {
  values: GuardianValues;
  update: (field: keyof GuardianValues, value: string) => void;
}) {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <h2 className="font-semibold">
          Zustimmung der gesetzlichen Vertretung
        </h2>
        <p className="text-sm">{GUARDIAN_CONSENT_TEXT}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name der gesetzlichen Vertretung" htmlFor="guardian-name">
          <Input
            id="guardian-name"
            required
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
          />
        </Field>
        <Field label="E-Mailadresse der Vertretung" htmlFor="guardian-email">
          <Input
            id="guardian-email"
            type="email"
            required
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
          />
        </Field>
      </div>

      <Field label="Unterschrift gesetzliche Vertretung">
        <OnboardingSignatureField
          storageKey={values.signature || undefined}
          onChange={(storageKey) => update("signature", storageKey)}
        />
      </Field>
    </div>
  );
}
