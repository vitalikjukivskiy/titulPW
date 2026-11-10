import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
export const players=sqliteTable("players",{
 id:integer("id").primaryKey({autoIncrement:true}),nickname:text("nickname").notNull(),
 nameKey:text("name_key").notNull(),deviceId:text("device_id").notNull(),
 donationCode:text("donation_code"),createdAt:integer("created_at").notNull(), taps:integer("taps").notNull().default(0), tapUpdatedAt:integer("tap_updated_at").notNull().default(0),
},t=>[uniqueIndex("idx_players_name_key").on(t.nameKey),uniqueIndex("idx_players_device_id").on(t.deviceId),uniqueIndex("idx_players_donation_code").on(t.donationCode)]);
export const draws=sqliteTable("draws",{
 id:integer("id").primaryKey({autoIncrement:true}),round:integer("round").notNull().unique(),
 entries:text("entries").notNull(),winnerIndex:integer("winner_index").notNull(),
 startedAt:integer("started_at").notNull(),finishedAt:integer("finished_at"), weights:text("weights"),
});
export const settings=sqliteTable("settings",{
 id:integer("id").primaryKey(),registrationOpen:integer("registration_open").notNull().default(1), videoId:text("video_id"),
});

export const donations=sqliteTable("donations",{
 pubId:text("pub_id").primaryKey(),playerId:integer("player_id").references(()=>players.id,{onDelete:"set null"}),
 round:integer("round").notNull(),amountMinor:integer("amount_minor").notNull(),
 paidAt:integer("paid_at").notNull(),receivedAt:integer("received_at").notNull(),
});
