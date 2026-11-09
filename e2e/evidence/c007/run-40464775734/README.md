# C-007 Scaling actual Chromium evidence — latest validated HEAD

Source: https://github.com/JIDAIN/numera/actions/runs/40464775734 (job 122057445407). PR source HEAD `341834512ae136e4fca81130243c3224e3212988`; GitHub PR checkout merge SHA `4571d7cb3eb5c3a1cd2669730b2523bf05fdc5d3`. Linux; Node v22.23.3; Playwright 1.56.1; Chromium headless shell 141.0.7390.37 build1194. Seed 0. PC 1440×900, Pad 768×1024, Mobile 390×844 are CSS viewports only, **not physical devices**. CI: 81 Vitest files / 422 tests, 18 real Chromium Playwright tests.

20 original PNGs are stored as raw binary: entry/invalid/zero/results/retry/rough on all 3 viewports and 2 additional PC captures for result correction and A×r second-order. 15 binaries identical to prior run are reused by content-addressed Git blob; 5 newer PNG blobs have separate identities. The latest original PC Scaling Playwright trace ZIP is losslessly stored as 11 ordered raw binary parts, **not individual ZIPs**.

To reassemble after Git checkout:

```sh
cd e2e/evidence/c007/run-40464775734
cat pc-scaling-trace.part-* > pc-scaling-trace.zip
printf 'b2edbab6df5a8257edc455d0d71278f6e21529b200dba182355d6c6ad761df8d  pc-scaling-trace.zip\n' | sha256sum -c -
# Independently verify all PNG SHA256 and byte counts against manifest.json.
```

Original trace: 3,126,073 bytes; screenshot collection: 3,646,068 bytes. Manifest records original CI-reported SHA256/bytes plus saved Git blob SHA. Git object identity and original CI metadata were cross-checked; independent image pixel review and after-checkout trace SHA256 are D acceptance work. This archive branch is intentionally separate from candidate PR#22, unmerged and undeployed.
