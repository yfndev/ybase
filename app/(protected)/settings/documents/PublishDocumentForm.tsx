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
import type { MembershipDocumentKind } from "@/lib/db/types";
import {
  MEMBERSHIP_DOCUMENT_LABELS,
  MEMBERSHIP_DOCUMENT_ORDER,
} from "@/lib/members/documents";
import { publishMembershipDocument } from "@/lib/server/memberships/documentPublication";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { DepartmentTargets } from "./DepartmentTargets";

export function PublishDocumentForm({
  onCancel,
  onPublished,
}: {
  onCancel: () => void;
  onPublished: () => Promise<void>;
}) {
  const [kind, setKind] = useState<MembershipDocumentKind>("privacy_notice");
  const [title, setTitle] = useState("");
  const [versionLabel, setVersionLabel] = useState("");
  const [content, setContent] = useState("");
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);
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
        await publishMembershipDocument({
          kind,
          title,
          versionLabel,
          content,
          targetDepartmentIds: departmentIds,
        });
        await onPublished();
        toast.success("Version veröffentlicht.");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Veröffentlichen fehlgeschlagen",
        );
      }
    });
  }

  return (
    <form
      className="space-y-5 rounded-xl border bg-card p-5 shadow-sm"
      onSubmit={submit}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="document-kind">Art*</Label>
          <Select
            value={kind}
            onValueChange={(value) => setKind(value as MembershipDocumentKind)}
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

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isPending || !content}>
          {isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
          Veröffentlichen
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
