"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { api } from "@/convex/_generated/api";
import { mapCSVRow } from "@/lib/csvMappers";
import { useMutation, useQuery } from "convex/react";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

type ImportSource = "moss" | "sparkasse" | "volksbank" | "finom";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportTransactionsSheet({ open, onOpenChange }: Props) {
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [importSource, setImportSource] = useState<ImportSource | "">("");
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();

  const allTransactions = useQuery(
    api.transactions.queries.getAllTransactions,
    {},
  );
  const addTransaction = useMutation(
    api.transactions.functions.createImportedTransaction,
  );

  const existingIds = useMemo(() => {
    if (!allTransactions) return undefined;
    return new Set(
      allTransactions
        .map((transaction) => transaction.importedTransactionId)
        .filter(Boolean),
    );
  }, [allTransactions]);

  const handleFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<Record<string, string>>) =>
        setCsvData(results.data),
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (!importSource || !existingIds) return;

    const newTransactions = csvData.filter((row) => {
      const mapped = mapCSVRow(row, importSource);
      return !existingIds.has(mapped.importedTransactionId);
    });

    const skipped = csvData.length - newTransactions.length;
    const toastId = toast.loading(
      `Importiere 0/${newTransactions.length} Transaktionen...`,
    );

    try {
      for (let index = 0; index < newTransactions.length; index++) {
        const mapped = mapCSVRow(newTransactions[index], importSource);
        await addTransaction({
          date: mapped.date,
          amount: mapped.amount,
          description: mapped.description,
          counterparty: mapped.counterparty,
          importedTransactionId: mapped.importedTransactionId,
          importSource,
          accountName: mapped.accountName,
          currency: mapped.currency,
        });
        toast.loading(
          `Importiere ${index + 1}/${newTransactions.length} Transaktionen...`,
          { id: toastId },
        );
      }

      toast.success(
        `${newTransactions.length} neue Transaktionen importiert, ${skipped} Duplikate übersprungen`,
        { id: toastId },
      );
      router.push("/import");
      setCsvData([]);
      setImportSource("");
      onOpenChange(false);
    } catch {
      toast.error("Fehler beim Importieren", { id: toastId });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>CSV-Datei importieren</SheetTitle>
          <SheetDescription>
            Ziehen Sie eine CSV-Datei hierher oder wählen Sie eine Datei aus
          </SheetDescription>
        </SheetHeader>

        {csvData.length === 0 ? (
          <div className="mt-8 px-5">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <Upload
                className={`h-12 w-12 mb-4 ${isDragging ? "text-primary" : "text-muted-foreground"}`}
              />
              <p className="text-lg font-medium mb-2">CSV-Datei hier ablegen</p>
              <p className="text-sm text-muted-foreground mb-4">oder</p>
              <Button asChild variant="outline">
                <label className="cursor-pointer">
                  Datei auswählen
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] && handleFile(e.target.files[0])
                    }
                  />
                </label>
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-8 px-5">
            <div className="mb-6">
              <Label className="text-base font-medium">
                Von wo möchtest du die CSV importieren?
              </Label>
              <Select
                value={importSource}
                onValueChange={(value) =>
                  setImportSource(value as ImportSource)
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Wählen Sie die Datenquelle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="finom">Finom</SelectItem>
                  <SelectItem value="moss">Moss</SelectItem>
                  <SelectItem value="sparkasse">
                    Sparkasse (CSV-CAMT V8)
                  </SelectItem>
                  <SelectItem value="volksbank">Volksbank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <h3 className="text-lg font-medium mb-4">CSV Vorschau</h3>
            <div className="max-h-64 overflow-auto border rounded-md mb-4">
              <pre className="p-4 text-xs">
                {JSON.stringify(csvData.slice(0, 5), null, 2)}
              </pre>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Zeige erste 5 Zeilen von {csvData.length} Zeilen
            </p>

            <Button
              onClick={handleImport}
              disabled={!importSource || !existingIds}
              className="w-full"
            >
              Transaktionen importieren
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
