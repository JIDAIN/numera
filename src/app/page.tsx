"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  DifficultyBand,
  makeSkillDrillSubtype,
  parseSkillDrillSubtype,
  QuestionType,
  Subtype,
  TrainingSession,
  typeLabels,
  getSubtypeLabel,
} from "@/lib/types";
import {
  discardSession,
  claimCompletedSessions,
  discardCompletedSessions,
  readActive,
  readCompleted,
  saveSession,
} from "@/lib/storage";
import { AccountPanel } from "@/components/AccountPanel";
import {
  CloudIdentity,
  acknowledgePKResults,
  createPKChallenge,
  currentIdentity,
  readCloudHistory,
  readPKChallenges,
  syncCompleted,
  submitPKResult,
  unreadPKResultIds,
} from "@/lib/cloud";
import { PKChallenge } from "@/lib/pk";
import { PKDetails } from "@/components/PKDetails";
import { PKPage } from "@/components/PKPage";
import { NumberPad } from "@/components/NumberPad";
import { ScratchCanvas } from "@/components/ScratchCanvas";
import { HistoryCharts } from "@/components/HistoryCharts";
import { SkillInsights } from "@/components/SkillInsights";
import { HistoryList } from "@/components/HistoryList";
import { PersonalDataExport } from "@/components/PersonalDataExport";
import {
  QuestionDetails,
  RatingBreakdown,
  SessionDetails,
} from "@/components/SessionDetails";
import { C3SessionInsights } from "@/components/C3SessionInsights";
import { C4SessionInsights } from "@/components/C4SessionInsights";
import { ActiveSessionDialog } from "@/components/ActiveSessionDialog";
import { AHomeTraining } from "@/components/AHomeTraining";
import { C3HomeTraining } from "@/components/C3HomeTraining";
import { C4HomeTraining } from "@/components/C4HomeTraining";
import { ClassicTrainingSelector } from "@/components/ClassicTrainingSelector";
import { StructuredStepTraining } from "@/components/StructuredStepTraining";
import { StructuredSingleAnswerTraining } from "@/components/StructuredSingleAnswerTraining";
import { C3ComparisonTraining } from "@/components/C3ComparisonTraining";
import { FractionPercentMemory } from "@/components/FractionPercentMemory";
import { FractionPercentMatchGame } from "@/components/FractionPercentMatchGame";
import { FractionPercentMatchHistory } from "@/components/FractionPercentMatchHistory";
import { FractionPercentMatchPKPage } from "@/components/FractionPercentMatchPKPage";
import { FractionPercentMatchRecord } from "@/lib/fraction-percent-match";
import { saveMatchRecord } from "@/lib/fraction-percent-match-storage";
import { readMatchRecords } from "@/lib/fraction-percent-match-storage";
import {
  readMatchHistory,
  syncOwnedMatchRecord,
} from "@/lib/fraction-percent-match-cloud";
import {
  createMatchPKChallenge,
  readMatchPKChallenges,
  submitMatchPKResult,
} from "@/lib/fraction-percent-match-pk-cloud";
import { FractionPercentMatchPKChallenge } from "@/lib/fraction-percent-match-pk";
import {
  QuestionCountDialog,
  QuestionCountSelection,
} from "@/components/QuestionCountDialog";
import {
  DEFAULT_CUSTOM_QUESTION_COUNT,
  isValidNewTrainingQuestionCount,
  isValidQuestionCount,
  STANDARD_QUESTION_COUNT,
} from "@/lib/question-count";
import { createRatingSnapshot, sessionMetrics } from "@/lib/statistics";
import {
  currentElapsedMs,
  pauseSessionTimer,
  resumeSessionTimer,
  suspendUnverifiedTimer,
} from "@/lib/timer";
import { createTrainingSession, recreateTrainingSession } from "@/lib/session";
import {
  getTrainingDisplayDescriptor,
  isSessionPkEligible,
} from "@/lib/training-definition";
import { resolveTrainingRenderer } from "@/lib/training-renderer";
import { CanonicalAAbilityId, isCanonicalAAbilityId } from "@/lib/a-abilities";
import {
  DailyTrainingPlan,
  generateDailyTrainingSet,
} from "@/lib/a-training-plan";
import { submitCurrentAnswer, submitCurrentStep } from "@/lib/training";
import {
  C4TrainingConfig,
  decodeC4Preset,
  encodeC4Preset,
  generateC4Set,
} from "@/lib/c4-training";
import { generateC3Set } from "@/lib/c3-training";
const defaultSubtype = (t: QuestionType): Subtype =>
  t === "three_by_two_division"
    ? "quotient_two"
    : t === "multi_digit_division"
      ? "quotient_two"
      : t === "fraction_percent_conversion"
        ? "fraction_to_percent"
        : t === "fraction_comparison"
          ? "comparison"
          : "standard";
type NewSessionLaunch = {
  questionType: QuestionType;
  subtype: Subtype;
  questionCount: number;
  questions?: TrainingSession["questions"];
  trainingMode?: TrainingSession["trainingMode"];
  primarySkillId?: TrainingSession["primarySkillId"];
  difficultyBand?: TrainingSession["difficultyBand"];
  cProject?: TrainingSession["cProject"];
  cTrainingMode?: TrainingSession["cTrainingMode"];
  cPreset?: TrainingSession["cPreset"];
};

type ActiveSessionPrompt = {
  session: TrainingSession;
  afterDiscard: "startNew" | "stayHome" | "startPK";
  challenge?: PKChallenge;
  launch?: NewSessionLaunch;
};

function FractionComparisonDisplay({
  data,
  selectedRelation,
  fallbackPrompt,
}: {
  data: TrainingSession["questions"][number]["data"];
  selectedRelation: string;
  fallbackPrompt: string;
}) {
  const values = [data.a, data.b, data.c, data.d];
  if (!values.every((value) => typeof value === "number")) {
    return <h1>{fallbackPrompt}</h1>;
  }

  const [leftNumerator, leftDenominator, rightNumerator, rightDenominator] =
    values as number[];

  return (
    <div className="fractionComparisonQuestion" aria-label={fallbackPrompt}>
      <span className="verticalFraction">
        <span>{leftNumerator}</span>
        <span>{leftDenominator}</span>
      </span>
      <strong aria-label="当前选择">{selectedRelation || "?"}</strong>
      <span className="verticalFraction">
        <span>{rightNumerator}</span>
        <span>{rightDenominator}</span>
      </span>
    </div>
  );
}

type FractionEntryPart = "numerator" | "denominator";
type View =
  | "home"
  | "training"
  | "result"
  | "history"
  | "stats"
  | "historyDetail"
  | "pk"
  | "pkDetail"
  | "memory"
  | "fractionMatch"
  | "fractionMatchHistory"
  | "fractionMatchPK"
  | "fractionMatchPKPlay";

