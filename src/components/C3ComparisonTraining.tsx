"use client";

import { TrainingSession } from "@/lib/types";

type Props = {
  session: TrainingSession;
  isRestarting: boolean;
  onSubmit: (session: TrainingSession) => void;
  onRestart: () => void;
};

export function C3ComparisonTraining({
  session,
  isRestarting,
  onSubmit,
  onRestart,
}: Props) {
  const question = session.questions[session.currentIndex];
  if (!question || question.cMeta?.project !== "C3") return null;

  const { a, b, c, d } = question.data;
  const hasFractions = [a, b, c, d].every((value) => typeof value === "number");

  return (
    <section className="c3ComparisonTraining" aria-label="C3分数比较作答">
      <p className="rule">第一次点击直接提交</p>
      {hasFractions ? (
        <div
          className="fractionComparisonQuestion"
          aria-label={question.prompt}
        >
          <span className="verticalFraction">
            <span>{String(a)}</span>
            <span>{String(b)}</span>
          </span>
          <strong>?</strong>
          <span className="verticalFraction">
            <span>{String(c)}</span>
            <span>{String(d)}</span>
          </span>
        </div>
      ) : (
        <h1>{question.prompt}</h1>
      )}

      <div className="comparisonPad trainingKeypad">
        <div className="comparisonChoices">
          {[
            { label: "大于", value: ">" },
            { label: "小于", value: "<" },
          ].map(({ label, value }) => (
            <button
              key={value}
              onClick={() => onSubmit({ ...session, currentAnswer: value })}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="comparisonActions">
          <button
            className="restartTrainingButton"
            disabled={isRestarting}
            onClick={onRestart}
            type="button"
          >
            {isRestarting ? "正在重开…" : "重开训练"}
          </button>
        </div>
      </div>
    </section>
  );
}
