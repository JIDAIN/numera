import { summarizeC4Session } from "@/lib/c4-training";
import { TrainingSession } from "@/lib/types";

function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: ReturnType<typeof summarizeC4Session> extends infer Summary
    ? Summary extends { byAnchor: infer Rows }
      ? Rows
      : never
    : never;
}) {
  if (!rows?.length) return null;
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

export function C4SessionInsights({
  session,
}: {
  session: TrainingSession;
}) {
  const summary = summarizeC4Session(session);
  if (!summary) return null;

  return (
    <section className="c4SessionInsights" aria-label="C4训练复盘">
      <div className="c4SessionInsightsHeading">
        <span className="eyebrow">C4 复盘</span>
        <h2>特殊基准表现</h2>
      </div>
      <Breakdown rows={summary.byOperation} title="乘除方向" />
      <Breakdown rows={summary.byAnchor} title="基准" />
      {summary.byScale.length > 0 && (
        <Breakdown rows={summary.byScale} title="数量级迁移" />
      )}
    </section>
  );
}
