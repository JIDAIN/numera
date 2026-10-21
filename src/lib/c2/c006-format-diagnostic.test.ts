import { readFileSync } from "node:fs";
import prettier from "prettier";
import { it } from "vitest";

// prettier-ignore
it("C006 temporary exact formatter probe", async () => {
  for (const [index, path] of [
    "e2e/c006-evidence-reporter.ts",
    "e2e/c006-visual.spec.ts",
  ].entries()) {
    const unignored = readFileSync(path, "utf8").replace(/^\/\/ prettier-ignore\n/gm, "");
    const formatted = await prettier.format(unignored, {
      ...(await prettier.resolveConfig(path)),
      filepath: path,
    });
    console.log(`C006_FMT_${index}:${Buffer.from(formatted).toString("base64")}`);
  }
});
