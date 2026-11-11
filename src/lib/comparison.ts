import { CHROME_WEB_STORE_URL, GITHUB_URL, PRODUCT_DESCRIPTION, SITE_URL } from "./product.ts";

export const COMPARISON_REVIEWED_AT = "2026-11-11";
export const COMPARISON_TITLE = "SolveBase, LeetHub, CP Sync, and CodeHub compared";

export const COMPARISON_COLUMNS = [
  { key: "platforms", label: "Platforms supported" },
  { key: "leetcode", label: "LeetCode organization" },
  { key: "codeforces", label: "Codeforces organization" },
  { key: "pretests", label: "Codeforces pretest handling" },
  { key: "auth", label: "GitHub authentication" },
] as const;

export const COMPARISON_ROWS = [
  {
    name: "SolveBase",
    variant: "Version 1.0.0",
    url: GITHUB_URL,
    platforms: "LeetCode, Codeforces, CodeChef, GeeksforGeeks, CSES",
    leetcode: "One primary topic folder: array, dynamic-programming, binary-search, and others",
    codeforces: "Exact problem-rating folders, such as 1500/ and 1600/; Unrated when unavailable",
    pretests: "Waits for final acceptance; pending system tests tracked for up to seven days",
    auth: "GitHub OAuth (public_repo); public repositories only; no manual PAT",
    sources: [
      {
        label: "Supported pages",
        url: `${GITHUB_URL}/blob/00f7d3dd20ebd29848c2f86ad8edae024bb7af03/extension/manifest.json`,
      },
      {
        label: "Topic folders",
        url: `${GITHUB_URL}/blob/00f7d3dd20ebd29848c2f86ad8edae024bb7af03/extension/leetcode.js#L60-L101`,
      },
      {
        label: "Rating folders and final verdicts",
        url: `${GITHUB_URL}/blob/00f7d3dd20ebd29848c2f86ad8edae024bb7af03/extension/cf.js`,
      },
      {
        label: "OAuth permissions",
        url: `${GITHUB_URL}/blob/00f7d3dd20ebd29848c2f86ad8edae024bb7af03/api/oauth/github/start.ts#L67-L71`,
      },
    ],
  },
  {
    name: "LeetHub",
    variant: "Original QasimWani project, source version 1.1.2",
    url: "https://github.com/QasimWani/LeetHub",
    platforms: "LeetCode and GeeksforGeeks",
    leetcode: "Per-problem folders; not topic folders",
    codeforces: "Not supported in the reviewed source",
    pretests: "Not applicable: no Codeforces integration",
    auth: "GitHub OAuth (repo); documentation describes private repositories by default",
    sources: [
      {
        label: "Platforms and source version",
        url: "https://github.com/QasimWani/LeetHub/blob/8b7e560d91fa5490f181fb5aa70e3964a87904db/manifest.json",
      },
      {
        label: "Problem folders",
        url: "https://github.com/QasimWani/LeetHub/blob/8b7e560d91fa5490f181fb5aa70e3964a87904db/scripts/leetcode.js",
      },
      {
        label: "OAuth scope",
        url: "https://github.com/QasimWani/LeetHub/blob/8b7e560d91fa5490f181fb5aa70e3964a87904db/scripts/authorize.js#L19",
      },
      {
        label: "Repository setup",
        url: "https://github.com/QasimWani/LeetHub/blob/8b7e560d91fa5490f181fb5aa70e3964a87904db/README.md",
      },
    ],
  },
  {
    name: "CP Sync",
    variant: "Buddhadeb-ss project, version 2.1.0; unpacked installation",
    url: "https://github.com/Buddhadeb-ss/CP-Sync",
    platforms:
      "Codeforces, LeetCode, CodeChef, HackerRank, AtCoder, vJudge; NeetCode progress tracking; manual support for other judges",
    leetcode: "Difficulty folders: Easy/, Medium/, Hard/",
    codeforces: "Rating brackets, such as 1500-1599/",
    pretests: "Accepts final Accepted and Pretests Passed; user confirmation before upload",
    auth: "Manual fine-grained GitHub PAT with repository Contents read/write permission",
    sources: [
      {
        label: "Platforms, folders, pretests, confirmation, and PAT setup",
        url: "https://github.com/Buddhadeb-ss/CP-Sync/blob/d12064d6b6af623a3e3271cea78fb2ba0acf353d/README.md",
      },
    ],
  },
  {
    name: "CodeHub",
    variant: "Independent rishijain07 project; not SolveBase's former repository name",
    url: "https://github.com/rishijain07/codehub-extension",
    platforms:
      "LeetCode, Codeforces, CodeChef, GeeksforGeeks, NeetCode, public HackerRank challenges, Code360, AtCoder, InterviewBit, AlgoExpert",
    leetcode: "Per-problem folders, such as leetcode/0001-two-sum/",
    codeforces:
      "Per-problem folders, such as codeforces/4A-Watermelon/; not rating folders in the documented layout",
    pretests: "Codeforces pretest-wait behavior is not documented in the reviewed README",
    auth: "GitHub device authorization; enter a one-time code on GitHub",
    sources: [
      {
        label: "Platforms, repository layout, and device authorization",
        url: "https://github.com/rishijain07/codehub-extension/blob/4a58422e4fa75f03e3d236d79d78a6ab563b04cf/README.md",
      },
      {
        label: "Official store listing",
        url: "https://chromewebstore.google.com/detail/codehub/dgjlfbfaepcbokmgpicnngbdfckcloaf",
      },
    ],
  },
];

