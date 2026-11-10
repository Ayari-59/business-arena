import { auCentime } from "./amortissement";
import { cloture, impotSurLesSocietes } from "./cloture";
import { AUGMENTATION_DE_CAPITAL, ACTIONS_DE_NOVA, SECONDE_LIGNE, affectationDuBeneficeDeN, augmentationDeCapital, composantsDeLaSecondeLigne } from "./comptabilite-approfondie";
import { empruntALaCloture } from "./emprunt";
import { ASSURANCE, CAMPUSTECH, CLOTURE_DE_LA_FICHE, CONTRAT_DE_PRET, EQUIPEMENT, EXERCICE_DE_NOVA, IMPOT_SUR_LES_SOCIETES, LIVRAISONS_DU_MOIS, LOYER_DU_MOIS, MONTANTS_DES_FACTURES_SONORA, PLACEMENT, SUITES_EN_N_PLUS_1, type FicheDeLExercice } from "./exercice-de-nova";
import { acomptes } from "./finance";
import { COMPOSANTS_PAR_ENCEINTE, PRIX_DE_L_ENCEINTE, TAUX_DE_TVA } from "./nova-gestion";
import { ANNEE_N_PLUS_1, PLAN_DE_N_PLUS_1 } from "./nova-capacite";
import {
  CAMPAGNE_DE_LANCEMENT,
  COUT_ANNUEL_D_UN_OPERATEUR,
  MOULES_DE_LA_GAMME,
  PRODUITS_DE_LA_GAMME,
  PROJET_LIGNE_MANUELLE,
  PUBLICITE_DE_LA_GAMME,
  VENTES_DE_GO,
  VENTES_DE_ONE_PERDUES,
  VENTES_DE_STUDIO,
} from "./projets-et-financement";
import { HEURES_D_ABSENCE_DU_SEMESTRE, ACCIDENTS_DU_SEMESTRE, KG_CO2_PAR_KWH, KG_D_EMBALLAGE_PAR_ENCEINTE, KWH_DU_BATIMENT_PAR_MOIS, KWH_PAR_ENCEINTE, PART_VALORISEE } from "./tableau-de-bord-durable";
import { HEURES_LEGALES_PAR_MOIS } from "./ressources-humaines-de-nova";
import { EQUIPEMENTS_D_EFFICACITE, SUBVENTION_DE_L_EFFICACITE, KWH_ECONOMISES_PAR_AN, PRIX_DU_KWH } from "./investissement-durable";

/**
 * LE MONDE DU COURS : LE DIAGNOSTIC FINANCIER ET EXTRA-FINANCIER DE NOVA SUR TROIS EXERCICES (DCG UE6,
 * 1.1, 1.6 et 1.7).
 *
 * Le chapitre « Le diagnostic financier et extra-financier » et son cas le lisent. Un diagnostic se
 * fait sur plusieurs exercices : ce fichier pose les comptes résumés de N, N + 1 et N + 2, leurs
 * ratios, leurs indicateurs ESG, et les moyennes du secteur.
 *
 * UNE SEULE NOVA (tests/cours/une-seule-nova.test.ts) :
 *   · N EST LA CLÔTURE DU COURS, au centime : monde/cloture.ts sur exercice-de-nova.ts, le même
 *     compte de résultat, le même bilan fonctionnel, la même CAF que les chapitres « Soldes
 *     intermédiaires de gestion et CAF », « Bilan fonctionnel et BFR » et « Ratios de structure et
 *     bilan financier » ;
 *   · N + 1 PROLONGE N SANS EN CHANGER UN CHIFFRE, avec ce que les autres fiches ont posé : la seconde
 *     ligne manuelle de 60 000 €, mise en service le 2 janvier N + 1 et amortie par composants
 *     (comptabilite-approfondie.ts) ; les moules et la gamme Go et Studio du projet A
 *     (projets-et-financement.ts : ses ventes, sa publicité, ses deux opérateurs de plus, l'entretien de
 *     la seconde ligne) ; les équipements d'efficacité énergétique et leur subvention, que le chapitre
 *     « Évaluer un investissement durable » fait ajouter à la seconde ligne (investissement-durable.ts) ;
 *     l'entretien de la première ligne au budget de référence (nova-capacite.ts, PLAN_DE_N_PLUS_1) ;
 *     la demande de One de N + 1 (nova-capacite.ts, 27 200 enceintes), servie en entier grâce à la
 *     seconde ligne ; les suites de Sonora et du litige (exercice-de-nova.ts, SUITES_EN_N_PLUS_1) ;
 *     l'augmentation de capital du 30 juin N + 1 (comptabilite-approfondie.ts) ; le résultat de N
 *     affecté comme dans tout le cours, son dividende de 2 € par action mis en paiement en juin N + 1
 *     (comptabilite-approfondie.ts, `affectationDuBeneficeDeN`) ; le prêt de N, échéance par échéance
 *     (emprunt.ts) ;
 *   · N + 2 est une hypothèse du cours, nommée ci-dessous : la deuxième année de la gamme, une demande
 *     de One qui monte encore, le dividende sur le résultat de N + 1.
 *
 * LES COMPTES RÉSUMÉS se tiennent en partie double : le bilan fonctionnel de chaque exercice part de
 * celui de l'exercice précédent et des flux de l'année (la CAF, les investissements, les
 * remboursements, l'augmentation de capital, le dividende) ; le besoin en fonds de roulement est posé
 * (ses postes, en jours ou en euros) ; la trésorerie nette est ce que le fonds de roulement laisse.
 * La garde vérifie que la variation de la trésorerie retombe sur les flux, exercice par exercice.
 *
 * MATIÈRE : le cours du propriétaire sur les ratios d'analyse de l'activité et du résultat, et sur
 * les ratios d'analyse du bilan (familles de ratios, comparaison dans le temps et avec le secteur,
 * limites des ratios), adapté à NOVA.
 */

