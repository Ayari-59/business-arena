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
  "chapitres/assortiment.ts",
  "chapitres/bilan-fonctionnel.ts",
  "chapitres/budget-de-tresorerie.ts",
  "chapitres/budget-du-point-de-vente.ts",
  "chapitres/canaux-de-distribution.ts",
  "chapitres/ce-que-coute-un-outil-numerique.ts",
  "chapitres/ce-que-coute-une-livraison.ts",
  "chapitres/charges-et-encaissements.ts",
  "chapitres/choisir-son-fournisseur.ts",
  "chapitres/commissions-des-partenaires.ts",
  "chapitres/communication.ts",
  "chapitres/construire-un-indicateur-juste.ts",
  "chapitres/cout-complet.ts",
  "chapitres/cout-d-acquisition.ts",
  "chapitres/cout-par-produit.ts",
  "chapitres/couts-ou-differenciation.ts",
  "chapitres/creation-premier-bilan.ts",
  "chapitres/creer-des-richesses.ts",
  "chapitres/croitre-en-investissant.ts",
  "chapitres/decider-avec-des-chiffres.ts",
  "chapitres/decider-ensemble.ts",
  "chapitres/decider.ts",
  "chapitres/demande-et-prix.ts",
  "chapitres/depreciations-et-provisions.ts",
  "chapitres/des-donnees-a-l-information.ts",
  "chapitres/effectif-et-masse-salariale.ts",
  "chapitres/entretenir-l-outil.ts",
  "chapitres/equipe-et-planning.ts",
  "chapitres/evaluer-son-activite.ts",
  "chapitres/financer-l-entreprise.ts",
  "chapitres/fonds-de-roulement-et-tresorerie.ts",
  "chapitres/former.ts",
  "chapitres/immobilisations.ts",
  "chapitres/indicateurs-du-point-de-vente.ts",
  "chapitres/indicateurs-sociaux.ts",
  "chapitres/l-effet-de-levier.ts",
  "chapitres/l-emprunt.ts",
  "chapitres/l-impot-sur-les-societes.ts",
  "chapitres/l-offre-et-la-demande.ts",
  "chapitres/la-cloture.ts",
  "chapitres/la-concurrence.ts",
  "chapitres/la-creation-de-valeur.ts",
  "chapitres/la-declaration-de-tva.ts",
  "chapitres/la-paie.ts",
  "chapitres/la-productivite-du-service.ts",
  "chapitres/la-responsabilite-societale.ts",
  "chapitres/la-tva-et-la-tresorerie.ts",
  "chapitres/la-valeur-actuelle-nette.ts",
  "chapitres/le-client-qui-paie-tard.ts",
  "chapitres/le-client-qui-revient.ts",
  "chapitres/le-cout-de-la-non-qualite.ts",
  "chapitres/le-cout-matiere.ts",
  "chapitres/le-cout-preetabli-et-les-budgets.ts",
  "chapitres/le-deficit-reporte.ts",
  "chapitres/le-depart-d-un-salarie.ts",
  "chapitres/le-diagnostic-strategique.ts",
  "chapitres/le-panier-moyen.ts",
  "chapitres/le-prix-affiche.ts",
  "chapitres/le-prix-d-equilibre.ts",
  "chapitres/le-prix-selon-la-saison.ts",
  "chapitres/le-projet-d-entreprise.ts",
  "chapitres/le-stock-de-securite.ts",
  "chapitres/le-taux-de-remplissage.ts",
  "chapitres/le-tri-et-le-choix-entre-deux-projets.ts",
  "chapitres/les-acteurs-et-la-valeur.ts",
  "chapitres/les-ecarts-sur-charges-directes.ts",
  "chapitres/les-ecarts-sur-charges-indirectes.ts",
  "chapitres/les-ecarts-sur-ventes-et-marge.ts",
  "chapitres/les-flux.ts",
  "chapitres/les-stocks.ts",
  "chapitres/lire-la-strategie-des-concurrents.ts",
  "chapitres/lire-le-bilan.ts",
  "chapitres/lire-le-compte-de-resultat.ts",
  "chapitres/livrer-a-temps.ts",
  "chapitres/marche-et-part-de-marche.ts",
  "chapitres/negocier-le-prix.ts",
  "chapitres/occupation-et-revenu-par-chambre.ts",
  "chapitres/organiser-l-activite.ts",
  "chapitres/portefeuille-abc.ts",
  "chapitres/prevoir-les-ventes.ts",
  "chapitres/prix-cout-marge.ts",
  "chapitres/prix-psychologique.ts",
  "chapitres/produire-bien.ts",
  "chapitres/produire.ts",
  "chapitres/promotion-qui-paie.ts",
  "chapitres/recevoir-une-livraison.ts",
  "chapitres/recruter.ts",
  "chapitres/regularisations.ts",
  "chapitres/remises-et-conditions.ts",
  "chapitres/remises-et-reglements.ts",
  "chapitres/remplir-le-rayon.ts",
  "chapitres/remuneration-et-motivation.ts",
  "chapitres/rentabilite.ts",
  "chapitres/s-assurer-contre-les-aleas.ts",
  "chapitres/salaire-brut-net-cout.ts",
  "chapitres/se-fixer-des-objectifs.ts",
  "chapitres/segmenter-et-cibler.ts",
  "chapitres/seuil-de-rentabilite.ts",
  "chapitres/seuil-du-point-de-vente.ts",
  "chapitres/soldes-intermediaires.ts",
  "chapitres/stock-du-point-de-vente.ts",
  "chapitres/suivre-ses-ventes.ts",
  "chapitres/tableau-de-bord-commercial.ts",
  "chapitres/tableau-de-bord-du-manager.ts",
  "chapitres/tableau-de-bord.ts",
  "chapitres/taux-de-marque.ts",
  "chapitres/tenir-la-caisse.ts",
  "chapitres/un-nouveau-client.ts",
  "chapitres/une-donnee-fausse.ts",
  "chapitres/une-information-a-temps.ts",
  "chapitres/valeur-ajoutee-et-partage.ts",
  "chapitres/valeur-d-un-client.ts",
  "situations/commander-pour-la-promotion.ts",
  "situations/embaucher-pour-la-saison.ts",
  "situations/la-facture-contestee.ts",
  "situations/la-remise-du-grand-compte.ts",
  "situations/le-rendez-vous-a-la-banque.ts",
  "situations/par-chapitre/abandonner-les-petits-comptes.ts",
  "situations/par-chapitre/acheter-avant-la-cloture.ts",
  "situations/par-chapitre/acheter-les-deux-machines.ts",
  "situations/par-chapitre/alleger-le-stock.ts",
  "situations/par-chapitre/aller-dans-l-espace-libre.ts",
  "situations/par-chapitre/baisser-les-prix-sans-rien-couper.ts",
  "situations/par-chapitre/ce-qu-exige-le-fonds.ts",
  "situations/par-chapitre/ce-que-doit-rapporter-l-exploitation.ts",
  "situations/par-chapitre/chacun-son-levier.ts",
  "situations/par-chapitre/combien-charger-pendant-la-panne.ts",
  "situations/par-chapitre/couper-le-budget-de-campagne.ts",
  "situations/par-chapitre/de-combien-monter-le-prix.ts",
  "situations/par-chapitre/des-clients-repartis-sans-etre-servis.ts",
  "situations/par-chapitre/deux-embauches-pour-produire-plus.ts",
  "situations/par-chapitre/doubler-la-publicite.ts",
  "situations/par-chapitre/doubler-le-budget-de-formation.ts",
  "situations/par-chapitre/embaucher-un-trimestre-plus-tard.ts",
  "situations/par-chapitre/entretenir-au-seuil.ts",
  "situations/par-chapitre/escompter-chaque-trimestre.ts",
  "situations/par-chapitre/ferme-pour-travaux.ts",
  "situations/par-chapitre/garder-sa-part-de-marche.ts",
  "situations/par-chapitre/jusqu-ou-remiser.ts",
  "situations/par-chapitre/l-accord-de-branche.ts",
  "situations/par-chapitre/l-acompte-du-client.ts",
  "situations/par-chapitre/l-annuite-du-pret.ts",
  "situations/par-chapitre/l-assurance-sur-plusieurs-annees.ts",
  "situations/par-chapitre/l-assureur-augmente-la-prime.ts",
  "situations/par-chapitre/l-augmentation-generale.ts",
  "situations/par-chapitre/l-equipe-demande-une-augmentation.ts",
  "situations/par-chapitre/l-escompte-demande-par-le-client.ts",
  "situations/par-chapitre/l-etiquette-du-concurrent.ts",
  "situations/par-chapitre/l-intermediaire-veut-payer-plus-tard.ts",
  "situations/par-chapitre/l-investisseuse-au-capital.ts",
  "situations/par-chapitre/l-objectif-de-l-ete.ts",
  "situations/par-chapitre/l-objectif-de-taux-de-service.ts",
  "situations/par-chapitre/l-objectif-du-commercial.ts",
  "situations/par-chapitre/la-caisse-du-trimestre-de-noel.ts",
  "situations/par-chapitre/la-case-vide.ts",
  "situations/par-chapitre/la-cle-contestee.ts",
  "situations/par-chapitre/la-commande-du-31-janvier.ts",
  "situations/par-chapitre/la-commande-exceptionnelle.ts",
  "situations/par-chapitre/la-creance-qui-se-degrade.ts",
  "situations/par-chapitre/la-depense-de-fin-d-annee.ts",
  "situations/par-chapitre/la-depense-de-l-annee-en-perte.ts",
  "situations/par-chapitre/la-hausse-des-salaires.ts",
  "situations/par-chapitre/la-masse-salariale-qui-baisse.ts",
  "situations/par-chapitre/la-mise-en-avant-payante.ts",
  "situations/par-chapitre/la-moitie-du-budget-qualite.ts",
  "situations/par-chapitre/la-part-de-marche-annoncee.ts",
  "situations/par-chapitre/la-prime-de-fin-d-annee.ts",
  "situations/par-chapitre/la-prime-exceptionnelle.ts",
  "situations/par-chapitre/la-promotion-de-noel.ts",
  "situations/par-chapitre/la-remise-autorisee.ts",
  "situations/par-chapitre/la-remise-par-palier.ts",
  "situations/par-chapitre/la-tva-avancee-pour-le-client.ts",
  "situations/par-chapitre/la-tva-du-dernier-trimestre.ts",
  "situations/par-chapitre/le-budget-depasse.ts",
  "situations/par-chapitre/le-centre-qui-a-trop-tourne.ts",
  "situations/par-chapitre/le-compte-rendu-en-retard.ts",
  "situations/par-chapitre/le-cout-du-trimestre-creux.ts",
  "situations/par-chapitre/le-fournisseur-allonge-son-delai.ts",
  "situations/par-chapitre/le-fournisseur-augmente.ts",
  "situations/par-chapitre/le-fournisseur-ou-l-atelier.ts",
  "situations/par-chapitre/le-fournisseur-raccourcit-ses-delais.ts",
  "situations/par-chapitre/le-gazole-qui-augmente.ts",
  "situations/par-chapitre/le-levier-face-a-la-hausse-du-taux.ts",
  "situations/par-chapitre/le-lot-de-la-bourse-de-fret.ts",
  "situations/par-chapitre/le-loyer-qui-augmente.ts",
  "situations/par-chapitre/le-marche-a-t-il-grandi.ts",
  "situations/par-chapitre/le-panier-de-fin-d-annee.ts",
  "situations/par-chapitre/le-point-de-commande-avant-le-pic.ts",
  "situations/par-chapitre/le-prix-de-fin-d-annee.ts",
  "situations/par-chapitre/le-programme-de-fidelite.ts",
  "situations/par-chapitre/le-resultat-qui-manque.ts",
  "situations/par-chapitre/le-second-semestre.ts",
  "situations/par-chapitre/le-stock-qui-manque.ts",
  "situations/par-chapitre/le-trimestre-face-a-l-objectif.ts",
  "situations/par-chapitre/le-trimestre-le-plus-fort.ts",
  "situations/par-chapitre/les-clients-demandent-une-baisse.ts",
  "situations/par-chapitre/les-deux-ecarts.ts",
  "situations/par-chapitre/les-travaux-de-l-ete.ts",
  "situations/par-chapitre/mettre-plus-en-vente.ts",
  "situations/par-chapitre/moins-de-clients-le-mois-prochain.ts",
  "situations/par-chapitre/monter-la-carte-ou-preparer-juste.ts",
  "situations/par-chapitre/monter-son-prix.ts",
  "situations/par-chapitre/plus-cher-au-plus-fort-de-la-saison.ts",
  "situations/par-chapitre/prevoir-le-trimestre-creux.ts",
  "situations/par-chapitre/quand-le-taux-monte.ts",
  "situations/par-chapitre/quel-segment-conquerir.ts",
  "situations/par-chapitre/recruter-des-l-annonce-du-depart.ts",
  "situations/par-chapitre/regler-le-voyant.ts",
  "situations/par-chapitre/rembourser-une-part-du-pret.ts",
  "situations/par-chapitre/repercuter-la-hausse-du-fournisseur.ts",
  "situations/par-chapitre/retirer-une-reference.ts",
  "situations/par-chapitre/revendre-la-machine-plus-tot.ts",
  "situations/par-chapitre/reviser-le-budget.ts",
  "situations/par-chapitre/s-aligner-sur-le-prix-du-concurrent.ts",
  "situations/par-chapitre/tenir-jusqu-au-reassort.ts",
  "situations/par-chapitre/un-deuxieme-pret.ts",
  "situations/par-chapitre/un-equipement-de-plus-au-depart.ts",
  "situations/par-chapitre/un-nouveau-client-regulier.ts",
  "situations/par-chapitre/un-objectif-plus-ambitieux.ts",
  "situations/par-chapitre/un-second-equipement.ts",
  "situations/par-chapitre/un-technicien-plutot-qu-un-prestataire.ts",
  "situations/par-chapitre/un-trimestre-de-croissance.ts",
  "situations/par-chapitre/une-campagne-plus-forte.ts",
  "situations/par-chapitre/une-promotion-trop-forte.ts",
  "situations/par-chapitre/une-rallonge-pour-la-campagne.ts",
  "situations/par-chapitre/une-seconde-journee-de-formation.ts",
  "situations/par-chapitre/une-seule-demarche-qualite.ts",
  "situations/par-chapitre/vendre-plus-financer-plus.ts",
  "situations/par-chapitre/viser-le-label.ts",
  "situations/par-chapitre/voir-plus-grand.ts",
  "situations/quel-prix-pour-la-saison.ts",
  "situations/suivre-la-baisse.ts",
];

