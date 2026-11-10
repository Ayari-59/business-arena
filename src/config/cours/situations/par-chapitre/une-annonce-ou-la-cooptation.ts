import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_LA_COMMUNICATION, annonceOuCooptation } from "../../monde/communication-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « COMMUNIQUER AVEC CHAQUE ACTEUR » : UNE ANNONCE OU LA COOPTATION ? (Bac STMG,
 * enseignement commun de terminale, palier 1).
 *
 * Le chapitre construisait la marque employeur ; le cas chiffre deux façons de communiquer un
 * recrutement, et rappelle l'égalité des chances. Hypothèses : monde/communication-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const UNE_ANNONCE_OU_LA_COOPTATION: Situation = {
  code: "une-annonce-ou-la-cooptation",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["communiquer-avec-chaque-acteur"],
  commanditaire: "Le président",
  titre: "Une annonce ou la cooptation ?",
  accroche: "Pour ses recrutements, NOVA peut publier une annonce ou demander à ses salariés de recommander quelqu'un. Laquelle coûte moins, et laquelle ouvre le plus ?",
  objectifs: ["Chiffrer deux façons de communiquer un recrutement", "Tenir compte de l'égalité des chances", "Répondre au président, chiffres à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_COMMUNICATION, pourquoi: "le cas reprend les recrutements que NOVA prévoit." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du président",
      texte: () => {
        const k = annonceOuCooptation();
        return [
          `« Il nous faut ${qte(k.postes)} opérateurs. Une annonce coûte ${eur(k.parAnnonce)} par poste, la diffusion et le tri des candidatures compris. Nos salariés pourraient aussi recommander quelqu'un de leur entourage : je leur verserais ${eur(k.parCooptation)} par recrue. Que choisir ? » Le président`,
          "Pas de cours cette fois : les notions sont celles du chapitre.",
        ];
      },
      repere: () => "À rendre : le coût de chaque solution, l'écart, et votre réponse.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Ce que coûte chaque solution",
      question: () => "Calculez le coût des annonces pour tous les postes, celui de la cooptation, puis l'écart.",
      champs: () => {
        const k = annonceOuCooptation();
        return [
          { libelle: "Coût des annonces", attendu: k.annonce, calcul: `${qte(k.postes)} × ${eur(k.parAnnonce)} = ${eur(k.annonce)}` },
          { libelle: "Coût de la cooptation", attendu: k.cooptation, calcul: `${qte(k.postes)} × ${eur(k.parCooptation)} = ${eur(k.cooptation)}` },
          { libelle: "Écart", attendu: k.ecart, calcul: `${eur(k.annonce)} − ${eur(k.cooptation)} = ${eur(k.ecart)}` },
        ];
      },
      explication: () => [`La cooptation coûte ${eur(annonceOuCooptation().ecart)} de moins, et le salarié qui recommande connaît le travail : la recrue sait à quoi s'attendre.`],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => {
        const k = annonceOuCooptation();
        return [
          {
            texte: "Coopter, mais publier aussi l'offre pour tous",
            juste: true,
            retour: `Oui : la cooptation coûte ${eur(k.ecart)} de moins et fait vivre la marque employeur par les salariés. Mais seule, elle ne recrute que dans l'entourage de l'équipe : publier l'offre ouvre le poste à tous et respecte l'égalité des chances.`,
          },
          {
            texte: "Coopter seulement : c'est moins cher, et l'on recrute des gens qu'on connaît",
            juste: false,
            retour: "Non : recruter seulement dans l'entourage reproduit le même profil et écarte des candidats, contre l'égalité des chances.",
          },
          {
            texte: "Publier seulement : une recommandation d'un salarié est toujours interdite",
            juste: false,
            retour: "Non : la cooptation est permise, si le choix final se fait sur les compétences, comme pour tout candidat.",
          },
        ];
      },
    },
  ],
};
