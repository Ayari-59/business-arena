import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BUREAUX } from "../../src/config/cours/bureaux";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { ENQUETES } from "../../src/config/cours/enquetes";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS } from "../../src/config/cours/situations";
import type { Chapitre } from "../../src/config/cours/types";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import { fautesAuxDeuxDecimales, natureDuChamp, type NombreACalculer } from "../../src/pedagogy/cours/deux-decimales";
import type { TableauACompleter } from "../../src/pedagogy/cours/tableau-a-completer";

/**
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026).
 *
 * Chaque champ de calcul et chaque cellule à saisir du cours (chapitres, cas pratiques, bureaux,
 * enquêtes), dans chaque entreprise où il se joue, suit la règle de pedagogy/cours/deux-decimales.ts :
 * un montant, un pourcentage ou une grandeur au centième, avec une tolérance d'un centième et un
 * corrigé qui écrit le résultat à deux décimales ; une quantité entière ; un coefficient au
 * dix-millième au plus. Les scénarios et les laboratoires n'ont pas de réponse chiffrée à saisir
 * (un choix, une position de leviers) : la règle ne les lit pas.
 *
 * LE CHANTIER SE FAIT PAR LOTS. Les fichiers pas encore convertis sont listés ci-dessous, avec le
 * nombre de leurs champs (un champ compté une fois par entreprise) qui ne suivent pas la règle. Un
 * lot convertit ses fichiers et retire leurs lignes ; le chantier est fini quand la liste est vide.
 * La garde échoue sur un fichier hors de la liste qui enfreint la règle, sur un fichier listé dont le
 * compte a changé (en plus : une régression ; en moins : la ligne à mettre à jour), et sur un
 * fichier listé devenu conforme : la liste ne garde pas d'entrée morte. Le lot 0 (le socle : l'outil,
 * cette garde, trois chapitres convertis) a proposé six lots, chacun groupé autour de ses modules
 * monde/ : un module n'est modifié que par le lot qui le possède.
 */
