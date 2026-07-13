"use client";

import {
  reimbursementFileUrl,
  reimbursementUploadUrl,
  uploadViaPresign,
  validateReimbursementLink,
  type ReimbursementLink,
} from "@/(public)/_lib/publicApi";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  submitReimbursementForm,
  validateReimbursement,
} from "./submitReimbursementForm";
import { useReceipts } from "./useReceipts";

export function useReimbursementForm(id: string) {
  const [link, setLink] = useState<ReimbursementLink | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [destination, setDestination] = useState("");
  const [purpose, setPurpose] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isInternational, setIsInternational] = useState(false);
  const [mealDays, setMealDays] = useState(0);
  const [mealRate, setMealRate] = useState(0);
  const [showFoodAllowance, setShowFoodAllowance] = useState(false);

  const receiptState = useReceipts(startDate);
  const { setReceipts, setTravelReceipts } = receiptState;

  useEffect(() => {
    let ignoreResult = false;

    void validateReimbursementLink(id).then((result) => {
      if (ignoreResult) return;
      setLink(result);
      if (!result.valid) return;

      const submission = result.submission;
      setName(submission?.name ?? result.invitedName ?? "");
      setEmail(submission?.email ?? result.invitedEmail ?? "");
      if (submission) {
        setIban(submission.iban);
        setBic(submission.bic);
        setAccountHolder(submission.accountHolder);
        setSignature(submission.signatureStorageId);
        setReceipts(
          submission.receipts
            .filter((receipt) => !receipt.costType)
            .map((receipt) => ({
              ...receipt,
              receiptNumber: receipt.receiptNumber,
            })),
        );
        setTravelReceipts(
          submission.receipts.filter(
            (receipt) => receipt.costType,
          ) as typeof receiptState.travelReceipts,
        );
      }

      if (result.type === "travel" && result.travelDetails) {
        setDestination(result.travelDetails.destination);
        setPurpose(result.travelDetails.purpose);
        setStartDate(result.travelDetails.startDate);
        setEndDate(result.travelDetails.endDate);
        setIsInternational(result.travelDetails.isInternational ?? false);
        setMealDays(result.travelDetails.mealAllowanceDays ?? 0);
        setMealRate(result.travelDetails.mealAllowanceDailyBudget ?? 0);
        setShowFoodAllowance((result.travelDetails.mealAllowanceDays ?? 0) > 0);
      }
    });

    return () => {
      ignoreResult = true;
    };
  }, [id, setReceipts, setTravelReceipts]);

  const isTravel = link?.valid === true && link.type === "travel";
  const mealTotal = mealDays * mealRate;

  const totalGross = isTravel
    ? receiptState.travelReceipts.reduce(
        (sum, receipt) => sum + receipt.grossAmount,
        0,
      ) + mealTotal
    : receiptState.receipts.reduce(
        (sum, receipt) => sum + receipt.grossAmount,
        0,
      );

  const generateUploadUrl = (contentType: string) =>
    reimbursementUploadUrl(id, contentType);
  const getFileUrl = (key: string) => reimbursementFileUrl(id, key);
  const uploadSignature = (blob: Blob) =>
    uploadViaPresign(
      `/api/public/reimbursement/${id}/upload-url`,
      { contentType: "image/png" },
      blob,
    );

  const handleSubmit = async () => {
    const params = {
      id,
      isTravel,
      totalGross,
      mealTotal,
      name,
      email,
      iban,
      bic,
      accountHolder,
      confirmation,
      signature,
      destination,
      purpose,
      startDate,
      endDate,
      isInternational,
      mealDays,
      mealRate,
      receipts: receiptState.receipts,
      travelReceipts: receiptState.travelReceipts,
    };

    const error = validateReimbursement(params);
    if (error) {
      return toast.error(error);
    }

    setIsSubmitting(true);

    const success = await submitReimbursementForm(params);
    if (success) {
      setSubmitted(true);
    }
    setIsSubmitting(false);
  };

  return {
    ...receiptState,
    link,
    isTravel,
    submitted,
    isSubmitting,
    mealTotal,
    totalGross,
    name,
    email,
    iban,
    bic,
    accountHolder,
    confirmation,
    signature,
    destination,
    purpose,
    startDate,
    endDate,
    isInternational,
    mealDays,
    mealRate,
    showFoodAllowance,
    setName,
    setEmail,
    setIban,
    setBic,
    setAccountHolder,
    setConfirmation,
    setSignature,
    setDestination,
    setPurpose,
    setStartDate,
    setEndDate,
    setIsInternational,
    setMealDays,
    setMealRate,
    setShowFoodAllowance,
    handleSubmit,
    generateUploadUrl,
    getFileUrl,
    uploadSignature,
  };
}
