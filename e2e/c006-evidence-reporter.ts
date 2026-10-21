import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type {
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";

const evidenceDir = join(process.cwd(), "test-results", "c006-evidence");

// prettier-ignore
function candidateHead() {
  try {
    if (!process.env.GITHUB_EVENT_PATH) return undefined;
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
    return event.pull_request?.head?.sha as string | undefined;
  } catch {
    return undefined;
  }
}

type TraceFile = { name: string; path: string };

// prettier-ignore
export default class C006EvidenceReporter implements Reporter {
  private traces: TraceFile[] = [];

  onTestEnd(test: TestCase, result: TestResult) {
    const name = test.title.includes("split:")
      ? "pc-split"
      : test.title.includes("direct:")
        ? "pc-direct"
        : null;
    if (!name || this.traces.some((item) => item.name === name)) return;
    const trace = result.attachments.find(
      (item) =>
        item.path &&
        item.name === "trace" &&
        existsSync(item.path),
    );
    if (trace?.path)
      this.traces.push({ name, path: trace.path });
  }

  onEnd(result: FullResult) {
    console.log(
      "C006_BROWSER_EXECUTION:" +
        JSON.stringify({
          runId: process.env.GITHUB_RUN_ID ?? "local",
          head: candidateHead() ?? process.env.GITHUB_SHA ?? "local",
          checkoutSha: process.env.GITHUB_SHA ?? "local",
          status: result.status,
          os: process.platform,
          node: process.version,
          playwright: "1.56.1",
          seed: 0,
          browserKind: "Linux Chromium, CSS viewport emulation only",
        }),
    );

    if (!process.env.CI) return;
    const files: TraceFile[] = existsSync(evidenceDir)
      ? readdirSync(evidenceDir)
          .filter((file) => file.endsWith(".png"))
          .sort()
          .map((file) => ({
            name: file,
            path: join(evidenceDir, file),
          }))
      : [];
    for (const trace of this.traces)
      files.push({
        name: `${trace.name}-trace.zip`,
        path: trace.path,
      });
    console.log(
      "C006_EVIDENCE_INDEX:" +
        JSON.stringify(files.map((item) => item.name)),
    );
    for (const item of files) {
      const bytes = readFileSync(item.path);
      const sha = createHash("sha256").update(bytes).digest("hex");
      console.log(
        "C006_EVIDENCE_META:" +
          JSON.stringify({
            name: item.name,
            sha256: sha,
            bytes: bytes.length,
          }),
      );
      if (bytes.length > 4_500_000) {
        console.log("C006_TOO_LARGE:" + item.name);
        continue;
      }
      const base64 = bytes.toString("base64");
      if (item.name.endsWith(".zip")) {
        const chunkSize = 48_000;
        const total = Math.ceil(base64.length / chunkSize);
        console.log(
          "C006_TRACE_INDEX:" +
            JSON.stringify({ name: item.name, sha256: sha, total }),
        );
        for (let i = 0; i < total; i += 1)
          console.log(
            `C006_TRACE_CHUNK:${item.name}:${i}:${base64.slice(i * chunkSize, (i + 1) * chunkSize)}`,
          );
      } else {
        console.log(`C006_PNG:${item.name}:${sha}:${base64}`);
      }
    }
  }
}
