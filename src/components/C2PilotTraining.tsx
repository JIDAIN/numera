"use client";

import { useState, type FormEvent } from "react";
import type { TrainingResponse } from "@/lib/types";
import {
  c2PilotScore,
  createC2PilotSession,
  submitC2PilotAnswer,
  type C2PilotMode,
  type C2PilotSession,
} from "@/lib/c2/pilot-session";
import { c2DirectCompose } from "@/lib/c2/direct-pilot";
import styles from "./C2PilotTraining.module.css";

const options: { mode: C2PilotMode; label: string; detail: string }[] = [
  {
    mode: "split",
    label: "拆分 Split",
    detail: "10题 · 带符号比例块与真实余量",
  },
  {
    mode: "direct",
    label: "直除 Direct",
    detail: "10题 · 准确有效商位与真实乘回余量",
  },
  {
    mode: "r",
    label: "求 r",
    detail: "20题 · 百分数精确到0.1个百分点",
  },
  {
    mode: "nxr_first",
    label: "N×r · 一阶",
    detail: "20题 · 每步相对误差≤5%",
  },
  {
    mode: "nxr_second",
    label: "N×r · 二阶",
    detail: "10题 · 第二步沿用你的一阶答案",
  },
];

const directFields = [
  {
    key: "firstQuotientDigit",
    label: "首位商",
    hint: "准确的第一位有效商位",
  },
  {
    key: "firstDigitProduct",
    label: "首位商 × 除数",
    hint: "你实际算出的乘回结果",
  },
  {
    key: "remainderAfterFirstDigit",
    label: "当前真实余量",
    hint: "你实际算出的余量",
  },
  {
    key: "secondQuotientDigit",
    label: "第二位商",
    hint: "准确的第二位有效商位",
  },
  {
    key: "thirdQuotientDigit",
    label: "第三位商",
    hint: "仅本题要求时填写",
  },
] as const;

type SplitRow = { percent: string; amount: string; remainder: string };
const emptySplitRow = (): SplitRow => ({
  percent: "",
  amount: "",
  remainder: "",
});

function nextSeed(): number {
  return Math.floor(Math.random() * 4294967296);
}

function attemptValue(attempt: C2PilotSession["attempts"][number]) {
  if (attempt.response.kind === "single") return attempt.response.value + "%";
  if (attempt.response.fields.splitFinalPercent !== undefined)
    return String(attempt.response.fields.splitFinalPercent) + "%";
  if (attempt.response.fields.firstQuotientDigit !== undefined)
    return String(attempt.grade.gradingMetrics?.submittedFinal ?? "未完成");
  const first = String(attempt.response.fields.firstCorrection ?? "");
  const second = attempt.response.fields.secondCorrection;
  return second === undefined ? first : `${first} → ${String(second)}`;
}

