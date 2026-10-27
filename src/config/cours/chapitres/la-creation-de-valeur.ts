import type { EquipmentTypeDef } from "../../../engine/types";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import { rejouerAvec } from "../gestion-de-la-pme";
import type { Chapitre, TableauDeDonnees } from "../types";
import { TRIMESTRE_DE_L_ACHAT, avecLeParcSansDoublon, machineDuChapitre } from "./croitre-en-investissant";
import {
  ENTREPRISES_DU_LEVIER,
  type StructureFinanciere,
  auCentieme,
  dE,
  effetDeLevier,
  eur,
  nombre,
  pct,
  points,
  rentabilitesDe,
  retranche,
  structureDe,
} from "./l-effet-de-levier";

/**
 * CHAPITRE : LA CRÉATION DE VALEUR, RENTABILITÉ ÉCONOMIQUE ET COÛT DU CAPITAL (DSCG, UE2
 * Finance, palier 4).
 *
 * « L'effet de levier » a mesuré ce que l'outil rapporte (la rentabilité économique après impôt)
 * et ce que coûte la dette (le coût de l'endettement net après impôt), sur le bilan de l'arène au
 * 31 décembre. Ce chapitre y ajoute ce qu'exigent les associés, le coût des capitaux propres,
 * pondère les deux coûts par la structure du bilan (le coût moyen pondéré du capital, CMPC), et
 * en tire la valeur créée sur l'année : l'EVA, (Re − CMPC) × actif économique. Il la recoupe par
 * le résultat résiduel (le résultat net moins ce qu'exigeaient les associés), puis l'arène rejoue
 * l'année avec une décision : l'équipement de plus du chapitre « Croître en investissant »,
 * acheté au premier trimestre et payé par un emprunt du même montant.
 *
 * LE COÛT DES CAPITAUX PROPRES EST UNE HYPOTHÈSE DU COURS. L'arène ne cote pas ses entreprises :
 * rien n'y mesure le risque que portent les associés. Le chapitre le construit par le modèle
 * d'équilibre des actifs financiers, kcp = taux sans risque + bêta des capitaux propres × prime
 * de risque du marché, avec trois constantes nommées plus bas ; le bêta des capitaux propres se
 * déduit de celui de l'actif économique par la relation de Hamada, qui fait monter l'exigence
 * des associés avec le levier : βcp = βa × (1 + (1 − t) × D/CP).
 *
 * L'EXERCICE ET LES PONDÉRATIONS. Ce sont ceux de « L'effet de levier » : le bilan du
 * 31 décembre, les capitaux propres et l'endettement net à leur valeur comptable, dont la somme
 * est l'actif économique. Le CMPC × actif économique vaut alors l'exigence des associés plus les
 * charges financières après impôt, et l'EVA égale le résultat résiduel au centime : le chapitre
 * le fait vérifier.
 *
 * LES ENTREPRISES. Celles de « L'effet de levier » (`ENTREPRISES_DU_LEVIER`), pour la même raison :
 * le coût de la dette après impôt suppose un impôt, donc un bénéfice, et la pondération suppose un
 * endettement net positif. L'équipement rejoué ne fait défaillir aucune des trois ; le test le
 * vérifie, comme il vérifie que l'année sans équipement est celle du cours.
 */

/**
 * LE TAUX SANS RISQUE : 3 %, l'ordre de grandeur du rendement de l'emprunt d'État français à
 * dix ans en 2025 et 2026. Une hypothèse du cours, pas un chiffre de l'arène.
 */
export const TAUX_SANS_RISQUE = 0.03;
/**
 * LA PRIME DE RISQUE DU MARCHÉ ACTIONS : 6 %, au milieu de la fourchette de 5 à 7 % que retiennent
 * les praticiens pour les actions européennes. Une hypothèse du cours.
 */
export const PRIME_DE_RISQUE_DU_MARCHE = 0.06;
/**
 * LE BÊTA DE L'ACTIF ÉCONOMIQUE : 1, l'hypothèse que l'exploitation de l'entreprise est aussi
 * risquée que le marché dans son ensemble, faute de société cotée comparable dans l'arène. Le
 * même pour les trois entreprises : c'est le levier, et lui seul, qui différencie leur exigence.
 */
