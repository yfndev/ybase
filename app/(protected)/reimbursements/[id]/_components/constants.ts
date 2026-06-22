export const COST_TYPE_LABELS: Record<string, string> = {
  car: "PKW",
  train: "Bahn",
  flight: "Flug",
  taxi: "Taxi",
  bus: "Bus",
  accommodation: "Hotel",
};

export const STATUS_MAP = {
  pending: { label: "Ausstehend", variant: "secondary" as const },
  approved: { label: "Genehmigt", variant: "default" as const },
  declined: { label: "Abgelehnt", variant: "destructive" as const },
};
