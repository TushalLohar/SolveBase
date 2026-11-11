# Community post drafts

Check the current community rules and pinned threads before posting. Use an allowed project or promotion thread when required. Each draft discloses creator affiliation; none should be presented as an independent review. Do not post the same text repeatedly or ask for votes.

## r/leetcode

Title: Organizing accepted LeetCode solutions by topic in a GitHub revision archive

I build SolveBase, a free browser extension that saves new accepted solutions to a public GitHub repository. The part relevant to LeetCode revision is the folder layout: `leetcode/array/`, `leetcode/dynamic-programming/`, `leetcode/binary-search/`, and other primary topics.

Each problem uses **one primary topic**, rather than copying the same solution into every tag folder. For example, the path template for C++ is `leetcode/<topic>/<number>-<problem-name>.cpp`. File extensions follow the submitted language, and a README summary updates after sync.

GitHub connection uses OAuth, without creating or pasting a PAT. It supports standard LeetCode problem pages, not contest or Explore editors. It captures new submissions while active and does not import your entire past submission history. The destination is public, so this workflow is for solutions you intend to publish.

If you need private repositories or a different folder layout, check the specific LeetHub version or fork you use. I put the documented differences and source links in a [comparison](https://solvebase.dev/compare). [Setup and limitations](https://solvebase.dev/getting-started), [public source](https://github.com/TushalLohar/SolveBase).

## r/competitiveprogramming

Title: A GitHub solution archive should wait for Codeforces system tests

Creator disclosure: I build SolveBase. One implementation decision may be useful to anyone building submission archivers: a Codeforces “Pretests passed” result is not final acceptance.

The extension captures the submission identity, keeps provisional verdicts pending, and starts the GitHub write only after the final accepted verdict. Pending Codeforces verdicts can be tracked locally for up to seven days. Rejected final verdicts do not create an accepted-solution commit; clearing extension data also clears pending work.

The directory uses the **problem rating**: `codeforces/1500/` and `codeforces/1600/`, with `Unrated` when the rating is unavailable. This is distinct from the account rating and from 100-point rating brackets. LeetCode uses one primary topic, CodeChef uses problem rating, GeeksforGeeks uses difficulty, and CSES uses section.

The archive is public and connected with GitHub OAuth. This captures newly accepted submissions, not a historical bulk import. [Verdict-tracking implementation](https://github.com/TushalLohar/SolveBase/blob/00f7d3dd20ebd29848c2f86ad8edae024bb7af03/extension/cf.js), [setup](https://solvebase.dev/getting-started), and [comparison with other extensions](https://solvebase.dev/compare).

## r/developersIndia

Title: SolveBase: the tradeoffs behind syncing coding practice to GitHub

I build SolveBase, a free browser extension for archiving newly accepted coding solutions. Here are the concrete design choices behind it:

- Revision folders use LeetCode's primary topic, Codeforces and CodeChef problem ratings, GeeksforGeeks difficulty, and CSES section.
- Codeforces pretests stay pending; only the final accepted verdict starts a GitHub commit.
- GitHub OAuth avoids manual PAT setup. The requested `public_repo` scope means destinations must be public.
- The extension sends source code and repository writes directly to GitHub. The backend handles the authorization exchange.
- Personal README content outside the managed summary block is preserved.

There are limits: standard LeetCode problem pages only, no historical bulk import, and finite local recovery windows. Pending Codeforces verdicts can be tracked for seven days; accepted solutions awaiting a GitHub retry can remain queued for 24 hours.

[Source repository](https://github.com/TushalLohar/SolveBase), [setup and supported pages](https://solvebase.dev/getting-started), and a [source-linked comparison](https://solvebase.dev/compare) with LeetHub, CP Sync, and the independent CodeHub extension.
