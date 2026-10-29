import { auCentime, coefficientDegressif, dotationDeLExercice, planDAmortissement, valeurNetteALaCloture, type DateDuCours, type Immobilisation } from "./amortissement";
import { CLOTURE_DE_LA_FICHE, EQUIPEMENT, IMMOBILISATION, APPORT_EN_CAPITAL } from "./exercice-de-nova";
import { PRIX_DE_L_ENCEINTE } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LA COMPTABILITÉ APPROFONDIE DE NOVA (DCG UE10), EN N + 1.
 *
 * Une seule NOVA (tests/cours/une-seule-nova.test.ts) : ce qui suit prolonge le premier exercice
 * (exercice-de-nova.ts) sans en changer un chiffre. La ligne de montage de N (60 000 € hors taxes,
 * 6 ans, linéaire, en service le 6 janvier N), le capital de 150 000 € et le bénéfice de
 * 79 225,96 € sont lus là-bas ; la seconde ligne de N + 1 est celle que la gamme fait tourner
 * (nova-gestion.ts : deux lignes de 60 000 €, 833 € d'usure par mois chacune en gestion) ; les
 * enceintes se vendent toujours 59 € hors taxes en France.
 *
 * Tout ce qui est neuf est une HYPOTHÈSE DU COURS, nommée ici en constante : la décomposition de la
 * seconde ligne, le test de dépréciation de la première, le client américain et le fournisseur payé
 * en dollars, le chantier de sonorisation de la salle Arpège, l'augmentation de capital de juin
 * N + 1. Cinq chapitres les lisent (chapitres/*.ts, parcours « DCG · Comptabilité approfondie ») et
 * leurs cas ; leurs tests refont chaque chiffre à la main.
 *
 * Comme dans exercice-de-nova.ts, une charge calculée n'a pas à être la même en comptabilité et en
 * gestion : l'approche par composants amortit la seconde ligne plus vite la première année que les
 * 833 € par mois du contrôle de gestion.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. LA SECONDE LIGNE, PAR COMPOSANTS, ET L'AMORTISSEMENT DÉROGATOIRE
// ─────────────────────────────────────────────────────────────────────────────

/** La mise en service de la seconde ligne : le 2 janvier N + 1 (359 jours la première année). */
export const MISE_EN_SERVICE_DE_LA_SECONDE_LIGNE: DateDuCours = { jour: 2, mois: 1, exercice: 1 };

/**
 * LA SECONDE LIGNE, 60 000 € hors taxes comme la première (HYPOTHÈSE DU COURS sur sa décomposition) :
 * la structure, le bâti et le convoyeur, dure 6 ans ; les moteurs et l'électronique de commande, un
 * composant que le fabricant fait remplacer, durent 3 ans. Le composant a sa propre durée : il
 * s'amortit à part.
 */
export const SECONDE_LIGNE = {
  designation: "Ligne manuelle",
  ht: EQUIPEMENT.ht,
  structure: { libelle: "Structure : bâti et convoyeur", valeur: 45_000, dureeAns: 6 },
  composant: { libelle: "Moteurs et électronique de commande", valeur: 15_000, dureeAns: 3 },
} as const;

/** La durée d'utilisation de la ligne entière, si NOVA ne la décomposait pas : celle de la première. */
export const DUREE_SANS_COMPOSANTS = EQUIPEMENT.dureeAns;

/**
 * LE PLAN FISCAL (HYPOTHÈSE DU COURS) : NOVA amortit la structure en dégressif sur le plan fiscal
 * (coefficient 1,75 pour 6 ans), pour déduire plus tôt ; en comptabilité, elle garde le linéaire,
 * qui suit l'usure. L'écart est l'amortissement dérogatoire, une provision réglementée (compte 145).
 */
export const DEGRESSIF_FISCAL_DE_LA_STRUCTURE = true;

const structureDe = (): Immobilisation => ({ valeurBrute: SECONDE_LIGNE.structure.valeur, miseEnService: MISE_EN_SERVICE_DE_LA_SECONDE_LIGNE, dureeAns: SECONDE_LIGNE.structure.dureeAns });
const composantDe = (dureeAns: number = SECONDE_LIGNE.composant.dureeAns): Immobilisation => ({ valeurBrute: SECONDE_LIGNE.composant.valeur, miseEnService: MISE_EN_SERVICE_DE_LA_SECONDE_LIGNE, dureeAns });

/** Les dotations de N + 1 de la seconde ligne, par composants ou d'un bloc. */
export function composantsDeLaSecondeLigne(dureeDuComposant: number = SECONDE_LIGNE.composant.dureeAns) {
  const structure = dotationDeLExercice(structureDe(), "lineaire", 1);
  const composant = dotationDeLExercice(composantDe(dureeDuComposant), "lineaire", 1);
  const ligneEntiere: Immobilisation = { valeurBrute: SECONDE_LIGNE.ht, miseEnService: MISE_EN_SERVICE_DE_LA_SECONDE_LIGNE, dureeAns: DUREE_SANS_COMPOSANTS };
  const sansComposants = dotationDeLExercice(ligneEntiere, "lineaire", 1);
  const total = auCentime(structure + composant);
  return { structure, composant, total, sansComposants, ecart: auCentime(total - sansComposants), jours: 359 };
}

/** Le plan comptable (linéaire) et le plan fiscal (dégressif) de la structure, année par année, et l'écart. */
export function derogatoireDeLaStructure() {
  const lineaire = planDAmortissement(structureDe(), "lineaire");
  const degressif = planDAmortissement(structureDe(), "degressif");
  const annees = degressif.map((d, k) => {
    const l = lineaire[k]?.dotation ?? 0;
    return { annee: k + 1, lineaire: l, degressif: d.dotation, ecart: auCentime(d.dotation - l) };
  });
  const premiereReprise = annees.find((a) => a.ecart < 0)!.annee;
  return {
    coefficient: coefficientDegressif(SECONDE_LIGNE.structure.dureeAns),
    tauxDegressif: coefficientDegressif(SECONDE_LIGNE.structure.dureeAns) / SECONDE_LIGNE.structure.dureeAns,
    annees,
    dotationN1: annees[0]!.ecart,
    premiereReprise,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. LE TEST DE DÉPRÉCIATION DE LA PREMIÈRE LIGNE, AU 31 DÉCEMBRE N + 1
// ─────────────────────────────────────────────────────────────────────────────

/**
 * L'INDICE DE PERTE DE VALEUR (HYPOTHÈSE DU COURS) : en N + 1, les fabricants de lignes vendent une
 * ligne automatique au prix d'une ligne manuelle ; le marché de l'occasion des lignes manuelles
 * s'effondre. Au 31 décembre N + 1, NOVA teste la première ligne :
 *   · sa valeur vénale, ce qu'un acheteur en donnerait net des frais de sortie : 26 000 € ;
 *   · sa valeur d'usage, les flux nets de trésorerie qu'elle rapportera encore, actualisés : 4 années
 *     d'utilisation restantes, 10 000 € par an en fin d'année, au taux de 6 %.
 */
export const TEST_DE_LA_PREMIERE_LIGNE = { valeurVenale: 26_000, fluxAnnuel: 10_000, anneesRestantes: 4, taux: 0.06 } as const;

/** Le facteur d'actualisation d'une suite de flux égaux : (1 − (1 + t)^−n) ÷ t. */
export const facteurDActualisation = (taux: number, annees: number) => (1 - (1 + taux) ** -annees) / taux;

/** Le test : valeur nette comptable, valeur vénale, valeur d'usage, valeur actuelle (la plus haute des deux), dépréciation. */
export function testDeDepreciation(fluxAnnuel: number = TEST_DE_LA_PREMIERE_LIGNE.fluxAnnuel, taux: number = TEST_DE_LA_PREMIERE_LIGNE.taux, valeurVenale: number = TEST_DE_LA_PREMIERE_LIGNE.valeurVenale) {
  const t = TEST_DE_LA_PREMIERE_LIGNE;
  const dotationN = dotationDeLExercice(IMMOBILISATION, "lineaire", 0);
  const dotationN1 = dotationDeLExercice(IMMOBILISATION, "lineaire", 1);
  const valeurNette = valeurNetteALaCloture(IMMOBILISATION, "lineaire", 1);
  const facteur = facteurDActualisation(taux, t.anneesRestantes);
  const valeurDUsage = auCentime(fluxAnnuel * facteur);
  const valeurActuelle = Math.max(valeurVenale, valeurDUsage);
  const depreciation = auCentime(Math.max(0, valeurNette - valeurActuelle));
  const valeurApres = auCentime(valeurNette - depreciation);
  return {
    brut: IMMOBILISATION.valeurBrute,
    dotationN,
    dotationN1,
    valeurNette,
    valeurVenale,
    facteur,
    valeurDUsage,
    valeurActuelle,
    retenue: valeurDUsage >= valeurVenale ? ("usage" as const) : ("venale" as const),
    depreciation,
    valeurApres,
    /** Le nouveau plan : la valeur après dépréciation, sur les années qui restent. */
    dotationSuivante: auCentime(valeurApres / t.anneesRestantes),
    anneesRestantes: t.anneesRestantes,
    fluxAnnuel,
    taux,
  };
}

/** Le plus petit flux annuel, à l'euro, qui épargne toute dépréciation. */
export const fluxSansDepreciation = () => Math.ceil(testDeDepreciation().valeurNette / facteurDActualisation(TEST_DE_LA_PREMIERE_LIGNE.taux, TEST_DE_LA_PREMIERE_LIGNE.anneesRestantes));

/** Les taux d'actualisation du laboratoire, en pour cent, et la dépréciation qu'il faut dépasser. */
export const TAUX_DU_LABORATOIRE = { min: 2, max: 10, pas: 1 } as const;
export const DEPRECIATION_A_DEPASSER = 7_000;

/** Le plus petit taux du laboratoire où la dépréciation dépasse le seuil. */
export function tauxQuiDepasse() {
  for (let p = TAUX_DU_LABORATOIRE.min; p <= TAUX_DU_LABORATOIRE.max; p += TAUX_DU_LABORATOIRE.pas) {
    if (testDeDepreciation(undefined, p / 100).depreciation > DEPRECIATION_A_DEPASSER) return p;
  }
  return TAUX_DU_LABORATOIRE.max;
}

/**
 * LE CAS : UN ACQUÉREUR (HYPOTHÈSE DU COURS) offre 30 000 € de la première ligne au 31 décembre N + 1.
 */
export const OFFRE_DE_RACHAT = 30_000;

// ─────────────────────────────────────────────────────────────────────────────
// 3. LES OPÉRATIONS EN DEVISES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE CLIENT AMÉRICAIN (HYPOTHÈSE DU COURS) : le 15 novembre N + 1, NOVA vend 2 000 enceintes à Harbor
 * Audio, un distributeur de Boston, 70 $ pièce, payables le 15 février N + 2. Une livraison hors de
 * l'Union européenne est exonérée de TVA. Les cours se disent en euros pour un dollar.
 *
 * LE FOURNISSEUR AMÉRICAIN : le 15 novembre N + 1 aussi, NOVA achète pour 50 000 $ de haut-parleurs,
 * payables le 15 février N + 2, la même échéance que la créance.
 */
export const HARBOR_AUDIO = { nom: "Harbor Audio", enceintes: 2_000, prixEnDollars: 70, date: "15 novembre", echeance: "15 février N + 2" } as const;
export const DETTE_EN_DOLLARS = { fournisseur: "Lakeside Drivers", montantEnDollars: 50_000 } as const;
export const COURS_DU_DOLLAR = { facture: 0.91, cloture: 0.89, reglement: 0.92 } as const;

/** Le cours du laboratoire et la provision qu'il faut trouver. */
export const COURS_DU_LABORATOIRE = { min: 0.85, max: 0.95, pas: 0.01 } as const;
export const PROVISION_CHERCHEE = 3_600;

/** La créance, la dette et leurs écarts, à un cours de clôture donné. */
export function operationsEnDevises(coursDeCloture: number = COURS_DU_DOLLAR.cloture) {
  const dollars = HARBOR_AUDIO.enceintes * HARBOR_AUDIO.prixEnDollars;
  const creanceALaFacture = auCentime(dollars * COURS_DU_DOLLAR.facture);
  const creanceALaCloture = auCentime(dollars * coursDeCloture);
  const ecartSurLaCreance = auCentime(creanceALaFacture - creanceALaCloture);
  const detteALaFacture = auCentime(DETTE_EN_DOLLARS.montantEnDollars * COURS_DU_DOLLAR.facture);
  const detteALaCloture = auCentime(DETTE_EN_DOLLARS.montantEnDollars * coursDeCloture);
  const ecartSurLaDette = auCentime(detteALaFacture - detteALaCloture);
  // Une perte latente sur la créance quand le dollar baisse ; la dette, elle, y gagne autant en proportion.
  const perteLatente = Math.max(0, ecartSurLaCreance) + Math.max(0, -ecartSurLaDette);
  const gainLatent = Math.max(0, -ecartSurLaCreance) + Math.max(0, ecartSurLaDette);
  // LA POSITION GLOBALE DE CHANGE : même devise, mêmes échéances ; la provision se limite à l'excédent des pertes sur les gains.
  const provisionSeule = auCentime(Math.max(0, ecartSurLaCreance));
  const provision = auCentime(Math.max(0, perteLatente - gainLatent));
  const encaisse = auCentime(dollars * COURS_DU_DOLLAR.reglement);
  return {
    dollars,
    creanceALaFacture,
    creanceALaCloture,
    ecartSurLaCreance,
    detteALaFacture,
    detteALaCloture,
    ecartSurLaDette,
    provisionSeule,
    provision,
    encaisse,
    gainDeChange: auCentime(encaisse - creanceALaFacture),
  };
}

/** Le cours de clôture le plus bas, en euros pour 1 000 $, où la créance ne perd rien. */
export const coursSansPerte = () => Math.ceil(COURS_DU_DOLLAR.facture * 1_000 - 1e-9);

/** LE CAS : une vente à terme proposée par la banque le 15 novembre (HYPOTHÈSE DU COURS), au cours de 0,90 €. */
export const COURS_A_TERME = 0.9;

// ─────────────────────────────────────────────────────────────────────────────
// 4. LE CONTRAT À LONG TERME : LA SONORISATION DE LA SALLE ARPÈGE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE CHANTIER (HYPOTHÈSE DU COURS) : le 1er mars N + 1, la salle de concert Arpège confie à NOVA la
 * conception et la pose de sa sonorisation, livrée en mai N + 2. Prix ferme : 180 000 € hors taxes ;
 * coût total estimé : 150 000 €. Au 31 décembre N + 1, NOVA a engagé 60 000 € de coûts et facturé
 * deux situations de travaux, 50 000 € hors taxes en tout. La TVA de travaux est exigible à
 * l'encaissement : la facture à établir se passe hors taxes. NOVA retient la méthode à l'avancement,
 * mesuré par les coûts engagés.
 */
export const CHANTIER_ARPEGE = { client: "la salle Arpège", prix: 180_000, coutTotalEstime: 150_000, coutsEngages: 60_000, facture: 50_000 } as const;

/** Le cas : le coût total réestimé en janvier N + 2, avant l'arrêté des comptes (HYPOTHÈSE DU COURS). */
export const COUT_REESTIME = 195_000;

/** Les coûts engagés du laboratoire, et le résultat de l'exercice qu'il faut obtenir. */
export const COUTS_DU_LABORATOIRE = { min: 30_000, max: 150_000, pas: 15_000 } as const;
export const RESULTAT_CHERCHE = 18_000;

/** Le contrat à l'avancement, pour des coûts engagés et un coût total estimé donnés. */
export function contratALAvancement(coutsEngages: number = CHANTIER_ARPEGE.coutsEngages, coutTotal: number = CHANTIER_ARPEGE.coutTotalEstime) {
  const k = CHANTIER_ARPEGE;
  const avancement = coutsEngages / coutTotal;
  const resultatTotal = auCentime(k.prix - coutTotal);
  const produit = auCentime(k.prix * avancement);
  const resultatALAvancement = auCentime(produit - coutsEngages);
  // Une perte à terminaison se constate en entier dès qu'elle est connue : ce que l'avancement n'en a
  // pas encore pris se provisionne.
  const provisionPourPerte = resultatTotal < 0 ? auCentime(-resultatTotal + resultatALAvancement) : 0;
  return {
    ...k,
    coutsEngages,
    coutTotal,
    avancement,
    avancementPct: Math.round(avancement * 10_000) / 100,
    produit,
    aFacturer: auCentime(produit - k.facture),
    resultatTotal,
    resultatALAvancement,
    provisionPourPerte,
    resultatDeLExercice: auCentime(resultatALAvancement - provisionPourPerte),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. LES CAPITAUX PROPRES : L'AFFECTATION ET L'AUGMENTATION DE CAPITAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE CAPITAL DE NOVA (HYPOTHÈSE DU COURS sur sa division) : les 150 000 € apportés en janvier N sont
 * 15 000 actions de 10 € de nominal. L'assemblée de juin N + 1 affecte le bénéfice de N : 5 % à la
 * réserve légale, le reste aux autres réserves, sans dividende (NOVA garde ses moyens pour sa
 * seconde ligne).
 *
 * L'AUGMENTATION DE CAPITAL du 30 juin N + 1 : 1 action nouvelle pour 3 anciennes, émise à 12 €,
 * libérée en entier à la souscription. Le chapitre mesure les capitaux propres par ceux du
 * 31 décembre N, l'exercice N + 1 n'étant pas encore clos.
 */
export const ACTIONS_DE_NOVA = { nombre: 15_000, nominal: 10 } as const;
export const RESERVE_LEGALE = 0.05;
export const AUGMENTATION_DE_CAPITAL = { parite: 3, prixDEmission: 12, date: "30 juin N + 1" } as const;

/** Ce que NOVA doit lever, et les parités du laboratoire (1 action nouvelle pour k anciennes). */
export const BESOIN_DE_FONDS = 60_000;
export const PARITES_DU_LABORATOIRE = [2, 3, 4, 5] as const;

/** Le cas : l'investisseuse propose 11 € l'action pour toute l'émission (HYPOTHÈSE DU COURS). */
export const PRIX_DE_L_INVESTISSEUSE = 11;

/** L'affectation, la valeur de l'action et l'augmentation, pour une parité et un prix donnés. */
export function augmentationDeCapital(parite: number = AUGMENTATION_DE_CAPITAL.parite, prix: number = AUGMENTATION_DE_CAPITAL.prixDEmission) {
  const a = ACTIONS_DE_NOVA;
  const capital = APPORT_EN_CAPITAL.montant;
  const benefice = CLOTURE_DE_LA_FICHE.resultatNet;
  const reserveLegale = auCentime(benefice * RESERVE_LEGALE);
  const autresReserves = auCentime(benefice - reserveLegale);
  const capitauxPropres = auCentime(capital + benefice);
  const valeurAvant = capitauxPropres / a.nombre;
  const nouvelles = a.nombre / parite;
  const fonds = auCentime(nouvelles * prix);
  const augmentationDuCapital = auCentime(nouvelles * a.nominal);
  const prime = auCentime(nouvelles * (prix - a.nominal));
  const valeurApres = (capitauxPropres + fonds) / (a.nombre + nouvelles);
  const droit = (valeurAvant - prix) / (parite + 1);
  return {
    capital,
    benefice,
    reserveLegale,
    autresReserves,
    capitauxPropres,
    actions: a.nombre,
    nominal: a.nominal,
    valeurAvant: Math.round(valeurAvant * 100) / 100,
    nouvelles,
    parite,
    prix,
    fonds,
    augmentationDuCapital,
    prime,
    capitalApres: auCentime(capital + augmentationDuCapital),
    capitauxPropresApres: auCentime(capitauxPropres + fonds),
    valeurApres: Math.round(valeurApres * 100) / 100,
    droit: Math.round(droit * 100) / 100,
  };
}

/** La parité du laboratoire qui lève le besoin en émettant le moins d'actions. */
export function pariteJuste() {
  return [...PARITES_DU_LABORATOIRE].reverse().find((k) => augmentationDeCapital(k).fonds >= BESOIN_DE_FONDS)!;
}

/** Les enceintes vendues en France, au prix du cours : un repère pour le client américain. */
export const PRIX_EN_FRANCE = PRIX_DE_L_ENCEINTE;
