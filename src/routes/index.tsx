import { createFileRoute } from "@tanstack/react-router";
import { HOME_FAQS } from "../lib/answers";
import { ExtensionComparison } from "../components/ExtensionComparison";
import { useState } from "react";
import { seoHead } from "../lib/seo";
import { CHROME_WEB_STORE_URL, PRODUCT_DESCRIPTION } from "../lib/product";
import {
  Download,
  FolderTree,
  GitBranch,
  Radar,
  RefreshCcw,
  ShieldCheck,
  Terminal,
  Layers,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () =>
    seoHead({
      path: "/",
      title: "SolveBase — Competitive Programming Solutions to GitHub",
      description:
        "Save accepted Codeforces, LeetCode, CSES, CodeChef, and GeeksforGeeks solutions to GitHub automatically with the free SolveBase Chrome extension.",
      faqs: HOME_FAQS,
    }),
  component: Home,
});

const PLATFORM_PREVIEWS = [
  {
    id: "codeforces",
    name: "Codeforces",
    badge: "CF",
    color: "text-blue-800",
    bg: "bg-[#c7e6ff]",
    border: "border-[#191919]",
    folder: "codeforces/1600/",
    file: "1899E - Queue Sort.cpp",
    sampleCode: `#include <bits/stdc++.h>
using namespace std;

void solve() {
    int n; cin >> n;
    vector<int> a(n);
    for (int &x : a) cin >> x;
    int mn = *min_element(a.begin(), a.end());
    int idx = min_element(a.begin(), a.end()) - a.begin();
    if (!is_sorted(a.begin() + idx, a.end())) {
        cout << -1 << "\\n";
        return;
    }
    cout << idx << "\\n";
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int t; cin >> t;
    while (t--) solve();
}`,
    readmePreview: `| Difficulty | Solved |
| --- | --- |
| [800](./codeforces/800) | 42 |
| [1200](./codeforces/1200) | 28 |
| [1600](./codeforces/1600) | 15 |`,
  },
  {
    id: "leetcode",
    name: "LeetCode",
    badge: "LC",
    color: "text-amber-900",
    bg: "bg-[#ffe1b3]",
    border: "border-[#191919]",
    folder: "leetcode/binary-search/",
    file: "704 - Binary Search.cpp",
    sampleCode: `class Solution {
public:
    int search(vector<int>& nums, int target) {
        int l = 0, r = (int)nums.size() - 1;
        while (l <= r) {
            int mid = l + (r - l) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) l = mid + 1;
            else r = mid - 1;
        }
        return -1;
    }
};`,
    readmePreview: `| Topic | Solved |
| --- | --- |
| [binary-search](./leetcode/binary-search) | 34 |
| [dynamic-programming](./leetcode/dynamic-programming) | 52 |`,
  },
  {
    id: "cses",
    name: "CSES",
    badge: "CSES",
    color: "text-emerald-900",
    bg: "bg-[#b9ead4]",
    border: "border-[#191919]",
    folder: "cses/dynamic-programming/",
    file: "1633 - Dice Combinations.cpp",
    sampleCode: `#include <iostream>
#include <vector>
using namespace std;
const int MOD = 1e9 + 7;

int main() {
    int n; cin >> n;
    vector<int> dp(n + 1, 0);
    dp[0] = 1;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= 6 && i - j >= 0; j++)
            dp[i] = (dp[i] + dp[i-j]) % MOD;
    }
    cout << dp[n] << "\\n";
}`,
    readmePreview: `| Section | Solved |
| --- | --- |
| [dynamic-programming](./cses/dynamic-programming) | 19 |
| [graph-algorithms](./cses/graph-algorithms) | 26 |`,
  },
  {
    id: "codechef",
    name: "CodeChef",
    badge: "CC",
    color: "text-orange-900",
    bg: "bg-[#ffd6e7]",
    border: "border-[#191919]",
    folder: "codechef/1600/",
    file: "MNERROR - Min Error.cpp",
    sampleCode: `#include <iostream>
using namespace std;

int main() {
    int t; cin >> t;
    while (t--) {
        long long n, k; cin >> n >> k;
        cout << max(0LL, n - k) << "\\n";
    }
}`,
    readmePreview: `| Difficulty | Solved |
| --- | --- |
| [900](./codechef/900) | 12 |
| [1600](./codechef/1600) | 8 |`,
  },
  {
    id: "gfg",
    name: "GeeksforGeeks",
    badge: "GFG",
    color: "text-violet-900",
    bg: "bg-[#dcd0ff]",
    border: "border-[#191919]",
    folder: "geeksforgeeks/Medium/",
    file: "Kadane's Algorithm.cpp",
    sampleCode: `class Solution {
public:
    long long maxSubarraySum(vector<int> &arr) {
        long long max_so_far = arr[0], curr_max = arr[0];
        for (size_t i = 1; i < arr.size(); i++) {
            curr_max = max((long long)arr[i], curr_max + arr[i]);
            max_so_far = max(max_so_far, curr_max);
        }
        return max_so_far;
    }
};`,
    readmePreview: `| Difficulty | Solved |
| --- | --- |
| [Easy](./geeksforgeeks/Easy) | 24 |
| [Medium](./geeksforgeeks/Medium) | 31 |
| [Hard](./geeksforgeeks/Hard) | 9 |`,
  },
];