/** Les chapitres et les cas du cours (les recueils index.ts rassemblent les cas : ils n'en sont pas). */
const CHAPITRES_ET_CAS = [...fichiersDe("chapitres"), ...fichiersDe("situations")].filter((f) => !f.endsWith("index.ts") && !f.endsWith("types.ts"));

/**
 * L'ANNÉE FIGÉE DE L'ARÈNE (monde/annee-du-cours.ts) N'EST PAS LE MONDE DU COURS. Elle a été relevée
 * une fois sur l'arène pour que les chapitres qui la lisaient ne bougent plus avec le moteur, mais
 * ses chiffres sont ceux de l'arène (NOVA à 1 452 521 € de ventes), pas ceux du premier exercice de
 * NOVA (1 390 276 €). Un chapitre passé sur le monde du cours ne doit donc pas l'atteindre non plus,
 * ni de proche en proche : le registre ci-dessous ne fait que grandir.
 */
const ANNEE_FIGEE_DE_L_ARENE = join(COURS, "monde", "annee-du-cours.ts");

const NE_LISENT_PLUS_L_ANNEE_FIGEE: readonly string[] = [
  "chapitres/canaux-de-distribution.ts",
  "chapitres/ce-que-coute-un-outil-numerique.ts",
  "chapitres/ce-que-coute-une-livraison.ts",
  "chapitres/charges-et-encaissements.ts",
  "chapitres/communication.ts",
  "chapitres/construire-un-indicateur-juste.ts",
  "chapitres/couts-ou-differenciation.ts",
  "chapitres/creer-des-richesses.ts",
  "chapitres/croitre-en-investissant.ts",
  "chapitres/decider-avec-des-chiffres.ts",
  "chapitres/decider-ensemble.ts",
  "chapitres/demande-et-prix.ts",
  "chapitres/des-donnees-a-l-information.ts",
  "chapitres/effectif-et-masse-salariale.ts",
  "chapitres/evaluer-son-activite.ts",
  "chapitres/financer-l-entreprise.ts",
  "chapitres/fonds-de-roulement-et-tresorerie.ts",
  "chapitres/former.ts",
  "chapitres/indicateurs-sociaux.ts",
  "chapitres/l-offre-et-la-demande.ts",
  "chapitres/la-concurrence.ts",
  "chapitres/la-responsabilite-societale.ts",
  "chapitres/le-client-qui-revient.ts",
  "chapitres/le-diagnostic-strategique.ts",
  "chapitres/le-panier-moyen.ts",
  "chapitres/le-prix-affiche.ts",
  "chapitres/le-prix-d-equilibre.ts",
  "chapitres/le-projet-d-entreprise.ts",
  "chapitres/le-stock-de-securite.ts",
  "chapitres/le-taux-de-remplissage.ts",
  "chapitres/les-acteurs-et-la-valeur.ts",
  "chapitres/les-flux.ts",
  "chapitres/lire-la-strategie-des-concurrents.ts",
  "chapitres/lire-le-bilan.ts",
  "chapitres/lire-le-compte-de-resultat.ts",
  "chapitres/livrer-a-temps.ts",
  "chapitres/marche-et-part-de-marche.ts",
  "chapitres/organiser-l-activite.ts",
  "chapitres/prix-cout-marge.ts",
  "chapitres/prix-psychologique.ts",
  "chapitres/produire-bien.ts",
  "chapitres/produire.ts",
  "chapitres/recevoir-une-livraison.ts",
  "chapitres/recruter.ts",
  "chapitres/remplir-le-rayon.ts",
  "chapitres/remuneration-et-motivation.ts",
  "chapitres/rentabilite.ts",
  "chapitres/salaire-brut-net-cout.ts",
  "chapitres/se-fixer-des-objectifs.ts",
  "chapitres/segmenter-et-cibler.ts",
  "chapitres/suivre-ses-ventes.ts",
  "chapitres/tenir-la-caisse.ts",
  "chapitres/un-nouveau-client.ts",
  "chapitres/une-donnee-fausse.ts",
  "chapitres/une-information-a-temps.ts",
  "chapitres/valeur-ajoutee-et-partage.ts",
  "situations/embaucher-pour-la-saison.ts",
  "situations/le-rendez-vous-a-la-banque.ts",
  "situations/par-chapitre/aller-dans-l-espace-libre.ts",
  "situations/par-chapitre/baisser-les-prix-sans-rien-couper.ts",
  "situations/par-chapitre/ce-qu-exige-le-fonds.ts",
  "situations/par-chapitre/chacun-son-levier.ts",
  "situations/par-chapitre/combien-charger-pendant-la-panne.ts",
  "situations/par-chapitre/de-combien-monter-le-prix.ts",
  "situations/par-chapitre/des-clients-repartis-sans-etre-servis.ts",
  "situations/par-chapitre/deux-embauches-pour-produire-plus.ts",
  "situations/par-chapitre/doubler-la-publicite.ts",
  "situations/par-chapitre/doubler-le-budget-de-formation.ts",
  "situations/par-chapitre/embaucher-un-trimestre-plus-tard.ts",
  "situations/par-chapitre/garder-sa-part-de-marche.ts",
  "situations/par-chapitre/l-acompte-du-client.ts",
  "situations/par-chapitre/l-annuite-du-pret.ts",
  "situations/par-chapitre/l-augmentation-generale.ts",
  "situations/par-chapitre/l-equipe-demande-une-augmentation.ts",
  "situations/par-chapitre/l-intermediaire-veut-payer-plus-tard.ts",
  "situations/par-chapitre/l-investisseuse-au-capital.ts",
  "situations/par-chapitre/l-objectif-de-l-ete.ts",
  "situations/par-chapitre/la-caisse-du-trimestre-de-noel.ts",
  "situations/par-chapitre/la-case-vide.ts",
  "situations/par-chapitre/la-commande-exceptionnelle.ts",
  "situations/par-chapitre/la-hausse-des-salaires.ts",
  "situations/par-chapitre/la-masse-salariale-qui-baisse.ts",
  "situations/par-chapitre/la-moitie-du-budget-qualite.ts",
  "situations/par-chapitre/la-part-de-marche-annoncee.ts",
  "situations/par-chapitre/la-prime-de-fin-d-annee.ts",
  "situations/par-chapitre/la-promotion-de-noel.ts",
  "situations/par-chapitre/le-compte-rendu-en-retard.ts",
  "situations/par-chapitre/le-fournisseur-augmente.ts",
  "situations/par-chapitre/le-fournisseur-raccourcit-ses-delais.ts",
  "situations/par-chapitre/le-gazole-qui-augmente.ts",
  "situations/par-chapitre/le-lot-de-la-bourse-de-fret.ts",
  "situations/par-chapitre/le-marche-a-t-il-grandi.ts",
  "situations/par-chapitre/le-panier-de-fin-d-annee.ts",
  "situations/par-chapitre/le-point-de-commande-avant-le-pic.ts",
  "situations/par-chapitre/le-prix-de-fin-d-annee.ts",
  "situations/par-chapitre/le-second-semestre.ts",
  "situations/par-chapitre/le-trimestre-le-plus-fort.ts",
  "situations/par-chapitre/les-clients-demandent-une-baisse.ts",
  "situations/par-chapitre/les-deux-ecarts.ts",
  "situations/par-chapitre/les-travaux-de-l-ete.ts",
  "situations/par-chapitre/mettre-plus-en-vente.ts",
  "situations/par-chapitre/quel-segment-conquerir.ts",
  "situations/par-chapitre/rembourser-une-part-du-pret.ts",
  "situations/par-chapitre/repercuter-la-hausse-du-fournisseur.ts",
  "situations/par-chapitre/tenir-jusqu-au-reassort.ts",
  "situations/par-chapitre/un-equipement-de-plus-au-depart.ts",
  "situations/par-chapitre/un-objectif-plus-ambitieux.ts",
  "situations/par-chapitre/un-technicien-plutot-qu-un-prestataire.ts",
  "situations/par-chapitre/une-campagne-plus-forte.ts",
  "situations/par-chapitre/une-promotion-trop-forte.ts",
  "situations/par-chapitre/une-rallonge-pour-la-campagne.ts",
  "situations/par-chapitre/une-seconde-journee-de-formation.ts",
  "situations/par-chapitre/viser-le-label.ts",
  "situations/par-chapitre/voir-plus-grand.ts",
  "situations/quel-prix-pour-la-saison.ts",
  "situations/suivre-la-baisse.ts",
];

