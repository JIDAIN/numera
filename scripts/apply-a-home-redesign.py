from pathlib import Path

page_path = Path("src/app/page.tsx")
text = page_path.read_text()

text = text.replace(
    'import { TrainingTypeSelector } from "@/components/TrainingTypeSelector";',
    'import { AHomeTraining } from "@/components/AHomeTraining";\nimport { ClassicTrainingSelector } from "@/components/ClassicTrainingSelector";',
)
text = text.replace(
    'import { createTrainingSession } from "@/lib/session";',
    'import { createTrainingSession } from "@/lib/session";\nimport { CanonicalAAbilityId } from "@/lib/a-abilities";\nimport {\n  DailyTrainingPlan,\n  dailyTrainingPlanFromQuestions,\n  generateDailyTrainingSet,\n} from "@/lib/a-training-plan";',
)

old_types = '''import {
  QuestionType,
  Subtype,
  TrainingSession,
  typeLabels,
  getSubtypeLabel,
} from "@/lib/types";'''
new_types = '''import {
  DifficultyBand,
  makeSkillDrillSubtype,
  QuestionType,
  Subtype,
  TrainingSession,
  typeLabels,
  getSubtypeLabel,
} from "@/lib/types";'''
if old_types not in text:
    raise SystemExit("types import block not found")
text = text.replace(old_types, new_types)

old_prompt = '''type ActiveSessionPrompt = {
  session: TrainingSession;
  afterDiscard: "startNew" | "stayHome" | "startPK";
  challenge?: PKChallenge;
};'''
new_prompt = '''type NewSessionLaunch = {
  questionType: QuestionType;
  subtype: Subtype;
  questionCount: number;
  questions?: TrainingSession["questions"];
  trainingMode?: TrainingSession["trainingMode"];
  primarySkillId?: TrainingSession["primarySkillId"];
  difficultyBand?: TrainingSession["difficultyBand"];
};

type ActiveSessionPrompt = {
  session: TrainingSession;
  afterDiscard: "startNew" | "stayHome" | "startPK";
  challenge?: PKChallenge;
  launch?: NewSessionLaunch;
};'''
if old_prompt not in text:
    raise SystemExit("active prompt block not found")
text = text.replace(old_prompt, new_prompt)

state_marker = '''  const [isQuestionCountDialogOpen, setIsQuestionCountDialogOpen] =
    useState(false);'''
state_replacement = state_marker + '''
  const [showMorePanel, setShowMorePanel] = useState(false);
  const [showClassicPanel, setShowClassicPanel] = useState(false);'''
if state_marker not in text:
    raise SystemExit("question count state marker not found")
text = text.replace(state_marker, state_replacement)

