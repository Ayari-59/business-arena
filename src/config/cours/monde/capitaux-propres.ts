import { affecter, beneficeAAffecter, DIVIDENDE_DEMANDE_PAR_ACTION, PLAFOND_DE_LA_RESERVE_LEGALE, RESERVES_FACULTATIVES_PROPOSEES } from "./affectation-du-resultat";
import { auCentime } from "./amortissement";
import { CAS_DES_ENTREPRISES } from "./cas-des-entreprises";
import { ACTIONS_DE_NOVA, AUGMENTATION_DE_CAPITAL, RESERVE_LEGALE } from "./comptabilite-approfondie";
import { EXERCICE_DE_NOVA } from "./exercice-de-nova";
import { impotDuBenefice, reportEnArriere, resultatFiscal } from "./finance";
import { EXERCICES_DE_PIXEL, IMPOT_DE_PIXEL_EN_N_MOINS_1, RANG_DE_L_EXERCICE_EN_PERTE } from "./projets-et-financement";

/**
 * LE MONDE DU COURS : LES CAPITAUX PROPRES DE NOVA, DE LA CONSTITUTION À L'AFFECTATION
 * (BTS CG P2, 2.2.1, 2.2.2, 2.5.1 à 2.5.3 ; chapitre « Les capitaux propres : constituer, augmenter,
 * affecter »).
 *
 * UNE SEULE NOVA (tests/cours/une-seule-nova.test.ts). Rien n'est recopié :
 *   · la constitution est celle de la fiche (exercice-de-nova.ts, APPORT_EN_CAPITAL) : 150 000 €
 *     versés le 2 janvier N, en 15 000 actions de 10 € (comptabilite-approfondie.ts, ACTIONS_DE_NOVA) ;
 *   · l'affectation du bénéfice de N est LA version unique du cours (décision D2, novembre 2026) :
 *     celle du chapitre du bac STMG « L'affectation du résultat » (affectation-du-resultat.ts) :
 *     5 % en réserve légale, 2 € de dividende par action, 45 000 € de réserves facultatives, le reste
 *     en report à nouveau. Elle est lue ici par `affecter`, pas refaite ;
 *   · l'augmentation de capital du 30 juin N + 1 est celle du chapitre du DCG (1 action nouvelle
 *     pour 3 anciennes, émise à 12 €, libérée en entier, AUGMENTATION_DE_CAPITAL), sans le droit de
 *     souscription, que le BTS exclut ;
 *   · la perte est celle de PIXEL & CO en N (projets-et-financement.ts, EXERCICES_DE_PIXEL), après
 *     l'option pour le report en arrière que le chapitre « Le déficit reporté » conseille : une
 *     créance d'impôt réduit la perte nette. Son capital est celui de son cas
 *     (cas-des-entreprises.ts).
 *
 * Ce qui est neuf est une HYPOTHÈSE DU COURS, nommée ci-dessous. Les variantes (une libération
 * partielle, des frais, un apport en nature, une incorporation de réserves) ne changent pas NOVA :
 * le chapitre les présente comme des « si », pour faire voir chaque écriture du programme.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. LA CONSTITUTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA LIBÉRATION MINIMALE DES ACTIONS DE NUMÉRAIRE dans une SAS, à la souscription : la moitié du
 * nominal, le solde dans les 5 ans (Code de commerce, L. 227-1 qui renvoie à L. 225-3 ; dans une
 * SARL, le cinquième, L. 223-7). Un apport en nature est libéré en entier dès la souscription.
 */
export const LIBERATION_MINIMALE = 0.5; // À VÉRIFIER (L. 225-3 et L. 227-1 du Code de commerce)
export const DELAI_DE_LIBERATION_EN_ANS = 5; // À VÉRIFIER

/**
 * LES FRAIS DE CONSTITUTION, montant donné (HYPOTHÈSE DU COURS, une variante : la fiche de N n'en
 * porte pas) : les honoraires de rédaction des statuts, 1 500 € hors taxes et 20 % de TVA, et les
 * frais d'immatriculation et d'annonce légale, 200 €, comptés ici sans TVA.
 */
export const FRAIS_DE_CONSTITUTION = { honoraires: 1_500, tauxDeTva: 0.2, immatriculation: 200 } as const;

