"use client";

import { formatIban, toNet } from "@/lib/bank-utils";
import { COST_LABELS } from "@/lib/travel-costs";
import { useParams } from "next/navigation";
import ExternalReimbursementPageUI from "./ExternalReimbursementPageUI";
import {
  ReimbursementInvalidScreen,
  ReimbursementLoadingScreen,
  ReimbursementSubmittedScreen,
} from "./_components/ReimbursementStatusScreen";
import { useReimbursementForm } from "./_components/useReimbursementForm";

export default function ExternalReimbursementPage() {
  const { id } = useParams<{ id: string }>();
  const form = useReimbursementForm(id);

  if (!form.link) {
    return <ReimbursementLoadingScreen />;
  }

  if (!form.link.valid) {
    return <ReimbursementInvalidScreen error={form.link.error} />;
  }

  if (form.submitted) {
    return <ReimbursementSubmittedScreen />;
  }

  return (
    <ExternalReimbursementPageUI
      isTravel={form.isTravel}
      organizationName={form.link.organizationName}
      projectName={form.link.projectName}
      allowFoodAllowance={form.link.travelDetails?.allowFoodAllowance ?? false}
      showFoodAllowance={form.showFoodAllowance}
      onShowFoodAllowanceChange={form.setShowFoodAllowance}
      name={form.name}
      email={form.email}
      onNameChange={form.setName}
      onEmailChange={form.setEmail}
      destination={form.destination}
      purpose={form.purpose}
      startDate={form.startDate}
      endDate={form.endDate}
      isInternational={form.isInternational}
      mealDays={form.mealDays}
      mealRate={form.mealRate}
      mealTotal={form.mealTotal}
      onDestinationChange={form.setDestination}
      onPurposeChange={form.setPurpose}
      onStartDateChange={form.setStartDate}
      onEndDateChange={form.setEndDate}
      onIsInternationalChange={form.setIsInternational}
      onMealDaysChange={form.setMealDays}
      onMealRateChange={form.setMealRate}
      company={form.company}
      number={form.number}
      description={form.description}
      date={form.date}
      gross={form.gross}
      taxRate={form.taxRate}
      file={form.file}
      onCompanyChange={form.setCompany}
      onNumberChange={form.setNumber}
      onDescriptionChange={form.setDescription}
      onDateChange={form.setDate}
      onGrossChange={form.setGross}
      onTaxRateChange={form.setTaxRate}
      onFileChange={form.setFile}
      receipts={form.receipts}
      travelReceipts={form.travelReceipts}
      onAddReceipt={form.addReceipt}
      onRemoveReceipt={form.removeReceipt}
      onToggleCostType={form.toggleCostType}
      onUpdateTravelReceipt={form.updateTravelReceipt}
      totalGross={form.totalGross}
      accountHolder={form.accountHolder}
      iban={form.iban}
      bic={form.bic}
      onAccountHolderChange={form.setAccountHolder}
      onIbanChange={form.setIban}
      onBicChange={form.setBic}
      confirmation={form.confirmation}
      signature={form.signature}
      onConfirmationChange={form.setConfirmation}
      onSignatureChange={form.setSignature}
      isSubmitting={form.isSubmitting}
      onSubmit={form.handleSubmit}
      generateUploadUrl={form.generateUploadUrl}
      getFileUrl={form.getFileUrl}
      uploadSignature={form.uploadSignature}
      toNet={toNet}
      formatIban={formatIban}
      costLabels={COST_LABELS}
    />
  );
}
