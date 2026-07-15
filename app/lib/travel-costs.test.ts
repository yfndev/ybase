import { expect, test } from "vitest";
import {
  changeMealAllowanceCountry,
  createMealAllowance,
} from "./travel-costs";

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