/** La durée d'amortissement des frais d'établissement, quand ils sont inscrits à l'actif : 5 ans au plus. */
export const DUREE_DES_FRAIS_D_ETABLISSEMENT = 5;

export function constitution() {
  const capital = EXERCICE_DE_NOVA.apport.montant;
  const minimum = auCentime(capital * LIBERATION_MINIMALE);
  const f = FRAIS_DE_CONSTITUTION;
  const tva = auCentime(f.honoraires * f.tauxDeTva);
  const charges = auCentime(f.honoraires + f.immatriculation);
  return {
    capital,
    actions: ACTIONS_DE_NOVA.nombre,
    nominal: ACTIONS_DE_NOVA.nominal,
    /** La variante : seule la moitié appelée et versée à la souscription. */
    appeleVerse: minimum,
    nonAppele: auCentime(capital - minimum),
    frais: { ...f, tva, charges, paye: auCentime(charges + tva), amortissementAnnuel: auCentime(charges / DUREE_DES_FRAIS_D_ETABLISSEMENT) },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. L'AFFECTATION DU BÉNÉFICE DE N, EN JUIN N + 1
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LES STATUTS DE NOVA (HYPOTHÈSE DU COURS) : ils prévoient un premier dividende, l'intérêt
 * statutaire, de 5 % du capital libéré ; ils n'imposent aucune réserve statutaire. Le dividende de
 * 2 € par action de la version unique se lit donc en 0,50 € d'intérêt statutaire et 1,50 € de
 * superdividende : les montants restent ceux du bac.
 */
export const INTERET_STATUTAIRE = 0.05;
export const RESERVE_STATUTAIRE = 0;

/** L'assemblée qui approuve les comptes de N, et la mise en paiement du dividende (HYPOTHÈSE DU COURS sur les jours). */
export const ASSEMBLEE_DE_N_PLUS_1 = { date: "15 juin", miseEnPaiement: "1er juillet" } as const;

const BENEFICE_DE_N = { valeur: null as ReturnType<typeof beneficeAAffecter> | null };

/** L'affectation du bénéfice de N pour un dividende par action et des réserves facultatives (par défaut, la version unique). */
export function affectationDeNova(dividendeParAction: number = DIVIDENDE_DEMANDE_PAR_ACTION, reservesFacultatives: number = RESERVES_FACULTATIVES_PROPOSEES) {
  // Le bénéfice de N se calcule une fois : la clôture du lycée se referait sinon à chaque texte.
  const k = (BENEFICE_DE_N.valeur ??= beneficeAAffecter(EXERCICE_DE_NOVA));
  const a = affecter(k, { dividendeParAction, reservesFacultatives });
  const interetStatutaire = auCentime(k.capital * INTERET_STATUTAIRE);
  const reserveStatutaire = auCentime(k.benefice * RESERVE_STATUTAIRE);
  return {
    benefice: k.benefice,
    capital: k.capital,
    actions: k.actions,
    reportAnterieur: k.reportAnterieur,
    plafond: k.plafond,
    reserveLegale: k.reserveLegale,
    reserveStatutaire,
    distribuable: k.distribuable,
    dividendeParAction,
    dividendes: a.dividendes,
    interetStatutaire,
    interetParAction: auCentime(interetStatutaire / k.actions),
    superdividende: auCentime(a.dividendes - interetStatutaire),
    superdividendeParAction: auCentime((a.dividendes - interetStatutaire) / k.actions),
    reservesFacultatives,
    reportANouveau: a.reportANouveau,
    possible: a.possible,
    /** Les réserves facultatives les plus fortes que le dividende laisse possibles. */
    reservesAuPlus: auCentime(k.distribuable - a.dividendes),
    capitauxPropresAvant: k.capitauxPropres,
    capitauxPropresApres: a.capitauxPropres,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. L'AUGMENTATION DE CAPITAL DU 30 JUIN N + 1, ET SES VARIANTES
// ─────────────────────────────────────────────────────────────────────────────

/** LES FRAIS DE L'AUGMENTATION, montant donné (HYPOTHÈSE DU COURS, une variante) : 2 000 € hors taxes d'honoraires, 20 % de TVA, imputés sur la prime d'émission. */
export const FRAIS_D_AUGMENTATION = { honoraires: 2_000, tauxDeTva: 0.2 } as const;

/**
 * L'INCORPORATION DE RÉSERVES (HYPOTHÈSE DU COURS, une variante) : les 45 000 € de réserves
 * facultatives passent au capital en élevant le nominal de chaque action, sans action nouvelle.
 */
export const NOMINAL_APRES_INCORPORATION = 13;

/** Les trois façons d'augmenter le capital, codées pour le levier du laboratoire. */
export const FACONS_D_AUGMENTER = { numeraire: 1, nature: 2, incorporation: 3 } as const;

/** Le capital que vise le défi du laboratoire, et la trésorerie qu'il doit faire entrer au moins. */
export const CAPITAL_VISE = 200_000;
export const TRESORERIE_VISEE = 50_000;

export function augmentation() {
  const n = ACTIONS_DE_NOVA;
  const x = affectationDeNova();
  const nouvelles = n.nombre / AUGMENTATION_DE_CAPITAL.parite;
  const fonds = auCentime(nouvelles * AUGMENTATION_DE_CAPITAL.prixDEmission);
  const capital = auCentime(nouvelles * n.nominal);
  const prime = auCentime(fonds - capital);
  const tvaDesFrais = auCentime(FRAIS_D_AUGMENTATION.honoraires * FRAIS_D_AUGMENTATION.tauxDeTva);
  const incorporees = auCentime(n.nombre * (NOMINAL_APRES_INCORPORATION - n.nominal));
  const capitalApres = auCentime(x.capital + capital);
  return {
    date: AUGMENTATION_DE_CAPITAL.date,
    parite: AUGMENTATION_DE_CAPITAL.parite,
    prix: AUGMENTATION_DE_CAPITAL.prixDEmission,
    nominal: n.nominal,
    nouvelles,
    fonds,
    capital,
    prime,
    capitalApres,
    capitauxPropresApres: auCentime(x.capitauxPropresApres + fonds),
    /** La valeur de l'action après l'assemblée : les capitaux propres après répartition, par action. */
    valeurDeLAction: Math.round((x.capitauxPropresApres / n.nombre) * 100) / 100,
    frais: { ...FRAIS_D_AUGMENTATION, tva: tvaDesFrais, paye: auCentime(FRAIS_D_AUGMENTATION.honoraires + tvaDesFrais), primeRestante: auCentime(prime - FRAIS_D_AUGMENTATION.honoraires) },
    incorporation: { nominal: NOMINAL_APRES_INCORPORATION, montant: incorporees, reservesRestantes: auCentime(x.reservesFacultatives - incorporees) },
    /** Le nouveau plafond de la réserve légale, le dixième du capital augmenté, et ce qu'il reste à y doter. */
    plafondApres: auCentime(capitalApres * PLAFOND_DE_LA_RESERVE_LEGALE),
    resteADoter: auCentime(capitalApres * PLAFOND_DE_LA_RESERVE_LEGALE - x.reserveLegale),
    reserveLegale: x.reserveLegale,
  };
}

/**
 * LE LABORATOIRE : une augmentation de `actions` actions nouvelles, en numéraire (au prix
 * d'émission, payée par virement), en nature (un brevet apporté par un associé, évalué au même
 * prix, HYPOTHÈSE DU COURS) ou par incorporation des réserves facultatives (au nominal : des actions
 * gratuites). L'incorporation ne peut pas prendre plus que les réserves facultatives.
 */
export function augmentationDuLaboratoire(facon: number, actions: number) {
  const n = ACTIONS_DE_NOVA;
  const x = affectationDeNova();
  const prix = AUGMENTATION_DE_CAPITAL.prixDEmission;
  const capitalEnPlus = auCentime(actions * n.nominal);
  const incorporation = facon === FACONS_D_AUGMENTER.incorporation;
  const possible = !incorporation || capitalEnPlus <= x.reservesFacultatives + 1e-9;
  const prime = incorporation ? 0 : auCentime(actions * (prix - n.nominal));
  const tresorerie = facon === FACONS_D_AUGMENTER.numeraire ? auCentime(actions * prix) : 0;
  const immobilisations = facon === FACONS_D_AUGMENTER.nature ? auCentime(actions * prix) : 0;
  const reserves = incorporation ? auCentime(x.reservesFacultatives - capitalEnPlus) : x.reservesFacultatives;
  const capitauxPropres = incorporation ? x.capitauxPropresApres : auCentime(x.capitauxPropresApres + actions * prix);
  return {
    possible,
    capital: auCentime(x.capital + capitalEnPlus),
    prime,
    reserves,
    capitauxPropres,
    tresorerie,
    immobilisations,
    actions: n.nombre + actions,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. LA PERTE DE PIXEL & CO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LES CAPITAUX PROPRES DE PIXEL & CO AU 31 DÉCEMBRE N (HYPOTHÈSE DU COURS) : le capital de son cas ;
 * le bénéfice de N − 1, après son impôt, tout mis en réserve (« Le déficit reporté ») : 5 % à la
 * réserve légale, le reste en autres réserves ; aucune réserve ni aucun report plus ancien.
 *
 * LA RÈGLE DE LA MOITIÉ DU CAPITAL (Code de commerce, L. 225-248 pour la SA et la SAS, L. 223-42 pour
 * la SARL) : quand les pertes font tomber les capitaux propres sous la moitié du capital, les associés
 * décident dans les 4 mois qui suivent l'approbation des comptes s'il y a lieu de dissoudre la
 * société ; sinon, elle doit reconstituer ses capitaux propres ou réduire son capital dans un délai
 * fixé par la loi.
 */
export const DELAI_DE_DECISION_EN_MOIS = 4; // À VÉRIFIER (L. 225-248 et L. 223-42 : le délai et la procédure ont pu être réformés)
export const PART_DU_CAPITAL_A_PRESERVER = 0.5;

/** Les pertes du curseur de PIXEL & CO, en euros. */
export const PERTE_DU_CURSEUR_DE_PIXEL = { min: 0, max: 100_000 } as const;

export function perteDePixel(perteNette?: number) {
  const ex = EXERCICES_DE_PIXEL;
  const n = RANG_DE_L_EXERCICE_EN_PERTE;
  const capital = CAS_DES_ENTREPRISES.ecommerce!.capital;
  const beneficeNMoins1 = auCentime(resultatFiscal(ex[n - 1]!) - IMPOT_DE_PIXEL_EN_N_MOINS_1);
  const reserveLegale = auCentime(beneficeNMoins1 * RESERVE_LEGALE);
  const autresReserves = auCentime(beneficeNMoins1 - reserveLegale);
  const deficit = -resultatFiscal(ex[n]!);
  const arriere = reportEnArriere(deficit, resultatFiscal(ex[n - 1]!));
  const perteComptable = -ex[n]!.resultatComptable;
  const perte = perteNette ?? auCentime(perteComptable - arriere.creance);
  const capitauxPropres = auCentime(capital + reserveLegale + autresReserves - perte);
  const seuil = auCentime(capital * PART_DU_CAPITAL_A_PRESERVER);
  // L'exercice suivant : son bénéfice fiscal moins le déficit qui attend encore en avant, et l'impôt au taux normal.
  const rfSuivant = resultatFiscal(ex[n + 1]!);
  const impotSuivant = impotDuBenefice(Math.max(0, auCentime(rfSuivant - arriere.deficitEnAvant)), false).impot;
  const beneficeSuivant = auCentime(ex[n + 1]!.resultatComptable - impotSuivant);
  return {
    entreprise: CAS_DES_ENTREPRISES.ecommerce!.entreprise,
    capital,
    beneficeNMoins1,
    reserveLegale,
    autresReserves,
    perteComptable,
    creance: arriere.creance,
    perte,
    capitauxPropres,
    seuil,
    sousLaMoitie: capitauxPropres < seuil,
    /** La perte nette la plus forte qui laisse les capitaux propres à la moitié du capital au moins. */
    perteMaximale: auCentime(capital + reserveLegale + autresReserves - seuil),
    beneficeSuivant,
    impotSuivant,
    /** Après l'assemblée de N + 2 : le bénéfice de N + 1 vient d'abord éponger le report à nouveau débiteur. */
    reportDebiteurRestant: auCentime(Math.max(0, perte - beneficeSuivant)),
  };
}

/**
 * LE CAS « UN DIVIDENDE PLUS GROS » (HYPOTHÈSE DU COURS) : avant l'assemblée de juin N + 1, une
 * actionnaire propose 2,50 € par action, en gardant les 45 000 € de réserves facultatives du projet.
 */
export const DIVIDENDE_PROPOSE_DU_CAS = 2.5;
