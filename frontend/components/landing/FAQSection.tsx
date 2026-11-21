import { FadeInSection } from "./FadeInSection";

const FAQS = [
  {
    question: "Is ActionHub free?",
    answer:
      "Yes. The free plan includes unlimited workflows, core integrations, and community support.",
  },
  {
    question: "Do I need to write code to build a workflow?",
    answer:
      "No. Use the visual builder to connect triggers and actions, then adjust the steps to fit your process.",
  },
  {
    question: "Which apps can I connect?",
    answer:
      "ActionHub works with tools including Slack, Gmail, Notion, Stripe, Airtable, GitHub, Google Sheets, Discord, Linear, Figma, HubSpot, and Salesforce.",
  },
  {
    question: "Will my workflows run in the background?",
    answer:
      "Yes. Once set up, workflows can run automatically in the background, with execution visibility when you need it.",
  },
  {
    question: "Can I edit a workflow after I create it?",
    answer: "Yes. Reopen a workflow in the visual editor to update, reorder, or remove its steps.",
  },
  {
    question: "Do I need to deploy anything?",
    answer: "No manual deployment or engineering handoff is needed to get an automation started.",
  },
];

export function FAQSection() {
  return (
    <FadeInSection>
      <section
        id="faq"
        aria-labelledby="faq-heading"
        className="section-padding bg-white dark:bg-[#121212] text-neutral-900"
      >
        <div className="container-content mx-auto max-w-4xl">
          <h2
            id="faq-heading"
            className="mb-10 text-center text-4xl font-medium tracking-tight md:mb-12 md:text-5xl"
          >
            FAQ
          </h2>
          <div>
            {FAQS.map(({ question, answer }) => (
              <details key={question} className="group border-t border-neutral-300 last:border-b">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-sm font-medium focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600 md:text-base [&::-webkit-details-marker]:hidden">
                  <span>{question}</span>
                  <span
                    aria-hidden="true"
                    className="text-2xl font-normal leading-none text-neutral-600 transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-3xl pb-5 pr-10 text-sm leading-relaxed text-neutral-600 md:text-base">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </FadeInSection>
  );
}
