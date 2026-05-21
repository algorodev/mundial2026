import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import {
  groups,
  groupMembers,
  matches,
  predictions,
  tournaments,
  users,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { calcPoints } from "@/lib/scoring";

export const runtime = "nodejs";
export const alt = "Porra en PorraBros";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// OG dinámica: cuando alguien comparte el enlace de SU porra por WhatsApp,
// el preview enseña nombre + miembros + líder. Multiplica clicks en grupos.
//
// Si algo falla (grupo no existe, DB cae) renderizamos un fallback con el
// branding — nunca rompemos el preview del enlace.
export default async function Image(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const data = await loadData(params.slug);

  return new ImageResponse(<OgCard {...data} />, { ...size });
}

type OgData = {
  groupName: string;
  tournamentName: string | null;
  memberCount: number;
  leaderName: string | null;
  leaderPoints: number;
  fallback: boolean;
};

async function loadData(slug: string): Promise<OgData> {
  const fallback: OgData = {
    groupName: "Tu porra",
    tournamentName: null,
    memberCount: 0,
    leaderName: null,
    leaderPoints: 0,
    fallback: true,
  };

  try {
    const [group] = await db
      .select({
        id: groups.id,
        name: groups.name,
        tournamentId: groups.tournamentId,
      })
      .from(groups)
      .where(eq(groups.slug, slug))
      .limit(1);

    if (!group) return fallback;

    const [tournament] = await db
      .select({ name: tournaments.name })
      .from(tournaments)
      .where(eq(tournaments.id, group.tournamentId))
      .limit(1);

    const memberRows = await db
      .select({ userId: groupMembers.userId, name: users.name })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, group.id));

    if (memberRows.length === 0) {
      return {
        groupName: group.name,
        tournamentName: tournament?.name ?? null,
        memberCount: 0,
        leaderName: null,
        leaderPoints: 0,
        fallback: false,
      };
    }

    const [allMatches, allPreds] = await Promise.all([
      db
        .select({
          id: matches.id,
          homeScore: matches.homeScore,
          awayScore: matches.awayScore,
        })
        .from(matches)
        .where(eq(matches.tournamentId, group.tournamentId)),
      db
        .select({
          userId: predictions.userId,
          matchId: predictions.matchId,
          homeScore: predictions.homeScore,
          awayScore: predictions.awayScore,
        })
        .from(predictions)
        .where(eq(predictions.groupId, group.id)),
    ]);

    const matchById = new Map(allMatches.map((m) => [m.id, m]));
    const points = new Map<number, number>();
    for (const m of memberRows) points.set(m.userId, 0);

    for (const p of allPreds) {
      const m = matchById.get(p.matchId);
      if (!m) continue;
      const { points: pts } = calcPoints(
        p.homeScore,
        p.awayScore,
        m.homeScore,
        m.awayScore
      );
      points.set(p.userId, (points.get(p.userId) ?? 0) + pts);
    }

    let leaderId = memberRows[0].userId;
    let leaderPts = points.get(leaderId) ?? 0;
    for (const m of memberRows) {
      const pts = points.get(m.userId) ?? 0;
      if (pts > leaderPts) {
        leaderId = m.userId;
        leaderPts = pts;
      }
    }
    const leader = memberRows.find((m) => m.userId === leaderId)!;

    return {
      groupName: group.name,
      tournamentName: tournament?.name ?? null,
      memberCount: memberRows.length,
      leaderName: leaderPts > 0 ? leader.name : null,
      leaderPoints: leaderPts,
      fallback: false,
    };
  } catch {
    return fallback;
  }
}

const COLORS = {
  pitch: "#1A1A1A",
  flame: "#FFD23F",
  paper: "#FAFAF7",
  chalkDim: "#A1A1AA",
  grass: "#22C55E",
};

