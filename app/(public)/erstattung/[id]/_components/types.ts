import type { MealAllowance } from "@/lib/db/types";
import type { CostType } from "@/lib/travel-costs";

export type { CostType };

export type Receipt = {
  receiptNumber: string | undefined;
  receiptDate: string;
  companyName: string;
  description: string;
  netAmount: number;
  taxRate: number;
  grossAmount: number;
  fileStorageId?: string | null;
};

export type TravelReceipt = Receipt & {
  costType: CostType;
  kilometers?: number;
};

export type ExternalReimbursementPageUIProps = {
  isTravel: boolean;
  organizationName: string;
  projectName: string;
  allowFoodAllowance: boolean;
  changesRequested?: string;
  showFoodAllowance: boolean;
  onShowFoodAllowanceChange: (value: boolean) => void;

  name: string;
  email: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;

  destination: string;
  purpose: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  isInternational: boolean;
  mealAllowance: MealAllowance;
  mealTotal: number;
  showOvernightAllowance: boolean;
  overnightAllowanceNights: number;
  overnightAllowanceRate: number;
  overnightTotal: number;
  onDestinationChange: (value: string) => void;
  onPurposeChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onIsInternationalChange: (value: boolean) => void;
  onMealAllowanceChange: (value: MealAllowance) => void;
  onShowOvernightAllowanceChange: (value: boolean) => void;
  onOvernightAllowanceNightsChange: (value: number) => void;
  onOvernightAllowanceRateChange: (value: number) => void;

  company: string;
  number: string;
  description: string;
  date: string;
  gross: number;
  taxRate: number;
  file: string | null;
  onCompanyChange: (value: string) => void;
  onNumberChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onGrossChange: (value: number) => void;
  onTaxRateChange: (value: number) => void;
  onFileChange: (value: string | null) => void;

  receipts: Receipt[];
  travelReceipts: TravelReceipt[];
  onAddReceipt: () => void;
  onRemoveReceipt: (index: number) => void;
  onToggleCostType: (costType: CostType) => void;
  onUpdateTravelReceipt: (
    costType: CostType,
    updates: Partial<TravelReceipt>,
  ) => void;

  totalGross: number;

  accountHolder: string;
  iban: string;
  bic: string;
  onAccountHolderChange: (value: string) => void;
  onIbanChange: (value: string) => void;
  onBicChange: (value: string) => void;

  confirmation: boolean;
  signature: string | null;
  onConfirmationChange: (value: boolean) => void;
  onSignatureChange: (value: string) => void;

  isSubmitting: boolean;
  onSubmit: () => void;

  generateUploadUrl: (
    contentType: string,
  ) => Promise<{ key: string; url: string }>;
  getFileUrl: (key: string) => Promise<string | null>;
  uploadSignature: (blob: Blob) => Promise<string>;

  toNet: (gross: number, tax: number) => number;
  formatIban: (iban: string) => string;
  costLabels: Record<CostType, string>;
};
