import { CAPACITE_DE_REMBOURSEMENT_MAXIMALE, INDEPENDANCE_MINIMALE } from "../financement";
import { auCentime } from "./amortissement";
import { bilanDuLycee, compteDuLycee, enceintesDeLAnnee, type BilanDuLycee, type CompteDuLycee } from "./comptes-du-lycee";
import { tableauDAmortissement, type ModeDeRemboursement } from "./emprunt";
import { LOYER_DU_MOIS, type FicheDeLExercice } from "./exercice-de-nova";
import { PROJET_LIGNE_SEMI_AUTOMATIQUE } from "./projets-et-financement";

/**
 * LE MONDE DU COURS : LA STRUCTURE FINANCIÈRE ET LES FINANCEMENTS DE NOVA, LUS AU LYCÉE (Bac STMG,
 * gestion et finance).
 *
 * Deux chapitres du parcours lisent ce fichier, sur le premier exercice de NOVA
 * (monde/comptes-du-lycee.ts) :
 *   · « La capacité de remboursement et les limites de l'analyse fonctionnelle » : ce que la banque
 *     calcule avant de prêter (les dettes financières rapportées à la capacité d'autofinancement,
 *     les capitaux propres rapportés aux ressources durables), ce qu'une année moins bonne et un
 *     emprunt de plus y changent, et ce que le bilan ne montre pas (les loyers à venir) ;
 *   · « Financer autrement » : la ligne semi-automatique de la gamme de N+1
 *     (monde/projets-et-financement.ts), payée par une subvention, un compte courant d'associé, un
 *     prêt participatif et la banque, et ce que coûte chaque remboursement.
 * Les règles des banques sont posées dans config/cours/financement.ts. La garde
 * tests/cours/financement-du-lycee.test.ts refait chaque chiffre à la main.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. LA STRUCTURE FINANCIÈRE : CE QUE LA BANQUE CALCULE
// ─────────────────────────────────────────────────────────────────────────────

/** Ce que la banque regarde au 31 décembre, et ce qu'un laboratoire y change. */
export interface VarianteDeLaStructure {
  /** Un emprunt nouveau, versé le 31 décembre. */
  emprunt: number;
  /** La baisse des enceintes vendues l'année suivante, en part (0,15 : 15 % de moins). */
  baisseDesVentes: number;
}

/**
 * LES RATIOS DE LA BANQUE. Sans variante, ceux du 31 décembre : les dettes financières (l'emprunt,
 * capital restant dû) rapportées à la capacité d'autofinancement de l'année, et les capitaux
 * propres rapportés aux ressources durables.
 *
 * Une variante regarde l'année suivante, celle où l'emprunt nouveau se rembourse :
 *   · HYPOTHÈSE : cette année rejoue l'exercice de la fiche (compteDuLycee), avec moins
 *     d'enceintes vendues (la baisse, arrondie à l'enceinte) et une année pleine d'intérêts sur
 *     l'emprunt nouveau, au taux du prêt de NOVA ; l'impôt se recalcule ;
 *   · les dettes financières et les ressources durables sont celles du 31 décembre, emprunt
 *     nouveau compris (bilanDuLycee) : la banque juge ce que l'entreprise doit au moment où elle
 *     prête, sans compter les remboursements à venir.
 */
