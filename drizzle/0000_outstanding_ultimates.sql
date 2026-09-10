CREATE TABLE `listing_specialities` (
	`listing_id` integer NOT NULL,
	`speciality_id` integer NOT NULL,
	PRIMARY KEY(`listing_id`, `speciality_id`),
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`speciality_id`) REFERENCES `specialities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`practice_name` text NOT NULL,
	`contact_name` text NOT NULL,
	`goc_number` text NOT NULL,
	`address_line_1` text NOT NULL,
	`address_line_2` text,
	`city` text NOT NULL,
	`postcode` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`website` text,
	`description` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`edit_token` text NOT NULL,
	`rejection_reason` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `listings_slug_unique` ON `listings` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `listings_edit_token_unique` ON `listings` (`edit_token`);--> statement-breakpoint
CREATE TABLE `specialities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `specialities_slug_unique` ON `specialities` (`slug`);