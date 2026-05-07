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

// Usuarios — auth por email + magic link, sin contraseña.
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 200 }).notNull(),
    name: varchar("name", { length: 60 }).notNull(),
    isGlobalAdmin: integer("is_global_admin").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  })
);

// Torneos creados por el admin global (Mundial 2026, Champions, etc.)
export const tournaments = pgTable(
  "tournaments",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 60 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    sport: varchar("sport", { length: 30 }).default("futbol").notNull(),
    status: varchar("status", { length: 20 }).default("upcoming").notNull(), // upcoming | live | finished
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
    homeFlag: varchar("home_flag", { length: 10 }),
    awayFlag: varchar("away_flag", { length: 10 }),
    stadium: varchar("stadium", { length: 120 }),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
  },
  (t) => ({
    tournamentNumberIdx: uniqueIndex("matches_tournament_number_idx").on(
      t.tournamentId,
      t.matchNumber
    ),
    tournamentIdx: index("matches_tournament_idx").on(t.tournamentId),
  })
);

// Grupos — un grupo = una porra dentro de un torneo concreto.
export const groups = pgTable(
  "groups",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 80 }).notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    tournamentId: integer("tournament_id")
      .references(() => tournaments.id, { onDelete: "restrict" })
      .notNull(),
    ownerId: integer("owner_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    inviteCode: varchar("invite_code", { length: 16 }).notNull(),
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

// Magic links para login por email. Token de un solo uso, expira en 15 min.
export const magicLinks = pgTable(
  "magic_links",
  {
    id: serial("id").primaryKey(),
    token: varchar("token", { length: 80 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),
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

export type User = typeof users.$inferSelect;
export type Tournament = typeof tournaments.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;
export type MagicLink = typeof magicLinks.$inferSelect;
