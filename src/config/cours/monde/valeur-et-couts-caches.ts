import { auCentime } from "./amortissement";
import { anneeDeProduction, coutsDeLaQualite, departDUnSalarie, margeUnitaire } from "./capacite";
import { FONCTIONS_DE_LA_GO, LA_GO, MARGE_CIBLE_DE_LA_GO, coutCibleDeLaGo, type FonctionDuProduit } from "./centres-de-nova";
import { FICHE_RH, HEURES_D_ABSENCE, HEURES_LEGALES_PAR_MOIS, TAUX_PATRONAL } from "./ressources-humaines-de-nova";

/**
 * LE MONDE DU COURS : LE COÛT CIBLE DE LA GO, L'ANALYSE DE LA VALEUR ET LES COÛTS CACHÉS DE NOVA (le
 * chapitre « Coût cible, analyse de la valeur et coûts cachés », DCG UE11 4.2).
 *
 * LE COÛT CIBLE EST CELUI DU CHAPITRE « PILOTER UN CENTRE ». La Go, son prix de 34 €, la marge de 15 €
 * que la direction lui demande, ses quatre fonctions, leur poids pour les clients, leur coût estimé
 * (23,50 €) et leur coût retenu (19 €, le coût variable de la gamme) viennent de centres-de-nova.ts :
 * ce fichier les relit, il ne les recopie pas. Il y ajoute l'analyse de la valeur (l'indice de valeur
 * de chaque fonction) et l'enquête qui a fixé le prix de 34 €.
 *
 * LES COÛTS CACHÉS SONT CEUX DE L'ANNÉE N + 1 DES CHAPITRES DE NOVA. Les dysfonctionnements se lisent
 * dans des fiches qui existent : les 244 heures d'absence des indicateurs sociaux, le départ d'un
 * opérateur et son coût (capacite.ts, `departDUnSalarie`), les défauts de l'année et leurs coûts
 * (capacite.ts, `coutsDeLaQualite`), au budget de prévention actuel. La méthode est celle de l'ISEOR :
 * chaque dysfonctionnement se régule par des surcharges (sursalaires, surtemps, surconsommations) ou
 * des non-produits (non-production, non-création de potentiel), et le temps perdu se valorise à la
 * contribution horaire à la marge sur coût variable (CHMCV). Les hypothèses propres au chapitre sont
 * nommées ci-dessous ; la garde tests/cours/cout-cible-et-couts-caches.test.ts refait chaque chiffre.
 */

// ─────────────────────────────────────────────────────────────────────────────
// L'ANALYSE DE LA VALEUR DE LA GO
// ─────────────────────────────────────────────────────────────────────────────

export { FONCTIONS_DE_LA_GO, LA_GO, MARGE_CIBLE_DE_LA_GO, coutCibleDeLaGo };

/**
 * L'INDICE DE VALEUR d'une fonction : son poids pour les clients (la satisfaction qu'elle apporte)
 * ÷ sa part dans le coût du produit. Au-dessus de 1, la fonction coûte moins que ce que les clients y
 * voient ; en dessous, elle coûte trop. La valeur d'un produit est le rapport de la satisfaction qu'il
 * donne à ce qu'il coûte : l'analyse de la valeur rapproche chaque indice de 1.
 */
export function analyseDeLaValeur(couts: readonly number[] = FONCTIONS_DE_LA_GO.map((x) => x.coutEstime), fonctions: readonly FonctionDuProduit[] = FONCTIONS_DE_LA_GO) {
  const total = auCentime(couts.reduce((t, x) => t + x, 0));
  const parFonction = fonctions.map((x, i) => {
    const cout = couts[i]!;
    const part = cout / total;
    return { code: x.code, libelle: x.libelle, poids: x.poids, cout, part, indice: x.poids / part };
  });
  return { total, parFonction };
}

/** Les indices de valeur du premier projet (coûts estimés) et de la Go lancée (coûts retenus). */
export const valeurDuProjet = () => analyseDeLaValeur(FONCTIONS_DE_LA_GO.map((x) => x.coutEstime));
export const valeurDeLaGoLancee = () => analyseDeLaValeur(FONCTIONS_DE_LA_GO.map((x) => x.coutRetenu));

