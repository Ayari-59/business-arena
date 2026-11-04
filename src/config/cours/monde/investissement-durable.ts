import { auCentime } from "./amortissement";
import { CONTRAT_DE_PRET } from "./exercice-de-nova";
import { fluxDuProjet, tri, valeurResiduelleNette, van } from "./finance";
import {
  DUREE_DES_PROJETS,
  PROJET_LIGNE_MANUELLE,
  PROJET_LIGNE_SEMI_AUTOMATIQUE,
  TAUX_DE_L_IMPOT_DES_PROJETS,
  TAUX_D_ACTUALISATION_DE_NOVA,
  type ActifDuProjet,
} from "./projets-et-financement";
import { KG_CO2_PAR_KWH } from "./tableau-de-bord-durable";

/**
 * LE MONDE DU COURS : ÉVALUER UN INVESTISSEMENT DURABLE (DCG UE6, 2.4).
 *
 * Le chapitre « Évaluer un investissement durable » et son cas le lisent. Il reprend, sans les
 * recopier, les deux projets qui s'excluent du chapitre « Le TRI et le choix entre deux projets »
 * (projets-et-financement.ts) : A, la gamme sur une seconde ligne manuelle (60 000 € et les moules) ;
 * B, la gamme sur une ligne semi-automatique (150 000 € et les moules). À 9 %, le coût du capital de
 * l'activité de NOVA, B a la plus forte VAN, A le plus fort TRI. Le chapitre y fait entrer la
 * transition écologique, comme le programme le demande :
 *   · DANS LES FLUX : le coût supplémentaire des équipements d'efficacité énergétique ajoutés à A, la
 *     subvention qui en prend une part, l'électricité économisée, et la réduction des risques futurs
 *     (la hausse attendue du prix de l'électricité, qui pèse plus sur B, qui en consomme plus) ;
 *   · DANS LE TAUX : un prêt vert, moins cher que le prêt classique, finance une part de A durable ; le
 *     coût de son financement baisse, et son taux d'actualisation avec lui.
 * Puis les critères extra-financiers : les objectifs de développement durable, l'éligibilité et
 * l'alignement à la taxonomie verte européenne, les critères ESG.
 *
 * NOVA RETIENT A DURABLE : c'est la seconde ligne manuelle que la comptabilité approfondie amortit
 * par composants en N + 1 (comptabilite-approfondie.ts), et que le diagnostic de trois exercices
 * retrouve dans les comptes (diagnostic-de-nova.ts), avec ses équipements d'efficacité et leur
 * subvention.
 *
 * TOUT CE QUI EST NEUF EST UNE HYPOTHÈSE DU COURS, nommée ci-dessous ; aucune n'est le prix réel d'un
 * fournisseur ni le barème réel d'une aide. Conventions de projets-et-financement.ts : montants hors
 * taxes, taux en fractions, la date 0 le 1er janvier N + 1, un flux à la fin de son année.
 */

/** LE PRIX DE L'ÉLECTRICITÉ DE NOVA (hypothèse du cours) : 0,20 € le kWh hors taxes, abonnement compris. */
export const PRIX_DU_KWH = 0.2;

/**
 * LA HAUSSE ATTENDUE DE L'ÉLECTRICITÉ (hypothèse du cours) : 0,10 € de plus par kWh en moyenne sur les
 * cinq années du projet, ce qu'annoncent les prix à terme et la hausse attendue du prix du carbone.
 * C'est un risque futur : il ne se paie pas aujourd'hui, mais un kWh évité le supprime.
 */
export const HAUSSE_ATTENDUE_DU_KWH = 0.1;

/**
 * L'ÉLECTRICITÉ EN PLUS DE LA LIGNE SEMI-AUTOMATIQUE (hypothèse du cours) : ses robots de vissage et son
 * air comprimé consomment 20 000 kWh par an de plus que la ligne manuelle. À prix d'aujourd'hui, ce
 * coût est déjà dans les flux de B (son entretien et ses coûts variables) ; seule la hausse attendue
 * s'y ajoute.
 */
export const KWH_EN_PLUS_DE_LA_SEMI_AUTOMATIQUE = 20_000;

/**
 * LES ÉQUIPEMENTS D'EFFICACITÉ ÉNERGÉTIQUE (hypothèse du cours), le coût supplémentaire de A durable :
 * des moteurs à haut rendement et des variateurs sur la seconde ligne, l'éclairage de l'atelier en
 * diodes, la récupération de la chaleur des fers à souder pour chauffer l'atelier. 12 000 € hors
 * taxes, amortis sur 6 ans comme la ligne ; un acheteur d'occasion en donnerait 60 % de la valeur
 * nette comptable, comme de la ligne.
 */