start_marker = text.index("  const beginNewSession = () => {")
confirm_marker = text.index("  const confirmQuestionCount = ({", start_marker)
new_start_block = '''  const beginNewSession = (launch?: NewSessionLaunch) => {
    const nextLaunch = launch ?? {
      questionType: type,
      subtype,
      questionCount: count,
    };
    if (!isValidQuestionCount(nextLaunch.questionCount)) {
      setStorageError("题量无效，请重新选择10或20题。");
      return;
    }
    try {
      const s = createTrainingSession({
        userId: user,
        ownerAccountId: identity?.id,
        questionType: nextLaunch.questionType,
        subtype: nextLaunch.subtype,
        questionCount: nextLaunch.questionCount,
        questions: nextLaunch.questions,
        trainingMode: nextLaunch.trainingMode,
        primarySkillId: nextLaunch.primarySkillId,
        difficultyBand: nextLaunch.difficultyBand,
        history,
      });
      sessionRef.current = s;
      setSession(s);
      setStorageError(null);
      setView("training");
    } catch (error) {
      setStorageError(
        error instanceof Error ? error.message : "创建训练失败，请稍后重试。",
      );
    }
  };
  const startConfiguredSession = async (launch: NewSessionLaunch) => {
    if (startInFlight.current) return;
    startInFlight.current = true;
    try {
      const activeSession =
        session?.status === "active" && session.ownerAccountId === identity?.id
          ? session
          : await readActive(identity?.id);
      if (activeSession) {
        setActiveSessionPrompt({
          session: activeSession,
          afterDiscard: "startNew",
          launch,
        });
        return;
      }
      beginNewSession(launch);
    } catch {
      setStorageError("读取本地训练记录失败，请刷新后重试。");
    } finally {
      startInFlight.current = false;
    }
  };
  const startASkill = (
    abilityId: CanonicalAAbilityId,
    difficultyBand: DifficultyBand,
    questionCount: 10 | 20,
  ) => {
    void startConfiguredSession({
      questionType: "skill_drill",
      subtype: makeSkillDrillSubtype(abilityId, difficultyBand),
      questionCount,
      primarySkillId: abilityId,
      difficultyBand,
      trainingMode: "skill",
    });
  };
  const startDailyPlan = (plan: DailyTrainingPlan) => {
    try {
      const questions = generateDailyTrainingSet(plan);
      void startConfiguredSession({
        questionType: "skill_drill",
        subtype: "daily_plan",
        questionCount: plan.questionCount,
        questions,
        trainingMode: "mixed",
      });
    } catch (error) {
      setStorageError(
        error instanceof Error ? error.message : "创建日常训练失败，请稍后重试。",
      );
    }
  };
'''
text = text[:start_marker] + new_start_block + text[confirm_marker:]

old_start = '''  const start = async () => {
    if (startInFlight.current) return;
    startInFlight.current = true;

    try {
      // Read immediately before creation instead of relying on the initial
      // page-load check. This catches a session created earlier in this tab
      // or saved by another tab before this click.
      const activeSession =
        session?.status === "active" && session.ownerAccountId === identity?.id
          ? session
          : await readActive(identity?.id);
      if (activeSession) {
        setActiveSessionPrompt({
          session: activeSession,
          afterDiscard: "startNew",
        });
        return;
      }
      beginNewSession();
    } catch {
      setStorageError("读取本地训练记录失败，请刷新后重试。");
    } finally {
      startInFlight.current = false;
    }
  };'''
new_start = '''  const start = () =>
    void startConfiguredSession({
      questionType: type,
      subtype,
      questionCount: count,
    });'''
if old_start not in text:
    raise SystemExit("legacy start block not found")
text = text.replace(old_start, new_start)

old_discard = '''    const {
      afterDiscard,
      challenge,
      session: activeSession,
    } = activeSessionPrompt;'''
new_discard = '''    const {
      afterDiscard,
      challenge,
      launch,
      session: activeSession,
    } = activeSessionPrompt;'''
if old_discard not in text:
    raise SystemExit("discard destructure not found")
text = text.replace(old_discard, new_discard)
text = text.replace(
    '    if (afterDiscard === "startNew") beginNewSession();',
    '    if (afterDiscard === "startNew") beginNewSession(launch);',
)

old_restart = '''      const replacement = createTrainingSession({
        userId: session.userId,
        ownerAccountId: session.ownerAccountId,
        questionType: session.questionType,
        subtype: session.subtype,
        questionCount: session.questionCount,
        history,
      });'''
new_restart = '''      const dailyPlan =
        session.subtype === "daily_plan"
          ? dailyTrainingPlanFromQuestions(
              session.questions,
              session.questionCount,
            )
          : undefined;
      const replacement = createTrainingSession({
        userId: session.userId,
        ownerAccountId: session.ownerAccountId,
        questionType: session.questionType,
        subtype: session.subtype,
        questionCount: session.questionCount,
        questions: dailyPlan ? generateDailyTrainingSet(dailyPlan) : undefined,
        trainingMode: dailyPlan ? "mixed" : session.trainingMode,
        primarySkillId: dailyPlan ? undefined : session.primarySkillId,
        difficultyBand: dailyPlan ? undefined : session.difficultyBand,
        history,
      });'''
if old_restart not in text:
    raise SystemExit("restart block not found")
text = text.replace(old_restart, new_restart)

