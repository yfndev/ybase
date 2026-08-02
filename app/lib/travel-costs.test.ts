import { expect, test } from "vitest";
import {
  calculateCarAllowance,
  changeMealAllowanceCountry,
  createMealAllowance,
  getCarAllowanceRate,
} from "./travel-costs";

test("calculates both selectable car allowance rates", () => {
  expect(calculateCarAllowance(100, 0.3)).toBe(30);
  expect(calculateCarAllowance(100, 0.15)).toBe(15);
  expect(getCarAllowanceRate({})).toBe(0.3);
  expect(getCarAllowanceRate({ mileageRate: 0.15 })).toBe(0.15);
});

test("keeps meal days when switching travel country", () => {
  const domestic = createMealAllowance();
  domestic.arrivalDay.days = 1;
  domestic.fullDay.days = 2;

  const international = changeMealAllowanceCountry(domestic, true);
  expect(international.arrivalDay).toEqual({ days: 1, rate: 0 });
  expect(international.fullDay).toEqual({ days: 2, rate: 0 });

  expect(changeMealAllowanceCountry(international, false).fullDay).toEqual({
    days: 2,
    rate: 28,
  });
});
