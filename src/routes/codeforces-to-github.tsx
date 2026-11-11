import { createFileRoute } from "@tanstack/react-router";
import { breadcrumbSchema, seoHead } from "../lib/seo";

const CHROME_URL =
  "https://chromewebstore.google.com/detail/solvebase-solves-to-githu/caeobmhokccipmdinfcajpagikggollm";

export const Route = createFileRoute("/codeforces-to-github")({
  head: () =>
    seoHead({
      path: "/codeforces-to-github",
      title: "Save Codeforces Solutions to GitHub Automatically | SolveBase",
      description:
        "Automatically archive accepted Codeforces solutions in GitHub, organized by rating. SolveBase detects final verdicts and updates your README.",
      schemas: [breadcrumbSchema("Codeforces to GitHub", "/codeforces-to-github")],
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
          SolveBase detects the final accepted verdict on Codeforces and commits your solution to
          GitHub in the right rating folder. No manual download, rename, or copy-paste required.
        </p>
        <a
          href={CHROME_URL}
          target="_blank"
          rel="noreferrer"
          className="cta-primary mt-8 inline-flex"
        >
          Install SolveBase free
        </a>
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
      </article>
    </main>
  );
}