export const BETA_DE_L_ACTIF = 1;

/** Le coût du capital d'une structure, et la valeur qu'elle crée. Les taux en pour cent, arrondis au centième comme l'élève les tape. */
export function coutDuCapital(s: StructureFinanciere, tauxIS: number) {
  const r = rentabilitesDe(s, tauxIS);
  const betaExact = BETA_DE_L_ACTIF * (1 + ((1 - tauxIS) * s.endettementNet) / s.capitauxPropres);
  const beta = auCentieme(betaExact);
  const kcp = auCentieme((TAUX_SANS_RISQUE + beta * PRIME_DE_RISQUE_DU_MARCHE) * 100);
  const poidsCP = auCentieme((s.capitauxPropres / s.actifEconomique) * 100);
  const poidsD = auCentieme((s.endettementNet / s.actifEconomique) * 100);
  const cmpc = auCentieme((kcp * poidsCP + r.i * poidsD) / 100);
  const ecart = auCentieme(r.re - cmpc);
  const eva = auCentime((ecart / 100) * s.actifEconomique);
  const exigence = auCentime((kcp / 100) * s.capitauxPropres);
  const kcpExact = TAUX_SANS_RISQUE + betaExact * PRIME_DE_RISQUE_DU_MARCHE;
  return {
    r,
    beta,
    kcp,
    poidsCP,
    poidsD,
    cmpc,
    ecart,
    eva,
    exigence,
    residuel: auCentime(s.resultatNet - exigence),
    /** L'écart admis sur une valeur créée : celui des taux arrondis au centième, sur l'actif économique. */
    toleranceEva: Math.max(1, Math.ceil(s.actifEconomique * 0.0002)),
    exact: {
      kcp: kcpExact * 100,
      cmpc: ((kcpExact * s.capitauxPropres + s.chargesFinancieres * (1 - tauxIS)) / s.actifEconomique) * 100,
      eva: s.resultatDExploitation * (1 - tauxIS) - kcpExact * s.capitauxPropres - s.chargesFinancieres * (1 - tauxIS),
      residuel: s.resultatNet - kcpExact * s.capitauxPropres,
    },
  };
}

/** L'année du cours, l'équipement de plus acheté au trimestre de « Croître en investissant », payé par un emprunt du même montant. */
export function anneeAvecLEquipement(code: string, machine: EquipmentTypeDef = machineDuChapitre(code)) {
  return rejouerAvec(
    code,
    `la-creation-de-valeur:${machine.code}`,
    (t, d) =>
      t === TRIMESTRE_DE_L_ACHAT
        ? {
            ...d,
            investment: { ...d.investment, equipmentBuy: [...(d.investment?.equipmentBuy ?? []), { typeCode: machine.code, quantity: 1 }] },
            finance: { ...d.finance, newLoan: (d.finance?.newLoan ?? 0) + machine.costPerUnit },
          }
        : undefined,
    avecLeParcSansDoublon,
  );
}

export type Verdict = "cree" | "detruit";

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** La valeur créée dans l'année du cours, et avec l'équipement de plus. */
export function creationDeValeur(c: Cas) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const r = calculer(c);
  calculs.set(c.code, r);
  return r;
}

function calculer(c: Cas) {
  const l = effetDeLevier(c);
  const k = coutDuCapital(l.s, l.tauxIS);
  const machine = machineDuChapitre(c.code);
  const avec = structureDe(anneeAvecLEquipement(c.code, machine));
  const k2 = coutDuCapital(avec, l.tauxIS);
  return {
    ...l,
    k,
    machine: machine.name,
    prix: machine.costPerUnit,
    avec,
    k2,
    variation: auCentime(k2.eva - k.eva),
    verdict: (k.exact.eva > 0 ? "cree" : "detruit") as Verdict,
    verdictAvec: (k2.exact.eva > 0 ? "cree" : "detruit") as Verdict,
    lEquipementCree: k2.exact.eva > k.exact.eva,
  };
}

