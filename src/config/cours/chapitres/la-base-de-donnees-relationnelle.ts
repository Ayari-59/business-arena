import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import {
  CLIENTS,
  COLONNES,
  COMMANDES,
  ENTREPRISES_DE_LA_BASE,
  GAMME,
  casesDeLaTableUnique,
  casesDesDeuxTables,
  commandesDe,
  commandesOuLesDeuxTablesGagnent,
} from "../monde/base-de-donnees-de-nova";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LA BASE DE DONNÉES RELATIONNELLE, TABLES, CLÉS ET INTÉGRITÉ (Bac STMG, enseignement
 * spécifique de systèmes d'information de gestion de terminale, thème 3, question 3.1 : « Comment
 * peut-on produire de l'information à partir de données ? »).
 *
 * Les sources de données ; la base de données ; le modèle relationnel : relation, attribut, domaine,
 * clé primaire et clé étrangère, schéma relationnel, dépendance fonctionnelle ; les contraintes de clé,
 * de domaine et d'intégrité référentielle ; la redondance qu'évite le modèle, au laboratoire, et
 * l'anomalie de mise à jour ; adapter le schéma à un besoin nouveau ; les données massives, les lacs de
 * données et les analyses qu'elles permettent. « Interroger la base en SQL » interroge la même base, et
 * « Des données à l'information » fait à la main ce que fait une requête.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : monde/base-de-donnees-de-nova.ts.
 */

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");

export const tableClient = (): TableauDeDonnees => ({
  titre: "La table Client",
  colonnes: ["NumClient", "Nom", "Ville"],
  lignes: CLIENTS.map((c, i) => ({ libelle: qte(i + 1), valeurs: [c.numClient, c.nom, c.ville] })),
});

export const tableCommande = (): TableauDeDonnees => ({
  titre: "La table Commande",
  colonnes: ["NumCommande", "DateCommande", "Quantite", "NumClient"],
  lignes: COMMANDES.map((c, i) => ({ libelle: qte(i + 1), valeurs: [qte(c.numCommande), c.date, qte(c.quantite), c.numClient] })),
});

const SCHEMA = "Client (NumClient, Nom, Ville) · Commande (NumCommande, DateCommande, Quantite, #NumClient)";

export const LA_BASE_DE_DONNEES_RELATIONNELLE: Chapitre = {
  code: "la-base-de-donnees-relationnelle",
  parcours: "stmg-sig",
  palier: 1,
  blocs: ["STMG Thème 3 · Information, action et décision"],
  titre: "La base de données relationnelle : tables, clés et intégrité",
  accroche:
    "Les clients et les commandes du site de NOVA, rangés dans 2 tables reliées par une clé : le modèle relationnel, ses règles, ce qu'il évite d'écrire 2 fois, et comment l'adapter quand NOVA vend toute sa gamme.",
  objectifs: [
    "Repérer les sources de données d'une organisation",
    "Lire un schéma relationnel : relation, attribut, domaine, clés",
    "Repérer une contrainte d'intégrité qui n'est pas respectée",
    "Mesurer la redondance qu'évite le modèle relationnel",
    "Adapter le schéma à un besoin de gestion nouveau",
    "Distinguer les analyses que permettent les données massives",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_BASE, pourquoi: "ce chapitre lit la base de données du site de NOVA." },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "D'où viennent les données",
      texte: (c) => [
        `${c.entreprise} reçoit des données de partout : les commandes de son site, celles de CampusTech, les capteurs de sa ligne de montage, les chiffres publiés par l'Insee sur la population. Pour en tirer une information, il faut d'abord les ranger.`,
        "Une base de données est une collection de données organisées pour être facilement consultées et mises à jour. Un système de gestion de base de données (SGBD) la tient, et répond aux requêtes.",
      ],
      repere: () => "Des sources variées · une base de données organisée · un SGBD qui la tient et l'interroge.",
    },
    {
      id: "les-sources",
      objectifs: [0],
      type: "tri",
      titre: "Les sources de données",
      question: () => "Rangez chaque donnée selon sa source.",
      categories: [
        { code: "interne", libelle: "Le système d'information de NOVA" },
        { code: "partenaire", libelle: "Un partenaire" },
        { code: "ouverte", libelle: "Des données ouvertes" },
        { code: "objet", libelle: "Un objet connecté" },
      ],
      elements: () => [
        { libelle: "Les commandes passées sur le site", montant: 0, categorie: "interne", pourquoi: "NOVA les produit elle-même." },
        { libelle: "Les ventes de NOVA One dans les magasins de CampusTech", montant: 0, categorie: "partenaire", pourquoi: "Une source externe : le client professionnel les transmet." },
        { libelle: "La population des communes, publiée par l'Insee", montant: 0, categorie: "ouverte", pourquoi: "Des données publiques, libres de réutilisation." },
        { libelle: "La température relevée sur le poste de soudure", montant: 0, categorie: "objet", pourquoi: "Un capteur connecté de la ligne de montage." },
      ],
      relance: "Qui produit la donnée : NOVA, un partenaire, le service public, ou une machine ?",
      explication: () => ["Plus les sources sont variées, plus il faut des règles pour ranger les données ensemble : c'est le rôle du modèle relationnel."],
    },
    {
      id: "le-modele",
      type: "lecture",
      titre: "Le modèle relationnel",
      tableau: tableClient,
      texte: () => [
        "Le modèle relationnel range les données en relations, ou tables. Chaque colonne est un attribut (Nom, Ville) ; chaque ligne décrit un client. Un attribut prend ses valeurs dans un domaine : la quantité, dans les nombres entiers positifs.",
        "La clé primaire identifie chaque ligne : 2 lignes ne peuvent pas avoir la même. Une clé étrangère, notée #, reprend dans une table la clé primaire d'une autre et les relie. Le schéma relationnel s'écrit : " + SCHEMA + ".",
      ],
      repere: () => "Relation · attribut · domaine · clé primaire (soulignée) · clé étrangère (#) · schéma relationnel.",
    },
    {
      id: "le-vocabulaire",
      objectifs: [1],
      type: "tri",
      titre: "Le vocabulaire du schéma",
      question: () => `Dans le schéma ${SCHEMA}, rangez chaque élément.`,
      categories: [
        { code: "relation", libelle: "Une relation" },
        { code: "attribut", libelle: "Un simple attribut" },
        { code: "primaire", libelle: "Une clé primaire" },
        { code: "etrangere", libelle: "Une clé étrangère" },
      ],
      elements: () => [
        { libelle: "Commande", montant: 0, categorie: "relation", pourquoi: "Une table entière : une relation." },
        { libelle: "Ville, dans Client", montant: 0, categorie: "attribut", pourquoi: "Une propriété du client, qui n'identifie rien : un attribut." },
        { libelle: "NumClient, dans Client", montant: 0, categorie: "primaire", pourquoi: "Il identifie chaque client : la clé primaire." },
        { libelle: "NumCommande, dans Commande", montant: 0, categorie: "primaire", pourquoi: "Il identifie chaque commande." },
        { libelle: "#NumClient, dans Commande", montant: 0, categorie: "etrangere", pourquoi: "Il renvoie au client de la commande : une clé étrangère." },
      ],
      relance: "L'élément est-il une table, une propriété, ce qui identifie une ligne, ou ce qui renvoie à une autre table ?",
      explication: () => ["Le même attribut, NumClient, est clé primaire dans Client et clé étrangère dans Commande : c'est lui qui relie les 2 tables."],
    },
    {
      id: "la-cle-de-commande",
      objectifs: [1],
      type: "choix",
      titre: "Pourquoi pas la date ?",
      tableau: tableCommande,
      question: () => "Pourquoi la date ne peut-elle pas être la clé primaire de la table Commande ?",
      options: () => [
        { texte: "Plusieurs commandes ont la même date", juste: true, retour: "Oui : le 2 mai, 2 commandes ont été passées. Une clé primaire doit être unique : c'est pourquoi on numérote chaque commande." },
        { texte: "Parce qu'une date n'est pas une donnée de gestion, elle ne sert à rien dans la base", juste: false, retour: "Non : la date est utile, c'est un attribut. Elle n'identifie simplement pas une commande." },
        { texte: "Parce qu'une clé doit être un nom", juste: false, retour: "Non : une clé peut être un nombre, un code, un texte, pourvu qu'elle soit unique." },
      ],
    },
    {
      id: "la-dependance",
      objectifs: [1],
      type: "choix",
      titre: "La dépendance fonctionnelle",
      tableau: tableClient,
      question: () => "Un attribut en détermine un autre (une dépendance fonctionnelle) quand chacune de ses valeurs ne donne qu'une valeur de l'autre. Laquelle est vraie dans la table Client ?",
      options: () => [
        { texte: "NumClient donne Ville", juste: true, retour: "Oui : connaissant le numéro d'un client, on connaît sa ville, une seule. On l'écrit NumClient → Ville. C'est la clé primaire qui donne tous les autres attributs." },
        { texte: "Ville donne NumClient", juste: false, retour: "Non : Lyon correspond à 2 clients, C01 et C04. Une ville ne donne pas un client." },
        { texte: "Nom donne NumClient, toujours, même quand 2 clients s'appellent pareil", juste: false, retour: "Non : 2 clients peuvent porter le même nom. C'est pour cela qu'on les numérote." },
      ],
    },
    {
      id: "les-contraintes",
      objectifs: [2],
      type: "tri",
      titre: "Les contraintes d'intégrité",
      question: () => "Le SGBD refuse chacune de ces saisies. Rangez-les selon la contrainte qu'elles violent.",
      categories: [
        { code: "cle", libelle: "Contrainte de clé" },
        { code: "domaine", libelle: "Contrainte de domaine" },
        { code: "referentielle", libelle: "Intégrité référentielle" },
      ],
      elements: () => [
        { libelle: "Un nouveau client numéroté C04, comme Robert", montant: 0, categorie: "cle", pourquoi: "La clé primaire serait en double." },
        { libelle: "Une commande d'une quantité de −2", montant: 0, categorie: "domaine", pourquoi: "La quantité est un entier positif : hors de son domaine." },
        { libelle: "Une commande datée du 31 février", montant: 0, categorie: "domaine", pourquoi: "Une date qui n'existe pas : hors du domaine des dates." },
        { libelle: "Une commande 111 pour le client C09, qui n'existe pas", montant: 0, categorie: "referentielle", pourquoi: "La clé étrangère renvoie à un client absent : l'intégrité référentielle." },
      ],
      relance: "La saisie double-t-elle une clé, sort-elle des valeurs permises, ou renvoie-t-elle à une ligne qui n'existe pas ?",
      explication: () => ["Ces contraintes protègent la qualité des données dès la saisie : la base refuse ce qui la rendrait fausse."],
    },
    {
      id: "la-redondance",
      objectifs: [3],
      type: "montants",
      titre: "Ce que la table unique répète",
      tableau: tableCommande,
      question: () =>
        `Une table unique garderait, sur chaque commande, le nom et la ville du client : ${qte(COLONNES.tableUnique)} colonnes. Le modèle relationnel garde ${qte(COLONNES.client)} colonnes pour chacun des ${qte(CLIENTS.length)} clients, et ${qte(COLONNES.commande)} pour chacune des ${qte(COMMANDES.length)} commandes. Combien de cases chaque façon écrit-elle ?`,
      champs: () => [
        { libelle: "Cases de la table unique", attendu: casesDeLaTableUnique(COMMANDES.length), calcul: `${qte(COMMANDES.length)} × ${qte(COLONNES.tableUnique)} = ${qte(casesDeLaTableUnique(COMMANDES.length))}` },
        { libelle: "Cases des 2 tables", attendu: casesDesDeuxTables(COMMANDES.length), calcul: `${qte(CLIENTS.length)} × ${qte(COLONNES.client)} + ${qte(COMMANDES.length)} × ${qte(COLONNES.commande)} = ${qte(casesDesDeuxTables(COMMANDES.length))}` },
      ],
      explication: () => ["Dans la table unique, « Grenoble » et « Moreau » s'écrivent à chaque commande de Mme Moreau. Le modèle relationnel les écrit une fois : c'est la redondance qu'il évite."],
    },
    {
      id: "le-laboratoire-des-cases",
      objectifs: [3],
      type: "simulation",
      titre: "À partir de combien de commandes ?",
      question: () => `Les ${qte(CLIENTS.length)} clients restent les mêmes ; faites varier le nombre de leurs commandes.`,
      leviers: () => [{ code: "commandes", libelle: "Commandes enregistrées", unite: "commandes", min: 0, max: 40, pas: 1, depart: 0 }],
      lecture: (_c, p) => {
        const n = p.commandes ?? 0;
        return [
          { libelle: "Cases de la table unique", montant: casesDeLaTableUnique(n), unite: "cases" },
          { libelle: "Cases des 2 tables", montant: casesDesDeuxTables(n), unite: "cases", fort: true },
        ];
      },
      defi: () => {
        const gagne = (n: number) => casesDesDeuxTables(n) < casesDeLaTableUnique(n);
        return {
          consigne: "Trouvez le plus petit nombre de commandes où les 2 tables écrivent moins de cases que la table unique.",
          atteint: (p) => gagne(p.commandes ?? 0) && !gagne((p.commandes ?? 0) - 1),
          indice: (p) => (gagne(p.commandes ?? 0) ? "Les 2 tables gagnent déjà : moins de commandes suffisent-elles ?" : "La table unique écrit encore moins de cases : ajoutez des commandes."),
          solution: { commandes: commandesOuLesDeuxTablesGagnent() },
        };
      },
      graphique: () => ({
        levier: "commandes",
        unite: "cases",
        courbes: [
          { libelle: "Table unique", valeur: (p) => casesDeLaTableUnique(p.commandes ?? 0) },
          { libelle: "2 tables", valeur: (p) => casesDesDeuxTables(p.commandes ?? 0) },
        ],
      }),
      montrer: "Montrer le nombre de commandes",
      explication: () => [`Dès ${qte(commandesOuLesDeuxTablesGagnent())} commandes, les 2 tables écrivent moins. Le site en reçoit plus de mille par mois : l'écart devient énorme, car chaque commande de plus répète le nom et la ville dans la table unique.`],
    },
    {
      id: "la-mise-a-jour",
      objectifs: [3],
      type: "choix",
      titre: "Un client déménage",
      question: () => {
        const n = commandesDe("C06");
        return `Mme Moreau (C06) quitte Grenoble pour Valence. Elle a ${qte(n)} commandes dans l'extrait. Que faut-il corriger ?`;
      },
      options: () => [
        { texte: `1 ligne de Client, au lieu de ${qte(commandesDe("C06"))} lignes de la table unique`, juste: true, retour: "Oui : la ville n'est écrite qu'une fois, dans Client. Dans la table unique, oublier une ligne ferait vivre Mme Moreau dans 2 villes à la fois : une anomalie de mise à jour." },
        { texte: "Toutes ses commandes, dans les 2 tables, et la table Client en plus", juste: false, retour: "Non : la table Commande ne garde pas la ville, seulement le numéro du client." },
        { texte: "Rien : une ville ne change jamais", juste: false, retour: "Non : les clients déménagent, et la base doit suivre." },
      ],
    },
    {
      id: "adapter-le-schema",
      objectifs: [4],
      type: "choix",
      titre: "Toute la gamme",
      question: (c) => `${c.entreprise} vend désormais sa gamme : ${GAMME.map((r) => `${r.nom} à ${eur(r.prix)}`).join(", ")}. Comment adapter le schéma pour savoir quelle enceinte chaque commande contient ?`,
      options: () => [
        { texte: "Ajouter une relation Produit et #RefProduit dans Commande", juste: true, retour: "Oui : Produit (RefProduit, Designation, PrixHT) garde chaque enceinte une fois, avec son prix ; la clé étrangère #RefProduit relie chaque commande à son produit." },
        { texte: "Ajouter dans Client une colonne par enceinte, avec le nom et le prix écrits à chaque fois", juste: false, retour: "Non : le prix se répéterait sur chaque client, et une commande ne dirait toujours pas ce qu'elle contient." },
        { texte: "Créer une base de données par enceinte", juste: false, retour: "Non : les commandes et les clients seraient éparpillés, et les totaux impossibles." },
      ],
    },
    {
      id: "donnees-massives",
      type: "lecture",
      titre: "Les données massives et les lacs de données",
      texte: () => [
        "Toutes les données ne tiennent pas dans des tables : des avis rédigés, des photos, des relevés de capteurs à chaque seconde. Les données massives se distinguent par leur volume, leur variété et la vitesse à laquelle elles arrivent.",
        "Un lac de données les garde toutes, brutes, quel que soit leur format, pour les analyser ensuite. Le forage de données y cherche des liens que personne n'avait vus. Les analyses vont du constat à la recommandation.",
      ],
      repere: () => "Données massives : volume, variété, vitesse · lac de données · analyses descriptives, diagnostiques, prédictives, prescriptives.",
    },
    {
      id: "les-analyses",
      objectifs: [5],
      type: "tri",
      titre: "4 sortes d'analyses",
      question: () => "Rangez chaque question selon l'analyse qui y répond.",
      categories: [
        { code: "descriptive", libelle: "Descriptive" },
        { code: "diagnostique", libelle: "Diagnostique" },
        { code: "predictive", libelle: "Prédictive" },
        { code: "prescriptive", libelle: "Prescriptive" },
      ],
      elements: () => [
        { libelle: "Combien d'enceintes avons-nous vendues en mai ?", montant: 0, categorie: "descriptive", pourquoi: "Ce qui s'est passé : l'analyse descriptive." },
        { libelle: "Pourquoi les ventes de février ont-elles baissé ?", montant: 0, categorie: "diagnostique", pourquoi: "Pourquoi c'est arrivé : l'analyse diagnostique." },
        { libelle: "Combien en vendrons-nous en décembre ?", montant: 0, categorie: "predictive", pourquoi: "Ce qui va se passer : l'analyse prédictive." },
        { libelle: "Quel prix fixer pour Noël ?", montant: 0, categorie: "prescriptive", pourquoi: "Ce qu'il faut faire : l'analyse prescriptive." },
      ],
      relance: "La question porte-t-elle sur ce qui s'est passé, pourquoi, ce qui va se passer, ou ce qu'il faut faire ?",
      explication: () => ["Chaque analyse s'appuie sur la précédente : on ne recommande bien qu'après avoir décrit et compris."],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => [
        `La base du site de ${c.entreprise} range ses données en 2 relations reliées par une clé étrangère. Chaque table a une clé primaire unique ; la base refuse une clé en double, une valeur hors de son domaine, ou une commande sans client. Dès ${qte(commandesOuLesDeuxTablesGagnent())} commandes, le modèle relationnel écrit moins que la table unique, et un déménagement ne se corrige qu'une fois.`,
        "Dans l'arène, si vous gardez vos tours dans un tableur, quelle colonne identifie chaque ligne ?",
      ],
      repere: () => "Sources de données · relation, attribut, domaine · clé primaire, clé étrangère · dépendance fonctionnelle · contraintes de clé, de domaine, référentielle · redondance · lacs de données.",
    },
  ],
};
