# How SolveBase Saves Coding Solutions to GitHub

SolveBase is a free browser extension with public source code that automatically saves newly accepted LeetCode solutions by topic, Codeforces and CodeChef solutions by rating, GeeksforGeeks solutions by difficulty, and CSES solutions by section to a public GitHub repository, using GitHub OAuth and updating README summaries without manual access tokens.

Documentation for SolveBase 1.0.0. Checked 2026-11-11.

Source: https://solvebase.dev/how-it-works

Checked source revision: https://github.com/TushalLohar/SolveBase/tree/7095f1df3d2d1d6d3151958f67de0d3fd1b26f0d

## Which coding pages does SolveBase support?

SolveBase 1.0.0 supports Codeforces contest and practice submissions, standard LeetCode problem pages, CSES problem set tasks and results, CodeChef problem and submission pages, and GeeksforGeeks practice problems. LeetCode contest and Explore editors are excluded. The extension requires Chrome 112 or later, or a compatible Chromium-based browser.

Source passage: https://solvebase.dev/how-it-works#supported-pages

- [Supported pages and browser requirements](https://github.com/TushalLohar/SolveBase/blob/7095f1df3d2d1d6d3151958f67de0d3fd1b26f0d/extension/manifest.json#L1-L91)

## Which submissions are saved?

SolveBase captures new submissions while the extension is active and saves their source code after the final accepted verdict. Passing Codeforces pretests is not final acceptance; SolveBase waits for system testing. It does not bulk-import past platform submissions. Solution source files larger than 2 MiB (2,097,152 UTF-8 bytes) are rejected.

Source passage: https://solvebase.dev/how-it-works#submission-capture

- [Live submission capture and source size limit](https://github.com/TushalLohar/SolveBase/blob/7095f1df3d2d1d6d3151958f67de0d3fd1b26f0d/extension/sync.js#L1-L107)
- [Codeforces final verdict check](https://github.com/TushalLohar/SolveBase/blob/7095f1df3d2d1d6d3151958f67de0d3fd1b26f0d/extension/cf.js#L115-L126)
- [Documented submission history limitation](https://github.com/TushalLohar/SolveBase/blob/7095f1df3d2d1d6d3151958f67de0d3fd1b26f0d/README.md#L31-L32)

## Which GitHub repositories can I connect?

SolveBase supports public GitHub repositories only. It creates a public repository when the chosen name is available or connects a compatible existing public solutions repository. Private repositories and unrelated non-empty repositories are not supported. GitHub connection uses OAuth with the public_repo scope, which applies to public repositories on your account; SolveBase writes to the repository you select.

Source passage: https://solvebase.dev/how-it-works#github-repositories

- [Public repository creation and compatibility checks](https://github.com/TushalLohar/SolveBase/blob/7095f1df3d2d1d6d3151958f67de0d3fd1b26f0d/extension/github.js#L276-L341)
- [Requested GitHub OAuth scope](https://github.com/TushalLohar/SolveBase/blob/7095f1df3d2d1d6d3151958f67de0d3fd1b26f0d/api/oauth/github/start.ts#L67-L71)

## What gets written to GitHub?

SolveBase creates or updates a solution source file inside the appropriate platform folder and updates the repository README with solution counts. Solving the same problem again updates its file rather than increasing the problem count. Recognized files in a connected existing repository retain their folder and filename stem; a language change can update the file extension. README content outside SolveBase's marked summary block is preserved.

Source passage: https://solvebase.dev/how-it-works#repository-files

- [Solution files, problem counts, and imported filenames](https://github.com/TushalLohar/SolveBase/blob/7095f1df3d2d1d6d3151958f67de0d3fd1b26f0d/extension/sync.js#L109-L178)
- [README preservation and summary updates](https://github.com/TushalLohar/SolveBase/blob/7095f1df3d2d1d6d3151958f67de0d3fd1b26f0d/extension/github.js#L426-L452)

## Where does my source code go?

Accepted solution source code travels directly from the Chrome extension to GitHub's API. The SolveBase backend handles the GitHub authorization exchange; it does not receive solution source code. The extension stores its GitHub authorization token in trusted Chrome extension storage on your device. Solutions saved to a public GitHub repository are publicly readable.

Source passage: https://solvebase.dev/how-it-works#source-code-data-flow

- [Direct requests to GitHub's API](https://github.com/TushalLohar/SolveBase/blob/7095f1df3d2d1d6d3151958f67de0d3fd1b26f0d/extension/github.js#L1-L85)
- [Solution source written by the extension](https://github.com/TushalLohar/SolveBase/blob/7095f1df3d2d1d6d3151958f67de0d3fd1b26f0d/extension/sync.js#L96-L143)
- [Trusted extension storage](https://github.com/TushalLohar/SolveBase/blob/7095f1df3d2d1d6d3151958f67de0d3fd1b26f0d/extension/storage.js#L21-L29)

## What happens when acceptance or GitHub is delayed?

Pending Codeforces final verdicts can be tracked locally for up to seven days, including after leaving the tab or restarting Chrome. Accepted solutions that cannot reach GitHub immediately can remain in a local retry queue for up to 24 hours. These are retention limits, not guaranteed upload times: a valid GitHub connection and access to the coding platform are still required.

Source passage: https://solvebase.dev/how-it-works#sync-recovery

- [Codeforces verdict and accepted-solution retention limits](https://github.com/TushalLohar/SolveBase/blob/7095f1df3d2d1d6d3151958f67de0d3fd1b26f0d/extension/background.js#L25-L26)
- [Background recovery regression checks](https://github.com/TushalLohar/SolveBase/blob/7095f1df3d2d1d6d3151958f67de0d3fd1b26f0d/tests/background-recovery.test.ts#L1)

## SolveBase or manual GitHub saving?

Use SolveBase for a public GitHub archive of new accepted submissions from supported coding pages. Manual saving gives you control over private repositories, drafts, and older files, but you add and organize the files yourself.

### Archive daily accepted practice

SolveBase: Saves newly accepted solutions from supported pages while the extension is active.

Manual saving: Copy or download your solution, choose its filename and folder, and commit it yourself.

### Keep solutions in a private repository

SolveBase: Not supported in SolveBase 1.0.0; the connected repository must be public.

Manual saving: Add your files to a private repository you control.

### Move older solved problems into GitHub

SolveBase: No bulk import of platform history. Recognized files already in a compatible repository can be indexed.

Manual saving: Retrieve the source where the platform makes it available, then add it to your repository.

### Save drafts or unsuccessful attempts

SolveBase: Saves final accepted solutions only.

Manual saving: Choose which source files to save, including drafts and unsuccessful attempts.

[GitHub documentation on public and private repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories#about-repository-visibility)
