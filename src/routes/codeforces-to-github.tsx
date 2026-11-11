import { createFileRoute } from "@tanstack/react-router";
import { CODEFORCES_FAQS } from "../lib/answers";
import { breadcrumbSchema, seoHead } from "../lib/seo";
import { CHROME_WEB_STORE_URL } from "../lib/product";

export const Route = createFileRoute("/codeforces-to-github")({
  head: () =>
    seoHead({
      path: "/codeforces-to-github",
      title: "Save Codeforces Solutions to GitHub Automatically | SolveBase",
      description:
        "Automatically archive accepted Codeforces solutions in GitHub, organized by rating. SolveBase detects final verdicts and updates your README.",
      schemas: [breadcrumbSchema("Codeforces to GitHub", "/codeforces-to-github")],
      faqs: CODEFORCES_FAQS,
    }),
  component: CodeforcesGuide,
});

function CodeforcesGuide() {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
      <nav aria-label="Breadcrumb" className="font-mono text-sm text-muted-foreground">
        <a className="font-bold text-primary" href="/">
          SolveBase
        </a>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Codeforces to GitHub</span>
      </nav>
      <article className="mt-14">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">
          Codeforces → GitHub
        </p>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
          Archive accepted Codeforces solutions by rating.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          SolveBase is a free Chrome extension that saves newly accepted Codeforces solutions to a
          public GitHub repository, organized by problem rating. It supports contest and practice
          submissions and waits for the final verdict after system testing before committing.
        </p>
        <a
          href={CHROME_WEB_STORE_URL}
          target="_blank"
          rel="noreferrer"
          className="cta-primary mt-8 inline-flex"
        >
          Install SolveBase free
        </a>
        <p className="mt-6 text-sm leading-7 text-muted-foreground">
          To get started, enable Codeforces, enter your handle, choose a public repository, and
          connect GitHub. Follow the{" "}
          <a href="/getting-started" className="font-semibold underline underline-offset-4">
            full setup guide
          </a>{" "}
          for installation and troubleshooting.
        </p>
        <section className="mt-16 grid gap-4 sm:grid-cols-2">
          {[
            [
              "Final verdicts",
              "Pretests do not create noisy commits; SolveBase waits for the final result.",
            ],
            ["Rating folders", "Keep a recognizable Codeforces archive grouped by problem rating."],
            [
              "Live README",
              "Counts and links update as accepted solutions land in the repository.",
            ],
            [
              "Direct GitHub sync",
              "Source code goes from the extension to the repository you choose.",
            ],
          ].map(([title, body]) => (
            <div key={title} className="border border-border p-6">
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>
        <section className="mt-20 border-y border-border py-10">
          <h2 className="text-3xl font-black">A Codeforces practice log that maintains itself</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Competitive programming produces a lot of useful code, but manually maintaining a
            repository is easy to abandon. SolveBase turns each accepted submission into a small,
            searchable contribution while you stay focused on the contest or problem.
          </p>
        </section>
        <section className="mt-16">
          <h2 className="text-3xl font-black">Codeforces to GitHub FAQ</h2>
          <div className="mt-8 space-y-6">
            {CODEFORCES_FAQS.map((item) => (
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
        <section className="mt-16">
          <h2 className="text-3xl font-black">Supported competitive-programming workflow</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            SolveBase also supports CSES, CodeChef, GeeksforGeeks, and standard LeetCode problem
            pages. See how to{" "}
            <a href="/leetcode-to-github" className="font-semibold underline underline-offset-4">
              save LeetCode solutions to GitHub
            </a>{" "}
            in the same repository, or connect an existing compatible solutions repository.
          </p>
        </section>
        <p className="mt-8 text-sm leading-7 text-muted-foreground">
          See the{" "}
          <a href="/faq" className="font-semibold underline underline-offset-4">
            full SolveBase FAQ
          </a>{" "}
          for GitHub permissions, public repository requirements, and troubleshooting.
        </p>
      </article>
    </main>
  );
}
