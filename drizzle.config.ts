import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL ou DATABASE_URL manquant (voir .env.example)");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema",
  out: "./drizzle",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
