export const MAX_VOLUNTEER_ALLOWANCE_EUR = 960;
export const CURRENT_YEAR = new Date().getFullYear();
export const TAX_YEARS = Array.from({ length: 3 }, (_, i) =>
  String(CURRENT_YEAR - i),
);
