import { C3BreakdownRow, summarizeC3Session } from "@/lib/c3-training";
import { TrainingSession } from "@/lib/types";

function Breakdown({ title, rows }: { title: string; rows: C3BreakdownRow[] }) {
  if (!rows.length) return null;
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

export function C3SessionInsights({ session }: { session: TrainingSession }) {
  const summary = summarizeC3Session(session);
  if (!summary) return null;

  return (
    <section className="cProjectSessionInsights" aria-label="C3训练复盘">
      <div className="cProjectSessionInsightsHeading">
        <span className="eyebrow">C3 复盘</span>
        <h2>分数比较结构表现</h2>
      </div>
      <Breakdown rows={summary.byStructureLevel} title="结构层级" />
      <Breakdown rows={summary.bySalience} title="结构显著度" />
      <Breakdown rows={summary.byRatioZone} title="相对 1 的位置" />
      <Breakdown rows={summary.byAppearance} title="客观结构画像" />
      <p className="historyChartsHint">
        这里只复盘题目客观结构与真实作答表现，不根据最终答案推断你使用了哪种比较方法。
      </p>
    </section>
  );
}
