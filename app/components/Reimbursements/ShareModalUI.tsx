import { DateInput } from "@/components/Selectors/DateInput";
import { SelectProject } from "@/components/Selectors/SelectProject";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { Id } from "@/convex/_generated/dataModel";
import { Car, Check, Copy, Loader2, Mail, Receipt, Trash2, Users } from "lucide-react";

type LinkType = "expense" | "travel" | "allowance";

type FormState = {
  projectId: Id<"projects"> | null;
  description: string;
  email: string;
  startDate: string;
  endDate: string;
  destination: string;
  purpose: string;
  allowFoodAllowance: boolean;
};

type PendingLink = {
  _id: string;
  projectName: string;
  linkType: "reimbursement" | "allowance";
  type?: "expense" | "travel";
};

type Props = {
  open: boolean;
  onClose: () => void;
  type: LinkType;
  form: FormState;
  isLoading: boolean;
  isGenerating: boolean;
  isSending: boolean;
  needsDates: boolean;
  allLinks: PendingLink[];
  copiedId: string | null;
  onTypeChange: (type: LinkType) => void;
  onFormUpdate: (updates: Partial<FormState>) => void;
  onCopy: () => void;
  onSendEmail: () => void;
  onCopyExistingLink: (id: string, linkType: "reimbursement" | "allowance") => void;
  onDeleteLink: (id: string, linkType: "reimbursement" | "allowance") => void;
};

const TYPE_LABELS: Record<LinkType, string> = {
  expense: "Auslagenerstattung",
  travel: "Reisekostenerstattung",
  allowance: "Ehrenamtspauschale",
};

export function ShareModalUI({
  open,
  onClose,
  type,
  form,
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
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Erstattung anfordern</DialogTitle>
          <DialogDescription>
            Erstelle einen Link zum Einreichen von Erstattungen oder Ehrenamtspauschalen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            {(Object.keys(TYPE_LABELS) as LinkType[]).map((linkType) => (
              <Button
                key={linkType}
                type="button"
                variant={type === linkType ? "default" : "outline"}
                onClick={() => onTypeChange(linkType)}
                className="flex-1"
                size="sm"
              >
                {TYPE_LABELS[linkType]}
              </Button>
            ))}
          </div>

          <div>
            <Label>Projekt</Label>
            <SelectProject
              value={form.projectId ?? ""}
              onValueChange={(value) => onFormUpdate({ projectId: value ? (value as Id<"projects">) : null })}
            />
          </div>

          <div>
            <Label>{type === "allowance" ? "Tätigkeitsbeschreibung" : "Beschreibung"}</Label>
            <Textarea
              value={form.description}
              onChange={(e) => onFormUpdate({ description: e.target.value })}
              placeholder={type === "allowance" ? "z.B. Jugendarbeit, Vorstandstätigkeit" : "z.B. Einkäufe für Workshop"}
              rows={2}
              className="resize-none"
            />
          </div>

          {type === "travel" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Reiseziel</Label>
                  <Input
                    value={form.destination}
                    onChange={(e) => onFormUpdate({ destination: e.target.value })}
                    placeholder="z.B. München"
                  />
                </div>
                <div>
                  <Label>Reisezweck</Label>
                  <Input
                    value={form.purpose}
                    onChange={(e) => onFormUpdate({ purpose: e.target.value })}
                    placeholder="z.B. Konferenz"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowFoodAllowance"
                  checked={form.allowFoodAllowance}
                  onCheckedChange={(checked) => onFormUpdate({ allowFoodAllowance: checked === true })}
                />
                <Label htmlFor="allowFoodAllowance" className="font-normal cursor-pointer">
                  Verpflegungsmehraufwand erlauben
                </Label>
              </div>
            </>
          )}

          {needsDates && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Von</Label>
                <DateInput value={form.startDate} onChange={(value) => onFormUpdate({ startDate: value })} />
              </div>
              <div>
                <Label>Bis</Label>
                <DateInput value={form.endDate} onChange={(value) => onFormUpdate({ endDate: value })} />
              </div>
            </div>
          )}

          <div>
            <Label>E-Mail (optional)</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => onFormUpdate({ email: e.target.value })}
              placeholder="empfaenger@beispiel.de"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onCopy} className="flex-1" disabled={isLoading || !form.projectId}>
              {isGenerating ? <Loader2 className="size-4 animate-spin mr-2" /> : <Copy className="size-4 mr-2" />}
              Link kopieren
            </Button>
            <Button onClick={onSendEmail} className="flex-1" disabled={isLoading || !form.projectId || !form.email}>
              {isSending ? <Loader2 className="size-4 animate-spin mr-2" /> : <Mail className="size-4 mr-2" />}
              Per E-Mail senden
            </Button>
          </div>
        </div>

        {allLinks.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Freigegebene Links ohne bisherige Unterzeichnung der Erstattung
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allLinks.map((link) => (
                  <LinkRow
                    key={link._id}
                    link={link}
                    copiedId={copiedId}
                    onCopy={() => onCopyExistingLink(link._id, link.linkType)}
                    onDelete={() => onDeleteLink(link._id, link.linkType)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LinkRow({
  link,
  copiedId,
  onCopy,
  onDelete,
}: {
  link: PendingLink;
  copiedId: string | null;
  onCopy: () => void;
  onDelete: () => void;
}) {
  const icon =
    link.linkType === "allowance" ? (
      <Users className="size-4 text-purple-500" />
    ) : link.type === "travel" ? (
      <Car className="size-4 text-blue-500" />
    ) : (
      <Receipt className="size-4 text-green-500" />
    );

  const label =
    link.linkType === "allowance"
      ? "Ehrenamtspauschale"
      : link.type === "travel"
        ? "Reisekostenerstattung"
        : "Auslagenerstattung";

  return (
    <div className="flex items-center justify-between p-2 border rounded-md text-sm">
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <span className="font-medium truncate">{link.projectName}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="size-8" onClick={onCopy}>
          {copiedId === link._id ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
