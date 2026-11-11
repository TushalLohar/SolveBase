import { createFileRoute } from "@tanstack/react-router";
import { ExtensionComparison } from "../components/ExtensionComparison";
import {
  COMPARISON_REVIEWED_AT,
  COMPARISON_ROWS,
  COMPARISON_TITLE,
  DIRECTORY_EXAMPLE,
} from "../lib/comparison";
import { CHROME_WEB_STORE_URL, PRODUCT_DESCRIPTION, SITE_URL } from "../lib/product";
import { breadcrumbSchema, seoHead } from "../lib/seo";

const DESCRIPTION =
  "Compare SolveBase, LeetHub, CP Sync, and CodeHub for LeetCode topic folders, Codeforces rating folders, final verdicts, supported platforms, and GitHub authentication.";

export const Route = createFileRoute("/compare")({
  head: () =>
    seoHead({
      path: "/compare",
      title: "LeetHub Alternatives: SolveBase vs CP Sync vs CodeHub | SolveBase",
      description: DESCRIPTION,
      mainEntityId: `${SITE_URL}/compare#article`,
      reviewedAt: COMPARISON_REVIEWED_AT,
      schemas: [
        breadcrumbSchema("Extension comparison", "/compare"),
        {
          "@type": "TechArticle",
          "@id": `${SITE_URL}/compare#article`,
          headline: COMPARISON_TITLE,
          description: DESCRIPTION,
          url: `${SITE_URL}/compare`,
          dateModified: COMPARISON_REVIEWED_AT,
          inLanguage: "en",
          isAccessibleForFree: true,
          author: { "@id": `${SITE_URL}/#author` },
          publisher: { "@id": `${SITE_URL}/#organization` },
          about: { "@id": `${SITE_URL}/#software` },
          mainEntityOfPage: { "@id": `${SITE_URL}/compare#webpage` },
          citation: COMPARISON_ROWS.flatMap((row) => row.sources.map((source) => source.url)),
        },
      ],
    }),
  component: ComparePage,
});

function ComparePage() {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-7xl px-5 py-10 sm:px-8 sm:py-16">
      <nav aria-label="Breadcrumb" className="font-mono text-sm text-muted-foreground">
        <a href="/" className="font-bold text-primary">
          SolveBase
        </a>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">Extension comparison</span>
      </nav>
      <article id="article" className="mt-14">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">
          Choose your GitHub sync workflow
        </p>
        <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
          {COMPARISON_TITLE}
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          {PRODUCT_DESCRIPTION}
        </p>
        <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
          Compare the specific projects below by folder layout, supported pages, and permissions.
          The best extension for your practice depends on those requirements.
        </p>
        <section className="mt-14" aria-labelledby="comparison-table">
          <h2 id="comparison-table" className="text-3xl font-black">
            Extension specification table
          </h2>
          <ExtensionComparison sourcesOpen />
        </section>
        <section className="mt-16 max-w-4xl" aria-labelledby="choose-workflow">
          <h2 id="choose-workflow" className="text-3xl font-black">
            Which workflow fits your practice?
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            SolveBase fits a public archive of new accepted submissions across its five supported
            platforms, with topic and rating folders. LeetHub documents private repositories and
            focuses on LeetCode and GeeksforGeeks. The reviewed CP Sync offers other judges and
            confirmation before uploads. CodeHub documents additional platforms and per-problem
            READMEs. Choose using the specific project version, supported pages, and repository
            permissions you need.
          </p>
        </section>
        <section className="mt-16 max-w-4xl" aria-labelledby="directory-example">
          <h2 id="directory-example" className="text-3xl font-black">
            SolveBase&apos;s directory structure
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Illustrative path templates for newly saved C++ solutions. Angle brackets identify
            placeholders, not literal filenames. Each LeetCode problem uses one primary topic; file
            extensions follow the submitted language. Compatible imported files can retain their
            existing paths.
          </p>
          <pre className="mt-6 overflow-x-auto border-y border-border py-6 font-mono text-sm leading-7">
            <code>{DIRECTORY_EXAMPLE}</code>
          </pre>
          <p className="mt-6 leading-7 text-muted-foreground">
            Read{" "}
            <a href="/how-it-works" className="font-semibold underline underline-offset-4">
              how SolveBase works
            </a>{" "}
            for source-code handling, sync recovery, and implementation references, or follow the{" "}
            <a href="/getting-started" className="font-semibold underline underline-offset-4">
              setup guide
            </a>
            .
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
        <a href="/faq" className="underline underline-offset-4">
          Questions and answers
        </a>
        <a href="/compare.md" className="underline underline-offset-4">
          Text version of this comparison
        </a>
        <a href="/" className="underline underline-offset-4">
          Back to SolveBase
        </a>
      </nav>
    </main>
  );
}
