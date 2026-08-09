"use client";

import { Button } from "@/components/ui/button";
import { submitOwnMembershipApplication } from "@/lib/server/memberships/membershipApplication";
import type { MembershipOnboardingProfile } from "@/lib/server/memberships/onboardingData";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import {
  type ApplicationValues,
  MembershipApplicationFields,
} from "./MembershipApplicationFields";
import { OnboardingSignatureField } from "./OnboardingSignatureField";
import { Field } from "./ProfileFields";

export function MembershipApplicationStep({
  profile,
  onComplete,
}: {
  profile: MembershipOnboardingProfile;
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
  });
  const [signature, setSignature] = useState("");
  const [isPending, startTransition] = useTransition();

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

        <Field label="Unterschrift Mitglied">
          <OnboardingSignatureField
            storageKey={signature || undefined}
            onChange={setSignature}
          />
        </Field>

        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
          Mitgliedsantrag unterschreiben
        </Button>
      </form>
    </section>
  );
}
