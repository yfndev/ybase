"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { createReimbursementLink } from "@/lib/server/reimbursements/sharing";
import { createLink as createAllowanceLink } from "@/lib/server/volunteerAllowance/sharing";
import { DEFAULT_LINK_TYPE, INITIAL_FORM, linkUrl } from "./constants";
import type { LinkKind, LinkType } from "./types";

export function useShareModal(onClose: () => void) {
  const router = useRouter();
  const [type, setType] = useState<LinkType>(DEFAULT_LINK_TYPE);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isGenerating, setIsGenerating] = useState(false);
  const needsDates = type === "allowance";

  const refresh = () => {
    router.refresh();
  };

  const updateForm = (updates: Partial<typeof form>) =>
    setForm((prev) => ({ ...prev, ...updates }));

  const handleClose = () => {
    setForm(INITIAL_FORM);
    setType(DEFAULT_LINK_TYPE);
    onClose();
  };

  const generate = async (
    sendEmail: boolean,
  ): Promise<{ id: string; linkType: LinkKind }> => {
    const recipient = sendEmail
      ? {
          invitedName: form.invitedName || undefined,
          invitedEmail: form.invitedEmail || undefined,
        }
      : {};
    if (type === "allowance") {
      const id = await createAllowanceLink({
        projectId: form.projectId ?? "",
        activityDescription: form.description,
        startDate: form.startDate,
        endDate: form.endDate,
        ...recipient,
      });
      return { id, linkType: "allowance" };
    }
    const id = await createReimbursementLink({
      projectId: form.projectId ?? "",
      type,
      travelDetails:
        type === "travel"
          ? {
              destination: form.destination,
              purpose: form.purpose,
              allowFoodAllowance: form.allowFoodAllowance,
            }
          : undefined,
      ...recipient,
    });
    return { id, linkType: "reimbursement" };
  };

  const handleCopy = async () => {
    if (!form.projectId) return;
    setIsGenerating(true);
    try {
      const { id, linkType } = await generate(false);
      await navigator.clipboard.writeText(linkUrl(linkType, id));
      toast.success("Link kopiert");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!form.projectId || !form.invitedEmail) return;
    setIsGenerating(true);
    try {
      await generate(true);
      toast.success("Anforderung per E-Mail gesendet");
      refresh();
      setForm(INITIAL_FORM);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler");
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    type,
    form,
    isGenerating,
    needsDates,
    setType,
    updateForm,
    handleClose,
    handleCopy,
    handleSend,
  };
}
