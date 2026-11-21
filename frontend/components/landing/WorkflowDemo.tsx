"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CalendarDays,
  Check,
  CircleCheck,
  Clock3,
  FileSpreadsheet,
  GitBranch,
  Mail,
  MessageCircle,
  Play,
  RotateCcw,
  Webhook,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const workflows = [
  {
    id: "tally",
    name: "Tally → Sheets + Discord",
    steps: [
      { app: "Tally", kind: "TRIGGER", title: "New form response", detail: "Product feedback · 2 min ago", Icon: ClipboardIcon, tone: "violet" },
      { app: "Google Sheets", kind: "ACTION", title: "Add a spreadsheet row", detail: "Feedback tracker · Row 248", Icon: FileSpreadsheet, tone: "green" },
      { app: "Discord", kind: "ACTION", title: "Send a channel message", detail: "#product-feedback · Sent", Icon: MessageCircle, tone: "indigo" },
    ],
    result: "Feedback saved to your tracker and shared with the team.",
    sample: '“I’d love a dark mode for the mobile app.”',
  },
  {
    id: "github",
    name: "GitHub issue → Slack",
    steps: [
      { app: "GitHub", kind: "TRIGGER", title: "Issue opened", detail: "actionhub/web · #284", Icon: GitBranch, tone: "slate" },
      { app: "Slack", kind: "ACTION", title: "Post to a channel", detail: "#engineering · Sent", Icon: SlackMark, tone: "rose" },
    ],
    result: "The new issue is on your team’s radar.",
    sample: "Bug: keyboard shortcut stops working after refresh",
  },
  {
    id: "schedule",
    name: "Schedule → Email",
    steps: [
      { app: "Schedule", kind: "TRIGGER", title: "Every weekday at 9 AM", detail: "America / Los Angeles", Icon: CalendarDays, tone: "amber" },
      { app: "Email", kind: "ACTION", title: "Send a daily summary", detail: "team@actionhub.dev · Sent", Icon: Mail, tone: "blue" },
    ],
    result: "Your daily team digest is ready to go.",
    sample: "3 projects updated · 5 tasks due today",
  },
] as const;

const toneStyles = {
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-200",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-200",
  slate: "bg-neutral-200 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-900",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  blue: "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200",
};

function ClipboardIcon({ className }: { className?: string }) {
  return <span className={`flex items-center justify-center rounded-md bg-violet-600 font-bold text-white ${className ?? ""}`} aria-hidden="true">T</span>;
}

function SlackMark({ className }: { className?: string }) {
  return <span className={`flex items-center justify-center rounded-md bg-rose-600 font-bold text-white ${className ?? ""}`} aria-hidden="true">S</span>;
}

