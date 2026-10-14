/**
 * LES TOURNÉES QUI DÉBORDENT — le contenu de l'épisode.
 *
 * Farid Bensaïd est responsable transport d'Arvel Distribution pour la région
 * lyonnaise : huit chauffeurs salariés, huit porteurs équipés d'une grue, une
 * planificatrice, et un transporteur sous-traitant pour ce que la flotte ne
 * livre pas. Les livraisons sur chantier arrivent de plus en plus souvent en
 * retard, le coût par livraison dépasse le budget, les chauffeurs enchaînent
 * les heures supplémentaires, les commerciaux promettent des heures précises
 * à tout le monde, et le sous-traitant annonce une hausse. Six décisions,
 * chacune précédée de ce qu'un responsable transport reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "creneaux",
    t: "Les heures promises par les commerciaux cassent les tournées : trop peu d'arrêts par tournée, trop de kilomètres",
  },
  {
    id: "soustraitance",
    t: "La sous-traitance a pris une place permanente, et elle coûte de plus en plus cher",
  },
  {
    id: "flotte",
    t: "La flotte est sous-dimensionnée : huit camions ne suffisent plus au volume",
  },
  {
    id: "chauffeurs",
    t: "Les chauffeurs ne sont pas assez productifs : trop peu de livraisons par jour",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Les tournées qui débordent",
    jusqua: 2,
    messages: () => [
      {
        de: "Tableau de bord transport",
        role: "Alerte automatique",
        heure: "06:45",
        alerte: true,
        texte:
          "Semaine dernière : 13 % des livraisons arrivées en retard, pour un objectif de 8 %. Coût par livraison : 98 €, pour un budget de 92 €. 42 heures supplémentaires chez les chauffeurs.",
      },
      {
        de: "Solène Marquant",
        role: "Directrice logistique régionale",
        heure: "08:20",
        texte:
          "Farid, le transport dépasse son budget pour le troisième mois, et Dumontel Bâtiment m'a appelée vendredi : deux chantiers arrêtés la semaine dernière faute de livraison. Ils parlent de changer de négoce. J'attends ton plan vendredi.",
      },
      {
        de: "Roland Pallas",
        role: "Chauffeur",
        heure: "09:10",
        texte:
          "Hier : Vénissieux à 7 h, Tassin à 8 h, Saint-Priest à 9 h. Trois arrêts avant 10 h, et cent kilomètres. On roule plus qu'on ne livre.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "tournees",
        titre: "Analyser les tournées d'une semaine avec Awa, la planificatrice",
        cout: 1,
        nature: "decisive",
        resultat:
          "5,4 arrêts par tournée en moyenne, contre 7,2 il y a deux ans. 64 % des livraisons ont une heure précise, promise par le commercial à la prise de commande : les tournées sont bâties autour de ces heures, pas autour des secteurs. Un camion fait 148 km par jour, contre 96 à l'époque. Avec des créneaux à la demi-journée, les mêmes livraisons tiendraient dans sept à huit tournées de moins par semaine.",
      },
      {
        id: "retards",
        titre: "Regarder pourquoi les livraisons de la semaine dernière sont arrivées en retard",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "33 retards sur 255 livraisons. 19 portaient sur une heure impossible à tenir dès la commande : deux chantiers à 40 km l'un de l'autre, promis à une heure d'écart. 7 venaient du sous-traitant, 4 de tournées terminées en heures supplémentaires, 3 d'un accès de chantier fermé. 16 livraisons ont dû être refaites : autant de passages en plus, et des équipes qui attendaient sur le chantier.",
      },
      {
        id: "regions",
        titre: "Comparer le coût par livraison avec les autres régions",
        cout: 1,
        nature: "bruit",
        resultat:
          "Lyon : 98 € par livraison ; Grenoble : 94 € ; Saint-Étienne : 101 € ; Clermont-Ferrand : 106 €. Chaque région a son relief, ses distances et ses clients : l'écart ne dit pas d'où il vient.",
      },
      {
        id: "factures",
        titre: "Relire six mois de factures du sous-traitant",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Transports Brunelière fait 30 à 35 livraisons par semaine, toutes les semaines, contre une dizaine il y a un an, et seulement dans les pics. À 95 € la livraison, quand un arrêt de plus dans une de nos tournées coûte une dizaine d'euros. Il ne couvre plus des pics : il porte une part permanente du volume.",
      },
      {
        id: "conseil",
        titre: "Appeler Sabine Courtial, responsable transport de la région grenobloise",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Sabine : « Avant d'acheter des camions, regarde combien d'arrêts tu fais par tournée, et qui décide des heures de livraison. Chez nous, c'étaient les commerciaux. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous avant le point de vendredi ?",
    options: [
      {
        t: "Louer un neuvième camion avec un chauffeur intérimaire",
        d: "Dès la semaine 2, jusqu'à la fin du trimestre : cinq tournées de plus par semaine. 2 900 € par semaine.",
      },
      {
        t: "Revoir les tournées avec Awa et fixer avec les commerciaux des créneaux réalistes",
        d: "Une demi-journée par défaut, l'heure précise seulement pour une vraie contrainte (grue, coulage, accès). 600 € d'analyse ; quelques clients à convaincre.",
      },
      {
        t: "Confier tout le surplus au sous-traitant et arrêter les heures supplémentaires",
        d: "Les chauffeurs finissent à l'heure ; Transports Brunelière prend tout ce qui dépasse, à 95 € la livraison.",
      },
      {
        t: "Tenir avec les heures supplémentaires, le temps que ça se calme",
        d: "Rien de plus que ce qu'on paie déjà.",
      },
    ],
    reactions: [
      [
        {
          de: "Awa Kouyaté",
          role: "Planificatrice transport",
          texte:
            "Le camion loué arrive mardi, avec Mathis, un intérimaire. Il ne connaît ni les chantiers ni les accès : je lui donne les tournées les plus simples, et il appelle quand même deux fois par jour.",
        },
      ],
      [
        {
          de: "Hubert Lhermet",
          role: "Directeur commercial",
          texte:
            "Mes commerciaux ont grogné, mais on a fait le tri : sur dix heures précises promises, sept n'en étaient pas vraiment. Les clients ont accepté le matin ou l'après-midi, à deux exceptions près.",
        },
      ],
      [
        {
          de: "Alain Brunelière",
          role: "Gérant, Transports Brunelière",
          texte:
            "Bien reçu, on prend tout ce qui dépasse. Avec un volume pareil, il faudra qu'on parle tarifs.",
        },
      ],
      [
        {
          de: "Kemal Aydin",
          role: "Chauffeur, délégué du personnel",
          texte:
            "On fera les heures. Mais on finit à 19 h, et les retards sont toujours là le lendemain matin.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Le sous-traitant augmente ses tarifs",
    jusqua: 4,
    messages: (ctx) => [
      {
        de: "Alain Brunelière",
        role: "Gérant, Transports Brunelière",
        heure: "09:40",
        alerte: true,
        texte:
          "Monsieur Bensaïd, je vous confirme notre nouvelle grille à partir de la semaine 5 : 106 € la livraison au lieu de 95, soit 12 % de plus. Gazole, salaires, péages : je n'ai pas le choix.",
      },
      {
        de: "Lorena Ribas",
        role: "Contrôleuse de gestion",
        heure: "11:15",
        texte:
          "Si rien ne change, la hausse de Brunelière, c'est 3 à 4 k€ de plus sur le trimestre, sans compter les pics. Qu'est-ce que tu comptes faire ?",
      },
      {
        de: "Tableau de bord transport",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Fin de semaine 2 : ${ctx.retard} de livraisons en retard, ${ctx.arrets} arrêts par tournée, ${ctx.sousTraitees} livraisons confiées au sous-traitant.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "capacite",
        titre: "Calculer ce que la flotte peut livrer seule",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.tourneesRevues
            ? `Avec ${ctx.arrets} arrêts par tournée, et bientôt davantage, nos quarante tournées livrent ${ctx.capacite} livraisons par semaine : presque tout le volume courant. Le volume quotidien de Brunelière ne sert plus qu'à remplir ses camions ; c'est dans les pics qu'on aura besoin de lui.`
            : `Avec ${ctx.arrets} arrêts par tournée, nos quarante tournées ne livrent que ${ctx.capacite} livraisons par semaine, pour 250 à 270 à faire : sans le volume quotidien de Brunelière, il manquerait trente à quarante livraisons chaque semaine, à rattraper en heures supplémentaires ou au prix fort.`,
      },
      {
        id: "devis",
        titre: "Demander des devis à deux autres transporteurs",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Deux transporteurs de l'est lyonnais répondent entre 101 et 108 € la livraison, sans connaître nos chantiers. Brunelière reste dans le prix du marché : ce qui pèse, c'est le volume qu'on lui confie toute l'année.",
      },
    ],
    question: "Que répondez-vous à Brunelière ?",
    options: [
      {
        t: "Accepter la hausse : on ne peut pas se passer de lui",
        d: "106 € la livraison à partir de la semaine 5, pour le même volume.",
      },
      {
        t: "Lui proposer un contrat de pics : plus de volume quotidien, une capacité prioritaire dans les semaines chargées",
        d: "Le quotidien repris par nos tournées. Brunelière accepte 99 € la livraison pour les pics et la fin de trimestre.",
      },
      {
        t: "Embaucher un neuvième chauffeur en CDD et louer un camion pour reprendre son volume",
        d: "Recrutement en semaine 4 (1 500 €), puis 2 700 € par semaine. Brunelière garde une dizaine de livraisons.",
      },
      {
        t: "Accepter la hausse contre des pénalités de retard",
        d: "106 € la livraison, et 30 € de pénalité pour chaque retard qu'il cause. Il promet de s'organiser.",
      },
    ],
    reactions: [
      [
        {
          de: "Alain Brunelière",
          role: "Gérant, Transports Brunelière",
          texte: "Merci de votre compréhension. On continue comme avant.",
        },
      ],
      [
        {
          de: "Alain Brunelière",
          role: "Gérant, Transports Brunelière",
          texte:
            "Moins de volume au quotidien, ça m'arrange presque : mes chauffeurs sont demandés ailleurs. Dans les pics, vous serez servis en priorité, à 99 €.",
        },
      ],
      [
        {
          de: "Ressources humaines",
          role: "Région lyonnaise",
          texte:
            "Ibrahima Diakhaté, chauffeur poids lourd avec l'habilitation grue, a signé un CDD jusqu'à la fin du trimestre. Il commence en semaine 5, sur le camion loué.",
        },
      ],
      [
        {
          de: "Alain Brunelière",
          role: "Gérant, Transports Brunelière",
          texte:
            "Les pénalités, c'est dur, mais d'accord. Je vous mets mes deux chauffeurs qui connaissent le mieux vos chantiers.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Trois livraisons pour un même chantier",
    jusqua: 5,
    messages: (ctx) => [
      {
        de: "Roland Pallas",
        role: "Chauffeur",
        heure: "07:30",
        alerte: true,
        texte:
          "Ce matin, chantier Dumontel à Bron, pour la troisième fois de la semaine : deux sacs de colle et une boîte de chevilles. Une demi-heure de détour pour quarante kilos.",
      },
      {
        de: "Capucine Aubriot",
        role: "Technico-commerciale",
        heure: "10:05",
        texte:
          "Mes artisans commandent au jour le jour, ils n'ont pas de place pour stocker. Si on ne les livre pas le lendemain, ils vont au comptoir d'en face.",
      },
      {
        de: "Tableau de bord transport",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 4 : ${ctx.arrets} arrêts par tournée, ${ctx.retard} de livraisons en retard, ${ctx.heuresSup} heures supplémentaires.`,
      },
    ],
    sources: [
      {
        id: "commandes",
        titre: "Analyser la taille des livraisons du mois",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "41 % des livraisons pèsent moins de 300 kg, et un chantier sur trois est livré plusieurs fois dans la même semaine. Une livraison de moins de 150 € de marchandise coûte plus à livrer qu'elle ne rapporte. Interrogés, huit artisans sur dix acceptent deux passages par semaine à jours fixes, si on les leur annonce.",
      },
      {
        id: "concurrents",
        titre: "Regarder comment livrent les négoces concurrents",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les deux grands négoces de l'agglomération livrent gratuitement au-delà de 250 € de commande, à jour fixe par secteur. Le négoce indépendant de Vaulx-en-Velin livre tout, tout le temps, et l'a répercuté sur ses prix.",
      },
    ],
    question: "Que faites-vous des petites livraisons ?",
    options: [
      {
        t: "Créer une tournée express l'après-midi pour les commandes urgentes",
        d: "Un chauffeur volontaire en heures supplémentaires, de 14 h à 18 h. Les commerciaux pourront promettre une livraison dans la journée.",
      },
      {
        t: "Regrouper les livraisons par chantier et par secteur, à jours fixes",
        d: "Deux passages par semaine et par secteur, annoncés aux clients. 1 200 € pour paramétrer et prévenir ; quelques ventes d'urgence perdues.",
      },
      {
        t: "Fixer un minimum de 250 € de commande pour la livraison gratuite",
        d: "En dessous, la livraison est facturée 35 €. Moins de petites livraisons ; certains artisans n'aimeront pas.",
      },
      {
        t: "Livrer comme avant : le client commande, on livre",
        d: "Rien ne change.",
      },
    ],
    reactions: [
      [
        {
          de: "Kemal Aydin",
          role: "Chauffeur, délégué du personnel",
          texte:
            "J'ai pris l'express. Les commerciaux l'ont vendu à tout le monde : je fais des allers-retours pour un carton de vis.",
        },
      ],
      [
        {
          de: "Yohann Mercadier",
          role: "Conducteur de travaux, Dumontel Bâtiment",
          texte:
            "Mardi et vendredi sur nos chantiers de Bron, c'est noté. Mes chefs d'équipe préparent leurs commandes en conséquence. Franchement, c'est plus simple pour tout le monde.",
        },
      ],
      [
        {
          de: "Capucine Aubriot",
          role: "Technico-commerciale",
          texte:
            "Deux artisans m'ont dit qu'ils iraient au comptoir d'en face pour les petites commandes. Les autres regroupent leurs achats.",
        },
      ],
      [
        {
          de: "Roland Pallas",
          role: "Chauffeur",
          texte: "Demain, Bron, encore. Une boîte de chevilles.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Le pic de printemps",
    jusqua: 9,
    messages: (ctx) => [
      {
        de: "Hubert Lhermet",
        role: "Directeur commercial",
        heure: "09:00",
        alerte: true,
        texte:
          "Les carnets des chantiers se remplissent : semaines 8 à 10, attends-toi à 15 à 45 % de livraisons en plus. Comme chaque printemps, sans qu'on sache encore combien.",
      },
      {
        de: "Awa Kouyaté",
        role: "Planificatrice transport",
        heure: "11:30",
        texte:
          "J'ai appelé Brunelière : en pic, il est saturé lui aussi, tous les négoces le sollicitent en même temps. Au pied levé, il ne pourra pas prendre plus de vingt-cinq livraisons par semaine.",
      },
      {
        de: "Tableau de bord transport",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 5 : ${ctx.arrets} arrêts par tournée, ${ctx.retard} de livraisons en retard, ${ctx.heuresSup} heures supplémentaires.`,
      },
    ],
    sources: [
      {
        id: "historique",
        titre: "Relire les deux derniers pics de printemps",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "L'an dernier, +31 % sur trois semaines ; il y a deux ans, +19 %. Les deux fois, les semaines 6 et 7 étaient calmes. Trois livraisons de pic sur dix étaient des matériaux que les chantiers auraient pu stocker une ou deux semaines plus tôt : parpaings, isolants, plaques.",
      },
      {
        id: "chantiers",
        titre: "Appeler les conducteurs de travaux des grands chantiers",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Sur les cinq grands chantiers, trois ont la place de stocker. Deux conducteurs de travaux sont prêts à être livrés en avance si on leur garantit la date ; les autres doivent en parler à leur direction.",
      },
    ],
    question: "Comment préparez-vous le pic ?",
    options: [
      {
        t: "Louer deux camions avec chauffeurs intérimaires pour trois semaines",
        d: "Semaines 8 à 10 : dix tournées de plus par semaine. 5 800 € par semaine.",
      },
      {
        t: "Réserver d'avance 45 livraisons par semaine chez Brunelière",
        d: "Semaines 8 à 10. 25 € par livraison réservée, dus même si elle ne sert pas, puis le tarif normal.",
      },
      {
        t: "Proposer aux grands chantiers d'être livrés en avance, et sous-traiter le reste au coup par coup",
        d: "Livrer en semaines 6 et 7 ce qui peut se stocker. 400 € d'organisation. Les chantiers décideront.",
      },
      {
        t: "Faire face avec les heures supplémentaires et une prime de pic",
        d: "150 € par chauffeur et par semaine de pic, et des journées plus longues.",
      },
    ],
    reactions: [
      [
        {
          de: "Awa Kouyaté",
          role: "Planificatrice transport",
          texte:
            "Les deux camions arrivent le lundi de la semaine 8. Les intérimaires ne connaissent pas les accès : je leur prépare des plans de chaque chantier.",
        },
      ],
      [
        {
          de: "Alain Brunelière",
          role: "Gérant, Transports Brunelière",
          texte:
            "C'est réservé : quarante-cinq livraisons par semaine, de la semaine 8 à la semaine 10. Vous êtes les seuls à nous l'avoir demandé à l'avance.",
        },
      ],
      null,
      [
        {
          de: "Kemal Aydin",
          role: "Chauffeur, délégué du personnel",
          texte:
            "La prime, on la prend. Mais trois semaines de journées à onze heures, on va le sentir.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Les livraisons ratées",
    jusqua: 11,
    messages: (ctx) => [
      {
        de: "Awa Kouyaté",
        role: "Planificatrice transport",
        heure: "08:15",
        alerte: true,
        texte: `Cette semaine, ${ctx.ratees} livraisons ont dû être refaites : personne pour réceptionner, grue du chantier occupée, accès fermé par une benne. Chacune, c'est un deuxième passage, et une équipe qui a attendu.`,
      },
      ctx.grandCompte
        ? {
            de: "Solène Marquant",
            role: "Directrice logistique régionale",
            heure: "10:40",
            texte:
              "Dumontel Bâtiment est livré par un concurrent depuis la semaine 7. Je ne veux pas qu'un deuxième grand compte suive le même chemin.",
          }
        : {
            de: "Yohann Mercadier",
            role: "Conducteur de travaux, Dumontel Bâtiment",
            heure: "10:40",
            texte:
              "Mardi, votre camion est arrivé à 8 h, et personne ne lui avait dit que la grue du chantier coulait une dalle. Il est reparti. Ce n'est pas la première fois.",
          },
    ],
    sources: [
      {
        id: "echecs",
        titre: "Analyser les livraisons ratées du mois",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sept sur dix auraient pu être évitées : personne n'avait prévenu le chef de chantier de l'heure de passage, ou on ignorait que l'accès était fermé le matin. Les chantiers appelés la veille ont presque tous été livrés du premier coup.",
      },
    ],
    question: "Que faites-vous contre les livraisons ratées ?",
    options: [
      {
        t: "Facturer 90 € chaque relivraison au client",
        d: "Le client paiera son absence. Les commerciaux n'aiment pas.",
      },
      {
        t: "Confirmer chaque livraison la veille avec le chef de chantier, et noter les accès",
        d: "Un SMS automatique, et un appel pour les livraisons avec grue. 350 € par semaine de temps de planification.",
      },
      {
        t: "Relivrer dès le lendemain matin, en heures supplémentaires",
        d: "Priorité absolue aux relivraisons, quitte à rallonger les tournées.",
      },
      {
        t: "Ne rien changer : les chantiers sont comme ça",
        d: "Ça fait partie du métier.",
      },
    ],
    reactions: [
      [
        {
          de: "Capucine Aubriot",
          role: "Technico-commerciale",
          texte:
            "Un de mes artisans a reçu une facture de relivraison : il était sur son chantier, c'est notre camion qui est arrivé deux heures en retard. Il ne commande plus chez nous.",
        },
      ],
      [
        {
          de: "Roland Pallas",
          role: "Chauffeur",
          texte:
            "Depuis les SMS, quand j'arrive, il y a quelqu'un, et la grue est libre. Je ne fais plus deux fois le même chantier.",
        },
      ],
      [
        {
          de: "Kemal Aydin",
          role: "Chauffeur, délégué du personnel",
          texte:
            "On relivre le lendemain à 7 h. Les chantiers sont contents, mais les tournées s'allongent, et on rentre encore plus tard.",
        },
      ],
      [
        {
          de: "Awa Kouyaté",
          role: "Planificatrice transport",
          texte: "Encore trois relivraisons demain matin. Je les glisse où je peux.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Finir le trimestre",
    jusqua: 13,
    messages: (ctx) => [
      {
        de: "Hubert Lhermet",
        role: "Directeur commercial",
        heure: "08:50",
        alerte: true,
        texte:
          "Les chantiers veulent tout recevoir avant les congés : semaines 12 et 13, compte 20 % de livraisons en plus. Mes commerciaux ont déjà commencé à promettre des dates.",
      },
      {
        de: "Solène Marquant",
        role: "Directrice logistique régionale",
        heure: "09:30",
        texte: `Deux semaines avant la clôture. Coût par livraison : ${ctx.coutLivraison} ; livraisons en retard : ${ctx.retard}. Qu'est-ce que tu prévois ?`,
      },
    ],
    sources: [],
    question: "Comment finissez-vous le trimestre ?",
    options: [
      {
        t: "Organiser deux samedis de livraison",
        d: "Toute l'équipe, semaines 12 et 13, en heures majorées. 3 400 € par samedi.",
      },
      {
        t: "Bâtir avec les commerciaux un calendrier par secteur, et confier le surplus à Brunelière",
        d: "Chaque client reçoit sa date, secteur par secteur ; les chauffeurs finissent à l'heure. Le surplus au tarif de Brunelière.",
      },
      {
        t: "Confier tout le surplus à Brunelière, sans toucher aux dates promises",
        d: "Les chauffeurs finissent à l'heure ; les dates restent celles des commerciaux.",
      },
      {
        t: "Laisser les commerciaux promettre, et faire au mieux",
        d: "Les heures supplémentaires absorberont.",
      },
    ],
    reactions: [
      [
        {
          de: "Kemal Aydin",
          role: "Chauffeur, délégué du personnel",
          texte:
            "Deux samedis de faits. Un chantier sur cinq était fermé : on a ramené une partie du chargement au dépôt.",
        },
      ],
      [
        {
          de: "Hubert Lhermet",
          role: "Directeur commercial",
          texte:
            "Le calendrier par secteur a plu : les clients savent quand ils sont livrés, et mes commerciaux n'ont plus à négocier chaque heure. On aurait dû le faire depuis longtemps.",
        },
      ],
      [
        {
          de: "Alain Brunelière",
          role: "Gérant, Transports Brunelière",
          texte:
            "On prend le surplus. Mais avec vos dates promises, mes camions traversent l'agglomération trois fois par jour.",
        },
      ],
      [
        {
          de: "Awa Kouyaté",
          role: "Planificatrice transport",
          texte:
            "Les dates promises se chevauchent d'un bout à l'autre de l'agglomération. Je fais ce que je peux avec les heures supplémentaires.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  {
    nom: "Organiser les tournées avant d'acheter de la capacité",
    chemin: [1, 1, 1, 2, 1, 1],
  },
  { nom: "Ajouter des camions et des heures", chemin: [0, 2, 0, 0, 2, 0] },
  { nom: "Attentiste", chemin: [3, 0, 3, 3, 3, 3] },
] as const;

/**
 * Les réflexes du métier sous pression : acheter de la capacité (un camion,
 * des intérimaires, des heures, tout au sous-traitant) plutôt que remplir les
 * tournées, et laisser promettre toutes les heures. [décision, option].
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 2],
  [2, 0],
  [3, 0],
  [3, 3],
  [4, 2],
  [5, 0],
  [5, 3],
] as const;

export const REPONSES = {
  prelivraisonAcceptee:
    "Les grands chantiers sont d'accord : parpaings, isolants et plaques livrés en semaines 6 et 7, ils ont la place de les stocker. Autant de moins dans le pic.",
  prelivraisonRefusee:
    "Les directions des grands chantiers refusent le stock sur chantier : vol, intempéries, assurance. Ils seront livrés au fil de l'eau, en plein pic.",
} as const;