const ENCORE_A_CONVERTIR: Readonly<Record<string, number>> = {
  "chapitres/analyse-des-ecarts.ts": 3,
  "chapitres/approvisionner-au-moindre-cout.ts": 25,
  "chapitres/assez-vendre-pour-ne-rien-perdre.ts": 5,
  "chapitres/assortiment.ts": 13,
  "chapitres/budget-de-tresorerie.ts": 3,
  "chapitres/budget-du-point-de-vente.ts": 14,
  "chapitres/choisir-et-negocier-le-fournisseur.ts": 7,
  "chapitres/choisir-son-fournisseur.ts": 2,
  "chapitres/commissions-des-partenaires.ts": 14,
  "chapitres/communiquer-et-animer-en-local.ts": 11,
  "chapitres/contenus-communaute-et-e-reputation.ts": 9,
  "chapitres/correlation-et-lissage.ts": 16,
  "chapitres/cout-cible-et-couts-caches.ts": 6,
  "chapitres/cout-complet.ts": 21,
  "chapitres/cout-d-acquisition.ts": 12,
  "chapitres/cout-par-produit.ts": 15,
  "chapitres/croitre-en-investissant.ts": 20,
  "chapitres/decider.ts": 7,
  "chapitres/des-ventes-aux-achats.ts": 6,
  "chapitres/donnees-et-algorithmes.ts": 1,
  "chapitres/entretenir-l-outil.ts": 11,
  "chapitres/equipe-et-planning.ts": 25,
  "chapitres/ethique-transparence-et-egalite.ts": 1,
  "chapitres/facturer-et-se-faire-payer.ts": 1,
  "chapitres/fideliser-la-clientele.ts": 10,
  "chapitres/indicateurs-du-point-de-vente.ts": 15,
  "chapitres/interroger-la-base-en-sql.ts": 11,
  "chapitres/interroger-les-clients.ts": 27,
  "chapitres/l-evenement-commercial.ts": 6,
  "chapitres/l-inventaire-et-la-demarque.ts": 5,
  "chapitres/la-base-de-donnees-relationnelle.ts": 2,
  "chapitres/la-demarche-budgetaire.ts": 4,
  "chapitres/la-fonction-systeme-d-information.ts": 3,
  "chapitres/la-masse-salariale-previsionnelle.ts": 5,
  "chapitres/la-prevision-des-ventes.ts": 35,
  "chapitres/la-productivite-du-service.ts": 22,
  "chapitres/la-tva-et-la-tresorerie.ts": 1,
  "chapitres/la-vente-conseil.ts": 16,
  "chapitres/le-bilan-et-le-bfr-de-la-boutique.ts": 5,
  "chapitres/le-client-qui-paie-tard.ts": 8,
  "chapitres/le-client-qui-revient.ts": 5,
  "chapitres/le-climat-de-l-equipe.ts": 7,
  "chapitres/le-compte-de-resultat-de-la-boutique.ts": 4,
  "chapitres/le-controle-de-gestion-dans-l-organisation.ts": 3,
  "chapitres/le-cout-complet-pas-a-pas.ts": 10,
  "chapitres/le-cout-de-la-non-qualite.ts": 7,
  "chapitres/le-cout-matiere.ts": 10,
  "chapitres/le-cout-preetabli-et-les-budgets.ts": 4,
  "chapitres/le-depart-d-un-salarie.ts": 14,
  "chapitres/le-fichier-et-la-cible.ts": 21,
  "chapitres/le-marche-et-le-reseau.ts": 2,
  "chapitres/le-panier-moyen.ts": 1,
  "chapitres/le-plateau-de-teleacteurs.ts": 22,
  "chapitres/le-prix-affiche.ts": 1,
  "chapitres/le-prix-selon-la-saison.ts": 21,
  "chapitres/le-reseau-de-vente-directe.ts": 5,
  "chapitres/le-seuil-en-avenir-aleatoire.ts": 20,
  "chapitres/le-site-qui-vend.ts": 8,
  "chapitres/les-couts-a-base-d-activites.ts": 4,
  "chapitres/les-ecarts-sur-charges-directes.ts": 5,
  "chapitres/les-ecarts-sur-charges-indirectes.ts": 5,
  "chapitres/les-ecarts-sur-ventes-et-marge.ts": 2,
  "chapitres/les-indicateurs-de-durabilite.ts": 11,
  "chapitres/manager-fonctions-et-decisions.ts": 1,
  "chapitres/negocier-le-prix.ts": 5,
  "chapitres/occupation-et-revenu-par-chambre.ts": 12,
  "chapitres/organiser-le-secteur.ts": 15,
  "chapitres/piloter-la-qualite.ts": 35,
  "chapitres/portefeuille-abc.ts": 10,
  "chapitres/positionner-l-offre.ts": 1,
  "chapitres/prevoir-les-ventes.ts": 31,
  "chapitres/programmer-la-production.ts": 6,
  "chapitres/promotion-qui-paie.ts": 6,
  "chapitres/recevoir-une-livraison.ts": 5,
  "chapitres/recruter-integrer-former.ts": 17,
  "chapitres/reimplanter-avant-les-soldes.ts": 32,
  "chapitres/remises-et-conditions.ts": 5,
  "chapitres/remplir-le-rayon.ts": 5,
  "chapitres/remunerer-et-stimuler-les-vendeurs.ts": 6,
  "chapitres/renover-la-boutique.ts": 4,
  "chapitres/reseaux-et-informatique-en-nuage.ts": 4,
  "chapitres/s-assurer-contre-les-aleas.ts": 3,
  "chapitres/se-faire-referencer.ts": 8,
  "chapitres/seuil-de-rentabilite.ts": 16,
  "chapitres/seuil-du-point-de-vente.ts": 14,
  "chapitres/stock-du-point-de-vente.ts": 19,
  "chapitres/suivre-ses-ventes.ts": 6,
  "chapitres/tableau-de-bord-commercial.ts": 19,
  "chapitres/tableau-de-bord-du-manager.ts": 12,
  "chapitres/tableau-de-bord.ts": 7,
  "chapitres/taux-de-marque.ts": 23,
  "chapitres/tenir-la-caisse.ts": 1,
  "chapitres/un-nouveau-client.ts": 4,
  "chapitres/valeur-d-un-client.ts": 16,
  "chapitres/zone-de-chalandise.ts": 12,
  "situations/commander-pour-la-promotion.ts": 24,
  "situations/embaucher-pour-la-saison.ts": 4,
  "situations/la-remise-du-grand-compte.ts": 6,
  "situations/par-chapitre/abandonner-les-petits-comptes.ts": 9,
  "situations/par-chapitre/abonder-le-compte-de-mehdi.ts": 1,
  "situations/par-chapitre/alleger-le-stock.ts": 4,
  "situations/par-chapitre/couper-le-budget-de-campagne.ts": 3,
  "situations/par-chapitre/des-aimants-moins-chers.ts": 6,
  "situations/par-chapitre/deux-commandes-par-an.ts": 1,
  "situations/par-chapitre/doubler-les-liens-sponsorises.ts": 5,
  "situations/par-chapitre/entretenir-au-seuil.ts": 4,
  "situations/par-chapitre/escompter-chaque-trimestre.ts": 1,
  "situations/par-chapitre/faut-il-livrer-a-domicile.ts": 10,
  "situations/par-chapitre/ferme-pour-travaux.ts": 9,
  "situations/par-chapitre/janvier-est-tombe.ts": 4,
  "situations/par-chapitre/jusqu-ou-remiser.ts": 3,
  "situations/par-chapitre/l-accord-de-branche.ts": 7,
  "situations/par-chapitre/l-assureur-augmente-la-prime.ts": 1,
  "situations/par-chapitre/l-avis-a-une-etoile.ts": 4,
  "situations/par-chapitre/l-etiquette-du-concurrent.ts": 3,
  "situations/par-chapitre/l-objectif-de-l-ete.ts": 4,
  "situations/par-chapitre/l-objectif-de-taux-de-service.ts": 6,
  "situations/par-chapitre/la-baisse-de-prix-promise.ts": 2,
  "situations/par-chapitre/la-carte-du-prestataire.ts": 1,
  "situations/par-chapitre/la-cle-contestee.ts": 8,
  "situations/par-chapitre/la-ligne-de-la-rentree.ts": 10,
  "situations/par-chapitre/la-mise-en-avant-payante.ts": 3,
  "situations/par-chapitre/la-promotion-de-noel.ts": 1,
  "situations/par-chapitre/la-remise-autorisee.ts": 2,
  "situations/par-chapitre/la-remise-de-sonora.ts": 6,
  "situations/par-chapitre/la-remise-par-palier.ts": 1,
  "situations/par-chapitre/le-bail-revise.ts": 1,
  "situations/par-chapitre/le-banc-perd-une-journee.ts": 3,
  "situations/par-chapitre/le-centre-qui-a-trop-tourne.ts": 2,
  "situations/par-chapitre/le-challenge-du-merinos.ts": 1,
  "situations/par-chapitre/le-cout-du-trimestre-creux.ts": 14,
  "situations/par-chapitre/le-decouvert-demande-au-banquier.ts": 1,
  "situations/par-chapitre/le-degat-des-eaux-dans-la-reserve.ts": 2,
  "situations/par-chapitre/le-depannage-du-grossiste.ts": 2,
  "situations/par-chapitre/le-fournisseur-ou-l-atelier.ts": 2,
  "situations/par-chapitre/le-loyer-augmente.ts": 2,
  "situations/par-chapitre/le-loyer-qui-augmente.ts": 6,
  "situations/par-chapitre/le-programme-de-fidelite.ts": 7,
  "situations/par-chapitre/le-rayonnage-qui-resiste.ts": 4,
  "situations/par-chapitre/le-resultat-qui-manque.ts": 2,
  "situations/par-chapitre/le-samedi-apres-la-formation.ts": 4,
  "situations/par-chapitre/le-trimestre-face-a-l-objectif.ts": 5,
  "situations/par-chapitre/les-comptes-de-hugo.ts": 9,
  "situations/par-chapitre/les-deux-ecarts.ts": 4,
  "situations/par-chapitre/les-indicateurs-que-demande-campustech.ts": 3,
  "situations/par-chapitre/les-jeux-du-printemps.ts": 6,
  "situations/par-chapitre/les-travaux-de-l-ete.ts": 8,
  "situations/par-chapitre/moins-de-clients-le-mois-prochain.ts": 7,
  "situations/par-chapitre/monter-la-carte-ou-preparer-juste.ts": 7,
  "situations/par-chapitre/monter-son-prix.ts": 5,
  "situations/par-chapitre/ou-ouvrir-un-point-de-retrait.ts": 1,
  "situations/par-chapitre/passer-a-la-fibre.ts": 2,
  "situations/par-chapitre/plus-cher-au-plus-fort-de-la-saison.ts": 8,
  "situations/par-chapitre/prevoir-le-trimestre-creux.ts": 10,
  "situations/par-chapitre/ranger-les-avis-des-clients.ts": 1,
  "situations/par-chapitre/recruter-des-l-annonce-du-depart.ts": 6,
  "situations/par-chapitre/regler-le-voyant.ts": 7,
  "situations/par-chapitre/retenir-la-vendeuse.ts": 5,
  "situations/par-chapitre/retirer-une-reference.ts": 5,
  "situations/par-chapitre/reviser-le-budget.ts": 4,
  "situations/par-chapitre/s-aligner-sur-le-prix-du-concurrent.ts": 6,
  "situations/par-chapitre/si-la-gerante-se-payait.ts": 2,
  "situations/par-chapitre/si-le-fournisseur-fermait-en-mai.ts": 2,
  "situations/par-chapitre/tenir-jusqu-au-reassort.ts": 4,
  "situations/par-chapitre/un-apprenti-ou-un-temps-partiel.ts": 8,
  "situations/par-chapitre/un-fichier-a-acheter.ts": 9,
  "situations/par-chapitre/un-invite-pour-la-matinale.ts": 4,
  "situations/par-chapitre/un-nouveau-client-regulier.ts": 4,
  "situations/par-chapitre/un-pret-sur-sept-ans.ts": 2,
  "situations/par-chapitre/un-quatrieme-faconnier.ts": 3,
  "situations/par-chapitre/un-tract-pour-quelle-zone.ts": 2,
  "situations/par-chapitre/un-trimestre-de-croissance.ts": 1,
  "situations/par-chapitre/une-campagne-au-succes-incertain.ts": 6,
  "situations/par-chapitre/une-campagne-plus-forte.ts": 4,
  "situations/par-chapitre/une-seconde-journee-de-formation.ts": 5,
  "situations/par-chapitre/une-seule-demarche-qualite.ts": 2,
  "situations/par-chapitre/vibra-repasse-commande.ts": 1,
  "situations/par-chapitre/voir-plus-grand.ts": 9,
};

