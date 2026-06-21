"use client";

import { PageHeader } from "@/components/Layout/PageHeader";
import { AccessDenied } from "@/components/Settings/AccessDenied";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { useIsAdmin } from "@/lib/hooks/useCurrentUserRole";
import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function OrganizationSettingsPage() {
  const isAdmin = useIsAdmin();
  const organization = useQuery(api.organizations.queries.getOrganization);
  const updateOrganization = useMutation(
    api.organizations.functions.updateOrganization,
  );

  const [form, setForm] = useState({
    name: "",
    careOf: "",
    street: "",
    plz: "",
    city: "",
    taxId: "",
    accountingEmail: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (organization) {
      setForm({
        name: organization.name,
        careOf: organization.careOf,
        street: organization.street,
        plz: organization.plz,
        city: organization.city,
        taxId: organization.taxId,
        accountingEmail: organization.accountingEmail,
      });
    }
  }, [organization]);

  if (!isAdmin) {
    return <AccessDenied title="Organisation" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      return toast.error("Bitte einen Organisationsnamen eingeben");
    }

    setIsSubmitting(true);
    try {
      await updateOrganization({
        name: form.name,
        careOf: form.careOf,
        street: form.street,
        plz: form.plz,
        city: form.city,
        taxId: form.taxId,
        accountingEmail: form.accountingEmail,
      });
      toast.success("Organisation aktualisiert");
    } catch {
      toast.error("Fehler beim Speichern");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!organization) {
    return (
      <div>
        <PageHeader title="Organisation" />
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Organisation" />

      <div className="max-w-2xl space-y-6">
        <p className="text-muted-foreground">
          Organisationsdaten für Dokumente und PDFs
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Vereinsname *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="z.B. Mein Verein e.V."
              />
            </div>

            <div>
              <Label htmlFor="careOf">Adresszusatz (c/o)</Label>
              <Input
                id="careOf"
                value={form.careOf}
                onChange={(e) => setForm({ ...form, careOf: e.target.value })}
                placeholder="c/o Beispiel GmbH"
              />
            </div>

            <div>
              <Label htmlFor="street">Straße und Hausnummer</Label>
              <Input
                id="street"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                placeholder="Musterstraße 123"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plz">PLZ</Label>
                <Input
                  id="plz"
                  value={form.plz}
                  onChange={(e) =>
                    setForm({ ...form, plz: e.target.value.replace(/\D/g, "") })
                  }
                  placeholder="12345"
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="city">Ort</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Musterstadt"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="taxId">USt-ID</Label>
              <Input
                id="taxId"
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                placeholder="DE123456789"
              />
            </div>

            <div>
              <Label htmlFor="accountingEmail">E-Mail Buchhaltung</Label>
              <Input
                id="accountingEmail"
                type="email"
                value={form.accountingEmail}
                onChange={(e) =>
                  setForm({ ...form, accountingEmail: e.target.value })
                }
                placeholder="buchhaltung@verein.de"
              />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Speichern
          </Button>
        </form>
      </div>
    </div>
  );
}
