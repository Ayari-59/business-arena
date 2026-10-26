import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { formation } from "../../chapitres/former";
import { rejouerLAnnee, vendues } from "../../ressources-humaines";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « FORMER POUR ÊTRE PLUS EFFICACE » : DOUBLER LE BUDGET DE FORMATION
 * (Bac STMG, ressources humaines, palier 1).
 *
 * La direction a retenu du chapitre que la formation coûte peu par unité de capacité gagnée. Elle
 * propose de doubler le budget du premier trimestre : deux fois plus de formation, deux fois plus
 * de capacité ? L'élève refait les calculs du chapitre pour les deux budgets (la capacité gagnée,
 * le coût d'une unité de capacité), puis pour la seconde moitié seule, et lit ce que l'arène en
 * fait aux ventes et au résultat.
 *
 * Le cas est neuf par sa question : le chapitre mesure ce que rapporte un budget, le cas mesure ce
 * que rapporte un budget de plus. Le budget de référence est celui du chapitre (`formation`) ; le
 * budget doublé est la même année rejouée (`rejouerLAnnee`), qui joue les rendements décroissants
 * du moteur (src/engine/hr : le gain suit le logarithme du budget, plafonné).
 */

/**
 * Le budget que propose la direction, en multiples du budget de référence du chapitre : le
 * double. Assez pour que les rendements décroissants se voient, sans approcher le plafond de
 * productivité d'aucune entreprise du cours (partie d'une productivité de 1, l'équipe gagne au
 * plus sensibilité × ln 3, moins de 0,09, et aucun plafond n'est sous 1,22). C'est la question
 * même du cas : son titre et ses phrases (« doubler », « la seconde moitié ») le disent, et
 * changeraient avec lui.
 */
export const MULTIPLE_DU_BUDGET = 2;

const qte = (n: number) => n.toLocaleString("fr-FR");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const somme = (xs: number[]) => xs.reduce((t, x) => t + x, 0);
/** Un montant qu'on retranche : entre parenthèses quand il est négatif. */
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));

export type Verdict = "doubler" | "garder" | "aucun";

/** Les deux budgets, le second moins le premier, et ce que l'arène en fait. */
export function budgetDouble(c: Cas) {
  const f = formation(c);
  const budget = f.budget * MULTIPLE_DU_BUDGET;
  const base = rejouerLAnnee(c.code, "base", () => undefined);
  const doublee = rejouerLAnnee(c.code, "formation-doublee", (t) => (t === 1 ? { trainingBudget: budget } : undefined));
  const capaciteApres = Math.round(doublee[1]!.production.laborCapacity);
  const capaciteGagnee = capaciteApres - f.capaciteAvant;
  const coutParUnite = auCentime(budget / (capaciteGagnee * f.trimestresFormes));
  // La seconde moitié du budget : ce qu'elle coûte, et la capacité qu'elle ajoute à la première.
  const budgetEnPlus = budget - f.budget;
  const capaciteEnPlus = capaciteGagnee - f.capaciteGagnee;
  const coutParUniteEnPlus = auCentime(budgetEnPlus / (capaciteEnPlus * f.trimestresFormes));
  const venduesEnPlus = Math.round(somme(doublee.map(vendues)) - somme(base.map(vendues)));
  const resultatApres = Math.round(somme(doublee.map((r) => r.incomeStatement.operatingIncome)));
  const ecartDeResultat = resultatApres - f.resultatAvant;
  const verdict: Verdict = ecartDeResultat > f.ecartDeResultat ? "doubler" : f.ecartDeResultat > 0 ? "garder" : "aucun";
  return {
    f,
    budget,
    capaciteApres,
    capaciteGagnee,
    coutParUnite,
    budgetEnPlus,
    capaciteEnPlus,
    coutParUniteEnPlus,
    doubleLaCapacite: capaciteGagnee >= f.capaciteGagnee * MULTIPLE_DU_BUDGET,
    venduesEnPlus,
    resultatApres,
    ecartDeResultat,
    ecartEntreLesBudgets: ecartDeResultat - f.ecartDeResultat,
    verdict,
  };
}

