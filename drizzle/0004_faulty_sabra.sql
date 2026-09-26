CREATE TABLE `admin_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`password_hash` text NOT NULL,
	`two_factor_pin_hash` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'general' NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tag_alerts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`postcode` text,
	`radius_miles` integer DEFAULT 25 NOT NULL,
	`specialities` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`goc_number` text NOT NULL,
	`subscribe_updates` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_listing_specialities` (
	`listing_id` integer NOT NULL,
	`speciality_id` integer NOT NULL,
	`offered_by` text,
	`referral_type` text,
	PRIMARY KEY(`listing_id`, `speciality_id`),
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`speciality_id`) REFERENCES `specialities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_listing_specialities`("listing_id", "speciality_id", "offered_by", "referral_type") SELECT "listing_id", "speciality_id", "offered_by", "referral_type" FROM `listing_specialities`;--> statement-breakpoint
DROP TABLE `listing_specialities`;--> statement-breakpoint
ALTER TABLE `__new_listing_specialities` RENAME TO `listing_specialities`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_listings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
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
	`working_days` text,
	`subscribe_updates` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'approved' NOT NULL,
	`edit_token` text NOT NULL,
	`rejection_reason` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_listings`("id", "user_id", "slug", "practice_name", "contact_name", "goc_number", "address_line_1", "address_line_2", "city", "postcode", "latitude", "longitude", "phone", "email", "website", "description", "working_days", "subscribe_updates", "status", "edit_token", "rejection_reason", "created_at", "updated_at") SELECT "id", "user_id", "slug", "practice_name", "contact_name", "goc_number", "address_line_1", "address_line_2", "city", "postcode", "latitude", "longitude", "phone", "email", "website", "description", "working_days", "subscribe_updates", "status", "edit_token", "rejection_reason", "created_at", "updated_at" FROM `listings`;--> statement-breakpoint
DROP TABLE `listings`;--> statement-breakpoint
ALTER TABLE `__new_listings` RENAME TO `listings`;--> statement-breakpoint
CREATE UNIQUE INDEX `listings_slug_unique` ON `listings` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `listings_edit_token_unique` ON `listings` (`edit_token`);--> statement-breakpoint
ALTER TABLE `specialities` ADD `status` text DEFAULT 'approved' NOT NULL;