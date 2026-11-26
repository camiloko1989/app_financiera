CREATE TABLE `account` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`institution` text,
	`currency` text NOT NULL,
	`liquidity` text NOT NULL,
	`owner_member_id` integer,
	`is_investment` integer DEFAULT false NOT NULL,
	`maturity_date` text,
	`counts_as_liquidity` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`owner_member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `account_balance` (
	`snapshot_id` integer NOT NULL,
	`account_id` integer NOT NULL,
	`balance` integer NOT NULL,
	`contribution` integer,
	PRIMARY KEY(`snapshot_id`, `account_id`),
	FOREIGN KEY (`snapshot_id`) REFERENCES `snapshot`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `account`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `advice` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rule_id` text NOT NULL,
	`snapshot_id` integer,
	`severity` text NOT NULL,
	`impact_cop` integer DEFAULT 0 NOT NULL,
	`data_json` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'nuevo' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`dismissed_at` text,
	FOREIGN KEY (`snapshot_id`) REFERENCES `snapshot`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `advice_rule_status_idx` ON `advice` (`rule_id`,`status`);--> statement-breakpoint
CREATE TABLE `debt` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`direction` text NOT NULL,
	`currency` text DEFAULT 'COP' NOT NULL,
	`rate_bps` integer,
	`rate_unit` text,
	`installment` integer,
	`term_months` integer,
	`owner_member_id` integer,
	`archived` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`owner_member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `debt_balance` (
	`snapshot_id` integer NOT NULL,
	`debt_id` integer NOT NULL,
	`balance` integer NOT NULL,
	PRIMARY KEY(`snapshot_id`, `debt_id`),
	FOREIGN KEY (`snapshot_id`) REFERENCES `snapshot`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`debt_id`) REFERENCES `debt`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `goal` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`target_amount` integer,
	`target_date` text,
	`monthly_contribution` integer,
	`priority` integer NOT NULL,
	`manual_progress` integer,
	`archived` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `goal_account` (
	`goal_id` integer NOT NULL,
	`account_id` integer NOT NULL,
	PRIMARY KEY(`goal_id`, `account_id`),
	FOREIGN KEY (`goal_id`) REFERENCES `goal`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `account`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `income` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`concept` text,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`kind` text NOT NULL,
	`frequency` text DEFAULT 'mensual' NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `member` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`income_profile` text NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `obligation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`concept` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'COP' NOT NULL,
	`frequency` text DEFAULT 'mensual' NOT NULL,
	`payer_member_id` integer NOT NULL,
	`payment_method` text,
	`shared` integer DEFAULT false NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`payer_member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `prorated_expense` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`concept` text NOT NULL,
	`cost` integer NOT NULL,
	`duration_months` integer NOT NULL,
	`owner_member_id` integer NOT NULL,
	`start_date` text,
	`archived` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`owner_member_id`) REFERENCES `member`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `provision` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`concept` text NOT NULL,
	`annual_amount` integer NOT NULL,
	`due_date` text NOT NULL,
	`saved_amount` integer DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `purchase_query` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`description` text,
	`price` integer NOT NULL,
	`currency` text NOT NULL,
	`payment_method` text NOT NULL,
	`installments` integer,
	`kind` text NOT NULL,
	`result_json` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `setting` (
	`key` text PRIMARY KEY NOT NULL,
	`value_json` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `snapshot` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`trm_cents` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`edited_at` text,
	`note` text
);
