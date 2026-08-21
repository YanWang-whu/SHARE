import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const ledgerSettings = sqliteTable("ledger_settings", {
  id: integer("id").primaryKey(),
  initialInvestment: integer("initial_investment").notNull().default(650000),
  dividendRatio: integer("dividend_ratio").notNull().default(90),
  profitMappingRatio: integer("profit_mapping_ratio").notNull().default(100),
  updatedAt: text("updated_at").notNull(),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(), name: text("name").notNull(),
  units: integer("units").notNull(), value: integer("value").notNull(),
  status: text("status").notNull(), note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export const shareTransactions = sqliteTable("share_transactions", {
  id: text("id").primaryKey(), transactionDate: text("transaction_date").notNull(),
  seller: text("seller").notNull(), buyer: text("buyer").notNull(),
  units: integer("units").notNull(), price: integer("price").notNull(), createdAt: text("created_at").notNull(),
});

export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey(), expenseDate: text("expense_date").notNull(),
  type: text("type").notNull(), category: text("category").notNull(),
  amount: integer("amount").notNull(), note: text("note").notNull().default(""), createdAt: text("created_at").notNull(),
});
