import { DESSERTS, ENTREPRISES_DE_L_EVALUATION, tauxDesDesserts } from "../../monde/evaluation-a-la-table";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « ÉVALUER LE TRAVAIL » : UNE PRIME SUR LES DESSERTS ? (Bac STMG, ressources
 * humaines et communication de terminale, palier 1).
 *
 * Le chapitre construisait une grille ; le cas met à l'épreuve un indicateur seul, qui dépend du service
 * plus que du serveur. Hypothèses : monde/evaluation-a-la-table.ts.
 */

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export const UNE_PRIME_SUR_LES_DESSERTS: Situation = {
  code: "une-prime-sur-les-desserts",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [],
  reprend: ["evaluer-le-travail"],
  commanditaire: "Le patron",
  titre: "Une prime sur les desserts ?",
  accroche: "Le patron veut récompenser le serveur qui vend le plus de desserts. Le chiffre est simple à lire, mais mesure-t-il le travail du serveur ?",
  objectifs: ["Calculer un indicateur de résultat", "Juger s'il mesure bien le travail évalué", "Répondre au patron, chiffres à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_L_EVALUATION, pourquoi: "le cas reprend les serveurs et les clientèles de LA TABLE D'AUGUSTIN." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition du patron",
      texte: () => {
        const d = DESSERTS;
        return [
          `« Je verserai une prime au serveur qui vend un dessert à plus de ${pct(tauxDesDesserts().seuil)} de ses couverts. Cette année, ${d.hugo.prenom} a servi ${qte(d.hugo.couverts)} couverts au ${d.hugo.service} et vendu ${qte(d.hugo.desserts)} desserts ; ${d.sarah.prenom}, ${qte(d.sarah.couverts)} couverts au ${d.sarah.service} et ${qte(d.sarah.desserts)} desserts. C'est clair, non ? » Le patron`,
          "Pas de cours cette fois : les notions sont celles du chapitre.",
        ];
      },
      repere: () => "À rendre : le taux de chaque serveur, et votre avis sur la prime.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Le taux de desserts",
      question: () => "Calculez, pour chacun, la part des couverts qui ont pris un dessert (en %, au dixième).",
      champs: () => {
        const d = DESSERTS;
        const k = tauxDesDesserts();
        return [
          { libelle: `Taux de ${d.hugo.prenom}`, attendu: k.hugo, calcul: `${qte(d.hugo.desserts)} ÷ ${qte(d.hugo.couverts)} × 100 = ${pct(k.hugo)}` },
          { libelle: `Taux de ${d.sarah.prenom}`, attendu: k.sarah, calcul: `${qte(d.sarah.desserts)} ÷ ${qte(d.sarah.couverts)} × 100 = ${pct(k.sarah)}` },
        ];
      },
      explication: () => {
        const k = tauxDesDesserts();
        return [`Sarah vend un dessert à ${pct(k.sarah)} de ses couverts, Hugo à ${pct(k.hugo)} : seule Sarah toucherait la prime.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au patron",
      question: () => "Que répondez-vous au patron ?",
      options: () => {
        const k = tauxDesDesserts();
        return [
          {
            texte: "Comparer chacun aux serveurs de son service, et garder la grille",
            juste: true,
            retour: `Oui : au déjeuner d'affaires, les clients pressés prennent rarement un dessert ; ${pct(k.hugo)} n'y dit pas que Hugo vend mal. Un indicateur ne mesure le travail que s'il dépend de celui qu'on évalue. La grille, qui croise plusieurs critères annoncés à l'avance, juge plus justement.`,
          },
          {
            texte: "Verser la prime à Sarah seule : le chiffre est objectif, il ne se discute pas",
            juste: false,
            retour: "Non : le chiffre est exact, mais il mesure surtout la clientèle du service. Hugo serait pénalisé pour le service qu'on lui a confié.",
          },
          {
            texte: "Renoncer à toute évaluation : rien ne se mesure vraiment",
            juste: false,
            retour: "Non : beaucoup se mesure, à condition de comparer ce qui est comparable et de ne pas réduire le travail à un chiffre.",
          },
        ];
      },
    },
  ],
};
