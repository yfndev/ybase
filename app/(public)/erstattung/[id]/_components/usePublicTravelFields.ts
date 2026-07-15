"use client";

import type { ReimbursementLink } from "@/(public)/_lib/publicApi";
import {
  changeMealAllowanceCountry,
  createMealAllowance,
  getMealAllowanceTotal,
  getMealAllowanceWithLegacyFallback,
  OVERNIGHT_ALLOWANCE_EUR,
} from "@/lib/travel-costs";
import { useCallback, useState } from "react";

type ValidLink = Extract<ReimbursementLink, { valid: true }>;
type TravelDetails = NonNullable<ValidLink["travelDetails"]>;

export function usePublicTravelFields() {
  const [destination, setDestination] = useState("");
  const [purpose, setPurpose] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isInternational, setIsInternationalState] = useState(false);
  const [mealAllowance, setMealAllowance] = useState(createMealAllowance());
  const [showFoodAllowance, setShowFoodAllowance] = useState(false);
  const [showOvernightAllowance, setShowOvernightAllowance] = useState(false);
  const [overnightAllowanceNights, setOvernightAllowanceNights] = useState(0);
  const [overnightAllowanceRate, setOvernightAllowanceRate] = useState(
    OVERNIGHT_ALLOWANCE_EUR,
  );

  const hydrate = useCallback((details: TravelDetails) => {
    setDestination(details.destination);
    setPurpose(details.purpose);
    setStartDate(details.startDate);
    setStartTime(details.startTime ?? "");
    setEndDate(details.endDate);
    setEndTime(details.endTime ?? "");
    setIsInternationalState(details.isInternational ?? false);
    const allowance = getMealAllowanceWithLegacyFallback(details);
    setMealAllowance(allowance);
    setShowFoodAllowance(getMealAllowanceTotal(allowance) > 0);
    const nights = details.overnightAllowanceNights ?? 0;
    setOvernightAllowanceNights(nights);
    setOvernightAllowanceRate(
      details.overnightAllowanceRate ?? OVERNIGHT_ALLOWANCE_EUR,
    );
    setShowOvernightAllowance(nights > 0);
  }, []);

  const setIsInternational = (value: boolean) => {
    setIsInternationalState(value);
    setMealAllowance((current) => changeMealAllowanceCountry(current, value));
    setOvernightAllowanceRate(OVERNIGHT_ALLOWANCE_EUR);
  };
  const mealTotal = getMealAllowanceTotal(mealAllowance);
  const overnightTotal =
    overnightAllowanceNights * overnightAllowanceRate;

  return {
    destination,
    purpose,
    startDate,
    startTime,
    endDate,
    endTime,
    isInternational,
    mealAllowance,
    showFoodAllowance,
    showOvernightAllowance,
    overnightAllowanceNights,
    overnightAllowanceRate,
    mealTotal,
    overnightTotal,
    setDestination,
    setPurpose,
    setStartDate,
    setStartTime,
    setEndDate,
    setEndTime,
    setIsInternational,
    setMealAllowance,
    setShowFoodAllowance,
    setShowOvernightAllowance,
    setOvernightAllowanceNights,
    setOvernightAllowanceRate,
    hydrate,
  };
}
