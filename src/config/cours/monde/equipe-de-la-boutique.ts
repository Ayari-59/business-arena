import { arrondi, arrondi2 } from "../../../pedagogy/cours/deux-decimales";
import { equipeDuMois, indicateursDuMois, planningFaceAuBesoin, referenceDe, coutVariable } from "./boutique";
import { DECEMBRE_N_MOINS_1, panierDuMois } from "./vente-et-caisse";
import { SMIC_HORAIRE_BRUT, SMIC_MENSUEL_BRUT } from "./ressources-humaines-de-nova";
import type { CodeDeReference, FicheDeLaBoutique } from "./maille-et-co";

/**
 * L'ÉQUIPE DE MAILLE & CO, VENDEUR PAR VENDEUR (BTS MCO, bloc 4).
 *
 * La fiche de la boutique (monde/maille-et-co.ts) donne six salariés, leurs contrats, leurs salaires
 * bruts et le planning ; ce module les fait vivre sans rien en changer. Il sert les chapitres
 * « Recruter, intégrer, former », « Rémunérer et stimuler les vendeurs », « Le climat de l'équipe »,
 * leurs cas, et les compléments des chapitres « L'équipe et son planning » (le droit du planning) et
 * du cas « L'accord de branche » (les sources du droit).
 *
 *   1. LES VENDEURS DE JANVIER : un prénom, les heures de vente de chacun (les 145 heures de vente du
 *      planning, plus les 20 heures de tâches hors vente : les 165 heures des contrats), et ses ventes
 *      en caisse. Les six refont exactement le mois de la caisse : 3 840 entrées accueillies, 940
 *      passages, 1 330 articles, 77 250 € hors taxes. Les 8 commandes des comités, hors caisse, sont
 *      prises par la responsable et ne comptent pas ici.
 *   2. LA RÉMUNÉRATION : l'objectif de chacun, une commission au-delà, une prime d'équipe, un bulletin
 *      simplifié, le SMIC et le minimum de la branche, un challenge de vente.
 *   3. LE RECRUTEMENT ET LA FORMATION : le renfort de décembre (l'affluence de décembre de N − 1), le
 *      coût de trois façons de le trouver, le coût d'un recrutement, la courbe d'apprentissage d'un
 *      nouveau vendeur, une formation à la vente additionnelle, l'apprenti face au temps partiel.
 *   4. LE CLIMAT : les absences et les retards de janvier, la rotation de N − 1, le coût de
 *      l'absentéisme, une panne de caisse un samedi, le départ d'une vendeuse.
 *   5. LE DROIT DU PLANNING ET LES SOURCES DU DROIT, tels qu'ils changent une décision chiffrée.
 *
 * Les valeurs légales sont celles de 2026 que le cours connaît ; celles dont il n'est pas sûr portent
 * la mention « À VÉRIFIER ».
 */

const auCentime = arrondi2;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const plafond = (x: number) => Math.ceil(x - 1e-9);

// ═════════════════════════════════════════════════════════════════════════════
// 1. LES VENDEURS DE JANVIER
// ═════════════════════════════════════════════════════════════════════════════

export type CodeDeSalarie = "responsable" | "adjointe" | "vendeur" | "vendeuse-partiel" | "vendeur-partiel" | "etudiante";

export interface VendeurDeJanvier {
  code: CodeDeSalarie;
  /** Un prénom, pour que le tableau de bord se lise vendeur par vendeur (personnages du cours). */
  prenom: string;
  /** Les heures de vente de la semaine ; le reste du contrat va aux tâches hors vente. */
  heuresDeVente: number;
  /** Les entrées que le vendeur a accueillies en janvier, les passages en caisse qu'il a conclus. */
  entrees: number;
  passages: number;
  articles: number;
  /** Le chiffre d'affaires hors taxes encaissé sur ses ventes. */
  chiffreDAffaires: number;
}

/**
 * LES SIX VENDEURS DE JANVIER (hypothèse du cours). La responsable passe 10 heures par semaine aux
 * tâches hors vente, l'adjointe 6, le vendeur et la vendeuse à temps partiel 2 chacun : 20 heures. Le
 * vendeur à temps partiel, Malik, décroche : il transforme moins, son panier est plus petit et il vend
 * moins d'articles par passage. L'étudiante, présente le mercredi et le samedi, transforme le mieux.
 */
export const VENDEURS: readonly VendeurDeJanvier[] = [
  { code: "responsable", prenom: "Claire", heuresDeVente: 25, entrees: 640, passages: 170, articles: 250, chiffreDAffaires: 14_800 },
  { code: "adjointe", prenom: "Sofia", heuresDeVente: 29, entrees: 760, passages: 195, articles: 280, chiffreDAffaires: 16_400 },
  { code: "vendeur", prenom: "Hugo", heuresDeVente: 33, entrees: 860, passages: 215, articles: 310, chiffreDAffaires: 17_800 },
  { code: "vendeuse-partiel", prenom: "Inès", heuresDeVente: 22, entrees: 560, passages: 140, articles: 200, chiffreDAffaires: 11_550 },
  { code: "vendeur-partiel", prenom: "Malik", heuresDeVente: 24, entrees: 660, passages: 120, articles: 150, chiffreDAffaires: 8_900 },
  { code: "etudiante", prenom: "Jade", heuresDeVente: 12, entrees: 360, passages: 100, articles: 140, chiffreDAffaires: 7_800 },
];