/** Les hypothèses du cours et les chiffres repris de « L'effet de levier ». */
function tableauDesHypotheses(c: Cas): TableauDeDonnees {
  const { s, k, tauxISPct } = creationDeValeur(c);
  return {
    titre: `Les chiffres ${dE(c.entreprise)} au 31 décembre, et les hypothèses du cours`,
    colonnes: ["Valeur"],
    lignes: [
      { libelle: "Actif économique", valeurs: [eur(s.actifEconomique)] },
      { libelle: "Capitaux propres", valeurs: [eur(s.capitauxPropres)] },
      { libelle: "Endettement financier net", valeurs: [eur(s.endettementNet)] },
      { libelle: "Résultat net de l'année", valeurs: [eur(s.resultatNet)] },
      { libelle: "Rentabilité économique après impôt, Re", valeurs: [pct(k.r.re)] },
      { libelle: "Coût de l'endettement net après impôt, i", valeurs: [pct(k.r.i)] },
      { libelle: "Taux de l'impôt sur les sociétés", valeurs: [pct(tauxISPct)] },
      { libelle: "Taux sans risque (hypothèse)", valeurs: [pct(TAUX_SANS_RISQUE * 100)] },
      { libelle: "Prime de risque du marché (hypothèse)", valeurs: [pct(PRIME_DE_RISQUE_DU_MARCHE * 100)] },
      { libelle: "Bêta de l'actif économique (hypothèse)", valeurs: [nombre(BETA_DE_L_ACTIF)] },
    ],
  };
}

