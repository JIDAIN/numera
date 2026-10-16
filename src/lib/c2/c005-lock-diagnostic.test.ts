import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { it } from "vitest";

// prettier-ignore
it("C005 temporary locked dependency resolution diagnostic", () => {
  const original = JSON.parse(readFileSync("package-lock.json", "utf8"));
  execFileSync(
    "npm",
    [
      "install",
      "--package-lock-only",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--save-dev",
      "--save-exact",
      "@playwright/test@1.56.1",
    ],
    { encoding: "utf8", timeout: 120000 },
  );
  const updated = JSON.parse(readFileSync("package-lock.json", "utf8"));
  const added = Object.fromEntries(
    Object.entries(updated.packages).filter(
      ([path, value]) =>
        JSON.stringify(original.packages[path]) !== JSON.stringify(value),
    ),
  );
  const delta = {
    devVersion: updated.packages[""].devDependencies["@playwright/test"],
    packages: added,
  };
  console.log("C005_LOCK_DELTA:" + Buffer.from(JSON.stringify(delta)).toString("base64"));
}, 180000);
