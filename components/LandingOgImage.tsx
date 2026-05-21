import { ImageResponse } from "next/og";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, tournaments } from "@/lib/db/schema";
import type { LandingConfig } from "@/lib/landings";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const COLORS = {
  pitch: "#1A1A1A",
  flame: "#FFD23F",
  paper: "#FAFAF7",
  chalkDim: "#A1A1AA",
  brick: "#7C2D12",
};

const DATE_FMT = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Madrid",
});

export async function renderLandingOg(cfg: LandingConfig) {
  let kickoffLabel: string | null = null;
  try {
    const [tournament] = await db
      .select({ id: tournaments.id })
      .from(tournaments)
      .where(eq(tournaments.slug, cfg.tournamentSlug))
      .limit(1);
    if (tournament) {
      const [first] = await db
        .select({ kickoffAt: matches.kickoffAt })
        .from(matches)
        .where(eq(matches.tournamentId, tournament.id))
        .orderBy(asc(matches.kickoffAt))
        .limit(1);
      if (first) kickoffLabel = DATE_FMT.format(first.kickoffAt);
    }
  } catch {
    // si la DB no responde, OG sin fecha
  }

  return new ImageResponse(
    (
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
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: -50,
            right: -50,
            height: 80,
            background: COLORS.brick,
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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
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
        </div>

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
              fontSize: 96,
              lineHeight: 0.95,
              fontWeight: 900,
              color: COLORS.paper,
              textTransform: "uppercase",
              letterSpacing: -3,
              maxWidth: 1040,
              display: "flex",
            }}
          >
            {cfg.h1}
          </div>
          <div
            style={{
              marginTop: 28,
              maxWidth: 900,
              fontSize: 28,
              lineHeight: 1.3,
              color: COLORS.paper,
              opacity: 0.85,
              display: "flex",
            }}
          >
            {cfg.tagline}
          </div>
          {kickoffLabel && (
            <div
              style={{
                marginTop: 24,
                background: COLORS.paper,
                color: COLORS.pitch,
                padding: "10px 18px",
                border: `4px solid ${COLORS.pitch}`,
                boxShadow: `6px 6px 0 ${COLORS.flame}`,
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: 1,
                textTransform: "uppercase",
                alignSelf: "flex-start",
                display: "flex",
              }}
            >
              Arranca {kickoffLabel}
            </div>
          )}
        </div>

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
            Crea tu porra →
          </div>
        </div>
      </div>
    ),
    { ...ogSize }
  );
}
