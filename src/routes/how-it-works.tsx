import { createFileRoute } from "@tanstack/react-router";
import {
  GUIDE_DESCRIPTION,
  GUIDE_PATH,
  GUIDE_REVIEWED_AT,
  GUIDE_TITLE,
  MANUAL_WORKFLOW_SOURCE,
  PRODUCT_FACTS,
  SOURCE_SNAPSHOT_URL,
  WORKFLOW_COMPARISON,
  WORKFLOW_SUMMARY,
} from "../lib/product-evidence";
import {
  CHROME_WEB_STORE_URL,
  PRODUCT_DESCRIPTION,
  PRODUCT_VERSION,
  SITE_URL,
} from "../lib/product";
import { breadcrumbSchema, seoHead } from "../lib/seo";

const ARTICLE_ID = `${SITE_URL}${GUIDE_PATH}#article`;
const REVIEWED_DATE = new Date(`${GUIDE_REVIEWED_AT}T00:00:00Z`).toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export const Route = createFileRoute("/how-it-works")({
  head: () => {
    const head = seoHead({
      path: GUIDE_PATH,
      title: `${GUIDE_TITLE} | SolveBase`,
      description: GUIDE_DESCRIPTION,
      reviewedAt: GUIDE_REVIEWED_AT,
      mainEntityId: ARTICLE_ID,
      schemas: [
        breadcrumbSchema("How SolveBase works", GUIDE_PATH),
        {
          "@type": "TechArticle",
          "@id": ARTICLE_ID,
          headline: GUIDE_TITLE,
          description: GUIDE_DESCRIPTION,
          url: `${SITE_URL}${GUIDE_PATH}`,
          dateModified: GUIDE_REVIEWED_AT,
          inLanguage: "en",
          isAccessibleForFree: true,
          author: { "@id": `${SITE_URL}/#author` },
          publisher: { "@id": `${SITE_URL}/#organization` },
          about: { "@id": `${SITE_URL}/#software` },
          mainEntityOfPage: { "@id": `${SITE_URL}${GUIDE_PATH}#webpage` },
          citation: [
            ...new Set(PRODUCT_FACTS.flatMap((fact) => fact.sources.map((source) => source.url))),
            MANUAL_WORKFLOW_SOURCE.url,
          ],
          hasPart: PRODUCT_FACTS.map((fact) => ({
            "@type": "WebPageElement",
            "@id": `${SITE_URL}${GUIDE_PATH}#${fact.id}`,
            name: fact.title,
            text: fact.text,
            citation: fact.sources.map((source) => source.url),
          })),
        },
      ],
    });
    return {
      ...head,
      links: [
        ...head.links,
        {
          rel: "alternate",
          type: "text/markdown",
          href: `${SITE_URL}/how-it-works.md`,
          title: GUIDE_TITLE,
        },
      ],
    };
  },
  component: HowItWorks,
});

function HowItWorks() {
  return (
    <main className="mx-auto min-h-[100dvh] max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
      <nav aria-label="Breadcrumb" className="font-mono text-sm text-muted-foreground">
        <a className="font-bold text-primary" href="/">
          SolveBase
        </a>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">How SolveBase works</span>
      </nav>
      <article id="article" className="mt-14">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent">
          SolveBase {PRODUCT_VERSION} · Product guide
        </p>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">{GUIDE_TITLE}</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{PRODUCT_DESCRIPTION}</p>
        <p className="mt-4 leading-7 text-muted-foreground">
          Follow the path from a coding-platform verdict to a solution file, then decide whether
          automatic sync or manual saving fits your practice.
        </p>
        <p className="mt-6 text-sm leading-7 text-muted-foreground">
          Maintained by{" "}
          <a href="https://github.com/TushalLohar" className="underline underline-offset-4">
            Tushal Lohar
          </a>
          . Documentation checked <time dateTime={GUIDE_REVIEWED_AT}>{REVIEWED_DATE}</time> against{" "}
          <a href={SOURCE_SNAPSHOT_URL} className="underline underline-offset-4">
            this version of the source code
          </a>
          .
        </p>

        <nav aria-label="Guide sections" className="mt-10 border-y border-border py-6">
          <ul className="space-y-3 text-sm leading-6 sm:columns-2">
            {PRODUCT_FACTS.map((fact) => (
              <li key={fact.id} className="break-inside-avoid">
                <a href={`#${fact.id}`} className="font-semibold underline underline-offset-4">
                  {fact.title}
                </a>
              </li>
            ))}
            <li className="break-inside-avoid">
              <a href="#compare-workflows" className="font-semibold underline underline-offset-4">
                SolveBase or manual saving?
              </a>
            </li>
          </ul>
        </nav>

        {PRODUCT_FACTS.map((fact) => (
          <section key={fact.id} id={fact.id} className="mt-14 scroll-mt-8">
            <h2 className="text-2xl font-black sm:text-3xl">
              <a href={`#${fact.id}`} className="hover:underline underline-offset-4">
                {fact.title}
              </a>
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">{fact.text}</p>
            <ul aria-label="Supporting sources" className="mt-4 space-y-2 text-sm leading-6">
              {fact.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    className="text-muted-foreground underline underline-offset-4"
                  >
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section id="compare-workflows" className="mt-16 scroll-mt-8 border-t border-border pt-8">
          <h2 className="text-3xl font-black">SolveBase or manual GitHub saving?</h2>
          <p className="mt-4 leading-7 text-muted-foreground">{WORKFLOW_SUMMARY}</p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left text-sm leading-6">
              <caption className="pb-4 text-left text-muted-foreground">
                Choose a workflow for your coding practice
              </caption>
              <thead>
                <tr className="border-b-2 border-foreground">
                  <th scope="col" className="w-1/4 py-3 pr-5">
                    Your goal
                  </th>
                  <th scope="col" className="py-3 pr-5">
                    SolveBase {PRODUCT_VERSION}
                  </th>
                  <th scope="col" className="py-3">
                    Manual saving
                  </th>
                </tr>
              </thead>
              <tbody>
                {WORKFLOW_COMPARISON.map((row) => (
                  <tr key={row.goal} className="border-b border-border align-top">
                    <th scope="row" className="py-4 pr-5 font-semibold">
                      {row.goal}
                    </th>
                    <td className="py-4 pr-5 text-muted-foreground">{row.solvebase}</td>
                    <td className="py-4 text-muted-foreground">{row.manual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            <a href={MANUAL_WORKFLOW_SOURCE.url} className="underline underline-offset-4">
              {MANUAL_WORKFLOW_SOURCE.label}
            </a>
          </p>
          <p className="mt-6 leading-7 text-muted-foreground">
            Ready to connect a public repository? Follow the{" "}
            <a href="/getting-started" className="font-semibold underline underline-offset-4">
              SolveBase setup guide
            </a>
            . For account permissions and data retention, read the{" "}
            <a href="/privacy" className="font-semibold underline underline-offset-4">
              privacy policy
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
        aria-label="Related documentation"
        className="mt-16 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-8 text-sm"
      >
        <a href="/faq" className="underline underline-offset-4">
          Questions and answers
        </a>
        <a href="/getting-started" className="underline underline-offset-4">
          Getting started
        </a>
        <a href="/how-it-works.md" className="underline underline-offset-4">
          Text version of this guide
        </a>
        <a href="/" className="underline underline-offset-4">
          Back to SolveBase
        </a>
      </nav>
    </main>
  );
}
