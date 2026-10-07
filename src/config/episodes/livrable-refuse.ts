/**
 * LE LIVRABLE QUE LE CLIENT REFUSE — le contenu de l'épisode.
 *
 * Ewen Le Goff est manager de mission chez Atlas Conseil, practice Énergie et
 * bâtiment : le diagnostic énergétique de vingt-deux bâtiments d'Ardven
 * Agglomération. Le rapport intermédiaire vient d'être refusé en comité de
 * pilotage ; le comité a surtout parlé de la forme, mais ce qu'il refuse est
 * une hypothèse de méthode que personne ne lui a fait valider. Six décisions,
 * de janvier à mars, chacune précédée de ce qu'un manager de mission reçoit
 * vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Leurs chiffres sont ceux du
 * modèle (src/engine/episodes/livrable-refuse.ts) ; le test les recalcule.
 *
 * Collectivité, cabinet, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "methode",
    t: "Une hypothèse de méthode, l'année de référence des consommations, n'a jamais été validée avec l'agglomération : tous les objectifs en découlent",
  },
  {
    id: "validation",
    t: "Le rapport est arrivé d'un bloc, sans étape de validation : le comité a tout découvert en séance",
  },
  { id: "forme", t: "Le rapport est trop long et mal présenté : le comité n'a pas pu le lire" },
  {
    id: "donnees",
    t: "Les données de consommation fournies par l'agglomération sont incomplètes : le rapport ne pouvait pas être juste",
  },
] as const;

const MARJOLAINE = {
  de: "Marjolaine Cadoret",
  role: "Directrice du patrimoine bâti, Ardven Agglomération",
} as const;
const TUDY = { de: "Tudy Gourvès", role: "Économe de flux, Ardven Agglomération" } as const;
const AWEN = { de: "Awen Kerrien", role: "Associée, practice Énergie et bâtiment" } as const;
const BASILE = { de: "Basile Quéré", role: "Consultant senior, thermicien" } as const;
const SHIRIN = { de: "Shirin Abidi", role: "Consultante énergéticienne" } as const;
const ELIAZ = { de: "Eliaz Lachèvre", role: "Analyste" } as const;
const PRUNE = { de: "Prune Lecoeur", role: "Contrôleuse de gestion" } as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le rapport intermédiaire est refusé",
    jusqua: 3,
    messages: () => [
      {
        ...MARJOLAINE,
        heure: "08:10",
        alerte: true,
        texte:
          "Monsieur Le Goff, vous l'avez entendu jeudi : le comité de pilotage ne valide pas le rapport intermédiaire. Le vice-président veut une version qu'il puisse présenter aux maires. Le rapport final reste attendu le 31 mars.",
      },
      {
        ...AWEN,
        heure: "08:45",
        texte:
          "Ewen, on m'a transféré le compte rendu. Ce trimestre, de janvier à mars, il y a la phase 2, le rapport final et, derrière, la tranche optionnelle. Dis-moi vendredi ce que tu fais.",
      },
      {
        ...BASILE,
        heure: "09:20",
        texte:
          "Si on y passe nos deux prochains week-ends, on leur renvoie un rapport impeccable sous dix jours. Toute l'équipe est partante.",
      },
      {
        de: "Tempora",
        role: "Mission Ardven, point hebdomadaire",
        heure: "09:30",
        texte: "Jours pointés depuis le début de la mission : 62, pour 150 vendus.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "compte-rendu",
        titre: "Relire le compte rendu du comité de pilotage",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Huit remarques. Six portent sur la forme : « 186 pages », « une synthèse introuvable », « des graphiques sans légende », « des coquilles ». Le vice-président, Tugdual Ropars : « Je ne peux pas présenter ça aux maires. » Une seule porte sur le fond, de l'économe de flux, Tudy Gourvès : « Les consommations de référence de dix-neuf bâtiments sur vingt-deux ne sont pas celles que la collectivité a déclarées. » Avis du comité : défavorable.",
      },
      {
        id: "note-de-methode",
        titre: "Retrouver la note de méthode et le cahier des charges",
        cout: 1,
        nature: "decisive",
        resultat:
          "La note de méthode de septembre prend 2023 comme année de référence, corrigée du climat, « sauf avis contraire ». Elle était en pièce jointe d'un courriel d'organisation : personne ne l'a validée, personne n'en a parlé en réunion. Le cahier des charges, article 4.2 : « Les consommations de référence sont celles que la collectivité a déclarées sur la plateforme nationale du dispositif Éco Énergie Tertiaire. » L'agglomération y a déclaré 2019.",
      },
      {
        id: "tempora",
        titre: "Extraire de Tempora les jours passés sur la phase 1",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Jours vendus : 150 (132 000 € HT au forfait, 880 € de TJM moyen). Pointés sur la phase 1 : 62, pour 55 prévus. Par bâtiment, 2,0 jours en moyenne, dont 0,5 jour de visite et de collecte des factures, qui n'est pas à refaire si l'on change de méthode de calcul. La note de synthèse et ses annexes : 4 jours. Le reste, 14 jours, en réunions et en pilotage. Reste à faire planifié avant le refus : 75 jours.",
      },
      {
        id: "cellule-editoriale",
        titre: "Faire relire le rapport par la cellule éditoriale du cabinet",
        cout: 1,
        nature: "bruit",
        resultat:
          "47 coquilles, 12 graphiques sans légende, un sommaire qui renvoie aux mauvaises pages. La cellule propose une synthèse de vingt pages et une mise en page plus aérée : huit jours de travail.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Awen Kerrien",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Awen : « Avant de réécrire une ligne, trouve ce qu'ils ont vraiment refusé. Un comité parle de la forme parce que c'est ce qu'il voit ; le désaccord qui compte est souvent une hypothèse qu'on ne lui a jamais fait valider. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que faites-vous du refus ?",
    options: [
      {
        t: "Faire travailler l'équipe le week-end pour rendre une version « parfaite » du rapport complet sous dix jours",
        d: "Deux week-ends pour toute l'équipe : chaque bâtiment recontrôlé, la forme entièrement reprise. 30 jours, dont 12 samedis rachetés majorés de 10 %.",
      },
      {
        t: "Analyser le refus avec la directrice et l'économe de flux, faire valider la méthode, puis recalculer trois bâtiments témoins avant les autres",
        d: "Un atelier d'une demi-journée et une note de méthode validée par écrit : 2 jours, puis la reprise. La nouvelle version partira vers la semaine 6.",
      },
      {
        t: "Reprendre la forme : une synthèse de vingt pages, des graphiques lisibles, plus une coquille, et un renvoi sous dix jours",
        d: "La proposition de la cellule éditoriale : 8 jours.",
      },
      {
        t: "Attendre les remarques écrites de l'agglomération avant de toucher au rapport",
        d: "Elles sont promises sous quinze jours. L'équipe reste staffée sur la mission en attendant.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...TUDY,
          texte:
            "Merci d'être venus. C'est la première fois qu'on me demande quelle année de référence nous avons déclarée : 2019, pour les vingt-deux bâtiments. Je vous envoie les déclarations ce soir, et je regarderai vos trois bâtiments témoins.",
        },
      ],
      [
        {
          ...MARJOLAINE,
          texte:
            "La nouvelle version se lit beaucoup mieux, mais les consommations de référence n'ont pas bougé : M. Gourvès maintient son avis. Le comité ne peut pas la valider.",
        },
      ],
      [
        {
          ...MARJOLAINE,
          texte:
            "Voici nos remarques écrites. La principale est de M. Gourvès : vos consommations de référence ne sont pas celles que nous avons déclarées, en 2019. Le reste porte sur la présentation.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "La phase 2 doit démarrer",
    jusqua: 5,
    messages: (ctx) => [
      ctx.nouveauRefus
        ? {
            ...MARJOLAINE,
            heure: "10:15",
            alerte: true,
            texte:
              "Monsieur Le Goff, la nouvelle version ne change rien aux consommations de référence : c'est un deuxième avis défavorable. Le vice-président s'impatiente. M. Gourvès propose de vous recevoir pour en parler enfin.",
          }
        : ctx.sousReserve
          ? {
              ...MARJOLAINE,
              heure: "10:15",
              texte:
                "Le comité a accepté la nouvelle version sous réserve : M. Gourvès était absent, et ses remarques sur les consommations de référence restent à traiter.",
            }
          : ctx.methodeValidee
            ? {
                ...TUDY,
                heure: "10:15",
                texte:
                  "Vos trois bâtiments témoins sont recalculés avec 2019 et nos surfaces déclarées : ils collent à nos déclarations. Vous pouvez généraliser.",
              }
            : {
                ...MARJOLAINE,
                heure: "10:15",
                texte:
                  "Vous avez nos remarques écrites. Nous attendons la nouvelle version : le vice-président trouve que les choses traînent.",
              },
      {
        ...BASILE,
        heure: "14:00",
        alerte: true,
        texte:
          "La phase 2 devait commencer lundi : vingt-deux fiches de scénarios de travaux, deux jours chacune, à présenter en comité en semaine 10. Comment on s'organise ?",
      },
      {
        ...PRUNE,
        heure: "17:30",
        texte: `Mission Ardven, fin de semaine 3 : ${ctx.jours} pointés, pour 150 vendus.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "remarques-phase2",
        titre: "Demander à l'économe de flux ce qu'il attend de la phase 2",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Tudy Gourvès : « Vos coûts de travaux viennent de ratios nationaux ; nos derniers marchés de travaux sortent 20 à 30 % au-dessus. Et les élus veulent savoir si l'on tient l'objectif de −40 % en 2030, pas seulement quelles actions sont rentables. » Rien de cela ne figure dans la note d'hypothèses de la phase 2, qu'il n'a jamais vue.",
      },
      {
        id: "missions-passees",
        titre: "Comparer avec les missions d'audit de la practice",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Sur les douze dernières missions d'audit énergétique de la practice, celles qui ont fait valider un échantillon de bâtiments avant de généraliser ont passé 4 % de leurs jours en reprises ; les autres, 17 %.",
      },
    ],
    question: "Comment lancez-vous la phase 2 ?",
    options: [
      {
        t: "Lancer les vingt-deux fiches d'un coup, avec deux consultants de l'intercontrat en renfort, pour rattraper le retard",
        d: "Huit jours de plus par semaine pendant un mois, et une semaine pour les mettre au courant du modèle de calcul.",
      },
      {
        t: "Faire trois fiches types (une école, un gymnase, la piscine) et les valider en réunion technique avant de généraliser",
        d: "Une réunion d'une heure et demie avec l'économe de flux ; les dix-neuf autres fiches attendent son retour.",
      },
      {
        t: "Envoyer la note d'hypothèses de la phase 2 par courriel pour validation, et lancer les fiches",
        d: "Une demi-journée pour la rédiger. L'économe de flux répondra, ou pas.",
      },
      {
        t: "Suivre le planning initial, bâtiment après bâtiment",
        d: "Ne coûte rien de plus.",
      },
    ],
    reactions: [
      [
        {
          ...BASILE,
          texte:
            "Les deux renforts arrivent lundi. Il faut leur expliquer le modèle de calcul et les bâtiments : ça va prendre la semaine.",
        },
      ],
      [
        {
          ...TUDY,
          texte: "Bonne idée. Je viendrai avec nos derniers bordereaux de prix de travaux.",
        },
      ],
      [{ ...ELIAZ, texte: "La note d'hypothèses est partie. Pas de réponse pour l'instant." }],
      [{ ...SHIRIN, texte: "On commence par les écoles, dans l'ordre du cahier des charges." }],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Les premières fiches partent",
    jusqua: 7,
    messages: (ctx) => [
      {
        ...SHIRIN,
        heure: "11:00",
        texte: `${ctx.fiches} fiches de la phase 2 sont prêtes. On envoie les premières à la directrice lundi.`,
      },
      {
        ...AWEN,
        heure: "12:30",
        alerte: true,
        texte:
          "Ewen, qui relit les fiches avant qu'elles partent ? Je ne veux pas d'un deuxième comité comme celui de janvier.",
      },
      ctx.phase1Validee
        ? {
            ...MARJOLAINE,
            heure: "16:45",
            texte: "La nouvelle version du rapport intermédiaire est validée. Merci.",
          }
        : {
            ...PRUNE,
            heure: "16:45",
            texte: `Le rapport intermédiaire n'est toujours pas validé : la facturation du jalon de la phase 1 attend. ${ctx.jours} pointés sur la mission.`,
          },
    ],
    sources: [
      {
        id: "erreurs-phase1",
        titre: "Regarder les erreurs relevées sur la phase 1",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sur la phase 1, la collectivité a relevé en moyenne 0,8 erreur par bâtiment : un tarif mal reporté, une surface venue d'une autre fiche, un total faux. Sur les missions de la practice, les fiches relues par un pair n'en gardent qu'un cinquième. Une relecture croisée prend 0,3 jour par fiche ; une erreur corrigée avant envoi coûte 0,1 jour, la même trouvée par le client 0,5 jour, et un peu de sa confiance.",
      },
    ],
    question: "Qui relit, et quand ?",
    options: [
      {
        t: "Relire vous-même tout le rapport la veille de chaque envoi",
        d: "Deux jours et demi avant le comité de phase 2, un jour et demi avant le rapport final. Vos soirées.",
      },
      {
        t: "Faire relire chaque fiche par un pair avant qu'elle parte",
        d: "0,3 jour par fiche, au fil de l'eau, et deux jours sur le rapport final.",
      },
      {
        t: "Demander à Awen de relire quelques fiches avant le comité de phase 2",
        d: "Une journée de son temps, en semaine 9.",
      },
      {
        t: "Pas de relecture formelle : le modèle de calcul est éprouvé",
        d: "Ne coûte rien.",
      },
    ],
    reactions: [
      [{ ...BASILE, texte: "D'accord. Tu nous diras ce que tu trouves… la veille." }],
      [
        {
          ...ELIAZ,
          texte:
            "J'ai relu les fiches de Shirin : deux surfaces inversées et un total faux, corrigés avant l'envoi. Elle relit les miennes demain.",
        },
      ],
      [{ ...AWEN, texte: "Je bloque une journée en semaine 9." }],
      [{ ...SHIRIN, texte: "Entendu, on envoie au fil de l'eau." }],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Deux erreurs dans les fiches",
    jusqua: 9,
    messages: () => [
      {
        ...MARJOLAINE,
        heure: "09:40",
        alerte: true,
        texte:
          "Monsieur Le Goff, deux erreurs dans les fiches reçues : la médiathèque et le groupe scolaire des Ajoncs affichent une facture de chaleur près d'un tiers trop basse. Je vous les signale avant que le vice-président les voie.",
      },
      {
        ...BASILE,
        heure: "10:05",
        texte: "Je corrige les deux ce soir, c'est l'affaire d'une heure.",
      },
    ],
    sources: [
      {
        id: "origine",
        titre: "Remonter à la source des deux erreurs",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les deux bâtiments sont raccordés au réseau de chaleur. Dans le modèle de calcul commun, le prix de la chaleur est celui de l'ancien contrat de délégation, d'avant la révision tarifaire. Neuf bâtiments sur vingt-deux sont raccordés : toutes leurs fiches, faites et à faire, sont touchées. Corriger le modèle et relancer les fiches concernées : un jour, plus 0,3 jour par fiche.",
      },
    ],
    question: "Que faites-vous des deux erreurs ?",
    options: [
      {
        t: "Corriger les deux fiches signalées et poursuivre",
        d: "Quelques heures. La directrice a sa réponse lundi.",
      },
      {
        t: "Chercher d'où viennent les erreurs, puis corriger le modèle de calcul et relancer les fiches concernées",
        d: "Un jour d'analyse, et 0,3 jour par fiche relancée.",
      },
      {
        t: "Faire revérifier toutes les fiches déjà faites, une par une",
        d: "0,45 jour par fiche faite.",
      },
      {
        t: "Répondre que les fiches seront corrigées dans le rapport final",
        d: "Rien à faire d'ici là.",
      },
    ],
    reactions: [
      [{ ...BASILE, texte: "Corrigées et renvoyées. La directrice remercie." }],
      [
        {
          ...SHIRIN,
          texte:
            "Trouvé : le prix de la chaleur du modèle datait de l'ancien contrat. Il est corrigé, et les fiches des bâtiments raccordés repartent lundi.",
        },
      ],
      [
        {
          ...ELIAZ,
          texte:
            "On a tout revérifié. Le prix de la chaleur était faux pour tous les bâtiments raccordés, et on a trouvé quelques autres erreurs au passage.",
        },
      ],
      [
        {
          ...MARJOLAINE,
          texte: "Bien noté. J'espère que le rapport final sera plus juste.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Basile part sur une avant-vente",
    jusqua: 11,
    messages: (ctx) => [
      {
        ...AWEN,
        heure: "08:30",
        alerte: true,
        texte:
          "Ewen, le go est donné sur l'appel d'offres du conseil départemental. J'ai besoin de Basile pour le mémoire technique : il ne sera plus qu'un jour par semaine sur ta mission jusqu'à fin mars.",
      },
      {
        ...PRUNE,
        heure: "17:30",
        texte: `Mission Ardven, fin de semaine 9 : ${ctx.jours} pointés, pour 150 vendus.`,
      },
    ],
    sources: [
      {
        id: "planning",
        titre: "Refaire le planning jusqu'au 31 mars",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Il reste ${ctx.reste} de travail jusqu'à la remise du rapport final, pilotage compris. D'ici le 31 mars, avec Basile à un jour par semaine, l'équipe en a ${ctx.capacite} : ${
            ctx.manquant ? `il en manque ${ctx.manque}.` : "la date tient, de justesse."
          }`,
      },
      {
        id: "ccap",
        titre: "Relire le CCAP sur les délais",
        cout: 0.5,
        nature: "utile",
        resultat:
          "250 € de pénalité par jour calendaire de retard dans la remise d'un rapport, soit 1 750 € par semaine. Le délai d'exécution peut être prolongé par décision de l'agglomération, si le titulaire le demande avant son expiration et le justifie.",
      },
    ],
    question: "Comment tenez-vous la fin du trimestre ?",
    options: [
      {
        t: "Faire travailler l'équipe trois samedis pour tenir la date",
        d: "Douze jours de plus, rachetés majorés de 10 %.",
      },
      {
        t: "Proposer à la directrice une remise en deux temps : les fiches à la date, le plan pluriannuel deux semaines plus tard, après un atelier de priorisation avec les élus",
        d: "Un atelier d'une journée et demie. Elle acceptera, ou pas.",
      },
      {
        t: "Faire venir un consultant de l'intercontrat sur le plan pluriannuel",
        d: "Trois jours de plus par semaine, et trois jours pour le mettre au courant.",
      },
      {
        t: "Ne rien changer : on verra fin mars",
        d: "Ne coûte rien d'ici là.",
      },
    ],
    reactions: [
      [
        {
          ...SHIRIN,
          texte:
            "On fera les samedis. Mais on finit fatigués, et c'est quand on est fatigués qu'on se trompe.",
        },
      ],
      [
        {
          ...MARJOLAINE,
          texte:
            "J'en parle lundi au directeur général des services, je vous réponds dans la semaine.",
        },
      ],
      [{ ...PRUNE, texte: "Un consultant de l'intercontrat est disponible : il commence lundi." }],
      [
        {
          ...ELIAZ,
          texte: "Si rien ne change, on ne finira pas le plan pluriannuel à temps.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Le comité de pilotage final",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...MARJOLAINE,
        heure: "09:00",
        alerte: true,
        texte:
          "Le comité final est fixé au 31 mars. Le bureau communautaire décidera ensuite de l'affermissement de la tranche optionnelle, si le budget le permet.",
      },
      {
        ...AWEN,
        heure: "11:20",
        texte:
          "La tranche optionnelle, c'est 96 000 € d'honoraires et un an de travail pour l'équipe. Ce comité, il faut le gagner.",
      },
      {
        ...PRUNE,
        heure: "17:30",
        texte: `Mission Ardven, fin de semaine 11 : ${ctx.jours} pointés, pour 150 vendus. Remarques d'erreur relevées par l'agglomération depuis janvier : ${ctx.remarques}.`,
      },
    ],
    sources: [
      {
        id: "budget",
        titre: "Demander à la directrice où en est le budget",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Le budget primitif est voté fin mars. Les crédits de la tranche optionnelle : à peu près une chance sur trois d'être inscrits sans discussion, une sur deux d'être arbitrés au plus juste, une sur cinq d'être gelés. Le bureau suivra l'avis de sa directrice et de son économe de flux, qui veulent ne rien découvrir en séance.",
      },
      {
        id: "tranche",
        titre: "Relire la tranche optionnelle du marché",
        cout: 0.5,
        nature: "utile",
        resultat:
          "L'assistance à maîtrise d'ouvrage du programme de travaux : 96 000 € HT d'honoraires, avec une marge prévisionnelle de 38 %, soit 36 480 €. Une remise de 10 % en retirerait 9 600 €.",
      },
    ],
    question: "Comment préparez-vous le comité final ?",
    options: [
      {
        t: "Revoir le rapport final avec la directrice et l'économe de flux une semaine avant le comité",
        d: "Une réunion de travail en semaine 12, deux jours de préparation. Rien ne sera une surprise en séance.",
      },
      {
        t: "Une dernière nuit de relecture de toute l'équipe, et l'envoi la veille du comité",
        d: "Trois jours, rachetés majorés. Le rapport sera impeccable.",
      },
      {
        t: "Proposer en comité une remise de 10 % sur la tranche optionnelle pour emporter la décision",
        d: "9 600 € d'honoraires en moins si elle est affermie.",
      },
      {
        t: "Envoyer le rapport à la date et le présenter en comité",
        d: "Comme prévu au planning.",
      },
    ],
    reactions: [
      [
        {
          ...TUDY,
          texte:
            "Merci de nous l'avoir montré avant. Nous avons revu ensemble ce qui restait à revoir ; je défendrai le plan devant le bureau.",
        },
      ],
      [{ ...ELIAZ, texte: "Rapport parti à 23 h 40, la veille du comité. On est rincés." }],
      [{ ...AWEN, texte: "La remise est dans la proposition. On verra si elle pèse." }],
      [{ ...SHIRIN, texte: "Le rapport est parti à la date." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Valider en route", chemin: [1, 1, 1, 1, 1, 0] },
  { nom: "L'effort héroïque", chemin: [0, 0, 0, 0, 0, 1] },
  { nom: "Attentiste", chemin: [3, 3, 3, 3, 3, 3] },
] as const;

/**
 * Les réflexes de la mission qui dérape : [décision, option]. Tous mettent
 * l'effort à la fin, ou à la place de la validation : la version « parfaite »
 * du week-end, le renfort pour rattraper, la relecture de la veille, la
 * correction au cas par cas, les samedis, la nuit avant le comité.
 */