export const EQUIPEMENTS_D_EFFICACITE: ActifDuProjet = { libelle: "les équipements d'efficacité énergétique", montant: 12_000, dureeDAmortissement: 6, tauxDeReprise: 0.6 };

/** L'ÉLECTRICITÉ QU'ILS ÉCONOMISENT (hypothèse du cours) : 8 000 kWh par an. */
export const KWH_ECONOMISES_PAR_AN = 8_000;

/**
 * LA SUBVENTION (hypothèse du cours) : une aide publique à l'efficacité énergétique des petites
 * industries prend en charge 30 % du coût des équipements, versée à la date 0. Subvention
 * d'investissement, elle est virée au résultat au rythme de l'amortissement des équipements : un
 * sixième par an, imposé à 25 % ; le sixième qui reste à la fin du projet l'est à la revente.
 */
export const TAUX_DE_SUBVENTION = 0.3;
export const SUBVENTION_DE_L_EFFICACITE = auCentime(EQUIPEMENTS_D_EFFICACITE.montant * TAUX_DE_SUBVENTION);

/**
 * LE PRÊT VERT (hypothèse du cours) : la banque finance 60 % de A durable par un prêt vert à 3 %, au
 * lieu du prêt classique au taux du prêt de NOVA, 5 %. Le projet réduit la consommation d'énergie et
 * une part de ses dépenses est alignée sur la taxonomie verte : la banque le compte dans ses actifs
 * verts, et le juge moins risqué. Le taux d'actualisation de A durable est le coût du capital de
 * l'activité, 9 %, diminué de l'économie que le prêt vert fait sur la part qu'il finance, après
 * impôt : 9 % − 60 % × (5 % − 3 %) × (1 − 25 %) = 8,1 %.
 */
export const PRET_VERT = { part: 0.6, tauxClassique: CONTRAT_DE_PRET.tauxAnnuel, tauxVert: 0.03 } as const;

/** Le taux d'actualisation d'un projet financé en partie par le prêt vert. */
export const tauxAvecLePretVert = (tauxVert: number = PRET_VERT.tauxVert, part: number = PRET_VERT.part, t = TAUX_DE_L_IMPOT_DES_PROJETS) =>
  Math.round((TAUX_D_ACTUALISATION_DE_NOVA - part * (PRET_VERT.tauxClassique - tauxVert) * (1 - t)) * 1e6) / 1e6;

/** Le taux d'actualisation de A durable : 8,1 %. */
export const TAUX_DU_PROJET_VERT = tauxAvecLePretVert();

/**
 * LES EMPLOIS ET LA PÉNIBILITÉ (projets-et-financement.ts, et hypothèse du cours) : A crée deux postes
 * d'opérateur, B un seul ; B visse à la place des opérateurs, A garde des gestes répétitifs que la
 * rotation des postes doit compenser.
 */
export const EMPLOIS_CREES = { A: 2, B: 1 } as const;

/** Les leviers de la transition : le prix et la hausse attendue du kWh, la subvention, le taux du prêt vert. */
export interface LeviersDeLaTransition {
  prixDuKwh: number;
  hausseAttendue: number;
  tauxDeSubvention: number;
  tauxVert: number;
}

export const LEVIERS_DE_LA_FICHE: LeviersDeLaTransition = { prixDuKwh: PRIX_DU_KWH, hausseAttendue: HAUSSE_ATTENDUE_DU_KWH, tauxDeSubvention: TAUX_DE_SUBVENTION, tauxVert: PRET_VERT.tauxVert };

/**
 * LES FLUX DIFFÉRENTIELS DE A DURABLE, ce que les équipements d'efficacité ajoutent aux flux de A :
 *   · date 0 : − le coût des équipements + la subvention ;
 *   · chaque année : l'électricité économisée au prix attendu (prix d'aujourd'hui + hausse) après
 *     impôt, plus l'économie d'impôt sur la dotation des équipements, moins l'impôt sur la quote-part
 *     de subvention virée au résultat ;
 *   · la dernière année, en plus : la valeur résiduelle nette des équipements, moins l'impôt sur la
 *     subvention qui restait à virer.
 */
