import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const known = [100, 50, 25, 20, 10, 5, 2, 1, 0.5];
const choices = [...known, ...known.map((n) => -n)];
const round = (n: number) => Number(n.toFixed(8));

// prettier-ignore
async function capture(page: Page, info: TestInfo, name: string) {
  const dir = join(process.cwd(), "test-results", "c006-evidence");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, name);
  await page.screenshot({ path, fullPage: true, animations: "disabled" });
  await info.attach(name, { path, contentType: "image/png" });
}

// prettier-ignore
async function begin(page: Page) {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto("/c2-lab", { waitUntil: "domcontentloaded" });
  const header = page.locator("main > header");
  const title = header.getByRole("heading", { name: "除法综合" });
  await expect(title).toBeVisible();
  const boxes = await Promise.all([
    header.locator("span").first().boundingBox(),
    title.boundingBox(),
    header.locator("p").boundingBox(),
  ]);
  expect(boxes.every(Boolean)).toBe(true);
  expect(boxes[1]!.y).toBeGreaterThan(boxes[0]!.y);
  expect(boxes[2]!.y).toBeGreaterThan(boxes[1]!.y);
  const lineHeight = await title.evaluate((node) =>
    parseFloat(getComputedStyle(node).lineHeight),
  );
  expect(boxes[1]!.height).toBeLessThan(lineHeight * 1.4);
  await page.getByRole("button", { name: /拆分 Split.*10题/ }).click();
  await expect(page.getByText("第 1 / 10 题")).toBeVisible();
  return errors;
}

