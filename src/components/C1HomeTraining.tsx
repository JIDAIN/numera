"use client";

import { useState } from "react";
import { DifficultyBand } from "@/lib/types";

const difficultyLabels: Record<DifficultyBand, string> = {
  L1: "简单",
  L2: "困难",
  L3: "复杂",
};

type Props = {
  onStart: (difficultyBand: DifficultyBand) => void;
  embedded?: boolean;
};

export function C1HomeTraining({ onStart, embedded = false }: Props) {
  const [open, setOpen] = useState(false);
  const [difficultyBand, setDifficultyBand] = useState<DifficultyBand>("L1");

  const card = (
    <button
      aria-label="C1 乘法放缩"
      className={embedded ? "abilityQuickCard" : "cProjectCard"}
      onClick={() => setOpen(true)}
      type="button"
    >
      <span className={embedded ? "abilitySymbol" : "abilitySymbol large"}>
        C1
      </span>
      <span className="abilityCopy">
        <strong>乘法放缩</strong>
        <small>改写两个因子 → 降低计算成本 → 控制误差</small>
      </span>
      {!embedded && <span className="cProjectStatus">20题</span>}
    </button>
  );

  const dialog = open ? (
    <div className="modalBackdrop" role="presentation">
      <section
        aria-labelledby="c1-start-title"
        aria-modal="true"
        className="trainingStartSheet c1StartSheet"
        role="dialog"
      >
        <header>
          <div>
            <span className="abilitySymbol large">C1</span>
            <div>
              <h2 id="c1-start-title">乘法放缩</h2>
              <p>每题填写 A′、B′ 和最终结果；不需要填写 r</p>
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
                onClick={() => setDifficultyBand(band)}
                type="button"
              >
                {difficultyLabels[band]}
              </button>
            ))}
          </div>
        </div>

        <p className="c4MagnitudeHint">
          简单看明显目标；困难开始主动找目标；复杂会出现方案竞争。
        </p>

        <button
          className="primary sheetPrimary"
          onClick={() => {
            setOpen(false);
            onStart(difficultyBand);
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
    <section className="cTrainingHome" aria-label="C1乘法放缩">
      <div className="cTrainingHeading">
        <div>
          <span className="eyebrow">C层专项</span>
          <h2>综合与专项</h2>
        </div>
      </div>
      {card}
      {dialog}
    </section>
  );
}
