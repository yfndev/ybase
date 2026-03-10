"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { YellowHighlight } from "./YellowHighlight";

const features = [
  {
    side: "left",
    category: "Projektmanagement",
    title: "Budgets planen in Minuten",
    description:
      "Erstelle Projekte, weise Budgets zu und plane erwartete Ausgaben. YBudget zeigt dir sofort, wie viel Budget noch verfügbar ist – in Echtzeit.",
    screenshot: "/screenshots/Dashboard Overview.png",
  },
  {
    side: "right",
    category: "Import & Automatisierung",
    title: "Transaktionen zuordnen",
    description:
      "Importiere Kontoauszüge per CSV und ordne Transaktionen automatisch den richtigen Projekten und Kategorien zu. Kein manuelles Copy-Paste mehr.",
    screenshot: "/screenshots/Import Overview.png",
  },
  {
    side: "left",
    category: "Übersicht",
    title: "Ausgaben organisieren",
    description:
      "Ordne alle Ausgaben deinen Projekten zu und sehe sofort, welches Budget noch verfügbar ist. Jede Transaktion an den richtigen Ort.",
    screenshot: "/screenshots/Project Overview.png",
  },
  {
    side: "right",
    category: "Reporting",
    title: "Berichte für Förderer",
    description:
      "Erstelle professionelle Verwendungsnachweise und Budget-Reports für deine Förderer – ohne Excel-Akrobatik.",
    screenshot: "/screenshots/Donor Overview.png",
  },
  {
    side: "left",
    category: "Zusammenarbeit",
    title: "Team-Kollaboration",
    description:
      "Lade dein Team per E-Mail ein und verwalte Zugriffsrechte. Jeder sieht nur, was er sehen soll.",
    screenshot: "/screenshots/Invite.png",
  },
  {
    side: "right",
    category: "Ehrenamt",
    title: "Ehrenamtspauschale digital",
    description:
      "Erstelle Links für Ehrenamtliche, die ihre Pauschale direkt digital einreichen können – inklusive Unterschrift vom Handy.",
    screenshot: "/screenshots/Ehrenamtspauschale.png",
  },
];

export function SolutionSection() {
  return (
    <section
      id="solution"
      className="bg-gray-50 px-4 py-16 sm:py-24 sm:px-6 lg:px-8"
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
            <YellowHighlight>Unsere Lösung</YellowHighlight>
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-base text-gray-600 sm:text-lg">
            Dein Team wird es lieben
          </p>
        </motion.div>

        <div className="mt-16 space-y-16 sm:space-y-24">
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className={`grid items-center gap-8 lg:grid-cols-2 ${
                feature.side === "right" ? "lg:grid-flow-dense" : ""
              }`}
            >
              {/* Text Content */}
              <div
                className={`${feature.side === "right" ? "lg:col-start-2" : ""} rounded-lg bg-white p-6 sm:p-8`}
              >
                <span className="inline-block bg-primary px-2 py-1 text-sm font-semibold text-black">
                  {feature.category}
                </span>
                <h3 className="mt-4 text-xl font-bold text-black sm:text-2xl lg:text-3xl">
                  {feature.title}
                </h3>
                <p className="mt-4 text-gray-600">{feature.description}</p>
                <a
                  href="#"
                  className="mt-6 inline-flex items-center text-sm font-medium text-black hover:underline"
                >
                  Mehr erfahren
                  <ChevronRight className="ml-1 h-4 w-4" />
                </a>
              </div>

              {/* Screenshot */}
              <div
                className={`${feature.side === "right" ? "lg:col-start-1" : ""}`}
              >
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <Image
                    src={feature.screenshot}
                    alt={feature.title}
                    width={600}
                    height={400}
                    className="w-full"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
