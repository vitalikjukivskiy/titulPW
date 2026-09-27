import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
export const players=sqliteTable("players",{
 id:integer("id").primaryKey({autoIncrement:true}),nickname:text("nickname").notNull(),
 nameKey:text("name_key").notNull(),deviceId:text("device_id").notNull(),
 createdAt:integer("created_at").notNull(),
},t=>[uniqueIndex("idx_players_name_key").on(t.nameKey),uniqueIndex("idx_players_device_id").on(t.deviceId)]);
export const draws=sqliteTable("draws",{
 id:integer("id").primaryKey({autoIncrement:true}),round:integer("round").notNull().unique(),
 entries:text("entries").notNull(),winnerIndex:integer("winner_index").notNull(),
 startedAt:integer("started_at").notNull(),finishedAt:integer("finished_at"),
});
export const settings=sqliteTable("settings",{
 id:integer("id").primaryKey(),registrationOpen:integer("registration_open").notNull().default(1),
});
