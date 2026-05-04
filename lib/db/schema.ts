import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// Participantes (cada amigo)
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 60 }).notNull(),
    pinHash: text("pin_hash").notNull(),
    isAdmin: integer("is_admin").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    nameIdx: uniqueIndex("users_name_idx").on(t.name),
  })
);

// Partidos del Mundial
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  matchNumber: integer("match_number").notNull().unique(),
  matchDate: varchar("match_date", { length: 20 }).notNull(),
  matchTime: varchar("match_time", { length: 10 }).notNull(),
  kickoffAt: timestamp("kickoff_at").notNull(),
  groupName: varchar("group_name", { length: 5 }).notNull(),
  homeTeam: varchar("home_team", { length: 60 }).notNull(),
  awayTeam: varchar("away_team", { length: 60 }).notNull(),
  homeFlag: varchar("home_flag", { length: 10 }),
  awayFlag: varchar("away_flag", { length: 10 }),
  stadium: varchar("stadium", { length: 80 }).notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
});

// Predicciones de cada usuario para cada partido
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
    homeScore: integer("home_score").notNull(),
    awayScore: integer("away_score").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    userMatchIdx: uniqueIndex("predictions_user_match_idx").on(
      t.userId,
      t.matchId
    ),
  })
);

export type User = typeof users.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;
