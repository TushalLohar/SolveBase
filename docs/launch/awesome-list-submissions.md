# Awesome-list submission drafts

These entries and PR descriptions are drafts. No directory pull requests were submitted. Check each repository's current contribution rules, destination section, and existing issues before using them.

## lnishan/awesome-competitive-programming

Destination: [Tools → Personal use](https://github.com/lnishan/awesome-competitive-programming#personal-use)

Title: Add SolveBase

Proposed row, before Codeforces Parsers:

```markdown
| ★☆☆ | [SolveBase](https://solvebase.dev/) | Automatically archives newly accepted Codeforces, LeetCode, CodeChef, GeeksforGeeks, and CSES solutions to a public GitHub repository, organized by topic, problem rating, difficulty, or section. Waits for final Codeforces acceptance after system tests. |
```

PR description:

Disclosure: I am SolveBase's creator.

Adds a solution-archiving tool under Tools → Personal use. Topic and problem-rating folders help revisit solved problems, and Codeforces pretests remain pending until final acceptance. The proposed priority is conservative and can be adjusted by maintainers.

SolveBase is free and listed in the Chrome Web Store. It uses GitHub OAuth with public repositories and captures new submissions rather than bulk-importing historical submissions. LeetCode support covers standard problem pages.

Validation: checked the destination section's Markdown style and the supported-platform behavior against the public source. Only README.md would change. Inclusion and priority are for the maintainers to decide.

[Setup](https://solvebase.dev/getting-started) · [Source](https://github.com/TushalLohar/SolveBase) · [Implementation references](https://solvebase.dev/how-it-works)

## ashishps1/awesome-leetcode-resources

Destination: [README](https://github.com/ashishps1/awesome-leetcode-resources), a proposed Practice Tools section after Visualization.

Title: Add SolveBase

Proposed section:

```markdown
## 🛠️ Practice Tools

- [SolveBase](https://solvebase.dev/) - Saves newly accepted LeetCode solutions to a public GitHub repository by primary topic; also supports Codeforces, CodeChef, GeeksforGeeks, and CSES.
```

PR description:

Disclosure: I am SolveBase's creator.

Adds a small Practice Tools section alongside the existing revision and visualization resources. SolveBase provides a browsable archive of accepted LeetCode solutions using primary-topic folders such as array, dynamic-programming, and binary-search.

The destination must be public, and GitHub connection uses OAuth. The extension supports standard LeetCode problem pages and captures new submissions; it does not bulk-import submission history.

Validation: checked the proposed entry's Markdown and the primary-topic behavior against the public source. Only README.md would change. The new section and inclusion are for the maintainer to decide.

[Setup](https://solvebase.dev/getting-started) · [Source](https://github.com/TushalLohar/SolveBase)

## awesome-soft/awesome-chrome-extensions

Destination: [Developer Tools](https://github.com/awesome-soft/awesome-chrome-extensions#developer-tools)

Title: Add SolveBase

Proposed entry at the end of Developer Tools:

```markdown
- [SolveBase](https://chromewebstore.google.com/detail/solvebase-solves-to-githu/caeobmhokccipmdinfcajpagikggollm) - Automatically saves accepted LeetCode, Codeforces, CodeChef, GeeksforGeeks, and CSES solutions to a public GitHub repository, organized by topic, rating, difficulty, or section.
```

PR description:

Disclosure: I am SolveBase's creator.

Adds one entry under Developer Tools. SolveBase removes manual copying and GitHub upload steps for accepted coding solutions and organizes the archive by platform-specific categories. GitHub connection uses OAuth and requires a public repository. Codeforces pretest results remain pending until final acceptance.

Validation: checked the official listing, destination section style, and supported platforms against the public source. Only README.md would change. Inclusion is for the maintainers to decide.

[Setup](https://solvebase.dev/getting-started) · [Source](https://github.com/TushalLohar/SolveBase)
