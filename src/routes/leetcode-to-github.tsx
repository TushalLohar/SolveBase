import { createFileRoute } from "@tanstack/react-router";

const SITE_URL = "https://solvebase.dev";
const CHROME_URL =
  "https://chromewebstore.google.com/detail/solvebase-solves-to-githu/caeobmhokccipmdinfcajpagikggollm";

const FAQS = [
  {
    question: "Can SolveBase save LeetCode solutions to GitHub?",
    answer:
      "Yes. SolveBase watches standard LeetCode problem pages and sends an accepted solution directly to the GitHub repository you select.",
  },
  {
    question: "How are LeetCode files organized?",
    answer:
      "Solutions are grouped under a leetcode folder and organized by topic, with problem names and README counts kept consistent as new solutions arrive.",
  },
  {
    question: "Does SolveBase support LeetCode contests?",
    answer:
      "Version 1.0 supports standard LeetCode problem pages. LeetCode contest and Explore editors are not currently supported.",
  },
];

export const Route = createFileRoute("/leetcode-to-github")({
  head: () => ({
    meta: [
      { title: "Save LeetCode Solutions to GitHub Automatically | SolveBase" },
      {
        name: "description",
        content:
          "Automatically save accepted LeetCode solutions to GitHub. SolveBase organizes your practice code by topic and keeps your README updated.",
      },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/leetcode-to-github` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }),
      },
    ],
  }),
  component: LeetCodeGuide,
});

function LeetCodeGuide() {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
      <a className="font-mono text-sm font-bold text-primary" href="/">
        ← SolveBase
      </a>
      <article className="mt-14">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">
          LeetCode → GitHub
        </p>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
          Save accepted LeetCode solutions to GitHub automatically.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          SolveBase turns your accepted LeetCode practice into a clean, searchable GitHub archive.
          Connect once, keep solving, and let the extension commit each solution without copy-paste.
        </p>
        <a
          href={CHROME_URL}
          target="_blank"
          rel="noreferrer"
          className="cta-primary mt-8 inline-flex"
        >
          Install SolveBase free
        </a>
        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {[
            ["1", "Connect GitHub", "Choose the repository where your practice belongs."],
            ["2", "Solve normally", "Use standard LeetCode problem pages as usual."],
            ["3", "Review your archive", "Find solutions by topic with a living README summary."],
          ].map(([number, title, body]) => (
            <section key={number} className="border-t-2 border-foreground pt-4">
              <span className="font-mono text-sm text-accent">{number}</span>
              <h2 className="mt-3 text-xl font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
            </section>
          ))}
        </div>
        <section className="mt-20 border-y border-border py-10">
          <h2 className="text-3xl font-black">Why keep LeetCode solutions in GitHub?</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            A GitHub archive makes your problem-solving history searchable, reviewable, and easy to
            share. SolveBase preserves the source code in your repository and updates summary counts
            after accepted submissions, so your practice record doubles as portfolio proof.
          </p>
        </section>
        <section className="mt-16">
          <h2 className="text-3xl font-black">LeetCode to GitHub FAQ</h2>
          <div className="mt-8 space-y-6">
            {FAQS.map((item) => (
              <details key={item.question} className="border-b border-border pb-5">
                <summary className="cursor-pointer font-bold">{item.question}</summary>
                <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
