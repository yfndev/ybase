import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OrganizationSettings } from "@/lib/server/organizations/data";
import type { ComponentProps } from "react";

type OrganizationField = keyof OrganizationSettings;

interface OrganizationInputProps extends Omit<
  ComponentProps<typeof Input>,
  "id" | "onChange" | "value"
> {
  field: OrganizationField;
  label: string;
  value: string;
  onChange: (field: OrganizationField, value: string) => void;
  transform?: (value: string) => string;
}

function OrganizationInput({
  field,
  label,
  value,
  onChange,
  transform,
  ...props
}: OrganizationInputProps) {
  return (
    <div>
      <Label className="mb-2" htmlFor={field}>
        {label}
      </Label>
      <Input
        id={field}
        value={value}
        onChange={(event) => {
          const nextValue = transform
            ? transform(event.target.value)
            : event.target.value;
          onChange(field, nextValue);
        }}
        {...props}
      />
    </div>
  );
}

interface Props {
  form: OrganizationSettings;
  onChange: (field: OrganizationField, value: string) => void;
}

export function OrganizationFormFields({ form, onChange }: Props) {
  return (
    <>
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Allgemein</h2>
        <OrganizationInput
          field="name"
          label="Organisationsname *"
          value={form.name}
          onChange={onChange}
          autoComplete="organization"
          placeholder="z.B. Mein Verein e.V."
          required
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Anschrift</h2>
        <OrganizationInput
          field="careOf"
          label="Adresszusatz (c/o)"
          value={form.careOf}
          onChange={onChange}
          autoComplete="address-line2"
          placeholder="c/o Beispiel GmbH"
        />
        <OrganizationInput
          field="street"
          label="Straße und Hausnummer"
          value={form.street}
          onChange={onChange}
          autoComplete="address-line1"
          placeholder="Musterstraße 123"
        />
        <div className="grid gap-4 sm:grid-cols-[minmax(8rem,0.65fr)_minmax(0,1.35fr)]">
          <OrganizationInput
            field="plz"
            label="PLZ"
            value={form.plz}
            onChange={onChange}
            autoComplete="postal-code"
            inputMode="numeric"
            maxLength={5}
            placeholder="12345"
            transform={(value) => value.replace(/\D/g, "")}
          />
          <OrganizationInput
            field="city"
            label="Ort"
            value={form.city}
            onChange={onChange}
            autoComplete="address-level2"
            placeholder="Musterstadt"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Steuer & Buchhaltung</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <OrganizationInput
            field="taxId"
            label="USt-ID"
            value={form.taxId}
            onChange={onChange}
            placeholder="DE123456789"
          />
          <OrganizationInput
            field="accountingEmail"
            label="E-Mail Buchhaltung"
            value={form.accountingEmail}
            onChange={onChange}
            autoComplete="email"
            placeholder="buchhaltung@verein.de"
            type="email"
          />
        </div>
      </section>
    </>
  );
}