/** Le premier chemin d'imports qui atteint un fichier donné, ou rien. */
function cheminVers(depart: string, cible: string): string[] | null {
  const vus = new Set<string>();
  const pile: string[][] = [[depart]];
  while (pile.length) {
    const chemin = pile.pop()!;
    const ici = chemin.at(-1)!;
    if (ici === cible) return chemin.map((x) => relative(SRC, x));
    if (vus.has(ici)) continue;
    vus.add(ici);
    for (const suivant of importsDe(ici)) pile.push([...chemin, suivant]);
  }
  return null;
}

describe("les chapitres passés sur les comptes du monde du cours ne lisent plus l'année figée de l'arène", () => {
  it.each(NE_LISENT_PLUS_L_ANNEE_FIGEE)("%s n'atteint pas monde/annee-du-cours.ts", (f) => {
    expect(PASSES_SUR_LE_MONDE).toContain(f);
    expect(cheminVers(join(COURS, f), ANNEE_FIGEE_DE_L_ARENE)).toBeNull();
    expect(readFileSync(join(COURS, f), "utf8")).not.toMatch(/\bc\.annee\b|soldesDeGestion|anneeDuCours/);
  });

  it("tout chapitre du Bac STMG gestion et finance, et tout cas qui en reprend un, est au registre", () => {
    const stmgGf = CHAPITRES_ET_CAS.filter((f) => /parcours: "stmg-gf"/.test(readFileSync(join(COURS, f), "utf8")));
    expect(stmgGf.filter((f) => !NE_LISENT_PLUS_L_ANNEE_FIGEE.includes(f))).toEqual([]);
  });

  it("tout chapitre du Bac STMG mercatique, et tout cas qui en reprend un, est au registre", () => {
    const mercatique = CHAPITRES_ET_CAS.filter((f) => /parcours: "stmg"/.test(readFileSync(join(COURS, f), "utf8")));
    expect(mercatique.filter((f) => !NE_LISENT_PLUS_L_ANNEE_FIGEE.includes(f))).toEqual([]);
  });

  it("tout chapitre de la 2de pro GATL, transport et logistique, et tout cas qui en reprend un, est au registre", () => {
    const logistique = CHAPITRES_ET_CAS.filter((f) => /parcours: "logistique"/.test(readFileSync(join(COURS, f), "utf8")));
    expect(logistique.length).toBeGreaterThanOrEqual(8);
    expect(logistique.filter((f) => !NE_LISENT_PLUS_L_ANNEE_FIGEE.includes(f))).toEqual([]);
  });

  it("tout chapitre des ressources humaines, de la stratégie, de la seconde et du management, et tout cas qui en reprend un, est au registre", () => {
    const parcours = /parcours: "(stmg-rh|strategie|seconde-mg|stmg-management)"/;
    const lot = CHAPITRES_ET_CAS.filter((f) => parcours.test(readFileSync(join(COURS, f), "utf8")));
    expect(lot.length).toBeGreaterThan(20);
    expect(lot.filter((f) => !NE_LISENT_PLUS_L_ANNEE_FIGEE.includes(f))).toEqual([]);
  });

  it("la garde voit l'année figée, même de proche en proche", () => {
    // « Soldes intermédiaires de gestion » garde l'export de compatibilité qui la lit.
    expect(cheminVers(join(COURS, "chapitres", "soldes-intermediaires.ts"), ANNEE_FIGEE_DE_L_ARENE)).not.toBeNull();
  });
});

describe("le monde du cours ne lit pas l'arène", () => {
  it.each([...DU_MONDE, ...PASSES_SUR_LE_MONDE])("%s n'atteint ni le moteur, ni les scénarios, ni l'année jouée par l'arène", (f) => {
    expect(cheminInterdit(join(COURS, f))).toBeNull();
  });

  it("tout chapitre ou cas qui ne lit plus l'arène est inscrit au registre", () => {
    const purs = CHAPITRES_ET_CAS.filter((f) => cheminInterdit(join(COURS, f)) === null);
    expect(purs.filter((f) => !PASSES_SUR_LE_MONDE.includes(f))).toEqual([]);
  });

  it("le registre des chapitres ne lit plus l'arène : tout le cours joue dans son monde", () => {
    expect(cheminInterdit(join(COURS, "registre.ts"))).toBeNull();
  });

  it("la garde voit un import interdit, même de proche en proche", () => {
    // Tous les chapitres et les cas sont passés sur le monde du cours (lots M1 à M6) : le registre ne
    // lit plus l'arène. La mission « Et maintenant, jouez-le » la lit, elle : la garde doit le dire.
    expect(cheminInterdit(join(COURS, "jouez.ts"))).not.toBeNull();
  });
});
