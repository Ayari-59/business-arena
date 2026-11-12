import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LE CACHE DU CATALOGUE SUIT SES MIGRATIONS (12 novembre 2026).
 *
 * La lecture du catalogue est en cache (`unstable_cache`, services/catalogue.service.ts), et le
 * cache de données de Next survit aux déploiements. Une migration qui réécrit le catalogue sans
 * changer la clé du cache laisse donc l'ancien catalogue affiché : c'est arrivé avec la migration
 * 0059, qui avait bien aligné les textes en base pendant que /tarifs montrait encore « Découverte ».
 * La clé porte maintenant le numéro de la dernière migration qui touche « catalogue_offres », et
 * cette garde vérifie que c'est bien la dernière du dossier drizzle/.
 */

const racine = process.cwd();
const service = readFileSync(join(racine, "src/services/catalogue.service.ts"), "utf8");

const migrationsDuCatalogue = readdirSync(join(racine, "drizzle"))
  .filter((f) => /^\d{4}_.*\.sql$/.test(f))
  .filter((f) => readFileSync(join(racine, "drizzle", f), "utf8").includes('"catalogue_offres"'))
  .map((f) => f.slice(0, 4))
  .sort();

describe("le cache du catalogue", () => {
  it("porte le numéro de la dernière migration qui touche le catalogue", () => {
    expect(migrationsDuCatalogue.length).toBeGreaterThan(0);
    const declaree = service.match(/export const DERNIERE_MIGRATION_DU_CATALOGUE = "(\d{4})";/)?.[1];
    expect(declaree).toBe(migrationsDuCatalogue.at(-1));
  });

  it("tire sa clé de ce numéro, et de rien d'autre", () => {
    expect(service).toContain("[`catalogue-${DERNIERE_MIGRATION_DU_CATALOGUE}`]");
    expect(service).not.toMatch(/\["catalogue-v\d+"\]/);
  });
});
