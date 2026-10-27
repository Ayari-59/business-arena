import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { scenarioByCode } from "../../../scenarios/registry";
import type { Cas } from "../../cas";
import { PRODUIRE_BIEN, anneeAuBudget, anneeDeQualite, budgetDuSecteur, qualite, type AnneeDeQualite } from "../../chapitres/produire-bien";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « PRODUIRE BIEN : LA QUALITÉ ET CE QU'ELLE COÛTE » : LA MOITIÉ DU
 * BUDGET QUALITÉ (bac STMG, management, palier 1).
 *
 * Le directeur financier propose de mettre chaque trimestre la moitié du budget qualité qu'engage
 * la gestion neutre du secteur (`budgetDuSecteur`) : là où le bon gestionnaire met ce budget (le
 * bistrot, le transporteur), c'est le couper en deux ; ailleurs, c'est en engager un petit, là où il
 * n'y en a aucun. La part est l'hypothèse du cas, nommée ci-dessous ; le budget se pose en valeur
 * absolue à chaque trimestre (`anneeAuBudget`, clé « produire-bien:budget-qualite-… »), sans rien
 * multiplier de la décision reçue. L'élève recalcule la qualité perçue, lit l'année rejouée face à
 * l'année du cours, et répond. Le verdict se calcule sur l'écart de résultat de l'activité.
 */

/** La part du budget du secteur que propose le directeur financier (hypothèse du cas). */
export const PART_DU_BUDGET_DU_SECTEUR = 0.5;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export type ReponseALaMoitie = "passer-a-la-moitie" | "ne-rien-changer";

/** Le cas : le budget proposé, la qualité perçue au premier trimestre, l'année rejouée et le verdict. */
export function moitieDuBudget(c: Cas) {
  const q = qualite(c);
  const s = scenarioByCode(c.code).scenario;
  const secteur = budgetDuSecteur(c.code);
  const budget = Math.round(secteur * PART_DU_BUDGET_DU_SECTEUR);
  const moitie = anneeDeQualite(c.code, anneeAuBudget(c.code, budget));
  const produiteAuPremier = moitie.trimestres[0]!.produite;
  const percueAuPremier = auDixieme((q.garde * q.percueDeDepart + (100 - q.garde) * produiteAuPremier) / 100);
  const ventesEnPlus = moitie.ventes - q.annee.ventes;
  const ecartDeResultat = moitie.resultat - q.annee.resultat;
  const reponse: ReponseALaMoitie = ecartDeResultat > 0 ? "passer-a-la-moitie" : "ne-rien-changer";
  return {
    q,
    secteur,
    budget,
    moitie,
    produiteAuPremier,
    percueAuPremier,
    ventesEnPlus,
    ecartDeResultat,
    reponse,
    rebutsComptes: s.qualityCosts !== undefined,
  };
}

function tableauDesDeuxAnnees(c: Cas): TableauDeDonnees {
  const k = moitieDuBudget(c);
  const ligne = (libelle: string, f: (a: AnneeDeQualite) => string) => ({ libelle, valeurs: [f(k.q.annee), f(k.moitie)] });
  return {
    titre: `L'année ${dE(c.entreprise)}, rejouée à ${eur(k.budget)} de budget qualité par trimestre`,
    colonnes: ["L'année du cours", "À la moitié du budget du secteur"],
    lignes: [
      ligne("Budget qualité de l'année", (a) => eur(a.budget)),
      ligne("Qualité perçue en fin d'année (indice)", (a) => qte(a.trimestres.at(-1)!.percue)),
      ligne(`Ventes de l'année (${c.unites})`, (a) => qte(a.ventes)),
      ...(k.rebutsComptes ? [ligne("Coût de la non-qualité de l'année", (a) => eur(a.nonQualite))] : []),
      ligne("Résultat de l'activité", (a) => eur(a.resultat)),
    ],
  };
}

