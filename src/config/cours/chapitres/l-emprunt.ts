import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { clotureDe, JOURS_DU_MOIS, type DateDuCours } from "../monde/amortissement";
import { coutDuCredit, echeanceConstante, empruntALaCloture, tableauDAmortissement, type ContratDePret, type LigneDEmprunt, type ModeDeRemboursement } from "../monde/emprunt";
import type { Chapitre, EtapeEcriture } from "../types";

/**
 * CHAPITRE : L'EMPRUNT ET SES INTÉRÊTS (comptabilité générale, palier 3 ; BTS CG, DCG UE9, BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le contrat de
 * chaque entreprise vient de son cas figé (monde/cas-des-entreprises.ts : le montant, le taux, le
 * nombre d'échéances, la date du versement), et le tableau, les intérêts courus et le coût du crédit
 * se calculent par le modèle du cours (monde/emprunt.ts : `tableauDAmortissement`,
 * `echeanceConstante`, `empruntALaCloture`, `coutDuCredit`). Il se joue dans les neuf entreprises ;
 * chez NOVA, c'est le prêt de la fiche de l'exercice (monde/exercice-de-nova.ts), et ses intérêts
 * de l'année sont ceux que la clôture passe.
 *
 * L'objet : le prêt de la création, suivi sur sa première année. L'élève bâtit la première ligne du
 * tableau d'amortissement, passe les trois échéances de l'exercice, lit l'emprunt au 31 décembre,
 * calcule et passe les intérêts courus ; puis il compare l'amortissement constant aux échéances
 * constantes, en trésorerie et en coût, et retrouve un taux à partir de deux échéances.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : contrat, deblocage, premiere-ligne, echeance-1 (le chemin est dans la question ou la
 *     pièce) ;
 *   · autonome : echeance-2, echeance-3, pourquoi-baisse, premiere-annee, les-interets-courus,
 *     ecriture-des-interets-courus (ni montant ni formule donnés ; la correction montre le chemin) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) :
 *     predire-le-croisement puis les-echeances-qui-se-croisent (un curseur sur le numéro de
 *     l'échéance : l'échéance constante face à l'échéance qui baisse) avant annuites-constantes ;
 *     predire-le-cout puis le-laboratoire-du-pret (le taux, la durée, et un levier à choix,
 *     amortissement constant ou échéances constantes, avec le graphique du coût selon la durée)
 *     avant cout-du-credit ;
 *   · expert : annuites-constantes (l'échéance constante calculée et la première ligne de son
 *     tableau), cout-du-credit (le coût dans les deux modes, et l'écart), le-taux-a-rebours
 *     (retrouver le taux et le montant d'un prêt à partir de deux avis d'échéance), quel-mode (la
 *     critique : à taux égal, aucun mode n'est plus cher) ; puis la synthèse.
 *
 * Ce qui a disparu : « le prêt que l'entreprise rembourse dans l'arène », et les intérêts courus
 * expliqués sans être passés (ils sont maintenant calculés et passés, comme à la clôture).
 */

// ─────────────────────────────────────────────────────────────────────────────
// LES HYPOTHÈSES DU CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

/** Une échéance par trimestre, à la date anniversaire du versement. */
export const ECHEANCES_PAR_AN = 4;
const MOIS_ENTRE_DEUX_ECHEANCES = 12 / ECHEANCES_PAR_AN;

/** Les deux modes du levier à choix du laboratoire. */
export const MODES_DE_REMBOURSEMENT = { amortissementConstant: 0, echeancesConstantes: 1 } as const;
const MODE_DU_LEVIER: Readonly<Record<number, ModeDeRemboursement>> = {
  [MODES_DE_REMBOURSEMENT.amortissementConstant]: "amortissement-constant",
  [MODES_DE_REMBOURSEMENT.echeancesConstantes]: "echeances-constantes",
};

/**
 * LE DÉFI DU LABORATOIRE, hypothèse du cours : emprunter le même montant avec au plus 86 % des
 * intérêts du contrat (arrondis à la centaine inférieure : 9 000 € chez NOVA) et une première
 * échéance qui ne dépasse pas celle du contrat. Au taux du contrat, aucune durée ni aucun mode ne
 * le relève : il faut négocier le taux.
 */
export const PART_DES_INTERETS_VISEE = 0.86;
export const ARRONDI_DU_PLAFOND = 100;

/** Les bornes et le pas des leviers du laboratoire : le taux en pourcentage, la durée en années. */
export const LEVIERS_DU_PRET = {
  taux: { min: 1, max: 8, pas: 0.05 },
  duree: { min: 2, max: 12, pas: 1 },
} as const;

/**
 * LE CALCUL À REBOURS, hypothèse du cours : une autre banque avait proposé le même montant, sur la
 * même durée, en amortissement constant, au taux de 6 % l'an. L'élève n'en a que les deux premiers
 * avis d'échéance et le capital remboursé à chacune.
 */
export const TAUX_DE_L_AUTRE_BANQUE = 0.06;

// ─────────────────────────────────────────────────────────────────────────────
// LES OUTILS
// ─────────────────────────────────────────────────────────────────────────────

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 3 }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 3 })} %`;
const auCentime = (x: number) => Math.round((x + Number.EPSILON * Math.sign(x)) * 100) / 100 + 0;
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
/** Une date du cours en toutes lettres : « 3 avril », « 3 janvier de l'année suivante ». */
export function dateDe(d: DateDuCours) {
  const jour = `${d.jour === 1 ? "1er" : d.jour} ${MOIS[d.mois - 1]}`;
  const e = d.exercice ?? 0;
  return e === 0 ? jour : e === 1 ? `${jour} de l'année suivante` : `${jour}, dans ${e} ans`;
}
/** « de NOVA », « d'ATLAS CONSEIL » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Le contrat de prêt de l'entreprise, tel que le modèle du monde le lit, avec un taux, une durée ou un mode changés. */
export function contratDuCas(c: Pick<Cas, "emprunt" | "pret" | "dates">, change: Partial<Pick<ContratDePret, "tauxAnnuel" | "dureeAns" | "mode">> = {}): ContratDePret {
  return {
    capital: c.emprunt,
    tauxAnnuel: c.pret.tauxAnnuel,
    dureeAns: c.pret.nombreEcheances / ECHEANCES_PAR_AN,
    echeancesParAn: ECHEANCES_PAR_AN,
    versement: { jour: c.dates.emprunt, mois: 1 },
    premiereEcheance: { jour: c.dates.emprunt, mois: 1 + MOIS_ENTRE_DEUX_ECHEANCES },
    mode: "amortissement-constant",
    ...change,
  };
}