// ═════════════════════════════════════════════════════════════════════════════
// 1. LES HYPOTHÈSES DE N + 1 ET DE N + 2
// ═════════════════════════════════════════════════════════════════════════════

/** Les codes des trois exercices du diagnostic. */
export type CodeDExercice = "N" | "N+1" | "N+2";
export const EXERCICES_DU_DIAGNOSTIC: readonly CodeDExercice[] = ["N", "N+1", "N+2"];

/** Les jours d'usage de N + 1 d'un équipement mis en service le 2 janvier : 359 jours sur 360. */
const PRORATA_DE_N_PLUS_1 = composantsDeLaSecondeLigne().jours / 360;

/**
 * LA DEMANDE DE ONE DE N + 2 (hypothèse du cours) : 29 000 enceintes, 6,6 % de plus qu'en N + 1, une
 * croissance qui ralentit. Les deux lignes la servent en entier.
 */
export const DEMANDE_DE_ONE_EN_N_PLUS_2 = 29_000;

/** Les One de chaque exercice après la gamme : la demande, moins les ventes que Studio leur prend (projets-et-financement.ts). */
const ONE_DE_N_PLUS_1 = ANNEE_N_PLUS_1.demande.reduce((t, q) => t + q, 0) - VENTES_DE_ONE_PERDUES[0];
const ONE_DE_N_PLUS_2 = DEMANDE_DE_ONE_EN_N_PLUS_2 - VENTES_DE_ONE_PERDUES[1];

/**
 * LES IMPÔTS ET TAXES (hypothèse du cours) : la cotisation foncière des entreprises, qui n'était pas
 * due l'année de la création, 4 500 € en N + 1, 4 800 € en N + 2.
 */
export const IMPOTS_ET_TAXES = { "N+1": 4_500, "N+2": 4_800 } as const;

/** LA REVALORISATION DES SALAIRES DE N + 2 (hypothèse du cours) : 2 % pour toute l'équipe. */
export const REVALORISATION_DE_N_PLUS_2 = 0.02;

/** L'EFFECTIF : quatre opérateurs en N, deux de plus avec la seconde ligne (le projet A). */
export const EFFECTIFS = { N: 4, "N+1": 6, "N+2": 6 } as const;

/** L'ENTRETIEN DE LA SECONDE LIGNE MANUELLE, celui du projet A (projets-et-financement.ts). */
const ENTRETIEN_DE_LA_SECONDE_LIGNE = PROJET_LIGNE_MANUELLE.charges.find((c) => c.libelle === "l'entretien de la ligne")!.montants[0]!;

/**
 * LE BESOIN EN FONDS DE ROULEMENT DE N + 1 ET DE N + 2 (hypothèses du cours, posées poste par poste) :
 *   · le délai des clients, sur le chiffre d'affaires toutes taxes comprises : 32 jours en N + 1, 40
 *     en N + 2 (les chaînes de hi-fi, payées à 60 jours, prennent une part croissante des ventes avec
 *     Go et Studio) ;
 *   · le stock de composants et de produits de la gamme, en euros : 36 000 € puis 54 000 € ;
 *   · le délai des fournisseurs de composants, 30 jours d'achats toutes taxes comprises (les autres
 *     fournisseurs, l'énergie, la publicité, l'entretien, se paient au comptant) ; les autres créances d'exploitation (TVA déductible, charges constatées d'avance) et les
 *     dettes fiscales et sociales, en euros.
 */
export const BESOIN_POSE = {
  "N+1": { delaiClients: 32, stocks: 36_000, delaiFournisseurs: 30, autresCreances: 9_000, dettesFiscalesEtSociales: 34_000 },
  "N+2": { delaiClients: 40, stocks: 54_000, delaiFournisseurs: 30, autresCreances: 10_500, dettesFiscalesEtSociales: 38_000 },
} as const;

/**
 * L'OUTILLAGE DE N + 2 (hypothèse du cours) : des gabarits et des fers à souder neufs pour les deux
 * lignes, 8 000 € hors taxes payés le 2 janvier N + 2, amortis sur 5 ans.
 */
export const OUTILLAGE_DE_N_PLUS_2 = { montant: 8_000, dureeAns: 5 } as const;

/** LE DIVIDENDE DE N + 2 (hypothèse du cours) : 1 € par action, versé en mai N + 2 sur le résultat de N + 1. */
export const DIVIDENDE_PAR_ACTION_EN_N_PLUS_2 = 1;

/** LA PART DES DÉCHETS VALORISÉS en N + 1 et N + 2 (hypothèse du cours) : 85 %, puis 92 % quand le recycleur reprend aussi les mousses de la gamme. */
export const PART_VALORISEE_DES_EXERCICES = { "N+1": PART_VALORISEE.apres, "N+2": 0.92 } as const;

/**
 * LE SOCIAL DES EXERCICES (hypothèse du cours) : les heures d'absence de l'année (en N, celles du
 * premier semestre du tableau de bord durable, et 66 heures au second), les accidents du travail avec
 * arrêt, les heures de formation.
 */