/** Le vendeur qui décroche, celui du tableau de bord et du climat de l'équipe. */
export const VENDEUR_QUI_DECROCHE: CodeDeSalarie = "vendeur-partiel";

/**
 * L'OBJECTIF DE CHIFFRE D'AFFAIRES (hypothèse du cours) : 120 € hors taxes encaissés par heure de
 * vente. Un mois compte 52 ÷ 12 semaines : l'objectif du mois d'un vendeur est ses heures de vente de
 * la semaine × 52 ÷ 12 × 120 €, soit 520 € par heure de vente hebdomadaire.
 */
export const OBJECTIF_PAR_HEURE_DE_VENTE = 120;

const vendeurDe = (code: CodeDeSalarie) => VENDEURS.find((v) => v.code === code)!;

/** Le tableau de bord du mois, vendeur par vendeur, et celui de l'équipe. */
export function tableauDeBordDesVendeurs(f: FicheDeLaBoutique) {
  const ligne = (v: Omit<VendeurDeJanvier, "code" | "prenom">) => {
    const objectif = auCentime(v.heuresDeVente * f.semainesParMois * OBJECTIF_PAR_HEURE_DE_VENTE);
    return {
      ...v,
      transformation: v.passages / v.entrees,
      panier: v.chiffreDAffaires / v.passages,
      indiceDeVente: v.articles / v.passages,
      objectif,
      realisation: v.chiffreDAffaires / objectif,
      ecart: auCentime(v.chiffreDAffaires - objectif),
      caParHeure: v.chiffreDAffaires / (v.heuresDeVente * f.semainesParMois),
    };
  };
  const vendeurs = VENDEURS.map((v) => ({ code: v.code, prenom: v.prenom, poste: f.equipe.find((s) => s.code === v.code)!.poste, ...ligne(v) }));
  const equipe = ligne({
    heuresDeVente: somme(VENDEURS.map((v) => v.heuresDeVente)),
    entrees: somme(VENDEURS.map((v) => v.entrees)),
    passages: somme(VENDEURS.map((v) => v.passages)),
    articles: somme(VENDEURS.map((v) => v.articles)),
    chiffreDAffaires: auCentime(somme(VENDEURS.map((v) => v.chiffreDAffaires))),
  });
  return { vendeurs, equipe, de: (code: CodeDeSalarie) => vendeurs.find((v) => v.code === code)! };
}

