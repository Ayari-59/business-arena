import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_POINT_DE_VENTE, ficheDe } from "../../chapitres/equipe-et-planning";
import { APPRENTI, SEMAINES_TRAVAILLEES, TEMPS_PARTIEL, apprentiOuTempsPartiel, coutDuRecrutement } from "../../monde/equipe-de-la-boutique";
import { SMIC_MENSUEL_BRUT } from "../../monde/ressources-humaines-de-nova";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « RECRUTER, INTÉGRER, FORMER » : UN APPRENTI OU UN TEMPS PARTIEL ? (BTS MCO,
 * palier 4).
 *
 * Après décembre, la direction de MAILLE & CO veut un poste durable pour tenir les samedis et préparer
 * un futur adjoint. Deux voies : un CDI de 24 heures, ou un apprenti en BTS MCO. L'élève chiffre le
 * coût de l'année de chacun, aide à l'embauche et tutorat compris, le ramène à l'heure passée en
 * boutique, puis répond : l'apprenti coûte moins à l'heure, sert les samedis et prépare la relève,
 * à condition de compter le temps du maître d'apprentissage et l'année où l'aide s'arrête.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours : ses chiffres sont ceux de
 * `apprentiOuTempsPartiel` (monde/equipe-de-la-boutique.ts).
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${qte(t)} %`;
const h = (x: number) => `${qte(x)} h`;

const choixDe = (c: Pick<Cas, "code">) => apprentiOuTempsPartiel(ficheDe(c));

function tableauDesDeuxVoies(c: Pick<Cas, "code">): TableauDeDonnees {
  const f = ficheDe(c);
  return {
    titre: `${f.entreprise} · deux façons de tenir les samedis`,
    colonnes: [`CDI de ${qte(TEMPS_PARTIEL.heures)} heures`, "Apprenti en BTS MCO"],
    lignes: [
      { libelle: "Salaire brut du mois", valeurs: [eur(TEMPS_PARTIEL.brutMensuel), `${pct(APPRENTI.partDuSmic * 100)} du SMIC`] },
      { libelle: "Cotisations patronales", valeurs: [pct(f.tauxPatronal * 100), pct(APPRENTI.tauxPatronal * 100)] },
      { libelle: "Aide à l'embauche", valeurs: ["aucune", `${eur(APPRENTI.aide)} la 1re année`] },
      { libelle: "Heures en boutique par semaine", valeurs: [h(TEMPS_PARTIEL.heures), h(APPRENTI.heuresEnBoutique)] },
      { libelle: "Tutorat de l'adjointe par semaine", valeurs: ["aucun", h(APPRENTI.tutorat)] },
    ],
  };
}

export const UN_APPRENTI_OU_UN_TEMPS_PARTIEL: Situation = {
  code: "un-apprenti-ou-un-temps-partiel",
  parcours: "mco",
  palier: 4,
  blocs: [],
  reprend: ["recruter-integrer-former"],
  commanditaire: "La direction",
  titre: "Un apprenti ou un temps partiel ?",
  accroche:
    "La boutique veut un poste durable pour les samedis et un futur adjoint. Un CDI de 24 heures, ou un apprenti en BTS MCO : que coûte une heure en boutique de chacun, aide et tutorat compris ?",
  objectifs: [
    "Chiffrer le coût annuel d'un apprenti, aide à l'embauche et tutorat compris",
    "Comparer deux contrats par le coût d'une heure passée en boutique",
    "Répondre à la direction en pesant le coût, la présence et la formation",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_POINT_DE_VENTE,
    pourquoi: "ce cas reprend le chapitre « Recruter, intégrer, former », qui se joue à la boutique du cours, MAILLE & CO, et à son équipe.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      tableau: tableauDesDeuxVoies,
      texte: (c) => {
        const f = ficheDe(c);
        return [
          `« Décembre est passé, mais les samedis restent justes, et l'adjointe de ${f.entreprise} partira un jour. Je veux un poste durable. Le responsable propose un CDI de ${qte(TEMPS_PARTIEL.heures)} heures ; l'adjointe, un apprenti en BTS MCO, 3 jours par semaine en boutique dont le samedi, 2 jours à l'école. »`,
          `« Comparez-les sur une année de ${qte(SEMAINES_TRAVAILLEES)} semaines travaillées, au SMIC de ${eur(SMIC_MENSUEL_BRUT)} bruts par mois. Que coûte une heure en boutique de chacun ? »`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre, à vous d'en trouver l'ordre.",
        ];
      },
      repere: () => "À rendre : le coût de l'année de chaque contrat, les heures en boutique, le coût d'une heure, et votre réponse.",
    },
    {
      id: "l-apprenti",
      type: "montants",
      titre: "Ce que coûte l'apprenti",
      notions: ["payroll", "training"],
      question: () =>
        `Calculez le salaire brut du mois de l'apprenti (au centime), son coût chargé de l'année, le coût du tutorat de l'adjointe sur l'année (${h(APPRENTI.tutorat)} par semaine), puis le coût net de l'année, aide à l'embauche déduite.`,
      champs: (c) => {
        const x = choixDe(c);
        const f = ficheDe(c);
        const taux = Math.round(coutDuRecrutement(f).tauxAdjointe * 100) / 100;
        return [
          { libelle: "Salaire brut du mois", attendu: x.brutApprenti, tolerance: 0.02, calcul: `${eur(x.smicMensuel)} × ${pct(APPRENTI.partDuSmic * 100)} = ${eur(x.brutApprenti)}` },
          { libelle: "Coût chargé de l'année", attendu: x.salaireApprenti, tolerance: 0.5, calcul: `${eur(x.brutApprenti)} × ${qte(1 + APPRENTI.tauxPatronal)} × 12 = ${eur(x.salaireApprenti)}` },
          { libelle: "Tutorat de l'année", attendu: x.tutorat, tolerance: 0.5, calcul: `${h(APPRENTI.tutorat)} × ${qte(SEMAINES_TRAVAILLEES)} × ${eur(taux)} = ${eur(x.tutorat)}` },
          { libelle: "Coût net de l'année", attendu: x.apprenti, tolerance: 1, calcul: `${eur(x.salaireApprenti)} − ${eur(APPRENTI.aide)} + ${eur(x.tutorat)} = ${eur(x.apprenti)}` },
        ];
      },
      explication: (c) => {
        const x = choixDe(c);
        return [`L'apprenti coûte ${eur(x.apprenti)} sur l'année. Le tutorat n'est pas gratuit : ${eur(x.tutorat)} d'heures de l'adjointe, qui ne vend pas pendant ce temps.`];
      },
    },
    {
      id: "l-heure-en-boutique",
      type: "montants",
      titre: "Le coût d'une heure en boutique",
      notions: ["payroll", "productivity"],
      question: () =>
        `Calculez le coût de l'année du CDI de ${qte(TEMPS_PARTIEL.heures)} heures, les heures en boutique de chacun sur ${qte(SEMAINES_TRAVAILLEES)} semaines, puis le coût d'une heure en boutique de l'un et de l'autre (au centime).`,
      champs: (c) => {
        const x = choixDe(c);
        const f = ficheDe(c);
        return [
          { libelle: "Coût de l'année du CDI", attendu: x.tempsPartiel, calcul: `${eur(TEMPS_PARTIEL.brutMensuel)} × ${qte(1 + f.tauxPatronal)} × 12 = ${eur(x.tempsPartiel)}` },
          { libelle: "Heures en boutique du CDI", attendu: x.heuresTempsPartiel, calcul: `${h(TEMPS_PARTIEL.heures)} × ${qte(SEMAINES_TRAVAILLEES)} = ${h(x.heuresTempsPartiel)}` },
          { libelle: "Heures en boutique de l'apprenti", attendu: x.heuresApprenti, calcul: `${h(APPRENTI.heuresEnBoutique)} × ${qte(SEMAINES_TRAVAILLEES)} = ${h(x.heuresApprenti)}` },
          { libelle: "Heure du CDI", attendu: x.parHeureTempsPartiel, tolerance: 0.02, calcul: `${eur(x.tempsPartiel)} ÷ ${h(x.heuresTempsPartiel)} = ${eur(x.parHeureTempsPartiel)}` },
          { libelle: "Heure de l'apprenti", attendu: x.parHeureApprenti, tolerance: 0.02, calcul: `${eur(x.apprenti)} ÷ ${h(x.heuresApprenti)} = ${eur(x.parHeureApprenti)}` },
        ];
      },
      explication: (c) => {
        const x = choixDe(c);
        return [
          `Une heure de l'apprenti coûte ${eur(x.parHeureApprenti)}, une heure du CDI ${eur(x.parHeureTempsPartiel)}. Sans l'aide, l'année suivante, celle de l'apprenti remonterait à ${eur(x.parHeureApprentiSansAide)} : toujours moins, mais l'écart se resserre.`,
        ];
      },
    },
    {
      id: "le-contrat-d-apprentissage",
      type: "choix",
      titre: "Ce que l'apprentissage demande",
      notions: ["training"],
      question: () => "L'adjointe sera maître d'apprentissage. Laquelle de ces affirmations est juste ?",
      options: () => [
        {
          texte: "Les jours à l'école sont du temps de travail, payés",
          juste: true,
          retour: "Oui : le temps de formation de l'apprenti est du temps de travail. Il ne vient pas en boutique ces jours-là, mais son salaire les couvre. C'est pourquoi l'heure en boutique se calcule sur ses seuls jours de présence.",
        },
        {
          texte: "Il peut remplacer un vendeur absent un jour d'école",
          juste: false,
          retour: "Non : les jours d'école ne se déplacent pas pour la boutique. Le contrat d'apprentissage engage l'employeur à lui laisser suivre sa formation.",
        },
        {
          texte: "Un apprenti se paie au SMIC entier dès son premier mois",
          juste: false,
          retour: "Non : son salaire est un pourcentage du SMIC, qui dépend de son âge et de son année de formation.",
        },
      ],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      notions: ["payroll", "training"],
      question: () => "Quelle réponse envoyez-vous à la direction ?",
      options: (c) => {
        const x = choixDe(c);
        const apprenti = x.parHeureApprenti < x.parHeureTempsPartiel;
        return [
          {
            texte: "L'apprenti : moins cher à l'heure, et la relève",
            juste: apprenti,
            retour: apprenti
              ? `Oui : ${eur(x.parHeureApprenti)} l'heure en boutique contre ${eur(x.parHeureTempsPartiel)}, il tient le samedi et se forme au poste d'adjoint. À condition de compter le tutorat et de prévoir la fin de l'aide, ${eur(x.parHeureApprentiSansAide)} l'heure ensuite.`
              : "Non : l'heure de l'apprenti coûte plus cher.",
          },
          {
            texte: `Le CDI de ${qte(TEMPS_PARTIEL.heures)} heures : plus d'heures en boutique chaque semaine`,
            juste: !apprenti,
            retour: !apprenti
              ? "Oui : l'heure du CDI coûte moins."
              : `Non : le CDI donne plus d'heures, mais chacune coûte ${eur(x.parHeureTempsPartiel)}, contre ${eur(x.parHeureApprenti)} pour l'apprenti. Et il ne prépare pas la relève de l'adjointe.`,
          },
          {
            texte: `L'apprenti, pour ${eur(x.salaireApprenti)} par an`,
            juste: false,
            retour: `Non : c'est oublier l'aide et le tutorat. L'apprenti coûte ${eur(x.apprenti)} net, et c'est l'heure en boutique, ${eur(x.parHeureApprenti)}, qui se compare.`,
          },
        ];
      },
    },
  ],
};
