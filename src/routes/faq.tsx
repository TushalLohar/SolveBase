import { createFileRoute } from "@tanstack/react-router";
import { FAQ_GROUPS } from "../lib/answers";
import {
  CHROME_WEB_STORE_URL,
  GITHUB_URL,
  PRODUCT_DESCRIPTION,
  PRODUCT_VERSION,
} from "../lib/product";
import { breadcrumbSchema, seoHead } from "../lib/seo";

export const Route = createFileRoute("/faq")({
  head: () =>
    seoHead({
      path: "/faq",
      title: "SolveBase FAQ: Platforms, GitHub Sync, Pricing, and Privacy",
      description:
        "Answers about SolveBase's free Chrome extension: supported coding platforms, public GitHub repositories, permissions, submission history, and sync troubleshooting.",
      schemas: [breadcrumbSchema("Frequently asked questions", "/faq")],
      faqs: FAQ_GROUPS.flatMap((group) => group.items),
    }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
      <nav aria-label="Breadcrumb" className="font-mono text-sm text-muted-foreground">
        <a className="font-bold text-primary" href="/">
          SolveBase
        </a>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Frequently asked questions</span>
      </nav>
      <article className="mt-14">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">
          SolveBase {PRODUCT_VERSION}
        </p>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
          SolveBase questions, answered.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{PRODUCT_DESCRIPTION}</p>
        <p className="mt-4 leading-7 text-muted-foreground">
          It organizes solution files by platform and updates your repository README. Start with the{" "}
          <a href="/getting-started" className="font-semibold underline underline-offset-4">
            installation guide
          </a>{" "}
          or find an answer below.
        </p>
        <p className="mt-6 text-sm leading-7 text-muted-foreground">
          Maintained by{" "}
          <a href="https://github.com/TushalLohar" className="underline underline-offset-4">
            Tushal Lohar
          </a>
          . See the{" "}
          <a href={GITHUB_URL} className="underline underline-offset-4">
            source code and technical documentation
          </a>{" "}
          and the{" "}
          <a href="/privacy" className="underline underline-offset-4">
            privacy policy
          </a>
          .
        </p>

        <nav aria-label="Question topics" className="mt-10 border-y border-border py-6">
          <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm leading-6">
            {FAQ_GROUPS.map((group) => (
              <li key={group.id}>
                <a href={`#${group.id}`} className="font-semibold underline underline-offset-4">
                  {group.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {FAQ_GROUPS.map((group) => (
          <section key={group.id} className="mt-16" aria-labelledby={group.id}>
            <h2 id={group.id} className="scroll-mt-8 text-3xl font-black">
              {group.title}
            </h2>
            <div className="mt-6 divide-y divide-border">
              {group.items.map((item) => (
                <section key={item.id} id={item.id} className="scroll-mt-8 py-6">
                  <h3 className="text-lg font-bold leading-7">
                    <a href={`#${item.id}`} className="hover:underline underline-offset-4">
                      {item.question}
                    </a>
                  </h3>
                  <p id={`${item.id}-answer`} className="mt-3 leading-7 text-muted-foreground">
                    {item.answer}
                  </p>
                </section>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-16 border-t border-border pt-8" aria-labelledby="faq-support">
          <h2 id="faq-support" className="text-2xl font-black">
            Need help with a specific submission?
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            <a href={`${GITHUB_URL}/issues`} className="font-semibold underline underline-offset-4">
              Open a support issue
            </a>{" "}
            with the platform, extension version, expected behavior, and error message. Omit tokens
            and secrets.
          </p>
          <a
            href={CHROME_WEB_STORE_URL}
            target="_blank"
            rel="noreferrer"
            className="cta-primary mt-8 inline-flex"
          >
            Install SolveBase free
          </a>
        </section>
      </article>
      <nav
        aria-label="Related guides"
        className="mt-16 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-8 text-sm"
      >
        <a href="/getting-started" className="underline underline-offset-4">
          Getting started
        </a>
        <a href="/leetcode-to-github" className="underline underline-offset-4">
          LeetCode to GitHub
        </a>
        <a href="/codeforces-to-github" className="underline underline-offset-4">
          Codeforces to GitHub
        </a>
        <a href="/" className="underline underline-offset-4">
          Back to SolveBase
        </a>
      </nav>
    </main>
  );
}
