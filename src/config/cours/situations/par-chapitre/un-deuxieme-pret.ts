import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime, type Ecriture } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { dateDuCours as date } from "../../dates";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « L'EMPRUNT ET SES INTÉRÊTS » : UN DEUXIÈME PRÊT POUR
 * S'ÉQUIPER (comptabilité générale, palier 3).
 *
 * L'entreprise veut un second équipement, identique au premier. La banque en finance une
 * part, au taux du premier prêt, sur la durée d'usage de l'équipement, par échéances
 * trimestrielles à amortissement constant. Le gérant demande ce que la banque prélèvera
 * et ce que le prêt coûtera la première année. L'élève bâtit la première ligne du
 * tableau, passe la première échéance, calcule la première année, puis répond.
 *
 * Le cas est neuf par sa question : ce n'est plus le prêt de la création, c'est un
 * nouveau prêt, d'un autre montant et d'une autre durée. Le taux, le prix et la durée
 * d'usage de l'équipement sont ceux du cas (`cas.ts`).
 */

/**
 * La part de l'équipement que la banque finance : 75 %. Une banque finance rarement
 * tout un investissement ; l'entreprise en apporte le reste sur sa trésorerie.
 */
export const PART_FINANCEE = 0.75;

/** Le prêt est versé le 1er juillet, au début du second semestre. */
const JOUR_DU_PRET = 182;
/** Les échéances de sa première année : tous les trois mois après le versement. */
const JOURS_DES_ECHEANCES = [274, 366, 456, 547];
const TRIMESTRES_PAR_AN = 4;
const JOURS_DE_L_ANNEE = 365;
const MOIS_PAR_TRIMESTRE = 3;

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

/** Le nouveau prêt, sa ligne `k` (à partir de 1), et sa première année. */
export function deuxiemePret(c: Cas) {
  const montant = auCentime(c.immobilisation.ht * PART_FINANCEE);
  const n = c.gestion.dureeAmortissementMois / MOIS_PAR_TRIMESTRE;
  const capital = auCentime(montant / n);
  const taux = c.pret.tauxAnnuel;
  const ligne = (k: number) => {
    const avant = auCentime(montant - (k - 1) * capital);
    const interets = auCentime((avant * taux) / TRIMESTRES_PAR_AN);
    return { k, jour: JOURS_DES_ECHEANCES[k - 1] ?? 0, avant, interets, total: auCentime(capital + interets), apres: auCentime(avant - capital) };
  };
  const annee = JOURS_DES_ECHEANCES.map((_, i) => ligne(i + 1));
  const interetsAnnee = auCentime(annee.reduce((s, l) => s + l.interets, 0));
  return {
    montant,
    autofinance: auCentime(c.immobilisation.ht - montant),
    annees: c.gestion.dureeAmortissementMois / 12,
    n,
    capital,
    taux,
    premiere: ligne(1),
    annee,
    interetsAnnee,
    prelevementsAnnee: auCentime(annee.reduce((s, l) => s + l.total, 0)),
    restant: annee[annee.length - 1]!.apres,
    // Les erreurs classiques : le taux annuel appliqué à un trimestre, et des intérêts
    // calculés toute l'année sur le capital emprunté, comme s'il ne baissait pas.
    interetsAuTauxAnnuel: auCentime(annee.reduce((s, l) => s + auCentime(l.avant * taux), 0)),
    interetsSansBaisse: auCentime(montant * taux),
  };
}

/** Le versement du prêt, déjà au journal. */
function versement(c: Cas): Ecriture {
  const p = deuxiemePret(c);
  return {
    date: date(JOUR_DU_PRET),
    libelle: "Deuxième emprunt bancaire, versé",
    lignes: [
      { compte: "512", debit: p.montant, credit: 0 },
      { compte: "164", debit: 0, credit: p.montant },
    ],
  };
}

