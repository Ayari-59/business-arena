import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DU_CHANGEMENT, protegerLeSite } from "../../monde/changements-de-l-environnement";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE MANAGEMENT FACE AU CHANGEMENT » : PROTÉGER LE SITE DE VENTE ?
 * (Bac STMG, management de première, palier 1).
 *
 * Un prestataire propose de protéger le site de vente de NOVA. Le cas est neuf par sa question : le
 * chapitre chiffrait le risque d'une cyberattaque ; ici, l'élève compare ce risque, protégé ou non,
 * et dit au président s'il faut payer la protection. Chiffres et hypothèse :
 * monde/changements-de-l-environnement.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export const PROTEGER_LE_SITE_DE_VENTE: Situation = {
  code: "proteger-le-site-de-vente",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["le-management-face-au-changement"],
  commanditaire: "Le président de NOVA",
  titre: "Protéger le site de vente ?",
  accroche: "Un prestataire propose de protéger le site de vente contre les attaques, pour un prix fixe par an. La protection vaut-elle ce qu'elle coûte ?",
  objectifs: ["Chiffrer le coût moyen d'un risque numérique", "Comparer un risque protégé et non protégé", "Répondre au président, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_CHANGEMENT,
    pourquoi: "le cas reprend le site de vente de NOVA du chapitre et le coût d'une cyberattaque.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition du prestataire",
      texte: () => {
        const k = protegerLeSite();
        return [
          `« Un prestataire me propose de protéger notre site : sauvegardes, pare-feu, mises à jour, pour ${eur(k.protection.prixParAn)} par an. Selon lui, une attaque n'aurait plus que ${pct(k.protection.probabilite)} de chances de tomber dans l'année, au lieu de ${pct(k.probabilite)}. Est-ce que cela vaut le coup ? » Le président`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre.",
        ];
      },
      tableau: () => {
        const k = protegerLeSite();
        return {
          titre: "La cyberattaque du site, si elle tombe",
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Remise en état du site", valeurs: [eur(k.dommages)] },
            { libelle: "Enceintes qui ne se vendent pas", valeurs: [qte(k.ventesPerdues)] },
            { libelle: "Marge d'une enceinte", valeurs: [eur(k.marge)] },
          ],
        };
      },
      repere: () => "À rendre : le coût moyen de l'année sans protection et avec, et votre réponse.",
    },
    {
      id: "les-deux-couts",
      type: "montants",
      titre: "Protégé ou non",
      question: () => "Calculez le coût de l'attaque si elle tombe, son coût moyen sur l'année sans protection, puis le coût moyen avec la protection (son prix, plus le coût de l'attaque multiplié par sa probabilité nouvelle).",
      champs: () => {
        const k = protegerLeSite();
        return [
          { libelle: "Coût de l'attaque si elle tombe", attendu: k.cout, calcul: `${eur(k.dommages)} + ${qte(k.ventesPerdues)} × ${eur(k.marge)} = ${eur(k.cout)}`, tolerance: 1 },
          { libelle: "Coût moyen sans protection", attendu: k.sans, calcul: `${eur(k.cout)} × ${qte(k.probabilite)} = ${eur(k.sans)}`, tolerance: 1 },
          { libelle: "Coût moyen avec la protection", attendu: k.avec, calcul: `${eur(k.protection.prixParAn)} + ${eur(k.cout)} × ${qte(k.protection.probabilite)} = ${eur(k.avec)}`, tolerance: 1 },
        ];
      },
      explication: () => {
        const k = protegerLeSite();
        return [`Protégé, le site coûte en moyenne ${eur(k.avec)} par an, risque compris, contre ${eur(k.sans)} sans protection.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => {
        const k = protegerLeSite();
        const vaut = k.gain > 0;
        return [
          {
            texte: `Prendre la protection : ${eur(Math.abs(k.gain))} de moins par an en moyenne`,
            juste: vaut,
            retour: vaut
              ? `Oui : risque compris, la protection fait gagner ${eur(k.gain)} par an en moyenne, et surtout elle rend beaucoup moins probable une perte de ${eur(k.cout)} d'un coup. Le numérique se garde, il ne s'abandonne pas.`
              : `Non : la protection coûte ${eur(-k.gain)} de plus qu'elle n'évite.`,
          },
          {
            texte: "Refuser : une attaque a si peu de chances de tomber qu'il est inutile de payer quoi que ce soit",
            juste: !vaut,
            retour: !vaut ? "Oui : la protection coûte plus qu'elle n'évite." : `Non : peu probable ne veut pas dire sans coût. En moyenne, l'attaque coûte ${eur(k.sans)} par an sans protection, plus que la protection, risque compris.`,
          },
          {
            texte: "Fermer le site et ne vendre qu'à CampusTech, pour ne plus courir aucun risque",
            juste: false,
            retour: "Non : le site fait vendre aux particuliers sans intermédiaire. Renoncer au numérique pour éviter son risque ferait perdre bien plus que l'attaque.",
          },
        ];
      },
    },
  ],
};
