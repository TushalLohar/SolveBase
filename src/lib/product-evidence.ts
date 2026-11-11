import {
  GITHUB_URL,
  MINIMUM_CHROME_VERSION,
  PRODUCT_DESCRIPTION,
  PRODUCT_VERSION,
  SITE_URL,
} from "./product.ts";

export const GUIDE_PATH = "/how-it-works";
export const GUIDE_TITLE = "How SolveBase Saves Coding Solutions to GitHub";
export const GUIDE_DESCRIPTION =
  "How SolveBase captures accepted submissions, writes to a public GitHub repository, and handles retries. Compare automatic sync with manual saving and check the sources.";
export const GUIDE_REVIEWED_AT = "2026-11-11";
export const SOURCE_REVISION = "7095f1df3d2d1d6d3151958f67de0d3fd1b26f0d";
export const SOURCE_SNAPSHOT_URL = `${GITHUB_URL}/tree/${SOURCE_REVISION}`;

function source(label: string, path: string, lines: string) {
  return { label, url: `${GITHUB_URL}/blob/${SOURCE_REVISION}/${path}#${lines}` };
}

export const PRODUCT_FACTS = [
  {
    id: "supported-pages",
    title: "Which coding pages does SolveBase support?",
    text: `SolveBase ${PRODUCT_VERSION} supports Codeforces contest and practice submissions, standard LeetCode problem pages, CSES problem set tasks and results, CodeChef problem and submission pages, and GeeksforGeeks practice problems. LeetCode contest and Explore editors are excluded. The extension requires Chrome ${MINIMUM_CHROME_VERSION} or later, or a compatible Chromium-based browser.`,
    sources: [
      source("Supported pages and browser requirements", "extension/manifest.json", "L1-L91"),
    ],
  },
  {
    id: "submission-capture",
    title: "Which submissions are saved?",
    text: "SolveBase captures new submissions while the extension is active and saves their source code after the final accepted verdict. Passing Codeforces pretests is not final acceptance; SolveBase waits for system testing. It does not bulk-import past platform submissions. Solution source files larger than 2 MiB (2,097,152 UTF-8 bytes) are rejected.",
    sources: [
      source("Live submission capture and source size limit", "extension/sync.js", "L1-L107"),
      source("Codeforces final verdict check", "extension/cf.js", "L115-L126"),
      source("Documented submission history limitation", "README.md", "L31-L32"),
    ],
  },
  {
    id: "github-repositories",
    title: "Which GitHub repositories can I connect?",
    text: "SolveBase supports public GitHub repositories only. It creates a public repository when the chosen name is available or connects a compatible existing public solutions repository. Private repositories and unrelated non-empty repositories are not supported. GitHub connection uses OAuth with the public_repo scope, which applies to public repositories on your account; SolveBase writes to the repository you select.",
    sources: [
      source(
        "Public repository creation and compatibility checks",
        "extension/github.js",
        "L276-L341",
      ),
      source("Requested GitHub OAuth scope", "api/oauth/github/start.ts", "L67-L71"),
    ],
  },
  {
    id: "repository-files",
    title: "What gets written to GitHub?",
    text: "SolveBase creates or updates a solution source file inside the appropriate platform folder and updates the repository README with solution counts. Solving the same problem again updates its file rather than increasing the problem count. Recognized files in a connected existing repository retain their folder and filename stem; a language change can update the file extension. README content outside SolveBase's marked summary block is preserved.",
    sources: [
      source(
        "Solution files, problem counts, and imported filenames",
        "extension/sync.js",
        "L109-L178",
      ),
      source("README preservation and summary updates", "extension/github.js", "L426-L452"),
    ],
  },
  {
    id: "source-code-data-flow",
    title: "Where does my source code go?",
    text: "Accepted solution source code travels directly from the Chrome extension to GitHub's API. The SolveBase backend handles the GitHub authorization exchange; it does not receive solution source code. The extension stores its GitHub authorization token in trusted Chrome extension storage on your device. Solutions saved to a public GitHub repository are publicly readable.",
    sources: [
      source("Direct requests to GitHub's API", "extension/github.js", "L1-L85"),
      source("Solution source written by the extension", "extension/sync.js", "L96-L143"),
      source("Trusted extension storage", "extension/storage.js", "L21-L29"),
    ],
  },
  {
    id: "sync-recovery",
    title: "What happens when acceptance or GitHub is delayed?",
    text: "Pending Codeforces final verdicts can be tracked locally for up to seven days, including after leaving the tab or restarting Chrome. Accepted solutions that cannot reach GitHub immediately can remain in a local retry queue for up to 24 hours. These are retention limits, not guaranteed upload times: a valid GitHub connection and access to the coding platform are still required.",
    sources: [
      source(
        "Codeforces verdict and accepted-solution retention limits",
        "extension/background.js",
        "L25-L26",
      ),
      source("Background recovery regression checks", "tests/background-recovery.test.ts", "L1"),
    ],
  },
];

export const WORKFLOW_SUMMARY =
  "Use SolveBase for a public GitHub archive of new accepted submissions from supported coding pages. Manual saving gives you control over private repositories, drafts, and older files, but you add and organize the files yourself.";

export const WORKFLOW_COMPARISON = [
  {
    goal: "Archive daily accepted practice",
    solvebase: "Saves newly accepted solutions from supported pages while the extension is active.",
    manual:
      "Copy or download your solution, choose its filename and folder, and commit it yourself.",
  },
  {
    goal: "Keep solutions in a private repository",
    solvebase: "Not supported in SolveBase 1.0.0; the connected repository must be public.",
    manual: "Add your files to a private repository you control.",
  },
  {
    goal: "Move older solved problems into GitHub",
    solvebase:
      "No bulk import of platform history. Recognized files already in a compatible repository can be indexed.",
    manual:
      "Retrieve the source where the platform makes it available, then add it to your repository.",
  },
  {
    goal: "Save drafts or unsuccessful attempts",
    solvebase: "Saves final accepted solutions only.",
    manual: "Choose which source files to save, including drafts and unsuccessful attempts.",
  },
];

export const MANUAL_WORKFLOW_SOURCE = {
  label: "GitHub documentation on public and private repositories",
  url: "https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories#about-repository-visibility",
};

export function renderProductGuide() {
  return [
    `# ${GUIDE_TITLE}`,
    PRODUCT_DESCRIPTION,
    `Documentation for SolveBase ${PRODUCT_VERSION}. Checked ${GUIDE_REVIEWED_AT}.`,
    `Source: ${SITE_URL}${GUIDE_PATH}`,
    `Checked source revision: ${SOURCE_SNAPSHOT_URL}`,
    ...PRODUCT_FACTS.map((fact) =>
      [
        `## ${fact.title}`,
        fact.text,
        `Source passage: ${SITE_URL}${GUIDE_PATH}#${fact.id}`,
        fact.sources.map((item) => `- [${item.label}](${item.url})`).join("\n"),
      ].join("\n\n"),
    ),
    [
      "## SolveBase or manual GitHub saving?",
      WORKFLOW_SUMMARY,
      ...WORKFLOW_COMPARISON.map((row) =>
        [`### ${row.goal}`, `SolveBase: ${row.solvebase}`, `Manual saving: ${row.manual}`].join(
          "\n\n",
        ),
      ),
      `[${MANUAL_WORKFLOW_SOURCE.label}](${MANUAL_WORKFLOW_SOURCE.url})`,
    ].join("\n\n"),
  ].join("\n\n");
}
