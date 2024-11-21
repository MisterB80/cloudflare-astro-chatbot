CREATE TABLE `chatHistory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`conversationId` text NOT NULL,
	`created` integer NOT NULL,
	`agent` text NOT NULL,
	`text` text NOT NULL
);