export const LA_MOITIE_DU_BUDGET_QUALITE: Situation = {
  code: "la-moitie-du-budget-qualite",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: [PRODUIRE_BIEN.code],
  commanditaire: "Le directeur financier",
  titre: "La moitié du budget qualité",
  accroche:
    "Le directeur financier veut la moitié du budget qualité du secteur, chaque trimestre. Calculer la qualité perçue qu'elle donne, lire l'année rejouée par l'arène, et lui répondre.",
  objectifs: [
    "Calculer un budget qualité de l'année et la qualité perçue qu'il donne",
    "Comparer deux années sur les ventes et le résultat",
    "Répondre au directeur financier avec les chiffres",
  ],
  libre: false,
  entreprises: PRODUIRE_BIEN.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du directeur financier",
      texte: (c) => {
        const k = moitieDuBudget(c);
        return [
          k.q.metUnBudget
            ? `« Nous mettons ${eur(k.q.gestionnaire)} par trimestre dans la qualité, autant que la gestion ordinaire du secteur. Coupons-le en deux : ${eur(k.budget)} par trimestre suffiront. Dites-moi si l'année aurait été meilleure. »`
            : `« Nous ne mettons rien dans la qualité, quand le secteur y met ${eur(k.secteur)} par trimestre. Mettons-en la moitié, ${eur(k.budget)} par trimestre : un petit budget, pour une qualité un peu meilleure. Dites-moi si l'année aurait été meilleure. »`,
          "Pas de cours cette fois. L'arène a rejoué l'année avec ce budget à chaque trimestre, avec les mêmes concurrents et la même façon de gérer.",
        ];
      },
      repere: () => "À rendre : le budget de l'année et la qualité perçue qu'il donne, ce qu'il change aux ventes et au résultat, et votre réponse.",
    },
    {
      id: "la-qualite",
      type: "montants",
      titre: "Le budget et la qualité perçue",
      notions: ["demand_market_share"],
      question: (c) => {
        const k = moitieDuBudget(c);
        return `Avec ${eur(k.budget)} par trimestre, la qualité produite du 1er trimestre vaut ${qte(k.produiteAuPremier)} (indice 100 : la qualité ordinaire du secteur). La qualité perçue partait de ${qte(k.q.percueDeDepart)} ; chaque trimestre, elle garde ${k.q.garde} % de sa valeur d'avant et prend ${100 - k.q.garde} % de la qualité produite. Calculez le budget qualité de l'année, puis la qualité perçue à la fin du 1er trimestre (au dixième).`;
      },
      champs: (c) => {
        const k = moitieDuBudget(c);
        return [
          { libelle: "Budget qualité de l'année, à la moitié", attendu: k.moitie.budget, calcul: `4 × ${eur(k.budget)} = ${eur(k.moitie.budget)}`, tolerance: 0 },
          {
            libelle: "Qualité perçue à la fin du 1er trimestre (indice)",
            attendu: k.percueAuPremier,
            calcul: `(${k.q.garde} × ${qte(k.q.percueDeDepart)} + ${100 - k.q.garde} × ${qte(k.produiteAuPremier)}) ÷ 100 = ${qte(k.percueAuPremier)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = moitieDuBudget(c);
        return [`La qualité perçue monte lentement : ${qte(k.percueAuPremier)} au premier trimestre, ${qte(k.moitie.trimestres.at(-1)!.percue)} en fin d'année.`];
      },
    },
    {
      id: "l-annee-rejouee",
      type: "montants",
      titre: "L'année rejouée à la moitié du budget",
      notions: ["demand_market_share", "income_statement"],
      tableau: tableauDesDeuxAnnees,
      question: () =>
        "D'après le tableau, calculez les ventes en plus à la moitié du budget du secteur (négatives si elles baissent), puis l'écart de résultat de l'activité (à la moitié moins l'année du cours).",
      champs: (c) => {
        const k = moitieDuBudget(c);
        return [
          { libelle: "Ventes en plus à la moitié du budget", attendu: k.ventesEnPlus, calcul: `${qte(k.moitie.ventes)} − ${qte(k.q.annee.ventes)} = ${qte(k.ventesEnPlus)}`, tolerance: 0 },
          {
            libelle: "Écart de résultat, à la moitié moins l'année du cours",
            attendu: k.ecartDeResultat,
            calcul: `${eur(k.moitie.resultat)} − ${retranche(k.q.annee.resultat)} = ${eur(k.ecartDeResultat)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = moitieDuBudget(c);
        return [
          `À la moitié du budget du secteur, ${c.entreprise} ${k.ventesEnPlus >= 0 ? `vend ${qte(k.ventesEnPlus)} ${c.unites} de plus` : `vend ${qte(-k.ventesEnPlus)} ${c.unites} de moins`} sur l'année, et son résultat de l'activité ${
            k.ecartDeResultat > 0 ? `monte de ${eur(k.ecartDeResultat)}` : `baisse de ${eur(-k.ecartDeResultat)}`
          }.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur financier",
      question: () => "Que répondez-vous au directeur financier ?",
      options: (c) => {
        const k = moitieDuBudget(c);
        const budgets = `${eur(k.moitie.budget)} de budget qualité sur l'année, contre ${eur(k.q.annee.budget)} dans l'année du cours`;
        const faits = `${budgets} ; les ventes ${k.ventesEnPlus >= 0 ? `gagnent ${qte(k.ventesEnPlus)}` : `perdent ${qte(-k.ventesEnPlus)}`} ${c.unites}, et le résultat ${
          k.ecartDeResultat > 0 ? `monte de ${eur(k.ecartDeResultat)}` : `baisse de ${eur(-k.ecartDeResultat)}`
        }.`;
        const passer = k.reponse === "passer-a-la-moitie";
        return [
          {
            texte: "Passer à la moitié : le résultat de l'année monte",
            juste: passer,
            retour: `${passer ? "Oui" : "Non"} : ${faits}`,
          },
          {
            texte: k.q.metUnBudget ? "Garder le budget du secteur : la moitié fait baisser le résultat" : "Ne rien changer : même la moitié fait baisser le résultat",
            juste: !passer,
            retour: `${passer ? "Non" : "Oui"} : ${faits}`,
          },
          {
            texte: "Doubler plutôt le budget : plus de qualité fait toujours vendre assez pour se payer",
            juste: false,
            retour: `Non : une qualité de plus ne se paie que si la marge des ventes qu'elle fait gagner couvre son coût, et rien ne dit que ce soit toujours le cas. L'arène a rejoué la moitié du budget : ${faits}`,
          },
        ];
      },
    },
  ],
};
