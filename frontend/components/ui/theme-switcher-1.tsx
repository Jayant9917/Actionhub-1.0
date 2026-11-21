"use client";

import { MonitorIcon, MoonStarIcon, SunIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { icon: MonitorIcon, value: "system" },
  { icon: SunIcon, value: "light" },
  { icon: MoonStarIcon, value: "dark" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const id = useId();
  const reduceMotion = useReducedMotion();
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-8 w-24 shrink-0" aria-hidden="true" />;

  return (
    <motion.div
      initial={{ opacity: reduceMotion ? 1 : 0 }}
      animate={{ opacity: 1 }}
      className="inline-flex shrink-0 items-center rounded-full bg-white ring-1 ring-inset ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-700"
      role="radiogroup"
      aria-label="Color theme"
    >
      {THEME_OPTIONS.map(({ icon: Icon, value }, index) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-label={`Switch to ${value} theme`}
          title={`${value.charAt(0).toUpperCase() + value.slice(1)} theme`}
          tabIndex={theme === value ? 0 : -1}
          onClick={() => setTheme(value)}
          onKeyDown={(event) => {
            const direction =
              event.key === "ArrowRight" || event.key === "ArrowDown"
                ? 1
                : event.key === "ArrowLeft" || event.key === "ArrowUp"
                  ? -1
                  : 0;
            if (!direction && event.key !== "Home" && event.key !== "End") return;
            event.preventDefault();
            const next =
              event.key === "Home" ? 0 : event.key === "End" ? 2 : (index + direction + 3) % 3;
            setTheme(THEME_OPTIONS[next].value);
            (event.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus();
          }}
          className={cn(
            "relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full",
            theme === value
              ? "text-zinc-950 dark:text-zinc-50"
              : "text-zinc-400 hover:text-zinc-950 dark:text-zinc-500 dark:hover:text-zinc-50",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {theme === value && (
            <motion.span
              layoutId={`theme-option-${id}`}
              transition={{
                type: "spring",
                bounce: reduceMotion ? 0 : 0.3,
                duration: reduceMotion ? 0 : 0.6,
              }}
              className="pointer-events-none absolute inset-0 rounded-full border border-zinc-200 dark:border-zinc-700"
            />
          )}
        </button>
      ))}
    </motion.div>
  );
}
