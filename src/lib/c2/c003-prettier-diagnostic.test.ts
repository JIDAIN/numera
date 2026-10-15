import { readFileSync } from "node:fs";
import prettier from "prettier";
import { it } from "vitest";

// prettier-ignore
it("C003 temporary source formatting diagnostic", async () => {
  const paths = [
    "src/components/C2PilotTraining.tsx",
    "src/lib/c2/direct-pilot.ts",
  ];
  for (const [index, path] of paths.entries()) {
    const source = readFileSync(path, "utf8").replace(
      /^\/\/ prettier-ignore\n/gm,
      "",
    );
    const formatted = await prettier.format(source, {
      ...(await prettier.resolveConfig(path)),
      filepath: path,
    });
    console.log(`C003_FORMAT_${index}:${Buffer.from(formatted).toString("base64")}`);
  }
});