export function WorkflowDemo() {
  const [selectedId, setSelectedId] = useState<(typeof workflows)[number]["id"]>("tally");
  const [status, setStatus] = useState<"idle" | "running" | "complete">("idle");
  const [activeStep, setActiveStep] = useState(-1);
  const reduceMotion = useReducedMotion();
  const workflow = workflows.find((item) => item.id === selectedId) ?? workflows[0];

  useEffect(() => {
    if (status !== "running") return;
    const duration = reduceMotion ? 120 : 760;
    const timer = window.setTimeout(() => {
      if (activeStep + 1 < workflow.steps.length) {
        setActiveStep((step) => step + 1);
      } else {
        setStatus("complete");
      }
    }, duration);
    return () => window.clearTimeout(timer);
  }, [activeStep, reduceMotion, status, workflow.steps.length]);

  function runDemo() {
    setActiveStep(0);
    setStatus("running");
  }

  function selectWorkflow(id: (typeof workflows)[number]["id"]) {
    if (status === "running") return;
    setSelectedId(id);
    setStatus("idle");
    setActiveStep(-1);
  }

  return (
    <section
      aria-label="Try an example workflow"
      className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_32px_100px_-48px_rgba(0,0,0,0.42)] dark:border-neutral-700 dark:bg-neutral-950"
    >
      <div className="flex flex-col gap-4 border-b border-neutral-200 px-4 py-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-900">
            <span className="flex size-7 items-center justify-center rounded-lg" style={{ backgroundColor: "rgb(var(--color-text))", color: "rgb(var(--color-bg))" }}><Zap size={15} aria-hidden="true" /></span>
            Workflow playground
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">Sample data</span>
          </div>
          <p className="mt-1 pl-9 text-xs text-neutral-500">Choose a flow and watch ActionHub do the busywork.</p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 dark:border-neutral-800 sm:self-auto">
          <span className={`size-1.5 rounded-full ${status === "running" ? "animate-pulse bg-amber-500" : status === "complete" ? "bg-emerald-500" : "bg-neutral-400"}`} />
          {status === "running" ? "Running demo" : status === "complete" ? "Demo complete" : "Ready to run"}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div role="group" aria-label="Choose a sample workflow" className="mb-7 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {workflows.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={selectedId === item.id}
              disabled={status === "running"}
              onClick={() => selectWorkflow(item.id)}
              onKeyDown={(event) => {
                if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                event.preventDefault();
                const next = (index + (event.key === "ArrowRight" ? 1 : workflows.length - 1)) % workflows.length;
                selectWorkflow(workflows[next].id);
                (event.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus();
              }}
              className={`rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white ${selectedId === item.id ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-950" : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-600 dark:hover:border-neutral-600"}`}
              style={selectedId === item.id ? { backgroundColor: "rgb(var(--color-text))", color: "rgb(var(--color-bg))" } : undefined}
            >
              <span className="mr-2 text-[10px] opacity-60">0{index + 1}</span>{item.name}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center md:gap-3" aria-label="Workflow steps">
          {workflow.steps.map(({ app, kind, title, detail, Icon, tone }, index) => {
            const isActive = activeStep === index;
            const isDone = status === "complete" || activeStep > index;
            return (
              <div key={`${workflow.id}-${app}`} className="contents">
                <motion.div
                  aria-current={isActive ? "step" : undefined}
                  animate={{
                    borderColor: isActive ? "rgba(23,23,23,0.55)" : isDone ? "rgba(16,185,129,0.5)" : "rgba(163,163,163,0.28)",
                    backgroundColor: isActive ? "rgba(23,23,23,0.035)" : "rgba(255,255,255,0)",
                    y: isActive && !reduceMotion ? -2 : 0,
                  }}
                  transition={{ duration: reduceMotion ? 0 : 0.24 }}
                  className="flex flex-1 items-center gap-3 rounded-xl border p-3 dark:bg-neutral-900/70"
                >
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${toneStyles[tone]}`}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold tracking-[0.12em] text-neutral-400">{kind} · {app}</span>
                    <span className="mt-1 block truncate text-sm font-semibold text-neutral-900 dark:text-neutral-900">{title}</span>
                    {app === "Tally" ? (
                      <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-neutral-500 dark:text-neutral-600">
                        <Webhook size={12} aria-hidden="true" /> Webhook · {detail}
                      </span>
                    ) : (
                      <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-neutral-400">{detail}</span>
                    )}
                  </span>
                  <span className="flex size-5 shrink-0 items-center justify-center">
                    {isDone ? <CircleCheck className="size-4 text-emerald-600 dark:text-emerald-400" aria-label="Completed" /> : isActive ? <span className="size-2 rounded-full bg-neutral-900 dark:bg-white" aria-label="Running" /> : null}
                  </span>
                </motion.div>
                {index < workflow.steps.length - 1 && (
                  <div className="flex h-5 w-full shrink-0 items-center justify-center md:h-auto md:w-8" aria-hidden="true">
                    <motion.span
                      className="h-full w-0.5 origin-top rounded-full bg-neutral-300 dark:bg-neutral-700 md:h-0.5 md:w-full md:origin-left"
                      animate={{ scaleY: activeStep > index || status === "complete" ? 1 : status === "running" && activeStep === index ? [0.35, 1] : 0.55, scaleX: activeStep > index || status === "complete" ? 1 : status === "running" && activeStep === index ? [0.35, 1] : 0.55, backgroundColor: activeStep > index || status === "complete" ? "#10b981" : "#a3a3a3" }}
                      transition={{ duration: reduceMotion ? 0 : 0.55, repeat: status === "running" && activeStep === index && !reduceMotion ? Infinity : 0, repeatType: "reverse" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-neutral-100 pt-5 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-11 flex-1" aria-live="polite" aria-atomic="true">
            <AnimatePresence mode="wait">
              {status === "complete" ? (
                <motion.div key="result" initial={{ opacity: 0, y: reduceMotion ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.2 }} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"><Check size={14} aria-hidden="true" /></span>
                  <span><span className="block text-sm font-semibold text-neutral-900 dark:text-neutral-900">{workflow.result}</span><span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">{workflow.sample}</span></span>
                </motion.div>
              ) : status === "running" ? (
                <motion.p key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-sm text-neutral-500"><Clock3 size={15} aria-hidden="true" /> {activeStep >= 0 ? `Step ${activeStep + 1} of ${workflow.steps.length} is running…` : "Preparing your workflow…"}</motion.p>
              ) : (
                <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-sm text-neutral-500"><Webhook size={15} className="text-neutral-700 dark:text-neutral-700" aria-hidden="true" /> Runs locally with sample data—no accounts connected.</motion.p>
              )}
            </AnimatePresence>
          </div>
          <Button variant="primary" size="md" onClick={runDemo} disabled={status === "running"} className="shrink-0 rounded-lg shadow-none transition-opacity hover:opacity-85" style={{ backgroundColor: "rgb(var(--color-text))", color: "rgb(var(--color-bg))" }}>
            {status === "complete" ? <><RotateCcw size={15} aria-hidden="true" /> Replay</> : <><Play size={15} aria-hidden="true" /> Run demo</>}
          </Button>
        </div>
      </div>
    </section>
  );
}
