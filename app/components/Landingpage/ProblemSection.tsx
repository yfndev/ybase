"use client";

import { motion } from "framer-motion";
import { YellowHighlight } from "./YellowHighlight";

const problems = [
  {
    title: "Excel-Hölle",
    description:
      "Unübersichtliche Tabellen, veraltete Daten und niemand weiß, wer was wann geändert hat.",
  },
  {
    title: "Tools kosten Geld — das ihr nicht habt",
    description:
      "Budget-Software für Organisationen ist teuer und zu komplex. Geld, das besser in eure Projekte fließen sollte.",
  },
  {
    title: "Kein klarer Überblick",
    description:
      "Wo ist das Geld wirklich hingegangen? Welches Budget bleibt noch? Niemand hat den Überblick.",
  },
];

export function ProblemSection() {
  return (
    <section id="problem" className="bg-white px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold tracking-tight text-black sm:text-4xl lg:text-5xl">
            <YellowHighlight>Das Problem</YellowHighlight>
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-base text-gray-600 sm:text-lg">
            Gemeinnützige Vereine haben besondere Anforderungen – aber die
            meisten Tools sind zu komplex oder zu teuer.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-8 sm:mt-16 sm:grid-cols-3">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="rounded-lg border border-gray-200 bg-white p-6 sm:p-8"
            >
              <h3 className="text-xl font-bold text-black">{problem.title}</h3>
              <p className="mt-3 text-gray-600">{problem.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
