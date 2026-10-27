# C-007 Scaling actual Chromium evidence (unmerged branch)

Source: [GitHub Actions PR run #40442367425](https://github.com/JIDAIN/numera/actions/runs/40442367425), job 121985453897. The PR source HEAD is `0565cb7ce51a9e3c3ac3c24eb1763c8506fff236`; GitHub pull-request CI checked out merge SHA `d7f159f6d3de9b69715572997b126680762f3022`. Original runner: Linux, Node v22.23.3, Playwright 1.56.1, Chromium headless shell 141.0.7390.37 build1194, deterministic browser seed 0. CSS viewports PC1440×900, pad768×1024, mobile390×844 (**not physical devices**).

18 original .png byte blobs (entry, invalid, zero, results, retry, rough for each viewport) are stored as named raw PNG files. Original PC Scaling Playwright trace ZIP exceeds the single-upload connector body size and is losslessly saved as 12 ordered raw binary parts; **these are NOT standalone ZIPs**. Reassemble from a git checkout:

```sh
cd e2e/evidence/c007/run-40442367425
cat pc-scaling-trace.part-* > pc-scaling-trace.zip
printf '7da6f871b7a0869eb82fa96983b0334415b75d9aed4a983599f886b4d610d1bd  pc-scaling-trace.zip\n' | sha256sum -c -
# Then compare each PNG SHA256 to manifest.json
```

Original full-trace size: 3,277,021 bytes. Original screenshot bytes sum: 3,228,285. `manifest.json` supplies each original file's SHA256, byte count and resulting Git blob SHA. The SHA256 values come from the CI byte reporter; Git object SHA and reassembled SHA256 are independent follow-up integrity layers. No claim of screenshot pixel-level independent D acceptance, physical keyboard, or Production verification. Evidence branch is intentionally **not** part of PR#22 and must not be merged as part of C-007.