export function structureFinanciere(f: FicheDeLExercice, v: Partial<VarianteDeLaStructure> = {}) {
  const emprunt = v.emprunt ?? 0;
  const baisse = v.baisseDesVentes ?? 0;
  const quantite = Math.round(enceintesDeLAnnee(f) * (1 - baisse));
  const varie = emprunt !== 0 || baisse !== 0;
  const k: CompteDuLycee = varie ? compteDuLycee(f, { quantite, interetsEnPlus: auCentime(emprunt * f.pret.tauxAnnuel) }) : compteDuLycee(f);
  const b: BilanDuLycee = bilanDuLycee(f, { emprunt });
  const dettesFinancieres = b.poste("emprunt");
  return {
    f,
    entreprise: f.entreprise,
    k,
    b,
    quantite,
    caf: k.caf,
    dettesFinancieres,
    capitauxPropres: b.capitauxPropres,
    ressourcesDurables: b.ressourcesDurables,
    /** Les années de capacité d'autofinancement qu'il faudrait pour rembourser les dettes financières. */
    capaciteDeRemboursement: dettesFinancieres / k.caf,
    /** La part des capitaux propres dans les ressources durables (0,709 pour 70,9 %). */
    independance: b.capitauxPropres / b.ressourcesDurables,
  };
}

export type StructureFinanciere = ReturnType<typeof structureFinanciere>;

/** La structure respecte-t-elle les deux règles des banques ? */
export const dansLesRegles = (s: StructureFinanciere) => s.caf > 0 && s.capaciteDeRemboursement <= CAPACITE_DE_REMBOURSEMENT_MAXIMALE && s.independance >= INDEPENDANCE_MINIMALE;

/**
 * L'emprunt nouveau le plus élevé que la capacité d'autofinancement de l'année permet : quatre années
 * de capacité, moins ce que l'entreprise doit déjà (à l'euro, par défaut).
 */
export const empruntPermisParLaCapacite = (s: StructureFinanciere) => Math.floor(CAPACITE_DE_REMBOURSEMENT_MAXIMALE * s.caf - s.dettesFinancieres + 1e-9);

/**
 * L'emprunt nouveau le plus élevé que l'indépendance financière permet : un emprunt s'ajoute aux
 * ressources durables sans toucher aux capitaux propres (à l'euro, par défaut).
 */
export const empruntPermisParLIndependance = (s: StructureFinanciere) => Math.floor(s.capitauxPropres / INDEPENDANCE_MINIMALE - s.ressourcesDurables + 1e-9);

/**
 * CE QUE LE BILAN NE MONTRE PAS : LES LOYERS À VENIR. NOVA loue son local (exercice-de-nova.ts,
 * 19 700 € par mois). HYPOTHÈSE DU COURS : le bail court encore au moins une année (un bail
 * commercial ne se quitte qu'à la fin de chaque période de trois ans). Ce loyer est une
 * obligation de payer, comme une échéance d'emprunt, mais il n'est pas au bilan : seul le loyer
 * passé est au compte de résultat.
 */
export const LOYERS_D_UNE_ANNEE = 12 * LOYER_DU_MOIS.montant;

// ─────────────────────────────────────────────────────────────────────────────
// 2. FINANCER AUTREMENT : LA LIGNE SEMI-AUTOMATIQUE DE N+1
// ─────────────────────────────────────────────────────────────────────────────

/** L'investissement à financer : la ligne semi-automatique de la gamme (monde/projets-et-financement.ts), hors taxes. */
export const LIGNE_SEMI_AUTOMATIQUE = PROJET_LIGNE_SEMI_AUTOMATIQUE.actifs[0]!;

/**
 * LA SUBVENTION D'INVESTISSEMENT (HYPOTHÈSE DU COURS) : la région aide une petite entreprise
 * industrielle qui s'équipe, à hauteur de 20 % du prix hors taxes de l'équipement, à condition de
 * le garder cinq ans et de créer l'emploi annoncé (l'opérateur de plus de la ligne). Elle n'est
 * pas remboursée si les conditions sont tenues ; elle se range avec les capitaux propres.
 */
export const TAUX_DE_LA_SUBVENTION = 0.2;

/** Les années pendant lesquelles NOVA doit garder l'équipement subventionné. */
export const DUREE_DE_L_ENGAGEMENT = 5;

/** Comment un financement se rembourse : en parts égales chaque année, ou en une fois à la fin (in fine), les intérêts payés chaque année. */
export type ModeDuFinancement = ModeDeRemboursement | "in-fine";

