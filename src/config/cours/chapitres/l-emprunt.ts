import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import { dateDuCours as date } from "../dates";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : L'EMPRUNT ET SES INTÉRÊTS (comptabilité générale, palier 3).
 *
 * L'emprunt du chapitre pilote, suivi sur sa première année. Le contrat est celui que
 * l'entreprise rembourse dans l'arène : le taux annuel du scénario, une échéance par
 * trimestre, le même capital remboursé à chacune (l'amortissement constant du moteur),
 * et des intérêts calculés sur le capital qui reste dû. L'élève bâtit la première ligne
 * du tableau d'amortissement, passe deux échéances en séparant le capital des intérêts,
 * comprend pourquoi les intérêts baissent, lit l'année au 31 décembre, puis compare le
 * coût du crédit à celui d'échéances constantes.
 *
 * Les échéances tombent à la date anniversaire du prêt, tous les trois mois. Les
 * intérêts courus entre la dernière échéance de l'année et le 31 décembre relèvent de
 * la clôture : le chapitre le dit, sans les passer.
 */

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

/** Une échéance par trimestre : le jour du prêt, trois, six, neuf et douze mois plus tard. */
const JOURS_DES_ECHEANCES = [93, 184, 276, 368];
/** Les échéances d'une année : avril, juillet et octobre tombent dans l'exercice, janvier le suivant. */
const ECHEANCES_DANS_L_ANNEE = 3;
const TRIMESTRES_PAR_AN = 4;

/** La ligne `k` (à partir de 1) du tableau d'amortissement. */
export function echeance(c: Cas, k: number) {
  const { tauxAnnuel, capitalParEcheance: capital } = c.pret;
  const avant = c.emprunt - (k - 1) * capital;
  const interets = auCentime((avant * tauxAnnuel) / TRIMESTRES_PAR_AN);
  return { k, jour: JOURS_DES_ECHEANCES[k - 1] ?? 0, avant, capital, interets, total: auCentime(capital + interets), apres: avant - capital };
}

/** Ce que le prêt coûte en intérêts sur toute sa durée, et ce qu'il coûterait en échéances constantes. */
export function coutDuCredit(c: Cas) {
  const { tauxAnnuel, nombreEcheances: n } = c.pret;
  const lignes = Array.from({ length: n }, (_, i) => echeance(c, i + 1));
  const amortissementConstant = auCentime(lignes.reduce((s, l) => s + l.interets, 0));
  const i = tauxAnnuel / TRIMESTRES_PAR_AN;
  const echeanceConstante = auCentime((c.emprunt * i) / (1 - (1 + i) ** -n));
  const echeancesConstantes = auCentime(echeanceConstante * n - c.emprunt);
  return { amortissementConstant, echeanceConstante, echeancesConstantes };
}

/** L'année au 31 décembre : trois échéances payées. */
export function premiereAnnee(c: Cas) {
  const payees = Array.from({ length: ECHEANCES_DANS_L_ANNEE }, (_, i) => echeance(c, i + 1));
  const restant = payees[payees.length - 1]!.apres;
  return {
    payees,
    interets: auCentime(payees.reduce((s, l) => s + l.interets, 0)),
    restant,
    aMoinsDUnAn: Math.min(restant, TRIMESTRES_PAR_AN * c.pret.capitalParEcheance),
  };
}

const ecritureDEcheance = (c: Cas, k: number) => {
  const e = echeance(c, k);
  return {
    date: date(e.jour),
    libelle: `Échéance n° ${k} de l'emprunt`,
    lignes: [
      { role: "le capital remboursé, qui réduit la dette", compte: "164", acceptes: ["1641"], sens: "debit" as const, montant: e.capital, indice: "le capital remboursé à chaque échéance" },
      { role: "les intérêts du trimestre", compte: "6611", acceptes: ["661"], sens: "debit" as const, montant: e.interets, indice: "le capital restant dû avant l'échéance, au taux annuel, pour un trimestre" },
      { role: "le prélèvement sur le compte en banque", compte: "512", sens: "credit" as const, montant: e.total, indice: "le capital et les intérêts réunis" },
    ],
  };
};

export const L_EMPRUNT: Chapitre = {
  code: "l-emprunt",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [
    "BTS CG P2 · Contrôle et production de l'information financière",
    "DCG UE9 · Comptabilité",
  ],
  titre: "L'emprunt et ses intérêts",
  accroche:
    "Le prêt de l'entreprise, échéance après échéance : ce qui rembourse la dette, ce qui coûte, et pourquoi le coût baisse avec le temps.",
  objectifs: [
    "Bâtir le tableau d'amortissement d'un emprunt à amortissement constant",
    "Séparer, dans une échéance, le capital remboursé et les intérêts",
    "Enregistrer une échéance : la dette qui baisse, la charge d'intérêts, le prélèvement",
    "Lire l'emprunt au 31 décembre : intérêts de l'année, capital restant dû, part à moins d'un an",
    "Comparer le coût d'un crédit en amortissement constant et en échéances constantes",
  ],
  libre: false,
  etapes: [
    {
      id: "contrat",
      type: "lecture",
      titre: "Le contrat de prêt",
      notions: ["loan_schedule"],
      texte: (c) => [
        `Le ${date(c.dates.emprunt)}, la banque prête ${eur(c.emprunt)} à ${c.entreprise}, au taux de ${pct(c.pret.tauxAnnuel)} par an, sur ${qte(c.pret.nombreEcheances / TRIMESTRES_PAR_AN)} ans. C'est le prêt que l'entreprise rembourse dans l'arène.`,
        `Le remboursement se fait par échéances trimestrielles, à la date anniversaire du prêt : le ${date(JOURS_DES_ECHEANCES[0]!)}, le ${date(JOURS_DES_ECHEANCES[1]!)}, et ainsi de suite. À chaque échéance, la banque prélève deux choses : une part du capital, toujours la même (on dit que l'emprunt s'amortit de façon constante), et les intérêts du trimestre, calculés sur le capital qui reste dû.`,
        "Votre travail : suivre ce prêt sur sa première année, comme le comptable de l'entreprise.",
      ],
      repere: () => "Rembourser le capital éteint une dette : ce n'est pas une charge. Seuls les intérêts coûtent à l'entreprise.",
    },
    {
      id: "deblocage",
      type: "ecriture",
      titre: "Les fonds sont versés",
      notions: ["loan_schedule"],
      evenement: (c) => `Le ${date(c.dates.emprunt)}, la banque verse les ${eur(c.emprunt)} du prêt sur le compte de ${c.entreprise}.`,
      ecriture: (c) => ({
        date: date(c.dates.emprunt),
        libelle: "Emprunt bancaire",
        lignes: [
          { role: "l'argent reçu en banque", compte: "512", sens: "debit", montant: c.emprunt, indice: "le montant prêté" },
          { role: "la dette envers la banque", compte: "164", acceptes: ["1641"], sens: "credit", montant: c.emprunt, indice: "le montant prêté" },
        ],
      }),
      indices: () => ["L'argent arrive en banque.", "En face, une dette financière envers l'établissement de crédit : classe 1."],
      explication: (c) => [
        `La banque et la dette montent ensemble de ${eur(c.emprunt)}. Le résultat ne bouge pas : l'entreprise n'est pas plus riche, elle a reçu de l'argent qu'elle doit rendre.`,
      ],
      vue: "bilan",
    },
    {
      id: "premiere-ligne",
      type: "montants",
      titre: "La première ligne du tableau",
      notions: ["loan_schedule"],
      question: (c) =>
        `Prêt de ${eur(c.emprunt)} à ${pct(c.pret.tauxAnnuel)} par an, sur ${qte(c.pret.nombreEcheances / TRIMESTRES_PAR_AN)} ans, une échéance par trimestre, le même capital remboursé à chacune. Calculez la première ligne du tableau d'amortissement.`,
      champs: (c) => {
        const e = echeance(c, 1);
        const n = c.pret.nombreEcheances;
        return [
          { libelle: "Nombre d'échéances", attendu: n, calcul: `${qte(n / TRIMESTRES_PAR_AN)} ans × ${TRIMESTRES_PAR_AN} trimestres = ${qte(n)} échéances` },
          { libelle: "Capital remboursé à chaque échéance", attendu: e.capital, calcul: `${eur(c.emprunt)} ÷ ${qte(n)} = ${eur(e.capital)}` },
          {
            libelle: "Intérêts de la première échéance",
            attendu: e.interets,
            calcul: `${eur(e.avant)} × ${pct(c.pret.tauxAnnuel)} ÷ ${TRIMESTRES_PAR_AN} = ${eur(e.interets)}`,
          },
          { libelle: "Montant de la première échéance", attendu: e.total, calcul: `${eur(e.capital)} + ${eur(e.interets)} = ${eur(e.total)}` },
          { libelle: "Capital restant dû après la première échéance", attendu: e.apres, calcul: `${eur(e.avant)} − ${eur(e.capital)} = ${eur(e.apres)}` },
        ];
      },
      explication: (c) => {
        const e = echeance(c, 1);
        return [
          `Le taux est annuel, l'échéance trimestrielle : les intérêts d'un trimestre se calculent au quart du taux, sur le capital dû pendant ce trimestre, ${eur(e.avant)}.`,
          `Sur les ${eur(e.total)} prélevés, seuls ${eur(e.interets)} coûtent à l'entreprise. Les ${eur(e.capital)} de capital lui rendent une part de sa dette.`,
        ];
      },
    },
    {
      id: "echeance-1",
      type: "ecriture",
      titre: "La première échéance",
      notions: ["loan_schedule"],
      evenement: (c) => {
        const e = echeance(c, 1);
        return `Le ${date(e.jour)}, la banque prélève la première échéance : ${eur(e.total)}.`;
      },
      piece: (c) => {
        const e = echeance(c, 1);
        return {
          nature: "Avis d'échéance",
          de: "Votre banque",
          a: c.entreprise,
          date: date(e.jour),
          lignes: [
            { libelle: "Capital remboursé", montant: e.capital },
            { libelle: `Intérêts (${pct(c.pret.tauxAnnuel)} l'an, un trimestre)`, montant: e.interets },
          ],
          totaux: [
            { libelle: "Montant prélevé", montant: e.total, fort: true },
            { libelle: "Capital restant dû", montant: e.apres },
          ],
        };
      },
      ecriture: (c) => ecritureDEcheance(c, 1),
      indices: () => [
        "Deux lignes au débit : la dette qui baisse (classe 1) et la charge d'intérêts (classe 6, les charges financières).",
        "Une seule ligne au crédit : la banque, pour le montant prélevé.",
      ],
      explication: (c) => {
        const e = echeance(c, 1);
        return [
          `La dette envers la banque passe à ${eur(e.apres)}. Le compte de résultat ne porte que les intérêts, ${eur(e.interets)} : c'est tout ce que l'échéance coûte.`,
        ];
      },
      vue: "bilan-et-resultat",
    },
    {
      id: "echeance-2",
      type: "ecriture",
      titre: "La deuxième échéance",
      notions: ["loan_schedule"],
      evenement: (c) => {
        const e = echeance(c, 2);
        return `Le ${date(e.jour)}, la banque prélève la deuxième échéance. Cette fois, pas d'avis : calculez vous-même le capital et les intérêts, et passez l'écriture. Le capital dû avant l'échéance est de ${eur(e.avant)}.`;
      },
      ecriture: (c) => ecritureDEcheance(c, 2),
      indices: (c) => [
        "Le capital remboursé ne change pas d'une échéance à l'autre.",
        `Les intérêts se calculent sur le capital dû avant l'échéance, au quart du taux annuel de ${pct(c.pret.tauxAnnuel)}. Le prélèvement, c'est le capital plus les intérêts.`,
      ],
      explication: (c) => {
        const e = echeance(c, 2);
        const p = echeance(c, 1);
        return [
          `${eur(e.capital)} de capital, comme à la première échéance, mais ${eur(e.interets)} d'intérêts au lieu de ${eur(p.interets)} : le prélèvement est de ${eur(e.total)}. La dette descend à ${eur(e.apres)}.`,
        ];
      },
      vue: "bilan-et-resultat",
    },
    {
      id: "pourquoi-baisse",
      type: "choix",
      titre: "Des intérêts qui baissent",
      notions: ["loan_schedule"],
      question: (c) => {
        const [a, b] = [echeance(c, 1), echeance(c, 2)];
        return `Les intérêts sont passés de ${eur(a.interets)} à ${eur(b.interets)}, au même taux. Pourquoi ?`;
      },
      options: (c) => {
        const e = echeance(c, 1);
        return [
          { texte: "La banque a baissé son taux.", juste: false, retour: "Le taux est fixé par le contrat : il n'a pas changé." },
          {
            texte: `Ils se calculent sur le capital qui reste dû, plus petit de ${eur(e.capital)} à chaque échéance.`,
            juste: true,
            retour: "C'est cela : chaque échéance rembourse une part de la dette, et les intérêts suivants portent sur moins. Plus le temps passe, moins le prêt coûte par trimestre.",
          },
          {
            texte: "La deuxième échéance rembourse moins de capital.",
            juste: false,
            retour: "Le capital remboursé est le même à chaque échéance : c'est la règle de l'amortissement constant.",
          },
        ];
      },
    },
    {
      id: "premiere-annee",
      type: "montants",
      titre: "L'emprunt au 31 décembre",
      notions: ["loan_schedule", "balance_sheet"],
      question: (c) => {
        const a = premiereAnnee(c);
        return `Au 31 décembre, ${qte(a.payees.length)} échéances ont été payées : le ${a.payees.map((p) => date(p.jour)).join(", le ")}. La suivante tombera le ${date(JOURS_DES_ECHEANCES[ECHEANCES_DANS_L_ANNEE]!)}. Calculez ce que l'emprunt laisse dans les comptes de l'année.`;
      },
      champs: (c) => {
        const a = premiereAnnee(c);
        const derniere = a.payees[a.payees.length - 1]!;
        return [
          { libelle: "Intérêts de la dernière échéance de l'année", attendu: derniere.interets, calcul: `${eur(derniere.avant)} × ${pct(c.pret.tauxAnnuel)} ÷ ${TRIMESTRES_PAR_AN} = ${eur(derniere.interets)}` },
          {
            libelle: "Intérêts payés dans l'année",
            attendu: a.interets,
            calcul: `${a.payees.map((p) => eur(p.interets)).join(" + ")} = ${eur(a.interets)}`,
          },
          { libelle: "Capital restant dû au 31 décembre", attendu: a.restant, calcul: `${eur(c.emprunt)} − ${ECHEANCES_DANS_L_ANNEE} × ${eur(c.pret.capitalParEcheance)} = ${eur(a.restant)}` },
          {
            libelle: "Part à rembourser dans les douze mois",
            attendu: a.aMoinsDUnAn,
            calcul: `${TRIMESTRES_PAR_AN} échéances × ${eur(c.pret.capitalParEcheance)} = ${eur(a.aMoinsDUnAn)}`,
          },
        ];
      },
      explication: (c) => {
        const a = premiereAnnee(c);
        return [
          `Le bilan du 31 décembre porte ${eur(a.restant)} d'emprunt, dont ${eur(a.aMoinsDUnAn)} à rembourser dans l'année qui vient : l'annexe des comptes le précise, car c'est de la trésorerie qui sortira bientôt.`,
          `Une précision pour la suite : entre le ${date(a.payees[a.payees.length - 1]!.jour)} et le 31 décembre, des intérêts ont couru, que la banque ne prélèvera que le ${date(JOURS_DES_ECHEANCES[ECHEANCES_DANS_L_ANNEE]!)}. Ils appartiennent à cette année : le comptable les ajoute à la clôture. C'est le chapitre « La clôture ».`,
        ];
      },
    },
    {
      id: "cout-du-credit",
      type: "choix",
      titre: "Le coût du crédit",
      notions: ["loan_schedule"],
      question: (c) => {
        const k = coutDuCredit(c);
        return `Sur toute sa durée, ce prêt coûtera ${eur(k.amortissementConstant)} d'intérêts. Beaucoup de prêts se remboursent plutôt par échéances toutes égales. Au même taux et sur la même durée, ce prêt coûterait alors :`;
      },
      options: (c) => {
        const k = coutDuCredit(c);
        return [
          {
            texte: "Plus d'intérêts.",
            juste: true,
            retour: `Oui : ${eur(k.echeancesConstantes)} au lieu de ${eur(k.amortissementConstant)}. Avec des échéances égales (${eur(k.echeanceConstante)} chacune), les premières remboursent peu de capital et beaucoup d'intérêts : la dette baisse moins vite, et les intérêts portent plus longtemps sur un capital plus grand. En échange, les premières échéances sont plus légères pour la trésorerie.`,
          },
          {
            texte: "Moins d'intérêts.",
            juste: false,
            retour: `Non : ${eur(k.echeancesConstantes)} au lieu de ${eur(k.amortissementConstant)}. Des échéances égales remboursent moins de capital au début : la dette reste plus haute plus longtemps.`,
          },
          {
            texte: "Autant : même taux, même durée, même coût.",
            juste: false,
            retour: `Le taux et la durée ne suffisent pas : le coût dépend aussi du rythme auquel la dette baisse. En échéances égales, il serait de ${eur(k.echeancesConstantes)}.`,
          },
        ];
      },
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["loan_schedule"],
      texte: (c) => {
        const a = premiereAnnee(c);
        return [
          `Vous avez suivi le prêt de ${c.entreprise} sur sa première année : le tableau d'amortissement, deux échéances passées en séparant le capital des intérêts, et l'emprunt lu au 31 décembre.`,
          `Cette année, la banque aura prélevé ${eur(a.payees.reduce((s, p) => s + p.total, 0))}. Le compte de résultat n'en retient que ${eur(a.interets)} d'intérêts ; le reste a remboursé la dette.`,
        ];
      },
      repere: () =>
        "Une échéance d'emprunt se coupe en deux : le capital au débit du 164, qui réduit la dette, et les intérêts au débit du 6611, seule charge. La trésorerie voit le total, le résultat ne voit que les intérêts.",
    },
  ],
};
