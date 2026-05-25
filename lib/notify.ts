// Composición de notificaciones de PorraBros — qué texto y a quién.
//
// Audiencia: subs cuyos usuarios sean miembros de algún grupo del torneo
// del match. Se calcula una vez por match (función pickRecipients) y se
// reutiliza para todos los eventos de ese match en el mismo tick.

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  groupMembers,
  groups,
  pushSubscriptions,
} from "@/lib/db/schema";
import type { Match } from "@/lib/db/schema";
import { markEventOnce, sendToUsers } from "@/lib/push";

export async function pickRecipients(tournamentId: number): Promise<number[]> {
  // userIds suscritos que pertenecen a algún grupo de este torneo.
  const rows = await db
    .selectDistinct({ userId: pushSubscriptions.userId })
    .from(pushSubscriptions)
    .innerJoin(
      groupMembers,
      eq(groupMembers.userId, pushSubscriptions.userId)
    )
    .innerJoin(
      groups,
      eq(groups.id, groupMembers.groupId)
    )
    .where(eq(groups.tournamentId, tournamentId));
  return rows.map((r) => r.userId);
}

// ─── Payloads tipo-a-tipo ──────────────────────────────────────────────

export async function notifyKickoffWarning(
  match: Match,
  recipients: number[]
): Promise<boolean> {
  const fresh = await markEventOnce(match.id, "kickoff-warning");
  if (!fresh) return false;
  await sendToUsers(recipients, {
    title: `⏱ Empieza en 15 min`,
    body: `${match.homeTeam} vs ${match.awayTeam}${match.stadium ? ` · ${match.stadium}` : ""}`,
    tag: `match-${match.id}-kickoff`,
    url: "/groups",
  });
  return true;
}

export async function notifyFinal(
  match: Match,
  homeScore: number,
  awayScore: number,
  recipients: number[]
): Promise<boolean> {
  const fresh = await markEventOnce(match.id, "ft");
  if (!fresh) return false;
  await sendToUsers(recipients, {
    title: `🏁 Final · ${match.homeTeam} ${homeScore}-${awayScore} ${match.awayTeam}`,
    body: `Mira cómo te ha ido en la porra`,
    tag: `match-${match.id}-ft`,
    url: "/groups",
  });
  return true;
}

export async function notifyGoal(
  match: Match,
  recipients: number[],
  ev: {
    minute: number;
    extra: number | null;
    player: string;
    teamName: string;
    scoreHome: number | null;
    scoreAway: number | null;
    detail: string; // "Normal Goal" | "Penalty" | "Own Goal"
  }
): Promise<boolean> {
  const minuteLabel = ev.extra ? `${ev.minute}+${ev.extra}'` : `${ev.minute}'`;
  const key = `goal-${ev.minute}-${ev.extra ?? 0}-${slugifyName(ev.player)}-${slugifyName(ev.teamName)}`;
  const fresh = await markEventOnce(match.id, key);
  if (!fresh) return false;

  const scoreSuffix =
    ev.scoreHome !== null && ev.scoreAway !== null
      ? ` · ${match.homeTeam} ${ev.scoreHome}-${ev.scoreAway} ${match.awayTeam}`
      : "";
  const titleSuffix =
    ev.detail === "Penalty"
      ? " (penalti)"
      : ev.detail === "Own Goal"
        ? " (en propia)"
        : "";

  await sendToUsers(recipients, {
    title: `⚽ Gol de ${ev.teamName}${titleSuffix}`,
    body: `${ev.player} ${minuteLabel}${scoreSuffix}`,
    tag: `match-${match.id}-goal`,
    url: "/groups",
  });
  return true;
}

export async function notifyRedCard(
  match: Match,
  recipients: number[],
  ev: { minute: number; extra: number | null; player: string; teamName: string }
): Promise<boolean> {
  const minuteLabel = ev.extra ? `${ev.minute}+${ev.extra}'` : `${ev.minute}'`;
  const key = `red-${ev.minute}-${ev.extra ?? 0}-${slugifyName(ev.player)}`;
  const fresh = await markEventOnce(match.id, key);
  if (!fresh) return false;
  await sendToUsers(recipients, {
    title: `🟥 Roja a ${ev.player}`,
    body: `${ev.teamName} · ${minuteLabel} · ${match.homeTeam} vs ${match.awayTeam}`,
    tag: `match-${match.id}-red`,
    url: "/groups",
  });
  return true;
}

export async function notifyMissedPenalty(
  match: Match,
  recipients: number[],
  ev: { minute: number; extra: number | null; player: string; teamName: string }
): Promise<boolean> {
  const minuteLabel = ev.extra ? `${ev.minute}+${ev.extra}'` : `${ev.minute}'`;
  const key = `misspen-${ev.minute}-${ev.extra ?? 0}-${slugifyName(ev.player)}`;
  const fresh = await markEventOnce(match.id, key);
  if (!fresh) return false;
  await sendToUsers(recipients, {
    title: `❌ Penalti fallado`,
    body: `${ev.player} (${ev.teamName}) · ${minuteLabel} · ${match.homeTeam} vs ${match.awayTeam}`,
    tag: `match-${match.id}-misspen`,
    url: "/groups",
  });
  return true;
}

// Para construir eventKeys consistentes y URL-safe.
function slugifyName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .slice(0, 40);
}
