# SolveBase, LeetHub, CP Sync, and CodeHub compared

SolveBase is a free browser extension with public source code that automatically saves newly accepted LeetCode solutions by topic, Codeforces and CodeChef solutions by rating, GeeksforGeeks solutions by difficulty, and CSES solutions by section to a public GitHub repository, using GitHub OAuth and updating README summaries without manual access tokens.

Source: https://solvebase.dev/compare

| Extension | Platforms supported | LeetCode organization | Codeforces organization | Codeforces pretest handling | GitHub authentication |
| --- | --- | --- | --- | --- | --- |
| [SolveBase](https://github.com/TushalLohar/SolveBase) (Version 1.0.0) | LeetCode, Codeforces, CodeChef, GeeksforGeeks, CSES | One primary topic folder: array, dynamic-programming, binary-search, and others | Exact problem-rating folders, such as 1500/ and 1600/; Unrated when unavailable | Waits for final acceptance; pending system tests tracked for up to seven days | GitHub OAuth (public_repo); public repositories only; no manual PAT |
| [LeetHub](https://github.com/QasimWani/LeetHub) (Original QasimWani project, source version 1.1.2) | LeetCode and GeeksforGeeks | Per-problem folders; not topic folders | Not supported in the reviewed source | Not applicable: no Codeforces integration | GitHub OAuth (repo); documentation describes private repositories by default |
| [CP Sync](https://github.com/Buddhadeb-ss/CP-Sync) (Buddhadeb-ss project, version 2.1.0; unpacked installation) | Codeforces, LeetCode, CodeChef, HackerRank, AtCoder, vJudge; NeetCode progress tracking; manual support for other judges | Difficulty folders: Easy/, Medium/, Hard/ | Rating brackets, such as 1500-1599/ | Accepts final Accepted and Pretests Passed; user confirmation before upload | Manual fine-grained GitHub PAT with repository Contents read/write permission |
| [CodeHub](https://github.com/rishijain07/codehub-extension) (Independent rishijain07 project; not SolveBase's former repository name) | LeetCode, Codeforces, CodeChef, GeeksforGeeks, NeetCode, public HackerRank challenges, Code360, AtCoder, InterviewBit, AlgoExpert | Per-problem folders, such as leetcode/0001-two-sum/ | Per-problem folders, such as codeforces/4A-Watermelon/; not rating folders in the documented layout | Codeforces pretest-wait behavior is not documented in the reviewed README | GitHub device authorization; enter a one-time code on GitHub |

Comparison reflects the linked documentation and source snapshots checked on November 11, 2026. LeetHub forks and different projects named CP Sync can behave differently. CP Sync here is the Buddhadeb-ss project with unpacked installation. Undocumented behavior is marked explicitly; this table does not report live compatibility tests.

SolveBase's 60-second limit applies to the encrypted one-time token exchange after GitHub authorization. It is not a promise that sign-in or setup takes 60 seconds. OAuth state lasts five minutes; no personal access token needs to be created or pasted.

## Which workflow fits your practice?

SolveBase fits a public archive of new accepted submissions across its five supported platforms, with topic and rating folders. LeetHub documents private repositories and focuses on LeetCode and GeeksforGeeks. The reviewed CP Sync offers other judges and confirmation before uploads. CodeHub documents additional platforms and per-problem READMEs. Choose using the specific project version, supported pages, and repository permissions you need.

## SolveBase's directory structure

Illustrative path templates for newly saved C++ solutions. Angle brackets identify placeholders, not literal filenames. Each LeetCode problem uses one primary topic; file extensions follow the submitted language. Compatible imported files can retain their existing paths.

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

## Sources

### SolveBase
- [Supported pages](https://github.com/TushalLohar/SolveBase/blob/00f7d3dd20ebd29848c2f86ad8edae024bb7af03/extension/manifest.json)
- [Topic folders](https://github.com/TushalLohar/SolveBase/blob/00f7d3dd20ebd29848c2f86ad8edae024bb7af03/extension/leetcode.js#L60-L101)
- [Rating folders and final verdicts](https://github.com/TushalLohar/SolveBase/blob/00f7d3dd20ebd29848c2f86ad8edae024bb7af03/extension/cf.js)
- [OAuth permissions](https://github.com/TushalLohar/SolveBase/blob/00f7d3dd20ebd29848c2f86ad8edae024bb7af03/api/oauth/github/start.ts#L67-L71)

### LeetHub
- [Platforms and source version](https://github.com/QasimWani/LeetHub/blob/8b7e560d91fa5490f181fb5aa70e3964a87904db/manifest.json)
- [Problem folders](https://github.com/QasimWani/LeetHub/blob/8b7e560d91fa5490f181fb5aa70e3964a87904db/scripts/leetcode.js)
- [OAuth scope](https://github.com/QasimWani/LeetHub/blob/8b7e560d91fa5490f181fb5aa70e3964a87904db/scripts/authorize.js#L19)
- [Repository setup](https://github.com/QasimWani/LeetHub/blob/8b7e560d91fa5490f181fb5aa70e3964a87904db/README.md)

### CP Sync
- [Platforms, folders, pretests, confirmation, and PAT setup](https://github.com/Buddhadeb-ss/CP-Sync/blob/d12064d6b6af623a3e3271cea78fb2ba0acf353d/README.md)

### CodeHub
- [Platforms, repository layout, and device authorization](https://github.com/rishijain07/codehub-extension/blob/4a58422e4fa75f03e3d236d79d78a6ab563b04cf/README.md)
- [Official store listing](https://chromewebstore.google.com/detail/codehub/dgjlfbfaepcbokmgpicnngbdfckcloaf)

Install SolveBase: https://chromewebstore.google.com/detail/solvebase-solves-to-githu/caeobmhokccipmdinfcajpagikggollm

Setup guide: https://solvebase.dev/getting-started