function locationRoute(): { view: View; id?: string } {
  if (typeof window === "undefined") return { view: "home" };
  const parts = window.location.hash
    .replace(/^#\/?/, "")
    .split("/")
    .filter(Boolean);
  if (parts[0] === "training") return { view: "training" };
  if (parts[0] === "result" && parts[1])
    return { view: "result", id: parts[1] };
  if (parts[0] === "history" && parts[1])
    return { view: "historyDetail", id: parts[1] };
  if (parts[0] === "history") return { view: "history" };
  if (parts[0] === "stats") return { view: "stats" };
  if (parts[0] === "pk" && parts[1]) return { view: "pkDetail", id: parts[1] };
  if (parts[0] === "pk") return { view: "pk" };
  if (parts[0] === "memory") return { view: "memory" };
  if (parts[0] === "fraction-match" && parts[1] === "pk" && parts[2])
    return { view: "fractionMatchPKPlay", id: parts[2] };
  if (parts[0] === "fraction-match" && parts[1] === "pk")
    return { view: "fractionMatchPK" };
  if (parts[0] === "fraction-match" && parts[1] === "history")
    return { view: "fractionMatchHistory" };
  if (parts[0] === "fraction-match") return { view: "fractionMatch" };
  return { view: "home" };
}

function locationHash(view: View, id?: string) {
  if (view === "training") return "#/training";
  if (view === "result" && id) return `#/result/${id}`;
  if (view === "historyDetail" && id) return `#/history/${id}`;
  if (view === "history") return "#/history";
  if (view === "stats") return "#/stats";
  if (view === "pkDetail" && id) return `#/pk/${id}`;
  if (view === "pk") return "#/pk";
  if (view === "memory") return "#/memory";
  if (view === "fractionMatchHistory") return "#/fraction-match/history";
  if (view === "fractionMatch") return "#/fraction-match";
  if (view === "fractionMatchPK") return "#/fraction-match/pk";
  if (view === "fractionMatchPKPlay" && id) return `#/fraction-match/pk/${id}`;
  return "#/";
}

function mergeHistory(local: TrainingSession[], cloud: TrainingSession[]) {
  return [
    ...local,
    ...cloud.filter(
      (cloudSession) =>
        !local.some((localSession) => localSession.id === cloudSession.id),
    ),
  ];
}

function historyScope(identity?: CloudIdentity) {
  return identity?.id ?? "local-unassigned";
}

function traceDataLoad(event: string, scope: string, details: object = {}) {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.NODE_ENV !== "test" &&
    typeof performance !== "undefined"
  )
    console.info(
      "[data-load]",
      JSON.stringify({
        event,
        scope,
        atMs: Math.round(performance.now()),
        ...details,
      }),
    );
}

function RefreshNotice({ message }: { message?: string }) {
  return message ? <p className="dataRefreshNotice">{message}</p> : null;
}

function splitFractionAnswer(value: string): [string, string] {
  const [numerator = "", denominator = ""] = value.split("/", 2);
  return [numerator, denominator];
}

function FractionConversionDisplay({
  data,
  subtype,
  value,
  activePart,
  onSelectPart,
  fallbackPrompt,
}: {
  data: TrainingSession["questions"][number]["data"];
  subtype: Subtype;
  value: string;
  activePart: FractionEntryPart;
  onSelectPart: (part: FractionEntryPart) => void;
  fallbackPrompt: string;
}) {
  const numerator = data.numerator;
  const denominator = data.denominator;
  if (typeof numerator !== "number" || typeof denominator !== "number") {
    return <h1>{fallbackPrompt}</h1>;
  }

  if (subtype === "fraction_to_percent") {
    return (
      <div className="fractionConversionQuestion" aria-label={fallbackPrompt}>
        <span>
          {numerator}/{denominator} ≈
        </span>
        <strong className="percentAnswerSlot">{value || "___"}</strong>
        <span>%</span>
      </div>
    );
  }

  const [answerNumerator, answerDenominator] = splitFractionAnswer(value);
  const percent =
    typeof data.percentAnswer === "string"
      ? data.percentAnswer
      : typeof data.percent === "number"
        ? String(data.percent)
        : String((numerator / denominator) * 100);

  return (
    <div className="fractionConversionQuestion" aria-label={fallbackPrompt}>
      <span>{percent}% ≈</span>
      <span className="fractionAnswerSlots">
        <button
          aria-label="输入分子"
          aria-pressed={activePart === "numerator"}
          className={activePart === "numerator" ? "active" : ""}
          onClick={() => onSelectPart("numerator")}
        >
          {answerNumerator || "\u00a0"}
        </button>
        <span className="fractionAnswerLine" aria-hidden="true" />
        <button
          aria-label="输入分母"
          aria-pressed={activePart === "denominator"}
          className={activePart === "denominator" ? "active" : ""}
          onClick={() => onSelectPart("denominator")}
        >
          {answerDenominator || "\u00a0"}
        </button>
      </span>
    </div>
  );
}

