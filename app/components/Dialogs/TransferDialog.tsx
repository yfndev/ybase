import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { calculateBudget } from "@/convex/lib/budgetCalculations";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import toast from "react-hot-toast";
import { AmountInput } from "../Selectors/AmountInput";
import { SelectProject } from "../Selectors/SelectProject";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromProjectId?: Id<"projects">;
}

export function TransferDialog({ open, onOpenChange, fromProjectId }: Props) {
  const [senderId, setSenderId] = useState<Id<"projects"> | null>(
    fromProjectId ?? null,
  );
  const [receiverId, setReceiverId] = useState<Id<"projects"> | null>(null);
  const [amountStr, setAmountStr] = useState("");

  const transactions = useQuery(
    api.transactions.queries.getAllTransactions,
    senderId ? { projectId: senderId } : "skip",
  );
  const balance = transactions
    ? calculateBudget(transactions).currentBalance
    : 0;
  const amount = Number(amountStr.replace(",", ".")) || 0;

  const transferMoney = useMutation(api.transactions.functions.transferMoney);

  const canSubmit =
    senderId &&
    receiverId &&
    senderId !== receiverId &&
    transactions !== undefined &&
    amount > 0 &&
    balance >= amount;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await transferMoney({
      amount,
      sendingProjectId: senderId,
      receivingProjectId: receiverId,
    });
    toast.success("Geld erfolgreich übertragen");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Geld übertragen</DialogTitle>
          <DialogDescription>
            (nur auf dem Konto verfügbare Gelder können übertragen werden; keine
            geplanten Einnahmen)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Von Projekt</Label>
            <SelectProject
              value={senderId ?? ""}
              onValueChange={(value) => setSenderId(value as Id<"projects">)}
              showRuecklagen
            />
          </div>
          <div className="space-y-2">
            <Label>Zu Projekt</Label>
            <SelectProject
              value={receiverId ?? ""}
              onValueChange={(value) => setReceiverId(value as Id<"projects">)}
              autoFocus={open && !!fromProjectId}
              showRuecklagen
            />
          </div>
          <div className="space-y-2">
            <Label>Betrag</Label>
            <AmountInput value={amountStr} onChange={setAmountStr} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Übertragen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
