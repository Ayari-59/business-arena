import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { analyseDuBilan, bilanApres, structureAuLevier, type RisqueDeLActivite } from "../monde/finance";
import {
  APPORT_DES_ASSOCIES,
  BETA_DE_L_ACTIF_DE_L_ESCALE,
  BILAN_DE_L_ESCALE,
  MARGE_DE_CREDIT_PAR_UNITE_DE_LEVIER,
  PRIME_DE_RISQUE_DU_MARCHE,
  TAUX_SANS_RISQUE,
  type BilanFinancier,
} from "../monde/projets-et-financement";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : L'EFFET DE LEVIER, LA DETTE ET LA RENTABILITÉ DES CAPITAUX PROPRES (DSCG, UE2
 * Finance, palier 4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : L'ESCALE a
 * un bilan figé au 31 décembre (monde/projets-et-financement.ts, BILAN_DE_L_ESCALE) et l'analyse
 * financière se calcule par le modèle du cours (monde/finance.ts : analyseDuBilan, bilanApres,
 * structureAuLevier). Une évolution du moteur ne change rien ici.
 *
 * Le chapitre construit l'actif économique (immobilisations nettes et besoin en fonds de
 * roulement) et l'endettement financier net (l'emprunt moins les disponibilités), puis la
 * rentabilité économique après impôt, le coût de l'endettement net après impôt et le levier ; il
 * vérifie la relation Rcp = Re + (Re − i) × D/CP, chiffre le résultat d'exploitation sous lequel
 * la dette se retourne contre les associés (le seuil de massue) et le taux d'emprunt où elle se
 * retourne (le taux limite). La simulation du cours rejoue enfin l'année avec un apport des
 * associés qui rembourse de l'emprunt (le scénario figé de la fiche, à la place du rejeu de
 * l'arène), puis avec une mauvaise année, et le laboratoire fait jouer la marge de crédit.
 *
 * LES CONVENTIONS DE LA FICHE, dites à l'élève dans l'intro : l'emprunt se rembourse par annuités
 * le 31 décembre, et les intérêts de l'année courent sur le capital dû au 1er janvier ; les
 * disponibilités ne rapportent rien ; l'impôt est de 25 % sur tout le résultat (L'ESCALE n'a pas
 * droit au taux réduit), et la simulation l'applique même à un résultat négatif, comme la relation
 * du levier le suppose. Quand un curseur fait varier le résultat d'exploitation ou le taux, le
 * bilan du 31 décembre ne bouge pas (« à structure inchangée »), comme dans le modèle.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui du DSCG) :
 *   · guidé : intro, actif-economique, rentabilite-economique, cout-de-la-dette, la-relation (la
 *     formule est au repère ou dans la question, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-levier
 *     puis le-resultat-au-curseur (le résultat net face à ce que les associés gagneraient sans dette,
 *     qui se croisent au seuil de massue) avant la-relation et seuil-de-massue ; predire-le-taux puis
 *     le-taux-au-curseur (ce que la dette fait gagner à l'outil face à ce qu'elle coûte, qui se
 *     croisent au taux limite) avant taux-limite ;
 *   · autonome : seuil-de-massue, taux-limite, apport, moins-de-dette (ni formule ni chiffres à
 *     prendre ; le calcul de la correction montre le chemin) ;
 *   · expert : une-mauvaise-annee (une variante chiffrée : le levier qui se retourne),
 *     le-laboratoire-du-levier (levier, taux, résultat d'exploitation et marge de crédit : avec la
 *     marge, le seuil de massue monte avec la dette), a-rebours (le résultat d'exploitation qu'il
 *     faut pour une rentabilité des associés visée), la-limite-de-la-relation (une critique : la
 *     relation ne dit rien du risque) ; puis la synthèse.
 */

/** L'effet de levier se lit sur un bilan endetté : celui de L'ESCALE. */
export const ENTREPRISES_DU_LEVIER = ["hotel"] as const;

/** Les bilans du chapitre, par code d'entreprise. */
export const BILANS_DU_LEVIER: Readonly<Record<string, BilanFinancier>> = { hotel: BILAN_DE_L_ESCALE };

/** Le bilan de l'entreprise du cas. */
export const bilanDe = (c: Pick<Cas, "code">): BilanFinancier => BILANS_DU_LEVIER[c.code]!;

/** Le risque de l'activité de L'ESCALE : ce que le MEDAF et Hamada lisent (la fiche). */
export const RISQUE_DE_L_ESCALE: RisqueDeLActivite = { tauxSansRisque: TAUX_SANS_RISQUE, prime: PRIME_DE_RISQUE_DU_MARCHE, betaDeLActif: BETA_DE_L_ACTIF_DE_L_ESCALE };

/**
 * LA MAUVAISE ANNÉE, hypothèse du cours pour la variante chiffrée : une année où la clientèle
 * d'affaires se fait rare (un grand salon annulé, des entreprises qui réduisent leurs
 * déplacements), et le résultat d'exploitation tombe à 90 000 €. Le bilan du 31 décembre ne
 * change pas : seule l'exploitation change.
 */
export const RESULTAT_DE_LA_MAUVAISE_ANNEE = 90_000;

/**
 * LA RENTABILITÉ VISÉE PAR LES ASSOCIÉS, hypothèse du cours pour le calcul à rebours : 24 % sur les
 * capitaux propres du 31 décembre, à structure inchangée.
 */
export const RENTABILITE_VISEE = 0.24;

/** Les bornes du curseur du résultat d'exploitation, en euros. */
export const RESULTAT_DU_CURSEUR = { min: 50_000, max: 400_000 } as const;

/** Les bornes du curseur du taux de l'emprunt, en points de base (100 points de base font 1 %). */
export const TAUX_DU_CURSEUR = { min: 100, max: 2_000 } as const;

/** Les leviers du laboratoire : le résultat d'exploitation (€), le levier, le taux de l'emprunt (%). */
export const LABORATOIRE_DU_LEVIER = {
  resultat: { min: 50_000, max: 450_000, pas: 100 },
  levier: { min: 0, max: 3, pas: 0.05 },
  taux: { min: 1, max: 15, pas: 0.1 },
} as const;

/** Le défi du laboratoire : au levier de 2, avec la marge de crédit, au taux de la fiche. */
export const LEVIER_DU_DEFI = 2;

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
export const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
export const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
/** Un nombre à la française, deux décimales au plus : 0,25. */
export const nombre = (x: number) => x.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
/** Un taux déjà en pour cent : 6,83 %. */
export const pct = (t: number) => `${nombre(t)} %`;
/** Un écart de taux, en points : « 1,51 point », « 3,06 points ». */
export const points = (t: number) => `${nombre(t)} ${Math.abs(t) < 2 ? "point" : "points"}`;
/** Au centième, sans zéro négatif. */
export const auCentieme = (x: number) => Math.round(x * 100) / 100 || 0;
/** Un taux en fraction, en pour cent au centième, comme l'élève le tape. */
export const enPct = (x: number) => auCentieme(x * 100);
export const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const auCentime = (x: number) => Math.round(x * 100) / 100 || 0;

/**
 * Les rentabilités d'un bilan, au centième de point comme l'élève les tape. Les valeurs exactes
 * restent dans `a` (l'analyse du modèle), pour les verdicts.
 */
export function rentabilitesDe(b: BilanFinancier) {
  const a = analyseDuBilan(b);
  const re = enPct(a.re);
  const i = enPct(a.i);
  const levier = auCentieme(a.levier);
  return {
    a,
    re,
    i,
    levier,
    rcp: enPct(a.rcp),
    /** La relation du levier, sur les taux arrondis que l'élève a trouvés. */
    rcpParLaRelation: auCentieme(re + (re - i) * levier),
    tauxDuContratApresImpot: enPct(a.tauxDuContratApresImpot),
  };
}

export type Verdict = "levier" | "massue";

/**
 * LE LABORATOIRE DU LEVIER : l'actif économique et le bilan restent ceux de la fiche ; le résultat
 * d'exploitation, le taux du contrat (en %) et le levier changent, et la marge de crédit (1 ou 0)
 * ajoute au taux 1 point par unité de levier au-delà de celui de la fiche (structureAuLevier). Le
 * seuil de massue est le résultat d'exploitation où Re égale i : i × actif économique ÷ (1 − t).
 */
export function laboratoireDuLevier(b: BilanFinancier, p: { resultat: number; levier: number; taux: number; marge: number }) {
  const bilan: BilanFinancier = { ...b, resultatDExploitation: p.resultat, tauxDeLEmprunt: p.taux / 100 };
  const s = structureAuLevier(bilan, RISQUE_DE_L_ESCALE, p.levier, p.marge * MARGE_DE_CREDIT_PAR_UNITE_DE_LEVIER);
  const a = analyseDuBilan(bilan);
  return {
    taux: s.tauxDeLEmprunt,
    re: a.re,
    i: s.i,
    effet: (a.re - s.i) * p.levier,
    rcp: s.rcp,
    seuil: auCentime((s.i * a.actifEconomique) / (1 - b.tauxDeLImpot)),
  };
}

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** L'effet de levier chez l'entreprise du cas : tout ce que le chapitre et son cas demandent. */
export function levierDeLEscale(c: Pick<Cas, "code">) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const x = calculer(c);
  calculs.set(c.code, x);
  return x;
}

