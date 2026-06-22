"use client";

import type { Project } from "@/lib/db/types";
import { useShareModal } from "./shareModal/useShareModal";
import { ShareModalUI } from "./ShareModalUI";

export function ShareModal({
  open,
  onClose,
  projects,
}: {
  open: boolean;
  onClose: () => void;
  projects: Project[];
}) {
  const {
    type,
    form,
    isGenerating,
    isSending,
    copiedId,
    allLinks,
    needsDates,
    setType,
    updateForm,
    handleClose,
    handleCopy,
    handleSendEmail,
    handleCopyExisting,
    handleDelete,
  } = useShareModal(open, onClose, projects);

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
