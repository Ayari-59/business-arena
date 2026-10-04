/**
 * LA PANNE QUI PARALYSE — le contenu de l'épisode.
 *
 * Céline Rochat dirige les opérations d'Arvel Distribution pour la région
 * lyonnaise : six agences, cent quarante personnes. Un lundi matin, le
 * système de gestion est chiffré par une cyberattaque ; une rançon est
 * demandée. Six décisions pour tenir l'activité pendant la panne, redémarrer
 * sans tout perdre une seconde fois, et sortir de la crise. La cyberattaque
 * est le décor : le sujet est la décision managériale, et l'épisode ne dit
 * rien de la manière dont une attaque se mène.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "duree",
    t: "La panne durera des semaines : tout se joue sur ce que les agences sauront servir sans le système",
  },
  { id: "redemarrage", t: "Tout se joue sur la vitesse à laquelle le système redémarre" },
  {
    id: "informatique",
    t: "C'est une affaire d'informatique : les agences doivent attendre son feu vert",
  },
  { id: "fideles", t: "Les artisans sont fidèles : ils patienteront quelques jours" },
] as const;

const YANNICK = { de: "Yannick Ferreira", role: "Responsable informatique" } as const;
const SABRINA = { de: "Sabrina Haddou", role: "Directrice commerciale" } as const;
const DG = { de: "Marc-Antoine Vidal", role: "Directeur général" } as const;
const KARIM = { de: "Karim Belkacem", role: "Chef d'agence, Villeurbanne" } as const;
const AMANDINE = { de: "Amandine Roux", role: "Cheffe d'agence, Vénissieux" } as const;
const NATHALIE = { de: "Nathalie Brun", role: "Acheteuse, Ferrand Habitat" } as const;
const DELEGUES = { de: "Délégués du personnel", role: "Région lyonnaise" } as const;
const LUCIE = { de: "Lucie Martin", role: "Responsable administrative" } as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Plus rien ne fonctionne",
    jusqua: 1,
    messages: () => [
      {
        ...YANNICK,
        heure: "06:50",
        alerte: true,
        texte:
          "Céline, le système de gestion est chiffré depuis cette nuit : commandes, stocks, facturation, tout est bloqué. Un message à l'écran demande une rançon. J'ai tout débranché du réseau.",
      },
      {
        ...AMANDINE,
        heure: "07:35",
        texte:
          "Les artisans font la queue au comptoir. On ne voit plus les stocks, on ne peut plus sortir une facture. Je fais quoi ?",
      },
      {
        ...SABRINA,
        heure: "08:10",
        texte:
          "Il faut que l'informatique relance tout aujourd'hui. Chaque jour comptoir fermé, ce sont des clients qui partent chez le concurrent.",
      },
      {
        ...DG,
        heure: "08:30",
        texte:
          "Je compte sur toi pour tenir les agences. Dis-moi vendredi comment tu t'organises, et qui fait quoi.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "informatique",
        titre: "Faire le point avec Yannick Ferreira",
        cout: 1,
        nature: "decisive",
        resultat:
          "Les sauvegardes de jeudi sont intactes, conservées hors ligne. Mais on ne sait ni par où l'intrus est entré ni s'il est encore là : tout relancer sans nettoyer, c'est risquer de tout perdre une seconde fois, sauvegardes comprises. Estimation honnête : deux à six semaines pour un redémarrage propre, moins si l'on redémarre par étapes.",
      },
      {
        id: "agences",
        titre: "Appeler les six chefs d'agence",
        cout: 1,
        nature: "decisive",
        resultat:
          "Villeurbanne a ressorti les carnets de bons et sert déjà les deux tiers de ses clients ; Vénissieux a fermé le comptoir « en attendant ». Partout, les vendeurs connaissent de mémoire le stock des 200 références qui font 70 % des ventes. Ce qui manque : savoir quel client servir d'abord, et quelle agence a quoi.",
      },
      {
        id: "clients",
        titre: "Ressortir la liste papier des cinquante premiers clients",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Cinquante clients font 55 % de la marge de la région ; douze ont un chantier qui démarre dans les quinze jours. Ferrand Habitat pèse à lui seul 11 % de l'activité.",
      },
      {
        id: "confrere",
        titre: "Appeler un confrère qui a vécu une cyberattaque",
        cout: 1,
        nature: "bruit",
        resultat:
          "Il a payé, redémarré « en dix jours », et « tout est rentré dans l'ordre ». Il ne sait plus combien ça a coûté, ni ce qui a été vérifié avant de relancer.",
      },
      {
        id: "conseil",
        titre: "Demander conseil au directeur général",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Marc-Antoine : « Ne cours pas après le système. Organise-toi pour vivre sans lui quelques semaines, et que chacun sache ce qu'il décide. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment organisez-vous les agences dès aujourd'hui ?",
    options: [
      {
        t: "Monter une cellule de crise et organiser un mode dégradé par priorités",
        d: "Cinq personnes aux rôles écrits, un point à 8 h et à 17 h. Bons papier numérotés, tableau partagé des stocks, clients prioritaires d'abord. 3 000 € pour s'équiper, puis 2 500 € par semaine de panne.",
      },
      {
        t: "Tout servir comme avant, sur papier, en heures supplémentaires",
        d: "Chaque agence reprend toute son activité à la main, tout de suite. 4 000 € d'heures par semaine de panne.",
      },
      {
        t: "Réunir les six chefs d'agence chaque matin, et décider ensemble",
        d: "Tout le monde autour de la table, chacun remonte ses urgences. 1 500 € de déplacements par semaine de panne.",
      },
      {
        t: "Servir au comptoir ce qu'on peut, en attendant le retour du système",
        d: "Pas de livraisons ni de commandes à distance. Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...KARIM,
          texte:
            "Le tableau des stocks est en ligne à midi. Quand il me manque des plaques, je sais que Bron en a. Et je sais qui servir d'abord.",
        },
      ],
      [
        {
          ...AMANDINE,
          texte:
            "On sert tout le monde, mais on court. Les bons s'empilent dans un carton, et je ne sais pas qui les saisira.",
        },
      ],
      [
        {
          ...KARIM,
          texte:
            "Une heure et demie de réunion ce matin. Chacun a défendu ses clients, rien n'a été tranché, et on est repartis à 10 h.",
        },
      ],
      [
        {
          ...SABRINA,
          texte:
            "Trois de mes artisans sont allés chez le concurrent ce matin. Ils ne reviendront pas facilement.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 1 · vendredi",
    titre: "Les clients veulent savoir",
    jusqua: 2,
    messages: (ctx) => [
      {
        de: "Accueil téléphonique",
        role: "Standard régional",
        heure: "09:10",
        alerte: true,
        texte:
          "Plus de 400 appels depuis lundi. Les clients demandent quand ils seront livrés, et si leurs données sont en sécurité.",
      },
      {
        ...SABRINA,
        heure: "11:30",
        texte:
          "Si on dit qu'on s'est fait pirater, on est morts. Disons que c'est une panne et que tout revient la semaine prochaine.",
      },
      {
        de: "Tableau de bord régional",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Activité maintenue en semaine 1 : ${ctx.activite} d'une semaine normale. Confiance des clients : ${ctx.confiance}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "appels",
        titre: "Écouter vingt appels de clients",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Ce qui énerve les clients n'est pas la panne : c'est de ne pas savoir. « Dites-moi juste si je serai livré mardi. » Deux artisans ont déjà appris l'attaque par un concurrent, et rappellent pour vérifier.",
      },
      {
        id: "juridique",
        titre: "Demander au service juridique ce qu'on peut dire",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les autorités ont été prévenues lundi, et les clients dont les données ont pu être touchées devront être informés. Rien n'interdit de dire ce qu'on sait ; il est imprudent de promettre une date qu'on ne connaît pas.",
      },
    ],
    question: "Que dites-vous aux clients ?",
    options: [
      {
        t: "Prévenir tous les clients, honnêtement, avec un point chaque semaine",
        d: "Ce qu'on sait, ce qu'on ne sait pas, et comment commander en attendant. Standard renforcé, 1 500 € par semaine de panne.",
      },
      {
        t: "Annoncer un retour à la normale sous huit jours",
        d: "Un message rassurant, tout de suite. Ne coûte rien.",
      },
      {
        t: "Ne rien dire tant qu'on n'en sait pas plus",
        d: "Le standard répond « incident technique ». Ne coûte rien.",
      },
      {
        t: "Prévenir seulement les grands comptes",
        d: "Les cinquante premiers clients, par leur commercial. 500 € par semaine.",
      },
    ],
    reactions: [
      [
        {
          ...NATHALIE,
          texte:
            "Merci pour le message. Au moins, je sais comment commander en attendant, et je peux prévenir mes conducteurs de travaux.",
        },
      ],
      [
        {
          ...SABRINA,
          texte:
            "Les clients sont rassurés. Maintenant, il faut que l'informatique tienne la date.",
        },
      ],
      [
        {
          de: "Accueil téléphonique",
          role: "Standard régional",
          texte:
            "Les clients rappellent deux, trois fois. Certains raccrochent en disant qu'ils iront ailleurs.",
        },
      ],
      [
        {
          ...AMANDINE,
          texte:
            "Les grands comptes sont prévenus. Mes artisans, eux, l'apprennent au comptoir, et ils le prennent mal.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Redémarrer, mais comment ?",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...YANNICK,
        heure: "10:00",
        alerte: true,
        texte:
          "Le prestataire a fini son analyse. Trois façons de redémarrer : tout relancer lundi depuis les sauvegardes, nettoyer puis redémarrer par étapes, ou tout nettoyer avant de tout redémarrer d'un bloc.",
      },
      {
        ...DG,
        heure: "11:15",
        texte:
          "Les attaquants demandent 90 000 € avant mercredi, contre une clé qui déchiffrerait nos données. Une partie du conseil veut payer pour en finir. J'attends ta recommandation.",
      },
      {
        ...SABRINA,
        heure: "12:00",
        texte: "Relancez tout lundi. On ne peut pas perdre une semaine de plus.",
      },
      {
        de: "Tableau de bord régional",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Activité maintenue en semaine 2 : ${ctx.activite}. Coût de la crise à date : ${ctx.cout}.`,
      },
    ],
    sources: [
      {
        id: "rapport",
        titre: "Lire le rapport du prestataire",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "L'intrus est entré par un accès à distance resté ouvert, et il a circulé sur une trentaine de postes. Tant que chacun n'est pas vérifié, ce qui redémarre peut être chiffré de nouveau. Nettoyage estimé : deux à quatre semaines. Commandes et facturation peuvent repartir avant les stocks, avec un petit risque tant que le reste n'est pas fini.",
      },
      {
        id: "assureur",
        titre: "Appeler l'assureur",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le contrat couvre le prestataire et une partie des pertes d'exploitation, pas la rançon. Dans les dossiers qu'il suit, la clé fournie ne déchiffre tout qu'une fois sur deux, et payer n'a jamais fait partir un intrus.",
      },
    ],
    question: "Que décidez-vous pour le redémarrage ?",
    options: [
      {
        t: "Tout relancer lundi depuis les sauvegardes",
        d: "Le système revient en quelques jours, sans nettoyage. 8 000 €.",
      },
      {
        t: "Payer la rançon pour récupérer les données",
        d: "90 000 €, non couverts par l'assurance. Une clé promise sous 48 heures.",
      },
      {
        t: "Nettoyer, puis redémarrer par étapes : commandes et facturation d'abord",
        d: "Le prestataire, 42 000 €. Les premières briques reviennent avant la fin du nettoyage.",
      },
      {
        t: "Tout nettoyer, puis tout redémarrer d'un bloc",
        d: "Le prestataire, 38 000 €. Rien ne revient avant que tout soit vérifié.",
      },
    ],
    reactions: [
      [
        {
          ...YANNICK,
          texte:
            "C'est relancé : les agences retrouvent leurs écrans. Je reste inquiet de tout ce qu'on n'a pas vérifié.",
        },
      ],
      null,
      [
        {
          ...YANNICK,
          texte:
            "Le prestataire a commencé par les serveurs de commandes et de facturation. Premiers contrôles concluants.",
        },
      ],
      [
        {
          ...YANNICK,
          texte:
            "Le nettoyage avance poste par poste. Rien ne redémarre avant la fin, comme convenu.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Ferrand Habitat menace de partir",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...NATHALIE,
        heure: "11:20",
        alerte: true,
        texte:
          "Trois de nos chantiers attendent leur isolation et leurs menuiseries. Sans engagement de livraison d'ici lundi, je passe nos commandes du trimestre chez votre concurrent.",
      },
      {
        ...SABRINA,
        heure: "11:45",
        texte:
          "Ferrand, c'est 11 % de la région. Donnons-leur ce qu'ils veulent : une remise, une promesse, n'importe quoi.",
      },
      {
        de: "Tableau de bord régional",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Systèmes rétablis en semaine 4 : ${ctx.systemes}. Activité maintenue : ${ctx.activite}.`,
      },
    ],
    sources: [
      {
        id: "chantiers",
        titre: "Regarder ce que les agences peuvent livrer à Ferrand",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.modeDegrade
            ? "Le tableau partagé des stocks le montre : à trois agences, on couvre 90 % des besoins de ses trois chantiers sur deux semaines, en réservant les références critiques."
            : "Personne ne sait vraiment ce qu'il y a en stock d'une agence à l'autre. Chaque chef d'agence pense pouvoir livrer une partie, sans pouvoir dire laquelle.",
      },
      {
        id: "historique",
        titre: "Relire l'historique du client",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Client depuis neuf ans, renégocié chaque trimestre. Une remise de 8 % jusqu'à la fin du trimestre coûterait environ 20 000 €. S'il part, il ne reviendra pas avant le prochain appel d'offres.",
      },
    ],
    question: "Que répondez-vous à Ferrand Habitat ?",
    options: [
      {
        t: "Le rencontrer lundi avec un plan de livraison chantier par chantier",
        d: "Ce qu'on livre, d'où, et quand, sur deux semaines. Deux heures de la cellule de crise.",
      },
      {
        t: "Lui accorder 8 % de remise sur le trimestre, contre un engagement écrit",
        d: "Environ 2 250 € par semaine jusqu'à la fin du trimestre.",
      },
      {
        t: "Lui promettre que tout sera rentré dans l'ordre sous quinze jours",
        d: "Ne coûte rien. Il faudra que le système suive.",
      },
      {
        t: "Lui répondre qu'on fait au mieux, comme pour tous les clients",
        d: "Pas de traitement de faveur.",
      },
    ],
    reactions: [
      [
        {
          ...KARIM,
          texte:
            "Le plan est prêt : trois agences, deux semaines, références réservées. Rendez-vous lundi chez Ferrand.",
        },
      ],
      [{ ...NATHALIE, texte: "Engagement signé. Nous maintenons nos commandes chez vous." }],
      [{ ...NATHALIE, texte: "Je prends note : quinze jours, pas un de plus." }],
      [{ ...NATHALIE, texte: "Je comprends. Mais j'ai des chantiers à livrer, moi." }],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Les équipes sont à bout",
    jusqua: 9,
    messages: (ctx) => [
      {
        ...DELEGUES,
        heure: "09:00",
        alerte: true,
        texte:
          "Des semaines de bons papier et de journées à rallonge, et maintenant il faut tout ressaisir dans le système. Les équipes n'en peuvent plus.",
      },
      {
        de: "Patrick Delorme",
        role: "Chef d'agence, Saint-Priest",
        heure: "12:30",
        texte: "Je dors quatre heures par nuit. Je ne sais pas combien de temps je tiens comme ça.",
      },
      {
        de: "Tableau de bord régional",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Fatigue des équipes : ${ctx.fatigue}. Systèmes rétablis : ${ctx.systemes}. Bons papier encore à ressaisir : ${ctx.arriere}.`,
      },
    ],
    sources: [
      {
        id: "charge",
        titre: "Mesurer la charge de ressaisie",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Il reste ${ctx.arriere} de ventes sur bons papier à ressaisir. Les vendeurs y passent une heure et demie par jour, après le comptoir. Confiée à des renforts, la saisie irait moitié plus vite, sans user ceux qui servent les clients.`,
      },
      {
        id: "rh",
        titre: "Faire le point avec les ressources humaines",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Onze personnes ont déjà dépassé le plafond annuel d'heures supplémentaires. L'agence d'intérim peut fournir quatre opérateurs de saisie dès lundi, et la région Auvergne propose de prêter deux vendeurs.",
      },
    ],
    question: "Que faites-vous pour les équipes ?",
    options: [
      {
        t: "Faire venir des renforts pour la ressaisie, et organiser des rotations",
        d: "Quatre opérateurs de saisie et deux vendeurs prêtés, trois semaines. 2 500 € par semaine.",
      },
      {
        t: "Payer des heures supplémentaires majorées pour tout ressaisir vite",
        d: "Sur la base du volontariat, majorées de 50 %. 3 500 € par semaine.",
      },
      {
        t: "Tenir : le plus dur est passé",
        d: "Les équipes ressaisissent au fil de l'eau. Ne coûte rien.",
      },
      {
        t: "Fermer les comptoirs le samedi pour que chacun souffle",
        d: "Trois semaines. Un peu de chiffre perdu.",
      },
    ],
    reactions: [
      [
        {
          de: "Patrick Delorme",
          role: "Chef d'agence, Saint-Priest",
          texte:
            "Les opérateurs de saisie sont arrivés lundi. Mes vendeurs sont revenus au comptoir, et ils rentrent chez eux à l'heure.",
        },
      ],
      [{ ...DELEGUES, texte: "Les heures sont faites. Les équipes sont payées, et épuisées." }],
      [{ ...AMANDINE, texte: "On ressaisit le soir, après le comptoir. Ça avance lentement." }],
      [
        {
          ...KARIM,
          texte: "Le samedi fermé, ça fait du bien. Mais la pile de bons ne baisse pas.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Sortir de la crise",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...LUCIE,
        heure: "10:15",
        alerte: true,
        texte: `Il reste ${ctx.arriere} de bons papier à ressaisir, et je trouve des livraisons sans bon, des bons sans livraison. Une partie ne sera jamais facturée si personne ne s'en occupe.`,
      },
      {
        ...DG,
        heure: "14:00",
        texte:
          "Le conseil veut tourner la page. Il me faut aussi ce qu'on retient de ces semaines, avant que tout le monde ait oublié.",
      },
    ],
    sources: [
      {
        id: "rapprochement",
        titre: "Rapprocher bons et livraisons sur une agence",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "À Villeurbanne, 6 % des livraisons faites pendant la panne n'ont aucun bon retrouvé. Appelés un par un, les clients reconnaissent presque toutes ces livraisons ; sans appel, elles ne seront jamais facturées.",
      },
    ],
    question: "Comment sortez-vous de la crise ?",
    options: [
      {
        t: "Rapprocher bons et livraisons client par client avec un renfort, et tenir un retour d'expérience",
        d: "Un renfort de trois semaines, 2 500 € par semaine. Un retour d'expérience avec les chefs d'agence en semaine 10.",
      },
      {
        t: "Faire tout ressaisir en deux samedis par les équipes",
        d: "Deux samedis majorés, 3 000 € chacun.",
      },
      {
        t: "Tourner la page : l'arriéré se saisira au fil de l'eau",
        d: "Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...LUCIE,
          texte:
            "Les clients reconnaissent presque toutes les livraisons sans bon. Et le retour d'expérience a donné un plan de continuité en dix points, signé par les six chefs d'agence.",
        },
      ],
      [
        {
          ...DELEGUES,
          texte:
            "Deux samedis de saisie après trois mois de crise : les équipes l'ont fait. Elles s'en souviendront.",
        },
      ],
      [
        {
          ...LUCIE,
          texte:
            "La pile de bons diminue, lentement. Des clients contestent déjà des livraisons vieilles de deux mois.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Cellule de crise et redémarrage par étapes", chemin: [0, 0, 2, 0, 0, 0] },
  { nom: "Aller vite et rassurer", chemin: [1, 1, 0, 2, 1, 1] },
  { nom: "Attentiste", chemin: [3, 2, 3, 3, 2, 2] },
] as const;

/**
 * Les options qui cèdent au réflexe de la crise — aller vite, payer, rassurer
 * sans savoir, ou se taire : [décision, option].
 */
