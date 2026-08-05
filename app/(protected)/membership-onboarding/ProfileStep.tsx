"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  confirmOwnMembershipProfile,
  type MembershipOnboardingContext,
} from "@/lib/server/memberships/onboardingData";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Confirmation, Field } from "./ProfileFields";

export function ProfileStep({
  profile,
  onComplete,
}: {
  profile: MembershipOnboardingContext["profile"];
  onComplete: () => Promise<void>;
}) {
  const [values, setValues] = useState({
    privateEmail: profile.privateEmail,
    phone: profile.phone,
    street: profile.address.street,
    postalCode: profile.address.postalCode,
    city: profile.address.city,
    country: profile.address.country,
  });
  const [profileConfirmed, setProfileConfirmed] = useState(false);
  const [purposesConfirmed, setPurposesConfirmed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profileConfirmed || !purposesConfirmed) {
      toast.error("Bitte bestätige deine Daten und die Vereinszwecke.");
      return;
    }
    startTransition(async () => {
      try {
        await confirmOwnMembershipProfile({
          ...values,
          profileDataConfirmed: true,
          supportsAssociationPurposes: true,
        });
        await onComplete();
        toast.success("Mitgliedsdaten gespeichert.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Speichern fehlgeschlagen",
        );
      }
    });
  }

  return (
    <section aria-labelledby="profile-heading">
      <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
        Schritt 1 von 2
      </p>
      <h1 id="profile-heading" className="mt-2 text-2xl font-semibold">
        Registrierung im Verein vervollständigen
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Prüfe deine persönlichen Angaben und ergänze deine Anschrift. Name und
        Geburtsdatum stammen aus deinem bereits verknüpften Member-Profil.
      </p>

      <form className="mt-7 space-y-6" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Vorname">
            <Input value={profile.firstName} disabled />
          </Field>
          <Field label="Nachname">
            <Input value={profile.lastName} disabled />
          </Field>
          <Field label="Geburtsdatum">
            <Input value={profile.dateOfBirth} disabled />
          </Field>
          <Field label="Private E-Mail" htmlFor="membership-private-email">
            <Input
              id="membership-private-email"
              type="email"
              autoComplete="email"
              required
              value={values.privateEmail}
              onChange={(event) => update("privateEmail", event.target.value)}
            />
          </Field>
          <Field label="Telefon (optional)" htmlFor="membership-phone">
            <Input
              id="membership-phone"
              type="tel"
              autoComplete="tel"
              value={values.phone}
              onChange={(event) => update("phone", event.target.value)}
            />
          </Field>
          <Field label="Straße und Hausnummer" htmlFor="membership-street">
            <Input
              id="membership-street"
              autoComplete="street-address"
              required
              value={values.street}
              onChange={(event) => update("street", event.target.value)}
            />
          </Field>
          <Field label="Postleitzahl" htmlFor="membership-postal-code">
            <Input
              id="membership-postal-code"
              autoComplete="postal-code"
              required
              value={values.postalCode}
              onChange={(event) => update("postalCode", event.target.value)}
            />
          </Field>
          <Field label="Ort" htmlFor="membership-city">
            <Input
              id="membership-city"
              autoComplete="address-level2"
              required
              value={values.city}
              onChange={(event) => update("city", event.target.value)}
            />
          </Field>
          <Field label="Land" htmlFor="membership-country">
            <Input
              id="membership-country"
              autoComplete="country-name"
              required
              value={values.country}
              onChange={(event) => update("country", event.target.value)}
            />
          </Field>
        </div>

        <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
          <Confirmation
            id="membership-profile-confirmed"
            checked={profileConfirmed}
            onCheckedChange={setProfileConfirmed}
          >
            Ich bestätige, dass meine oben angegebenen persönlichen Daten
            vollständig und richtig sind.
          </Confirmation>
          <Confirmation
            id="membership-purposes-confirmed"
            checked={purposesConfirmed}
            onCheckedChange={setPurposesConfirmed}
          >
            Ich unterstütze die in der Satzung festgelegten Vereinszwecke.
          </Confirmation>
        </div>

        <Button
          type="submit"
          disabled={isPending || !profileConfirmed || !purposesConfirmed}
        >
          {isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
          Angaben bestätigen und weiter
        </Button>
      </form>
    </section>
  );
}