export default function Home() {
  const [view, setViewState] = useState<View>(() => locationRoute().view);
  const [routeRecordId, setRouteRecordId] = useState<string | undefined>(
    () => locationRoute().id,
  );
  const [user, setUser] = useState("fish");
  const [identity, setIdentity] = useState<CloudIdentity>();
  const [authResolved, setAuthResolved] = useState(false);
  const [unassignedHistory, setUnassignedHistory] = useState<TrainingSession[]>(
    [],
  );
  const [type, setType] = useState<QuestionType>("two_digit_add_subtract");
  const [subtype, setSubtype] = useState<Subtype>(
    defaultSubtype("two_digit_add_subtract"),
  );
  const [count, setCount] = useState(STANDARD_QUESTION_COUNT);
  const [lastCustomCount, setLastCustomCount] = useState(
    DEFAULT_CUSTOM_QUESTION_COUNT,
  );
  const [isQuestionCountDialogOpen, setIsQuestionCountDialogOpen] =
    useState(false);
  const [showMorePanel, setShowMorePanel] = useState(false);
  const [showClassicPanel, setShowClassicPanel] = useState(false);
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [now, setNow] = useState(Date.now());
  const [scratch, setScratch] = useState(false);
  const [fractionEntryPart, setFractionEntryPart] =
    useState<FractionEntryPart>("numerator");
  const [hasAutoAdvancedFractionEntry, setHasAutoAdvancedFractionEntry] =
    useState(false);
  const [history, setHistory] = useState<TrainingSession[]>([]);
  const [pkChallenges, setPKChallenges] = useState<PKChallenge[]>([]);
  const [unreadPKResults, setUnreadPKResults] = useState(0);
  const [selectedPKChallenge, setSelectedPKChallenge] =
    useState<PKChallenge | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [historyRefreshing, setHistoryRefreshing] = useState(false);
  const [historyRefreshError, setHistoryRefreshError] = useState<string>();
  const [pkRefreshing, setPKRefreshing] = useState(false);
  const [pkRefreshError, setPKRefreshError] = useState<string>();
  const [selectedHistorySession, setSelectedHistorySession] =
    useState<TrainingSession | null>(null);
  const [activeSessionPrompt, setActiveSessionPrompt] =
    useState<ActiveSessionPrompt | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  // React state updates are asynchronous. This ref closes the small gap in
  // which two rapid taps could both read IndexedDB before the first tap has
  // entered the training view.
  const startInFlight = useRef(false);
  const restartInFlight = useRef(false);
  const sessionRef = useRef<TrainingSession | null>(null);
  const viewRef = useRef(view);
  const identityRef = useRef<CloudIdentity | undefined>(undefined);
  const historyCacheRef = useRef(new Map<string, TrainingSession[]>());
  const pkCacheRef = useRef(new Map<string, PKChallenge[]>());
  const historyRefreshInFlight = useRef(new Map<string, Promise<void>>());
  const pkRefreshInFlight = useRef(new Map<string, Promise<void>>());
  const [isRestartingTraining, setIsRestartingTraining] = useState(false);
  const [matchPKChallenges, setMatchPKChallenges] = useState<
    FractionPercentMatchPKChallenge[]
  >([]);
  const [matchRecords, setMatchRecords] = useState<
    FractionPercentMatchRecord[]
  >([]);
  const refreshMatchPKData = useCallback(async () => {
    const requestIdentity = identityRef.current;
    if (!requestIdentity) return;
    try {
      const [challenges, local] = await Promise.all([
        readMatchPKChallenges(),
        readMatchRecords(requestIdentity.id),
      ]);
      if (identityRef.current?.id !== requestIdentity.id) return;
      setMatchPKChallenges(challenges);
      setMatchRecords(local);
      void readMatchHistory()
        .then((cloud) => {
          if (identityRef.current?.id !== requestIdentity.id) return;
          setMatchRecords([
            ...local,
            ...cloud.filter(
              (item) => !local.some((saved) => saved.id === item.id),
            ),
          ]);
        })
        .catch(() => undefined);
    } catch {
      if (identityRef.current?.id === requestIdentity.id)
        setStorageError("消消乐PK读取失败，请稍后重试。");
    }
  }, []);
  const completeFractionMatch = useCallback(
    async (record: FractionPercentMatchRecord) => {
      await saveMatchRecord(record);
      const result = await syncOwnedMatchRecord(
        record,
        identityRef.current?.id,
      );
      if (result.ok) await saveMatchRecord(result.record);
      else await saveMatchRecord({ ...record, syncStatus: "failed" });
      return {
        localSaved: true,
        cloudSynced: result.ok,
        record: result.ok
          ? result.record
          : { ...record, syncStatus: "failed" as const },
      };
    },
    [],
  );
  useEffect(() => {
    if (
      (view === "fractionMatchPK" || view === "fractionMatchPKPlay") &&
      identityRef.current
    )
      void refreshMatchPKData();
  }, [view, identity?.id, refreshMatchPKData]);
  const navigate = (next: View, id?: string, replace = false) => {
    if (next === "result" || next === "historyDetail" || next === "pkDetail")
      setRouteLoading(true);
    traceDataLoad("navigate", historyScope(identityRef.current), {
      next,
      hasHistoryCache: historyCacheRef.current.has(
        historyScope(identityRef.current),
      ),
      hasPKCache: pkCacheRef.current.has(historyScope(identityRef.current)),
    });
    setRouteRecordId(id);
    setViewState(next);
    if (typeof window !== "undefined")
      window.history[replace ? "replaceState" : "pushState"](
        {},
        "",
        locationHash(next, id),
      );
  };
  const setView = (next: View) => navigate(next);
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(i);
  }, []);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  useEffect(() => {
    identityRef.current = identity;
  }, [identity]);
  useEffect(() => {
    currentIdentity()
      .then((next) => {
        setIdentity(next);
        if (next) setUser(next.role);
      })
      .catch(() => undefined)
      .finally(() => setAuthResolved(true));
  }, []);
  useEffect(() => {
    if (!authResolved) return;
    let cancelled = false;
    readActive(identity?.id)
      .then((activeSession) => {
        if (!activeSession || cancelled) return;
        // Recovery never continues an old running segment. This also repairs
        // active sessions saved by versions that did not pause on page exit.
        const pausedSession = suspendUnverifiedTimer(activeSession);
        if (pausedSession !== activeSession) void saveSession(pausedSession);
        if (locationRoute().view === "training") {
          const resumed = resumeSessionTimer(pausedSession);
          sessionRef.current = resumed;
          setSession(resumed);
          setViewState("training");
          return;
        }
        setActiveSessionPrompt({
          session: pausedSession,
          afterDiscard: "startNew",
        });
      })
      .catch(() => setStorageError("本地训练记录读取失败，请刷新后重试。"));
    return () => {
      cancelled = true;
    };
  }, [authResolved, identity?.id]);
  useEffect(() => {
    const onHashChange = () => {
      const next = locationRoute();
      setRouteRecordId(next.id);
      setViewState(next.view);
    };
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("popstate", onHashChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("popstate", onHashChange);
    };
  }, []);
  useEffect(() => {
    if (session?.status === "active") {
      saveSession(session).catch(() =>
        setStorageError("训练暂存失败，请保持页面打开并刷新后重试。"),
      );
    }
  }, [session]);
  useEffect(() => {
    const pause = () => {
      const activeSession = sessionRef.current;
      if (!activeSession || activeSession.status !== "active") return;
      const pausedSession = pauseSessionTimer(activeSession);
      if (pausedSession === activeSession) return;
      sessionRef.current = pausedSession;
      setSession(pausedSession);
      // pagehide/freeze can end JavaScript immediately; save in this handler
      // instead of waiting for React's follow-up effect.
      void saveSession(pausedSession).catch(() =>
        setStorageError("训练暂存失败，请保持页面打开并刷新后重试。"),
      );
    };
    const resume = () => {
      const activeSession = sessionRef.current;
      if (
        !activeSession ||
        activeSession.status !== "active" ||
        viewRef.current !== "training" ||
        document.hidden
      )
        return;
      const resumedSession = resumeSessionTimer(activeSession);
      if (resumedSession === activeSession) return;
      sessionRef.current = resumedSession;
      setSession(resumedSession);
    };
    const onVisibilityChange = () => (document.hidden ? pause() : resume());
    // A back/forward navigation can enter BFCache without first delivering a
    // visibility transition on some mobile browsers. pagehide is primary;
    // these navigation/unload events are defensive equivalents.
    const onNavigationAway = () => pause();
    const onPageShow = () => {
      const activeSession = sessionRef.current;
      if (activeSession?.status === "active") {
        // If pagehide's async write was interrupted, do not calculate the
        // BFCache/navigation gap from its stale runningSince timestamp.
        const suspended = suspendUnverifiedTimer(activeSession);
        sessionRef.current = suspended;
        setSession(suspended);
      }
      resume();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("freeze", pause);
    window.addEventListener("pagehide", pause);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("popstate", onNavigationAway);
    window.addEventListener("hashchange", onNavigationAway);
    window.addEventListener("beforeunload", onNavigationAway);
    window.addEventListener("blur", pause);
    window.addEventListener("focus", resume);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("freeze", pause);
      window.removeEventListener("pagehide", pause);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("popstate", onNavigationAway);
      window.removeEventListener("hashchange", onNavigationAway);
      window.removeEventListener("beforeunload", onNavigationAway);
      window.removeEventListener("blur", pause);
      window.removeEventListener("focus", resume);
    };
  }, []);
  const elapsed = session ? currentElapsedMs(session, now) : 0;
  const current = session?.questions[session.currentIndex];
  const currentRenderer = current
    ? resolveTrainingRenderer(current)
    : undefined;
  useEffect(() => {
    setFractionEntryPart("numerator");
    setHasAutoAdvancedFractionEntry(false);
  }, [current?.id]);
  useEffect(() => {
    if (view !== "training" || session?.status !== "completed") return;
    // Some mobile browsers can restore the former training hash while the
    // final answer is being committed. A completed in-memory session is the
    // authoritative business state, so repair the route instead of showing
    // the missing-active-session error.
    setRouteRecordId(session.id);
    setRouteLoading(false);
    setViewState("result");
    window.history.replaceState({}, "", locationHash("result", session.id));
  }, [session?.id, session?.status, view]);
  const beginNewSession = (launch?: NewSessionLaunch) => {
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
        cProject: nextLaunch.cProject,
        cTrainingMode: nextLaunch.cTrainingMode,
        cPreset: nextLaunch.cPreset,
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
  const startC3 = (difficultyBand: DifficultyBand) => {
    try {
      const questions = generateC3Set(difficultyBand);
      void startConfiguredSession({
        questionType: "c_training",
        subtype: "c_task",
        questionCount: 20,
        questions,
        trainingMode: "c_task",
        difficultyBand,
        cProject: "C3",
        cTrainingMode: "specialty",
      });
    } catch (error) {
      setStorageError(
        error instanceof Error
          ? error.message
          : "创建 C3 训练失败，请稍后重试。",
      );
    }
  };

  const startC4 = (config: C4TrainingConfig) => {
    try {
      const questions = generateC4Set(config);
      void startConfiguredSession({
        questionType: "c_training",
        subtype: "c_task",
        questionCount: 20,
        questions,
        trainingMode: "c_task",
        difficultyBand: config.difficultyBand,
        cProject: "C4",
        cTrainingMode: "specialty",
        cPreset: encodeC4Preset(config),
      });
    } catch (error) {
      setStorageError(
        error instanceof Error
          ? error.message
          : "创建 C4 训练失败，请稍后重试。",
      );
    }
  };

  const repeatSpecialty = (source: TrainingSession) => {
    if (source.trainingSource === "pk" || source.status !== "completed") return;

    if (source.questionType === "skill_drill") {
      const encoded = parseSkillDrillSubtype(source.subtype);
      const abilityId = source.primarySkillId ?? encoded?.skillId;
      const difficultyBand =
        source.difficultyBand ?? encoded?.difficultyBand ?? "L2";
      if (
        isCanonicalAAbilityId(abilityId) &&
        isValidNewTrainingQuestionCount(source.questionCount)
      ) {
        startASkill(abilityId, difficultyBand, source.questionCount);
        return;
      }
    }

    if (source.cProject === "C3" && source.difficultyBand) {
      startC3(source.difficultyBand);
      return;
    }

    if (source.cProject === "C4" && source.difficultyBand) {
      const config = decodeC4Preset(source.difficultyBand, source.cPreset);
      if (config) startC4(config);
    }
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
        error instanceof Error
          ? error.message
          : "创建日常训练失败，请稍后重试。",
      );
    }
  };
  const confirmQuestionCount = ({
    count: selectedCount,
    mode,
  }: QuestionCountSelection) => {
    setCount(selectedCount);
    if (mode === "custom") setLastCustomCount(selectedCount);
    setIsQuestionCountDialogOpen(false);
  };
  const start = () =>
    void startConfiguredSession({
      questionType: type,
      subtype,
      questionCount: count,
    });
  const changeIdentity = (next?: CloudIdentity) => {
    const activeSession = sessionRef.current;
    if (activeSession?.status === "active") {
      const pausedSession = pauseSessionTimer(activeSession);
      sessionRef.current = pausedSession;
      void saveSession(pausedSession).catch(() =>
        setStorageError("训练暂存失败，请保持页面打开并刷新后重试。"),
      );
    }
    // A prompt/session from the previous account must never be continued,
    // discarded, or overwritten after an account switch.
    setSession(null);
    sessionRef.current = null;
    setActiveSessionPrompt(null);
    setIdentity(next);
    setUser(next?.role ?? "fish");
  };
  const continueActiveSession = () => {
    if (!activeSessionPrompt) return;
    const resumedSession = resumeSessionTimer(activeSessionPrompt.session);
    sessionRef.current = resumedSession;
    setSession(resumedSession);
    setActiveSessionPrompt(null);
    setView("training");
  };
  const discardActiveSession = async () => {
    if (!activeSessionPrompt) return;
    const {
      afterDiscard,
      challenge,
      launch,
      session: activeSession,
    } = activeSessionPrompt;
    await discardSession(activeSession.id);
    setSession(null);
    sessionRef.current = null;
    setActiveSessionPrompt(null);
    if (afterDiscard === "startNew") beginNewSession(launch);
    if (afterDiscard === "startPK" && challenge)
      void startPKChallenge(challenge);
  };
  const endActiveSession = async () => {
    if (!activeSessionPrompt) return;
    const activeId = activeSessionPrompt.session.id;
    try {
      await discardSession(activeId);
      if (sessionRef.current?.id === activeId) {
        sessionRef.current = null;
        setSession(null);
      }
      setActiveSessionPrompt(null);
    } catch {
      setStorageError("结束原训练失败，请稍后重试。");
    }
  };
  const submitSession = (activeSession: TrainingSession) => {
    const activeQuestion = activeSession.questions[activeSession.currentIndex];
    const submittedAt = Date.now();
    const next =
      activeQuestion?.inputKind === "steps"
        ? submitCurrentStep(activeSession, elapsed, scratch, submittedAt)
        : submitCurrentAnswer(activeSession, elapsed, scratch, submittedAt);
    if (next === activeSession) return;
    if (next.status === "completed") {
      const completed = {
        ...next,
        rating: createRatingSnapshot(next),
        syncStatus:
          identity && next.ownerAccountId === identity.id
            ? ("syncing" as const)
            : ("not_synced" as const),
        pkSyncStatus: next.pkChallengeId ? ("syncing" as const) : undefined,
      };
      // Completion and mobile lifecycle events can occur in the same event
      // turn. Update the imperative lifecycle source before React renders so
      // pagehide/blur cannot pause and persist the just-finished run as active.
      sessionRef.current = completed;
      setSession(completed);
      const localSave = saveSession(completed);
      localSave.catch(() =>
        setStorageError("本次训练已完成，但本地保存失败，请刷新后重试。"),
      );
      if (identity && completed.ownerAccountId === identity.id) {
        localSave
          .then(() => syncCompleted(completed))
          .then(
            async () => {
              if (completed.pkChallengeId) {
                await submitPKResult(completed.pkChallengeId, completed.id);
              }
              const synced = {
                ...completed,
                syncStatus: "synced" as const,
                syncedAt: Date.now(),
                pkSyncStatus: completed.pkChallengeId
                  ? ("synced" as const)
                  : undefined,
              };
              setSession(synced);
              await saveSession(synced);
              if (completed.pkChallengeId) await refreshPK();
            },
            () => {
              const failed = { ...completed, syncStatus: "failed" as const };
              setSession(failed);
              return saveSession({
                ...failed,
                pkSyncStatus: completed.pkChallengeId ? "failed" : undefined,
              });
            },
          )
          .catch(async () => {
            const failed = {
              ...completed,
              syncStatus: "failed" as const,
              pkSyncStatus: completed.pkChallengeId
                ? ("failed" as const)
                : undefined,
            };
            setSession(failed);
            await saveSession(failed);
            setStorageError("本地已保存；云端同步失败，可稍后在历史中重试。");
          });
      }
      navigate("result", completed.id);
    } else setSession(next);
    setScratch(false);
  };
  const submit = () => {
    if (!session) return;
    submitSession(session);
  };
  const restartTraining = async () => {
    if (!session || restartInFlight.current) return;
    restartInFlight.current = true;
    setIsRestartingTraining(true);

    try {
      // Reproduce from the session's frozen launch contract. Older sessions
      // are upgraded through recreateTrainingSession's compatibility fallback.
      const replacement = recreateTrainingSession(session, history);
      // saveSession replaces every older active record in one transaction, so
      // there is never a recoverable half-restarted state.
      await saveSession(replacement);
      setScratch(false);
      sessionRef.current = replacement;
      setSession(replacement);
      setView("training");
    } catch {
      setStorageError("重开训练失败，原训练仍可继续，请稍后重试。");
    } finally {
      restartInFlight.current = false;
      setIsRestartingTraining(false);
    }
  };
  const refreshHistoryData = (): Promise<void> => {
    const scopeIdentity = identityRef.current;
    const scope = historyScope(scopeIdentity);
    const running = historyRefreshInFlight.current.get(scope);
    if (running) {
      traceDataLoad("history-reuse", scope);
      return running;
    }
    const hasCachedData = historyCacheRef.current.has(scope);
    const existing = historyCacheRef.current.get(scope) ?? [];
    if (hasCachedData && historyScope(identityRef.current) === scope)
      setHistory(existing);
    setHistoryRefreshing(true);
    setHistoryRefreshError(undefined);
    const startedAt = performance.now();
    traceDataLoad("history-start", scope, { hasCachedData });
    // IndexedDB and Supabase do not depend on one another. Start both at once,
    // then publish IndexedDB data first without replacing a useful cache.
    const localRequest = readCompleted();
    const cloudRequest = scopeIdentity ? readCloudHistory() : undefined;
    const request = (async () => {
      let local: TrainingSession[];
      try {
        local = await localRequest;
      } catch {
        if (historyScope(identityRef.current) === scope)
          setHistoryRefreshError("历史记录读取失败，请稍后重试。");
        return;
      }
      if (historyScope(identityRef.current) !== scope) return;
      const owned = scopeIdentity
        ? local.filter((item) => item.ownerAccountId === scopeIdentity.id)
        : local.filter((item) => !item.ownerAccountId);
      setUnassignedHistory(local.filter((item) => !item.ownerAccountId));
      // The local copy is authoritative for its own session (notably sync state),
      // while an older cloud/cache copy still supplies paired history.
      const localMerged = mergeHistory(owned, existing);
      historyCacheRef.current.set(scope, localMerged);
      setHistory(localMerged);
      traceDataLoad("history-local-ready", scope, {
        elapsedMs: Math.round(performance.now() - startedAt),
        count: localMerged.length,
      });

      if (!cloudRequest) return;
      try {
        const cloud = await cloudRequest;
        if (historyScope(identityRef.current) !== scope) return;
        const merged = mergeHistory(localMerged, cloud);
        historyCacheRef.current.set(scope, merged);
        setHistory(merged);
        traceDataLoad("history-cloud-ready", scope, {
          elapsedMs: Math.round(performance.now() - startedAt),
          count: merged.length,
        });
      } catch {
        if (historyScope(identityRef.current) === scope)
          setHistoryRefreshError(
            "云端记录更新失败，正在显示本地或上次读取的数据。",
          );
      }
    })().finally(() => {
      if (historyScope(identityRef.current) === scope)
        setHistoryRefreshing(false);
      historyRefreshInFlight.current.delete(scope);
    });
    historyRefreshInFlight.current.set(scope, request);
    return request;
  };
  const loadHistory = () => setView("history");
  const refreshPK = (acknowledge = false): Promise<void> => {
    const scopeIdentity = identityRef.current;
    if (!scopeIdentity) return Promise.resolve();
    const scope = historyScope(scopeIdentity);
    const running = pkRefreshInFlight.current.get(scope);
    if (running) {
      traceDataLoad("pk-reuse", scope, { acknowledge });
      return running;
    }
    const hasCachedData = pkCacheRef.current.has(scope);
    const existing = pkCacheRef.current.get(scope) ?? [];
    if (hasCachedData && historyScope(identityRef.current) === scope)
      setPKChallenges(existing);
    setPKRefreshing(true);
    setPKRefreshError(undefined);
    const startedAt = performance.now();
    traceDataLoad("pk-start", scope, { hasCachedData, acknowledge });
    const request = (async () => {
      try {
        // PK list only needs challenges. History prefetch remains independent;
        // do not make this high-frequency page wait for every completed session.
        const challenges = await readPKChallenges();
        if (historyScope(identityRef.current) !== scope) return;
        pkCacheRef.current.set(scope, challenges);
        setPKChallenges(challenges);
        traceDataLoad("pk-ready", scope, {
          elapsedMs: Math.round(performance.now() - startedAt),
          count: challenges.length,
        });
        if (acknowledge) {
          void acknowledgePKResults()
            .then(() => setUnreadPKResults(0))
            .catch(() => undefined);
        } else {
          void unreadPKResultIds()
            .then((ids) => {
              if (historyScope(identityRef.current) === scope)
                setUnreadPKResults(ids.length);
            })
            .catch(() => undefined);
        }
      } catch {
        if (historyScope(identityRef.current) === scope)
          setPKRefreshError("更新失败，正在显示上次读取的数据。");
      }
    })().finally(() => {
      if (historyScope(identityRef.current) === scope) setPKRefreshing(false);
      pkRefreshInFlight.current.delete(scope);
    });
    pkRefreshInFlight.current.set(scope, request);
    return request;
  };
  const enterPK = () => {
    if (!identity) {
      setStorageError("请先登录已绑定的同步账号后使用PK挑战。");
      return;
    }
    setView("pk");
    const scope = historyScope(identity);
    if (pkCacheRef.current.has(scope)) {
      // Opening an already-prefetched PK page only acknowledges the blue result
      // indicator. It must not turn every navigation into a new network request.
      void acknowledgePKResults()
        .then(() => setUnreadPKResults(0))
        .catch(() => undefined);
    } else {
      void refreshPK(true);
    }
  };
  useEffect(() => {
    if (!authResolved) return;
    const scope = historyScope(identity);
    setHistory(historyCacheRef.current.get(scope) ?? []);
    setSelectedHistorySession(null);
    setHistoryRefreshError(undefined);
    if (identity) {
      setPKChallenges(pkCacheRef.current.get(scope) ?? []);
      setSelectedPKChallenge(null);
      setPKRefreshError(undefined);
      void refreshPK();
    } else {
      setPKChallenges([]);
      setUnreadPKResults(0);
    }
    // Home prefetch starts after the actual Auth scope is known. It is not
    // coupled to navigation, so a later tap can render cached content first.
    void refreshHistoryData();
    // refreshPK deliberately refreshes all data sources after an Auth scope
    // switch; only the stable account id can change this scope.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authResolved, identity?.id]);
  const startPKChallenge = async (challenge: PKChallenge) => {
    if (!identity || challenge.opponentId !== identity.id) return;
    try {
      const active = await readActive(identity.id);
      if (active) {
        if (active.pkChallengeId !== challenge.id) {
          setActiveSessionPrompt({
            session: active,
            afterDiscard: "startPK",
            challenge,
          });
          return;
        }
        if (active.pkChallengeId === challenge.id) {
          sessionRef.current = active;
          setSession(resumeSessionTimer(active));
          setView("training");
        } else
          setStorageError("请先完成或暂存当前浏览器中的训练，再开始PK挑战。");
        return;
      }
      const next = createTrainingSession({
        userId: identity.role,
        ownerAccountId: identity.id,
        questionType: challenge.frozenSession.questionType,
        subtype: challenge.frozenSession.subtype,
        questionCount: challenge.frozenSession.questions.length,
        questions: challenge.frozenSession.questions,
        pkChallengeId: challenge.id,
        trainingMode: challenge.frozenSession.trainingMode,
        primarySkillId: challenge.frozenSession.primarySkillId,
        difficultyBand: challenge.frozenSession.difficultyBand,
        cProject: challenge.frozenSession.cProject,
        cTrainingMode: challenge.frozenSession.cTrainingMode,
        cPreset: challenge.frozenSession.cPreset,
        launchSpec: challenge.frozenSession.launchSpec,
      });
      await saveSession(next);
      sessionRef.current = next;
      setSession(next);
      setView("training");
      await refreshPK();
    } catch {
      setStorageError("PK挑战暂存失败，请稍后重试。");
    }
  };
  const continuePKChallenge = (
    challenge: PKChallenge,
    active: TrainingSession,
  ) => {
    if (
      !identity ||
      active.ownerAccountId !== identity.id ||
      active.pkChallengeId !== challenge.id
    )
      return;
    const resumed = resumeSessionTimer(active);
    sessionRef.current = resumed;
    setSession(resumed);
    setView("training");
  };
  const launchPK = async (candidate: TrainingSession) => {
    if (
      !identity ||
      candidate.ownerAccountId !== identity.id ||
      candidate.trainingSource === "pk" ||
      !isSessionPkEligible(candidate)
    )
      return;
    try {
      const syncing = { ...candidate, syncStatus: "syncing" as const };
      await saveSession(syncing);
      await syncCompleted(syncing);
      const challenge = await createPKChallenge(candidate.id);
      const synced = {
        ...syncing,
        syncStatus: "synced" as const,
        syncedAt: Date.now(),
      };
      await saveSession(synced);
      if (session?.id === candidate.id) setSession(synced);
      setPKChallenges((items) => [
        challenge,
        ...items.filter((item) => item.id !== challenge.id),
      ]);
      setStorageError(null);
    } catch {
      setStorageError("PK发起失败：本次训练已保存在本地，请先同步后重试。");
    }
  };
  const syncOwnedSession = async (candidate: TrainingSession) => {
    if (!identity || candidate.ownerAccountId !== identity.id) return;
    const syncing = { ...candidate, syncStatus: "syncing" as const };
    await saveSession(syncing);
    setHistory((items) =>
      items.map((item) => (item.id === syncing.id ? syncing : item)),
    );
    if (session?.id === syncing.id) setSession(syncing);
    try {
      await syncCompleted(syncing);
      if (syncing.pkChallengeId) {
        await submitPKResult(syncing.pkChallengeId, syncing.id);
      }
      const synced = {
        ...syncing,
        syncStatus: "synced" as const,
        syncedAt: Date.now(),
        pkSyncStatus: syncing.pkChallengeId ? ("synced" as const) : undefined,
      };
      await saveSession(synced);
      setHistory((items) =>
        items.map((item) => (item.id === synced.id ? synced : item)),
      );
      if (session?.id === synced.id) setSession(synced);
      if (syncing.pkChallengeId) await refreshPK();
    } catch {
      const failed = {
        ...syncing,
        syncStatus: "failed" as const,
        pkSyncStatus: syncing.pkChallengeId ? ("failed" as const) : undefined,
      };
      await saveSession(failed);
      setHistory((items) =>
        items.map((item) => (item.id === failed.id ? failed : item)),
      );
      if (session?.id === failed.id) setSession(failed);
      setStorageError("同步失败；本地训练已安全保留，可稍后重试。");
    }
  };
  useEffect(() => {
    if (!authResolved) return;
    const route = locationRoute();
    const needsHistory = [
      "history",
      "stats",
      "historyDetail",
      "result",
    ].includes(route.view);
    const scope = historyScope(identityRef.current);
    // Identity resolution prefetches these datasets. A route change only starts
    // a read if the route got there before that prefetch; otherwise navigation
    // must render the retained data immediately without another refresh.
    if (needsHistory && !historyCacheRef.current.has(scope))
      void refreshHistoryData();
    if (
      identity &&
      (route.view === "pk" || route.view === "pkDetail") &&
      !pkCacheRef.current.has(scope)
    )
      void refreshPK(route.view === "pk");
  }, [authResolved, identity, routeRecordId, view]);
  useEffect(() => {
    if (!routeRecordId) return;
    const found = history.find((item) => item.id === routeRecordId);
    if (view === "result") {
      if (found) {
        setSession(found);
        sessionRef.current = found;
        setRouteLoading(false);
      } else setRouteLoading(false);
    }
    if (view === "historyDetail") {
      if (found) {
        setSelectedHistorySession(found);
        setRouteLoading(false);
      } else setRouteLoading(false);
    }
  }, [history, routeRecordId, view]);
  useEffect(() => {
    if (view !== "pkDetail" || !routeRecordId) return;
    const found = pkChallenges.find((item) => item.id === routeRecordId);
    if (found) {
      setSelectedPKChallenge(found);
      setRouteLoading(false);
    } else setRouteLoading(false);
  }, [pkChallenges, routeRecordId, view]);
  if (view === "training" && session?.status === "completed")
    return (
      <main className="panel">
        <h1>正在打开结算结果…</h1>
        <p>本次PK训练已经完成，正在恢复结算页面。</p>
      </main>
    );
  if (view === "training" && (!session || !current))
    return (
      <main className="panel">
        <h1>{routeLoading ? "正在恢复训练…" : "训练无法恢复"}</h1>
        <p>
          {routeLoading
            ? "正在读取当前浏览器中的暂存训练。"
            : "未找到可恢复的未完成训练；不会重新生成题目。"}
        </p>
        <button onClick={() => setView("home")}>返回首页</button>
      </main>
    );
  if (view === "training" && session && current)
    return (
      <main className="trainingPage">
        <header className="trainingHeader">
          <button
            onClick={() => {
              const pausedSession = pauseSessionTimer(session);
              sessionRef.current = pausedSession;
              setSession(pausedSession);
              saveSession(pausedSession);
              setView("home");
            }}
          >
            ← 暂存
          </button>
          <span>
            {session.currentIndex + 1}/{session.questions.length}
          </span>
          <b>{(elapsed / 1000).toFixed(1)} 秒</b>
          <button onClick={() => setScratch(true)}>✎ 草稿</button>
        </header>
        <section className="training trainingMain">
          {currentRenderer !== "structured_steps" &&
          currentRenderer !== "structured_single" &&
          session.subtype !== "percent_to_fraction" ? (
            <p className="rule">
              {session.subtype === "quotient_first"
                ? "求商首位，不四舍五入"
                : session.subtype === "quotient_two"
                  ? "求商前两位，不四舍五入"
                  : session.subtype === "quotient_estimate_3_percent"
                    ? "输入近似商，相对误差不超过 3%"
                    : session.subtype === "comparison"
                      ? "请选择两个分数的大小关系"
                      : session.subtype === "fraction_to_percent"
                        ? "输入近似百分数，可保留一位小数"
                        : "请输入答案"}
            </p>
          ) : null}
          {currentRenderer === "structured_steps" ? (
            <StructuredStepTraining
              isRestarting={isRestartingTraining}
              now={now}
              onChange={(nextSession) => {
                sessionRef.current = nextSession;
                setSession(nextSession);
              }}
              onRestart={restartTraining}
              onSubmit={submit}
              session={session}
            />
          ) : currentRenderer === "c3_comparison" ? (
            <C3ComparisonTraining
              isRestarting={isRestartingTraining}
              onRestart={restartTraining}
              onSubmit={submitSession}
              session={session}
            />
          ) : currentRenderer === "structured_single" ? (
            <StructuredSingleAnswerTraining
              isRestarting={isRestartingTraining}
              onChange={(nextSession) => {
                sessionRef.current = nextSession;
                setSession(nextSession);
              }}
              onRestart={restartTraining}
              onSubmit={submitSession}
              session={session}
            />
          ) : currentRenderer === "fraction_comparison" ? (
            <FractionComparisonDisplay
              data={current.data}
              fallbackPrompt={current.prompt}
              selectedRelation={session.currentAnswer}
            />
          ) : currentRenderer === "fraction_conversion" ? (
            <>
              <FractionConversionDisplay
                activePart={fractionEntryPart}
                data={current.data}
                fallbackPrompt={current.prompt}
                onSelectPart={(part) => {
                  setFractionEntryPart(part);
                  if (part === "numerator") {
                    setHasAutoAdvancedFractionEntry(true);
                  }
                }}
                subtype={session.subtype}
                value={session.currentAnswer}
              />
              <button
                className="restart"
                disabled={isRestartingTraining}
                onClick={restartTraining}
              >
                {isRestartingTraining ? "正在重开…" : "重开训练"}
              </button>
            </>
          ) : (
            <>
              <h1>{current.prompt}</h1>
              <div className="answer" aria-label="当前答案" aria-live="polite">
                {session.currentAnswer}
              </div>
              <button
                className="restart"
                disabled={isRestartingTraining}
                onClick={restartTraining}
              >
                {isRestartingTraining ? "正在重开…" : "重开训练"}
              </button>
            </>
          )}
          {currentRenderer === "structured_steps" ||
          currentRenderer === "structured_single" ? null : currentRenderer ===
            "fraction_comparison" ? (
            <div className="comparisonPad trainingKeypad">
              <div className="comparisonChoices">
                {[
                  { label: "大于", value: ">" },
                  { label: "小于", value: "<" },
                ].map(({ label, value }) => (
                  <button
                    className={
                      session.currentAnswer === value ? "selected" : ""
                    }
                    key={value}
                    onClick={() =>
                      setSession({ ...session, currentAnswer: value })
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="comparisonActions">
                <button
                  className="restartTrainingButton"
                  disabled={isRestartingTraining}
                  onClick={restartTraining}
                >
                  {isRestartingTraining ? "正在重开…" : "重开训练"}
                </button>
                <button
                  className="primary"
                  disabled={!session.currentAnswer}
                  onClick={() => submit()}
                >
                  确定
                </button>
              </div>
            </div>
          ) : session.questionType === "fraction_percent_conversion" &&
            session.subtype === "percent_to_fraction" ? (
            <NumberPad
              submitDisabled={splitFractionAnswer(session.currentAnswer).some(
                (part) => !part,
              )}
              value={
                splitFractionAnswer(session.currentAnswer)[
                  fractionEntryPart === "numerator" ? 0 : 1
                ]
              }
              onChange={(partValue) => {
                const [numerator, denominator] = splitFractionAnswer(
                  session.currentAnswer,
                );
                setSession({
                  ...session,
                  currentAnswer:
                    fractionEntryPart === "numerator"
                      ? `${partValue}/${denominator}`
                      : `${numerator}/${partValue}`,
                });
                if (
                  fractionEntryPart === "numerator" &&
                  !hasAutoAdvancedFractionEntry &&
                  numerator === "" &&
                  /^\d$/.test(partValue)
                ) {
                  setHasAutoAdvancedFractionEntry(true);
                  setFractionEntryPart("denominator");
                }
              }}
              onSubmit={submit}
            />
          ) : (
            <NumberPad
              value={session.currentAnswer}
              onChange={(v) => setSession({ ...session, currentAnswer: v })}
              onSubmit={submit}
            />
          )}
        </section>
        {scratch && <ScratchCanvas onClose={() => setScratch(false)} />}
      </main>
    );
  if (view === "result" && !session)
    return (
      <main className="panel">
        <h1>
          {routeLoading
            ? "正在恢复结算结果…"
            : historyRefreshError
              ? "结算记录暂时无法读取"
              : "结算记录不可用"}
        </h1>
        <p>
          {routeLoading
            ? "正在读取已完成训练。"
            : (historyRefreshError ?? "该结算记录不存在或当前账号无权查看。")}
        </p>
        <button onClick={() => setView("history")}>查看历史记录</button>
      </main>
    );
  if (view === "result" && session) {
    const metrics = sessionMetrics(session);
    const resultDescriptor = getTrainingDisplayDescriptor(session);
    const hasLaunchedPK = pkChallenges.some(
      (challenge) => challenge.sourceSessionId === session.id,
    );
    return (
      <main className="panel">
        <h1>训练完成！</h1>
        <p>
          {resultDescriptor.title}
          {resultDescriptor.subtitle ? ` · ${resultDescriptor.subtitle}` : ""}
        </p>
        <div className="metrics">
          <b>
            {metrics.correctCount}/{session.questions.length}
            <small>正确题数</small>
          </b>
          <b>
            {(session.accumulatedMs / 1000).toFixed(1)}s<small>总用时</small>
          </b>
          <b>
            {(session.accumulatedMs / session.questions.length / 1000).toFixed(
              1,
            )}
            s<small>平均每题</small>
          </b>
        </div>
        <RatingBreakdown session={session} />
        <C3SessionInsights session={session} />
        <C4SessionInsights session={session} />
        <QuestionDetails session={session} />
        {session.trainingSource !== "pk" &&
          (resultDescriptor.family === "a" ||
            (resultDescriptor.family === "c" &&
              (session.cProject === "C3" || session.cProject === "C4"))) && (
            <button
              className="wide"
              onClick={() => repeatSpecialty(session)}
              type="button"
            >
              再来一组
            </button>
          )}
        {identity && session.ownerAccountId === identity.id && (
          <p
            className={`syncStatus syncStatus-${session.syncStatus ?? "not_synced"}`}
          >
            同步状态：
            {session.syncStatus === "syncing"
              ? "同步中"
              : session.syncStatus === "synced" || session.syncedAt
                ? "已同步"
                : session.syncStatus === "failed"
                  ? "同步失败"
                  : "未同步"}
          </p>
        )}
        {identity && session.ownerAccountId === identity.id && (
          <button
            className="wide"
            disabled={session.syncStatus === "syncing"}
            onClick={() => syncOwnedSession(session)}
          >
            {session.syncStatus === "syncing"
              ? "同步中"
              : session.syncedAt
                ? "已同步，重新同步"
                : "同步本次训练"}
          </button>
        )}
        {identity &&
          session.ownerAccountId === identity.id &&
          session.trainingSource !== "pk" &&
          isSessionPkEligible(session) &&
          (hasLaunchedPK ? (
            <section
              aria-live="polite"
              className="pkLaunchedNotice"
              role="status"
            >
              <strong>✓ 已成功向对方发起 PK 挑战</strong>
              <span>正在等待对方完成同一套题目</span>
              <button onClick={() => setView("pk")} type="button">
                查看 PK 挑战
              </button>
            </section>
          ) : (
            <button
              className="wide"
              disabled={session.syncStatus === "syncing"}
              onClick={() => launchPK(session)}
            >
              向对方发起PK
            </button>
          ))}
        {session.trainingSource === "pk" && (
          <p
            className={`syncStatus syncStatus-${session.pkSyncStatus ?? "not_synced"}`}
          >
            PK结果状态：
            {session.pkSyncStatus === "synced"
              ? "已提交"
              : session.pkSyncStatus === "syncing"
                ? "提交中"
                : session.pkSyncStatus === "failed"
                  ? "提交失败，可在历史中重试"
                  : "待提交"}
          </p>
        )}
        {session && false && (
          <>
            <h2>题目明细</h2>
            {session!.records.map((r, i) => (
              <p className={r.isCorrect ? "ok" : "wrong"} key={r.question.id}>
                {i + 1}. {r.question.prompt}　{r.userAnswer}　
                {r.isCorrect ? "✓" : "✗ " + r.question.answer}　
                {(r.timeUsedMs / 1000).toFixed(1)}s
              </p>
            ))}
          </>
        )}
        <button className="primary wide" onClick={() => setView("home")}>
          返回首页
        </button>
      </main>
    );
  }
  if (view === "history") {
    return (
      <main className="panel">
        <button onClick={() => setView("home")}>← 首页</button>
        <h1>历史记录</h1>
        {historyRefreshing && <p className="dataUpdating">正在更新记录…</p>}
        <RefreshNotice message={historyRefreshError} />
        <PersonalDataExport identity={identity} />
        <HistoryList
          key={historyScope(identity)}
          currentAccountId={identity?.id}
          currentUserId={(identity?.role ?? user) as "fish" | "cat"}
          canViewPartner={Boolean(identity)}
          onSync={syncOwnedSession}
          sessions={history}
          onOpen={(selected) => {
            setSelectedHistorySession(selected);
            navigate("historyDetail", selected.id);
          }}
        />
        {false && (
          <>
            {history.length ? (
              history.map((s) => (
                <article className="history" key={s.id}>
                  <b>{typeLabels[s.questionType]}</b>
                  <span>
                    {new Date(s.startedAt).toLocaleDateString()} ·{" "}
                    {s.records.filter((x) => x.isCorrect).length}/
                    {s.questions.length} · {(s.accumulatedMs / 1000).toFixed(1)}
                    s
                  </span>
                </article>
              ))
            ) : (
              <p>还没有完成的训练记录。</p>
            )}
          </>
        )}
      </main>
    );
  }
  if (view === "pk" && !identity)
    return (
      <main className="panel">
        <button onClick={() => setView("home")}>← 首页</button>
        <h1>PK挑战</h1>
        <p>
          {authResolved
            ? "PK挑战仅对已绑定的同步账号开放。"
            : "正在确认账号状态…"}
        </p>
        <button onClick={() => setView("home")}>返回首页</button>
      </main>
    );
  if (view === "pk" && identity) {
    return (
      <main className="panel">
        {activeSessionPrompt && (
          <ActiveSessionDialog
            discardLabel={
              activeSessionPrompt.afterDiscard === "startPK"
                ? "放弃原训练并开始PK挑战"
                : undefined
            }
            onCancel={() => setActiveSessionPrompt(null)}
            onContinue={continueActiveSession}
            onDiscard={discardActiveSession}
            onEnd={endActiveSession}
            session={activeSessionPrompt.session}
            showCancel={activeSessionPrompt.afterDiscard !== "stayHome"}
          />
        )}
        <button onClick={() => setView("home")}>← 首页</button>
        {pkRefreshing && <p className="dataUpdating">正在更新PK挑战…</p>}
        <RefreshNotice message={pkRefreshError} />
        <PKPage
          challenges={pkChallenges}
          identityId={identity.id}
          onContinue={continuePKChallenge}
          onOpen={(challenge) => {
            setSelectedPKChallenge(challenge);
            navigate("pkDetail", challenge.id);
          }}
          onRefresh={() => void refreshPK()}
          onStart={startPKChallenge}
          sessions={
            session?.status === "active" ? [...history, session] : history
          }
        />
      </main>
    );
  }
  if (view === "pkDetail" && !selectedPKChallenge)
    return (
      <main className="panel">
        <button onClick={() => setView("pk")}>← PK挑战</button>
        <h1>
          {routeLoading
            ? "正在读取PK详情…"
            : pkRefreshError
              ? "PK详情暂时无法读取"
              : "PK详情不可用"}
        </h1>
        <p>
          {routeLoading
            ? "正在加载冻结题组和双方作答。"
            : (pkRefreshError ??
              "该PK记录不存在、已超出展示范围，或当前账号无权查看。")}
        </p>
      </main>
    );
  if (view === "pkDetail" && selectedPKChallenge) {
    const response = history.find(
      (item) => item.id === selectedPKChallenge.opponentSessionId,
    );
    return (
      <main className="panel">
        <button onClick={() => setView("pk")}>← PK挑战</button>
        {response ? (
          <PKDetails challenge={selectedPKChallenge} response={response} />
        ) : (
          <p>PK结果尚未同步完整，请返回后刷新。</p>
        )}
      </main>
    );
  }
  if (view === "stats") {
    return (
      <main className="panel">
        <button onClick={() => setView("home")}>← 首页</button>
        <h1>我的成绩</h1>
        {historyRefreshing && <p className="dataUpdating">正在更新成绩…</p>}
        <RefreshNotice message={historyRefreshError} />
        <SkillInsights sessions={history} />
        <HistoryCharts sessions={history} />
      </main>
    );
  }
  if (view === "memory") {
    return (
      <main className="panel memoryPage">
        <button onClick={() => setView("home")}>← 首页</button>
        <h1>百分互换速记</h1>
        <FractionPercentMemory />
      </main>
    );
  }
  if (view === "fractionMatch") {
    return (
      <main className="panel matchPage">
        <FractionPercentMatchGame
          userId={(identity?.role ?? user) as "fish" | "cat"}
          ownerAccountId={identity?.id}
          onComplete={completeFractionMatch}
          onHome={() => setView("home")}
          onHistory={() => setView("fractionMatchHistory")}
          onLaunchPK={
            identity
              ? async (record, blueprint) => {
                  try {
                    const challenge = await createMatchPKChallenge(
                      record.id,
                      blueprint,
                    );
                    setMatchPKChallenges((old) => [
                      challenge,
                      ...old.filter((item) => item.id !== challenge.id),
                    ]);
                    navigate("fractionMatchPK");
                  } catch {
                    setStorageError("发起消消乐PK失败，请确认本局成绩已同步。");
                  }
                }
              : undefined
          }
        />
      </main>
    );
  }
  if (view === "fractionMatchHistory") {
    return (
      <FractionPercentMatchHistory
        identity={identity}
        userId={(identity?.role ?? user) as "fish" | "cat"}
        onHome={() => setView("home")}
        onGame={() => setView("fractionMatch")}
      />
    );
  }
  if (view === "fractionMatchPK") {
    return (
      <FractionPercentMatchPKPage
        challenges={matchPKChallenges}
        records={matchRecords}
        identityId={identity?.id}
        onHome={() => setView("home")}
        onStart={(challenge) => navigate("fractionMatchPKPlay", challenge.id)}
      />
    );
  }
  if (view === "fractionMatchPKPlay") {
    const challenge = matchPKChallenges.find(
      (item) => item.id === routeRecordId,
    );
    if (!challenge)
      return (
        <main className="panel">
          <button onClick={() => setView("fractionMatchPK")}>← 消消乐PK</button>
          <p>挑战读取中或不可用。</p>
        </main>
      );
    return (
      <main className="panel matchPage">
        <FractionPercentMatchGame
          userId={(identity?.role ?? user) as "fish" | "cat"}
          ownerAccountId={identity?.id}
          blueprint={challenge.blueprint}
          trainingSource="pk"
          pkChallengeId={challenge.id}
          onHome={() => setView("fractionMatchPK")}
          onHistory={() => setView("fractionMatchHistory")}
          onComplete={async (record) => {
            const persisted = await completeFractionMatch(record);
            if (!persisted.cloudSynced) {
              await saveMatchRecord({
                ...persisted.record,
                pkSyncStatus: "failed",
              });
              setStorageError(
                "本次成绩已保存在本机，PK结果尚未提交，可稍后在历史中重试。",
              );
              return;
            }
            try {
              await submitMatchPKResult(challenge.id, record.id);
              await saveMatchRecord({
                ...persisted.record,
                pkSyncStatus: "synced",
              });
              void refreshMatchPKData();
            } catch {
              await saveMatchRecord({
                ...persisted.record,
                pkSyncStatus: "failed",
              });
              setStorageError(
                "本次成绩已保存在本机，PK结果尚未提交，可稍后在历史中重试。",
              );
            }
          }}
        />
      </main>
    );
  }
  if (view === "historyDetail" && !selectedHistorySession)
    return (
      <main className="panel">
        <button onClick={() => setView("history")}>← 历史记录</button>
        <h1>
          {routeLoading
            ? "正在读取训练详情…"
            : historyRefreshError
              ? "训练详情暂时无法读取"
              : "训练详情不可用"}
        </h1>
        <p>
          {routeLoading
            ? "正在读取冻结题组。"
            : (historyRefreshError ?? "该训练记录不存在或当前账号无权查看。")}
        </p>
      </main>
    );
  if (view === "historyDetail" && selectedHistorySession) {
    return (
      <main className="panel">
        <button onClick={() => setView("history")}>← 历史记录</button>
        <h1>训练详情</h1>
        <SessionDetails session={selectedHistorySession} />
      </main>
    );
  }
  return (
    <main className="home">
      {activeSessionPrompt && (
        <ActiveSessionDialog
          discardLabel={
            activeSessionPrompt.afterDiscard === "startPK"
              ? "放弃原训练并开始PK挑战"
              : undefined
          }
          onCancel={() => setActiveSessionPrompt(null)}
          onContinue={continueActiveSession}
          onDiscard={discardActiveSession}
          onEnd={endActiveSession}
          session={activeSessionPrompt.session}
          showCancel={activeSessionPrompt.afterDiscard !== "stayHome"}
        />
      )}
      {storageError && (
        <p className="storageError" role="alert">
          {storageError}
        </p>
      )}
      <header className="numeraHomeHeader">
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
        onRepeatSpecialty={repeatSpecialty}
        onStartDaily={startDailyPlan}
        onStartSkill={startASkill}
        ownerAccountId={identity?.id}
        practiceExtras={
          <>
            <C3HomeTraining embedded onStart={startC3} />
            <C4HomeTraining embedded onStart={startC4} />
          </>
        }
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
            <button
              onClick={() => setView("fractionMatchHistory")}
              type="button"
            >
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
    </main>
  );
}