export function fluxDeLEfficacite(l: Partial<LeviersDeLaTransition> = {}) {
  const v = { ...LEVIERS_DE_LA_FICHE, ...l };
  const t = TAUX_DE_L_IMPOT_DES_PROJETS;
  const e = EQUIPEMENTS_D_EFFICACITE;
  const subvention = auCentime(e.montant * v.tauxDeSubvention);
  const dotation = auCentime(e.montant / e.dureeDAmortissement);
  const quotePart = auCentime(subvention / e.dureeDAmortissement);
  const economieAuPrixDuJour = auCentime(KWH_ECONOMISES_PAR_AN * v.prixDuKwh);
  const risqueEvite = auCentime(KWH_ECONOMISES_PAR_AN * v.hausseAttendue);
  const economieApresImpot = auCentime((economieAuPrixDuJour + risqueEvite) * (1 - t));
  const annuel = auCentime(economieApresImpot + dotation * t - quotePart * t);
  const residuel = valeurResiduelleNette(e, DUREE_DES_PROJETS, t);
  const resteDeSubvention = auCentime(subvention - quotePart * DUREE_DES_PROJETS);
  const fin = auCentime(residuel.nette - resteDeSubvention * t);
  const flux = Array.from({ length: DUREE_DES_PROJETS + 1 }, (_, k) => (k === 0 ? auCentime(-e.montant + subvention) : auCentime(annuel + (k === DUREE_DES_PROJETS ? fin : 0))));
  return { subvention, dotation, quotePart, economieAuPrixDuJour, risqueEvite, economieApresImpot, annuel, residuel, resteDeSubvention, fin, flux };
}

/** Le risque de B : la hausse attendue sur l'électricité qu'elle consomme en plus, après impôt, chaque année. */
export function risqueDeLaSemiAutomatique(l: Partial<LeviersDeLaTransition> = {}) {
  const v = { ...LEVIERS_DE_LA_FICHE, ...l };
  const avantImpot = auCentime(KWH_EN_PLUS_DE_LA_SEMI_AUTOMATIQUE * v.hausseAttendue);
  const apresImpot = auCentime(avantImpot * (1 - TAUX_DE_L_IMPOT_DES_PROJETS));
  const flux = Array.from({ length: DUREE_DES_PROJETS + 1 }, (_, k) => (k === 0 ? 0 : -apresImpot));
  return { avantImpot, apresImpot, flux };
}

const additionner = (a: readonly number[], b: readonly number[]) => a.map((x, k) => auCentime(x + (b[k] ?? 0)));

/** LES DEUX PROJETS, financiers puis durables, et leurs critères. */
export function deuxProjetsDurables(l: Partial<LeviersDeLaTransition> = {}) {
  const v = { ...LEVIERS_DE_LA_FICHE, ...l };
  const a = fluxDuProjet(PROJET_LIGNE_MANUELLE).flux;
  const b = fluxDuProjet(PROJET_LIGNE_SEMI_AUTOMATIQUE).flux;
  const efficacite = fluxDeLEfficacite(v);
  const risque = risqueDeLaSemiAutomatique(v);
  const aDurable = additionner(a, efficacite.flux);
  const bAvecLeRisque = additionner(b, risque.flux);
  const tauxVert = tauxAvecLePretVert(v.tauxVert);
  const r = TAUX_D_ACTUALISATION_DE_NOVA;
  return {
    leviers: v,
    taux: r,
    tauxVert,
    a,
    b,
    efficacite,
    risque,
    aDurable,
    bAvecLeRisque,
    vanDeA: van(a, r),
    vanDeB: van(b, r),
    vanDeLEfficacite: van(efficacite.flux, r),
    vanDuRisque: van(risque.flux, r),
    vanDeADurableA9: van(aDurable, r),
    vanDeADurable: van(aDurable, tauxVert),
    vanDeBAvecLeRisque: van(bAvecLeRisque, r),
    triDeADurable: tri(aDurable),
    triDeBAvecLeRisque: tri(bAvecLeRisque),
  };
}

/**
 * LES CRITÈRES EXTRA-FINANCIERS des deux projets, sur les cinq ans : l'électricité et le CO2 (au
 * facteur du réseau du cours, tableau-de-bord-durable.ts) que A durable consomme et émet en moins que
 * B, la part de l'investissement alignée sur la taxonomie (les équipements d'efficacité seuls : ni la
 * ligne ni les moules ne relèvent d'une activité de la taxonomie), les emplois.
 */
