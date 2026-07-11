"use client";

import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return "";
  return `${day}.${month}.${year}`;
}

function displayToIso(display: string): string {
  const parts = display.split(".");
  if (parts.length !== 3) return "";

  const [dayStr, monthStr, yearStr] = parts;
  if (!dayStr || !monthStr || !yearStr) return "";

  const day = dayStr.padStart(2, "0");
  const month = monthStr.padStart(2, "0");
  let year = yearStr;

  if (yearStr.length === 2) {
    const twoDigit = parseInt(yearStr, 10);
    year = twoDigit <= 50 ? `20${yearStr.padStart(2, "0")}` : `19${yearStr}`;
  }

  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  if (
    dayNum < 1 ||
    dayNum > 31 ||
    monthNum < 1 ||
    monthNum > 12 ||
    yearNum < 2000 ||
    yearNum > 2100
  ) {
    return "";
  }

  const date = new Date(yearNum, monthNum - 1, dayNum);
  const isRealDate =
    date.getFullYear() === yearNum &&
    date.getMonth() === monthNum - 1 &&
    date.getDate() === dayNum;
  if (!isRealDate) return "";

  return `${year}-${month}-${day}`;
}

function formatWhileTyping(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 8)}`;
}

export function DateInput({
  value,
  onChange,
  placeholder = "TT.MM.JJJJ",
  className,
  id,
}: Props) {
  const [displayValue, setDisplayValue] = useState(() => isoToDisplay(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(isoToDisplay(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(formatWhileTyping(raw));
    if (raw === "") onChange("");
  };

  const handleBlur = () => {
    setIsFocused(false);
    const iso = displayToIso(displayValue);
    if (iso) {
      setDisplayValue(isoToDisplay(iso));
      onChange(iso);
    } else if (displayValue && displayValue.replace(/\D/g, "").length > 0) {
      toast.error("Ungültiges Datum");
      setDisplayValue(isoToDisplay(value));
    }
  };

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      maxLength={10}
    />
  );
}
