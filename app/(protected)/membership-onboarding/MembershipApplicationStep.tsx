"use client";

import { Button } from "@/components/ui/button";
import { ageOnDate } from "@/lib/members/legalDates";
import { submitOwnMembershipApplication } from "@/lib/server/memberships/membershipApplication";
import type { MembershipOnboardingContext } from "@/lib/server/memberships/onboardingData";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import {
  GuardianConsentFields,
  type GuardianValues,
} from "./GuardianConsentFields";
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
  });
  const [signature, setSignature] = useState("");
  const [guardian, setGuardian] = useState<GuardianValues>({
    name: "",
    email: "",
    signature: "",
  });
  const [isPending, startTransition] = useTransition();
  const isMinor = ageOnDate(profile.dateOfBirth, Date.now()) < 18;

  function update(field: keyof ApplicationValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function updateGuardian(field: keyof GuardianValues, value: string) {
    setGuardian((current) => ({ ...current, [field]: value }));
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
    if (isMinor && !guardian.signature) {
      toast.error("Bitte lass deine gesetzliche Vertretung unterschreiben.");
      return;
    }
    startTransition(async () => {
      try {
        await submitOwnMembershipApplication({
          ...values,
          gender,
          signatureStorageKey: signature,
          ...(isMinor
            ? {
                guardianName: guardian.name,
                guardianEmail: guardian.email,
                guardianSignatureStorageKey: guardian.signature,
              }
            : {}),
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

        {isMinor && (
          <GuardianConsentFields values={guardian} update={updateGuardian} />
        )}

        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
          Mitgliedsantrag unterschreiben
        </Button>
      </form>
    </section>
  );
}