export const SOCIAL_DES_EXERCICES = {
  N: { absences: HEURES_D_ABSENCE_DU_SEMESTRE.reduce<number>((t, h) => t + h, 0) + 66, accidents: ACCIDENTS_DU_SEMESTRE.reduce<number>((t, a) => t + a, 0), formation: 0 },
  "N+1": { absences: 380, accidents: 2, formation: 84 },
  "N+2": { absences: 290, accidents: 0, formation: 120 },
} as const;

// ═════════════════════════════════════════════════════════════════════════════
// 2. LES MOYENNES DU SECTEUR
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LES MOYENNES DU SECTEUR (hypothèse du cours) : les médianes des fabricants d'équipements audio de 10
 * à 49 salariés, telles qu'une centrale de bilans les publierait pour N + 2. Ce ne sont pas des
 * chiffres réels : des ordres de grandeur d'une petite industrie d'assemblage, qui loue ses locaux.
 * Les taux sont des fractions, les délais en jours, les ratios de structure en fois.
 */
export const MOYENNES_DU_SECTEUR = {
  croissanceDuChiffreDAffaires: 0.04,
  tauxDeValeurAjoutee: 0.28,
  tauxDeMargeBrute: 0.1,
  tauxDeMargeNette: 0.05,
  rentabiliteEconomique: 0.2,
  rentabiliteFinanciere: 0.15,
  endettement: 0.6,
  liquiditeGenerale: 1.4,
  autonomie: 0.4,
  delaiClients: 45,
  delaiFournisseurs: 50,
  rotationDesStocks: 35,
  tauxDInvestissement: 0.1,
  tauxDUsure: 0.45,
  couverture: 1.5,
  capaciteDeRemboursement: 2.5,
  kwhParEnceinte: 2,
  co2ParEnceinte: 0.1,
  partValorisee: 0.7,
  absenteisme: 0.045,
  tauxDeFrequence: 20,
  formationParSalarie: 15,
} as const;

// ═════════════════════════════════════════════════════════════════════════════
// 3. LES COMPTES RÉSUMÉS DES TROIS EXERCICES
// ═════════════════════════════════════════════════════════════════════════════

/** Un exercice de NOVA résumé : son compte de résultat par soldes, ses flux, son bilan fonctionnel. */
export interface ExerciceResume {
  code: CodeDExercice;
  enceintes: number;
  /** Les enceintes de la gamme Go et Studio, comprises dans `enceintes`. */
  enceintesDeLaGamme: number;
  // Le compte de résultat, par soldes.
  production: number;
  consommations: number;
  /** Les composants consommés hors taxes, compris dans les consommations : la base de la durée du stock. */
  composantsConsommes: number;
  /** Les achats de composants hors taxes (les consommés et la variation du stock) : la base du délai des fournisseurs. */
  composantsAchetes: number;
  valeurAjoutee: number;
  impotsEtTaxes: number;
  personnel: number;
  excedentBrutDExploitation: number;
  reprises: number;
  dotations: number;
  autresCharges: number;
  resultatDExploitation: number;
  produitsFinanciers: number;
  chargesFinancieres: number;
  resultatCourantAvantImpot: number;
  resultatExceptionnel: number;
  /** La quote-part de la subvention d'investissement virée au résultat, comprise dans l'exceptionnel. */
  quotePartDeSubvention: number;
  impot: number;
  resultatNet: number;
  caf: number;
  // Les flux de l'année.
  investissements: number;
  remboursements: number;
  apports: number;
  empruntsNouveaux: number;
  subventionRecue: number;
  dividendes: number;
  // Le bilan fonctionnel au 31 décembre, en valeurs brutes.
  immobilisationsBrutes: number;
  amortissements: number;
  depreciationsEtProvisions: number;
  capitauxPropres: number;
  subventionAuBilan: number;
  dettesFinancieres: number;
  ressourcesStables: number;
  fondsDeRoulement: number;
  stocks: number;
  clientsBruts: number;
  autresCreances: number;
  fournisseurs: number;
  autresDettesDExploitation: number;
  besoinDExploitation: number;
  /** Les intérêts courus de l'emprunt et l'impôt restant dû, au passif hors exploitation. */
  passifHorsExploitation: number;
  besoin: number;
  tresorerieNette: number;
  /** La part de l'emprunt remboursée dans les douze mois qui suivent. */
  echeancesAMoinsDUnAn: number;
}

