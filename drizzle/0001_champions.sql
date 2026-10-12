CREATE TABLE `daily_champions` (
	`date` text PRIMARY KEY NOT NULL,
	`champion_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `battles` ADD `champion_id` text DEFAULT 'red' NOT NULL;