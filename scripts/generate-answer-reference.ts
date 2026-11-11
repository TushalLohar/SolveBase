import { readFileSync, writeFileSync } from "node:fs";
import { renderAnswerReference } from "../src/lib/answer-reference.ts";
import { renderProductGuide } from "../src/lib/product-evidence.ts";
import {
  COMPARISON_NOTE,
  COMPARISON_ROWS,
  OAUTH_TIMING_NOTE,
  renderComparisonGuide,
  renderComparisonTable,
} from "../src/lib/comparison.ts";

writeFileSync(new URL("../public/llms-full.txt", import.meta.url), renderAnswerReference());
writeFileSync(new URL("../public/how-it-works.md", import.meta.url), `${renderProductGuide()}\n`);
writeFileSync(new URL("../public/compare.md", import.meta.url), `${renderComparisonGuide()}\n`);
const readmePath = new URL("../README.md", import.meta.url);
const readme = readFileSync(readmePath, "utf8");
const comparisonBlock = [
  "<!-- solvebase-comparison -->",
  "## Compare GitHub sync extensions",
  renderComparisonTable(),
  COMPARISON_NOTE,
  OAUTH_TIMING_NOTE,
  ...COMPARISON_ROWS.map(
    (row) =>
      `Sources for ${row.name}: ${row.sources.map((source) => `[${source.label}](${source.url})`).join(" · ")}`,
  ),
  "[Read the full comparison and directory examples](https://solvebase.dev/compare).",
  "<!-- /solvebase-comparison -->",
].join("\n\n");
const comparisonPattern = /<!-- solvebase-comparison -->[\s\S]*?<!-- \/solvebase-comparison -->/;
const nextReadme = comparisonPattern.test(readme)
  ? readme.replace(comparisonPattern, () => comparisonBlock)
  : readme.replace("## Get started", `${comparisonBlock}\n\n## Get started`);
writeFileSync(readmePath, nextReadme);
process.stdout.write(
  "Updated the full text reference and product guide from shared documentation.\n",
);
