"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import toast from "react-hot-toast";
import { ShareModalUI } from "./ShareModalUI";

type LinkType = "expense" | "travel" | "allowance";

const INITIAL_FORM = {
  projectId: null as Id<"projects"> | null,
  description: "",
  email: "",
  startDate: "",
  endDate: "",
  destination: "",
  purpose: "",
  allowFoodAllowance: false,
};

export function ShareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const projects = useQuery(api.projects.queries.getAllProjects, {});
  const pendingLinks = useQuery(api.reimbursements.sharing.getPendingSharedLinks);

  const createReimbursementLink = useMutation(api.reimbursements.sharing.createReimbursementLink);
  const sendReimbursementEmail = useMutation(api.reimbursements.sharing.sendReimbursementLink);
  const deleteReimbursementLink = useMutation(api.reimbursements.sharing.deleteSharedReimbursementLink);
  const createAllowanceLink = useMutation(api.volunteerAllowance.functions.createLink);
  const sendAllowanceEmail = useMutation(api.volunteerAllowance.functions.sendAllowanceLink);
  const deleteAllowanceLink = useMutation(api.reimbursements.sharing.deleteSharedAllowanceLink);

  const [type, setType] = useState<LinkType>("expense");
  const [form, setForm] = useState(INITIAL_FORM);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const projectName = projects?.find((project) => project._id === form.projectId)?.name ?? "";
  const isLoading = isGenerating || isSending;
  const needsDates = type === "travel" || type === "allowance";

  const allLinks = [
    ...(pendingLinks?.reimbursementLinks ?? []),
    ...(pendingLinks?.allowanceLinks ?? []),
  ].sort((first, second) => second._creationTime - first._creationTime);

  const updateForm = (updates: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const resetForm = () => setForm(INITIAL_FORM);

  const handleClose = () => {
    resetForm();
    setType("expense");
    onClose();
  };

  const validate = (): boolean => {
    if (!form.projectId) {
      toast.error("Bitte ein Projekt auswählen");
      return false;
    }

    if (type === "expense" && !form.description) {
      toast.error("Bitte eine Beschreibung eingeben");
      return false;
    }

    if (type === "travel") {
      if (!form.destination) {
        toast.error("Bitte ein Reiseziel eingeben");
        return false;
      }
      if (!form.purpose) {
        toast.error("Bitte einen Reisezweck eingeben");
        return false;
      }
    }

    if (type === "allowance" && !form.description) {
      toast.error("Bitte eine Tätigkeitsbeschreibung eingeben");
      return false;
    }

    if (needsDates && (!form.startDate || !form.endDate)) {
      toast.error("Bitte Von und Bis Datum eingeben");
      return false;
    }

    return true;
  };

  const generateLink = async (): Promise<string | null> => {
    if (!validate() || !form.projectId) return null;

    const baseUrl = window.location.origin;

    if (type === "allowance") {
      const id = await createAllowanceLink({
        projectId: form.projectId,
        activityDescription: form.description,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      return `${baseUrl}/ehrenamtspauschale/${id}`;
    }

    const id = await createReimbursementLink({
      projectId: form.projectId,
      type,
      description: form.description || undefined,
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
    return `${baseUrl}/erstattung/${id}`;
  };

  const handleCopy = async () => {
    setIsGenerating(true);
    try {
      const link = await generateLink();
      if (!link) return;
      await navigator.clipboard.writeText(link);
      toast.success("Link kopiert");
      resetForm();
    } catch {
      toast.error("Fehler beim Erstellen des Links");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!form.email) {
      toast.error("Bitte E-Mail eingeben");
      return;
    }

    setIsSending(true);
    try {
      const link = await generateLink();
      if (!link) return;

      if (type === "allowance") {
        await sendAllowanceEmail({ email: form.email, link, projectName });
      } else {
        await sendReimbursementEmail({ email: form.email, link, projectName, type });
      }
      toast.success("E-Mail gesendet");
      resetForm();
    } catch {
      toast.error("Fehler beim Senden der E-Mail");
    } finally {
      setIsSending(false);
    }
  };

  const copyExistingLink = async (id: string, linkType: "reimbursement" | "allowance") => {
    const baseUrl = window.location.origin;
    const path = linkType === "reimbursement" ? "erstattung" : "ehrenamtspauschale";
    await navigator.clipboard.writeText(`${baseUrl}/${path}/${id}`);
    setCopiedId(id);
    toast.success("Link kopiert");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteLink = async (id: string, linkType: "reimbursement" | "allowance") => {
    try {
      if (linkType === "reimbursement") {
        await deleteReimbursementLink({ id: id as Id<"reimbursements"> });
      } else {
        await deleteAllowanceLink({ id: id as Id<"volunteerAllowance"> });
      }
      toast.success("Link gelöscht");
    } catch {
      toast.error("Fehler beim Löschen");
    }
  };

  return (
    <ShareModalUI
      open={open}
      onClose={handleClose}
      type={type}
      form={form}
      isLoading={isLoading}
      isGenerating={isGenerating}
      isSending={isSending}
      needsDates={needsDates}
      allLinks={allLinks}
      copiedId={copiedId}
      onTypeChange={setType}
      onFormUpdate={updateForm}
      onCopy={handleCopy}
      onSendEmail={handleSendEmail}
      onCopyExistingLink={copyExistingLink}
      onDeleteLink={deleteLink}
    />
  );
}
