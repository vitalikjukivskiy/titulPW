CREATE TABLE `draws` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`round` integer NOT NULL,
	`entries` text NOT NULL,
	`winner_index` integer NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `draws_round_unique` ON `draws` (`round`);--> statement-breakpoint
CREATE TABLE `players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nickname` text NOT NULL,
	`name_key` text NOT NULL,
	`device_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_players_name_key` ON `players` (`name_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_players_device_id` ON `players` (`device_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`registration_open` integer DEFAULT 1 NOT NULL
);