export function criteresExtraFinanciers() {
  const kwhEcartParAn = KWH_EN_PLUS_DE_LA_SEMI_AUTOMATIQUE + KWH_ECONOMISES_PAR_AN;
  const investissementDeA = PROJET_LIGNE_MANUELLE.actifs.reduce((t, x) => t + x.montant, 0) + EQUIPEMENTS_D_EFFICACITE.montant;
  const investissementDeB = PROJET_LIGNE_SEMI_AUTOMATIQUE.actifs.reduce((t, x) => t + x.montant, 0);
  const tonnesEviteesSurCinqAns = auCentime((kwhEcartParAn * KG_CO2_PAR_KWH * DUREE_DES_PROJETS) / 1_000);
  return {
    kwhEcartParAn,
    kwhEcartSurCinqAns: kwhEcartParAn * DUREE_DES_PROJETS,
    tonnesEviteesSurCinqAns,
    investissementDeA,
    investissementDeB,
    /** La part de l'investissement de A durable alignée sur la taxonomie, en fraction. */
    partAligneeDeA: EQUIPEMENTS_D_EFFICACITE.montant / investissementDeA,
    partAligneeDeB: 0,
    emplois: EMPLOIS_CREES,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// LE CAS : DEUX DEVIS POUR CHAUFFER L'ATELIER
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LE CHAUFFAGE DE L'ATELIER (hypothèses du cas « Deux devis pour chauffer l'atelier ») : à la fin de
 * N + 2, les radiateurs électriques de l'atelier lâchent. Ils consomment 9 000 kWh par an, une part des
 * 1 500 kWh par mois du bâtiment. Deux devis, pour dix ans d'usage, sans valeur de revente :
 *   · des radiateurs neufs, 8 000 € hors taxes, la même consommation ;
 *   · une pompe à chaleur, 24 000 € hors taxes, qui rend 3 kWh de chaleur pour 1 kWh d'électricité :
 *     elle consomme le tiers des radiateurs. Une aide publique à la rénovation énergétique en prend
 *     40 % à sa charge, versée à la date 0 et virée au résultat sur les dix ans, comme l'amortissement.
 * Le prix de l'électricité et sa hausse attendue sont ceux du chapitre ; l'impôt, 25 %.
 */
export const CHAUFFAGE_DE_L_ATELIER = {
  kwhDesRadiateurs: 9_000,
  radiateurs: 8_000,
  pompeAChaleur: 24_000,
  coefficientDePerformance: 3,
  tauxDAide: 0.4,
  dureeAns: 10,
} as const;

/**
 * LES FLUX DIFFÉRENTIELS DE LA POMPE À CHALEUR (pompe moins radiateurs), date par date : à la date 0,
 * le surcoût moins l'aide ; chaque année, l'électricité économisée au prix attendu, après impôt, plus
 * l'économie d'impôt sur le supplément de dotation, moins l'impôt sur la quote-part d'aide. Puis la VAN
 * à 9 %, avec et sans l'aide.
 */
export function deuxDevisDeChauffage(l: Partial<LeviersDeLaTransition & { tauxDAide: number }> = {}) {
  const v = { ...LEVIERS_DE_LA_FICHE, tauxDAide: CHAUFFAGE_DE_L_ATELIER.tauxDAide, ...l };
  const k = CHAUFFAGE_DE_L_ATELIER;
  const impot = TAUX_DE_L_IMPOT_DES_PROJETS;
  const surcout = k.pompeAChaleur - k.radiateurs;
  const aide = auCentime(k.pompeAChaleur * v.tauxDAide);
  const kwhEconomises = auCentime(k.kwhDesRadiateurs * (1 - 1 / k.coefficientDePerformance));
  const economieAvantImpot = auCentime(kwhEconomises * (v.prixDuKwh + v.hausseAttendue));
  const dotationEnPlus = auCentime(surcout / k.dureeAns);
  const quotePart = auCentime(aide / k.dureeAns);
  const annuel = auCentime(economieAvantImpot * (1 - impot) + dotationEnPlus * impot - quotePart * impot);
  const flux = Array.from({ length: k.dureeAns + 1 }, (_, i) => (i === 0 ? auCentime(-surcout + aide) : annuel));
  return {
    surcout,
    aide,
    kwhEconomises,
    economieAvantImpot,
    dotationEnPlus,
    quotePart,
    annuel,
    flux,
    van: van(flux, TAUX_D_ACTUALISATION_DE_NOVA),
    tonnesEvitees: auCentime((kwhEconomises * KG_CO2_PAR_KWH * k.dureeAns) / 1_000),
  };
}
