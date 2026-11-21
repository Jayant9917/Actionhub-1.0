"use client";

import { useRouter } from "next/navigation";
import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WorkflowDemo } from "./WorkflowDemo";

export function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden bg-white pb-14 pt-12 dark:bg-neutral-950 md:pb-20 md:pt-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(163,163,163,0.18),transparent_68%)] dark:bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.08),transparent_68%)]" />
      <div className="container-content relative">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-600 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-600">
            <Sparkles size={14} aria-hidden="true" /> No-code automation, without the busywork
          </div>
          <h1 className="text-display-sm font-semibold tracking-[-0.045em] text-neutral-900 md:text-display lg:text-[3.75rem] lg:leading-[1.08]">
            Your apps have work to do.
            <br className="hidden sm:block" />
            <span className="text-neutral-500 dark:text-neutral-400">Let them do it.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-neutral-600 dark:text-neutral-400 md:text-lg">
            Turn repetitive tasks into reliable workflows. Connect the tools you already use and get back to the work that moves you forward.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button variant="primary" size="lg" onClick={() => router.push("/signup")} className="rounded-lg shadow-none transition-opacity hover:opacity-85" style={{ backgroundColor: "rgb(var(--color-text))", color: "rgb(var(--color-bg))" }}>
              Start for free <ArrowRight size={16} aria-hidden="true" />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-lg border-neutral-300 bg-transparent dark:border-neutral-700 dark:bg-transparent dark:text-neutral-900 dark:hover:bg-neutral-900"
            >
              How it works <ArrowDown size={15} aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-11 max-w-5xl md:mt-14">
          <WorkflowDemo />
        </div>

        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-neutral-200 pt-6 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400 md:mt-12">
          <span className="font-medium text-neutral-600 dark:text-neutral-600">Built for the way your team works</span>
          <span>50+ integrations</span>
          <span>Setup in minutes</span>
          <span>No code required</span>
        </div>
      </div>
    </section>
  );
}
