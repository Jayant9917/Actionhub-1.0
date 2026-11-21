"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CalendarDays,
  ClipboardList,
  FileSpreadsheet,
  GitBranch,
  Mail,
  MessageCircle,
  MessageSquare,
  Webhook,
} from "lucide-react";

type Category = "Trigger" | "Action";
const integrations: {
  name: string;
  category: Category;
  description: string;
  icon: typeof Webhook;
  tone: string;
}[] = [
  {
    name: "JSON webhook",
    category: "Trigger",
    description: "Start on an incoming JSON event.",
    icon: Webhook,
    tone: "text-neutral-700 dark:text-neutral-900",
  },
  {
    name: "Schedule",
    category: "Trigger",
    description: "Run on a recurring schedule.",
    icon: CalendarDays,
    tone: "text-amber-600 dark:text-amber-300",
  },
  {
    name: "Tally",
    category: "Trigger",
    description: "Start when a form is submitted.",
    icon: ClipboardList,
    tone: "text-violet-600 dark:text-violet-300",
  },
  {
    name: "GitHub",
    category: "Trigger",
    description: "Issue opened or closed; pull request opened.",
    icon: GitBranch,
    tone: "text-neutral-800 dark:text-neutral-900",
  },
  {
    name: "SMTP email",
    category: "Action",
    description: "Send mail through your SMTP provider.",
    icon: Mail,
    tone: "text-sky-600 dark:text-sky-300",
  },
  {
    name: "Slack",
    category: "Action",
    description: "Post a message to a channel.",
    icon: MessageSquare,
    tone: "text-rose-600 dark:text-rose-300",
  },
  {
    name: "Discord",
    category: "Action",
    description: "Send a message to a channel.",
    icon: MessageCircle,
    tone: "text-indigo-600 dark:text-indigo-300",
  },
  {
    name: "Google Sheets",
    category: "Action",
    description: "Append a row to a spreadsheet.",
    icon: FileSpreadsheet,
    tone: "text-emerald-600 dark:text-emerald-300",
  },
  {
    name: "HTTPS request",
    category: "Action",
    description: "Call a public HTTPS API endpoint.",
    icon: Webhook,
    tone: "text-neutral-700 dark:text-neutral-900",
  },
];

const filters = ["All", "Triggers", "Actions"] as const;

type Filter = (typeof filters)[number];

export function IntegrationsSection() {
  const [filter, setFilter] = useState<Filter>("All");
  const reduceMotion = useReducedMotion();
  const visibleIntegrations = integrations.filter(
    (item) => filter === "All" || item.category === (filter === "Triggers" ? "Trigger" : "Action"),
  );

  return (
    <section
      id="integrations"
      className="scroll-mt-20 border-y border-neutral-200 bg-neutral-50/70 py-16 dark:border-neutral-800 dark:bg-neutral-100 md:py-20"
    >
      <div className="container-content">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
              Supported building blocks
            </p>
            <h2 className="mt-3 text-display-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-900 md:text-display">
              Connect the steps you need.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
              Start from one of these events, then choose the actions your workflow should take.
            </p>
          </div>
          <div
            role="group"
            aria-label="Filter integrations"
            className="flex w-fit rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-950"
          >
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white ${filter === item ? "bg-neutral-900 text-white dark:bg-neutral-800 dark:text-neutral-50" : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visibleIntegrations.map(({ name, category, description, icon: Icon, tone }) => (
              <motion.article
                key={name}
                layout={!reduceMotion}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
                transition={{ duration: reduceMotion ? 0 : 0.16 }}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-950"
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-200 ${tone}`}
                >
                  <Icon size={19} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-neutral-900 dark:text-neutral-900">
                    {name}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-neutral-600 dark:text-neutral-400">
                    {description}
                  </span>
                </span>
                <span className="shrink-0 rounded-full border border-neutral-200 px-2 py-0.5 text-[10px] text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                  {category}
                </span>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
