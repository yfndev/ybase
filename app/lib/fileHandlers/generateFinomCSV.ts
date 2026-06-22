type FinomPayment = {
  name: string;
  iban: string;
  amount: number;
  currency?: string;
  reference: string;
};

const HEADER = "Name;IBAN;Amount;Currency;Reference";

export function generateFinomCSV(payments: FinomPayment[]): Blob {
  const rows = payments.map((p) =>
    [
      cleanField(p.name),
      p.iban.replace(/\s/g, ""),
      formatAmount(p.amount),
      p.currency ?? "EUR",
      cleanField(p.reference),
    ].join(";"),
  );

  const csv = [HEADER, ...rows].join("\r\n");
  return new Blob([csv], { type: "text/csv;charset=utf-8" });
}

function formatAmount(amount: number): string {
  const [whole, decimals] = amount.toFixed(2).split(".");
  const withThousands = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withThousands},${decimals}`;
}

function cleanField(value: string): string {
  return value.replace(/[;\r\n]+/g, " ").trim();
}
