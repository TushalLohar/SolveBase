# SolveBase

SolveBase automatically saves your accepted coding solutions to GitHub, organizes them by platform,
and keeps your repository's solution summary up to date.

[Add to Chrome](https://chromewebstore.google.com/detail/solvebase-solves-to-githu/caeobmhokccipmdinfcajpagikggollm)
· [Website](https://solvebase.dev)

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