export const COMPARISON_NOTE =
  "Comparison reflects the linked documentation and source snapshots checked on November 11, 2026. LeetHub forks and different projects named CP Sync can behave differently. CP Sync here is the Buddhadeb-ss project with unpacked installation. Undocumented behavior is marked explicitly; this table does not report live compatibility tests.";

export const OAUTH_TIMING_NOTE =
  "SolveBase's 60-second limit applies to the encrypted one-time token exchange after GitHub authorization. It is not a promise that sign-in or setup takes 60 seconds. OAuth state lasts five minutes; no personal access token needs to be created or pasted.";

export const DIRECTORY_EXAMPLE = `solutions/
├── leetcode/
│   ├── array/<number>-<problem-name>.cpp
│   ├── dynamic-programming/<number>-<problem-name>.cpp
│   └── binary-search/<number>-<problem-name>.cpp
├── codeforces/
│   ├── 1500/<contest-id><index> - <problem-name>.cpp
│   └── 1600/<contest-id><index> - <problem-name>.cpp
├── codechef/<rating>/<problem-code> - <problem-name>.cpp
├── geeksforgeeks/<difficulty>/<problem-name>.cpp
├── cses/<section>/<task-id> - <problem-name>.cpp
└── README.md`;

export function renderComparisonTable() {
  return [
    `| Extension | ${COMPARISON_COLUMNS.map((column) => column.label).join(" | ")} |`,
    `| --- | ${COMPARISON_COLUMNS.map(() => "---").join(" | ")} |`,
    ...COMPARISON_ROWS.map(
      (row) =>
        `| [${row.name}](${row.url}) (${row.variant}) | ${COMPARISON_COLUMNS.map((column) => row[column.key]).join(" | ")} |`,
    ),
  ].join("\n");
}

export function renderComparisonGuide() {
  return [
    `# ${COMPARISON_TITLE}`,
    PRODUCT_DESCRIPTION,
    `Source: ${SITE_URL}/compare`,
    renderComparisonTable(),
    COMPARISON_NOTE,
    OAUTH_TIMING_NOTE,
    "## Which workflow fits your practice?",
    "SolveBase fits a public archive of new accepted submissions across its five supported platforms, with topic and rating folders. LeetHub documents private repositories and focuses on LeetCode and GeeksforGeeks. The reviewed CP Sync offers other judges and confirmation before uploads. CodeHub documents additional platforms and per-problem READMEs. Choose using the specific project version, supported pages, and repository permissions you need.",
    "## SolveBase's directory structure",
    "Illustrative path templates for newly saved C++ solutions. Angle brackets identify placeholders, not literal filenames. Each LeetCode problem uses one primary topic; file extensions follow the submitted language. Compatible imported files can retain their existing paths.",
    `\`\`\`text\n${DIRECTORY_EXAMPLE}\n\`\`\``,
    "## Sources",
    ...COMPARISON_ROWS.map((row) =>
      [
        `### ${row.name}`,
        ...row.sources.map((source) => `- [${source.label}](${source.url})`),
      ].join("\n"),
    ),
    `Install SolveBase: ${CHROME_WEB_STORE_URL}`,
    `Setup guide: ${SITE_URL}/getting-started`,
  ].join("\n\n");
}
