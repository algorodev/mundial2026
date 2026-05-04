export type ScoreResult = "exact" | "outcome" | "miss" | "pending";

export function calcPoints(
  predHome: number | null | undefined,
  predAway: number | null | undefined,
  realHome: number | null | undefined,
  realAway: number | null | undefined
): { points: number; result: ScoreResult } {
  if (
    predHome == null ||
    predAway == null ||
    realHome == null ||
    realAway == null
  ) {
    return { points: 0, result: "pending" };
  }
  if (predHome === realHome && predAway === realAway) {
    return { points: 3, result: "exact" };
  }
  const predSign = Math.sign(predHome - predAway);
  const realSign = Math.sign(realHome - realAway);
  if (predSign === realSign) {
    return { points: 1, result: "outcome" };
  }
  return { points: 0, result: "miss" };
}
