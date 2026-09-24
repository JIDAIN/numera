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

export function C3HomeTraining({ onStart, embedded = false }: Props) {
  const [open, setOpen] = useState(false);
  const [difficultyBand, setDifficultyBand] = useState<DifficultyBand>("L1");

  const card = (
    <button
      aria-label="C3 分数比较"
      className={embedded ? "abilityQuickCard" : "cProjectCard"}
      onClick={() => setOpen(true)}
      type="button"
    >
      <span className={embedded ? "abilitySymbol" : "abilitySymbol large"}>
        C3
      </span>
      <span className="abilityCopy">
        <strong>分数比较</strong>
        <small>观察客观结构 → 判断最终大小</small>
      </span>
      {!embedded && <span className="cProjectStatus">20题</span>}
    </button>
  );

  const dialog = open ? (
    <div className="modalBackdrop" role="presentation">
      <section
        aria-labelledby="c3-start-title"
        aria-modal="true"
        className="trainingStartSheet c3StartSheet"
        role="dialog"
      >
        <header>
          <div>
            <span className="abilitySymbol large">C3</span>
            <div>
              <h2 id="c3-start-title">分数比较</h2>
              <p>每组20题，只判断 &lt; 或 &gt;</p>
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
          难度按整组结构构成区分；不会把 S1 / S2 / S3 直接等同于 L1 / L2 / L3。
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
    <section className="cTrainingHome" aria-label="C3分数比较">
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
