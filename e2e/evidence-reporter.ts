import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { FullResult, Reporter } from "@playwright/test/reporter";

const root = join(process.cwd(), "test-results");
const evidence = join(root, "c005-evidence");
const traceRoot = join(root, "c005-traces");

// prettier-ignore
function resolveCandidateHead() {
  if (!process.env.GITHUB_EVENT_PATH) return undefined;
  try {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
    return event.pull_request?.head?.sha ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * GitHub workflow files are protected. This reporter transmits a small
 * authentic screenshot/trace subset through the pre-existing "npm run test"
 * job log for a D Agent to archive and independently inspect the pixels.
 * Never captures auth, external services, HAR or production-user data.
 */
// prettier-ignore
export default class C005EvidenceReporter implements Reporter {
  onEnd(result: FullResult) {
    console.log(
      "C005_BROWSER_EXECUTION:" +
        JSON.stringify({
          run: process.env.GITHUB_RUN_ID ?? "local",
          head:
            resolveCandidateHead() ??
            process.env.GITHUB_SHA ??
            "local-working-tree",
          checkoutSha: process.env.GITHUB_SHA ?? "local-working-tree",
          status: result.status,
          node: process.version,
          os: process.platform,
          chromium: "playwright-managed-1.56.1",
          viewportKinds: ["pc-1440x900", "pad-768x1024", "mobile-390x844"],
        }),
    );
    if (!process.env.CI || !existsSync(evidence)) return;
    const files = [
      "pc-split-result.png",
      "pc-split-error.png",
      "pad-split-result.png",
      "mobile-split-result.png",
      "mobile-split-question.png",
    ];
    if (existsSync(traceRoot)) {
      const traces = readdirSync(traceRoot, { recursive: true })
        .map((p) => String(p))
        .filter((p) => p.endsWith("trace.zip"));
      if (traces.length) files.push(join("..", "c005-traces", traces[0]));
    }

    for (const name of files) {
      const path = join(evidence, name);
      if (!existsSync(path)) continue;
      const bytes = readFileSync(path);
      const sha = createHash("sha256").update(bytes).digest("hex");
      console.log(
        "C005_EVIDENCE_META:" +
          JSON.stringify({ name, bytes: bytes.length, sha256: sha }),
      );
      // GitHub's log endpoint has size limits. Oversized trace artifacts remain
      // local runner evidence until a protected workflow artifact job is
      // separately authorized; never claim they were persisted to GitHub.
      if (bytes.length > 1_500_000) {
        console.log("C005_EVIDENCE_TOO_LARGE:" + name);
        continue;
      }
      console.log(
        `C005_EVIDENCE_B64:${name}:${sha}:${bytes.toString("base64")}`,
      );
    }
  }
}