/** LA CLÔTURE DE N, celle du cours. */
function exerciceN(f: FicheDeLExercice): ExerciceResume {
  const k = cloture(f);
  const g = k.sig;
  const fo = k.fonctionnel;
  const s = k.soldes;
  const e = empruntALaCloture(f.pret);
  const enceintes = LIVRAISONS_DU_MOIS.reduce((t, q) => t + q, 0);
  return {
    code: "N",
    enceintes,
    enceintesDeLaGamme: 0,
    production: g.production,
    consommations: g.consommations,
    composantsConsommes: auCentime((s["601"] ?? 0) + (s["6031"] ?? 0)),
    composantsAchetes: s["601"] ?? 0,
    valeurAjoutee: g.valeurAjoutee,
    impotsEtTaxes: g.impotsEtTaxes,
    personnel: g.personnel,
    excedentBrutDExploitation: g.excedentBrutDExploitation,
    reprises: g.reprisesEtTransferts,
    dotations: g.dotations,
    autresCharges: g.autresCharges,
    resultatDExploitation: g.resultatDExploitation,
    produitsFinanciers: g.produitsFinanciers,
    chargesFinancieres: g.chargesFinancieres,
    resultatCourantAvantImpot: g.resultatCourantAvantImpot,
    resultatExceptionnel: g.resultatExceptionnel,
    quotePartDeSubvention: 0,
    impot: g.impot,
    resultatNet: g.resultatNet,
    caf: k.caf.additive,
    investissements: f.equipement.ht,
    remboursements: e.capitalRembourse,
    apports: f.apport.montant,
    empruntsNouveaux: f.pret.capital,
    subventionRecue: 0,
    dividendes: 0,
    immobilisationsBrutes: fo.emploisStables,
    amortissements: auCentime(-(s["28154"] ?? 0)),
    depreciationsEtProvisions: auCentime(fo.ressourcesStables.amortissementsEtDepreciations + fo.ressourcesStables.provisions + (s["28154"] ?? 0)),
    capitauxPropres: fo.ressourcesStables.capitauxPropres,
    subventionAuBilan: 0,
    dettesFinancieres: fo.ressourcesStables.dettesFinancieres,
    ressourcesStables: fo.ressourcesStables.total,
    fondsDeRoulement: fo.fondsDeRoulement,
    stocks: k.bilan.actif.stocks.brut,
    clientsBruts: k.bilan.actif.clients.brut,
    autresCreances: auCentime(fo.actifDExploitation - k.bilan.actif.stocks.brut - k.bilan.actif.clients.brut),
    fournisseurs: k.bilan.passif.fournisseurs,
    autresDettesDExploitation: auCentime(fo.passifDExploitation - k.bilan.passif.fournisseurs),
    besoinDExploitation: fo.besoinDExploitation,
    passifHorsExploitation: fo.passifHorsExploitation,
    besoin: fo.besoinEnFondsDeRoulement,
    tresorerieNette: fo.tresorerieNette,
    echeancesAMoinsDUnAn: e.partAMoinsDUnAn,
  };
}

/** Ce qu'un exercice résumé pose : ses ventes, ses charges, ses opérations de l'année. */
interface ExercicePose {
  code: "N+1" | "N+2";
  rang: 1 | 2;
  one: number;
  go: number;
  studio: number;
  publicite: number;
  personnel: number;
  dotations: number;
  reprises: number;
  autresCharges: number;
  produitsFinanciers: number;
  exceptionnelHorsSubvention: number;
  quotePartDeSubvention: number;
  investissements: number;
  apports: number;
  subventionRecue: number;
  dividendes: number;
  /** Un délai des clients autre que celui de la fiche (le laboratoire). */
  delaiClients?: number;
}

/** Les ventes et le coût variable de la gamme, aux prix de nova-gestion.ts. */
const produit = (code: string) => PRODUITS_DE_LA_GAMME.find((p) => p.code === code)!;
const CV_DE_ONE = produit("one").coutVariable;

/** LA PART DES COMPOSANTS dans le coût variable d'une enceinte : celle de One, 22 € sur 38 €, appliquée à Go et Studio. */
const PART_DES_COMPOSANTS = COMPOSANTS_PAR_ENCEINTE / CV_DE_ONE;

