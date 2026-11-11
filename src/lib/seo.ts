import {
  CHROME_WEB_STORE_URL,
  GITHUB_URL,
  PRODUCT_DESCRIPTION,
  PRODUCT_VERSION,
  SITE_URL,
  SUPPORTED_PLATFORMS,
} from "./product";
import type { FaqItem } from "./answers";

const entitySchemas = [
  {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "SolveBase",
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/solvebase-brand.png`,
    sameAs: [GITHUB_URL, CHROME_WEB_STORE_URL],
    founder: { "@id": `${SITE_URL}/#author` },
  },
  {
    "@type": "Person",
    "@id": `${SITE_URL}/#author`,
    name: "Tushal Lohar",
    url: "https://github.com/TushalLohar",
  },
  {
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#software`,
    name: "SolveBase",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Windows, macOS, Linux",
    softwareRequirements: "Google Chrome 112 or later, or a compatible Chromium-based browser",
    description: PRODUCT_DESCRIPTION,
    softwareVersion: PRODUCT_VERSION,
    isAccessibleForFree: true,
    featureList: [
      "Save newly accepted coding solutions to a public GitHub repository",
      "Update the repository README with solution counts",
      ...SUPPORTED_PLATFORMS.map((platform) => `${platform.name}: ${platform.folders}`),
    ],
    url: `${SITE_URL}/`,
    downloadUrl: CHROME_WEB_STORE_URL,
    sameAs: [GITHUB_URL, CHROME_WEB_STORE_URL],
    author: { "@id": `${SITE_URL}/#author` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    softwareHelp: { "@type": "WebPage", "@id": `${SITE_URL}/getting-started#webpage` },
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD", url: CHROME_WEB_STORE_URL },
  },
  {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "SolveBase",
    url: `${SITE_URL}/`,
    inLanguage: "en",
    publisher: { "@id": `${SITE_URL}/#organization` },
  },
];

export function seoHead({
  title,
  description,
  path,
  schemas = [],
  faqs = [],
}: {
  title: string;
  description: string;
  path: string;
  schemas?: Record<string, unknown>[];
  faqs?: FaqItem[];
}) {
  const url = new URL(path, SITE_URL).href;
  const image = `${SITE_URL}/og-image.png`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:site_name", content: "SolveBase" },
      { property: "og:locale", content: "en_US" },
      { property: "og:image", content: image },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "SolveBase saves accepted coding solutions to GitHub" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
      { name: "twitter:image:alt", content: "SolveBase saves accepted coding solutions to GitHub" },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            ...entitySchemas,
            {
              "@type": faqs.length ? ["WebPage", "FAQPage"] : "WebPage",
              "@id": `${url}#webpage`,
              url,
              name: title,
              description,
              inLanguage: "en",
              isPartOf: { "@id": `${SITE_URL}/#website` },
              about: { "@id": `${SITE_URL}/#software` },
              publisher: { "@id": `${SITE_URL}/#organization` },
              ...(faqs.length ? { mainEntity: faqQuestions(faqs, url) } : {}),
              ...(schemas.some((schema) => schema["@type"] === "BreadcrumbList")
                ? { breadcrumb: { "@id": `${url}#breadcrumb` } }
                : {}),
            },
            ...schemas,
          ],
        }).replace(/</g, "\\u003c"),
      },
    ],
  };
}

export function breadcrumbSchema(name: string, path: string) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${new URL(path, SITE_URL).href}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "SolveBase", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name, item: new URL(path, SITE_URL).href },
    ],
  };
}

function faqQuestions(items: FaqItem[], url: string) {
  return items.map(({ id, question, answer }) => ({
    "@type": "Question",
    "@id": `${url}#${id}`,
    url: `${url}#${id}`,
    name: question,
    acceptedAnswer: { "@type": "Answer", "@id": `${url}#${id}-answer`, text: answer },
  }));
}