/** LA BANDE DE L'ANALYSE DE LA VALEUR (hypothèse du laboratoire) : un indice entre 0,9 et 1,1 est jugé équilibré. */
export const BANDE_DE_L_INDICE = { min: 0.9, max: 1.1 } as const;

/** Le prix auquel le premier projet laisserait la marge visée : coût estimé + marge (la logique « coût plus marge »). */
export const prixDuCoutPlusMarge = () => auCentime(coutCibleDeLaGo().coutEstime + MARGE_CIBLE_DE_LA_GO);

/**
 * L'ENQUÊTE DE PRIX DE LA GO (hypothèse du cours) : 200 clients ont dit à quel prix la Go serait trop
 * chère, et à quel prix si peu chère qu'ils douteraient de sa qualité. À chaque prix, les non-acheteurs
 * sont ceux qui la trouvent trop chère (réponses cumulées en montant) et ceux qui la trouvent trop peu
 * chère (réponses des prix au-dessus, cumulées en descendant) ; le taux d'acceptabilité est le reste.
 * Il culmine à 34 € : c'est le prix que le marché accepte, celui de la gamme.
 */
export interface EnqueteDePrix {
  repondants: number;
  prix: readonly number[];
  tropCher: readonly number[];
  tropBas: readonly number[];
}

export const ENQUETE_DE_PRIX: EnqueteDePrix = {
  repondants: 200,
  prix: [26, 30, 34, 38, 42],
  tropCher: [0, 10, 30, 100, 60],
  tropBas: [30, 70, 80, 20, 0],
};

/** Le taux d'acceptabilité de chaque prix de l'enquête, et le prix qui le porte au plus haut. */
export function acceptabiliteDesPrix(e: EnqueteDePrix = ENQUETE_DE_PRIX) {
  const lignes = e.prix.map((prix, i) => {
    const tropCher = e.tropCher.slice(0, i + 1).reduce((t, x) => t + x, 0) / e.repondants;
    const tropBas = e.tropBas.slice(i + 1).reduce((t, x) => t + x, 0) / e.repondants;
    return { prix, tropCher, tropBas, acceptabilite: 1 - tropCher - tropBas };
  });
  const meilleur = lignes.reduce((m, l) => (l.acceptabilite > m.acceptabilite ? l : m));
  return { lignes, prix: meilleur.prix, acceptabilite: meilleur.acceptabilite };
}

