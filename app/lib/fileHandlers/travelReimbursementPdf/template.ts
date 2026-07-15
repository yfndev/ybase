import type { TravelMode, TravelPdfField } from "./types";

export const TEMPLATE_URL = "/forms/reisekostenabrechnung-yfn-v5.pdf";

export type FieldPosition = readonly [
  page: number,
  x: number,
  y: number,
  width: number,
  height: number,
  align?: "left" | "right",
];

export const FIELD_POSITIONS: Partial<Record<TravelPdfField, FieldPosition>> = {
  employeeName: [0, 122.236, 704.977, 173.127, 12.752],
  travelStart: [0, 122.04, 691.069, 114.24, 10.527],
  travelEnd: [0, 411.6, 691.069, 108.6, 11.182],
  purpose: [0, 122.04, 654.142, 398.16, 12.818],
  destinations: [0, 122.04, 638.902, 398.16, 10.854],
  taxAssignment: [0, 122.04, 623.335, 398.16, 11.509],
  privateCarKilometers: [0, 124.775, 512.132, 33.285, 9.472],
  mileageRate: [0, 211.359, 511.975, 51.175, 10.487, "right"],
  privateCarCost: [0, 381.877, 512.086, 136.145, 9.565, "right"],
  taxiCost: [0, 381.828, 488.192, 135.272, 11.527, "right"],
  flightCost: [0, 381.932, 475.367, 135.6, 11.526, "right"],
  publicTransportCost: [0, 382.132, 462.874, 135.272, 11.526, "right"],
  domesticSingleDays: [0, 62.018, 418.88, 15.381, 11.527],
  domesticArrivalDays: [0, 62.5635, 395.517, 15.2727, 11.527],
  domesticDepartureDays: [0, 62.2912, 370.753, 15.4903, 11.2],
  domesticFullDays: [0, 62.4, 383.08, 15.272, 11.746],
  domesticSingleCost: [0, 382.199, 417.997, 135.436, 12.019, "right"],
  domesticArrivalCost: [0, 382.363, 396.127, 135.272, 12.018, "right"],
  domesticDepartureCost: [0, 382.363, 371.346, 134.945, 11.691, "right"],
  domesticFullCost: [0, 382.199, 383.863, 135.273, 11.856, "right"],
  internationalSingleDays: [0, 62.537, 337.326, 15.381, 11.526],
  internationalArrivalDays: [0, 63.0816, 313.963, 15.2727, 11.527],
  internationalDepartureDays: [0, 62.8093, 289.199, 15.4904, 11.2],
  internationalFullDays: [0, 62.918, 301.526, 15.272, 11.745],
  internationalSingleRate: [0, 307.912, 336.451, 40.69, 12.182, "right"],
  internationalArrivalRate: [0, 308.373, 313.572, 39.872, 12.181, "right"],
  internationalDepartureRate: [0, 308.512, 289.381, 39.709, 11.2, "right"],
  internationalFullRate: [0, 308.373, 301.127, 39.872, 12.181, "right"],
  internationalSingleCost: [0, 381.954, 335.523, 136.255, 12.837, "right"],
  internationalArrivalCost: [0, 381.954, 314.308, 136.418, 11.854, "right"],
  internationalDepartureCost: [0, 381.983, 288.716, 136.472, 12.181, "right"],
  internationalFullCost: [0, 382.118, 301.391, 136.254, 12.508, "right"],
  accommodationCost: [0, 381.546, 264.061, 136.691, 11.964, "right"],
  overnightNights: [0, 62.5973, 210.81, 14.5008, 12.611],
  overnightRate: [0, 139.009, 210.351, 38.867, 13.047, "right"],
  overnightCost: [0, 381.409, 211.043, 136.691, 12.4, "right"],
  incidentalCost: [0, 381.764, 176.352, 136.909, 12.4, "right"],
  totalReimbursable: [0, 381.983, 147.116, 136.472, 15.454, "right"],
  accountHolder: [1, 132.947, 601.38, 107.911, 13.2],
  iban: [1, 94.837, 567.163, 144.27, 13.2],
  bic: [1, 84.993, 533.038, 155.828, 13.2],
  submissionDate: [1, 408.207, 725.35, 119.76, 56.64],
};

export const TRAVEL_TYPE_MARKS = {
  domestic: { x: 347.395, y: 711.48 },
  international: { x: 420.331, y: 711.444 },
};

export const MODE_MARKS: Record<TravelMode, { x: number; y: number }> = {
  taxi: { x: 129.855, y: 590.662 },
  flight: { x: 185.918, y: 590.699 },
  car: { x: 233.014, y: 590.789 },
  train: { x: 288.95, y: 590.753 },
};

export const SIGNATURE_POSITION: FieldPosition = [
  1, 62.775, 727.868, 121.08, 56.52,
];
