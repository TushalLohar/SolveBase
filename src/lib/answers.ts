export type FaqItem = { id: string; question: string; answer: string };

export const HOME_FAQS: FaqItem[] = [
  {
    id: "codeforces-github-by-rating",
    question: "How to automatically sync Codeforces solutions to GitHub by rating (1500, 1600)?",
    answer:
      "Install SolveBase, enable Codeforces, enter your handle, and connect a public GitHub repository. Newly accepted solutions are saved under codeforces/<problem-rating>/, such as codeforces/1500/ or codeforces/1600/ when the problem has that rating. These folders use the problem's rating, not your account rating. SolveBase waits for the final accepted verdict after system testing; passing pretests alone does not trigger a commit.",
  },
  {
    id: "leetcode-github-by-topic",
    question:
      "Which extension pushes LeetCode solutions to GitHub topic-wise (Array, DP, Binary Search)?",
    answer:
      "SolveBase saves newly accepted solutions from standard LeetCode problem pages to a public GitHub repository, organized under topic folders such as leetcode/array/, leetcode/dynamic-programming/, and leetcode/binary-search/. It selects one primary topic for each problem and updates the repository README with solution counts. LeetCode contest and Explore editors are not supported in version 1.0.0.",
  },
  {
    id: "leethub-alternative-multiple-platforms",
    question:
      "What is the best LeetHub alternative that supports Codeforces, CodeChef, GfG, and CSES?",
    answer:
      "SolveBase is an option for a public GitHub archive spanning LeetCode, Codeforces, CodeChef, GeeksforGeeks, and CSES. It organizes LeetCode by topic, Codeforces and CodeChef by problem rating, GeeksforGeeks by difficulty, and CSES by section. The best choice depends on your supported platforms, repository visibility, and export needs: SolveBase does not support private repositories or bulk imports of past platform submissions.",
  },
  {
    id: "what-is-solvebase",
    question: "What does SolveBase do?",
    answer:
      "SolveBase is a free Chrome extension that detects newly accepted coding submissions and saves the source code to a public GitHub repository using platform-specific folders. It also updates the repository README with solution counts.",
  },
  {
    id: "supported-platforms",
    question: "Which coding platforms does SolveBase support?",
    answer:
      "SolveBase supports Codeforces, standard LeetCode problem pages, CSES, CodeChef, and GeeksforGeeks. LeetCode contest and Explore editors are not supported in version 1.0.0.",
  },
  {
    id: "codeforces-sync",
    question: "Can I save Codeforces solutions to GitHub automatically?",
    answer:
      "Yes. SolveBase watches Codeforces verdicts, waits for the final accepted result, and commits the solution to a GitHub rating folder.",
  },
  {
    id: "leetcode-sync",
    question: "Can I save LeetCode solutions to GitHub automatically?",
    answer:
      "Yes. On standard LeetCode problem pages, SolveBase detects an accepted submission and saves the solution under an organized LeetCode topic folder in GitHub.",
  },
  {
    id: "other-platforms",
    question: "Does SolveBase support CodeChef, CSES, and GeeksforGeeks?",
    answer:
      "Yes. SolveBase supports accepted submissions from CodeChef, CSES, and GeeksforGeeks practice pages alongside Codeforces and standard LeetCode problems.",
  },
  {
    id: "source-code-privacy",
    question: "Does SolveBase upload source code to its own server?",
    answer:
      "No. The extension sends repository updates directly to GitHub. The SolveBase OAuth service handles only the short-lived GitHub authorization exchange.",
  },
  {
    id: "existing-repository",
    question: "Can SolveBase use an existing GitHub repository?",
    answer:
      "Yes. SolveBase can connect a compatible existing public solutions repository, index recognized solution files, and preserve content outside its managed README summary block. Private repositories and unrelated non-empty repositories are not supported.",
  },
  {
    id: "submission-history",
    question: "Does SolveBase import every old solved problem automatically?",
    answer:
      "No. SolveBase focuses on live accepted submissions. Existing compatible files are indexed when you connect a repository, but old platform submissions are not scraped in bulk.",
  },
  {
    id: "automatic-github-sync",
    question: "How do I save coding solutions to GitHub automatically?",
    answer:
      "Install SolveBase from the Chrome Web Store, choose a public repository name and your coding platforms, then connect GitHub. Stay signed in to a supported coding platform and submit a solution with the extension active. SolveBase saves newly accepted solutions directly to GitHub.",
  },
  {
    id: "pricing-and-browsers",
    question: "Is SolveBase free and which browsers support it?",
    answer:
      "SolveBase is free to install and works in Chromium-based browsers such as Chrome, Edge, Brave, and Arc. The extension uses Manifest V3 and does not require a SolveBase account.",
  },
  {
    id: "interview-preparation",
    question: "Does SolveBase work for interview preparation?",
    answer:
      "Yes. It creates a searchable GitHub archive of accepted practice problems, making it easier to review patterns, show consistent practice, and keep a public coding portfolio up to date.",
  },
];

