"use client";

import { toNet } from "@/lib/bank-utils";
import { type CostType, DEFAULT_TAX_RATES } from "@/lib/travel-costs";
import { useState } from "react";
import toast from "react-hot-toast";
import type { Receipt, TravelReceipt } from "./types";

export function useReceipts(startDate: string) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [travelReceipts, setTravelReceipts] = useState<TravelReceipt[]>([]);

  const [company, setCompany] = useState("");
  const [number, setNumber] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [gross, setGross] = useState(0);
  const [taxRate, setTaxRate] = useState(19);
  const [file, setFile] = useState<string | null>(null);

  const addReceipt = () => {
    if (!company || !description || !gross || !file || !date) {
      return toast.error("Bitte Pflichtfelder ausfüllen");
    }

    setReceipts([
      ...receipts,
      {
        receiptNumber: number || undefined,
        receiptDate: date,
        companyName: company,
        description,
        netAmount: toNet(gross, taxRate),
        taxRate,
        grossAmount: gross,
        fileStorageId: file,
      },
    ]);

    setCompany("");
    setNumber("");
    setDescription("");
    setDate("");
    setGross(0);
    setTaxRate(19);
    setFile(null);

    toast.success(`Beleg ${receipts.length + 1} hinzugefügt`);
  };

  const removeReceipt = (index: number) => {
    setReceipts(receipts.filter((_, idx) => idx !== index));
  };

  const toggleCostType = (costType: CostType) => {
    const exists = travelReceipts.some(
      (receipt) => receipt.costType === costType,
    );

    if (exists) {
      setTravelReceipts(
        travelReceipts.filter((receipt) => receipt.costType !== costType),
      );
      return;
    }

    setTravelReceipts([
      ...travelReceipts,
      {
        costType,
        receiptNumber: `${costType.toUpperCase()}-001`,
        receiptDate: startDate,
        companyName: "",
        description: "",
        netAmount: 0,
        taxRate: DEFAULT_TAX_RATES[costType],
        grossAmount: 0,
        fileStorageId: null,
        kilometers: costType === "car" ? 0 : undefined,
      },
    ]);
  };

  const updateTravelReceipt = (
    costType: CostType,
    updates: Partial<TravelReceipt>,
  ) => {
    setTravelReceipts(
      travelReceipts.map((receipt) =>
        receipt.costType === costType ? { ...receipt, ...updates } : receipt,
      ),
    );
  };

  return {
    receipts,
    travelReceipts,
    company,
    number,
    description,
    date,
    gross,
    taxRate,
    file,
    setCompany,
    setNumber,
    setDescription,
    setDate,
    setGross,
    setTaxRate,
    setFile,
    addReceipt,
    removeReceipt,
    toggleCostType,
    updateTravelReceipt,
  };
}
