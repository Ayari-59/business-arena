import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Ecriture } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { JOURS_DU_MOIS, type DateDuCours } from "../../monde/amortissement";
import { coutDuCredit, echeanceConstante, empruntALaCloture, tableauDAmortissement, type ContratDePret } from "../../monde/emprunt";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « L'EMPRUNT ET SES INTÉRÊTS » : UN DEUXIÈME PRÊT POUR S'ÉQUIPER
 * (comptabilité générale, palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : le prix de l'équipement, sa durée d'usage et le taux sont ceux
 * du cas figé de l'entreprise (monde/cas-des-entreprises.ts : `c.immobilisation`, `c.gestion`,
 * `c.pret`), et le prêt se calcule par le modèle du cours (monde/emprunt.ts).
 *
 * L'entreprise veut un second équipement, identique au premier. La banque en finance une part, au
 * taux du premier prêt, sur la durée d'usage de l'équipement, et propose deux formules : amortissement
 * constant ou échéances constantes. Le gérant pose une limite : la trésorerie ne peut consacrer à ce
 * prêt qu'un montant donné par trimestre. L'élève calcule les deux premières échéances, cherche au
 * curseur le plus gros prêt que la limite permet en amortissement constant (un calcul à rebours),
 * compare le coût des deux formules, choisit celle qui tient la limite, passe sa première échéance,
 * calcule les intérêts courus au 31 décembre, puis répond : quelle formule, et ce qu'elle coûte à
 * l'exercice.
 *
 * Ce qui a disparu : le prêt imposé en amortissement constant, et la première année calculée sans
 * clôture ; les échéances tombent maintenant le 1er décembre, le 1er mars…, ce qui laisse des
 * intérêts courus au 31 décembre.
 */

/**
 * La part de l'équipement que la banque finance : 75 %. Une banque finance rarement tout un
 * investissement ; l'entreprise en apporte le reste sur sa trésorerie.
 */
export const PART_FINANCEE = 0.75;

/**
 * LA LIMITE DE LA TRÉSORERIE, hypothèse du cours : ce que la trésorerie peut consacrer au prêt par
 * trimestre, posé à 95 % de la première échéance en amortissement constant, arrondi à la dizaine
 * d'euros inférieure. Elle tombe entre l'échéance constante et la première échéance en
 * amortissement constant : la formule compte.
 */
export const PART_DE_LA_PREMIERE_ECHEANCE = 0.95;
export const ARRONDI_DE_LA_LIMITE = 10;

