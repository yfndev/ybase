"use client";

import type { Project } from "@/lib/db/types";
import { ShareModalUI } from "./ShareModalUI";
import { useShareModal } from "./shareModal/useShareModal";

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
    needsDates,
    setType,
    updateForm,
    handleClose,
    handleCopy,
    handleSend,
  } = useShareModal(onClose);

  return (
    <ShareModalUI
      open={open}
      onClose={handleClose}
      type={type}
      form={form}
      projects={projects}
      isGenerating={isGenerating}
      needsDates={needsDates}
      onTypeChange={setType}
      onFormUpdate={updateForm}
      onCopy={handleCopy}
      onSend={handleSend}
    />
  );
}
