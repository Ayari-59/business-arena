import {
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "./_shared";
import { games, teams } from "./game";

export const employeeCategory = pgEnum("employee_category", [
  "production",
  "sales",
  "support",
]);
export const inventoryItem = pgEnum("inventory_item", [
  "raw_material",
  "finished_good",
]);
export const customerKind = pgEnum("customer_kind", ["mass", "key_account"]);
export const transactionKind = pgEnum("transaction_kind", [
  "sale",
  "purchase",
  "payroll",
  "fixed_cost",
  "marketing",
  "quality",
  "maintenance",
  "outsourcing",
  "investment",
  "loan_in",
  "loan_repayment",
  "interest",
  "overdraft_fee",
  "tax",
  "capital_increase",
  "other",
]);

/** Le marché d'une partie (paramètres effectifs courants, macro). */
export const markets = pgTable("markets", {
  id: id(),
  gameId: uuid("game_id")
    .notNull()
    .unique()
    .references(() => games.id, { onDelete: "cascade" }),
  params: jsonb("params").notNull(),
  ...timestamps,
});

/**
 * Segments de clientèle (§10). Les sensibilités (élasticité, marketing, qualité)
 * sont des paramètres CACHÉS : jamais exposés par l'API joueur (doc 01 §6).
 */
export const marketSegments = pgTable(
  "market_segments",
  {
    id: id(),
    marketId: uuid("market_id")
      .notNull()
      .references(() => markets.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    size: numeric("size", { precision: 14, scale: 3 }).notNull(),
    growth: numeric("growth", { precision: 8, scale: 5 }).notNull().default("0"),
    priceElasticity: numeric("price_elasticity", { precision: 8, scale: 5 }).notNull(),
    refPrice: numeric("ref_price", { precision: 14, scale: 2 }).notNull(),
    psychThresholds: jsonb("psych_thresholds"), // [{threshold, penalty}]
    mktSensitivity: numeric("mkt_sensitivity", { precision: 8, scale: 5 }).notNull(),
    qualitySensitivity: numeric("quality_sensitivity", { precision: 8, scale: 5 }).notNull(),
    loyalty: numeric("loyalty", { precision: 8, scale: 5 }).notNull().default("0"),
    paymentDelayDays: integer("payment_delay_days").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("market_segments_market_code_uq").on(t.marketId, t.code)],
);

export const products = pgTable(
  "products",
  {
    id: id(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    perceivedQuality: numeric("perceived_quality", { precision: 8, scale: 5 })
      .notNull()
      .default("1"),
    currentPrice: numeric("current_price", { precision: 14, scale: 2 }).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("products_team_code_uq").on(t.teamId, t.code)],
);

export const productionUnits = pgTable("production_units", {
  id: id(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  unitCapacity: numeric("unit_capacity", { precision: 14, scale: 3 }).notNull(),
  availability: numeric("availability", { precision: 5, scale: 4 }).notNull().default("1"),
  fixedCostPerRound: numeric("fixed_cost_per_round", { precision: 14, scale: 2 }).notNull(),
  acquiredRound: integer("acquired_round").notNull().default(0),
  retiredRound: integer("retired_round"),
  ...timestamps,
});

/** Effectifs agrégés par catégorie — pas de RH individuelle au MVP (doc 05 §5). */
export const employees = pgTable("employees", {
  id: id(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  category: employeeCategory("category").notNull(),
  headcount: integer("headcount").notNull(),
  hoursPerRound: numeric("hours_per_round", { precision: 10, scale: 2 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 14, scale: 2 }).notNull(),
  productivity: numeric("productivity", { precision: 8, scale: 5 }).notNull().default("1"),
  ...timestamps,
});

export const suppliers = pgTable("suppliers", {
  id: id(),
  gameId: uuid("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  material: text("material").notNull(),
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
  leadTimeRounds: integer("lead_time_rounds").notNull().default(0),
  paymentDelayDays: integer("payment_delay_days").notNull().default(0),
  ...timestamps,
});

/** Comptes-clés et masse du segment — événements « perte d'un client », délais différenciés. */
export const customers = pgTable("customers", {
  id: id(),
  gameId: uuid("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  segmentId: uuid("segment_id")
    .notNull()
    .references(() => marketSegments.id, { onDelete: "cascade" }),
  kind: customerKind("kind").notNull().default("mass"),
  name: text("name").notNull(),
  shareOfSegment: numeric("share_of_segment", { precision: 5, scale: 4 }).notNull(),
  ...timestamps,
});

/** Stocks par tour, valorisés au CUMP (doc 02 §5). */
export const inventory = pgTable(
  "inventory",
  {
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    roundIndex: integer("round_index").notNull(),
    item: inventoryItem("item").notNull(),
    productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }),
    quantity: numeric("quantity", { precision: 14, scale: 3 }).notNull(),
    unitCost: numeric("unit_cost", { precision: 14, scale: 4 }).notNull(),
    ...timestamps,
  },
  (t) => [
    // productId nullable ⇒ un index unique remplace la PK composite du doc 05
    uniqueIndex("inventory_team_round_item_product_uq").on(
      t.teamId,
      t.roundIndex,
      t.item,
      t.productId,
    ),
    index("inventory_team_round_idx").on(t.teamId, t.roundIndex),
  ],
);

/** Bilan requêtable : plan de comptes simplifié par tour. Σ débit = Σ crédit (testé). */
export const financialAccounts = pgTable(
  "financial_accounts",
  {
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    roundIndex: integer("round_index").notNull(),
    account: text("account").notNull(), // immobilisations, capitaux_propres, emprunts, clients…
    balance: numeric("balance", { precision: 14, scale: 2 }).notNull(),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.teamId, t.roundIndex, t.account] })],
);

/** Journal des flux du tour — base du budget de trésorerie affiché. */
export const transactions = pgTable(
  "transactions",
  {
    id: id(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    roundIndex: integer("round_index").notNull(),
    kind: transactionKind("kind").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    quantity: numeric("quantity", { precision: 14, scale: 3 }),
    labelKey: text("label_key").notNull(),
    ...timestamps,
  },
  (t) => [index("transactions_team_round_idx").on(t.teamId, t.roundIndex)],
);