/** Le laboratoire de l'analyse de la valeur : le coût de trois fonctions, la robustesse à son coût retenu. */
export function laboratoireDeLaValeur(son: number, autonomie: number, connexion: number) {
  const robustesse = FONCTIONS_DE_LA_GO.find((x) => x.code === "robustesse")!.coutRetenu;
  const couts = FONCTIONS_DE_LA_GO.map((x) => ({ son, autonomie, robustesse, connexion })[x.code as "son" | "autonomie" | "robustesse" | "connexion"]);
  const v = analyseDeLaValeur(couts);
  const k = coutCibleDeLaGo();
  const equilibre = v.parFonction.every((x) => x.indice >= BANDE_DE_L_INDICE.min - 1e-9 && x.indice <= BANDE_DE_L_INDICE.max + 1e-9);
  return { ...v, coutCible: k.coutCible, ecart: auCentime(v.total - k.coutCible), marge: auCentime(k.prix - v.total), equilibre };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES COÛTS CACHÉS DE N + 1 : LA MÉTHODE DE L'ISEOR
// ─────────────────────────────────────────────────────────────────────────────

export type CodeDeComposant = "sursalaires" | "surtemps" | "surconsommations" | "nonProduction" | "nonCreation";
export type CodeDeDysfonctionnement = "absenteisme" | "accidents" | "rotation" | "nonQualite" | "productivite";

export const COMPOSANTS_DES_COUTS_CACHES: readonly { code: CodeDeComposant; libelle: string; famille: "surcharges" | "nonProduits" }[] = [
  { code: "sursalaires", libelle: "Sursalaires", famille: "surcharges" },
  { code: "surtemps", libelle: "Surtemps", famille: "surcharges" },
  { code: "surconsommations", libelle: "Surconsommations", famille: "surcharges" },
  { code: "nonProduction", libelle: "Non-production", famille: "nonProduits" },
  { code: "nonCreation", libelle: "Non-création de potentiel", famille: "nonProduits" },
];

export const DYSFONCTIONNEMENTS: readonly { code: CodeDeDysfonctionnement; libelle: string }[] = [
  { code: "absenteisme", libelle: "Absentéisme" },
  { code: "accidents", libelle: "Accidents du travail" },
  { code: "rotation", libelle: "Rotation du personnel" },
  { code: "nonQualite", libelle: "Non-qualité" },
  { code: "productivite", libelle: "Écarts de productivité directe" },
];

/**
 * LA RÉGULATION DE L'ABSENTÉISME (hypothèse du chapitre) : la moitié des heures d'absence est rattrapée
 * par les autres opérateurs en heures supplémentaires, majorées de 25 % (des sursalaires) ; l'autre
 * moitié n'est pas rattrapée : des enceintes non montées (de la non-production).
 */
export const PART_DES_ABSENCES_RATTRAPEES = 0.5;
export const MAJORATION_DES_HEURES_SUPPLEMENTAIRES = 0.25;

/** LES ACCIDENTS DU TRAVAIL DE N + 1 (hypothèse du chapitre) : aucun. Le dysfonctionnement reste au tableau, à zéro. */
export const ACCIDENTS_DE_N_PLUS_1 = 0;

/**
 * LES ÉCARTS DE PRODUCTIVITÉ DIRECTE (hypothèse du chapitre) : 40 heures dans l'année à rechercher les
 * jeux de composants sortis du stock sans bon et à ressaisir les fiches (le stock de la comptabilité de
 * gestion ne tombe pas juste sans eux). Ce temps n'a monté aucune enceinte : un surtemps.
 */
export const HEURES_DE_RECHERCHE_DU_STOCK = 40;

/** Les heures de travail attendues de l'équipe de N + 1 : 4 opérateurs × 151,67 heures × 12 mois. */
export const heuresAttenduesDeNPlus1 = () => auCentime(FICHE_RH.plan.operateurs * HEURES_LEGALES_PAR_MOIS * 12);

/**
 * LA CONTRIBUTION HORAIRE À LA MARGE SUR COÛT VARIABLE (CHMCV) : la marge sur coût variable du plan de
 * N + 1 (26 000 enceintes à 21 €) ÷ les heures de travail attendues, au centime. C'est ce que rapporte,
 * en moyenne, une heure de travail : ce que coûte une heure perdue.
 */
export function chmcv() {
  const production = anneeDeProduction(FICHE_RH).production;
  const marge = auCentime(production * margeUnitaire(FICHE_RH));
  const heures = heuresAttenduesDeNPlus1();
  return { production, margeUnitaire: margeUnitaire(FICHE_RH), marge, heures, valeur: auCentime(marge / heures) };
}

/** Le coût d'une heure supplémentaire d'un opérateur, cotisations patronales comprises, au centime. */
export const coutDUneHeureSupplementaire = () => auCentime((FICHE_RH.operateurs.salaireBrutMensuel / HEURES_LEGALES_PAR_MOIS) * (1 + MAJORATION_DES_HEURES_SUPPLEMENTAIRES) * (1 + TAUX_PATRONAL));

type LigneDeCoutsCaches = Record<CodeDeComposant, number>;
const vide = (): LigneDeCoutsCaches => ({ sursalaires: 0, surtemps: 0, surconsommations: 0, nonProduction: 0, nonCreation: 0 });

/**
 * LES COÛTS CACHÉS DE N + 1, dysfonctionnement par dysfonctionnement et composant par composant :
 *   · l'absentéisme : les heures rattrapées au coût d'une heure supplémentaire (sursalaires), les
 *     autres à la CHMCV (non-production) ;
 *   · la rotation : le départ d'un opérateur, son recrutement (surconsommations), la marge des
 *     enceintes perdues pendant la vacance et l'intégration (non-production), moins les salaires non
 *     versés (des sursalaires négatifs : une économie) ;
 *   · la non-qualité : les retouches des défauts trouvés au contrôle (surtemps), les échanges sous
 *     garantie (surconsommations), la marge des ventes que les clients déçus font perdre (non-création
 *     de potentiel) ;
 *   · les écarts de productivité directe : les heures de recherche du stock, à la CHMCV (surtemps).
 */
export function coutsCachesDeNPlus1() {
  const h = chmcv().valeur;
  const heureSup = coutDUneHeureSupplementaire();
  const rattrapees = HEURES_D_ABSENCE * PART_DES_ABSENCES_RATTRAPEES;
  const perdues = HEURES_D_ABSENCE - rattrapees;
  const depart = departDUnSalarie(FICHE_RH);
  const qualite = coutsDeLaQualite(FICHE_RH);
  const lignes: Record<CodeDeDysfonctionnement, LigneDeCoutsCaches> = {
    absenteisme: { ...vide(), sursalaires: auCentime(rattrapees * heureSup), nonProduction: auCentime(perdues * h) },
    accidents: vide(),
    rotation: { ...vide(), sursalaires: -depart.salairesNonVerses, surconsommations: depart.recrutement, nonProduction: depart.margePerdue },
    nonQualite: { ...vide(), surtemps: qualite.interne, surconsommations: qualite.externe, nonCreation: qualite.margePerdue },
    productivite: { ...vide(), surtemps: auCentime(HEURES_DE_RECHERCHE_DU_STOCK * h) },
  };
  const totalDe = (l: LigneDeCoutsCaches) => auCentime(Object.values(l).reduce((t, x) => t + x, 0));
  const parDysfonctionnement = Object.fromEntries(DYSFONCTIONNEMENTS.map((d) => [d.code, totalDe(lignes[d.code])])) as Record<CodeDeDysfonctionnement, number>;
  const parComposant = Object.fromEntries(COMPOSANTS_DES_COUTS_CACHES.map((k) => [k.code, auCentime(DYSFONCTIONNEMENTS.reduce((t, d) => t + lignes[d.code][k.code], 0))])) as Record<CodeDeComposant, number>;
  const surcharges = auCentime(parComposant.sursalaires + parComposant.surtemps + parComposant.surconsommations);
  const nonProduits = auCentime(parComposant.nonProduction + parComposant.nonCreation);
  const total = auCentime(surcharges + nonProduits);
  const effectif = FICHE_RH.plan.operateurs;
  const masseChargee = auCentime(effectif * 12 * FICHE_RH.operateurs.salaireBrutMensuel * (1 + TAUX_PATRONAL));
  return {
    chmcv: h,
    heureSup,
    rattrapees,
    perdues,
    depart,
    qualite,
    lignes,
    parDysfonctionnement,
    parComposant,
    surcharges,
    nonProduits,
    total,
    effectif,
    parSalarie: auCentime(total / effectif),
    masseChargee,
    partDeLaMasse: total / masseChargee,
  };
}

export type CoutsCaches = ReturnType<typeof coutsCachesDeNPlus1>;

// ─────────────────────────────────────────────────────────────────────────────
// LE PRIX QUI BAISSE (le cas « Le concurrent lance une nomade à 32 € »)
// ─────────────────────────────────────────────────────────────────────────────

/** LE PRIX DU CONCURRENT (hypothèse du cas) : SoundBox lance une enceinte nomade à 32 €, et le marché de la Go s'y aligne. */
export const PRIX_DU_CONCURRENT = 32;

/** Le coût cible au prix du concurrent, réparti par fonction, face au coût de la Go lancée. */
export function coutCibleAuPrix(prix: number) {
  const k = coutCibleDeLaGo(prix, MARGE_CIBLE_DE_LA_GO);
  const parFonction = k.parFonction.map((x) => ({ ...x, ecartDuRetenu: auCentime(x.coutRetenu - x.cible) }));
  return { ...k, parFonction, ecartDuRetenu: auCentime(k.coutRetenu - k.coutCible), margeDeLaGoLancee: auCentime(prix - k.coutRetenu) };
}
