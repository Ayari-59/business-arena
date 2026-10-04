/**
 * LE PROJET QUI GLISSE — le contenu de l'épisode.
 *
 * Camille Ferrand pilote le déploiement d'Arvel Pro, le portail de commande
 * en ligne des artisans clients d'Arvel Distribution. La mise en service est
 * promise pour la semaine 13 ; en semaine 1, le projet est en retard, les
 * demandes des agences s'accumulent, les utilisateurs clés ne viennent pas
 * tester. Six décisions, chacune précédée de ce qu'une cheffe de projet
 * reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "perimetre",
    t: "Le périmètre gonfle : les demandes acceptées au fil de l'eau ajoutent presque autant de travail que l'équipe en abat",
  },
  { id: "recette", t: "La recette prend du retard : les utilisateurs clés ne viennent pas tester" },
  { id: "effectif", t: "L'équipe est trop petite pour le projet : il faut des renforts" },
  { id: "prestataire", t: "Le prestataire ne livre pas au rythme prévu" },
] as const;

export type IdDiagnostic = (typeof DIAGNOSTICS)[number]["id"];

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le projet a glissé",
    jusqua: 3,
    messages: () => [
      {
        de: "Planning du projet",
        role: "Point hebdomadaire",
        heure: "07:50",
        alerte: true,
        texte:
          "Avancement d'Arvel Pro : 48 %, pour 55 % prévus. Mise en service annoncée aux artisans : fin de semaine 13.",
      },
      {
        de: "Isabelle Fontaine",
        role: "Directrice des opérations, sponsor du projet",
        heure: "08:40",
        texte:
          "Camille, le comité de direction veut savoir jeudi si la date tient. Les agences ont déjà commandé les affiches du lancement.",
      },
      {
        de: "Yannick Meunier",
        role: "Développeur principal",
        heure: "09:15",
        texte:
          "On avance, mais chaque fois qu'on ferme un sujet, une agence en ouvre un autre. Je ne sais plus très bien ce qui reste.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "raf",
        titre: "Recompter le reste à faire avec l'équipe, tâche par tâche",
        cout: 1,
        nature: "decisive",
        resultat:
          "Le reste à faire réel est de 220 jours-homme, pas 150 comme l'affiche le planning : 19 demandes des agences ont été acceptées directement par les développeurs, sans être replanifiées. L'équipe abat 24 jh par semaine, dont un cinquième en corrections ; il en rentre près de 9 par semaine, en demandes et en découvertes. À ce rythme, il faudrait plus de vingt semaines.",
      },
      {
        id: "registre",
        titre: "Lire le registre des demandes de changement",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "14 demandes en attente, deux nouvelles par semaine en moyenne, de 4 à 5 jh chacune. Sur les 19 déjà acceptées, l'équipe en juge 4 indispensables à l'ouverture ; les autres relèvent du confort : le logo de l'agence sur les bons, une couleur, un export de plus. Personne n'a jamais dit non.",
      },
      {
        id: "prestataire",
        titre: "Contrôler les livraisons du prestataire",
        cout: 1,
        nature: "bruit",
        resultat:
          "Studio Lumen a livré 96 % des tâches prévues au contrat, dans les délais. Ses deux développeurs abattent autant que les nôtres.",
      },
      {
        id: "recette",
        titre: "Faire le point avec les utilisateurs clés",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Sur les huit utilisateurs clés prêtés par les agences, deux sont venus aux séances de test du mois dernier : la saison des chantiers démarre, les agences les gardent au comptoir. 12 défauts trouvés attendent une correction ; personne ne sait combien dorment encore dans le code.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Isabelle",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Isabelle : « Avant de demander du monde ou du temps, sache combien il reste vraiment à faire, et ce qui rentre chaque semaine. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous avant le comité de jeudi ?",
    options: [
      {
        t: "Renforcer l'équipe : deux développeurs de plus chez le prestataire",
        d: "Dès la semaine 2, jusqu'à la mise en service. 4 000 € par semaine.",
      },
      {
        t: "Recompter le reste à faire et geler le périmètre : un comité tranche chaque demande",
        d: "Une heure par semaine avec deux directeurs d'agence. Seul l'indispensable entre ; le reste part en lot 2.",
      },
      {
        t: "Demander des heures supplémentaires jusqu'à la mise en service",
        d: "Deux heures par jour pour les quatre développeurs internes. 1 800 € par semaine.",
      },
      {
        t: "Garder le plan et rattraper en route",
        d: "L'équipe connaît le projet ; elle trouvera le temps.",
      },
    ],
    reactions: [
      [
        {
          de: "Yannick Meunier",
          role: "Développeur principal",
          texte:
            "Les deux renforts sont arrivés lundi. Je passe mes journées à leur expliquer le code : j'ai écrit dix lignes cette semaine.",
        },
      ],
      [
        {
          de: "Patrick Nguyen",
          role: "Directeur de l'agence de Vénissieux",
          texte:
            "Premier comité ce matin : seize demandes triées en une heure ; trois entrent, les autres attendront le lot 2. Mes vendeurs râlent un peu, mais je comprends.",
        },
      ],
      [
        {
          de: "Sarah Belkacem",
          role: "Développeuse",
          texte:
            "On fera les heures. Mais on finit tard, et le matin on corrige ce qu'on a écrit la veille au soir.",
        },
      ],
      [
        {
          de: "Isabelle Fontaine",
          role: "Directrice des opérations",
          texte: "Le comité de direction m'a demandé ce qui change. Je n'ai pas su quoi répondre.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "Les utilisateurs clés ne viennent pas",
    jusqua: 5,
    messages: (ctx) => [
      {
        de: "Nathalie Perrin",
        role: "Utilisatrice clé, agence de Villeurbanne",
        heure: "11:30",
        alerte: true,
        texte:
          "Désolée pour la séance de jeudi : j'étais seule au comptoir, la file jusqu'à la porte. Je ne vois pas comment venir avant l'été.",
      },
      {
        de: "Planning du projet",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Reste à faire en fin de semaine 3 : ${ctx.raf}. Défauts ouverts : ${ctx.ouverts}. Séances de recette tenues : 1 sur 4.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "agences",
        titre: "Appeler les directeurs d'agence",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les directeurs ne refusent pas : ils n'ont personne pour tenir le comptoir. Un intérimaire de comptoir coûte 300 € la journée ; deux demi-journées par semaine pour les huit utilisateurs clés, c'est 1 200 € par semaine.",
      },
      {
        id: "defauts",
        titre: "Regarder qui trouve quels défauts",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les développeurs qui testent leurs propres écrans trouvent surtout des fautes de frappe ; les utilisateurs clés trouvent les vrais défauts : un prix remisé faux, un bon de livraison sans adresse de chantier. Un défaut trouvé en semaine 3 se corrige en une demi-journée ; en semaine 12, il en faut une entière.",
      },
    ],
    question: "Comment faites-vous tester l'outil ?",
    options: [
      {
        t: "Faire tester par les développeurs",
        d: "Une demi-journée par semaine chacun. Ne coûte rien ; le développement ralentit d'autant.",
      },
      {
        t: "Payer des remplaçants au comptoir pour libérer les utilisateurs clés",
        d: "Deux demi-journées fixes par semaine pour chacun. 1 200 € par semaine.",
      },
      {
        t: "Reporter la recette à la fin du développement",
        d: "Les utilisateurs clés viendront en bloc à partir de la semaine 10, quand tout sera prêt.",
      },
      {
        t: "Attendre qu'ils se libèrent",
        d: "Les agences promettent de faire au mieux.",
      },
    ],
    reactions: [
      [
        {
          de: "Hugo Tran",
          role: "Développeur",
          texte:
            "On teste nos propres écrans. Forcément, ils marchent : on sait exactement sur quoi cliquer.",
        },
      ],
      null,
      [
        {
          de: "Yannick Meunier",
          role: "Développeur principal",
          texte: "Très bien, on avance sans s'arrêter. On verra les défauts en semaine 10.",
        },
      ],
      [
        {
          de: "Nathalie Perrin",
          role: "Utilisatrice clé, agence de Villeurbanne",
          texte: "Je viendrai dès que je pourrai. Pas cette semaine, sans doute.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Le directeur commercial veut le devis en ligne",
    jusqua: 7,
    messages: () => [
      {
        de: "Bruno Castel",
        role: "Directeur commercial",
        heure: "10:10",
        alerte: true,
        texte:
          "Camille, mes commerciaux sont formels : sans devis en ligne, les gros artisans ne passeront pas sur Arvel Pro. Je le veux pour l'ouverture. Je compte sur toi.",
      },
      {
        de: "Yannick Meunier",
        role: "Développeur principal",
        heure: "10:45",
        texte:
          "Le devis en ligne, c'est 35 jh au bas mot. Et il touche au panier et aux prix, qu'on a déjà testés.",
      },
    ],
    sources: [
      {
        id: "panel",
        titre: "Relire ce que le panel d'artisans attendait",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sur les 120 artisans interrogés au lancement du projet, 9 ont cité le devis en ligne ; 104 ont cité la commande, le suivi de livraison et leurs prix remisés, qui forment le cœur de l'outil.",
      },
      {
        id: "comite",
        titre: "Relire les décisions prises sur les demandes",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.gele
            ? "Depuis la semaine 2, le comité a renvoyé au lot 2 une vingtaine de demandes, avec l'accord écrit de deux directeurs d'agence. Bruno Castel en reçoit le compte rendu chaque semaine."
            : "Aucune instance ne tranche les demandes : chacune a été acceptée par le développeur qu'on avait appelé. Aux yeux des agences, le lot 2 n'existe pas.",
      },
    ],
    question: "Que répondez-vous à Bruno ?",
    options: [
      {
        t: "L'accepter pour l'ouverture : c'est le directeur commercial",
        d: "35 jh de plus dans le cœur de l'outil, dès la semaine 6.",
      },
      {
        t: "Lui proposer le devis en tête du lot 2, chiffres du panel à l'appui",
        d: "Il acceptera, ou il ira voir la direction générale.",
      },
      {
        t: "L'accepter en sortant une fonctionnalité de taille comparable",
        d: "Le compte multi-utilisateurs quitte le projet ; le devis entre dans le cœur de l'outil.",
      },
      {
        t: "Refuser : le périmètre est fixé",
        d: "Pas de devis en ligne cette année.",
      },
    ],
    reactions: [
      [
        {
          de: "Bruno Castel",
          role: "Directeur commercial",
          texte: "Merci, Camille. Je l'annonce à mes commerciaux dès lundi.",
        },
      ],
      null,
      [
        {
          de: "Bruno Castel",
          role: "Directeur commercial",
          texte:
            "Le compte multi-utilisateurs, mes grands comptes y tenaient. Enfin, j'ai mon devis.",
        },
      ],
      [
        {
          de: "Bruno Castel",
          role: "Directeur commercial",
          texte: "C'est noté. Je ferai sans le projet, alors.",
        },
        {
          de: "Nathalie Perrin",
          role: "Utilisatrice clé, agence de Villeurbanne",
          texte:
            "Notre directeur d'agence nous a fait comprendre que les tests d'Arvel Pro n'étaient plus une priorité.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Le comité de pilotage",
    jusqua: 9,
    messages: (ctx) => [
      {
        de: "Isabelle Fontaine",
        role: "Directrice des opérations",
        heure: "09:00",
        alerte: true,
        texte: `Comité de pilotage mardi. Avancement : ${ctx.avancement}, pour ${ctx.plan} prévus ; reste à faire : ${ctx.raf}. Antoine propose de nous prêter trois développeurs d'un autre projet. Qu'est-ce que je dis ?`,
      },
      {
        de: "Antoine Lefèvre",
        role: "Directeur des systèmes d'information",
        heure: "09:20",
        texte:
          "Trois de mes développeurs peuvent basculer sur Arvel Pro dès lundi. Leur projet d'entrepôt attendra un trimestre.",
      },
    ],
    sources: [
      {
        id: "projection",
        titre: "Projeter la fin au rythme réel",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Sur les quatre dernières semaines, le reste à faire a baissé de ${ctx.rythme} par semaine en moyenne : au même rythme, tout finir demanderait ${ctx.semainesRestantes} semaines, pour six disponibles. Le cœur de l'outil — catalogue, prix remisés, panier, commande, suivi de livraison — représente ${ctx.partCoeur} du reste à faire, et l'essentiel de ce que les artisans attendent.`,
      },
      {
        id: "dsi",
        titre: "Demander à Yannick ce que changeraient trois renforts",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Yannick : « Ils ne connaissent ni le code ni le négoce. Sur le projet de l'entrepôt, les renforts ont mis trois semaines à devenir utiles, et je passerais la moitié de mon temps à les former et à relire leur code. »",
      },
    ],
    question: "Que proposez-vous au comité de pilotage ?",
    options: [
      {
        t: "Accepter les trois développeurs de la DSI",
        d: "Dès la semaine 8. Leur projet attendra ; 3 000 € par semaine refacturés.",
      },
      {
        t: "Découper : ouvrir l'essentiel en semaine 13, le reste en lot 2",
        d: "Catalogue, prix, commande et suivi à la date ; factures en ligne, historique détaillé et le reste au trimestre suivant.",
      },
      {
        t: "Annoncer dès maintenant un report de quatre semaines",
        d: "Tout le périmètre, en semaine 17. La campagne de lancement est replanifiée.",
      },
      {
        t: "Maintenir la date et tout le périmètre",
        d: "L'équipe a six semaines pour rattraper.",
      },
    ],
    reactions: [
      [
        {
          de: "Yannick Meunier",
          role: "Développeur principal",
          texte:
            "Les trois renforts sont là. Il faut leur ouvrir les accès, leur expliquer l'architecture, relire leur code. Pour l'instant, on avance moins vite qu'avant.",
        },
      ],
      [
        {
          de: "Isabelle Fontaine",
          role: "Directrice des opérations",
          texte:
            "Le comité a validé le découpage. Bruno a grincé, mais une date tenue vaut mieux qu'un périmètre promis. L'équipe ne travaille plus que sur l'essentiel.",
        },
      ],
      [
        {
          de: "Isabelle Fontaine",
          role: "Directrice des opérations",
          texte:
            "Le report est annoncé et la campagne décalée. Personne n'est content, mais personne n'est surpris.",
        },
      ],
      [
        {
          de: "Isabelle Fontaine",
          role: "Directrice des opérations",
          texte: "Le comité maintient la date et le périmètre. Il compte sur toi.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "La recette n'aura pas fini",
    jusqua: 11,
    messages: (ctx) => [
      {
        de: "Yannick Meunier",
        role: "Développeur principal",
        heure: "14:00",
        alerte: true,
        texte: `On a ${ctx.ouverts} défauts ouverts, et chaque correction en casse parfois une autre. Si on ne teste plus que les parcours principaux, on gagne une semaine et demie.`,
      },
      {
        de: "Nathalie Perrin",
        role: "Utilisatrice clé, agence de Villeurbanne",
        heure: "16:30",
        texte:
          "Il reste une soixantaine de parcours à tester sur 140 : remises chantier, retours, bons multiples. À ce rythme, on n'aura pas fini en semaine 13.",
      },
    ],
    sources: [
      {
        id: "cout-defauts",
        titre: "Chiffrer ce que coûte un défaut livré",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Six défauts sur dix touchent la commande ou les prix remisés. Sur le dernier projet du groupe, chaque défaut parti en production a coûté 1 800 € en moyenne : corrections en urgence, commandes fausses, avoirs aux artisans. Le même défaut, trouvé en recette, coûte une journée de développeur.",
      },
    ],
    question: "Que faites-vous de la recette ?",
    options: [
      {
        t: "Réduire la recette aux parcours principaux pour tenir la date",
        d: "Les corrections passent après les fonctionnalités. Une semaine et demie de gagnée au planning.",
      },
      {
        t: "Protéger la recette : deux semaines où les corrections passent avant tout",
        d: "Semaines 10 et 11 : la moitié de l'équipe corrige, les utilisateurs clés retestent. Le développement ralentit.",
      },
      {
        t: "Faire écrire des tests automatisés par le prestataire",
        d: "8 000 €, en place à partir de la semaine 11.",
      },
      {
        t: "Continuer comme aujourd'hui",
        d: "La recette avance quand chacun a le temps.",
      },
    ],
    reactions: [
      [
        {
          de: "Nathalie Perrin",
          role: "Utilisatrice clé, agence de Villeurbanne",
          texte:
            "On ne teste plus que la commande simple. Les remises chantier, les retours, les bons multiples : on verra en production.",
        },
      ],
      [
        {
          de: "Yannick Meunier",
          role: "Développeur principal",
          texte:
            "Deux semaines de corrections. Le tableau des défauts n'a jamais été aussi propre, et Nathalie a enfin testé les remises chantier.",
        },
      ],
      [
        {
          de: "Olivier Mercier",
          role: "Directeur de projet, Studio Lumen",
          texte:
            "Les premiers tests automatiques tournent chaque nuit. Ils ont déjà attrapé deux régressions sur le panier.",
        },
      ],
      [
        {
          de: "Sarah Belkacem",
          role: "Développeuse",
          texte:
            "Avec la date qui approche, on corrige ce qu'on peut entre deux écrans. Les séances de recette sautent une fois sur deux.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Préparer l'ouverture",
    jusqua: 13,
    messages: (ctx) => [
      {
        de: "Isabelle Fontaine",
        role: "Directrice des opérations",
        heure: "08:30",
        alerte: true,
        texte: `Deux semaines avant l'ouverture. Reste à faire : ${ctx.raf} ; défauts ouverts : ${ctx.ouverts}. Comment ouvre-t-on ?`,
      },
      {
        de: "Patrick Nguyen",
        role: "Directeur de l'agence de Vénissieux",
        heure: "10:15",
        texte:
          "Mes vendeurs voudraient quelques petites choses avant l'ouverture : le logo de l'agence sur les bons, un export des commandes du jour. Rien de bien gros.",
      },
    ],
    sources: [],
    question: "Comment ouvrez-vous Arvel Pro ?",
    options: [
      {
        t: "Ouvrir à toutes les agences d'un coup en semaine 13",
        d: "Les quatorze agences et 4 000 artisans invités le même jour.",
      },
      {
        t: "Ouvrir d'abord à deux agences pilotes en semaine 12",
        d: "300 artisans pendant une semaine, puis tout le monde en semaine 13. L'équipe accompagne les pilotes.",
      },
      {
        t: "Faire passer les dernières demandes des agences avant l'ouverture",
        d: "Une dizaine de petites demandes, 28 jh en tout. Les agences seront contentes le jour J.",
      },
    ],
    reactions: [
      [
        {
          de: "Isabelle Fontaine",
          role: "Directrice des opérations",
          texte: "Les invitations sont parties aux 4 000 artisans. Ouverture vendredi.",
        },
      ],
      [
        {
          de: "Patrick Nguyen",
          role: "Directeur de l'agence de Vénissieux",
          texte:
            "Les pilotes ont trouvé de quoi faire : un prix remisé faux sur les chantiers, une adresse qui saute à l'impression. Corrigé avant l'ouverture générale.",
        },
      ],
      [
        {
          de: "Patrick Nguyen",
          role: "Directeur de l'agence de Vénissieux",
          texte: "Mes vendeurs sont ravis. Les développeurs, moins : ils finissent à 22 heures.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Mesurer, geler, découper", chemin: [1, 1, 1, 1, 1, 1] },
  { nom: "Renforcer et faire plaisir", chemin: [0, 2, 0, 0, 0, 2] },
  { nom: "Attentiste", chemin: [3, 3, 0, 3, 3, 0] },
] as const;

/**
 * Les options qui répondent à la date en ajoutant du monde, des heures ou des
 * demandes, ou en rognant les tests : [décision, option].
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 2],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 2],
] as const;

export const REPONSES = {
  directeurAttend:
    "J'ai regardé les chiffres du panel. D'accord pour le lot 2, mais en tête de liste, et je veux une date.",
  directeurImpose:
    "J'en ai parlé à la direction générale. Le devis en ligne sera dans l'ouverture : c'est décidé.",
  saintPriestAccepte:
    "Toutes les agences ont signé : un remplaçant au comptoir, deux demi-journées fixes par semaine pour chaque utilisateur clé. Nathalie était à la séance de mardi.",
  saintPriestRefuse:
    "Les agences ont signé, sauf Saint-Priest, la plus grosse, qui garde ses deux utilisateurs clés : « pas d'intérimaire derrière mon comptoir en pleine saison ».",
} as const;
