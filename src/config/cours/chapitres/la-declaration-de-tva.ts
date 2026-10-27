import type { CompanyRoundResult } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { nomEntreprise } from "../../scenarios/presentation";
import { scenarioByCode } from "../../scenarios/registry";
import { type Cas } from "../cas";
import { anneeJouee } from "../annee-de-l-arene";
import { ENTREPRISES_DU_COURS, METIERS } from "../metiers";
import type { Chapitre } from "../types";
import { achatsDuTrimestre } from "./choisir-son-fournisseur";

/**
 * CHAPITRE : LA DÉCLARATION DE TVA, COLLECTÉE, DÉDUCTIBLE, À PAYER (fiscalité, palier 3).
 *
 * Les chiffres sont ceux que le moteur compte dans l'année du cours (`anneeJouee`), trimestre
 * par trimestre (src/engine/finance/statements.ts) :
 *
 *   · un seul taux, celui du scénario (`finance.vatRate`), sur toutes les ventes et tous les
 *     achats ;
 *   · la TVA collectée porte sur le chiffre d'affaires hors taxes du trimestre, facturé, que
 *     le client ait payé ou non ;
 *   · la TVA déductible porte sur les seuls achats du trimestre (matières, marchandises,
 *     carburant : `purchases`) ; les autres dépenses (charges de structure, publicité,
 *     entretien, investissements) se paient sans TVA dans l'arène ;
 *   · la TVA nette du trimestre (collectée moins déductible) est la dette « TVA à décaisser »
 *     du bilan de clôture, et se verse au trimestre suivant (« TVA décaissée » du budget de
 *     trésorerie) ; négative, c'est un crédit de TVA, que le trimestre suivant fait rentrer.
 *
 * Le chapitre le dit à l'élève comme des simplifications du moteur, sans rien affirmer du
 * droit fiscal que le moteur ne fait pas : il ne fixe ni jour d'échéance, ni régime, ni règle
 * d'exigibilité selon la nature de l'opération.
 *
 * LA TVA NE JOUE QUE LÀ OÙ LE SCÉNARIO LA FIXE. Dans l'année du cours, seuls le bâtiment et le
 * transport ont un taux de TVA ; les autres entreprises jouent hors taxes (taux absent, donc
 * nul pour le moteur), et ce chapitre n'y aurait rien à déclarer.
 */

/** Les entreprises du cours dont le scénario fixe un taux de TVA : les seules où le moteur la compte. */
export const ENTREPRISES_OU_LA_TVA_JOUE = ENTREPRISES_DU_COURS.filter((code) => (scenarioByCode(code).scenario.finance.vatRate ?? 0) > 0);

/** Pourquoi ces chapitres ne se jouent pas ailleurs, en une phrase dite à l'élève (celle des cas aussi). */
export const POURQUOI_LA_TVA = `son scénario se joue hors taxes : le moteur n'y compte pas de TVA, il n'y aurait rien à déclarer. Seules ${ENTREPRISES_OU_LA_TVA_JOUE.map((code) => nomEntreprise(scenarioByCode(code))).join(" et ")} ont un taux de TVA dans l'arène.`;

/**
 * Le trimestre que le chapitre déclare : le deuxième (avril à juin). Sa TVA se verse au
 * troisième, qui est encore dans l'année jouée : on la retrouve dans le budget de trésorerie.
 */
export const TRIMESTRE_DECLARE = 2;

export const NOMS_DES_TRIMESTRES = ["premier", "deuxième", "troisième", "quatrième"] as const;
export const FINS_DES_TRIMESTRES = ["31 mars", "30 juin", "30 septembre", "31 décembre"] as const;
export const MOIS_DES_TRIMESTRES = ["janvier à mars", "avril à juin", "juillet à septembre", "octobre à décembre"] as const;

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const dE = (mot: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(mot) ? `d'${mot}` : `de ${mot}`);

