/**
 * LE SITE QUI NE VEND PAS — le contenu de l'épisode.
 *
 * Pauline Duval est responsable du commerce en ligne d'Arvel Distribution. Le
 * site de commande pour les artisans est ouvert depuis six mois : 8 000
 * visites par semaine, soixante commandes. Les agences le voient comme un
 * concurrent et n'en parlent pas à leurs clients, le prestataire publicitaire
 * propose d'acheter plus de visites, et le comité de direction se demande
 * s'il faut couper le budget. Six décisions, chacune précédée de ce qu'une
 * responsable reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "entonnoir",
    t: "Les artisans viennent, mais l'entonnoir fuit : compte trop long à ouvrir, prix pro invisibles, disponibilité incertaine",
  },
  {
    id: "agences",
    t: "Les agences voient le site comme un concurrent et ne le recommandent pas",
  },
  {
    id: "trafic",
    t: "Le site manque de visibilité : il faut plus de visiteurs",
  },
  { id: "site", t: "Le site est daté et peu pratique : il faut le refaire" },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Beaucoup de visites, peu de commandes",
    jusqua: 3,
    messages: () => [
      {
        de: "Tableau de bord du site",
        role: "Envoi automatique",
        heure: "07:30",
        alerte: true,
        texte:
          "Semaine dernière : 8 100 visites, 60 commandes, soit un taux de conversion de 0,74 %. Le plan d'affaires prévoyait 130 commandes par semaine à ce stade.",
      },
      {
        de: "Bénédicte Rossignol",
        role: "Directrice générale adjointe",
        heure: "08:45",
        texte:
          "Pauline, six mois après l'ouverture, le comité de direction se demande s'il faut continuer à financer le site. Dis-moi vendredi ce que tu fais pour qu'il vende.",
      },
      {
        de: "Valentin Chabert",
        role: "Prestataire publicitaire",
        heure: "10:10",
        texte:
          "Bonjour Pauline, le coût par visite n'a jamais été aussi bas. Avec 4 000 € par semaine au lieu de 2 000, on vous amène presque deux fois plus de monde. On lance ?",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "entonnoir",
        titre: "Reconstituer l'entonnoir de la semaine dernière, étape par étape",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "8 100 visites, dont 5 600 de professionnels. 1 950 voient leurs prix pro : les autres n'ont pas de compte, ou attendent que leur agence valide leur demande — quatre jours en moyenne, et 62 % abandonnent avant. 195 paniers, 60 commandes : six paniers sur dix s'arrêtent à l'étape de livraison.",
      },
      {
        id: "artisans",
        titre: "Regarder dix artisans essayer de commander sur le site",
        cout: 1,
        nature: "decisive",
        resultat:
          "Six sur dix renoncent à la création de compte : « Il me faut l'accord de l'agence ? Je commanderai au comptoir. » Avant connexion, le site affiche les prix publics, 25 % au-dessus de leurs prix pro : « C'est plus cher qu'au comptoir. » Ceux qui vont au panier s'arrêtent sur la livraison : « Je ne sais pas si l'agence l'a en stock demain matin. »",
      },
      {
        id: "publicite",
        titre: "Lire le rapport mensuel du prestataire publicitaire",
        cout: 1,
        nature: "bruit",
        resultat:
          "2 200 visites achetées par semaine, à 0,90 € la visite, en baisse de 12 % sur trois mois. Le site est premier sur « outillage pro Lyon ». Le rapport ne dit rien des commandes.",
      },
      {
        id: "agences",
        titre: "Appeler trois directeurs d'agence",
        cout: 1,
        nature: "utile",
        resultat:
          "Baptiste Lantelme, à Vaulx-en-Velin : « Chaque commande en ligne sort de mon chiffre, et de la prime de mes vendeurs. Je ne vais pas leur demander d'en parler. » Les demandes de compte arrivent dans la boîte de l'agence ; personne n'est chargé de les valider.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Bénédicte",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Bénédicte : « Avant d'acheter des visiteurs, regarde où tu perds ceux que tu as déjà. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous avant le point de vendredi ?",
    options: [
      {
        t: "Doubler la publicité pour faire venir plus d'artisans",
        d: "4 000 € par semaine au lieu de 2 000, dès la semaine 2. Le prestataire promet presque deux fois plus de visites.",
      },
      {
        t: "Corriger les deux blocages : compte ouvert en dix minutes avec le SIRET, prix pro affichés dès la connexion",
        d: "6 000 € de développement, en ligne en semaine 2. Le compte ne passe plus par la validation de l'agence.",
      },
      {
        t: "Lancer une refonte complète du site",
        d: "Une agence web, 30 000 €, dont la moitié à la commande. Livraison annoncée en semaine 10.",
      },
      {
        t: "Attendre le printemps : les chantiers vont reprendre",
        d: "Ne coûte rien. La publicité continue à 2 000 € par semaine.",
      },
    ],
    reactions: [
      [
        {
          de: "Valentin Chabert",
          role: "Prestataire publicitaire",
          texte:
            "C'est parti : nouvelles annonces, nouveaux mots-clés. Vous allez voir le compteur de visites grimper dès la semaine prochaine.",
        },
      ],
      [
        {
          de: "Ousmane Diop",
          role: "Chef de projet web",
          texte:
            "La vérification du SIRET est branchée, et les prix pro s'affichent à la connexion. Un artisan de Givors a ouvert son compte et commandé en douze minutes ce matin.",
        },
      ],
      [
        {
          de: "Tristan Keller",
          role: "Chef de projet, agence web",
          texte:
            "Merci pour votre confiance. Ateliers de cadrage la semaine prochaine ; d'ici la livraison, on évite de toucher au site actuel.",
        },
      ],
      [
        {
          de: "Bénédicte Rossignol",
          role: "Directrice générale adjointe",
          texte:
            "Le printemps aidera les agences autant que le site. Qu'est-ce qui change, concrètement, pour les artisans qui ne commandent pas ?",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "Les agences freinent",
    jusqua: 5,
    messages: (ctx) => [
      {
        de: "Baptiste Lantelme",
        role: "Directeur de l'agence de Vaulx-en-Velin",
        heure: "09:20",
        alerte: true,
        texte:
          "Pauline, je te le dis franchement : mes vendeurs voient le site comme un concurrent. Chaque commande en ligne, c'est de la prime en moins pour eux. Personne ne va pousser les clients vers toi.",
      },
      {
        de: "Tableau de bord du site",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 3 : ${ctx.visites} visites, ${ctx.commandes} commandes, ${ctx.conversion} de conversion. ${ctx.agences} agences sur 14 recommandent le site à leurs clients.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "cannibalisation",
        titre: "Regarder qui commande en ligne, et ce que ces clients achètent encore au comptoir",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "85 % des commandes en ligne viennent de clients déjà rattachés à une agence. Leurs achats au comptoir n'ont pas baissé (−1 % sur six mois) : en ligne, ils commandent le soir et le week-end, ce qu'ils achetaient avant sur le site d'un concurrent. La perte que les agences redoutent n'existe pas ; mais leur prime n'en sait rien.",
      },
      {
        id: "primes",
        titre: "Relire le plan de prime des comptoirs",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Les vendeurs touchent 3 % de la marge de leur agence au-delà de l'objectif. Les ventes en ligne sont comptées au siège, pas en agence. ${
            ctx.corrige
              ? "Depuis la semaine 2, les comptes s'ouvrent avec le SIRET, sans passer par l'agence."
              : "Les demandes de compte attendent toujours la validation de l'agence : quatre jours en moyenne."
          }`,
      },
    ],
    question: "Que faites-vous avec les agences ?",
    options: [
      {
        t: "Attribuer chaque vente en ligne à l'agence du client, dans son chiffre et dans la prime des comptoirs",
        d: "2 % du chiffre d'affaires en ligne versés en prime aux comptoirs, dès la semaine 4.",
      },
      {
        t: "Faire signer une note de la direction : les agences doivent recommander le site",
        d: "Ne coûte rien. Bénédicte la signe lundi.",
      },
      {
        t: "Contourner les agences : un e-mailing direct aux artisans, avec 5 % de remise en ligne",
        d: "1 500 € d'envoi, et la remise sur leurs commandes en ligne. Des visites dès la semaine 4.",
      },
      {
        t: "Laisser les agences de côté : le site doit se vendre seul",
        d: "Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          de: "Baptiste Lantelme",
          role: "Directeur de l'agence de Vaulx-en-Velin",
          texte:
            "Si la vente en ligne compte dans notre chiffre, ça change tout. Mes vendeurs vont donner l'adresse du site à chaque client qui passe le soir.",
        },
      ],
      [
        {
          de: "Mickaël Blanchard",
          role: "Vendeur comptoir, agence de Bron",
          texte:
            "On a reçu la note. On a mis l'affiche au comptoir, comme demandé. Pour le reste, les clients préfèrent nous voir.",
        },
      ],
      [
        {
          de: "Valentin Chabert",
          role: "Prestataire publicitaire",
          texte:
            "L'e-mailing part mardi à 3 000 artisans. Avec la remise, on attend un bon taux d'ouverture.",
        },
      ],
      [
        {
          de: "Baptiste Lantelme",
          role: "Directeur de l'agence de Vaulx-en-Velin",
          texte: "Chacun son métier, alors. Le nôtre, c'est le comptoir.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Le nouveau tunnel de commande",
    jusqua: 7,
    messages: (ctx) => [
      {
        de: "Tristan Keller",
        role: "Chef de projet, agence web",
        heure: "11:00",
        alerte: true,
        texte: `Pauline, notre nouveau tunnel de commande est prêt : une page au lieu de quatre, le stock de l'agence et la date de retrait affichés. Chez nos autres clients, +30 % de commandes. ${
          ctx.refonte
            ? "Il fera partie de la refonte, mais on peut le brancher sur le site actuel dès lundi."
            : "On le met en ligne lundi ?"
        }`,
      },
      {
        de: "Tableau de bord du site",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 5 : ${ctx.commandes} commandes, ${ctx.conversion} de conversion. ${ctx.abandon} des paniers ne deviennent pas des commandes.`,
      },
    ],
    sources: [
      {
        id: "abandons",
        titre: "Lire les paniers abandonnés de la semaine",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les paniers s'arrêtent surtout à l'étape de livraison : l'artisan ne sait pas si l'agence a le produit, ni quand il peut passer le prendre. 58 % des paniers sont faits sur téléphone, depuis le chantier. Les « +30 % » de l'agence web viennent d'un site de décoration pour particuliers, mesurés sur ordinateur.",
      },
      {
        id: "recette",
        titre: "Essayer le nouveau tunnel sur l'ordinateur du bureau",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Sur grand écran, le tunnel est clair et rapide : trois clics jusqu'à la confirmation, le stock de l'agence bien en vue. Rien à redire.",
      },
    ],
    question: "Que faites-vous du nouveau tunnel ?",
    options: [
      {
        t: "Le mettre en ligne pour tout le monde lundi",
        d: "3 500 €. Tous les artisans l'ont dès la semaine 6.",
      },
      {
        t: "Le tester sur la moitié des visiteurs pendant deux semaines, puis le généraliser s'il gagne",
        d: "4 000 €, outil de test compris. Verdict à la fin de la semaine 7.",
      },
      {
        t: "Afficher seulement le stock de l'agence sur les fiches produits, sans toucher au tunnel",
        d: "2 500 €, en ligne en semaine 6. Une petite modification, que des artisans ont demandée.",
      },
      {
        t: "Ne pas toucher au tunnel",
        d: "On verra après le printemps.",
      },
    ],
    reactions: [
      [
        {
          de: "Tristan Keller",
          role: "Chef de projet, agence web",
          texte: "En ligne lundi matin pour tous. Vous verrez les chiffres d'ici la fin du mois.",
        },
      ],
      [
        {
          de: "Clémence Jaubert",
          role: "Analyste web",
          texte:
            "Le test est paramétré : un visiteur sur deux voit le nouveau tunnel, l'autre l'ancien. On compare les commandes, téléphone et ordinateur à part.",
        },
      ],
      [
        {
          de: "Ousmane Diop",
          role: "Chef de projet web",
          texte:
            "Le stock de l'agence du client s'affiche sur chaque fiche produit, avec « disponible demain 7 h » quand c'est le cas.",
        },
      ],
      [
        {
          de: "Tristan Keller",
          role: "Chef de projet, agence web",
          texte: "Dommage. Le tunnel est prêt, on le garde au chaud.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Le prestataire veut tripler la publicité",
    jusqua: 9,
    messages: (ctx) => [
      {
        de: "Valentin Chabert",
        role: "Prestataire publicitaire",
        heure: "10:30",
        alerte: true,
        texte:
          "Pauline, le printemps est la meilleure saison pour l'outillage. Je vous propose 6 000 € par semaine à partir de la semaine 8 : 5 000 visites de plus, garanties.",
      },
      {
        de: "Tableau de bord du site",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 7 : ${ctx.visites} visites, dont ${ctx.payantes} achetées en publicité ; ${ctx.commandes} commandes. Contribution du site à date : ${ctx.cumul}.`,
      },
    ],
    sources: [
      {
        id: "canaux",
        titre: "Comparer les commandes selon l'origine des visites",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `La publicité large amène ${ctx.partPayantes} des visites et moins d'une commande sur dix. Sept visiteurs payants sur dix sont des particuliers, que le site, réservé aux professionnels, refuse à la création de compte : une commande venue de la publicité coûte plus que sa marge. À l'inverse, 310 comptes ouverts n'ont jamais commandé ; ce sont des artisans, clients d'une agence.`,
      },
    ],
    question: "Que répondez-vous au prestataire ?",
    options: [
      {
        t: "Tripler la publicité pour le printemps",
        d: "6 000 € par semaine dès la semaine 8. Le prestataire promet 5 000 visites de plus.",
      },
      {
        t: "Arrêter la publicité large, et relancer avec leur agence les comptes ouverts qui n'ont jamais commandé",
        d: "1 500 € de relance, puis 600 € par semaine de publicité ciblée sur les inscrits. Un appel du comptoir à chacun.",
      },
      {
        t: "Arrêter toute publicité",
        d: "Économise la publicité dès la semaine 8.",
      },
      {
        t: "Garder la publicité telle quelle",
        d: "Le budget publicitaire ne change pas.",
      },
    ],
    reactions: [
      [
        {
          de: "Valentin Chabert",
          role: "Prestataire publicitaire",
          texte: "Parfait. Les nouvelles campagnes partent lundi, sur toute la région.",
        },
      ],
      [
        {
          de: "Clémence Jaubert",
          role: "Analyste web",
          texte:
            "La liste des 310 comptes est partie aux agences, triée par comptoir. Chaque vendeur appelle ses clients d'ici vendredi.",
        },
      ],
      [
        {
          de: "Valentin Chabert",
          role: "Prestataire publicitaire",
          texte:
            "Entendu. Je coupe les campagnes lundi. Vous perdrez de la visibilité, je préfère vous prévenir.",
        },
      ],
      [
        {
          de: "Valentin Chabert",
          role: "Prestataire publicitaire",
          texte: "Comme vous voulez. Je reste à votre disposition si vous changez d'avis.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Le printemps arrive",
    jusqua: 11,
    messages: () => [
      {
        de: "Bénédicte Rossignol",
        role: "Directrice générale adjointe",
        heure: "09:00",
        alerte: true,
        texte:
          "Les chantiers redémarrent. Le marketing propose une remise de 8 % sur toutes les commandes en ligne pendant un mois, pour faire décoller le site. Qu'est-ce que tu en penses ?",
      },
      {
        de: "Estelle Monnet",
        role: "Directrice de l'agence de Bron",
        heure: "14:40",
        texte:
          "Pauline, plusieurs clients me demandent s'ils peuvent commander en ligne le matin et passer prendre au comptoir en sortant du chantier.",
      },
    ],
    sources: [
      {
        id: "retraits",
        titre: "Regarder ce qu'achètent les artisans qui passent au comptoir",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Un artisan qui passe prendre une commande achète en moyenne 55 € de marge en plus au comptoir : vis, disques, gants, ce qu'il a oublié. ${
            ctx.attribution
              ? "Les comptoirs, qui touchent désormais la vente en ligne, se disent prêts à préparer les commandes web en deux heures."
              : "Les comptoirs disent qu'ils prépareront les commandes web « quand ils auront le temps » : elles ne comptent pas pour eux."
          }`,
      },
      {
        id: "promotion",
        titre: "Relire le bilan de la promotion d'automne sur le site",
        cout: 0.5,
        nature: "utile",
        resultat:
          "−10 % pendant trois semaines en octobre : +30 % de commandes en ligne, mais quatre sur dix étaient des achats que les clients faisaient d'habitude au comptoir, au prix plein. Le canal a perdu de la marge, et les agences s'en souviennent.",
      },
    ],
    question: "Que lancez-vous pour le printemps ?",
    options: [
      {
        t: "Lancer la remise de 8 % sur toutes les commandes en ligne",
        d: "Semaines 10 à 13. Le marketing prévoit 25 % de commandes en plus.",
      },
      {
        t: "Ouvrir le retrait en agence en deux heures, préparé par les comptoirs",
        d: "2 000 € d'organisation, dans les quatorze agences dès la semaine 10.",
      },
      {
        t: "Offrir la livraison sur chantier dès 300 € d'achat",
        d: "22 € par commande livrée, à partir de la semaine 10.",
      },
      {
        t: "Ne rien lancer",
        d: "Le printemps fera monter les commandes tout seul.",
      },
    ],
    reactions: [
      [
        {
          de: "Baptiste Lantelme",
          role: "Directeur de l'agence de Vaulx-en-Velin",
          texte:
            "Mes clients ont reçu la remise. Ceux qui passaient au comptoir le lundi commandent maintenant en ligne, 8 % moins cher.",
        },
      ],
      [
        {
          de: "Estelle Monnet",
          role: "Directrice de l'agence de Bron",
          texte:
            "On a dégagé une étagère « retraits web » derrière le comptoir. Premier client servi en une heure et demie.",
        },
      ],
      [
        {
          de: "Ousmane Diop",
          role: "Chef de projet web",
          texte: "La livraison offerte s'affiche dans le panier dès 300 €. Le transporteur suit.",
        },
      ],
      [
        {
          de: "Bénédicte Rossignol",
          role: "Directrice générale adjointe",
          texte: "Entendu. On regardera ce que donne le printemps.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Le comité veut couper",
    jusqua: 13,
    messages: (ctx) => [
      {
        de: "Étienne Rambert",
        role: "Directeur financier",
        heure: "08:15",
        alerte: true,
        texte: `Pauline, le comité de direction de lundi examine le budget du site. Contribution à date : ${ctx.cumul}, pour un budget à date de ${ctx.budgetADate}. Je proposerai de couper la publicité et de geler le site, sauf argument contraire.`,
      },
    ],
    sources: [
      {
        id: "dossier",
        titre: "Préparer l'entonnoir semaine par semaine pour le comité",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `De la semaine 1 à la semaine 11, la conversion est passée de 0,74 % à ${ctx.conversion}, et les commandes de 60 à ${ctx.commandes} par semaine. ${ctx.agences} agences sur 14 recommandent le site. Le contrat de l'agence web prévoit trois mois de préavis : geler le site n'économiserait pas le développement avant l'été, seulement la publicité.`,
      },
    ],
    question: "Que faites-vous avant le comité ?",
    options: [
      {
        t: "Proposer vous-même de couper : arrêter la publicité et geler le site",
        d: "La publicité s'arrête en semaine 12. Les agences en seront informées.",
      },
      {
        t: "Présenter l'entonnoir mesuré et un plan chiffré : garder le budget, sans publicité large",
        d: "Une demi-journée de préparation. La publicité restante va aux comptes inscrits.",
      },
      {
        t: "Demander une rallonge pour une campagne de printemps",
        d: "5 000 € de publicité par semaine en semaines 12 et 13, pour montrer des visites.",
      },
      {
        t: "Laisser le comité trancher sur le tableau de bord",
        d: "Pas de dossier. Le comité décidera lundi.",
      },
    ],
    reactions: [
      [
        {
          de: "Étienne Rambert",
          role: "Directeur financier",
          texte:
            "Merci de ta lucidité. Le comité acte le gel du site ; les agences seront prévenues dans la semaine.",
        },
      ],
      [
        {
          de: "Bénédicte Rossignol",
          role: "Directrice générale adjointe",
          texte:
            "Ton entonnoir a convaincu le comité : on voit enfin où passent les artisans, et ce que chaque correction rapporte. Le budget est maintenu.",
        },
      ],
      [
        {
          de: "Étienne Rambert",
          role: "Directeur financier",
          texte:
            "Le comité accorde la rallonge, à titre exceptionnel. On regardera les commandes, pas les visites.",
        },
      ],
      null,
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  {
    nom: "Réparer l'entonnoir et aligner les agences",
    chemin: [1, 0, 1, 1, 1, 1],
  },
  { nom: "Acheter du trafic", chemin: [0, 2, 0, 0, 0, 2] },
  { nom: "Attentiste", chemin: [3, 3, 3, 3, 3, 3] },
] as const;

/**
 * Les réflexes du métier devant un site qui ne vend pas : acheter des visites
 * ou des commandes (publicité, remises), tout refaire ou tout déployer d'un
 * coup, passer en force sur les agences, couper : [décision, option].
 * Une option que le bilan juge défendable sur le meilleur chemin n'y figure
 * pas, pour que le bilan et ce constat ne se contredisent pas.
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 1],
  [1, 2],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  comiteCoupe:
    "Sans dossier, le comité a regardé le budget à date : la publicité est arrêtée et le site gelé à partir de la semaine 12. Les agences sont prévenues.",
  comiteGarde:
    "Le comité a hésité, puis maintenu le budget jusqu'à la fin du trimestre. Il attend des chiffres précis pour la suite.",
} as const;
