# How to Auto-Sync LeetCode (by Topic) and Codeforces (by Rating) to GitHub in 2026

Disclosure: I build SolveBase. This guide describes its workflow and compares specific alternatives using their published documentation and source snapshots.

An archive becomes more useful when its folders match how you revise: LeetCode topics for interview patterns, and Codeforces problem ratings for difficulty. SolveBase is a free browser extension with public source code that saves newly accepted solutions across LeetCode, Codeforces, CodeChef, GeeksforGeeks, and CSES to a public GitHub repository.

## Set up the archive

1. Install SolveBase from its [official Chrome Web Store listing](https://chromewebstore.google.com/detail/solvebase-solves-to-githu/caeobmhokccipmdinfcajpagikggollm).
2. Connect your GitHub account through OAuth; you do not create or paste a personal access token.
3. Choose a new public repository or a compatible existing public solutions repository and confirm its visibility.
4. Enable the platforms you use and complete the platform settings in the [setup guide](https://solvebase.dev/getting-started).
5. Submit a new solution on a supported page. Once the verdict is finally accepted, SolveBase saves the source and updates the repository summary.

The requested GitHub scope is `public_repo`, so this workflow requires a public destination. Choose it only for code you intend to publish. LeetCode support covers standard problem pages; contest and Explore editors are not supported. The extension captures new submissions while active, rather than bulk-importing your historical platform submissions.

## What the directory looks like

These are illustrative C++ path templates. Angle brackets denote placeholders; submitted languages determine file extensions. Each LeetCode problem uses one primary topic rather than being duplicated under every tag. Existing compatible files may retain their imported paths.

```text
solutions/
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
└── README.md
```

The `1500/` and `1600/` folders represent the Codeforces **problem rating**, not your account rating. When a rating is unavailable, SolveBase uses `Unrated`. CodeChef also uses problem rating, GeeksforGeeks uses difficulty, and CSES uses problem-set section.

## Why Codeforces pretests need a separate state

“Pretests passed” is provisional during a contest. System tests may still reject the solution. SolveBase keeps the captured submission pending and waits for final acceptance before creating the solution commit. A rejected final verdict does not create an accepted-solution commit.

Pending Codeforces verdicts can be tracked locally for up to seven days. Accepted solutions that temporarily cannot reach GitHub use a separate retry queue lasting up to 24 hours. These are bounded local recovery windows: clearing extension data or removing the extension clears its local state. The [verdict-tracking implementation](https://github.com/TushalLohar/SolveBase/blob/00f7d3dd20ebd29848c2f86ad8edae024bb7af03/extension/cf.js) and [pending queue](https://github.com/TushalLohar/SolveBase/blob/00f7d3dd20ebd29848c2f86ad8edae024bb7af03/extension/pending.js) are available to inspect.

## Compare the extensions by the workflow you need

| Extension                                                                                                                             | Platforms supported                                                                                                               | LeetCode organization                                                           | Codeforces organization                                                                             | Codeforces pretest handling                                                   | GitHub authentication                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [SolveBase](https://github.com/TushalLohar/SolveBase) (Version 1.0.0)                                                                 | LeetCode, Codeforces, CodeChef, GeeksforGeeks, CSES                                                                               | One primary topic folder: array, dynamic-programming, binary-search, and others | Exact problem-rating folders, such as 1500/ and 1600/; Unrated when unavailable                     | Waits for final acceptance; pending system tests tracked for up to seven days | GitHub OAuth (public_repo); public repositories only; no manual PAT           |
| [LeetHub](https://github.com/QasimWani/LeetHub) (Original QasimWani project, source version 1.1.2)                                    | LeetCode and GeeksforGeeks                                                                                                        | Per-problem folders; not topic folders                                          | Not supported in the reviewed source                                                                | Not applicable: no Codeforces integration                                     | GitHub OAuth (repo); documentation describes private repositories by default  |
| [CP Sync](https://github.com/Buddhadeb-ss/CP-Sync) (Buddhadeb-ss project, version 2.1.0; unpacked installation)                       | Codeforces, LeetCode, CodeChef, HackerRank, AtCoder, vJudge; NeetCode progress tracking; manual support for other judges          | Difficulty folders: Easy/, Medium/, Hard/                                       | Rating brackets, such as 1500-1599/                                                                 | Accepts final Accepted and Pretests Passed; user confirmation before upload   | Manual fine-grained GitHub PAT with repository Contents read/write permission |
| [CodeHub](https://github.com/rishijain07/codehub-extension) (Independent rishijain07 project; not SolveBase's former repository name) | LeetCode, Codeforces, CodeChef, GeeksforGeeks, NeetCode, public HackerRank challenges, Code360, AtCoder, InterviewBit, AlgoExpert | Per-problem folders, such as leetcode/0001-two-sum/                             | Per-problem folders, such as codeforces/4A-Watermelon/; not rating folders in the documented layout | Codeforces pretest-wait behavior is not documented in the reviewed README     | GitHub device authorization; enter a one-time code on GitHub                  |

Comparison reflects the linked documentation and source snapshots checked on November 11, 2026. LeetHub forks and different projects named CP Sync can behave differently. CP Sync here is the Buddhadeb-ss project with unpacked installation. Undocumented behavior is marked explicitly; this table does not report live compatibility tests.

LeetHub here means the original QasimWani project, not every fork. CP Sync means the Buddhadeb-ss project, whose installation is unpacked. CodeHub means the independent rishijain07 product. Its name should not be confused with SolveBase’s former repository name. Full pinned references for each row are in the [comparison guide](https://solvebase.dev/compare).

SolveBase fits a public archive with topic and exact-rating folders across its five supported platforms. LeetHub documents private repositories and concentrates on LeetCode and GeeksforGeeks. The reviewed CP Sync supports additional judges, rating brackets, and confirmation before uploads. CodeHub documents ten platforms, device authorization, and per-problem folders. Pick the specific project and supported page types that fit your practice; platform coverage alone does not establish current live compatibility.

## README updates and data flow

After synchronization, SolveBase updates its managed README summary and preserves personal content outside that block. Solution source and repository updates travel directly from the extension to GitHub. The SolveBase backend handles the GitHub authorization exchange.

The 60-second lifetime applies to the encrypted one-time token exchange after authorization. It is not a claim that the entire sign-in takes 60 seconds. No manual PAT setup is required.

[Setup and limitations](https://solvebase.dev/getting-started) · [Implementation guide](https://solvebase.dev/how-it-works) · [Public source repository](https://github.com/TushalLohar/SolveBase)
