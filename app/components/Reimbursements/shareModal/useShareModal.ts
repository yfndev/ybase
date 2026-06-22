"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  createReimbursementLink,
  deleteSharedAllowanceLink,
  deleteSharedReimbursementLink,
  getPendingSharedLinks,
} from "@/lib/server/reimbursements/sharing";
import { createLink as createAllowanceLink } from "@/lib/server/volunteerAllowance/sharing";
import { INITIAL_FORM, linkUrl } from "./constants";
import type { LinkKind, LinkType, PendingLink } from "./types";

export function useShareModal(open: boolean, onClose: () => void) {
  const router = useRouter();
  const [type, setType] = useState<LinkType>("expense");
  const [form, setForm] = useState(INITIAL_FORM);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allLinks, setAllLinks] = useState<PendingLink[]>([]);
  const needsDates = type === "travel" || type === "allowance";

  useEffect(() => {
    if (!open) return;
    void getPendingSharedLinks().then(
      ({ reimbursementLinks, allowanceLinks }) => {
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
      },
    );
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

  return {
    type,
    form,
    isGenerating,
    copiedId,
    allLinks,
    needsDates,
    setType,
    updateForm,
    handleClose,
    handleCopy,
    handleCopyExisting,
    handleDelete,
  };
}