export const SETUP_FAQS: FaqItem[] = [
  {
    id: "public-solutions",
    question: "Why does SolveBase ask me to confirm that my solutions will be public?",
    answer:
      "SolveBase supports public GitHub repositories only. Anyone can read solutions committed to a public repository. The setup confirmation makes this visibility explicit before GitHub is connected; private repositories are not supported.",
  },
  {
    id: "github-permissions",
    question: "What GitHub permissions does SolveBase request?",
    answer:
      "SolveBase uses GitHub OAuth with the public_repo scope to create and update public repositories. This permission applies to public repositories on your account, although SolveBase uses the repository you select. You do not need to create or paste a personal access token. You can revoke access in GitHub Settings under Applications.",
  },
  {
    id: "missing-solution",
    question: "Why has my accepted solution not appeared in GitHub?",
    answer:
      "Check that SolveBase is enabled, the platform is selected, your requested username is correct, and you are signed in to the coding platform. Confirm that you submitted on a supported page and that GitHub is connected in the extension popup. Codeforces pretests are not a final accepted verdict. Accepted solutions that fail to reach GitHub can be retried locally for up to 24 hours; reconnect GitHub if the extension requests it.",
  },
  {
    id: "reconnect-github",
    question: "What happens if I reconnect GitHub or change repositories?",
    answer:
      "Reconnecting the same GitHub account and repository preserves pending submissions. Changing the GitHub account or repository clears the old work queue. Files already committed to GitHub remain in the original repository.",
  },
  {
    id: "repeat-solutions",
    question: "What happens when I solve the same problem again?",
    answer:
      "SolveBase updates the existing solution file instead of counting the problem twice. Recognized files from an existing solutions repository keep their folder and filename stem; if the solution language changes, the file extension changes to match.",
  },
  {
    id: "readme-preservation",
    question: "Will SolveBase overwrite my existing README?",
    answer:
      "SolveBase updates its marked summary block and preserves README content outside that block. When you connect a compatible public solutions repository, it rebuilds its local index from recognized platform folders and solution filenames. Unrecognized scratch files are ignored, and unrelated non-empty repositories are rejected.",
  },
];

export const LEETCODE_FAQS: FaqItem[] = [
  {
    id: "leetcode-supported-pages",
    question: "Can SolveBase save LeetCode solutions to GitHub?",
    answer:
      "Yes. SolveBase watches standard leetcode.com/problems/ pages and sends newly accepted solutions directly to the public GitHub repository you select while the extension is active.",
  },
  {
    id: "leetcode-folders",
    question: "How are LeetCode files organized?",
    answer:
      "Solutions are grouped under a leetcode folder and organized by topic, with problem names and README counts kept consistent as new solutions arrive.",
  },
  {
    id: "leetcode-contests",
    question: "Does SolveBase support LeetCode contests?",
    answer:
      "Version 1.0.0 supports standard LeetCode problem pages. LeetCode contest and Explore editors are not currently supported.",
  },
  {
    id: "leetcode-history",
    question: "Can I bulk-export my previous LeetCode submissions with SolveBase?",
    answer:
      "No. SolveBase captures newly accepted submissions while the extension is active. It can index recognized solution files already in a compatible public GitHub repository, but it does not download your previous LeetCode submission history.",
  },
];

export const CODEFORCES_FAQS: FaqItem[] = [
  {
    id: "codeforces-pretests",
    question: "Does SolveBase save Codeforces solutions after pretests pass?",
    answer:
      "No. Passing pretests is not a final accepted verdict. SolveBase waits for system testing and commits the solution only after the final accepted result. It can track pending Codeforces verdicts for up to seven days, including after leaving the tab or restarting Chrome.",
  },
  {
    id: "codeforces-folders",
    question: "How are Codeforces solutions organized in GitHub?",
    answer:
      "SolveBase groups solutions under the codeforces folder by problem rating. Solution filenames identify the problem, and the repository README summary updates as accepted solutions are saved.",
  },
  {
    id: "existing-codeforces-repository",
    question: "Can SolveBase connect my existing Codeforces solutions repository?",
    answer:
      "Yes, if it is a compatible public solutions repository. SolveBase recognizes platform folders and conventional solution filenames, including older Codeforces layouts with rating folders at the repository root. Existing recognized files keep their folder and filename stem.",
  },
  {
    id: "codeforces-history",
    question: "Can SolveBase import all of my past Codeforces submissions?",
    answer:
      "No. SolveBase detects new submissions while the extension is active. Connecting an existing repository indexes recognized files already in GitHub; it does not bulk-download your Codeforces submission history.",
  },
];

