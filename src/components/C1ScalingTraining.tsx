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

type C1Field = "aPrime" | "bPrime" | "result";

function structuredFields(response: TrainingResponse | undefined) {
  return response?.kind === "structured" ? response.fields : {};
}

function fieldText(
  fields: Record<string, StructuredResponseValue>,
  key: C1Field,
) {
  const value = fields[key];
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

export function C1ScalingTraining({
  session,
  isRestarting,
  onChange,
  onSubmit,
  onRestart,
}: Props) {
  const question = session.questions[session.currentIndex];
  if (!question || question.cMeta?.project !== "C1") return null;

  const fields = structuredFields(session.currentResponse);
  const updateField = (key: C1Field, value: string) => {
    onChange({
      ...session,
      currentResponse: structuredTrainingResponse({
        ...fields,
        [key]: value,
      }),
    });
  };
  const complete = (["aPrime", "bPrime", "result"] as const).every(
    (key) => fieldText(fields, key).trim().length > 0,
  );

  return (
    <section className="c1ScalingTraining" aria-label="C1乘法放缩作答">
      <p className="rule">
        第 {session.currentIndex + 1}/{session.questionCount} 题 ·
        找一条你认为真正更省的放缩路线
      </p>
      <h1>{question.prompt}</h1>

      <div className="c1ScalingFields">
        <label>
          <span>调整后第一个因子 A′</span>
          <input
            aria-label="调整后第一个因子"
            inputMode="decimal"
            onChange={(event) => updateField("aPrime", event.target.value)}
            value={fieldText(fields, "aPrime")}
          />
        </label>
        <label>
          <span>调整后第二个因子 B′</span>
          <input
            aria-label="调整后第二个因子"
            inputMode="decimal"
            onChange={(event) => updateField("bPrime", event.target.value)}
            value={fieldText(fields, "bPrime")}
          />
        </label>
        <label>
          <span>最终结果 U</span>
          <input
            aria-label="最终结果"
            inputMode="decimal"
            onChange={(event) => updateField("result", event.target.value)}
            value={fieldText(fields, "result")}
          />
        </label>
      </div>

      <p className="c1ScalingHint">
        系统会按你实际填写的路线判断方向、计算成本、方法误差、执行误差和总误差；推荐路线不是唯一答案。
      </p>

      <div className="comparisonActions">
        <button
          className="restartTrainingButton"
          disabled={isRestarting}
          onClick={onRestart}
          type="button"
        >
          {isRestarting ? "正在重开…" : "重开训练"}
        </button>
        <button
          className="primary"
          disabled={!complete}
          onClick={() => onSubmit(session)}
          type="button"
        >
          提交本题
        </button>
      </div>
    </section>
  );
}
