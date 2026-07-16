import {
  Banknote,
  Check,
  ExternalLink,
  MessageSquareWarning,
  MoreVertical,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { verticalActionMenuClassNames as menu } from "@/components/ui/vertical-action-menu";

type Props = {
  showReviewActions: boolean;
  showEditAction: boolean;
  showPaymentAction: boolean;
  canDelete: boolean;
  onApprove: () => void;
  onMarkAsPaid: () => void;
  onRequestChanges: () => void;
  onReject: () => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function ReimbursementActionsMenu(props: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className={menu.trigger}
          aria-label="Aktionen anzeigen"
          title="Aktionen anzeigen"
        >
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={0} className={menu.content}>
        {props.showReviewActions ? (
          <>
            <DropdownMenuItem className={menu.item} onSelect={props.onApprove}>
              <Check className="text-current" />
              Genehmigen
            </DropdownMenuItem>
            <DropdownMenuItem
              className={menu.item}
              onSelect={props.onRequestChanges}
            >
              <MessageSquareWarning className="text-current" />
              Änderungen anfordern
            </DropdownMenuItem>
            <DropdownMenuItem
              className={`${menu.item} ${menu.destructiveItem}`}
              onSelect={props.onReject}
            >
              <X className="text-current" />
              Ablehnen
            </DropdownMenuItem>
          </>
        ) : null}
        {props.showEditAction ? (
          <DropdownMenuItem className={menu.item} onSelect={props.onEdit}>
            <Pencil className="text-current" />
            Bearbeiten
          </DropdownMenuItem>
        ) : null}
        {props.showPaymentAction ? (
          <DropdownMenuItem className={menu.item} onSelect={props.onMarkAsPaid}>
            <Banknote className="text-current" />
            Als bezahlt markieren
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem className={menu.item} onSelect={props.onOpen}>
          <ExternalLink className="text-current" />
          Öffnen
        </DropdownMenuItem>
        {props.canDelete ? (
          <DropdownMenuItem
            className={`${menu.item} ${menu.destructiveItem}`}
            onSelect={props.onDelete}
          >
            <Trash2 className="text-current" />
            Löschen
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