function calculer(c: Pick<Cas, "code">) {
  const b = bilanDe(c);
  const r = rentabilitesDe(b);
  const a = r.a;
  const t = b.tauxDeLImpot;
  const taux = enPct(b.tauxDeLEmprunt);
  // Le seuil de massue, et la marge de l'année au-dessus de lui.
  const margeAvantLaMassue = auCentime(b.resultatDExploitation - a.seuilDeMassue);
  const baisseSupportable = enPct(margeAvantLaMassue / b.resultatDExploitation);
  // Le taux limite, sur les taux arrondis de l'élève, et la marge sous lui.
  const tauxLimite = auCentieme((taux * r.re) / r.i);
  // Ce que la dette fait rapporter à l'outil, après impôt : Re × endettement net.
  const ceQueRapporteLaDette = auCentime(a.re * a.endettementNet);
  // Le curseur du taux : le plus grand taux, en points de base, où la dette rapporte ce qu'elle coûte.
  const facteur = (1 - t) * b.empruntAuPremierJanvier;
  const tauxLimiteEnPointsDeBase = Math.floor((ceQueRapporteLaDette / facteur) * 10_000 + 1e-9);
  // L'apport des associés, le scénario figé de la fiche.
  const apres = bilanApres(b, { apport: APPORT_DES_ASSOCIES });
  const r2 = rentabilitesDe(apres);
  // La mauvaise année : seule l'exploitation change.
  const mauvaise = rentabilitesDe({ ...b, resultatDExploitation: RESULTAT_DE_LA_MAUVAISE_ANNEE });
  const effetMauvaise = auCentieme(mauvaise.rcp - mauvaise.re);
  // Le calcul à rebours : le résultat net visé, plus les charges financières après impôt, avant impôt.
  const resultatNetVise = auCentime(RENTABILITE_VISEE * a.capitauxPropres);
  const exploitationApresImpotVisee = auCentime(resultatNetVise + a.chargesFinancieresApresImpot);
  const exploitationVisee = auCentime(exploitationApresImpotVisee / (1 - t));
  return {
    b,
    entreprise: b.entreprise,
    a,
    r,
    t,
    tPct: enPct(t),
    taux,
    verdict: (a.re > a.i ? "levier" : "massue") as Verdict,
    margeAvantLaMassue,
    baisseSupportable,
    tauxLimite,
    margeSousLeTauxLimite: auCentieme(tauxLimite - taux),
    ceQueRapporteLaDette,
    facteur,
    tauxLimiteEnPointsDeBase,
    effetEnEuros: auCentime(ceQueRapporteLaDette - a.chargesFinancieresApresImpot),
    apres,
    r2,
    variation: auCentieme(r2.rcp - r.rcp),
    rcpBaisse: r2.a.rcp < a.rcp,
    mauvaise,
    effetMauvaise,
    resultatNetVise,
    exploitationApresImpotVisee,
    exploitationVisee,
    /** Le laboratoire au départ (la fiche, avec la marge de crédit) et à la solution du défi. */
    depart: { resultat: b.resultatDExploitation, levier: auCentieme(a.levier), taux, marge: 1 },
  };
}

export type LevierDeLEscale = ReturnType<typeof calculer>;

/** Le bilan du 31 décembre et l'année, tels que l'élève les lit. */
export function tableauDuBilan(c: Pick<Cas, "code">): TableauDeDonnees {
  const { b, taux, tPct } = levierDeLEscale(c);
  return {
    titre: `Le bilan ${dE(b.entreprise)} au 31 décembre, et son année`,
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Immobilisations nettes", valeurs: [eur(b.immobilisationsNettes)] },
      { libelle: "Stocks", valeurs: [eur(b.stocks)] },
      { libelle: "Créances clients", valeurs: [eur(b.creancesClients)] },
      { libelle: "Disponibilités", valeurs: [eur(b.disponibilites)] },
      { libelle: "Capitaux propres (résultat compris)", valeurs: [eur(b.capitauxPropres)] },
      { libelle: "Emprunt dû au 31 décembre", valeurs: [eur(b.emprunt)] },
      { libelle: "Dettes fournisseurs", valeurs: [eur(b.dettesFournisseurs)] },
      { libelle: "Dettes fiscales et sociales", valeurs: [eur(b.dettesFiscalesEtSociales)] },
      { libelle: "Emprunt dû au 1er janvier", valeurs: [eur(b.empruntAuPremierJanvier)] },
      { libelle: "Taux annuel de l'emprunt", valeurs: [pct(taux)] },
      { libelle: "Résultat d'exploitation de l'année", valeurs: [eur(b.resultatDExploitation)] },
      { libelle: "Taux de l'impôt sur les sociétés", valeurs: [pct(tPct)] },
    ],
  };
}

