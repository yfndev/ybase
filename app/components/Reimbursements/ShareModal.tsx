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
    copiedId,
    allLinks,
    needsDates,
    setType,
    updateForm,
    handleClose,
    handleCopy,
    handleSend,
    handleCopyExisting,
    handleDelete,
  } = useShareModal(open, onClose);

  return (
    <ShareModalUI
      open={open}
      onClose={handleClose}
      type={type}
      form={form}
      projects={projects}
      isGenerating={isGenerating}
      needsDates={needsDates}
      allLinks={allLinks}
      copiedId={copiedId}
      onTypeChange={setType}
      onFormUpdate={updateForm}
      onCopy={handleCopy}
      onSend={handleSend}
      onCopyExistingLink={handleCopyExisting}
      onDeleteLink={handleDelete}
    />
  );
}
