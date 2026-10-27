"use client";

import type { ChangeEvent } from "react";

export type ScalingPath = "zero" | "result" | "numerator_r" | "numerator_rough";
export type ScalingFormState = {
  path: ScalingPath;
  second: boolean;
  fields: Record<string, string>;
};
export const emptyScalingForm = (): ScalingFormState => ({
  path: "zero", second: false, fields: {},
});

const paths: { value: ScalingPath; label: string }[] = [
  { value: "zero", label: "零阶 · 基准商已经够用" },
  { value: "result", label: "修结果 · Q0 与修正量" },
  { value: "numerator_r", label: "修分子 · A×r" },
  { value: "numerator_rough", label: "修分子 · 粗商×Δ（无需r或Q0）" },
];
const inputs = [
  ["scalingB0", "自选基准 B0", "你自然选的分母基准"],
  ["scalingDelta", "带符号 Δ = B0 − B", "例如 +3 或 -4"],
  ["scalingQ0", "实际基准商 Q0", "自己计算的 A÷B0"],
  ["scalingR", "实际近似幅度 r（小数）", "例如 0.042"],
  ["scalingRough", "自然粗商 q粗", "本次使用的粗商"],
  ["scalingC1", "一阶带符号修正 C1", "正数或负数"],
  ["scalingA1", "一阶分子 A1", "自己计算的 A+C1"],
  ["scalingQ1", "一阶结果 Q1", "自己计算的商"],
  ["scalingC2", "后续实际修正 C2", "数值由你自己决定"],
  ["scalingA2", "后续分子 A2", "自己计算的 A1+C2"],
  ["scalingQ2", "后续结果 Q2", "自己计算的商"],
  ["scalingFinal", "最终实际商", "相对原始商核验3%"],
] as const;

function visible(path: ScalingPath, second: boolean, key: string) {
  if (["scalingB0", "scalingDelta", "scalingFinal"].includes(key)) return true;
  if (key === "scalingQ0") return path === "zero" || path === "result";
  if (key === "scalingR") return path === "result" || path === "numerator_r";
  if (key === "scalingRough") return path === "numerator_rough";
  if (["scalingC1", "scalingQ1"].includes(key)) return path !== "zero";
  if (key === "scalingA1") return path.startsWith("numerator_");
  if (["scalingC2", "scalingQ2"].includes(key)) return path !== "zero" && second;
  if (key === "scalingA2") return path.startsWith("numerator_") && second;
  return false;
}

export function scalingResponseFields(state: ScalingFormState) {
  const fields: Record<string, string> = {
    scalingPath: state.path,
    ...state.path === "zero" ? {} : { scalingSecond: state.second ? "yes" : "no" },
  };
  for (const [key] of inputs)
    if (visible(state.path, state.second, key))
      fields[key] = state.fields[key] ?? "";
  return fields;
}

/** Never compute learner values. Changing branches clears previously entered
 * values so a hidden stale step cannot masquerade as a real user action.
 */
export function C2ScalingFields({
  state,
  onChange,
}: {
  state: ScalingFormState;
  onChange: (next: ScalingFormState) => void;
}) {
  const changeField = (key: string) => (event: ChangeEvent<HTMLInputElement>) =>
    onChange({ ...state, fields: { ...state.fields, [key]: event.target.value } });

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <p>
        自己选择 B0 和带符号差量；如果基准商对原式已在3%内，可直接零阶提交，
        绝不强迫多算修正。
      </p>
      <fieldset style={{ border: "1px solid #cad9db", borderRadius: 12, padding: 12 }}>
        <legend>本题实际使用的放缩路径</legend>
        <div style={{ display: "grid", gap: 9 }}>
          {paths.map((path) => (
            <label key={path.value}>
              <input
                checked={state.path === path.value}
                name="scaling-path"
                onChange={() =>
                  onChange({ path: path.value, second: false, fields: {} })
                }
                type="radio"
                value={path.value}
              />
              {path.label}
            </label>
          ))}
        </div>
      </fieldset>
      {state.path !== "zero" ? (
        <label>
          <input
            checked={state.second}
            onChange={(event) => {
              const fields = { ...state.fields };
              delete fields.scalingC2;
              delete fields.scalingA2;
              delete fields.scalingQ2;
              onChange({ ...state, second: event.target.checked, fields });
            }}
            type="checkbox"
          />
          我还实际进行了下一阶修正
        </label>
      ) : null}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
        gap: 12,
      }}>
        {inputs.filter(([key]) => visible(state.path, state.second, key))
          .map(([key, label, hint]) => (
            <label key={key} style={{ display: "grid", gap: 6, minWidth: 0 }}>
              <span>{label}</span>
              <input
                aria-label={label}
                autoComplete="off"
                inputMode="decimal"
                onChange={changeField(key)}
                placeholder={hint}
                required
                style={{
                  border: "1px solid #c7d6dd", borderRadius: 10,
                  padding: "11px 12px", width: "100%", minWidth: 0,
                  font: "inherit", background: "white",
                }}
                type="text"
                value={state.fields[key] ?? ""}
              />
            </label>
          ))}
      </div>
    </div>
  );
}
