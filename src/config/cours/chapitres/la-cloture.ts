import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime, type Ecriture, type Ligne } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import { dateDuCours as date } from "../dates";
import { compteDAmortissement } from "./immobilisations";
import { echeance } from "./l-emprunt";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LA CLÔTURE (comptabilité générale, palier 3).
 *
 * L'année de l'arène, ses quatre trimestres additionnés, arrive en balance avant
 * inventaire : les ventes, les achats, les charges de l'année, en grandes masses. L'élève
 * fait les travaux d'inventaire (la dotation aux amortissements, le stock là où il y en a
 * un), rattache à l'exercice ce qui lui appartient, calcule le résultat avant impôt, l'impôt
 * sur les sociétés et le résultat net.
 *
 * L'IMPÔT SE CALCULE SUR L'ANNÉE, comme le veut la loi, et l'arène fait de même : chaque
 * trimestre y verse un acompte sur l'impôt de l'exercice, régularisé au trimestre suivant
 * (`impotSurLExercice`). Le chapitre le fait constater à la fin, chiffres à l'appui.
 *
 * Les intérêts courus : dans l'arène, les intérêts se paient à la fin de chaque trimestre,
 * il n'y a rien à rattacher au 31 décembre. Le chapitre fait calculer ce qu'il faudrait
 * rattacher avec le contrat du chapitre « L'emprunt », sans l'ajouter à l'année de l'arène.
 */

const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

/** L'année commerciale des intérêts courus : des mois de trente jours, une échéance tous les trois mois. */
const JOURS_PAR_MOIS = 30;
const JOURS_DE_LA_PERIODE = 3 * JOURS_PAR_MOIS;
/** L'échéance qui tombe l'année suivante, et celle qui la précède. */
const ECHEANCE_DE_JANVIER = 4;

/** Les grandeurs de la clôture, calculées une fois de l'année. */
export function cloture(c: Cas) {
  const a = c.annee;
  const autres = auCentime(a.autresCoutsVariables + a.qualite);
  const chargesAvant = auCentime(a.achats + autres + a.commissions + a.publicite + a.entretien + a.loyerEtFrais + a.personnel + a.interets);
  const resultatAvantInventaire = auCentime(a.ventes - chargesAvant);
  const variation = a.stock ? auCentime(a.stock.final - a.stock.initial) : 0;
  const resultatAvantImpot = auCentime(resultatAvantInventaire - a.dotation + variation);
  const impot = resultatAvantImpot > 0 ? Math.round(resultatAvantImpot * a.tauxIS) : 0;
  // De l'échéance d'octobre au 31 décembre : la fin d'octobre, puis novembre et décembre.
  const joursDansLExercice = JOURS_PAR_MOIS - c.dates.emprunt + 2 * JOURS_PAR_MOIS;
  const icne = auCentime((echeance(c, ECHEANCE_DE_JANVIER).interets * joursDansLExercice) / JOURS_DE_LA_PERIODE);
  return {
    ...a,
    autres,
    chargesAvant,
    resultatAvantInventaire,
    variation,
    resultatAvantImpot,
    impot,
    resultatNet: auCentime(resultatAvantImpot - impot),
    icne,
    joursDansLExercice,
    echeanceDOctobre: echeance(c, ECHEANCE_DE_JANVIER - 1),
    echeanceDeJanvier: echeance(c, ECHEANCE_DE_JANVIER),
    compteAmortissement: compteDAmortissement(c.immobilisation.compte),
    comptesDuStock: a.stock?.nature === "en-cours" ? { stock: "335", variation: "7133" } : { stock: "37", variation: "6037" },
  };
}

/** La balance avant inventaire, en une écriture : la banque solde les comptes de bilan. */
export function balance(c: Cas): Ecriture {
  const k = cloture(c);
  const charges: [string, number][] = [
    [c.achat.compte, k.achats],
    ["62", k.autres],
    ["622", k.commissions],
    ["623", k.publicite],
    ["615", k.entretien],
    ["61", k.loyerEtFrais],
    ["64", k.personnel],
    ["661", k.interets],
  ];
  const lignes = charges.filter(([, m]) => m > 0).map(([compte, m]) => ({ compte, debit: m, credit: 0 }));
  if (k.stock && k.stock.initial > 0) lignes.push({ compte: k.comptesDuStock.stock, debit: k.stock.initial, credit: 0 });
  lignes.push({ compte: c.venteComptant.compte, debit: 0, credit: k.ventes });
  const debits = lignes.reduce((t, l) => t + l.debit, 0);
  const banque = auCentime(k.ventes - debits);
  lignes.push({ compte: "512", debit: banque > 0 ? banque : 0, credit: banque < 0 ? -banque : 0 });
  return { date: "31 décembre", libelle: "Balance avant inventaire : l'année de l'arène, en grandes masses", lignes };
}