/** L'exercice résumé d'une année posée, à partir du bilan de l'exercice précédent. */
function exerciceSuivant(precedent: ExerciceResume, p: ExercicePose): ExerciceResume {
  const go = produit("go");
  const studio = produit("studio");
  const enceintes = p.one + p.go + p.studio;
  const production = auCentime(p.one * PRIX_DE_L_ENCEINTE + p.go * go.prix + p.studio * studio.prix);
  const variables = auCentime(p.one * CV_DE_ONE + p.go * go.coutVariable + p.studio * studio.coutVariable);
  const economieDEnergie = auCentime(KWH_ECONOMISES_PAR_AN * PRIX_DU_KWH);
  const fixes = auCentime(LOYER_DU_MOIS.montant * 12 + ASSURANCE.prime + PLAN_DE_N_PLUS_1.entretien.reduce((t, x) => t + x, 0) + ENTRETIEN_DE_LA_SECONDE_LIGNE + p.publicite);
  const consommations = auCentime(variables + fixes - economieDEnergie);
  const composantsConsommes = auCentime(variables * PART_DES_COMPOSANTS);
  const b = BESOIN_POSE[p.code];
  // Le stock est de composants : ce qu'il gagne dans l'année s'achète en plus de ce qui se consomme.
  const composantsAchetes = auCentime(composantsConsommes + b.stocks - precedent.stocks);
  const valeurAjoutee = auCentime(production - consommations);
  const impotsEtTaxes = IMPOTS_ET_TAXES[p.code];
  const excedentBrutDExploitation = auCentime(valeurAjoutee - impotsEtTaxes - p.personnel);
  const resultatDExploitation = auCentime(excedentBrutDExploitation + p.reprises - p.dotations - p.autresCharges);
  const e = empruntALaCloture(CONTRAT_DE_PRET, p.rang);
  const chargesFinancieres = e.chargeDInterets;
  const resultatCourantAvantImpot = auCentime(resultatDExploitation + p.produitsFinanciers - chargesFinancieres);
  const resultatExceptionnel = auCentime(p.exceptionnelHorsSubvention + p.quotePartDeSubvention);
  const impot = impotSurLesSocietes(auCentime(resultatCourantAvantImpot + resultatExceptionnel), IMPOT_SUR_LES_SOCIETES).impot;
  const resultatNet = auCentime(resultatCourantAvantImpot + resultatExceptionnel - impot);
  // La CAF additive : le résultat, plus les dotations, moins les reprises et la quote-part de subvention virée au résultat.
  const caf = auCentime(resultatNet + p.dotations - p.reprises - p.quotePartDeSubvention);

  // Le haut du bilan.
  const immobilisationsBrutes = auCentime(precedent.immobilisationsBrutes + p.investissements);
  const amortissements = auCentime(precedent.amortissements + p.dotations);
  // Les dépréciations et la provision de N se reprennent en N + 1, la créance sortie et le litige payé.
  const depreciationsEtProvisions = auCentime(precedent.depreciationsEtProvisions - p.reprises);
  const subventionAuBilan = auCentime(precedent.subventionAuBilan + p.subventionRecue - p.quotePartDeSubvention);
  const capitauxPropres = auCentime(precedent.capitauxPropres + resultatNet + p.apports - p.dividendes - precedent.subventionAuBilan + subventionAuBilan);
  const dettesFinancieres = e.capitalRestantDu;
  const ressourcesStables = auCentime(capitauxPropres + amortissements + depreciationsEtProvisions + dettesFinancieres);
  const fondsDeRoulement = auCentime(ressourcesStables - immobilisationsBrutes);

  // Le besoin, posé.
  const clientsBruts = auCentime((production * (1 + TAUX_DE_TVA) * (p.delaiClients ?? b.delaiClients)) / 360);
  const fournisseurs = auCentime((composantsAchetes * (1 + TAUX_DE_TVA) * b.delaiFournisseurs) / 360);
  const besoinDExploitation = auCentime(b.stocks + clientsBruts + b.autresCreances - fournisseurs - b.dettesFiscalesEtSociales);
  const acomptesVerses = acomptes(precedent.impot).reduce((t, a) => t + a, 0);
  const passifHorsExploitation = auCentime(Math.max(0, impot - acomptesVerses) + e.interetsCourus.montant);
  const besoin = auCentime(besoinDExploitation - passifHorsExploitation);
  return {
    code: p.code,
    enceintes,
    enceintesDeLaGamme: p.go + p.studio,
    production,
    consommations,
    composantsConsommes,
    composantsAchetes,
    valeurAjoutee,
    impotsEtTaxes,
    personnel: p.personnel,
    excedentBrutDExploitation,
    reprises: p.reprises,
    dotations: p.dotations,
    autresCharges: p.autresCharges,
    resultatDExploitation,
    produitsFinanciers: p.produitsFinanciers,
    chargesFinancieres,
    resultatCourantAvantImpot,
    resultatExceptionnel,
    quotePartDeSubvention: p.quotePartDeSubvention,
    impot,
    resultatNet,
    caf,
    investissements: p.investissements,
    remboursements: e.capitalRembourse,
    apports: p.apports,
    empruntsNouveaux: 0,
    subventionRecue: p.subventionRecue,
    dividendes: p.dividendes,
    immobilisationsBrutes,
    amortissements,
    depreciationsEtProvisions,
    capitauxPropres,
    subventionAuBilan,
    dettesFinancieres,
    ressourcesStables,
    fondsDeRoulement,
    stocks: b.stocks,
    clientsBruts,
    autresCreances: b.autresCreances,
    fournisseurs,
    autresDettesDExploitation: b.dettesFiscalesEtSociales,
    besoinDExploitation,
    passifHorsExploitation,
    besoin,
    tresorerieNette: auCentime(fondsDeRoulement - besoin),
    echeancesAMoinsDUnAn: e.partAMoinsDUnAn,
  };
}

/** Les dotations de N + 1 : la première ligne, la seconde par composants, les moules et les équipements d'efficacité, au prorata. */
export function dotationsDesExercices() {
  const premiere = auCentime(EQUIPEMENT.ht / EQUIPEMENT.dureeAns);
  const seconde = composantsDeLaSecondeLigne();
  const moules = MOULES_DE_LA_GAMME.montant / MOULES_DE_LA_GAMME.dureeDAmortissement;
  const efficacite = EQUIPEMENTS_D_EFFICACITE.montant / EQUIPEMENTS_D_EFFICACITE.dureeDAmortissement;
  return {
    premiere,
    "N+1": auCentime(premiere + seconde.total + (moules + efficacite) * PRORATA_DE_N_PLUS_1),
    "N+2": auCentime(premiere + SECONDE_LIGNE_EN_N_PLUS_2 + moules + efficacite + (OUTILLAGE_DE_N_PLUS_2.montant / OUTILLAGE_DE_N_PLUS_2.dureeAns) * PRORATA_DE_N_PLUS_1),
  };
}

/** La seconde ligne en N + 2, une année pleine : la structure sur 6 ans, le composant sur 3. */
const SECONDE_LIGNE_EN_N_PLUS_2 = SECONDE_LIGNE.structure.valeur / SECONDE_LIGNE.structure.dureeAns + SECONDE_LIGNE.composant.valeur / SECONDE_LIGNE.composant.dureeAns;

/** La subvention de l'efficacité, virée au résultat au rythme de l'amortissement des équipements. */
const quotePart = (prorata: number) => auCentime((SUBVENTION_DE_L_EFFICACITE / EQUIPEMENTS_D_EFFICACITE.dureeDAmortissement) * prorata);

const CACHE = new Map<string, readonly ExerciceResume[]>();