home_start = text.index('      <header>\n        <div>\n          <h1>速算训练</h1>')
home_end = text.index('    </main>\n  );\n}', home_start)
new_home = '''      <header className="numeraHomeHeader">
        <h1>数感</h1>
      </header>
      <AccountPanel
        authResolved={authResolved}
        identity={identity}
        onIdentity={changeIdentity}
      />
      <AHomeTraining
        history={
          session?.status === "completed"
            ? [session, ...history.filter((item) => item.id !== session.id)]
            : history
        }
        onStartDaily={startDailyPlan}
        onStartSkill={startASkill}
        ownerAccountId={identity?.id}
        preferenceScope={identity?.id ?? `local-${user}`}
        userId={user}
      />
      {identity && unassignedHistory.length > 0 && (
        <section className="accountPanel">
          <p>
            此设备有 {unassignedHistory.length}{" "}
            条登录前本地记录，尚未归属任何账号。
          </p>
          <button
            onClick={async () => {
              await claimCompletedSessions(
                unassignedHistory.map((item) => item.id),
                identity.id,
              );
              await Promise.all(
                unassignedHistory.map((item) =>
                  syncCompleted({ ...item, ownerAccountId: identity.id }).catch(
                    () => false,
                  ),
                ),
              );
              setUnassignedHistory([]);
            }}
          >
            合并到当前{identity.role === "fish" ? "🐟" : "🐱"}账号
          </button>
          <button
            onClick={async () => {
              if (
                !window.confirm(
                  "确认仅从此设备移除这些未归属历史？云端数据不会变更。",
                )
              )
                return;
              await discardCompletedSessions(
                unassignedHistory.map((item) => item.id),
              );
              setUnassignedHistory([]);
            }}
          >
            丢弃本地历史
          </button>
        </section>
      )}
      {showMorePanel && (
        <section className="homeMorePanel" aria-label="更多功能">
          <div className="moreActionGrid">
            <button onClick={() => setView("stats")} type="button">
              我的成绩
            </button>
            <button onClick={() => setView("memory")} type="button">
              百分互换速记
            </button>
            <button onClick={() => setView("fractionMatch")} type="button">
              百分互换消消乐
            </button>
            <button onClick={() => setView("fractionMatchHistory")} type="button">
              消消乐历史
            </button>
          </div>
          <button
            className="classicTrainingToggle"
            onClick={() => setShowClassicPanel((value) => !value)}
            type="button"
          >
            经典训练
            <span>{showClassicPanel ? "收起 ↑" : "展开 ›"}</span>
          </button>
          {showClassicPanel && (
            <section className="classicTrainingPanel">
              <ClassicTrainingSelector
                onDivisionRuleChange={setSubtype}
                onSelect={(selectedType, selectedSubtype) => {
                  setType(selectedType);
                  setSubtype(selectedSubtype);
                  if (selectedType === "special_hundred_scaling_division")
                    setCount(STANDARD_QUESTION_COUNT);
                }}
                subtype={subtype}
                type={type}
              />
              <button
                aria-haspopup="dialog"
                className="classicCountButton"
                onClick={() => setIsQuestionCountDialogOpen(true)}
                type="button"
              >
                题量 · {count}题
              </button>
              <button className="primary classicStartButton" onClick={start}>
                开始经典训练
              </button>
            </section>
          )}
        </section>
      )}
      <nav className="homeBottomNav" aria-label="首页导航">
        <button aria-current="page" className="selected" type="button">
          训练
        </button>
        <button onClick={loadHistory} type="button">
          记录
        </button>
        <button className="pkHomeEntry" onClick={enterPK} type="button">
          PK
          {(() => {
            const pending = identity
              ? pkChallenges.filter(
                  (challenge) =>
                    challenge.opponentId === identity.id &&
                    challenge.status === "pending",
                ).length
              : 0;
            const shown = pending || unreadPKResults;
            return shown ? (
              <span
                className={`pkBadge ${pending ? "pkBadgeRed" : "pkBadgeBlue"}`}
              >
                {shown > 9 ? "9+" : shown}
              </span>
            ) : null;
          })()}
        </button>
        <button
          aria-expanded={showMorePanel}
          onClick={() => setShowMorePanel((value) => !value)}
          type="button"
        >
          更多
        </button>
      </nav>
      {isQuestionCountDialogOpen && (
        <QuestionCountDialog
          initialCount={count}
          lastCustomCount={lastCustomCount}
          onCancel={() => setIsQuestionCountDialogOpen(false)}
          onConfirm={confirmQuestionCount}
        />
      )}
'''
text = text[:home_start] + new_home + text[home_end:]
page_path.write_text(text)

