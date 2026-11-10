import { arrondi2, eur, nombreAuCentieme, qte } from "../../../pedagogy/cours/deux-decimales";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import {
  CLIENTS,
  COMMANDES,
  ENTREPRISES_DE_LA_BASE,
  PRIX_HT,
  agregats,
  chiffreDeLExtrait,
  commandesDAuMoins,
  commandesDeLaVille,
  enceintesParVille,
  seuilDeLaMoitie,
  villeDe,
  villeEnTete,
} from "../monde/base-de-donnees-de-nova";
import type { Chapitre, TableauDeDonnees } from "../types";
import { tableClient, tableCommande } from "./la-base-de-donnees-relationnelle";

/**
 * CHAPITRE : INTERROGER LA BASE EN SQL (Bac STMG, enseignement spécifique de systèmes d'information de
 * gestion de terminale, thème 3, question 3.1 : « Comment peut-on produire de l'information à partir de
 * données ? »).
 *
 * Le langage de requêtes SQL, par des étapes guidées (décision du propriétaire, novembre 2026 : pas de
 * type d'étape nouveau) : lire le résultat d'une requête sur les tables affichées, choisir la clause qui
 * manque, compléter le résultat d'un regroupement. La sélection (SELECT, FROM, WHERE), les opérateurs
 * relationnels et logiques (=, <>, >=, AND, OR), la jointure, les fonctions d'agrégat (COUNT, SUM, AVG,
 * MAX), le regroupement (GROUP BY) et le tri (ORDER BY) ; un critère choisi au laboratoire pour répondre
 * à un besoin de gestion ; les traces numériques et leur mise en relation. Tout se corrige au serveur.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA, sur la base de « La base de données relationnelle » :
 * monde/base-de-donnees-de-nova.ts.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les lignes, les cases, les enceintes et les agrégats entiers
 * sont des quantités ; une moyenne est une grandeur au centième (au dixième près, avant).
 */


const JOINTURE = "WHERE Client.NumClient = Commande.NumClient";
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const nomsDe = (ville: string) => CLIENTS.filter((c) => c.ville === ville).map((c) => c.nom);
const et = (xs: readonly string[]) => xs.join(", ").replace(/, (?=[^,]+$)/, " et ");

/** Le résultat de la jointure : chaque commande, avec la ville de son client. */
const tableJointe = (): TableauDeDonnees => ({
  titre: "Le résultat de la jointure : chaque commande, avec la ville de son client",
  colonnes: ["NumCommande", "Quantite", "Ville"],
  lignes: COMMANDES.map((c, i) => ({ libelle: qte(i + 1), valeurs: [qte(c.numCommande), qte(c.quantite), villeDe(c)] })),
});

function regroupementACompleter(): TableauACompleter {
  const v = enceintesParVille();
  return {
    titre: "Le résultat de la requête, ville par ville",
    colonnes: ["SUM(Quantite)"],
    lignes: [
      ...v.map((x) => ({
        libelle: x.ville,
        cellules: [{ valeur: x.enceintes, saisir: true, unite: "enceintes", calcul: `Les quantités des commandes ${dE(x.ville)}, additionnées : ${qte(x.enceintes)}`, indice: "Additionnez les quantités des lignes de la ville." }],
      })),
      { libelle: "Total", fort: true, totalDe: { plus: v.map((_, i) => i) }, cellules: [{ valeur: agregats().somme, saisir: true, unite: "enceintes", nature: "quantite", calcul: `La somme des villes, toutes les commandes : ${qte(agregats().somme)}` }] },
    ],
  };
}

