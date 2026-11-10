import { eur, qte } from "../../../pedagogy/cours/deux-decimales";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import {
  CALCUL_A_LA_MAIN,
  DEVELOPPEMENT,
  ENTREPRISES_DU_PROGRAMME,
  REGLE,
  TICKETS_DE_MME_LAURENT,
  bonAvecLArrondi,
  bonDuMois,
  bonsUnAUn,
  calculALaMain,
  deroule,
  moisQuiPaientLeProgramme,
  pointsDesTickets,
} from "../monde/programme-de-fidelite-de-maille";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : AUTOMATISER UN TRAITEMENT, VARIABLES, TESTS, BOUCLES ET FONCTIONS (Bac STMG, enseignement
 * spécifique de systèmes d'information de gestion de terminale, thème 3, question 3.2 : « La résolution
 * de tous les problèmes de gestion est-elle automatisable ? »).
 *
 * Par des étapes guidées, sans type d'étape nouveau (décision du propriétaire, novembre 2026) : lire un
 * programme écrit en langage algorithmique, dérouler sa boucle à la main dans un tableau à compléter,
 * choisir la condition qui manque, lire ce qu'il renvoie. Les constantes, les variables et les
 * paramètres ; les types (entier, flottant, booléen, chaîne de caractères, liste) ; la séquence, le test,
 * la boucle bornée et la boucle « tant que », la fonction ; le jeu d'essai et la mise au point ; ce que
 * l'automatisation fait gagner, au curseur ; l'interface de programmation (API), la bibliothèque, et
 * l'intelligence artificielle. Tout se corrige au serveur.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez MAILLE & CO : monde/programme-de-fidelite-de-maille.ts.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les tours de boucle et les points qui restent sont des
 * quantités, entières, déclarées comme telles.
 */


const LIGNES_DU_PROGRAMME = [
  `VALEUR_DU_BON ← ${REGLE.valeurDuBon}`,
  `POINTS_PAR_BON ← ${REGLE.pointsParBon}`,
  "fonction bonDuMois(tickets, privilege)",
  "points ← 0",
  "pour chaque montant dans tickets",
  "points ← points + ent(montant)",
  "fin pour",
  "si privilege alors",
  `points ← points × ${REGLE.multiplicateurPrivilege}`,
  "fin si",
  "retourner ent(points ÷ POINTS_PAR_BON) × VALEUR_DU_BON",
  "fin fonction",
];

export const leProgramme = (): TableauDeDonnees => ({
  titre: "Le programme des bons de fidélité",
  colonnes: ["Instruction"],
  lignes: LIGNES_DU_PROGRAMME.map((l, i) => ({ libelle: `Ligne ${qte(i + 1)}`, valeurs: [l] })),
});

const pointsLaurent = () => pointsDesTickets(TICKETS_DE_MME_LAURENT);

function boucleACompleter(): TableauACompleter {
  return {
    titre: "La boucle déroulée, tour par tour",
    colonnes: ["montant", "ent(montant)", "points après le tour"],
    lignes: [
      { libelle: "Avant la boucle", cellules: [{ valeur: null }, { valeur: null }, { valeur: 0, unite: "points", horsTotal: true }] },
      ...deroule(TICKETS_DE_MME_LAURENT).map((t) => ({
        libelle: `Tour ${qte(t.tour)}`,
        cellules: [
          { valeur: t.montant, horsTotal: true },
          { valeur: t.entier, saisir: true, unite: "points", horsTotal: true, calcul: `La partie entière de ${eur(t.montant)} : ${qte(t.entier)}`, indice: "ent garde les euros entiers, sans les centimes." },
          { valeur: t.points, saisir: true, unite: "points", horsTotal: true, calcul: `Les points d'avant, plus ${qte(t.entier)} : ${qte(t.points)}`, indice: "La variable points garde ce qu'elle valait au tour d'avant, et on lui ajoute ent(montant)." },
        ],
      })),
    ],
  };
}

