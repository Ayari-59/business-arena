import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { recrutement } from "../../chapitres/recruter";
import { MOIS_DE_L_EXERCICE } from "../../monde/exercice-de-nova";
import { ENTREPRISES_DES_RESSOURCES_HUMAINES, MOIS_DU_RECRUTEMENT } from "../../monde/ressources-humaines-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « RECRUTER » : EMBAUCHER UN TRIMESTRE PLUS TARD (Bac STMG, ressources
 * humaines, palier 1).
 *
 * Le laboratoire du chapitre l'a montré : pour servir toute la demande de N + 1, NOVA ajoute un
 * cinquième poste à sa ligne et recrute quelqu'un pour le tenir. Le gérant propose de lancer le
 * recrutement un trimestre plus tard qu'au chapitre, en avril, pour payer moins de mois de salaire.
 * L'élève refait les calculs du chapitre pour les deux dates (le coût de l'embauche, les enceintes
 * qu'elle fait monter de plus que le poste seul), puis répond.
 *
 * Le cas est neuf par sa question : le chapitre juge une embauche, le cas compare deux dates pour la
 * même embauche. Les deux embauches sont celles du chapitre (`recrutement`, le cinquième poste
 * installé), dans le monde du cours ; seule la date du recrutement décalé est posée ci-dessous.
 *
 * CE QUI A CHANGÉ. Le cas rejouait l'année de l'arène avec l'embauche au trimestre 2 ; il se joue chez
 * NOVA : lancé en avril, le recrutement coûte 21 637,50 € au lieu de 29 625 €, pour les mêmes
 * 800 enceintes de plus.
 */

/** Le mois où le gérant propose de lancer le recrutement : un trimestre après celui du chapitre. */
export const MOIS_DU_RECRUTEMENT_DECALE = MOIS_DU_RECRUTEMENT + 3;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const mois = (m: number) => MOIS_DE_L_EXERCICE[m - 1]!;

export type Verdict = "aucune" | "maintenant" | "attendre";

/** Les deux embauches, avec le cinquième poste : celle du chapitre et la décalée. */
export function embaucheDecalee(_c?: Cas) {
  const tot = recrutement(undefined, { poste: 1, moisDuRecrutement: MOIS_DU_RECRUTEMENT });
  const tard = recrutement(undefined, { poste: 1, moisDuRecrutement: MOIS_DU_RECRUTEMENT_DECALE });
  const economie = Math.round((tot.coutDeLaRecrue - tard.coutDeLaRecrue) * 100) / 100;
  const ventesPerduesEnAttendant = tot.enceintesDeLaRecrue - tard.enceintesDeLaRecrue;
  const margePerdueEnAttendant = ventesPerduesEnAttendant * tot.marge;
  const verdict: Verdict = tot.enceintesDeLaRecrue <= 0 && tard.enceintesDeLaRecrue <= 0 ? "aucune" : margePerdueEnAttendant < economie ? "attendre" : "maintenant";
  return { tot, tard, economie, ventesPerduesEnAttendant, margePerdueEnAttendant, gainDeLAttente: Math.round((economie - margePerdueEnAttendant) * 100) / 100, verdict };
}

