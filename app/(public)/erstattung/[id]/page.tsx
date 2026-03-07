"use client";

import { SignatureQRModal } from "@/components/Reimbursements/SignatureField";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  BIC_REGEX,
  formatIban,
  IBAN_REGEX,
  normalizeIban,
  toNet,
} from "@/lib/bank-utils";
import {
  COST_LABELS,
  type CostType,
  DEFAULT_TAX_RATES,
} from "@/lib/travel-costs";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import ExternalReimbursementPageUI from "./ExternalReimbursementPageUI";

type Receipt = {
  receiptNumber: string;
  receiptDate: string;
  companyName: string;
  description: string;
  netAmount: number;
  taxRate: number;
  grossAmount: number;
  fileStorageId: Id<"_storage"> | null;
};

type TravelReceipt = Receipt & {
  costType: CostType;
  kilometers?: number;
};

export default function ExternalReimbursementPage() {
  const params = useParams<{ id: string }>();
  const reimbursementId = params.id as Id<"reimbursements">;

  const link = useQuery(api.reimbursements.sharing.validateReimbursementLink, {
    id: reimbursementId,
  });
  const generateUploadUrl = useMutation(
    api.reimbursements.sharing.generatePublicUploadUrl
  );
  const submitExternal = useMutation(
    api.reimbursements.sharing.submitExternalReimbursement
  );
  const createSignatureToken = useMutation(
    api.signatures.functions.createToken
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const [signature, setSignature] = useState<Id<"_storage"> | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureToken, setSignatureToken] = useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  const [destination, setDestination] = useState("");
  const [purpose, setPurpose] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isInternational, setIsInternational] = useState(false);
  const [mealDays, setMealDays] = useState(0);
  const [mealRate, setMealRate] = useState(0);

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [travelReceipts, setTravelReceipts] = useState<TravelReceipt[]>([]);

  const [company, setCompany] = useState("");
  const [number, setNumber] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [gross, setGross] = useState(0);
  const [taxRate, setTaxRate] = useState(19);
  const [file, setFile] = useState<Id<"_storage"> | null>(null);

  const isTravel = link?.valid && link.type === "travel";
  const mealTotal = mealDays * mealRate;

  const totalGross = isTravel
    ? travelReceipts.reduce((sum, receipt) => sum + receipt.grossAmount, 0) +
      mealTotal
    : receipts.reduce((sum, receipt) => sum + receipt.grossAmount, 0);

  const addReceipt = () => {
    if (!number || !company || !gross || !file || !date) {
      return toast.error("Bitte Pflichtfelder ausfüllen");
    }

    setReceipts([
      ...receipts,
      {
        receiptNumber: number,
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
      (receipt) => receipt.costType === costType
    );

    if (exists) {
      setTravelReceipts(
        travelReceipts.filter((receipt) => receipt.costType !== costType)
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
    updates: Partial<TravelReceipt>
  ) => {
    setTravelReceipts(
      travelReceipts.map((receipt) =>
        receipt.costType === costType ? { ...receipt, ...updates } : receipt
      )
    );
  };

  const handleMobileSign = async () => {
    const token = await createSignatureToken({});
    setSignatureToken(token);
    setShowSignatureModal(true);
  };

  const handleSubmit = async () => {
    if (
      !name ||
      !iban ||
      !bic ||
      !accountHolder ||
      !confirmation ||
      !signature
    ) {
      return toast.error("Bitte alle Pflichtfelder ausfüllen");
    }

    if (isTravel) {
      if (!destination || !purpose || !startDate || !endDate) {
        return toast.error("Bitte alle Reiseangaben ausfüllen");
      }
      if (travelReceipts.length === 0 && mealTotal === 0) {
        return toast.error(
          "Bitte mindestens eine Kostenart oder Verpflegung hinzufügen"
        );
      }
    } else {
      if (receipts.length === 0) {
        return toast.error("Bitte mindestens einen Beleg hinzufügen");
      }
    }

    const normalizedIban = normalizeIban(iban);
    if (!IBAN_REGEX.test(normalizedIban)) {
      return toast.error("Ungültige IBAN");
    }

    if (bic && !BIC_REGEX.test(bic.toUpperCase())) {
      return toast.error("Ungültige BIC");
    }

    setIsSubmitting(true);

    try {
      const validReceipts = receipts
        .filter((receipt) => receipt.fileStorageId)
        .map((receipt) => ({
          ...receipt,
          fileStorageId: receipt.fileStorageId!,
        }));

      const validTravelReceipts = travelReceipts
        .filter((receipt) => receipt.fileStorageId && receipt.grossAmount > 0)
        .map((receipt) => ({
          ...receipt,
          fileStorageId: receipt.fileStorageId!,
        }));

      await submitExternal({
        reimbursementId,
        amount: totalGross,
        iban: normalizeIban(iban),
        bic: bic.toUpperCase(),
        accountHolder,
        submitterName: name,
        submitterEmail: email || undefined,
        signatureStorageId: signature,
        receipts: validReceipts,
        travelReceipts: isTravel ? validTravelReceipts : undefined,
        travelDetails: isTravel
          ? {
              startDate,
              endDate,
              destination,
              purpose,
              isInternational,
              mealAllowanceDays: mealDays || undefined,
              mealAllowanceDailyBudget: mealRate || undefined,
            }
          : undefined,
      });

      setSubmitted(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Einreichen"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!link) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!link.valid) {
    return (
      <div className="flex min-h-svh items-center justify-center p-8">
        <div className="text-center max-w-md">
          <AlertCircle className="size-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Link ungültig</h1>
          <p className="text-muted-foreground">{link.error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-svh items-center justify-center p-8">
        <div className="text-center max-w-md">
          <CheckCircle2 className="size-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Erfolgreich eingereicht</h1>
          <p className="text-muted-foreground">
            Deine Erstattung wurde erfolgreich eingereicht. Du kannst dieses
            Fenster jetzt schließen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ExternalReimbursementPageUI
        isTravel={isTravel ?? false}
        organizationName={link.organizationName}
        projectName={link.projectName}
        allowFoodAllowance={link.travelDetails?.allowFoodAllowance ?? false}
        name={name}
        email={email}
        onNameChange={setName}
        onEmailChange={setEmail}
        destination={destination}
        purpose={purpose}
        startDate={startDate}
        endDate={endDate}
        isInternational={isInternational}
        mealDays={mealDays}
        mealRate={mealRate}
        mealTotal={mealTotal}
        onDestinationChange={setDestination}
        onPurposeChange={setPurpose}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onIsInternationalChange={setIsInternational}
        onMealDaysChange={setMealDays}
        onMealRateChange={setMealRate}
        company={company}
        number={number}
        description={description}
        date={date}
        gross={gross}
        taxRate={taxRate}
        file={file}
        onCompanyChange={setCompany}
        onNumberChange={setNumber}
        onDescriptionChange={setDescription}
        onDateChange={setDate}
        onGrossChange={setGross}
        onTaxRateChange={setTaxRate}
        onFileChange={setFile}
        receipts={receipts}
        travelReceipts={travelReceipts}
        onAddReceipt={addReceipt}
        onRemoveReceipt={removeReceipt}
        onToggleCostType={toggleCostType}
        onUpdateTravelReceipt={updateTravelReceipt}
        totalGross={totalGross}
        accountHolder={accountHolder}
        iban={iban}
        bic={bic}
        onAccountHolderChange={setAccountHolder}
        onIbanChange={setIban}
        onBicChange={setBic}
        confirmation={confirmation}
        signature={signature}
        onConfirmationChange={setConfirmation}
        onSignatureChange={setSignature}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        reimbursementId={reimbursementId}
        generateUploadUrl={() => generateUploadUrl({ reimbursementId })}
        toNet={toNet}
        formatIban={formatIban}
        costLabels={COST_LABELS}
        onMobileSign={handleMobileSign}
      />

      {signatureToken && (
        <SignatureQRModal
          token={signatureToken}
          open={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          onSignatureReceived={setSignature}
        />
      )}
    </>
  );
}
