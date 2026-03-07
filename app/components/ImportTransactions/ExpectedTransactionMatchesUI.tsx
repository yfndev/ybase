"use client";

import { useState } from "react";
import type { Doc } from "@/convex/_generated/dataModel";
import { formatCurrency } from "@/lib/formatters/formatCurrency";
import { formatDate } from "@/lib/formatters/formatDate";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Props {
  expectedTransactions: Doc<"transactions">[];
  selectedMatch: string | null;
  onSelect: (id: string) => void;
}

export function ExpectedTransactionMatchesUI({
  expectedTransactions,
  selectedMatch,
  onSelect,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!expectedTransactions.length) {
    return (
      <div>
        <h3 className="text-xl font-semibold mb-6">
          Geplante Ausgabe matchen:
        </h3>
        <p className="text-sm text-muted-foreground">
          Keine möglichen Matches gefunden :)
        </p>
      </div>
    );
  }

  const filteredTransactions = expectedTransactions.filter((transaction) => {
    const search = searchTerm.toLowerCase();
    return (
      transaction.counterparty?.toLowerCase().includes(search) ||
      transaction.description?.toLowerCase().includes(search) ||
      transaction.amount.toString().includes(search)
    );
  });

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">Geplante Ausgabe matchen:</h3>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Suche nach Empfänger, Beschreibung..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredTransactions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Keine Ergebnisse gefunden.
        </p>
      ) : (
        <div className="max-h-[400px] overflow-y-auto">
          {filteredTransactions.map((transaction) => {
            const isSelected = selectedMatch === transaction._id;

            return (
              <div
                key={transaction._id}
                className={`cursor-pointer transition-all my-2 px-4 py-3 border rounded-sm ${
                  isSelected
                    ? "bg-primary/5 border-l-4 border-l-primary"
                    : "hover:bg-accent"
                }`}
                onClick={() => onSelect(transaction._id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold mb-1">{transaction.counterparty}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {transaction.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-4">
                    <span className="font-semibold whitespace-nowrap">
                      {formatCurrency(transaction.amount)}
                    </span>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(transaction.date)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
