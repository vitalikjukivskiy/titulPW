ALTER TABLE `draws` ADD `weights` text;--> statement-breakpoint
ALTER TABLE `players` ADD `taps` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `players` ADD `tap_updated_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` ADD `video_id` text;