// prettier-ignore
async function checkLayout(page: Page, width: number, expected: number) {
  const row = page.locator("fieldset").first().locator("..");
  const actual = await row.evaluate((node) => ({
    columns: getComputedStyle(node).gridTemplateColumns.split(" ").length,
    pageWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(actual.columns).toBe(expected);
  expect(actual.pageWidth).toBeLessThanOrEqual(actual.clientWidth + 1);
  const boxes = await Promise.all(
    [0, 1, 2].map((i) => page.locator("fieldset").nth(i).boundingBox()),
  );
  expect(boxes.every(Boolean)).toBe(true);
  const topY = boxes.map((b) => Math.round(b!.y));
  if (expected === 3) {
    expect(topY[0]).toBe(topY[1]);
    expect(topY[1]).toBe(topY[2]);
  } else if (expected === 2) {
    expect(topY[0]).toBe(topY[1]);
    expect(topY[2]).toBeGreaterThan(topY[1]);
  } else {
    expect(topY[0]).toBeLessThan(topY[1]);
    expect(topY[1]).toBeLessThan(topY[2]);
  }
  console.log(
    "C006_LAYOUT:" +
      JSON.stringify({ viewport: width, columns: actual.columns, rowsTop: topY }),
  );
}

// prettier-ignore
function splitWitness(a: number, b: number): number[] {
  const close = (total: number) =>
    Math.abs(total / 100 - a / b) / (a / b) <= 0.03 + 1e-12;
  for (const first of choices) if (close(first)) return [first];
  for (const first of choices)
    for (const second of choices)
      if (close(first + second)) return [first, second];
  for (const first of choices)
    for (const second of choices)
      for (const third of choices)
        if (close(first + second + third)) return [first, second, third];
  throw new Error(`Cannot independently solve ${a}/${b}`);
}

// prettier-ignore
async function setBlock(
  page: Page,
  i: number,
  percent: number,
  amount: number,
  remainder: number,
) {
  await page.getByLabel(`拆分第${i}块比例`).fill(String(percent));
  await page.getByLabel(`拆分第${i}块对应量`).fill(String(amount));
  await page.getByLabel(`拆分第${i}块剩余量`).fill(String(remainder));
}

// prettier-ignore
async function answerOne(page: Page) {
  const prompt = (
    await page.locator('[aria-label="C2训练作答"] h2').innerText()
  ).trim();
  const match = /^(\d+)\s*÷\s*(\d+)$/.exec(prompt);
  if (!match) throw new Error("Unexpected Split prompt " + prompt);
  const a = Number(match[1]);
  const b = Number(match[2]);
  const blocks = splitWitness(a, b);
  let remaining = a;
  for (const [i, percent] of blocks.entries()) {
    if (i > 0)
      await page.getByRole("button", { name: "增加下一块" }).click();
    const amount = round((percent * b) / 100);
    remaining = round(remaining - amount);
    await setBlock(page, i + 1, percent, amount, remaining);
  }
  await page
    .getByLabel("拆分最终累计比例")
    .fill(String(blocks.reduce((sum, p) => sum + p, 0)));
  await page.getByRole("button", { name: "提交本题" }).click();
}

// prettier-ignore
test("C-006 T13: real 720 two-column Split, three signed blocks, delete/add, invalid, result", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 720, height: 1024 });
  const errors = await begin(page);
  await capture(page, info, "720-entry.png");
  const text = await page.locator('[aria-label="C2训练作答"] h2').innerText();
  expect(text.trim()).toBe("102 ÷ 510");
  await setBlock(page, 1, 50, 255, -153);
  await page.getByRole("button", { name: "增加下一块" }).click();
  await setBlock(page, 2, -25, -127.5, -25.5);
  await page.getByRole("button", { name: "增加下一块" }).click();
  await setBlock(page, 3, -5, -25.5, 0);
  await checkLayout(page, 720, 2);
  await page.getByLabel("拆分第3块比例").focus();
  await expect(page.getByLabel("拆分第3块比例")).toBeFocused();
  await capture(page, info, "720-three-blocks-2col.png");

  await page.getByRole("button", { name: "移除最后一块" }).click();
  await expect(page.getByLabel("拆分第3块比例")).toHaveCount(0);
  await expect(page.getByLabel("拆分第1块比例")).toHaveValue("50");
  await expect(page.getByLabel("拆分第2块比例")).toHaveValue("-25");
  await page.getByRole("button", { name: "增加下一块" }).click();
  await setBlock(page, 3, -5, -25.5, 0);
  await checkLayout(page, 720, 2);
  await capture(page, info, "720-readd-scroll.png");

  await page.getByLabel("拆分第3块比例").fill("0.2");
  await page.getByLabel("拆分最终累计比例").fill("20");
  await page.getByRole("button", { name: "提交本题" }).click();
  await expect(page.getByText("第 1 / 10 题")).toBeVisible();
  await expect(
    page.locator('[aria-label="C2训练作答"] [role="alert"]'),
  ).toContainText("请填写实际使用的比例块");
  await capture(page, info, "720-invalid-chinese.png");
  await page.getByLabel("拆分第3块比例").fill("-5");
  await page.getByRole("button", { name: "提交本题" }).click();
  await expect(page.getByText("第 2 / 10 题")).toBeVisible();

  for (let i = 2; i <= 10; i += 1) {
    await expect(page.getByText(`第 ${i} / 10 题`)).toBeVisible();
    await answerOne(page);
  }
  await expect(
    page.getByRole("heading", { name: "答对 10 / 10 题" }),
  ).toBeVisible();
  await capture(page, info, "720-results.png");
  await page.getByRole("button", { name: "再练一组" }).click();
  await expect(page.getByText("第 1 / 10 题")).toBeVisible();
  await capture(page, info, "720-retry.png");
  expect(errors).toEqual([]);
});

// prettier-ignore
for (const v of [
  { width: 760, columns: 2 },
  { width: 761, columns: 3 },
  { width: 540, columns: 1 },
  { width: 541, columns: 2 },
]) {
  test(`C-006 responsive Split breakpoint ${v.width}: ${v.columns} real columns`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: v.width, height: 1024 });
    const errors = await begin(page);
    await page.getByRole("button", { name: "增加下一块" }).click();
    await page.getByRole("button", { name: "增加下一块" }).click();
    await checkLayout(page, v.width, v.columns);
    await setBlock(page, 1, 50, 255, -153);
    await setBlock(page, 2, -25, -127.5, -25.5);
    await setBlock(page, 3, -5, -25.5, 0);
    await expect(page.getByLabel("拆分第3块比例")).toHaveValue("-5");
    await capture(page, info, `breakpoint-${v.width}-3blocks.png`);
    expect(errors).toEqual([]);
  });
}
