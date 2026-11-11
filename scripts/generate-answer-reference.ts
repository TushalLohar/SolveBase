import { writeFileSync } from "node:fs";
import { renderAnswerReference } from "../src/lib/answer-reference.ts";

writeFileSync(new URL("../public/llms-full.txt", import.meta.url), renderAnswerReference());
process.stdout.write("Updated public/llms-full.txt from the product documentation.\n");
