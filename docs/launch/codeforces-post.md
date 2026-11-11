# Waiting for system tests before archiving Codeforces solutions to GitHub

Disclosure: I build SolveBase, the browser extension described here. This is a technical walkthrough of its behavior, not an independent recommendation.

An accepted-solution archive should record the final verdict. In a Codeforces contest, “Pretests passed” is provisional: system tests can still reject the submission. Pushing at that point can leave a repository claiming that an unsuccessful submission was accepted.

SolveBase separates submission capture from GitHub synchronization. It records the submission identity and tracks the verdict before creating the solution commit. A pretest result stays pending. Only a final accepted verdict starts the GitHub write. A final rejected verdict does not produce an accepted-solution commit.

Pending Codeforces verdicts can be tracked locally for up to seven days. This is a bounded recovery window, not an indefinite guarantee: removing the extension or clearing its local data removes that pending state. An accepted solution that temporarily cannot reach GitHub uses a separate local retry queue, with a maximum lifetime of 24 hours.

The folder key is the **problem's rating**, not the user's rating. A 1500-rated problem goes under `codeforces/1500/`; a 1600-rated problem goes under `codeforces/1600/`. Problems without an available rating use `Unrated`. This makes a revision archive browsable by the difficulty of the problems you actually solved.

Illustrative path templates for C++:

```text
solutions/
├── codeforces/
│   ├── 1500/<contest-id><index> - <problem-name>.cpp
│   └── 1600/<contest-id><index> - <problem-name>.cpp
├── leetcode/dynamic-programming/<number>-<problem-name>.cpp
└── README.md
```

Angle brackets denote placeholders. LeetCode problems use one primary topic folder; the extension follows the submitted language for file extensions. The README summary updates after synchronization and preserves personal content outside its managed block.

SolveBase also supports CodeChef by problem rating, GeeksforGeeks by difficulty, and CSES by section. GitHub connection uses OAuth with `public_repo`, so the destination must be public. The extension captures newly accepted submissions while active; it does not bulk-import historical platform submissions.

There are reasonable alternatives. The reviewed Buddhadeb-ss CP Sync project uses rating brackets and confirmation before upload, and supports additional judges. CodeHub documents more platforms and per-problem directories. A source-linked comparison explains these differences rather than treating every extension as interchangeable.

Implementation: [final-verdict tracking](https://github.com/TushalLohar/SolveBase/blob/00f7d3dd20ebd29848c2f86ad8edae024bb7af03/extension/cf.js), [pending queue](https://github.com/TushalLohar/SolveBase/blob/00f7d3dd20ebd29848c2f86ad8edae024bb7af03/extension/pending.js).

[Setup](https://solvebase.dev/getting-started) · [Comparison and sources](https://solvebase.dev/compare) · [Public source repository](https://github.com/TushalLohar/SolveBase)