export const INTERROGER_LA_BASE_EN_SQL: Chapitre = {
  code: "interroger-la-base-en-sql",
  parcours: "stmg-sig",
  palier: 1,
  blocs: ["STMG Thème 3 · Information, action et décision"],
  titre: "Interroger la base en SQL : sélectionner, joindre, regrouper",
  accroche:
    "SELECT, FROM, WHERE : quelques mots suffisent pour demander à la base du site de NOVA ce qu'elle sait. Lire le résultat d'une requête, trouver la clause qui manque, joindre 2 tables, compter, additionner, regrouper par ville.",
  objectifs: [
    "Sélectionner des lignes par une condition",
    "Joindre 2 tables par leur clé",
    "Calculer avec les fonctions d'agrégat, et regrouper",
    "Choisir le critère qui répond à un besoin de gestion",
    "Dire ce que les traces numériques permettent",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_BASE, pourquoi: "ce chapitre interroge la base de données du site de NOVA." },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Demander à la base",
      tableau: tableClient,
      texte: (c) => [
        `La base du site de ${c.entreprise} garde ${qte(CLIENTS.length)} clients et ${qte(COMMANDES.length)} commandes dans cet extrait. Pour en tirer une information, on lui envoie une requête, écrite en SQL, le langage normalisé des bases relationnelles. Le SGBD l'exécute et renvoie un tableau de résultats.`,
        "Une requête simple a 3 clauses : SELECT dit quelles colonnes afficher, FROM dans quelle table chercher, WHERE quelles lignes garder. Exemple : SELECT Nom FROM Client WHERE Ville = 'Lyon' renvoie les noms des clients de Lyon.",
      ],
      repere: () => "SELECT les colonnes · FROM la table · WHERE la condition sur les lignes.",
    },
    {
      id: "lire-une-requete",
      objectifs: [0],
      type: "montants",
      titre: "Lire le résultat",
      tableau: tableClient,
      question: () => "Combien de lignes renvoient ces requêtes ? D'abord : SELECT Nom FROM Client WHERE Ville = 'Grenoble'. Puis : SELECT Nom FROM Client WHERE Ville <> 'Lyon'.",
      champs: () => [
        { libelle: "Lignes de la première requête", nature: "quantite", attendu: CLIENTS.filter((c) => c.ville === "Grenoble").length, calcul: `${et(nomsDe("Grenoble"))} : ${qte(CLIENTS.filter((c) => c.ville === "Grenoble").length)}` },
        { libelle: "Lignes de la seconde requête", nature: "quantite", attendu: CLIENTS.filter((c) => c.ville !== "Lyon").length, calcul: `Tous les clients sauf ${et(nomsDe("Lyon"))} : ${qte(CLIENTS.filter((c) => c.ville !== "Lyon").length)}` },
      ],
      explication: () => ["L'opérateur = garde les lignes égales ; <> garde celles qui sont différentes. Les autres opérateurs relationnels comparent : <, >, <=, >=."],
    },
    {
      id: "la-clause-qui-manque",
      objectifs: [0],
      type: "choix",
      titre: "La clause qui manque",
      tableau: tableCommande,
      question: () => "Le président veut les numéros des commandes de 3 enceintes ou plus. Complétez la requête : SELECT NumCommande FROM Commande … Quantite >= 3.",
      options: () => [
        { texte: "WHERE", juste: true, retour: `Oui : WHERE pose la condition sur les lignes. La requête renvoie ${COMMANDES.filter((c) => c.quantite >= 3).map((c) => qte(c.numCommande)).join(", ")}.` },
        { texte: "GROUP BY", juste: false, retour: "Non : GROUP BY regroupe des lignes, il ne les filtre pas." },
        { texte: "ORDER BY", juste: false, retour: "Non : ORDER BY trie le résultat, sans rien retirer." },
      ],
    },
    {
      id: "les-operateurs-logiques",
      objectifs: [0],
      type: "montants",
      titre: "AND et OR",
      tableau: tableCommande,
      question: () => "Combien de lignes renvoient ces requêtes ? D'abord : SELECT NumCommande FROM Commande WHERE Quantite >= 2 AND Quantite <= 3. Puis : SELECT NumCommande FROM Commande WHERE Quantite = 1 OR Quantite = 5.",
      champs: () => {
        const et = COMMANDES.filter((c) => c.quantite >= 2 && c.quantite <= 3);
        const ou = COMMANDES.filter((c) => c.quantite === 1 || c.quantite === 5);
        return [
          { libelle: "Lignes avec AND", nature: "quantite", attendu: et.length, calcul: `Les 2 conditions à la fois : ${et.map((c) => qte(c.numCommande)).join(", ")}, soit ${qte(et.length)}` },
          { libelle: "Lignes avec OR", nature: "quantite", attendu: ou.length, calcul: `L'une ou l'autre : ${ou.map((c) => qte(c.numCommande)).join(", ")}, soit ${qte(ou.length)}` },
        ];
      },
      explication: () => ["AND garde les lignes qui remplissent les 2 conditions ; OR celles qui en remplissent au moins une ; NOT inverse une condition. Une condition avec AND renvoie moins de lignes, une avec OR davantage."],
    },
    {
      id: "la-jointure",
      objectifs: [1],
      type: "choix",
      titre: "Joindre 2 tables",
      tableau: tableCommande,
      question: () => "Le président veut le nom du client de chaque commande. Le nom est dans Client, la commande dans Commande. Quelle condition relie les 2 tables ? SELECT Nom, NumCommande FROM Client, Commande …",
      options: () => [
        { texte: JOINTURE, juste: true, retour: "Oui : la clé étrangère de Commande doit égaler la clé primaire de Client. Chaque commande retrouve ainsi son client : c'est la jointure. On l'écrit aussi avec JOIN … ON." },
        { texte: "WHERE Client.Nom = Commande.NumCommande, pour mettre chaque nom en face d'une commande", juste: false, retour: "Non : un nom et un numéro de commande ne se comparent pas ; ils ne parlent pas de la même chose." },
        { texte: "Aucune : le SGBD devine le lien", juste: false, retour: `Non : sans condition, chaque commande serait associée à chacun des clients, soit ${qte(CLIENTS.length * COMMANDES.length)} lignes fausses.` },
      ],
    },
    {
      id: "lire-la-jointure",
      objectifs: [1],
      type: "montants",
      titre: "Le résultat de la jointure",
      tableau: tableCommande,
      question: () => `Lisez le résultat de : SELECT Nom, Quantite FROM Client, Commande ${JOINTURE} AND Ville = 'Lyon'. Combien de lignes renvoie-t-elle, et combien d'enceintes ses lignes totalisent-elles ?`,
      champs: () => {
        const k = commandesDeLaVille("Lyon");
        return [
          { libelle: "Lignes du résultat", nature: "quantite", attendu: k.lignes, calcul: `Les commandes de ${et(nomsDe("Lyon"))} : ${qte(k.lignes)}` },
          { libelle: "Enceintes de ces lignes", nature: "quantite", attendu: k.enceintes, calcul: `Leurs quantités additionnées : ${qte(k.enceintes)}` },
        ];
      },
      explication: () => ["La condition sur la ville porte sur Client ; le résultat montre des commandes. Sans la jointure, la base ne saurait pas quelle commande vient de Lyon."],
    },
    {
      id: "les-agregats",
      objectifs: [2],
      type: "montants",
      titre: "Compter, additionner, moyenner",
      tableau: tableCommande,
      question: () => "Lisez le résultat de : SELECT COUNT(*), SUM(Quantite), AVG(Quantite), MAX(Quantite) FROM Commande. La moyenne au centième.",
      champs: () => {
        const k = agregats();
        return [
          { libelle: "COUNT(*)", nature: "quantite", attendu: k.nombre, calcul: `Le nombre de lignes : ${qte(k.nombre)}` },
          { libelle: "SUM(Quantite)", nature: "quantite", attendu: k.somme, calcul: `La somme des quantités : ${qte(k.somme)}` },
          { libelle: "AVG(Quantite)", nature: "grandeur", attendu: arrondi2(k.moyenne), calcul: `${qte(k.somme)} ÷ ${qte(k.nombre)} = ${nombreAuCentieme(k.moyenne)}` },
          { libelle: "MAX(Quantite)", nature: "quantite", attendu: k.max, calcul: `La plus grande quantité : ${qte(k.max)}` },
        ];
      },
      explication: () => [`Une requête d'agrégat réduit toute une table à une ligne : ${qte(agregats().somme)} enceintes vendues sur cet extrait, soit ${eur(chiffreDeLExtrait())} hors taxes.`],
    },
    {
      id: "le-regroupement",
      objectifs: [2],
      type: "a-completer",
      titre: "Regrouper par ville",
      tableau: tableJointe,
      question: () => `Complétez le résultat de : SELECT Ville, SUM(Quantite) FROM Client, Commande ${JOINTURE} GROUP BY Ville. Le tableau montre chaque commande avec la ville de son client, comme la jointure la voit.`,
      grille: () => regroupementACompleter(),
      explication: () => {
        const t = villeEnTete();
        return [`GROUP BY fait une ligne par ville, et SUM additionne dans chaque groupe. ${t.ville} vient en tête, avec ${qte(t.enceintes)} enceintes. Le total retrouve celui de toute la table.`];
      },
    },
    {
      id: "trier",
      objectifs: [2],
      type: "choix",
      titre: "Trier le résultat",
      question: () => "On ajoute ORDER BY SUM(Quantite) DESC à la requête de regroupement. Quelle ville la première ligne du résultat montre-t-elle ?",
      options: () => {
        const t = villeEnTete();
        const v = enceintesParVille();
        const premiere = v[0]!;
        const derniere = [...v].sort((a, b) => a.enceintes - b.enceintes)[0]!;
        return [
          { texte: t.ville, juste: true, retour: `Oui : DESC trie du plus grand au plus petit, et ${t.ville} totalise ${qte(t.enceintes)} enceintes. Sans DESC, le tri irait du plus petit au plus grand.` },
          { texte: `${premiere.ville}, la première ville de la table Client`, juste: false, retour: `Non : ${premiere.ville} totalise ${qte(premiere.enceintes)} enceintes. ORDER BY trie sur la somme, pas sur l'ordre de la table.` },
          { texte: `${derniere.ville}, qui a la plus petite somme`, juste: false, retour: `Non : ${derniere.ville} viendrait en tête sans DESC, avec ${qte(derniere.enceintes)} enceinte. DESC met la plus grande somme en premier.` },
        ];
      },
    },
    {
      id: "le-laboratoire-du-critere",
      objectifs: [3],
      type: "simulation",
      titre: "Le critère qui répond au besoin",
      question: () => `Le président veut appeler les meilleurs clients pour les remercier, mais le moins possible d'entre eux. Il garde les commandes de Quantite >= s. Faites varier s dans la requête : SELECT * FROM Commande WHERE Quantite >= s. L'extrait fait ${eur(chiffreDeLExtrait())} de chiffre d'affaires, à ${eur(PRIX_HT)} l'enceinte.`,
      leviers: () => [{ code: "seuil", libelle: "Valeur de s dans la condition", unite: "enceintes", min: 1, max: 6, pas: 1, depart: 1 }],
      lecture: (_c, p) => {
        const k = commandesDAuMoins(p.seuil ?? 1);
        return [
          { libelle: "Lignes renvoyées", montant: k.lignes, unite: "lignes" },
          { libelle: "Enceintes de ces commandes", montant: k.enceintes, unite: "enceintes" },
          { libelle: "Chiffre d'affaires de ces commandes", montant: k.chiffre, reference: chiffreDeLExtrait(), fort: true },
        ];
      },
      defi: () => {
        const moitie = chiffreDeLExtrait() / 2;
        const garde = (s: number) => commandesDAuMoins(s).chiffre >= moitie;
        return {
          consigne: "Trouvez la plus grande valeur de s qui garde encore au moins la moitié du chiffre d'affaires de l'extrait.",
          atteint: (p) => garde(p.seuil ?? 1) && !garde((p.seuil ?? 1) + 1),
          indice: (p) => (garde(p.seuil ?? 1) ? "Vous gardez plus de la moitié : un critère plus strict la garderait-il encore ?" : "Trop strict : moins de la moitié du chiffre d'affaires reste. Baissez s."),
          solution: { seuil: seuilDeLaMoitie() },
        };
      },
      montrer: "Montrer le critère",
      explication: () => {
        const k = commandesDAuMoins(seuilDeLaMoitie());
        return [`Avec Quantite >= ${qte(seuilDeLaMoitie())}, ${qte(k.lignes)} commandes sur ${qte(COMMANDES.length)} font ${eur(k.chiffre)}, plus de la moitié du chiffre d'affaires. Le critère se choisit d'après la question de gestion, puis la requête se vérifie sur son résultat.`];
      },
    },
    {
      id: "les-traces",
      type: "lecture",
      titre: "Les traces numériques",
      texte: () => [
        "Chaque visite du site laisse des traces : les pages vues, le temps passé, le panier abandonné, l'appareil utilisé. Les cookies et les journaux de connexion les enregistrent. Mises en relation avec les commandes, elles deviennent une information : quel client hésite, quelle page fait fuir.",
        "Les traces servent aussi la publicité ciblée. Les cookies qui ne sont pas nécessaires au site, comme ceux de la publicité, demandent l'accord de l'internaute, aussi facile à refuser qu'à donner.",
      ],
      repere: () => "Traces numériques : cookies, journaux de connexion · mises en relation, elles produisent de l'information · l'accord de l'internaute pour les cookies non nécessaires.",
    },
    {
      id: "utiliser-les-traces",
      objectifs: [4],
      type: "choix",
      titre: "Ce que les traces permettent",
      question: (c) => `${c.entreprise} relie les paniers abandonnés de son site aux comptes de ses clients. Que peut-elle en tirer, en respectant la loi ?`,
      options: () => [
        { texte: "Repérer l'étape où les clients abandonnent, et la simplifier", juste: true, retour: "Oui : la mise en relation des traces produit une information utile au site. Pour relancer un client par courriel, il faudrait en plus son accord." },
        { texte: "Vendre les traces à d'autres sites, sans rien demander, puisqu'elles sont anonymes", juste: false, retour: "Non : reliées à un compte, elles ne sont plus anonymes, et leur vente demanderait l'accord des personnes." },
        { texte: "Rien : une trace ne contient aucune donnée", juste: false, retour: "Non : une trace est une donnée, souvent personnelle." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const t = villeEnTete();
        return [
          `SELECT, FROM et WHERE choisissent les colonnes, la table et les lignes ; AND, OR et les opérateurs relationnels écrivent la condition. La jointure relie les tables par leur clé. COUNT, SUM, AVG et MAX résument, GROUP BY regroupe et ORDER BY trie. Sur la base de ${c.entreprise}, ${t.ville} vient en tête, avec ${qte(t.enceintes)} enceintes.`,
          "Dans l'arène, quelle requête écririez-vous sur vos tours pour savoir lequel a le mieux vendu ?",
        ];
      },
      repere: () => "SELECT · FROM · WHERE · =, <>, >= · AND, OR, NOT · jointure par la clé · COUNT, SUM, AVG, MAX · GROUP BY · ORDER BY · traces numériques.",
    },
  ],
};
