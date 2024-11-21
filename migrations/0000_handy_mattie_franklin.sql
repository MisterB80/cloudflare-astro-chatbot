CREATE TABLE `exchangeSummary` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversationId` text NOT NULL,
	`created` integer NOT NULL,
	`summaryText` text NOT NULL
);