const FEATURES = [
  {
    icon: Radar,
    title: "Accepted Solutions Only",
    body: "Detects new submissions on supported pages and saves them after a final accepted verdict.",
  },
  {
    icon: FolderTree,
    title: "Multi-Platform Organization",
    body: "Codeforces by difficulty rating, LeetCode by algorithm topic, CSES by problem section, CodeChef and GFG by rating and difficulty.",
  },
  {
    icon: RefreshCcw,
    title: "Self-Updating README",
    body: "Your repository summary tables and total counts update automatically after every single commit cycle.",
  },
  {
    icon: ShieldCheck,
    title: "Private By Design",
    body: "Vercel handles only short-lived encrypted GitHub authorization data. Source code and repository syncs go directly from your extension to GitHub.",
  },
  {
    icon: Layers,
    title: "Zero Spam Live Sync",
    body: "Only new accepted solutions trigger commits in real time, keeping your repository commit log clean and meaningful.",
  },
  {
    icon: Terminal,
    title: "Silent & Non-Intrusive",
    body: "Runs quietly in the background without popups, bells, or contest interruptions. Check the extension only when you want to.",
  },
];

function Home() {
  const [activePlatform, setActivePlatform] = useState("codeforces");
  const selectedPlatform =
    PLATFORM_PREVIEWS.find((platform) => platform.id === activePlatform) || PLATFORM_PREVIEWS[0]!;

  return (
    <main className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      <header className="site-nav flex items-center justify-between py-5">
        <a href="#top" className="flex items-center gap-3" aria-label="SolveBase home">
          <img
            src="/solvebase-brand.png"
            alt=""
            className="h-10 w-10 rounded-xl border-2 border-[#191919] shadow-[3px_3px_0_#191919]"
          />
          <span className="font-mono text-sm font-black">
            SOLVEBASE<span className="text-accent">.</span>
          </span>
        </a>
        <nav
          className="hidden items-center gap-7 font-mono text-xs font-bold text-muted-foreground md:flex"
          aria-label="Primary"
        >
          <a href="#how-it-works" className="nav-link">
            How it works
          </a>
          <a href="/getting-started" className="nav-link">
            Setup guide
          </a>
          <a href="#platforms" className="nav-link">
            Platforms
          </a>
          <a href="/faq" className="nav-link">
            FAQ
          </a>
        </nav>
        <a href={CHROME_WEB_STORE_URL} target="_blank" rel="noreferrer" className="cta-small">
          <Download className="h-3.5 w-3.5" /> Install free
        </a>
      </header>

      <section
        id="top"
        className="new-hero hero-enter grid gap-10 py-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-20"
      >
        <div>
          <div className="eyebrow">
            <span className="pulse-dot" /> Live solution sync for competitive programmers
          </div>
          <h1 className="new-hero-title mt-6">
            Solve it.
            <br />
            <span className="ink-highlight">Keep it.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {PRODUCT_DESCRIPTION}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href={CHROME_WEB_STORE_URL} target="_blank" rel="noreferrer" className="cta-primary">
              <Download className="h-4 w-4" /> Add to Chrome
            </a>
            <a
              href="https://github.com/TushalLohar/SolveBase"
              target="_blank"
              rel="noreferrer"
              className="cta-secondary"
            >
              <GitBranch className="h-4 w-4" /> Star on GitHub <span aria-hidden="true">☆</span>
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-muted-foreground">
            <span>Free to install</span>
            <span>No personal tokens</span>
            <span>Manifest V3</span>
          </div>
        </div>

        <div className="product-stage">
          <div className="stage-orbit orbit-one" />
          <div className="stage-orbit orbit-two" />
          <div className="mock-window">
            <div className="mock-top">
              <span className="window-dots">
                <i />
                <i />
                <i />
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                solvebase / live-sync
              </span>
              <span className="status-pill">
                <span className="pulse-dot" /> synced
              </span>
            </div>
            <div className="mock-body">
              <div className="mock-sidebar">
                <div className="mock-brand">SB</div>
                <span className="mock-side-active">Overview</span>
                <span>Platforms</span>
                <span>Activity</span>
                <span>Settings</span>
              </div>
              <div className="mock-main">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Today
                    </p>
                    <h2 className="mt-1 text-xl font-black">Your archive is moving.</h2>
                  </div>
                  <span className="rounded-full bg-[#b9ead4] px-2 py-1 font-mono text-[10px] font-bold">
                    +12 solves
                  </span>
                </div>
                <div className="mock-chart mt-6">
                  <span style={{ height: "38%" }} />
                  <span style={{ height: "52%" }} />
                  <span style={{ height: "44%" }} />
                  <span style={{ height: "72%" }} />
                  <span style={{ height: "61%" }} />
                  <span style={{ height: "88%" }} />
                  <span style={{ height: "78%" }} />
                </div>
                <div className="mt-5 space-y-2">
                  <div className="activity-row">
                    <span className="activity-icon bg-[#c7e6ff]">CF</span>
                    <span>
                      <b>Queue Sort</b>
                      <small>codeforces/1600</small>
                    </span>
                    <em>committed</em>
                  </div>
                  <div className="activity-row">
                    <span className="activity-icon bg-[#ffe1b3]">LC</span>
                    <span>
                      <b>Binary Search</b>
                      <small>leetcode/binary-search</small>
                    </span>
                    <em>committed</em>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="floating-note note-left">
            <Radar className="h-4 w-4 text-accent" />
            <span>
              <b>Accepted detected</b>
              <small>just now</small>
            </span>
          </div>
          <div className="floating-note note-right">
            <ShieldCheck className="h-4 w-4 text-[#1f8a4c]" />
            <span>
              <b>Direct to GitHub</b>
              <small>no middleman</small>
            </span>
          </div>
          <div className="repo-card">
            <div className="repo-card-top">
              <span className="repo-github-mark">
                <GitBranch className="h-3.5 w-3.5" />
              </span>
              <span className="font-mono text-[9px] text-muted-foreground">
                github.com / TushalLohar / CP-Solutions
              </span>
              <span className="repo-public">Public</span>
            </div>
            <div className="repo-card-title">
              <h3>CP-Solutions</h3>
              <span className="repo-star">☆ 24</span>
            </div>
            <p className="repo-description">
              Competitive programming solutions, organized automatically by SolveBase.
            </p>
            <div className="repo-tabs">
              <span className="repo-tab-active">Code</span>
              <span>Issues 0</span>
              <span>Pull requests 0</span>
            </div>
            <div className="repo-file">
              <FolderTree className="h-3.5 w-3.5 text-[#2563c9]" />
              <b>codeforces</b>
              <span>1899E - Queue Sort.cpp</span>
              <em>2 min ago</em>
            </div>
            <div className="repo-file repo-subfile">
              <span className="repo-tree">↳</span>
              <span>1600/</span>
              <span>1899E - Queue Sort.cpp</span>
              <em>2 min ago</em>
            </div>
            <div className="repo-file">
              <FolderTree className="h-3.5 w-3.5 text-[#1f8a4c]" />
              <b>leetcode</b>
              <span>704 - Binary Search.cpp</span>
              <em>yesterday</em>
            </div>
            <div className="repo-file repo-subfile">
              <span className="repo-tree">↳</span>
              <span>binary-search/</span>
              <span>704 - Binary Search.cpp</span>
              <em>yesterday</em>
            </div>
            <div className="repo-file">
              <FolderTree className="h-3.5 w-3.5 text-[#7a3fc4]" />
              <b>geeksforgeeks</b>
              <span>Kadane's Algorithm.cpp</span>
              <em>3 days ago</em>
            </div>
            <div className="repo-file repo-subfile">
              <span className="repo-tree">↳</span>
              <span>Medium/</span>
              <span>Kadane's Algorithm.cpp</span>
              <em>3 days ago</em>
            </div>
            <div className="repo-readme">
              <div className="repo-readme-head">
                <span>README.md</span>
                <span className="repo-live">
                  <span className="pulse-dot" /> live
                </span>
              </div>
              <div className="repo-stat-grid">
                <span>
                  <b>126</b>
                  <small>Total solved</small>
                </span>
                <span>
                  <b>42</b>
                  <small>Codeforces</small>
                </span>
                <span>
                  <b>52</b>
                  <small>LeetCode</small>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <span>Built for the daily grind</span>
        <div className="platform-wordmark">
          <b>Codeforces</b>
          <b>LeetCode</b>
          <b>CSES</b>
          <b>CodeChef</b>
          <b>GeeksforGeeks</b>
        </div>
      </section>

      <section id="platforms" className="site-reveal py-20">
        <div className="section-kicker">One workflow, five judges</div>
        <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <h2 className="new-section-title">
            Your code, in the
            <br />
            right place every time.
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Choose a platform to see exactly how SolveBase names folders, formats files, and updates
            your README.
          </p>
        </div>
        <div className="mt-10 platform-lab">
          <div className="platform-list">
            {PLATFORM_PREVIEWS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setActivePlatform(platform.id)}
                className={`platform-row ${activePlatform === platform.id ? "is-active" : ""}`}
              >
                <span className={`platform-badge ${platform.bg}`}>{platform.badge}</span>
                <span>{platform.name}</span>
                <span className="ml-auto">
                  {activePlatform === platform.id ? "Viewing" : "View"}
                </span>
              </button>
            ))}
          </div>
          <div className="lab-preview">
            <div className="lab-header">
              <span className="font-mono text-xs text-muted-foreground">
                {selectedPlatform.folder}
                {selectedPlatform.file}
              </span>
              <span className="status-pill">
                <span className="pulse-dot" /> ready
              </span>
            </div>
            <div
              key={selectedPlatform.id}
              className="preview-swap grid gap-6 p-5 lg:grid-cols-[1.25fr_0.75fr]"
            >
              <pre className="code-surface">
                <code>{selectedPlatform.sampleCode}</code>
              </pre>
              <div>
                <p className="section-kicker">README.md</p>
                <pre className="readme-surface mt-3">{selectedPlatform.readmePreview}</pre>
                <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                  <RefreshCcw className="h-3.5 w-3.5 text-accent" /> Updated after every accepted
                  solve
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="site-reveal workflow-section">
        <div className="section-kicker">Set it once</div>
        <h2 className="new-section-title mt-3">
          From verdict to
          <br />
          <span className="ink-highlight mint">portfolio proof.</span>
        </h2>
        <div className="workflow-grid mt-12">
          <div className="workflow-line" />
          {[
            {
              n: "01",
              icon: GitBranch,
              title: "Connect GitHub",
              body: "Choose a public repository and your platforms, then authorize SolveBase with GitHub.",
            },
            {
              n: "02",
              icon: Radar,
              title: "Keep solving",
              body: "SolveBase watches only for an accepted submission on the page you are using.",
            },
            {
              n: "03",
              icon: FolderTree,
              title: "Build your archive",
              body: "The source, folder and README stats arrive in GitHub automatically.",
            },
          ].map((step) => (
            <div key={step.n} className="workflow-step">
              <span className="step-number">{step.n}</span>
              <div className="step-icon">
                <step.icon className="h-5 w-5" />
              </div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm leading-7 text-muted-foreground">
          Read{" "}
          <a href="/how-it-works" className="font-semibold underline underline-offset-4">
            how SolveBase saves solutions to GitHub
          </a>{" "}
          for supported workflows, source-code handling, and the references behind these details.
        </p>
      </section>

      <section id="compare" className="site-reveal py-20" aria-labelledby="compare-title">
        <p className="section-kicker">Choose your workflow</p>
        <h2 id="compare-title" className="mt-3 text-3xl font-black sm:text-5xl">
          SolveBase, LeetHub, CP Sync, and CodeHub.
        </h2>
        <p className="mt-5 max-w-3xl leading-7 text-muted-foreground">
          Compare supported platforms, topic and rating folders, final-verdict handling, and GitHub
          permissions using the documented projects below.
        </p>
        <ExtensionComparison />
        <a
          href="/compare"
          className="mt-6 inline-block text-sm font-semibold underline underline-offset-4"
        >
          Full extension comparison and directory examples
        </a>
      </section>

      <section className="site-reveal feature-band">
        <div>
          <div className="section-kicker">Designed for focus</div>
          <h2 className="new-section-title mt-3">
            The invisible
            <br />
            teammate.
          </h2>
        </div>
        <div className="feature-list">
          {FEATURES.slice(0, 4).map((feature, index) => (
            <article key={feature.title} className="feature-line">
              <span className="feature-index">0{index + 1}</span>
              <feature.icon className="h-5 w-5 text-accent" />
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="install-panel site-reveal">
        <div>
          <div className="section-kicker">Ready when you are</div>
          <h2 className="new-section-title mt-3">
            Make your next
            <br />
            solve count twice.
          </h2>
        </div>
        <div>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Install SolveBase once. Keep your attention on the problem and let your GitHub profile
            tell the story.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={CHROME_WEB_STORE_URL} target="_blank" rel="noreferrer" className="cta-primary">
              Install SolveBase <Download className="h-4 w-4" />
            </a>
            <a
              href="https://github.com/TushalLohar/SolveBase"
              target="_blank"
              rel="noreferrer"
              className="cta-secondary"
            >
              Star on GitHub <span aria-hidden="true">☆</span>
            </a>
          </div>
        </div>
      </section>

      <section className="site-reveal py-20" aria-labelledby="faq-title">
        <div className="section-kicker">Questions, answered</div>
        <h2 id="faq-title" className="new-section-title mt-3">
          No mystery
          <br />
          behind the sync.
        </h2>
        <div className="faq-list mt-10">
          {HOME_FAQS.map((item) => (
            <details key={item.id} id={item.id} className="scroll-mt-24">
              <summary>
                <h3 className="flex w-full items-center justify-between gap-5">
                  <span className="faq-question">
                    <span className="faq-mark" aria-hidden="true">
                      ?
                    </span>
                    {item.question}
                  </span>
                  <span className="faq-toggle" aria-hidden="true">
                    +
                  </span>
                </h3>
              </summary>
              <div className="faq-answer">
                <p id={`${item.id}-answer`}>{item.answer}</p>
                <span className="faq-answer-line" />
              </div>
            </details>
          ))}
        </div>
        <p className="mt-6 text-sm leading-7 text-muted-foreground">
          Find platform-specific answers, GitHub permissions, and troubleshooting in the{" "}
          <a href="/faq" className="font-semibold underline underline-offset-4">
            full SolveBase FAQ
          </a>
          .
        </p>
      </section>

      <nav aria-label="SolveBase guides" className="border-t border-border py-8">
        <h2 className="font-mono text-sm font-bold">SolveBase guides</h2>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <a href="/getting-started" className="underline underline-offset-4">
            Setup, supported platforms, and troubleshooting
          </a>
          <a href="/leetcode-to-github" className="underline underline-offset-4">
            Save LeetCode solutions to GitHub
          </a>
          <a href="/codeforces-to-github" className="underline underline-offset-4">
            Save Codeforces solutions to GitHub
          </a>
          <a href="/faq" className="underline underline-offset-4">
            All SolveBase questions and answers
          </a>
          <a href="/how-it-works" className="underline underline-offset-4">
            How sync works, with sources and workflow comparisons
          </a>
          <a href="/compare" className="underline underline-offset-4">
            SolveBase, LeetHub, CP Sync, and CodeHub comparison
          </a>
        </div>
      </nav>

      <footer className="site-footer">
        <div className="flex items-center gap-3">
          <img src="/solvebase-brand.png" alt="" className="h-8 w-8 rounded-lg" />
          <span className="font-mono text-xs font-black">SOLVEBASE</span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">Live CP solution syncing</span>
        <nav className="flex gap-5 font-mono text-xs text-muted-foreground">
          <a href="/privacy">Privacy</a>
          <a
            href="https://github.com/TushalLohar/SolveBase/issues"
            target="_blank"
            rel="noreferrer"
          >
            Support
          </a>
          <a href="https://github.com/TushalLohar/SolveBase" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </footer>
    </main>
  );
}