const RACINE = join(__dirname, "../../src/config/cours");

/** Les fichiers d'où viennent les chapitres, les cas, les bureaux et les enquêtes. */
const sources = (dossier: string): string[] =>
  readdirSync(join(RACINE, dossier), { withFileTypes: true }).flatMap((f) =>
    f.isDirectory() ? sources(join(dossier, f.name)) : f.name.endsWith(".ts") ? [join(dossier, f.name)] : [],
  );

/**
 * Le fichier de chaque chapitre, cas, bureau ou enquête : celui qui l'exporte (seul, ou dans une
 * liste). Un objet réexporté par un index garde le fichier qui le définit ; un chapitre découpé en
 * deux (chapitres/decoupage.ts) a le fichier de ses deux parties.
 */
const fichierDe = new Map<object, string>();
for (const f of ["chapitres", "situations", "bureaux", "enquetes"].flatMap(sources)) {
  const exports = (await import(join(RACINE, f))) as Record<string, unknown>;
  for (const valeur of Object.values(exports)) {
    for (const o of Array.isArray(valeur) ? valeur : [valeur]) {
      if (!o || typeof o !== "object" || !("code" in o) || !("etapes" in o)) continue;
      const deja = fichierDe.get(o);
      if (!deja || (deja.endsWith("index.ts") && !f.endsWith("index.ts"))) fichierDe.set(o, f);
    }
  }
}

