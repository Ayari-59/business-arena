import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_LA_FONCTION_SI, TECHNICIEN_A_MI_TEMPS, renouvelerLInfogerance } from "../../monde/fonction-si-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA FONCTION SYSTÈME D'INFORMATION » : RENOUVELER L'INFOGÉRANCE ? (Bac STMG,
 * systèmes d'information de gestion de terminale, palier 1).
 *
 * Le chapitre comparait l'infogérance à un technicien et lisait le tableau de bord du service ; le cas
 * chiffre la nouvelle offre du prestataire pour 8 postes, et fait trancher avec les indicateurs.
 * Hypothèses : monde/fonction-si-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export const RENOUVELER_L_INFOGERANCE: Situation = {
  code: "renouveler-l-infogerance",
  parcours: "stmg-sig",
  palier: 1,
  blocs: [],
  reprend: ["la-fonction-systeme-d-information"],
  commanditaire: "Le président",
  titre: "Renouveler l'infogérance ?",
  accroche: "Le prestataire augmente son prix, NOVA va passer à 8 postes, et le contrat n'a pas été tenu sur la rapidité. Faut-il renouveler, embaucher un technicien, ou négocier ?",
  objectifs: ["Chiffrer une offre d'infogérance sur l'année", "La comparer à une prestation internalisée", "Répondre au président avec le tableau de bord"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_FONCTION_SI, pourquoi: "le cas reprend les postes de NOVA et le contrat de son prestataire." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du président",
      texte: () => {
        const k = renouvelerLInfogerance();
        return [
          `« Le prestataire passe à ${eur(k.parPosteEtParMois)} par poste et par mois, et nous aurons ${qte(k.postes)} postes. Un technicien à mi-temps nous coûterait ${eur(TECHNICIEN_A_MI_TEMPS.parMois)} par mois. Et en mars, ${pct(k.partEn4HeuresPct)} seulement des incidents ont été résolus en moins de 4 heures. Que faisons-nous ? » Le président`,
          "Pas de cours cette fois : les notions sont celles du chapitre.",
        ];
      },
      repere: () => "À rendre : le coût de l'offre sur l'année, celui du technicien, l'écart, et votre réponse.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "L'offre et le technicien, sur l'année",
      question: () => "Calculez ce que coûterait l'infogérance sur l'année, ce que coûterait le technicien, puis l'écart entre les deux.",
      champs: () => {
        const k = renouvelerLInfogerance();
        return [
          { libelle: "Infogérance de l'année", attendu: k.offre, calcul: `${qte(k.postes)} × ${eur(k.parPosteEtParMois)} × 12 = ${eur(k.offre)}` },
          { libelle: "Technicien de l'année", attendu: k.technicien, calcul: `${eur(TECHNICIEN_A_MI_TEMPS.parMois)} × 12 = ${eur(k.technicien)}` },
          { libelle: "Écart en faveur de l'infogérance", attendu: k.ecart, calcul: `${eur(k.technicien)} − ${eur(k.offre)} = ${eur(k.ecart)}` },
        ];
      },
      explication: () => [`Même plus chère, l'infogérance reste moins coûteuse de ${eur(renouvelerLInfogerance().ecart)} par an.`],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => {
        const k = renouvelerLInfogerance();
        return [
          { texte: "Renouveler, en faisant tenir le délai promis", juste: true, retour: `Oui : l'infogérance coûte moins, mais le contrat promet ${pct(k.promise)} des incidents résolus en moins de 4 heures. NOVA le fait inscrire avec une pénalité, et le suit chaque mois au tableau de bord.` },
          { texte: "Embaucher un technicien à mi-temps, puisque le prestataire n'a pas tenu sa promesse", juste: false, retour: `Non : le technicien coûterait ${eur(k.ecart)} de plus par an, et serait seul pendant ses congés.` },
          { texte: "Renouveler sans rien dire : le prix compte, pas le service", juste: false, retour: "Non : un engagement qui n'est pas suivi ne vaut rien. Le tableau de bord sert à le faire tenir." },
        ];
      },
    },
  ],
};
