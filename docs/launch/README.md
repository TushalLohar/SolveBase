# GEO implementation and outreach drafts

## Applied to the website and repository

- A shared, source-linked comparison of SolveBase, original LeetHub, the Buddhadeb-ss CP Sync project, and the independent rishijain07 CodeHub extension appears on the homepage, `/compare`, `/compare.md`, and the repository README.
- A standalone 50-word factual product definition appears beneath the homepage heading and at the beginning of the README.
- The three requested conversational questions appear as semantic FAQ headings. All homepage answers match the FAQPage structured data; SoftwareApplication data remains present.
- Sitemap, internal guide links, and crawler text references include the comparison.
- GitHub repository description, homepage, topics, remote URL, and package metadata use SolveBase branding.
- The generated user-repository README includes a single linked SolveBase footer inside its existing managed block. Personal content outside that block is preserved.

The extension source includes the updated title and footer. These changes have **not** been uploaded or submitted to the Chrome Web Store; the published extension and listing remain unchanged. Installed store copies will receive the footer only after a future extension release is shipped and performs a README update.

The source repository has no license file, so copy describes it as having public source code rather than claiming an open-source license. The comparison records documented behavior, with pinned source references reviewed on November 11, 2026; it does not claim live compatibility testing of competitors.

## Drafts only

No Reddit or blog posts, directory PRs, or AlternativeTo submissions were published. Chrome Web Store copy is also a draft. Keep these files as preparation until the creator chooses to carry out outreach.

- [Technical Codeforces post](./codeforces-post.md)
- [Tailored Reddit posts](./reddit-posts.md)
- [Article for Dev.to, Hashnode, and Medium](./article.md)
- [Awesome-list entries and PR descriptions](./awesome-list-submissions.md)
- [AlternativeTo product listing](./alternativeto.md)
- [Chrome Web Store metadata copy](./chrome-web-store.md)
- [Applied GitHub metadata](./github-metadata.json)
- [Applied GitHub topics](./github-topics.json)

For article syndication, publish the article once and use that published article's URL as the canonical source for subsequent copies. The comparison page is a reference link, not an identical article. Follow each community's current promotion rules and retain the creator disclosures.

## Verification

Production build, TypeScript checking, and lint passed. All 11 extension test files passed with sequential test execution; the first parallel run hit the existing background-recovery timing failure, which also passed on its own rerun. Static HTML checks confirmed the four-row comparison, six columns, 50-word summaries, canonical URLs, and agreement between all 14 homepage FAQ headings and their structured answers. Documentation generation is idempotent. README tests cover preservation and a single attribution footer after repeated updates.