interface NombreDuCours extends NombreACalculer {
  fichier: string;
  ou: string;
}

const cellules = (g: TableauACompleter, fichier: string, ou: string): NombreDuCours[] =>
  g.lignes.flatMap((l, i) =>
    l.cellules.flatMap((c, j) =>
      c.saisir
        ? [{ fichier, ou: `${ou}, ligne ${i}`, libelle: `${l.libelle}, ${g.colonnes[j]}`, attendu: c.valeur ?? Number.NaN, calcul: c.calcul, tolerance: c.tolerance ?? g.tolerance, nature: c.nature, unite: c.unite }]
        : [],
    ),
  );

const duChapitre = (chapitre: Chapitre): NombreDuCours[] => {
  const fichier = fichierDe.get(chapitre) ?? `(sans fichier) ${chapitre.code}`;
  return ENTREPRISES_DU_COURS.filter((code) => !chapitre.entreprises || chapitre.entreprises.codes.includes(code)).flatMap((code) => {
    const cas = casDeLEntreprise(code);
    const deroule = chapitreDuCas(chapitre, cas);
    return deroule.etapes.flatMap((etape, i) => {
      const ou = `${chapitre.code} / ${etape.id} chez ${code}`;
      if (etape.type === "montants") return etape.champs(cas, etatAvant(deroule, cas, i)).map((c) => ({ ...c, fichier, ou }));
      if (etape.type === "a-completer") return cellules(etape.grille(cas), fichier, ou);
      return [];
    });
  });
};

