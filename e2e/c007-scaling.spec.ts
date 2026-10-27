import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

async function capture(page: Page, info: TestInfo, name: string) {
  const dir = join(process.cwd(), "test-results", "c006-evidence");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, name);
  await page.screenshot({ path, fullPage: true, animations: "disabled" });
  await info.attach(name, { path, contentType: "image/png" });
}
function parseProblem(prompt: string) {
  const found = prompt.match(/^(\d+)\s*÷\s*(\d+)$/);
  if (!found) throw new Error("Scaling pilot prompt not supported: " + prompt);
  return { a: Number(found[1]), b: Number(found[2]) };
}
async function firstStep(page: Page, rough = false) {
  const question = (
    await page.locator('[aria-label="C2训练作答"] h2').innerText()
  ).trim();
  const { a, b } = parseProblem(question);
  const b0 = rough ? b - 1 : b + 1;
  await page.getByLabel("自选基准 B0").fill(String(b0));
  await page.getByLabel("带符号 Δ = B0 − B").fill(rough ? "-1" : "1");
  if (rough) {
    await page.getByRole("radio", { name: /粗商×Δ/ }).check();
    // Branch reset is deliberate: re-enter the actual user choices.
    await page.getByLabel("自选基准 B0").fill(String(b0));
    await page.getByLabel("带符号 Δ = B0 − B").fill("-1");
    const qrough = Number((a / b).toFixed(1));
    const c1 = -qrough;
    const a1 = a + c1;
    const q1 = a1 / b0;
    await page.getByLabel("自然粗商 q粗").fill(String(qrough));
    await page.getByLabel("一阶带符号修正 C1").fill(String(c1));
    await page.getByLabel("一阶分子 A1").fill(String(a1));
    await page.getByLabel("一阶结果 Q1").fill(String(q1));
    await page.getByLabel("最终实际商").fill(String(q1));
    await expect(page.getByLabel("实际基准商 Q0")).toHaveCount(0);
    await expect(page.getByLabel("实际近似幅度 r（小数）")).toHaveCount(0);
  } else {
    const q0 = a / b0;
    await page.getByLabel("实际基准商 Q0").fill(String(q0));
    await page.getByLabel("最终实际商").fill(String(q0));
    await expect(page.getByLabel("实际近似幅度 r（小数）")).toHaveCount(0);
  }
}
const viewports = [
  { name: "pc", width: 1440, height: 900 },
  { name: "pad", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const;

for (const vp of viewports) {
  test(`scaling: ${vp.name} ${vp.width}x${vp.height} ten real zero-order answers and rough path`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.addInitScript(() => {
      Math.random = () => 0;
    });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/c2-lab");
    await expect(
      page.getByRole("button", { name: /补偿放缩 Scaling.*10题/ }),
    ).toBeVisible();
    await capture(page, info, `scaling-${vp.name}-entry.png`);
    await page.getByRole("button", { name: /补偿放缩 Scaling.*10题/ }).click();
    const invalid = async () => {
      await page.getByLabel("自选基准 B0").fill("0x10");
      await page.getByLabel("带符号 Δ = B0 − B").fill("1");
      await page.getByLabel("实际基准商 Q0").fill("1");
      await page.getByLabel("最终实际商").fill("1");
      await page.getByRole("button", { name: "提交本题" }).click();
      await expect(
        page.locator('[aria-label="C2训练作答"] [role="alert"]'),
      ).toBeVisible();
      await expect(page.getByText("第 1 / 10 题")).toBeVisible();
      await capture(page, info, `scaling-${vp.name}-invalid.png`);
    };
    await invalid();
    for (let index = 0; index < 10; index++) {
      await expect(page.getByText(`第 ${index + 1} / 10 题`)).toBeVisible();
      await firstStep(page);
      if (index === 0) await capture(page, info, `scaling-${vp.name}-zero.png`);
      await page.getByRole("button", { name: "提交本题" }).click();
    }
    await expect(
      page.getByRole("heading", { name: "答对 10 / 10 题" }),
    ).toBeVisible();
    await capture(page, info, `scaling-${vp.name}-results.png`);
    await page.getByRole("button", { name: "再练一组" }).click();
    await expect(page.getByText("第 1 / 10 题")).toBeVisible();
    await capture(page, info, `scaling-${vp.name}-retry.png`);
    await firstStep(page, true);
    await capture(page, info, `scaling-${vp.name}-rough.png`);
    await page.getByRole("button", { name: "提交本题" }).click();
    await expect(page.getByText("第 2 / 10 题")).toBeVisible();
    expect(errors).toEqual([]);
    const metrics = await page.evaluate(() => ({
      pageWidth: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(metrics.pageWidth).toBeLessThanOrEqual(metrics.viewport + 1);
  });
}


test("scaling: PC actual result correction and A×r numerator second-order", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => { Math.random = () => 0; });
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.goto("/c2-lab");
  await page.getByRole("button", { name: /补偿放缩 Scaling.*10题/ }).click();

  const first = parseProblem((await page.locator('[aria-label="C2训练作答"] h2').innerText()).trim());
  await page.getByRole("radio", { name: /修结果 · Q0/ }).check();
  const b0 = first.b + 10, q0 = Number((first.a / b0).toFixed(3));
  const r = Number((10 / b0).toFixed(3));
  const c1 = Number((q0 * r).toFixed(3)), q1 = Number((q0 + c1).toFixed(3));
  await page.getByLabel("自选基准 B0").fill(String(b0));
  await page.getByLabel("带符号 Δ = B0 − B").fill("10");
  await page.getByLabel("实际基准商 Q0").fill(String(q0));
  await page.getByLabel("实际近似幅度 r（小数）").fill(String(r));
  await page.getByLabel("一阶带符号修正 C1").fill(String(c1));
  await page.getByLabel("一阶结果 Q1").fill(String(q1));
  await page.getByLabel("最终实际商").fill(String(q1));
  await capture(page, info, "scaling-pc-result-correction.png");
  await page.getByRole("button", { name: "提交本题" }).click();
  await expect(page.getByText("第 2 / 10 题")).toBeVisible();

  const second = parseProblem((await page.locator('[aria-label="C2训练作答"] h2').innerText()).trim());
  await page.getByRole("radio", { name: /修分子 · A×r/ }).check();
  await page.getByLabel("我还实际进行了下一阶修正").check();
  const nb0 = second.b - 10;
  const nr = Number((10 / nb0).toFixed(3));
  const nc1 = Number((-second.a * nr).toFixed(3));
  const a1 = Number((second.a + nc1).toFixed(3));
  const nq1 = Number((a1 / nb0).toFixed(3));
  const nc2 = Number((second.a * nr * nr).toFixed(3));
  const a2 = Number((a1 + nc2).toFixed(3));
  const nq2 = Number((a2 / nb0).toFixed(3));
  await page.getByLabel("自选基准 B0").fill(String(nb0));
  await page.getByLabel("带符号 Δ = B0 − B").fill("-10");
  await page.getByLabel("实际近似幅度 r（小数）").fill(String(nr));
  await page.getByLabel("一阶带符号修正 C1").fill(String(nc1));
  await page.getByLabel("一阶分子 A1").fill(String(a1));
  await page.getByLabel("一阶结果 Q1").fill(String(nq1));
  await page.getByLabel("后续实际修正 C2").fill(String(nc2));
  await page.getByLabel("后续分子 A2").fill(String(a2));
  await page.getByLabel("后续结果 Q2").fill(String(nq2));
  await page.getByLabel("最终实际商").fill(String(nq2));
  await capture(page, info, "scaling-pc-numerator-r-second.png");
  await page.getByRole("button", { name: "提交本题" }).click();
  await expect(page.getByText("第 3 / 10 题")).toBeVisible();
  expect(errors).toEqual([]);
});