export function C2PilotTraining() {
  const [mode, setMode] = useState<C2PilotMode>("r");
  const [session, setSession] = useState<C2PilotSession | null>(null);
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [direct, setDirect] = useState<Record<string, string>>({});
  const [splitRows, setSplitRows] = useState<SplitRow[]>([emptySplitRow()]);
  const [splitFinalPercent, setSplitFinalPercent] = useState("");
  const [error, setError] = useState("");

  const start = (selected: C2PilotMode) => {
    try {
      setSession(createC2PilotSession(selected, nextSeed()));
      setMode(selected);
      setFirst("");
      setSecond("");
      setDirect({});
      setSplitRows([emptySplitRow()]);
      setSplitFinalPercent("");
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "无法生成题组");
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;

    const response: TrainingResponse =
      session.mode === "r"
        ? { kind: "single", value: first }
        : session.mode === "direct"
          ? { kind: "structured", fields: { ...direct } }
          : session.mode === "split"
            ? {
                kind: "structured",
                fields: {
                  splitCount: splitRows.length,
                  splitFinalPercent,
                  ...Object.fromEntries(
                    splitRows.flatMap((row, index) => [
                      [`splitPercent${index + 1}`, row.percent],
                      [`splitAmount${index + 1}`, row.amount],
                      [`splitRemainder${index + 1}`, row.remainder],
                    ]),
                  ),
                },
              }
            : {
                kind: "structured",
                fields: {
                  firstCorrection: first,
                  ...(session.mode === "nxr_second"
                    ? { secondCorrection: second }
                    : {}),
                },
              };

    try {
      const next = submitC2PilotAnswer(session, response);
      setSession(next);
      setFirst("");
      setSecond("");
      setDirect({});
      setSplitRows([emptySplitRow()]);
      setSplitFinalPercent("");
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "答案无法提交");
    }
  };

  const question =
    session?.status === "active"
      ? session.questions[session.currentIndex]
      : undefined;
  const complete = session?.status === "completed";
  const directDigits = Number(question?.data.c2DirectRequestedDigits) as 2 | 3;
  const directEstimate =
    question && session?.mode === "direct"
      ? c2DirectCompose(
          direct.firstQuotientDigit,
          direct.secondQuotientDigit,
          direct.thirdQuotientDigit,
          Number(question.data.c2DirectFirstPlace),
          directDigits,
        )
      : undefined;

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>数感 · C2 候选训练工作台</span>
        <h1>除法综合</h1>
        <p>
          直除、拆分、求 r 与 N×r 已进入候选训练；放缩及综合工作台尚未完成。
        </p>
      </header>

      {!session ? (
        <section aria-label="选择C2支撑专项" className={styles.panel}>
          <h2>选择训练</h2>
          <p className={styles.muted}>
            进入后直接生成固定题组，无题量、难度或旧混合模式选择。
          </p>
          <div className={styles.options}>
            {options.map((option) => (
              <button
                className={styles.option}
                key={option.mode}
                onClick={() => start(option.mode)}
                type="button"
              >
                <strong>{option.label}</strong>
                <span>{option.detail}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {question ? (
        <section aria-label="C2训练作答" className={styles.panel}>
          <div className={styles.progress}>
            <span>
              {options.find((option) => option.mode === session?.mode)?.label}
            </span>
            <span>
              第 {session!.currentIndex + 1} / {session!.questions.length} 题
            </span>
          </div>
          <progress
            aria-label="训练进度"
            max={session!.questions.length}
            value={session!.currentIndex}
          />
          <h2 className={styles.problem}>{question.prompt}</h2>
          <form onSubmit={submit}>
            {session?.mode === "split" ? (
              <div className={styles.splitWorkspace}>
                <p className={styles.muted}>
                  以除数为100%，自行选带符号熟悉比例块，算对应量与新的余量。
                  算够即可提交；下一块只能由你主动增加。
                </p>
                <div className={styles.splitRows}>
                  {splitRows.map((row, index) => (
                    <fieldset className={styles.splitBlock} key={index}>
                      <legend>拆分第 {index + 1} 块</legend>
                      {(
                        [
                          ["percent", "比例", "如 +50 或 -5"],
                          ["amount", "对应量", "自己算出的带符号数量"],
                          ["remainder", "剩余量", "本块之后的真实余量"],
                        ] as const
                      ).map(([key, label, hint]) => (
                        <label className={styles.field} key={key}>
                          <span>{label}</span>
                          <input
                            aria-label={`拆分第${index + 1}块${label}`}
                            autoComplete="off"
                            inputMode="decimal"
                            placeholder={hint}
                            required
                            type="text"
                            value={row[key]}
                            onChange={(event) =>
                              setSplitRows((previous) =>
                                previous.map((entry, at) =>
                                  at === index
                                    ? { ...entry, [key]: event.target.value }
                                    : entry,
                                ),
                              )
                            }
                          />
                        </label>
                      ))}
                    </fieldset>
                  ))}
                </div>
                <div className={styles.splitActions}>
                  <button
                    onClick={() =>
                      setSplitRows((previous) =>
                        previous.length >= 20
                          ? previous
                          : [...previous, emptySplitRow()],
                      )
                    }
                    type="button"
                  >
                    增加下一块
                  </button>
                  {splitRows.length > 1 ? (
                    <button
                      onClick={() =>
                        setSplitRows((previous) => previous.slice(0, -1))
                      }
                      type="button"
                    >
                      移除最后一块
                    </button>
                  ) : null}
                </div>
                <label className={styles.field}>
                  <span>最终累计比例（%）</span>
                  <input
                    aria-label="拆分最终累计比例"
                    autoComplete="off"
                    inputMode="decimal"
                    placeholder="填写自己累计的比例，不能自动代算"
                    required
                    type="text"
                    value={splitFinalPercent}
                    onChange={(event) =>
                      setSplitFinalPercent(event.target.value)
                    }
                  />
                </label>
              </div>
            ) : session?.mode === "direct" ? (
              <div className={styles.directFields}>
                <p className={styles.muted}>
                  本题需准确截取 {directDigits} 位有效商位，不按3%提前停算。
                  下列乘回与余量只记录你真实填写的计算，不由程序预填。
                </p>
                {directFields
                  .filter(
                    (field) =>
                      field.key !== "thirdQuotientDigit" || directDigits === 3,
                  )
                  .map((field) => (
                    <label className={styles.field} key={field.key}>
                      <span>{field.label}</span>
                      <input
                        aria-label={field.label}
                        autoComplete="off"
                        inputMode="decimal"
                        onChange={(event) =>
                          setDirect((previous) => ({
                            ...previous,
                            [field.key]: event.target.value,
                          }))
                        }
                        placeholder={field.hint}
                        required
                        type="text"
                        value={direct[field.key] ?? ""}
                      />
                    </label>
                  ))}
                <p aria-live="polite" className={styles.directPreview}>
                  当前准确商位组合：{directEstimate ?? "待填写商位"}
                </p>
              </div>
            ) : (
              <label className={styles.field}>
                <span>
                  {session?.mode === "r"
                    ? "r（百分数）"
                    : "你实际算出的一阶修正量 C1"}
                </span>
                <div className={styles.inputRow}>
                  <input
                    aria-label={
                      session?.mode === "r" ? "r百分数" : "一阶修正量"
                    }
                    autoComplete="off"
                    autoFocus
                    inputMode="decimal"
                    onChange={(event) => setFirst(event.target.value)}
                    placeholder={
                      session?.mode === "r" ? "例如 7.3" : "填写你算出的数值"
                    }
                    required
                    type="text"
                    value={first}
                  />
                  {session?.mode === "r" ? <span>%</span> : null}
                </div>
              </label>
            )}
            {session?.mode === "nxr_second" ? (
              <label className={styles.field}>
                <span>二阶修正量 C2 = |你填写的 C1| × r</span>
                <input
                  aria-label="二阶修正量"
                  autoComplete="off"
                  inputMode="decimal"
                  onChange={(event) => setSecond(event.target.value)}
                  placeholder="沿用自己的一阶数值"
                  required
                  type="text"
                  value={second}
                />
              </label>
            ) : null}
            <p className={styles.muted}>
              {session?.mode === "split"
                ? "按原始商误差≤3%判终局；块量、余量、累计矛盾只用于过程复盘。"
                : session?.mode === "direct"
                  ? "准确截位判断与实际乘回、余量一致性分别诊断，不靠近似百分比判分。"
                  : session?.mode === "r"
                    ? "填写百分数而非小数比率，只保留至多一位小数。"
                    : "每步独立按5%检查；二阶只依据你实际输入的C1，不替你补算。"}
            </p>
            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}
            <div className={styles.actions}>
              <button className={styles.primary} type="submit">
                提交本题
              </button>
              <button onClick={() => start(session!.mode)} type="button">
                重新训练
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {complete ? (
        <section aria-label="C2训练结果" className={styles.panel}>
          <span className={styles.eyebrow}>本组已完成</span>
          <h2>
            答对 {c2PilotScore(session!)} / {session!.questions.length} 题
          </h2>
          <p className={styles.muted}>
            下表只呈现实际提交的答案和数学判分，不推断你未填写的心算过程。
          </p>
          <ol className={styles.results}>
            {session!.attempts.map((attempt, index) => {
              const questionForAttempt = session!.questions[index];
              return (
                <li className={styles.result} key={attempt.questionId}>
                  <div className={styles.resultHead}>
                    <strong>
                      {index + 1}. {questionForAttempt.prompt}
                    </strong>
                    <span>{attempt.grade.isCorrect ? "正确" : "需复盘"}</span>
                  </div>
                  <p>你的答案：{attemptValue(attempt)}</p>
                  <p>
                    {session!.mode === "split"
                      ? `原始商：${Number(questionForAttempt.data.c2SplitRawA) / Number(questionForAttempt.data.c2SplitRawB)}`
                      : session!.mode === "direct"
                        ? `准确商位：${questionForAttempt.answer}`
                        : session!.mode === "r"
                          ? `标准：${questionForAttempt.answer}%`
                          : `一阶参照：${Number(questionForAttempt.data.c2ExactC1).toPrecision(5)}`}
                  </p>
                  {session!.mode === "split" ? (
                    <div className={styles.splitResult}>
                      <p>
                        终局：
                        {attempt.grade.gradingMetrics?.finalPass
                          ? "达到3%"
                          : "未达到3%"}
                        {" · "}
                        过程：
                        {attempt.grade.gradingMetrics?.processConsistency ===
                        "consistent"
                          ? "算式一致"
                          : "需核查"}
                      </p>
                      <p>
                        已填{" "}
                        {String(
                          attempt.grade.gradingMetrics?.enteredBlockCount,
                        )}{" "}
                        块{" · "}
                        首次足够：第
                        {String(
                          attempt.grade.gradingMetrics?.firstSufficientStage ||
                            "未达标",
                        )}
                        块
                        {attempt.grade.gradingMetrics?.continuedAfterEnough
                          ? " · 可以更早停止"
                          : ""}
                      </p>
                      <p>
                        块比例：
                        {JSON.stringify(
                          attempt.grade.gradingMetrics?.actualPercents,
                        )}
                        {" · "}
                        实际对应量：
                        {JSON.stringify(
                          attempt.grade.gradingMetrics?.actualAmounts,
                        )}
                        {" · "}
                        实际余量：
                        {JSON.stringify(
                          attempt.grade.gradingMetrics?.actualRemainders,
                        )}
                      </p>
                    </div>
                  ) : null}
                  {session!.mode === "direct" ? (
                    <p>
                      终局：
                      {attempt.grade.gradingMetrics?.finalPass
                        ? "准确"
                        : "商位有误"}
                      {" · "}
                      过程：
                      {attempt.grade.gradingMetrics?.processConsistency ===
                      "consistent"
                        ? "一致"
                        : "需核查"}
                    </p>
                  ) : null}
                  {session!.mode === "nxr_second" ? (
                    <p>
                      二阶参照（按你的 C1）：
                      {Number(
                        attempt.grade.gradingMetrics?.processExpectedC2,
                      ).toPrecision(5)}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
          <div className={styles.actions}>
            <button
              className={styles.primary}
              onClick={() => start(session!.mode)}
              type="button"
            >
              再练一组
            </button>
            <button
              onClick={() => {
                setSession(null);
                setError("");
              }}
              type="button"
            >
              切换专项
            </button>
          </div>
        </section>
      ) : null}

      {!question && error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <footer className={styles.footer}>
        本工作台仅为尚未合并的C2候选：题目为程序生成的训练数字，不冒充真实真题。
        本轮冻结题组只保存在页面内存；刷新后不可恢复。放缩、综合前台、云同步、历史与导出尚待开发验收。
      </footer>
    </main>
  );
}
