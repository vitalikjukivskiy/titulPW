CREATE TABLE `donations` (
	`pub_id` text PRIMARY KEY NOT NULL,
	`player_id` integer,
	`round` integer NOT NULL,
	`amount_minor` integer NOT NULL,
	`paid_at` integer NOT NULL,
	`received_at` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE `players` ADD `donation_code` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_players_donation_code` ON `players` (`donation_code`);