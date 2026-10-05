/**
 * LA FUSION DES AGENCES — le contenu de l'épisode.
 *
 * Jérôme Castaing dirige l'agence d'Arvel Distribution à Vienne. Arvel vient de
 * racheter les Établissements Combelle, le négoce familial installé à trois
 * rues : quatorze salariés, six cents artisans, et un ancien patron qui reste
 * six mois comme conseiller. Deux équipes, deux cultures, des postes en
 * double, deux logiciels, et des clients qui ne connaissent que leur vendeur.
 * Six décisions, chacune précédée de ce qu'un directeur reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "personnes",
    t: "Les clients du négoce suivent leurs vendeurs : ce qui menace le rachat, c'est leur départ, que l'incertitude et le choc des procédures fabriquent",
  },
  {
    id: "doublons",
    t: "Les doublons de postes, de logiciels et de tournées coûtent chaque semaine : il faut les supprimer au plus vite",
  },
  {
    id: "procedures",
    t: "Le négoce travaille sans règles : tant qu'il n'appliquera pas les procédures d'Arvel, rien ne sera maîtrisé",
  },
  {
    id: "prix",
    t: "Les clients du négoce partiront à cause des prix d'Arvel : il faut garder la grille tarifaire du négoce",
  },
] as const;

const VERONIQUE = {
  de: "Véronique Lansard",
  role: "Directrice régionale Rhône-Isère",
} as const;
const RAYMOND = {
  de: "Raymond Combelle",
  role: "Ancien dirigeant du négoce, conseiller",
} as const;
const SEBASTIEN = {
  de: "Sébastien Ponsard",
  role: "Commercial terrain, Combelle",
} as const;
const NAIMA = {
  de: "Naïma Tahiri",
  role: "Vendeuse comptoir, Combelle",
} as const;
const JOEL = {
  de: "Pierrick Daguerre",
  role: "Chef de comptoir, Combelle",
} as const;
const ELODIE = {
  de: "Ariane Ravier",
  role: "Cheffe de comptoir, Arvel Vienne",
} as const;
const CHRISTOPHE = {
  de: "Gilbert Aubin",
  role: "Chef des ventes, Arvel Vienne",
} as const;
const KADER = {
  de: "Kader Benmoussa",
  role: "Commercial terrain, Arvel Vienne",
} as const;
const TIAGO = {
  de: "Tiago Moreira",
  role: "Contrôleur de gestion régional",
} as const;
const YVES = {
  de: "Yves Lagarde",
  role: "Chef de projet informatique, siège",
} as const;
const ROLLAND = {
  de: "Timothée Rolland",
  role: "Maçon, client du négoce depuis 1994",
} as const;
const TABLEAU = {
  de: "Tableau de bord de l'agence",
  role: "Point hebdomadaire",
} as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Deux agences, une seule enseigne",
    jusqua: 3,
    messages: (ctx) => [
      {
        ...VERONIQUE,
        heure: "07:40",
        texte:
          "Jérôme, c'est signé : les Établissements Combelle sont à nous depuis vendredi. Le plan de rachat compte sur 66,5 k€ de marge par semaine pour les deux agences, et sur des doublons réglés d'ici la semaine 10. Je passe te voir en semaine 3.",
      },
      {
        ...RAYMOND,
        heure: "08:15",
        alerte: true,
        texte:
          "Bonjour Jérôme. Mes gars sont inquiets, vous vous en doutez : ils ont appris la vente par le journal. Je serai au comptoir tous les matins, comme d'habitude. Ça les rassure.",
      },
      {
        ...ELODIE,
        heure: "09:00",
        texte:
          "On a deux chefs de comptoir pour un seul comptoir. Le siège m'a dit que les procédures d'Arvel s'appliqueraient « rapidement ». Ça veut dire quoi, pour moi ?",
      },
      {
        ...TABLEAU,
        heure: "10:00",
        texte: `Marge combinée de la semaine dernière : ${ctx.marge}. Doublons : ${ctx.doublons} par semaine. Baromètre RH du négoce : ${ctx.inquietude} des salariés inquiets pour leur poste.`,
      },
    ],
    budget: 5,
    sources: [
      {
        id: "portefeuille",
        titre: "Analyser le portefeuille clients du négoce",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "620 artisans actifs. 76 % de la marge passe par quatre personnes : Sébastien (32 %), Naïma (18 %), Pierrick (14 %) et Raymond lui-même, pour ses quarante clients historiques (12 %). Sept artisans sur dix ne commandent qu'à leur interlocuteur. En 2019, quand un vendeur est parti chez un concurrent, près de la moitié de ses clients l'ont suivi. Les prix des deux agences sont à 1 % près : la centrale d'achat les avait déjà alignés.",
      },
      {
        id: "dejeuner",
        titre: "Déjeuner avec Sébastien, Naïma et Pierrick",
        cout: 1,
        nature: "decisive",
        resultat:
          "Personne ne leur a dit ce qu'ils deviennent. Sébastien a reçu deux appels du Comptoir Rhodanien depuis l'annonce. Naïma : « Ici, un maçon appelle à 7 h, il a son devis à 8 h et sa palette à 10 h. On nous dit que chez Arvel il faut 48 heures et la signature du chef des ventes : nos clients ne l'accepteront pas. » Pierrick : « Vos procédures, on peut les apprendre. Mais dites-nous d'abord où on sera. »",
      },
      {
        id: "doublons",
        titre: "Chiffrer les doublons avec Tiago, au contrôle de gestion",
        cout: 0.5,
        nature: "utile",
        resultat:
          "6,3 k€ par semaine : deux chefs de comptoir et deux assistantes commerciales (2,2 k€), deux logiciels avec ressaisie des commandes du négoce (2,8 k€), deux tournées de livraison qui se croisent dans Vienne (1,3 k€). Le plan de rachat les suppose réglés en semaine 10.",
      },
      {
        id: "audit",
        titre: "Relire le rapport d'audit d'acquisition",
        cout: 1,
        nature: "bruit",
        resultat:
          "Stock surévalué de 2 %, déjà déduit du prix. Bail commercial renouvelé jusqu'en 2034. Aucun litige en cours. Des comptes tenus à l'ancienne, mais justes.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Véronique",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Véronique : « Dans un rachat de négoce, on n'achète ni des murs ni un stock : on achète des clients, et les clients ont des visages. Regarde d'abord à qui ils parlent. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment lancez-vous l'intégration cette semaine ?",
    options: [
      {
        t: "Recevoir chacun cette semaine, et annoncer sous quinze jours qui fait quoi dans l'agence commune",
        d: "Quatorze entretiens, un repas des deux équipes, puis l'organisation cible en semaine 3, tournées comprises. 1 500 €.",
      },
      {
        t: "Appliquer dès lundi les procédures d'Arvel au négoce",
        d: "Devis validés par le chef des ventes, comptes ouverts par le siège, livraisons à J+1, une seule tournée dès la semaine 2. Aucun coût.",
      },
      {
        t: "Laisser les deux agences tourner comme avant, chacune de son côté",
        d: "Rien ne change pour personne pendant six mois. Aucun coût.",
      },
      {
        t: "Attendre le plan d'intégration détaillé du siège",
        d: "Il est promis pour la semaine 6. D'ici là, rien d'annoncé.",
      },
    ],
    reactions: [
      [
        {
          ...NAIMA,
          texte:
            "Vous êtes le premier à nous demander comment on travaille. On a parlé de nos clients pendant une heure. On attend la suite, mais on respire.",
        },
      ],
      [
        {
          ...SEBASTIEN,
          texte:
            "Timothée Rolland attendait son devis de dalle ce matin. Il l'aura jeudi, après validation. Il m'a demandé si j'étais encore quelqu'un, ici.",
        },
      ],
      [
        {
          ...ELODIE,
          texte:
            "Le négoce et nous avons livré le même chantier à Pont-Évêque, à une heure d'écart. Et chacun a fait sa remise.",
        },
      ],
      [
        {
          ...JOEL,
          texte:
            "Au comptoir, les gars m'ont demandé s'ils allaient être licenciés. Je n'ai rien su leur répondre.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "Deux chefs pour un comptoir",
    jusqua: 5,
    messages: (ctx) => [
      {
        ...JOEL,
        heure: "07:30",
        alerte: true,
        texte:
          "Ariane m'a demandé de remplir ses fiches de réception. Ça fait vingt-deux ans que je tiens ce comptoir. J'aimerais savoir si j'ai encore un poste.",
      },
      {
        ...ELODIE,
        heure: "11:10",
        texte:
          "Je ne peux pas diriger un comptoir où la moitié de l'équipe prend ses consignes ailleurs. Il faut trancher.",
      },
      {
        ...KADER,
        heure: "14:25",
        texte:
          "Pour info : Sébastien a déjeuné mardi avec le directeur du Comptoir Rhodanien. Tout le monde le sait au comptoir.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Clients du négoce qui commandent encore : ${ctx.clients} de sa marge au rachat. Salariés du négoce inquiets pour leur poste : ${ctx.inquietude}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "comptoir",
        titre: "Regarder qui sert quels clients au comptoir",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Pierrick sert en personne 140 artisans, qui le demandent par son prénom : 14 % de la marge du négoce. Ariane tient le stock le plus fiable de la région (99,2 % à l'inventaire) et fait tourner un comptoir de soixante passages par jour. Ils ne font pas le même métier : l'une organise, l'autre fidélise.",
      },
      {
        id: "rh",
        titre: "Demander aux ressources humaines ce que permet le contrat de Pierrick",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Redevenir vendeur, pour Pierrick, c'est une modification de son contrat : il peut la refuser, et la région a vu partir des chefs de comptoir pour moins que ça. Un rôle nouveau, au même salaire, ne pose aucune difficulté.",
      },
    ],
    question: "Que décidez-vous pour le comptoir ?",
    options: [
      {
        t: "Nommer Ariane cheffe du comptoir commun, et Pierrick responsable des comptes artisans",
        d: "Un rôle nouveau, au même salaire : les 140 artisans qu'il suit et l'accueil des clients du négoce. Annoncé lundi.",
      },
      {
        t: "Appliquer l'organigramme d'Arvel : Ariane cheffe de comptoir, Pierrick vendeur",
        d: "Clair, et conforme au siège. Pierrick garde son salaire, pas son titre.",
      },
      {
        t: "Faire codiriger le comptoir par Ariane et Pierrick",
        d: "Personne n'est déçu. Deux chefs, deux façons de faire.",
      },
      {
        t: "Attendre la fin du trimestre pour trancher",
        d: "Le temps de voir chacun à l'œuvre.",
      },
    ],
    reactions: [
      [
        {
          ...JOEL,
          texte:
            "Responsable des comptes artisans… Je ne savais pas que ça existait. Mes clients, je les connais tous : je m'y mets lundi.",
        },
      ],
      [
        {
          ...JOEL,
          texte: "J'ai compris. Je serai au comptoir lundi, derrière Ariane.",
        },
      ],
      [
        {
          ...ELODIE,
          texte:
            "Ce matin, Pierrick a fait livrer un client sans bon de commande. Je l'ai appris par le chauffeur.",
        },
      ],
      [
        {
          ...NAIMA,
          texte: "Personne ne sait qui décide au comptoir. Les clients non plus.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Raymond est toujours là",
    jusqua: 7,
    messages: (ctx) => [
      {
        ...CHRISTOPHE,
        heure: "09:20",
        alerte: true,
        texte:
          "Raymond a accordé soixante jours de délai de paiement à un maçon ce matin, sans m'en parler. Et il répète aux clients que « rien ne changera ». Qui dirige le négoce ?",
      },
      {
        ...RAYMOND,
        heure: "12:05",
        texte:
          "Jérôme, mes clients m'appellent : ils veulent savoir s'ils doivent rester. Je leur réponds ce que je peux. Personne ne m'a dit ce que vous attendiez de moi.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Marge combinée en semaine 5 : ${ctx.marge}. Clients du négoce qui commandent encore : ${ctx.clients}.`,
      },
    ],
    sources: [
      {
        id: "historiques",
        titre: "Appeler trois clients historiques de Raymond",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Timothée Rolland, maçon : « Je travaille avec Raymond depuis 1994. S'il me dit que vous êtes sérieux, je reste. S'il me dit qu'on l'a mis dehors, je vais voir ailleurs. » Les deux autres disent la même chose avec d'autres mots. Les quarante clients historiques de Raymond font 12 % de la marge du négoce.",
      },
      {
        id: "contrat",
        titre: "Relire le contrat de conseil de Raymond",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Six mois, deux jours par semaine. Mission : « accompagner l'intégration ». Rien de plus précis : ni ce qu'il fait, ni ce qu'il ne fait pas.",
      },
    ],
    question: "Quel rôle donnez-vous à Raymond ?",
    options: [
      {
        t: "Lui confier une mission : vous présenter, avec les vendeurs, à ses quarante clients historiques d'ici la semaine 10",
        d: "Des visites à deux, et plus de consignes au comptoir. 1 500 € de déjeuners.",
      },
      {
        t: "Lui demander de ne plus intervenir auprès de l'équipe ni des clients",
        d: "Il se limite aux questions que le siège lui pose. Aucun coût.",
      },
      {
        t: "Le laisser faire : il part dans quatre mois",
        d: "Il connaît tout le monde. Aucun coût.",
      },
      {
        t: "Lui confier la direction de l'équipe du négoce jusqu'à son départ",
        d: "L'équipe le connaît, elle sera rassurée. Il vous rend compte chaque semaine.",
      },
    ],
    reactions: [
      [
        {
          ...RAYMOND,
          texte:
            "Une tournée de mes clients avec vous ? Ça, je sais faire. On commence par Rolland mardi à 7 h : il est à l'heure, lui.",
        },
      ],
      null,
      [
        {
          ...CHRISTOPHE,
          texte:
            "Raymond a encore fait une remise de 12 % sur une commande de parpaings. C'est la troisième cette semaine.",
        },
      ],
      [
        {
          ...ELODIE,
          texte:
            "Le négoce a ses consignes, nous les nôtres. Les deux équipes ne se parlent plus qu'à la machine à café.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Un seul logiciel",
    jusqua: 9,
    messages: (ctx) => [
      {
        ...YVES,
        heure: "08:45",
        alerte: true,
        texte:
          "Jérôme, nous pouvons basculer le négoce sur le logiciel d'Arvel le week-end de la semaine 9 : un consultant de l'éditeur, deux nuits de reprise de données, et tout le monde sur le même outil le lundi.",
      },
      {
        ...TIAGO,
        heure: "10:30",
        texte: `La ressaisie des commandes du négoce et les deux licences coûtent 2,8 k€ par semaine. Doublons de la semaine 7, tout compris : ${ctx.doublons}.`,
      },
      {
        ...(ctx.naimaLa ? NAIMA : ELODIE),
        heure: "15:10",
        texte:
          "Dans le logiciel d'Arvel, je ne trouve pas où mettre les prix négociés avec chaque artisan. Au négoce, il y en a 1 900.",
      },
    ],
    sources: [
      {
        id: "bourgoin",
        titre: "Appeler l'agence de Bourgoin, rachetée il y a deux ans",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Bourgoin a basculé en un week-end : un tiers des prix spéciaux mal repris, trois semaines de factures fausses, onze clients partis. Son directeur : « Si c'était à refaire, je ferais vérifier les fiches clients par ceux qui les connaissent, et je formerais en binômes avant de basculer le comptoir. Deux semaines de plus, et rien de cassé. »",
      },
      {
        id: "note",
        titre: "Lire la note du service informatique",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Bascule en un week-end : 3 000 € de consultant, un seul logiciel en semaine 10. Bascule en deux temps (fiches clients et prix vérifiés par les vendeurs, puis comptoir après formation) : 3 500 €, un seul logiciel en semaine 11. Garder les deux : 2 800 € par semaine, tant qu'il le faudra.",
      },
    ],
    question: "Comment unifiez-vous les outils ?",
    options: [
      {
        t: "Basculer tout le négoce le week-end de la semaine 9, comme le propose le siège",
        d: "Un consultant de l'éditeur, 3 000 €. Un seul logiciel dès la semaine 10.",
      },
      {
        t: "Basculer en deux temps : les fiches clients vérifiées par les vendeurs, puis le comptoir après une formation en binômes",
        d: "3 500 €. Un seul logiciel en semaine 11.",
      },
      {
        t: "Garder les deux logiciels jusqu'à l'été",
        d: "Aucun risque de bascule. La double saisie continue : 2 800 € par semaine.",
      },
    ],
    reactions: [
      [
        {
          ...YVES,
          texte:
            "C'est calé : le consultant arrive le vendredi soir de la semaine 9. Le lundi, tout le monde sur le même outil.",
        },
      ],
      [
        {
          ...ELODIE,
          texte:
            "Les binômes sont faits : un vendeur du négoce avec un vendeur d'Arvel. Ils vérifient les fiches clients ensemble. Ça discute beaucoup, et ça trouve des erreurs.",
        },
      ],
      [
        {
          ...TIAGO,
          texte: "Noté. Je laisse la ligne « double saisie » dans le budget du prochain trimestre.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Ce que le négoce fait mieux",
    jusqua: 11,
    messages: (ctx) => [
      {
        ...KADER,
        heure: "08:10",
        alerte: true,
        texte:
          "Trois de mes artisans m'ont dit la même chose cette semaine : « Chez Combelle, le devis arrive dans l'heure et la palette le lendemain à 7 h. Chez vous, il faut deux jours. » J'ai perdu un chantier de 18 k€ comme ça.",
      },
      {
        ...CHRISTOPHE,
        heure: "11:40",
        texte:
          "Les vendeurs du négoce font des devis de 4 000 € sans validation. Si on laisse faire, on ne maîtrise plus nos marges.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Marge combinée en semaine 9 : ${ctx.marge}. Clients du négoce qui commandent encore : ${ctx.clients}.`,
      },
    ],
    sources: [
      {
        id: "devis",
        titre: "Comparer les devis perdus des deux agences",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Arvel perd 31 % de ses devis de plus de 2 000 €, le négoce 12 %. La différence tient au délai : 46 heures en moyenne chez Arvel, 50 minutes au négoce. Les marges des devis du négoce sont à 0,4 point de celles d'Arvel.",
      },
      {
        id: "erreurs",
        titre: "Regarder les erreurs de chiffrage au comptoir du négoce",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Deux erreurs par an, toutes rattrapées par Pierrick ou Naïma, qui relisent les gros devis. Chez Arvel, personne au comptoir n'a jamais chiffré seul un devis de plus de 2 000 € : le premier mois, une erreur est probable, et un gros chantier mal chiffré coûte cher.",
      },
    ],
    question: "Que faites-vous de la réactivité du négoce ?",
    options: [
      {
        t: "Étendre à toute l'agence la délégation de devis jusqu'à 5 000 € et la tournée du matin",
        d: "Les vendeurs d'Arvel chiffrent seuls, comme ceux du négoce. La tournée express coûte 1 000 € par semaine.",
      },
      {
        t: "Rappeler à tous les procédures d'Arvel : devis validés par le chef des ventes, livraisons à J+1",
        d: "Les marges restent maîtrisées. Aucun coût.",
      },
      {
        t: "Laisser chaque équipe garder ses façons de faire",
        d: "Aucun coût, aucun changement.",
      },
      {
        t: "Commencer par les devis jusqu'à 2 000 €, relus par un vendeur du négoce, avant d'aller plus loin",
        d: "Une délégation plus étroite, sans tournée express. Aucun coût.",
      },
    ],
    reactions: [
      [
        {
          ...KADER,
          texte:
            "J'ai chiffré mon premier devis seul ce matin : 3 800 €, accepté à 10 h. Le client n'en revenait pas.",
        },
      ],
      [
        {
          ...ROLLAND,
          texte:
            "Votre devis est arrivé jeudi. J'avais déjà commandé ailleurs mercredi. Avant, chez Combelle, je n'attendais pas.",
        },
      ],
      [
        {
          ...KADER,
          texte:
            "Mes artisans me demandent toujours pourquoi Combelle répond dans l'heure et pas nous. Je n'ai pas de réponse.",
        },
      ],
      [
        {
          ...ELODIE,
          texte:
            "Les petits devis partent dans l'heure, relus par un vendeur du négoce. Les gros attendent toujours deux jours.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Le concurrent attaque",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...CHRISTOPHE,
        heure: "08:20",
        alerte: true,
        texte:
          "Le Comptoir Rhodanien a envoyé ses commerciaux chez trente artisans du négoce cette semaine : 8 % de remise sur le gros œuvre pour qui ouvre un compte avant la fin du mois.",
      },
      ...(ctx.sebastienLa
        ? []
        : [
            {
              ...KADER,
              heure: "10:05",
              texte:
                "C'est Sébastien qui fait les visites pour eux. Il connaît chaque chantier de ses anciens clients.",
            },
          ]),
      {
        ...VERONIQUE,
        heure: "12:30",
        texte: `Deux semaines avant la fin du trimestre. Marge de la semaine : ${ctx.marge}, pour un plan à 66,5 k€. Le comité veut voir les clients du négoce tenir.`,
      },
    ],
    sources: [
      {
        id: "cibles",
        titre: "Regarder quels clients ils ont démarchés",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Trente artisans, tous du négoce, choisis portefeuille par portefeuille : ceux de Sébastien d'abord, puis ceux de Raymond et de Naïma. Ceux que vous avez déjà perdus étaient partis après le départ de leur vendeur ou un service raté ; aucun n'est parti pour le prix seul.${
            ctx.sebastienLa
              ? " Sébastien a déjà rappelé quatre de ses clients démarchés : « Ils attendent qu'on vienne les voir. »"
              : ""
          }`,
      },
    ],
    question: "Comment répondez-vous à l'offensive ?",
    options: [
      {
        t: "Aller voir les trente artisans démarchés, chacun avec son vendeur habituel, et tenir le prix sur cinq produits phares",
        d: "Deux semaines de visites. 3 000 € de remise ciblée.",
      },
      {
        t: "Envoyer à tous les clients du négoce la grille d'Arvel et le contact de leur commercial de secteur",
        d: "Un courrier soigné, à l'en-tête d'Arvel. 500 €.",
      },
      {
        t: "S'aligner : 8 % de remise sur le gros œuvre pour tous les clients du négoce, pendant un mois",
        d: "3 400 € de marge en moins par semaine.",
      },
      {
        t: "Ne rien faire : nos clients nous connaissent",
        d: "Aucun coût.",
      },
    ],
    reactions: [
      [
        {
          ...ROLLAND,
          texte:
            "Vous êtes venus à deux, avec mon vendeur. Le Rhodanien m'a envoyé un jeune que je n'avais jamais vu. Je reste chez vous.",
        },
      ],
      [
        {
          ...ROLLAND,
          texte:
            "J'ai reçu une lettre avec un nom que je ne connais pas. Le Rhodanien, lui, est venu me voir sur le chantier.",
        },
      ],
      [
        {
          ...CHRISTOPHE,
          texte:
            "La remise a calmé les artisans du négoce. Ceux d'Arvel l'ont appris, et demandent la même.",
        },
      ],
      [
        {
          ...KADER,
          texte: "Deux artisans du négoce ont ouvert un compte au Rhodanien cette semaine.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Clarifier vite, garder les clients", chemin: [0, 0, 0, 1, 0, 0] },
  { nom: "Tout aligner sur Arvel", chemin: [1, 1, 1, 0, 1, 1] },
  { nom: "Attendre le siège", chemin: [3, 3, 2, 2, 3, 3] },
] as const;

/**
 * Les deux réflexes du métier face à un rachat : tout aligner sur Arvel d'un
 * coup, ou laisser vivre deux agences côte à côte : [décision, option].
 */