export interface ConditionsDuFinancement {
  code: "banque" | "compteCourant" | "participatif";
  nom: string;
  taux: number;
  dureeAns: number;
  mode: ModeDuFinancement;
  /** Le montant le plus élevé que cette source peut apporter, s'il y en a un. */
  plafond?: number;
}

/** LE PRÊT BANCAIRE : le taux du prêt de NOVA (5 %), sur cinq ans, le capital remboursé en parts égales chaque année. */
export const PRET_BANCAIRE = (f: FicheDeLExercice): ConditionsDuFinancement => ({ code: "banque", nom: "le prêt bancaire", taux: f.pret.tauxAnnuel, dureeAns: 5, mode: "amortissement-constant" });

/**
 * LE COMPTE COURANT D'ASSOCIÉ (HYPOTHÈSE DU COURS) : les associés prêtent à NOVA une part de leur
 * épargne, 40 000 € au plus, à 3 % l'an. Ils s'engagent à la laisser cinq ans (un compte courant
 * bloqué) ; NOVA la rembourse en une fois au bout des cinq ans. Le prêt ne leur donne aucune part
 * de capital de plus.
 */
export const COMPTE_COURANT: ConditionsDuFinancement = { code: "compteCourant", nom: "le compte courant d'associé", taux: 0.03, dureeAns: 5, mode: "in-fine", plafond: 40_000 };

/**
 * LE PRÊT PARTICIPATIF (HYPOTHÈSE DU COURS) : des particuliers prêtent à NOVA par une plateforme de
 * financement participatif, à 6 % l'an sur quatre ans, le capital remboursé en une fois à la fin.
 * C'est plus cher que la banque, mais rien ne se rembourse avant la quatrième année.
 */
export const PRET_PARTICIPATIF: ConditionsDuFinancement = { code: "participatif", nom: "le prêt participatif", taux: 0.06, dureeAns: 4, mode: "in-fine" };

/** Une année de remboursement : les intérêts, le capital remboursé, et ce qui sort de la trésorerie. */
export interface AnneeDeRemboursement {
  annee: number;
  interets: number;
  capital: number;
  total: number;
}

/**
 * LE TABLEAU DE REMBOURSEMENT d'un financement, année par année. En parts égales ou en
 * échéances constantes, c'est le tableau d'amortissement du cours (monde/emprunt.ts), une échéance
 * par an ; in fine, les intérêts sur tout le capital chaque année, et le capital la dernière.
 */
export function remboursements(c: Pick<ConditionsDuFinancement, "taux" | "dureeAns" | "mode">, montant: number): AnneeDeRemboursement[] {
  if (c.mode === "in-fine") {
    const interets = auCentime(montant * c.taux);
    return Array.from({ length: c.dureeAns }, (_, i) => {
      const capital = i === c.dureeAns - 1 ? montant : 0;
      return { annee: i + 1, interets, capital, total: auCentime(interets + capital) };
    });
  }
  const contrat = { capital: montant, tauxAnnuel: c.taux, dureeAns: c.dureeAns, echeancesParAn: 1, versement: { jour: 2, mois: 1, exercice: 1 }, premiereEcheance: { jour: 2, mois: 1, exercice: 2 }, mode: c.mode };
  return tableauDAmortissement(contrat, c.mode).map((l) => ({ annee: l.numero, interets: l.interets, capital: l.amortissement, total: l.echeance }));
}

/** Les intérêts de toute la durée, et ce qui sort de la trésorerie la première année. */
export function coutDuFinancement(c: Pick<ConditionsDuFinancement, "taux" | "dureeAns" | "mode">, montant: number) {
  const t = remboursements(c, montant);
  return { interets: auCentime(t.reduce((s, x) => s + x.interets, 0)), premiereAnnee: t[0]?.total ?? 0, tableau: t };
}

