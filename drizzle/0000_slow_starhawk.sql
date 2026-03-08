CREATE TABLE `chats` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`model` text NOT NULL,
	`messages` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `preferences` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
