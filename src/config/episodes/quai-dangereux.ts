/**
 * LE QUAI DANGEREUX — le contenu de l'épisode.
 *
 * Agathe Bonnefoy est responsable d'exploitation de la plateforme logistique
 * d'Arvel Distribution à Saint-Quentin-Fallavier : quatorze caristes, une
 * trentaine de préparateurs, et les chauffeurs des transporteurs
 * sous-traitants qui chargent à quai. Un chariot vient de frôler un piéton ;
 * ce n'est pas la première fois, mais presque personne ne le déclare. La
 * saison du bâtiment arrive, la cadence est sous pression, et un cariste
 * intérimaire conduit avec une habilitation expirée. Six décisions, chacune
 * précédée de ce qu'une responsable d'exploitation reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "signaux",
    t: "Les presque-accidents signalent un danger qu'on ne traite pas : piétons et chariots se croisent partout, et la plupart des alertes ne remontent pas",
  },
  {
    id: "habilitation",
    t: "Des caristes conduisent sans formation à jour : c'est la compétence qui manque",
  },
  {
    id: "imprudence",
    t: "Le cariste de jeudi a été imprudent : c'est un comportement individuel à sanctionner",
  },
  {
    id: "chauffeurs",
    t: "Les chauffeurs des transporteurs ne respectent pas le site : c'est aux transporteurs de régler ça",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Un chariot frôle un piéton",
    jusqua: 2,
    messages: () => [
      {
        de: "Thierry Gomez",
        role: "Chef d'équipe quais",
        heure: "06:50",
        alerte: true,
        texte:
          "Agathe, jeudi soir au quai 4 : Rémi sortait d'une remorque en marche arrière avec deux palettes, un chauffeur passait derrière pour rejoindre l'accueil. Il s'en est fallu d'un mètre. Personne de blessé. Rémi est secoué.",
      },
      {
        de: "Arnaud Lefebvre",
        role: "Directeur logistique",
        heure: "08:10",
        texte:
          "J'ai su pour jeudi. La saison commence dans cinq semaines et on est déjà à 106 palettes par heure au lieu de 112. Je compte sur toi pour que ça ne se reproduise pas, et pour que les camions partent à l'heure.",
      },
      {
        de: "Mariam Diallo",
        role: "Préparatrice de commandes",
        heure: "09:25",
        texte:
          "Ce qui est arrivé jeudi, on le vit toutes les semaines dans l'allée centrale. Personne ne le dit, c'est tout.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "registre",
        titre: "Relire le registre des presque-accidents du trimestre dernier",
        cout: 1,
        nature: "decisive",
        resultat:
          "Six presque-accidents déclarés en treize semaines. Les chefs d'équipe, interrogés un par un, en citent quatre à cinq par semaine. Deux des six déclarants ont reçu un avertissement pour « non-respect des consignes ». Depuis, plus rien n'a été écrit.",
      },
      {
        id: "quais",
        titre: "Observer les quais pendant deux heures de pointe",
        cout: 1,
        nature: "decisive",
        resultat:
          "Vingt-trois croisements piétons-chariots par heure dans l'allée centrale, entre les quais 3 à 6 et l'accueil chauffeurs. Pas de marquage au sol, pas de passage protégé : pour signer leurs bons, les chauffeurs traversent la zone où les chariots reculent.",
      },
      {
        id: "habilitations",
        titre: "Vérifier les habilitations des caristes",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Treize caristes sur quatorze ont leur formation et leur autorisation de conduite à jour. Dylan Fournier, intérimaire depuis deux mois, a un CACES expiré depuis trois semaines ; il conduit tous les jours. Rémi, lui, est à jour.",
      },
      {
        id: "statistiques",
        titre: "Comparer le taux d'accidents aux autres sites du groupe",
        cout: 1,
        nature: "bruit",
        resultat:
          "Deux accidents avec arrêt sur les douze derniers mois : le taux de fréquence de la plateforme est dans la moyenne des sites logistiques du groupe. Le tableau ne compte que les accidents, pas les presque-accidents.",
      },
      {
        id: "qhse",
        titre: "Appeler Nadège Coulon, responsable QHSE du groupe",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Nadège : « Ne cherche pas le coupable de jeudi. Cherche combien de fois c'est arrivé sans que personne ne l'écrive, et où. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous avant la réunion de vendredi ?",
    options: [
      {
        t: "Rappeler les consignes à tous et sanctionner le cariste de jeudi",
        d: "Un avertissement écrit pour Rémi, une note affichée aux quais. Ne coûte rien.",
      },
      {
        t: "Organiser un quart d'heure sécurité à chaque prise de poste",
        d: "Toutes les équipes, cette semaine : on relit les consignes ensemble. 400 €, un peu de cadence perdue.",
      },
      {
        t: "Analyser l'incident avec l'équipe, sans chercher de coupable, et tracer une allée provisoire",
        d: "Une heure avec Rémi, le chauffeur et le chef d'équipe ; un marquage au sol dès mardi ; une fiche de déclaration simplifiée. 2 500 €.",
      },
      {
        t: "Ne rien changer : personne n'a été blessé",
        d: "Les quais tournent, la saison approche.",
      },
    ],
    reactions: [
      [
        {
          de: "Thierry Gomez",
          role: "Chef d'équipe quais",
          texte:
            "Rémi a signé son avertissement sans un mot. Dans la salle de pause, le message est passé : celui qui parle, on le punit.",
        },
      ],
      [
        {
          de: "Thierry Gomez",
          role: "Chef d'équipe quais",
          texte:
            "Les quarts d'heure ont eu lieu. Tout le monde a écouté, tout le monde connaît les consignes. Ce n'est pas ça qui manquait.",
        },
      ],
      [
        {
          de: "Rémi Garnaud",
          role: "Cariste",
          texte:
            "Je croyais être convoqué pour un avertissement. On a surtout parlé de l'allée. Depuis mardi, les chauffeurs passent par le marquage, et deux collègues ont rempli la nouvelle fiche.",
        },
      ],
      [
        {
          de: "Mariam Diallo",
          role: "Préparatrice de commandes",
          texte: "Rien n'a changé dans l'allée centrale. On fait attention, comme d'habitude.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Le CACES de Dylan",
    jusqua: 4,
    messages: (ctx) => [
      {
        de: "Agence d'intérim",
        role: "Chargée de compte",
        heure: "10:15",
        alerte: true,
        texte:
          "Madame Bonnefoy, en préparant le renouvellement de mission de Dylan Fournier, nous avons vu que son CACES a expiré depuis plus d'un mois. Que souhaitez-vous faire ?",
      },
      {
        de: "Thierry Gomez",
        role: "Chef d'équipe quais",
        heure: "11:00",
        texte:
          "Dylan est un de mes plus rapides. Si on me l'enlève maintenant, je perds un chariot avant la saison.",
      },
      {
        de: "Tableau de bord de la plateforme",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Fin de semaine 2 : ${ctx.declares} presque-accidents déclarés depuis le début du trimestre, indice de risque aux quais ${ctx.risque}, cadence ${ctx.cadence} palettes par heure.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "reglement",
        titre: "Demander au service juridique ce qu'on risque",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Conduire un chariot exige une formation et une autorisation de conduite délivrée par l'employeur. Si Dylan est en cause dans un accident grave sans habilitation à jour, la faute inexcusable de l'employeur est quasi certaine : l'assureur estime le surcoût à 60 000 € au moins, en plus de l'accident lui-même.",
      },
      {
        id: "agence",
        titre: "Demander à l'agence ce que coûte chaque solution",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Recyclage CACES : deux jours en semaine 4, 900 € ; d'ici là, Dylan peut préparer des commandes. Remplacement : l'agence n'a pas de cariste habilité disponible avant la semaine 5, et il lui faudra quelques semaines pour connaître le site.",
      },
    ],
    question: "Que faites-vous pour Dylan ?",
    options: [
      {
        t: "Le retirer des chariots et lui payer le recyclage",
        d: "Il prépare des commandes deux semaines, formation en semaine 4. 900 €, un peu de cadence en moins.",
      },
      {
        t: "Le laisser conduire jusqu'à la fin de la saison",
        d: "Il est rapide et connaît les quais. Le recyclage attendra le trimestre prochain.",
      },
      {
        t: "Le rendre à l'agence et demander un cariste habilité",
        d: "Un chariot de moins deux semaines, puis un remplaçant qui découvre le site.",
      },
    ],
    reactions: [
      [
        {
          de: "Dylan Fournier",
          role: "Cariste intérimaire",
          texte:
            "Merci. Je n'osais pas dire que mon CACES avait expiré, j'avais peur de perdre la mission.",
        },
      ],
      [
        {
          de: "Thierry Gomez",
          role: "Chef d'équipe quais",
          texte: "Dylan reste sur son chariot. Il fait ses palettes, comme d'habitude.",
        },
      ],
      [
        {
          de: "Agence d'intérim",
          role: "Chargée de compte",
          texte:
            "C'est noté. Nous vous envoyons Samir Haddad, habilité, à partir du lundi de la semaine 5.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Avant la saison",
    jusqua: 6,
    messages: (ctx) => [
      {
        de: "Léo Chaumet",
        role: "Planificateur transport",
        heure: "09:40",
        alerte: true,
        texte:
          "À partir de la semaine 6, les agences commandent 10 % de plus, jusqu'à la semaine 11. Plus de camions à quai en même temps, des chauffeurs qui ne connaissent pas le site, et quatre intérimaires de plus en préparation.",
      },
      {
        de: "Tableau de bord de la plateforme",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Fin de semaine 4 : ${ctx.declares} presque-accidents déclarés depuis le début du trimestre, ${ctx.accidents}. Indice de risque aux quais : ${ctx.risque}.`,
      },
    ],
    sources: [
      {
        id: "plan",
        titre: "Dessiner avec les chefs d'équipe la carte des croisements",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${
            Number(ctx.declaresN) >= 8
              ? `Sur les ${ctx.declares} fiches déclarées, sept sur dix placent le danger au même endroit`
              : `Trop peu de fiches déclarées pour une carte (${ctx.declares}), mais les chefs d'équipe placent le danger au même endroit`
          } : l'allée centrale entre les quais 3 à 6 et l'accueil chauffeurs. Une allée piétonne protégée par des barrières, et l'accueil déplacé en bout de quai, coûtent 7 000 € et une semaine de travaux au ralenti. Sur les sites du groupe qui l'ont fait, les croisements ont baissé de plus de moitié.`,
      },
      {
        id: "campagnes",
        titre: "Relire le bilan des campagnes de consignes précédentes",
        cout: 0.5,
        nature: "utile",
        resultat:
          "La campagne « gilet et klaxon » de l'an dernier : les croisements dangereux ont baissé de 15 % la première semaine, puis sont revenus à leur niveau en un mois. Celle d'il y a deux ans, pareil.",
      },
    ],
    question: "Comment préparez-vous les quais pour la saison ?",
    options: [
      {
        t: "Séparer physiquement les flux : allée piétonne protégée, accueil chauffeurs en bout de quai",
        d: "Barrières, passages piétons, nouvel accueil. 7 000 €, des quais au ralenti pendant les travaux de la semaine 6.",
      },
      {
        t: "Relancer une campagne de consignes : gilets, klaxon à chaque croisement",
        d: "Affiches, rappel à chaque prise de poste, contrôles des chefs d'équipe. 1 200 €.",
      },
      {
        t: "Interdire aux chauffeurs de sortir de leur cabine pendant le chargement",
        d: "Un protocole de sécurité signé par chaque transporteur, les bons signés à la fenêtre. 300 €.",
      },
      {
        t: "Ne rien changer avant la saison",
        d: "Les quais sont déjà pleins ; on verra après.",
      },
    ],
    reactions: [
      [
        {
          de: "Thierry Gomez",
          role: "Chef d'équipe quais",
          texte:
            "Les barrières sont posées, les chauffeurs signent à l'accueil en bout de quai. Les caristes disent qu'ils reculent enfin sans se retourner toutes les trois secondes.",
        },
      ],
      [
        {
          de: "Mariam Diallo",
          role: "Préparatrice de commandes",
          texte:
            "Tout le monde a son gilet et les chariots klaxonnent. Avec le bruit des quais, on n'entend plus que ça.",
        },
      ],
      [
        {
          de: "Paulo Teixeira",
          role: "Chauffeur d'un transporteur",
          texte:
            "On reste dans la cabine, d'accord. Mais pour vérifier le calage de ma remorque, il faut bien que je descende.",
        },
      ],
      [
        {
          de: "Léo Chaumet",
          role: "Planificateur transport",
          texte: "Les créneaux de la semaine 6 sont pleins. On va charger serré.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "La saison bat son plein",
    jusqua: 8,
    messages: (ctx) => [
      {
        de: "Arnaud Lefebvre",
        role: "Directeur logistique",
        heure: "08:30",
        alerte: true,
        texte: `${ctx.retard} palettes attendent d'être chargées et les agences appellent. Il faut tenir la cadence jusqu'à la semaine 11. Je veux ta proposition lundi.`,
      },
      {
        de: "Tableau de bord de la plateforme",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Fin de semaine 6 : cadence ${ctx.cadence} palettes par heure, indice de risque aux quais ${ctx.risque}.`,
      },
    ],
    sources: [
      {
        id: "vagues",
        titre: "Regarder comment les commandes arrivent dans la semaine",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "45 % des palettes de la semaine sont commandées pour le lundi et le mardi, par habitude des agences. Ces deux jours-là, tous les quais sont pleins à la fois et l'indice de risque double ; le jeudi, la moitié des quais attend. Quand un site a demandé aux agences de lisser, elles ont accepté six fois sur dix.",
      },
      {
        id: "prime",
        titre: "Relire le bilan de la prime au rendement de l'an dernier",
        cout: 0.5,
        nature: "utile",
        resultat:
          "La prime a fait gagner 6 % de cadence pendant cinq semaines. Sur la même période : deux accidents avec arrêt, et 14 000 € de racks et de portes de quai heurtés.",
      },
    ],
    question: "Comment passez-vous le pic de la saison ?",
    options: [
      {
        t: "Mettre une prime au rendement jusqu'à la fin de la saison",
        d: "Une prime par palette au-delà de 110 par heure, semaines 7 à 11. 1 800 € par semaine.",
      },
      {
        t: "Ouvrir le samedi matin, avec un animateur sécurité",
        d: "Cinq heures de quai de plus par semaine, des volontaires. 3 600 € par semaine.",
      },
      {
        t: "Demander aux agences de lisser leurs commandes sur la semaine",
        d: "Moins de camions à quai en même temps, si elles acceptent. Les directeurs d'agence décideront.",
      },
      {
        t: "Faire avec les équipes actuelles",
        d: "Pas de dépense. Les quais chargeront ce qu'ils pourront.",
      },
    ],
    reactions: [
      [
        {
          de: "Rémi Garnaud",
          role: "Cariste",
          texte: "La prime, tout le monde la veut. Les chariots roulent plus vite dans l'allée.",
        },
      ],
      [
        {
          de: "Thierry Gomez",
          role: "Chef d'équipe quais",
          texte:
            "Huit volontaires pour samedi. Le lundi matin est moins violent : une partie du retard est déjà partie.",
        },
      ],
      null,
      [
        {
          de: "Thierry Gomez",
          role: "Chef d'équipe quais",
          texte: "On fera ce qu'on peut. Lundi, tous les quais étaient pleins à 7 heures.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Que faire des signaux",
    jusqua: 10,
    messages: (ctx) => [
      {
        de: "Arnaud Lefebvre",
        role: "Directeur logistique",
        heure: "09:00",
        alerte: true,
        texte:
          "Le comité de direction propose un challenge « zéro accident » sur les plateformes : une prime collective si aucun accident ni incident n'est déclaré d'ici la fin du trimestre. Tu en penses quoi ?",
      },
      {
        de: "Mariam Diallo",
        role: "Préparatrice de commandes",
        heure: "14:30",
        texte:
          "Hier au quai 7, un camion a avancé pendant que le chariot était encore dans la remorque. Le cariste a eu le temps de freiner.",
      },
      {
        de: "Tableau de bord de la plateforme",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Fin de semaine 8 : ${ctx.declares} presque-accidents déclarés depuis le début du trimestre, ${ctx.accidents}. Indice de risque aux quais : ${ctx.risque}.`,
      },
    ],
    sources: [
      {
        id: "fiches",
        titre: "Relire toutes les fiches de presque-accident du trimestre",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          Number(ctx.camionsN) >= 2
            ? `${ctx.declares} fiches depuis la semaine 1, dont ${ctx.camions} depuis la semaine 7 qui racontent la même chose : un camion qui avance pendant que le chariot est dans la remorque, faute de cales et de feu de quai. Des cales de roue et un feu couplé au chauffeur règleraient l'essentiel.`
            : `${ctx.declares} fiches depuis la semaine 1, dont ${ctx.camions} sur les camions : trop peu pour voir une tendance. Les chefs d'équipe disent que « les gars ne déclarent plus grand-chose ».`,
      },
      {
        id: "audit",
        titre: "Demander un devis au cabinet d'audit sécurité",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Un auditeur passe deux jours sur les quais en semaine 9 et rend ses recommandations aussitôt : 3 000 €. Il voit ce qu'on ne lui a pas déclaré, mais une seule fois.",
      },
    ],
    question: "Que faites-vous des presque-accidents ?",
    options: [
      {
        t: "Lancer le challenge « zéro accident »",
        d: "Une prime collective de 3 000 € en fin de trimestre si rien n'est déclaré.",
      },
      {
        t: "Analyser chaque fiche avec les équipes, chaque semaine, et afficher ce qui a changé",
        d: "Un quart d'heure sécurité hebdomadaire consacré aux fiches, et les corrections dans la foulée. 300 € par semaine.",
      },
      {
        t: "Faire auditer les quais par un cabinet extérieur",
        d: "Deux jours d'observation en semaine 9, des recommandations appliquées tout de suite. 3 000 €.",
      },
      {
        t: "Continuer comme aujourd'hui",
        d: "Les fiches sont classées par le chef d'équipe.",
      },
    ],
    reactions: [
      [
        {
          de: "Élus du CSE",
          role: "Plateforme de Saint-Quentin-Fallavier",
          texte:
            "Une prime si rien n'est déclaré : vous savez ce que ça va donner. Plus personne ne remplira une fiche.",
        },
      ],
      [
        {
          de: "Thierry Gomez",
          role: "Chef d'équipe quais",
          texte:
            "Premier quart d'heure sur les fiches : les gars ont vu que leurs fiches servaient à quelque chose. Trois nouvelles sont arrivées le lendemain.",
        },
      ],
      [
        {
          de: "Thierry Gomez",
          role: "Chef d'équipe quais",
          texte: "L'auditeur arrive lundi. Il a demandé à voir les quais à l'heure de pointe.",
        },
      ],
      [
        {
          de: "Mariam Diallo",
          role: "Préparatrice de commandes",
          texte:
            "J'ai rempli une fiche pour le camion du quai 7. Je ne sais pas ce qu'elle est devenue.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Finir le trimestre",
    jusqua: 13,
    messages: (ctx) => [
      {
        de: "Arnaud Lefebvre",
        role: "Directeur logistique",
        heure: "08:30",
        alerte: true,
        texte: `Trois semaines avant la fin du trimestre, ${ctx.retard} palettes attendent d'être chargées. Les agences veulent savoir quand elles seront livrées. Qu'est-ce que tu prévois ?`,
      },
    ],
    sources: [
      {
        id: "attente",
        titre: "Regarder ce qu'il y a dans les palettes en attente",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Six palettes en attente sur dix sont du réassort que les agences peuvent recevoir la semaine suivante sans rupture, si on leur donne une date ferme. Le reste, ce sont des chantiers qui attendent leur matériel.",
      },
    ],
    question: "Comment finissez-vous le trimestre ?",
    options: [
      {
        t: "Charger d'abord les chantiers, et donner une date ferme aux agences pour le réassort",
        d: "Le retard ne baisse pas plus vite, mais les agences s'organisent.",
      },
      {
        t: "Charger deux remorques par quai en même temps pour rattraper le retard",
        d: "Des renforts intérimaires, deux équipes par quai. 4 500 € par semaine, la cadence monte vite.",
      },
      {
        t: "Faire venir trois caristes d'un prestataire",
        d: "Des caristes expérimentés, qui ne connaissent pas le site. 4 000 € par semaine.",
      },
      {
        t: "Ne rien changer",
        d: "Le trimestre finira où il doit.",
      },
    ],
    reactions: [
      [
        {
          de: "Arnaud Lefebvre",
          role: "Directeur logistique",
          texte:
            "Les directeurs d'agence m'ont appelé : avec une date ferme, ils s'organisent. Les chantiers sont servis.",
        },
      ],
      [
        {
          de: "Thierry Gomez",
          role: "Chef d'équipe quais",
          texte:
            "Deux remorques par quai, ça charge. Mais on travaille entre deux camions, et les chariots se croisent à l'arrière des remorques.",
        },
      ],
      [
        {
          de: "Thierry Gomez",
          role: "Chef d'équipe quais",
          texte:
            "Les trois caristes du prestataire sont bons. Il faut juste leur montrer l'allée piétonne deux fois par jour.",
        },
      ],
      [
        {
          de: "Arnaud Lefebvre",
          role: "Directeur logistique",
          texte: "Le trimestre se termine. On fera le point lundi.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Écouter les signaux et traiter à la source", chemin: [2, 0, 0, 2, 1, 0] },
  { nom: "Consignes, sanctions et cadence", chemin: [0, 1, 1, 0, 0, 1] },
  { nom: "Attentiste", chemin: [3, 1, 3, 3, 3, 3] },
] as const;

/**
 * Les réflexes du métier sous pression : chercher un coupable, rappeler la
 * consigne, garder la cadence coûte que coûte. [décision, option].
 */
export const REFLEXES = [
  [0, 0],
  [1, 1],
  [2, 1],
  [3, 0],
  [4, 0],
  [5, 1],
] as const;

export const REPONSES = {
  lissageAccepte:
    "Les directeurs d'agence sont d'accord : à partir de la semaine 7, chacun a un jour de commande attribué. Les lundis seront moins chargés.",
  lissageRefuse:
    "Les directeurs d'agence refusent : leurs artisans commandent le vendredi pour le lundi, ils ne veulent pas les faire attendre. Deux agences ont accepté de décaler une partie de leur réassort.",
} as const;
