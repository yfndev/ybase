import { AmountInput } from "@/components/Selectors/AmountInput";
import { DateInput } from "@/components/Selectors/DateInput";
import { SelectCategory } from "@/components/Selectors/SelectCategory";
import { SelectDonor } from "@/components/Selectors/SelectDonor";
import { SelectProject } from "@/components/Selectors/SelectProject";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  type: "income" | "expense";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionSheet({ type, open, onOpenChange }: Props) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [description, setDescription] = useState("");
  const [project, setProject] = useState("");
  const [donor, setDonor] = useState("");

  const addTransaction = useMutation(
    api.transactions.functions.createExpectedTransaction,
  );

  const isExpense = type === "expense";
  const isFormValid = amount && project && counterparty && category && date;

  const resetForm = () => {
    setAmount("");
    setCategory("");
    setDate("");
    setCounterparty("");
    setDescription("");
    setProject("");
    setDonor("");
  };

  const handleSubmit = async () => {
    if (!amount || !project || !counterparty || !category) {
      toast.error("Füll bitte alle erforderlichen Felder aus");
      return;
    }

    try {
      const numAmount = parseFloat(amount.replace(",", "."));
      await addTransaction({
        projectId: project as Id<"projects">,
        date: date ? new Date(date).getTime() : Date.now(),
        amount: isExpense ? -numAmount : numAmount,
        description,
        counterparty,
        categoryId: category as Id<"categories">,
        status: "expected",
        donorId: donor ? (donor as Id<"donors">) : undefined,
      });
      toast.success(
        isExpense ? "Ausgabe gespeichert!" : "Einnahme gespeichert!",
      );
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("cannot be used for category")) {
        toast.error(
          "Der Förderer kann nicht für diese Kategorie verwendet werden.",
        );
      } else {
        toast.error("Fehler beim Speichern");
      }
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.metaKey && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        className="w-full sm:max-w-lg overflow-y-auto flex flex-col p-0"
        onKeyDown={handleKeyDown}
      >
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="text-2xl">
            {isExpense ? "Ausgabe planen" : "Einnahme erfassen"}
          </SheetTitle>
          <SheetDescription className="text-xs mt-0.5">
            Alle Felder müssen ausgefüllt sein
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col gap-6 px-6 py-4">
          <div className="flex flex-col gap-3">
            <Label htmlFor="amount" className="text-base">
              Wie viel?
            </Label>
            <AmountInput value={amount} onChange={setAmount} autoFocus />
          </div>

          <div className="flex flex-col gap-3">
            <Label className="text-base">Wann?</Label>
            <DateInput value={date} onChange={setDate} className="bg-muted" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="counterparty">
              {isExpense ? "Empfänger" : "Von"}
            </Label>
            <Input
              id="counterparty"
              placeholder={
                isExpense ? "z.B. Lieferant, Firma..." : "z.B. Kunde, Firma..."
              }
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
              className="bg-muted"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              placeholder={
                isExpense ? "Details zur Ausgabe..." : "Details zur Einnahme..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label className="text-base">Projekt</Label>
            <SelectProject value={project} onValueChange={setProject} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Kategorie</Label>
            <SelectCategory value={category} onValueChange={setCategory} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Förderer</Label>
            <SelectDonor value={donor} onValueChange={setDonor} />
          </div>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-2">
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="w-full h-12 text-base"
          >
            {isExpense ? "Ausgabe planen" : "Einnahme erfassen"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
