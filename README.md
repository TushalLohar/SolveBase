# SolveBase

SolveBase is a free browser extension with public source code that automatically saves newly accepted
LeetCode solutions by topic, Codeforces and CodeChef solutions by rating, GeeksforGeeks solutions by
difficulty, and CSES solutions by section to a public GitHub repository, using GitHub OAuth and updating
README summaries without manual access tokens.

[Add to Chrome](https://chromewebstore.google.com/detail/solvebase-solves-to-githu/caeobmhokccipmdinfcajpagikggollm)
· [Website](https://solvebase.dev)

<!-- solvebase-comparison -->

## Compare GitHub sync extensions

| Extension | Platforms supported | LeetCode organization | Codeforces organization | Codeforces pretest handling | GitHub authentication |
| --- | --- | --- | --- | --- | --- |
| [SolveBase](https://github.com/TushalLohar/SolveBase) (Version 1.0.0) | LeetCode, Codeforces, CodeChef, GeeksforGeeks, CSES | One primary topic folder: array, dynamic-programming, binary-search, and others | Exact problem-rating folders, such as 1500/ and 1600/; Unrated when unavailable | Waits for final acceptance; pending system tests tracked for up to seven days | GitHub OAuth (public_repo); public repositories only; no manual PAT |
| [LeetHub](https://github.com/QasimWani/LeetHub) (Original QasimWani project, source version 1.1.2) | LeetCode and GeeksforGeeks | Per-problem folders; not topic folders | Not supported in the reviewed source | Not applicable: no Codeforces integration | GitHub OAuth (repo); documentation describes private repositories by default |
| [CP Sync](https://github.com/Buddhadeb-ss/CP-Sync) (Buddhadeb-ss project, version 2.1.0; unpacked installation) | Codeforces, LeetCode, CodeChef, HackerRank, AtCoder, vJudge; NeetCode progress tracking; manual support for other judges | Difficulty folders: Easy/, Medium/, Hard/ | Rating brackets, such as 1500-1599/ | Accepts final Accepted and Pretests Passed; user confirmation before upload | Manual fine-grained GitHub PAT with repository Contents read/write permission |
| [CodeHub](https://github.com/rishijain07/codehub-extension) (Independent rishijain07 project; not SolveBase's former repository name) | LeetCode, Codeforces, CodeChef, GeeksforGeeks, NeetCode, public HackerRank challenges, Code360, AtCoder, InterviewBit, AlgoExpert | Per-problem folders, such as leetcode/0001-two-sum/ | Per-problem folders, such as codeforces/4A-Watermelon/; not rating folders in the documented layout | Codeforces pretest-wait behavior is not documented in the reviewed README | GitHub device authorization; enter a one-time code on GitHub |

Comparison reflects the linked documentation and source snapshots checked on November 11, 2026. LeetHub forks and different projects named CP Sync can behave differently. CP Sync here is the Buddhadeb-ss project with unpacked installation. Undocumented behavior is marked explicitly; this table does not report live compatibility tests.

SolveBase's 60-second limit applies to the encrypted one-time token exchange after GitHub authorization. It is not a promise that sign-in or setup takes 60 seconds. OAuth state lasts five minutes; no personal access token needs to be created or pasted.

Sources for SolveBase: [Supported pages](https://github.com/TushalLohar/SolveBase/blob/00f7d3dd20ebd29848c2f86ad8edae024bb7af03/extension/manifest.json) · [Topic folders](https://github.com/TushalLohar/SolveBase/blob/00f7d3dd20ebd29848c2f86ad8edae024bb7af03/extension/leetcode.js#L60-L101) · [Rating folders and final verdicts](https://github.com/TushalLohar/SolveBase/blob/00f7d3dd20ebd29848c2f86ad8edae024bb7af03/extension/cf.js) · [OAuth permissions](https://github.com/TushalLohar/SolveBase/blob/00f7d3dd20ebd29848c2f86ad8edae024bb7af03/api/oauth/github/start.ts#L67-L71)

Sources for LeetHub: [Platforms and source version](https://github.com/QasimWani/LeetHub/blob/8b7e560d91fa5490f181fb5aa70e3964a87904db/manifest.json) · [Problem folders](https://github.com/QasimWani/LeetHub/blob/8b7e560d91fa5490f181fb5aa70e3964a87904db/scripts/leetcode.js) · [OAuth scope](https://github.com/QasimWani/LeetHub/blob/8b7e560d91fa5490f181fb5aa70e3964a87904db/scripts/authorize.js#L19) · [Repository setup](https://github.com/QasimWani/LeetHub/blob/8b7e560d91fa5490f181fb5aa70e3964a87904db/README.md)

Sources for CP Sync: [Platforms, folders, pretests, confirmation, and PAT setup](https://github.com/Buddhadeb-ss/CP-Sync/blob/d12064d6b6af623a3e3271cea78fb2ba0acf353d/README.md)

Sources for CodeHub: [Platforms, repository layout, and device authorization](https://github.com/rishijain07/codehub-extension/blob/4a58422e4fa75f03e3d236d79d78a6ab563b04cf/README.md) · [Official store listing](https://chromewebstore.google.com/detail/codehub/dgjlfbfaepcbokmgpicnngbdfckcloaf)

[Read the full comparison and directory examples](https://solvebase.dev/compare).

<!-- /solvebase-comparison -->

## Get started

1. Install SolveBase from the Chrome Web Store and open the extension popup.
2. Choose a repository name, enable the platforms you use, and enter the requested usernames.
3. Confirm that your solutions will be public, then select **Connect GitHub** and authorize SolveBase.
4. Stay signed in to your coding platforms and submit solutions as usual. SolveBase saves newly
   accepted submissions to your selected repository.

SolveBase uses GitHub OAuth with the `public_repo` scope; you do not need to create or paste a personal
access token. It creates a public repository if the name is available, or adopts a compatible existing
public solutions repository. Private repositories are not supported.

## Supported platforms

| Platform      | Supported pages                               | Folder organization |
| ------------- | --------------------------------------------- | ------------------- |
| Codeforces    | Contest and practice submissions              | Problem rating      |
| LeetCode      | Standard pages under `leetcode.com/problems/` | Problem topic       |
| CSES          | Problem set tasks and results                 | Problem set section |
| CodeChef      | Problem and submission pages                  | Problem rating      |
| GeeksforGeeks | Practice problems                             | Problem difficulty  |

LeetCode contest and Explore editors are not supported in version 1.0.0. SolveBase detects new
submissions while the extension is active; it does not bulk-import your submission history.

## Sync and recovery

- Only final accepted solutions are committed. Codeforces submissions that have passed only pretests
  are tracked for up to seven days while waiting for system testing, including after leaving the tab
  or restarting Chrome.
- Accepted solutions that cannot reach GitHub immediately can remain queued locally for up to
  twenty-four hours while synchronization retries.
- Reconnecting the same GitHub account and repository preserves pending submissions. Changing the
  account or repository clears the old work queue.
- Solving the same problem again updates its solution file instead of increasing the problem count.
- Imported solutions retain their existing folder and filename stem; a language change updates the
  file extension.

When an existing solutions repository is connected, SolveBase rebuilds its local solution index from
recognized platform folders and conventional solution filenames. Older Codeforces layouts with rating
folders at the repository root are supported. Unrecognized scratch files are ignored, and unrelated
non-empty repositories are rejected. Existing README content is preserved outside the marked SolveBase
summary block.

## Privacy and architecture

Solution source code and repository updates travel directly from the extension to GitHub. The
SolveBase backend handles only the GitHub authorization exchange. The extension keeps the GitHub token
in trusted Chrome extension storage; it is never written to the repository, page-controlled storage,
or a SolveBase server log.

The three Vercel functions under `api/oauth/github/` are used while connecting GitHub:

1. `start` creates a five-minute OAuth state record and redirects to GitHub.
2. `callback` validates and consumes the state, exchanges GitHub's code, encrypts the token, and creates
   a sixty-second one-time exchange code.
3. `exchange` validates the extension's verifier, atomically consumes the exchange code, and returns
   the token once with `Cache-Control: no-store`.

The website uses TanStack Start, React, TypeScript, Tailwind CSS, and Vite. The extension uses Chrome
Manifest V3 and JavaScript modules. OAuth state is stored in Upstash Redis.

## Development

Use **Node.js 22.x** and npm.

```sh
git clone https://github.com/TushalLohar/SolveBase.git
cd SolveBase
npm ci
npm run dev
```

Open the local URL printed by Vite. Website development does not require GitHub or Redis secrets;
the OAuth endpoints require a separately configured backend.

| Directory           | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `extension/`        | Extension popup, platform adapters, and background synchronization |
| `src/`              | Website routes, components, and styles                             |
| `api/oauth/github/` | Vercel OAuth endpoints                                             |
| `server/oauth/`     | OAuth configuration, encryption, Redis, and rate limiting          |
| `tests/`            | Authentication, repository, and synchronization regression tests   |

### Load the extension locally

1. Open `chrome://extensions` and enable **Developer mode**.
2. Select **Load unpacked** and choose this repository's `extension/` directory. No extension build
   step is required.
3. Reload the extension after editing its files, and refresh coding-platform tabs to reload their
   content scripts.

An unpacked extension has a different ID from the Chrome Web Store release. To test GitHub connection,
use a separate development OAuth backend and GitHub OAuth App. Set that backend's `EXTENSION_ORIGIN`
and `EXTENSION_REDIRECT_URL` using the unpacked ID shown in Chrome, and point `OAUTH_API_BASE` in
`extension/oauth.js` and the backend host permission in `extension/manifest.json` to its HTTPS origin.
Set the development app's callback URL to that backend's `/api/oauth/github/callback` endpoint.

## Checks

Run these checks before release:

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm audit
```

The scoped `minimatch` override supplies the patched matcher used by TypeScript ESLint until its
upstream dependency range includes version 11.0.1 or newer.

### Website answers and crawler references

The homepage, platform guides, and `/faq` share their question-and-answer content from
`src/lib/answers.ts`. Keep product facts in `src/lib/product.ts` aligned with the released extension.
FAQ structured data uses the same answers and permanent fragment links as the rendered pages.

`/how-it-works` explains the supported workflows and data flow, compares automatic sync with manual
saving, and cites a checked source revision. Its facts and citations live in
`src/lib/product-evidence.ts`. Update the checked date and source revision after reviewing a new
extension release; keep these dates tied to an actual review.

`npm run build` prerenders the public pages and regenerates `public/llms-full.txt` from those shared
facts, setup steps, answers, and product guide. It also generates `public/how-it-works.md` from the same
guide content shown on the website. Run `npm run docs:generate` to refresh both text references without
building. Keep `public/llms.txt` and `public/sitemap.xml` up to date when adding documentation routes.

For bugs or feature requests, [open an issue](https://github.com/TushalLohar/SolveBase/issues). Include
the platform, extension version, expected behavior, and any error message; omit tokens and secrets.
