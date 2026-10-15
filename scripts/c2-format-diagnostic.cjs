const fs = require("node:fs");
const prettier = require("prettier");

const files = [
  "src/components/C2PilotTraining.module.css",
  "src/components/C2PilotTraining.test.tsx",
  "src/components/C2PilotTraining.tsx",
  "src/lib/c2/launch-policy.test.ts",
  "src/lib/c2/pilot-session.test.ts",
  "src/lib/c2/pilot-session.ts",
  "src/lib/c2/runtime.test.ts",
  "src/lib/c2/runtime.ts",
];

(async () => {
  for (const path of files) {
    const original = fs.readFileSync(path, "utf8");
    const options = (await prettier.resolveConfig(path)) || {};
    const formatted = await prettier.format(original, { ...options, filepath: path });
    console.log("C2_FMT_RESULT " + JSON.stringify({ path, formatted }));
  }
  // Diagnostic run must fail instead of pretending format/types/tests passed.
  process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
