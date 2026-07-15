import { useCallback, useState } from "react";
import type { Allowance, Reimbursement, SelectionKey } from "./types";

export function useReimbursementSelection(
  reimbursements: Reimbursement[],
  allowances: Allowance[],
) {
  const [selected, setSelected] = useState<Set<SelectionKey>>(() => new Set());

  const clearSelection = useCallback(() => setSelected(new Set()), []);
  const toggleSelection = useCallback((key: SelectionKey) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
  const toggleAll = useCallback(() => {
    const allKeys: SelectionKey[] = [
      ...reimbursements.map((item): SelectionKey => `r:${item._id}`),
      ...allowances.map((item): SelectionKey => `a:${item._id}`),
    ];
    setSelected((current) =>
      current.size === allKeys.length ? new Set() : new Set(allKeys),
    );
  }, [allowances, reimbursements]);
  const removeSelection = useCallback((keys: SelectionKey[]) => {
    setSelected((current) => {
      const next = new Set(current);
      for (const key of keys) next.delete(key);
      return next;
    });
  }, []);

  return {
    selected,
    clearSelection,
    toggleSelection,
    toggleAll,
    removeSelection,
  };
}