export const L_EFFET_DE_LEVIER: Chapitre = {
  code: "l-effet-de-levier",
  parcours: "dscg-finance",
  palier: 4,
  blocs: ["DSCG UE2 · Finance"],
  titre: "L'effet de levier : la dette et la rentabilité des capitaux propres",
  accroche:
    "La dette coûte son taux ; l'outil qu'elle finance rapporte ce qu'il rapporte. Tant qu'il rapporte plus, chaque euro emprunté enrichit les associés ; en dessous, il les appauvrit. La relation du levier, le seuil de massue et le taux limite, sur le bilan de l'hôtel du cours.",
  objectifs: [
    "Construire l'actif économique et l'endettement financier net à partir du bilan",
    "Calculer la rentabilité économique et le coût de l'endettement net, après impôt",
    "Vérifier la relation Rcp = Re + (Re − i) × D/CP",
    "Chiffrer le seuil de massue et le taux limite, et retrouver à rebours le résultat qu'exige une rentabilité visée",
    "Mesurer ce qu'un changement de structure ou une mauvaise année fait à la rentabilité des associés",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_LEVIER,
    pourquoi:
      "l'effet de levier se lit sur un bilan endetté : celui de L'ESCALE, l'hôtel du cours, dont la banque finance l'outil autant que les associés, sert de cas d'école quelle que soit votre entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Deux façons de financer l'outil",
      notions: ["profitability_vs_return", "balance_sheet"],
      tableau: tableauDuBilan,
      texte: (c) => {
        const x = levierDeLEscale(c);
        const b = x.b;
        return [
          `Ce chapitre se joue dans la simulation du cours, sur le bilan ${dE(x.entreprise)} au 31 décembre. Pour exploiter son outil, l'hôtel a besoin de ses immobilisations et de l'argent que son cycle d'exploitation retient : c'est l'actif économique. Deux sortes de capitaux le financent : ceux des associés, ${eur(b.capitauxPropres)}, et ceux de la banque, un emprunt dont il reste ${eur(b.emprunt)} à rembourser.`,
          "Les associés n'ont droit qu'à ce qui reste une fois la banque payée. Si l'outil rapporte plus que la dette ne coûte, la différence leur revient en plus de ce que rapporte leur propre apport : c'est l'effet de levier. Si l'outil rapporte moins, la différence est prise sur leur part : c'est l'effet de massue.",
          `Ce que la simulation suppose. L'emprunt se rembourse par annuités le 31 décembre : les intérêts de l'année courent sur les ${eur(b.empruntAuPremierJanvier)} dus au 1er janvier. Les ${eur(b.disponibilites)} de disponibilités dorment sur un compte qui ne rapporte rien. L'impôt prélève ${pct(x.tPct)} sur tout le résultat, et la simulation l'applique aussi à un résultat négatif, comme le suppose la relation du levier. Quand un curseur fait varier le résultat d'exploitation ou le taux, le bilan du 31 décembre ne bouge pas.`,
        ];
      },
      repere: () => "Actif économique = immobilisations nettes + BFR = capitaux propres + endettement financier net.",
    },
    {
      id: "actif-economique",
      objectifs: [0],
      type: "montants",
      titre: "L'actif économique et l'endettement net",
      notions: ["bfr", "net_treasury"],
      tableau: tableauDuBilan,
      question: () =>
        "D'après le bilan, calculez le besoin en fonds de roulement (les stocks et les créances, moins les dettes fournisseurs et les dettes fiscales et sociales), l'actif économique (les immobilisations nettes plus le BFR), et l'endettement financier net (l'emprunt dû au 31 décembre, moins les disponibilités).",
      champs: (c) => {
        const { b, a } = levierDeLEscale(c);
        return [
          {
            libelle: "Besoin en fonds de roulement",
            attendu: a.bfr,
            calcul: `${eur(b.stocks)} + ${eur(b.creancesClients)} − ${eur(b.dettesFournisseurs)} − ${eur(b.dettesFiscalesEtSociales)} = ${eur(a.bfr)}`,
          },
          { libelle: "Actif économique", attendu: a.actifEconomique, calcul: `${eur(b.immobilisationsNettes)} + ${retranche(a.bfr)} = ${eur(a.actifEconomique)}` },
          { libelle: "Endettement financier net", attendu: a.endettementNet, calcul: `${eur(b.emprunt)} − ${eur(b.disponibilites)} = ${eur(a.endettementNet)}` },
        ];
      },
      explication: (c) => {
        const { a } = levierDeLEscale(c);
        return [
          `Les capitaux propres et l'endettement net font ensemble ${eur(auCentime(a.capitauxPropres + a.endettementNet))} : l'actif économique. C'est l'équilibre du bilan, relu : ce que l'exploitation mobilise est financé par les associés et par la dette, une fois la caisse déduite de la dette.`,
          `Le levier financier, l'endettement net rapporté aux capitaux propres, vaut ${nombre(auCentieme(a.levier))} : la banque finance l'outil autant que les associés.`,
        ];
      },
    },
    {
      id: "rentabilite-economique",
      objectifs: [1],
      type: "montants",
      titre: "La rentabilité économique après impôt",
      notions: ["profitability_vs_return"],
      question: (c) => {
        const { b, tPct } = levierDeLEscale(c);
        return `L'outil rapporte son résultat d'exploitation, ${eur(b.resultatDExploitation)}, sur lequel l'impôt prélève ${pct(tPct)}. Calculez le résultat d'exploitation après impôt, puis la rentabilité économique après impôt, Re (ce résultat rapporté à l'actif économique, en %).`;
      },
      champs: (c) => {
        const { b, a, r, t } = levierDeLEscale(c);
        return [
          {
            libelle: "Résultat d'exploitation après impôt",
            attendu: a.resultatDExploitationApresImpot,
            calcul: `${eur(b.resultatDExploitation)} × (1 − ${nombre(t)}) = ${eur(a.resultatDExploitationApresImpot)}`,
          },
          { libelle: "Rentabilité économique après impôt, Re (%)", attendu: r.re, calcul: `${eur(a.resultatDExploitationApresImpot)} ÷ ${eur(a.actifEconomique)} × 100 = ${pct(r.re)}` },
        ];
      },
      explication: (c) => {
        const x = levierDeLEscale(c);
        return [
          `Chaque tranche de 100 € engagée dans l'exploitation ${dE(x.entreprise)} rapporte ${nombre(x.r.re)} € après impôt sur l'année, quelle que soit la façon dont elle est financée. La rentabilité économique ne dépend pas de la dette : c'est la performance de l'outil, avant tout partage entre la banque et les associés.`,
        ];
      },
    },
    {
      id: "cout-de-la-dette",
      objectifs: [1],
      type: "montants",
      titre: "Le coût de l'endettement net",
      notions: ["loan_schedule", "net_treasury"],
      question: (c) => {
        const { b, taux, tPct } = levierDeLEscale(c);
        return `Les intérêts de l'année courent sur le capital dû au 1er janvier, ${eur(b.empruntAuPremierJanvier)}, à ${pct(taux)}. Ils se déduisent du résultat : chaque euro d'intérêts fait économiser ${pct(tPct)} d'impôt. Calculez les charges financières de l'année, les charges financières après impôt, puis le coût de l'endettement net après impôt, i (ces charges rapportées à l'endettement net, en %).`;
      },
      champs: (c) => {
        const { b, a, r, t, taux } = levierDeLEscale(c);
        return [
          { libelle: "Charges financières de l'année", attendu: a.chargesFinancieres, calcul: `${pct(taux)} × ${eur(b.empruntAuPremierJanvier)} = ${eur(a.chargesFinancieres)}` },
          { libelle: "Charges financières après impôt", attendu: a.chargesFinancieresApresImpot, calcul: `${eur(a.chargesFinancieres)} × (1 − ${nombre(t)}) = ${eur(a.chargesFinancieresApresImpot)}` },
          { libelle: "Coût de l'endettement net après impôt, i (%)", attendu: r.i, calcul: `${eur(a.chargesFinancieresApresImpot)} ÷ ${eur(a.endettementNet)} × 100 = ${pct(r.i)}` },
        ];
      },
      explication: (c) => {
        const { b, a, r, taux } = levierDeLEscale(c);
        return [
          `Le contrat coûte ${pct(taux)} × (1 − ${nombre(b.tauxDeLImpot)}) = ${pct(r.tauxDuContratApresImpot)} après impôt, mais l'endettement net coûte ${pct(r.i)}, pour deux raisons. Les intérêts courent sur les ${eur(b.empruntAuPremierJanvier)} dus au 1er janvier, plus que les ${eur(b.emprunt)} du 31 décembre ; et les ${eur(b.disponibilites)} de disponibilités, qui ne rapportent rien, viennent en déduction de la dette : ${eur(a.endettementNet)} seulement portent ${eur(a.chargesFinancieresApresImpot)} de charges.`,
          "Garder de la trésorerie oisive tout en restant endetté renchérit le coût de l'endettement net.",
        ];
      },
    },
    {
      id: "predire-le-levier",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur la rentabilité des associés",
      notions: ["profitability_vs_return"],
      question: (c) => {
        const { r, a } = levierDeLEscale(c);
        return `Avant de calculer, pariez. Sans dette, les associés gagneraient ce que rapporte l'outil, ${pct(r.re)} après impôt. Avec ${eur(a.endettementNet)} d'endettement net qui coûte ${pct(r.i)} après impôt, leur rentabilité sera…`;
      },
      options: (c) => {
        const { r, verdict } = levierDeLEscale(c);
        const voir = "Faites varier le résultat d'exploitation à l'étape suivante : le curseur montre de quel côté joue la dette, et jusqu'où.";
        return [
          { texte: `Plus haute que ${pct(r.re)} : la dette rapporte à l'outil plus qu'elle ne coûte`, juste: verdict === "levier", retour: `${verdict === "levier" ? "Bon pari." : "Pari à vérifier."} ${voir}` },
          { texte: `Plus basse que ${pct(r.re)} : il faut d'abord payer les intérêts`, juste: verdict === "massue", retour: `${verdict === "massue" ? "Bon pari." : "Pari à vérifier."} ${voir}` },
          { texte: `La même, ${pct(r.re)} : la dette ne change que le partage`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-resultat-au-curseur",
      objectifs: [3],
      type: "curseur",
      titre: "Faites varier le résultat d'exploitation",
      notions: ["profitability_vs_return", "safety_margin"],
      question: (c) => {
        const { a } = levierDeLEscale(c);
        return `Faites varier le résultat d'exploitation de l'année de ${eur(RESULTAT_DU_CURSEUR.min)} à ${eur(RESULTAT_DU_CURSEUR.max)}, le bilan restant celui du 31 décembre. Une droite donne le résultat net des associés ; l'autre ce qu'ils gagneraient sans dette, la rentabilité économique appliquée à leurs ${eur(a.capitauxPropres)}. Placez le curseur sur le plus petit résultat d'exploitation où la dette joue pour eux, puis validez.`;
      },
      grandeur: () => ({ libelle: "Résultat d'exploitation de l'année", unite: "€" }),
      cible: (c) => {
        const { a } = levierDeLEscale(c);
        return { attendu: Math.ceil(a.seuilDeMassue - 1e-9), min: RESULTAT_DU_CURSEUR.min, max: RESULTAT_DU_CURSEUR.max };
      },
      zones: ["Effet de levier", "Effet de massue"],
      rates: () => ({
        dessous: "À cette position, le résultat net reste sous ce que les associés gagneraient sans dette : la dette joue contre eux.",
        dessus: "Plus bas, la dette joue encore pour les associés : cherchez le plus petit résultat d'exploitation.",
      }),
      montrer: "Montrer le seuil de massue",
      lecture: (c, rex) => {
        const { b, a } = levierDeLEscale(c);
        const net = auCentime((rex - a.chargesFinancieres) * (1 - b.tauxDeLImpot));
        const sansDette = auCentime((rex * (1 - b.tauxDeLImpot) * a.capitauxPropres) / a.actifEconomique);
        return [
          { libelle: "Résultat net des associés", montant: net },
          { libelle: "Ce qu'ils gagneraient sans dette", montant: sansDette },
          { libelle: "Effet de levier, en euros", montant: auCentime(net - sansDette), fort: true },
        ];
      },
      droites: (c) => {
        const { b, a } = levierDeLEscale(c);
        return {
          produit: (rex) => (rex - a.chargesFinancieres) * (1 - b.tauxDeLImpot),
          cout: (rex) => (rex * (1 - b.tauxDeLImpot) * a.capitauxPropres) / a.actifEconomique,
          libelles: ["Résultat net des associés", "Ce qu'ils gagneraient sans dette"],
        };
      },
      explication: (c) => {
        const { b, a, effetEnEuros } = levierDeLEscale(c);
        return [
          `Les deux droites se croisent à ${eur(a.seuilDeMassue)} de résultat d'exploitation : le seuil de massue. Là, l'outil rapporte exactement ce que coûte la dette, et les associés gagnent ce qu'ils gagneraient sans elle. Au-dessus, la dette leur ajoute un gain : ${eur(effetEnEuros)} à ${eur(b.resultatDExploitation)}. En dessous, elle leur prend une part de ce que rapporte leur apport.`,
          "La droite du résultat net est plus pentue : avec la dette, chaque euro de résultat d'exploitation gagné ou perdu pèse plus lourd sur la part des associés. Le levier amplifie, dans les deux sens.",
        ];
      },
    },
    {
      id: "la-relation",
      objectifs: [2],
      type: "montants",
      titre: "La relation du levier, vérifiée",
      notions: ["profitability_vs_return"],
      question: (c) => {
        const { r } = levierDeLEscale(c);
        return `La rentabilité des capitaux propres se calcule par la relation du levier, Rcp = Re + (Re − i) × D/CP, avec Re = ${pct(r.re)} et i = ${pct(r.i)}. Calculez le levier financier D/CP (l'endettement net rapporté aux capitaux propres), la Rcp par la relation, puis la Rcp directe (le résultat net rapporté aux capitaux propres, en %).`;
      },
      champs: (c) => {
        const { a, r } = levierDeLEscale(c);
        const effet = auCentieme((r.re - r.i) * r.levier);
        return [
          { libelle: "Levier financier, D/CP", attendu: r.levier, calcul: `${eur(a.endettementNet)} ÷ ${eur(a.capitauxPropres)} = ${nombre(r.levier)}`, tolerance: 0.01 },
          {
            libelle: "Rcp par la relation du levier (%)",
            attendu: r.rcpParLaRelation,
            calcul: `${pct(r.re)} + (${pct(r.re)} − ${pct(r.i)}) × ${nombre(r.levier)} = ${pct(r.re)} ${effet >= 0 ? "+" : "−"} ${points(Math.abs(effet))} = ${pct(r.rcpParLaRelation)}`,
            tolerance: 0.02,
          },
          { libelle: "Rcp par le résultat net (%)", attendu: r.rcp, calcul: `${eur(a.resultatNet)} ÷ ${eur(a.capitauxPropres)} × 100 = ${pct(r.rcp)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const { r } = levierDeLEscale(c);
        const ecart = auCentieme(Math.abs(r.rcpParLaRelation - r.rcp));
        return [
          ecart === 0
            ? `Les deux chemins donnent ${pct(r.rcp)} : la relation du levier tombe juste.`
            : `Les deux chemins donnent ${pct(r.rcpParLaRelation)} et ${pct(r.rcp)} : ${points(ecart)} d'écart, qui vient des taux arrondis au centième. Calculée sur les valeurs exactes, la relation tombe juste.`,
          "Elle n'a rien d'une coïncidence : le résultat net est le résultat d'exploitation après impôt, moins les charges financières après impôt, et l'actif économique est la somme des capitaux propres et de l'endettement net. Diviser par les capitaux propres donne la relation.",
        ];
      },
    },
    {
      id: "seuil-de-massue",
      objectifs: [3],
      type: "montants",
      titre: "Le seuil de massue",
      notions: ["profitability_vs_return", "safety_margin"],
      question: () =>
        "Sans formule cette fois. Retrouvez par le calcul le résultat d'exploitation du curseur, celui où la rentabilité économique égale le coût de l'endettement net, puis la marge de l'année au-dessus de ce seuil, en euros et en part du résultat d'exploitation (en %).",
      champs: (c) => {
        const { b, a, margeAvantLaMassue, baisseSupportable } = levierDeLEscale(c);
        return [
          {
            libelle: "Seuil de massue",
            attendu: a.seuilDeMassue,
            calcul: `Re = i quand résultat d'exploitation × (1 − t) ÷ actif économique = charges financières × (1 − t) ÷ endettement net : l'impôt s'y simplifie, ${eur(a.chargesFinancieres)} × ${eur(a.actifEconomique)} ÷ ${eur(a.endettementNet)} = ${eur(a.seuilDeMassue)}`,
            tolerance: 1,
          },
          { libelle: "Marge avant la massue", attendu: margeAvantLaMassue, calcul: `${eur(b.resultatDExploitation)} − ${retranche(a.seuilDeMassue)} = ${eur(margeAvantLaMassue)}`, tolerance: 1 },
          { libelle: "Baisse du résultat d'exploitation supportable (%)", attendu: baisseSupportable, calcul: `${eur(margeAvantLaMassue)} ÷ ${eur(b.resultatDExploitation)} × 100 = ${pct(baisseSupportable)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const { a, baisseSupportable, verdict } = levierDeLEscale(c);
        return [
          verdict === "levier"
            ? `Le résultat d'exploitation peut baisser de ${pct(baisseSupportable)} avant que la dette ne se retourne contre les associés. Sous ${eur(a.seuilDeMassue)}, chaque euro emprunté coûte plus qu'il ne rapporte, et le même levier qui amplifiait les bonnes années amplifie les mauvaises.`
            : `L'année est déjà sous le seuil de ${eur(a.seuilDeMassue)} : chaque euro d'endettement net prélève sur la part des associés.`,
          "Le seuil ne dépend que des charges financières et de la part de l'actif que la dette finance : l'activité peut le franchir, pas la comptabilité. C'est le risque financier.",
        ];
      },
    },
    {
      id: "predire-le-taux",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur le taux limite",
      notions: ["loan_schedule", "profitability_vs_return"],
      question: (c) => {
        const { r, taux } = levierDeLEscale(c);
        return `Le taux de l'emprunt est variable, ${pct(taux)} aujourd'hui, et l'outil rapporte ${pct(r.re)} après impôt. Avant de calculer, pariez : jusqu'à quel taux d'emprunt la dette joue-t-elle encore pour les associés ?`;
      },
      options: (c) => {
        const { r, tauxLimite } = levierDeLEscale(c);
        const voir = "Faites monter le taux à l'étape suivante : le curseur montre où la dette se retourne, et pourquoi.";
        return [
          { texte: `Jusqu'à ${pct(r.re)}, la rentabilité économique de l'outil`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `Un peu au-delà de ${pct(r.re)} : les intérêts se déduisent de l'impôt`, juste: tauxLimite > r.re, retour: `${tauxLimite > r.re ? "Bon pari." : "Pari à vérifier."} ${voir}` },
          { texte: `En deçà de ${pct(r.re)} : la dette coûte aussi ce qu'elle rembourse`, juste: tauxLimite <= r.re, retour: `${tauxLimite <= r.re ? "Bon pari." : "Pari à vérifier."} ${voir}` },
        ];
      },
    },
    {
      id: "le-taux-au-curseur",
      objectifs: [3],
      type: "curseur",
      titre: "Faites monter le taux de l'emprunt",
      notions: ["loan_schedule", "profitability_vs_return"],
      question: (c) => {
        const { a } = levierDeLEscale(c);
        return `Faites varier le taux de l'emprunt de ${nombre(TAUX_DU_CURSEUR.min)} à ${nombre(TAUX_DU_CURSEUR.max)} points de base (100 points de base font 1 %), le bilan restant celui du 31 décembre. Une droite donne ce que les ${eur(a.endettementNet)} d'endettement net font rapporter à l'outil, après impôt ; l'autre ce que la dette coûte, après impôt. Placez le curseur sur le plus haut taux où la dette rapporte au moins ce qu'elle coûte, puis validez.`;
      },
      grandeur: () => ({ libelle: "Taux de l'emprunt", unite: "points de base" }),
      sens: "plus-grande",
      cible: (c) => {
        const { tauxLimiteEnPointsDeBase } = levierDeLEscale(c);
        return { attendu: tauxLimiteEnPointsDeBase, min: TAUX_DU_CURSEUR.min, max: TAUX_DU_CURSEUR.max };
      },
      zones: ["La dette joue pour les associés", "La dette joue contre eux"],
      rates: () => ({
        dessous: "La dette rapporte encore plus qu'elle ne coûte : montez le taux, cherchez le plus haut.",
        dessus: "À ce taux, la dette coûte déjà plus qu'elle ne fait rapporter à l'outil.",
      }),
      montrer: "Montrer le taux limite",
      lecture: (c, pb) => {
        const { b, a, ceQueRapporteLaDette, facteur } = levierDeLEscale(c);
        const charges = auCentime((pb / 10_000) * b.empruntAuPremierJanvier);
        const apresImpot = auCentime((pb / 10_000) * facteur);
        return [
          { libelle: "Charges financières de l'année", montant: charges },
          { libelle: "Charges financières après impôt", montant: apresImpot },
          { libelle: "Ce que la dette fait rapporter à l'outil", montant: ceQueRapporteLaDette },
          { libelle: "Résultat net des associés", montant: auCentime(a.resultatDExploitationApresImpot - apresImpot) },
          { libelle: "Effet de levier, en euros", montant: auCentime(ceQueRapporteLaDette - apresImpot), fort: true },
        ];
      },
      droites: (c) => {
        const { ceQueRapporteLaDette, facteur } = levierDeLEscale(c);
        return {
          produit: () => ceQueRapporteLaDette,
          cout: (pb) => (pb / 10_000) * facteur,
          libelles: ["Ce que la dette fait rapporter à l'outil", "Ce que la dette coûte, après impôt"],
        };
      },
      explication: (c) => {
        const { b, r, tauxLimiteEnPointsDeBase, taux } = levierDeLEscale(c);
        return [
          `La dette joue pour les associés jusqu'à ${pct(tauxLimiteEnPointsDeBase / 100)} : le taux limite. Il dépasse les ${pct(r.re)} de la rentabilité économique, parce que les intérêts se déduisent de l'impôt ; il reste sous ${pct(enPct(r.a.re / (1 - b.tauxDeLImpot)))}, la rentabilité avant impôt, parce que les intérêts courent sur les ${eur(b.empruntAuPremierJanvier)} du 1er janvier quand l'endettement net n'en compte que ${eur(r.a.endettementNet)}.`,
          `La dette coûte une droite qui monte avec le taux ; ce qu'elle fait rapporter à l'outil ne bouge pas. Au taux de ${pct(taux)}, l'écart entre les deux est l'effet de levier en euros : l'étape suivante en tire la formule.`,
        ];
      },
    },
    {
      id: "taux-limite",
      objectifs: [3],
      type: "montants",
      titre: "Le taux limite",
      notions: ["loan_schedule", "profitability_vs_return"],
      question: () =>
        "Sans formule cette fois. À endettement net inchangé, le coût de la dette suit le taux de l'emprunt. Retrouvez par le calcul le taux limite du curseur (en %), à partir de vos taux arrondis, puis la marge entre ce taux et le taux actuel, en points.",
      champs: (c) => {
        const { r, taux, tauxLimite, margeSousLeTauxLimite } = levierDeLEscale(c);
        return [
          {
            libelle: "Taux limite de l'emprunt (%)",
            attendu: tauxLimite,
            calcul: `i est proportionnel au taux : il égale Re au taux actuel × Re ÷ i, soit ${pct(taux)} × ${pct(r.re)} ÷ ${pct(r.i)} = ${pct(tauxLimite)}`,
            tolerance: 0.02,
          },
          { libelle: "Marge sous le taux limite (points)", attendu: margeSousLeTauxLimite, calcul: `${pct(tauxLimite)} − ${pct(taux)} = ${points(margeSousLeTauxLimite)}`, tolerance: 0.02 },
        ];
      },
      explication: (c) => {
        const { margeSousLeTauxLimite, tauxLimite } = levierDeLEscale(c);
        return [
          `Le taux variable peut monter de ${points(margeSousLeTauxLimite)} avant que la dette ne coûte plus que ce qu'elle fait rapporter à l'outil. Au-delà de ${pct(tauxLimite)}, chaque point de taux de plus prend sur la part des associés.`,
          "Le seuil de massue et le taux limite disent la même égalité, Re = i, vue de deux côtés : l'un fait varier ce que rapporte l'outil, l'autre ce que coûte la dette.",
        ];
      },
    },
    {
      id: "apport",
      objectifs: [4],
      type: "montants",
      titre: "La simulation rejoue l'année avec moins de dette",
      notions: ["profitability_vs_return", "loan_schedule"],
      tableau: (c) => {
        const { b, a, r, apres, r2 } = levierDeLEscale(c);
        const a2 = r2.a;
        return {
          titre: "L'année, telle quelle et avec l'apport",
          colonnes: ["Telle quelle", "Avec l'apport"],
          lignes: [
            { libelle: "Résultat d'exploitation", valeurs: [eur(b.resultatDExploitation), eur(apres.resultatDExploitation)] },
            { libelle: "Charges financières", valeurs: [eur(a.chargesFinancieres), eur(a2.chargesFinancieres)] },
            { libelle: "Résultat net", valeurs: [eur(a.resultatNet), eur(a2.resultatNet)] },
            { libelle: "Actif économique au 31 décembre", valeurs: [eur(a.actifEconomique), eur(a2.actifEconomique)] },
            { libelle: "Capitaux propres au 31 décembre", valeurs: [eur(a.capitauxPropres), eur(a2.capitauxPropres)] },
            { libelle: "Endettement net au 31 décembre", valeurs: [eur(a.endettementNet), eur(a2.endettementNet)] },
            { libelle: "Rentabilité économique après impôt", valeurs: [pct(r.re), pct(r2.re)] },
            { libelle: "Coût de l'endettement net après impôt", valeurs: [pct(r.i), pct(r2.i)] },
          ],
        };
      },
      question: () =>
        `Les associés apportent ${eur(APPORT_DES_ASSOCIES)} au 1er janvier, et l'hôtel rembourse autant d'emprunt par anticipation ; la simulation du cours a refait l'année. D'après le tableau, et sans formule, calculez le nouveau levier financier, la nouvelle rentabilité des capitaux propres (en %), et sa variation en points (après moins avant).`,
      champs: (c) => {
        const { r, r2, variation } = levierDeLEscale(c);
        const a2 = r2.a;
        return [
          { libelle: "Levier avec l'apport, D/CP", attendu: r2.levier, calcul: `${eur(a2.endettementNet)} ÷ ${eur(a2.capitauxPropres)} = ${nombre(r2.levier)}`, tolerance: 0.01 },
          { libelle: "Rcp avec l'apport (%)", attendu: r2.rcp, calcul: `${eur(a2.resultatNet)} ÷ ${eur(a2.capitauxPropres)} × 100 = ${pct(r2.rcp)}`, tolerance: 0.01 },
          { libelle: "Variation de la Rcp (points)", attendu: variation, calcul: `${pct(r2.rcp)} − ${pct(r.rcp)} = ${points(variation)}`, tolerance: 0.02 },
        ];
      },
      explication: (c) => {
        const { a, r, r2 } = levierDeLEscale(c);
        const a2 = r2.a;
        return [
          `L'exploitation n'a pas bougé : même résultat d'exploitation, même actif économique, même rentabilité économique, ${pct(r2.re)}. Seul change le financement : ${eur(auCentime(a.chargesFinancieres - a2.chargesFinancieres))} de charges financières en moins, mais ${eur(auCentime(a2.capitauxPropres - a.capitauxPropres))} de capitaux propres en plus pour se partager le résultat.`,
          `Le levier passe de ${nombre(r.levier)} à ${nombre(r2.levier)}. Le coût de l'endettement net monte, de ${pct(r.i)} à ${pct(r2.i)} : la trésorerie oisive reste, et pèse sur une dette plus petite.`,
        ];
      },
    },
    {
      id: "moins-de-dette",
      objectifs: [4],
      type: "choix",
      titre: "Ce que l'apport a changé pour les associés",
      notions: ["profitability_vs_return"],
      question: (c) => {
        const { r, r2 } = levierDeLEscale(c);
        return `Avec l'apport, la rentabilité des capitaux propres passe de ${pct(r.rcp)} à ${pct(r2.rcp)}. Pourquoi ?`;
      },
      options: (c) => {
        const { r, r2, rcpBaisse, verdict } = levierDeLEscale(c);
        const levierJoue = verdict === "levier" && rcpBaisse;
        const massueJoue = verdict === "massue" && !rcpBaisse;
        return [
          {
            texte: "Elle baisse : moins de dette, c'est moins de levier sur une rentabilité qui dépasse son coût",
            juste: levierJoue,
            retour: levierJoue
              ? `Oui : l'outil rapportait ${pct(r.re)}, plus que les ${pct(r.i)} que coûtait l'endettement net. Chaque euro de dette remplacé par un euro des associés retire un gain qui leur revenait : la Rcp descend vers la rentabilité économique.`
              : `Non : elle passe de ${pct(r.rcp)} à ${pct(r2.rcp)}, et la dette coûtait plus que l'outil ne rapportait.`,
          },
          {
            texte: "Elle monte : moins de dette, c'est moins de massue sur une rentabilité sous son coût",
            juste: massueJoue,
            retour: massueJoue
              ? `Oui : l'endettement net coûtait ${pct(r.i)}, plus que les ${pct(r.re)} que rapportait l'outil. La Rcp remonte vers la rentabilité économique.`
              : `Non : elle passe de ${pct(r.rcp)} à ${pct(r2.rcp)}, et l'outil rapportait plus que la dette ne coûtait.`,
          },
          {
            texte: "Parce que l'exploitation a changé : l'apport a rendu l'outil moins rentable",
            juste: false,
            retour: `Non : la rentabilité économique est la même, avec ou sans l'apport, ${pct(r.re)}. Seule la structure du financement a changé.`,
          },
        ];
      },
    },
    {
      id: "une-mauvaise-annee",
      objectifs: [4],
      type: "montants",
      titre: "Variante : une mauvaise année",
      notions: ["profitability_vs_return", "safety_margin"],
      question: (c) => {
        const { a } = levierDeLEscale(c);
        return `Une autre année, la clientèle d'affaires se fait rare et le résultat d'exploitation tombe à ${eur(RESULTAT_DE_LA_MAUVAISE_ANNEE)}. Le bilan du 31 décembre et les charges financières, ${eur(a.chargesFinancieres)}, ne changent pas. Calculez la rentabilité économique, la rentabilité des capitaux propres (en %), puis l'effet de levier en points (Rcp moins Re). Négatif pour un effet de massue.`;
      },
      champs: (c) => {
        const { b, a, mauvaise, effetMauvaise } = levierDeLEscale(c);
        const net = auCentime((RESULTAT_DE_LA_MAUVAISE_ANNEE - a.chargesFinancieres) * (1 - b.tauxDeLImpot));
        return [
          {
            libelle: "Re de la mauvaise année (%)",
            attendu: mauvaise.re,
            calcul: `${eur(RESULTAT_DE_LA_MAUVAISE_ANNEE)} × (1 − ${nombre(b.tauxDeLImpot)}) ÷ ${eur(a.actifEconomique)} × 100 = ${pct(mauvaise.re)}`,
          },
          {
            libelle: "Rcp de la mauvaise année (%)",
            attendu: mauvaise.rcp,
            calcul: `(${eur(RESULTAT_DE_LA_MAUVAISE_ANNEE)} − ${eur(a.chargesFinancieres)}) × (1 − ${nombre(b.tauxDeLImpot)}) = ${eur(net)} ; ${eur(net)} ÷ ${eur(a.capitauxPropres)} × 100 = ${pct(mauvaise.rcp)}`,
          },
          { libelle: "Effet de levier de la mauvaise année (points)", attendu: effetMauvaise, calcul: `${pct(mauvaise.rcp)} − ${pct(mauvaise.re)} = ${points(effetMauvaise)}`, tolerance: 0.02 },
        ];
      },
      explication: (c) => {
        const { b, a, r, mauvaise } = levierDeLEscale(c);
        const baisseRex = enPct((b.resultatDExploitation - RESULTAT_DE_LA_MAUVAISE_ANNEE) / b.resultatDExploitation);
        const baisseRcp = enPct((r.a.rcp - mauvaise.a.rcp) / r.a.rcp);
        return [
          `Le levier s'est retourné : sous le seuil de ${eur(a.seuilDeMassue)}, l'outil ne rapporte plus que ${pct(mauvaise.re)}, moins que les ${pct(mauvaise.i)} que coûte la dette, et les associés tombent à ${pct(mauvaise.rcp)}, sous la rentabilité de l'outil.`,
          `Le résultat d'exploitation a perdu ${pct(baisseRex)} ; la rentabilité des associés, ${pct(baisseRcp)}. Les charges financières, elles, n'ont pas baissé : c'est le risque financier, que le levier ajoute au risque de l'exploitation.`,
        ];
      },
    },
    {
      id: "le-laboratoire-du-levier",
      objectifs: [2, 4],
      type: "simulation",
      titre: "Le laboratoire du levier",
      notions: ["profitability_vs_return", "loan_schedule", "safety_margin"],
      question: (c) => {
        const { a } = levierDeLEscale(c);
        return `L'actif économique reste de ${eur(a.actifEconomique)}. Faites varier le résultat d'exploitation, le levier financier et le taux du contrat, avec ou sans la marge de crédit : la banque qui prête plus prête plus cher, 1 point de taux par unité de levier au-delà de celui de la fiche (une hypothèse du cours). Comme dans la fiche, les intérêts courent sur plus que l'endettement net. Le graphique suit les rentabilités selon le levier.`;
      },
      leviers: (c) => {
        const { depart } = levierDeLEscale(c);
        const L = LABORATOIRE_DU_LEVIER;
        return [
          { code: "resultat", libelle: "Résultat d'exploitation", unite: "€", ...L.resultat, depart: depart.resultat },
          { code: "levier", libelle: "Levier financier, D/CP", unite: "", ...L.levier, depart: depart.levier },
          { code: "taux", libelle: "Taux du contrat au levier de la fiche", unite: "%", ...L.taux, depart: depart.taux },
          {
            code: "marge",
            libelle: "Marge de crédit",
            unite: "",
            min: 0,
            max: 1,
            pas: 1,
            depart: depart.marge,
            choix: [
              { valeur: 0, libelle: "Aucune : un taux qui ne dépend pas de la dette" },
              { valeur: 1, libelle: "1 point par unité de levier" },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const x = levierDeLEscale(c);
        const l = laboratoireDuLevier(x.b, { resultat: p.resultat!, levier: p.levier!, taux: p.taux!, marge: p.marge! });
        const d = laboratoireDuLevier(x.b, x.depart);
        return [
          { libelle: "Taux de l'emprunt, marge comprise", montant: enPct(l.taux), reference: enPct(d.taux), unite: "%" },
          { libelle: "Rentabilité économique, Re", montant: enPct(l.re), reference: enPct(d.re), unite: "%" },
          { libelle: "Coût de l'endettement net, i", montant: enPct(l.i), reference: enPct(d.i), unite: "%" },
          { libelle: "Effet de levier, (Re − i) × D/CP", montant: enPct(l.effet), reference: enPct(d.effet), unite: "points", effet: true },
          { libelle: "Rentabilité des capitaux propres, Rcp", montant: enPct(l.rcp), reference: enPct(d.rcp), unite: "%", fort: true },
          { libelle: "Seuil de massue", montant: l.seuil, reference: d.seuil },
        ];
      },
      graphique: (c) => {
        const x = levierDeLEscale(c);
        const lab = (p: Readonly<Record<string, number>>) => laboratoireDuLevier(x.b, { resultat: p.resultat!, levier: p.levier!, taux: p.taux!, marge: p.marge! });
        return {
          levier: "levier",
          unite: "%",
          courbes: [
            { libelle: "Rentabilité des capitaux propres", valeur: (p) => lab(p).rcp * 100 },
            { libelle: "Rentabilité économique", valeur: (p) => lab(p).re * 100 },
            { libelle: "Coût de l'endettement net", valeur: (p) => lab(p).i * 100 },
          ],
        };
      },
      defi: (c) => {
        const x = levierDeLEscale(c);
        const solution = { resultat: laboratoireDuLevier(x.b, { ...x.depart, levier: LEVIER_DU_DEFI }).seuil, levier: LEVIER_DU_DEFI, taux: x.taux, marge: 1 };
        const enPlace = (p: Readonly<Record<string, number>>) => Math.abs(p.levier! - LEVIER_DU_DEFI) < 1e-9 && Math.abs(p.taux! - x.taux) < 1e-9 && p.marge === 1;
        return {
          consigne: `Au levier de ${nombre(LEVIER_DU_DEFI)}, avec la marge de crédit et le taux du contrat de la fiche (${pct(x.taux)}), trouvez le résultat d'exploitation où la dette cesse de jouer pour les associés.`,
          atteint: (p) => {
            const l = laboratoireDuLevier(x.b, { resultat: p.resultat!, levier: p.levier!, taux: p.taux!, marge: p.marge! });
            return enPlace(p) && Math.abs(l.re - l.i) < 1e-5;
          },
          indice: (p) => {
            if (!enPlace(p)) return `Placez le levier à ${nombre(LEVIER_DU_DEFI)}, gardez la marge de crédit et le taux de ${pct(x.taux)}, puis faites varier le résultat d'exploitation.`;
            const l = laboratoireDuLevier(x.b, { resultat: p.resultat!, levier: p.levier!, taux: p.taux!, marge: p.marge! });
            return l.re > l.i
              ? `L'outil rapporte ${pct(enPct(l.re))}, plus que les ${pct(enPct(l.i))} que coûte la dette : baissez le résultat d'exploitation jusqu'à l'égalité.`
              : `L'outil ne rapporte que ${pct(enPct(l.re))}, moins que les ${pct(enPct(l.i))} que coûte la dette : montez le résultat d'exploitation jusqu'à l'égalité.`;
          },
          solution,
        };
      },
      explication: (c, p) => {
        const x = levierDeLEscale(c);
        const l = laboratoireDuLevier(x.b, { resultat: p.resultat!, levier: p.levier!, taux: p.taux!, marge: p.marge! });
        const sansMarge = laboratoireDuLevier(x.b, { resultat: p.resultat!, levier: p.levier!, taux: p.taux!, marge: 0 });
        return [
          `Au levier de ${nombre(p.levier!)}, la banque prête à ${pct(enPct(l.taux))} : la dette coûte ${pct(enPct(l.i))} après impôt, et le seuil de massue monte à ${eur(l.seuil)}, contre ${eur(x.a.seuilDeMassue)} au levier de la fiche. Sans la marge de crédit, il ne bougerait pas : ${eur(sansMarge.seuil)}. Plus de dette, une dette plus chère, un seuil plus haut : le levier rapproche le jour où il se retourne.`,
          "Regardez le graphique à ce résultat d'exploitation : la rentabilité des associés culmine à un levier plus faible, puis redescend, et passe sous la rentabilité économique au-delà du levier du défi. Avec une dette qui renchérit, s'endetter davantage finit par retirer aux associés ce qu'il leur apportait.",
        ];
      },
    },
    {
      id: "a-rebours",
      objectifs: [3],
      type: "montants",
      titre: "Le résultat qu'exige une rentabilité visée",
      notions: ["profitability_vs_return"],
      question: (c) => {
        const { a } = levierDeLEscale(c);
        return `Les associés visent ${pct(enPct(RENTABILITE_VISEE))} sur leurs ${eur(a.capitauxPropres)} de capitaux propres, à structure inchangée (le même endettement net, les mêmes charges financières). Remontez la relation : retrouvez le résultat net qu'il leur faut, le résultat d'exploitation après impôt qui le donne, puis le résultat d'exploitation.`;
      },
      champs: (c) => {
        const { a, t, resultatNetVise, exploitationApresImpotVisee, exploitationVisee } = levierDeLEscale(c);
        return [
          { libelle: "Résultat net visé", attendu: resultatNetVise, calcul: `${pct(enPct(RENTABILITE_VISEE))} × ${eur(a.capitauxPropres)} = ${eur(resultatNetVise)}` },
          {
            libelle: "Résultat d'exploitation après impôt nécessaire",
            attendu: exploitationApresImpotVisee,
            calcul: `Le résultat net est le résultat d'exploitation après impôt moins les charges financières après impôt : ${eur(resultatNetVise)} + ${eur(a.chargesFinancieresApresImpot)} = ${eur(exploitationApresImpotVisee)}`,
          },
          { libelle: "Résultat d'exploitation nécessaire", attendu: exploitationVisee, calcul: `${eur(exploitationApresImpotVisee)} ÷ (1 − ${nombre(t)}) = ${eur(exploitationVisee)}` },
        ];
      },
      explication: (c) => {
        const { b, a, r, exploitationVisee, exploitationApresImpotVisee } = levierDeLEscale(c);
        const reVisee = enPct(exploitationApresImpotVisee / a.actifEconomique);
        const visee = enPct(RENTABILITE_VISEE);
        const parLaRelation = auCentieme((visee + r.i * r.levier) / (1 + r.levier));
        return [
          `Il faudrait ${eur(exploitationVisee)} de résultat d'exploitation, ${eur(auCentime(exploitationVisee - b.resultatDExploitation))} de plus que l'année : une rentabilité économique de ${pct(reVisee)}. La relation se lit dans les deux sens : Re = (Rcp + i × D/CP) ÷ (1 + D/CP), soit (${pct(visee)} + ${pct(r.i)} × ${nombre(r.levier)}) ÷ ${nombre(1 + r.levier)} = ${pct(parLaRelation)}, la même réponse aux arrondis près.`,
          "Remonter la relation oblige à séparer ce que doit rapporter l'outil de ce que coûte la dette : la rentabilité visée par les associés ne se décrète pas, elle se demande à l'exploitation.",
        ];
      },
    },
    {
      id: "la-limite-de-la-relation",
      objectifs: [4],
      type: "choix",
      titre: "Ce que la relation ne dit pas",
      notions: ["profitability_vs_return", "loan_schedule"],
      question: () =>
        "Le gérant conclut : « Tant que l'outil rapporte plus que la dette ne coûte, chaque euro emprunté enrichit les associés : endettons-nous au maximum. » Que lui répondez-vous ?",
      options: () => [
        {
          texte: "La Rcp monte avec le levier, mais son risque aussi, et une dette plus chère rapproche le seuil de massue",
          juste: true,
          retour:
            "Oui. La relation donne la rentabilité d'une année, pas son risque : plus le levier est fort, plus la rentabilité des associés varie avec l'exploitation, et la mauvaise année l'a montré. Le laboratoire l'a montré aussi : une banque qui prête plus cher à mesure que la dette grossit relève le seuil de massue, et la Rcp finit par redescendre.",
        },
        {
          texte: "Il a raison : la relation le démontre, tant que Re dépasse i",
          juste: false,
          retour: "Non : la relation vaut pour un i donné et une année donnée. Elle ne dit ni si le coût de la dette reste le même quand elle grossit, ni ce que devient la Rcp quand l'exploitation baisse.",
        },
        {
          texte: "Il a tort : la dette fait baisser la rentabilité économique de l'outil",
          juste: false,
          retour: "Non : la rentabilité économique ne dépend pas du financement. La dette change le partage de ce que rapporte l'outil, et le risque de ce partage.",
        },
        {
          texte: "Il a tort : au-delà d'un levier de 1, la relation ne s'applique plus",
          juste: false,
          retour: "Non : la relation tient à tout levier, c'est une identité comptable. Ce qui change avec le levier, c'est le coût de la dette et le risque des associés.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["profitability_vs_return"],
      texte: (c) => {
        const x = levierDeLEscale(c);
        return [
          `Chez ${x.entreprise}, l'outil rapporte ${pct(x.r.re)} après impôt, l'endettement net coûte ${pct(x.r.i)}, et les associés obtiennent ${pct(x.r.rcp)} : ${x.verdict === "levier" ? "la dette joue pour eux" : "la dette joue contre eux"}. Elle se retournerait sous ${eur(x.a.seuilDeMassue)} de résultat d'exploitation, ou au-delà d'un taux de ${pct(x.tauxLimite)}.`,
          "La dette ne crée rien par elle-même : elle amplifie l'écart entre ce que rapporte l'outil et ce qu'elle coûte, dans un sens ou dans l'autre, d'autant plus que le levier est fort. S'endetter pour accroître la rentabilité des associés, c'est accepter qu'elle varie davantage avec celle de l'exploitation, et qu'une dette plus chère rapproche le seuil où le levier se retourne.",
          "Au niveau de l'examen, vous savez construire l'actif économique et l'endettement net, calculer Re, i et la Rcp par la relation, chiffrer le seuil de massue et le taux limite, refaire le calcul pour une autre structure ou une mauvaise année, remonter la relation à partir d'une rentabilité visée, et dire ce que la relation ne dit pas.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () => "Rcp = Re + (Re − i) × D/CP, où Re et i sont après impôt, et D l'endettement financier net. Le levier se retourne quand Re = i.",
    },
  ],
};
