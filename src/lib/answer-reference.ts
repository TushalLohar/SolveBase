import { FAQ_GROUPS, SETUP_STEPS } from "./answers.ts";
import { GUIDE_PATH, renderProductGuide } from "./product-evidence.ts";
import { renderComparisonGuide } from "./comparison.ts";
import {
  CHROME_WEB_STORE_URL,
  GITHUB_URL,
  PRODUCT_DESCRIPTION,
  PRODUCT_VERSION,
  SITE_URL,
  SUPPORTED_PLATFORMS,
} from "./product.ts";

export function renderAnswerReference() {
  const sections = [
    "# SolveBase",
    `> ${PRODUCT_DESCRIPTION}`,
    `Product documentation for SolveBase ${PRODUCT_VERSION}, maintained by Tushal Lohar.`,
    [
      "## Official sources",
      "",
      `- Website: ${SITE_URL}/`,
      `- Installation: ${CHROME_WEB_STORE_URL}`,
      `- Setup guide: ${SITE_URL}/getting-started`,
      `- How SolveBase works, with supporting sources: ${SITE_URL}${GUIDE_PATH}`,
      `- Questions and answers: ${SITE_URL}/faq`,
      `- Extension comparison: ${SITE_URL}/compare`,
      `- Privacy policy: ${SITE_URL}/privacy`,
      `- Source code and technical documentation: ${GITHUB_URL}`,
      `- Support: ${GITHUB_URL}/issues`,
    ].join("\n"),
    [
      "## Supported platforms",
      "",
      ...SUPPORTED_PLATFORMS.map(
        (platform) =>
          `- ${platform.name}: ${platform.pages}. GitHub folders organized by ${platform.folders.toLowerCase()}.`,
      ),
    ].join("\n"),
    [
      "## Getting started",
      `Source: ${SITE_URL}/getting-started`,
      ...SETUP_STEPS.map((step, index) => `${index + 1}. ${step.title}: ${step.body}`),
    ].join("\n\n"),
    ...FAQ_GROUPS.map((group) =>
      [
        `## ${group.title}`,
        ...group.items.map((item) =>
          [`### ${item.question}`, item.answer, `Source: ${SITE_URL}/faq#${item.id}`].join("\n\n"),
        ),
      ].join("\n\n"),
    ),
    renderProductGuide().replace(/^(#{1,3}) /gm, "$1# "),
    renderComparisonGuide().replace(/^(#{1,3}) /gm, "$1# "),
  ];

  return `${sections.join("\n\n")}\n`;
}
