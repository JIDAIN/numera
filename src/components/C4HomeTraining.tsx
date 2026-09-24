"use client";

import { useMemo, useState } from "react";
import {
  C4_L1_ANCHORS,
  C4_L2_ANCHORS,
  C4AnchorSelection,
  C4OperationMode,
  C4TrainingConfig,
} from "@/lib/c4-training";
import { DifficultyBand } from "@/lib/types";

const difficultyLabels: Record<DifficultyBand, string> = {
  L1: "简单",
  L2: "困难",
  L3: "复杂",
};

const operationLabels: Record<C4OperationMode, string> = {
  multiply: "乘法",
  divide: "除法",
  mixed: "乘除综合",
};

type Props = {
  onStart: (config: C4TrainingConfig) => void;
  showHeading?: boolean;
  embedded?: boolean;
};

export function C4HomeTraining({
  onStart,
  showHeading = true,
  embedded = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [difficultyBand, setDifficultyBand] = useState<DifficultyBand>("L1");
  const [anchor, setAnchor] = useState<C4AnchorSelection>("all");
  const [operation, setOperation] = useState<C4OperationMode>("mixed");

  const anchors = useMemo(
    () =>
      difficultyBand === "L1"
        ? [...C4_L1_ANCHORS]
        : difficultyBand === "L2"
          ? [...C4_L2_ANCHORS]
          : [],
    [difficultyBand],
  );

  const chooseDifficulty = (next: DifficultyBand) => {
    setDifficultyBand(next);
    setAnchor("all");
  };

  const card = (
    <button
      aria-label="C4 特殊基准数乘除转换"
      className={embedded ? "abilityQuickCard" : "cProjectCard"}
        onClick={() => setOpen(true)}
        type="button"
    >
      <span className={embedded ? "abilitySymbol" : "abilitySymbol large"}>
        C4
      </span>
        <span className="abilityCopy">
          <strong>特殊基准数乘除转换</strong>
          <small>特殊基准 → 简单乘除 → 恢复数量级</small>
        </span>
        {!embedded && <span className="cProjectStatus">20题</span>}
    </button>
  );

  const dialog = open ? (
        <div className="modalBackdrop" role="presentation">
          <section
            aria-labelledby="c4-start-title"
            aria-modal="true"
            className="trainingStartSheet c4StartSheet"
            role="dialog"
          >
            <header>
              <div>
                <span className="abilitySymbol large">C4</span>
                <div>
                  <h2 id="c4-start-title">特殊基准数乘除转换</h2>
                  <p>最终答案相对误差 ≤ 2% 即通过</p>
                </div>
              </div>
              <button
                aria-label="关闭"
                className="sheetClose"
                onClick={() => setOpen(false)}
                type="button"
              >
                ×
              </button>
            </header>

            <div className="c4SettingGroup">
              <strong>难度</strong>
              <div className="segmentedControl">
                {(["L1", "L2", "L3"] as const).map((band) => (
                  <button
                    aria-pressed={difficultyBand === band}
                    className={difficultyBand === band ? "selected" : ""}
                    key={band}
                    onClick={() => chooseDifficulty(band)}
                    type="button"
                  >
                    {difficultyLabels[band]}
                  </button>
                ))}
              </div>
            </div>

            <div className="c4SettingGroup">
              <strong>方向</strong>
              <div className="segmentedControl">
                {(["multiply", "divide", "mixed"] as const).map((mode) => (
                  <button
                    aria-pressed={operation === mode}
                    className={operation === mode ? "selected" : ""}
                    key={mode}
                    onClick={() => setOperation(mode)}
                    type="button"
                  >
                    {operationLabels[mode]}
                  </button>
                ))}
              </div>
            </div>

            <div className="c4SettingGroup">
              <strong>{difficultyBand === "L3" ? "训练范围" : "基准"}</strong>
              {difficultyBand === "L3" ? (
                <p className="c4MagnitudeHint">
                  L3 只做跨数量级综合：在 L1 / L2 已有基准上迁移到 10
                  <sup>-2</sup>、10<sup>-1</sup>、10<sup>1</sup>、 10
                  <sup>2</sup>。
                </p>
              ) : (
                <div className="c4AnchorGrid">
                  <button
                    aria-pressed={anchor === "all"}
                    className={anchor === "all" ? "selected" : ""}
                    onClick={() => setAnchor("all")}
                    type="button"
                  >
                    本级综合
                  </button>
                  {anchors.map((value) => (
                    <button
                      aria-pressed={anchor === value}
                      className={anchor === value ? "selected" : ""}
                      key={value}
                      onClick={() => setAnchor(value)}
                      type="button"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              className="primary sheetPrimary"
              onClick={() => {
                setOpen(false);
                onStart({
                  difficultyBand,
                  anchor: difficultyBand === "L3" ? "all" : anchor,
                  operation,
                });
              }}
              type="button"
            >
              开始 20 题
            </button>
          </section>
        </div>
  ) : null;

  if (embedded)
    return (
      <>
        {card}
        {dialog}
      </>
    );

  return (
    <section className="cTrainingHome" aria-label="C层专项">
      {showHeading && (
        <div className="cTrainingHeading">
          <div>
            <span className="eyebrow">C层专项</span>
            <h2>综合与专项</h2>
          </div>
        </div>
      )}
      {card}
      {dialog}
    </section>
  );
}
