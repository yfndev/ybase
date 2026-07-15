import { expect, test } from "vitest";
import type {
  ReceiptInput,
  ReimbursementInput,
} from "../reimbursementPdf/data";
import { buildTravelPdfData } from "./data";

function reimbursement(
  overrides: Partial<ReimbursementInput> = {},
): ReimbursementInput {
  return {
    type: "travel",
    accountHolder: "Erika Kontoinhaberin",
    submitterName: "Max Reisender",
    amount: 332,
    iban: "DE89370400440532013000",
    bic: "COBADEFFXXX",
    _creationTime: new Date("2026-05-21T12:00:00+02:00").getTime(),
    projectName: "Projekt Berlin",
    travelDetails: {
      startDate: "2026-05-15",
      endDate: "2026-05-20",
      destination: "Berlin",
      purpose: "YFN Event",
      isInternational: false,
      mealAllowanceDays: 1.5,
      mealAllowanceDailyBudget: 28,
    },
    ...overrides,
  };
}

test("maps domestic travel data and aggregates supported cost types", () => {
  const receipts: ReceiptInput[] = [
    { costType: "car", kilometers: 500, grossAmount: 150 },
    { costType: "train", grossAmount: 50 },
    { costType: "bus", grossAmount: 10 },
    { costType: "accommodation", grossAmount: 80 },
  ];

  const data = buildTravelPdfData(reimbursement(), receipts);

  expect(data.isInternational).toBe(false);
  expect([...data.modes]).toEqual(["car", "train"]);
  expect(data.fields).toMatchObject({
    employeeName: "Max Reisender",
    travelStart: "15.05.2026",
    travelEnd: "20.05.2026",
    purpose: "YFN Event",
    destinations: "Berlin",
    taxAssignment: "Projekt Berlin",
    privateCarKilometers: "500",
    mileageRate: "0,30 €",
    privateCarCost: "150,00 €",
    publicTransportCost: "60,00 €",
    accommodationCost: "80,00 €",
    domesticFullDays: "1,5",
    domesticFullCost: "42,00 €",
    totalReimbursable: "332,00 €",
    accountHolder: "Erika Kontoinhaberin",
    iban: "DE89 3704 0044 0532 0130 00",
    bic: "COBADEFFXXX",
    submissionDate: "21.05.2026",
  });
});

test("uses the international allowance fields and account holder fallback", () => {
  const data = buildTravelPdfData(
    reimbursement({
      submitterName: "",
      amount: 28,
      travelDetails: {
        startDate: "2026-06-01",
        endDate: "2026-06-02",
        destination: "Paris",
        purpose: "Konferenz",
        isInternational: true,
        mealAllowanceDays: 2,
        mealAllowanceDailyBudget: 14,
      },
    }),
    [],
  );

  expect(data.isInternational).toBe(true);
  expect(data.fields.employeeName).toBe("Erika Kontoinhaberin");
  expect(data.fields.internationalSingleDays).toBe("2");
  expect(data.fields.internationalSingleRate).toBe("14,00 €");
  expect(data.fields.internationalSingleCost).toBe("28,00 €");
});

test("maps all allowance categories, times, overnight and incidentals", () => {
  const data = buildTravelPdfData(
    reimbursement({
      amount: 245,
      submittedAt: new Date("2026-06-03T10:00:00+02:00").getTime(),
      travelDetails: {
        startDate: "2026-06-01",
        startTime: "08:15",
        endDate: "2026-06-03",
        endTime: "19:30",
        destination: "Brüssel",
        purpose: "Workshop",
        isInternational: true,
        mealAllowance: {
          singleDay: { days: 0, rate: 16 },
          arrivalDay: { days: 1, rate: 18 },
          fullDay: { days: 1, rate: 36 },
          departureDay: { days: 1, rate: 18 },
        },
        overnightAllowanceNights: 2,
        overnightAllowanceRate: 20,
      },
    }),
    [{ costType: "incidental", grossAmount: 15 }],
  );

  expect(data.fields).toMatchObject({
    travelStart: "01.06.2026 08:15",
    travelEnd: "03.06.2026 19:30",
    internationalArrivalDays: "1",
    internationalArrivalRate: "18,00 €",
    internationalArrivalCost: "18,00 €",
    internationalFullDays: "1",
    internationalFullRate: "36,00 €",
    internationalFullCost: "36,00 €",
    internationalDepartureDays: "1",
    internationalDepartureRate: "18,00 €",
    internationalDepartureCost: "18,00 €",
    overnightNights: "2",
    overnightRate: "20,00 €",
    overnightCost: "40,00 €",
    incidentalCost: "15,00 €",
    submissionDate: "03.06.2026",
  });
});
