export const SITE_URL = "https://solvebase.dev";

export function seoHead({
  title,
  description,
  path,
  schemas = [],
}: {
  title: string;
  description: string;
  path: string;
  schemas?: Record<string, unknown>[];
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
    scripts: schemas.length
      ? [
          {
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": schemas,
            }).replace(/</g, "\\u003c"),
          },
        ]
      : [],
  };
}

export function breadcrumbSchema(name: string, path: string) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "SolveBase", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name, item: new URL(path, SITE_URL).href },
    ],
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}
