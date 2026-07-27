"use client";

import { PageHeader } from "@/components/Layout/PageHeader";
import { Button } from "@/components/ui/button";
import { updateOrganization } from "@/lib/server/organizations/actions";
import type { OrganizationSettings } from "@/lib/server/organizations/data";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { OrganizationFormFields } from "./OrganizationFormFields";

interface Props {
  organization: OrganizationSettings;
}

export function OrganizationClient({ organization }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(organization);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDirty = JSON.stringify(form) !== JSON.stringify(organization);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      return toast.error("Bitte einen Organisationsnamen eingeben");
    }

    setIsSubmitting(true);
    try {
      await updateOrganization(form);
      router.refresh();
      toast.success("Organisation aktualisiert");
    } catch {
      toast.error("Fehler beim Speichern");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Organisation" />

      <main className="mx-auto max-w-[760px] p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <OrganizationFormFields
            form={form}
            onChange={(field, value) =>
              setForm((current) => ({ ...current, [field]: value }))
            }
          />

          {isDirty ? (
            <div className="flex items-center justify-end gap-2 py-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setForm(organization)}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Speichern
              </Button>
            </div>
          ) : null}
        </form>
      </main>
    </div>
  );
}
