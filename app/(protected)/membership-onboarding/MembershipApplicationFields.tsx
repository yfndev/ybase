"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MembershipGender } from "@/lib/db/types";
import {
  MEMBERSHIP_GENDERS,
  MEMBERSHIP_GENDER_LABELS,
} from "@/lib/members/gender";
import type { MembershipOnboardingProfile } from "@/lib/server/memberships/onboardingData";
import { Field } from "./ProfileFields";

export interface ApplicationValues {
  privateEmail: string;
  phone: string;
  gender: MembershipGender | "";
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export function MembershipApplicationFields({
  profile,
  values,
  update,
}: {
  profile: MembershipOnboardingProfile;
  values: ApplicationValues;
  update: (field: keyof ApplicationValues, value: string) => void;
}) {
  return (
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
      <Field label="Geschlecht" htmlFor="membership-gender">
        <Select
          value={values.gender || undefined}
          onValueChange={(value) => update("gender", value)}
        >
          <SelectTrigger id="membership-gender" className="w-full">
            <SelectValue placeholder="Bitte auswählen" />
          </SelectTrigger>
          <SelectContent>
            {MEMBERSHIP_GENDERS.map((gender) => (
              <SelectItem key={gender} value={gender}>
                {MEMBERSHIP_GENDER_LABELS[gender]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Private E-Mailadresse" htmlFor="membership-private-email">
        <Input
          id="membership-private-email"
          type="email"
          autoComplete="email"
          required
          value={values.privateEmail}
          onChange={(event) => update("privateEmail", event.target.value)}
        />
      </Field>
      <Field label="Telefonnummer" htmlFor="membership-phone">
        <Input
          id="membership-phone"
          type="tel"
          autoComplete="tel"
          required
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
  );
}
