import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_LA_BASE, PRIX_HT, villeEnTete } from "../../monde/base-de-donnees-de-nova";
import { tableCommande } from "../../chapitres/la-base-de-donnees-relationnelle";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « INTERROGER LA BASE EN SQL » : OÙ OUVRIR UN POINT DE RETRAIT ? (Bac STMG,
 * systèmes d'information de gestion de terminale, palier 1).
 *
 * Le chapitre apprenait à sélectionner, joindre et regrouper ; le cas fait choisir la requête qui répond
 * à la question du président, lire son résultat, et dire ce qu'il vaut. Hypothèses :
 * monde/base-de-donnees-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const OU_OUVRIR_UN_POINT_DE_RETRAIT: Situation = {
  code: "ou-ouvrir-un-point-de-retrait",
  parcours: "stmg-sig",
  palier: 1,
  blocs: [],
  reprend: ["interroger-la-base-en-sql"],
  commanditaire: "Le président",
  titre: "Où ouvrir un point de retrait ?",
  accroche: "NOVA veut ouvrir un point de retrait dans la ville où ses clients commandent le plus. La base du site le sait : encore faut-il lui poser la bonne question.",
  objectifs: ["Choisir la requête qui répond à un besoin de gestion", "Lire son résultat", "Répondre au président, en disant ce que vaut le résultat"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_BASE, pourquoi: "le cas interroge la base de données du site de NOVA." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du président",
      tableau: tableCommande,
      texte: () => [
        "« Je voudrais ouvrir un point de retrait là où nos clients commandent le plus d'enceintes. Vous pouvez me sortir la ville de la base ? » Le président",
        "Pas de cours cette fois : les notions sont celles du chapitre. La base est celle du chapitre, avec ses 2 tables, Client et Commande.",
      ],
      repere: () => "À rendre : la requête, la ville et son chiffre d'affaires, et votre réponse.",
    },
    {
      id: "la-requete",
      type: "choix",
      titre: "La requête",
      question: () => "Quelle requête répond à la question du président ?",
      options: () => [
        { texte: "SELECT Ville, SUM(Quantite) … GROUP BY Ville ORDER BY SUM(Quantite) DESC", juste: true, retour: "Oui, avec la jointure WHERE Client.NumClient = Commande.NumClient : une ligne par ville, la somme des enceintes, la plus grande en tête." },
        { texte: "SELECT Ville, COUNT(*) FROM Client GROUP BY Ville ORDER BY COUNT(*) DESC, sur la seule table des clients", juste: false, retour: "Non : elle compte les clients de chaque ville, pas les enceintes qu'ils commandent." },
        { texte: "SELECT MAX(Quantite) FROM Commande", juste: false, retour: "Non : elle donne la plus grosse commande, sans dire de quelle ville." },
      ],
    },
    {
      id: "le-resultat",
      type: "montants",
      titre: "La ville en tête",
      question: () => `La ville en tête totalise combien d'enceintes ? Puis calculez son chiffre d'affaires sur l'extrait, à ${eur(PRIX_HT)} l'enceinte.`,
      champs: () => {
        const t = villeEnTete();
        return [
          { libelle: `Enceintes de la ville en tête`, attendu: t.enceintes, calcul: `${t.ville} : ${qte(t.enceintes)} enceintes` },
          { libelle: "Chiffre d'affaires de la ville en tête", attendu: t.chiffre, calcul: `${qte(t.enceintes)} × ${eur(PRIX_HT)} = ${eur(t.chiffre)}` },
        ];
      },
      explication: () => [`${villeEnTete().ville} vient en tête sur l'extrait.`],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => {
        const t = villeEnTete();
        return [
          { texte: `${t.ville}, à vérifier sur toute l'année`, juste: true, retour: `Oui : ${t.ville} vient en tête, mais l'extrait ne couvre qu'une semaine. La même requête, lancée sur toutes les commandes de l'année, dira si le choix tient.` },
          { texte: `${t.ville}, sans rien vérifier : la base ne peut pas se tromper`, juste: false, retour: "Non : la base répond juste à la question posée, sur les données qu'elle a. Une semaine ne suffit pas pour décider d'un point de retrait." },
          { texte: "Lyon, parce que c'est la ville du premier client de la table", juste: false, retour: "Non : l'ordre de la table ne dit rien des ventes." },
        ];
      },
    },
  ],
};
