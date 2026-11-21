"use client";

import { useState } from "react";
import { Check, ChevronDown, Clock3, FileSpreadsheet, MessageCircle } from "lucide-react";

export function TaskHistorySection() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section
      aria-labelledby="task-history-heading"
      className="bg-white py-14 dark:bg-neutral-950 md:py-16"
    >
      <div className="container-content">
        <div className="grid items-start gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-12">
          <div className="pt-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
              After you publish
            </p>
            <h2
              id="task-history-heading"
              className="mt-3 text-display-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-900"
            >
              See what happened.
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-neutral-600 dark:text-neutral-400">
              Task History keeps each run easy to scan, with action-by-action outcomes when you need
              the detail.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
              <span className="size-1.5 rounded-full bg-neutral-400" aria-hidden="true" /> Sample
              run · no login required
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-950">
            <div className="flex items-center justify-between gap-4 border-b border-neutral-200 px-4 py-3.5 dark:border-neutral-800 sm:px-5">
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-900">
                  Task History
                </p>
                <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                  Recent workflow runs
                </p>
              </div>
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                Example
              </span>
            </div>
            <div className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-900">
                    Tally feedback → Sheets + Discord
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    <Clock3 size={13} aria-hidden="true" /> Today, 10:42 AM
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                  <Check size={13} aria-hidden="true" /> Succeeded
                </span>
              </div>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls="sample-run-details"
                onClick={() => setExpanded((value) => !value)}
                className="mt-4 flex w-full items-center justify-between rounded-lg border border-neutral-200 px-3 py-2.5 text-left text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:focus-visible:ring-white"
              >
                {expanded ? "Hide run steps" : "Inspect run steps"}
                <ChevronDown
                  size={15}
                  className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              {expanded && (
                <div id="sample-run-details" className="mt-3 space-y-2">
                  <div className="flex items-center gap-3 rounded-lg bg-neutral-50 px-3 py-2.5 dark:bg-neutral-900">
                    <span className="flex size-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                      <FileSpreadsheet size={15} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium text-neutral-900 dark:text-neutral-100">
                        Google Sheets · Add row
                      </span>
                      <span className="block truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                        Feedback tracker · Row 248
                      </span>
                    </span>
                    <Check
                      size={14}
                      className="text-emerald-600 dark:text-emerald-400"
                      aria-label="Completed"
                    />
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-neutral-50 px-3 py-2.5 dark:bg-neutral-900">
                    <span className="flex size-7 items-center justify-center rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300">
                      <MessageCircle size={15} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium text-neutral-900 dark:text-neutral-100">
                        Discord · Send message
                      </span>
                      <span className="block truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                        #product-feedback · Delivered
                      </span>
                    </span>
                    <Check
                      size={14}
                      className="text-emerald-600 dark:text-emerald-400"
                      aria-label="Completed"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
