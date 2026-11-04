import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { CAPACITE_DE_REMBOURSEMENT_MAXIMALE, INDEPENDANCE_MINIMALE } from "../../financement";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE, exerciceDe } from "../../monde/comptes-du-lycee";
import { auCentime } from "../../monde/amortissement";
import { LIGNE_SEMI_AUTOMATIQUE, structureFinanciere } from "../../monde/financement-du-lycee";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA CAPACITÉ DE REMBOURSEMENT ET LES LIMITES DE L'ANALYSE
 * FONCTIONNELLE » : LA BANQUE TESTE UNE ANNÉE DIFFICILE (Bac STMG, gestion et finance, palier 1).
 *
 * NOVA demande à sa banque de prêter tout le prix de la ligne semi-automatique de sa gamme
 * (monde/projets-et-financement.ts). La banque refait ses deux ratios, mais sur une année difficile :
 * 10 % d'enceintes vendues en moins, et une année d'intérêts du nouveau prêt. L'élève refait seul
 * les calculs du chapitre (la capacité d'autofinancement, la capacité de remboursement,
 * l'indépendance financière) et découvre qu'une règle tient et l'autre non : il dit à la banque
 * ce qu'elle peut prêter.
 *
 * Le cas est neuf par sa question : le chapitre juge NOVA au 31 décembre et fait varier un
 * emprunt ; le cas part d'une demande précise et d'un scénario de la banque, et rend un avis
 * chiffré. Les chiffres sont ceux de `structureFinanciere` (monde/financement-du-lycee.ts).
 */

/** LE SCÉNARIO DE PRUDENCE DE LA BANQUE (hypothèse du cours) : 10 % d'enceintes vendues en moins l'année du prêt. */
export const BAISSE_DU_SCENARIO = 0.1;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auCentieme = (x: number) => Math.round(x * 100) / 100;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const ans = (x: number) => `${qte(x)} ${x < 2 ? "an" : "ans"}`;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function anneeDifficile(c: Pick<Cas, "code">) {
  const f = exerciceDe(c.code);
  const pret = LIGNE_SEMI_AUTOMATIQUE.montant;
  const avant = structureFinanciere(f);
  const s = structureFinanciere(f, { emprunt: pret, baisseDesVentes: BAISSE_DU_SCENARIO });
  const capacite = auCentieme(s.capaciteDeRemboursement);
  const independance = auDixieme(s.independance * 100);
  const capaciteTient = capacite <= CAPACITE_DE_REMBOURSEMENT_MAXIMALE;
  const independanceTient = s.independance >= INDEPENDANCE_MINIMALE;
  return {
    entreprise: f.entreprise,
    equipement: LIGNE_SEMI_AUTOMATIQUE.libelle,
    pret,
    taux: f.pret.tauxAnnuel,
    enceintesAvant: avant.quantite,
    enceintes: s.quantite,
    resultatNet: s.k.resultatNet,
    dotations: s.k.dotations,
    caf: s.caf,
    dettesAvant: avant.dettesFinancieres,
    dettes: s.dettesFinancieres,
    capitauxPropres: s.capitauxPropres,
    ressourcesAvant: avant.ressourcesDurables,
    ressources: s.ressourcesDurables,
    capacite,
    independance,
    capaciteTient,
    independanceTient,
    /** Le prêt le plus élevé que l'indépendance financière accepte. */
    pretPossible: auCentime(avant.capitauxPropres / INDEPENDANCE_MINIMALE - avant.ressourcesDurables),
  };
}

export const LA_BANQUE_TESTE_UNE_ANNEE_DIFFICILE: Situation = {
  code: "la-banque-teste-une-annee-difficile",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [],
  reprend: ["capacite-de-remboursement"],
  commanditaire: "La banque",
  titre: "La banque teste une année difficile",
  accroche:
    "NOVA demande un prêt pour toute sa nouvelle ligne. La banque refait ses deux ratios, mais sur une année où les ventes baisseraient : tiennent-ils encore ?",
  objectifs: [
    "Calculer la capacité d'autofinancement d'une année difficile",
    "Calculer la capacité de remboursement et l'indépendance financière après un prêt",
    "Calculer le prêt le plus élevé que l'indépendance financière accepte",
    "Rédiger un avis chiffré à la banque",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "le cas reprend le premier exercice de NOVA et la ligne de sa gamme dans la simulation du cours, ceux du chapitre ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la banque",
      texte: (c) => {
        const r = anneeDifficile(c);
        return [
          `« Vous nous demandez ${eur(r.pret)} pour ${r.equipement}, au taux de ${pct(r.taux * 100)}. Avant de répondre, nous testons une année difficile : ${pct(BAISSE_DU_SCENARIO * 100)} d'enceintes vendues en moins, et une année d'intérêts du nouveau prêt. Notre service a recalculé le compte de résultat de cette année-là. Refaites nos deux ratios et dites-nous ce que nous pouvons vous prêter. »`,
          "Pas de cours cette fois : vous avez les chiffres, et les calculs sont ceux du chapitre. À vous de les enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = anneeDifficile(c);
        return {
          titre: `L'année difficile · ${r.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Enceintes vendues (au lieu de l'année écoulée)", valeurs: [`${qte(r.enceintes)} (${qte(r.enceintesAvant)})`] },
            { libelle: "Résultat net de l'année difficile", valeurs: [eur(r.resultatNet)] },
            { libelle: "Dotations", valeurs: [eur(r.dotations)] },
            { libelle: "Emprunt actuel (capital restant dû)", valeurs: [eur(r.dettesAvant)] },
            { libelle: "Prêt demandé", valeurs: [eur(r.pret)] },
            { libelle: "Capitaux propres", valeurs: [eur(r.capitauxPropres)] },
            { libelle: "Ressources durables, avant le prêt", valeurs: [eur(r.ressourcesAvant)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la capacité d'autofinancement de l'année difficile, la capacité de remboursement et l'indépendance financière après le prêt, le prêt le plus élevé que l'indépendance accepte, et votre avis.",
    },
    {
      id: "la-caf",
      type: "montants",
      titre: "La capacité d'autofinancement",
      notions: ["income_statement"],
      question: () => "Calculez la capacité d'autofinancement de l'année difficile.",
      champs: (c) => {
        const r = anneeDifficile(c);
        return [{ libelle: "Capacité d'autofinancement", attendu: r.caf, calcul: `${eur(r.resultatNet)} + ${eur(r.dotations)} = ${eur(r.caf)}`, tolerance: 1 }];
      },
      explication: (c) => {
        const r = anneeDifficile(c);
        return [`Moins d'enceintes vendues et des intérêts en plus : l'activité ne dégagerait plus que ${eur(r.caf)}.`];
      },
    },
    {
      id: "les-ratios",
      type: "montants",
      titre: "Les deux ratios après le prêt",
      notions: ["balance_sheet", "loan_schedule"],
      question: () =>
        "Calculez les dettes financières et les ressources durables après le prêt, puis la capacité de remboursement (au centième) et l'indépendance financière (en pourcentage, au dixième).",
      champs: (c) => {
        const r = anneeDifficile(c);
        return [
          { libelle: "Dettes financières après le prêt", attendu: r.dettes, calcul: `${eur(r.dettesAvant)} + ${eur(r.pret)} = ${eur(r.dettes)}` },
          { libelle: "Ressources durables après le prêt", attendu: r.ressources, calcul: `${eur(r.ressourcesAvant)} + ${eur(r.pret)} = ${eur(r.ressources)}` },
          { libelle: "Capacité de remboursement (années)", attendu: r.capacite, calcul: `${eur(r.dettes)} ÷ ${eur(r.caf)} = ${qte(r.capacite)}`, tolerance: 0.01 },
          { libelle: "Indépendance financière (%)", attendu: r.independance, calcul: `${eur(r.capitauxPropres)} ÷ ${eur(r.ressources)} = ${pct(r.independance)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const r = anneeDifficile(c);
        return [
          `Capacité de remboursement : ${ans(r.capacite)}, ${r.capaciteTient ? "sous" : "au-delà de"} la règle des ${qte(CAPACITE_DE_REMBOURSEMENT_MAXIMALE)} ans. Indépendance financière : ${pct(r.independance)}, ${r.independanceTient ? "au-dessus" : "en dessous"} de la moitié.`,
        ];
      },
    },
    {
      id: "le-pret-possible",
      type: "montants",
      titre: "Le prêt que l'indépendance accepte",
      notions: ["balance_sheet"],
      question: () =>
        "Pour garder la moitié des ressources durables en capitaux propres, les ressources durables ne peuvent pas dépasser le double des capitaux propres. Calculez le prêt le plus élevé que l'indépendance financière accepte, à l'euro près.",
      champs: (c) => {
        const r = anneeDifficile(c);
        return [{ libelle: "Prêt le plus élevé", attendu: r.pretPossible, calcul: `${qte(1 / INDEPENDANCE_MINIMALE)} × ${eur(r.capitauxPropres)} − ${eur(r.ressourcesAvant)} = ${eur(r.pretPossible)}`, tolerance: 1 }];
      },
      explication: (c) => {
        const r = anneeDifficile(c);
        return [`Au-delà de ${eur(r.pretPossible)}, les prêteurs financeraient plus que les associés. Le reste du prix de la ligne devrait venir d'ailleurs : un apport, une subvention, un compte courant bloqué.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre avis à la banque",
      question: () => "Quelle phrase envoyez-vous à la banque ?",
      options: (c) => {
        const r = anneeDifficile(c);
        const juste = r.capaciteTient && !r.independanceTient;
        return [
          {
            texte: `Prêtez ${eur(r.pretPossible)} au plus : le reste viendra d'ailleurs`,
            juste,
            retour: juste
              ? `Oui : même dans l'année difficile, la dette se rembourserait en ${ans(r.capacite)}. Mais avec ${eur(r.pret)}, l'indépendance tomberait à ${pct(r.independance)}. Jusqu'à ${eur(r.pretPossible)}, elle tient la moitié.`
              : "Non : ce n'est pas l'indépendance qui pose problème ici.",
          },
          {
            texte: `Prêtez les ${eur(r.pret)} : la capacité de remboursement reste sous ${qte(CAPACITE_DE_REMBOURSEMENT_MAXIMALE)} ans même dans l'année difficile`,
            juste: r.capaciteTient && r.independanceTient,
            retour: r.independanceTient
              ? `Oui : les deux règles tiennent, même dans l'année difficile.`
              : `Non : la capacité de remboursement tient (${ans(r.capacite)}), mais l'indépendance tombe à ${pct(r.independance)}. La banque juge les deux.`,
          },
          {
            texte: "Ne prêtez rien : une année difficile nous empêcherait de rembourser",
            juste: !r.capaciteTient,
            retour: r.capaciteTient
              ? `Non : même avec ${pct(BAISSE_DU_SCENARIO * 100)} de ventes en moins, la dette se rembourserait en ${ans(r.capacite)} de capacité d'autofinancement.`
              : "Oui : dans l'année difficile, la capacité de remboursement dépasse la règle des banques.",
          },
        ];
      },
    },
  ],
};
