"use client";

/* eslint-disable @next/next/no-img-element -- Small third-party brand SVGs do not need image optimization. */
import { FadeInSection } from "./FadeInSection";

const APPS = [
  { name: "Slack", slug: "slack" },
  { name: "Gmail", slug: "gmail" },
  { name: "Notion", slug: "notion" },
  { name: "Stripe", slug: "stripe" },
  { name: "Airtable", slug: "airtable" },
  { name: "GitHub", slug: "github" },
  { name: "Sheets", slug: "google-sheets" },
  { name: "Discord", slug: "discord" },
  { name: "Linear", slug: "linear" },
  { name: "Figma", slug: "figma" },
  { name: "HubSpot", slug: "hubspot" },
  { name: "Salesforce", slug: "salesforce" },
];

export function IntegrationsSection() {
  return (
    <FadeInSection>
      <section className="section-padding border-t border-neutral-100 bg-neutral-50/50">
        <div className="container-content text-center">
          <h2 className="section-heading">Integrations that fit your stack</h2>
          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {APPS.map(({ name, slug }) => (
              <div
                key={name}
                className="flex items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white py-6 text-body font-medium text-neutral-600 transition-colors duration-fast hover:border-neutral-300 hover:text-neutral-900"
              >
                <img
                  src={`https://thesvg.org/icons/${slug}/default.svg`}
                  alt=""
                  aria-hidden="true"
                  className="h-6 w-6 shrink-0 object-contain"
                  loading="lazy"
                  decoding="async"
                />
                <span className="whitespace-nowrap">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </FadeInSection>
  );
}