export const LA_CREATION_DE_VALEUR: Chapitre = {
  code: "la-creation-de-valeur",
  parcours: "dscg-finance",
  palier: 4,
  blocs: ["DSCG UE2 · Finance"],
  titre: "La création de valeur : rentabilité économique et coût du capital",
  accroche:
    "Un bénéfice ne suffit pas : les associés attendent de leur argent plus que ce qu'il rapporterait sans risque. L'entreprise crée de la valeur quand son outil rapporte plus que ne coûtent, ensemble, la dette et les capitaux propres.",
  objectifs: [
    "Estimer le coût des capitaux propres par un taux sans risque, un bêta et une prime de risque",
    "Calculer le coût moyen pondéré du capital à partir du bilan",
    "Calculer l'EVA et dire si l'entreprise crée ou détruit de la valeur",
    "Recouper l'EVA par le résultat résiduel",
    "Mesurer ce qu'un investissement change à la valeur créée",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_LEVIER,
    pourquoi:
      "Le coût du capital se pondère là où l'année finit en bénéfice et où l'entreprise doit plus aux banques qu'elle n'a en caisse, comme pour l'effet de levier : L'ESCALE, VOLT FITNESS et MARTEL & FILS. NOVA, LA TABLE D'AUGUSTIN et ATLAS CONSEIL finissent l'année en perte ; MAILLE & CO, PIXEL & CO et ROUTE & CIE ont plus de disponibilités que d'emprunts.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce que coûte le capital",
      notions: ["profitability_vs_return", "enterprise_value"],
      texte: (c) => {
        const { s, k } = creationDeValeur(c);
        return [
          `Sur l'année, ${c.entreprise} gagne ${eur(s.resultatNet)}, et son outil rapporte ${pct(k.r.re)} après impôt. Est-ce assez ? La banque est payée par les charges financières ; les associés, eux, ne reçoivent que ce qui reste, et ils l'attendent plus élevé que ce que leur rapporterait un placement sans risque, puisqu'ils prennent le risque de l'exploitation.`,
          "Le capital a donc un coût, même celui des associés, qui n'apparaît dans aucun compte : c'est ce qu'ils renoncent à gagner ailleurs pour un risque comparable. L'entreprise crée de la valeur quand son outil rapporte plus que ne coûtent, pondérés, la dette et les capitaux propres.",
          "L'arène ne cote pas ses entreprises : le coût des capitaux propres repose sur trois hypothèses du cours, au tableau.",
        ];
      },
      tableau: tableauDesHypotheses,
      repere: () => "EVA = (Re − CMPC) × actif économique : positive, l'entreprise crée de la valeur ; négative, elle en détruit.",
    },
    {
      id: "cout-des-capitaux-propres",
      type: "montants",
      titre: "Le coût des capitaux propres",
      notions: ["total_shareholder_return"],
      tableau: tableauDesHypotheses,
      question: (c) => {
        const { tauxIS } = creationDeValeur(c);
        return `Plus l'entreprise est endettée, plus les associés portent de risque. Calculez le bêta des capitaux propres, βcp = βa × (1 + (1 − ${nombre(tauxIS)}) × endettement net ÷ capitaux propres), à deux décimales, puis le coût des capitaux propres, kcp = taux sans risque + βcp × prime de risque (en %).`;
      },
      champs: (c) => {
        const { s, k, tauxIS } = creationDeValeur(c);
        return [
          {
            libelle: "Bêta des capitaux propres",
            attendu: k.beta,
            calcul: `${nombre(BETA_DE_L_ACTIF)} × (1 + ${nombre(1 - tauxIS)} × ${eur(s.endettementNet)} ÷ ${eur(s.capitauxPropres)}) = ${nombre(k.beta)}`,
            tolerance: 0.01,
          },
          {
            libelle: "Coût des capitaux propres, kcp (%)",
            attendu: k.kcp,
            calcul: `${pct(TAUX_SANS_RISQUE * 100)} + ${nombre(k.beta)} × ${pct(PRIME_DE_RISQUE_DU_MARCHE * 100)} = ${pct(k.kcp)}`,
            tolerance: 0.02,
          },
        ];
      },
      explication: (c) => {
        const { k } = creationDeValeur(c);
        return [
          `Les associés ${dE(c.entreprise)} exigent ${pct(k.kcp)} par an : ${pct(TAUX_SANS_RISQUE * 100)} pour le temps, et ${points(auCentieme(k.kcp - TAUX_SANS_RISQUE * 100))} pour le risque. Le bêta de l'activité est le même pour toutes les entreprises du chapitre ; c'est la dette qui fait monter celui des associés à ${nombre(k.beta)}, parce qu'ils sont payés après la banque.`,
          `C'est plus que les ${pct(k.r.i)} que coûte l'endettement net : le prêteur passe en premier, il prend moins de risque, et ses intérêts se déduisent de l'impôt.`,
        ];
      },
    },
    {
      id: "cmpc",
      type: "montants",
      titre: "Le coût moyen pondéré du capital",
      notions: ["profitability_vs_return", "loan_schedule"],
      question: (c) => {
        const { k } = creationDeValeur(c);
        return `L'outil est financé par les capitaux propres et par l'endettement net, dont la somme est l'actif économique. Calculez le poids de chacun dans l'actif économique (en %), puis le coût moyen pondéré du capital, CMPC = kcp × poids des capitaux propres + i × poids de la dette, avec kcp = ${pct(k.kcp)} et i = ${pct(k.r.i)} (en %).`;
      },
      champs: (c) => {
        const { s, k } = creationDeValeur(c);
        return [
          { libelle: "Poids des capitaux propres (%)", attendu: k.poidsCP, calcul: `${eur(s.capitauxPropres)} ÷ ${eur(s.actifEconomique)} × 100 = ${pct(k.poidsCP)}`, tolerance: 0.01 },
          { libelle: "Poids de l'endettement net (%)", attendu: k.poidsD, calcul: `${eur(s.endettementNet)} ÷ ${eur(s.actifEconomique)} × 100 = ${pct(k.poidsD)}`, tolerance: 0.01 },
          {
            libelle: "Coût moyen pondéré du capital, CMPC (%)",
            attendu: k.cmpc,
            calcul: `${pct(k.kcp)} × ${pct(k.poidsCP)} + ${pct(k.r.i)} × ${pct(k.poidsD)} = ${pct(k.cmpc)}`,
            tolerance: 0.02,
          },
        ];
      },
      explication: (c) => {
        const { k } = creationDeValeur(c);
        return [
          `Chaque tranche de 100 € d'actif économique coûte ${nombre(k.cmpc)} € par an à ceux qui la financent : c'est le rendement que l'outil doit au moins dégager pour que personne ne perde à financer l'outil.`,
          "Les pondérations sont ici celles du bilan, en valeur comptable. Dans une société cotée, on pondère par la valeur de marché des capitaux propres, que l'arène ne donne pas.",
        ];
      },
    },
    {
      id: "eva",
      type: "montants",
      titre: "La valeur créée sur l'année",
      notions: ["enterprise_value", "profitability_vs_return"],
      question: (c) => {
        const { k } = creationDeValeur(c);
        return `L'outil rapporte Re = ${pct(k.r.re)} après impôt, le capital qui le finance coûte ${pct(k.cmpc)}. Calculez l'écart entre les deux, en points, puis l'EVA, (Re − CMPC) × actif économique.`;
      },
      champs: (c) => {
        const { s, k } = creationDeValeur(c);
        return [
          { libelle: "Re moins CMPC (points)", attendu: k.ecart, calcul: `${pct(k.r.re)} − ${pct(k.cmpc)} = ${points(k.ecart)}`, tolerance: 0.02 },
          {
            libelle: "EVA de l'année",
            attendu: k.eva,
            calcul: `${pct(k.ecart)} × ${eur(s.actifEconomique)} = ${eur(k.eva)}`,
            tolerance: k.toleranceEva,
          },
        ];
      },
      explication: (c) => {
        const { k } = creationDeValeur(c);
        return [
          k.eva >= 0
            ? `L'outil rapporte ${points(k.ecart)} de plus que ne coûte le capital qui le finance : sur l'année, ${eur(k.eva)} de valeur créée, au-delà de ce qu'exigeaient la banque et les associés.`
            : `L'outil rapporte ${points(-k.ecart)} de moins que ne coûte le capital qui le finance : sur l'année, ${eur(-k.eva)} de valeur détruite, malgré le bénéfice.`,
          "L'EVA, valeur ajoutée économique, mesure ce que l'année laisse aux apporteurs de capitaux au-delà de leur exigence. Additionnées et actualisées, les EVA à venir font la valeur que le marché ajoute à l'actif économique.",
        ];
      },
    },
    {
      id: "verdict",
      type: "choix",
      titre: "Créer ou détruire de la valeur",
      notions: ["enterprise_value"],
      question: (c) => {
        const { s, k } = creationDeValeur(c);
        return `${c.entreprise} finit l'année avec ${eur(s.resultatNet)} de résultat net, une rentabilité économique de ${pct(k.r.re)} et un CMPC de ${pct(k.cmpc)}. Que dire de son année ?`;
      },
      options: (c) => {
        const { s, k, verdict } = creationDeValeur(c);
        return [
          {
            texte: "Elle crée de la valeur : son outil rapporte plus que ne coûte le capital",
            juste: verdict === "cree",
            retour:
              verdict === "cree"
                ? `Oui : ${pct(k.r.re)} contre ${pct(k.cmpc)}, soit ${eur(k.eva)} de valeur créée. Les associés reçoivent plus que les ${pct(k.kcp)} qu'ils exigeaient.`
                : `Non : l'outil rapporte ${pct(k.r.re)}, moins que les ${pct(k.cmpc)} que coûte le capital.`,
          },
          {
            texte: "Elle détruit de la valeur : son outil rapporte moins que ne coûte le capital",
            juste: verdict === "detruit",
            retour:
              verdict === "detruit"
                ? `Oui : ${pct(k.r.re)} contre ${pct(k.cmpc)}, soit ${eur(-k.eva)} de valeur détruite. Le bénéfice de ${eur(s.resultatNet)} ne rémunère pas les associés au niveau de leur risque : ils feraient mieux ailleurs.`
                : `Non : l'outil rapporte ${pct(k.r.re)}, plus que les ${pct(k.cmpc)} que coûte le capital.`,
          },
          {
            texte: "Le bénéfice suffit : une entreprise qui gagne de l'argent crée de la valeur",
            juste: false,
            retour: `Non : le résultat net vient après la rémunération de la banque, pas après celle des associés. Pour créer de la valeur, il doit dépasser ce qu'ils exigent, ${eur(k.exigence)} cette année.`,
          },
        ];
      },
    },
    {
      id: "residuel",
      type: "montants",
      titre: "Le résultat résiduel, pour recouper",
      notions: ["total_shareholder_return"],
      question: (c) => {
        const { k } = creationDeValeur(c);
        return `Les associés exigeaient ${pct(k.kcp)} sur leurs capitaux propres. Calculez ce que cette exigence représente en euros, puis le résultat résiduel : le résultat net moins cette exigence.`;
      },
      champs: (c) => {
        const { s, k } = creationDeValeur(c);
        return [
          {
            libelle: "Exigence des associés",
            attendu: k.exigence,
            calcul: `${pct(k.kcp)} × ${eur(s.capitauxPropres)} = ${eur(k.exigence)}`,
            tolerance: Math.max(1, Math.ceil(s.capitauxPropres * 0.0002)),
          },
          {
            libelle: "Résultat résiduel",
            attendu: k.residuel,
            calcul: `${eur(s.resultatNet)} − ${retranche(k.exigence)} = ${eur(k.residuel)}`,
            tolerance: Math.max(1, Math.ceil(s.capitauxPropres * 0.0002)),
          },
        ];
      },
      explication: (c) => {
        const { k } = creationDeValeur(c);
        const ecart = auCentime(Math.abs(k.residuel - k.eva));
        return [
          ecart < 1
            ? `Le résultat résiduel, ${eur(k.residuel)}, est l'EVA de l'étape précédente.`
            : `Le résultat résiduel, ${eur(k.residuel)}, est l'EVA de l'étape précédente, ${eur(k.eva)}, aux arrondis des taux près.`,
          "Ce n'est pas un hasard : l'EVA retire de ce que rapporte l'outil le coût de la dette et l'exigence des associés ; le résultat net a déjà retiré le coût de la dette. Les deux disent la même chose, l'un du côté de l'outil, l'autre du côté des associés.",
        ];
      },
    },
    {
      id: "l-equipement",
      type: "montants",
      titre: "L'arène rejoue l'année avec un équipement de plus",
      notions: ["enterprise_value", "capacity"],
      tableau: (c) => {
        const { s, k, avec, k2 } = creationDeValeur(c);
        return {
          titre: "L'année jouée, sans et avec l'équipement de plus",
          colonnes: ["Sans", "Avec"],
          lignes: [
            { libelle: "Résultat d'exploitation", valeurs: [eur(s.resultatDExploitation), eur(avec.resultatDExploitation)] },
            { libelle: "Résultat net", valeurs: [eur(s.resultatNet), eur(avec.resultatNet)] },
            { libelle: "Actif économique au 31 décembre", valeurs: [eur(s.actifEconomique), eur(avec.actifEconomique)] },
            { libelle: "Capitaux propres au 31 décembre", valeurs: [eur(s.capitauxPropres), eur(avec.capitauxPropres)] },
            { libelle: "Endettement net au 31 décembre", valeurs: [eur(s.endettementNet), eur(avec.endettementNet)] },
            { libelle: "Rentabilité économique après impôt", valeurs: [pct(k.r.re), pct(k2.r.re)] },
            { libelle: "Coût des capitaux propres", valeurs: [pct(k.kcp), pct(k2.kcp)] },
            { libelle: "CMPC", valeurs: [pct(k.cmpc), pct(k2.cmpc)] },
          ],
        };
      },
      question: (c) => {
        const { machine, prix, k } = creationDeValeur(c);
        return `L'arène a rejoué l'année avec un équipement de plus, « ${machine} », acheté au trimestre ${TRIMESTRE_DE_L_ACHAT} pour ${eur(prix)} et payé par un emprunt du même montant. D'après le tableau, calculez l'EVA de l'année avec l'équipement, puis sa variation (avec moins sans, l'EVA sans étant de ${eur(k.eva)}).`;
      },
      champs: (c) => {
        const { k, avec, k2, variation } = creationDeValeur(c);
        return [
          {
            libelle: "EVA avec l'équipement",
            attendu: k2.eva,
            calcul: `(${pct(k2.r.re)} − ${pct(k2.cmpc)}) × ${eur(avec.actifEconomique)} = ${eur(k2.eva)}`,
            tolerance: k2.toleranceEva,
          },
          {
            libelle: "Variation de l'EVA",
            attendu: variation,
            calcul: `${eur(k2.eva)} − ${retranche(k.eva)} = ${eur(variation)}`,
            tolerance: k.toleranceEva + k2.toleranceEva,
          },
        ];
      },
      explication: (c) => {
        const { s, k, avec, k2, prix } = creationDeValeur(c);
        const actif = auCentime(avec.actifEconomique - s.actifEconomique);
        return [
          `L'équipement mobilise ${eur(actif)} d'actif économique en plus au 31 décembre : son prix, ${eur(prix)}, moins l'amortissement de ses trimestres en service, plus la variation du besoin en fonds de roulement. Il doit rapporter au moins le CMPC sur ce capital en plus.`,
          k2.r.re > k.r.re
            ? `La rentabilité économique monte de ${pct(k.r.re)} à ${pct(k2.r.re)} : l'équipement rapporte plus, en proportion, que l'outil d'avant.`
            : `La rentabilité économique baisse de ${pct(k.r.re)} à ${pct(k2.r.re)} : l'équipement rapporte moins, en proportion, que l'outil d'avant.`,
        ];
      },
    },
    {
      id: "l-equipement-cree-t-il",
      type: "choix",
      titre: "L'équipement crée-t-il de la valeur ?",
      notions: ["enterprise_value"],
      question: (c) => {
        const { s, avec } = creationDeValeur(c);
        const net = auCentime(avec.resultatNet - s.resultatNet);
        return `Avec l'équipement, le résultat net ${net >= 0 ? `gagne ${eur(net)}` : `perd ${eur(-net)}`} sur l'année. L'investissement crée-t-il de la valeur ?`;
      },
      options: (c) => {
        const { k, k2, variation, lEquipementCree } = creationDeValeur(c);
        return [
          {
            texte: "Oui : l'EVA monte, l'équipement rapporte plus que le capital qu'il mobilise ne coûte",
            juste: lEquipementCree,
            retour: lEquipementCree
              ? `Oui : sur cette première année, l'EVA passe de ${eur(k.eva)} à ${eur(k2.eva)}, ${eur(variation)} de plus. Un investissement crée de la valeur quand ce qu'il rapporte dépasse le coût du capital qui le finance, pas seulement le coût de son emprunt.`
              : `Non : l'EVA passe de ${eur(k.eva)} à ${eur(k2.eva)}.`,
          },
          {
            texte: "Non : l'EVA baisse, l'équipement rapporte moins que le capital qu'il mobilise ne coûte",
            juste: !lEquipementCree,
            retour: !lEquipementCree
              ? `C'est cela : sur cette première année, l'EVA passe de ${eur(k.eva)} à ${eur(k2.eva)}, ${eur(-variation)} de moins. Ce que l'équipement rapporte ne couvre pas le coût du capital qu'il immobilise.`
              : `Non : l'EVA passe de ${eur(k.eva)} à ${eur(k2.eva)}, ${eur(variation)} de plus.`,
          },
          {
            texte: "On ne peut pas le dire : seule compte la variation du résultat net",
            juste: false,
            retour:
              "Non : le résultat net ne compte pas l'exigence des associés sur le capital que l'équipement immobilise. Un investissement peut faire monter le résultat net et détruire de la valeur, s'il rapporte moins que le capital qu'il mobilise ne coûte.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["enterprise_value", "profitability_vs_return"],
      texte: (c) => {
        const { k, verdict } = creationDeValeur(c);
        return [
          `Chez ${c.entreprise}, l'outil rapporte ${pct(k.r.re)} après impôt et le capital coûte ${pct(k.cmpc)} : l'année ${verdict === "cree" ? `crée ${eur(k.eva)}` : `détruit ${eur(-k.eva)}`} de valeur.`,
          "Être rentable ne suffit pas : il faut l'être plus que ce qu'exigent ceux qui financent l'outil. Le CMPC est le taux de référence de toute décision : un investissement, un rachat, un changement de structure créent de la valeur quand ils rapportent plus que lui sur le capital qu'ils mobilisent. L'endettement abaisse le CMPC tant que la dette coûte moins que les capitaux propres, mais il fait monter l'exigence des associés avec le risque qu'il leur fait porter.",
        ];
      },
      repere: () => "CMPC = kcp × CP ÷ (CP + D) + i × D ÷ (CP + D) ; EVA = (Re − CMPC) × actif économique = résultat net − kcp × CP.",
    },
  ],
};