export const UN_DEUXIEME_PRET: Situation = {
  code: "un-deuxieme-pret",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [],
  reprend: ["l-emprunt"],
  commanditaire: "Le gérant",
  titre: "Un deuxième prêt pour s'équiper",
  accroche:
    "Pour un second équipement, la banque propose un nouveau prêt. Avant de signer, le gérant veut savoir ce qu'elle prélèvera chaque trimestre et ce que le prêt coûtera la première année.",
  objectifs: [
    "Bâtir la première ligne du tableau d'amortissement d'un nouveau prêt",
    "Séparer, dans une échéance, le capital remboursé et les intérêts",
    "Enregistrer une échéance : la dette qui baisse, la charge d'intérêts, le prélèvement",
    "Calculer les intérêts d'une année de prêt et le capital qui reste dû",
  ],
  libre: false,
  ouverture: versement,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: (c) => {
        const p = deuxiemePret(c);
        return [
          `« Nous voulons un second équipement, le même que le premier : ${qte(c.immobilisation.quantite)} × « ${c.immobilisation.designation} », ${eur(c.immobilisation.ht)} hors taxes. La banque en finance ${pct(PART_FINANCEE)}, au taux de notre premier prêt, sur ${qte(p.annees)} ans, la durée d'usage de l'équipement. Une échéance par trimestre, le même capital remboursé à chacune. Avant de signer, je veux savoir ce qu'elle prélèvera chaque trimestre, et ce que ce prêt nous coûtera en intérêts sur sa première année. »`,
          `Le prêt est versé le ${date(JOUR_DU_PRET)} ; le journal porte déjà ce versement. Pas de cours cette fois : la méthode est celle du chapitre. À vous de l'enchaîner.`,
        ];
      },
      tableau: (c) => {
        const p = deuxiemePret(c);
        return {
          titre: `Le deuxième prêt · ${c.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Prix de l'équipement, hors taxes", valeurs: [eur(c.immobilisation.ht)] },
            { libelle: "Part financée par la banque", valeurs: [pct(PART_FINANCEE)] },
            { libelle: "Taux annuel, celui du premier prêt", valeurs: [pct(p.taux)] },
            { libelle: "Durée", valeurs: [`${qte(p.annees)} ans`] },
            { libelle: "Versement des fonds", valeurs: [date(JOUR_DU_PRET)] },
            { libelle: "Échéances", valeurs: [`tous les trimestres, à partir du ${date(JOURS_DES_ECHEANCES[0]!)}`] },
          ],
        };
      },
      repere: () =>
        "À rendre : la première ligne du tableau d'amortissement, l'écriture de la première échéance, la première année du prêt, et votre réponse.",
    },
    {
      id: "premiere-ligne",
      type: "montants",
      titre: "La première ligne du tableau",
      notions: ["loan_schedule"],
      question: () =>
        "Calculez le montant du prêt, le nombre d'échéances, le capital remboursé à chacune, puis les intérêts et le montant de la première échéance.",
      champs: (c) => {
        const p = deuxiemePret(c);
        return [
          { libelle: "Montant du prêt", attendu: p.montant, calcul: `${eur(c.immobilisation.ht)} × ${pct(PART_FINANCEE)} = ${eur(p.montant)}` },
          { libelle: "Nombre d'échéances", attendu: p.n, calcul: `${qte(p.annees)} ans × ${TRIMESTRES_PAR_AN} trimestres = ${qte(p.n)} échéances` },
          { libelle: "Capital remboursé à chaque échéance", attendu: p.capital, calcul: `${eur(p.montant)} ÷ ${qte(p.n)} = ${eur(p.capital)}` },
          { libelle: "Intérêts de la première échéance", attendu: p.premiere.interets, calcul: `${eur(p.montant)} × ${pct(p.taux)} ÷ ${TRIMESTRES_PAR_AN} = ${eur(p.premiere.interets)}` },
          { libelle: "Montant de la première échéance", attendu: p.premiere.total, calcul: `${eur(p.capital)} + ${eur(p.premiere.interets)} = ${eur(p.premiere.total)}` },
        ];
      },
      explication: (c) => {
        const p = deuxiemePret(c);
        return [
          `${c.entreprise} apporte elle-même ${eur(p.autofinance)}, la part que la banque ne finance pas. Sur la première échéance, ${eur(p.premiere.total)}, seuls ${eur(p.premiere.interets)} coûtent : le reste rembourse la dette.`,
        ];
      },
    },
    {
      id: "echeance-1",
      type: "ecriture",
      titre: "La première échéance",
      notions: ["loan_schedule"],
      evenement: (c) => {
        const p = deuxiemePret(c);
        return `Le ${date(p.premiere.jour)}, la banque prélève la première échéance du deuxième prêt : ${eur(p.premiere.total)}.`;
      },
      piece: (c) => {
        const p = deuxiemePret(c);
        return {
          nature: "Avis d'échéance",
          de: "Votre banque",
          a: c.entreprise,
          date: date(p.premiere.jour),
          lignes: [
            { libelle: "Capital remboursé", montant: p.capital },
            { libelle: `Intérêts (${pct(p.taux)} l'an, un trimestre)`, montant: p.premiere.interets },
          ],
          totaux: [
            { libelle: "Montant prélevé", montant: p.premiere.total, fort: true },
            { libelle: "Capital restant dû", montant: p.premiere.apres },
          ],
        };
      },
      ecriture: (c) => {
        const p = deuxiemePret(c);
        return {
          date: date(p.premiere.jour),
          libelle: "Échéance n° 1 du deuxième emprunt",
          lignes: [
            { role: "le capital remboursé, qui réduit la dette", compte: "164", acceptes: ["1641"], sens: "debit", montant: p.capital, indice: "le capital remboursé à chaque échéance" },
            { role: "les intérêts du trimestre", compte: "6611", acceptes: ["661"], sens: "debit", montant: p.premiere.interets, indice: "le capital dû avant l'échéance, au taux annuel, pour un trimestre" },
            { role: "le prélèvement sur le compte en banque", compte: "512", sens: "credit", montant: p.premiere.total, indice: "le capital et les intérêts réunis" },
          ],
        };
      },
      indices: () => [
        "Deux lignes au débit : la dette qui baisse (classe 1) et la charge d'intérêts (classe 6, les charges financières).",
        "Une seule ligne au crédit : la banque, pour le montant prélevé.",
      ],
      explication: (c) => {
        const p = deuxiemePret(c);
        return [
          `La dette du deuxième prêt passe à ${eur(p.premiere.apres)}. Le compte de résultat ne porte que les intérêts, ${eur(p.premiere.interets)}.`,
        ];
      },
      vue: "bilan-et-resultat",
    },
    {
      id: "premiere-annee",
      type: "montants",
      titre: "La première année du prêt",
      notions: ["loan_schedule"],
      question: (c) => {
        const p = deuxiemePret(c);
        const cetteAnnee = p.annee.filter((l) => l.jour <= JOURS_DE_L_ANNEE).map((l) => date(l.jour));
        const suivante = p.annee.filter((l) => l.jour > JOURS_DE_L_ANNEE).map((l) => date(l.jour - JOURS_DE_L_ANNEE));
        return `Sur sa première année, le prêt a ${qte(p.annee.length)} échéances : le ${cetteAnnee.join(", le ")}, puis le ${suivante.join(", le ")} de l'année suivante. Calculez les intérêts de la dernière, ceux de toute l'année, et le capital qui restera dû après elle.`;
      },
      champs: (c) => {
        const p = deuxiemePret(c);
        const derniere = p.annee[p.annee.length - 1]!;
        return [
          { libelle: `Intérêts de l'échéance n° ${qte(derniere.k)}`, attendu: derniere.interets, calcul: `${eur(derniere.avant)} × ${pct(p.taux)} ÷ ${TRIMESTRES_PAR_AN} = ${eur(derniere.interets)}` },
          { libelle: "Intérêts de la première année", attendu: p.interetsAnnee, tolerance: 0.02, calcul: `${p.annee.map((l) => eur(l.interets)).join(" + ")} = ${eur(p.interetsAnnee)}` },
          { libelle: "Capital restant dû après un an", attendu: p.restant, calcul: `${eur(p.montant)} − ${qte(p.annee.length)} × ${eur(p.capital)} = ${eur(p.restant)}` },
        ];
      },
      explication: (c) => {
        const p = deuxiemePret(c);
        return [
          `En un an, la banque prélèvera ${eur(p.prelevementsAnnee)} pour ce prêt, en plus des échéances du premier. ${c.entreprise} n'en supportera que ${eur(p.interetsAnnee)} en charges ; le reste rembourse la dette, qui descend à ${eur(p.restant)}.`,
          "Les intérêts baissent d'une échéance à l'autre : ils portent sur un capital qui diminue à chaque remboursement.",
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      notions: ["loan_schedule"],
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const p = deuxiemePret(c);
        return [
          {
            texte: `Première échéance : ${eur(p.premiere.total)} ; un an d'intérêts : ${eur(p.interetsAnnee)}`,
            juste: true,
            retour: `Oui : ${eur(p.capital)} de capital et ${eur(p.premiere.interets)} d'intérêts à la première échéance ; puis des intérêts qui baissent avec la dette, ${eur(p.interetsAnnee)} sur l'année.`,
          },
          {
            texte: `Première échéance : ${eur(auCentime(p.capital + p.montant * p.taux))} ; un an d'intérêts : ${eur(p.interetsAuTauxAnnuel)}`,
            juste: false,
            retour: `Non : c'est appliquer le taux annuel à chaque trimestre. Les intérêts d'un trimestre se calculent au quart du taux : ${eur(p.premiere.interets)} à la première échéance.`,
          },
          {
            texte: `Première échéance : ${eur(p.premiere.total)} ; un an d'intérêts : ${eur(p.interetsSansBaisse)}, sur le capital emprunté`,
            juste: false,
            retour: `Non : le capital dû baisse de ${eur(p.capital)} à chaque échéance, et les intérêts avec lui. Sur l'année, ils font ${eur(p.interetsAnnee)}.`,
          },
          {
            texte: `La banque prélèvera ${eur(p.capital)} par trimestre ; les intérêts se paieront à la fin du prêt`,
            juste: false,
            retour: `Non : chaque échéance paie le capital et les intérêts du trimestre. La première fera ${eur(p.premiere.total)}.`,
          },
        ];
      },
    },
  ],
};
