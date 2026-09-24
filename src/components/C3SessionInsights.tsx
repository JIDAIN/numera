import {
  C3BreakdownRow,
  summarizeC3Session,
} from "@/lib/c3-training";
import { TrainingSession } from "@/lib/types";

function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: C3BreakdownRow[];
}) {
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

export function C3SessionInsights({
  session,
}: {
  session: TrainingSession;
}) {
  const summary = summarizeC3Session(session);
  if (!summary) return null;

  return (
    <section className="c4SessionInsights" aria-label="C3训练复盘">
      <div className="c4SessionInsightsHeading">
        <span className="eyebrow">C3 复盘</span>
        <h2>分数比较结构表现</h2>
      </div>
      <Breakdown rows={summary.byStructureLevel} title="结构层级" />
      <Breakdown rows={summary.bySalience} title="结构显著度" />
      <Breakdown rows={summary.byAppearance} title="客观结构画像" />
      <p className="historyChartsHint">
        这里只复盘题目客观结构与真实作答表现，不根据最终答案推断你使用了哪种比较方法。
      </p>
    </section>
  );
}
