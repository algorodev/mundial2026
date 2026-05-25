import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  uniqueIndex,
  varchar,
  index,
} from "drizzle-orm/pg-core";

// Usuarios — auth por email + contraseña (bcrypt). passwordHash es nullable
// para soportar usuarios "transicionales" que existen desde la era magic-link
// y aún no han fijado su contraseña: piden el link, vuelven a /auth/set-password
// y pasan a operar con password de ahí en adelante.
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 200 }).notNull(),
    name: varchar("name", { length: 60 }).notNull(),
    passwordHash: text("password_hash"),
    isGlobalAdmin: integer("is_global_admin").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  })
);

// Torneos creados por el admin global (Mundial 2026, Champions, etc.)
//
// officialGroupId apunta a la "porra oficial pública" del torneo (gestionada
// por el admin global, abierta a todos sin invitación). Cada torneo tiene
// como mucho una. El campo es nullable: si está vacío, no hay porra oficial.
// No usamos FK estricta porque introduce un ciclo (groups → tournaments)
// que drizzle-kit no maneja del todo bien; la integridad se mantiene en
// scripts/make-official.ts y al borrar el grupo (oportunístico).
export const tournaments = pgTable(
  "tournaments",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 60 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    sport: varchar("sport", { length: 30 }).default("futbol").notNull(),
    status: varchar("status", { length: 20 }).default("upcoming").notNull(), // upcoming | live | finished
    officialGroupId: integer("official_group_id"),
    // Integración con API-Football. Si ambas están definidas, el script
    // scripts/map-api-ids.ts y los crons de resultados consumen este torneo.
    apiLeagueId: integer("api_league_id"),
    apiSeason: integer("api_season"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    slugIdx: uniqueIndex("tournaments_slug_idx").on(t.slug),
  })
);

// Partidos pertenecen a un torneo. matchNumber es único por torneo.
export const matches = pgTable(
  "matches",
  {
    id: serial("id").primaryKey(),
    tournamentId: integer("tournament_id")
      .references(() => tournaments.id, { onDelete: "cascade" })
      .notNull(),
    matchNumber: integer("match_number").notNull(),
    matchDate: varchar("match_date", { length: 20 }),
    matchTime: varchar("match_time", { length: 10 }),
    kickoffAt: timestamp("kickoff_at").notNull(),
    groupName: varchar("group_name", { length: 10 }),
    homeTeam: varchar("home_team", { length: 60 }).notNull(),
    awayTeam: varchar("away_team", { length: 60 }).notNull(),
    homeCode: varchar("home_code", { length: 5 }),
    awayCode: varchar("away_code", { length: 5 }),
    homeFlag: varchar("home_flag", { length: 10 }),
    awayFlag: varchar("away_flag", { length: 10 }),
    stadium: varchar("stadium", { length: 120 }),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    // 'api' = lo escribió el cron de auto-resultados. 'admin' = lo escribió
    // un admin global a mano. El cron NUNCA pisa rows con resultSource='admin'.
    resultSource: varchar("result_source", { length: 10 }),
    // Id del fixture en API-Football. Nullable porque los partidos pre-existen
    // al mapeo. Únicó global (postgres ignora nulls en unique indexes).
    apiFixtureId: integer("api_fixture_id"),
  },
  (t) => ({
    tournamentNumberIdx: uniqueIndex("matches_tournament_number_idx").on(
      t.tournamentId,
      t.matchNumber
    ),
    tournamentIdx: index("matches_tournament_idx").on(t.tournamentId),
    apiFixtureIdx: uniqueIndex("matches_api_fixture_idx").on(t.apiFixtureId),
  })
);

// Equipos por torneo. La identidad (Real Madrid, España…) puede repetirse
// entre torneos distintos, pero los IDs y metadatos de API-Football son
// específicos del torneo/temporada, así que vive scoped por (tournamentId, code).
// matches.homeCode/awayCode hacen join lógico con (tournamentId, code).
export const teams = pgTable(
  "teams",
  {
    id: serial("id").primaryKey(),
    tournamentId: integer("tournament_id")
      .references(() => tournaments.id, { onDelete: "cascade" })
      .notNull(),
    code: varchar("code", { length: 5 }).notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    flagEmoji: varchar("flag_emoji", { length: 10 }),
    apiTeamId: integer("api_team_id"),
    logoUrl: text("logo_url"),
  },
  (t) => ({
    tournamentCodeIdx: uniqueIndex("teams_tournament_code_idx").on(
      t.tournamentId,
      t.code
    ),
    tournamentApiTeamIdx: index("teams_tournament_api_team_idx").on(
      t.tournamentId,
      t.apiTeamId
    ),
  })
);

