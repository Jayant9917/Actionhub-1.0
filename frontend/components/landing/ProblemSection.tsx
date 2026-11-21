"use client";

import { motion, useReducedMotion } from "motion/react";
import { FadeInSection } from "./FadeInSection";

const PAINS = [
  {
    title: "Manual work that doesn’t scale",
    description:
      "Copy-paste between tools, repeat the same tasks, and chase updates instead of building.",
  },
  {
    title: "Integrations that break or never ship",
    description:
      "Custom code and one-off scripts that are hard to maintain and impossible to hand off.",
  },
  {
    title: "Time lost on busywork",
    description: "Hours every week on repetitive workflows that could run in the background.",
  },
];

export function ProblemSection() {
  const reduceMotion = useReducedMotion();

  return (
    <FadeInSection>
      <section className="section-padding relative isolate overflow-hidden bg-neutral-50/50 dark:bg-neutral-950/50">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 top-1/3 -z-10 size-80 bg-[radial-gradient(circle,rgba(0,179,255,0.4)_1px,transparent_1.5px)] [background-size:7px_7px] opacity-35 [mask-image:radial-gradient(ellipse_at_center,#000,transparent_70%)] motion-safe:animate-pulse motion-reduce:animate-none"
        />
        <div className="container-content text-center">
          <h2 className="section-heading dark:text-neutral-900">
            Your team is stuck in the middle
          </h2>
          <p className="section-subtext dark:text-neutral-400">
            Between the apps you love and the work that actually moves the needle. Automation should
            simplify that—not add another layer of complexity.
          </p>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {PAINS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : i * 0.1 }}
                className="rounded-2xl border border-neutral-200 bg-white p-8 text-left transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_16px_40px_-24px_rgba(0,179,255,0.35)] dark:border-neutral-200 dark:bg-neutral-100/80"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 dark:bg-neutral-100 dark:text-neutral-900">
                  <span className="text-body font-semibold">{i + 1}</span>
                </div>
                <h3 className="text-title-sm text-neutral-900 dark:text-neutral-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-body text-neutral-600 dark:text-neutral-400">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </FadeInSection>
  );
}
