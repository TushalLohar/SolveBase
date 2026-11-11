import { createFileRoute } from "@tanstack/react-router";
import { seoHead } from "../lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () =>
    seoHead({
      path: "/privacy",
      title: "Privacy Policy | SolveBase",
      description:
        "How SolveBase handles GitHub authorization, coding-platform account data, and accepted solution source code.",
    }),
  component: PrivacyPolicy,
});

const sections = [
  {
    title: "Data SolveBase uses",
    body: [
      "SolveBase stores your GitHub username, selected coding-platform usernames, enabled-platform settings, GitHub repository name, synchronization state, and GitHub authorization token in Chrome extension storage on your device. These account names identify the connected accounts but are used only to perform the requested synchronization.",
      "When you submit a solution, SolveBase reads the accepted submission's source code and basic problem metadata from the supported coding platform so it can create or update the matching file in your GitHub repository.",
      "A pending submission witness may remain in Chrome extension storage for up to fifteen minutes while SolveBase waits for the verdict. Codeforces submission identifiers and problem metadata may remain locally for up to seven days while waiting for system testing to finish. If an accepted solution cannot reach GitHub immediately, its retry record, including any captured source code, may remain locally for up to twenty-four hours or until synchronization succeeds.",
    ],
  },
  {
    title: "How data moves",
    body: [
      "Accepted solution source code is sent directly from the extension to GitHub through GitHub's API. SolveBase does not send source code to its own backend and does not use it for analytics, advertising, profiling, or model training.",
      "SolveBase reads only LeetCode's named CSRF cookie when LeetCode requires it as a request header. That value is never sent to GitHub or to the SolveBase OAuth service.",
      "The OAuth service at solvebase.dev performs the GitHub authorization exchange. OAuth state expires after five minutes, and the encrypted one-time token exchange expires after sixty seconds. The service also keeps short-lived rate-limit records to prevent abuse.",
      "The website and OAuth service are hosted by Vercel, which may process standard request metadata such as an IP address. To prevent abuse, SolveBase hashes the request IP before storing a rate-limit counter in Upstash Redis for up to ten minutes. Upstash also stores only short-lived OAuth state and encrypted one-time exchange data needed to complete the connection flow.",
      "If the selected repository does not exist, SolveBase creates it as a public GitHub repository after the user explicitly confirms that choice. Accepted solution files committed there are publicly visible.",
    ],
  },
  {
    title: "Chrome Web Store Limited Use",
    body: [
      "SolveBase's use of user data complies with the Chrome Web Store User Data Policy, including the Limited Use requirements. SolveBase uses data only to detect the user's accepted coding submissions and save them to the GitHub repository the user selects. It does not sell user data, use it for advertising or profiling, allow humans to read it, or transfer it for unrelated purposes.",
    ],
  },
  {
    title: "Browser permissions",
    body: [
      "Storage keeps settings and synchronization state. Identity opens the GitHub authorization flow. The cookies permission reads only LeetCode's CSRF cookie. Scripting captures the user's submitted source on supported problem pages. Alarms and notifications check GitHub authorization health and warn when reconnection is required.",
    ],
  },
  {
    title: "Website analytics",
    body: [
      "The SolveBase website uses Vercel Web Analytics to measure aggregate page visits and improve the site. It may process the page path, referring page, browser and device category, and country-level information. It does not access extension settings, GitHub tokens, coding-platform cookies, or solution source code.",
    ],
  },
  {
    title: "Sharing and sale",
    body: [
      "SolveBase does not sell personal data, share data with advertisers, or transfer data for unrelated purposes. Data is sent only to the coding platforms you use, GitHub for the requested repository updates, and the temporary OAuth service required to connect GitHub.",
    ],
  },
  {
    title: "Control and deletion",
    body: [
      "Disconnecting GitHub removes the saved GitHub authorization token from the extension. Resetting SolveBase removes its local settings, cached synchronization state, and connection data. Files already committed to GitHub remain in your repository until you delete them there.",
      "Settings and repository synchronization state remain on the device until the user resets or uninstalls SolveBase. Submission deduplication records expire after thirty days, page witnesses expire after fifteen minutes, Codeforces final-verdict records expire after seven days, and accepted-solution retry records expire after twenty-four hours.",
      "You can revoke SolveBase at any time from GitHub Settings under Applications.",
    ],
  },
  {
    title: "Contact",
    body: [
      "For privacy questions or deletion help, open a support issue in the SolveBase GitHub repository.",
    ],
  },
];

function PrivacyPolicy() {
  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="border-b border-border pb-8">
        <a className="font-mono text-sm font-bold text-primary" href="/">
          SolveBase
        </a>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl">Privacy Policy</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          SolveBase uses only the information needed to detect accepted submissions and save them to
          the GitHub repository you choose.
        </p>
        <p className="mt-4 font-mono text-xs text-muted-foreground">Effective November 10, 2026</p>
      </header>

      <div className="divide-y divide-border">
        {sections.map((section) => (
          <section key={section.title} className="py-8">
            <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
            <div className="mt-3 space-y-3">
              {section.body.map((paragraph) => (
                <p
                  key={paragraph}
                  className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base"
                >
                  {paragraph}
                </p>
              ))}
            </div>
            {section.title === "Contact" ? (
              <a
                className="mt-4 inline-flex font-mono text-sm font-semibold text-primary underline-offset-4 hover:underline"
                href="https://github.com/TushalLohar/SolveBase/issues"
                target="_blank"
                rel="noreferrer"
              >
                Open SolveBase support
              </a>
            ) : null}
          </section>
        ))}
      </div>

      <footer className="border-t border-border pt-6 font-mono text-xs text-muted-foreground">
        <a className="transition-colors hover:text-foreground" href="/">
          Back to SolveBase
        </a>
      </footer>
    </main>
  );
}
