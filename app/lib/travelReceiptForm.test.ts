import { describe, expect, test } from "vitest";
import {
  getTravelReceiptLabel,
  withoutClientReceiptId,
} from "./travelReceiptForm";

const labels = {
  car: "PKW",
  train: "Bahn",
  flight: "Flug",
  taxi: "Taxi",
  bus: "Bus",
  accommodation: "Unterkunft",
  incidental: "Reise-Nebenkosten",
} as const;

describe("travel receipt form helpers", () => {
  test("numbers repeated cost types independently", () => {
    const receipts = [
      { clientId: "train-1", costType: "train" as const },
      { clientId: "taxi-1", costType: "taxi" as const },
      { clientId: "train-2", costType: "train" as const },
    ];

    expect(getTravelReceiptLabel(receipts, 0, labels)).toBe("Bahn 1");
    expect(getTravelReceiptLabel(receipts, 1, labels)).toBe("Taxi");
    expect(getTravelReceiptLabel(receipts, 2, labels)).toBe("Bahn 2");
  });

  test("removes the form-only id without mutating the receipt", () => {
    const receipt = {
      clientId: "train-1",
      costType: "train" as const,
      grossAmount: 49.9,
    };

    expect(withoutClientReceiptId(receipt)).toEqual({
      costType: "train",
      grossAmount: 49.9,
    });
    expect(receipt.clientId).toBe("train-1");
  });
});