function OgCard(data: OgData) {
  const truncatedName =
    data.groupName.length > 32
      ? data.groupName.slice(0, 30) + "…"
      : data.groupName;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: COLORS.pitch,
        display: "flex",
        flexDirection: "column",
        padding: "60px 80px",
        position: "relative",
        fontFamily: "sans-serif",
      }}
    >
      {/* Bandas decorativas */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: -50,
          right: -50,
          height: 80,
          background: "#7C2D12",
          transform: "rotate(-2deg)",
          opacity: 0.5,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "55%",
          left: -50,
          right: -50,
          height: 60,
          background: COLORS.flame,
          transform: "rotate(1.5deg)",
          opacity: 0.45,
          display: "flex",
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            background: COLORS.flame,
            color: COLORS.pitch,
            padding: "8px 16px",
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: 1,
            textTransform: "uppercase",
            border: `4px solid ${COLORS.pitch}`,
            boxShadow: `6px 6px 0 ${COLORS.flame}`,
            display: "flex",
          }}
        >
          ⚽ PorraBros
        </div>
        {data.tournamentName && (
          <div
            style={{
              color: COLORS.chalkDim,
              fontSize: 20,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              display: "flex",
            }}
          >
            {data.tournamentName}
          </div>
        )}
      </div>

      {/* Cuerpo */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: 88,
            lineHeight: 1,
            fontWeight: 900,
            color: COLORS.paper,
            textTransform: "uppercase",
            letterSpacing: -2,
            maxWidth: 1040,
            display: "flex",
          }}
        >
          {truncatedName}
        </div>

        <div
          style={{
            marginTop: 36,
            display: "flex",
            gap: 24,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Stat
            label="Participantes"
            value={data.memberCount.toString()}
          />
          {data.leaderName ? (
            <LeaderBox name={data.leaderName} points={data.leaderPoints} />
          ) : (
            <Stat label="Estado" value="Sin resultados aún" small />
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: COLORS.chalkDim,
          fontSize: 22,
          letterSpacing: 2,
          textTransform: "uppercase",
          fontWeight: 700,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex" }}>porrabros.com</div>
        <div
          style={{
            background: COLORS.paper,
            color: COLORS.pitch,
            padding: "12px 24px",
            border: `4px solid ${COLORS.pitch}`,
            boxShadow: `6px 6px 0 ${COLORS.flame}`,
            fontSize: 22,
            fontWeight: 900,
            display: "flex",
          }}
        >
          Únete →
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  small = false,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div
      style={{
        background: COLORS.paper,
        color: COLORS.pitch,
        padding: "16px 24px",
        border: `4px solid ${COLORS.pitch}`,
        boxShadow: `6px 6px 0 ${COLORS.flame}`,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div
        style={{
          fontSize: 14,
          letterSpacing: 2,
          textTransform: "uppercase",
          fontWeight: 700,
          opacity: 0.65,
          display: "flex",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: small ? 28 : 56,
          fontWeight: 900,
          lineHeight: 1,
          display: "flex",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function LeaderBox({ name, points }: { name: string; points: number }) {
  const truncated = name.length > 22 ? name.slice(0, 20) + "…" : name;
  return (
    <div
      style={{
        background: COLORS.flame,
        color: COLORS.pitch,
        padding: "16px 24px",
        border: `4px solid ${COLORS.pitch}`,
        boxShadow: `6px 6px 0 ${COLORS.paper}`,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div
        style={{
          fontSize: 14,
          letterSpacing: 2,
          textTransform: "uppercase",
          fontWeight: 700,
          opacity: 0.7,
          display: "flex",
        }}
      >
        🥇 Líder
      </div>
      <div
        style={{
          fontSize: 44,
          fontWeight: 900,
          lineHeight: 1,
          display: "flex",
          alignItems: "baseline",
          gap: 14,
        }}
      >
        <span style={{ display: "flex" }}>{truncated}</span>
        <span
          style={{
            fontSize: 32,
            opacity: 0.7,
            display: "flex",
          }}
        >
          {points} pts
        </span>
      </div>
    </div>
  );
}
