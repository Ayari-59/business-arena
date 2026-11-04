import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { auCentime } from "../monde/amortissement";
import { JOURS_DE_LA_BANQUE, JOURS_DU_MOIS_BANCAIRE } from "../monde/equilibre-de-tresorerie";
import {
  B,
  BESOIN_DE_JANVIER,
  CONDITIONS_DE_L_AFFACTURAGE,
  CONDITIONS_DU_DAILLY,
  EXCEDENT_DE_L_ETE,
  FACTURE_DE_DECEMBRE,
  FACTURE_DE_NOVEMBRE,
  PAS_DU_COMPTE_A_TERME,
  PLACEMENTS,
  RETRAIT_IMPREVU,
  TAUX_D_IMPOT_DES_PLACEMENTS,
  affacturage,
  coutDeLEscompteExact,
  creditDUnMois,
  creditRenouvele,
  dailly,
  escompte,
  garantieSurSonora,
  joursDEscompteAvantageux,
  meilleurePart,
  placement,
  type PositionDuPlacement,
} from "../monde/financer-et-placer";
import { INVESTISSEMENT_DE_LA_GAMME } from "../monde/structure-financiere";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : FINANCER ET PLACER LA TRÉSORERIE (comptabilité générale, palier 4 ; BTS CG P6, 6.4.2 et
 * 6.5.1 ; DCG UE6, 5.1).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : NOVA en N+1, avec la banque du chapitre « Équilibrer la
 * trésorerie » et les factures de CampusTech et de Sonora de son premier exercice. Tous les chiffres se
 * calculent dans monde/financer-et-placer.ts.
 *
 * L'objet : deux moments de N+1. En janvier, la TVA de la gamme avancée pendant 60 jours : quel outil
 * pour quel besoin (découvert, facilité de caisse, crédit de trésorerie), ce que coûtent un crédit
 * renouvelé, l'escompte d'un effet, une cession Dailly et l'affacturage, en euros et en taux réel, et
 * ce que la garantie d'un factor aurait évité sur Sonora. En été, un excédent à placer : le rendement
 * après impôt, la disponibilité, et le prix d'un retrait imprévu.
 *
 * LES TROIS TEMPS (le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, le-bon-outil, le-credit-renouvele, l-escompte-et-son-taux-reel,
 *     le-compte-a-terme (la formule est dans la question) ;
 *   · l'expérience avant la formule : predire-l-escompte puis l-escompte-au-curseur (un effet à j jours
 *     de son échéance face au crédit d'un mois) avant l-escompte-et-son-taux-reel ; predire-le-retrait
 *     puis le-laboratoire-du-placement (la part au compte à terme, un retrait imprévu et son jour ; un
 *     graphique des intérêts selon la part bloquée) ;
 *   · autonome : le-dailly-sans-aide, l-affacturage-sans-aide, la-garantie-de-sonora ;
 *   · expert : escompte-ou-dailly, predire-la-garantie, des-actions-pour-la-tresorerie ; puis la synthèse.
 */

/** Le placement se joue chez NOVA. */
export const ENTREPRISES_DU_FINANCEMENT: readonly string[] = ["nova"];

/** Les bornes du curseur : les jours qui restent avant l'échéance de l'effet. */
export const JOURS_DU_CURSEUR = { min: 1, max: 30 } as const;

/** Les leviers du laboratoire du placement. */
export const LEVIERS_DU_PLACEMENT = {
  compteATerme: { min: 0, max: EXCEDENT_DE_L_ETE.montant, pas: PAS_DU_COMPTE_A_TERME },
  retrait: { min: 0, max: 60_000, pas: 10_000 },
  jour: { min: 30, max: 150, pas: 30 },
} as const;

/** Le départ du laboratoire : tout au compte à terme, aucun retrait. */
export const DEPART_DU_PLACEMENT: PositionDuPlacement = { compteATerme: EXCEDENT_DE_L_ETE.montant, retrait: 0, jour: RETRAIT_IMPREVU.jour };

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
/** Un taux réel, déjà en pour cent. */
const enPct = (x: number) => `${qte(x)} %`;
const jours = (n: number) => `${qte(n)} jour${n >= 2 ? "s" : ""}`;

const position = (p: Readonly<Record<string, number>>): PositionDuPlacement => ({ compteATerme: p.compteATerme ?? 0, retrait: p.retrait ?? 0, jour: p.jour ?? RETRAIT_IMPREVU.jour });

/** Tous les chiffres du chapitre. */
export function financementDuChapitre(_c: Pick<Cas, "code">) {
  const besoin = BESOIN_DE_JANVIER;
  const dec = FACTURE_DE_DECEMBRE;
  const nov = FACTURE_DE_NOVEMBRE;
  return {
    besoin,
    credit: creditRenouvele(besoin.montant, besoin.jours),
    dec,
    nov,
    escompteDec: escompte(dec.ttc, dec.jours),
    escompteNov: escompte(nov.ttc, nov.jours),
    daillyDec: dailly(dec.ttc, dec.jours),
    affacturageDec: affacturage(dec.ttc, dec.jours),
    creditDUnMois: creditDUnMois(dec.ttc),
    joursMax: joursDEscompteAvantageux(dec.ttc),
    sonora: garantieSurSonora(),
    excedent: EXCEDENT_DE_L_ETE,
    toutAuCompte: placement({ compteATerme: EXCEDENT_DE_L_ETE.montant, retrait: 0, jour: RETRAIT_IMPREVU.jour }),
    toutAuFonds: placement({ compteATerme: 0, retrait: 0, jour: RETRAIT_IMPREVU.jour }),
    toutAuCompteAvecRetrait: placement({ compteATerme: EXCEDENT_DE_L_ETE.montant, retrait: RETRAIT_IMPREVU.montant, jour: RETRAIT_IMPREVU.jour }),
    toutAuFondsAvecRetrait: placement({ compteATerme: 0, retrait: RETRAIT_IMPREVU.montant, jour: RETRAIT_IMPREVU.jour }),
    meilleure: meilleurePart(RETRAIT_IMPREVU.montant, RETRAIT_IMPREVU.jour),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES TABLEAUX
// ─────────────────────────────────────────────────────────────────────────────

/** Ce que la banque et le factor proposent. */
function lesConditions(): TableauDeDonnees {
  const D = CONDITIONS_DU_DAILLY;
  const A = CONDITIONS_DE_L_AFFACTURAGE;
  return {
    titre: "Ce que proposent la banque et le factor",
    colonnes: ["Conditions"],
    lignes: [
      { libelle: "Découvert autorisé, facilité de caisse comprise", valeurs: [`jusqu'à ${eur(B.decouvert.autorise)}, ${pct(B.decouvert.tauxAnnuel)} l'an`] },
      { libelle: "Crédit de trésorerie d'un mois", valeurs: [`par tranches de ${eur(B.credit.tranche)}, ${pct(B.credit.tauxAnnuel)} l'an, ${eur(B.credit.frais)} de frais à chaque mise en place`] },
      { libelle: "Escompte d'un effet accepté", valeurs: [`${pct(B.escompte.tauxAnnuel)} l'an jusqu'à l'échéance, ${eur(B.escompte.commission)} par effet`] },
      { libelle: "Cession Dailly", valeurs: [`${pct(D.tauxAnnuel)} l'an jusqu'à l'échéance, ${eur(D.fraisParBordereau)} par bordereau`] },
      { libelle: "Affacturage", valeurs: [`${pct(A.commission)} du TTC, retenue de ${pct(A.retenueDeGarantie)}, ${pct(A.tauxDeFinancement)} l'an sur l'avance`] },
    ],
  };
}

/** Les factures de CampusTech que NOVA peut mobiliser le 10 janvier. */
function lesFactures(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = financementDuChapitre(c);
  return {
    titre: "Les factures de CampusTech dues après le 10 janvier",
    colonnes: ["Montant TTC", "Échéance"],
    lignes: [
      { libelle: "Facture du 20 novembre", valeurs: [eur(x.nov.ttc), `10 février, à ${jours(x.nov.jours)}`] },
      { libelle: "Facture du 20 décembre", valeurs: [eur(x.dec.ttc), `10 mars, à ${jours(x.dec.jours)}`] },
    ],
  };
}

/** Les placements de l'été. */
function lesPlacements(): TableauDeDonnees {
  const P = PLACEMENTS;
  return {
    titre: `Où placer ${eur(EXCEDENT_DE_L_ETE.montant)} pendant ${jours(EXCEDENT_DE_L_ETE.jours)}`,
    colonnes: ["Rendement", "Disponibilité"],
    lignes: [
      { libelle: "Compte à terme de 6 mois", valeurs: [`${pct(P.compteATerme.tauxAnnuel)} l'an, garanti`, `bloqué ; rompu, ${pct(P.compteATerme.tauxSiRompu)} l'an`] },
      { libelle: "Fonds monétaire", valeurs: [`${pct(P.opcvm.tauxAnnuel)} l'an attendu`, "le lendemain"] },
      { libelle: "Actions cotées", valeurs: [`${pct(P.actions.rendementAttendu)} l'an attendu, capital non garanti`, "en quelques jours, au cours du moment"] },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

export const FINANCER_ET_PLACER: Chapitre = {
  code: "financer-et-placer-la-tresorerie",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: ["BTS CG P6 · Analyse de la situation financière", "DCG UE6 · Finance d'entreprise"],
  titre: "Financer et placer la trésorerie",
  accroche:
    "En janvier, NOVA avance la TVA de sa gamme pour quelques semaines : découvert, crédit, escompte, Dailly ou affacturage, lequel et à quel coût réel ? En été, l'argent dort : où le placer sans se priver de le reprendre ?",
  objectifs: [
    "Choisir l'outil de financement à court terme qui convient à un besoin : découvert, facilité de caisse, crédit de trésorerie, escompte, Dailly, affacturage",
    "Calculer le coût d'un crédit de trésorerie renouvelé",
    "Calculer le coût, le net et le taux réel d'un escompte, d'une cession Dailly et d'un affacturage, et les comparer",
    "Choisir un placement selon son rendement après impôt, son risque et sa disponibilité, et chiffrer un retrait anticipé",
  ],
  libre: false,
  prerequis: ["equilibrer-la-tresorerie", "ratios-de-structure-et-bilan-financier"],
  entreprises: {
    codes: ENTREPRISES_DU_FINANCEMENT,
    pourquoi: "le financement et le placement de la trésorerie se jouent ici sur NOVA en N+1, dans la simulation du cours, avec sa banque et ses clients ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un besoin en janvier, un excédent en été",
      notions: ["cash_budget", "vat_payable"],
      tableau: lesConditions,
      texte: (c) => {
        const x = financementDuChapitre(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez NOVA, en N+1. Début janvier, NOVA paie la gamme : la ligne semi-automatique et ses moules, ${eur(INVESTISSEMENT_DE_LA_GAMME)} hors taxes, financés durablement par la réserve et un emprunt, comme au laboratoire du chapitre précédent.`,
          `Reste leur TVA, ${eur(x.besoin.montant)}, payée le 10 janvier et remboursée par l'État le 10 mars : un besoin de ${jours(x.besoin.jours)}. Un besoin court se finance à court terme ; c'est la première partie.`,
          `En été, la gamme se vend : de juillet à décembre, ${eur(x.excedent.montant)} attendent l'an prochain. C'est la seconde partie, placer.`,
          `La simulation suppose : la banque du chapitre « Équilibrer la trésorerie », l'année de ${JOURS_DE_LA_BANQUE} jours et des mois de ${JOURS_DU_MOIS_BANCAIRE} jours, et les conditions du tableau. Le laboratoire ajoute les siennes, dites à chaque fois.`,
        ];
      },
      repere: () =>
        "Intérêts = capital × taux × jours ÷ 360. Agio d'escompte = nominal × taux × jours ÷ 360. Taux réel = coût total ÷ somme reçue au départ × 360 ÷ jours.",
    },
    {
      id: "le-bon-outil",
      objectifs: [0],
      type: "choix",
      titre: "Le bon outil pour ce besoin",
      notions: ["cash_budget", "receivables_financing"],
      tableau: lesConditions,
      question: (c) => {
        const x = financementDuChapitre(c);
        return `Il faut ${eur(x.besoin.montant)} pendant ${jours(x.besoin.jours)}, et l'État rendra la somme à date connue. Quel outil la banque propose-t-elle d'abord ?`;
      },
      options: () => [
        {
          texte: "Un crédit de trésorerie, renouvelé une fois",
          juste: true,
          retour: `Oui. Il couvre un besoin ponctuel au montant près, à la tranche près, pour la durée qu'il faut. Le découvert autorisé s'arrête à ${eur(B.decouvert.autorise)}. La facilité de caisse est ce même découvert utilisé quelques jours par mois, quand les paiements précèdent les encaissements.`,
        },
        {
          texte: "Le découvert : c'est le plus simple, le compte passe sous zéro et se rétablit tout seul",
          juste: false,
          retour: `Non : il est autorisé jusqu'à ${eur(B.decouvert.autorise)}. Au-delà, la banque rejette les paiements. Et à ${pct(B.decouvert.tauxAnnuel)}, c'est le plus cher.`,
        },
        {
          texte: "Un contrat d'affacturage, signé pour couvrir ces semaines-là",
          juste: false,
          retour: "Non : l'affacturage cède toutes les factures, sur la durée du contrat, avec leur gestion. C'est une façon de travailler avec ses clients, pas l'outil d'un besoin passager.",
        },
      ],
    },
    {
      id: "le-credit-renouvele",
      objectifs: [1],
      type: "montants",
      titre: "Le crédit de trésorerie, renouvelé",
      notions: ["cash_budget", "loan_schedule"],
      question: (c) => {
        const x = financementDuChapitre(c);
        return `Le 10 janvier, NOVA emprunte pour un mois, par tranches de ${eur(B.credit.tranche)}, de quoi couvrir les ${eur(x.besoin.montant)} et les ${eur(B.credit.frais)} de frais. Le 10 février, elle rembourse capital et intérêts, et emprunte de nouveau la même tranche. Calculez le crédit, les intérêts d'un mois à ${pct(B.credit.tauxAnnuel)}, le coût total des crédits, frais compris, puis le taux réel, au centième, sur ce que NOVA reçoit le 10 janvier.`;
      },
      champs: (c) => {
        const x = financementDuChapitre(c);
        const k = x.credit;
        const premier = k.credits[0]!;
        return [
          { libelle: "Crédit, à la tranche supérieure", attendu: premier.montant, calcul: `${eur(x.besoin.montant)} + ${eur(B.credit.frais)} = ${eur(x.besoin.montant + B.credit.frais)}, soit ${eur(premier.montant)}` },
          { libelle: "Intérêts d'un mois", attendu: premier.interets, calcul: `${eur(premier.montant)} × ${pct(B.credit.tauxAnnuel)} × ${JOURS_DU_MOIS_BANCAIRE} ÷ ${JOURS_DE_LA_BANQUE} = ${eur(premier.interets)}` },
          { libelle: "Coût des crédits", attendu: k.cout, calcul: `${k.credits.map((y) => eur(y.interets)).join(" + ")} d'intérêts + ${eur(k.frais)} de frais = ${eur(k.cout)}` },
          { libelle: "Taux réel, en %", attendu: k.tauxReel, calcul: `${eur(k.cout)} ÷ ${eur(k.recu)} reçus × ${JOURS_DE_LA_BANQUE} ÷ ${x.besoin.jours} = ${enPct(k.tauxReel)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = financementDuChapitre(c);
        return [
          `Le taux affiché est de ${pct(B.credit.tauxAnnuel)}, le taux réel de ${enPct(x.credit.tauxReel)} : les frais fixes, payés à chaque mise en place, pèsent sur un crédit court. Le taux réel est la mesure qui compare des financements de formes différentes.`,
        ];
      },
    },
    {
      id: "predire-l-escompte",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur l'escompte",
      notions: ["receivables_financing"],
      tableau: lesFactures,
      question: (c) => {
        const x = financementDuChapitre(c);
        return `Avant de calculer, pariez. NOVA a besoin de ${eur(x.dec.ttc)} pour un mois. Elle peut escompter la facture de novembre, due dans ${jours(x.nov.jours)}, à ${pct(B.escompte.tauxAnnuel)}, ou emprunter ${eur(x.creditDUnMois.montant)} pour un mois à ${pct(B.credit.tauxAnnuel)}. Lequel coûte le moins ?`;
      },
      options: () => {
        const voir = "Faites varier les jours qui restent avant l'échéance à l'étape suivante.";
        return [
          { texte: "Le crédit, pour cette facture-là", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Le crédit, toujours : son taux est plus bas", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "L'escompte, toujours : il ne demande aucun remboursement", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "l-escompte-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "L'escompte face au crédit, au curseur",
      notions: ["receivables_financing"],
      question: (c) => {
        const x = financementDuChapitre(c);
        return `Faites varier les jours qui restent avant l'échéance d'un effet de ${eur(x.dec.ttc)}, de ${qte(JOURS_DU_CURSEUR.min)} à ${qte(JOURS_DU_CURSEUR.max)}. Une droite donne le coût du crédit d'un mois de ${eur(x.creditDUnMois.montant)}, frais compris ; l'autre le coût de l'escompte, agio et commission. Jusqu'à combien de jours l'escompte coûte-t-il au plus le crédit ? Placez le curseur au jour près.`;
      },
      grandeur: () => ({ libelle: "Jours avant l'échéance de l'effet", unite: "jours" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: financementDuChapitre(c).joursMax, min: JOURS_DU_CURSEUR.min, max: JOURS_DU_CURSEUR.max }),
      zones: ["Escompte moins cher", "Crédit moins cher"],
      rates: () => ({
        dessous: "Plus loin de l'échéance, l'escompte reste moins cher : cherchez le nombre de jours le plus grand.",
        dessus: "À ce nombre de jours, l'agio et la commission dépassent le coût du crédit.",
      }),
      montrer: "Montrer les jours",
      lecture: (c, j) => {
        const x = financementDuChapitre(c);
        const e = escompte(x.dec.ttc, j);
        return [
          { libelle: "Agio d'escompte", montant: e.agio },
          { libelle: "Coût de l'escompte, commission comprise", montant: e.cout, fort: true },
          { libelle: "Coût du crédit d'un mois, frais compris", montant: x.creditDUnMois.cout },
        ];
      },
      droites: (c) => {
        const x = financementDuChapitre(c);
        return { produit: () => x.creditDUnMois.cout, cout: (j) => coutDeLEscompteExact(x.dec.ttc, j), libelles: ["Coût du crédit d'un mois", "Coût de l'escompte"] };
      },
      explication: (c) => {
        const x = financementDuChapitre(c);
        return [
          `Le crédit coûte ${eur(x.creditDUnMois.cout)} quel que soit le jour : ${eur(x.creditDUnMois.interets)} d'intérêts sur un mois et ${eur(B.credit.frais)} de frais. L'escompte coûte ${eur(B.escompte.commission)} plus un agio qui grandit chaque jour. Jusqu'à ${jours(x.joursMax)}, l'escompte l'emporte malgré son taux plus élevé.`,
          `La facture de novembre, à ${jours(x.nov.jours)}, coûterait ${eur(x.escompteNov.cout)} : le crédit gagne. Un taux affiché ne suffit pas à comparer ; il faut le coût total, rapporté à ce qu'on reçoit et à la durée.`,
        ];
      },
    },
    {
      id: "l-escompte-et-son-taux-reel",
      objectifs: [2],
      type: "montants",
      titre: "L'escompte et son taux réel",
      notions: ["receivables_financing"],
      tableau: lesFactures,
      question: (c) => {
        const x = financementDuChapitre(c);
        return `CampusTech accepte une lettre de change sur sa facture de décembre, ${eur(x.dec.ttc)}, payable le 10 mars. NOVA la remet à l'escompte le 10 janvier, à ${jours(x.dec.jours)} de l'échéance. Calculez l'agio à ${pct(B.escompte.tauxAnnuel)}, le coût total avec la commission de ${eur(B.escompte.commission)}, le net versé par la banque, puis le taux réel au centième.`;
      },
      champs: (c) => {
        const x = financementDuChapitre(c);
        const e = x.escompteDec;
        return [
          { libelle: "Agio", attendu: e.agio, calcul: `${eur(e.nominal)} × ${pct(B.escompte.tauxAnnuel)} × ${e.jours} ÷ ${JOURS_DE_LA_BANQUE} = ${eur(e.agio)}` },
          { libelle: "Coût de l'escompte", attendu: e.cout, calcul: `${eur(e.agio)} + ${eur(e.commission)} = ${eur(e.cout)}` },
          { libelle: "Net versé", attendu: e.net, calcul: `${eur(e.nominal)} − ${eur(e.cout)} = ${eur(e.net)}` },
          { libelle: "Taux réel de l'escompte, en %", attendu: e.tauxReel, calcul: `${eur(e.cout)} ÷ ${eur(e.net)} × ${JOURS_DE_LA_BANQUE} ÷ ${e.jours} = ${enPct(e.tauxReel)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = financementDuChapitre(c);
        return [
          `L'agio est retenu d'avance, sur le nominal, et la commission s'y ajoute : le taux réel, ${enPct(x.escompteDec.tauxReel)}, dépasse le taux affiché de ${pct(B.escompte.tauxAnnuel)}. L'escompte n'apporte que ${eur(x.escompteDec.net)} : il ne couvre pas, seul, le besoin de ${eur(x.besoin.montant)}.`,
        ];
      },
    },
    {
      id: "le-dailly-sans-aide",
      objectifs: [2],
      type: "montants",
      titre: "La cession Dailly, sans aide",
      notions: ["receivables_financing"],
      tableau: lesConditions,
      question: (c) => {
        const x = financementDuChapitre(c);
        return `À vous, sans formule cette fois. Au lieu de l'escompte, NOVA cède à la banque la même facture de décembre par un bordereau Dailly, le 10 janvier, à ${jours(x.dec.jours)} de l'échéance. Calculez les intérêts, le coût total, le net reçu, puis le taux réel au centième.`;
      },
      champs: (c) => {
        const x = financementDuChapitre(c);
        const d = x.daillyDec;
        return [
          { libelle: "Intérêts du Dailly", attendu: d.interets, calcul: `${eur(d.nominal)} × ${pct(CONDITIONS_DU_DAILLY.tauxAnnuel)} × ${d.jours} ÷ ${JOURS_DE_LA_BANQUE} = ${eur(d.interets)}` },
          { libelle: "Coût du Dailly", attendu: d.cout, calcul: `${eur(d.interets)} + ${eur(d.frais)} de frais de bordereau = ${eur(d.cout)}` },
          { libelle: "Net reçu", attendu: d.net, calcul: `${eur(d.nominal)} − ${eur(d.cout)} = ${eur(d.net)}` },
          { libelle: "Taux réel du Dailly, en %", attendu: d.tauxReel, calcul: `${eur(d.cout)} ÷ ${eur(d.net)} × ${JOURS_DE_LA_BANQUE} ÷ ${d.jours} = ${enPct(d.tauxReel)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = financementDuChapitre(c);
        return [`Le Dailly revient à ${enPct(x.daillyDec.tauxReel)}, plus que l'escompte, ${enPct(x.escompteDec.tauxReel)} : la banque n'a pas d'effet accepté, elle se rémunère du risque. Mais il ne demande rien au client.`];
      },
    },
    {
      id: "escompte-ou-dailly",
      objectifs: [0],
      type: "choix",
      titre: "Escompte ou Dailly",
      notions: ["receivables_financing", "payment_terms"],
      question: () => "Le Dailly coûte plus cher que l'escompte. Dans quel cas NOVA le choisirait-elle quand même ?",
      options: () => [
        {
          texte: "Quand le client refuse d'accepter une lettre de change",
          juste: true,
          retour: "Oui. L'escompte demande un effet accepté par le client : il s'engage à payer la banque à l'échéance. La cession Dailly se fait par un simple bordereau, sans l'accord du client. Dans les deux cas, si le client ne paie pas, la banque se retourne contre NOVA.",
        },
        {
          texte: "Quand NOVA craint que le client ne paie pas : le Dailly transfère le risque à la banque",
          juste: false,
          retour: "Non : NOVA reste garante du paiement. Seul l'affacturage avec garantie transfère le risque d'impayé, au factor.",
        },
        {
          texte: "Jamais : un financement plus cher n'a pas de raison d'être choisi",
          juste: false,
          retour: "Non : un financement se choisit aussi sur ce qu'il demande. Une chaîne de magasins qui refuse toute lettre de change ferme la porte de l'escompte.",
        },
      ],
    },
    {
      id: "l-affacturage-sans-aide",
      objectifs: [2],
      type: "montants",
      titre: "L'affacturage, sans aide",
      notions: ["receivables_financing", "payment_terms"],
      tableau: lesConditions,
      question: (c) => {
        const x = financementDuChapitre(c);
        return `À vous, sans formule cette fois. NOVA cède la facture de décembre à un factor le 10 janvier, à ${jours(x.dec.jours)} de l'échéance. Calculez l'avance, une fois la retenue de garantie ôtée, la commission de financement, la commission d'affacturage, ce que le factor verse, puis le taux réel au centième.`;
      },
      champs: (c) => {
        const x = financementDuChapitre(c);
        const a = x.affacturageDec;
        const A = CONDITIONS_DE_L_AFFACTURAGE;
        return [
          { libelle: "Avance", attendu: a.avance, calcul: `${eur(a.ttc)} − ${eur(a.retenue)} de retenue (${pct(A.retenueDeGarantie)}) = ${eur(a.avance)}` },
          { libelle: "Commission de financement", attendu: a.financement, calcul: `${eur(a.avance)} × ${pct(A.tauxDeFinancement)} × ${a.jours} ÷ ${JOURS_DE_LA_BANQUE} = ${eur(a.financement)}` },
          { libelle: "Commission d'affacturage", attendu: a.commission, calcul: `${eur(a.ttc)} × ${pct(A.commission)} = ${eur(a.commission)}` },
          { libelle: "Versé par le factor", attendu: a.verse, calcul: `${eur(a.avance)} − ${eur(a.financement)} − ${eur(a.commission)} = ${eur(a.verse)}` },
          { libelle: "Taux réel de l'affacturage, en %", attendu: a.tauxReel, calcul: `${eur(a.cout)} ÷ ${eur(a.verse)} × ${JOURS_DE_LA_BANQUE} ÷ ${a.jours} = ${enPct(a.tauxReel)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = financementDuChapitre(c);
        const a = x.affacturageDec;
        return [
          `L'affacturage est le plus cher, ${enPct(a.tauxReel)} : la commission d'affacturage paie un service, la tenue du compte client, le recouvrement et la garantie de l'impayé. La retenue, ${eur(a.retenue)}, revient à NOVA quand CampusTech paie.`,
          "Pour un client sûr comme CampusTech, payer une garantie n'a guère de sens. Pour un client nouveau, c'est autre chose.",
        ];
      },
    },
    {
      id: "predire-la-garantie",
      objectifs: [0],
      type: "choix",
      titre: "Pariez sur la garantie",
      notions: ["receivables_financing"],
      question: (c) => {
        const x = financementDuChapitre(c);
        return `Souvenez-vous de Sonora : en N+1, le liquidateur ne verse que ${pct(x.sonora.partEncaissee)} de sa facture d'octobre. Si NOVA avait cédé ses deux factures de Sonora à un factor avec garantie, pariez : la commission aurait-elle valu la peine ?`;
      },
      options: () => {
        const voir = "Faites le compte à l'étape suivante.";
        return [
          { texte: "Oui, de loin", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Non : la commission aurait coûté autant que la perte", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Non : la garantie ne joue pas pour un client en redressement", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-garantie-de-sonora",
      objectifs: [2],
      type: "montants",
      titre: "Ce que la garantie aurait évité",
      notions: ["receivables_financing", "payment_terms"],
      question: (c) => {
        const x = financementDuChapitre(c);
        return `Les deux factures de Sonora font ${eur(x.sonora.factures)} TTC. Le factor les aurait agréées. Calculez la commission d'affacturage à ${pct(CONDITIONS_DE_L_AFFACTURAGE.commission)}, puis la perte hors taxes que NOVA subit sans factor : la moitié non payée de la facture d'octobre, hors taxes, la TVA de la part perdue étant récupérée. Enfin, ce que la garantie aurait épargné, commission payée.`;
      },
      champs: (c) => {
        const x = financementDuChapitre(c);
        const g = x.sonora;
        return [
          { libelle: "Commission d'affacturage", attendu: g.commission, calcul: `${eur(g.factures)} × ${pct(CONDITIONS_DE_L_AFFACTURAGE.commission)} = ${eur(g.commission)}` },
          { libelle: "Perte hors taxes sans factor", attendu: g.perteHt, calcul: `${eur(auCentime(g.perteHt / (1 - g.partEncaissee)))} HT × ${pct(1 - g.partEncaissee)} = ${eur(g.perteHt)}` },
          { libelle: "Épargné par la garantie", attendu: g.gain, calcul: `${eur(g.perteHt)} − ${eur(g.commission)} = ${eur(g.gain)}` },
        ];
      },
      explication: (c) => {
        const x = financementDuChapitre(c);
        return [
          `${eur(x.sonora.commission)} de commission contre ${eur(x.sonora.perteHt)} de perte : la garantie d'un factor se paie peu face au risque d'un client nouveau. C'est pour ces clients-là que l'affacturage se justifie, plus que pour CampusTech.`,
        ];
      },
    },
    {
      id: "le-compte-a-terme",
      objectifs: [3],
      type: "montants",
      titre: "Le compte à terme et le fonds monétaire",
      notions: ["net_treasury"],
      tableau: lesPlacements,
      question: (c) => {
        const x = financementDuChapitre(c);
        return `L'été venu, NOVA place ${eur(x.excedent.montant)} pendant ${jours(x.excedent.jours)}. Calculez les intérêts du compte à terme de 6 mois, puis ce qu'il en reste après l'impôt sur les sociétés à ${pct(TAUX_D_IMPOT_DES_PLACEMENTS)}. Faites de même pour le fonds monétaire.`;
      },
      champs: (c) => {
        const x = financementDuChapitre(c);
        const E = x.excedent;
        return [
          { libelle: "Intérêts du compte à terme", attendu: x.toutAuCompte.total, calcul: `${eur(E.montant)} × ${pct(PLACEMENTS.compteATerme.tauxAnnuel)} × ${E.jours} ÷ ${JOURS_DE_LA_BANQUE} = ${eur(x.toutAuCompte.total)}` },
          { libelle: "Compte à terme, après impôt", attendu: x.toutAuCompte.apresImpot, calcul: `${eur(x.toutAuCompte.total)} × (1 − ${pct(TAUX_D_IMPOT_DES_PLACEMENTS)}) = ${eur(x.toutAuCompte.apresImpot)}` },
          { libelle: "Intérêts du fonds monétaire", attendu: x.toutAuFonds.total, calcul: `${eur(E.montant)} × ${pct(PLACEMENTS.opcvm.tauxAnnuel)} × ${E.jours} ÷ ${JOURS_DE_LA_BANQUE} = ${eur(x.toutAuFonds.total)}` },
          { libelle: "Fonds monétaire, après impôt", attendu: x.toutAuFonds.apresImpot, calcul: `${eur(x.toutAuFonds.total)} × (1 − ${pct(TAUX_D_IMPOT_DES_PLACEMENTS)}) = ${eur(x.toutAuFonds.apresImpot)}` },
        ];
      },
      explication: (c) => {
        const x = financementDuChapitre(c);
        return [
          `Le compte à terme rapporte ${eur(auCentime(x.toutAuCompte.apresImpot - x.toutAuFonds.apresImpot))} de plus après impôt, si l'argent reste 6 mois. C'est le prix de la disponibilité : le fonds se reprend le lendemain, le compte à terme non.`,
        ];
      },
    },
    {
      id: "predire-le-retrait",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur un retrait imprévu",
      notions: ["net_treasury"],
      tableau: lesPlacements,
      question: () =>
        `Avant le laboratoire, pariez. Tout est au compte à terme, et ${eur(RETRAIT_IMPREVU.montant)} doivent sortir le ${RETRAIT_IMPREVU.jour}e jour pour servir un client en urgence. Le compte est rompu en entier ; ce qui reste rejoint le fonds monétaire. Sur les 6 mois, NOVA gagne…`,
      options: () => {
        const voir = "Faites-le dans le laboratoire, à l'étape suivante.";
        return [
          { texte: "Moins qu'avec tout au fonds", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Plus qu'avec tout au fonds : son taux est plus haut", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Autant : la pénalité ne porte que sur la somme retirée", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-du-placement",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire du placement",
      notions: ["net_treasury", "cash_budget"],
      question: () =>
        `Faites varier la part de l'excédent placée au compte à terme, le reste allant au fonds monétaire, puis un retrait imprévu et son jour. Un retrait se prend d'abord sur le fonds ; s'il ne suffit pas, le compte à terme est rompu. Le graphique suit les intérêts selon la part bloquée, avec ce retrait et sans retrait. Relevez le défi.`,
      leviers: () => {
        const L = LEVIERS_DU_PLACEMENT;
        const d = DEPART_DU_PLACEMENT;
        return [
          { code: "compteATerme", libelle: "Part placée au compte à terme", unite: "€", ...L.compteATerme, depart: d.compteATerme },
          { code: "retrait", libelle: "Retrait imprévu", unite: "€", ...L.retrait, depart: d.retrait },
          { code: "jour", libelle: "Jour du retrait", unite: "jours", ...L.jour, depart: d.jour },
        ];
      },
      lecture: (_c, p) => {
        const x = placement(position(p));
        const d = placement(DEPART_DU_PLACEMENT);
        return [
          { libelle: "Intérêts du compte à terme", montant: x.interetsDuCompte, reference: d.interetsDuCompte },
          { libelle: "Intérêts du fonds monétaire", montant: x.interetsDuFonds, reference: d.interetsDuFonds },
          { libelle: "Intérêts avant impôt", montant: x.total, reference: d.total, fort: true },
          { libelle: "Intérêts après impôt", montant: x.apresImpot, reference: d.apresImpot },
          { libelle: "Effet sur les intérêts", montant: auCentime(x.total - d.total), reference: 0, effet: true },
        ];
      },
      graphique: () => ({
        levier: "compteATerme",
        courbes: [
          { libelle: "Intérêts, avec ce retrait", valeur: (p) => placement(position(p)).total },
          { libelle: "Intérêts, sans retrait", valeur: (p) => placement({ ...position(p), retrait: 0 }).total },
        ],
      }),
      defi: (c) => {
        const x = financementDuChapitre(c);
        return {
          consigne: `Le dirigeant craint un retrait de ${eur(RETRAIT_IMPREVU.montant)} dès le ${RETRAIT_IMPREVU.jour}e jour. Réglez ce retrait, puis trouvez la part au compte à terme qui rapporte le plus dans ce cas.`,
          atteint: (p) => {
            const q = position(p);
            return q.retrait === RETRAIT_IMPREVU.montant && q.jour === RETRAIT_IMPREVU.jour && placement(q).total >= x.meilleure.total - 1e-9;
          },
          indice: (p) => {
            const q = position(p);
            if (q.retrait !== RETRAIT_IMPREVU.montant || q.jour !== RETRAIT_IMPREVU.jour) return `Placez d'abord le retrait à ${eur(RETRAIT_IMPREVU.montant)} et son jour au ${RETRAIT_IMPREVU.jour}e.`;
            const r = placement(q);
            if (r.rompu) return `Le compte à terme est rompu : le fonds, ${eur(r.fonds)}, ne suffit pas au retrait. Bloquez moins.`;
            return `Les intérêts valent ${eur(r.total)}. Le compte à terme rapporte plus que le fonds tant qu'il n'est pas rompu : bloquez plus, sans le rompre.`;
          },
          solution: { compteATerme: x.meilleure.compteATerme, retrait: RETRAIT_IMPREVU.montant, jour: RETRAIT_IMPREVU.jour },
        };
      },
      explication: (c) => {
        const x = financementDuChapitre(c);
        const E = x.excedent;
        return [
          `Défi relevé : ${eur(x.meilleure.compteATerme)} au compte à terme, ${eur(E.montant - x.meilleure.compteATerme)} au fonds, ${eur(x.meilleure.total)} d'intérêts avant impôt. On bloque ce dont on est sûr de ne pas avoir besoin, et on garde disponible ce qui pourrait sortir.`,
          `Tout bloquer rapporterait ${eur(x.toutAuCompte.total)} sans retrait, mais ${eur(x.toutAuCompteAvecRetrait.total)} avec : moins que tout au fonds, ${eur(x.toutAuFondsAvecRetrait.total)}. Le graphique tombe d'une marche dès que la part bloquée dépasse ce que le fonds peut rendre.`,
        ];
      },
    },
    {
      id: "des-actions-pour-la-tresorerie",
      objectifs: [3],
      type: "choix",
      titre: "Des actions pour la trésorerie ?",
      notions: ["net_treasury"],
      tableau: lesPlacements,
      question: () =>
        `Un associé s'étonne : « Des actions rapportent ${pct(PLACEMENTS.actions.rendementAttendu)} par an en moyenne, plus du double du compte à terme. Plaçons-y l'excédent. » Que lui répondez-vous ?`,
      options: (c) => {
        const x = financementDuChapitre(c);
        return [
          {
            texte: "Non : cet argent servira en janvier, son capital ne doit pas risquer de baisser",
            juste: true,
            retour: `Oui. Une trésorerie se place pour être retrouvée entière, à la date où elle servira. Une baisse des cours de quelques mois peuvent effacer bien plus que les ${eur(x.toutAuCompte.total)} d'intérêts du compte à terme. Les actions sont un placement à long terme.`,
          },
          {
            texte: "D'accord : sur 6 mois, le rendement moyen des actions est assuré",
            juste: false,
            retour: "Non : le rendement des actions est une moyenne sur de longues années, avec des baisses en chemin. Sur 6 mois, rien n'est assuré, pas même le capital.",
          },
          {
            texte: "D'accord pour la moitié : le risque est divisé par deux, le rendement reste supérieur",
            juste: false,
            retour: "Non : la moitié de l'argent dont NOVA aura besoin en janvier resterait exposée à une baisse. On ne mesure pas un risque à la seule moyenne.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["receivables_financing", "cash_budget", "net_treasury"],
      texte: (c) => {
        const x = financementDuChapitre(c);
        return [
          `Pour la TVA de la gamme, le crédit de trésorerie renouvelé coûte ${eur(x.credit.cout)}, ${enPct(x.credit.tauxReel)} en taux réel. Sur la facture de décembre, l'escompte revient à ${enPct(x.escompteDec.tauxReel)}, le Dailly à ${enPct(x.daillyDec.tauxReel)}, l'affacturage à ${enPct(x.affacturageDec.tauxReel)}, garantie et gestion comprises.`,
          `Pour l'excédent de l'été, le compte à terme rapporte plus tant qu'il n'est pas rompu ; on y bloque ce dont on est sûr, le reste va au fonds monétaire.`,
          "Au niveau de l'examen, vous savez choisir l'outil d'un besoin à court terme, et calculer le coût et le taux réel d'un crédit, d'un escompte, d'une cession Dailly et d'un affacturage. Vous savez chiffrer une garantie, et choisir un placement selon son rendement après impôt, son risque et sa disponibilité.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : les calculs, eux, sont les mêmes.",
        ];
      },
      repere: () =>
        "Taux réel = coût ÷ somme reçue × 360 ÷ jours. Escompte : un effet accepté. Dailly : une cession par bordereau, sans le client. Affacturage : une cession avec gestion et garantie. Placement : rendement après impôt, risque, disponibilité.",
    },
  ],
};