/** Ce que l'entreprise achète pour produire, en un mot : « matériaux », « gazole ». */
export const natureDesAchats = (c: Cas) => METIERS[c.code]!.achat.designation("").split(" pour ")[0]!.toLowerCase();

const flux = (r: CompanyRoundResult, label: string) => r.cashFlow.items.find((i) => i.label === label)?.amount ?? 0;

/** La TVA d'un trimestre (1 à 4), en euros, comme une déclaration : arrondie à l'euro. */
function trimestre(r: CompanyRoundResult, taux: number, numero: number) {
  const ventes = Math.round(r.incomeStatement.revenue);
  const achats = Math.round(achatsDuTrimestre(r));
  const collectee = Math.round(ventes * taux);
  const deductible = Math.round(achats * taux);
  return {
    numero,
    ventes,
    achats,
    collectee,
    deductible,
    nette: collectee - deductible,
    /** Ce que le budget de trésorerie du trimestre verse à l'État : la TVA du trimestre d'avant. */
    versee: Math.round(-flux(r, "tva_decaissee")) || 0,
    /** La dette « TVA à décaisser » du bilan de clôture, telle que le moteur la porte. */
    aDecaisser: Math.round(r.balanceSheet.vatLiability ?? 0),
  };
}

export type TvaDuTrimestre = ReturnType<typeof trimestre>;

const declarations = new Map<string, ReturnType<typeof calculer>>();

function calculer(c: Cas) {
  const taux = scenarioByCode(c.code).scenario.finance.vatRate ?? 0;
  const { partie, depart } = anneeJouee(c.code);
  const trimestres = partie.rounds.map((t, k) => trimestre(t.results["joueur"]!, taux, k + 1));
  const declare = trimestres[TRIMESTRE_DECLARE - 1]!;
  const achatsDeLAnnee = trimestres.reduce((t, x) => t + x.achats, 0);
  // L'hypothèse du crédit : les achats de toute l'année faits au trimestre déclaré, pour ses mêmes ventes.
  const credit = Math.round(declare.ventes * taux) - Math.round(achatsDeLAnnee * taux);
  return {
    taux,
    nature: natureDesAchats(c),
    trimestres,
    declare,
    /** La TVA que le bilan d'ouverture doit à l'État : aucune, l'arène commence sans dette de TVA. */
    ouverture: Math.round(depart.finance.vatLiability ?? 0),
    /** Ce que l'entreprise a versé à l'État pendant l'année : la « TVA décaissée » des quatre budgets de trésorerie. */
    verseeDansLAnnee: trimestres.reduce((t, x) => t + x.versee, 0),
    /** La « TVA à décaisser » du bilan du 31 décembre : la TVA du quatrième trimestre. */
    dueAuBilan: trimestres.at(-1)!.aDecaisser,
    achatsDeLAnnee,
    credit,
  };
}

/** La TVA de l'année du cours, trimestre par trimestre, et le trimestre que le chapitre déclare. */
export function declarationDeTva(c: Cas) {
  const deja = declarations.get(c.code);
  if (deja) return deja;
  const d = calculer(c);
  declarations.set(c.code, d);
  return d;
}

const nomDuTrimestre = (k: number) => `${NOMS_DES_TRIMESTRES[k - 1]} trimestre`;

