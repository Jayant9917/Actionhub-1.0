"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  BellRing,
  Check,
  FileSpreadsheet,
  MousePointer2,
  Send,
  Webhook,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Pick a trigger",
    label: "Start with the event",
    icon: Webhook,
    description:
      "Choose Tally form submission. A new feedback response becomes the starting point for this workflow.",
    preview: "When a new Tally response arrives",
    detail: "Form: Product feedback · Event fields are ready to map",
  },
  {
    number: "02",
    title: "Configure actions",
    label: "Choose what happens next",
    icon: MousePointer2,
    description: "Map the response into a Google Sheets row, then send the team a Discord message.",
    preview: "Add a row, then notify Discord",
    detail: "Google Sheets · Feedback tracker  →  Discord · #product-feedback",
  },
  {
    number: "03",
    title: "Publish and monitor",
    label: "Let it run, inspect outcomes",
    icon: Send,
    description:
      "Publish the workflow and check Task History for completed actions, attempts, or failures.",
    preview: "Workflow published",
    detail: "Task History records each run and the result of every action.",
  },
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const reduceMotion = useReducedMotion();
  const step = steps[activeStep];
  const StepIcon = step.icon;

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-t border-neutral-200 bg-neutral-50/70 py-16 dark:border-neutral-800 dark:bg-neutral-100 md:py-20"
    >
      <div className="container-content">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
            A clear path from event to outcome
          </p>
          <h2 className="mt-3 text-display-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-900 md:text-display">
            How it works
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-600 dark:text-neutral-400 md:text-base">
            One feedback response can update your tracker and let your team know—automatically.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-stretch lg:gap-10">
          <div className="flex flex-col gap-2" role="group" aria-label="ActionHub setup steps">
            {steps.map((item, index) => {
              const Icon = item.icon;
              const active = index === activeStep;
              return (
                <button
                  key={item.number}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveStep(index)}
                  className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white ${active ? "border-neutral-900 bg-white shadow-sm dark:border-neutral-500 dark:bg-neutral-950" : "border-transparent bg-transparent hover:border-neutral-200 hover:bg-white dark:hover:border-neutral-700 dark:hover:bg-neutral-950"}`}
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${active ? "bg-neutral-900 text-white dark:bg-neutral-800 dark:text-neutral-50" : "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"}`}
                  >
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Step {item.number}
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold text-neutral-900 dark:text-neutral-900">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-neutral-600 dark:text-neutral-400">
                      {item.label}
                    </span>
                  </span>
                  <ArrowRight
                    size={16}
                    className={`shrink-0 transition-transform ${active ? "translate-x-0 text-neutral-900 dark:text-neutral-900" : "-translate-x-1 text-neutral-400"}`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>

          <div className="flex min-h-64 flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-950 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
                aria-live="polite"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    {step.label}
                  </span>
                  <span className="flex size-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
                    <StepIcon size={17} aria-hidden="true" />
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-900">
                  {step.preview}
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                  {step.description}
                </p>
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
                  {activeStep === 0 ? (
                    <Webhook
                      size={16}
                      className="mt-0.5 shrink-0 text-neutral-700 dark:text-neutral-400"
                      aria-hidden="true"
                    />
                  ) : activeStep === 1 ? (
                    <FileSpreadsheet
                      size={16}
                      className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300"
                      aria-hidden="true"
                    />
                  ) : (
                    <BellRing
                      size={16}
                      className="mt-0.5 shrink-0 text-neutral-700 dark:text-neutral-400"
                      aria-hidden="true"
                    />
                  )}
                  <span className="text-xs leading-5 text-neutral-700 dark:text-neutral-300">
                    {step.detail}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="mt-5 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              {activeStep < 2 ? (
                <>
                  <ArrowDown size={14} aria-hidden="true" /> Step through the setup to see what
                  changes.
                </>
              ) : (
                <>
                  <Check
                    size={14}
                    className="text-emerald-600 dark:text-emerald-400"
                    aria-hidden="true"
                  />{" "}
                  Your workflow is ready to monitor.
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
