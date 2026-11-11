# SolveBase Chrome Web Store Submission

## Listing

- Product name: `SolveBase - Solves to GitHub`
- Category: `Developer Tools`
- Language: `English`
- Homepage: `https://solvebase.dev/`
- Privacy policy: `https://solvebase.dev/privacy`
- Support: `https://github.com/TushalLohar/SolveBase/issues`

Short description:

> Automatically save accepted coding solutions to an organized GitHub repository.

Detailed description:

> SolveBase archives your own accepted competitive-programming solutions to your own GitHub repository automatically when they are accepted.
>
> After you connect GitHub and choose a repository, SolveBase detects newly accepted submissions on Codeforces, LeetCode, CSES, CodeChef, and GeeksforGeeks. It saves the source code directly to GitHub using consistent platform-specific folders and maintains a summary of your solved problems.
>
> Features:
>
> - Live synchronization after an accepted submission
> - Codeforces organization by problem rating
> - LeetCode organization by algorithm topic
> - CSES, CodeChef, and GeeksforGeeks support
> - Existing compatible repository recovery
> - README totals rebuilt from repository files after reconnecting
> - One-click GitHub OAuth with no personal access token to copy
> - Session and GitHub authorization health warnings
>
> SolveBase sends solution source code directly from the extension to GitHub. It does not send source code to its own backend or use it for advertising, analytics, profiling, or model training.
>
> If the selected repository does not exist, SolveBase creates it as a public repository only after you explicitly confirm that its committed solution files will be publicly visible.
>
> Version 1.0.0 supports standard LeetCode problem pages. LeetCode contest and Explore editors are not supported.

## Single Purpose

> SolveBase archives a user's own accepted competitive-programming solutions to their own GitHub repository automatically when the solution is accepted.

## Permission Justifications

### `storage`

Stores the user's selected repository, platform usernames, enabled-platform preferences, GitHub OAuth token, synchronization index, pending-submission retry state, and connection-health state locally in trusted Chrome extension storage. Settings remain until reset or uninstall, deduplication entries expire after thirty days, page witnesses expire after fifteen minutes, Codeforces final-verdict records expire after seven days, and accepted-solution retry records expire after twenty-four hours.

### `cookies`

Reads only LeetCode's named `csrftoken` cookie. LeetCode requires that value as a CSRF request header when the extension requests the signed-in user's own accepted submissions. SolveBase does not enumerate cookies, read unrelated cookie values, or send cookie data to GitHub or the SolveBase OAuth service.

### `scripting`

Runs narrowly scoped packaged functions on supported coding-platform problem tabs to capture the source code the user submitted or retrieve that accepted submission from the site's authenticated endpoint. It does not inject downloaded or remotely hosted code.

### `identity`

Uses `chrome.identity.launchWebAuthFlow` and the Chrome extension redirect URL to connect the user's GitHub account securely through OAuth.

### `alarms`

Schedules an hourly GitHub authorization-health check so synchronization does not silently stop after GitHub access is revoked or expires.

### `notifications`

Displays a reconnect notification when GitHub authorization is no longer valid. Notifications are rate-limited to avoid repeated alerts.

### Host access

- `codeforces.com`, `leetcode.com`, `cses.fi`, `codechef.com`, and `geeksforgeeks.org`: detect accepted submissions and read the user's solution source and problem metadata.
- `api.github.com`: verify the connected account and create or update files in the repository selected by the user.
- `solvebase.dev`: start and complete the short-lived GitHub OAuth exchange.

## Data Disclosure

Declare that the extension handles:

- Authentication information: the GitHub OAuth token and LeetCode's named CSRF cookie.
- Personally identifiable information: GitHub username and coding-platform usernames supplied by the user.
- Website content: accepted solution source code and problem metadata from supported platforms.

The data is used only for the extension's single purpose. It is not sold, used for advertising, used for credit decisions, or transferred for unrelated purposes. Solution source code is sent directly to GitHub and not to the SolveBase OAuth backend.

New repositories are public and are created only after the setup screen explicitly confirms that committed solution files will be publicly visible. SolveBase requests GitHub's `public_repo` OAuth scope only and does not request access to private repositories.
