import { Button } from "@/components/ui/button";
import { Car, Check, Copy, Receipt, Trash2, Users } from "lucide-react";
import type { PendingLink } from "./types";

export function LinkRow({
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
          {copiedId === link._id ? (
            <Check className="size-4 text-green-500" />
          ) : (
            <Copy className="size-4" />
          )}
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
