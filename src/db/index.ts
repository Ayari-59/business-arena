import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL manquant (voir .env.example)");

/**
 * Client Drizzle. Le pilote suit l'URL.
 *
 * La production tourne sur Neon, dont le pilote HTTP convient au serverless de
 * Vercel. Mais ce pilote parle le protocole HTTP de Neon, pas Postgres : il ne
 * sait donc pas se connecter à un Postgres ordinaire, et rien ne pouvait
 * lancer l'application entière ailleurs que chez Neon. C'est ce qui empêchait
 * d'écrire un parcours de bout en bout, en intégration continue comme en
 * local, alors que les deux recettes en navigateur ont montré que les fautes
 * qui restent vivent précisément là.
 *
 * Une URL Neon prend donc le pilote Neon, toute autre URL Postgres prend le
 * pilote standard. Le schéma et les migrations sont les mêmes des deux côtés :
 * c'est bien la même base qui est testée.
 */
const estNeon = /\.neon\.tech|neon\.build|localtest\.me/.test(url);

/**
 * Les deux pilotes exposent la même API Drizzle, mais leurs types diffèrent sur
 * des détails de surcharge. Les services sont écrits contre un seul type, celui
 * de la production : le pilote standard s'y conforme à l'exécution.
 */
type Db = ReturnType<typeof drizzleNeon<typeof schema>>;

export const db: Db = estNeon
  ? drizzleNeon(neon(url), { schema })
  : (drizzlePg(url, { schema }) as unknown as Db);
