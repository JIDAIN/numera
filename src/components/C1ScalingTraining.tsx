"use client";

import { c1FactorPresentation } from "@/lib/c1-training";
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
  const aPresentation = c1FactorPresentation(question, "a");
  const bPresentation = c1FactorPresentation(question, "b");
  const hasPercentPresentation =
    aPresentation === "percent" || bPresentation === "percent";
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
          <span>
            调整后第一个因子 A′
            {aPresentation === "percent" ? "（百分数）" : ""}
          </span>
          <div className="c1FactorInput">
            <input
              aria-label="调整后第一个因子"
              inputMode="decimal"
              onChange={(event) => updateField("aPrime", event.target.value)}
              value={fieldText(fields, "aPrime")}
            />
            {aPresentation === "percent" && <span aria-hidden="true">%</span>}
          </div>
        </label>
        <label>
          <span>
            调整后第二个因子 B′
            {bPresentation === "percent" ? "（百分数）" : ""}
          </span>
          <div className="c1FactorInput">
            <input
              aria-label="调整后第二个因子"
              inputMode="decimal"
              onChange={(event) => updateField("bPrime", event.target.value)}
              value={fieldText(fields, "bPrime")}
            />
            {bPresentation === "percent" && <span aria-hidden="true">%</span>}
          </div>
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
        {hasPercentPresentation &&
          " 百分数因子按题面单位填写，例如 42% 调整为 40% 时输入 40；系统按 0.40 参与计算，最终 U 填写原式实际乘积数值。"}
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
