interface BudgetTransaction {
  amount: number;
  status: string;
}

export interface BudgetResult {
  currentBalance: number;
  expectedIncome: number;
  expectedExpenses: number;
  availableBudget: number;
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateBudget(transactions: BudgetTransaction[]): BudgetResult {
  let currentBalance = 0;
  let expectedIncome = 0;
  let expectedExpenses = 0;

  for (const transaction of transactions) {
    if (transaction.status === "processed") {
      currentBalance += transaction.amount;
    } else if (transaction.status === "expected") {
      if (transaction.amount > 0) expectedIncome += transaction.amount;
      else expectedExpenses += transaction.amount;
    }
  }

  const availableBudget = Math.max(
    0,
    currentBalance + expectedIncome + expectedExpenses,
  );

  return {
    currentBalance: roundCents(currentBalance),
    expectedIncome: roundCents(expectedIncome),
    expectedExpenses: roundCents(Math.abs(expectedExpenses)),
    availableBudget: roundCents(availableBudget),
  };
}
