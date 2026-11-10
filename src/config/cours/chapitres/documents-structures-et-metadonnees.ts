import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DES_DOCUMENTS, GED, RECHERCHE, commandeDuComite, gainDUneRecherche, gainDesRecherches, recherchesQuiPaientLaGed, referenceDe } from "../monde/documents-de-maille";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : DOCUMENTS STRUCTURÉS, BALISAGE, MÉTADONNÉES ET INDEXATION (Bac STMG, enseignement spécifique
 * de systèmes d'information de gestion de terminale, thème 4, question 4.1 : « La standardisation
 * favorise-t-elle la circulation des informations ? »).
 *
 * La numérisation, la structuration et l'indexation d'un document ; le langage de balisage (XML, HTML) :
 * élément, balise ouvrante et fermante, attribut ; lire un fichier balisé et en tirer une information ;
 * séparer le contenu, sa présentation et ses métadonnées ; l'hyperlien, la syndication et le
 * référencement ; la gestion électronique des documents, ses fonctions et son moteur de recherche,
 * chiffrée au curseur ; la standardisation des échanges. Tout se corrige au serveur.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez MAILLE & CO : monde/documents-de-maille.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

const COL_ROND = () => referenceDe("col-rond");

/** La fiche produit du site, en XML : la balise fermante du prix manque. */
const laFicheProduit = (): TableauDeDonnees => ({
  titre: "La fiche produit du pull col rond, en XML",
  colonnes: ["Contenu du fichier"],
  lignes: [
    `<produit reference="${COL_ROND().code}">`,
    `<nom>${COL_ROND().nom}</nom>`,
    `<prix devise="EUR">${qte(COL_ROND().prixTtc)}`,
    "<couleur>Écru</couleur>",
    "<couleur>Marine</couleur>",
    "</produit>",
  ].map((l, i) => ({ libelle: `Ligne ${qte(i + 1)}`, valeurs: [l] })),
});

/** La commande du comité d'entreprise, reçue en XML. */
const laCommandeDuComite = (): TableauDeDonnees => {
  const k = commandeDuComite();
  return {
    titre: "La commande du comité d'entreprise, reçue en XML",
    colonnes: ["Contenu du fichier"],
    lignes: [
      '<commande client="Comité des Laboratoires Morel">',
      ...k.lignes.map((l) => `<ligne reference="${l.reference}" quantite="${l.quantite}" prixHt="${l.prixHt}"/>`),
      "</commande>",
    ].map((l, i) => ({ libelle: `Ligne ${qte(i + 1)}`, valeurs: [l] })),
  };
};

