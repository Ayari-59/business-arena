/**
 * LA BRIGADE À BOUT — le contenu de l'épisode.
 *
 * Elio Santoni est le chef de cuisine de La Table d'Augustin de Chambéry, le
 * restaurant bistronomique du Groupe Escale au centre de la ville : une
 * brigade de neuf, un second, deux chefs de partie, deux commis, un apprenti,
 * deux plongeurs. Octobre commence, les fêtes approchent, et la brigade est à
 * bout : heures supplémentaires, absences, assiettes retournées le samedi
 * soir, une commis qui cherche ailleurs. Six décisions, chacune précédée de ce
 * qu'un chef de cuisine reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Les chiffres qu'elles
 * donnent sont ceux du modèle ; un test les recalcule.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "pics",
    t: "La brigade est organisée à plat alors que le travail arrive en pics : coupures, planning de la veille et un samedi soir sous-dimensionné l'usent plus que le volume d'heures",
  },
  {
    id: "effectif",
    t: "Il manque un cuisinier : la brigade fait trop d'heures pour le travail qu'on lui demande",
  },
  {
    id: "motivation",
    t: "La brigade manque d'engagement : les jeunes ne veulent plus des contraintes du métier",
  },
  {
    id: "technique",
    t: "Le niveau des commis est insuffisant : les assiettes retournées viennent d'erreurs de cuisson",
  },
] as const;

const LUBIN = { de: "Lubin Haenni", role: "Second de cuisine" } as const;
const SINAN = { de: "Sinan Kocabaş", role: "Chef de partie, chaud" } as const;
const BLEUENN = {
  de: "Bleuenn Thouvenot",
  role: "Cheffe de partie, garde-manger et pâtisserie",
} as const;
const LOU_ANNE = { de: "Lou-Anne Pétrequin", role: "Commis de cuisine" } as const;
const YAZID = { de: "Yazid Abellard", role: "Commis de cuisine" } as const;
const GWLADYS = { de: "Gwladys Cottarel", role: "Directrice de salle" } as const;
const THEO = {
  de: "Théo Garrigues",
  role: "Directeur de la restauration, Groupe Escale",
} as const;
const MARWA = { de: "Marwa Selmi", role: "Ressources humaines, siège" } as const;
const ELOI = { de: "Eloi Duraffourg", role: "Commercial groupes, siège" } as const;
const TABLEAU = "Tableau de bord de la cuisine";

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Une brigade à bout",
    jusqua: 2,
    messages: () => [
      {
        de: TABLEAU,
        role: "Alerte automatique",
        heure: "07:30",
        alerte: true,
        texte:
          "Septembre : 248 heures supplémentaires pour la brigade, 11 jours d'absence, 2,2 % d'assiettes retournées. Samedi soir : 120 couverts, 8 assiettes retournées.",
      },
      {
        ...THEO,
        heure: "09:10",
        texte:
          "Elio, Chambéry est le seul restaurant du groupe où les heures supplémentaires montent encore, et deux avis sur Bookalia parlent d'une heure d'attente au plat samedi. Le trimestre va d'octobre aux fêtes, avec les repas d'entreprise de décembre : dis-moi jeudi ce que tu changes.",
      },
      {
        ...LUBIN,
        heure: "10:45",
        texte:
          "Chef, samedi on a fini la plonge à une heure et demie. Lou-Anne m'a dit qu'elle regardait les annonces. Comme ça, on ne tiendra pas jusqu'à Noël.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "planning",
        titre: "Relire les plannings et les badgeages de septembre",
        cout: 1,
        nature: "decisive",
        resultat:
          "Sept personnes sur huit ont travaillé en service coupé quatre jours sur cinq : 10 h-15 h, puis 18 h 30-23 h 30. Le planning de la semaine, affiché le dimanche soir, a été modifié 37 fois en septembre, presque toujours la veille. Sur les 11 jours d'absence, 8 tombent un samedi ou un lendemain de fermeture tardive. Les heures supplémentaires, elles, n'ont pas bougé depuis le printemps : 62 par semaine, moins de 8 par personne. Ce qui a changé en juin, ce sont les coupures : deux par semaine avant, quatre depuis.",
      },
      {
        id: "coupDeFeu",
        titre: "Chronométrer le coup de feu de samedi soir",
        cout: 1,
        nature: "decisive",
        resultat:
          "Samedi : 120 couverts, et les trois quarts des plats partent entre 20 h et 21 h 30. Au passe, quatre cuisiniers envoient : Lubin, Sinan, Bleuenn et Yazid. Lou-Anne, du matin, est partie à 15 h ; Gabin, l'apprenti, aide à la plonge. Mardi et mercredi midi, cinq cuisiniers pour 64 couverts étalés sur deux heures. Le repère des Tables d'Augustin : au-delà de 18 couverts par cuisinier sur le coup de feu, les assiettes retournées montent en flèche.",
      },
      {
        id: "retours",
        titre: "Lire les assiettes retournées et les avis de septembre",
        cout: 0.5,
        nature: "utile",
        resultat:
          "60 assiettes retournées en septembre, dont 34 un samedi soir : cuissons dépassées, assiettes parties froides, garnitures oubliées. C'est 7 % des assiettes du samedi soir, contre 1,2 % le reste de la semaine. Les avis parlent d'attente, jamais du goût.",
      },
      {
        id: "effectifs",
        titre: "Comparer la brigade aux autres Tables d'Augustin",
        cout: 1,
        nature: "bruit",
        resultat:
          "Chambéry : neuf personnes en cuisine pour 672 couverts par semaine, soit 75 couverts par personne ; Annecy en fait 79, Aix-les-Bains 74. La brigade coûte 28 % du chiffre d'affaires à la carte, comme ailleurs dans le groupe.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Gwladys Cottarel",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Gwladys : « Ta brigade ne manque pas d'heures, elle en manque au mauvais moment. Regarde à quelle heure tu en as trop, et à quelle heure il t'en faut. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous avant de répondre à Théo jeudi ?",
    options: [
      {
        t: "Renforcer en heures supplémentaires : toute la brigade deux heures de plus le vendredi et le samedi",
        d: "Jusqu'aux fêtes. 32 heures supplémentaires de plus par semaine, environ 930 €.",
      },
      {
        t: "Refaire le planning autour du samedi soir : publié trois semaines à l'avance, une coupure au plus par personne et par semaine, un cuisinier de plus au coup de feu",
        d: "Les heures sont prises sur les midis creux du mardi et du mercredi. Une journée avec Lubin pour le bâtir.",
      },
      {
        t: "Prendre un extra chaque samedi soir",
        d: "Un cuisinier d'agence, 230 € le samedi. Le planning ne change pas.",
      },
      {
        t: "Garder l'organisation actuelle et serrer les rangs jusqu'aux fêtes",
        d: "Ne coûte rien de plus.",
      },
    ],
    reactions: [
      [
        {
          ...SINAN,
          texte:
            "On fera les heures, chef. Mais samedi on a encore fini à une heure, et ce matin Yazid a appelé : il est malade.",
        },
      ],
      [
        {
          ...LOU_ANNE,
          texte:
            "Je connais mes horaires jusqu'à la fin du mois. C'est la première fois depuis que je suis ici. Et samedi, on était cinq au passe : ça n'a rien à voir.",
        },
      ],
      [
        {
          ...LUBIN,
          texte:
            "L'extra de samedi a aidé, mais il ne connaît pas la carte : il a fallu tout lui montrer en plein service.",
        },
      ],
      [
        {
          ...THEO,
          texte:
            "Tu ne changes rien ? Alors on en reparle quand les avis du samedi arrêteront de tomber.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "La mise en place en double",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...BLEUENN,
        heure: "11:20",
        alerte: true,
        texte:
          "Ce matin, Yazid et moi avons taillé les mêmes légumes, chacun pour sa partie. Et Sinan a refait un fond blanc qu'on avait déjà.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 2 : ${ctx.heuresSup} heures supplémentaires, ${ctx.chargePic} couverts par cuisinier au coup de feu de samedi.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "production",
        titre: "Suivre la mise en place d'une journée",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Chaque partie fait sa mise en place de son côté, matin et après-midi : environ 22 heures par semaine de taillage, de fonds et de garnitures faits en double. Une liste de production commune les supprimerait, à condition d'être tenue chaque jour. ${
            ctx.planningStable
              ? "Avec le nouveau planning, chacun sait trois semaines à l'avance qui fait la liste du lendemain."
              : "Avec un planning qui change la veille, personne ne sait qui fera la liste du lendemain : à Aix-les-Bains, la même liste n'a pas tenu trois semaines."
          }`,
      },
      {
        id: "labo",
        titre: "Demander les tarifs du laboratoire de Seynod",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le laboratoire du groupe livre fonds, sauces de base et pâtisseries trois fois par semaine : une vingtaine d'heures de cuisine en moins par semaine, quel que soit le planning, pour 1,6 point de ratio matière en plus, soit environ 370 € par semaine au chiffre d'affaires d'octobre.",
      },
    ],
    question: "Comment organisez-vous la mise en place ?",
    options: [
      {
        t: "Mutualiser la mise en place : une liste de production commune, fonds et garnitures faits une fois pour les deux services, fiches techniques à jour",
        d: "Deux après-midi de travail avec Lubin et les chefs de partie. La liste devra être tenue chaque jour.",
      },
      {
        t: "Faire arriver les commis une heure plus tôt pour avancer la mise en place",
        d: "Dix heures supplémentaires de plus par semaine, 290 €.",
      },
      {
        t: "Acheter fonds, sauces et pâtisseries au laboratoire de Seynod",
        d: "Une vingtaine d'heures de cuisine en moins par semaine, 1,6 point de ratio matière en plus.",
      },
      {
        t: "Laisser chaque partie organiser sa mise en place",
        d: "Comme aujourd'hui.",
      },
    ],
    reactions: [
      [
        {
          ...BLEUENN,
          texte:
            "La liste est au passe tous les matins. Yazid taille pour tout le monde, et on a gagné une heure avant le service.",
        },
      ],
      [
        {
          ...YAZID,
          texte:
            "Je veux bien venir à 8 h. Mais je repars après minuit le samedi : avec la coupure, ça fait des journées de seize heures.",
        },
      ],
      [
        {
          ...SINAN,
          texte:
            "Les fonds du labo sont corrects. Le jus de veau n'est pas le nôtre, mais on gagne du temps l'après-midi.",
        },
      ],
      [
        {
          ...LUBIN,
          texte: "Chacun fait comme il peut. Ce matin encore, deux fonds blancs sur le feu.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Préparer décembre",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...LUBIN,
        heure: "00:40",
        alerte: true,
        texte:
          "Chef, ce soir Sinan était malade et son poste est tombé. L'extra d'agence, appelé à 17 h, ne connaissait pas la carte : quarante minutes de retard au plat. Si ça nous arrive un soir de fête en décembre, on coule.",
      },
      {
        ...MARWA,
        heure: "10:15",
        texte:
          "Si vous voulez un renfort pour décembre, c'est maintenant qu'il faut le décider. Un cuisinier confirmé en CDD, de la semaine 8 à la fin décembre : 850 € chargés par semaine, plus 800 € d'annonce et de recrutement.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 4 : ${ctx.absences} jours d'absence, ${ctx.heuresSup} heures supplémentaires.`,
      },
    ],
    sources: [
      {
        id: "absences",
        titre: "Reprendre les samedis où quelqu'un manquait",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Depuis la rentrée, sept samedis avec un absent au passe. Quand c'est un commis, la partie tient. Quand c'est un chef de partie, son poste tombe : personne d'autre ne connaît ses fiches, et l'extra appelé la veille ne fait que la moitié du travail. Ces soirs-là, les assiettes retournées doublent. Novembre est le mois le plus creux de l'année : c'est le seul moment pour former quelqu'un en doublure.",
      },
      {
        id: "second",
        titre: "Prendre un café avec Lubin",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Lubin : « Ce qui m'use, ce sont les trous. Quand quelqu'un manque, c'est moi qui bouche, et le samedi je fais deux postes. Deux commis qui tiennent un deuxième poste, ça m'enlève une bonne partie des trous. Un cuisinier de plus sur le planning de décembre, ça me les enlève presque tous. »",
      },
    ],
    question: "Comment préparez-vous la brigade pour décembre ?",
    options: [
      {
        t: "Former deux commis à un second poste : Yazid au garde-manger, Lou-Anne au chaud",
        d: "Trois semaines de doublure en novembre, six heures supplémentaires par semaine.",
      },
      {
        t: "Réserver dès maintenant deux extras par semaine pour tout décembre",
        d: "Des extras d'agence, 460 € par semaine du 1er au 31 décembre.",
      },
      {
        t: "Recruter un cuisinier saisonnier de la semaine 8 à la fin décembre",
        d: "Un CDD de six semaines : 850 € par semaine, plus 800 € de recrutement.",
      },
      {
        t: "Remettre la formation à janvier : décembre n'est pas le moment",
        d: "Rien ne change d'ici les fêtes.",
      },
    ],
    reactions: [
      [
        {
          ...LOU_ANNE,
          texte:
            "Première soirée au chaud avec Sinan. J'ai tout noté sur les fiches. Je n'aurais jamais cru aimer ça.",
        },
      ],
      [
        {
          ...MARWA,
          texte:
            "L'agence nous réserve deux extras par semaine en décembre. Elle ne garantit pas que ce seront toujours les mêmes.",
        },
      ],
      [
        {
          ...MARWA,
          texte:
            "Nous avons un candidat sérieux : Malcolm Vuillet, deux saisons d'hiver en station, disponible en semaine 8.",
        },
      ],
      [
        {
          ...LUBIN,
          texte: "D'accord, chef. On verra en décembre.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Les repas de groupe de décembre",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...ELOI,
        heure: "09:40",
        alerte: true,
        texte:
          "Elio, j'ai quatorze demandes de repas d'entreprise pour décembre à Chambéry : neuf du mardi au jeudi, cinq le samedi soir (deux le 5, deux le 12, une le 19). Vingt-huit couverts en moyenne, menu à 49 € hors taxes. C'est la saison : je confirme tout ?",
      },
      {
        ...THEO,
        heure: "11:05",
        texte:
          "Les groupes de décembre font l'année de beaucoup de nos restaurants. Mais je ne veux pas d'un mois de décembre comme tes samedis de septembre.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 6 : ${ctx.chargePic} couverts par cuisinier au coup de feu de samedi, ${ctx.retours} d'assiettes retournées.`,
      },
    ],
    sources: [
      {
        id: "samedis",
        titre: "Relire les samedis de groupe de décembre dernier",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "L'an dernier, trois samedis avec un groupe à la carte. La salle était déjà pleine : chaque groupe a pris la place de clients à la carte, et ses vingt-huit plats sont partis d'un bloc en plein coup de feu. Ces soirs-là, deux heures et demie de dépassement, deux fois plus d'assiettes retournées, et deux arrêts maladie la semaine suivante. Les groupes du mardi au jeudi, au menu unique fixé à l'avance : aucun incident.",
      },
      {
        id: "marge",
        titre: "Calculer ce que rapporte un groupe",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Un groupe de 28 au menu à 49 € : 1 372 € de chiffre d'affaires, et 27 % de ratio matière au menu unique, contre 30 % à la carte. Un mardi, la salle a de la place : tout est en plus. Un samedi soir, elle est pleine : le groupe remplace 28 couverts à la carte à 44 €, soit 1 232 €, et ne rapporte que 140 € de chiffre d'affaires de plus.",
      },
    ],
    question: "Que répondez-vous à Eloi ?",
    options: [
      {
        t: "Tout accepter : c'est la saison",
        d: "Les quatorze groupes, dont cinq le samedi soir, chacun à la carte comme il l'a demandé.",
      },
      {
        t: "Accepter les groupes du mardi au jeudi au menu unique, et proposer un autre soir aux groupes du samedi",
        d: "Menu choisi trois semaines avant. Les groupes du samedi qui ne veulent pas bouger iront ailleurs.",
      },
      {
        t: "Tout accepter, avec un menu unique et un extra chaque soir de groupe",
        d: "Quatorze soirs, 230 € l'extra.",
      },
      {
        t: "Répondre au fil des demandes, comme l'an dernier",
        d: "Eloi confirme au fur et à mesure ; certaines entreprises n'attendront pas.",
      },
    ],
    reactions: [
      [
        {
          ...ELOI,
          texte: "Tout est confirmé : quatorze groupes, un record pour Chambéry.",
        },
      ],
      null,
      [
        {
          ...ELOI,
          texte: "Confirmé, menu unique pour tous. Deux entreprises ont râlé, puis accepté.",
        },
      ],
      [
        {
          ...ELOI,
          texte:
            "J'ai confirmé ceux qui ont relancé : cinq en semaine, trois le samedi. Les autres ont réservé ailleurs.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "La carte de décembre",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...GWLADYS,
        heure: "15:30",
        alerte: true,
        texte:
          "Pour décembre, les clients demandent du festif : homard, Saint-Jacques, chapon. On fait une vraie carte de fêtes ?",
      },
      {
        ...SINAN,
        heure: "16:10",
        texte: ctx.secondPart
          ? "Sans Lubin, avec une carte de fêtes à la minute et un samedi plein, je ne sais pas comment on envoie."
          : "Une carte de fêtes à la minute, un samedi plein : il faudra me dire comment on envoie ça.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 8 : ${ctx.chargePic} couverts par cuisinier au coup de feu, ${ctx.heuresSup} heures supplémentaires. Marge depuis octobre : ${ctx.marge}, pour ${ctx.budgetADate} attendus à date.`,
      },
    ],
    sources: [
      {
        id: "dressage",
        titre: "Chronométrer le dressage de chaque carte",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Carte actuelle : 2 min 40 par assiette au passe, en moyenne. Plats de fêtes à la minute (homard snacké, Saint-Jacques) : 4 min 30, et 2,5 points de ratio matière en plus. Une carte courte de cinq entrées, cinq plats et quatre desserts, dont la moitié préparée à l'avance : 2 min 10, et un point de ratio matière en moins, faute de pertes.",
      },
      {
        id: "ticket",
        titre: "Estimer le ticket moyen de décembre",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Une carte de fêtes élargie ferait monter le ticket moyen du soir d'environ 3 € ; une carte courte avec deux plats de fêtes, d'environ 1,50 €.",
      },
    ],
    question: "Quelle carte pour décembre ?",
    options: [
      {
        t: "Une vraie carte de fêtes : huit plats, dont homard et Saint-Jacques à la minute",
        d: "Trois euros de plus par couvert le soir, 2,5 points de ratio matière en plus.",
      },
      {
        t: "Une carte courte pensée pour le coup de feu : cinq entrées, cinq plats, quatre desserts, dont deux plats de fêtes",
        d: "Un euro cinquante de plus par couvert le soir. Dressage simple, mise en place poussée.",
      },
      {
        t: "Garder la carte actuelle",
        d: "Elle tourne, et la brigade la connaît.",
      },
    ],
    reactions: [
      [
        {
          ...SINAN,
          texte:
            "Samedi, quarante minutes d'attente au plat. Le homard est magnifique, quand il arrive.",
        },
      ],
      [
        {
          ...GWLADYS,
          texte:
            "Les clients trouvent la carte courte plus chic. Et les plats arrivent chauds, même à 21 h.",
        },
      ],
      [
        {
          ...GWLADYS,
          texte: "Quelques clients demandent s'il n'y a rien de festif à la carte.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Les soirs de fêtes",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...GWLADYS,
        heure: "14:50",
        alerte: true,
        texte:
          "Pour le samedi 19, le réveillon du 24 et la Saint-Sylvestre, j'ai déjà 160 demandes par soir, pour 128 couverts en deux rotations. Je prends tout le monde ?",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 10 : ${ctx.chargePic} couverts par cuisinier au coup de feu, ${ctx.heuresSup} heures supplémentaires, ${ctx.absences} jours d'absence.`,
      },
    ],
    sources: [
      {
        id: "reservations",
        titre: "Regarder à quelle heure les clients veulent dîner",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sur les 160 demandes, sept sur dix veulent arriver entre 20 h et 20 h 45 : c'est ce qui fait le coup de feu. En deux services à heures fixes, 19 h et 21 h 30, annoncés à la réservation, la salle prend 150 couverts et le coup de feu le plus chargé n'en compte guère plus qu'un samedi ordinaire. En poussant les tables pour tout prendre, 150 couverts aussi, mais presque tous à la même heure.",
      },
    ],
    question: "Comment tenez-vous les soirs de fêtes ?",
    options: [
      {
        t: "Tout prendre en poussant les tables, et faire venir la brigade sur ses jours de repos",
        d: "150 couverts par soir de fête. Environ 35 heures supplémentaires de plus par semaine.",
      },
      {
        t: "Deux services à heures fixes, 19 h et 21 h 30, avec une mise en place doublée l'après-midi",
        d: "150 couverts par soir de fête, horaires annoncés aux clients. Quelques heures de mise en place en plus.",
      },
      {
        t: "Rester à 128 couverts et refuser le reste",
        d: "Comme un samedi ordinaire.",
      },
      {
        t: "Prendre deux extras pour ces soirs-là et monter à 144 couverts",
        d: "460 € par semaine de fête.",
      },
    ],
    reactions: [
      [
        {
          ...SINAN,
          texte:
            "On a envoyé 150 couverts. À minuit et demi, des tables attendaient encore leur dessert, et personne n'avait mangé en cuisine.",
        },
      ],
      [
        {
          ...GWLADYS,
          texte:
            "Les clients du deuxième service arrivent à l'heure : on le leur a dit en réservant. La cuisine envoie sans à-coups.",
        },
      ],
      [
        {
          ...GWLADYS,
          texte: "J'ai refusé une trentaine de tables par soir. Elles iront ailleurs.",
        },
      ],
      [
        {
          ...SINAN,
          texte: "Les deux extras ont tenu le garde-manger. Au chaud, c'était encore juste.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Organiser la brigade autour des pics", chemin: [1, 0, 0, 1, 1, 1] },
  { nom: "Des heures, et tout accepter", chemin: [0, 1, 3, 0, 0, 0] },
  { nom: "Attentiste", chemin: [3, 3, 3, 3, 2, 2] },
] as const;

/**
 * Les réflexes du métier sous pression, [décision, option] : des heures supplémentaires
 * pour toute la brigade, et tout prendre « parce que c'est la saison » (les groupes, la carte
 * de fêtes à la minute, les soirs de fêtes en poussant les tables). Remettre la formation à
 * janvier n'y figure pas : c'est l'attente, pas la réponse réflexe.
 */
export const REFLEXES = [
  [0, 0],
  [1, 1],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  deplaces3:
    "Trois des cinq entreprises du samedi passent au jeudi, au menu unique. Les deux autres ont réservé ailleurs.",
  deplaces1:
    "Une seule des cinq entreprises du samedi accepte un autre soir. Les quatre autres ont réservé ailleurs.",
  secondAnnonce:
    "Chef, je préfère te le dire en face : j'ai signé comme second dans une brasserie d'Annecy. Je solde mes congés : mon dernier service sera le samedi de la semaine 9. Décembre comme il s'annonce, je ne le referai pas.",
} as const;
