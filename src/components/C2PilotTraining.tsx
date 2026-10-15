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
import styles from "./C2PilotTraining.module.css";

const options: { mode: C2PilotMode; label: string; detail: string }[] = [
  { mode: "r", label: "求 r", detail: "20题 · 百分数精确到0.1个百分点" },
  { mode: "nxr_first", label: "N×r · 一阶", detail: "20题 · 每步相对误差≤5%" },
  {
    mode: "nxr_second",
    label: "N×r · 二阶",
    detail: "10题 · 第二步沿用你的一阶答案",
  },
];

function nextSeed(): number {
  return Math.floor(Math.random() * 4294967296);
}

function attemptValue(attempt: C2PilotSession["attempts"][number]) {
  if (attempt.response.kind === "single") return attempt.response.value + "%";
  const first = String(attempt.response.fields.firstCorrection ?? "");
  const second = attempt.response.fields.secondCorrection;
  return second === undefined ? first : `${first} → ${String(second)}`;
}

export function C2PilotTraining() {
  const [mode, setMode] = useState<C2PilotMode>("r");
  const [session, setSession] = useState<C2PilotSession | null>(null);
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [error, setError] = useState("");

  const start = (selected: C2PilotMode) => {
    try {
      setSession(createC2PilotSession(selected, nextSeed()));
      setMode(selected);
      setFirst("");
      setSecond("");
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

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>数感 · C2 候选训练工作台</span>
        <h1>除法综合</h1>
        <p>
          先把求 r 与 N×r
          练成完整闭环。这里是隔离候选体验，不代表六入口已全部实现。
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
            <label className={styles.field}>
              <span>
                {session?.mode === "r"
                  ? "r（百分数）"
                  : "你实际算出的一阶修正量 C1"}
              </span>
              <div className={styles.inputRow}>
                <input
                  aria-label={session?.mode === "r" ? "r百分数" : "一阶修正量"}
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
              {session?.mode === "r"
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
                    {session!.mode === "r"
                      ? `标准：${questionForAttempt.answer}%`
                      : `一阶参照：${Number(questionForAttempt.data.c2ExactC1).toPrecision(5)}`}
                  </p>
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
        本工作台仅为尚未合并的C-001候选：题目为程序生成的训练数字，不冒充真实真题。
        本轮冻结题组只保存在页面内存；刷新后不可恢复，云同步、历史、导出与其他C2方法尚待开发验收。
      </footer>
    </main>
  );
}
