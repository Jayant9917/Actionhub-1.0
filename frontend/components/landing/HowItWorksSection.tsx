"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Check, ChevronDown, Clock3 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FadeInSection } from "./FadeInSection";

const SAMPLE_RESPONSE = [
  { label: "Name", value: "Avery Chen" },
  { label: "Email", value: "avery@acme.co" },
  { label: "Message", value: "I’d love a dark mode for the mobile app." },
];

const STEPS = [
  {
    step: "1",
    title: "Pick a trigger",
    description: "Start with a new response from Tally.",
    icon: TriggerIcon,
  },
  {
    step: "2",
    title: "Connect your actions",
    description: "Map the same answers into your tools.",
    icon: ActionIcon,
  },
  {
    step: "3",
    title: "Publish and monitor",
    description: "Publish, then follow every run in Task History.",
    icon: ShipIcon,
  },
];

function TriggerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.25 9.75v-4.5m0 4.5h4.5m-4.5 0l6-6m-3 18c-8.284 0-15-6.716-15-15V4.5A2.25 2.25 0 014.5 2.25h1.372c.516 0 .966.351 1.42.92l1.106 1.299c.293.365.759.467 1.12.257l1.047-.635a.75.75 0 01.375-.131 17.75 17.75 0 003.375 0 .75.75 0 01.375.131l1.047.635c.361.21.827.108 1.12-.257l1.106-1.3a2.25 2.25 0 011.42-.92h1.372A2.25 2.25 0 0121 4.5v1.372c0 .516-.351.966-.92 1.42l-1.299 1.106a1.5 1.5 0 00-.257 1.12l.635 1.047a.75.75 0 01-.131.375A17.75 17.75 0 0112 21z"
      />
    </svg>
  );
}

function ActionIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function ShipIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}

function IntegrationMark({ src, label }: { src: string; label: string }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white dark:border-neutral-200 dark:bg-neutral-50">
      <Image src={src} alt="" width={20} height={20} className="size-5 object-contain" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

function FieldChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-left dark:border-neutral-200 dark:bg-neutral-50">
      <span className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-600">
        {label}
      </span>
      <span className="mt-0.5 block break-words text-sm font-medium text-neutral-900 dark:text-neutral-900">
        {value}
      </span>
    </div>
  );
}

