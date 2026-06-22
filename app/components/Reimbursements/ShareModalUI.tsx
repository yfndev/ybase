import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExistingLinks } from "./shareModal/ExistingLinks";
import { ShareForm } from "./shareModal/ShareForm";
import type { ShareModalUIProps } from "./shareModal/types";

export function ShareModalUI({
  open,
  onClose,
  type,
  form,
  projects,
  isLoading,
  isGenerating,
  isSending,
  needsDates,
  allLinks,
  copiedId,
  onTypeChange,
  onFormUpdate,
  onCopy,
  onSendEmail,
  onCopyExistingLink,
  onDeleteLink,
}: ShareModalUIProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Erstattung anfordern</DialogTitle>
          <DialogDescription>
            Erstelle einen Link zum Einreichen von Erstattungen oder
            Ehrenamtspauschalen.
          </DialogDescription>
        </DialogHeader>

        <ShareForm
          type={type}
          form={form}
          projects={projects}
          isLoading={isLoading}
          isGenerating={isGenerating}
          isSending={isSending}
          needsDates={needsDates}
          onTypeChange={onTypeChange}
          onFormUpdate={onFormUpdate}
          onCopy={onCopy}
          onSendEmail={onSendEmail}
        />

        <ExistingLinks
          allLinks={allLinks}
          copiedId={copiedId}
          onCopyExistingLink={onCopyExistingLink}
          onDeleteLink={onDeleteLink}
        />
      </DialogContent>
    </Dialog>
  );
}
