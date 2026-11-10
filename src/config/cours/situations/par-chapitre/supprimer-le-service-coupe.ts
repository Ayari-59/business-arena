import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DES_CONDITIONS_DE_TRAVAIL, supprimerLeServiceCoupe } from "../../monde/conditions-de-travail-de-la-table";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « QUALITÉ DE VIE ET CONDITIONS DE TRAVAIL » : SUPPRIMER LE SERVICE COUPÉ ?
 * (Bac STMG, ressources humaines et communication de terminale, palier 1).
 *
 * Le chapitre trouvait le seuil où un temps partiel coûte moins que les heures supplémentaires ; le cas
 * chiffre l'année de l'équipe, et la qualité de vie que l'embauche permet. Hypothèses :
 * monde/conditions-de-travail-de-la-table.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const SUPPRIMER_LE_SERVICE_COUPE: Situation = {
  code: "supprimer-le-service-coupe",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [],
  reprend: ["qualite-de-vie-et-conditions-de-travail"],
  commanditaire: "Le patron",
  titre: "Supprimer le service coupé ?",
  accroche: "L'équipe enchaîne les heures supplémentaires et les services coupés. Un serveur à temps partiel coûterait-il plus, ou moins, sur l'année ?",
  objectifs: ["Chiffrer une année d'heures supplémentaires", "La comparer à une embauche à temps partiel", "Répondre au patron, chiffres à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DES_CONDITIONS_DE_TRAVAIL, pourquoi: "le cas reprend les horaires et le coût du travail de LA TABLE D'AUGUSTIN." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du patron",
      texte: () => {
        const k = supprimerLeServiceCoupe();
        return [
          `« L'équipe fait ${qte(k.parSemaine)} heures supplémentaires par semaine, toute l'année, à ${eur(k.coutDUneHeure)} l'heure. Un serveur à temps partiel de ${qte(k.heuresDuTempsPartiel)} heures, à ${eur(k.coutHoraire)} l'heure, les reprendrait, et deux serveurs passeraient en service continu. Est-ce raisonnable ? » Le patron`,
          "Pas de cours cette fois : les notions sont celles du chapitre.",
        ];
      },
      repere: () => "À rendre : le coût de chaque solution sur l'année, l'écart, et votre réponse.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Une année de chaque solution",
      question: () => `Calculez le coût des heures supplémentaires sur ${qte(supprimerLeServiceCoupe().semaines)} semaines, celui du temps partiel, puis l'écart.`,
      champs: () => {
        const k = supprimerLeServiceCoupe();
        return [
          { libelle: "Heures supplémentaires de l'année", attendu: k.supplementaires, calcul: `${qte(k.parSemaine)} × ${eur(k.coutDUneHeure)} × ${qte(k.semaines)} = ${eur(k.supplementaires)}` },
          { libelle: "Temps partiel de l'année", attendu: k.tempsPartiel, calcul: `${qte(k.heuresDuTempsPartiel)} × ${eur(k.coutHoraire)} × ${qte(k.semaines)} = ${eur(k.tempsPartiel)}` },
          { libelle: "Écart", attendu: k.ecart, calcul: `${eur(k.supplementaires)} − ${eur(k.tempsPartiel)} = ${eur(k.ecart)}` },
        ];
      },
      explication: () => [`Le temps partiel coûte ${eur(supprimerLeServiceCoupe().ecart)} de moins sur l'année.`],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au patron",
      question: () => "Que répondez-vous au patron ?",
      options: () => {
        const k = supprimerLeServiceCoupe();
        return [
          {
            texte: "Embaucher : moins cher, et l'équipe souffle",
            juste: true,
            retour: `Oui : l'embauche coûte ${eur(k.ecart)} de moins que les heures supplémentaires, et permet le service continu pour deux serveurs. Moins de fatigue, moins de départs : la qualité de vie au travail et la performance vont ici dans le même sens.`,
          },
          {
            texte: "Garder les heures supplémentaires : l'équipe les demande pour gagner plus",
            juste: false,
            retour: "Non : certains les apprécient, mais elles coûtent plus cher au bistrot, et l'épuisement fait partir des serveurs. On peut en garder quelques-unes, sans en faire l'organisation normale.",
          },
          {
            texte: "Faire travailler les serveurs 12 heures par jour pour supprimer les coupures",
            juste: false,
            retour: "Non : au-delà de 10 heures par jour, il faut une dérogation, et des journées aussi longues abîment la santé. Ce n'est pas un mieux-vivre au travail.",
          },
        ];
      },
    },
  ],
};
