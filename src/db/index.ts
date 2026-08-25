import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL manquant (voir .env.example)");

/**
 * Client Drizzle sur le driver HTTP Neon (adapté au serverless Vercel).
 * Toute écriture passe par la couche services — jamais par l'UI (doc 01).
 */
export const db = drizzle(neon(url), { schema });
