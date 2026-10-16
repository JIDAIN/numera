import { execFileSync, spawnSync } from "node:child_process";

function run(command, args) {
  console.log("C005_PREPARE:" + command + " " + args.join(" "));
  execFileSync(command, args, { stdio: "inherit", timeout: 180000 });
}

// Hosted Ubuntu Chromium has historically rendered Chinese labels as tofu.
// Install CJK fonts only on disposable Linux CI runners, never modify a
// developer's OS and never bundle/distribute font binaries in this repo.
if (process.platform === "linux" && process.env.CI) {
  const fonts = spawnSync("fc-list", [":lang=zh", "family"], {
    encoding: "utf8",
  });
  if (!fonts.stdout?.trim()) {
    console.log("C005_PREPARE:zh fonts absent; installing runner OS package");
    run("sudo", ["apt-get", "update", "-qq"]);
    run("sudo", [
      "apt-get",
      "install",
      "-y",
      "--no-install-recommends",
      "fonts-noto-cjk",
    ]);
  }
  const verified = spawnSync("fc-list", [":lang=zh", "family"], {
    encoding: "utf8",
  });
  if (!verified.stdout?.trim())
    throw new Error("C005: no CJK font available after runner preparation.");
  console.log("C005_CJK_FONT:" + verified.stdout.trim().split("\n")[0]);
}

run(process.platform === "win32" ? "npx.cmd" : "npx", [
  "--no-install",
  "playwright",
  "install",
  "chromium",
]);
