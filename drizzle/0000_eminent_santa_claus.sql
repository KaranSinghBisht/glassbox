CREATE TABLE `action_proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`action_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`rationale` text,
	`risk` text DEFAULT 'low' NOT NULL,
	`diff_before` text,
	`diff_after` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`status` text DEFAULT 'idle' NOT NULL,
	`parent_id` text,
	FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`proposal_id` text NOT NULL,
	`approved` integer NOT NULL,
	`reason` text,
	`approved_at` integer NOT NULL,
	FOREIGN KEY (`proposal_id`) REFERENCES `action_proposals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `artifacts` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`name` text NOT NULL,
	`content_type` text DEFAULT 'text/plain' NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`agent_id` text,
	`type` text NOT NULL,
	`payload` text,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`prompt` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`completed_at` integer
);
