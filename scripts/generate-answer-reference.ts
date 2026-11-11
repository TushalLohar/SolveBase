import { writeFileSync } from "node:fs";
import { renderAnswerReference } from "../src/lib/answer-reference.ts";
import { renderProductGuide } from "../src/lib/product-evidence.ts";

writeFileSync(new URL("../public/llms-full.txt", import.meta.url), renderAnswerReference());
writeFileSync(new URL("../public/how-it-works.md", import.meta.url), `${renderProductGuide()}\n`);
process.stdout.write(
  "Updated the full text reference and product guide from shared documentation.\n",
);