export const ADDITIONAL_PLATFORM_FAQS: FaqItem[] = [
  {
    id: "cses-sync",
    question: "How do I save CSES solutions to GitHub automatically?",
    answer:
      "Install SolveBase, enable CSES, choose a public GitHub repository, and connect GitHub. Stay signed in to CSES and submit on its problem set task pages with the extension active. SolveBase saves newly accepted solutions under the cses folder, grouped by problem set section, and updates the repository README summary.",
  },
  {
    id: "codechef-sync",
    question: "How do I save CodeChef solutions to GitHub automatically?",
    answer:
      "Install SolveBase, enable CodeChef, enter the requested username, and connect a public GitHub repository. Submit on a supported CodeChef problem or submission page while signed in and with the extension active. SolveBase saves newly accepted solutions under the codechef folder by problem rating; problems without an available rating use an Unrated folder.",
  },
  {
    id: "geeksforgeeks-sync",
    question: "How do I save GeeksforGeeks solutions to GitHub automatically?",
    answer:
      "Install SolveBase, enable GeeksforGeeks, enter the requested username, and connect a public GitHub repository. Submit a practice problem while signed in and with the extension active. SolveBase saves newly accepted solutions under the geeksforgeeks folder, grouped by problem difficulty, and updates the repository README summary.",
  },
];

export const ACCESS_FAQS: FaqItem[] = [
  {
    id: "github-password-and-token",
    question: "Do I need to give SolveBase my GitHub password or a personal access token?",
    answer:
      "No. SolveBase connects through GitHub OAuth: select Connect GitHub in the extension and authorize it on GitHub. You do not enter your GitHub password into SolveBase or create and paste a personal access token. The authorization token is stored in trusted Chrome extension storage on your device.",
  },
  {
    id: "private-repositories",
    question: "Does SolveBase support private GitHub repositories?",
    answer:
      "No. SolveBase 1.0.0 supports public GitHub repositories only and requests GitHub's public_repo OAuth scope. You must confirm that your repository and saved solutions will be publicly visible before connecting GitHub.",
  },
  {
    id: "disconnect-and-revoke",
    question: "How do I disconnect SolveBase and revoke its GitHub access?",
    answer:
      "Disconnect GitHub in SolveBase to remove the authorization token from the extension. To revoke the OAuth grant, open GitHub Settings, choose Applications, and revoke SolveBase under Authorized OAuth Apps. Resetting or uninstalling SolveBase removes its local settings and connection data. Solutions already committed to GitHub remain in your repository until you delete them there.",
  },
];

export const FAQ_GROUPS = [
  { id: "overview", title: "About SolveBase", items: HOME_FAQS },
  { id: "leetcode", title: "LeetCode", items: LEETCODE_FAQS },
  { id: "codeforces", title: "Codeforces", items: CODEFORCES_FAQS },
  {
    id: "more-platforms",
    title: "CSES, CodeChef, and GeeksforGeeks",
    items: ADDITIONAL_PLATFORM_FAQS,
  },
  { id: "setup", title: "Setup and troubleshooting", items: SETUP_FAQS },
  { id: "access", title: "GitHub access and public solutions", items: ACCESS_FAQS },
];

export const SETUP_STEPS = [
  {
    title: "Install and open SolveBase",
    body: "Install SolveBase from the Chrome Web Store, then open its popup from your browser's extensions menu. Use Chrome 112 or later, or a compatible Chromium-based browser.",
  },
  {
    title: "Choose your repository and platforms",
    body: "Enter a repository name, enable the platforms you use, and fill in the requested usernames. Confirm that the repository and committed solutions will be public.",
  },
  {
    title: "Connect GitHub",
    body: "Select Connect GitHub and authorize SolveBase. It creates a public repository if the name is available, or connects a compatible existing public solutions repository. No personal access token or separate SolveBase account is required.",
  },
  {
    title: "Submit a solution and check GitHub",
    body: "Stay signed in to your coding platform and submit a solution on a supported page while the extension is active. After the final accepted verdict, check your repository for the solution file and updated README summary. Codeforces pretests must finish system testing first.",
  },
];
