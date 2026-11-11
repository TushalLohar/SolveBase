# Chrome Web Store metadata

Title (74 characters):

SolveBase — Auto-Sync LeetCode, Codeforces, CodeChef, GfG & CSES to GitHub

Short description:

Automatically save accepted LeetCode, Codeforces, CodeChef, GeeksforGeeks and CSES solutions to an organized GitHub repository.

Detailed description:

SolveBase automatically saves newly accepted coding solutions to a public GitHub repository and keeps its README summary up to date.

- LeetCode: standard problem pages, organized by one primary topic such as array, dynamic-programming, or binary-search.
- Codeforces: contest and practice submissions, organized by problem rating. Passing pretests alone does not create a commit; SolveBase waits for the final accepted verdict after system testing.
- CodeChef: problem and submission pages, organized by problem rating.
- GeeksforGeeks: practice problems, organized by difficulty.
- CSES: problem set tasks and results, organized by section.

Connect through GitHub OAuth without creating or pasting a personal access token. Choose a new public repository or a compatible existing public solutions repository. Source code and repository updates travel directly from the extension to GitHub; the SolveBase backend handles the GitHub authorization exchange.

SolveBase captures new submissions while the extension is active. It does not bulk-import past platform submissions. Private repositories and LeetCode contest or Explore editors are not supported. Pending Codeforces final verdicts can be tracked locally for up to seven days; accepted solutions that cannot reach GitHub immediately can remain in a local retry queue for up to 24 hours.

Public repository visibility is confirmed during setup. Reconnecting the same account and repository preserves pending work. README content outside SolveBase's managed summary block is preserved.

Website and setup: https://solvebase.dev/getting-started
Comparison and source references: https://solvebase.dev/compare
Privacy: https://solvebase.dev/privacy
Support: https://github.com/TushalLohar/SolveBase/issues