export const AUTOMATISER_UN_TRAITEMENT: Chapitre = {
  code: "automatiser-un-traitement",
  parcours: "stmg-sig",
  palier: 1,
  blocs: ["STMG Thème 3 · Information, action et décision"],
  titre: "Automatiser un traitement : variables, tests, boucles et fonctions",
  accroche:
    "Chaque fin de mois, l'adjointe de MAILLE & CO calcule à la main les bons de fidélité. Un programme peut le faire : le lire ligne par ligne, dérouler sa boucle, compléter son test, le tester, et chiffrer ce qu'il fait gagner.",
  objectifs: [
    "Reconnaître les objets d'un programme : constantes, variables, paramètres, types",
    "Dérouler un algorithme à la main : séquence, boucle, test",
    "Compléter la condition d'un test",
    "Tester un programme et le mettre au point",
    "Chiffrer ce que l'automatisation fait gagner",
    "Situer l'apport d'une API et de l'intelligence artificielle",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_PROGRAMME, pourquoi: "ce chapitre automatise le calcul des bons de fidélité de MAILLE & CO." },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une règle de gestion à automatiser",
      texte: (c) => [
        `${c.entreprise} récompense ses clientes : chaque ticket donne autant de points que d'euros entiers dépensés ; les points d'une cliente « Privilège » comptent double ; chaque tranche de ${qte(REGLE.pointsParBon)} points du mois donne un bon de ${eur(REGLE.valeurDuBon)}.`,
        `Aujourd'hui, l'adjointe fait ce calcul à la main pour ${qte(CALCUL_A_LA_MAIN.clientes)} clientes chaque mois. Programmer, c'est traduire la règle de gestion en instructions qu'une machine exécute, puis vérifier que le résultat est juste.`,
      ],
      repere: () => "Programmer : traduire une règle de gestion en algorithme, l'écrire dans un langage, le tester.",
    },
    {
      id: "les-objets",
      objectifs: [0],
      type: "tri",
      titre: "Constante, variable ou paramètre ?",
      tableau: leProgramme,
      question: () => "Rangez chaque objet du programme.",
      categories: [
        { code: "constante", libelle: "Constante" },
        { code: "variable", libelle: "Variable" },
        { code: "parametre", libelle: "Paramètre" },
      ],
      elements: () => [
        { libelle: "VALEUR_DU_BON, qui ne change jamais pendant l'exécution", montant: 0, categorie: "constante", pourquoi: "Une valeur fixée une fois : une constante." },
        { libelle: "POINTS_PAR_BON", montant: 0, categorie: "constante", pourquoi: "Fixé au début, jamais modifié ensuite : une constante." },
        { libelle: "points, qui change à chaque tour de boucle", montant: 0, categorie: "variable", pourquoi: "On lui affecte une valeur nouvelle à chaque tour : une variable." },
        { libelle: "tickets et privilege, donnés à la fonction quand on l'appelle", montant: 0, categorie: "parametre", pourquoi: "Ils arrivent de l'extérieur, différents pour chaque cliente : des paramètres." },
      ],
      relance: "L'objet garde-t-il la même valeur, change-t-il pendant le calcul, ou arrive-t-il de l'extérieur de la fonction ?",
      explication: () => ["La flèche ← est l'affectation : la variable de gauche reçoit la valeur de droite. Déclarer une variable, c'est lui donner un nom ; l'affecter, c'est lui donner une valeur."],
    },
    {
      id: "les-types",
      objectifs: [0],
      type: "tri",
      titre: "Les types de données",
      question: () => "Rangez chaque valeur selon son type.",
      categories: [
        { code: "entier", libelle: "Entier" },
        { code: "flottant", libelle: "Flottant" },
        { code: "booleen", libelle: "Booléen" },
        { code: "chaine", libelle: "Chaîne de caractères" },
        { code: "liste", libelle: "Liste" },
      ],
      elements: () => [
        { libelle: `${qte(pointsLaurent())}, les points de Mme Laurent`, montant: 0, categorie: "entier", pourquoi: "Un nombre sans virgule : un entier." },
        { libelle: `${qte(TICKETS_DE_MME_LAURENT[0])}, le montant d'un ticket`, montant: 0, categorie: "flottant", pourquoi: "Un nombre à virgule : un flottant." },
        { libelle: "vrai, la carte « Privilège » de Mme Laurent", montant: 0, categorie: "booleen", pourquoi: "Vrai ou faux, rien d'autre : un booléen." },
        { libelle: "« Laurent », le nom de la cliente", montant: 0, categorie: "chaine", pourquoi: "Une suite de caractères : une chaîne." },
        { libelle: `[${TICKETS_DE_MME_LAURENT.map(qte).join(" ; ")}], ses tickets du mois`, montant: 0, categorie: "liste", pourquoi: "Plusieurs valeurs rangées dans l'ordre : une liste, qu'une boucle parcourt." },
      ],
      relance: "Est-ce un nombre entier, un nombre à virgule, vrai ou faux, du texte, ou plusieurs valeurs à la suite ?",
      explication: () => ["Le type dit quelles opérations ont un sens : on additionne des flottants, on teste un booléen, on parcourt une liste."],
    },
    {
      id: "l-algorithme",
      type: "lecture",
      titre: "Lire l'algorithme",
      tableau: leProgramme,
      texte: () => [
        "Le programme est une fonction : elle reçoit les tickets et la carte d'une cliente, et retourne la valeur de ses bons. Ses instructions s'exécutent en séquence, l'une après l'autre.",
        "La boucle (lignes 5 à 7) répète la même instruction pour chaque ticket de la liste. Le test (lignes 8 à 10) n'exécute la ligne 9 que si la condition est vraie. ent garde la partie entière d'un nombre : ent(45,90) vaut 45.",
      ],
      repere: () => "Séquence · boucle « pour chaque » · test « si … alors » · fonction qui reçoit des paramètres et retourne un résultat.",
    },
    {
      id: "derouler-la-boucle",
      objectifs: [1],
      type: "a-completer",
      titre: "Dérouler la boucle à la main",
      tableau: leProgramme,
      question: () => `Mme Laurent a ${qte(TICKETS_DE_MME_LAURENT.length)} tickets ce mois-ci. Déroulez la boucle des lignes 5 à 7 : à chaque tour, la partie entière du montant, puis la valeur de points à la fin du tour.`,
      grille: () => boucleACompleter(),
      explication: () => [`Après la boucle, points vaut ${qte(pointsLaurent())}. Dérouler à la main, c'est jouer la machine : on suit chaque variable, instruction par instruction.`],
    },
    {
      id: "ce-que-retourne-la-fonction",
      objectifs: [1],
      type: "montants",
      titre: "Ce que la fonction retourne",
      tableau: leProgramme,
      question: () => `Continuez après la boucle. Que retourne la fonction pour les tickets de Mme Laurent, qui a la carte « Privilège » ? Et pour les mêmes tickets, sans la carte ?`,
      champs: () => {
        const p = pointsLaurent();
        const avec = bonDuMois(TICKETS_DE_MME_LAURENT, true);
        const sans = bonDuMois(TICKETS_DE_MME_LAURENT, false);
        const double = p * REGLE.multiplicateurPrivilege;
        return [
          { libelle: "Avec la carte « Privilège »", attendu: avec, calcul: `${qte(p)} × ${qte(REGLE.multiplicateurPrivilege)} = ${qte(double)} points ; ent(${qte(double)} ÷ ${qte(REGLE.pointsParBon)}) × ${qte(REGLE.valeurDuBon)} = ${eur(avec)}` },
          { libelle: "Sans la carte", attendu: sans, calcul: `Le test est faux, la ligne 9 ne s'exécute pas : ent(${qte(p)} ÷ ${qte(REGLE.pointsParBon)}) × ${qte(REGLE.valeurDuBon)} = ${eur(sans)}` },
        ];
      },
      explication: () => ["Le même programme, 2 résultats : c'est le test qui choisit le chemin. Les points au-delà de la dernière tranche ne donnent rien ce mois-ci."],
    },
    {
      id: "la-condition",
      objectifs: [2],
      type: "choix",
      titre: "La condition du test",
      tableau: leProgramme,
      question: () => "Un collègue a effacé la condition de la ligne 8 : « si … alors ». Laquelle remet la règle de gestion en place ?",
      options: () => [
        { texte: "privilege", juste: true, retour: "Oui : privilege est un booléen ; s'il est vrai, les points doublent. La condition d'un test est toujours une expression vraie ou fausse." },
        { texte: `points ≥ ${qte(REGLE.pointsParBon)}`, juste: false, retour: "Non : les points doubleraient pour toute cliente qui a beaucoup acheté, avec ou sans carte." },
        { texte: "montant > 0, pour ne garder que les tickets payés", juste: false, retour: "Non : montant n'existe que dans la boucle, et la règle parle de la carte, pas des tickets." },
      ],
    },
    {
      id: "la-boucle-tant-que",
      objectifs: [1],
      type: "montants",
      titre: "Une boucle « tant que »",
      question: () => {
        const p = pointsLaurent() * REGLE.multiplicateurPrivilege;
        return `Une autre version retire les bons un à un : « bons ← 0 ; tant que points ≥ POINTS_PAR_BON : points ← points − POINTS_PAR_BON ; bons ← bons + 1 ». Elle part de ${qte(p)} points. Combien de tours fait la boucle, et combien de points reste-t-il à la fin ?`;
      },
      champs: () => {
        const p = pointsLaurent() * REGLE.multiplicateurPrivilege;
        const k = bonsUnAUn(p);
        return [
          { libelle: "Tours de boucle", nature: "quantite", attendu: k.tours, calcul: `${qte(p)} → ${Array.from({ length: k.tours }, (_, i) => qte(p - (i + 1) * REGLE.pointsParBon)).join(" → ")} : ${qte(k.tours)} tours` },
          { libelle: "Points qui restent", nature: "quantite", attendu: k.reste, calcul: `La boucle s'arrête quand points passe sous ${qte(REGLE.pointsParBon)} : ${qte(k.reste)}` },
        ];
      },
      explication: () => ["Une boucle « pour » fait un nombre de tours connu d'avance, un par élément de la liste. Une boucle « tant que » tourne tant que sa condition est vraie : il faut qu'elle finisse par devenir fausse, sinon la boucle ne s'arrête jamais."],
    },
    {
      id: "le-jeu-d-essai",
      objectifs: [3],
      type: "tri",
      titre: "Le jeu d'essai",
      question: () => "Avant de mettre le programme en service, on le teste. Rangez chaque essai.",
      categories: [
        { code: "normal", libelle: "Cas normal" },
        { code: "limite", libelle: "Cas limite" },
        { code: "erreur", libelle: "Cas d'erreur" },
      ],
      elements: () => [
        { libelle: `Les tickets de Mme Laurent, avec la carte : ${eur(bonDuMois(TICKETS_DE_MME_LAURENT, true))} attendus`, montant: 0, categorie: "normal", pourquoi: "Une cliente ordinaire : le cas normal." },
        { libelle: "Une cliente sans aucun ticket dans le mois : 0 € attendu", montant: 0, categorie: "limite", pourquoi: "Une liste vide : la boucle ne tourne pas. Un cas limite." },
        { libelle: `Une cliente à ${qte(REGLE.pointsParBon - 1)} points, puis une à ${qte(REGLE.pointsParBon)}`, montant: 0, categorie: "limite", pourquoi: "Juste sous et juste à la frontière d'un bon : les cas limites." },
        { libelle: "Un ticket négatif, un avoir après un retour", montant: 0, categorie: "erreur", pourquoi: "Une valeur que la règle ne prévoit pas : le programme doit la traiter." },
      ],
      relance: "L'essai est-il ordinaire, à la frontière de la règle, ou hors de ce qu'elle prévoit ?",
      explication: () => ["Un jeu d'essai écrit d'avance le résultat attendu de chaque cas : on compare, et tout écart est une erreur à corriger."],
    },
    {
      id: "la-mise-au-point",
      objectifs: [3],
      type: "choix",
      titre: "Trouver l'erreur",
      question: () => {
        const p = pointsLaurent();
        return `Une première version écrivait arrondi(points ÷ POINTS_PAR_BON), qui arrondit, à la place de la partie entière. Elle donnait ${eur(bonAvecLArrondi(p))} pour une cliente à ${qte(p)} points, au lieu de ${eur(bonDuMois(TICKETS_DE_MME_LAURENT, false))}. Quel essai l'aurait révélé ?`;
      },
      options: () => [
        { texte: `Une cliente à ${qte(pointsLaurent())} points`, juste: true, retour: `Oui : entre ${qte(REGLE.pointsParBon * 1.5)} et ${qte(REGLE.pointsParBon * 2 - 1)} points, l'arrondi monte à la tranche supérieure, la partie entière non. Un essai bien choisi, dont on connaît le résultat, montre l'erreur.` },
        { texte: "Une cliente à 0 point, qui ne reçoit rien dans les 2 versions", juste: false, retour: "Non : les 2 versions donnent 0 €, l'erreur ne se voit pas." },
        { texte: "Aucun : un programme qui tourne est juste", juste: false, retour: "Non : un programme peut tourner sans erreur et donner un résultat faux. C'est pour cela qu'on le teste." },
      ],
    },
    {
      id: "le-curseur-de-l-automatisation",
      objectifs: [4],
      type: "curseur",
      titre: "Ce que l'automatisation fait gagner",
      question: () => {
        const k = CALCUL_A_LA_MAIN;
        return `À la main, le calcul prend ${qte(k.minutesParCliente)} minutes par cliente, pour ${qte(k.clientes)} clientes, à ${eur(k.coutHoraire)} de l'heure : ${eur(calculALaMain(1))} par mois. Le programme coûte ${eur(DEVELOPPEMENT.cout)} à faire écrire. Faites varier les mois d'utilisation. Placez le curseur sur le premier mois où le temps gagné le paie.`;
      },
      cible: () => ({ attendu: moisQuiPaientLeProgramme(), max: 24 }),
      grandeur: () => ({ libelle: "Mois d'utilisation du programme", unite: "mois" }),
      rates: () => ({ dessous: "Pas encore : le programme coûte plus que le temps gagné.", dessus: "Le programme est payé, mais un mois de moins suffisait-il déjà ?" }),
      zones: ["Programme payé", "Programme non payé"],
      montrer: "Montrer le nombre de mois",
      lecture: (_c, n) => [
        { libelle: "Temps gagné, en euros", montant: calculALaMain(n), fort: true },
        { libelle: "Prix du programme", montant: DEVELOPPEMENT.cout },
      ],
      droites: () => ({ produit: (n) => calculALaMain(n), cout: () => DEVELOPPEMENT.cout, libelles: ["Temps gagné", "Prix du programme"] }),
      explication: () => [`Le programme est payé au bout de ${qte(moisQuiPaientLeProgramme())} mois. Ensuite, il fait gagner chaque mois le temps de l'adjointe, et il ne se trompe pas de tranche.`],
    },
    {
      id: "api-et-ia",
      type: "lecture",
      titre: "Une API, une bibliothèque, l'intelligence artificielle",
      texte: () => [
        "Un programme ne fait pas tout lui-même. Il appelle une bibliothèque, du code déjà écrit (pour les dates, les calculs), ou l'interface de programmation (API) d'un autre service : celui qui envoie les SMS, par exemple, reçoit le numéro et le texte, et envoie le message.",
        "L'intelligence artificielle change les algorithmes : au lieu de suivre des règles écrites à la main, elle apprend à partir d'exemples. Elle peut prévoir ou recommander, mais ses résultats doivent être expliqués et contrôlés.",
      ],
      repere: () => "Bibliothèque : du code réutilisé · API : la porte d'entrée d'un autre service · IA : un algorithme qui apprend des données.",
    },
    {
      id: "l-api",
      objectifs: [5],
      type: "choix",
      titre: "Envoyer le bon",
      question: (c) => `${c.entreprise} veut que chaque bon parte par SMS dès qu'il est calculé. Comment le programme le fait-il ?`,
      options: () => [
        { texte: "Il appelle l'API du service de SMS", juste: true, retour: "Oui : le programme envoie le numéro et le texte au service, selon les règles que son API publie, et reçoit une réponse. Personne n'a à recopier les numéros." },
        { texte: "Il faut réécrire tout un service de SMS dans le programme de la boutique", juste: false, retour: "Non : une API permet justement de se servir d'un service sans le refaire." },
        { texte: "L'adjointe recopie chaque bon sur son téléphone", juste: false, retour: "Non : l'automatisation s'arrêterait au milieu du chemin." },
      ],
    },
    {
      id: "l-ia",
      objectifs: [5],
      type: "choix",
      titre: "Une intelligence artificielle",
      question: () => "Un prestataire propose une intelligence artificielle qui repère les clientes prêtes à partir, pour leur offrir un bon. Que faut-il exiger ?",
      options: () => [
        { texte: "Savoir sur quoi elle décide, et garder la main", juste: true, retour: "Oui : ses résultats doivent pouvoir être expliqués, contrôlés par une personne, et respecter les règles sur les données des clientes. L'outil aide, il ne décide pas seul." },
        { texte: "Rien : une intelligence artificielle ne se trompe jamais, puisqu'elle apprend toute seule", juste: false, retour: "Non : elle apprend des données qu'on lui donne, avec leurs erreurs et leurs biais." },
        { texte: "Qu'elle remplace tout le programme des bons", juste: false, retour: "Non : la règle des bons est simple et connue ; un algorithme écrit à la main la suit exactement." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => [
        `Le programme des bons de ${c.entreprise} traduit une règle de gestion : des constantes, des variables et des paramètres typés, une boucle qui parcourt les tickets, un test sur la carte « Privilège », une fonction qui retourne le bon. Dérouler à la main et tester sur un jeu d'essai permet de le mettre au point. Il est payé en ${qte(moisQuiPaientLeProgramme())} mois.`,
        "Dans l'arène, quel calcul refaites-vous à chaque tour, qu'un petit programme pourrait faire à votre place ?",
      ],
      repere: () => "Constante, variable, paramètre · entier, flottant, booléen, chaîne, liste · séquence, test, boucle, fonction · jeu d'essai, mise au point · API, bibliothèque · IA.",
    },
  ],
};
