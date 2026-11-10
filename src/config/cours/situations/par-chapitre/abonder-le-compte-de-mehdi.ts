import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DES_COMPETENCES, projetDeMehdi } from "../../monde/competences-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « DÉVELOPPER LES COMPÉTENCES » : ABONDER LE COMPTE DE MEHDI ? (Bac STMG,
 * ressources humaines et communication de terminale, palier 1).
 *
 * Le chapitre chiffrait les années d'attente du CPF ; le cas fait chiffrer ce qui manque au compte, et
 * décider si NOVA l'abonde. Hypothèses : monde/competences-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const ABONDER_LE_COMPTE_DE_MEHDI: Situation = {
  code: "abonder-le-compte-de-mehdi",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [],
  reprend: ["developper-les-competences"],
  commanditaire: "Le président",
  titre: "Abonder le compte de Mehdi ?",
  accroche: "Un opérateur veut devenir technicien de maintenance, mais son compte de formation n'y suffit pas encore. NOVA doit-elle compléter ?",
  objectifs: ["Chiffrer ce qui manque au compte et l'attente", "Relier le projet du salarié aux besoins de l'entreprise", "Répondre au président, chiffres à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DES_COMPETENCES, pourquoi: "le cas reprend le projet de Mehdi, opérateur de NOVA." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du président",
      texte: () => {
        const k = projetDeMehdi();
        return [
          `« Mehdi veut passer la certification de technicien de maintenance, à ${eur(k.certification)}. Son compte porte ${eur(k.dejaAcquis)}. Nous faisons venir un technicien extérieur à chaque panne de la ligne. Dois-je compléter son compte, ou le laisser attendre ? » Le président`,
          "Pas de cours cette fois : les notions sont celles du chapitre.",
        ];
      },
      repere: () => "À rendre : ce qui manque, l'attente sans aide, et votre réponse.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Ce qui manque, et combien de temps",
      question: () => "Calculez ce qui manque au compte de Mehdi, puis le nombre d'années de droits qu'il lui faudrait sans aide.",
      champs: () => {
        const k = projetDeMehdi();
        return [
          { libelle: "Ce qui manque au compte", attendu: k.manque, calcul: `${eur(k.certification)} − ${eur(k.dejaAcquis)} = ${eur(k.manque)}` },
          { libelle: "Années d'attente sans aide", attendu: k.annees, calcul: `${eur(k.manque)} ÷ ${eur(k.parAn)} par an = ${qte(k.annees)} ans` },
        ];
      },
      explication: () => {
        const k = projetDeMehdi();
        return [`Il manque ${eur(k.manque)} : sans aide, Mehdi attendrait ${qte(k.annees)} ans.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => {
        const k = projetDeMehdi();
        return [
          {
            texte: `Abonder les ${eur(k.manque)} qui manquent : le projet sert aussi NOVA`,
            juste: true,
            retour: `Oui : en ajoutant ${eur(k.manque)} au compte, NOVA gagne tout de suite une compétence de maintenance qu'elle achète à l'extérieur, et un salarié qui progresse chez elle. Mehdi garde la certification : son employabilité grandit, et il a des raisons de rester.`,
          },
          {
            texte: "Le laisser attendre : la formation de Mehdi le regarde seul, NOVA n'a pas à s'en mêler",
            juste: false,
            retour: `Non : le CPF est à lui, mais rien n'interdit à l'employeur d'y ajouter des droits. Attendre ${qte(k.annees)} ans prive NOVA d'une compétence dont elle a besoin.`,
          },
          {
            texte: "Lui imposer de la payer sur son temps libre, puis lui retenir le reste sur son salaire",
            juste: false,
            retour: "Non : le CPF ne se mobilise qu'avec l'accord de Mehdi, et NOVA ne peut rien lui imposer. Elle peut seulement l'aider, en abondant son compte.",
          },
        ];
      },
    },
  ],
};
