"use client";

import { RichTextEditor } from "@/components/Editor/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MEMBERSHIP_DOCUMENT_LABELS,
  MEMBERSHIP_DOCUMENT_ORDER,
  type PublishableMembershipDocumentKind,
} from "@/lib/members/documents";
import { updateMembershipDocument } from "@/lib/server/memberships/documentEditing";
import { publishMembershipDocument } from "@/lib/server/memberships/documentPublication";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { DepartmentTargets } from "./DepartmentTargets";
import { DocumentEditNotice } from "./DocumentEditNotice";
import {
  type EditableMembershipDocument,
  suggestNextVersionLabel,
} from "./documentForm";

export function PublishDocumentForm({
  document,
  onCancel,
  onSaved,
}: {
  document?: EditableMembershipDocument;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const isEditing = Boolean(document);
  const [kind, setKind] = useState<PublishableMembershipDocumentKind>(
    document?.kind ?? "privacy_notice",
  );
  const [title, setTitle] = useState(document?.title ?? "");
  const [versionLabel, setVersionLabel] = useState(
    document?.hasAssignments
      ? suggestNextVersionLabel(document.versionLabel)
      : (document?.versionLabel ?? ""),
  );
  const [content, setContent] = useState(document?.content ?? "");
  const [departmentIds, setDepartmentIds] = useState<string[]>(
    document?.targetDepartmentIds ?? [],
  );
  const [isPending, startTransition] = useTransition();
  const departmentsRequired = kind === "usage_rights";

  function toggleDepartment(departmentId: string, checked: boolean) {
    setDepartmentIds((current) =>
      checked
        ? [...current, departmentId]
        : current.filter((id) => id !== departmentId),
    );
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (departmentsRequired && departmentIds.length === 0) {
      toast.error("Bitte wähle mindestens ein Department.");
      return;
    }
    startTransition(async () => {
      try {
        const values = {
          kind,
          title,
          versionLabel,
          content,
          targetTeamIds: document?.targetTeamIds ?? [],
          targetDepartmentIds: departmentIds,
        };
        const result = document
          ? await updateMembershipDocument({
              versionId: document.id,
              ...values,
            })
          : await publishMembershipDocument(values);
        await onSaved();
        toast.success(
          "mode" in result && result.mode === "updated"
            ? "Unterlage aktualisiert."
            : isEditing
              ? "Änderungen als neue Version veröffentlicht."
              : "Version veröffentlicht.",
        );
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Speichern fehlgeschlagen",
        );
      }
    });
  }

  return (
    <form className="border bg-background" onSubmit={submit}>
      <div className="border-b bg-muted/40 px-5 py-4">
        <p className="font-semibold">
          {isEditing
            ? "Unterlage bearbeiten"
            : "Neue Unterlage veröffentlichen"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEditing
            ? MEMBERSHIP_DOCUMENT_LABELS[kind]
            : "Titel, Gültigkeitsbereich und Inhalt festlegen."}
        </p>
      </div>

      <div className="space-y-6 p-5">
        {document?.hasAssignments && <DocumentEditNotice />}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="document-kind">Art*</Label>
            <Select
              value={kind}
              disabled={isEditing}
              onValueChange={(value) =>
                setKind(value as PublishableMembershipDocumentKind)
              }
            >
              <SelectTrigger id="document-kind" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEMBERSHIP_DOCUMENT_ORDER.map((option) => (
                  <SelectItem key={option} value={option}>
                    {MEMBERSHIP_DOCUMENT_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="document-title">Titel*</Label>
            <Input
              id="document-title"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="document-version">Version*</Label>
            <Input
              id="document-version"
              required
              placeholder="2026-01"
              value={versionLabel}
              onChange={(event) => setVersionLabel(event.target.value)}
            />
          </div>
        </div>

        <DepartmentTargets
          selected={departmentIds}
          onToggle={toggleDepartment}
          required={departmentsRequired}
        />

        <div className="space-y-2">
          <p className="text-sm font-medium">Dokumententext*</p>
          <RichTextEditor
            value={content}
            onChange={setContent}
            ariaLabel="Dokumententext"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-t bg-muted/20 px-5 py-4">
        <Button
          variant="primary"
          type="submit"
          disabled={isPending || !content}
        >
          {isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
          {isEditing ? "Änderungen speichern" : "Veröffentlichen"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
