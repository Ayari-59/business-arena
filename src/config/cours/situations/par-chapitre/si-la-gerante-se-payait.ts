import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { CelluleACompleter } from "../../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_CONCORDANCE, concordanceDeNova } from "../../chapitres/la-concordance-des-resultats";
import { impotSurLesSocietes } from "../../monde/cloture";
import { REMUNERATION_DE_LA_GERANTE } from "../../monde/comptabilite-de-gestion";
import { EXERCICE_DE_NOVA } from "../../monde/exercice-de-nova";
import type { Situation } from "../types";
import { auCentime } from "../../monde/amortissement";

/**
 * CAS PRATIQUE DU CHAPITRE « LA CONCORDANCE DES RÉSULTATS » : SI LA GÉRANTE SE PAYAIT (contrôle de
 * gestion, palier 4).
 *
 * La gérante envisage de se verser ce que la comptabilité de gestion compte pour son travail. Sur les
 * chiffres de l'exercice N, l'expert-comptable demande ce que deviendraient le résultat des comptes,
 * l'impôt et le tableau de passage. L'élève voit la charge supplétive devenir une charge réelle : la
 * comptabilité générale la porte, l'impôt baisse avec le résultat (au barème de la fiche, 15 % puis
 * 25 %), et la comptabilité de gestion, qui la comptait déjà, ne bouge pas. Le tableau de passage
 * perd sa ligne de charges supplétives, et l'impôt n'y est plus le même.
 *
 * HYPOTHÈSE DU CAS : le salaire, charges comprises, est exactement la charge supplétive (4 200 € par
 * mois) ; il est déductible du résultat fiscal ; rien d'autre de l'exercice ne change.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const enSuite = (x: number) => `${x < 0 ? "−" : "+"} ${eur(Math.abs(x))}`;

const donnee = (valeur: number): CelluleACompleter => ({ valeur });
const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });

/** Les chiffres du cas : l'exercice tel qu'il a été, et l'exercice avec la paie de la gérante. */
export function siLaGeranteSePayait(c: Pick<Cas, "code">) {
  const x = concordanceDeNova(c);
  const { k } = x;
  const salaire = auCentime(12 * REMUNERATION_DE_LA_GERANTE);
  const avantImpot = auCentime(k.cg.resultatAvantImpot - salaire);
  const impot = impotSurLesSocietes(avantImpot, EXERCICE_DE_NOVA.impot);
  const net = auCentime(avantImpot - impot.impot);
  const impotDeLaFiche = k.nonIncorporees.find((n) => n.compte === "695")!.montant;
  const nonIncorporees = auCentime(-(x.totalNonIncorporees - impotDeLaFiche + impot.impot));
  const l = k.lignes;
  const lignes = [0, l.produitsNonIncorpores, nonIncorporees, l.differenceDIncorporation, l.boniDInventaire, l.evaluationDuStock, l.arrondis];
  return { x, salaire, avantImpot, impot, net, impotDeLaFiche, nonIncorporees, lignes, retrouve: auCentime(k.exercice.resultatAnalytique + lignes.reduce((t, v) => t + v, 0)), baisseDuNet: auCentime(k.resultatGeneral - net) };
}