/** Le prêt de l'entreprise : son tableau dans les deux modes, l'exercice, les expériences et le calcul à rebours. */
export function empruntDuCas(c: Pick<Cas, "emprunt" | "pret" | "dates">) {
  const contrat = contratDuCas(c);
  const C = contrat.capital;
  const n = c.pret.nombreEcheances;
  const i = contrat.tauxAnnuel / ECHEANCES_PAR_AN;
  const capital = auCentime(C / n);
  const ac = tableauDAmortissement(contrat, "amortissement-constant");
  const ec = tableauDAmortissement(contrat, "echeances-constantes");
  const a = echeanceConstante(contrat);
  const annee = empruntALaCloture(contrat);
  const courus = annee.interetsCourus;
  // La droite des échéances en amortissement constant : capital + intérêts sur le restant dû.
  const echeanceAC = (k: number) => C / n + (C - (k - 1) * (C / n)) * i;
  let croisement = n;
  for (let k = 1; k <= n; k++)
    if (a >= echeanceAC(k)) {
      croisement = k;
      break;
    }
  const coutAC = coutDuCredit(contrat, "amortissement-constant");
  // La même somme par la suite arithmétique des intérêts : n × (premiers + derniers) ÷ 2 (le tableau arrondit chaque ligne).
  const coutACParLaFormule = auCentime((n * (ac[0]!.interets + ac[n - 1]!.interets)) / 2);
  const coutEC = coutDuCredit(contrat, "echeances-constantes");
  // Le calcul à rebours : deux avis d'échéance d'une autre banque, au taux de TAUX_DE_L_AUTRE_BANQUE.
  const iAutre = TAUX_DE_L_AUTRE_BANQUE / ECHEANCES_PAR_AN;
  const avis1 = auCentime(capital + C * iAutre);
  const avis2 = auCentime(capital + (C - capital) * iAutre);
  const baisse = auCentime(avis1 - avis2);
  const tauxTrimestrielARebours = auCentime((baisse / capital) * 100);
  const tauxAnnuelARebours = auCentime(tauxTrimestrielARebours * ECHEANCES_PAR_AN);
  const montantARebours = auCentime((avis1 - capital) / (tauxTrimestrielARebours / 100));
  const coutChezLAutreBanque = coutDuCredit({ ...contrat, tauxAnnuel: TAUX_DE_L_AUTRE_BANQUE }, "amortissement-constant");
  // Le défi du laboratoire : le plafond d'intérêts, et le taux le plus haut, sur le pas, qui le relève.
  const plafond = Math.floor((PART_DES_INTERETS_VISEE * coutAC) / ARRONDI_DU_PLAFOND) * ARRONDI_DU_PLAFOND;
  const premiere = ac[0]!.echeance;
  const pasDuTaux = Math.round(LEVIERS_DU_PRET.taux.pas * 100);
  let tauxDeLaSolution = LEVIERS_DU_PRET.taux.min;
  for (let t = Math.round(contrat.tauxAnnuel * 10_000); t >= LEVIERS_DU_PRET.taux.min * 100; t -= pasDuTaux) {
    const essai = { ...contrat, tauxAnnuel: t / 10_000 };
    if (coutDuCredit(essai) <= plafond && tableauDAmortissement(essai)[0]!.echeance <= premiere) {
      tauxDeLaSolution = t / 100;
      break;
    }
  }
  return {
    contrat,
    C,
    n,
    i,
    annees: contrat.dureeAns,
    capital,
    ac,
    ec,
    a,
    e: (k: number) => ac[k - 1]!,
    annee,
    courus,
    echeanceAC,
    croisement,
    coutAC,
    coutACParLaFormule,
    coutEC,
    supplement: auCentime(coutEC - coutAC),
    nFoisAMoinsC: auCentime(n * a - C),
    avis1,
    avis2,
    baisse,
    tauxTrimestrielARebours,
    tauxAnnuelARebours,
    montantARebours,
    coutChezLAutreBanque,
    plafond,
    premiere,
    tauxDeLaSolution,
  };
}

export type EmpruntDuCas = ReturnType<typeof empruntDuCas>;

/** Le prêt au laboratoire : un taux (en %), une durée (en années) et un mode, le montant restant celui du contrat. */
export function laboratoireDuPret(c: Pick<Cas, "emprunt" | "pret" | "dates">, p: Readonly<Record<string, number>>) {
  const mode = MODE_DU_LEVIER[p.mode!] ?? "amortissement-constant";
  const contrat = contratDuCas(c, { tauxAnnuel: Math.round(p.taux! * 100) / 10_000, dureeAns: p.duree!, mode });
  const tableau = tableauDAmortissement(contrat);
  const annee = empruntALaCloture(contrat);
  return {
    premiere: tableau[0]!.echeance,
    cout: coutDuCredit(contrat),
    chargeDeLExercice: annee.chargeDInterets,
    decaissements: annee.decaissements,
    restant: annee.capitalRestantDu,
  };
}

/** L'écriture d'une échéance du tableau en amortissement constant. */
function ecritureDEcheance(l: LigneDEmprunt) {
  return {
    date: dateDe(l.date),
    libelle: `Échéance n° ${l.numero} de l'emprunt`,
    lignes: [
      { role: "le capital remboursé, qui réduit la dette", compte: "164", acceptes: ["1641"], sens: "debit" as const, montant: l.amortissement, indice: "le capital remboursé à chaque échéance" },
      { role: "les intérêts du trimestre", compte: "6611", acceptes: ["661"], sens: "debit" as const, montant: l.interets, indice: "le capital restant dû avant l'échéance, au taux du trimestre" },
      { role: "le prélèvement sur le compte en banque", compte: "512", sens: "credit" as const, montant: l.echeance, indice: "le capital et les intérêts réunis" },
    ],
  };
}

