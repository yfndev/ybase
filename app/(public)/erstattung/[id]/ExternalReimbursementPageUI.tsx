import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters/formatCurrency";
import { Loader2 } from "lucide-react";
import { BankAndConfirmation } from "./_components/BankAndConfirmation";
import { FoodAllowanceSection } from "./_components/FoodAllowanceSection";
import { SimpleReceiptsSection } from "./_components/SimpleReceiptsSection";
import { SubmitterSection } from "./_components/SubmitterSection";
import { TravelCostsSection } from "./_components/TravelCostsSection";
import { TravelDetailsSection } from "./_components/TravelDetailsSection";
import type { ExternalReimbursementPageUIProps } from "./_components/types";

export default function ExternalReimbursementPageUI(
  props: ExternalReimbursementPageUIProps,
) {
  return (
    <div className="min-h-svh py-8">
      <div className="max-w-2xl mx-auto px-6 space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            {props.isTravel ? "Reisekostenerstattung" : "Auslagenerstattung"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {props.organizationName} - {props.projectName}
          </p>
        </div>

        <SubmitterSection
          name={props.name}
          email={props.email}
          onNameChange={props.onNameChange}
          onEmailChange={props.onEmailChange}
        />

        {props.isTravel ? (
          <>
            <TravelDetailsSection
              destination={props.destination}
              purpose={props.purpose}
              startDate={props.startDate}
              endDate={props.endDate}
              isInternational={props.isInternational}
              onDestinationChange={props.onDestinationChange}
              onPurposeChange={props.onPurposeChange}
              onStartDateChange={props.onStartDateChange}
              onEndDateChange={props.onEndDateChange}
              onIsInternationalChange={props.onIsInternationalChange}
            />

            <TravelCostsSection
              travelReceipts={props.travelReceipts}
              costLabels={props.costLabels}
              onToggleCostType={props.onToggleCostType}
              onUpdateTravelReceipt={props.onUpdateTravelReceipt}
              toNet={props.toNet}
              generateUploadUrl={props.generateUploadUrl}
              getFileUrl={props.getFileUrl}
            />

            {props.allowFoodAllowance && (
              <FoodAllowanceSection
                showFoodAllowance={props.showFoodAllowance}
                onShowFoodAllowanceChange={props.onShowFoodAllowanceChange}
                mealDays={props.mealDays}
                mealRate={props.mealRate}
                mealTotal={props.mealTotal}
                onMealDaysChange={props.onMealDaysChange}
                onMealRateChange={props.onMealRateChange}
              />
            )}
          </>
        ) : (
          <SimpleReceiptsSection
            company={props.company}
            number={props.number}
            description={props.description}
            date={props.date}
            gross={props.gross}
            taxRate={props.taxRate}
            file={props.file}
            receipts={props.receipts}
            onCompanyChange={props.onCompanyChange}
            onNumberChange={props.onNumberChange}
            onDescriptionChange={props.onDescriptionChange}
            onDateChange={props.onDateChange}
            onGrossChange={props.onGrossChange}
            onTaxRateChange={props.onTaxRateChange}
            onFileChange={props.onFileChange}
            onAddReceipt={props.onAddReceipt}
            onRemoveReceipt={props.onRemoveReceipt}
            toNet={props.toNet}
            generateUploadUrl={props.generateUploadUrl}
            getFileUrl={props.getFileUrl}
          />
        )}

        {props.totalGross > 0 && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between text-lg font-semibold">
              <span>Gesamtbetrag</span>
              <span>{formatCurrency(props.totalGross)}</span>
            </div>
          </div>
        )}

        <BankAndConfirmation
          accountHolder={props.accountHolder}
          iban={props.iban}
          bic={props.bic}
          onAccountHolderChange={props.onAccountHolderChange}
          onIbanChange={props.onIbanChange}
          onBicChange={props.onBicChange}
          confirmation={props.confirmation}
          signature={props.signature}
          onConfirmationChange={props.onConfirmationChange}
          onSignatureChange={props.onSignatureChange}
          formatIban={props.formatIban}
          uploadSignature={props.uploadSignature}
        />

        <Button
          onClick={props.onSubmit}
          className="w-full h-14 font-semibold"
          size="lg"
          disabled={props.isSubmitting}
        >
          {props.isSubmitting && (
            <Loader2 className="size-5 animate-spin mr-2" />
          )}
          Einreichen
        </Button>
      </div>
    </div>
  );
}