export const EMBAUCHER_UN_TRIMESTRE_PLUS_TARD: Situation = {
  code: "embaucher-un-trimestre-plus-tard",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [],
  reprend: ["recruter"],
  commanditaire: "Le gérant",
  titre: "Embaucher un trimestre plus tard",
  accroche: "Le gérant veut lancer le recrutement un trimestre plus tard, pour payer moins de mois de salaire. Ce que coûte l'embauche décalée, et ce qu'elle fait encore vendre.",
  objectifs: [
    "Calculer le coût d'une embauche selon le mois où on la lance",
    "Mesurer les ventes qu'une embauche fait gagner, selon sa date",
    "Comparer l'économie d'une attente aux ventes qu'elle fait perdre",
    "Répondre au gérant, chiffre à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_RESSOURCES_HUMAINES,
    pourquoi: "le cas reprend l'embauche du chapitre, dans l'atelier de NOVA et son année N + 1.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: () => {
        const k = embaucheDecalee();
        return [
          `« Le cinquième poste est commandé, et il faudra quelqu'un pour le tenir. Mais pourquoi lancer le recrutement dès ${mois(MOIS_DU_RECRUTEMENT)} ? En le lançant en ${mois(MOIS_DU_RECRUTEMENT_DECALE)}, la recrue arrive le 1er ${mois(k.tard.arrivee!)} au lieu du 1er ${mois(k.tot.arrivee!)}, et nous payons ${qte(k.tot.moisDeLaRecrue - k.tard.moisDeLaRecrue)} mois de salaire de moins. Dites-moi ce que nous y gagnons, et ce que nous y perdons. » Le gérant`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre. Les enceintes de la recrue se comptent face au cinquième poste tenu par l'équipe actuelle.",
        ];
      },
      tableau: () => {
        const k = embaucheDecalee();
        return {
          titre: "L'atelier en N + 1, avec le cinquième poste",
          colonnes: k.tot.joue.trimestres.map((t) => `T${t.trimestre}`),
          lignes: [
            { libelle: "Demande prévue", valeurs: k.tot.joue.trimestres.map((t) => qte(t.demande)) },
            { libelle: "Capacité de la ligne", valeurs: k.tot.joue.trimestres.map((t) => qte(t.capaciteOutil)) },
            { libelle: "Équipe sans recrue", valeurs: k.tot.sans.joue.trimestres.map((t) => qte(t.capaciteEquipe)) },
            { libelle: `Équipe, recrutement lancé en ${mois(MOIS_DU_RECRUTEMENT)}`, valeurs: k.tot.joue.trimestres.map((t) => qte(t.capaciteEquipe)) },
            { libelle: `Équipe, recrutement lancé en ${mois(MOIS_DU_RECRUTEMENT_DECALE)}`, valeurs: k.tard.joue.trimestres.map((t) => qte(t.capaciteEquipe)) },
          ],
        };
      },
      repere: () => "À rendre : le coût de l'embauche à chaque date, l'économie de l'attente, les enceintes de la recrue à chaque date, et votre réponse.",
    },
    {
      id: "cout",
      type: "montants",
      titre: "Ce que coûte l'embauche à chaque date",
      notions: ["payroll"],
      question: () => "Calculez le coût de l'embauche sur l'année pour chaque date (le recrutement, plus le coût de la recrue les mois où elle est payée), puis l'économie que fait l'attente.",
      champs: () => {
        const k = embaucheDecalee();
        return [
          { libelle: `Coût, recrutement lancé en ${mois(MOIS_DU_RECRUTEMENT)}`, attendu: k.tot.coutDeLaRecrue, calcul: `${eur(k.tot.recrutement)} + ${eur(k.tot.coutMensuel)} × ${k.tot.moisDeLaRecrue} = ${eur(k.tot.coutDeLaRecrue)}`, tolerance: 1 },
          { libelle: `Coût, recrutement lancé en ${mois(MOIS_DU_RECRUTEMENT_DECALE)}`, attendu: k.tard.coutDeLaRecrue, calcul: `${eur(k.tard.recrutement)} + ${eur(k.tard.coutMensuel)} × ${k.tard.moisDeLaRecrue} = ${eur(k.tard.coutDeLaRecrue)}`, tolerance: 1 },
          { libelle: "Économie de l'attente", attendu: k.economie, calcul: `${eur(k.tot.coutDeLaRecrue)} − ${eur(k.tard.coutDeLaRecrue)} = ${eur(k.economie)}`, tolerance: 1 },
        ];
      },
      explication: () => {
        const k = embaucheDecalee();
        return [`Attendre fait économiser ${eur(k.economie)} de salaires et de cotisations. Le recrutement, lui, coûte le même prix à chaque date.`];
      },
    },
    {
      id: "ventes",
      type: "montants",
      titre: "Ce que la recrue fait vendre à chaque date",
      notions: ["capacity", "contribution_margin"],
      question: () =>
        "Chaque trimestre, l'atelier monte la plus petite de la demande, de la capacité de la ligne et de celle de l'équipe. Calculez les enceintes que la recrue fait monter de plus que l'équipe actuelle, pour chaque date, puis la marge que l'attente fait perdre.",
      champs: () => {
        const k = embaucheDecalee();
        return [
          { libelle: `Enceintes de la recrue, lancé en ${mois(MOIS_DU_RECRUTEMENT)}`, attendu: k.tot.enceintesDeLaRecrue, calcul: `${qte(k.tot.joue.production)} − ${qte(k.tot.sans.joue.production)} = ${qte(k.tot.enceintesDeLaRecrue)}`, tolerance: 0 },
          { libelle: `Enceintes de la recrue, lancé en ${mois(MOIS_DU_RECRUTEMENT_DECALE)}`, attendu: k.tard.enceintesDeLaRecrue, calcul: `${qte(k.tard.joue.production)} − ${qte(k.tard.sans.joue.production)} = ${qte(k.tard.enceintesDeLaRecrue)}`, tolerance: 0 },
          { libelle: "Marge que l'attente fait perdre", attendu: k.margePerdueEnAttendant, calcul: `(${qte(k.tot.enceintesDeLaRecrue)} − ${qte(k.tard.enceintesDeLaRecrue)}) × ${eur(k.tot.marge)} = ${eur(k.margePerdueEnAttendant)}`, tolerance: 1 },
        ];
      },
      explication: () => {
        const k = embaucheDecalee();
        return [
          k.ventesPerduesEnAttendant > 0
            ? `En attendant, la recrue arrive trop tard pour une partie du printemps : ${qte(k.ventesPerduesEnAttendant)} enceintes de moins.`
            : `La recrue n'est utile qu'au printemps et à Noël, quand la demande dépasse ce que l'équipe actuelle peut monter. Arrivée le 1er ${mois(k.tard.arrivee!)}, elle est là à temps : l'attente ne fait perdre aucune vente.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Que répondez-vous au gérant ?",
      options: () => {
        const k = embaucheDecalee();
        return [
          {
            texte: `Attendre ${mois(MOIS_DU_RECRUTEMENT_DECALE)} : la recrue arrive à temps, pour ${eur(k.economie)} de moins`,
            juste: k.verdict === "attendre",
            retour:
              k.verdict === "attendre"
                ? `Oui : les deux dates font monter ${qte(k.tard.enceintesDeLaRecrue)} enceintes de plus, et l'attente économise ${eur(k.economie)}. Une embauche se cale sur le moment où le travail manque, en comptant le temps du recrutement.`
                : `Non : l'attente fait perdre ${eur(k.margePerdueEnAttendant)} de marge pour ${eur(k.economie)} d'économie.`,
          },
          {
            texte: `Recruter dès ${mois(MOIS_DU_RECRUTEMENT)} : une recrue présente plus longtemps fait toujours vendre davantage`,
            juste: k.verdict === "maintenant",
            retour:
              k.verdict === "maintenant"
                ? `Oui : l'attente ferait perdre ${eur(k.margePerdueEnAttendant)} de marge, plus que les ${eur(k.economie)} qu'elle économise.`
                : `Non : de ${mois(k.tot.arrivee!)} à ${mois(k.tard.arrivee! - 1)}, l'équipe actuelle suffit ; la recrue n'y ferait rien vendre de plus, et coûterait ${eur(k.economie)}.`,
          },
          {
            texte: "Ne pas recruter du tout : la ligne limite déjà les ventes",
            juste: k.verdict === "aucune",
            retour:
              k.verdict === "aucune"
                ? "Oui : à aucune date la recrue ne fait vendre de plus."
                : `Non : avec le cinquième poste, c'est l'équipe qui limite les ventes au printemps et à Noël ; la recrue y fait monter ${qte(k.tard.enceintesDeLaRecrue)} enceintes de plus.`,
          },
        ];
      },
    },
  ],
};
