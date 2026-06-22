"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Project } from "@/lib/db/types";
import {
  createReimbursementLink,
  deleteSharedAllowanceLink,
  deleteSharedReimbursementLink,
  getPendingSharedLinks,
  sendReimbursementLink,
} from "@/lib/server/reimbursements/sharing";
import {
  createLink as createAllowanceLink,
  sendAllowanceLink,
} from "@/lib/server/volunteerAllowance/sharing";
import { ShareModalUI } from "./ShareModalUI";

type LinkType = "expense" | "travel" | "allowance";
type LinkKind = "reimbursement" | "allowance";
type PendingLink = {
  _id: string;
  projectName: string;
  linkType: LinkKind;
  type?: "expense" | "travel";
};

const INITIAL_FORM = {
  projectId: null as string | null,
  description: "",
  email: "",
  startDate: "",
  endDate: "",
  destination: "",
  purpose: "",
  allowFoodAllowance: false,
};

function linkUrl(linkType: LinkKind, id: string): string {
  const segment = linkType === "allowance" ? "ehrenamtspauschale" : "erstattung";
  return `${window.location.origin}/${segment}/${id}`;
}

export function ShareModal({
  open,
  onClose,
  projects,
}: {
  open: boolean;
  onClose: () => void;
  projects: Project[];
}) {
  const router = useRouter();
  const [type, setType] = useState<LinkType>("expense");
  const [form, setForm] = useState(INITIAL_FORM);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allLinks, setAllLinks] = useState<PendingLink[]>([]);
  const needsDates = type === "travel" || type === "allowance";

  useEffect(() => {
    if (!open) return;
    void getPendingSharedLinks().then(({ reimbursementLinks, allowanceLinks }) => {
      setAllLinks([
        ...reimbursementLinks.map((link) => ({
          _id: link._id,
          projectName: link.projectName,
          linkType: "reimbursement" as const,
          type: link.type,
        })),
        ...allowanceLinks.map((link) => ({
          _id: link._id,
          projectName: link.projectName,
          linkType: "allowance" as const,
        })),
      ]);
    });
  }, [open]);

  const refresh = () => {
    setAllLinks([]);
    router.refresh();
  };

  const updateForm = (updates: Partial<typeof form>) =>
    setForm((prev) => ({ ...prev, ...updates }));

  const handleClose = () => {
    setForm(INITIAL_FORM);
    setType("expense");
    onClose();
  };

  const projectName = projects.find((p) => p._id === form.projectId)?.name ?? "";

  const generate = async (): Promise<{ id: string; linkType: LinkKind }> => {
    if (type === "allowance") {
      const id = await createAllowanceLink({
        projectId: form.projectId ?? "",
        activityDescription: form.description,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      return { id, linkType: "allowance" };
    }
    const id = await createReimbursementLink({
      projectId: form.projectId ?? "",
      type,
      description: form.description,
      travelDetails:
        type === "travel"
          ? {
              destination: form.destination,
              purpose: form.purpose,
              startDate: form.startDate,
              endDate: form.endDate,
              allowFoodAllowance: form.allowFoodAllowance,
            }
          : undefined,
    });
    return { id, linkType: "reimbursement" };
  };

  const handleCopy = async () => {
    if (!form.projectId) return;
    setIsGenerating(true);
    try {
      const { id, linkType } = await generate();
      await navigator.clipboard.writeText(linkUrl(linkType, id));
      toast.success("Link kopiert");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!form.projectId || !form.email) return;
    setIsSending(true);
    try {
      const { id, linkType } = await generate();
      const link = linkUrl(linkType, id);
      if (linkType === "allowance") {
        await sendAllowanceLink({ email: form.email, link, projectName });
      } else {
        await sendReimbursementLink({
          email: form.email,
          link,
          projectName,
          type: type === "travel" ? "travel" : "expense",
        });
      }
      toast.success("E-Mail gesendet");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler");
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyExisting = async (id: string, linkType: LinkKind) => {
    await navigator.clipboard.writeText(linkUrl(linkType, id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string, linkType: LinkKind) => {
    try {
      if (linkType === "allowance") {
        await deleteSharedAllowanceLink({ id });
      } else {
        await deleteSharedReimbursementLink({ id });
      }
      toast.success("Link gelöscht");
      setAllLinks((prev) => prev.filter((link) => link._id !== id));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler");
    }
  };

  return (
    <ShareModalUI
      open={open}
      onClose={handleClose}
      type={type}
      form={form}
      projects={projects}
      isLoading={isGenerating || isSending}
      isGenerating={isGenerating}
      isSending={isSending}
      needsDates={needsDates}
      allLinks={allLinks}
      copiedId={copiedId}
      onTypeChange={setType}
      onFormUpdate={updateForm}
      onCopy={handleCopy}
      onSendEmail={handleSendEmail}
      onCopyExistingLink={handleCopyExisting}
      onDeleteLink={handleDelete}
    />
  );
}
