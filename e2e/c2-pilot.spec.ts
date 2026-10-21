import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

type Mode = "split" | "direct" | "r" | "nxr_first" | "nxr_second";
const modes: { mode: Mode; button: RegExp; count: number }[] = [
  { mode: "split", button: /拆分 Split.*10题/, count: 10 },
  { mode: "direct", button: /直除 Direct.*10题/, count: 10 },
  { mode: "r", button: /求 r.*20题/, count: 20 },
  { mode: "nxr_first", button: /N×r · 一阶.*20题/, count: 20 },
  { mode: "nxr_second", button: /N×r · 二阶.*10题/, count: 10 },
];
const familiar = [50, 25, 20, 10, 5, 2, 1, 0.5, 100];
const signed = [...familiar, ...familiar.map((v) => -v)];
const round = (n: number, digits = 8) => Number(n.toFixed(digits));

async function screenshot(page: Page, info: TestInfo, name: string) {
  const path = join(process.cwd(), "test-results", "c006-evidence", name);
  mkdirSync(join(process.cwd(), "test-results", "c005-evidence"), {
    recursive: true,
  });
  await page.screenshot({ path, fullPage: true, animations: "disabled" });
  await info.attach(name, { path, contentType: "image/png" });
}

async function init(page: Page, info: TestInfo, viewport: string) {
  // A deterministic training seed for browser testing only. Production UI
  // keeps its random behavior; no answers or process fields are injected.
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/c2-lab", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "除法综合" })).toBeVisible();
  await expect(page.getByLabel("选择C2支撑专项")).toBeVisible();
  for (const m of modes)
    await expect(page.getByRole("button", { name: m.button })).toBeVisible();
  await screenshot(page, info, `${viewport}-entry.png`);
  return errors;
}

async function launch(page: Page, mode: Mode) {
  const entry = modes.find((m) => m.mode === mode)!;
  await page.getByRole("button", { name: entry.button }).click();
  await expect(page.getByText(`第 1 / ${entry.count} 题`)).toBeVisible();
  return entry.count;
}

function readFraction(problem: string) {
  const match = problem.match(/^(\d+)\s*÷\s*(\d+)$/);
  if (!match) throw new Error("Unexpected Direct/Split problem: " + problem);
  return { a: Number(match[1]), b: Number(match[2]) };
}

function splitWitness(a: number, b: number) {
  const goal = a / b;
  const enough = (total: number) =>
    Math.abs(total / 100 - goal) / goal <= 0.03 + 1e-12;
  for (const p of signed) if (enough(p)) return [p];
  for (const p of signed)
    for (const q of signed) if (enough(p + q)) return [p, q];
  for (const p of signed)
    for (const q of signed)
      for (const r of signed) if (enough(p + q + r)) return [p, q, r];
  throw new Error(`No familiar Split witness for ${a}/${b}`);
}

async function fillSplit(
  page: Page,
  a: number,
  b: number,
  info?: TestInfo,
  label?: string,
) {
  const blocks = splitWitness(a, b);
  let remaining = a;
  for (const [index, percent] of blocks.entries()) {
    if (index !== 0)
      await page.getByRole("button", { name: "增加下一块" }).click();
    const number = index + 1;
    const amount = round((percent * b) / 100);
    remaining = round(remaining - amount);
    await page.getByLabel(`拆分第${number}块比例`).fill(String(percent));
    await page.getByLabel(`拆分第${number}块对应量`).fill(String(amount));
    await page.getByLabel(`拆分第${number}块剩余量`).fill(String(remaining));
  }
  await page
    .getByLabel("拆分最终累计比例")
    .fill(String(blocks.reduce((total, p) => total + p, 0)));
  if (blocks.length < 3)
    await expect(page.getByLabel("拆分第3块比例")).toHaveCount(0);
  if (info && label) await screenshot(page, info, label);
}

