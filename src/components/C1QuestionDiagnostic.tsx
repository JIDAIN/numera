import { TrainingSession } from "@/lib/types";

type RecordItem = TrainingSession["records"][number];

const directionLabels: Record<string, string> = {
  left_up_right_down: "左侧上调 · 右侧下调",
  left_down_right_up: "左侧下调 · 右侧上调",
  right_up_left_down: "右侧上调 · 左侧下调",
  right_down_left_up: "右侧下调 · 左侧上调",
};

function metricBoolean(record: RecordItem, key: string) {
  const value = record.gradingMetrics?.[key];
  return typeof value === "boolean" ? value : undefined;
}

function metricNumber(record: RecordItem, key: string) {
  const value = record.gradingMetrics?.[key];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function pct(value: number | undefined) {
  return value === undefined ? "—" : `${(value * 100).toFixed(2)}%`;
}

function statusText(
  pass: boolean | undefined,
  success: string,
  failure: string,
) {
  if (pass === undefined) return "无逐项记录";
  return pass ? success : failure;
}

function DiagnosticItem({
  label,
  pass,
  detail,
}: {
  label: string;
  pass: boolean | undefined;
  detail: string;
}) {
  return (
    <div
      className={[
        "c1DiagnosticItem",
        pass === true
          ? "c1DiagnosticPass"
          : pass === false
            ? "c1DiagnosticFail"
            : "c1DiagnosticUnknown",
      ].join(" ")}
    >
      <strong>{label}</strong>
      <span>{detail}</span>
    </div>
  );
}

export function C1QuestionDiagnostic({ record }: { record: RecordItem }) {
  if (record.question.cMeta?.project !== "C1") return null;

  const directionPass = metricBoolean(record, "directionPass");
  const costPass = metricBoolean(record, "costPass");
  const methodPass = metricBoolean(record, "methodPass");
  const executionPass = metricBoolean(record, "executionPass");
  const totalPass = metricBoolean(record, "totalPass");
  const largeAdjustment = metricBoolean(record, "largeAdjustment");
  const methodError = metricNumber(record, "methodError");
  const executionError = metricNumber(record, "executionError");
  const totalError = metricNumber(record, "totalError");
  const maxAdjustment = metricNumber(record, "maxAdjustment");
  const actualDirection = record.gradingMetrics?.actualDirectionPattern;
  const recommendedA = record.question.data.c1RecommendedAPrime;
  const recommendedB = record.question.data.c1RecommendedBPrime;
  const recommendedMethodError =
    typeof record.question.data.c1RecommendedMethodError === "number"
      ? record.question.data.c1RecommendedMethodError
      : undefined;

  const hasDetailedMetrics =
    directionPass !== undefined ||
    costPass !== undefined ||
    methodPass !== undefined ||
    executionPass !== undefined ||
    totalPass !== undefined;

  return (
    <div className="c1QuestionDiagnostic">
      <div className="c1QuestionDiagnosticHeading">
        <strong>逐项诊断</strong>
        {typeof actualDirection === "string" &&
          directionLabels[actualDirection] && (
            <span>实际路线：{directionLabels[actualDirection]}</span>
          )}
      </div>

      {hasDetailedMetrics ? (
        <div className="c1DiagnosticGrid">
          <DiagnosticItem
            detail={statusText(
              directionPass,
              "一边上调、一边下调",
              "A′、B′ 没有形成反向调整",
            )}
            label="方向"
            pass={directionPass}
          />
          <DiagnosticItem
            detail={statusText(
              costPass,
              "完整放缩路线确实更省",
              "完整放缩路线没有形成足够的成本下降",
            )}
            label="成本"
            pass={costPass}
          />
          <DiagnosticItem
            detail={`${pct(methodError)} · ${statusText(
              methodPass,
              "≤ 2%",
              "> 2%",
            )}`}
            label="方法误差"
            pass={methodPass}
          />
          <DiagnosticItem
            detail={`${pct(executionError)} · ${statusText(
              executionPass,
              "≤ 2%",
              "> 2%",
            )}`}
            label="执行误差"
            pass={executionPass}
          />
          <DiagnosticItem
            detail={`${pct(totalError)} · ${statusText(
              totalPass,
              "≤ 2%",
              "> 2%",
            )}`}
            label="总误差"
            pass={totalPass}
          />
        </div>
      ) : (
        <p className="c1DiagnosticUnavailable">
          这条历史记录没有保存完整的 C1 逐项诊断数据。
        </p>
      )}

      {largeAdjustment === true && (
        <p className="c1AdjustmentHint">
          调整幅度 {pct(maxAdjustment)}，超过约
          10%。这是路线诊断提示，不会单独判错。
        </p>
      )}

      {typeof recommendedA === "number" && typeof recommendedB === "number" && (
        <p className="c1ReferenceRoute">
          <strong>系统参考路线：</strong>
          A′={recommendedA} · B′={recommendedB}
          {recommendedMethodError !== undefined
            ? ` · 方法误差 ${pct(recommendedMethodError)}`
            : ""}
          <span>仅作参考，不是唯一答案。</span>
        </p>
      )}
    </div>
  );
}
