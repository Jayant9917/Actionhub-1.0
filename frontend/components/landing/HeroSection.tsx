"use client";

import Link from "next/link";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useMarketingAuth } from "@/components/layout/MarketingLayout";
import { WorkflowDemo } from "./WorkflowDemo";

export function HeroSection() {
  const { user, authChecked } = useMarketingAuth();
  const destination = user ? "/dashboard" : "/signup";
  const actionLabel = user ? "Open dashboard" : "Create an account";

  return (
    <section className="relative overflow-hidden bg-white pb-12 pt-10 dark:bg-neutral-950 md:pb-16 md:pt-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(163,163,163,0.18),transparent_68%)] dark:bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.07),transparent_68%)]" />
      <div className="container-content relative">
        <div className="grid items-center gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-10 xl:grid-cols-[0.55fr_1.45fr]">
          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
              <Sparkles size={14} aria-hidden="true" /> No-code automation, without the busywork
            </div>
            <h1 className="text-display-sm font-semibold tracking-[-0.045em] text-neutral-900 md:text-display lg:text-[3.25rem] lg:leading-[1.08]">
              Turn everyday events into automated work.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-neutral-600 dark:text-neutral-400 md:text-lg">
              Choose a trigger, connect the next steps, and see every run in Task History.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => (window.location.href = destination)}
                disabled={!authChecked}
                className="rounded-lg shadow-none transition-opacity hover:opacity-85"
                style={{ backgroundColor: "rgb(var(--color-text))", color: "rgb(var(--color-bg))" }}
              >
                {actionLabel} <ArrowRight size={16} aria-hidden="true" />
              </Button>
              <Link
                href="#workflow-demo"
                className="inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium text-neutral-700 underline-offset-4 transition-colors hover:bg-neutral-100 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-100 dark:focus-visible:ring-white"
              >
                <Play size={14} aria-hidden="true" /> Explore the demo
              </Link>
            </div>
            <p className="mt-5 text-xs text-neutral-500 dark:text-neutral-400">
              A Tally response can add a Sheets row and notify Discord—without a manual handoff.
            </p>
          </div>
          <WorkflowDemo />
        </div>
      </div>
    </section>
  );
}
