CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`expense_date` text NOT NULL,
	`type` text NOT NULL,
	`category` text NOT NULL,
	`amount` integer NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ledger_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`initial_investment` integer DEFAULT 650000 NOT NULL,
	`dividend_ratio` integer DEFAULT 90 NOT NULL,
	`profit_mapping_ratio` integer DEFAULT 100 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `share_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_date` text NOT NULL,
	`seller` text NOT NULL,
	`buyer` text NOT NULL,
	`units` integer NOT NULL,
	`price` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`units` integer NOT NULL,
	`value` integer NOT NULL,
	`status` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
