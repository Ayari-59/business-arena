import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * LE MONDE DU COURS NE LIT PAS L'ARÈNE.
 *
 * Décision du propriétaire (octobre 2026) : le contenu du cours fait l'objet de sa propre
 * simulation, inspirée des entreprises de l'arène, figée, et qui ne change pas quand le moteur
 * évolue (src/config/cours/monde). Les fichiers du monde du cours, et les chapitres et cas déjà
 * passés sur lui, ne doivent donc atteindre, ni directement ni de proche en proche, ni le moteur
 * (src/engine), ni les scénarios de l'arène (src/config/scenarios), ni l'année du cours jouée par
 * l'arène (cas.ts, arene-du-cours.ts et les rejeux). Un import de type seulement ne charge rien :
 * il est permis.
 */

const SRC = join(process.cwd(), "src");
const COURS = join(SRC, "config", "cours");

/** Les fichiers du cours, hors du monde lui-même, sous un dossier donné. */
function fichiersDe(dossier: string): string[] {
  return readdirSync(join(COURS, dossier), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? fichiersDe(join(dossier, e.name)) : e.name.endsWith(".ts") ? [join(dossier, e.name)] : [],
  );
}


/** Ce que le monde du cours ne doit pas atteindre. */
const INTERDITS = [
  join(SRC, "engine"),
  join(SRC, "config", "scenarios"),
  ...["annee-de-l-arene.ts", "arene-du-cours.ts", "gestion-de-la-pme.ts", "decision.ts", "trois-annees.ts", "ressources-humaines.ts", "gamme.ts"].map((f) => join(COURS, f)),
];

/** Les imports qui chargent du code (pas les `import type`), résolus en fichiers. */
function importsDe(fichier: string): string[] {
  const source = readFileSync(fichier, "utf8");
  const chemins: string[] = [];
  for (const m of source.matchAll(/^(?:import|export)\s+(?!type\b)[\s\S]*?\sfrom\s+"([^"]+)"/gm)) chemins.push(m[1]!);
  for (const m of source.matchAll(/^import\s+"([^"]+)"/gm)) chemins.push(m[1]!);
  return chemins.flatMap((c) => {
    const base = c.startsWith("@/") ? join(SRC, c.slice(2)) : c.startsWith(".") ? resolve(dirname(fichier), c) : null;
    if (!base) return [];
    const candidat = [`${base}.ts`, `${base}.tsx`, join(base, "index.ts"), base].find((x) => existsSync(x) && !x.endsWith("/"));
    return candidat ? [candidat] : [];
  });
}

/** Le premier chemin d'imports qui atteint un fichier interdit, ou rien. */
function cheminInterdit(depart: string): string[] | null {
  const vus = new Set<string>();
  const pile: string[][] = [[depart]];
  while (pile.length) {
    const chemin = pile.pop()!;
    const ici = chemin.at(-1)!;
    if (INTERDITS.some((x) => ici === x || ici.startsWith(`${x}/`))) return chemin.map((x) => relative(SRC, x));
    if (vus.has(ici)) continue;
    vus.add(ici);
    for (const suivant of importsDe(ici)) pile.push([...chemin, suivant]);
  }
  return null;
}

const DU_MONDE = readdirSync(join(COURS, "monde")).filter((f) => f.endsWith(".ts")).map((f) => `monde/${f}`);

/**
 * LE REGISTRE DES CHAPITRES ET DES CAS PASSÉS SUR LE MONDE DU COURS. Il ne fait que grandir : chaque
 * fichier inscrit ne doit plus atteindre l'arène, et tout chapitre ou cas qui ne l'atteint plus doit
 * y être inscrit (la garde le demande), pour qu'aucun ne revienne en arrière sans que cela se voie.
 */
