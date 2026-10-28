import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_L_ACQUISITION, acquisitionDuCabinet } from "../../chapitres/cout-d-acquisition";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE COÛT D'ACQUISITION » : COUPER LE BUDGET DE CAMPAGNE ? (BTS NDRC,
 * palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : les chiffres sont ceux du cabinet ATLAS CONSEIL (fiche
 * monde/atlas-conseil.ts), lus par `acquisitionDuCabinet`, le modèle du chapitre (la courbe figée de
 * la campagne digitale, l'entonnoir de N et la valeur vie d'un compte).
 *
 * La directrice financière veut couper de moitié le budget de la campagne digitale : une économie
 * visible, et un coût d'acquisition moyen qui baisse. L'élève refait seul le chemin du chapitre, dans
 * l'autre sens : les comptes et le coût moyen aux deux budgets, les comptes que la coupe fait perdre
 * et ce que coûtait chacun (le coût du compte en plus, vu d'en haut), au curseur la valeur d'un compte
 * sous laquelle la coupe paierait (à rebours), puis le croisement de trois mesures (la première année,
 * la valeur vie simple, la valeur vie actualisée) et la phrase qu'il rend.
 *
 * LE JUGEMENT : le coût moyen baisse (10 000 € au lieu de 12 000 €), et c'est un piège ; la coupe ne
 * paierait que si un compte valait moins de 15 000 €, moins que sa seule marge de la première année.
 * Elle fait perdre 55 200 € de valeur vie nette, 36 000 € actualisée, et déjà 4 800 € sur la première
 * année.
 */

/**
 * Le budget envisagé, en part du budget de N : la moitié. C'est le premier palier de la courbe de la
 * campagne, et la coupe qu'une direction financière propose d'ordinaire quand elle cherche une
 * économie visible.
 */
export const BUDGET_ENVISAGE = 0.5;

/** Les bornes du curseur de la valeur d'un compte, en milliers d'euros. */
export const VALEUR_DU_CURSEUR_DU_CAS = { min: 0, max: 40 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** La campagne au budget de N et au budget coupé, et ce qui les sépare. */
export function coupeDuBudget(c: Pick<Cas, "code">) {
  const x = acquisitionDuCabinet(c);
  const budget = x.budgetDeN;
  const budgetCoupe = auCentime(budget * BUDGET_ENVISAGE);
  const palier = (b: number) => {
    const p = x.paliers.find((y) => y.budget === b);
    if (!p) throw new Error(`Pas de palier à ${b} €`);
    return p;
  };
  const aujourdhui = palier(budget);
  const coupe = palier(budgetCoupe);
  const economie = auCentime(budget - budgetCoupe);
  const comptesPerdus = auCentime(aujourdhui.comptes - coupe.comptes);
  const valeurPerdue = auCentime(comptesPerdus * x.v.simple);
  return {
    x,
    aujourdhui,
    coupe,
    economie,
    comptesPerdus,
    coutDUnComptePerdu: auCentime(economie / comptesPerdus),
    valeurPerdue,
    netPerdu: auCentime(valeurPerdue - economie),
    margeDeLaPremiereAnneePerdue: auCentime(comptesPerdus * x.v.m.marge),
    effetSurLaPremiereAnnee: auCentime(economie - comptesPerdus * x.v.m.marge),
    netPerduActualise: auCentime(comptesPerdus * x.v.actualisee - economie),
    /** La plus forte valeur d'un compte, en milliers d'euros, sous laquelle la coupe paierait. */
    valeurSousLaquelleCouper: Math.floor(economie / comptesPerdus / 1_000 + 1e-9),
    /** Le verdict : la coupe fait-elle perdre de la valeur vie ? */
    verdict: valeurPerdue > economie ? ("garder" as const) : ("couper" as const),
  };
}

export const COUPER_LE_BUDGET_DE_CAMPAGNE: Situation = {
  code: "couper-le-budget-de-campagne",
  parcours: "ndrc",
  palier: 3,
  blocs: [],
  reprend: ["cout-d-acquisition"],
  commanditaire: "La directrice financière",
  titre: "Couper le budget de campagne ?",
  accroche:
    "La directrice financière veut couper de moitié le budget de la campagne digitale : une économie visible, et un coût d'acquisition qui baisse. Ce que le cabinet y gagnerait, et ce qu'il y perdrait.",
  objectifs: [
    "Calculer les comptes attendus et le coût d'acquisition moyen à deux budgets",
    "Calculer ce que coûtaient les comptes que la coupe ferait perdre",
    "Retrouver à rebours la valeur d'un compte sous laquelle la coupe paierait",
    "Croiser la première année, la valeur vie simple et la valeur vie actualisée, et rédiger une réponse chiffrée",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_ACQUISITION,
    pourquoi: "ce cas suit la campagne d'un cabinet qui vend ses journées à des entreprises : il se joue chez ATLAS CONSEIL, le cabinet du chapitre, sur son année N figée par la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la directrice financière",
      texte: (c) => {
        const r = coupeDuBudget(c);
        return [
          `« Les comptes sont serrés. Je propose de couper de moitié la campagne digitale : ${eur(r.economie)} d'économie dès cette année, c'est concret. Et un compte gagné nous coûterait moins cher qu'aujourd'hui. Avant que je tranche, dites-moi ce que le cabinet y perdrait, et si l'économie en vaut la peine. »`,
          "Pas de cours cette fois : vous avez la courbe de la campagne, son entonnoir et ce que vaut un compte, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = coupeDuBudget(c);
        const x = r.x;
        const d = x.digital;
        return {
          titre: `La campagne digitale · ${x.f.entreprise}`,
          colonnes: ["Budget de N", "Moitié du budget"],
          lignes: [
            { libelle: "Budget de la campagne", valeurs: [eur(r.aujourdhui.budget), eur(r.coupe.budget)] },
            { libelle: "Contacts amenés", valeurs: [qte(r.aujourdhui.contacts), qte(r.coupe.contacts)] },
            { libelle: "Contacts pour un rendez-vous", valeurs: [qte(d.contacts / d.rendezVous), qte(d.contacts / d.rendezVous)] },
            { libelle: "Rendez-vous pour un devis", valeurs: [qte(d.rendezVous / d.devis), qte(d.rendezVous / d.devis)] },
            { libelle: "Devis pour un contrat", valeurs: [qte(d.devis / d.contrats), qte(d.devis / d.contrats)] },
            { libelle: "Marge annuelle d'un compte", valeurs: [eur(x.v.m.marge), eur(x.v.m.marge)] },
            { libelle: "Valeur vie d'un compte, simple", valeurs: [eur(x.v.simple), eur(x.v.simple)] },
            { libelle: "Valeur vie d'un compte, actualisée", valeurs: [eur(x.v.actualisee), eur(x.v.actualisee)] },
          ],
        };
      },
      repere: () =>
        "À rendre : les comptes et le coût d'acquisition aux deux budgets, ce que coûtaient les comptes perdus, la valeur d'un compte sous laquelle la coupe paierait, ce qu'elle fait perdre selon la mesure, et votre réponse.",
    },
    {
      id: "aujourd-hui",
      type: "montants",
      titre: "Les comptes aux deux budgets",
      notions: ["customer_acquisition_cost", "conversion_rate"],
      question: () =>
        "Calculez les comptes attendus de la campagne au budget de N, puis à la moitié du budget, au centième (ce sont des comptes attendus), et le coût d'acquisition moyen d'un compte aux deux budgets.",
      champs: (c) => {
        const r = coupeDuBudget(c);
        const d = r.x.digital;
        const chemin = (contacts: number, comptes: number) => `${qte(contacts)} ÷ ${qte(d.contacts / d.rendezVous)} ÷ ${qte(d.rendezVous / d.devis)} ÷ ${qte(d.devis / d.contrats)} = ${qte(comptes)}`;
        return [
          { libelle: "Comptes attendus au budget de N", attendu: r.aujourdhui.comptes, tolerance: 0.05, calcul: chemin(r.aujourdhui.contacts, r.aujourdhui.comptes) },
          { libelle: "Comptes attendus à la moitié du budget", attendu: r.coupe.comptes, tolerance: 0.05, calcul: chemin(r.coupe.contacts, r.coupe.comptes) },
          { libelle: "Coût d'acquisition moyen au budget de N", attendu: r.aujourdhui.cacMoyen!, calcul: `${eur(r.aujourdhui.budget)} ÷ ${qte(r.aujourdhui.comptes)} = ${eur(r.aujourdhui.cacMoyen!)}` },
          { libelle: "Coût d'acquisition moyen à la moitié du budget", attendu: r.coupe.cacMoyen!, calcul: `${eur(r.coupe.budget)} ÷ ${qte(r.coupe.comptes)} = ${eur(r.coupe.cacMoyen!)}` },
        ];
      },
      explication: (c) => {
        const r = coupeDuBudget(c);
        return [
          `La directrice a raison sur un point : à la moitié du budget, un compte coûte ${eur(r.coupe.cacMoyen!)} en moyenne au lieu de ${eur(r.aujourdhui.cacMoyen!)}. La campagne garde ses premiers contacts, les moins chers, et perd les autres. Reste à savoir ce que valaient ceux-là.`,
        ];
      },
    },
    {
      id: "la-coupe",
      type: "montants",
      titre: "Ce que la coupe ferait perdre",
      notions: ["customer_acquisition_cost", "customer_lifetime_value"],
      question: () =>
        "Calculez les comptes que la coupe ferait perdre, ce que coûtait chacun d'eux (l'économie ÷ les comptes perdus), puis la valeur vie nette que la coupe ferait perdre, à la valeur vie simple (valeur vie des comptes perdus − économie).",
      champs: (c) => {
        const r = coupeDuBudget(c);
        return [
          { libelle: "Comptes perdus", attendu: r.comptesPerdus, tolerance: 0.05, calcul: `${qte(r.aujourdhui.comptes)} − ${qte(r.coupe.comptes)} = ${qte(r.comptesPerdus)}` },
          { libelle: "Coût d'un compte perdu", attendu: r.coutDUnComptePerdu, calcul: `${eur(r.economie)} ÷ ${qte(r.comptesPerdus)} = ${eur(r.coutDUnComptePerdu)}` },
          {
            libelle: "Valeur vie nette perdue",
            attendu: r.netPerdu,
            calcul: `${qte(r.comptesPerdus)} × ${eur(r.x.v.simple)} − ${eur(r.economie)} = ${eur(r.valeurPerdue)} − ${eur(r.economie)} = ${eur(r.netPerdu)}`,
          },
        ];
      },
      explication: (c) => {
        const r = coupeDuBudget(c);
        return [
          `Chaque compte perdu coûtait ${eur(r.coutDUnComptePerdu)} : plus que la moyenne, ${eur(r.aujourdhui.cacMoyen!)}, car c'est le compte en plus de ce palier, vu d'en haut. Mais il valait ${eur(r.x.v.simple)} sur sa vie. L'économie se voit sur la ligne de la campagne ; la perte, ${eur(r.netPerdu)}, se cache dans les années à venir.`,
        ];
      },
    },
    {
      id: "le-seuil-de-la-coupe",
      type: "curseur",
      titre: "La valeur sous laquelle couper paierait",
      notions: ["customer_acquisition_cost", "customer_lifetime_value"],
      question: (c) => {
        const r = coupeDuBudget(c);
        return `La coupe économise ${eur(r.economie)} et fait perdre ${qte(r.comptesPerdus)} compte. Faites varier ce que vaut un compte, de ${qte(VALEUR_DU_CURSEUR_DU_CAS.min)} à ${qte(VALEUR_DU_CURSEUR_DU_CAS.max)} milliers d'euros. Placez le curseur sur la plus forte valeur où l'économie couvre encore ce que la coupe fait perdre, puis validez.`;
      },
      grandeur: () => ({ libelle: "Valeur d'un compte gagné", unite: "milliers d'euros" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: coupeDuBudget(c).valeurSousLaquelleCouper, min: VALEUR_DU_CURSEUR_DU_CAS.min, max: VALEUR_DU_CURSEUR_DU_CAS.max }),
      zones: ["Couper paierait", "Couper fait perdre"],
      rates: () => ({
        dessous: "À cette valeur, la coupe paie encore : cherchez la plus forte.",
        dessus: "À cette valeur, les comptes perdus valent déjà plus que l'économie.",
      }),
      montrer: "Montrer la valeur",
      lecture: (c, k) => {
        const r = coupeDuBudget(c);
        const perdue = auCentime(r.comptesPerdus * k * 1_000);
        return [
          { libelle: "Économie de la coupe", montant: r.economie },
          { libelle: "Valeur des comptes perdus", montant: perdue },
          { libelle: "Ce que la coupe rapporte ou fait perdre", montant: auCentime(r.economie - perdue), fort: true },
        ];
      },
      droites: (c) => {
        const r = coupeDuBudget(c);
        return {
          produit: () => r.economie,
          cout: (k) => r.comptesPerdus * k * 1_000,
          libelles: ["Économie de la coupe", "Valeur des comptes perdus"],
        };
      },
      explication: (c) => {
        const r = coupeDuBudget(c);
        return [
          `La coupe ne paierait que si un compte valait au plus ${eur(r.valeurSousLaquelleCouper * 1_000)} : le coût d'un compte perdu. Or un compte laisse déjà ${eur(r.x.v.m.marge)} de marge sa première année, avant même de revenir.`,
        ];
      },
    },
    {
      id: "trois-mesures",
      type: "montants",
      titre: "La coupe, selon la mesure",
      notions: ["customer_lifetime_value", "discounting", "customer_acquisition_cost"],
      question: () =>
        "La directrice objecte que la valeur vie est lointaine. Calculez la marge de la première année que la coupe ferait perdre, ce que la coupe rapporte sur cette seule année (économie − marge perdue ; négatif si elle fait perdre), puis la valeur vie nette perdue, actualisée.",
      champs: (c) => {
        const r = coupeDuBudget(c);
        return [
          { libelle: "Marge de la première année perdue", attendu: r.margeDeLaPremiereAnneePerdue, calcul: `${qte(r.comptesPerdus)} × ${eur(r.x.v.m.marge)} = ${eur(r.margeDeLaPremiereAnneePerdue)}` },
          { libelle: "Effet de la coupe sur la première année", attendu: r.effetSurLaPremiereAnnee, calcul: `${eur(r.economie)} − ${eur(r.margeDeLaPremiereAnneePerdue)} = ${eur(r.effetSurLaPremiereAnnee)}` },
          {
            libelle: "Valeur vie nette perdue, actualisée",
            attendu: r.netPerduActualise,
            calcul: `${qte(r.comptesPerdus)} × ${eur(r.x.v.actualisee)} − ${eur(r.economie)} = ${eur(r.netPerduActualise)}`,
          },
        ];
      },
      explication: (c) => {
        const r = coupeDuBudget(c);
        return [
          r.effetSurLaPremiereAnnee < 0
            ? `Même sur la seule première année, la coupe fait perdre ${eur(-r.effetSurLaPremiereAnnee)} : les comptes perdus auraient laissé ${eur(r.margeDeLaPremiereAnneePerdue)} de marge, plus que les ${eur(r.economie)} économisés.`
            : `Sur la seule première année, la coupe rapporterait ${eur(r.effetSurLaPremiereAnnee)}.`,
          `Actualisée au taux du cabinet, la perte reste de ${eur(r.netPerduActualise)}. Les trois mesures disent la même chose : la coupe détruit de la valeur. Seul le coût moyen dit le contraire, parce qu'il ne compare rien à ce que valent les comptes.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice financière",
      question: () => "Quelle phrase envoyez-vous à la directrice financière ?",
      options: (c) => {
        const r = coupeDuBudget(c);
        return [
          {
            texte: `Garder : la coupe détruit ${eur(r.netPerdu)} de valeur vie nette`,
            juste: true,
            retour: `Oui : ${qte(r.comptesPerdus)} compte perdu valait ${eur(r.valeurPerdue)} sur sa vie, pour ${eur(r.economie)} économisés. Même actualisée, la perte est de ${eur(r.netPerduActualise)}, et dès la première année de ${eur(-r.effetSurLaPremiereAnnee)}.`,
          },
          {
            texte: `Couper : un compte n'y coûterait plus que ${eur(r.coupe.cacMoyen!)}, contre ${eur(r.aujourdhui.cacMoyen!)}`,
            juste: false,
            retour: `Non : le coût moyen baisse parce que la coupe retire les comptes les plus chers à gagner, pas parce qu'elle rapporte. Ces comptes coûtaient ${eur(r.coutDUnComptePerdu)} et valaient ${eur(r.x.v.simple)}.`,
          },
          {
            texte: `Couper : l'économie de ${eur(r.economie)} est sûre, la valeur vie est lointaine`,
            juste: false,
            retour: `Non : sur la seule première année, la coupe fait déjà perdre ${eur(-r.effetSurLaPremiereAnnee)}, et actualisée, elle détruit ${eur(r.netPerduActualise)}. La valeur vie n'est pas une promesse lointaine : elle commence dès cette année.`,
          },
          {
            texte: `Couper : chaque compte perdu coûtait ${eur(r.coutDUnComptePerdu)}, plus que la moyenne`,
            juste: false,
            retour: `Non : un compte se compare à ce qu'il vaut, pas à la moyenne. Il coûtait ${eur(r.coutDUnComptePerdu)} et laissait ${eur(r.x.v.m.marge)} de marge dès sa première année.`,
          },
        ];
      },
    },
  ],
};
