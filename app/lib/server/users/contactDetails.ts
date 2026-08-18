import { z } from "zod";

export const privateEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email("Bitte gib eine gültige private E-Mail-Adresse an."));

export const phoneSchema = z
  .string()
  .trim()
  .min(3, "Bitte gib eine gültige Telefonnummer an.")
  .max(40)
  .regex(/^\+?[\d\s()./-]+$/, "Bitte gib eine gültige Telefonnummer an.");
