const questions = [
  {
    question: "What can trigger a workflow?",
    answer:
      "A workflow can start from an incoming JSON webhook, a recurring schedule, a Tally form submission, or supported GitHub issue and pull request events.",
  },
  {
    question: "Does the homepage demo connect to my accounts?",
    answer:
      "No. The Workflow Playground runs only in your browser with sample data. It does not call webhooks, integrations, or account APIs.",
  },
  {
    question: "Where can I see what happened after a run?",
    answer:
      "Task History shows each workflow run, its status, and the outcome of its completed actions. You can inspect action details when you need more context.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="scroll-mt-20 bg-white py-16 dark:bg-neutral-950 md:py-20">
      <div className="container-content grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
            Good to know
          </p>
          <h2 className="mt-3 text-display-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-900 md:text-display">
            Frequently asked
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            A few details about building and monitoring an ActionHub workflow.
          </p>
        </div>
        <div className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {questions.map(({ question, answer }) => (
            <details key={question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:text-neutral-900 dark:focus-visible:ring-white [&::-webkit-details-marker]:hidden">
                {question}
                <span
                  aria-hidden="true"
                  className="text-xl font-normal text-neutral-500 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl pr-8 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