/** Le prêt est versé le 1er septembre ; ses échéances tombent tous les trois mois, à partir du 1er décembre. */
const VERSEMENT: DateDuCours = { jour: 1, mois: 9 };
const PREMIERE_ECHEANCE: DateDuCours = { jour: 1, mois: 12 };
const ECHEANCES_PAR_AN = 4;
const MOIS_PAR_ECHEANCE = 12 / ECHEANCES_PAR_AN;
const MOIS_PAR_AN = 12;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 3 })} %`;
const auCentime = (x: number) => Math.round((x + Number.EPSILON * Math.sign(x)) * 100) / 100 + 0;
/** « de NOVA », « d'ATLAS CONSEIL » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const dateDe = (d: DateDuCours) => `${d.jour === 1 ? "1er" : d.jour} ${MOIS[d.mois - 1]}${(d.exercice ?? 0) >= 1 ? " de l'année suivante" : ""}`;

/** Le nouveau prêt, ses deux formules, la limite de la trésorerie et la clôture. */
export function deuxiemePret(c: Pick<Cas, "immobilisation" | "gestion" | "pret">) {
  const montant = auCentime(c.immobilisation.ht * PART_FINANCEE);
  const annees = c.gestion.dureeAmortissementMois / MOIS_PAR_AN;
  const n = c.gestion.dureeAmortissementMois / MOIS_PAR_ECHEANCE;
  const taux = c.pret.tauxAnnuel;
  const i = taux / ECHEANCES_PAR_AN;
  const contrat: ContratDePret = { capital: montant, tauxAnnuel: taux, dureeAns: annees, echeancesParAn: ECHEANCES_PAR_AN, versement: VERSEMENT, premiereEcheance: PREMIERE_ECHEANCE, mode: "echeances-constantes" };
  const ac = tableauDAmortissement(contrat, "amortissement-constant");
  const ec = tableauDAmortissement(contrat, "echeances-constantes");
  const a = echeanceConstante(contrat);
  const premiereAC = ac[0]!.echeance;
  const limite = Math.floor((PART_DE_LA_PREMIERE_ECHEANCE * premiereAC) / ARRONDI_DE_LA_LIMITE) * ARRONDI_DE_LA_LIMITE;
  // Le curseur : le plus gros prêt, à l'euro, dont la première échéance en amortissement constant tient la limite.
  const premiereDe = (k: number) => k / n + k * i;
  let pretMaximal = Math.floor(limite / (1 / n + i));
  while (premiereDe(pretMaximal + 1) <= limite) pretMaximal += 1;
  while (premiereDe(pretMaximal) > limite) pretMaximal -= 1;
  const coutAC = coutDuCredit(contrat, "amortissement-constant");
  // La même somme par la suite arithmétique des intérêts : n × (premiers + derniers) ÷ 2 (le tableau arrondit chaque ligne).
  const coutACParLaFormule = auCentime((n * (ac[0]!.interets + ac[n - 1]!.interets)) / 2);
  const coutEC = coutDuCredit(contrat, "echeances-constantes");
  // La clôture, dans la formule qui tient la limite (échéances constantes) et dans l'autre.
  const clotureEC = empruntALaCloture(contrat, 0, "echeances-constantes");
  const clotureAC = empruntALaCloture(contrat, 0, "amortissement-constant");
  const courus = clotureEC.interetsCourus;
  // Les échéances au-dessus de la limite, en amortissement constant.
  const auDessus = ac.filter((l) => l.echeance > limite).length;
  return {
    montant,
    autofinance: auCentime(c.immobilisation.ht - montant),
    annees,
    n,
    taux,
    i,
    contrat,
    ac,
    ec,
    a,
    premiereAC,
    limite,
    premiereDe,
    pretMaximal,
    autofinanceEnPlus: auCentime(montant - pretMaximal),
    coutAC,
    coutACParLaFormule,
    coutEC,
    supplement: auCentime(coutEC - coutAC),
    nFoisAMoinsC: auCentime(n * a - montant),
    clotureEC,
    clotureAC,
    courus,
    auDessus,
  };
}

/** Le versement du prêt, déjà au journal. */
function versement(c: Cas): Ecriture {
  const p = deuxiemePret(c);
  return {
    date: dateDe(VERSEMENT),
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
    "Pour un second équipement, la banque propose deux formules de prêt. La trésorerie ne peut lui consacrer qu'un montant fixé par trimestre : laquelle signer, et que coûtera-t-elle cette année ?",
  objectifs: [
    "Calculer la première échéance d'un prêt dans les deux modes de remboursement",
    "Retrouver le plus gros prêt qu'une limite de trésorerie permet",
    "Comparer le coût du crédit des deux formules, et choisir",
    "Enregistrer une échéance constante et calculer les intérêts courus à la clôture",
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
          `« Nous voulons un second équipement, le même que le premier : ${qte(c.immobilisation.quantite)} × « ${c.immobilisation.designation} », ${eur(c.immobilisation.ht)} hors taxes. La banque en finance ${pct(PART_FINANCEE)}, au taux de notre premier prêt, sur ${qte(p.annees)} ans, la durée d'usage de l'équipement, une échéance par trimestre. Elle propose deux formules : le même capital remboursé à chaque échéance, ou des échéances toutes égales. Notre trésorerie ne peut pas consacrer plus de ${eur(p.limite)} par trimestre à ce prêt. Laquelle signer, et que nous coûtera-t-elle en intérêts sur cet exercice ? »`,
          `Le prêt est versé le ${dateDe(VERSEMENT)} ; le journal porte déjà ce versement. Pas de cours cette fois : la méthode est celle du chapitre. À vous de l'enchaîner.`,
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
            { libelle: "Versement des fonds", valeurs: [dateDe(VERSEMENT)] },
            { libelle: "Échéances", valeurs: [`tous les trimestres, à partir du ${dateDe(PREMIERE_ECHEANCE)}`] },
            { libelle: "Limite de la trésorerie, par trimestre", valeurs: [eur(p.limite)] },
            { libelle: "Clôture de l'exercice", valeurs: ["31 décembre"] },
          ],
        };
      },
      repere: () =>
        "À rendre : la première échéance dans chaque formule, le plus gros prêt que la limite permet, le coût des deux formules, la première échéance au journal, les intérêts courus au 31 décembre, et votre réponse.",
    },
    {
      id: "les-deux-formules",
      type: "montants",
      titre: "La première échéance des deux formules",
      notions: ["loan_schedule"],
      question: () => "Calculez le montant du prêt, le nombre d'échéances, la première échéance avec le même capital remboursé à chacune, puis l'échéance constante.",
      champs: (c) => {
        const p = deuxiemePret(c);
        const l = p.ac[0]!;
        return [
          { libelle: "Montant du prêt", attendu: p.montant, calcul: `${eur(c.immobilisation.ht)} × ${pct(PART_FINANCEE)} = ${eur(p.montant)}` },
          { libelle: "Nombre d'échéances", attendu: p.n, calcul: `${qte(p.annees)} ans × ${qte(ECHEANCES_PAR_AN)} trimestres = ${qte(p.n)} échéances` },
          {
            libelle: "Première échéance en amortissement constant",
            attendu: p.premiereAC,
            calcul: `${eur(p.montant)} ÷ ${qte(p.n)} = ${eur(l.amortissement)} de capital, + ${eur(p.montant)} × ${pct(p.taux)} ÷ ${qte(ECHEANCES_PAR_AN)} = ${eur(l.interets)} d'intérêts : ${eur(p.premiereAC)}`,
          },
          { libelle: "Échéance constante", attendu: p.a, calcul: `${eur(p.montant)} × ${pct(p.i)} ÷ (1 − (1 + ${pct(p.i)})^−${qte(p.n)}) = ${eur(p.a)}` },
        ];
      },
      explication: (c) => {
        const p = deuxiemePret(c);
        return [
          `${c.entreprise} apporte elle-même ${eur(p.autofinance)}, la part que la banque ne finance pas. La première échéance vaut ${eur(p.premiereAC)} en amortissement constant, ${eur(p.a)} en échéances constantes, face à une limite de ${eur(p.limite)}.`,
        ];
      },
    },
    {
      id: "le-pret-au-curseur",
      type: "curseur",
      titre: "Le prêt que la limite permet",
      notions: ["loan_schedule"],
      question: (c) => {
        const p = deuxiemePret(c);
        return `En amortissement constant, faites varier le montant emprunté, de ${eur(Math.round(p.montant / 2))} à ${eur(p.montant)}. Une droite donne la limite de la trésorerie, ${eur(p.limite)} ; l'autre, la première échéance de ce prêt. Placez le curseur sur le plus gros prêt que la limite permet, puis validez.`;
      },
      grandeur: () => ({ libelle: "Montant emprunté", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => {
        const p = deuxiemePret(c);
        return { attendu: p.pretMaximal, min: Math.round(p.montant / 2), max: p.montant };
      },
      zones: ["Dans la limite", "Au-delà de la limite"],
      rates: () => ({
        dessous: "La limite permet encore d'emprunter plus : cherchez le plus gros prêt.",
        dessus: "À ce montant, la première échéance dépasse déjà la limite de la trésorerie.",
      }),
      montrer: "Montrer le prêt",
      lecture: (c, k) => {
        const p = deuxiemePret(c);
        return [
          { libelle: "Capital remboursé à chaque échéance", montant: auCentime(k / p.n) },
          { libelle: "Intérêts de la première échéance", montant: auCentime(k * p.i) },
          { libelle: "Première échéance", montant: auCentime(p.premiereDe(k)), fort: true },
          { libelle: "Part de l'équipement à payer sur la trésorerie", montant: auCentime(c.immobilisation.ht - k) },
        ];
      },
      droites: (c) => {
        const p = deuxiemePret(c);
        return { produit: () => p.limite, cout: (k) => p.premiereDe(k), libelles: ["Limite de la trésorerie", "Première échéance en amortissement constant"] };
      },
      explication: (c) => {
        const p = deuxiemePret(c);
        return [
          `En amortissement constant, la limite ne permet d'emprunter que ${eur(p.pretMaximal)} : il faudrait payer ${eur(p.autofinanceEnPlus)} de plus sur la trésorerie, tout de suite, pour tenir la limite. Le prêt de ${eur(p.montant)} dépasse la limite à ses ${qte(p.auDessus)} premières échéances.`,
        ];
      },
    },
    {
      id: "le-cout-des-deux-formules",
      type: "montants",
      titre: "Le coût des deux formules",
      notions: ["loan_schedule"],
      question: () => "Sur toute la durée du prêt, calculez le coût du crédit dans chaque formule, puis ce que les échéances constantes coûtent de plus.",
      champs: (c) => {
        const p = deuxiemePret(c);
        return [
          {
            libelle: "Coût du crédit en amortissement constant",
            attendu: p.coutAC,
            tolerance: 0.1,
            calcul: `${qte(p.n)} × (${eur(p.ac[0]!.interets)} + ${eur(p.ac[p.n - 1]!.interets)}) ÷ 2 = ${eur(p.coutACParLaFormule)}${p.coutACParLaFormule === p.coutAC ? "" : ` ; le tableau, chaque intérêt arrondi au centime, donne ${eur(p.coutAC)}`}`,
          },
          {
            libelle: "Coût du crédit en échéances constantes",
            attendu: p.coutEC,
            tolerance: 0.2,
            calcul: `${qte(p.n)} × ${eur(p.a)} − ${eur(p.montant)} = ${eur(p.nFoisAMoinsC)} ; le tableau, dont la dernière échéance solde les centimes, donne ${eur(p.coutEC)}`,
          },
          { libelle: "Supplément des échéances constantes", attendu: p.supplement, tolerance: 0.25, calcul: `${eur(p.coutEC)} − ${eur(p.coutAC)} = ${eur(p.supplement)}` },
        ];
      },
      explication: (c) => {
        const p = deuxiemePret(c);
        return [`Les échéances constantes coûtent ${eur(p.supplement)} d'intérêts de plus sur ${qte(p.annees)} ans : la dette baisse moins vite au début.`];
      },
    },
    {
      id: "la-formule-qui-tient",
      type: "choix",
      titre: "La formule qui tient la limite",
      notions: ["loan_schedule"],
      question: (c) => `La trésorerie ${dE(c.entreprise)} ne peut consacrer au prêt plus de ${eur(deuxiemePret(c).limite)} par trimestre. Quelle formule signer ?`,
      options: (c) => {
        const p = deuxiemePret(c);
        return [
          {
            texte: `Les échéances constantes : ${eur(p.a)} par trimestre, sous la limite`,
            juste: true,
            retour: `Oui : c'est la seule formule qui tient la limite dès la première échéance. Elle coûte ${eur(p.supplement)} d'intérêts de plus : le prix d'une dette gardée plus longtemps, au même taux.`,
          },
          {
            texte: `L'amortissement constant : il coûte ${eur(p.supplement)} d'intérêts de moins sur la durée`,
            juste: false,
            retour: `Non : sa première échéance, ${eur(p.premiereAC)}, dépasse la limite de ${eur(p.limite)}. Le coût total ne sert à rien si la trésorerie ne peut pas payer les premières échéances.`,
          },
          {
            texte: "L'amortissement constant : ses échéances baissent, et passent vite sous la limite de la trésorerie",
            juste: false,
            retour: `Non : ses ${qte(p.auDessus)} premières échéances dépassent la limite. Une limite de trésorerie se tient à chaque échéance, pas en moyenne.`,
          },
        ];
      },
    },
    {
      id: "echeance-1",
      type: "ecriture",
      titre: "La première échéance constante",
      notions: ["loan_schedule"],
      evenement: (c) => `Le ${dateDe(PREMIERE_ECHEANCE)}, la banque prélève la première échéance du deuxième prêt, signé en échéances constantes : ${eur(deuxiemePret(c).a)}. Passez l'écriture.`,
      ecriture: (c) => {
        const l = deuxiemePret(c).ec[0]!;
        return {
          date: dateDe(PREMIERE_ECHEANCE),
          libelle: "Échéance n° 1 du deuxième emprunt",
          lignes: [
            { role: "le capital remboursé, qui réduit la dette", compte: "164", acceptes: ["1641"], sens: "debit", montant: l.amortissement, indice: "l'échéance moins les intérêts" },
            { role: "les intérêts du trimestre", compte: "6611", acceptes: ["661"], sens: "debit", montant: l.interets, indice: "le capital emprunté, au taux du trimestre" },
            { role: "le prélèvement sur le compte en banque", compte: "512", sens: "credit", montant: l.echeance, indice: "l'échéance constante" },
          ],
        };
      },
      indices: () => [
        "Deux lignes au débit : la dette qui baisse (classe 1) et la charge d'intérêts (classe 6). L'échéance constante n'est pas une charge entière.",
        "Les intérêts portent sur le capital dû avant l'échéance ; le capital remboursé, c'est ce qui reste de l'échéance.",
      ],
      explication: (c) => {
        const l = deuxiemePret(c).ec[0]!;
        return [`Sur ${eur(l.echeance)} prélevés, ${eur(l.interets)} d'intérêts et ${eur(l.amortissement)} de capital : la dette du deuxième prêt passe à ${eur(l.capitalFin)}.`];
      },
      vue: "bilan-et-resultat",
    },
    {
      id: "les-interets-courus",
      type: "montants",
      titre: "Les intérêts courus au 31 décembre",
      notions: ["loan_schedule", "income_statement"],
      question: () => "Au 31 décembre, l'exercice se clôt. Calculez les intérêts de la prochaine échéance, les jours qui en tombent dans l'exercice, les intérêts courus, puis toute la charge d'intérêts de ce prêt sur l'exercice.",
      champs: (c) => {
        const p = deuxiemePret(c);
        const k = p.courus;
        const s = k.echeanceSuivante!;
        return [
          { libelle: `Intérêts de l'échéance du ${dateDe(s.date)}`, attendu: s.interets, calcul: `${eur(s.capitalDebut)} restant dus × ${pct(p.i)} = ${eur(s.interets)}` },
          { libelle: "Jours courus dans l'exercice", attendu: k.jours, calcul: `du ${dateDe(k.depuis!)} au 31 décembre, jours compris, en mois de ${qte(JOURS_DU_MOIS)} jours : ${qte(k.jours)} jours sur ${qte(k.joursDeLaPeriode)}` },
          { libelle: "Intérêts courus au 31 décembre", attendu: k.montant, calcul: `${eur(s.interets)} × ${qte(k.jours)} ÷ ${qte(k.joursDeLaPeriode)} = ${eur(k.montant)}` },
          { libelle: "Charge d'intérêts de l'exercice", attendu: p.clotureEC.chargeDInterets, calcul: `${eur(p.clotureEC.interetsPayes)} payés + ${eur(k.montant)} courus = ${eur(p.clotureEC.chargeDInterets)}` },
        ];
      },
      explication: (c) => {
        const p = deuxiemePret(c);
        return [
          `${eur(p.courus.montant)} d'intérêts sont nés en décembre et ne seront payés que le ${dateDe(p.courus.echeanceSuivante!.date)} : ils appartiennent à l'exercice (6611 au débit, 1688 au crédit). Le prêt coûte donc ${eur(p.clotureEC.chargeDInterets)} à cet exercice.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      notions: ["loan_schedule", "income_statement"],
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const p = deuxiemePret(c);
        const premiere = p.ec[0]!.interets;
        return [
          {
            texte: `Échéances constantes de ${eur(p.a)} ; ${eur(p.clotureEC.chargeDInterets)} d'intérêts sur l'exercice`,
            juste: true,
            retour: `Oui : la seule formule sous la limite de ${eur(p.limite)}. L'exercice porte l'échéance du ${dateDe(PREMIERE_ECHEANCE)}, ${eur(premiere)} d'intérêts, et ${eur(p.courus.montant)} d'intérêts courus. Sur toute la durée, elle coûtera ${eur(p.supplement)} de plus que l'amortissement constant.`,
          },
          {
            texte: `Amortissement constant, ${eur(p.premiereAC)} la première échéance ; ${eur(p.clotureAC.chargeDInterets)} d'intérêts sur l'exercice`,
            juste: false,
            retour: `Non : la première échéance dépasse la limite de ${eur(p.limite)}. Les échéances constantes la tiennent, pour ${eur(p.clotureEC.chargeDInterets)} d'intérêts sur l'exercice.`,
          },
          {
            texte: `Échéances constantes de ${eur(p.a)} ; ${eur(premiere)} d'intérêts sur l'exercice, ceux de l'échéance de décembre`,
            juste: false,
            retour: `Non : c'est oublier les intérêts courus depuis le ${dateDe(PREMIERE_ECHEANCE)}, ${eur(p.courus.montant)}, qui appartiennent à l'exercice même si la banque ne les prélève qu'en mars.`,
          },
          {
            texte: `Échéances constantes de ${eur(p.a)} ; ${eur(auCentime(premiere + p.courus.echeanceSuivante!.interets))} d'intérêts sur l'exercice, l'échéance de mars comprise`,
            juste: false,
            retour: `Non : l'échéance de mars paie un trimestre dont ${qte(p.courus.jours)} jours seulement sont dans l'exercice. Seuls ${eur(p.courus.montant)} s'y rattachent.`,
          },
        ];
      },
    },
  ],
};
