export type TravelMode = "taxi" | "flight" | "car" | "train";

export type TravelPdfField =
  | "employeeName"
  | "travelStart"
  | "travelEnd"
  | "purpose"
  | "destinations"
  | "taxAssignment"
  | "privateCarKilometers"
  | "mileageRate"
  | "privateCarCost"
  | "taxiCost"
  | "flightCost"
  | "publicTransportCost"
  | "domesticSingleDays"
  | "domesticArrivalDays"
  | "domesticDepartureDays"
  | "domesticFullDays"
  | "domesticSingleCost"
  | "domesticArrivalCost"
  | "domesticDepartureCost"
  | "domesticFullCost"
  | "internationalSingleDays"
  | "internationalArrivalDays"
  | "internationalDepartureDays"
  | "internationalFullDays"
  | "internationalSingleRate"
  | "internationalArrivalRate"
  | "internationalDepartureRate"
  | "internationalFullRate"
  | "internationalSingleCost"
  | "internationalArrivalCost"
  | "internationalDepartureCost"
  | "internationalFullCost"
  | "accommodationCost"
  | "overnightNights"
  | "overnightRate"
  | "overnightCost"
  | "incidentalCost"
  | "totalReimbursable"
  | "accountHolder"
  | "iban"
  | "bic"
  | "submissionDate";

export type TravelPdfData = {
  fields: Partial<Record<TravelPdfField, string>>;
  isInternational: boolean;
  modes: Set<TravelMode>;
};