types_path = Path("src/lib/types.ts")
types_text = types_path.read_text()
if '  | "daily_plan";' not in types_text:
    types_text = types_text.replace(
        '  | "skill_drill";\nexport type SkillDrillSubtype',
        '  | "skill_drill"\n  | "daily_plan";\nexport type SkillDrillSubtype',
    )
if 'daily_plan: "日常训练"' not in types_text:
    types_text = types_text.replace(
        '  skill_drill: "专项训练",',
        '  skill_drill: "专项训练",\n  daily_plan: "日常训练",',
    )
types_path.write_text(types_text)

css_path = Path("src/app/globals.css")
css = css_path.read_text()
marker = "/* A V1 user-facing training home */"
if marker not in css:
    css += r'''

/* A V1 user-facing training home */
.numeraHomeHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.numeraHomeHeader h1 {
  margin: 0;
  font-size: 30px;
}
.aTrainingHome {
  display: grid;
  gap: 18px;
}
.eyebrow {
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}
.dailyTrainingCard {
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--card);
  box-shadow: 0 8px 24px rgb(31 93 73 / 6%);
}
.dailyTrainingHeading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.dailyTrainingHeading h2 {
  margin: 3px 0 0;
  font-size: 21px;
}
.textAction {
  min-height: 36px;
  padding: 6px 8px;
  background: transparent;
  color: var(--green-700);
  font-size: 13px;
}
.textAction.centered {
  display: block;
  margin: 7px auto 0;
}
.dailyPlanChips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 14px 0;
}
.dailyPlanChips span {
  padding: 6px 9px;
  border-radius: 999px;
  background: var(--green-50);
  color: var(--green-900);
  font-size: 12px;
  font-weight: 600;
}
.dailyStartButton,
.sheetPrimary {
  width: 100%;
  min-height: 50px;
}
.dailyEmptyState {
  display: grid;
  width: 100%;
  gap: 3px;
  margin-top: 13px;
  padding: 14px;
  border: 1px dashed #abd8c0;
  background: var(--green-50);
  text-align: left;
}
.dailyEmptyState strong {
  font-size: 15px;
}
.dailyEmptyState span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
}
.recentTrainingRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 4px;
  border-bottom: 1px solid var(--line);
}
.recentTrainingRow > div {
  display: grid;
  gap: 4px;
}
.recentTrainingRow strong {
  font-size: 15px;
}
.recentTrainingRow button {
  min-height: 38px;
  padding: 7px 11px;
  background: transparent;
  color: var(--green-700);
  font-size: 13px;
}
.allPracticeSection h2 {
  margin: 0 0 10px;
  font-size: 17px;
}
.abilityQuickGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}
.abilityQuickCard {
  display: flex;
  min-height: 68px;
  align-items: center;
  gap: 10px;
  padding: 10px 11px;
  border: 1px solid var(--line);
  background: var(--card);
  text-align: left;
}
.abilitySymbol {
  display: grid;
  min-width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 11px;
  background: var(--green-100);
  color: var(--green-900);
  font-size: 16px;
  font-weight: 800;
}
.abilitySymbol.large {
  min-width: 46px;
  height: 46px;
  border-radius: 14px;
  font-size: 18px;
}
.abilityCopy {
  display: grid;
  min-width: 0;
  gap: 2px;
}
.abilityCopy strong {
  font-size: 14px;
}
.abilityCopy small {
  overflow: hidden;
  color: var(--muted);
  font-size: 11px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.trainingStartSheet {
  width: min(100%, 520px);
  max-height: min(88dvh, 760px);
  overflow: auto;
  padding: 18px;
  border-radius: 24px;
  background: var(--card);
  box-shadow: 0 20px 60px rgb(24 59 49 / 24%);
}
.trainingStartSheet > header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.trainingStartSheet > header > div {
  display: flex;
  align-items: center;
  gap: 10px;
}
.trainingStartSheet h2 {
  margin: 0;
  font-size: 21px;
}
.trainingStartSheet header p {
  margin: 3px 0 0;
  color: var(--muted);
  font-size: 12px;
}
.sheetClose {
  min-width: 38px;
  min-height: 38px;
  padding: 0;
  border-radius: 50%;
  background: var(--green-50);
  font-size: 20px;
}
.segmentedControl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
  margin-bottom: 14px;
}
.segmentedControl button {
  min-height: 44px;
  border: 1px solid var(--line);
  background: var(--card);
}
.segmentedControl button.selected,
.dailyDifficultyOptions button.selected {
  border-color: #8fc9aa;
  outline: 0;
  background: var(--green-100) !important;
}
.segmentedControl.compact {
  margin: 0;
}
.countSettingRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 2px 0 14px;
}
.countSettingRow > span {
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}
.countSettingRow .segmentedControl {
  width: min(220px, 60%);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.dailySettingsSheet {
  max-height: min(92dvh, 860px);
}
.dailyAbilitySettings {
  display: grid;
  gap: 10px;
}
.dailyAbilitySetting {
  display: grid;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
}
.dailyAbilityName {
  display: flex;
  align-items: center;
  gap: 9px;
}
.dailyAbilityName .abilitySymbol {
  min-width: 30px;
  height: 30px;
  border-radius: 9px;
  font-size: 13px;
}
.dailyDifficultyOptions {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}
.dailyDifficultyOptions button {
  min-height: 36px;
  padding: 6px 4px;
  border: 1px solid var(--line);
  background: var(--card);
  font-size: 12px;
}
.dailyCountSetting {
  margin-top: 14px;
}
.dailySettingsError {
  margin: 0 0 10px;
  color: #9a342b;
  font-size: 13px;
}
.homeMorePanel {
  display: grid;
  gap: 10px;
  margin: 18px 0 8px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--card);
}
.moreActionGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.moreActionGrid button,
.classicTrainingToggle,
.classicCountButton {
  min-height: 46px;
  border: 1px solid var(--line);
  background: var(--green-50);
}
.classicTrainingToggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.classicTrainingToggle span {
  color: var(--green-700);
  font-size: 12px;
}
.classicTrainingPanel {
  display: grid;
  gap: 10px;
  padding-top: 4px;
}
.classicCountButton,
.classicStartButton {
  width: 100%;
}
.homeBottomNav {
  position: sticky;
  bottom: max(8px, env(safe-area-inset-bottom));
  z-index: 4;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  margin: 20px 0 0;
  padding: 7px;
  border: 1px solid rgb(216 235 225 / 90%);
  border-radius: 18px;
  background: rgb(255 255 255 / 94%);
  box-shadow: 0 10px 28px rgb(31 93 73 / 12%);
  backdrop-filter: blur(12px);
}
.homeBottomNav button {
  position: relative;
  min-height: 44px;
  padding: 7px 5px;
  background: transparent;
  font-size: 13px;
}
.homeBottomNav button.selected {
  outline: 0;
  background: var(--green-100) !important;
}
@media (max-width: 390px) {
  .abilityQuickGrid {
    gap: 7px;
  }
  .abilityQuickCard {
    padding: 9px;
  }
  .abilitySymbol {
    min-width: 32px;
    height: 32px;
  }
  .dailyDifficultyOptions {
    gap: 4px;
  }
  .dailyDifficultyOptions button {
    font-size: 11px;
  }
}
'''
css_path.write_text(css)