const PASSES_SUR_LE_MONDE: readonly string[] = [
  "chapitres/analyse-des-ecarts.ts",
  "chapitres/bilan-fonctionnel.ts",
  "chapitres/budget-de-tresorerie.ts",
  "chapitres/cout-complet.ts",
  "chapitres/cout-par-produit.ts",
  "chapitres/creation-premier-bilan.ts",
  "chapitres/decider.ts",
  "chapitres/financer-l-entreprise.ts",
  "chapitres/fonds-de-roulement-et-tresorerie.ts",
  "chapitres/immobilisations.ts",
  "chapitres/l-emprunt.ts",
  "chapitres/la-cloture.ts",
  "chapitres/la-paie.ts",
  "chapitres/la-productivite-du-service.ts",
  "chapitres/le-cout-matiere.ts",
  "chapitres/le-cout-preetabli-et-les-budgets.ts",
  "chapitres/le-prix-selon-la-saison.ts",
  "chapitres/les-ecarts-sur-charges-directes.ts",
  "chapitres/les-ecarts-sur-charges-indirectes.ts",
  "chapitres/les-ecarts-sur-ventes-et-marge.ts",
  "chapitres/les-stocks.ts",
  "chapitres/lire-le-bilan.ts",
  "chapitres/lire-le-compte-de-resultat.ts",
  "chapitres/occupation-et-revenu-par-chambre.ts",
  "chapitres/prix-cout-marge.ts",
  "chapitres/remises-et-reglements.ts",
  "chapitres/rentabilite.ts",
  "chapitres/seuil-de-rentabilite.ts",
  "chapitres/soldes-intermediaires.ts",
  "chapitres/stock-du-point-de-vente.ts",
  "chapitres/tableau-de-bord.ts",
  "chapitres/valeur-ajoutee-et-partage.ts",
  "situations/la-facture-contestee.ts",
  "situations/le-rendez-vous-a-la-banque.ts",
  "situations/par-chapitre/acheter-avant-la-cloture.ts",
  "situations/par-chapitre/alleger-le-stock.ts",
  "situations/par-chapitre/ce-qu-exige-le-fonds.ts",
  "situations/par-chapitre/l-annuite-du-pret.ts",
  "situations/par-chapitre/l-investisseuse-au-capital.ts",
  "situations/par-chapitre/l-objectif-du-commercial.ts",
  "situations/par-chapitre/la-cle-contestee.ts",
  "situations/par-chapitre/la-hausse-des-salaires.ts",
  "situations/par-chapitre/la-prime-exceptionnelle.ts",
  "situations/par-chapitre/le-budget-depasse.ts",
  "situations/par-chapitre/le-centre-qui-a-trop-tourne.ts",
  "situations/par-chapitre/le-cout-du-trimestre-creux.ts",
  "situations/par-chapitre/le-fournisseur-augmente.ts",
  "situations/par-chapitre/le-fournisseur-ou-l-atelier.ts",
  "situations/par-chapitre/le-fournisseur-raccourcit-ses-delais.ts",
  "situations/par-chapitre/le-loyer-qui-augmente.ts",
  "situations/par-chapitre/le-resultat-qui-manque.ts",
  "situations/par-chapitre/le-stock-qui-manque.ts",
  "situations/par-chapitre/monter-la-carte-ou-preparer-juste.ts",
  "situations/par-chapitre/monter-son-prix.ts",
  "situations/par-chapitre/plus-cher-au-plus-fort-de-la-saison.ts",
  "situations/par-chapitre/quand-le-taux-monte.ts",
  "situations/par-chapitre/regler-le-voyant.ts",
  "situations/par-chapitre/s-aligner-sur-le-prix-du-concurrent.ts",
  "situations/par-chapitre/un-deuxieme-pret.ts",
  "situations/par-chapitre/un-nouveau-client-regulier.ts",
  "situations/par-chapitre/un-second-equipement.ts",
  "situations/par-chapitre/un-technicien-plutot-qu-un-prestataire.ts",
  "situations/par-chapitre/un-trimestre-de-croissance.ts",
  "situations/par-chapitre/vendre-plus-financer-plus.ts",
  "situations/suivre-la-baisse.ts",
];

/** Les chapitres et les cas du cours (les recueils index.ts rassemblent les cas : ils n'en sont pas). */
const CHAPITRES_ET_CAS = [...fichiersDe("chapitres"), ...fichiersDe("situations")].filter((f) => !f.endsWith("index.ts") && !f.endsWith("types.ts"));

describe("le monde du cours ne lit pas l'arène", () => {
  it.each([...DU_MONDE, ...PASSES_SUR_LE_MONDE])("%s n'atteint ni le moteur, ni les scénarios, ni l'année jouée par l'arène", (f) => {
    expect(cheminInterdit(join(COURS, f))).toBeNull();
  });

  it("tout chapitre ou cas qui ne lit plus l'arène est inscrit au registre", () => {
    const purs = CHAPITRES_ET_CAS.filter((f) => cheminInterdit(join(COURS, f)) === null);
    expect(purs.filter((f) => !PASSES_SUR_LE_MONDE.includes(f))).toEqual([]);
  });

  it("la garde voit un import interdit, même de proche en proche", () => {
    // Le registre des chapitres atteint l'année jouée par l'arène : la garde doit le dire.
    expect(cheminInterdit(join(COURS, "registre.ts"))).not.toBeNull();
  });
});