export const LA_DECLARATION_DE_TVA: Chapitre = {
  code: "la-declaration-de-tva",
  parcours: "fiscalite",
  palier: 3,
  blocs: [
    "BTS CG P3 · Gestion des obligations fiscales",
    "DCG UE4 · Droit fiscal",
    "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation",
  ],
  titre: "La déclaration de TVA : collectée, déductible, à payer",
  accroche:
    "Un trimestre de l'arène, déclaré comme le moteur le compte : la TVA collectée sur les ventes, la TVA déductible sur les achats, ce qui reste dû à l'État, et ce que devient un crédit de TVA.",
  objectifs: [
    "Calculer la TVA collectée, la TVA déductible et la TVA à décaisser d'un trimestre",
    "Passer l'écriture qui solde les comptes de TVA et constate la dette envers l'État",
    "Situer l'échéance de la TVA dans le budget de trésorerie et au bilan",
    "Lire un crédit de TVA, et ce que l'arène simplifie",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_OU_LA_TVA_JOUE, pourquoi: POURQUOI_LA_TVA },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une déclaration par trimestre",
      notions: ["vat_payable"],
      texte: (c) => {
        const d = declarationDeTva(c);
        const t = nomDuTrimestre(TRIMESTRE_DECLARE);
        return [
          `${c.entreprise} facture la TVA à ses clients et la paie à ses fournisseurs. Cette TVA n'est pas la sienne : chaque trimestre, elle déclare à l'État la TVA qu'elle a collectée, en retire celle qu'elle a payée sur ses achats, et lui verse la différence. Voici son ${t}, ${MOIS_DES_TRIMESTRES[TRIMESTRE_DECLARE - 1]}, tel que l'arène l'a joué.`,
          `L'arène compte la TVA ainsi : un seul taux, celui du scénario (${pct(d.taux)}), sur toutes les ventes et tous les achats ; la TVA collectée sur les ventes facturées du trimestre, que le client ait payé ou non ; la TVA déductible sur les achats ${dE(d.nature)} ; et la différence, inscrite au bilan comme « TVA à décaisser », versée au trimestre suivant.`,
          "Ce sont des simplifications. Dans la réalité, plusieurs taux existent, le moment où la TVA devient due dépend de la nature de l'opération, et le rythme de la déclaration dépend du régime de l'entreprise (chaque mois au régime réel normal, par exemple). L'arène déclare au trimestre, son unité de temps.",
        ];
      },
      tableau: (c) => {
        const d = declarationDeTva(c);
        return {
          titre: `Le ${nomDuTrimestre(TRIMESTRE_DECLARE)} ${dE(c.entreprise)}, dans l'arène`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Ventes du trimestre (hors taxes)", valeurs: [eur(d.declare.ventes)] },
            { libelle: `Achats ${dE(d.nature)} du trimestre (hors taxes)`, valeurs: [eur(d.declare.achats)] },
            { libelle: "Taux de TVA du scénario", valeurs: [pct(d.taux)] },
          ],
        };
      },
      repere: () =>
        "TVA collectée = ventes hors taxes × taux. TVA déductible = achats hors taxes × taux. TVA à décaisser = TVA collectée − TVA déductible ; négative, c'est un crédit de TVA.",
    },
    {
      id: "calcul",
      type: "montants",
      titre: "Collectée, déductible, à décaisser",
      notions: ["vat_payable"],
      question: (c) =>
        `Calculez la TVA collectée et la TVA déductible du ${nomDuTrimestre(TRIMESTRE_DECLARE)} ${dE(c.entreprise)}, à l'euro près, puis la TVA à décaisser.`,
      champs: (c) => {
        const d = declarationDeTva(c);
        const x = d.declare;
        return [
          { libelle: "TVA collectée", attendu: x.collectee, calcul: `${eur(x.ventes)} × ${pct(d.taux)} = ${eur(x.collectee)}`, tolerance: 1 },
          { libelle: "TVA déductible", attendu: x.deductible, calcul: `${eur(x.achats)} × ${pct(d.taux)} = ${eur(x.deductible)}`, tolerance: 1 },
          { libelle: "TVA à décaisser", attendu: x.nette, calcul: `${eur(x.collectee)} − ${eur(x.deductible)} = ${eur(x.nette)}`, tolerance: 2 },
        ];
      },
      explication: (c) => {
        const d = declarationDeTva(c);
        return [
          `Au ${FINS_DES_TRIMESTRES[TRIMESTRE_DECLARE - 1]}, ${c.entreprise} doit ${eur(d.declare.nette)} à l'État : c'est la ligne « TVA à décaisser » du passif, au bilan de l'arène (${eur(d.declare.aDecaisser)}).`,
          "Rien de cela n'est passé par le compte de résultat : les ventes et les achats y sont hors taxes. La TVA est une dette envers l'État, ou une créance sur lui.",
        ];
      },
    },
    {
      id: "liquidation",
      type: "ecriture",
      titre: "L'écriture de la déclaration",
      notions: ["vat_payable", "balance_sheet"],
      si: (c) => declarationDeTva(c).declare.nette > 0,
      evenement: (c) => {
        const x = declarationDeTva(c).declare;
        return `Le ${FINS_DES_TRIMESTRES[TRIMESTRE_DECLARE - 1]}, ${c.entreprise} arrête la TVA du trimestre : le compte de TVA collectée porte ${eur(x.collectee)} au crédit, celui de TVA déductible ${eur(x.deductible)} au débit. Passez l'écriture qui solde ces deux comptes et constate ce qui est dû à l'État.`;
      },
      piece: (c) => {
        const x = declarationDeTva(c).declare;
        return {
          nature: `Déclaration de TVA du ${nomDuTrimestre(TRIMESTRE_DECLARE)}`,
          de: c.entreprise,
          a: "L'administration fiscale",
          date: FINS_DES_TRIMESTRES[TRIMESTRE_DECLARE - 1]!,
          lignes: [
            { libelle: "TVA brute, collectée sur les ventes", montant: x.collectee },
            { libelle: "TVA déductible, sur les achats", montant: x.deductible },
          ],
          totaux: [{ libelle: "TVA nette due", montant: x.nette, fort: true }],
          mention: "À verser au trimestre suivant.",
        };
      },
      ecriture: (c) => {
        const x = declarationDeTva(c).declare;
        return {
          date: FINS_DES_TRIMESTRES[TRIMESTRE_DECLARE - 1]!,
          libelle: `Déclaration de TVA du ${nomDuTrimestre(TRIMESTRE_DECLARE)}`,
          lignes: [
            { role: "la TVA collectée, soldée", compte: "44571", sens: "debit", montant: x.collectee, indice: "la TVA collectée du trimestre" },
            { role: "la TVA déductible, soldée", compte: "44566", sens: "credit", montant: x.deductible, indice: "la TVA déductible du trimestre" },
            { role: "la dette envers l'État", compte: "44551", sens: "credit", montant: x.nette, indice: "la différence, que l'entreprise doit à l'État" },
          ],
        };
      },
      indices: () => [
        "La TVA collectée est au crédit du compte 44571 : pour la solder, on la passe au débit. La TVA déductible est au débit du 44566 : on la solde au crédit.",
        "La différence est une dette envers l'État, au crédit d'un compte de la classe 4 : 44551, TVA à décaisser.",
      ],
      explication: (c) => {
        const d = declarationDeTva(c);
        return [
          `Les comptes de TVA collectée et déductible sont soldés : il ne reste que ${eur(d.declare.nette)} au crédit du 44551, la dette envers l'État.`,
          `Elle s'éteindra au ${nomDuTrimestre(TRIMESTRE_DECLARE + 1)}, quand l'entreprise paiera : débit 44551, crédit 512.`,
        ];
      },
    },
    {
      id: "deductible",
      type: "choix",
      titre: "Ce que l'arène déduit",
      notions: ["vat_payable"],
      question: (c) => {
        const d = declarationDeTva(c);
        return `Pendant le ${nomDuTrimestre(TRIMESTRE_DECLARE)}, ${c.entreprise} a payé ses achats ${dE(d.nature)}, mais aussi ses charges de structure, sa publicité et l'entretien de son équipement. Sur quoi l'arène lui fait-elle déduire de la TVA ?`;
      },
      options: (c) => {
        const d = declarationDeTva(c);
        return [
          {
            texte: `Sur les seuls achats ${dE(d.nature)}`,
            juste: true,
            retour: `Oui : dans l'arène, les autres dépenses se paient sans TVA, il n'y a rien à en déduire. C'est une simplification du moteur : dans la réalité, la TVA portée sur la facture d'une dépense de l'entreprise se déduit aussi, quand la loi le permet.`,
          },
          {
            texte: "Sur toutes ses dépenses, y compris les salaires",
            juste: false,
            retour: "Non : un salaire ne porte pas de TVA, il n'y a rien à en déduire. Et dans l'arène, seuls les achats de la production en portent.",
          },
          {
            texte: "Sur aucune : la TVA payée aux fournisseurs est une charge",
            juste: false,
            retour: `Non : la TVA payée sur les achats se récupère, c'est la TVA déductible (${eur(d.declare.deductible)} ce trimestre). Elle n'entre pas au compte de résultat.`,
          },
        ];
      },
    },
    {
      id: "echeance",
      type: "montants",
      titre: "Quand la TVA se paie",
      notions: ["vat_payable", "cash_budget"],
      tableau: (c) => {
        const d = declarationDeTva(c);
        return {
          titre: `La TVA ${dE(c.entreprise)}, trimestre par trimestre`,
          colonnes: d.trimestres.map((x) => `${x.numero}${x.numero === 1 ? "er" : "e"} trimestre`),
          lignes: [
            { libelle: "Ventes (hors taxes)", valeurs: d.trimestres.map((x) => eur(x.ventes)) },
            { libelle: `Achats ${dE(d.nature)} (hors taxes)`, valeurs: d.trimestres.map((x) => eur(x.achats)) },
            { libelle: "TVA à décaisser à la clôture", valeurs: d.trimestres.map((x) => eur(x.aDecaisser)) },
            { libelle: "« TVA décaissée » au budget de trésorerie", valeurs: d.trimestres.map((x) => eur(x.versee)) },
          ],
        };
      },
      question: (c) =>
        `Dans l'arène, la TVA d'un trimestre se verse au trimestre suivant. Combien ${c.entreprise} a-t-elle versé à l'État pendant l'année, et combien lui doit-elle encore au bilan du 31 décembre ?`,
      champs: (c) => {
        const d = declarationDeTva(c);
        const versees = d.trimestres.slice(1).map((x) => x.versee);
        return [
          {
            libelle: "TVA versée à l'État pendant l'année",
            attendu: d.verseeDansLAnnee,
            calcul: `la TVA décaissée du deuxième au quatrième trimestre, celle des trois premiers : ${versees.map(eur).join(" + ")} = ${eur(d.verseeDansLAnnee)}`,
            tolerance: 2,
          },
          {
            libelle: "TVA due à l'État au 31 décembre",
            attendu: d.dueAuBilan,
            calcul: `la TVA du ${nomDuTrimestre(4)}, versée l'année suivante : ${eur(d.dueAuBilan)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const d = declarationDeTva(c);
        return [
          `Au ${nomDuTrimestre(1)}, l'arène ne verse rien : le bilan d'ouverture ne doit pas de TVA à l'État. Ensuite, chaque trimestre paie celui d'avant : la ligne « TVA décaissée » du budget de trésorerie est la « TVA à décaisser » du bilan précédent.`,
          `La TVA du ${nomDuTrimestre(4)}, ${eur(d.dueAuBilan)}, reste au passif du bilan du 31 décembre : une dette de l'exercice qui se paiera dans l'exercice suivant.`,
        ];
      },
    },
    {
      id: "credit",
      type: "montants",
      titre: "Un trimestre de gros achats",
      notions: ["vat_payable"],
      question: (c) => {
        const d = declarationDeTva(c);
        return `Supposez qu'au ${nomDuTrimestre(TRIMESTRE_DECLARE)}, ${c.entreprise} ait fait d'un coup les achats ${dE(d.nature)} de toute l'année, ${eur(d.achatsDeLAnnee)} hors taxes, pour les mêmes ventes (${eur(d.declare.ventes)}). Calculez la TVA du trimestre (négative si l'État doit de l'argent à l'entreprise).`;
      },
      champs: (c) => {
        const d = declarationDeTva(c);
        const collectee = Math.round(d.declare.ventes * d.taux);
        const deductible = Math.round(d.achatsDeLAnnee * d.taux);
        return [
          {
            libelle: "TVA du trimestre, collectée moins déductible",
            attendu: d.credit,
            calcul: `${eur(collectee)} − ${eur(deductible)} = ${eur(d.credit)}`,
            tolerance: 2,
          },
        ];
      },
      explication: (c) => {
        const d = declarationDeTva(c);
        return d.credit < 0
          ? [`La TVA déductible dépasse la TVA collectée : l'entreprise a payé plus de TVA qu'elle n'en a facturé. L'État lui doit ${eur(-d.credit)} : c'est un crédit de TVA.`]
          : [`La TVA collectée reste la plus forte : l'entreprise doit encore ${eur(d.credit)} à l'État.`];
      },
    },
    {
      id: "lire-le-credit",
      type: "choix",
      titre: "Lire un crédit de TVA",
      notions: ["vat_payable", "balance_sheet"],
      question: (c) => {
        const d = declarationDeTva(c);
        return `Le bilan de l'arène montrerait alors, au passif, « Crédit de TVA (−) » : ${eur(Math.min(0, d.credit))}. Que devient ce crédit dans l'arène ?`;
      },
      options: (c) => {
        const d = declarationDeTva(c);
        const montant = eur(Math.abs(d.credit));
        return [
          {
            texte: "L'État le doit à l'entreprise : l'arène le lui rend au trimestre suivant",
            juste: true,
            retour: `Oui : un passif négatif est une créance sur l'État, ${montant} ici, et la ligne « TVA décaissée » du trimestre suivant devient une rentrée d'argent. C'est une simplification : dans la réalité, un crédit de TVA s'impute sur les déclarations suivantes, ou se fait rembourser sur demande, sous conditions.`,
          },
          {
            texte: "Il est perdu : la TVA payée en trop devient une charge du trimestre",
            juste: false,
            retour: "Non : la TVA déductible se récupère même quand elle dépasse la TVA collectée. Rien n'entre au compte de résultat.",
          },
          {
            texte: "L'entreprise le doit à l'État, et le paie au trimestre suivant",
            juste: false,
            retour: `Non : c'est l'inverse. Le signe moins, au passif, dit que l'État doit ${montant} à l'entreprise.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["vat_payable"],
      texte: (c) => {
        const d = declarationDeTva(c);
        return [
          `Au ${nomDuTrimestre(TRIMESTRE_DECLARE)}, ${c.entreprise} a collecté ${eur(d.declare.collectee)} de TVA sur ses ventes, en a déduit ${eur(d.declare.deductible)} sur ses achats, et doit ${eur(d.declare.nette)} à l'État, versés au trimestre suivant. Sur l'année, elle a versé ${eur(d.verseeDansLAnnee)} et en doit encore ${eur(d.dueAuBilan)} au 31 décembre.`,
          "La TVA ne touche pas le résultat : elle passe par des comptes de tiers, collectée au crédit, déductible au débit, et la différence est une dette envers l'État, ou une créance quand la TVA déductible l'emporte.",
          "L'arène simplifie : un taux unique, une déclaration par trimestre, la TVA due dès la facture, déduite sur les seuls achats, et un crédit rendu au trimestre suivant.",
        ];
      },
      repere: (c) => {
        const d = declarationDeTva(c);
        return `TVA à décaisser = TVA collectée − TVA déductible. Au ${nomDuTrimestre(TRIMESTRE_DECLARE)} : ${eur(d.declare.collectee)} − ${retranche(d.declare.deductible)} = ${eur(d.declare.nette)}.`;
      },
    },
  ],
};
