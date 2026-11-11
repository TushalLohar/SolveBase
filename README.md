# SolveBase

SolveBase is a browser extension and companion website for syncing accepted coding solutions to GitHub.

## Development

You need Node.js and npm.

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Technology

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## GitHub OAuth Backend

The three Vercel functions under `api/oauth/github/` are used only while a user connects GitHub:

1. `start` creates a five-minute OAuth state record and redirects to GitHub.
2. `callback` validates and consumes the state, exchanges GitHub's code, encrypts the token, and creates a 60-second one-time exchange code.
3. `exchange` validates the extension's verifier, atomically consumes the exchange code, and returns the token once with `Cache-Control: no-store`.

Source code and normal GitHub synchronization requests do not pass through this backend.
The extension keeps the resulting token only in trusted extension storage; it is never written to
the repository, a page-controlled storage area, or a SolveBase server log.

When an existing solutions repository is connected, SolveBase rebuilds its local solution index from
the repository files before updating the summary. It adopts repositories with recognized solution
folders while rejecting unrelated non-empty repositories. Existing README content is preserved
outside the marked SolveBase summary block. Supported layouts include the normal platform folders and
older Codeforces repositories with rating folders at the repository root.

## Supported submission pages

SolveBase handles live submissions from Codeforces, standard LeetCode problem pages under
`leetcode.com/problems/`, CSES, CodeChef problem pages, and GeeksforGeeks practice problems.
LeetCode contest and Explore editors are not supported in version 1.0.0. Codeforces submissions that
have passed only pretests are kept locally for up to seven days while waiting for a final verdict.
Each witnessed Codeforces submission is tracked independently, including after leaving the tab or
restarting Chrome. Only final accepted solutions are committed.

Reconnecting the same GitHub account and repository preserves pending submissions and resumes retries.
Changing the account or repository clears the old work queue so solutions cannot move to another destination.
Imported solutions retain their existing folder and filename stem; a language change updates the file extension.

When adopting an older repository, SolveBase indexes recognized platform folders and conventional
solution filenames. Unrecognized scratch files in legacy rating folders are intentionally ignored.

### Vercel Setup

1. Create a Vercel project from this repository and connect `solvebase.dev` to Production.
2. Add an Upstash Redis integration and expose its REST URL and token as `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
3. Add the environment variables listed in `.env.example` to the Vercel Production environment.
4. Generate `TOKEN_ENCRYPTION_KEY` locally with `openssl rand -base64 32`.
5. Set the GitHub OAuth App redirect URI to the exact value of `GITHUB_CALLBACK_URL`.
6. Keep `https://solvebase.dev` configured in both `extension/oauth.js` and `extension/manifest.json`.
7. Redeploy Vercel, reload the unpacked extension, and test Connect GitHub.

The production extension ID is `caeobmhokccipmdinfcajpagikggollm`, matching the website's Chrome Web Store link.
Existing Vercel deployments must set both `EXTENSION_ORIGIN` and `EXTENSION_REDIRECT_URL` to the values
in `.env.example`; environment overrides take precedence over the code defaults. An unpacked development
extension has a different ID and needs matching overrides on a separate development OAuth backend.

The GitHub client secret, Redis token, and encryption key must exist only in Vercel environment variables. Never prefix them with `VITE_`, expose them through frontend code, or commit a real `.env` file.

## Checks

Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm audit` before release.
The scoped `minimatch` override supplies the patched matcher used by TypeScript ESLint until its
upstream dependency range includes version 11.0.1 or newer.