export const REFLEXES = [
  [0, 1],
  [0, 2],
  [1, 1],
  [1, 2],
  [2, 1],
  [2, 3],
  [3, 0],
  [3, 2],
  [4, 1],
  [4, 2],
  [5, 1],
] as const;

export const REPONSES = {
  raymondVexe:
    "Bien. Trente ans que je tiens cette maison, et on me demande de ne plus parler à mes clients. Je ne vais pas leur mentir s'ils me demandent pourquoi.",
  raymondAccepte:
    "Entendu. Je ne mettrai plus les pieds au comptoir. Vous avez sans doute raison : il faut un seul patron.",
  raymondDejeune:
    "Raymond déjeune avec ses anciens clients et leur raconte qu'on l'a mis dehors. Rolland m'a demandé si c'était vrai. Deux autres ont déjà commandé ailleurs.",
  sebastienPart:
    "Jérôme, j'ai accepté l'offre du Comptoir Rhodanien. Je pars en fin de semaine. Je ne vais pas vous mentir : certains de mes clients me suivront.",
  joelPartVendeur:
    "Je m'en vais. Le Comptoir Rhodanien me propose de monter son comptoir à Vienne. Vingt-deux ans ici : je ne pensais pas finir vendeur.",
  joelPart:
    "Je m'en vais. Le Comptoir Rhodanien me propose de monter son comptoir à Vienne. Je ne sais toujours pas ce que je fais ici, eux me le disent.",
  naimaPart:
    "Je pars. Un concurrent m'offre ce que je faisais ici avant le rachat : chiffrer, décider, servir mes clients dans l'heure.",
  basculeReussie:
    "La bascule s'est bien passée : quelques prix spéciaux à corriger, rien de grave. Un seul logiciel depuis lundi.",
  basculeRatee:
    "La bascule a mal tourné : un tiers des prix spéciaux mal repris, des factures fausses, le comptoir à l'arrêt la moitié de la semaine. On en a pour quinze jours d'avoirs et d'excuses.",
  repriseFautive:
    "Des prix spéciaux mal repris sont passés malgré la vérification : quelques factures fausses, 2 000 € d'avoirs.",
  devisAPerte:
    "Un vendeur d'Arvel a chiffré seul une commande de charpente de 140 k€ avec un prix d'achat périmé : 24 000 € de perte. Le client a signé dans l'heure.",
} as const;