/** Les ventes des vendeurs refont celles de la caisse (la garde le vérifie) : les chiffres du mois. */
export function caisseDeJanvier(f: FicheDeLaBoutique) {
  const m = indicateursDuMois(f);
  return { entreesEnCaisse: somme(f.clienteles.filter((c) => c.delaiDeReglement === 0).map((c) => c.entrees)), passages: m.tickets, articles: m.articlesEnCaisse, chiffreDAffaires: m.chiffreDAffairesEnCaisse };
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. LA RÉMUNÉRATION ET LA STIMULATION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LA COMMISSION PROPOSÉE (hypothèse du cours) : 5 % du chiffre d'affaires hors taxes réalisé au-delà
 * de l'objectif individuel. Rien en dessous : la part fixe reste le salaire du contrat.
 */
export const TAUX_DE_COMMISSION = 0.05;

/**
 * LA PRIME D'ÉQUIPE PROPOSÉE (hypothèse du cours) : 3 € bruts par heure de vente hebdomadaire du
 * vendeur, versés à chacun si l'équipe dépasse son objectif du mois. Le prorata des heures traite les
 * temps partiels comme les temps complets (égalité de traitement).
 */
export const PRIME_D_EQUIPE_PAR_HEURE = 3;

/**
 * LES COTISATIONS SALARIALES (hypothèse du cours, simplifiée) : 22 % du brut, l'ordre de grandeur des
 * cotisations d'un employé du commerce (sécurité sociale, retraite complémentaire, CSG et CRDS). Le
 * bulletin du cours s'arrête au net avant impôt sur le revenu.
 */
export const TAUX_SALARIAL = 0.22;

/**
 * LE MINIMUM DE LA BRANCHE (hypothèse du cours, à VÉRIFIER sur la grille de la convention collective
 * du commerce de détail de l'habillement) : 1 890 € bruts par mois pour 35 heures au niveau d'un
 * vendeur, au-dessus du SMIC. Il s'apprécie au prorata des heures pour un temps partiel.
 */
// À VÉRIFIER : la grille des minima conventionnels de la branche en 2026.
export const MINIMUM_DE_LA_BRANCHE_35_HEURES = 1_890;

/** Les heures mensualisées d'un temps complet : 35 × 52 ÷ 12, écrites 151,67. */
export const HEURES_D_UN_TEMPS_COMPLET = 151.67;

/** La rémunération variable du mois, vendeur par vendeur, pour un taux de commission et une prime d'équipe par heure. */
export function remunerationVariable(f: FicheDeLaBoutique, tauxDeCommission: number = TAUX_DE_COMMISSION, primeParHeure: number = PRIME_D_EQUIPE_PAR_HEURE) {
  const t = tableauDeBordDesVendeurs(f);
  const equipeAuDessus = t.equipe.chiffreDAffaires > t.equipe.objectif;
  const vendeurs = t.vendeurs.map((v) => {
    const commission = auCentime(Math.max(0, v.ecart) * tauxDeCommission);
    const prime = equipeAuDessus ? auCentime(v.heuresDeVente * primeParHeure) : 0;
    return { code: v.code, prenom: v.prenom, commission, prime, variable: auCentime(commission + prime) };
  });
  const brut = auCentime(somme(vendeurs.map((v) => v.variable)));
  const cout = auCentime(brut * (1 + f.tauxPatronal));
  return {
    vendeurs,
    equipeAuDessus,
    commissions: auCentime(somme(vendeurs.map((v) => v.commission))),
    primes: auCentime(somme(vendeurs.map((v) => v.prime))),
    brut,
    cout,
    /** Le plus petit variable versé à un vendeur. */
    plusPetit: Math.min(...vendeurs.map((v) => v.variable)),
    de: (code: CodeDeSalarie) => vendeurs.find((v) => v.code === code)!,
  };
}

/** Le bulletin simplifié d'un salarié pour un mois : le fixe, le variable, le brut, les cotisations, le net, le coût. */
export function bulletinSimplifie(f: FicheDeLaBoutique, code: CodeDeSalarie, variable: number) {
  const s = f.equipe.find((x) => x.code === code)!;
  const brut = auCentime(s.brutMensuel + variable);
  const cotisationsSalariales = auCentime(brut * TAUX_SALARIAL);
  const cotisationsPatronales = auCentime(brut * f.tauxPatronal);
  const heures = auCentime(s.heuresParSemaine * f.semainesParMois);
  return {
    poste: s.poste,
    fixe: s.brutMensuel,
    variable,
    brut,
    cotisationsSalariales,
    net: auCentime(brut - cotisationsSalariales),
    cotisationsPatronales,
    coutEmployeur: auCentime(brut + cotisationsPatronales),
    heures,
    /** Le salaire horaire du fixe, face au SMIC et au minimum de la branche au prorata. */
    horaireDuFixe: s.brutMensuel / heures,
    minimumDeLaBranche: auCentime((MINIMUM_DE_LA_BRANCHE_35_HEURES * s.heuresParSemaine) / 35),
  };
}

/** Chaque fixe de l'équipe face au SMIC horaire et au minimum de la branche. */
export function fixesFaceAuxMinima(f: FicheDeLaBoutique) {
  return f.equipe.map((s) => {
    const b = bulletinSimplifie(f, s.code as CodeDeSalarie, 0);
    return { code: s.code, poste: s.poste, horaire: b.horaireDuFixe, auDessusDuSmic: b.horaireDuFixe >= SMIC_HORAIRE_BRUT, minimum: b.minimumDeLaBranche, auDessusDuMinimum: s.brutMensuel >= b.minimumDeLaBranche };
  });
}

/**
 * LE CHALLENGE DE L'ÉCHARPE (hypothèse du cours) : en février, l'écharpe proposée en vente
 * additionnelle. Le vendeur qui en vend le plus gagne 150 € bruts, et l'équipe touche 1 € brut par
 * écharpe vendue au-delà des ventes de janvier. Une dotation versée par l'employeur est du salaire :
 * elle supporte les cotisations patronales de la fiche. L'objectif du challenge : 60 écharpes en plus.
 */
export const CHALLENGE_DE_L_ECHARPE = { reference: "echarpe" as CodeDeReference, dotation: 150, parArticle: 1, objectif: 60 } as const;

/**
 * LE CHALLENGE DU MÉRINOS (hypothèse du cas « Le challenge du mérinos ») : la montée en gamme, 300 €
 * bruts au vendeur qui vend le plus de pulls mérinos en mars, et 3 € bruts par mérinos vendu au-delà
 * de janvier. La direction en attend 30 de plus, dont 20 vendus à des clients qui auraient pris un
 * pull col rond : une vente reportée ne rapporte que l'écart de marge entre les deux pulls.
 */
export const CHALLENGE_DU_MERINOS = { reference: "merinos" as CodeDeReference, remplace: "col-rond" as CodeDeReference, dotation: 300, parArticle: 3, enPlus: 30, reportes: 20 } as const;

/** Un challenge de vente : la marge d'un article, ce que coûte le challenge pour un nombre d'articles en plus, et le seuil qui le paie. */
export function challenge(f: FicheDeLaBoutique, c: { reference: CodeDeReference; dotation: number; parArticle: number }, enPlus: number, margeDUnArticle?: number) {
  const r = referenceDe(f, c.reference);
  const marge = margeDUnArticle ?? auCentime(r.prixHt - coutVariable(r));
  const coutBrut = auCentime(c.dotation + c.parArticle * enPlus);
  const cout = auCentime(coutBrut * (1 + f.tauxPatronal));
  const margeEnPlus = auCentime(marge * enPlus);
  // Le seuil : la marge des articles en plus couvre la dotation et la prime par article, chargées.
  const seuil = plafond((c.dotation * (1 + f.tauxPatronal)) / (marge - c.parArticle * (1 + f.tauxPatronal)));
  return { marge, coutBrut, cout, margeEnPlus, gain: auCentime(margeEnPlus - cout), seuil };
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. LE RECRUTEMENT, L'INTÉGRATION ET LA FORMATION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * L'AFFLUENCE DE DÉCEMBRE (hypothèse du cours) : 1,8 fois la semaine type de janvier. Décembre de
 * N − 1 a fait 3 100 passages en caisse (vente-et-caisse.ts) pour environ 6 900 entrées : les clients
 * viennent chercher un cadeau, la transformation y dépasse 40 %.
 */
export const AFFLUENCE_DE_DECEMBRE = 1.8;

/** Les semaines du renfort : les quatre semaines de décembre. */
export const SEMAINES_DE_RENFORT = 4;

/**
 * LE SALAIRE HORAIRE D'UN RENFORT (hypothèse du cours) : 12,50 € bruts, celui des temps partiels de
 * l'équipe, au-dessus du SMIC et du minimum de la branche rapporté à l'heure.
 */
export const BRUT_HORAIRE_DU_RENFORT = 12.5;

/**
 * LE CDD DE DÉCEMBRE : un CDD pour accroissement temporaire d'activité. À sa fin, le salarié reçoit
 * l'indemnité de fin de contrat (10 % des salaires bruts) et l'indemnité compensatrice de congés payés
 * (10 % des salaires et de l'indemnité de fin de contrat). Un CDD saisonnier n'ouvrirait pas
 * l'indemnité de fin de contrat, mais le pic de Noël d'une boutique relève de l'accroissement
 * temporaire d'activité.
 */
// À VÉRIFIER : la qualification « accroissement temporaire » du pic de fin d'année dans la branche.
export const INDEMNITE_DE_FIN_DE_CONTRAT = 0.1;
export const INDEMNITE_DE_CONGES_PAYES = 0.1;
export const HEURES_D_UN_CDD = 35;

/**
 * L'INTÉRIM (hypothèse du cours) : l'agence facture 2,1 fois le salaire brut horaire de l'intérimaire ;
 * le coefficient couvre ses cotisations, les indemnités de fin de mission et de congés payés, et la
 * marge de l'agence. Aucun coût de recrutement pour la boutique.
 */
export const COEFFICIENT_DE_L_INTERIM = 2.1;

/**
 * LES AVENANTS DE COMPLÉMENT D'HEURES (hypothèse du cours) : la vendeuse et le vendeur à temps
 * partiel et l'étudiante peuvent chacun travailler 8 heures de plus par semaine en décembre, par un
 * avenant temporaire à leur contrat, au salaire de leur contrat ; au plus 24 heures par semaine.
 */
// À VÉRIFIER : le nombre d'avenants par an et leur majoration, fixés par l'accord de branche.
export const HEURES_PAR_AVENANT = 8;
export const AVENANTS_POSSIBLES = 3;

/**
 * LE COÛT D'UN RECRUTEMENT (hypothèse du cours) : une annonce sur un site d'emploi (90 €), deux heures
 * de la responsable pour trier les candidatures, six entretiens de 45 minutes menés à deux par la
 * responsable et l'adjointe. Les heures se comptent au taux horaire chargé de chacune.
 */
export const RECRUTEMENT = { annonce: 90, heuresDeTri: 2, entretiens: 6, dureeDUnEntretien: 0.75 } as const;

/** Le coût d'un recrutement, au taux horaire chargé de la responsable et de l'adjointe. */
export function coutDuRecrutement(f: FicheDeLaBoutique) {
  const e = equipeDuMois(f);
  // Le taux horaire chargé au centime, celui que la copie reprend (25,28 €, 20,13 €).
  const taux = (code: string) => auCentime(e.salaries.find((s) => s.code === code)!.tauxHoraireCharge);
  const tri = auCentime(RECRUTEMENT.heuresDeTri * taux("responsable"));
  const entretiens = auCentime(RECRUTEMENT.entretiens * RECRUTEMENT.dureeDUnEntretien * (taux("responsable") + taux("adjointe")));
  return { annonce: RECRUTEMENT.annonce, tri, entretiens, total: auCentime(RECRUTEMENT.annonce + tri + entretiens), tauxResponsable: taux("responsable"), tauxAdjointe: taux("adjointe") };
}

/** Le besoin de décembre : les heures de vente qui manquent au planning à l'affluence de décembre. */
export function besoinDeDecembre(f: FicheDeLaBoutique) {
  const p = planningFaceAuBesoin(f, f.planning, { affluence: AFFLUENCE_DE_DECEMBRE });
  return { besoin: p.besoin.parSemaine, contrats: p.heuresDuPlanning, manquantes: p.heuresManquantes, enTrop: p.heuresEnTrop, aCouvrir: Math.max(0, p.heuresManquantes - p.heuresEnTrop) };
}

/** Le coût d'un CDD de 35 heures sur les semaines du renfort, indemnités et cotisations comprises, sans le recrutement. */
export function coutDUnCdd(f: FicheDeLaBoutique) {
  const heures = HEURES_D_UN_CDD * SEMAINES_DE_RENFORT;
  const salaires = auCentime(heures * BRUT_HORAIRE_DU_RENFORT);
  const finDeContrat = auCentime(salaires * INDEMNITE_DE_FIN_DE_CONTRAT);
  const congesPayes = auCentime((salaires + finDeContrat) * INDEMNITE_DE_CONGES_PAYES);
  const brut = auCentime(salaires + finDeContrat + congesPayes);
  const cout = auCentime(brut * (1 + f.tauxPatronal));
  return { heures, salaires, finDeContrat, congesPayes, brut, cout, parHeure: cout / heures };
}

/** Le renfort de décembre : des heures d'avenant, des CDD de 35 heures, des heures d'intérim par semaine. Ce qu'il couvre, ce qu'il coûte. */
export function renfortDeDecembre(f: FicheDeLaBoutique, p: { avenants: number; cdd: number; interim: number }) {
  const b = besoinDeDecembre(f);
  const cdd = coutDUnCdd(f);
  const rec = coutDuRecrutement(f);
  const heures = p.avenants + p.cdd * HEURES_D_UN_CDD + p.interim;
  const coutDesAvenants = auCentime(p.avenants * SEMAINES_DE_RENFORT * BRUT_HORAIRE_DU_RENFORT * (1 + f.tauxPatronal));
  const coutDesCdd = auCentime(p.cdd * (cdd.cout + rec.total));
  const coutDeLInterim = auCentime(p.interim * SEMAINES_DE_RENFORT * BRUT_HORAIRE_DU_RENFORT * COEFFICIENT_DE_L_INTERIM);
  return {
    aCouvrir: b.aCouvrir,
    heures,
    manquantes: Math.max(0, b.aCouvrir - heures),
    enTrop: Math.max(0, heures - b.aCouvrir),
    coutDesAvenants,
    coutDesCdd,
    coutDeLInterim,
    total: auCentime(coutDesAvenants + coutDesCdd + coutDeLInterim),
  };
}

/** Les positions du laboratoire du renfort. */
export const LEVIERS_DU_RENFORT = {
  avenants: { min: 0, max: HEURES_PAR_AVENANT * AVENANTS_POSSIBLES, pas: HEURES_PAR_AVENANT },
  cdd: { min: 0, max: 2, pas: 1 },
  interim: { min: 0, max: 90, pas: 1 },
} as const;

/** Le renfort le moins cher qui couvre toutes les heures : toutes les positions des leviers essayées. */
export function meilleurRenfort(f: FicheDeLaBoutique) {
  const l = LEVIERS_DU_RENFORT;
  const positions: { avenants: number; cdd: number; interim: number }[] = [];
  for (let a = l.avenants.min; a <= l.avenants.max; a += l.avenants.pas)
    for (let c = l.cdd.min; c <= l.cdd.max; c += l.cdd.pas) for (let i = l.interim.min; i <= l.interim.max; i += l.interim.pas) positions.push({ avenants: a, cdd: c, interim: i });
  return positions
    .map((p) => ({ ...p, r: renfortDeDecembre(f, p) }))
    .filter((x) => x.r.manquantes === 0)
    .reduce((a, b) => (b.r.total < a.r.total ? b : a));
}

/**
 * LA COURBE D'APPRENTISSAGE (hypothèse du cours) : un vendeur formé fait, en décembre, 3 passages en
 * caisse par heure de vente (3 100 passages pour environ 1 000 heures de vente en décembre de N − 1).
 * Un nouveau vendeur en fait 60 % la première semaine, 80 % la deuxième, 95 % la troisième, puis
 * autant que l'équipe. Avec un parcours d'intégration (une heure de tutorat par l'adjointe chaque jour
 * de la première semaine, une fiche des références, la caisse apprise avant le premier samedi), il en
 * fait 80 %, 95 %, puis 100 %.
 */
export const PASSAGES_PAR_HEURE_EN_DECEMBRE = 3;
export const COURBE_SANS_INTEGRATION = [0.6, 0.8, 0.95, 1] as const;
export const COURBE_AVEC_INTEGRATION = [0.8, 0.95, 1, 1] as const;
export const HEURES_DE_TUTORAT = 6;

/** Les passages en caisse qu'un nouveau vendeur de 35 heures ne fait pas, semaine par semaine, et la marge qu'ils emportent. */
export function courbeDApprentissage(f: FicheDeLaBoutique, courbe: readonly number[] = COURBE_SANS_INTEGRATION) {
  const parSemaine = HEURES_D_UN_CDD * PASSAGES_PAR_HEURE_EN_DECEMBRE;
  const semaines = courbe.map((r) => ({ part: r, passages: auCentime(parSemaine * r), manques: auCentime(parSemaine * (1 - r)) }));
  const manques = auCentime(somme(semaines.map((s) => s.manques)));
  const marge = panierDuMois(f, DECEMBRE_N_MOINS_1).marge;
  return { parSemaine, semaines, manques, margeDUnPassage: marge, margePerdue: auCentime(manques * marge) };
}

/** Ce que rapporte le parcours d'intégration : les passages regagnés, leur marge, face aux heures de tutorat. */
export function integration(f: FicheDeLaBoutique) {
  const sans = courbeDApprentissage(f, COURBE_SANS_INTEGRATION);
  const avec = courbeDApprentissage(f, COURBE_AVEC_INTEGRATION);
  const tutorat = auCentime(HEURES_DE_TUTORAT * coutDuRecrutement(f).tauxAdjointe);
  return { sans, avec, regagnes: auCentime(sans.manques - avec.manques), margeRegagnee: auCentime(sans.margePerdue - avec.margePerdue), tutorat, gain: auCentime(sans.margePerdue - avec.margePerdue - tutorat) };
}

/**
 * LA FORMATION À LA VENTE ADDITIONNELLE (hypothèse du cours) : une journée de 7 heures pour les cinq
 * vendeurs (tous sauf la responsable), 280 € par personne chez l'organisme ; les heures de formation
 * sont du temps de travail, payées au taux horaire chargé de chacun. L'opérateur de compétences
 * (OPCO) de la branche prend en charge la moitié des frais de l'organisme. La formation fait gagner
 * 0,05 article par passage en caisse aux cinq vendeurs.
 */
// À VÉRIFIER : le taux de prise en charge de l'OPCO pour une entreprise de moins de 50 salariés.
export const FORMATION = { heures: 7, fraisParPersonne: 280, priseEnCharge: 0.5, indiceEnPlus: 0.05 } as const;
export const FORMES: readonly CodeDeSalarie[] = ["adjointe", "vendeur", "vendeuse-partiel", "vendeur-partiel", "etudiante"];

/** Ce que coûte la formation, ce qu'elle rapporte chaque mois, et en combien de mois elle se paie. */
export function formationALaVenteAdditionnelle(f: FicheDeLaBoutique) {
  const e = equipeDuMois(f);
  const frais = FORMATION.fraisParPersonne * FORMES.length;
  const priseEnCharge = auCentime(frais * FORMATION.priseEnCharge);
  const heures = auCentime(somme(FORMES.map((c) => auCentime(FORMATION.heures * auCentime(e.salaries.find((s) => s.code === c)!.tauxHoraireCharge)))));
  const cout = auCentime(frais - priseEnCharge + heures);
  const passages = somme(VENDEURS.filter((v) => FORMES.includes(v.code)).map((v) => v.passages));
  const articlesEnPlus = auCentime(passages * FORMATION.indiceEnPlus);
  const margeDUnArticle = auCentime(panierDuMois(f).margeMoyenneDeLArticle);
  const gainParMois = auCentime(articlesEnPlus * margeDUnArticle);
  return { frais, priseEnCharge, heures, cout, passages, articlesEnPlus, margeDUnArticle, gainParMois, mois: auCentime(cout / gainParMois) };
}

/**
 * L'APPRENTI OU LE TEMPS PARTIEL (hypothèses du cas « Un apprenti ou un temps partiel ? ») : pour
 * couvrir les samedis et préparer un futur adjoint, la boutique compare, sur un an de 47 semaines
 * travaillées (cinq semaines de congés payés) :
 *   · un CDI de 24 heures au salaire des temps partiels, 1 300 € bruts par mois ;
 *   · un apprenti en BTS MCO de 21 ans, en première année : 53 % du SMIC, des cotisations patronales
 *     réduites à 8 % du brut, une aide à l'embauche de 5 000 € la première année ; il passe 21 heures
 *     par semaine en boutique (trois jours, dont le samedi, deux jours à l'école) et son maître
 *     d'apprentissage, l'adjointe, lui consacre 2 heures par semaine.
 */
// À VÉRIFIER : le pourcentage du SMIC (21 ans, 1re année), le taux des cotisations patronales après
// réduction et le montant de l'aide à l'embauche d'un apprenti en 2026.
export const SEMAINES_TRAVAILLEES = 47;
export const APPRENTI = { partDuSmic: 0.53, tauxPatronal: 0.08, aide: 5_000, heuresEnBoutique: 21, tutorat: 2 } as const;
export const TEMPS_PARTIEL = { heures: 24, brutMensuel: 1_300 } as const;

/** Le coût de l'année et le coût d'une heure en boutique, pour l'apprenti et pour le temps partiel. */
export function apprentiOuTempsPartiel(f: FicheDeLaBoutique) {
  const smicMensuel = SMIC_MENSUEL_BRUT;
  const brutApprenti = auCentime(smicMensuel * APPRENTI.partDuSmic);
  const salaireApprenti = auCentime(brutApprenti * (1 + APPRENTI.tauxPatronal) * 12);
  const tutorat = auCentime(APPRENTI.tutorat * SEMAINES_TRAVAILLEES * coutDuRecrutement(f).tauxAdjointe);
  const apprenti = auCentime(salaireApprenti - APPRENTI.aide + tutorat);
  const heuresApprenti = APPRENTI.heuresEnBoutique * SEMAINES_TRAVAILLEES;
  const tempsPartiel = auCentime(TEMPS_PARTIEL.brutMensuel * (1 + f.tauxPatronal) * 12);
  const heuresTempsPartiel = TEMPS_PARTIEL.heures * SEMAINES_TRAVAILLEES;
  return {
    smicMensuel,
    brutApprenti,
    salaireApprenti,
    tutorat,
    apprenti,
    heuresApprenti,
    parHeureApprenti: auCentime(apprenti / heuresApprenti),
    tempsPartiel,
    heuresTempsPartiel,
    parHeureTempsPartiel: auCentime(tempsPartiel / heuresTempsPartiel),
    /** Sans l'aide : ce que coûte l'heure de l'apprenti la deuxième année, à salaire égal (la garde montre l'effet de l'aide). */
    parHeureApprentiSansAide: auCentime((salaireApprenti + tutorat) / heuresApprenti),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. LE CLIMAT DE L'ÉQUIPE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LES ABSENCES DE JANVIER (hypothèse du cours), en heures : Malik, trois jours d'arrêt maladie
 * (18 heures) ; l'adjointe, un jour pour enfant malade (7 heures) ; l'étudiante, un samedi (6 heures).
 * Les jours d'absence ne sont pas payés par la boutique (les indemnités journalières de la Sécurité
 * sociale prennent le relais après le délai de carence).
 */
// À VÉRIFIER : le maintien de salaire par l'employeur prévu par la convention collective.
export const ABSENCES_DE_JANVIER: Readonly<Partial<Record<CodeDeSalarie, number>>> = { "vendeur-partiel": 18, adjointe: 7, etudiante: 6 };

/** LES RETARDS DE JANVIER (hypothèse du cours) : quatre pour Malik, aucun pour les autres. */
export const RETARDS_DE_JANVIER: Readonly<Partial<Record<CodeDeSalarie, number>>> = { "vendeur-partiel": 4 };

/**
 * LE REMPLACEMENT DES ABSENCES (hypothèse du cours) : 14 heures remplacées par des heures
 * complémentaires de la vendeuse à temps partiel et de l'étudiante, majorées de 10 %. Les heures
 * complémentaires d'un temps partiel sont plafonnées au dixième de son contrat (2,4 heures par
 * semaine pour 24 heures, 1,2 pour 12) : sur un mois, au plus 15 heures. Une heure de vente absente et
 * non remplacée fait perdre un passage en caisse, à la marge d'un passage de janvier.
 */
export const HEURES_REMPLACEES = 14;
export const MAJORATION_DES_HEURES_COMPLEMENTAIRES = 0.1;
export const HEURES_COMPLEMENTAIRES_POSSIBLES = 15;
export const PASSAGES_PERDUS_PAR_HEURE = 1;

/**
 * LES FACTEURS DE RISQUE AUTOUR DE MALIK (hypothèse du cours) : il ferme seul la boutique 3 soirs par
 * semaine, et se dispute avec la vendeuse à temps partiel 2 samedis sur 4.
 */
export const SOIRS_DE_FERMETURE_SEUL = 3;
export const SAMEDIS_DISPUTES = 2;

/** LA ROTATION DE N − 1 (hypothèse du cours) : deux départs (une vendeuse, une étudiante) et deux arrivées, pour six salariés en moyenne. */
export const MOUVEMENTS_DE_N_MOINS_1 = { departs: 2, arrivees: 2, effectifMoyen: 6 } as const;

/** Les indicateurs sociaux de janvier, salarié par salarié et pour l'équipe. */
export function indicateursSociaux(f: FicheDeLaBoutique) {
  const e = equipeDuMois(f);
  const salaries = e.salaries.map((s) => {
    const absences = ABSENCES_DE_JANVIER[s.code as CodeDeSalarie] ?? 0;
    return { code: s.code as CodeDeSalarie, poste: s.poste, prenom: vendeurDe(s.code as CodeDeSalarie).prenom, heures: s.heuresDuMois, absences, retards: RETARDS_DE_JANVIER[s.code as CodeDeSalarie] ?? 0, taux: absences / s.heuresDuMois };
  });
  const absences = somme(salaries.map((s) => s.absences));
  const m = MOUVEMENTS_DE_N_MOINS_1;
  return {
    salaries,
    absences,
    heures: e.heuresDuMois,
    absenteisme: absences / e.heuresDuMois,
    retards: somme(salaries.map((s) => s.retards)),
    rotation: (m.departs + m.arrivees) / 2 / m.effectifMoyen,
    heuresComplementaires: HEURES_REMPLACEES,
    de: (code: CodeDeSalarie) => salaries.find((s) => s.code === code)!,
  };
}

/** Le coût d'une heure complémentaire d'un temps partiel : 12,50 € bruts majorés de 10 %, chargés. */
export function coutDUneHeureComplementaire(f: FicheDeLaBoutique) {
  return auCentime(BRUT_HORAIRE_DU_RENFORT * (1 + MAJORATION_DES_HEURES_COMPLEMENTAIRES) * (1 + f.tauxPatronal));
}

/** Le coût du mois des absences : les heures remplacées, la marge des heures non remplacées. */
export function coutDesAbsences(f: FicheDeLaBoutique, absences: number = indicateursSociaux(f).absences, remplacees: number = HEURES_REMPLACEES) {
  const r = Math.min(remplacees, absences);
  const nonRemplacees = absences - r;
  const marge = panierDuMois(f).marge;
  const remplacement = auCentime(r * coutDUneHeureComplementaire(f));
  const margePerdue = auCentime(nonRemplacees * PASSAGES_PERDUS_PAR_HEURE * marge);
  const total = auCentime(remplacement + margePerdue);
  return { absences, remplacees: r, nonRemplacees, heureComplementaire: coutDUneHeureComplementaire(f), margeDUnPassage: marge, remplacement, margePerdue, total, parAn: auCentime(total * 12) };
}

/**
 * LA PANNE DE CAISSE (hypothèse du cours) : un samedi, le logiciel de caisse et le terminal de
 * paiement tombent en panne de 14 h à 17 h. Sans plan de secours, 80 % des ventes de ces trois
 * heures sont perdues (seuls les clients qui paient en espèces achètent) ; avec un plan prêt (un
 * terminal de paiement de secours, des tickets écrits à la main, un vendeur à la porte pour prévenir),
 * 10 % seulement. Le terminal de secours coûte 20 € par mois.
 */
export const PANNE_DE_CAISSE = { creneaux: [4, 5, 6], pertesSansPlan: 0.8, pertesAvecPlan: 0.1, secoursParMois: 20 } as const;

/** Les ventes des créneaux de la panne, et ce qu'en perd la boutique avec et sans plan de secours. */
export function panneDeCaisse(f: FicheDeLaBoutique) {
  const ind = indicateursDuMois(f);
  // Le taux de marge à deux décimales en pourcentage, la caisse d'une semaine au centime : la copie part d'eux.
  const tauxDeMarge = arrondi((ind.chiffreDAffaires - somme(f.gamme.map((r) => r.ventesDuMois * coutVariable(r)))) / ind.chiffreDAffaires, 4);
  const semaine = somme(Object.values(f.affluence).flat());
  const caisseParSemaine = auCentime(ind.chiffreDAffairesEnCaisse / f.semainesParMois);
  const entreesDeLaPanne = somme(PANNE_DE_CAISSE.creneaux.map((i) => f.affluence.samedi[i]!));
  const ventes = auCentime((caisseParSemaine * entreesDeLaPanne) / semaine);
  const perduSans = auCentime(ventes * PANNE_DE_CAISSE.pertesSansPlan);
  const perduAvec = auCentime(ventes * PANNE_DE_CAISSE.pertesAvecPlan);
  return {
    caisseParSemaine: auCentime(caisseParSemaine),
    entreesDeLaSemaine: semaine,
    entreesDeLaPanne,
    ventes,
    perduSans,
    perduAvec,
    tauxDeMarge,
    margeSauvee: auCentime((perduSans - perduAvec) * tauxDeMarge),
    secoursParAn: PANNE_DE_CAISSE.secoursParMois * 12,
  };
}

/**
 * LE DÉPART D'UNE VENDEUSE (hypothèses du cas « Retenir la vendeuse ») : la vendeuse à temps partiel
 * demande un samedi libre sur quatre, ou elle démissionne. Si elle part, la boutique paie un
 * recrutement, deux semaines sans personne sur son poste (ses 22 heures de vente non remplacées,
 * un passage perdu par heure), puis la courbe d'apprentissage de sa remplaçante (60 %, 80 %, 95 % de
 * ce qu'elle faisait, au rythme de janvier). Si elle reste, ses 8 heures d'un samedi par mois passent
 * sur un lundi, où l'équipe a des heures en trop, et le samedi est tenu par le vendeur, en heures
 * supplémentaires majorées de 25 %.
 */
export const DEPART_DE_LA_VENDEUSE = { code: "vendeuse-partiel" as CodeDeSalarie, semainesDeVacance: 2, heuresDuSamedi: 8, majoration: 0.25, remplacant: "vendeur" as CodeDeSalarie } as const;

/** Ce que coûte son départ, ce que coûte sa demande sur un an. */
export function retenirLaVendeuse(f: FicheDeLaBoutique) {
  const d = DEPART_DE_LA_VENDEUSE;
  const v = tableauDeBordDesVendeurs(f).de(d.code);
  const marge = panierDuMois(f).marge;
  const recrutement = coutDuRecrutement(f).total;
  const heuresVacantes = v.heuresDeVente * d.semainesDeVacance;
  const vacance = auCentime(heuresVacantes * PASSAGES_PERDUS_PAR_HEURE * marge);
  // Les passages d'une semaine au centième, puis les semaines d'apprentissage d'un seul produit, comme sur la copie.
  const passagesParSemaine = auCentime(v.passages / f.semainesParMois);
  const manques = auCentime(passagesParSemaine * somme(COURBE_SANS_INTEGRATION.map((r) => auCentime(1 - r))));
  const apprentissage = auCentime(manques * marge);
  const depart = auCentime(recrutement + vacance + apprentissage);
  const s = f.equipe.find((x) => x.code === d.remplacant)!;
  const horaire = auCentime(s.brutMensuel / HEURES_D_UN_TEMPS_COMPLET);
  const parMois = auCentime(d.heuresDuSamedi * horaire * (1 + d.majoration) * (1 + f.tauxPatronal));
  return { recrutement, heuresVacantes, vacance, passagesParSemaine, manques, apprentissage, depart, horaire, parMois, parAn: auCentime(parMois * 12), margeDUnPassage: marge };
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. LE DROIT DU PLANNING ET LES SOURCES DU DROIT
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LES RÈGLES DU PLANNING (Code du travail, 2026) : 10 heures de travail effectif par jour au plus,
 * 48 heures par semaine (44 en moyenne sur 12 semaines), 11 heures de repos consécutives entre deux
 * journées, 35 heures de repos par semaine (24 plus les 11 du repos quotidien), une pause de 20
 * minutes dès 6 heures de travail ; un temps partiel de 24 heures par semaine au moins, sauf
 * dérogation (un étudiant de moins de 26 ans, une demande écrite du salarié) ; des heures
 * complémentaires au plus au dixième du contrat (au tiers si un accord le prévoit), majorées de 10 %
 * puis de 25 % ; un planning de temps partiel modifié avec 7 jours ouvrés de délai de prévenance (3 si un accord le
 * prévoit).
 */
export const REGLES_DU_PLANNING = {
  heuresParJour: 10,
  heuresParSemaine: 48,
  reposQuotidien: 11,
  reposHebdomadaire: 35,
  tempsPartielMinimum: 24,
  partDesHeuresComplementaires: 0.1,
  delaiDePrevenance: 7,
} as const;

/**
 * LES PROPOSITIONS DU RESPONSABLE POUR LA SEMAINE DE LA BRADERIE (hypothèse du complément du chapitre
 * « L'équipe et son planning »), en heures : le vendeur de 10 h à 21 h le samedi, l'adjointe à 46
 * heures dans la semaine, 10 heures de repos entre une fermeture à 20 h et un inventaire à 6 h,
 * 2 heures complémentaires pour le vendeur à temps partiel, 6 pour la vendeuse, un nouveau contrat de
 * 10 heures sans demande écrite.
 */
export const PROPOSITIONS_DE_LA_BRADERIE = {
  samediDuVendeur: 11,
  semaineDeLAdjointe: 46,
  reposAvantLInventaire: 10,
  complementairesDuVendeur: 2,
  complementairesDeLaVendeuse: 6,
  nouveauContrat: 10,
} as const;
