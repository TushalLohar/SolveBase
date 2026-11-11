export const SITE_URL = "https://solvebase.dev";
export const CHROME_WEB_STORE_URL =
  "https://chromewebstore.google.com/detail/solvebase-solves-to-githu/caeobmhokccipmdinfcajpagikggollm";
export const GITHUB_URL = "https://github.com/TushalLohar/SolveBase";
export const PRODUCT_VERSION = "1.0.0";
export const MINIMUM_CHROME_VERSION = 112;
export const PRODUCT_TITLE =
  "SolveBase — Auto-Sync LeetCode, Codeforces, CodeChef, GfG & CSES to GitHub";
export const PRODUCT_DESCRIPTION =
  "SolveBase is a free browser extension with public source code that automatically saves newly accepted LeetCode solutions by topic, Codeforces and CodeChef solutions by rating, GeeksforGeeks solutions by difficulty, and CSES solutions by section to a public GitHub repository, using GitHub OAuth and updating README summaries without manual access tokens.";

export const SUPPORTED_PLATFORMS = [
  { name: "Codeforces", pages: "Contest and practice submissions", folders: "Problem rating" },
  {
    name: "LeetCode",
    pages: "Standard leetcode.com/problems/ pages; excludes contest and Explore editors",
    folders: "Problem topic",
  },
  { name: "CSES", pages: "Problem set tasks and results", folders: "Problem set section" },
  { name: "CodeChef", pages: "Problem and submission pages", folders: "Problem rating" },
  { name: "GeeksforGeeks", pages: "Practice problems", folders: "Problem difficulty" },
];