const INDICES_DE_L_ECHEANCE = [
  "Deux lignes au débit : la dette qui baisse (classe 1) et la charge d'intérêts (classe 6, les charges financières).",
  "Une seule ligne au crédit : la banque, pour le montant prélevé.",
];

/** Une échéance sans avis : l'élève calcule le capital et les intérêts. */
function echeanceSansAvis(k: 2 | 3, titre: string): EtapeEcriture {
  return {
    id: `echeance-${k}`,
    objectifs: [1],
    type: "ecriture",
    titre,
    notions: ["loan_schedule"],
    evenement: (c) => {
      const x = empruntDuCas(c);
      return `Le ${dateDe(x.e(k).date)}, la banque prélève l'échéance n° ${k}. Pas d'avis cette fois : calculez vous-même le capital et les intérêts, et passez l'écriture.`;
    },
    ecriture: (c) => ecritureDEcheance(empruntDuCas(c).e(k)),
    indices: (c) => [
      "Le capital remboursé ne change pas d'une échéance à l'autre.",
      `Les intérêts se calculent sur le capital dû avant l'échéance, au taux du trimestre (${pct(empruntDuCas(c).i)}). Le prélèvement, c'est le capital plus les intérêts.`,
    ],
    explication: (c) => {
      const x = empruntDuCas(c);
      const e = x.e(k);
      const p = x.e(k - 1);
      return [
        `${eur(e.amortissement)} de capital, comme à l'échéance d'avant, mais ${eur(e.interets)} d'intérêts au lieu de ${eur(p.interets)}, sur ${eur(e.capitalDebut)} restant dus : le prélèvement est de ${eur(e.echeance)}. La dette descend à ${eur(e.capitalFin)}.`,
      ];
    },
    vue: "bilan-et-resultat",
  };
}

