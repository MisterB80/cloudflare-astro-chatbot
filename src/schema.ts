// src/schema.ts
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const exchangeSummary = sqliteTable("exchangeSummary", {
    id: integer("id").primaryKey({
        autoIncrement: true,
    }),
    conversationId: text("conversationId").notNull(),
    created: integer("created", {
        mode: "timestamp_ms",
    })
        .notNull()
        .$defaultFn(() => new Date()),
    summaryText: text("summaryText").notNull(),
});

export const chatHistory = sqliteTable("chatHistory", {
    id: integer("id").primaryKey({
        autoIncrement: true,
    }),
    conversationId: text("conversationId").notNull(),
    created: integer("created", {
        mode: "timestamp_ms",
    })
        .notNull()
        .$defaultFn(() => new Date()),
    agent: text("agent").notNull(),
    text: text("text").notNull(),
});
