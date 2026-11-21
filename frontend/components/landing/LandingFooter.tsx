import Link from "next/link";

const footerLinks = [
  { label: "Home", href: "/" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Integrations", href: "/#integrations" },
  { label: "FAQ", href: "/#faq" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="container-content flex flex-col gap-5 py-7 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-900"
          >
            ActionHub
          </Link>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Workflows that move work forward.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2">
          {footerLinks.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-xs text-neutral-600 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 dark:focus-visible:ring-white"
            >
              {label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          © {new Date().getFullYear()} ActionHub
        </p>
      </div>
    </footer>
  );
}
