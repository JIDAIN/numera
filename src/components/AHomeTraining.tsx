"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  canonicalAAbilityDefinitions,
  CanonicalAAbilityId,
  isCanonicalAAbilityId,
} from "@/lib/a-abilities";
import {
  DailyTrainingPlan,
  normalizeDailyTrainingPlan,
} from "@/lib/a-training-plan";
import { isValidNewTrainingQuestionCount } from "@/lib/question-count";
import {
  DifficultyBand,
  parseSkillDrillSubtype,
  TrainingSession,
} from "@/lib/types";
import { getTrainingDisplayDescriptor } from "@/lib/training-definition";
import { isImplementedCProject } from "@/lib/c-project-registry";

const abilities = canonicalAAbilityDefinitions.map((ability) => ({
  id: ability.id,
  symbol: ability.homeSymbol,
  label: ability.homeLabel,
  detail: ability.homeDetail,
}));

const difficultyLabels: Record<DifficultyBand, string> = {
  L1: "基础",
  L2: "标准",
  L3: "挑战",
};

const difficultyOptions = ["L1", "L2", "L3"] as const;

function abilityMeta(abilityId: CanonicalAAbilityId) {
  return abilities.find((ability) => ability.id === abilityId) ?? abilities[0];
}

function planStorageKey(scope: string) {
  return `numera:a-daily-plan:${scope}`;
}

function difficultyStorageKey(scope: string) {
  return `numera:a-last-difficulty:${scope}`;
}

type DifficultyPreferences = Partial<
  Record<CanonicalAAbilityId, DifficultyBand>
>;

function readDifficultyPreferences(scope: string): DifficultyPreferences {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(difficultyStorageKey(scope));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result: DifficultyPreferences = {};
    abilities.forEach(({ id }) => {
      const value = parsed[id];
      if (value === "L1" || value === "L2" || value === "L3")
        result[id] = value;
    });
    return result;
  } catch {
    return {};
  }
}

function readDailyPlan(scope: string): DailyTrainingPlan | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(planStorageKey(scope));
    return raw ? normalizeDailyTrainingPlan(JSON.parse(raw)) : undefined;
  } catch {
    return undefined;
  }
}

function ownSession(
  session: TrainingSession,
  ownerAccountId: string | undefined,
  userId: string,
) {
  return ownerAccountId
    ? session.ownerAccountId === ownerAccountId
    : !session.ownerAccountId && session.userId === userId;
}

type AHomeTrainingProps = {
  history: TrainingSession[];
  ownerAccountId?: string;
  preferenceScope: string;
  userId: string;
  onStartDaily: (plan: DailyTrainingPlan) => void;
  onStartSkill: (
    abilityId: CanonicalAAbilityId,
    difficultyBand: DifficultyBand,
    questionCount: 10 | 20,
  ) => void;
  onRepeatSpecialty: (session: TrainingSession) => void;
  practiceExtras?: ReactNode;
};

