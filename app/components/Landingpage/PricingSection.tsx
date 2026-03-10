"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { YellowHighlight } from "./YellowHighlight";

interface Tier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  popular: boolean;
  priceCalculation?: string;
}

const tiers: Tier[] = [
  {
    name: "YBudget Free",
    price: "0€",
    period: "/ für immer",
    description: "Für die meisten Vereine mehr als genug — für immer gratis.",
    features: [
      "Bis zu 3 Projekte",
      "Unbegrenzte Transaktionen",
      "CSV-Import (Sparkasse, Volksbank, Moss, Finom)",
      "Erstattungen & Ehrenamtspauschale digital",
    ],
    cta: "Kostenlos starten",
    href: "/login",
    popular: false,
  },
  {
    name: "YBudget Premium",
    price: "29,99€",
    period: "/ Monat",
    description: "Volle Flexibilität mit monatlicher Zahlung",
    features: [
      "Unbegrenzte Projekte",
      "Unbegrenzte Transaktionen",
      "CSV-Import",
      "Erweiterte Kategorisierung",
      "Multi-User",
    ],
    cta: "Jetzt upgraden",
    href: "/login",
    popular: false,
  },
  {
    name: "YBudget Premium Yearly",
    price: "299,00€",
    period: "/ Jahr",
    priceCalculation: "29,99€ × 12 = 359,88€",
    description: "Spare über 60€ mit jährlicher Zahlung",
    features: [
      "Unbegrenzte Projekte",
      "Unbegrenzte Transaktionen",
      "CSV-Import",
      "Erweiterte Kategorisierung",
      "Multi-User",
    ],
    cta: "Beste Wahl",
    href: "/login",
    popular: true,
  },
];

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="bg-white px-4 py-16 sm:py-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold tracking-tight text-black sm:text-4xl lg:text-5xl">
            <YellowHighlight>Kostenlos für Vereine</YellowHighlight>
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-base text-gray-600 sm:text-lg">
            YBudget wird vom Young Founders Network kostenfrei gehostet und betrieben — als Beitrag zur gemeinnützigen Arbeit in Deutschland. Wer mehr braucht, kann upgraden.
          </p>
        </motion.div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-8 sm:mt-16 lg:grid-cols-3">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative flex flex-col rounded-lg border bg-white p-6 sm:p-8 ${
                tier.popular
                  ? "border-primary ring-2 ring-primary"
                  : "border-gray-200"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary px-3 py-1 text-sm font-semibold text-black">
                    Beliebteste Wahl
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-xl font-bold text-black">{tier.name}</h3>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold tracking-tight text-black sm:text-5xl">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-base text-gray-600">{tier.period}</span>
                  )}
                </div>
                {tier.priceCalculation && (
                  <p className="mt-2 text-sm text-gray-500 line-through">
                    {tier.priceCalculation}
                  </p>
                )}
                <p className="mt-4 text-sm text-gray-600">{tier.description}</p>
              </div>

              <ul className="my-8 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 shrink-0 text-black" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={`w-full ${
                  tier.popular
                    ? "bg-black text-white hover:bg-gray-800"
                    : "border-black bg-white text-black hover:bg-gray-100"
                }`}
                variant={tier.popular ? "default" : "outline"}
                size="lg"
              >
                <Link href={tier.href}>{tier.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center text-sm text-gray-500"
        >
          Alle Preise zzgl. MwSt. Jederzeit kündbar.
        </motion.p>
      </div>
    </section>
  );
}
