export type ScoreResult = "exact" | "outcome" | "miss" | "pending";
export type ExtResult = "exact" | "right" | "miss" | "na";

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
    return { points: 4, result: "exact" };
  }
  const predSign = Math.sign(predHome - predAway);
  const realSign = Math.sign(realHome - realAway);
  if (predSign === realSign) {
    return { points: 1, result: "outcome" };
  }
  return { points: 0, result: "miss" };
}

// Puntos adicionales para partidos con knockoutScoring='extended'.
// AET (120'): mismo sistema 3/1/0 que el 90min, evaluado independientemente.
// PEN: solo +1 si se acierta el marcador exacto de la tanda. Sin "signo".
// Cada sección solo se evalúa si el partido real llegó hasta ese punto.
export function calcExtendedPoints(pred: {
  homeScoreAet: number | null | undefined;
  awayScoreAet: number | null | undefined;
  penaltyHome: number | null | undefined;
  penaltyAway: number | null | undefined;
}, real: {
  homeScoreAet: number | null | undefined;
  awayScoreAet: number | null | undefined;
  penaltyHome: number | null | undefined;
  penaltyAway: number | null | undefined;
}): { aetPoints: number; penPoints: number; aetResult: ExtResult; penResult: ExtResult } {
  let aetResult: ExtResult = "na";
  let penResult: ExtResult = "na";

  // AET: 3 exacto, 1 signo, 0 fallo (igual que 90min).
  const { points: aetPoints, result: aetRaw } = real.homeScoreAet != null
    ? calcPoints(pred.homeScoreAet, pred.awayScoreAet, real.homeScoreAet, real.awayScoreAet)
    : { points: 0, result: "pending" as const };
  if (real.homeScoreAet != null) {
    aetResult = aetRaw === "pending" ? "miss" : aetRaw === "exact" ? "exact" : aetRaw === "outcome" ? "right" : "miss";
  }

  // PEN: +1 solo si se acierta el marcador exacto. No hay signo.
  let penPoints = 0;
  if (real.penaltyHome != null && real.penaltyAway != null) {
    const exactPen =
      pred.penaltyHome != null &&
      pred.penaltyAway != null &&
      pred.penaltyHome === real.penaltyHome &&
      pred.penaltyAway === real.penaltyAway;
    penResult = exactPen ? "exact" : "miss";
    if (exactPen) penPoints = 1;
  }

  return { aetPoints, penPoints, aetResult, penResult };
}
