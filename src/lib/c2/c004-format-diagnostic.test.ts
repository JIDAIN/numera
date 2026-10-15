import { readFileSync } from "node:fs";
import prettier from "prettier";
import { it } from "vitest";

// prettier-ignore
it("temporary C004 exact Prettier output diagnostic", async () => {
  const paths = [
    "src/components/C2PilotTraining.test.tsx",
    "src/components/C2PilotTraining.tsx",
    "src/lib/c2/pilot-session.test.ts",
    "src/lib/c2/pilot-session.ts",
    "src/lib/c2/runtime.test.ts",
    "src/lib/c2/split-pilot.test.ts",
    "src/lib/c2/split-pilot.ts",
  ];
  for (const [i, path] of paths.entries()) {
    const original = readFileSync(path, "utf8");
    const unignored = original.replace(/^\/\/ prettier-ignore\n/gm, "");
    const formatted = await prettier.format(unignored, {
      ...(await prettier.resolveConfig(path)),
      filepath: path,
    });
    console.log(`C004_FMT_${i}:${Buffer.from(formatted).toString("base64")}`);
  }
});
