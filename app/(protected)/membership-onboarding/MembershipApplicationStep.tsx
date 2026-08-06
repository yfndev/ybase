"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitOwnMembershipApplication } from "@/lib/server/memberships/membershipApplication";
import type { MembershipOnboardingContext } from "@/lib/server/memberships/onboardingData";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import {
  type ApplicationValues,
  MembershipApplicationFields,
} from "./MembershipApplicationFields";
import { OnboardingSignatureField } from "./OnboardingSignatureField";
import { Confirmation, Field } from "./ProfileFields";

const CONFIRMATION_TEXTS = {
  profile:
    "Ich bestätige, dass meine oben angegebenen persönlichen Daten vollständig und richtig sind.",
  privacy:
    "Ich habe die Datenschutzgrundverordnung gelesen und akzeptiere sie.",
  purposes: "Ich unterstütze die in der Satzung festgelegten Vereinszwecke.",
};

export function MembershipApplicationStep({
  profile,
  onComplete,
}: {
  profile: MembershipOnboardingContext["profile"];
  onComplete: () => Promise<void>;
}) {
  const [values, setValues] = useState<ApplicationValues>({
    privateEmail: profile.privateEmail,
    phone: profile.phone,
    gender: profile.gender ?? "",
    street: profile.address.street,
    postalCode: profile.address.postalCode,
    city: profile.address.city,
    country: profile.address.country,
    place: profile.address.city,
  });
  const [signature, setSignature] = useState("");
  const [confirmed, setConfirmed] = useState({
    profile: false,
    privacy: false,
    purposes: false,
  });
  const [isPending, startTransition] = useTransition();
  const allConfirmed = Object.values(confirmed).every(Boolean);

  function update(field: keyof ApplicationValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const gender = values.gender;
    if (!gender) {
      toast.error("Bitte wähle dein Geschlecht.");
      return;
    }
    if (!signature) {
      toast.error("Bitte unterschreibe den Mitgliedsantrag.");
      return;
    }
    startTransition(async () => {
      try {
        await submitOwnMembershipApplication({
          ...values,
          gender,
          signatureStorageKey: signature,
          profileDataConfirmed: true,
          privacyAccepted: true,
          supportsAssociationPurposes: true,
        });
        await onComplete();
        toast.success("Mitgliedsantrag unterschrieben.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Speichern fehlgeschlagen",
        );
      }
    });
  }

  return (
    <section
      className="mx-auto w-full max-w-[1024px]"
      aria-label="Mitgliedsantrag"
    >
      <form className="space-y-6" onSubmit={submit}>
        <MembershipApplicationFields
          profile={profile}
          values={values}
          update={update}
        />

        <div className="space-y-4 border-2 border-input bg-muted/40 p-4">
          {Object.entries(CONFIRMATION_TEXTS).map(([key, text]) => (
            <Confirmation
              key={key}
              id={`membership-confirm-${key}`}
              checked={confirmed[key as keyof typeof confirmed]}
              onCheckedChange={(checked) =>
                setConfirmed((current) => ({ ...current, [key]: checked }))
              }
            >
              {text}
            </Confirmation>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ort" htmlFor="membership-place">
            <Input
              id="membership-place"
              required
              value={values.place}
              onChange={(event) => update("place", event.target.value)}
            />
          </Field>
          <Field label="Datum">
            <Input value={new Date().toLocaleDateString("de-DE")} disabled />
          </Field>
        </div>

        <Field label="Unterschrift Mitglied">
          <OnboardingSignatureField
            storageKey={signature || undefined}
            onChange={setSignature}
          />
        </Field>

        <Button type="submit" disabled={isPending || !allConfirmed}>
          {isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
          Mitgliedsantrag unterschreiben
        </Button>
      </form>
    </section>
  );
}