/**
 * La balance une fois les travaux d'inventaire de ce chapitre passés : la dotation et le
 * stock. Les chapitres du palier suivant (dépréciations, régularisations) partent de là.
 */
export function balanceApresInventaire(c: Cas): Ligne[] {
  const k = cloture(c);
  const lignes = [...balance(c).lignes];
  lignes.push({ compte: "6811", debit: k.dotation, credit: 0 }, { compte: k.compteAmortissement, debit: 0, credit: k.dotation });
  if (k.stock && k.stock.initial > 0) {
    lignes.push({ compte: k.comptesDuStock.variation, debit: k.stock.initial, credit: 0 }, { compte: k.comptesDuStock.stock, debit: 0, credit: k.stock.initial });
  }
  if (k.stock && k.stock.final > 0) {
    lignes.push({ compte: k.comptesDuStock.stock, debit: k.stock.final, credit: 0 }, { compte: k.comptesDuStock.variation, debit: 0, credit: k.stock.final });
  }
  return lignes;
}

export const LA_CLOTURE: Chapitre = {
  code: "la-cloture",
  parcours: "comptabilite-generale",
  palier: 3,
  titre: "La clôture",
  accroche:
    "L'année de l'arène arrive en balance : vous passez les travaux d'inventaire, puis vous calculez le résultat, l'impôt et ce qui reste à l'entreprise.",
  objectifs: [
    "Lire une balance avant inventaire",
    "Passer les travaux d'inventaire : la dotation aux amortissements, le stock",
    "Rattacher à l'exercice les charges qui lui appartiennent",
    "Calculer le résultat avant impôt, l'impôt sur les sociétés et le résultat net",
    "Expliquer pourquoi l'impôt se calcule sur l'année",
  ],
  libre: false,
  ouverture: balance,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le 31 décembre",
      notions: ["income_statement"],
      texte: (c) => [
        `L'année de ${c.entreprise} dans l'arène est finie : quatre trimestres joués par le moteur. Le comptable les a additionnés dans une balance, en grandes masses : vous la trouvez dans le journal, déjà passée. La banque y solde, en une ligne, tout ce qui touche le bilan.`,
        "Avant de lire le résultat, il faut faire les travaux d'inventaire : passer ce qui n'apparaît qu'à la fin de l'année. L'usure de l'équipement, le stock, les charges qui appartiennent à l'année sans être encore payées. Ensuite seulement, l'impôt.",
      ],
      repere: () =>
        "Balance avant inventaire, travaux d'inventaire, résultat avant impôt, impôt, résultat net : la clôture se fait toujours dans cet ordre.",
    },
    {
      id: "resultat-provisoire",
      type: "montants",
      titre: "La balance avant inventaire",
      notions: ["income_statement"],
      question: (c) => {
        const k = cloture(c);
        return `La balance porte ${eur(k.ventes)} de ventes et ${eur(k.chargesAvant)} de charges : achats ${eur(k.achats)}, autres coûts variables (${c.gestion.autresCoutsVariables}) et qualité ${eur(k.autres)}${k.commissions > 0 ? `, commissions ${eur(k.commissions)}` : ""}, publicité ${eur(k.publicite)}, entretien ${eur(k.entretien)}, loyer et frais de structure ${eur(k.loyerEtFrais)}, personnel ${eur(k.personnel)}, intérêts ${eur(k.interets)}. Quel résultat afficherait-elle ?`;
      },
      champs: (c) => {
        const k = cloture(c);
        return [
          {
            libelle: "Résultat avant inventaire",
            attendu: k.resultatAvantInventaire,
            calcul: `${eur(k.ventes)} − ${eur(k.chargesAvant)} = ${eur(k.resultatAvantInventaire)}`,
          },
        ];
      },
      explication: () => [
        "Ce résultat est provisoire : il ignore l'usure de l'équipement, que personne n'a payée cette année, et il compte le stock comme si rien n'en restait ou rien n'en était sorti. Les travaux d'inventaire vont le corriger.",
      ],
      vue: "resultat",
    },
    {
      id: "dotation",
      type: "ecriture",
      titre: "La dotation de l'année",
      notions: ["depreciation"],
      evenement: (c) => {
        const k = cloture(c);
        return `Le plan d'amortissement des équipements de ${c.entreprise} donne, pour l'année, une dotation de ${eur(k.dotation)}. Passez-la.`;
      },
      ecriture: (c) => {
        const k = cloture(c);
        return {
          date: "31 décembre",
          libelle: "Dotation aux amortissements de l'année",
          lignes: [
            { role: "la charge de l'année, la dotation", compte: "6811", acceptes: ["681"], sens: "debit", montant: k.dotation, indice: "la dotation du plan d'amortissement" },
            {
              role: "l'amortissement des équipements",
              compte: k.compteAmortissement,
              acceptes: [`28${c.immobilisation.compte.slice(1, 3)}`, "281"],
              sens: "credit",
              montant: k.dotation,
              indice: "la dotation du plan d'amortissement",
            },
          ],
        };
      },
      indices: (c) => [
        "Une charge au débit : la dotation aux amortissements.",
        `Au crédit, le compte d'amortissement de l'équipement : 28, puis le numéro de l'équipement sans le 2 (${c.immobilisation.compte}).`,
      ],
      explication: (c) => {
        const k = cloture(c);
        return [`${eur(k.dotation)} de charges en plus, et pas un euro de sorti : les équipements ont été payés à l'achat.`];
      },
      vue: "resultat",
    },
    {
      id: "stock-initial",
      type: "ecriture",
      titre: "Le stock du 1er janvier",
      notions: ["stock"],
      si: (c) => (c.annee.stock?.initial ?? 0) > 0,
      evenement: (c) => {
        const k = cloture(c);
        const s = k.stock!;
        return `Au 1er janvier, ${c.entreprise} avait ${s.nature === "en-cours" ? "des chantiers en cours" : "des marchandises en stock"} pour ${eur(s.initial)}, au compte ${k.comptesDuStock.stock}. L'inventaire du 31 décembre le remplace par ce qui reste : annulez d'abord le stock du début.`;
      },
      ecriture: (c) => {
        const k = cloture(c);
        const s = k.stock!;
        return {
          date: "31 décembre",
          libelle: "Annulation du stock initial",
          lignes: [
            {
              role: "la variation du stock",
              compte: k.comptesDuStock.variation,
              acceptes: s.nature === "en-cours" ? ["713"] : ["603"],
              sens: "debit",
              montant: s.initial,
              indice: "la valeur du stock du 1er janvier",
            },
            { role: "le stock initial qui sort du bilan", compte: k.comptesDuStock.stock, sens: "credit", montant: s.initial, indice: "la valeur du stock du 1er janvier" },
          ],
        };
      },
      indices: (c) => {
        const k = cloture(c);
        return k.stock!.nature === "en-cours"
          ? [
              "Le stock de travaux en cours (compte 335) se vide : il passe au crédit.",
              "En face, la variation des en-cours (7133). C'est un compte de produits : passé au débit, il réduit la production de l'année.",
            ]
          : ["Le stock de marchandises (compte 37) se vide : il passe au crédit.", "En face, une charge : la variation des stocks de marchandises (6037)."];
      },
      explication: (c) => {
        const k = cloture(c);
        const s = k.stock!;
        return [
          s.final > 0
            ? `Le stock du début entre dans les coûts de l'année. Reste à constater celui du 31 décembre.`
            : `Le 31 décembre, l'inventaire ne trouve plus rien : tout a été vendu dans l'année. Il n'y a pas de stock final à constater, et les ${eur(s.initial)} du début sont un coût de l'année.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "stock-final",
      type: "ecriture",
      titre: "Le stock du 31 décembre",
      notions: ["stock"],
      si: (c) => (c.annee.stock?.final ?? 0) > 0,
      evenement: (c) => {
        const k = cloture(c);
        return `L'inventaire du 31 décembre compte ${eur(k.stock!.final)}. Constatez-le.`;
      },
      ecriture: (c) => {
        const k = cloture(c);
        const s = k.stock!;
        return {
          date: "31 décembre",
          libelle: "Constatation du stock final",
          lignes: [
            { role: "le stock final qui entre au bilan", compte: k.comptesDuStock.stock, sens: "debit", montant: s.final, indice: "la valeur de l'inventaire" },
            {
              role: "la variation du stock",
              compte: k.comptesDuStock.variation,
              acceptes: s.nature === "en-cours" ? ["713"] : ["603"],
              sens: "credit",
              montant: s.final,
              indice: "la valeur de l'inventaire",
            },
          ],
        };
      },
      indices: () => ["L'écriture inverse de la précédente, pour le stock compté."],
      explication: () => ["Le stock final quitte les coûts de l'année : il servira l'année suivante."],
      vue: "resultat",
    },
    {
      id: "interets-courus",
      type: "choix",
      titre: "Des intérêts pas encore payés",
      notions: ["loan_schedule"],
      question: (c) => {
        const k = cloture(c);
        return `Avec le contrat du chapitre « L'emprunt », la banque prélèvera le ${date(k.echeanceDeJanvier.jour)} les intérêts du trimestre commencé le ${date(k.echeanceDOctobre.jour)} : ${eur(k.echeanceDeJanvier.interets)}. Sur ces ${JOURS_DE_LA_PERIODE} jours, ${k.joursDansLExercice} tombent dans l'année qui se clôt. Que fait le comptable au 31 décembre ?`;
      },
      options: (c) => {
        const k = cloture(c);
        return [
          {
            texte: `Il rattache ${eur(k.icne)} d'intérêts à l'année : une charge au débit du 6611, une dette d'intérêts courus au crédit du 1688.`,
            juste: true,
            retour: `C'est cela : ${eur(k.echeanceDeJanvier.interets)} × ${k.joursDansLExercice} ÷ ${JOURS_DE_LA_PERIODE} = ${eur(k.icne)}. Une charge appartient à l'année où elle naît, pas à celle où on la paie. Le 1er janvier, l'écriture s'inverse, et l'échéance du 3 janvier se passe normalement. Dans l'arène, les intérêts se paient à la fin de chaque trimestre : il n'y a rien à rattacher, et l'année que vous clôturez n'en contient pas.`,
          },
          {
            texte: "Rien : les intérêts seront passés le 3 janvier, quand la banque les prélèvera.",
            juste: false,
            retour: "Ils seraient alors comptés dans l'année suivante, alors qu'ils sont nés, presque tous, cette année. Le résultat de l'année serait trop beau.",
          },
          {
            texte: `Il passe dès maintenant toute l'échéance, ${eur(k.echeanceDeJanvier.interets)}.`,
            juste: false,
            retour: `${JOURS_DE_LA_PERIODE - k.joursDansLExercice} jours d'intérêts appartiennent à l'année suivante. On ne rattache que la part de cette année, au prorata des jours.`,
          },
        ];
      },
    },
    {
      id: "resultat-avant-impot",
      type: "montants",
      titre: "Le résultat avant impôt",
      notions: ["income_statement"],
      question: () => "Les travaux d'inventaire sont passés. Quel est le résultat avant impôt de l'année ?",
      champs: (c) => {
        const k = cloture(c);
        const stock = k.variation !== 0 ? ` ${k.variation > 0 ? "+" : "−"} ${eur(Math.abs(k.variation))} de variation du stock` : "";
        return [
          {
            libelle: "Résultat avant impôt",
            attendu: k.resultatAvantImpot,
            calcul: `${eur(k.resultatAvantInventaire)} − ${eur(k.dotation)} de dotation${stock} = ${eur(k.resultatAvantImpot)}`,
          },
        ];
      },
      explication: (c) => {
        const k = cloture(c);
        return [
          k.resultatAvantImpot >= 0
            ? `${c.entreprise} gagne ${eur(k.resultatAvantImpot)} sur l'année, avant impôt. Les travaux d'inventaire l'ont fait passer de ${eur(k.resultatAvantInventaire)} à ce chiffre.`
            : `${c.entreprise} perd ${eur(-k.resultatAvantImpot)} sur l'année. Les travaux d'inventaire l'ont fait passer de ${eur(k.resultatAvantInventaire)} à ce chiffre.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "impot",
      type: "montants",
      titre: "L'impôt sur les sociétés",
      notions: ["income_statement"],
      question: (c) => {
        const k = cloture(c);
        return `L'impôt sur les sociétés se calcule sur le résultat de l'année, au taux de ${pct(k.tauxIS)}, arrondi à l'euro. Une perte ne paie pas d'impôt. Calculez l'impôt et le résultat net.`;
      },
      champs: (c) => {
        const k = cloture(c);
        return [
          {
            libelle: "Impôt sur les sociétés",
            attendu: k.impot,
            calcul: k.resultatAvantImpot > 0 ? `${eur(k.resultatAvantImpot)} × ${pct(k.tauxIS)} = ${eur(k.impot)}` : "une perte : pas d'impôt, 0 €",
          },
          { libelle: "Résultat net", attendu: k.resultatNet, calcul: `${eur(k.resultatAvantImpot)} − ${eur(k.impot)} = ${eur(k.resultatNet)}` },
        ];
      },
      explication: () => [
        "Le cours prend le taux normal. Une petite entreprise paie un taux réduit sur ses premiers bénéfices, sous conditions : le cours le laisse de côté.",
      ],
    },
    {
      id: "ecriture-impot",
      type: "ecriture",
      titre: "L'impôt de l'année",
      notions: ["income_statement"],
      si: (c) => cloture(c).impot > 0,
      evenement: (c) => `Passez l'impôt sur les sociétés de l'année : ${eur(cloture(c).impot)}, à payer à l'État.`,
      ecriture: (c) => {
        const k = cloture(c);
        return {
          date: "31 décembre",
          libelle: "Impôt sur les sociétés de l'année",
          lignes: [
            { role: "la charge d'impôt", compte: "695", sens: "debit", montant: k.impot, indice: "l'impôt calculé" },
            { role: "la dette envers l'État", compte: "444", sens: "credit", montant: k.impot, indice: "l'impôt calculé" },
          ],
        };
      },
      indices: () => [
        "Une charge au débit : les impôts sur les bénéfices, classe 6.",
        "Au crédit, une dette envers l'État, que l'entreprise a en partie réglée par des acomptes au cours de l'année : le compte 444.",
      ],
      explication: (c) => [`Le compte de résultat est complet : le résultat net de l'année est de ${eur(cloture(c).resultatNet)}.`],
      vue: "resultat",
    },
    {
      id: "la-perte",
      type: "choix",
      titre: "Une année en perte",
      notions: ["income_statement"],
      si: (c) => cloture(c).impot === 0,
      question: (c) => `${c.entreprise} perd ${eur(-cloture(c).resultatAvantImpot)} sur l'année. Que devient cette perte, côté impôt ?`,
      options: () => [
        {
          texte: "Elle se reporte : elle viendra en déduction des bénéfices des années suivantes, qui paieront moins d'impôt.",
          juste: true,
          retour: "C'est le report en avant des déficits. Une entreprise qui démarre en perte ne paie pas d'impôt tant qu'elle n'a pas rattrapé ses pertes, dans certaines limites.",
        },
        {
          texte: "L'État la rembourse, au taux de l'impôt.",
          juste: false,
          retour: "L'État ne rembourse pas une perte. Elle se reporte sur les bénéfices à venir.",
        },
        {
          texte: "Elle est perdue : l'impôt ne regarde qu'une année à la fois.",
          juste: false,
          retour: "Elle ne se perd pas : elle se reporte sur les années suivantes.",
        },
      ],
    },
    {
      id: "et-l-arene",
      type: "lecture",
      titre: "Et l'arène ?",
      notions: ["income_statement"],
      texte: (c) => {
        const k = cloture(c);
        const ecart = auCentime(k.arene.impot - k.impot);
        return [
          Math.abs(k.resultatAvantImpot - k.arene.resultatAvantImpot) < 0.05
            ? `Avant impôt, vous retrouvez le résultat de l'arène pour l'année : ${eur(k.arene.resultatAvantImpot)}.`
            : `Avant impôt, vous retrouvez le résultat de l'arène pour l'année, ${eur(k.arene.resultatAvantImpot)}, à ${eur(Math.abs(k.resultatAvantImpot - k.arene.resultatAvantImpot))} près : l'arène valorise son stock au centime de coût moyen, le cours à l'euro.`,
          Math.abs(ecart) < 1
            ? `L'impôt aussi, à l'arrondi de l'euro près : ${eur(k.arene.impot)}. L'arène verse chaque trimestre un acompte, l'impôt du résultat cumulé depuis le début de l'année moins les acomptes déjà versés ; un trimestre de perte fait rendre ce qui a été payé en trop. Au bout de l'année, elle a payé l'impôt de l'année, comme une vraie entreprise.`
            : `Pas l'impôt : l'arène en compte ${eur(k.arene.impot)}, vous ${eur(k.impot)}. La loi regarde l'année entière : c'est votre calcul qui est le bon.`,
        ];
      },
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["income_statement"],
      texte: (c) => {
        const k = cloture(c);
        return [
          `Vous avez clôturé l'année de ${c.entreprise} : la balance, les travaux d'inventaire, l'impôt, et un résultat net de ${eur(k.resultatNet)}.`,
          "Le résultat net revient aux associés : ils décident de le distribuer ou de le garder dans l'entreprise. C'est l'affectation du résultat, au palier suivant.",
        ];
      },
      repere: () =>
        "Une charge appartient à l'année où elle naît : la dotation, le stock consommé, les intérêts courus se rattachent au 31 décembre, payés ou non. L'impôt vient en dernier, sur le résultat de l'année.",
    },
  ],
};