export function AHomeTraining({
  history,
  ownerAccountId,
  preferenceScope,
  userId,
  onStartDaily,
  onStartSkill,
  onRepeatSpecialty,
  practiceExtras,
}: AHomeTrainingProps) {
  const [dailyPlan, setDailyPlan] = useState<DailyTrainingPlan>();
  const [difficultyPreferences, setDifficultyPreferences] =
    useState<DifficultyPreferences>({});
  const [selectedAbility, setSelectedAbility] = useState<CanonicalAAbilityId>();
  const [skillDifficulty, setSkillDifficulty] = useState<DifficultyBand>("L2");
  const [skillCount, setSkillCount] = useState<10 | 20>(10);
  const [showSkillCount, setShowSkillCount] = useState(false);
  const [showDailySettings, setShowDailySettings] = useState(false);
  const [dailyDraft, setDailyDraft] = useState<DifficultyPreferences>({});
  const [dailyCount, setDailyCount] = useState<10 | 20>(10);
  const [dailyError, setDailyError] = useState(false);

  useEffect(() => {
    setDailyPlan(readDailyPlan(preferenceScope));
    setDifficultyPreferences(readDifficultyPreferences(preferenceScope));
  }, [preferenceScope]);

  const recentSpecialty = useMemo(() => {
    return [...history]
      .filter((session) => {
        if (
          session.status !== "completed" ||
          session.trainingSource === "pk" ||
          !ownSession(session, ownerAccountId, userId)
        )
          return false;
        const encoded = parseSkillDrillSubtype(session.subtype);
        const skillId = session.primarySkillId ?? encoded?.skillId;
        const isCurrentA = isCanonicalAAbilityId(skillId);
        const isCurrentC =
          session.questionType === "c_training" &&
          Boolean(session.cProject && isImplementedCProject(session.cProject));
        return isCurrentA || isCurrentC;
      })
      .sort(
        (left, right) =>
          (right.completedAt ?? right.startedAt) -
          (left.completedAt ?? left.startedAt),
      )[0];
  }, [history, ownerAccountId, userId]);

  const openSkill = (abilityId: CanonicalAAbilityId) => {
    setSelectedAbility(abilityId);
    setSkillDifficulty(difficultyPreferences[abilityId] ?? "L2");
    setSkillCount(10);
    setShowSkillCount(false);
  };

  const saveDifficultyPreference = (
    abilityId: CanonicalAAbilityId,
    difficultyBand: DifficultyBand,
  ) => {
    const next = { ...difficultyPreferences, [abilityId]: difficultyBand };
    setDifficultyPreferences(next);
    if (typeof window !== "undefined")
      window.localStorage.setItem(
        difficultyStorageKey(preferenceScope),
        JSON.stringify(next),
      );
  };

  const openDailySettings = () => {
    const draft: DifficultyPreferences = {};
    dailyPlan?.entries.forEach((entry) => {
      draft[entry.abilityId] = entry.difficultyBand;
    });
    setDailyDraft(draft);
    setDailyCount(dailyPlan?.questionCount ?? 10);
    setDailyError(false);
    setShowDailySettings(true);
  };

  const saveDailySettings = () => {
    const entries = abilities.flatMap(({ id }) => {
      const difficultyBand = dailyDraft[id];
      return difficultyBand ? [{ abilityId: id, difficultyBand }] : [];
    });
    if (!entries.length) {
      setDailyError(true);
      return;
    }
    const next: DailyTrainingPlan = {
      version: 1,
      entries,
      questionCount: dailyCount,
    };
    setDailyPlan(next);
    setShowDailySettings(false);
    if (typeof window !== "undefined")
      window.localStorage.setItem(
        planStorageKey(preferenceScope),
        JSON.stringify(next),
      );
  };

  const recentEncoded = recentSpecialty
    ? parseSkillDrillSubtype(recentSpecialty.subtype)
    : undefined;
  const recentSkillId = isCanonicalAAbilityId(
    recentSpecialty?.primarySkillId ?? recentEncoded?.skillId,
  )
    ? ((recentSpecialty?.primarySkillId ??
        recentEncoded?.skillId) as CanonicalAAbilityId)
    : undefined;
  const recentDifficulty =
    recentSpecialty?.difficultyBand ?? recentEncoded?.difficultyBand ?? "L2";
  const recentCount = isValidNewTrainingQuestionCount(
    recentSpecialty?.questionCount,
  )
    ? recentSpecialty.questionCount
    : 10;
  const recentDescriptor = recentSpecialty
    ? getTrainingDisplayDescriptor(recentSpecialty)
    : undefined;
  const recentLabel =
    recentSkillId && recentSpecialty
      ? `${abilityMeta(recentSkillId).label} · ${difficultyLabels[recentDifficulty]}`
      : recentDescriptor
        ? `${recentDescriptor.title} · ${recentDescriptor.subtitle}`
        : undefined;

  return (
    <section className="aTrainingHome" aria-label="训练">
      <section className="dailyTrainingCard">
        <div className="dailyTrainingHeading">
          <div>
            <span className="eyebrow">日常训练</span>
            <h2>我的日常</h2>
          </div>
          <button
            className="textAction"
            onClick={openDailySettings}
            type="button"
          >
            {dailyPlan ? "设置" : "去设置"}
          </button>
        </div>
        {dailyPlan ? (
          <>
            <div className="dailyPlanChips">
              {dailyPlan.entries.map((entry) => (
                <span key={entry.abilityId}>
                  {abilityMeta(entry.abilityId).label} ·{" "}
                  {difficultyLabels[entry.difficultyBand]}
                </span>
              ))}
            </div>
            <button
              className="primary dailyStartButton"
              onClick={() => onStartDaily(dailyPlan)}
              type="button"
            >
              开始 {dailyPlan.questionCount} 题
            </button>
          </>
        ) : (
          <button
            className="dailyEmptyState"
            onClick={openDailySettings}
            type="button"
          >
            <strong>设置一套自己的固定练习</strong>
            <span>以后打开数感就能直接开始</span>
          </button>
        )}
      </section>

      {recentSpecialty && recentLabel && (
        <section className="recentTrainingRow" aria-label="最近专项">
          <div>
            <span className="eyebrow">最近专项</span>
            <strong>{recentLabel}</strong>
          </div>
          <button
            onClick={() => {
              if (recentSkillId)
                onStartSkill(recentSkillId, recentDifficulty, recentCount);
              else onRepeatSpecialty(recentSpecialty);
            }}
            type="button"
          >
            再来一组
          </button>
        </section>
      )}

      <section className="allPracticeSection">
        <h2>全部练习</h2>
        <div className="abilityQuickGrid">
          {abilities.map((ability) => (
            <button
              aria-label={`${ability.label} ${ability.detail}`}
              className="abilityQuickCard"
              key={ability.id}
              onClick={() => openSkill(ability.id)}
              type="button"
            >
              <span className="abilitySymbol">{ability.symbol}</span>
              <span className="abilityCopy">
                <strong>{ability.label}</strong>
                <small>{ability.detail}</small>
              </span>
            </button>
          ))}
          {practiceExtras}
        </div>
      </section>

      {selectedAbility && (
        <div className="modalBackdrop" role="presentation">
          <section
            aria-labelledby="skill-start-title"
            aria-modal="true"
            className="trainingStartSheet"
            role="dialog"
          >
            <header>
              <div>
                <span className="abilitySymbol large">
                  {abilityMeta(selectedAbility).symbol}
                </span>
                <div>
                  <h2 id="skill-start-title">
                    {abilityMeta(selectedAbility).label}
                  </h2>
                  <p>{abilityMeta(selectedAbility).detail}</p>
                </div>
              </div>
              <button
                aria-label="关闭"
                className="sheetClose"
                onClick={() => setSelectedAbility(undefined)}
                type="button"
              >
                ×
              </button>
            </header>

            <div className="segmentedControl" aria-label="难度">
              {difficultyOptions.map((difficultyBand) => (
                <button
                  aria-pressed={skillDifficulty === difficultyBand}
                  className={
                    skillDifficulty === difficultyBand ? "selected" : ""
                  }
                  key={difficultyBand}
                  onClick={() => setSkillDifficulty(difficultyBand)}
                  type="button"
                >
                  {difficultyLabels[difficultyBand]}
                </button>
              ))}
            </div>

            {showSkillCount && (
              <div className="countSettingRow">
                <span>题量</span>
                <div className="segmentedControl compact">
                  {[10, 20].map((questionCount) => (
                    <button
                      aria-pressed={skillCount === questionCount}
                      className={skillCount === questionCount ? "selected" : ""}
                      key={questionCount}
                      onClick={() => setSkillCount(questionCount as 10 | 20)}
                      type="button"
                    >
                      {questionCount}题
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              className="primary sheetPrimary"
              onClick={() => {
                saveDifficultyPreference(selectedAbility, skillDifficulty);
                setSelectedAbility(undefined);
                onStartSkill(selectedAbility, skillDifficulty, skillCount);
              }}
              type="button"
            >
              开始 {skillCount} 题
            </button>
            <button
              className="textAction centered"
              onClick={() => setShowSkillCount((value) => !value)}
              type="button"
            >
              {showSkillCount ? "收起设置" : "更多设置"}
            </button>
          </section>
        </div>
      )}

      {showDailySettings && (
        <div className="modalBackdrop" role="presentation">
          <section
            aria-labelledby="daily-settings-title"
            aria-modal="true"
            className="trainingStartSheet dailySettingsSheet"
            role="dialog"
          >
            <header>
              <div>
                <h2 id="daily-settings-title">设置日常训练</h2>
              </div>
              <button
                aria-label="关闭"
                className="sheetClose"
                onClick={() => setShowDailySettings(false)}
                type="button"
              >
                ×
              </button>
            </header>

            <div className="dailyAbilitySettings">
              {abilities.map((ability) => (
                <div className="dailyAbilitySetting" key={ability.id}>
                  <div className="dailyAbilityName">
                    <span className="abilitySymbol">{ability.symbol}</span>
                    <strong>{ability.label}</strong>
                  </div>
                  <div className="dailyDifficultyOptions">
                    <button
                      aria-pressed={!dailyDraft[ability.id]}
                      className={!dailyDraft[ability.id] ? "selected" : ""}
                      onClick={() =>
                        setDailyDraft((current) => {
                          const next = { ...current };
                          delete next[ability.id];
                          return next;
                        })
                      }
                      type="button"
                    >
                      关闭
                    </button>
                    {difficultyOptions.map((difficultyBand) => (
                      <button
                        aria-pressed={dailyDraft[ability.id] === difficultyBand}
                        className={
                          dailyDraft[ability.id] === difficultyBand
                            ? "selected"
                            : ""
                        }
                        key={difficultyBand}
                        onClick={() => {
                          setDailyError(false);
                          setDailyDraft((current) => ({
                            ...current,
                            [ability.id]: difficultyBand,
                          }));
                        }}
                        type="button"
                      >
                        {difficultyLabels[difficultyBand]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="countSettingRow dailyCountSetting">
              <span>每次</span>
              <div className="segmentedControl compact">
                {[10, 20].map((questionCount) => (
                  <button
                    aria-pressed={dailyCount === questionCount}
                    className={dailyCount === questionCount ? "selected" : ""}
                    key={questionCount}
                    onClick={() => setDailyCount(questionCount as 10 | 20)}
                    type="button"
                  >
                    {questionCount}题
                  </button>
                ))}
              </div>
            </div>

            {dailyError && (
              <p className="dailySettingsError" role="alert">
                至少选择一个练习项目。
              </p>
            )}
            <button
              className="primary sheetPrimary"
              onClick={saveDailySettings}
              type="button"
            >
              保存日常训练
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
