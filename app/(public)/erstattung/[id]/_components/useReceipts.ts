"use client";

import { toNet } from "@/lib/bank-utils";
import { type CostType, DEFAULT_TAX_RATES } from "@/lib/travel-costs";
import { createClientReceiptId } from "@/lib/travelReceiptForm";
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

    setReceipts((current) => [
      ...current,
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
    setReceipts((current) => current.filter((_, idx) => idx !== index));
  };

  const addTravelReceipt = (costType: CostType) => {
    setTravelReceipts((current) => [
      ...current,
      {
        clientId: createClientReceiptId(),
        costType,
        receiptNumber: undefined,
        receiptDate: startDate,
        companyName: costType === "car" ? "Privater PKW" : "",
        description: "",
        netAmount: 0,
        taxRate: DEFAULT_TAX_RATES[costType],
        grossAmount: 0,
        fileStorageId: "",
        kilometers: costType === "car" ? 0 : undefined,
      },
    ]);
  };

  const removeTravelReceipt = (clientId: string) => {
    setTravelReceipts((current) =>
      current.filter((receipt) => receipt.clientId !== clientId),
    );
  };

  const updateTravelReceipt = (
    clientId: string,
    updates: Partial<TravelReceipt>,
  ) => {
    setTravelReceipts((current) =>
      current.map((receipt) =>
        receipt.clientId === clientId ? { ...receipt, ...updates } : receipt,
      ),
    );
  };

  return {
    receipts,
    setReceipts,
    travelReceipts,
    setTravelReceipts,
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
    addTravelReceipt,
    removeTravelReceipt,
    updateTravelReceipt,
  };
}