// Grupos — un grupo = una porra dentro de un torneo concreto.
//
// Modos de cierre de predicciones (predictionLockMode):
//   "per-match"        → cada predicción se bloquea cuando empieza ese partido
//                        (opcionalmente, lockMinutesBefore minutos antes)
//   "tournament-start" → todas las predicciones se bloquean cuando empieza el
//                        primer partido del torneo (clásico Mundial / quiniela)
//
// Política de inscripción (joinPolicy):
//   "open"     → cualquiera con el invite link entra directo
//   "approval" → el owner debe aprobar cada solicitud
//   "closed"   → no se admiten más miembros aunque tengan el link
//
// Visibilidad de pronósticos ajenos (predictionsVisibility):
//   "hidden-until-lock" → solo se ven cuando se bloquean (default; el clásico
//                          "no quiero que vean lo que pongo hasta el cierre")
//   "open"              → siempre visibles para los miembros del grupo
export const groups = pgTable(
  "groups",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 80 }).notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    description: text("description"),
    tournamentId: integer("tournament_id")
      .references(() => tournaments.id, { onDelete: "restrict" })
      .notNull(),
    ownerId: integer("owner_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    inviteCode: varchar("invite_code", { length: 16 }).notNull(),
    predictionLockMode: varchar("prediction_lock_mode", { length: 24 })
      .default("per-match")
      .notNull(),
    lockMinutesBefore: integer("lock_minutes_before").default(0).notNull(),
    joinPolicy: varchar("join_policy", { length: 16 })
      .default("open")
      .notNull(),
    joinDeadline: timestamp("join_deadline"),
    // Si es 0 (default): una vez arranca el torneo, no se admiten más
    // miembros (el owner puede activarlo para permitir entradas tardías).
    allowLateJoin: integer("allow_late_join").default(0).notNull(),
    predictionsVisibility: varchar("predictions_visibility", { length: 24 })
      .default("hidden-until-lock")
      .notNull(),
    // "private" (default) = sólo miembros ven nada. "public" = leaderboard
    // accesible sin sesión. Usado por la "porra oficial" por torneo.
    visibility: varchar("visibility", { length: 16 })
      .default("private")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    slugIdx: uniqueIndex("groups_slug_idx").on(t.slug),
    inviteIdx: uniqueIndex("groups_invite_idx").on(t.inviteCode),
  })
);

// Miembros de un grupo — un usuario puede estar en varios grupos.
export const groupMembers = pgTable(
  "group_members",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .references(() => groups.id, { onDelete: "cascade" })
      .notNull(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: varchar("role", { length: 16 }).default("member").notNull(), // owner | member
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => ({
    groupUserIdx: uniqueIndex("group_members_group_user_idx").on(
      t.groupId,
      t.userId
    ),
    userIdx: index("group_members_user_idx").on(t.userId),
  })
);

// Predicciones por (usuario, partido, grupo) — el mismo user puede pronosticar
// el mismo partido distinto en grupos distintos.
export const predictions = pgTable(
  "predictions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    matchId: integer("match_id")
      .references(() => matches.id, { onDelete: "cascade" })
      .notNull(),
    groupId: integer("group_id")
      .references(() => groups.id, { onDelete: "cascade" })
      .notNull(),
    homeScore: integer("home_score").notNull(),
    awayScore: integer("away_score").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    userMatchGroupIdx: uniqueIndex("predictions_user_match_group_idx").on(
      t.userId,
      t.matchId,
      t.groupId
    ),
    groupIdx: index("predictions_group_idx").on(t.groupId),
  })
);

// Solicitudes pendientes de unirse a un grupo cuyo joinPolicy = 'approval'.
// Al aprobar, el row se elimina y se inserta en groupMembers. Si se rechaza,
// se elimina sin más.
export const groupJoinRequests = pgTable(
  "group_join_requests",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .references(() => groups.id, { onDelete: "cascade" })
      .notNull(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    requestedAt: timestamp("requested_at").defaultNow().notNull(),
  },
  (t) => ({
    groupUserIdx: uniqueIndex("group_join_requests_group_user_idx").on(
      t.groupId,
      t.userId
    ),
    groupIdx: index("group_join_requests_group_idx").on(t.groupId),
  })
);

// Magic links de un solo uso (15 min). Tres flujos según `purpose`:
//   "set-password" → usuario transicional crea su contraseña
//   "reset"        → reset desde /forgot-password (mismo destino que set)
//   "login"        → sesión sin contraseña ("magic-link login")
export const magicLinks = pgTable(
  "magic_links",
  {
    id: serial("id").primaryKey(),
    token: varchar("token", { length: 80 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),
    purpose: varchar("purpose", { length: 20 })
      .default("set-password")
      .notNull(),
    redirectTo: varchar("redirect_to", { length: 200 }),
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    tokenIdx: uniqueIndex("magic_links_token_idx").on(t.token),
    emailIdx: index("magic_links_email_idx").on(t.email),
  })
);

// Suscripciones del navegador a Web Push (una por dispositivo). `endpoint` es
// la URL única que entrega el navegador y sirve como id natural de la sub.
// Se borra (DELETE /api/push/subscribe) cuando el usuario desactiva o el
// navegador devuelve 410/404 al enviar (subscription caducada).
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    endpointIdx: uniqueIndex("push_subscriptions_endpoint_idx").on(t.endpoint),
    userIdx: index("push_subscriptions_user_idx").on(t.userId),
  })
);

// Idempotencia del envío de push: para cada (match, eventKey) sólo
// notificamos una vez. Los eventKey los genera el cron (p.ej. "ft",
// "kickoff-warning", "goal-23-Lamal-9", "red-67-Rodri").
export const notifiedEvents = pgTable(
  "notified_events",
  {
    id: serial("id").primaryKey(),
    matchId: integer("match_id")
      .references(() => matches.id, { onDelete: "cascade" })
      .notNull(),
    eventKey: varchar("event_key", { length: 120 }).notNull(),
    notifiedAt: timestamp("notified_at").defaultNow().notNull(),
  },
  (t) => ({
    matchKeyIdx: uniqueIndex("notified_events_match_key_idx").on(
      t.matchId,
      t.eventKey
    ),
  })
);

export type User = typeof users.$inferSelect;
export type Tournament = typeof tournaments.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NotifiedEvent = typeof notifiedEvents.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
export type GroupJoinRequest = typeof groupJoinRequests.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;
export type MagicLink = typeof magicLinks.$inferSelect;
