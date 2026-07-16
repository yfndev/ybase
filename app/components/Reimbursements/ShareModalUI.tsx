import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShareForm } from "./shareModal/ShareForm";
import type { ShareModalUIProps } from "./shareModal/types";

export function ShareModalUI({
  open,
  onClose,
  type,
  form,
  projects,
  isGenerating,
  needsDates,
  onTypeChange,
  onFormUpdate,
  onCopy,
  onSend,
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
          isGenerating={isGenerating}
          needsDates={needsDates}
          onTypeChange={onTypeChange}
          onFormUpdate={onFormUpdate}
          onCopy={onCopy}
          onSend={onSend}
        />
      </DialogContent>
    </Dialog>
  );
}
