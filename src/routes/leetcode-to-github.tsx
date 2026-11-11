import { createFileRoute } from "@tanstack/react-router";
import { LEETCODE_FAQS } from "../lib/answers";
import { breadcrumbSchema, seoHead } from "../lib/seo";
import { CHROME_WEB_STORE_URL } from "../lib/product";

export const Route = createFileRoute("/leetcode-to-github")({
  head: () =>
    seoHead({
      path: "/leetcode-to-github",
      title: "Save LeetCode Solutions to GitHub Automatically | SolveBase",
      description:
        "Automatically save accepted LeetCode solutions to GitHub. SolveBase organizes your practice code by topic and keeps your README updated.",
      schemas: [breadcrumbSchema("LeetCode to GitHub", "/leetcode-to-github")],
      faqs: LEETCODE_FAQS,
    }),
  component: LeetCodeGuide,
});

function LeetCodeGuide() {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
      <nav aria-label="Breadcrumb" className="font-mono text-sm text-muted-foreground">
        <a className="font-bold text-primary" href="/">
          SolveBase
        </a>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">LeetCode to GitHub</span>
      </nav>
      <article className="mt-14">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">
          LeetCode → GitHub
        </p>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
          Save accepted LeetCode solutions to GitHub automatically.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          SolveBase is a free Chrome extension that saves newly accepted LeetCode solutions to a
          public GitHub repository. It supports standard problem pages, organizes solutions by
          topic, and updates your README. LeetCode contest and Explore editors are not supported.
        </p>
        <a
          href={CHROME_WEB_STORE_URL}
          target="_blank"
          rel="noreferrer"
          className="cta-primary mt-8 inline-flex"
        >
          Install SolveBase free
        </a>
        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {[
            [
              "1",
              "Connect GitHub",
              "Enable LeetCode, choose a public repository, and authorize GitHub.",
            ],
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
        <p className="mt-6 text-sm leading-7 text-muted-foreground">
          Follow the{" "}
          <a href="/getting-started" className="font-semibold underline underline-offset-4">
            SolveBase setup guide
          </a>{" "}
          for installation steps, GitHub permissions, and help with missing submissions.
        </p>
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
            {LEETCODE_FAQS.map((item) => (
              <details
                key={item.id}
                id={item.id}
                className="scroll-mt-8 border-b border-border pb-5"
              >
                <summary className="cursor-pointer font-bold">{item.question}</summary>
                <p
                  id={`${item.id}-answer`}
                  className="mt-3 max-w-2xl leading-7 text-muted-foreground"
                >
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
        <p className="mt-12 leading-7 text-muted-foreground">
          Also practice competitive programming? Learn how to{" "}
          <a href="/codeforces-to-github" className="font-semibold underline underline-offset-4">
            save Codeforces solutions to GitHub
          </a>{" "}
          with rating folders and final-verdict checks.
        </p>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          See the{" "}
          <a href="/faq" className="font-semibold underline underline-offset-4">
            full SolveBase FAQ
          </a>{" "}
          for public repository requirements, privacy, and other supported platforms.
        </p>
      </article>
    </main>
  );
}
