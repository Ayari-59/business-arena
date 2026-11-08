import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_L_ACTEUR } from "../../chapitres/de-l-individu-a-l-acteur";
import { COUT_HORAIRE_DE_L_ESCALE, ETE_DE_L_ESCALE, integrationDeLEscale } from "../../monde/equipe-de-l-escale";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « DE L'INDIVIDU À L'ACTEUR » : UN TUTEUR POUR L'ÉTÉ (Bac STMG, sciences de
 * gestion et numérique de première, palier 1).
 *
 * L'été, L'ESCALE recrute des saisonniers, qui partent plus souvent que les autres arrivants. La
 * directrice propose un tutorat de 30 heures par saisonnier : se paie-t-il ? Les calculs sont ceux du
 * chapitre (le coût d'un départ, l'économie des départs évités, le coût du tutorat), sur les
 * hypothèses de l'été (ETE_DE_L_ESCALE, monde/equipe-de-l-escale.ts).
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

/** L'été avec le tutorat proposé. */
export const tuteurPourLEte = () => integrationDeLEscale(ETE_DE_L_ESCALE.heuresProposees, ETE_DE_L_ESCALE);

export const UN_TUTEUR_POUR_L_ETE: Situation = {
  code: "un-tuteur-pour-l-ete",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["de-l-individu-a-l-acteur"],
  commanditaire: "La directrice de l'hôtel",
  titre: "Un tuteur pour l'été ?",
  accroche: "L'été, l'hôtel recrute des saisonniers, qui repartent souvent avant la fin de leur essai. La directrice veut un tuteur pour chacun : le tutorat se paie-t-il ?",
  objectifs: ["Chiffrer ce que coûtent des départs en période d'essai", "Comparer l'économie du tutorat à son coût", "Répondre à la directrice, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_ACTEUR,
    pourquoi: "le cas reprend l'équipe de L'ESCALE du chapitre, ce que coûte un départ et l'heure de travail.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition de la directrice",
      texte: () => [
        `« Cet été, nous recrutons ${qte(ETE_DE_L_ESCALE.arrivees)} saisonniers. Sans accompagnement, j'en vois partir ${qte(ETE_DE_L_ESCALE.departs)} avant la fin de leur essai ; avec un tuteur, j'en attends ${qte(ETE_DE_L_ESCALE.departsAvecTutorat)}. Je propose ${qte(ETE_DE_L_ESCALE.heuresProposees)} heures de tutorat par saisonnier, à ${eur(COUT_HORAIRE_DE_L_ESCALE)} l'heure. Est-ce raisonnable ? » La directrice`,
        "Pas de cours cette fois : les calculs sont ceux du chapitre.",
      ],
      repere: () => "À rendre : l'économie des départs évités, le coût du tutorat, et votre réponse.",
    },
    {
      id: "les-calculs",
      type: "montants",
      titre: "L'économie et le coût",
      notions: ["staff_turnover"],
      question: () => "Calculez l'économie des départs évités et le coût du tutorat proposé, pour l'été.",
      champs: () => {
        const k = tuteurPourLEte();
        const e = ETE_DE_L_ESCALE;
        return [
          { libelle: "Économie des départs évités", attendu: k.economie, calcul: `(${qte(e.departs)} − ${qte(e.departsAvecTutorat)}) × ${eur(k.coutDUnDepart)} = ${eur(k.economie)}` },
          { libelle: "Coût du tutorat", attendu: k.coutDuTutorat, calcul: `${qte(e.arrivees)} × ${qte(e.heuresProposees)} h × ${eur(COUT_HORAIRE_DE_L_ESCALE)} = ${eur(k.coutDuTutorat)}` },
        ];
      },
      explication: () => {
        const k = tuteurPourLEte();
        return [`Le tutorat coûte ${eur(k.coutDuTutorat)} et économise ${eur(k.economie)} : il laisse ${eur(k.gain)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice",
      question: () => "Que répondez-vous à la directrice ?",
      options: () => {
        const k = tuteurPourLEte();
        const paie = k.gain > 0;
        return [
          {
            texte: `Oui : le tutorat laisse ${eur(k.gain)} une fois payé`,
            juste: paie,
            retour: paie
              ? `Oui : ${eur(k.economie)} d'économie pour ${eur(k.coutDuTutorat)} de tutorat. Et un saisonnier accompagné sert mieux les clients de l'été.`
              : "Non : le tutorat coûte plus qu'il n'économise.",
          },
          {
            texte: "Non : des saisonniers partent de toute façon en septembre, les former ne sert à rien",
            juste: false,
            retour: `Non : le calcul porte sur les départs pendant l'essai, avant la fin de la saison. En éviter ${qte(k.departsEvites)} économise ${eur(k.economie)}.`,
          },
          {
            texte: `Non : ${eur(k.coutDuTutorat)} de tutorat, c'est une dépense que l'hôtel ne retrouvera pas`,
            juste: !paie,
            retour: paie ? `Non : la dépense est plus que compensée par les ${eur(k.economie)} de départs évités.` : "Oui : le tutorat coûte plus qu'il n'économise.",
          },
        ];
      },
    },
  ],
};