/** LES TROIS EXERCICES DE NOVA, résumés. */
export function exercicesDeNova(f: FicheDeLExercice = EXERCICE_DE_NOVA): readonly ExerciceResume[] {
  const deja = CACHE.get(f.code);
  if (deja) return deja;
  const n = exerciceN(f);
  const d = dotationsDesExercices();
  // Sonora : la moitié de la créance encaissée, l'autre perdue (son hors taxes, la TVA se récupère).
  const perteSurSonora = auCentime(MONTANTS_DES_FACTURES_SONORA.octobre.netFinancier * (1 - SUITES_EN_N_PLUS_1.sonora.partEncaissee));
  const reprisesDeN1 = auCentime(n.depreciationsEtProvisions);
  // Le compte à terme échu le 6 janvier N + 1 : les intérêts de ses derniers jours, puis la réserve sert la seconde ligne et la gamme.
  const interetsDeJanvier = auCentime(PLACEMENT.montant * PLACEMENT.tauxAnnuel - CLOTURE_DE_LA_FICHE.travaux.interetsDuPlacement);
  const investissementsDeN1 = auCentime(SECONDE_LIGNE.ht + MOULES_DE_LA_GAMME.montant + EQUIPEMENTS_D_EFFICACITE.montant);
  const n1 = exerciceSuivant(n, {
    code: "N+1",
    rang: 1,
    one: ONE_DE_N_PLUS_1,
    go: VENTES_DE_GO[0],
    studio: VENTES_DE_STUDIO[0],
    publicite: PUBLICITE_DE_LA_GAMME + CAMPAGNE_DE_LANCEMENT,
    personnel: EFFECTIFS["N+1"] * COUT_ANNUEL_D_UN_OPERATEUR,
    dotations: d["N+1"],
    reprises: reprisesDeN1,
    autresCharges: perteSurSonora,
    produitsFinanciers: interetsDeJanvier,
    exceptionnelHorsSubvention: -SUITES_EN_N_PLUS_1.litige.condamnation,
    quotePartDeSubvention: quotePart(PRORATA_DE_N_PLUS_1),
    investissements: investissementsDeN1,
    apports: augmentationDeCapital().fonds,
    subventionRecue: SUBVENTION_DE_L_EFFICACITE,
    // Le dividende sur le bénéfice de N, mis en paiement en juin N + 1 : l'affectation unique du cours.
    dividendes: affectationDuBeneficeDeN().dividendes,
  });
  const n2 = exerciceSuivant(n1, poseDeNPlus2());
  const x = [n, n1, n2] as const;
  CACHE.set(f.code, x);
  return x;
}

/** Le nombre d'actions de NOVA après l'augmentation de capital de N + 1 : 15 000 + 5 000. */
export const ACTIONS_APRES_L_AUGMENTATION = ACTIONS_DE_NOVA.nombre + ACTIONS_DE_NOVA.nombre / AUGMENTATION_DE_CAPITAL.parite;

/** Ce que N + 2 pose : la deuxième année de la gamme, l'outillage, le dividende (par action), un autre délai des clients. */
function poseDeNPlus2(dividendeParAction: number = DIVIDENDE_PAR_ACTION_EN_N_PLUS_2, delaiClients?: number): ExercicePose {
  return {
    code: "N+2",
    rang: 2,
    one: ONE_DE_N_PLUS_2,
    go: VENTES_DE_GO[1],
    studio: VENTES_DE_STUDIO[1],
    publicite: PUBLICITE_DE_LA_GAMME,
    personnel: auCentime(EFFECTIFS["N+2"] * COUT_ANNUEL_D_UN_OPERATEUR * (1 + REVALORISATION_DE_N_PLUS_2)),
    dotations: dotationsDesExercices()["N+2"],
    reprises: 0,
    autresCharges: 0,
    produitsFinanciers: 0,
    exceptionnelHorsSubvention: 0,
    quotePartDeSubvention: quotePart(1),
    investissements: OUTILLAGE_DE_N_PLUS_2.montant,
    apports: 0,
    subventionRecue: 0,
    dividendes: ACTIONS_APRES_L_AUGMENTATION * dividendeParAction,
    delaiClients,
  };
}

/**
 * LE LABORATOIRE DU DIAGNOSTIC : N + 2 rejoué avec un autre délai des clients (en jours) et un autre
 * dividende (en euros par action), et ses ratios. Le résultat ne bouge pas : seuls le bilan et ce qui
 * le lit bougent.
 */
export function nPlus2Avec(delaiClients: number, dividendeParAction: number, f: FicheDeLExercice = EXERCICE_DE_NOVA) {
  const [, n1] = exercicesDeNova(f);
  const e = exerciceSuivant(n1!, poseDeNPlus2(dividendeParAction, delaiClients));
  return { exercice: e, ratios: ratiosDe(e, n1) };
}

/** Un exercice par son code. */
export const exerciceDe = (code: CodeDExercice, f: FicheDeLExercice = EXERCICE_DE_NOVA) => exercicesDeNova(f).find((e) => e.code === code)!;

// ═════════════════════════════════════════════════════════════════════════════
// 4. LES RATIOS
// ═════════════════════════════════════════════════════════════════════════════

/** Un ratio au dix-millième (un taux en fraction), ou au centième (un ratio en fois, un délai en jours). */
const auDixMillieme = (x: number) => Math.round(x * 10_000) / 10_000 + 0;
export const auCentieme = (x: number) => Math.round(x * 100) / 100 + 0;