export const REFLEXES = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 1],
] as const;

export const REPONSES = {
  parfaiteRefusee:
    "La nouvelle version est impeccable sur la forme, mais les consommations de référence n'ont pas bougé : M. Gourvès maintient son avis. Deuxième avis défavorable.",
  parfaiteSousReserve:
    "M. Gourvès était absent : le comité accepte la nouvelle version, sous réserve de ses remarques sur les consommations de référence, qui restent à traiter.",
  temoins:
    "Les trois bâtiments témoins collent à nos déclarations. Vous pouvez recalculer les autres sur la même base.",
  phase1Acceptee: "La nouvelle version du rapport intermédiaire est validée. Merci.",
  phase1Retouches:
    "La nouvelle version est presque bonne : il reste des surfaces à reprendre sur quelques bâtiments. Nous la validerons une fois corrigée.",
  courrielLu:
    "J'ai lu votre note d'hypothèses : vos coûts de travaux sont trop bas pour nos marchés, et les élus veulent la trajectoire de −40 %. Je vous envoie nos bordereaux.",
  courrielSansReponse:
    "Le courriel avec la note d'hypothèses est resté sans réponse. L'économe de flux était sur une autre urgence.",
  echantillonEcart:
    "Réunion technique : sur les trois fiches types, vos coûts de travaux sont 20 à 30 % sous nos marchés, et les scénarios ne disent pas si l'on tient −40 %. On reprend les trois, et les dix-neuf autres partiront sur la bonne base.",
  echantillonValide:
    "Réunion technique : les trois fiches types tiennent. Les hypothèses sont validées, vous pouvez généraliser.",
  copil2Refus:
    "Comité de phase 2 : les élus découvrent des coûts de travaux sous-estimés et des scénarios qui ne disent rien de l'objectif de −40 %. Le rapport de phase 2 n'est pas validé : toutes les fiches sont à reprendre.",
  copil2Remarques:
    "Comité de phase 2 : trop d'erreurs dans les fiches. Le vice-président demande une version corrigée avant de valider la phase.",
  copil2Valide: "Comité de phase 2 : les fiches sont validées, avec quelques corrections à faire.",
  arretShirin:
    "Shirin Abidi est en arrêt de travail pour deux semaines. Elle a tenu tant qu'elle a pu.",
  remiseAcceptee:
    "Le directeur général des services est d'accord pour une remise en deux temps : les fiches au 31 mars, le plan pluriannuel deux semaines plus tard, après l'atelier avec les élus. Je vous envoie la décision de prolongation.",
  remiseRefusee:
    "Désolée : le directeur général des services veut le rapport complet au 31 mars, comme prévu au marché. Les pénalités s'appliqueront en cas de retard.",
  precopilEcart:
    "En relisant ensemble, nous voyons que les priorités ne suivent pas les critères des élus : ils veulent d'abord les écoles, au coût par tonne de CO₂ évitée. Vous avez le temps de les reprendre avant le comité.",
  budget: [
    "Le budget est voté : les crédits de la tranche optionnelle y sont inscrits sans discussion.",
    "Le budget est voté : les crédits d'investissement ont été arbitrés au plus juste. La tranche optionnelle reste possible, mais elle devra se défendre.",
    "Le budget est voté : les crédits d'investissement nouveaux sont gelés cette année. La tranche optionnelle n'a guère de chances d'être affermie.",
  ],
} as const;