export const DOCUMENTS_STRUCTURES_ET_METADONNEES: Chapitre = {
  code: "documents-structures-et-metadonnees",
  parcours: "stmg-sig",
  palier: 1,
  blocs: ["STMG Thème 4 · Système d'information et échange"],
  titre: "Documents structurés : balisage, métadonnées et indexation",
  accroche:
    "Une fiche produit pour le site, une commande qui arrive en fichier, des factures de façonniers rangées dans des classeurs : chez MAILLE & CO, ce qu'apportent une structure commune, des balises, des métadonnées et une gestion des documents.",
  objectifs: [
    "Distinguer numérisation, structuration et indexation",
    "Lire et compléter un fichier balisé",
    "Séparer le contenu, sa présentation et ses métadonnées",
    "Expliquer l'hyperlien, la syndication et le référencement",
    "Chiffrer l'apport d'une gestion électronique des documents",
    "Dire ce que la standardisation apporte aux échanges",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DES_DOCUMENTS, pourquoi: "ce chapitre range et échange les documents de MAILLE & CO." },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Des documents qui circulent",
      texte: (c) => [
        `${c.entreprise} produit et reçoit des documents de toutes sortes. Les factures et les bons de livraison des façonniers sont sur papier ; les fiches de ses pulls, sur son site ; les commandes du comité d'entreprise des Laboratoires Morel arrivent en fichier.`,
        "Pour qu'un document circule et se retrouve, il faut une structure précise et commune, que les machines comme les personnes savent lire. C'est l'objet de la standardisation.",
      ],
      repere: () => "Un document se numérise, se structure, s'indexe, puis circule et se retrouve.",
    },
    {
      id: "trois-operations",
      objectifs: [0],
      type: "tri",
      titre: "Numériser, structurer, indexer",
      question: () => "Rangez chaque opération.",
      categories: [
        { code: "numerisation", libelle: "Numérisation" },
        { code: "structuration", libelle: "Structuration" },
        { code: "indexation", libelle: "Indexation" },
      ],
      elements: () => [
        { libelle: "Scanner la facture papier d'un façonnier", montant: 0, categorie: "numerisation", pourquoi: "Le papier devient un fichier : la numérisation." },
        { libelle: "Découper la fiche d'un pull en nom, prix et couleurs", montant: 0, categorie: "structuration", pourquoi: "Chaque information a sa place, nommée : la structuration." },
        { libelle: "Associer à la facture le façonnier, la date et le montant", montant: 0, categorie: "indexation", pourquoi: "Des mots-clés pour la retrouver : l'indexation." },
        { libelle: "Ajouter les mots-clés « laine » et « hiver » à la fiche du pull", montant: 0, categorie: "indexation", pourquoi: "Le moteur de recherche la trouvera par ces mots." },
      ],
      relance: "L'opération change-t-elle le support, range-t-elle le contenu, ou aide-t-elle à le retrouver ?",
      explication: () => ["Une image scannée n'est que numérisée : la machine n'y lit rien. Structurée et indexée, la même information se calcule, se cherche et s'échange."],
    },
    {
      id: "le-balisage",
      type: "lecture",
      titre: "Un langage de balisage",
      tableau: laFicheProduit,
      texte: () => [
        "Un langage de balisage structure un document par des balises. Un élément s'ouvre par une balise <nom> et se ferme par </nom> ; son contenu est entre les 2. Un attribut précise une balise ouvrante : devise=\"EUR\". Les éléments s'emboîtent : les couleurs sont dans le produit.",
        "XML sert à échanger des données entre logiciels ; HTML décrit les pages Web. Un langage de définition de documents (un schéma) fixe les éléments permis et leur ordre : 2 logiciels qui suivent le même schéma se comprennent.",
      ],
      repere: () => "Élément · balise ouvrante <x> et fermante </x> · attribut · emboîtement · XML pour échanger, HTML pour les pages · un schéma commun.",
    },
    {
      id: "la-balise-qui-manque",
      objectifs: [1],
      type: "choix",
      titre: "La balise qui manque",
      tableau: laFicheProduit,
      question: () => "Le logiciel du site refuse la fiche : un élément n'est pas fermé. Que faut-il écrire à la fin de la ligne 3 ?",
      options: () => [
        { texte: "</prix>", juste: true, retour: "Oui : chaque élément ouvert se ferme, avec le même nom précédé d'une barre oblique. La fiche est alors bien formée, et le logiciel la lit." },
        { texte: "<prix>, pour ouvrir de nouveau l'élément du prix", juste: false, retour: "Non : c'est une balise ouvrante ; l'élément resterait ouvert." },
        { texte: "</produit>, puisque le produit est fini", juste: false, retour: "Non : le produit se ferme à la ligne 6, après ses couleurs. Les éléments se ferment dans l'ordre inverse où ils s'ouvrent." },
      ],
    },
    {
      id: "lire-la-commande",
      objectifs: [1],
      type: "montants",
      titre: "Lire un fichier balisé",
      tableau: laCommandeDuComite,
      question: () => "La commande du comité arrive en XML. Lisez-la : combien d'articles commande-t-il, et quel est le montant hors taxes de la commande ?",
      champs: () => {
        const k = commandeDuComite();
        return [
          { libelle: "Articles commandés", attendu: k.articles, calcul: `${k.lignes.map((l) => qte(l.quantite)).join(" + ")} = ${qte(k.articles)}` },
          { libelle: "Montant hors taxes", attendu: k.total, calcul: `${k.lignes.map((l) => `${qte(l.quantite)} × ${eur(l.prixHt)}`).join(" + ")} = ${eur(k.total)}` },
        ];
      },
      explication: () => [`Chaque ligne porte ses données dans des attributs nommés : un logiciel la lit sans erreur, et la commande de ${eur(commandeDuComite().total)} entre dans la caisse sans être ressaisie.`],
    },
    {
      id: "contenu-presentation-metadonnees",
      objectifs: [2],
      type: "tri",
      titre: "Le contenu, sa présentation, ses métadonnées",
      question: () => "Dans la page Web du pull col rond, rangez chaque élément.",
      categories: [
        { code: "contenu", libelle: "Le contenu, en HTML" },
        { code: "presentation", libelle: "La présentation, en CSS" },
        { code: "metadonnee", libelle: "Une métadonnée" },
      ],
      elements: () => [
        { libelle: `<h1>${COL_ROND().nom}</h1>`, montant: 0, categorie: "contenu", pourquoi: "Un titre de la page : le contenu, structuré par HTML." },
        { libelle: "<p>Tricoté en France, en laine douce</p>", montant: 0, categorie: "contenu", pourquoi: "Un paragraphe : du contenu." },
        { libelle: "Les titres en bleu marine et en gras", montant: 0, categorie: "presentation", pourquoi: "L'apparence : une feuille de style, à part du contenu." },
        { libelle: "La description de la page, écrite pour les moteurs de recherche", montant: 0, categorie: "metadonnee", pourquoi: "Une donnée sur la page, que le moteur de recherche lit : une métadonnée." },
        { libelle: "La date de mise en ligne et l'auteur de la fiche", montant: 0, categorie: "metadonnee", pourquoi: "Des données qui décrivent le document lui-même." },
      ],
      relance: "L'élément dit-il ce que contient la page, comment elle s'affiche, ou décrit-il la page elle-même ?",
      explication: () => ["Séparer le contenu de sa présentation permet de changer l'apparence du site sans toucher aux fiches, et d'afficher la même fiche sur un téléphone ou un ordinateur."],
    },
    {
      id: "hyperlien-syndication-referencement",
      type: "lecture",
      titre: "Liens, flux et référencement",
      texte: () => [
        "Un hyperlien relie un document à un autre : la fiche du pull renvoie au guide des tailles. La syndication publie les nouveautés d'un site dans un flux (RSS, par exemple), que d'autres sites ou des lecteurs reprennent automatiquement.",
        "Le référencement fait trouver le site par les moteurs de recherche. Le référencement naturel tient aux contenus : un titre et une description justes, des mots-clés utiles, des liens venus d'autres sites. Le référencement payant achète des annonces.",
      ],
      repere: () => "Hyperlien · syndication, un flux de nouveautés · référencement naturel ou payant · métadonnées.",
    },
    {
      id: "le-titre-de-la-page",
      objectifs: [3],
      type: "choix",
      titre: "Le titre qui fait trouver la page",
      question: () => `Quel titre (la balise <title>) donner à la page du pull col rond, pour que les moteurs de recherche la proposent à qui cherche un pull en laine ?`,
      options: (c) => [
        { texte: `${COL_ROND().nom} en laine · ${c.entreprise}`, juste: true, retour: "Oui : un titre court, qui dit ce que la page contient, avec les mots que les clientes tapent. Le moteur le lit, et l'affiche dans ses résultats." },
        { texte: "Pull pull pull laine laine pas cher pas cher soldes soldes", juste: false, retour: "Non : répéter des mots-clés trompe le lecteur, et les moteurs pénalisent ce bourrage." },
        { texte: "Page 12", juste: false, retour: "Non : ce titre ne dit rien du contenu, ni au moteur ni à la cliente." },
      ],
    },
    {
      id: "la-syndication",
      objectifs: [3],
      type: "choix",
      titre: "Faire connaître les nouveautés",
      question: (c) => `${c.entreprise} veut que chaque nouveau modèle publié sur son site apparaisse aussitôt sur le site d'un blog de tricot qui la soutient. Quelle solution choisir ?`,
      options: () => [
        { texte: "Un flux de syndication que le blog reprend", juste: true, retour: "Oui : le flux publie chaque nouveauté dans un format standard ; le blog l'affiche sans rien recopier." },
        { texte: "Envoyer au blog une copie de chaque fiche, à la main, chaque fois qu'un modèle sort", juste: false, retour: "Non : c'est ce que la syndication évite, et un oubli est vite arrivé." },
        { texte: "Acheter une annonce au moteur de recherche", juste: false, retour: "Non : c'est du référencement payant, qui ne publie rien sur le blog." },
      ],
    },
    {
      id: "la-ged",
      type: "lecture",
      titre: "La gestion électronique des documents",
      texte: () => [
        "Une gestion électronique des documents (GED) acquiert les documents (scan, import), les indexe, les stocke, permet de les rechercher, les diffuse aux bonnes personnes et les archive le temps voulu. Son moteur de recherche lit les index, et souvent le texte lui-même.",
        `Aujourd'hui, retrouver une facture d'un façonnier dans les classeurs prend ${qte(RECHERCHE.minutesSurPapier)} minutes ; dans la GED, ${qte(RECHERCHE.minutesAvecLaGed)} minute.`,
      ],
      repere: () => "GED : acquérir, indexer, stocker, rechercher, diffuser, archiver.",
    },
    {
      id: "indexer-la-facture",
      objectifs: [0],
      type: "choix",
      titre: "Indexer une facture",
      question: () => "Quelles métadonnées associer à une facture de façonnier pour la retrouver vite ?",
      options: () => [
        { texte: "Le façonnier, la date, le numéro et le montant", juste: true, retour: "Oui : ce sont les critères par lesquels on la cherche. Une recherche « façonnier de référence, mars » la trouve aussitôt." },
        { texte: "La couleur du papier et le nombre de pages, pour la décrire le plus fidèlement possible", juste: false, retour: "Non : personne ne cherche une facture par ces critères." },
        { texte: "Aucune : le nom du fichier suffit", juste: false, retour: "Non : un nom comme « scan_0412 » ne dit rien. L'indexation fait le travail." },
      ],
    },
    {
      id: "le-curseur-de-la-ged",
      objectifs: [4],
      type: "curseur",
      titre: "À partir de combien de recherches ?",
      question: () =>
        `Chaque recherche dans la GED fait gagner ${qte(RECHERCHE.minutesSurPapier - RECHERCHE.minutesAvecLaGed)} minutes, à ${eur(RECHERCHE.coutHoraire)} de l'heure : ${eur(gainDUneRecherche())}. La GED coûte ${eur(GED.parMois)} par mois. Faites varier les recherches du mois. Placez le curseur sur le premier nombre de recherches qui paie la GED.`,
      cible: () => ({ attendu: recherchesQuiPaientLaGed(), max: 40 }),
      grandeur: () => ({ libelle: "Documents recherchés dans le mois", unite: "recherches" }),
      rates: () => ({ dessous: "Pas encore : la GED coûte plus que le temps gagné.", dessus: "La GED est payée, mais une recherche de moins suffisait-elle déjà ?" }),
      zones: ["GED payée", "GED non payée"],
      montrer: "Montrer le nombre de recherches",
      lecture: (_c, n) => [
        { libelle: "Temps gagné, en euros", montant: gainDesRecherches(n), fort: true },
        { libelle: "Abonnement de la GED", montant: GED.parMois },
      ],
      droites: () => ({ produit: (n) => gainDesRecherches(n), cout: () => GED.parMois, libelles: ["Temps gagné", "Abonnement"] }),
      explication: () => [`La GED se paie dès ${qte(recherchesQuiPaientLaGed())} recherches par mois. Elle apporte aussi ce qui ne se chiffre pas ici : un document qui ne se perd plus, et qui se partage à distance.`],
    },
    {
      id: "standardiser",
      objectifs: [5],
      type: "choix",
      titre: "Un format commun",
      question: (c) => `Les façonniers de ${c.entreprise} envoient chacun leurs factures dans leur propre format. Que changerait un format standard, comme celui de la facture électronique ?`,
      options: () => [
        { texte: "La facture entrerait dans les comptes sans ressaisie", juste: true, retour: "Oui : un format commun, structuré et balisé, se lit par tous les logiciels. Moins de saisie, moins d'erreurs, des échanges plus rapides." },
        { texte: "Rien : chaque façonnier garderait son format, et la boutique s'adapterait à chacun", juste: false, retour: "Non : sans standard, chaque format demande un traitement, souvent à la main." },
        { texte: "Les factures deviendraient illisibles pour les personnes", juste: false, retour: "Non : un logiciel les affiche ; le format sert d'abord aux échanges entre machines." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => [
        `Chez ${c.entreprise}, un document se numérise, se structure par des balises, et s'indexe par des métadonnées. La commande du comité, balisée en XML, se lit sans ressaisie : ${eur(commandeDuComite().total)}. Le contenu se sépare de sa présentation ; liens, flux et référencement font circuler l'information. La GED se paie dès ${qte(recherchesQuiPaientLaGed())} recherches par mois.`,
        "Dans l'arène, si vous archivez chaque tour, quelles métadonnées donnerez-vous à chaque fichier pour le retrouver ?",
      ],
      repere: () => "Numérisation, structuration, indexation · balises, éléments, attributs · XML, HTML, CSS · métadonnées · hyperlien, syndication, référencement · GED · standard d'échange.",
    },
  ],
};
