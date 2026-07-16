import { OvernightAllowanceSection } from "@/components/Reimbursements/OvernightAllowanceSection";
import { BankAndSignature } from "./_components/BankAndSignature";
import { FoodAllowanceSection } from "./_components/FoodAllowanceSection";
import { PublicReimbursementSummary } from "./_components/PublicReimbursementSummary";
import { SimpleReceiptsSection } from "./_components/SimpleReceiptsSection";
import { SubmitterSection } from "./_components/SubmitterSection";
import { TravelCostsSection } from "./_components/TravelCostsSection";
import { TravelDetailsSection } from "./_components/TravelDetailsSection";
import type { ExternalReimbursementPageUIProps } from "./_components/types";

export default function ExternalReimbursementPageUI(
  props: ExternalReimbursementPageUIProps,
) {
  return (
    <main className="min-h-svh py-6 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
        <header className="text-center">
          <h1 className="text-2xl font-bold">
            {props.isTravel ? "Reisekostenerstattung" : "Auslagenerstattung"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {props.organizationName} - {props.projectName}
          </p>
        </header>

        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-10">
          <div className="min-w-0 space-y-8">
            {props.changesRequested ? (
              <div className="border border-orange-200 bg-orange-50 p-4">
                <p className="text-sm font-medium text-orange-800">
                  Folgende Änderungen wurden angefordert:
                </p>
                <p className="mt-1 text-orange-700">{props.changesRequested}</p>
              </div>
            ) : null}

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
                  startTime={props.startTime}
                  endDate={props.endDate}
                  endTime={props.endTime}
                  isInternational={props.isInternational}
                  onDestinationChange={props.onDestinationChange}
                  onPurposeChange={props.onPurposeChange}
                  onStartDateChange={props.onStartDateChange}
                  onStartTimeChange={props.onStartTimeChange}
                  onEndDateChange={props.onEndDateChange}
                  onEndTimeChange={props.onEndTimeChange}
                  onIsInternationalChange={props.onIsInternationalChange}
                />
                <TravelCostsSection
                  organizationName={props.organizationName}
                  travelReceipts={props.travelReceipts}
                  costLabels={props.costLabels}
                  onAddTravelReceipt={props.onAddTravelReceipt}
                  onRemoveTravelReceipt={props.onRemoveTravelReceipt}
                  onUpdateTravelReceipt={props.onUpdateTravelReceipt}
                  toNet={props.toNet}
                  generateUploadUrl={props.generateUploadUrl}
                  getFileUrl={props.getFileUrl}
                />

                {props.allowFoodAllowance ? (
                  <FoodAllowanceSection
                    showFoodAllowance={props.showFoodAllowance}
                    onShowFoodAllowanceChange={props.onShowFoodAllowanceChange}
                    allowance={props.mealAllowance}
                    isInternational={props.isInternational}
                    mealTotal={props.mealTotal}
                    onAllowanceChange={props.onMealAllowanceChange}
                  />
                ) : null}

                <OvernightAllowanceSection
                  enabled={props.showOvernightAllowance}
                  isInternational={props.isInternational}
                  nights={props.overnightAllowanceNights}
                  rate={props.overnightAllowanceRate}
                  total={props.overnightTotal}
                  onEnabledChange={props.onShowOvernightAllowanceChange}
                  onNightsChange={props.onOvernightAllowanceNightsChange}
                  onRateChange={props.onOvernightAllowanceRateChange}
                />
              </>
            ) : (
              <SimpleReceiptsSection
                organizationName={props.organizationName}
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

            <BankAndSignature
              accountHolder={props.accountHolder}
              iban={props.iban}
              bic={props.bic}
              onAccountHolderChange={props.onAccountHolderChange}
              onIbanChange={props.onIbanChange}
              onBicChange={props.onBicChange}
              signature={props.signature}
              onSignatureChange={props.onSignatureChange}
              formatIban={props.formatIban}
              uploadSignature={props.uploadSignature}
              getFileUrl={props.getFileUrl}
            />
          </div>

          <div className="xl:sticky xl:top-6">
            <PublicReimbursementSummary
              isTravel={props.isTravel}
              receipts={props.receipts}
              travelReceipts={props.travelReceipts}
              mealTotal={props.mealTotal}
              overnightTotal={props.overnightTotal}
              totalGross={props.totalGross}
              costLabels={props.costLabels}
              isSubmitting={props.isSubmitting}
              onSubmit={props.onSubmit}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
