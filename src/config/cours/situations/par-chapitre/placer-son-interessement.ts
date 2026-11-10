import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_L_EPARGNE_SALARIALE, placerSonInteressement } from "../../monde/epargne-salariale-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « AU-DELÀ DU SALAIRE » : PLACER SON INTÉRESSEMENT ? (Bac STMG, ressources
 * humaines et communication de terminale, palier 1).
 *
 * Le chapitre bâtissait l'accord d'intéressement ; le cas suit un opérateur qui reçoit sa part et hésite à
 * la placer sur le plan d'épargne d'entreprise, abondé par NOVA. Hypothèses :
 * monde/epargne-salariale-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR")} %`;

export const PLACER_SON_INTERESSEMENT: Situation = {
  code: "placer-son-interessement",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [],
  reprend: ["au-dela-du-salaire"],
  commanditaire: "Un opérateur",
  titre: "Placer son intéressement ?",
  accroche: "Un opérateur reçoit sa part d'intéressement. La toucher tout de suite, ou la placer sur le plan d'épargne de NOVA, qui l'abonde ? Il veut acheter un logement dans 2 ans.",
  objectifs: ["Chiffrer l'abondement de l'employeur", "Tenir compte du blocage et de ses exceptions", "Conseiller l'opérateur, chiffres à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_L_EPARGNE_SALARIALE, pourquoi: "le cas reprend l'accord d'intéressement de NOVA." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de l'opérateur",
      texte: () => {
        const k = placerSonInteressement();
        return [
          `« Je reçois ${eur(k.part)} d'intéressement. Si je les place sur le plan d'épargne d'entreprise, NOVA ajoute ${pct(k.taux)} de ce que je verse, mais l'argent est bloqué 5 ans, et je veux acheter mon appartement dans 2 ans. Je le prends tout de suite ? » Un opérateur`,
          "Pas de cours cette fois : les notions sont celles du chapitre.",
        ];
      },
      repere: () => "À rendre : l'abondement, ce que l'opérateur aurait sur le plan, et votre conseil.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Ce que le plan lui donnerait",
      question: () => "Calculez l'abondement de NOVA, puis ce que l'opérateur aurait sur le plan.",
      champs: () => {
        const k = placerSonInteressement();
        return [
          { libelle: "Abondement de NOVA", attendu: k.abondement, calcul: `${eur(k.part)} × ${pct(k.taux)} = ${eur(k.abondement)}` },
          { libelle: "Sur le plan d'épargne", attendu: k.surLePlan, calcul: `${eur(k.part)} + ${eur(k.abondement)} = ${eur(k.surLePlan)}` },
        ];
      },
      explication: () => [`Placé, l'intéressement devient ${eur(placerSonInteressement().surLePlan)}, sans impôt sur le revenu.`],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre conseil à l'opérateur",
      question: () => "Que lui conseillez-vous ?",
      options: () => {
        const k = placerSonInteressement();
        return [
          {
            texte: "Le placer : l'achat du logement débloquera la somme",
            juste: true,
            retour: `Oui : il gagne ${eur(k.abondement)} d'abondement, et l'acquisition de la résidence principale fait partie des cas de déblocage anticipé que la loi prévoit. Il disposera de ${eur(k.surLePlan)} pour son apport, sans impôt sur le revenu.`,
          },
          {
            texte: "Le prendre tout de suite : bloqué 5 ans, l'argent ne servira pas avant l'achat de son appartement",
            juste: false,
            retour: "Non : le blocage connaît des exceptions, dont l'achat de la résidence principale. Le toucher tout de suite le prive de l'abondement et le rend imposable.",
          },
          {
            texte: "Le placer, et le retirer quand il veut",
            juste: false,
            retour: "Non : les sommes restent bloquées 5 ans, sauf dans les cas que la loi énumère. Il ne peut pas les retirer à sa guise.",
          },
        ];
      },
    },
  ],
};
