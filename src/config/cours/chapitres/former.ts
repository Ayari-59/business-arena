import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import type { Cas } from "../cas";
import { BUDGET_DE_FORMATION_EN_ECHELLES, rejouerLAnnee, vendues } from "../ressources-humaines";
import type { Chapitre } from "../types";
import { recrutement } from "./recruter";


/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
/**
 * CHAPITRE : FORMER POUR ÊTRE PLUS EFFICACE (Bac STMG, ressources humaines, palier 1).
 *
 * La formation coûte tout de suite et rapporte ensuite : dans l'arène, elle élève la
 * productivité de l'équipe dès le trimestre suivant, et ce gain reste. Le chapitre mesure la
 * capacité qu'elle fait gagner et ce qu'elle coûte par unité de capacité, puis le compare à une
 * embauche, l'autre façon d'obtenir plus de travail ; l'arène rejoue l'année formée.
 *
 * Ce que rapporte un euro de formation est celui du scénario (`hr.trainingSensitivity`,
 * `hr.trainingScale`, `hr.maxProductivity`), joué par le moteur (src/engine/hr) ; le budget
 * rejoué est posé dans ressources-humaines.ts (BUDGET_DE_FORMATION_EN_ECHELLES) ; l'embauche
 * comparée est celle du chapitre « Recruter ».
 */

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const somme = (xs: number[]) => xs.reduce((t, x) => t + x, 0);

/** La formation au premier trimestre, son gain, son coût, et l'embauche à laquelle la comparer. */
export function formation(c: Cas) {
  const hr = scenarioByCode(c.code).scenario.hr!;
  const budget = hr.trainingScale * BUDGET_DE_FORMATION_EN_ECHELLES;
  const base = rejouerLAnnee(c.code, "base", () => undefined);
  const formee = rejouerLAnnee(c.code, "formation", (t) => (t === 1 ? { trainingBudget: budget } : undefined));
  const trimestresFormes = formee.length - 1;
  const capaciteAvant = Math.round(base[1]!.production.laborCapacity);
  const capaciteApres = Math.round(formee[1]!.production.laborCapacity);
  const capaciteGagnee = capaciteApres - capaciteAvant;
  const coutParUnite = auCentime(budget / (capaciteGagnee * trimestresFormes));
  const e = recrutement(c);
  const capaciteDeLEmbauche = e.capaciteApres - e.capaciteAvant;
  const coutParUniteEmbauche = auCentime(e.coutDeLEmbauche / (capaciteDeLEmbauche * e.trimestresAvecLui));
  const venduesEnPlus = Math.round(somme(formee.map(vendues)) - somme(base.map(vendues)));
  const resultatAvant = Math.round(somme(base.map((r) => r.incomeStatement.operatingIncome)));
  const resultatApres = Math.round(somme(formee.map((r) => r.incomeStatement.operatingIncome)));
  return {
    budget,
    trimestresFormes,
    capaciteAvant,
    capaciteApres,
    capaciteGagnee,
    coutParUnite,
    coutDeLEmbauche: e.coutDeLEmbauche,
    trimestresDeLEmbauche: e.trimestresAvecLui,
    capaciteDeLEmbauche,
    coutParUniteEmbauche,
    formerCouteMoins: coutParUnite < coutParUniteEmbauche,
    venduesEnPlus,
    resultatAvant,
    resultatApres,
    ecartDeResultat: resultatApres - resultatAvant,
  };
}