export const REFLEXES = [
  [0, 1],
  [1, 1],
  [1, 2],
  [2, 0],
  [2, 1],
  [3, 2],
  [4, 1],
] as const;

export const REPONSES = {
  cleOk:
    "La clé déchiffre la plupart des fichiers. Il en manque, et rien n'a été nettoyé : le prestataire déconseille de garder ces machines telles quelles.",
  cleKo:
    "La clé ne déchiffre presque rien. Les 90 000 € sont partis ; on repart sur le nettoyage complet, avec une semaine de retard.",
  reinfectionEtape:
    "Un poste oublié a contaminé la brique des commandes, redémarrée la première. On l'isole et on la reprend : deux à trois semaines de perdues, mais le reste était propre.",
  reinfection:
    "Tout est chiffré une seconde fois, sauvegardes récentes comprises : l'intrus n'était pas parti. On repart de zéro, avec le prestataire en urgence.",
  retabli:
    "Le système est rétabli dans les six agences. Commandes, stocks et facturation tournent.",
  promesseRompue:
    "Huit jours sont passés, et le système n'est pas revenu. Les clients nous rappellent notre promesse ; certains ne rappellent plus.",
  ferrandPlan:
    "Votre plan tient la route. Nous restons chez vous, et nous suivrons les livraisons chantier par chantier.",
  ferrandReste: "Nous restons chez vous pour l'instant. Je vous jugerai sur les livraisons.",
  ferrandPart:
    "Nous passons nos commandes du trimestre chez votre concurrent. Rien de personnel : j'ai des chantiers à livrer.",
  arretChef:
    "Patrick Delorme, chef d'agence de Saint-Priest, est en arrêt de travail pour un mois. Un intérim de direction est en place.",
} as const;
