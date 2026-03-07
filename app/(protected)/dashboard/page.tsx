"use client";
import { BudgetCard } from "@/components/Dashboard/BudgetCard";
import { CashflowChartUI } from "@/components/Dashboard/CashflowChartUI";
import { ExpensesByCategoryChart } from "@/components/Dashboard/ExpensesByCategoryChart";
import { IncomeByDonorChart } from "@/components/Dashboard/IncomeByDonorChart";
import { PageHeader } from "@/components/Layout/PageHeader";
import { api } from "@/convex/_generated/api";
import { calculateBudget } from "@/convex/lib/budgetCalculations";
import { useQuery } from "convex/react";

export default function DashboardPage() {
  const transactions = useQuery(
    api.transactions.queries.getAllTransactions,
    {},
  );
  const { currentBalance, expectedIncome, expectedExpenses, availableBudget } =
    calculateBudget(transactions ?? []);

  return (
    <div className="space-y-4 lg:space-y-6">
      <PageHeader title="Dashboard" showRangeCalendar />
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
        id="tour-budget-cards"
      >
        <BudgetCard
          title="Kontostand"
          amount={currentBalance}
          description="Verfügbarer Betrag auf dem Konto"
        />
        <BudgetCard
          title="Budget für Ausgaben"
          amount={availableBudget}
          description="Kontostand + geplante Einnahmen - geplante Ausgaben"
        />
        <BudgetCard
          title="Muss noch bezahlt werden"
          amount={expectedExpenses}
          description="Geplante Ausgaben, die noch nicht überwiesen wurden"
        />
        <BudgetCard
          title="Kommt noch rein"
          amount={expectedIncome}
          description="Geplante Einnahmen die noch nicht eingetroffen wurden"
        />
      </div>
      <div id="tour-chart">
        <CashflowChartUI />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        <ExpensesByCategoryChart transactions={transactions} />
        <IncomeByDonorChart transactions={transactions} />
      </div>
    </div>
  );
}