export const DOUBLER_LE_BUDGET_DE_FORMATION: Situation = {
  code: "doubler-le-budget-de-formation",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [],
  reprend: ["former"],
  commanditaire: "La direction",
  titre: "Doubler le budget de formation",
  accroche:
    "La direction veut doubler le budget de formation : deux fois plus de formation, deux fois plus de capacité ? Ce que rapporte la seconde moitié du budget, et ce que l'arène en fait.",
  objectifs: [
    "Calculer la capacité gagnée et son coût par unité, pour deux budgets",
    "Calculer ce que rapporte un budget de formation en plus",
    "Lire ce que le budget doublé change aux ventes et au résultat",
    "Répondre à la direction, chiffre à l'appui",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => {
        const d = budgetDouble(c);
        return [
          `« ${d.f.formerCouteMoins ? "Former nous coûte moins cher que recruter pour obtenir du travail en plus." : "Former nous donne du travail en plus sans embaucher."} Alors pourquoi ${c.entreprise} se contenterait de ${eur(d.f.budget)} ? Je propose ${eur(d.budget)} au premier trimestre. Dites-moi si deux fois plus de formation donne deux fois plus de capacité, ce que coûte la capacité gagnée en plus, et s'il faut doubler. »`,
          "Pas de cours cette fois : vous avez la capacité de l'équipe avec chaque budget, et les calculs sont ceux du chapitre. L'arène a rejoué l'année avec le budget doublé.",
        ];
      },
      tableau: (c) => {
        const d = budgetDouble(c);
        return {
          titre: `La formation ${dE(c.entreprise)}, selon le budget`,
          colonnes: ["Sans", "Référence", "Doublé"],
          lignes: [
            { libelle: "Budget de formation au premier trimestre", valeurs: [eur(0), eur(d.f.budget), eur(d.budget)] },
            { libelle: `Capacité de l'équipe par trimestre, à partir du deuxième (${c.unites})`, valeurs: [qte(d.f.capaciteAvant), qte(d.f.capaciteApres), qte(d.capaciteApres)] },
            { libelle: "Trimestres où le gain joue, dans l'année", valeurs: ["", String(d.f.trimestresFormes), String(d.f.trimestresFormes)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la capacité gagnée et le coût d'une unité de capacité pour chaque budget, ce que rapporte la seconde moitié du budget, ce que l'arène en fait, et votre réponse.",
    },
    {
      id: "deux-budgets",
      type: "montants",
      titre: "Ce que gagne chaque budget",
      notions: ["training", "productivity"],
      question: () =>
        "Pour chaque budget, calculez la capacité gagnée par trimestre, puis le coût d'une unité de capacité gagnée sur l'année (budget ÷ (capacité gagnée × trimestres où elle joue)), au centime.",
      champs: (c) => {
        const d = budgetDouble(c);
        return [
          { libelle: `Capacité gagnée, budget de référence (${c.unites})`, attendu: d.f.capaciteGagnee, tolerance: 1, calcul: `${qte(d.f.capaciteApres)} − ${qte(d.f.capaciteAvant)} = ${qte(d.f.capaciteGagnee)}` },
          { libelle: "Coût d'une unité de capacité, budget de référence", attendu: d.f.coutParUnite, tolerance: 0.05, calcul: `${eur(d.f.budget)} ÷ (${qte(d.f.capaciteGagnee)} × ${d.f.trimestresFormes}) = ${eur(d.f.coutParUnite)}` },
          { libelle: `Capacité gagnée, budget doublé (${c.unites})`, attendu: d.capaciteGagnee, tolerance: 1, calcul: `${qte(d.capaciteApres)} − ${qte(d.f.capaciteAvant)} = ${qte(d.capaciteGagnee)}` },
          { libelle: "Coût d'une unité de capacité, budget doublé", attendu: d.coutParUnite, tolerance: 0.05, calcul: `${eur(d.budget)} ÷ (${qte(d.capaciteGagnee)} × ${d.f.trimestresFormes}) = ${eur(d.coutParUnite)}` },
        ];
      },
      explication: (c) => {
        const d = budgetDouble(c);
        return [
          d.doubleLaCapacite
            ? `Le budget doublé fait gagner ${qte(d.capaciteGagnee)} ${c.unites} par trimestre, au moins deux fois le gain du budget de référence (${qte(d.f.capaciteGagnee)}).`
            : `Deux fois le budget ne fait pas gagner deux fois la capacité : ${qte(d.capaciteGagnee)} ${c.unites} par trimestre, contre ${qte(d.f.capaciteGagnee)} avec le budget de référence. Chaque unité de capacité coûte donc plus cher : ${eur(d.coutParUnite)} au lieu de ${eur(d.f.coutParUnite)}.`,
        ];
      },
    },
    {
      id: "seconde-moitie",
      type: "montants",
      titre: "Ce que rapporte la seconde moitié",
      notions: ["training", "productivity"],
      question: () =>
        "La seconde moitié du budget, c'est le budget doublé moins le budget de référence. Calculez la capacité qu'elle ajoute par trimestre, puis le coût d'une unité de cette capacité en plus, au centime.",
      champs: (c) => {
        const d = budgetDouble(c);
        return [
          { libelle: `Capacité ajoutée par la seconde moitié (${c.unites})`, attendu: d.capaciteEnPlus, tolerance: 1, calcul: `${qte(d.capaciteGagnee)} − ${qte(d.f.capaciteGagnee)} = ${qte(d.capaciteEnPlus)}` },
          { libelle: "Coût d'une unité de capacité en plus", attendu: d.coutParUniteEnPlus, tolerance: 0.1, calcul: `(${eur(d.budget)} − ${eur(d.f.budget)}) ÷ (${qte(d.capaciteEnPlus)} × ${d.f.trimestresFormes}) = ${eur(d.coutParUniteEnPlus)}` },
        ];
      },
      explication: (c) => {
        const d = budgetDouble(c);
        return [
          `Les premiers ${eur(d.f.budget)} font gagner ${qte(d.f.capaciteGagnee)} ${c.unites} par trimestre ; les ${eur(d.budgetEnPlus)} suivants n'en ajoutent que ${qte(d.capaciteEnPlus)}, à ${eur(d.coutParUniteEnPlus)} l'unité. C'est ce que le chapitre appelait des rendements décroissants : chaque euro de formation en plus rapporte moins que le précédent.`,
        ];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: "L'arène rejoue l'année",
      notions: ["training", "capacity"],
      tableau: (c) => {
        const d = budgetDouble(c);
        return {
          titre: "L'année jouée, avec chaque budget",
          colonnes: ["Sans", "Référence", "Doublé"],
          lignes: [
            { libelle: `Ventes en plus dans l'année (${c.unites})`, valeurs: ["", qte(d.f.venduesEnPlus), qte(d.venduesEnPlus)] },
            { libelle: "Résultat de l'activité sur l'année", valeurs: [eur(d.f.resultatAvant), eur(d.f.resultatApres), eur(d.resultatApres)] },
          ],
        };
      },
      question: () =>
        "Calculez l'écart de résultat de l'activité avec le budget doublé, par rapport à l'année sans formation, puis ce que la seconde moitié du budget change au résultat (résultat avec le budget doublé moins résultat avec le budget de référence).",
      champs: (c) => {
        const d = budgetDouble(c);
        return [
          { libelle: "Écart de résultat, budget doublé", attendu: d.ecartDeResultat, tolerance: 1, calcul: `${eur(d.resultatApres)} − ${retranche(d.f.resultatAvant)} = ${eur(d.ecartDeResultat)}` },
          { libelle: "Ce que la seconde moitié change au résultat", attendu: d.ecartEntreLesBudgets, tolerance: 1, calcul: `${eur(d.resultatApres)} − ${retranche(d.f.resultatApres)} = ${eur(d.ecartEntreLesBudgets)}` },
        ];
      },
      explication: (c) => {
        const d = budgetDouble(c);
        return [
          d.venduesEnPlus > 0 || d.f.venduesEnPlus > 0
            ? `Le budget doublé fait vendre ${qte(d.venduesEnPlus)} ${c.unites} de plus dans l'année, contre ${qte(d.f.venduesEnPlus)} avec le budget de référence : le travail manquait, et la capacité gagnée a trouvé des clients.`
            : `Avec l'un ou l'autre budget, l'arène ne vend rien de plus : le travail ne manquait pas. Chaque euro de formation est une dépense de plus cette année, et la seconde moitié en coûte ${eur(-d.ecartEntreLesBudgets)} au résultat.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const d = budgetDouble(c);
        return [
          {
            texte: "Doublons : la seconde moitié fait encore vendre de quoi se payer",
            juste: d.verdict === "doubler",
            retour:
              d.verdict === "doubler"
                ? `Oui : la seconde moitié ajoute ${qte(d.capaciteEnPlus)} ${c.unites} de capacité par trimestre, à ${eur(d.coutParUniteEnPlus)} l'unité contre ${eur(d.f.coutParUnite)} pour la première, mais le travail manquait : le résultat gagne encore ${eur(d.ecartEntreLesBudgets)}.`
                : `Non : la seconde moitié coûte ${eur(-d.ecartEntreLesBudgets)} au résultat. Elle ajoute de la capacité, ${d.venduesEnPlus > 0 ? "mais pas assez de ventes pour se payer" : "mais aucune vente"}.`,
          },
          {
            texte: "Gardons le budget de référence : il se paie, la seconde moitié non",
            juste: d.verdict === "garder",
            retour:
              d.verdict === "garder"
                ? `Oui : le budget de référence fait monter le résultat de ${eur(d.f.ecartDeResultat)}, et la seconde moitié lui retire ${eur(-d.ecartEntreLesBudgets)}. Ses unités de capacité coûtent ${eur(d.coutParUniteEnPlus)}, contre ${eur(d.f.coutParUnite)} pour les premières.`
                : d.verdict === "doubler"
                  ? "Non : ici, la seconde moitié se paie aussi."
                  : `Non : même le budget de référence ne se paie pas cette année, il fait baisser le résultat de ${eur(-d.f.ecartDeResultat)}.`,
          },
          {
            texte: "Ne doublons pas : aucun des deux budgets ne se paie cette année",
            juste: d.verdict === "aucun",
            retour:
              d.verdict === "aucun"
                ? `Oui : le budget de référence fait baisser le résultat de ${eur(-d.f.ecartDeResultat)}, le budget doublé de ${eur(-d.ecartDeResultat)}${d.venduesEnPlus === 0 && d.f.venduesEnPlus === 0 ? " : l'équipe gagne de la capacité, mais le travail ne manquait pas" : ""}. Former reste un investissement, à proportionner à ce que la demande réclame.`
                : `Non : avec le budget de référence, le résultat monte de ${eur(d.f.ecartDeResultat)} : la formation fait vendre.`,
          },
          {
            texte: "Doublons : deux fois le budget donne deux fois la capacité gagnée",
            juste: false,
            retour: d.doubleLaCapacite
              ? `Non : ici, la capacité gagnée double bien (${qte(d.f.capaciteGagnee)} puis ${qte(d.capaciteGagnee)} ${c.unites}), mais une capacité de plus ne vaut que les ventes qu'elle fait.`
              : `Non : le budget doublé fait gagner ${qte(d.capaciteGagnee)} ${c.unites} par trimestre, pas ${qte(d.f.capaciteGagnee * MULTIPLE_DU_BUDGET)}. Les rendements de la formation décroissent : la seconde moitié rapporte moins que la première.`,
          },
        ];
      },
    },
  ],
};