const NOMBRES: readonly NombreDuCours[] = [
  ...[...CHAPITRES, ...SITUATIONS].flatMap(duChapitre),
  ...[...BUREAUX, ...ENQUETES].flatMap((b) => {
    const fichier = fichierDe.get(b) ?? `(sans fichier) ${b.code}`;
    return b.etapes.flatMap((e) => (e.type === "etat" ? cellules(e.grille, fichier, `${b.code} / ${e.id}`) : []));
  }),
];

const fautes = NOMBRES.flatMap((n) => fautesAuxDeuxDecimales(n).map((f) => ({ fichier: n.fichier, texte: `${n.ou} : ${n.libelle} (${natureDuChamp(n)}) : ${f}` })));
/** Une faute par champ au plus dans le compte : un champ est conforme ou ne l'est pas. */
const nonConformes = NOMBRES.filter((n) => fautesAuxDeuxDecimales(n).length > 0);
const parFichier: Record<string, number> = {};
for (const n of nonConformes) parFichier[n.fichier] = (parFichier[n.fichier] ?? 0) + 1;

describe("la règle des deux décimales", () => {
  it("lit la nature d'un champ comme elle le dit", () => {
    expect(natureDuChamp({ libelle: "Taux de marge (%)" })).toBe("pourcentage");
    expect(natureDuChamp({ libelle: "Part de l'adhésion, en %" })).toBe("pourcentage");
    expect(natureDuChamp({ libelle: "Gain de l'année à 60 % d'adoption" })).toBe("montant");
    expect(natureDuChamp({ libelle: "Ventes, Prévision", unite: "enceintes" })).toBe("grandeur");
    expect(natureDuChamp({ libelle: "Part, Poids", unite: "%" })).toBe("pourcentage");
    expect(natureDuChamp({ libelle: "Ventes retrouvées", nature: "quantite" })).toBe("quantite");
  });

  it("refuse ce que la règle refuse, et accepte ce qu'elle demande", () => {
    const montant = { libelle: "Coût", attendu: 412.5, calcul: "1 875 € × 22 % = 412,50 €" };
    expect(fautesAuxDeuxDecimales(montant)).toEqual([]);
    expect(fautesAuxDeuxDecimales({ ...montant, tolerance: 1 })).toEqual(["montant : tolérance de 1 au lieu d'un centième"]);
    expect(fautesAuxDeuxDecimales({ ...montant, calcul: "1 875 € × 22 % = 412,5 €" })).toEqual(["montant : le corrigé n'écrit pas « 412,50 € »"]);
    expect(fautesAuxDeuxDecimales({ ...montant, attendu: 412.505 })).toEqual(["montant : attendu 412,505, pas au centième"]);
    const taux = { libelle: "Taux de marge (%)", attendu: 55.26, calcul: "21 € ÷ 38 € × 100 = 55,26 %" };
    expect(fautesAuxDeuxDecimales(taux)).toEqual([]);
    expect(fautesAuxDeuxDecimales({ ...taux, attendu: 55.3, calcul: "21 € ÷ 38 € × 100 = 55,3 %", tolerance: 0.1 })).toHaveLength(2);
    expect(fautesAuxDeuxDecimales({ ...taux, calcul: "21 € ÷ 38 € × 100 = 155,26 %" })).toHaveLength(1);
    // Une quantité se déclare ; réputée montant, son corrigé sans euros la trahit.
    const ventes = { libelle: "Ventes retrouvées", attendu: 649, calcul: "2 162 × 30 % = 649" };
    expect(fautesAuxDeuxDecimales(ventes)).toEqual(["montant : le corrigé n'écrit pas « 649 € »"]);
    expect(fautesAuxDeuxDecimales({ ...ventes, nature: "quantite" })).toEqual([]);
    expect(fautesAuxDeuxDecimales({ ...ventes, nature: "quantite", attendu: 648.6 })).toEqual(["quantité : attendu 648,6, pas entier"]);
    expect(fautesAuxDeuxDecimales({ ...ventes, nature: "quantite", tolerance: 1 })).toHaveLength(1);
    // Un coefficient garde sa précision, jusqu'au dix-millième.
    expect(fautesAuxDeuxDecimales({ libelle: "Coefficient", attendu: 0.9568, calcul: "= 0,9568", tolerance: 0.0001, nature: "coefficient" })).toEqual([]);
    expect(fautesAuxDeuxDecimales({ libelle: "Coefficient", attendu: 0.95683, calcul: "", nature: "coefficient" })).toHaveLength(1);
  });
});

describe("chaque champ de calcul du cours suit la règle des deux décimales", () => {
  it(`${NOMBRES.length} champs et cellules, chacun rattaché à son fichier`, () => {
    expect(NOMBRES.length).toBeGreaterThan(6_000);
    expect(NOMBRES.filter((n) => n.fichier.startsWith("(sans fichier)")).map((n) => n.ou)).toEqual([]);
  });

  it("hors de la liste des fichiers à convertir, aucun champ n'enfreint la règle", () => {
    expect(fautes.filter((f) => !(f.fichier in ENCORE_A_CONVERTIR)).map((f) => `${f.fichier} : ${f.texte}`)).toEqual([]);
  });

  it("la liste dit, fichier par fichier, ce qui reste à convertir, sans entrée morte", () => {
    const listes = Object.fromEntries(Object.keys(ENCORE_A_CONVERTIR).map((f) => [f, parFichier[f] ?? 0]));
    // Un fichier listé à zéro est devenu conforme : retirez sa ligne. Un autre compte : mettez-le à jour.
    expect(listes).toEqual(ENCORE_A_CONVERTIR);
  });
});