export const SI_LA_GERANTE_SE_PAYAIT: Situation = {
  code: "si-la-gerante-se-payait",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["la-concordance-des-resultats"],
  commanditaire: "L'expert-comptable",
  titre: "Si la gérante se payait",
  accroche: "La gérante pense se verser ce que la gestion compte pour son travail. Que deviendraient le résultat des comptes, l'impôt et le tableau de passage ?",
  objectifs: [
    "Distinguer une charge supplétive d'une charge réelle",
    "Recalculer un résultat de l'exercice et son impôt quand une charge change",
    "Refaire le tableau de passage d'un résultat à l'autre",
    "Rendre à l'expert-comptable une réponse chiffrée",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_CONCORDANCE,
    pourquoi: "ce cas reprend le chapitre « La concordance des résultats », qui se calcule sur l'exercice N de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de l'expert-comptable",
      texte: () => [
        `« La gérante pense se verser un salaire, ${eur(REMUNERATION_DE_LA_GERANTE)} par mois charges comprises, ce que votre comptabilité de gestion compte déjà pour son travail. Sur les chiffres de l'exercice N, que seraient devenus le résultat des comptes, l'impôt et votre tableau de passage ? »`,
        "Pas de cours cette fois : vous avez les chiffres de la clôture, le barème de l'impôt et le tableau de passage de l'exercice. Le salaire serait déductible ; rien d'autre ne changerait.",
      ],
      tableau: (c) => {
        const { x } = siLaGeranteSePayait(c);
        const { k } = x;
        const b = EXERCICE_DE_NOVA.impot;
        return {
          titre: `L'exercice N de ${x.f.entreprise}, tel qu'il a été`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Résultat avant impôt", valeurs: [eur(k.cg.resultatAvantImpot)] },
            { libelle: `Impôt sur les sociétés (${b.tauxReduit * 100} % jusqu'à ${eur(b.plafondDuTauxReduit)}, ${b.tauxNormal * 100} % au-delà, à l'euro)`, valeurs: [eur(k.cg.impot.impot)] },
            { libelle: "Résultat net", valeurs: [eur(k.resultatGeneral)] },
            { libelle: "Résultat analytique de l'exercice", valeurs: [eur(k.exercice.resultatAnalytique)] },
            { libelle: "Charges supplétives (le travail de la gérante)", valeurs: [eur(k.lignes.supletives)] },
            { libelle: "Charges non incorporées, impôt compris", valeurs: [eur(x.totalNonIncorporees)] },
            { libelle: "Produits non incorporés", valeurs: [eur(k.lignes.produitsNonIncorpores)] },
            { libelle: "Différence d'incorporation, boni, évaluation du stock et arrondis", valeurs: [eur(auCentime(k.lignes.differenceDIncorporation + k.lignes.boniDInventaire + k.lignes.evaluationDuStock + k.lignes.arrondis))] },
          ],
        };
      },
      repere: () => "À rendre : le résultat avant impôt avec le salaire, l'impôt, le résultat net, le nouveau tableau de passage, et votre réponse.",
    },
    {
      id: "le-resultat-avec-le-salaire",
      type: "montants",
      titre: "Le résultat avec le salaire",
      notions: ["income_statement"],
      question: () => "Avec le salaire de la gérante sur les 12 mois, que deviennent le résultat avant impôt, l'impôt sur les sociétés et le résultat net de l'exercice ?",
      champs: (c) => {
        const n = siLaGeranteSePayait(c);
        const b = EXERCICE_DE_NOVA.impot;
        return [
          { libelle: "Résultat avant impôt, avec le salaire", attendu: n.avantImpot, calcul: `${eur(n.x.k.cg.resultatAvantImpot)} − 12 × ${eur(REMUNERATION_DE_LA_GERANTE)} = ${eur(n.avantImpot)}` },
          {
            libelle: "Impôt sur les sociétés",
            attendu: n.impot.impot,
            tolerance: 1,
            calcul: `${b.tauxReduit * 100} % × ${eur(n.impot.baseAuTauxReduit)} + ${b.tauxNormal * 100} % × ${eur(n.impot.baseAuTauxNormal)} = ${eur(n.impot.aTauxReduit)} + ${eur(n.impot.aTauxNormal)} = ${eur(n.impot.exact)}, soit ${eur(n.impot.impot)} à l'euro`,
          },
          { libelle: "Résultat net, avec le salaire", attendu: n.net, tolerance: 1, calcul: `${eur(n.avantImpot)} − ${eur(n.impot.impot)} = ${eur(n.net)}` },
        ];
      },
      explication: (c) => {
        const n = siLaGeranteSePayait(c);
        return [
          `Le résultat net baisse de ${eur(n.baisseDuNet)}, et non des ${eur(n.salaire)} du salaire : l'impôt en reprend ${eur(auCentime(n.impotDeLaFiche - n.impot.impot))}. Une charge réelle et déductible coûte moins que son montant.`,
        ];
      },
    },
    {
      id: "le-nouveau-tableau-de-passage",
      type: "a-completer",
      titre: "Le nouveau tableau de passage",
      notions: ["full_unit_cost", "income_statement"],
      question: () =>
        "Refaites le tableau de passage de l'exercice avec le salaire de la gérante. Le résultat analytique ne change pas : la gestion comptait déjà ce travail. Écrivez chaque différence avec son signe.",
      grille: (c) => {
        const n = siLaGeranteSePayait(c);
        const { k } = n.x;
        const l = k.lignes;
        return {
          titre: "Du résultat analytique au résultat des comptes, avec le salaire de la gérante",
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Résultat analytique de l'exercice", cellules: [donnee(k.exercice.resultatAnalytique)] },
            { libelle: "Charges supplétives", cellules: [aSaisir(0, "le travail de la gérante est payé : il n'est plus supplétif, 0 €", { indice: "ce que seule la gestion compte, maintenant que la gérante est payée" })] },
            { libelle: "Produits non incorporés", cellules: [aSaisir(l.produitsNonIncorpores, `inchangés : ${eur(l.produitsNonIncorpores)}`)] },
            { libelle: "Charges non incorporées", cellules: [aSaisir(n.nonIncorporees, `${eur(n.x.totalNonIncorporees)} − ${eur(n.impotDeLaFiche)} + ${eur(n.impot.impot)} = ${eur(-n.nonIncorporees)}, qui se retranchent : ${eur(n.nonIncorporees)}`, { indice: "les mêmes charges, avec le nouvel impôt" })] },
            { libelle: "Différence d'incorporation de l'usure", cellules: [aSaisir(l.differenceDIncorporation, `inchangée : ${eur(l.differenceDIncorporation)}`)] },
            { libelle: "Boni d'inventaire", cellules: [aSaisir(l.boniDInventaire, `inchangé : ${eur(l.boniDInventaire)}`)] },
            { libelle: "Écart d'évaluation du stock final", cellules: [aSaisir(l.evaluationDuStock, `inchangé : ${eur(l.evaluationDuStock)}`)] },
            { libelle: "Différences d'arrondi", cellules: [aSaisir(l.arrondis, `inchangées : ${eur(l.arrondis)}`)] },
            {
              libelle: "Résultat de la comptabilité générale",
              fort: true,
              totalDe: { plus: [0, 1, 2, 3, 4, 5, 6, 7] },
              cellules: [aSaisir(n.retrouve, `${eur(k.exercice.resultatAnalytique)} ${n.lignes.map(enSuite).join(" ")} = ${eur(n.retrouve)}`)],
            },
          ],
        };
      },
      explication: (c) => {
        const n = siLaGeranteSePayait(c);
        return [`Le tableau retrouve ${eur(n.net)}, le résultat net avec le salaire : la ligne des charges supplétives s'est vidée, celle des charges non incorporées a perdu ce que l'impôt baisse.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à l'expert-comptable",
      notions: ["full_unit_cost", "income_statement"],
      question: () => "Que répondez-vous à l'expert-comptable ?",
      options: (c) => {
        const n = siLaGeranteSePayait(c);
        return [
          {
            texte: `Les comptes perdraient ${eur(n.baisseDuNet)}, la gestion rien`,
            juste: true,
            retour: `Oui. La gestion comptait déjà ce travail : son résultat reste ${eur(n.x.k.exercice.resultatAnalytique)}. Les comptes portent maintenant le salaire, ${eur(n.salaire)}, dont l'impôt reprend ${eur(auCentime(n.impotDeLaFiche - n.impot.impot))} ; le résultat net tombe à ${eur(n.net)}.`,
          },
          { texte: `Les deux résultats perdraient ${eur(n.salaire)}, le salaire de 12 mois`, juste: false, retour: "Non : la gestion comptait déjà ce travail, en charge supplétive. Le salaire ne change pas son coût, il ne change que les comptes." },
          { texte: `Les comptes perdraient ${eur(n.salaire)}, et la gestion ne bougerait pas`, juste: false, retour: `Non : le salaire est déductible, l'impôt baisse. Le résultat net ne perd que ${eur(n.baisseDuNet)}.` },
          { texte: `La gestion perdrait ${eur(n.salaire)}, les comptes ${eur(n.baisseDuNet)}`, juste: false, retour: "Non : la gestion ne perd rien, le travail de la gérante y était déjà compté. Seuls les comptes découvrent la charge." },
        ];
      },
    },
  ],
};