export function HowItWorksSection() {
  const reduceMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const transitionDuration = reduceMotion ? 0 : 0.24;
  const currentStep = STEPS[activeStep];

  function selectStep(index: number) {
    setActiveStep(index);
    setHistoryExpanded(false);
  }

  function advanceStep() {
    if (activeStep === STEPS.length - 1) {
      selectStep(0);
      return;
    }
    selectStep(activeStep + 1);
  }

  return (
    <FadeInSection>
      <section
        id="how-it-works"
        className="section-padding relative isolate scroll-mt-20 overflow-hidden bg-white dark:bg-neutral-50"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 top-1/4 -z-10 size-72 bg-[radial-gradient(circle,rgba(0,179,255,0.35)_1px,transparent_1.5px)] [background-size:7px_7px] opacity-30 [mask-image:radial-gradient(ellipse_at_center,#000,transparent_70%)] motion-safe:animate-pulse motion-reduce:animate-none"
        />
        <div className="container-content text-center">
          <h2 className="section-heading">From form submission to team update</h2>
          <p className="section-subtext">
            See how one Tally response updates a spreadsheet and notifies your team.
          </p>

          <div
            role="group"
            aria-label="Walkthrough steps"
            className="relative mx-auto mt-10 flex w-full max-w-3xl flex-wrap justify-center gap-2 md:max-w-[840px]"
          >
            <div
              aria-hidden="true"
              className="absolute left-[16.66%] right-[16.66%] top-7 hidden h-px bg-neutral-200 dark:bg-neutral-200 md:block"
            />
            {STEPS.map(({ step, title, icon: Icon }, index) => {
              const isActive = activeStep === index;
              const isComplete = activeStep > index;
              return (
                <button
                  key={step}
                  type="button"
                  aria-pressed={isActive}
                  aria-current={isActive ? "step" : undefined}
                  aria-controls="how-it-works-preview"
                  onClick={() => selectStep(index)}
                  className={`relative z-10 flex max-w-[240px] flex-[1_1_170px] items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 md:max-w-none ${
                    isActive
                      ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 dark:border-neutral-200 dark:bg-neutral-50 dark:text-neutral-600"
                  }`}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                      isActive
                        ? "border-white/30 bg-white/10 dark:border-neutral-900/20 dark:bg-neutral-900/10"
                        : isComplete
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "border-neutral-200 bg-neutral-50 dark:border-neutral-200 dark:bg-neutral-100"
                    }`}
                  >
                    {isComplete ? <Check size={15} aria-hidden="true" /> : step}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] opacity-65">
                      Step {step}
                    </span>
                    <span className="block truncate text-sm font-semibold">{title}</span>
                  </span>
                  <Icon
                    className="ml-auto hidden size-4 shrink-0 opacity-60 sm:block"
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>

          <div className="mx-auto mt-6 w-full max-w-5xl overflow-hidden rounded-3xl border border-neutral-200 bg-white text-left shadow-[0_24px_70px_-48px_rgba(0,0,0,0.32)] dark:border-neutral-200 dark:bg-neutral-50">
            <div className="flex items-center justify-between gap-4 border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-200 dark:bg-neutral-50 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-white text-neutral-700 dark:bg-neutral-100 dark:text-neutral-900">
                  <Clock3 size={16} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-900">
                    Sample workflow run
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-600">
                    Local sample data · no accounts connected
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-medium text-neutral-500 dark:border-neutral-200 dark:bg-neutral-50 dark:text-neutral-600">
                Preview
              </span>
            </div>

            <div
              id="how-it-works-preview"
              role="region"
              aria-label={`Step ${activeStep + 1}: ${currentStep.title}`}
              aria-live="polite"
              className="relative overflow-hidden p-4 sm:p-6"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeStep}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: transitionDuration }}
                  className="flex flex-col"
                >
                  {activeStep === 0 && (
                    <div className="mx-auto w-full max-w-3xl">
                      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <IntegrationMark src="/tally.svg" label="Tally" />
                          <div>
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-900">
                              New Tally response
                            </h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-600">
                              Product feedback form · just received
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-neutral-100 dark:text-emerald-400">
                          Trigger received
                        </span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {SAMPLE_RESPONSE.map((field, index) => (
                          <motion.div
                            key={field.label}
                            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: transitionDuration,
                              delay: reduceMotion ? 0 : index * 0.07,
                            }}
                            className={field.label === "Message" ? "sm:col-span-2" : ""}
                          >
                            <FieldChip {...field} />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeStep === 1 && (
                    <div className="flex flex-col gap-3 md:grid md:grid-cols-[1fr_auto_1.15fr_auto_1fr] md:items-center md:gap-3">
                      <motion.div
                        initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: transitionDuration }}
                        className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-200 dark:bg-neutral-100"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <IntegrationMark src="/tally.svg" label="Tally" />
                          <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-900">
                            Tally response
                          </p>
                        </div>
                        <p className="text-xs leading-5 text-neutral-600 dark:text-neutral-600">
                          {SAMPLE_RESPONSE[0].value} · {SAMPLE_RESPONSE[1].value}
                          <br />
                          {SAMPLE_RESPONSE[2].value}
                        </p>
                      </motion.div>
                      <div aria-hidden="true" className="flex justify-center text-neutral-400">
                        <ArrowRight className="rotate-90 md:rotate-0" size={18} />
                      </div>
                      <motion.div
                        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: transitionDuration,
                          delay: reduceMotion ? 0 : 0.08,
                        }}
                        className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-200 dark:bg-neutral-50"
                      >
                        <div className="mb-3 flex items-center gap-2">
                          <IntegrationMark src="/sheets.png" label="Google Sheets" />
                          <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-900">
                            Google Sheets · Feedback
                          </p>
                        </div>
                        <div className="grid grid-cols-[0.7fr_1fr_1.2fr] overflow-hidden rounded-lg border border-neutral-200 text-[10px] dark:border-neutral-200 sm:text-[11px]">
                          {SAMPLE_RESPONSE.map((field) => (
                            <span
                              key={`header-${field.label}`}
                              className="min-w-0 border-b border-r border-neutral-200 bg-neutral-50 px-1.5 py-1.5 font-medium last:border-r-0 dark:border-neutral-200 dark:bg-neutral-100 sm:px-2"
                            >
                              {field.label}
                            </span>
                          ))}
                          {SAMPLE_RESPONSE.map((field, index) => (
                            <motion.span
                              key={field.label}
                              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: transitionDuration,
                                delay: reduceMotion ? 0 : 0.16 + index * 0.08,
                              }}
                              title={field.value}
                              className={`min-w-0 truncate px-1.5 py-2 text-neutral-700 dark:text-neutral-700 sm:px-2 ${
                                index < SAMPLE_RESPONSE.length - 1
                                  ? "border-r border-neutral-200 dark:border-neutral-200"
                                  : ""
                              }`}
                            >
                              {field.value}
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>
                      <div aria-hidden="true" className="flex justify-center text-neutral-400">
                        <ArrowRight className="rotate-90 md:rotate-0" size={18} />
                      </div>
                      <motion.div
                        initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: transitionDuration,
                          delay: reduceMotion ? 0 : 0.42,
                        }}
                        className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-200 dark:bg-neutral-50"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <IntegrationMark src="/discord.svg" label="Discord" />
                          <div>
                            <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-900">
                              Discord
                            </p>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-600">
                              #product-feedback
                            </p>
                          </div>
                        </div>
                        <p className="rounded-xl bg-neutral-50 px-3 py-2 text-xs leading-5 text-neutral-700 dark:bg-neutral-100 dark:text-neutral-700">
                          New feedback from {SAMPLE_RESPONSE[0].value}: “I’d love a dark mode for
                          the mobile app.”
                        </p>
                      </motion.div>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="mx-auto w-full max-w-3xl">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.12em] text-neutral-500 dark:text-neutral-600">
                            Task History
                          </p>
                          <h3 className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-900">
                            Recent workflow runs
                          </h3>
                        </div>
                        <span className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-600">
                          <Clock3 size={14} aria-hidden="true" /> Today
                        </span>
                      </div>
                      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-200 dark:bg-neutral-50">
                        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-neutral-50 text-neutral-700 dark:bg-neutral-100 dark:text-neutral-700">
                              <Image src="/tally.svg" alt="" width={18} height={18} />
                            </span>
                            <div className="min-w-0 text-left">
                              <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-900">
                                Tally feedback → Sheets + Discord
                              </p>
                              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-600">
                                Today, 10:42 AM · 2 actions
                              </p>
                            </div>
                          </div>
                          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-neutral-100 dark:text-emerald-400">
                            <Check size={13} aria-hidden="true" /> Succeeded
                          </span>
                          <button
                            type="button"
                            aria-expanded={historyExpanded}
                            aria-controls="task-history-details"
                            onClick={() => setHistoryExpanded((expanded) => !expanded)}
                            className="flex w-full items-center justify-center gap-1 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-neutral-200 dark:text-neutral-700 dark:hover:bg-neutral-100 sm:ml-auto sm:w-auto"
                          >
                            {historyExpanded ? "Hide action results" : "View action results"}
                            <ChevronDown
                              className={`size-4 transition-transform ${historyExpanded ? "rotate-180" : ""}`}
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                        <AnimatePresence initial={false}>
                          {historyExpanded && (
                            <motion.div
                              id="task-history-details"
                              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                              transition={{ duration: transitionDuration }}
                              className="overflow-hidden border-t border-neutral-200 dark:border-neutral-200"
                            >
                              <div className="grid gap-2 p-4 sm:grid-cols-2">
                                <div className="flex items-center gap-2 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-100">
                                  <IntegrationMark src="/sheets.png" label="Google Sheets" />
                                  <p className="text-xs text-neutral-700 dark:text-neutral-700">
                                    Added row 249 to Feedback
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-100">
                                  <IntegrationMark src="/discord.svg" label="Discord" />
                                  <p className="text-xs text-neutral-700 dark:text-neutral-700">
                                    Posted to #product-feedback
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={advanceStep}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {activeStep === STEPS.length - 1 ? "Restart walkthrough" : "Next step"}
              {activeStep === STEPS.length - 1 ? (
                <ArrowRight className="rotate-180" size={16} aria-hidden="true" />
              ) : (
                <ArrowRight size={16} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </section>
    </FadeInSection>
  );
}
