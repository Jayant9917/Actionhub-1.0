"use client";

import Link from "next/link";

const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "#how-it-works" },
    { label: "Integrations", href: "#" },
    { label: "Pricing", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "Help center", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
};

export function LandingFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="container-content py-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-title font-semibold text-neutral-900">
              Automate
            </Link>
            <p className="mt-3 text-body-sm text-neutral-500">
              Workflow automation for modern teams.
            </p>
          </div>
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-body-sm font-semibold text-neutral-900">{heading}</h4>
              <ul className="mt-4 space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-body-sm text-neutral-500 transition-colors duration-fast hover:text-neutral-900"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <section
          aria-labelledby="footer-team-note-heading"
          className="mt-12 w-full max-w-none rounded-2xl border border-neutral-200 bg-neutral-50/30 p-5 text-center shadow-soft sm:p-6"
        >
          <h2 id="footer-team-note-heading" className="text-body-sm font-semibold text-neutral-950 dark:text-neutral-900">
            A note from the team
          </h2>
          <p className="mt-3 text-body-sm leading-6 text-neutral-600">
            {"A form comes in. A spreadsheet row gets added. Discord gets the update. And you? You didn’t have to copy and paste a thing."}
          </p>
          <p className="mt-4 text-body-sm leading-6 text-neutral-600">
            {"That’s why we built ActionHub. Give the repeat stuff a workflow and get back to the work you actually want to do."}
          </p>
          <p className="mt-4 text-body-sm font-medium text-neutral-900">The ActionHub team ⚡</p>
        </section>
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-neutral-200 pt-8 sm:flex-row">
          <p className="text-body-sm text-neutral-500">
            © {new Date().getFullYear()} Automate. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
