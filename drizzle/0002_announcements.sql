CREATE TABLE `daily_announcements` (
	`guild_id` text NOT NULL,
	`date` text NOT NULL,
	`channel_id` text NOT NULL,
	`message_id` text NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`guild_id`, `date`)
);
--> statement-breakpoint
ALTER TABLE `battles` ADD `channel_id` text;