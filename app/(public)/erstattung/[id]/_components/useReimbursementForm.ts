"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { uploadViaPresign } from "@/(public)/_lib/http";
import {
  type ReimbursementLink,
  reimbursementFileUrl,
  reimbursementUploadUrl,
  validateReimbursementLink,
} from "@/(public)/_lib/reimbursements";
import {
  submitReimbursementForm,
  validateReimbursement,
} from "./submitReimbursementForm";
import { usePublicTravelFields } from "./usePublicTravelFields";
import { useReceipts } from "./useReceipts";

export function useReimbursementForm(id: string) {
  const [link, setLink] = useState<ReimbursementLink | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const travel = usePublicTravelFields();
  const receiptState = useReceipts(travel.startDate);
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
        travel.hydrate(result.travelDetails);
      }
    });

    return () => {
      ignoreResult = true;
    };
  }, [id, setReceipts, setTravelReceipts, travel.hydrate]);

  const isTravel = link?.valid === true && link.type === "travel";
  const totalGross = isTravel
    ? receiptState.travelReceipts.reduce(
        (sum, receipt) => sum + receipt.grossAmount,
        0,
      ) +
      travel.mealTotal +
      travel.overnightTotal
    : receiptState.receipts.reduce(
        (sum, receipt) => sum + receipt.grossAmount,
        0,
      );

  const generateUploadUrl = useCallback(
    (contentType: string) => reimbursementUploadUrl(id, contentType),
    [id],
  );
  const getFileUrl = useCallback(
    (key: string) => reimbursementFileUrl(id, key),
    [id],
  );
  const uploadSignature = useCallback(
    (blob: Blob) =>
      uploadViaPresign(
        `/api/public/reimbursement/${id}/upload-url`,
        { contentType: "image/png" },
        blob,
      ),
    [id],
  );

  const handleSubmit = async () => {
    const params = {
      id,
      isTravel,
      totalGross,
      mealTotal: travel.mealTotal,
      name,
      email,
      iban,
      bic,
      accountHolder,
      signature,
      destination: travel.destination,
      purpose: travel.purpose,
      startDate: travel.startDate,
      startTime: travel.startTime,
      endDate: travel.endDate,
      endTime: travel.endTime,
      isInternational: travel.isInternational,
      mealAllowance: travel.mealAllowance,
      overnightAllowanceNights: travel.overnightAllowanceNights,
      overnightAllowanceRate: travel.overnightAllowanceRate,
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
    ...travel,
    totalGross,
    name,
    email,
    iban,
    bic,
    accountHolder,
    signature,
    setName,
    setEmail,
    setIban,
    setBic,
    setAccountHolder,
    setSignature,
    handleSubmit,
    generateUploadUrl,
    getFileUrl,
    uploadSignature,
  };
}
