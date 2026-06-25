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
    return { points: 3, result: "exact" };
  }
  const predSign = Math.sign(predHome - predAway);
  const realSign = Math.sign(realHome - realAway);
  if (predSign === realSign) {
    return { points: 1, result: "outcome" };
  }
  return { points: 0, result: "miss" };
}

// Puntos adicionales para partidos con knockoutScoring='extended'.
// Solo se puntúa si el partido real llegó a prórroga / penaltis.
//
// AET (2pts exacto, 1pt acertó quién ganó):
//   Solo se evalúa cuando realHomeAet != null (match llegó a prórroga).
//   "na" si el partido terminó en 90'.
// PEN (1pt ganador correcto):
//   Solo se evalúa cuando realPenHome != null (match llegó a penaltis).
//   "na" si el partido no fue a penaltis.
export function calcExtendedPoints(pred: {
  homeScoreAet: number | null | undefined;
  awayScoreAet: number | null | undefined;
  penaltyWinner: string | null | undefined;
}, real: {
  homeScoreAet: number | null | undefined;
  awayScoreAet: number | null | undefined;
  penaltyHome: number | null | undefined;
  penaltyAway: number | null | undefined;
}): { aetPoints: number; penPoints: number; aetResult: ExtResult; penResult: ExtResult } {
  let aetPoints = 0;
  let aetResult: ExtResult = "na";
  let penPoints = 0;
  let penResult: ExtResult = "na";

  if (real.homeScoreAet != null && real.awayScoreAet != null) {
    if (pred.homeScoreAet == null || pred.awayScoreAet == null) {
      aetResult = "miss";
    } else if (pred.homeScoreAet === real.homeScoreAet && pred.awayScoreAet === real.awayScoreAet) {
      aetPoints = 2;
      aetResult = "exact";
    } else {
      const predSign = Math.sign(pred.homeScoreAet - pred.awayScoreAet);
      const realSign = Math.sign(real.homeScoreAet - real.awayScoreAet);
      if (predSign === realSign && predSign !== 0) {
        aetPoints = 1;
        aetResult = "right";
      } else {
        aetResult = "miss";
      }
    }
  }

  if (real.penaltyHome != null && real.penaltyAway != null) {
    const realWinner = real.penaltyHome > real.penaltyAway ? "home" : "away";
    if (pred.penaltyWinner == null) {
      penResult = "miss";
    } else if (pred.penaltyWinner === realWinner) {
      penPoints = 1;
      penResult = "right";
    } else {
      penResult = "miss";
    }
  }

  return { aetPoints, penPoints, aetResult, penResult };
}