/** Le taux marginal de l'impôt de NOVA, celui de la rentabilité économique après impôt. */
export const TAUX_DE_L_IMPOT_DU_DIAGNOSTIC = IMPOT_SUR_LES_SOCIETES.tauxNormal;

/** Le bilan d'un exercice en valeurs comptables : l'actif et les dettes, à plus ou à moins d'un an. */
export function bilanDeLExercice(e: ExerciceResume) {
  const immobilisationsNettes = auCentime(e.immobilisationsBrutes - e.amortissements);
  // Les dépréciations de l'actif circulant (Sonora en N) se retranchent des clients ; la provision va aux dettes.
  const provisionPourRisque = e.code === "N" ? CLOTURE_DE_LA_FICHE.travaux.provisionPourLitige : 0;
  const depreciationDesClients = auCentime(e.depreciationsEtProvisions - provisionPourRisque);
  const actifCirculant = auCentime(e.stocks + e.clientsBruts - depreciationDesClients + e.autresCreances + Math.max(0, e.tresorerieNette));
  const totalActif = auCentime(immobilisationsNettes + actifCirculant);
  const dettesAMoinsDUnAn = auCentime(e.echeancesAMoinsDUnAn + provisionPourRisque + e.fournisseurs + e.autresDettesDExploitation + e.passifHorsExploitation + Math.max(0, -e.tresorerieNette));
  const dettesAPlusDUnAn = auCentime(e.dettesFinancieres - e.echeancesAMoinsDUnAn);
  const dettes = auCentime(dettesAMoinsDUnAn + dettesAPlusDUnAn);
  return { immobilisationsNettes, depreciationDesClients, actifCirculant, totalActif, dettesAMoinsDUnAn, dettesAPlusDUnAn, dettes, capitauxPropres: auCentime(totalActif - dettes) };
}

/**
 * LA BATTERIE DE RATIOS D'UN EXERCICE, famille par famille (le cours du propriétaire, et le programme
 * du DCG UE6, 1.6) :
 *   · ACTIVITÉ : le taux de croissance du chiffre d'affaires (un flux, en taux de croissance), le taux
 *     de valeur ajoutée (valeur ajoutée ÷ production, un flux en niveau) ;
 *   · PROFITABILITÉ : le taux de marge brute (EBE ÷ chiffre d'affaires) et le taux de marge nette
 *     (résultat net ÷ chiffre d'affaires), des flux sur des flux ;
 *   · RENTABILITÉ : économique (résultat d'exploitation après impôt ÷ actif économique, les
 *     immobilisations nettes et le besoin d'exploitation) et financière (résultat net ÷ capitaux
 *     propres), des flux sur des stocks ;
 *   · FAILLITE : l'endettement (dettes financières ÷ capitaux propres), la liquidité générale (actif
 *     circulant ÷ dettes à moins d'un an), l'autonomie financière (capitaux propres ÷ total du bilan),
 *     des stocks sur des stocks ;
 *   · ROTATION : le délai des clients (sur le chiffre d'affaires TTC), des fournisseurs (sur les
 *     achats de composants TTC) et la durée du stock (sur les composants consommés), en jours, des
 *     stocks sur des flux ;
 *   · INVESTISSEMENT : le taux d'investissement (investissements ÷ valeur ajoutée, un flux sur un
 *     flux) et le taux d'usure (amortissements ÷ immobilisations brutes, un stock sur un stock) ;
 *   · STRUCTURE : la couverture des emplois stables, l'indépendance financière (ressources propres ÷
 *     ressources stables), la capacité de remboursement (dettes financières ÷ CAF).
 * Les taux sont des fractions au dix-millième, les ratios en fois et les délais au centième.
 */
export function ratiosDe(e: ExerciceResume, precedent?: ExerciceResume) {
  const b = bilanDeLExercice(e);
  const t = TAUX_DE_L_IMPOT_DU_DIAGNOSTIC;
  const actifEconomique = auCentime(b.immobilisationsNettes + e.besoinDExploitation);
  const ressourcesPropres = auCentime(e.capitauxPropres + e.amortissements + e.depreciationsEtProvisions);
  return {
    actifEconomique,
    ressourcesPropres,
    bilan: b,
    croissanceDuChiffreDAffaires: precedent ? auDixMillieme(e.production / precedent.production - 1) : null,
    croissanceDeLaValeurAjoutee: precedent ? auDixMillieme(e.valeurAjoutee / precedent.valeurAjoutee - 1) : null,
    tauxDeValeurAjoutee: auDixMillieme(e.valeurAjoutee / e.production),
    tauxDeMargeBrute: auDixMillieme(e.excedentBrutDExploitation / e.production),
    tauxDeMargeNette: auDixMillieme(e.resultatNet / e.production),
    rentabiliteEconomique: auDixMillieme((e.resultatDExploitation * (1 - t)) / actifEconomique),
    rentabiliteFinanciere: auDixMillieme(e.resultatNet / e.capitauxPropres),
    endettement: auCentieme(e.dettesFinancieres / e.capitauxPropres),
    liquiditeGenerale: auCentieme(b.actifCirculant / b.dettesAMoinsDUnAn),
    autonomie: auDixMillieme(b.capitauxPropres / b.totalActif),
    delaiClients: auCentieme((e.clientsBruts * 360) / (e.production * (1 + TAUX_DE_TVA))),
    delaiFournisseurs: auCentieme((e.fournisseurs * 360) / (e.composantsAchetes * (1 + TAUX_DE_TVA))),
    rotationDesStocks: auCentieme((e.stocks * 360) / e.composantsConsommes),
    tauxDInvestissement: auDixMillieme(e.investissements / e.valeurAjoutee),
    tauxDUsure: auDixMillieme(e.amortissements / e.immobilisationsBrutes),
    couverture: auCentieme(e.ressourcesStables / e.immobilisationsBrutes),
    independance: auDixMillieme(ressourcesPropres / e.ressourcesStables),
    capaciteDeRemboursement: auCentieme(e.dettesFinancieres / e.caf),
  };
}