export const L_EMPRUNT: Chapitre = {
  code: "l-emprunt",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [
    "BTS CG P2 · Contrôle et production de l'information financière",
    "DCG UE9 · Comptabilité",
    "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation",
  ],
  titre: "L'emprunt et ses intérêts",
  accroche:
    "Le prêt de l'entreprise, échéance après échéance : ce qui rembourse la dette, ce qui coûte, les intérêts courus à la clôture, et ce que changent des échéances constantes.",
  objectifs: [
    "Bâtir le tableau d'amortissement d'un emprunt, en amortissement constant et en échéances constantes",
    "Séparer, dans une échéance, le capital remboursé et les intérêts, et l'enregistrer",
    "Lire l'emprunt au 31 décembre : intérêts de l'année, capital restant dû, part à moins d'un an",
    "Calculer et passer les intérêts courus à la clôture",
    "Comparer deux modes de remboursement en trésorerie et en coût, et retrouver un taux à rebours",
  ],
  libre: false,
  etapes: [
    {
      id: "contrat",
      type: "lecture",
      titre: "Le contrat de prêt",
      notions: ["loan_schedule"],
      texte: (c) => {
        const x = empruntDuCas(c);
        return [
          `Ce chapitre se joue dans la simulation du cours. Le ${dateDe(x.contrat.versement)}, la banque prête ${eur(x.C)} à ${c.entreprise}, au taux de ${pct(x.contrat.tauxAnnuel)} par an, sur ${qte(x.annees)} ans.`,
          `Le remboursement se fait par échéances trimestrielles, à la date anniversaire du prêt : le ${dateDe(x.e(1).date)}, le ${dateDe(x.e(2).date)}, et ainsi de suite. À chaque échéance, la banque prélève deux choses : une part du capital, toujours la même (on dit que l'emprunt s'amortit de façon constante), et les intérêts du trimestre, calculés sur le capital qui reste dû.`,
          `Ce que la simulation suppose, comme la plupart des contrats : le taux du trimestre est le taux annuel divisé par ${qte(ECHEANCES_PAR_AN)}, ${pct(x.i)} ; les jours se comptent en mois de ${qte(JOURS_DU_MOIS)} jours, le jour de départ et le jour d'arrivée compris ; l'exercice se clôt le 31 décembre.`,
          "Votre travail : suivre ce prêt sur sa première année, comme le comptable de l'entreprise, puis le comparer à un prêt aux échéances toutes égales.",
        ];
      },
      repere: () => "Rembourser le capital éteint une dette : ce n'est pas une charge. Seuls les intérêts coûtent à l'entreprise.",
    },
    {
      id: "deblocage",
      objectifs: [1],
      type: "ecriture",
      titre: "Les fonds sont versés",
      notions: ["loan_schedule"],
      evenement: (c) => `Le ${dateDe(contratDuCas(c).versement)}, la banque verse les ${eur(c.emprunt)} du prêt sur le compte ${dE(c.entreprise)}.`,
      ecriture: (c) => ({
        date: dateDe(contratDuCas(c).versement),
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
      objectifs: [0],
      type: "montants",
      titre: "La première ligne du tableau",
      notions: ["loan_schedule"],
      question: (c) => {
        const x = empruntDuCas(c);
        return `Prêt de ${eur(x.C)} à ${pct(x.contrat.tauxAnnuel)} par an, sur ${qte(x.annees)} ans, une échéance par trimestre, le même capital remboursé à chacune. Calculez la première ligne du tableau d'amortissement : les intérêts du trimestre se calculent au quart du taux annuel, sur le capital dû.`;
      },
      champs: (c) => {
        const x = empruntDuCas(c);
        const e = x.e(1);
        return [
          { libelle: "Nombre d'échéances", attendu: x.n, calcul: `${qte(x.annees)} ans × ${qte(ECHEANCES_PAR_AN)} trimestres = ${qte(x.n)} échéances` },
          { libelle: "Capital remboursé à chaque échéance", attendu: e.amortissement, calcul: `${eur(x.C)} ÷ ${qte(x.n)} = ${eur(e.amortissement)}` },
          { libelle: "Intérêts de la première échéance", attendu: e.interets, calcul: `${eur(e.capitalDebut)} × ${pct(x.contrat.tauxAnnuel)} ÷ ${qte(ECHEANCES_PAR_AN)} = ${eur(e.interets)}` },
          { libelle: "Montant de la première échéance", attendu: e.echeance, calcul: `${eur(e.amortissement)} + ${eur(e.interets)} = ${eur(e.echeance)}` },
          { libelle: "Capital restant dû après la première échéance", attendu: e.capitalFin, calcul: `${eur(e.capitalDebut)} − ${eur(e.amortissement)} = ${eur(e.capitalFin)}` },
        ];
      },
      explication: (c) => {
        const x = empruntDuCas(c);
        const e = x.e(1);
        return [
          `Le taux est annuel, l'échéance trimestrielle : les intérêts d'un trimestre se calculent au quart du taux, sur le capital dû pendant ce trimestre, ${eur(e.capitalDebut)}.`,
          `Sur les ${eur(e.echeance)} prélevés, seuls ${eur(e.interets)} coûtent à l'entreprise. Les ${eur(e.amortissement)} de capital lui rendent une part de sa dette.`,
        ];
      },
    },
    {
      id: "echeance-1",
      objectifs: [1],
      type: "ecriture",
      titre: "La première échéance",
      notions: ["loan_schedule"],
      evenement: (c) => {
        const e = empruntDuCas(c).e(1);
        return `Le ${dateDe(e.date)}, la banque prélève la première échéance : ${eur(e.echeance)}.`;
      },
      piece: (c) => {
        const x = empruntDuCas(c);
        const e = x.e(1);
        return {
          nature: "Avis d'échéance",
          de: "Votre banque",
          a: c.entreprise,
          date: dateDe(e.date),
          lignes: [
            { libelle: "Capital remboursé", montant: e.amortissement },
            { libelle: `Intérêts (${pct(x.contrat.tauxAnnuel)} l'an, un trimestre)`, montant: e.interets },
          ],
          totaux: [
            { libelle: "Montant prélevé", montant: e.echeance, fort: true },
            { libelle: "Capital restant dû", montant: e.capitalFin },
          ],
        };
      },
      ecriture: (c) => ecritureDEcheance(empruntDuCas(c).e(1)),
      indices: () => INDICES_DE_L_ECHEANCE,
      explication: (c) => {
        const e = empruntDuCas(c).e(1);
        return [`La dette envers la banque passe à ${eur(e.capitalFin)}. Le compte de résultat ne porte que les intérêts, ${eur(e.interets)} : c'est tout ce que l'échéance coûte.`];
      },
      vue: "bilan-et-resultat",
    },
    echeanceSansAvis(2, "La deuxième échéance"),
    {
      id: "pourquoi-baisse",
      objectifs: [0],
      type: "choix",
      titre: "Des intérêts qui baissent",
      notions: ["loan_schedule"],
      question: (c) => {
        const x = empruntDuCas(c);
        return `Les intérêts sont passés de ${eur(x.e(1).interets)} à ${eur(x.e(2).interets)}, au même taux. Pourquoi ?`;
      },
      options: (c) => {
        const x = empruntDuCas(c);
        return [
          { texte: "La banque a baissé son taux.", juste: false, retour: "Le taux est fixé par le contrat : il n'a pas changé." },
          {
            texte: `Ils se calculent sur le capital qui reste dû, plus petit de ${eur(x.capital)} à chaque échéance.`,
            juste: true,
            retour: `C'est cela : chaque échéance rembourse une part de la dette, et les intérêts suivants portent sur moins. Ils baissent de ${eur(auCentime(x.capital * x.i))} à chaque trimestre : le capital remboursé × le taux du trimestre.`,
          },
          {
            texte: "La deuxième échéance rembourse moins de capital.",
            juste: false,
            retour: "Le capital remboursé est le même à chaque échéance : c'est la règle de l'amortissement constant.",
          },
        ];
      },
    },
    echeanceSansAvis(3, "La troisième échéance"),
    {
      id: "premiere-annee",
      objectifs: [2],
      type: "montants",
      titre: "L'emprunt au 31 décembre",
      notions: ["loan_schedule", "balance_sheet"],
      question: (c) => {
        const x = empruntDuCas(c);
        return `Au 31 décembre, ${qte(x.annee.echeances.length)} échéances ont été payées ; la suivante tombera le ${dateDe(x.courus.echeanceSuivante!.date)}. Calculez ce que l'emprunt laisse dans les comptes de l'année : les intérêts payés, le capital restant dû, et la part de ce capital à rembourser dans les douze mois.`;
      },
      champs: (c) => {
        const x = empruntDuCas(c);
        const a = x.annee;
        const dansLesDouzeMois = Math.round(a.partAMoinsDUnAn / x.capital);
        return [
          { libelle: "Intérêts payés dans l'année", attendu: a.interetsPayes, calcul: `${a.echeances.map((l) => eur(l.interets)).join(" + ")} = ${eur(a.interetsPayes)}` },
          { libelle: "Capital restant dû au 31 décembre", attendu: a.capitalRestantDu, calcul: `${eur(x.C)} − ${qte(a.echeances.length)} × ${eur(x.capital)} = ${eur(a.capitalRestantDu)}` },
          { libelle: "Part à rembourser dans les douze mois", attendu: a.partAMoinsDUnAn, calcul: `${qte(dansLesDouzeMois)} échéances × ${eur(x.capital)} = ${eur(a.partAMoinsDUnAn)}` },
        ];
      },
      explication: (c) => {
        const a = empruntDuCas(c).annee;
        return [
          `Le bilan du 31 décembre porte ${eur(a.capitalRestantDu)} d'emprunt, dont ${eur(a.partAMoinsDUnAn)} à rembourser dans l'année qui vient : l'annexe des comptes le précise, car c'est de la trésorerie qui sortira bientôt.`,
          `Cette année, la banque a prélevé ${eur(a.decaissements)} ; le compte de résultat n'en porte que les intérêts. Il en manque pourtant : ceux qui ont couru depuis la dernière échéance.`,
        ];
      },
    },
    {
      id: "les-interets-courus",
      objectifs: [3],
      type: "montants",
      titre: "Les intérêts courus au 31 décembre",
      notions: ["loan_schedule", "income_statement"],
      question: (c) => {
        const x = empruntDuCas(c);
        return `L'échéance du ${dateDe(x.courus.echeanceSuivante!.date)} paiera les intérêts du trimestre commencé le ${dateDe(x.courus.depuis!)}. Calculez ces intérêts, les jours qui en tombent dans l'exercice, les intérêts courus au 31 décembre, puis toute la charge d'intérêts de l'exercice.`;
      },
      champs: (c) => {
        const x = empruntDuCas(c);
        const k = x.courus;
        const s = k.echeanceSuivante!;
        return [
          { libelle: "Intérêts de la prochaine échéance", attendu: s.interets, calcul: `${eur(s.capitalDebut)} restant dus × ${pct(x.i)} = ${eur(s.interets)}` },
          {
            libelle: "Jours courus dans l'exercice",
            attendu: k.jours,
            calcul: `du ${dateDe(k.depuis!)} au 31 décembre, jours compris, en mois de ${qte(JOURS_DU_MOIS)} jours : ${qte(k.jours)} jours sur ${qte(k.joursDeLaPeriode)}`,
          },
          { libelle: "Intérêts courus au 31 décembre", attendu: k.montant, calcul: `${eur(s.interets)} × ${qte(k.jours)} ÷ ${qte(k.joursDeLaPeriode)} = ${eur(k.montant)}` },
          { libelle: "Charge d'intérêts de l'exercice", attendu: x.annee.chargeDInterets, calcul: `${eur(x.annee.interetsPayes)} payés + ${eur(k.montant)} courus = ${eur(x.annee.chargeDInterets)}` },
        ];
      },
      explication: (c) => {
        const x = empruntDuCas(c);
        const k = x.courus;
        return [
          `${eur(k.montant)} d'intérêts sont nés cette année et ne seront payés que l'an prochain : ils appartiennent à l'exercice, c'est l'indépendance des exercices. Les ${qte(k.joursDeLaPeriode - k.jours)} derniers jours de la période, eux, appartiennent à l'année suivante.`,
        ];
      },
    },
    {
      id: "ecriture-des-interets-courus",
      objectifs: [3],
      type: "ecriture",
      titre: "Les intérêts courus, au journal",
      notions: ["loan_schedule", "income_statement"],
      evenement: () => "Le 31 décembre, passez les intérêts courus de l'emprunt.",
      ecriture: (c) => {
        const k = empruntDuCas(c).courus;
        return {
          date: dateDe(clotureDe(0)),
          libelle: "Intérêts courus sur l'emprunt",
          lignes: [
            { role: "la charge d'intérêts de l'exercice", compte: "6611", acceptes: ["661"], sens: "debit", montant: k.montant, indice: "les intérêts courus calculés" },
            { role: "la dette d'intérêts courus", compte: "1688", sens: "credit", montant: k.montant, indice: "les intérêts courus calculés" },
          ],
        };
      },
      indices: () => [
        "Une charge au débit : les intérêts des emprunts (6611).",
        "Au crédit, une dette qui suit l'emprunt : les intérêts courus sur emprunts (1688). La banque ne bouge pas.",
      ],
      explication: (c) => {
        const x = empruntDuCas(c);
        return [
          `Les intérêts de l'exercice font maintenant ${eur(x.annee.interetsPayes)} payés plus ${eur(x.courus.montant)} courus, soit ${eur(x.annee.chargeDInterets)}. Au 1er janvier, l'écriture s'extourne ; l'échéance du ${dateDe(x.courus.echeanceSuivante!.date)} se passe alors en entier, et l'exercice suivant n'en garde que sa part.`,
        ];
      },
      vue: "bilan-et-resultat",
    },
    {
      id: "predire-le-croisement",
      objectifs: [4],
      type: "choix",
      titre: "Pariez sur l'échéance constante",
      notions: ["loan_schedule"],
      question: (c) => {
        const x = empruntDuCas(c);
        return `Beaucoup de prêts se remboursent par échéances toutes égales. Les vôtres partent de ${eur(x.e(1).echeance)} et baissent de ${eur(auCentime(x.capital * x.i))} à chaque trimestre, jusqu'à ${eur(x.e(x.n).echeance)}. Au même taux, sur la même durée, une échéance constante serait…`;
      },
      options: (c) => {
        const x = empruntDuCas(c);
        const voir = "Déplacez le curseur à l'étape suivante : il compare, échéance par échéance, les deux façons de rembourser.";
        return [
          { texte: "Plus légère que les premières, plus lourde que les dernières", juste: x.a < x.e(1).echeance && x.a > x.e(x.n).echeance, retour: `Bon pari. ${voir}` },
          { texte: "Plus légère que toutes : elle étale mieux le remboursement", juste: x.a < x.e(x.n).echeance, retour: `Pari à vérifier. ${voir}` },
          { texte: "Plus lourde que toutes : elle paie plus d'intérêts", juste: x.a > x.e(1).echeance, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "les-echeances-qui-se-croisent",
      objectifs: [4],
      type: "curseur",
      titre: "Les échéances qui se croisent",
      notions: ["loan_schedule"],
      question: (c) => {
        const x = empruntDuCas(c);
        return `Faites défiler les échéances, de la première à la n° ${qte(x.n)}. Une droite donne l'échéance constante, ${eur(x.a)} ; l'autre, l'échéance de votre prêt, qui baisse. Placez le curseur sur la première échéance où l'échéance constante pèse au moins autant que la vôtre, puis validez.`;
      },
      grandeur: () => ({ libelle: "Numéro de l'échéance", unite: "échéance" }),
      cible: (c) => ({ attendu: empruntDuCas(c).croisement, min: 1, max: empruntDuCas(c).n }),
      zones: ["L'échéance constante pèse plus", "L'amortissement constant pèse plus"],
      rates: () => ({
        dessous: "À cette échéance, l'amortissement constant demande encore plus que l'échéance constante : avancez.",
        dessus: "Plus tôt, l'échéance constante pèse déjà autant : cherchez la première.",
      }),
      montrer: "Montrer le croisement",
      lecture: (c, k) => {
        const x = empruntDuCas(c);
        const ac = x.ac[k - 1]!;
        const ec = x.ec[k - 1]!;
        return [
          { libelle: "Échéance en amortissement constant", montant: ac.echeance },
          { libelle: "Échéance constante", montant: ec.echeance },
          { libelle: "Capital restant dû après, en amortissement constant", montant: ac.capitalFin },
          { libelle: "Capital restant dû après, en échéances constantes", montant: ec.capitalFin, fort: true },
        ];
      },
      droites: (c) => {
        const x = empruntDuCas(c);
        return { produit: () => x.a, cout: (k) => x.echeanceAC(k), libelles: ["Échéance constante", "Échéance en amortissement constant"] };
      },
      explication: (c) => {
        const x = empruntDuCas(c);
        const k = x.croisement;
        return [
          `Les ${qte(k - 1)} premières échéances sont plus légères en échéances constantes ; à partir de la n° ${qte(k)}, c'est l'amortissement constant qui demande moins. Et à chaque échéance, le capital restant dû est plus haut en échéances constantes : au début, l'échéance égale paie surtout des intérêts.`,
          "Une dette qui baisse moins vite porte des intérêts plus longtemps. L'étape suivante calcule l'échéance constante et la première ligne de son tableau.",
        ];
      },
    },
    {
      id: "annuites-constantes",
      objectifs: [0],
      type: "montants",
      titre: "Le tableau en échéances constantes",
      notions: ["loan_schedule"],
      question: (c) => {
        const x = empruntDuCas(c);
        return `Le même prêt, ${eur(x.C)} à ${pct(x.i)} par trimestre sur ${qte(x.n)} échéances, en échéances constantes. Sans formule donnée : calculez l'échéance constante, puis la première ligne de son tableau.`;
      },
      champs: (c) => {
        const x = empruntDuCas(c);
        const l = x.ec[0]!;
        return [
          { libelle: "Échéance constante", attendu: x.a, calcul: `${eur(x.C)} × ${pct(x.i)} ÷ (1 − (1 + ${pct(x.i)})^−${qte(x.n)}) = ${eur(x.a)}` },
          { libelle: "Intérêts de la première échéance", attendu: l.interets, calcul: `${eur(x.C)} × ${pct(x.i)} = ${eur(l.interets)}, comme en amortissement constant` },
          { libelle: "Capital remboursé à la première échéance", attendu: l.amortissement, calcul: `${eur(x.a)} − ${eur(l.interets)} = ${eur(l.amortissement)}` },
          { libelle: "Capital restant dû après la première échéance", attendu: l.capitalFin, calcul: `${eur(x.C)} − ${eur(l.amortissement)} = ${eur(l.capitalFin)}` },
        ];
      },
      explication: (c) => {
        const x = empruntDuCas(c);
        const l = x.ec[0]!;
        return [
          `Les intérêts de la première échéance sont les mêmes dans les deux modes : ils portent sur le même capital. Mais l'échéance constante ne rembourse que ${eur(l.amortissement)} de capital, contre ${eur(x.capital)} : la dette baisse moins vite, et la part de capital grandit ensuite d'échéance en échéance.`,
          "L'échéance constante est celle dont la valeur actuelle, au taux du prêt, refait le capital emprunté : c'est la formule de l'annuité, que l'examen demande de connaître.",
        ];
      },
    },
    {
      id: "predire-le-cout",
      objectifs: [4],
      type: "choix",
      titre: "Pariez sur le coût du crédit",
      notions: ["loan_schedule"],
      question: (c) => {
        const x = empruntDuCas(c);
        return `Sur toute sa durée, votre prêt coûtera ${eur(x.coutAC)} d'intérêts. En échéances constantes, au même taux et sur la même durée, il coûterait…`;
      },
      options: (c) => {
        const x = empruntDuCas(c);
        const voir = "Essayez au laboratoire de l'étape suivante : il suit le coût du crédit dans les deux modes.";
        return [
          { texte: "Plus d'intérêts : la dette baisse moins vite au début", juste: x.coutEC > x.coutAC, retour: `Bon pari. ${voir}` },
          { texte: "Moins d'intérêts : les premières échéances sont plus légères", juste: x.coutEC < x.coutAC, retour: `Pari à vérifier. ${voir}` },
          { texte: "Autant : même taux, même durée, même coût", juste: x.coutEC === x.coutAC, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-du-pret",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire du prêt",
      notions: ["loan_schedule", "income_statement"],
      question: (c) => {
        const x = empruntDuCas(c);
        return `${c.entreprise} négocie son prêt de ${eur(x.C)} avec la banque, avant de signer. Faites varier le taux, la durée et le mode de remboursement : le tableau suit la première échéance, le coût du crédit sur toute sa durée, la charge d'intérêts de l'exercice et le capital restant dû au 31 décembre. Le graphique montre le coût du crédit selon la durée, dans les deux modes.`;
      },
      leviers: (c) => {
        const x = empruntDuCas(c);
        return [
          { code: "taux", libelle: "Taux annuel du prêt", unite: "%", ...LEVIERS_DU_PRET.taux, depart: Math.round(x.contrat.tauxAnnuel * 10_000) / 100 },
          { code: "duree", libelle: "Durée du prêt", unite: "ans", ...LEVIERS_DU_PRET.duree, depart: x.annees },
          {
            code: "mode",
            libelle: "Mode de remboursement",
            unite: "",
            min: MODES_DE_REMBOURSEMENT.amortissementConstant,
            max: MODES_DE_REMBOURSEMENT.echeancesConstantes,
            pas: 1,
            depart: MODES_DE_REMBOURSEMENT.amortissementConstant,
            choix: [
              { valeur: MODES_DE_REMBOURSEMENT.amortissementConstant, libelle: "Amortissement constant" },
              { valeur: MODES_DE_REMBOURSEMENT.echeancesConstantes, libelle: "Échéances constantes" },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const x = empruntDuCas(c);
        const l = laboratoireDuPret(c, p);
        const d = laboratoireDuPret(c, { taux: Math.round(x.contrat.tauxAnnuel * 10_000) / 100, duree: x.annees, mode: MODES_DE_REMBOURSEMENT.amortissementConstant });
        return [
          { libelle: "Première échéance", montant: l.premiere, reference: d.premiere, fort: true },
          { libelle: "Coût du crédit sur toute la durée", montant: l.cout, reference: d.cout, fort: true },
          { libelle: "Charge d'intérêts de l'exercice, courus compris", montant: -l.chargeDeLExercice, reference: -d.chargeDeLExercice, effet: true },
          { libelle: "Prélevé par la banque dans l'exercice", montant: l.decaissements, reference: d.decaissements },
          { libelle: "Capital restant dû au 31 décembre", montant: l.restant, reference: d.restant },
        ].map((y) => ({ ...y, montant: y.montant + 0, reference: y.reference + 0 }));
      },
      graphique: (c) => ({
        levier: "duree",
        courbes: [
          { libelle: "Coût du crédit, amortissement constant", valeur: (p) => laboratoireDuPret(c, { ...p, mode: MODES_DE_REMBOURSEMENT.amortissementConstant }).cout },
          { libelle: "Coût du crédit, échéances constantes", valeur: (p) => laboratoireDuPret(c, { ...p, mode: MODES_DE_REMBOURSEMENT.echeancesConstantes }).cout },
        ],
      }),
      defi: (c) => {
        const x = empruntDuCas(c);
        const tauxDuContrat = Math.round(x.contrat.tauxAnnuel * 10_000) / 100;
        return {
          consigne: `Empruntez les ${eur(x.C)} avec au plus ${eur(x.plafond)} d'intérêts sur toute la durée, et une première échéance d'au plus ${eur(x.premiere)}, celle du contrat.`,
          atteint: (p) => {
            const l = laboratoireDuPret(c, p);
            return l.cout <= x.plafond && l.premiere <= x.premiere;
          },
          indice: (p) => {
            const l = laboratoireDuPret(c, p);
            if (l.premiere > x.premiere)
              return `La première échéance vaut ${eur(l.premiere)}, au-delà des ${eur(x.premiere)} : une durée plus courte rembourse plus de capital à chaque échéance.`;
            if (p.taux! >= tauxDuContrat)
              return `Le crédit coûte ${eur(l.cout)}, au-delà des ${eur(x.plafond)}. Au taux du contrat, ni la durée ni le mode ne suffisent : moins d'intérêts demande une durée plus courte, donc des échéances plus lourdes, et les échéances constantes coûtent plus. Il reste à négocier le taux.`;
            return `Le crédit coûte ${eur(l.cout)}, au-delà des ${eur(x.plafond)} : le taux doit baisser encore.`;
          },
          solution: { taux: x.tauxDeLaSolution, duree: x.annees, mode: MODES_DE_REMBOURSEMENT.amortissementConstant },
        };
      },
      explication: (c, p) => {
        const x = empruntDuCas(c);
        const l = laboratoireDuPret(c, p);
        return [
          `À ${qte(p.taux!)} % sur ${qte(p.duree!)} ans, le crédit coûte ${eur(l.cout)} et la première échéance vaut ${eur(l.premiere)}. Au taux de ${pct(x.contrat.tauxAnnuel)}, aucune combinaison ne tenait : raccourcir la durée baisse le coût mais alourdit l'échéance ; les échéances constantes allègent l'échéance mais coûtent plus. La durée et le mode déplacent la charge entre la trésorerie et le coût ; seul le taux baisse les deux à la fois.`,
          `Le graphique le montre : quelle que soit la durée, la courbe des échéances constantes reste au-dessus, et l'écart grandit avec la durée. Au taux du contrat, sur ${qte(x.annees)} ans, il est de ${eur(x.supplement)}.`,
        ];
      },
    },
    {
      id: "cout-du-credit",
      objectifs: [4],
      type: "montants",
      titre: "Le coût du crédit, dans les deux modes",
      notions: ["loan_schedule"],
      question: (c) => {
        const x = empruntDuCas(c);
        return `Au taux et sur la durée du contrat (${qte(x.n)} échéances), calculez le coût du crédit en amortissement constant, puis en échéances constantes de ${eur(x.a)}, et ce que les échéances constantes coûtent de plus.`;
      },
      champs: (c) => {
        const x = empruntDuCas(c);
        return [
          {
            libelle: "Coût du crédit en amortissement constant",
            attendu: x.coutAC,
            tolerance: 0.1,
            calcul: `les intérêts baissent de ${eur(auCentime(x.capital * x.i))} à chaque échéance, de ${eur(x.e(1).interets)} à ${eur(x.e(x.n).interets)} : ${qte(x.n)} × (${eur(x.e(1).interets)} + ${eur(x.e(x.n).interets)}) ÷ 2 = ${eur(x.coutACParLaFormule)}${x.coutACParLaFormule === x.coutAC ? "" : ` ; le tableau, chaque intérêt arrondi au centime, donne ${eur(x.coutAC)}`}`,
          },
          {
            libelle: "Coût du crédit en échéances constantes",
            attendu: x.coutEC,
            tolerance: 0.2,
            calcul: `${qte(x.n)} × ${eur(x.a)} − ${eur(x.C)} = ${eur(x.nFoisAMoinsC)} ; le tableau, dont la dernière échéance solde les centimes, donne ${eur(x.coutEC)}`,
          },
          { libelle: "Supplément des échéances constantes", attendu: x.supplement, tolerance: 0.25, calcul: `${eur(x.coutEC)} − ${eur(x.coutAC)} = ${eur(x.supplement)}` },
        ];
      },
      explication: (c) => {
        const x = empruntDuCas(c);
        return [
          `En échéances constantes, le prêt coûte ${eur(x.supplement)} de plus. En échange, ses ${qte(x.croisement - 1)} premières échéances sont plus légères : ${eur(auCentime(x.e(1).echeance - x.a))} de moins à la première.`,
          "Ce supplément n'est pas un taux plus cher : c'est le prix d'une dette gardée plus longtemps, au même taux.",
        ];
      },
    },
    {
      id: "le-taux-a-rebours",
      objectifs: [4],
      type: "montants",
      titre: "Retrouver le taux à rebours",
      notions: ["loan_schedule"],
      question: (c) => {
        const x = empruntDuCas(c);
        return `Pour le même projet, une autre banque avait fait une offre, en amortissement constant aussi. Il n'en reste que deux avis d'échéance : la n° 1, ${eur(x.avis1)}, et la n° 2, ${eur(x.avis2)} ; chacune rembourse ${eur(x.capital)} de capital. Retrouvez la baisse des intérêts d'une échéance à l'autre, le taux du trimestre et le taux annuel (en %), puis le montant emprunté.`;
      },
      champs: (c) => {
        const x = empruntDuCas(c);
        return [
          { libelle: "Baisse des intérêts d'une échéance à l'autre", attendu: x.baisse, calcul: `${eur(x.avis1)} − ${eur(x.avis2)} = ${eur(x.baisse)} : le capital est le même, seuls les intérêts ont baissé` },
          {
            libelle: "Taux du trimestre, en %",
            attendu: x.tauxTrimestrielARebours,
            calcul: `la baisse est le capital remboursé × le taux du trimestre : ${eur(x.baisse)} ÷ ${eur(x.capital)} = ${qte(x.tauxTrimestrielARebours)} %`,
          },
          { libelle: "Taux annuel, en %", attendu: x.tauxAnnuelARebours, calcul: `${qte(x.tauxTrimestrielARebours)} % × ${qte(ECHEANCES_PAR_AN)} = ${qte(x.tauxAnnuelARebours)} %` },
          {
            libelle: "Montant emprunté",
            attendu: x.montantARebours,
            calcul: `intérêts de la n° 1 : ${eur(x.avis1)} − ${eur(x.capital)} = ${eur(auCentime(x.avis1 - x.capital))} ; ÷ ${qte(x.tauxTrimestrielARebours)} % = ${eur(x.montantARebours)}`,
          },
        ];
      },
      explication: (c) => {
        const x = empruntDuCas(c);
        const compare =
          x.tauxAnnuelARebours > x.contrat.tauxAnnuel * 100
            ? `un prêt plus cher que celui ${dE(c.entreprise)} (${pct(x.contrat.tauxAnnuel)}) : ${eur(x.coutChezLAutreBanque)} d'intérêts au lieu de ${eur(x.coutAC)}`
            : `un prêt moins cher que celui ${dE(c.entreprise)} (${pct(x.contrat.tauxAnnuel)}) : ${eur(x.coutChezLAutreBanque)} d'intérêts au lieu de ${eur(x.coutAC)}`;
        return [
          `En amortissement constant, deux avis suffisent : leur différence ne vient que des intérêts, et elle vaut le capital remboursé au taux du trimestre. On en tire le taux, puis le capital dû avant la première échéance, le montant emprunté.`,
          `L'offre était à ${qte(x.tauxAnnuelARebours)} % l'an : ${compare}.`,
        ];
      },
    },
    {
      id: "quel-mode",
      objectifs: [4],
      type: "choix",
      titre: "Quel mode conseiller",
      notions: ["loan_schedule"],
      question: (c) => {
        const x = empruntDuCas(c);
        return `Pour un prochain prêt, au même taux, le gérant ${dE(c.entreprise)} hésite entre les deux modes. Les échéances constantes coûteraient ${eur(x.supplement)} d'intérêts de plus. Que lui dites-vous ?`;
      },
      options: (c) => {
        const x = empruntDuCas(c);
        return [
          {
            texte: "Au même taux, aucun n'est plus cher : on choisit selon la trésorerie des premières années",
            juste: true,
            retour: `Oui. Les ${eur(x.supplement)} de plus rémunèrent un capital gardé plus longtemps, au même taux : ce n'est pas un surcoût. Les échéances constantes allègent les ${qte(x.croisement - 1)} premières échéances ; si la trésorerie des débuts est serrée, elles valent ce prix.`,
          },
          {
            texte: `L'amortissement constant, toujours : il économise ${eur(x.supplement)}`,
            juste: false,
            retour: "Non : il coûte moins d'intérêts parce qu'il rembourse plus vite, et l'entreprise doit trouver cet argent plus tôt. Au même taux, le prix de l'argent emprunté est le même ; seule la durée pendant laquelle on le garde change.",
          },
          {
            texte: `Les échéances constantes, toujours : leur première échéance est plus légère de ${eur(auCentime(x.e(1).echeance - x.a))}`,
            juste: false,
            retour: `Non : c'est ne regarder que le début. À partir de l'échéance n° ${qte(x.croisement)}, elles pèsent plus que l'amortissement constant, et elles portent ${eur(x.supplement)} d'intérêts de plus.`,
          },
          {
            texte: "Les échéances constantes, car leurs intérêts portent sur le capital emprunté et non sur le restant dû",
            juste: false,
            retour: "Non : dans les deux modes, les intérêts portent sur le capital restant dû. Ce qui change, c'est la vitesse à laquelle ce capital baisse.",
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
        const x = empruntDuCas(c);
        return [
          `Vous avez suivi le prêt ${dE(c.entreprise)} sur sa première année : le tableau d'amortissement, ${qte(x.annee.echeances.length)} échéances passées en séparant le capital des intérêts, l'emprunt lu au 31 décembre, et les intérêts courus passés à la clôture.`,
          `Cette année, la banque a prélevé ${eur(x.annee.decaissements)}. Le compte de résultat n'en retient que les intérêts, et y ajoute ceux qui ont couru : ${eur(x.annee.chargeDInterets)} de charge ; le reste a remboursé la dette.`,
          "Au niveau de l'examen, vous savez bâtir le tableau d'un emprunt dans les deux modes, passer ses échéances et ses intérêts courus, comparer les modes en trésorerie et en coût, retrouver un taux et un montant à partir de deux avis d'échéance, et dire pourquoi, au même taux, aucun mode n'est plus cher.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Une échéance d'emprunt se coupe en deux : le capital au débit du 164, qui réduit la dette, et les intérêts au débit du 6611, seule charge. À la clôture, les intérêts courus depuis la dernière échéance se rattachent à l'exercice (6611 au débit, 1688 au crédit). Échéance constante = capital × i ÷ (1 − (1 + i)^−n).",
    },
  ],
};
