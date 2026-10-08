"use client";

import { structuredTrainingResponse } from "@/lib/training-response";
import {
  StructuredResponseValue,
  TrainingResponse,
  TrainingSession,
} from "@/lib/types";

type Props = {
  session: TrainingSession;
  isRestarting: boolean;
  onChange: (session: TrainingSession) => void;
  onSubmit: (session: TrainingSession) => void;
  onRestart: () => void;
};

type C2TaskKind =
  | "support_r"
  | "support_nxr"
  | "method_choice"
  | "comprehensive"
  | "method_direct"
  | "method_split"
  | "method_scaling";

function structuredFields(response: TrainingResponse | undefined) {
  return response?.kind === "structured" ? response.fields : {};
}

function fieldText(
  fields: Record<string, StructuredResponseValue>,
  key: string,
) {
  const value = fields[key];
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

function restartAction(
  isRestarting: boolean,
  onRestart: () => void,
) {
  return (
    <button
      className="restartTrainingButton"
      disabled={isRestarting}
      onClick={onRestart}
      type="button"
    >
      {isRestarting ? "正在重开…" : "重开训练"}
    </button>
  );
}

export function C2Training({
  session,
  isRestarting,
  onChange,
  onSubmit,
  onRestart,
}: Props) {
  const question = session.questions[session.currentIndex];
  if (!question || question.cMeta?.project !== "C2") return null;

  const taskKind = String(question.data.c2TaskKind) as C2TaskKind;
  const fields = structuredFields(session.currentResponse);
  const updateStructured = (key: string, value: string) => {
    onChange({
      ...session,
      currentResponse: structuredTrainingResponse({
        ...fields,
        [key]: value,
      }),
    });
  };

  if (taskKind === "support_r") {
    const value = fieldText(fields, "rPercent");
    return (
      <section className="c2Training" aria-label="C2求r作答">
        <p className="rule">
          第 {session.currentIndex + 1}/{session.questionCount} 题 · 求 r
        </p>
        <h1>{question.prompt}</h1>
        <div className="c2TrainingFields">
          <label>
            <span>r</span>
            <div className="c1FactorInput">
              <input
                aria-label="r百分数"
                inputMode="decimal"
                onChange={(event) =>
                  updateStructured("rPercent", event.target.value)
                }
                value={value}
              />
              <span aria-hidden="true">%</span>
            </div>
          </label>
        </div>
        <p className="c2TrainingHint">按百分数填写，目标精度到 0.1 个百分点。</p>
        <div className="comparisonActions">
          {restartAction(isRestarting, onRestart)}
          <button
            className="primary"
            disabled={!value.trim()}
            onClick={() => onSubmit(session)}
            type="button"
          >
            提交本题
          </button>
        </div>
      </section>
    );
  }

  if (taskKind === "support_nxr") {
    const variant = String(question.data.c2NxrVariant);
    const first = fieldText(fields, "firstCorrection");
    const second = fieldText(fields, "secondCorrection");
    const needsSecond = variant === "second_order";

    return (
      <section className="c2Training" aria-label="C2 N乘r作答">
        <p className="rule">
          第 {session.currentIndex + 1}/{session.questionCount} 题 · N×r
        </p>
        <h1>{question.prompt}</h1>
        <div className="c2TrainingFields">
          <label>
            <span>一阶修正量</span>
            <input
              aria-label="一阶修正量"
              inputMode="decimal"
              onChange={(event) =>
                updateStructured("firstCorrection", event.target.value)
              }
              value={first}
            />
          </label>
          {needsSecond && (
            <label>
              <span>二阶修正量</span>
              <input
                aria-label="二阶修正量"
                inputMode="decimal"
                onChange={(event) =>
                  updateStructured("secondCorrection", event.target.value)
                }
                value={second}
              />
            </label>
          )}
        </div>
        <p className="c2TrainingHint">
          {needsSecond
            ? "第二步沿用你自己填写的一阶结果，再乘一次 r；系统不会偷偷换成精确一阶值。"
            : "这里只训练修正量大小，不训练修正方向。"}
        </p>
        <div className="comparisonActions">
          {restartAction(isRestarting, onRestart)}
          <button
            className="primary"
            disabled={!first.trim() || (needsSecond && !second.trim())}
            onClick={() => onSubmit(session)}
            type="button"
          >
            提交本题
          </button>
        </div>
      </section>
    );
  }

  if (taskKind === "method_choice") {
    const choices = [
      { value: "direct", label: "直除" },
      { value: "split", label: "拆分" },
      { value: "scaling", label: "补偿放缩" },
    ] as const;

    return (
      <section className="c2Training" aria-label="C2方法选择作答">
        <p className="rule">第一次点击直接提交 · 只比较哪条路线更省</p>
        <h1>{question.prompt}</h1>
        <div className="c2MethodChoices">
          {choices.map((choice) => (
            <button
              key={choice.value}
              onClick={() =>
                onSubmit({
                  ...session,
                  currentResponse: structuredTrainingResponse({
                    selectedRoute: choice.value,
                  }),
                })
              }
              type="button"
            >
              {choice.label}
            </button>
          ))}
        </div>
        <p className="c2TrainingHint">
          一题可以有多条合理路线；推荐路线不是唯一正确答案。
        </p>
        <div className="comparisonActions">
          {restartAction(isRestarting, onRestart)}
        </div>
      </section>
    );
  }

  if (taskKind === "comprehensive") {
    return (
      <section className="c2Training" aria-label="C2综合训练作答">
        <p className="rule">
          第 {session.currentIndex + 1}/{session.questionCount} 题 · 最终相对误差不超过 3%
        </p>
        <h1>{question.prompt}</h1>
        <div className="c2TrainingFields">
          <label>
            <span>最终答案</span>
            <input
              aria-label="最终答案"
              inputMode="decimal"
              onChange={(event) =>
                onChange({ ...session, currentAnswer: event.target.value })
              }
              value={session.currentAnswer}
            />
          </label>
        </div>
        <p className="c2TrainingHint">
          自己压缩、选路线并计算；这里只提交最终答案，系统不会反推你用了哪种方法。
        </p>
        <div className="comparisonActions">
          {restartAction(isRestarting, onRestart)}
          <button
            className="primary"
            disabled={!session.currentAnswer.trim()}
            onClick={() => onSubmit(session)}
            type="button"
          >
            提交本题
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="c2Training" aria-label="C2方法训练占位">
      <p className="rule">C2 方法工作台尚未开放</p>
      <h1>{question.prompt}</h1>
      <p className="c2TrainingHint">
        这条冻结题目需要 Direct / Split / Scaling 专用工作台；当前不会用通用输入框替代。
      </p>
      <div className="comparisonActions">
        {restartAction(isRestarting, onRestart)}
      </div>
    </section>
  );
}
