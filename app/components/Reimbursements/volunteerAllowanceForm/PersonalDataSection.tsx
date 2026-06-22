"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { VolunteerAllowanceForm } from "./types";

interface Props {
  form: VolunteerAllowanceForm;
  update: (field: Partial<VolunteerAllowanceForm>) => void;
}

export function PersonalDataSection({ form, update }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Persönliche Daten</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Vor- und Nachname"
          />
        </div>
        <div className="col-span-2">
          <Label>Straße und Hausnummer *</Label>
          <Input
            value={form.street}
            onChange={(e) => update({ street: e.target.value })}
            placeholder="Musterstraße 123"
          />
        </div>
        <div>
          <Label>PLZ *</Label>
          <Input
            value={form.plz}
            onChange={(e) => update({ plz: e.target.value.replace(/\D/g, "") })}
            placeholder="12345"
            inputMode="numeric"
            maxLength={5}
          />
        </div>
        <div>
          <Label>Ort *</Label>
          <Input
            value={form.city}
            onChange={(e) => update({ city: e.target.value })}
            placeholder="Musterstadt"
          />
        </div>
      </div>
    </div>
  );
}