async function fillDirect(page: Page, a: number, b: number) {
  // Independent oracle derived from the visible expression. No import
  // from Numera's frozen question answer/grader and no backend state reads.
  const scale = a < b ? 10 : 1;
  const first = Math.floor((a * scale) / b);
  const second = Math.floor((a * scale * 10) / b) % 10;
  const third = Math.floor((a * scale * 100) / b) % 10;
  const firstPlace = a < b ? 0.1 : 1;
  const product = round(first * firstPlace * b, 6);
  await page.getByLabel("首位商", { exact: true }).fill(String(first));
  await page.getByLabel("首位商 × 除数").fill(String(product));
  await page.getByLabel("当前真实余量").fill(String(round(a - product, 6)));
  await page.getByLabel("第二位商").fill(String(second));
  if (await page.getByLabel("第三位商").count())
    await page.getByLabel("第三位商").fill(String(third));
}

async function fillNxr(page: Page, problem: string, secondOrder: boolean) {
  const match = problem.match(/^([\d.]+)\s*×\s*([\d.]+)%/);
  if (!match) throw new Error("Unexpected NxR problem: " + problem);
  const n = Number(match[1]);
  const r = Number(match[2]) / 100;
  const c1 = round(n * r, 8);
  await page.getByLabel("一阶修正量").fill(String(c1));
  if (secondOrder)
    await page
      .getByLabel("二阶修正量")
      .fill(String(round(Math.abs(c1) * r, 8)));
}

async function fillR(page: Page, problem: string) {
  const match = problem.match(/B=(\d+)，B₀=(\d+)/);
  if (!match) throw new Error("Unexpected r problem: " + problem);
  const b = Number(match[1]);
  const b0 = Number(match[2]);
  const percent = Number(((Math.abs(b0 - b) / b0) * 100).toFixed(1));
  await page.getByLabel("r百分数").fill(String(percent));
}

async function answer(page: Page, mode: Mode, info?: TestInfo, label?: string) {
  const problem = (
    await page.locator('[aria-label="C2训练作答"] h2').innerText()
  ).trim();
  if (mode === "direct" || mode === "split") {
    const { a, b } = readFraction(problem);
    if (mode === "direct") await fillDirect(page, a, b);
    else await fillSplit(page, a, b, info, label);
  } else if (mode === "r") await fillR(page, problem);
  else await fillNxr(page, problem, mode === "nxr_second");
  await page.getByRole("button", { name: "提交本题" }).click();
}

async function finish(page: Page, mode: Mode, info?: TestInfo, phase?: string) {
  const count = modes.find((m) => m.mode === mode)!.count;
  for (let i = 0; i < count; i += 1) {
    await expect(page.getByText(`第 ${i + 1} / ${count} 题`)).toBeVisible();
    await answer(
      page,
      mode,
      i === 0 ? info : undefined,
      i === 0 ? phase : undefined,
    );
  }
  await expect(
    page.getByRole("heading", { name: `答对 ${count} / ${count} 题` }),
  ).toBeVisible();
  return count;
}

async function assertNoOverflow(page: Page) {
  const actual = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(actual.scroll).toBeLessThanOrEqual(actual.viewport + 1);
}

