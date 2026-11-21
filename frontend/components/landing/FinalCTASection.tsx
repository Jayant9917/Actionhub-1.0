"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useMarketingAuth } from "@/components/layout/MarketingLayout";

export function FinalCTASection() {
  const router = useRouter();
  const { user, authChecked } = useMarketingAuth();
  const destination = user ? "/dashboard" : "/signup";
  const label = user ? "Open dashboard" : "Create an account";

  return (
    <section className="border-t border-neutral-200 bg-neutral-100 py-12 dark:border-neutral-800 dark:bg-neutral-100 md:py-14">
      <div className="container-content flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-900">
            Ready to connect the next steps?
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Build a workflow, publish it, and keep an eye on every run.
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          disabled={!authChecked}
          onClick={() => router.push(destination)}
          className="shrink-0 rounded-lg shadow-none transition-opacity hover:opacity-85"
          style={{ backgroundColor: "rgb(var(--color-text))", color: "rgb(var(--color-bg))" }}
        >
          {label} <ArrowRight size={16} aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
