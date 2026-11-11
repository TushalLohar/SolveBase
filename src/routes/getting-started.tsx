import { createFileRoute } from "@tanstack/react-router";
import { SETUP_FAQS, SETUP_STEPS } from "../lib/answers";
import { breadcrumbSchema, seoHead } from "../lib/seo";
import {
  CHROME_WEB_STORE_URL,
  GITHUB_URL,
  PRODUCT_DESCRIPTION,
  SUPPORTED_PLATFORMS,
} from "../lib/product";

export const Route = createFileRoute("/getting-started")({
  head: () =>
    seoHead({
      path: "/getting-started",
      title: "How to Save Coding Solutions to GitHub | SolveBase Setup Guide",
      description:
        "Set up SolveBase to save accepted coding solutions to a public GitHub repository. Check supported platforms, GitHub permissions, and sync troubleshooting.",
      schemas: [breadcrumbSchema("Getting started", "/getting-started")],
      faqs: SETUP_FAQS,
    }),
  component: GettingStarted,
});

function GettingStarted() {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
      <nav aria-label="Breadcrumb" className="font-mono text-sm text-muted-foreground">
        <a className="font-bold text-primary" href="/">
          SolveBase
        </a>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Getting started</span>
      </nav>
      <article className="mt-14">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">
          The SolveBase setup guide
        </p>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
          How do I save coding solutions to GitHub automatically?
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Install SolveBase, choose a public repository and your coding platforms, then connect
          GitHub. Submit solutions as usual with the extension active. SolveBase saves newly
          accepted solutions and updates your repository README automatically.
        </p>
        <a
          href={CHROME_WEB_STORE_URL}
          target="_blank"
          rel="noreferrer"
          className="cta-primary mt-8 inline-flex"
        >
          Install SolveBase free
        </a>

        <section className="mt-16 border-y border-border py-8" aria-labelledby="about-solvebase">
          <h2 id="about-solvebase" className="text-2xl font-black">
            What is SolveBase?
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">{PRODUCT_DESCRIPTION}</p>
          <p className="mt-4 leading-7 text-muted-foreground">
            It captures new submissions while active. It does not bulk-import old submission
            history. Source code travels directly from your extension to GitHub; SolveBase&apos;s
            backend handles the GitHub authorization exchange.
          </p>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Created by{" "}
            <a href="https://github.com/TushalLohar" className="underline underline-offset-4">
              Tushal Lohar
            </a>
            . Read the{" "}
            <a href={GITHUB_URL} className="underline underline-offset-4">
              source code and technical documentation
            </a>{" "}
            or the{" "}
            <a href="/privacy" className="underline underline-offset-4">
              privacy policy
            </a>
            .
          </p>
        </section>

        <section className="mt-16" aria-labelledby="setup-steps">
          <h2 id="setup-steps" className="text-3xl font-black">
            Set up SolveBase in four steps
          </h2>
          <ol className="mt-8 list-decimal space-y-8 pl-6 marker:font-mono marker:text-accent">
            {SETUP_STEPS.map((step) => (
              <li key={step.title} className="pl-2">
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="mt-2 leading-7 text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16" aria-labelledby="supported-platforms">
          <h2 id="supported-platforms" className="text-3xl font-black">
            Which pages and platforms are supported?
          </h2>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm leading-6">
              <caption className="pb-4 text-left text-muted-foreground">
                SolveBase 1.0.0 platform support and GitHub folder organization
              </caption>
              <thead>
                <tr className="border-b-2 border-foreground">
                  <th scope="col" className="py-3 pr-5">
                    Platform
                  </th>
                  <th scope="col" className="py-3 pr-5">
                    Supported pages
                  </th>
                  <th scope="col" className="py-3">
                    Organized by
                  </th>
                </tr>
              </thead>
              <tbody>
                {SUPPORTED_PLATFORMS.map((platform) => (
                  <tr key={platform.name} className="border-b border-border align-top">
                    <th scope="row" className="py-4 pr-5 font-semibold">
                      {platform.name}
                    </th>
                    <td className="py-4 pr-5 text-muted-foreground">{platform.pages}</td>
                    <td className="py-4 text-muted-foreground">{platform.folders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16" aria-labelledby="setup-faq">
          <h2 id="setup-faq" className="text-3xl font-black">
            Setup and troubleshooting questions
          </h2>
          <div className="mt-8 divide-y divide-border">
            {SETUP_FAQS.map((item) => (
              <section key={item.id} id={item.id} className="scroll-mt-8 py-6 first:pt-0">
                <h3 className="text-lg font-bold">{item.question}</h3>
                <p id={`${item.id}-answer`} className="mt-3 leading-7 text-muted-foreground">
                  {item.answer}
                </p>
              </section>
            ))}
          </div>
          <p className="mt-6 leading-7 text-muted-foreground">
            Still having trouble?{" "}
            <a href={`${GITHUB_URL}/issues`} className="font-semibold underline underline-offset-4">
              Open a support issue
            </a>{" "}
            with the platform, extension version, expected behavior, and error message. Omit tokens
            and secrets.
          </p>
        </section>
      </article>
      <nav
        aria-label="Related guides"
        className="mt-16 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-8 text-sm"
      >
        <a href="/leetcode-to-github" className="underline underline-offset-4">
          LeetCode to GitHub
        </a>
        <a href="/codeforces-to-github" className="underline underline-offset-4">
          Codeforces to GitHub
        </a>
        <a href="/faq" className="underline underline-offset-4">
          All questions and answers
        </a>
        <a href="/how-it-works" className="underline underline-offset-4">
          How sync works, with sources
        </a>
        <a href="/" className="underline underline-offset-4">
          Back to SolveBase
        </a>
      </nav>
    </main>
  );
}
