import { formatIban } from "../../bank-utils";
import { formatCurrency } from "../../formatters/formatCurrency";
import { formatDate } from "../../formatters/formatDate";
import type {
  ReceiptInput,
  ReimbursementInput,
} from "../reimbursementPdf/data";
import {
  CAR_ALLOWANCE_RATE_EUR_PER_KM,
  getMealAllowanceWithLegacyFallback,
} from "../../travel-costs";
import type { TravelMode, TravelPdfData, TravelPdfField } from "./types";

function euro(value: number): string {
  return formatCurrency(value).replace(/\u00a0/g, " ");
}

function number(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: 2,
  }).format(value);
}

function totalFor(
  receipts: ReceiptInput[],
  predicate: (receipt: ReceiptInput) => boolean,
): number {
  return receipts.reduce(
    (sum, receipt) =>
      predicate(receipt) ? sum + (receipt.grossAmount ?? 0) : sum,
    0,
  );
}

function addMoneyField(
  fields: TravelPdfData["fields"],
  field: TravelPdfField,
  value: number,
) {
  if (value > 0) fields[field] = euro(value);
}

function dateTime(date?: string, time?: string): string {
  return [formatDate(date), time].filter(Boolean).join(" ");
}

export function buildTravelPdfData(
  reimbursement: ReimbursementInput,
  receipts: ReceiptInput[],
): TravelPdfData {
  const travel = reimbursement.travelDetails;
  const fields: TravelPdfData["fields"] = {
    employeeName:
      reimbursement.submitterName || reimbursement.accountHolder || "",
    travelStart: dateTime(travel?.startDate, travel?.startTime),
    travelEnd: dateTime(travel?.endDate, travel?.endTime),
    purpose: travel?.purpose || "",
    destinations: travel?.destination || "",
    taxAssignment: reimbursement.projectName || "",
    accountHolder: reimbursement.accountHolder || "",
    iban: formatIban(reimbursement.iban || ""),
    bic: reimbursement.bic || "",
    submissionDate: formatDate(
      reimbursement.submittedAt ?? reimbursement._creationTime,
    ),
    totalReimbursable: euro(reimbursement.amount || 0),
  };

  const modes = new Set<TravelMode>();
  const carReceipts = receipts.filter((receipt) => receipt.costType === "car");
  const carKilometers = carReceipts.reduce(
    (sum, receipt) => sum + (receipt.kilometers ?? 0),
    0,
  );
  const carTotal = carReceipts.reduce(
    (sum, receipt) => sum + (receipt.grossAmount ?? 0),
    0,
  );
  if (carReceipts.length > 0) {
    modes.add("car");
    fields.privateCarKilometers = number(carKilometers);
    fields.mileageRate = euro(CAR_ALLOWANCE_RATE_EUR_PER_KM);
    addMoneyField(fields, "privateCarCost", carTotal);
  }

  const taxiTotal = totalFor(
    receipts,
    (receipt) => receipt.costType === "taxi",
  );
  const flightTotal = totalFor(
    receipts,
    (receipt) => receipt.costType === "flight",
  );
  const publicTransportTotal = totalFor(
    receipts,
    (receipt) => receipt.costType === "train" || receipt.costType === "bus",
  );
  const accommodationTotal = totalFor(
    receipts,
    (receipt) => receipt.costType === "accommodation",
  );
  const incidentalTotal = totalFor(
    receipts,
    (receipt) => receipt.costType === "incidental",
  );

  if (taxiTotal > 0) modes.add("taxi");
  if (flightTotal > 0) modes.add("flight");
  if (publicTransportTotal > 0) modes.add("train");
  addMoneyField(fields, "taxiCost", taxiTotal);
  addMoneyField(fields, "flightCost", flightTotal);
  addMoneyField(fields, "publicTransportCost", publicTransportTotal);
  addMoneyField(fields, "accommodationCost", accommodationTotal);
  addMoneyField(fields, "incidentalCost", incidentalTotal);

  const allowance = getMealAllowanceWithLegacyFallback(travel ?? {});
  const domesticFields = {
    singleDay: ["domesticSingleDays", "domesticSingleCost"],
    arrivalDay: ["domesticArrivalDays", "domesticArrivalCost"],
    fullDay: ["domesticFullDays", "domesticFullCost"],
    departureDay: ["domesticDepartureDays", "domesticDepartureCost"],
  } as const;
  const internationalFields = {
    singleDay: [
      "internationalSingleDays",
      "internationalSingleRate",
      "internationalSingleCost",
    ],
    arrivalDay: [
      "internationalArrivalDays",
      "internationalArrivalRate",
      "internationalArrivalCost",
    ],
    fullDay: [
      "internationalFullDays",
      "internationalFullRate",
      "internationalFullCost",
    ],
    departureDay: [
      "internationalDepartureDays",
      "internationalDepartureRate",
      "internationalDepartureCost",
    ],
  } as const;
  for (const key of Object.keys(allowance) as Array<keyof typeof allowance>) {
    const line = allowance[key];
    if (line.days <= 0 || line.rate <= 0) continue;
    if (travel?.isInternational) {
      const [dayField, rateField, costField] = internationalFields[key];
      fields[dayField] = number(line.days);
      fields[rateField] = euro(line.rate);
      fields[costField] = euro(line.days * line.rate);
    } else {
      const [dayField, costField] = domesticFields[key];
      fields[dayField] = number(line.days);
      fields[costField] = euro(line.days * line.rate);
    }
  }

  const nights = travel?.overnightAllowanceNights ?? 0;
  const overnightRate = travel?.overnightAllowanceRate ?? 0;
  if (nights > 0 && overnightRate > 0) {
    fields.overnightNights = number(nights);
    fields.overnightRate = euro(overnightRate);
    fields.overnightCost = euro(nights * overnightRate);
  }

  return {
    fields,
    isInternational: travel?.isInternational ?? false,
    modes,
  };
}
