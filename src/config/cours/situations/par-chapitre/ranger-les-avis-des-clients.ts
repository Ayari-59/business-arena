import { ENTREPRISES_DE_LA_BASE, NOTES_DES_AVIS, moyenneDesAvis } from "../../monde/base-de-donnees-de-nova";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA BASE DE DONNÉES RELATIONNELLE » : RANGER LES AVIS DES CLIENTS (Bac STMG,
 * systèmes d'information de gestion de terminale, palier 1).
 *
 * Le chapitre lisait et adaptait le schéma de la base du site ; le cas y fait entrer les avis des
 * clients : une relation nouvelle, sa clé, sa clé étrangère et la contrainte de domaine de la note.
 * Hypothèses : monde/base-de-donnees-de-nova.ts.
 */

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

const premiersAvis = (): TableauDeDonnees => ({
  titre: "Les premiers avis reçus",
  colonnes: ["Commande", "Note sur 5"],
  lignes: NOTES_DES_AVIS.map((n, i) => ({ libelle: `Avis ${qte(i + 1)}`, valeurs: [qte(101 + i), qte(n)] })),
});

export const RANGER_LES_AVIS_DES_CLIENTS: Situation = {
  code: "ranger-les-avis-des-clients",
  parcours: "stmg-sig",
  palier: 1,
  blocs: [],
  reprend: ["la-base-de-donnees-relationnelle"],
  commanditaire: "Le président",
  titre: "Ranger les avis des clients",
  accroche: "Le site va demander à chaque client de noter sa commande de 1 à 5, avec un commentaire. Où ranger ces avis dans la base, et avec quelles règles ?",
  objectifs: ["Adapter un schéma relationnel à un besoin nouveau", "Poser la contrainte de domaine d'un attribut", "Répondre au président, schéma à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_BASE, pourquoi: "le cas reprend la base de données du site de NOVA." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du président",
      texte: () => [
        "« Je veux que chaque client puisse noter sa commande de 1 à 5 et laisser un commentaire. Il faut que nous puissions retrouver les avis d'un client, et la note moyenne de chaque mois. Où met-on tout cela dans la base ? » Le président",
        "Pas de cours cette fois : les notions sont celles du chapitre.",
      ],
      repere: () => "À rendre : la place des avis dans le schéma, la règle de la note, et votre réponse.",
    },
    {
      id: "la-place",
      type: "choix",
      titre: "Où ranger un avis",
      question: () => "Un avis porte sur une commande. Où le ranger ?",
      options: () => [
        { texte: "Une relation Avis, avec #NumCommande", juste: true, retour: "Oui : Avis (NumAvis, Note, Commentaire, #NumCommande). La clé étrangère relie l'avis à sa commande, donc à son client et à sa date." },
        { texte: "Une colonne Note dans Client, que chaque nouvel avis remplace", juste: false, retour: "Non : le client n'aurait qu'un avis, et les anciens seraient perdus." },
        { texte: "Un fichier de texte à part, hors de la base, pour ne pas la charger", juste: false, retour: "Non : les avis ne seraient reliés à rien, et aucune requête ne les retrouverait." },
      ],
    },
    {
      id: "la-moyenne",
      type: "montants",
      titre: "La note moyenne",
      tableau: premiersAvis,
      question: () => "Voici les premiers avis enregistrés. Calculez la note moyenne, au dixième.",
      champs: () => [{ libelle: "Note moyenne", attendu: moyenneDesAvis(), tolerance: 0.1, calcul: `(${NOTES_DES_AVIS.map(qte).join(" + ")}) ÷ ${qte(NOTES_DES_AVIS.length)} = ${moyenneDesAvis().toLocaleString("fr-FR")}` }],
      explication: () => ["Dans la base, une requête la calcule : SELECT AVG(Note) FROM Avis."],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => [
        { texte: "Une relation Avis, et une note limitée de 1 à 5", juste: true, retour: "Oui : la nouvelle relation garde chaque avis une fois, reliée à sa commande. La contrainte de domaine refuse une note de 0 ou de 6, et la contrainte référentielle un avis sans commande." },
        { texte: "Une relation Avis, et la note libre : le client écrit ce qu'il veut", juste: false, retour: "Non : une note libre (« très bien », « 4,5 », « 10 ») rendrait la moyenne impossible. Le domaine se fixe." },
        { texte: "Pas de base : lire les avis un par un suffit", juste: false, retour: "Non : avec des centaines d'avis par mois, il faut pouvoir les compter et les moyenner." },
      ],
    },
  ],
};
