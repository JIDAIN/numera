import { C4BreakdownRow, summarizeC4Session } from "@/lib/c4-training";
import { TrainingSession } from "@/lib/types";

function Breakdown({ title, rows }: { title: string; rows: C4BreakdownRow[] }) {
  if (!rows?.length) return null;
  return (
    <section className="cProjectBreakdownGroup">
      <h3>{title}</h3>
      <div className="cProjectBreakdownRows">
        {rows.map((row) => (
          <div className="cProjectBreakdownRow" key={row.key}>
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

export function C4SessionInsights({ session }: { session: TrainingSession }) {
  const summary = summarizeC4Session(session);
  if (!summary) return null;

  return (
    <section className="cProjectSessionInsights" aria-label="C4训练复盘">
      <div className="cProjectSessionInsightsHeading">
        <span className="eyebrow">C4 复盘</span>
        <h2>特殊基准表现</h2>
      </div>
      {(summary.averageRelativeError !== undefined ||
        summary.maxRelativeError !== undefined) && (
        <div className="cProjectErrorSummary">
          <span>
            平均最终误差：
            {summary.averageRelativeError !== undefined
              ? `${(summary.averageRelativeError * 100).toFixed(2)}%`
              : "—"}
          </span>
          <span>
            最大最终误差：
            {summary.maxRelativeError !== undefined
              ? `${(summary.maxRelativeError * 100).toFixed(2)}%`
              : "—"}
          </span>
        </div>
      )}
      <Breakdown rows={summary.byOperation} title="乘除方向" />
      <Breakdown rows={summary.byAnchor} title="基准" />
      {summary.byAnchorGroup.length > 0 && (
        <Breakdown rows={summary.byAnchorGroup} title="同类结构" />
      )}
      {summary.byScale.length > 0 && (
        <Breakdown rows={summary.byScale} title="数量级迁移" />
      )}
    </section>
  );
}