test.describe("C-005 full browser session — desktop 1440x900", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const { mode, count } of modes) {
    test(`${mode}: completes ${count} actual browser answers and restarts`, async ({
      page,
    }, info) => {
      const errors = await init(page, info, "pc");
      await launch(page, mode);
      await screenshot(page, info, `pc-${mode}-entry.png`);
      if (mode === "split") {
        // Browser-native invalid input must not consume the frozen question.
        await page.getByLabel("拆分第1块比例").fill("0.2");
        await page.getByLabel("拆分第1块对应量").fill("1");
        await page.getByLabel("拆分第1块剩余量").fill("10");
        await page.getByLabel("拆分最终累计比例").fill("50");
        await page.getByRole("button", { name: "提交本题" }).click();
        await expect(
          page.locator('[aria-label="C2训练作答"] [role="alert"]'),
        ).toBeVisible();
        await expect(page.getByText(`第 1 / ${count} 题`)).toBeVisible();
        await expect(
          page.locator('[aria-label="C2训练作答"] [role="alert"]'),
        ).toContainText("请填写实际使用的比例块");
        await screenshot(page, info, "pc-split-error.png");
        await page.getByRole("button", { name: "增加下一块" }).click();
        await page.getByRole("button", { name: "增加下一块" }).click();
        await expect(page.getByLabel("拆分第3块比例")).toBeVisible();
        await page.getByRole("button", { name: "移除最后一块" }).click();
        await page.getByRole("button", { name: "移除最后一块" }).click();
        await expect(page.getByLabel("拆分第2块比例")).toHaveCount(0);
      } else if (mode === "r") {
        await page.getByLabel("r百分数").fill("1e2");
        await page.getByRole("button", { name: "提交本题" }).click();
        await expect(
          page.locator('[aria-label="C2训练作答"] [role="alert"]'),
        ).toBeVisible();
        await expect(page.getByText("第 1 / 20 题")).toBeVisible();
      } else if (mode === "direct") {
        await page.getByLabel("首位商", { exact: true }).fill("0x1");
        await page.getByLabel("首位商 × 除数").fill("11");
        await page.getByLabel("当前真实余量").fill("12");
        await page.getByLabel("第二位商").fill("1");
        if (await page.getByLabel("第三位商").count())
          await page.getByLabel("第三位商").fill("1");
        await page.getByRole("button", { name: "提交本题" }).click();
        await expect(
          page.locator('[aria-label="C2训练作答"] [role="alert"]'),
        ).toBeVisible();
      } else {
        await page.getByLabel("一阶修正量").fill("0x10");
        if (mode === "nxr_second")
          await page.getByLabel("二阶修正量").fill("1");
        await page.getByRole("button", { name: "提交本题" }).click();
        await expect(
          page.locator('[aria-label="C2训练作答"] [role="alert"]'),
        ).toBeVisible();
      }
      if (mode !== "split")
        await screenshot(page, info, `pc-${mode}-error.png`);
      await finish(page, mode, info, `pc-${mode}-answer.png`);
      await screenshot(page, info, `pc-${mode}-result.png`);
      await assertNoOverflow(page);
      await expect(page.locator('[aria-label="C2训练结果"] li')).toHaveCount(
        count,
      );
      await page.getByRole("button", { name: "再练一组" }).click();
      await expect(page.getByText(`第 1 / ${count} 题`)).toBeVisible();
      await screenshot(page, info, `pc-${mode}-retry.png`);
      await page.getByRole("button", { name: "重新训练" }).click();
      await expect(page.getByText(`第 1 / ${count} 题`)).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});

test.describe("C-005 responsive browser evidence", () => {
  for (const vp of [
    { label: "pad", width: 768, height: 1024 },
    { label: "mobile", width: 390, height: 844 },
  ]) {
    test(`${vp.label}: Split10 real input, responsive screenshots, errors and results`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const errors = await init(page, info, vp.label);
      await launch(page, "split");
      await assertNoOverflow(page);
      await page.getByLabel("拆分第1块比例").fill("0.1");
      await page.getByLabel("拆分第1块对应量").fill("1");
      await page.getByLabel("拆分第1块剩余量").fill("1");
      await page.getByLabel("拆分最终累计比例").fill("0.1");
      await page.getByRole("button", { name: "提交本题" }).click();
      await expect(
        page.locator('[aria-label="C2训练作答"] [role="alert"]'),
      ).toBeVisible();
      await screenshot(page, info, `${vp.label}-split-error.png`);
      await finish(page, "split", info, `${vp.label}-split-question.png`);
      await screenshot(page, info, `${vp.label}-split-result.png`);
      await assertNoOverflow(page);
      expect(errors).toEqual([]);
    });
  }

  test("pad: second-order inputs can be focused and corrected", async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const errors = await init(page, info, "pad-nxr");
    await launch(page, "nxr_second");
    await page.getByLabel("一阶修正量").fill("0b100");
    await page.getByLabel("二阶修正量").fill("2");
    await page.getByRole("button", { name: "提交本题" }).click();
    await expect(
      page.locator('[aria-label="C2训练作答"] [role="alert"]'),
    ).toBeVisible();
    await finish(page, "nxr_second");
    await assertNoOverflow(page);
    expect(errors).toEqual([]);
  });

  test("mobile: Direct10 fields and conditional third digit are usable", async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const errors = await init(page, info, "mobile-direct");
    await launch(page, "direct");
    await expect(page.getByLabel("首位商", { exact: true })).toBeVisible();
    await finish(page, "direct");
    await assertNoOverflow(page);
    expect(errors).toEqual([]);
  });
});
