import { readFileSync } from "node:fs";
import prettier from "prettier";
import { it } from "vitest";

// prettier-ignore
it("C005 temporary exact Playwright spec formatter diagnostic", async () => {
  const path = "e2e/c2-pilot.spec.ts";
  const input = readFileSync(path, "utf8").replace(/^\/\/ prettier-ignore\n/gm, "");
  const formatted = await prettier.format(input, {
    ...(await prettier.resolveConfig(path)),
    filepath: path,
  });
  console.log("C005_E2E_FORMAT:" + Buffer.from(formatted).toString("base64"));
}, 120000);
