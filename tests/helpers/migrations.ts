import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Ce que deux tests doivent savoir des migrations, en un seul endroit.
 *
 * La liste ci-dessous est lue par le test d'architecture (qui vérifie la FORME
 * des fichiers) et par le test d'intégration (qui les REJOUE sur un Postgres
 * embarqué). La tenir en double, c'est se garantir qu'elle divergera.
 */

export const DOSSIER_MIGRATIONS = join(process.cwd(), "drizzle");

/**
 * Les migrations de l'historique, exemptées de la règle de rejouabilité.
 *
 * Elles sont enregistrées dans la table de suivi de la production — leur
 * empreinte y figure, vérifiée le 14/09/2026 — et leur horodatage est sous le
 * dernier enregistré : drizzle ne les rejouera jamais. Les réécrire ne
 * servirait à rien et changerait leur empreinte, ce qui brouillerait justement
 * cette vérification.
 *
 * Toute AUTRE migration doit pouvoir être rejouée sans casser : c'est ce qui
 * permet de remettre au journal une migration déjà appliquée sans faire échouer
 * le déploiement. N'ayant pas à figurer ici, une migration nouvelle y est
 * soumise d'office.
 */
export const MIGRATIONS_HISTORIQUES = new Set([
  "0000_lethal_post",
  "0001_lucky_pete_wisdom",
  "0002_friendly_thaddeus_ross",
  "0003_useful_triton",
  "0004_greedy_maverick",
  "0005_cooing_wild_pack",
  "0006_competition_entries_label_ci",
  "0007_competition_join_code",
  "0008_games_priority_indexes",
  "0009_secondary_indexes",
  "0010_trigger_context",
  "0011_consequence_context",
  "0012_interpretation_context",
]);

/** Les noms des fichiers de migration présents sur disque, sans l'extension. */
export function tagsSurDisque(): string[] {
  return readdirSync(DOSSIER_MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => f.slice(0, -".sql".length))
    .sort();
}

/** Le texte brut d'une migration. */
export function sqlDe(tag: string): string {
  return readFileSync(join(DOSSIER_MIGRATIONS, `${tag}.sql`), "utf8");
}

/**
 * Les instructions d'une migration, découpées comme drizzle les découpe : sur
 * `--> statement-breakpoint`, jamais sur le point-virgule — un bloc DO en
 * contient plusieurs et ne doit pas être coupé.
 */
export function instructionsDe(tag: string): string[] {
  return sqlDe(tag)
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