export const FORMER: Chapitre = {
  code: "former",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [
    "STMG Thème 1 · De l'individu à l'acteur",
    "STMG Thème 1 · Les compétences au service de l'organisation et l'organisation au service du développement des compétences",
  ],
  titre: "Former pour être plus efficace",
  accroche:
    "La formation coûte tout de suite et rapporte ensuite, trimestre après trimestre. Ce qu'elle fait gagner, ce que coûte chaque unité de capacité gagnée, et la comparaison avec une embauche.",
  objectifs: [
    "Mesurer la capacité qu'une formation fait gagner",
    "Calculer le coût d'une unité de capacité gagnée",
    "Comparer former et recruter pour obtenir plus de travail",
    "Expliquer pourquoi une formation ne paie que si le travail manque",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Investir dans les compétences",
      notions: ["training", "productivity"],
      texte: (c) => {
        const f = formation(c);
        return [
          `${c.entreprise} peut consacrer ${eur(f.budget)} à former son équipe au premier trimestre. La dépense tombe tout de suite ; l'effet vient au trimestre suivant : des salariés mieux formés font plus dans le même temps.`,
          "Dans l'arène comme dans la réalité, ce gain reste tant que les salariés restent, et les premiers euros rapportent le plus : une formation de plus apporte de moins en moins.",
        ];
      },
      tableau: (c) => {
        const f = formation(c);
        return {
          titre: "La formation, rejouée dans l'arène",
          colonnes: ["Sans", "Avec"],
          lignes: [
            { libelle: "Budget de formation", valeurs: [eur(0), eur(f.budget)] },
            { libelle: `Capacité de l'équipe par trimestre, à partir du deuxième (${c.unites})`, valeurs: [qte(f.capaciteAvant), qte(f.capaciteApres)] },
            { libelle: "Trimestres où le gain joue, dans l'année", valeurs: ["", String(f.trimestresFormes)] },
          ],
        };
      },
      repere: () => "Coût d'une unité de capacité = dépense ÷ (capacité gagnée par trimestre × trimestres où elle joue).",
    },
    {
      id: "gain",
      type: "montants",
      titre: "Ce que rapporte la formation",
      notions: ["training", "productivity"],
      question: () => `Calculez la capacité gagnée par trimestre, puis le coût d'une unité de capacité gagnée sur l'année (budget ÷ (capacité gagnée × trimestres où elle joue)), au centime.`,
      champs: (c) => {
        const f = formation(c);
        return [
          { libelle: `Capacité gagnée par trimestre (${c.unites})`, attendu: f.capaciteGagnee, calcul: `${qte(f.capaciteApres)} − ${qte(f.capaciteAvant)} = ${qte(f.capaciteGagnee)}`, tolerance: 1 },
          { libelle: "Coût d'une unité de capacité", attendu: f.coutParUnite, calcul: `${eur(f.budget)} ÷ (${qte(f.capaciteGagnee)} × ${f.trimestresFormes}) = ${eur(f.coutParUnite)}`, tolerance: 0.05 },
        ];
      },
      explication: (c) => {
        const f = formation(c);
        return [`Chaque unité de capacité gagnée sur l'année coûte ${eur(f.coutParUnite)} en formation. Et le gain ne s'arrête pas avec l'année : tant que l'équipe reste, il continue de jouer.`];
      },
    },
    {
      id: "comparer",
      type: "montants",
      titre: "Former ou recruter",
      notions: ["training", "payroll"],
      tableau: (c) => {
        const f = formation(c);
        return {
          titre: "Deux façons d'obtenir plus de travail, sur l'année",
          colonnes: ["Former", "Recruter"],
          lignes: [
            { libelle: "Ce que cela coûte", valeurs: [eur(f.budget), eur(f.coutDeLEmbauche)] },
            { libelle: `Capacité gagnée par trimestre (${c.unites})`, valeurs: [qte(f.capaciteGagnee), qte(f.capaciteDeLEmbauche)] },
            { libelle: "Trimestres où le gain joue", valeurs: [String(f.trimestresFormes), String(f.trimestresDeLEmbauche)] },
          ],
        };
      },
      question: () => "Calculez le coût d'une unité de capacité gagnée en recrutant (coût de l'embauche ÷ (capacité gagnée × trimestres)), au centime.",
      champs: (c) => {
        const f = formation(c);
        return [
          { libelle: "Coût d'une unité de capacité, en recrutant", attendu: f.coutParUniteEmbauche, calcul: `${eur(f.coutDeLEmbauche)} ÷ (${qte(f.capaciteDeLEmbauche)} × ${f.trimestresDeLEmbauche}) = ${eur(f.coutParUniteEmbauche)}`, tolerance: 0.05 },
        ];
      },
      explication: (c) => {
        const f = formation(c);
        return [
          f.formerCouteMoins
            ? `Former coûte ${eur(f.coutParUnite)} par unité de capacité, recruter ${eur(f.coutParUniteEmbauche)} : la formation est la façon la moins chère d'obtenir du travail en plus. Mais elle en apporte moins : ${qte(f.capaciteGagnee)} ${c.unites} par trimestre, contre ${qte(f.capaciteDeLEmbauche)} pour une embauche.`
            : `Recruter coûte ${eur(f.coutParUniteEmbauche)} par unité de capacité, former ${eur(f.coutParUnite)} : ici, l'embauche donne le travail en plus au meilleur prix, et en apporte davantage.`,
        ];
      },
    },
    {
      id: "verdict",
      type: "choix",
      titre: "La formation s'est-elle payée ?",
      notions: ["training", "capacity"],
      question: (c) => {
        const f = formation(c);
        return `Avec la formation, l'arène vend ${qte(f.venduesEnPlus)} ${c.unites} de plus sur l'année, et le résultat de l'activité ${dE(c.entreprise)} passe de ${eur(f.resultatAvant)} à ${eur(f.resultatApres)}. Que conclure ?`;
      },
      options: (c) => {
        const f = formation(c);
        const paye = f.ecartDeResultat > 0;
        return [
          {
            texte: "Elle se paie : le travail manquait, et la capacité gagnée a fait vendre",
            juste: paye,
            retour: paye
              ? `Oui : le résultat monte de ${eur(f.ecartDeResultat)}. L'équipe limitait les ventes, et la formation les a débloquées pour bien moins cher qu'une embauche.`
              : `Non : le résultat baisse de ${eur(-f.ecartDeResultat)}.`,
          },
          {
            texte: "Elle ne se paie pas cette année : le travail ne manquait pas",
            juste: !paye,
            retour: !paye
              ? `Oui : la capacité gagnée n'a ${f.venduesEnPlus > 0 ? "presque rien" : "rien"} fait vendre de plus, et la formation a coûté ${eur(f.budget)}. Former reste un investissement : il paiera le jour où la demande dépassera ce que l'équipe sait faire.`
              : `Non : le résultat monte de ${eur(f.ecartDeResultat)}.`,
          },
          {
            texte: "Une formation se paie toujours, puisque l'équipe devient plus productive",
            juste: false,
            retour: "Non : une équipe plus productive ne rapporte que si ce surcroît de travail trouve des clients. Sinon, la formation est une dépense de plus, en attendant qu'il serve.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["training"],
      texte: (c) => {
        const f = formation(c);
        return [
          `Chez ${c.entreprise}, ${eur(f.budget)} de formation font gagner ${qte(f.capaciteGagnee)} ${c.unites} de capacité par trimestre, soit ${eur(f.coutParUnite)} par unité sur l'année, contre ${eur(f.coutParUniteEmbauche)} en recrutant.`,
          "Former et recruter répondent à la même question : obtenir plus de travail. La formation coûte souvent moins par heure gagnée, et garde les salariés motivés ; le recrutement en apporte davantage d'un coup. L'une comme l'autre ne paie que si le travail manquait.",
        ];
      },
      repere: () => "La formation élève la productivité, durablement et à rendements décroissants ; elle ne rapporte que si le travail gagné trouve des clients.",
    },
  ],
};
