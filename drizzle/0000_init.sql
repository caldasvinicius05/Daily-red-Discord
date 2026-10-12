CREATE TABLE `battles` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`guild_id` text,
	`mode` text NOT NULL,
	`date` text NOT NULL,
	`seed` text NOT NULL,
	`team` text NOT NULL,
	`lead_index` integer NOT NULL,
	`actions` text NOT NULL,
	`action_count` integer NOT NULL,
	`status` text NOT NULL,
	`result` text,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `battles_daily_unique` ON `battles` (`player_id`,`date`) WHERE "battles"."mode" = 'daily';--> statement-breakpoint
CREATE INDEX `battles_guild_date` ON `battles` (`guild_id`,`date`);--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`avatar` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
