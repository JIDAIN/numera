import { readFileSync } from "node:fs";
import prettier from "prettier";
import { it } from "vitest";

// prettier-ignore
it("C005 temporary exact evidence reporter formatter diagnostic", async () => {
  const path = "e2e/evidence-reporter.ts";
  const input = readFileSync(path, "utf8").replace(/^\/\/ prettier-ignore\n/gm, "");
  const formatted = await prettier.format(input, {
    ...(await prettier.resolveConfig(path)),
    filepath: path,
  });
  console.log("C005_REPORTER_FMT:" + Buffer.from(formatted).toString("base64"));
}, 120000);
