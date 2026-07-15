import type { CostType } from "@/lib/travel-costs";

export const PLACEHOLDERS: Record<CostType, string> = {
  car: "Eigenfahrt, Miles, Sixt, etc.",
  train: "Deutsche Bahn, Flix, etc.",
  flight: "Lufthansa, Ryanair, etc.",
  taxi: "Uber, Bolt, etc.",
  bus: "Flixbus, etc.",
  accommodation: "Hotel, Airbnb, etc.",
  incidental: "Parkgebühren, Maut, Gepäck, etc.",
};