/**
 * CE QUE LES ASSOCIÉS VEULENT (HYPOTHÈSE DU COURS) :
 *   · la première année de la gamme est celle du lancement (les moules, la campagne, le besoin en
 *     fonds de roulement des chaînes de hi-fi) : les nouveaux financements ne doivent pas prendre
 *     plus de 16 000 € à la trésorerie cette année-là, intérêts et capital compris ;
 *   · sur toute la durée, ils acceptent de payer au plus 3 000 € d'intérêts de plus que si tout
 *     était emprunté à la banque.
 */
export const PREMIERE_ANNEE_MAXIMALE = 16_000;
export const SURCOUT_ACCEPTE = 3_000;

/** Un plan de financement de la ligne : ce que chaque source apporte, la banque prenant le reste. */
export interface PlanDeFinancement {
  compteCourant: number;
  participatif: number;
}

/** LE PLAN DE FINANCEMENT de la ligne, ses intérêts, sa première année, et ce que la banque en dira. */
export function planDeFinancement(f: FicheDeLExercice, p: Partial<PlanDeFinancement> = {}) {
  const prix = LIGNE_SEMI_AUTOMATIQUE.montant;
  const subvention = auCentime(prix * TAUX_DE_LA_SUBVENTION);
  const aFinancer = auCentime(prix - subvention);
  const compteCourant = p.compteCourant ?? 0;
  const participatif = p.participatif ?? 0;
  const banque = auCentime(aFinancer - compteCourant - participatif);
  const sources = [
    { c: PRET_BANCAIRE(f), montant: Math.max(0, banque) },
    { c: COMPTE_COURANT, montant: compteCourant },
    { c: PRET_PARTICIPATIF, montant: participatif },
  ].map((x) => ({ ...x, ...coutDuFinancement(x.c, x.montant) }));
  const toutALaBanque = coutDuFinancement(PRET_BANCAIRE(f), aFinancer);
  // Ce que la banque en dira, au 31 décembre, comme si tout était signé ce jour-là : la subvention
  // rejoint les capitaux propres ; le compte courant, le prêt participatif et le prêt bancaire
  // sont des dettes financières.
  const s = structureFinanciere(f);
  const dettesFinancieres = auCentime(s.dettesFinancieres + aFinancer);
  const capitauxPropres = auCentime(s.capitauxPropres + subvention);
  const ressourcesDurables = auCentime(s.ressourcesDurables + subvention + aFinancer);
  return {
    f,
    entreprise: f.entreprise,
    equipement: LIGNE_SEMI_AUTOMATIQUE.libelle,
    prix,
    subvention,
    aFinancer,
    compteCourant,
    participatif,
    banque,
    sources,
    interets: auCentime(sources.reduce((t, x) => t + x.interets, 0)),
    premiereAnnee: auCentime(sources.reduce((t, x) => t + x.premiereAnnee, 0)),
    interetsToutALaBanque: toutALaBanque.interets,
    premiereAnneeToutALaBanque: toutALaBanque.premiereAnnee,
    caf: s.caf,
    dettesAvant: s.dettesFinancieres,
    dettesFinancieres,
    capitauxPropres,
    ressourcesDurables,
    capaciteDeRemboursement: dettesFinancieres / s.caf,
    independance: capitauxPropres / ressourcesDurables,
    /** L'indépendance si toute la ligne était empruntée, sans subvention. */
    independanceSansSubvention: s.capitauxPropres / auCentime(s.ressourcesDurables + prix),
  };
}

export type PlanDeFinancementDeNova = ReturnType<typeof planDeFinancement>;

/** Le plan respecte-t-il ce que veulent les associés, avec des montants possibles ? */
export const planTenable = (x: PlanDeFinancementDeNova) =>
  x.banque >= 0 && x.compteCourant <= COMPTE_COURANT.plafond! && x.premiereAnnee <= PREMIERE_ANNEE_MAXIMALE && x.interets <= x.interetsToutALaBanque + SURCOUT_ACCEPTE;
