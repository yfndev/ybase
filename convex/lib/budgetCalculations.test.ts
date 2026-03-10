import { expect, test } from "vitest";
import { calculateBudget } from "./budgetCalculations";

const mockTransaction = (amount: number, status: "processed" | "expected") =>
  ({ amount, status });

const transactions = [
  mockTransaction(100, "processed"),
  mockTransaction(-30, "processed"),
  mockTransaction(500, "expected"),
  mockTransaction(-200, "expected"),
];

test("calculates current balance by summing processed transactions", () => {
  const result = calculateBudget(transactions);
  expect(result.currentBalance).toBe(70);
});

test("calculates expected income and expenses", () => {
  const result = calculateBudget(transactions);
  expect(result.expectedIncome).toBe(500);
  expect(result.expectedExpenses).toBe(200);
});

test("returns zeros for empty transactions", () => {
  const result = calculateBudget([]);
  expect(result.currentBalance).toBe(0);
  expect(result.expectedIncome).toBe(0);
  expect(result.expectedExpenses).toBe(0);
});

test("returns 0 if available budget is negative", () => {
  const negativeTransaction = [mockTransaction(-1000, "processed")];
  const result = calculateBudget(negativeTransaction);
  expect(result.availableBudget).toBe(0);
});

test("calculates positive available budget", () => {
  const result = calculateBudget(transactions);
  expect(result.availableBudget).toBe(370);
});

test("rounds to cents to avoid floating point drift", () => {
  const floatTransactions = [
    mockTransaction(0.1, "processed"),
    mockTransaction(0.2, "processed"),
    mockTransaction(0.3, "expected"),
  ];
  const result = calculateBudget(floatTransactions);
  expect(result.currentBalance).toBe(0.3);
  expect(result.expectedIncome).toBe(0.3);
  expect(result.availableBudget).toBe(0.6);
});