export type RatiosDeLExercice = ReturnType<typeof ratiosDe>;

/** Les ratios des trois exercices, chacun face au précédent. */
export function ratiosDesExercices(f: FicheDeLExercice = EXERCICE_DE_NOVA) {
  const x = exercicesDeNova(f);
  return x.map((e, i) => ratiosDe(e, i > 0 ? x[i - 1] : undefined));
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. LES INDICATEURS ESG
// ═════════════════════════════════════════════════════════════════════════════

/**
 * LES INDICATEURS ESG D'UN EXERCICE (les hypothèses du tableau de bord durable, tableau-de-bord-durable.ts,
 * sur l'année) :
 *   · ENVIRONNEMENT : l'électricité (1,2 kWh par enceinte montée, 1 500 kWh par mois pour le bâtiment,
 *     moins les 8 000 kWh que les équipements d'efficacité économisent dès N + 1), par enceinte ; le CO2
 *     (au facteur du réseau), par enceinte et par millier d'euros de valeur ajoutée ; la part des
 *     emballages valorisés (en N, 60 % de janvier à mars, 85 % ensuite, pondérés par les livraisons) ;
 *   · SOCIAL : l'absentéisme (heures d'absence ÷ heures payées), le taux de fréquence des accidents
 *     (accidents avec arrêt × 1 000 000 ÷ heures travaillées), la formation par salarié ;
 *   · GOUVERNANCE : le délai de paiement des fournisseurs (le ratio de rotation, une loyauté envers les
 *     petits fournisseurs) et la part du premier client professionnel, CampusTech, dans le chiffre
 *     d'affaires (320 One par mois, chaque exercice).
 */
export function indicateursESG(e: ExerciceResume, r: RatiosDeLExercice) {
  const economie = e.code === "N" ? 0 : KWH_ECONOMISES_PAR_AN;
  const kwh = auCentime(e.enceintes * KWH_PAR_ENCEINTE + KWH_DU_BATIMENT_PAR_MOIS * 12 - economie);
  const co2 = auCentime(kwh * KG_CO2_PAR_KWH);
  const emballages = auCentime(e.enceintes * KG_D_EMBALLAGE_PAR_ENCEINTE);
  const partValorisee =
    e.code === "N"
      ? auDixMillieme(LIVRAISONS_DU_MOIS.reduce((t, q, m) => t + q * (m >= PART_VALORISEE.aPartirDu ? PART_VALORISEE.apres : PART_VALORISEE.avant), 0) / e.enceintes)
      : PART_VALORISEE_DES_EXERCICES[e.code];
  const social = SOCIAL_DES_EXERCICES[e.code];
  const effectif = EFFECTIFS[e.code];
  const heuresPayees = auCentime(effectif * HEURES_LEGALES_PAR_MOIS * 12);
  const heuresTravaillees = auCentime(heuresPayees - social.absences);
  const campustech = auCentime(CAMPUSTECH_PAR_AN * PRIX_DE_L_ENCEINTE);
  return {
    kwh,
    co2,
    emballages,
    effectif,
    heuresPayees,
    heuresTravaillees,
    kwhParEnceinte: auCentieme(kwh / e.enceintes),
    co2ParEnceinte: auDixMillieme(co2 / e.enceintes),
    /** Le même, en grammes au centième : 0,0783 kg s'écrit 78,25 g, deux décimales sans perdre de chiffre (deux-decimales.ts). */
    co2ParEnceinteEnGrammes: auCentieme((co2 * 1_000) / e.enceintes),
    co2ParMilleEurosDeValeurAjoutee: auCentieme(co2 / (e.valeurAjoutee / 1_000)),
    partValorisee,
    absenteisme: auDixMillieme(social.absences / heuresPayees),
    tauxDeFrequence: auCentieme((social.accidents * 1_000_000) / heuresTravaillees),
    formationParSalarie: auCentieme(social.formation / effectif),
    delaiFournisseurs: r.delaiFournisseurs,
    partDuPremierClient: auDixMillieme(campustech / e.production),
  };
}

/** CampusTech, chaque exercice : 320 One par mois (exercice-de-nova.ts). */
const CAMPUSTECH_PAR_AN = CAMPUSTECH.enceintesParFacture * 12;

/** Le diagnostic complet : les trois exercices, leurs ratios, leurs indicateurs ESG, le secteur. */
export function diagnosticDeNova(f: FicheDeLExercice = EXERCICE_DE_NOVA) {
  const exercices = exercicesDeNova(f);
  const ratios = ratiosDesExercices(f);
  const esg = exercices.map((e, i) => indicateursESG(e, ratios[i]!));
  return { exercices, ratios, esg, secteur: MOYENNES_DU_SECTEUR };
}

export type DiagnosticDeNova = ReturnType<typeof diagnosticDeNova>;
