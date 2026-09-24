import { C1BreakdownRow, summarizeC1Session } from "@/lib/c1-training";
import { TrainingSession } from "@/lib/types";

function pct(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function Breakdown({ title, rows }: { title: string; rows: C1BreakdownRow[] }) {
  if (!rows.length) return null;
  return (
    <section className="c4BreakdownGroup">
      <h3>{title}</h3>
      <div className="c4BreakdownRows">
        {rows.map((row) => (
          <div className="c4BreakdownRow" key={row.key}>
            <strong>{row.label}</strong>
            <span>
              {row.correctCount}/{row.questionCount} ·{" "}
              {Math.round(row.accuracy * 100)}%
            </span>
            <span>{(row.averageMs / 1000).toFixed(1)}s/题</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function C1SessionInsights({ session }: { session: TrainingSession }) {
  const summary = summarizeC1Session(session);
  if (!summary) return null;
  const { diagnostics } = summary;

  return (
    <section className="c4SessionInsights" aria-label="C1训练复盘">
      <div className="c4SessionInsightsHeading">
        <span className="eyebrow">C1 复盘</span>
        <h2>放缩方案与误差表现</h2>
      </div>

      <div className="c4BreakdownRows">
        <div className="c4BreakdownRow">
          <strong>方向相反</strong>
          <span>
            {diagnostics.directionPassed}/{diagnostics.questionCount}
          </span>
        </div>
        <div className="c4BreakdownRow">
          <strong>计算成本下降</strong>
          <span>
            {diagnostics.costPassed}/{diagnostics.questionCount}
          </span>
        </div>
        <div className="c4BreakdownRow">
          <strong>方法误差 ≤ 2%</strong>
          <span>
            {diagnostics.methodPassed}/{diagnostics.questionCount}
          </span>
          <span>平均 {pct(diagnostics.averageMethodError)}</span>
        </div>
        <div className="c4BreakdownRow">
          <strong>执行误差 ≤ 2%</strong>
          <span>
            {diagnostics.executionPassed}/{diagnostics.questionCount}
          </span>
          <span>平均 {pct(diagnostics.averageExecutionError)}</span>
        </div>
        <div className="c4BreakdownRow">
          <strong>总误差 ≤ 2%</strong>
          <span>
            {diagnostics.totalPassed}/{diagnostics.questionCount}
          </span>
          <span>平均 {pct(diagnostics.averageTotalError)}</span>
        </div>
        <div className="c4BreakdownRow">
          <strong>调整超过约 10%</strong>
          <span>{diagnostics.largeAdjustmentCount}题</span>
          <span>仅提示，不直接判错</span>
        </div>
      </div>

      <Breakdown rows={summary.byChallenge} title="题目结构" />
      <Breakdown rows={summary.byDirection} title="放缩方向结构" />

      <p className="historyChartsHint">
        判定只使用你真实填写的 A′、B′ 和
        U；不会要求你匹配系统推荐路线，也不会反推未提交的心算方法。
      </p>
    </section>
  );
}
