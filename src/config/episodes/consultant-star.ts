/**
 * LE CONSULTANT STAR — le contenu de l'épisode.
 *
 * Philippine Darras manage l'équipe Data et systèmes d'information du bureau
 * de Bordeaux d'Atlas Conseil : sept personnes. Maximilien Harismendy, son
 * consultant senior, est le plus brillant ; ses clients l'adorent, il fait
 * 30 % du chiffre de l'équipe. Il relit les livrables des analystes en les
 * humiliant, garde le travail pour lui, domine les réunions ; une analyste
 * passe un entretien chez un concurrent. Six décisions, d'avril à juin,
 * chacune précédée de ce qu'une manager reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Les chiffres qu'elles
 * donnent sont ceux du modèle ; le test les recalcule.
 *
 * Entreprise, clients, personnes et chiffres sont fictifs.
 */
import {
  CHANCES,
  CHARGES,
  COUTS,
  DEPART,
  FREELANCE,
  JOURS_PAR_AN,
  OCCUPATION_AUTRES,
  OCCUPATION_BASSE,
  OCCUPATION_CIBLE,
  OCCUPATION_STAR,
  OCCUPATION_VENDUE,
  TOTAL_JOURS_OUVRES,
} from "@/engine/episodes/consultant-star";
import type { Etape } from "./types";

const pc = (v: number) => `${Math.round(v * 100)} %`;
const eur = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} €`;
/** Le coût salarial d'un jour ouvré d'analyste, tel que le contrôle de gestion le donne. */
const coutJour = (42000 * CHARGES) / JOURS_PAR_AN;

export const DIAGNOSTICS = [
  {
    id: "comportement",
    t: "Le comportement de Maximilien, toléré parce qu'il rapporte, coûte à l'équipe plus qu'il ne lui apporte",
  },
  {
    id: "delegation",
    t: "Maximilien est débordé : il garde le travail faute de temps pour déléguer",
  },
  {
    id: "niveau",
    t: "Les analystes manquent de niveau : ses relectures sont exigeantes, comme le métier",
  },
  { id: "carnet", t: "Le carnet de la practice ne suffit pas à occuper les analystes" },
] as const;

const MAXIMILIEN = { de: "Maximilien Harismendy", role: "Consultant senior" } as const;
const ILHAM = { de: "Ilham Mebarki", role: "Analyste, mission Banque Dauriac" } as const;
const NEVEN = { de: "Neven Gloaguen", role: "Analyste, mission Banque Dauriac" } as const;
const GAETANE = { de: "Gaëtane Nakamura", role: "Analyste, mission Lagrave" } as const;
const PEIO = { de: "Peio Larrieu", role: "Consultant, mission Lagrave" } as const;
const RUBEN = {
  de: "Ruben Esnault",
  role: "Directeur de la practice Data et SI",
} as const;
const ENORA = { de: "Énora Bidegain", role: "Ressources humaines, bureau de Bordeaux" } as const;
const PRUNE = {
  de: "Prune Lecoeur",
  role: "Contrôleuse de gestion",
} as const;
export const AMAYA = {
  de: "Amaya Marsac",
  role: "Directrice des données, Banque Dauriac",
} as const;
const MAYEUL = { de: "Mayeul Oyarzabal", role: "DSI, Lagrave Aérostructures" } as const;
const TEMPORA = { de: "Tempora", role: "Gestion des temps et des missions" } as const;

/** Le coût d'un départ d'analyste, ligne par ligne, tel que la source le pose. */
export const LIGNES_DU_DEPART = {
  cabinet: DEPART.cabinet * 42000,
  vacance: DEPART.vacance * (700 * DEPART.occupation - coutJour),
  integration: DEPART.integration * 700 * DEPART.occupation,
} as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le meilleur consultant de l'équipe",
    jusqua: 2,
    messages: () => [
      {
        ...TEMPORA,
        heure: "07:50",
        alerte: true,
        texte: `Trimestre d'avril à juin : ${TOTAL_JOURS_OUVRES} jours ouvrés (lundi de Pâques, 1er et 8 mai, Ascension, Pentecôte). Taux d'occupation de l'équipe Data et SI de Bordeaux au trimestre précédent : 68 %, pour une cible de ${pc(OCCUPATION_CIBLE)}.`,
      },
      {
        ...ILHAM,
        heure: "08:40",
        alerte: true,
        texte:
          "Philippine, on peut se voir aujourd'hui ? Vendredi soir, Maximilien m'a renvoyé mon analyse avec « niveau stage » en commentaire. Ce matin, la banque avait une version qu'il avait réécrite seul, sous son nom.",
      },
      {
        ...RUBEN,
        heure: "09:15",
        texte:
          "Amaya Marsac, de la Banque Dauriac, m'a encore dit que Maximilien était le meilleur consultant data qu'elle ait eu. Il fait 30 % du chiffre de ton équipe : ménage-le. Mais j'entends aussi des choses sur l'ambiance.",
      },
      {
        ...ENORA,
        heure: "10:05",
        texte:
          "Pour que tu ne l'apprennes pas trop tard : Ilham a posé une demi-journée pour « un entretien extérieur » dans trois semaines.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "relectures",
        titre: "Relire ses commentaires sur les trois derniers livrables",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Livrable Dauriac du 27 mars (Ilham) : 64 commentaires, dont 11 du type « niveau stage » ou « à refaire, tout » ; aucun ne dit quoi corriger. Livrable Lagrave du 2 avril (Gaëtane) : réécrit par lui dans la nuit et envoyé au client sous son seul nom, sans qu'elle soit prévenue. Comité Dauriac du 24 mars, d'après le compte rendu : il a coupé Neven quatre fois en vingt minutes. Ce sont des faits datés : ils peuvent se dire.",
      },
      {
        id: "tempora",
        titre: "Extraire de Tempora le staffing réel de ses deux missions",
        cout: 1,
        nature: "decisive",
        resultat: `Le plan de staffing vendu à la Banque Dauriac et à Lagrave prévoyait ses quatre équipiers (Ilham, Neven, Gaëtane, Peio) occupés à ${pc(OCCUPATION_VENDUE)}. Tempora montre ${pc(OCCUPATION_BASSE)} sur les huit dernières semaines. Maximilien facture ${pc(OCCUPATION_STAR)} de son temps et en saisit 55 heures par semaine : il fait lui-même l'analyse que le plan confiait aux analystes. Morgane et Liam, sur les autres missions, sont à ${pc(OCCUPATION_AUTRES)}. Les jours d'analyste vendus et non consommés ne se rattrapent pas : c'est là que l'équipe perd ses points d'occupation.`,
      },
      {
        id: "depart",
        titre: "Demander au contrôle de gestion ce que coûte un départ d'analyste",
        cout: 0.5,
        nature: "decisive",
        resultat: `Prune Lecoeur : « On compte trois choses. Le cabinet de recrutement : ${pc(DEPART.cabinet)} du salaire annuel brut, ${eur(42000)} pour un analyste. Le poste vacant : ${DEPART.vacance} jours ouvrés en moyenne entre le départ et l'arrivée du remplaçant, où l'on ne facture plus l'analyste mais où l'on ne paie plus son salaire, ${eur(coutJour)} par jour ouvré charges comprises. Et la montée en compétence : les ${DEPART.integration} premiers jours du remplaçant ne sont pas facturables. Un analyste est facturé ${eur(700)} par jour et occupé à ${pc(DEPART.occupation)}. On provisionne tout dès la démission. »`,
      },
      {
        id: "clients",
        titre: "Lire les enquêtes de satisfaction de ses clients",
        cout: 1,
        nature: "bruit",
        resultat:
          "Banque Dauriac : 9,6 sur 10, « le meilleur consultant data que nous ayons eu ». Lagrave Aérostructures : 9,2 sur 10, « réactif, brillant, toujours disponible ». Aucun des deux ne mentionne les analystes.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Ruben",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Ruben : « Je t'ai dit de le ménager, pas de te taire. Un talent qui abîme l'équipe ne se protège ni par le silence ni par le placard. Va chercher des faits, et dis-les-lui. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que faites-vous cette semaine avec Maximilien ?",
    options: [
      {
        t: "Ne rien dire pour l'instant : il fait 30 % du chiffre de l'équipe",
        d: "Les missions tournent et les clients sont ravis. Vous verrez après les comités de juin.",
      },
      {
        t: "Le recevoir pour un recadrage fondé sur des faits",
        d: "Trois faits datés, leur effet sur l'équipe, ce que vous attendez désormais (relectures, délégation, réunions), et un point toutes les deux semaines. Une heure, préparée.",
      },
      {
        t: "Lui demander de faire attention à son ton avec les juniors",
        d: "Un mot en tête-à-tête, sans le mettre en difficulté. Dix minutes.",
      },
      {
        t: "Le sortir de ses missions et le mettre en avant-vente, loin des juniors",
        d: "Peio reprend Dauriac et Lagrave. Plus de relectures humiliantes, à coup sûr.",
      },
    ],
    reactions: [
      [{ ...ILHAM, texte: "D'accord. Je vais continuer comme ça, alors." }],
      [
        {
          ...MAXIMILIEN,
          texte:
            "Il a écouté sans interrompre, a demandé à relire les commentaires du 27 mars, puis : « Je suis exigeant parce que les clients le sont. Mais j'entends. On se revoit dans quinze jours. »",
        },
      ],
      [
        {
          ...MAXIMILIEN,
          texte:
            "« Mon ton ? Les clients ne s'en plaignent pas. Mais si ça peut te rassurer, je ferai attention. »",
        },
      ],
      [
        {
          ...MAXIMILIEN,
          texte:
            "« Tu me retires Dauriac ? Amaya Marsac va adorer. » Il a quitté le bureau sans un mot de plus.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Ilham veut quitter la mission",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...ILHAM,
        heure: "17:10",
        alerte: true,
        texte:
          "J'ai un deuxième entretien chez Kéroual Consulting dans deux semaines. Avant d'y aller, je te pose la question : est-ce que je peux quitter la mission Dauriac ?",
      },
      {
        ...TEMPORA,
        heure: "18:00",
        texte: `Point du vendredi. Engagement des analystes (baromètre interne) : ${ctx.engagement} sur 100. Occupation de l'équipe : ${ctx.occupation}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "entretien",
        titre: "Prendre une heure avec Ilham",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `« Ce n'est pas la mission, elle me plaît. C'est la façon dont mon travail est relu et présenté. Si quelqu'un d'autre relisait mes livrables avec des critères clairs, et si je pouvais présenter ma partie au comité, je resterais. »${
            ctx.recadre
              ? " Elle ajoute que depuis mardi les commentaires de Maximilien sont plus courts. « Je ne sais pas si ça va durer. »"
              : ""
          }`,
      },
      {
        id: "staffing",
        titre: "Regarder où l'on pourrait staffer Ilham",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Hors de Dauriac, rien avant le marché de la métropole, en semaine 6 : d'ici là, intercontrat. Peio peut relire ses livrables avec une grille : une demi-journée par semaine prise sur Lagrave.",
      },
    ],
    question: "Que répondez-vous à Ilham ?",
    options: [
      {
        t: "Refuser : on ne change pas une équipe en cours de mission",
        d: "Le client la connaît, et Maximilien a besoin d'elle. Vous lui demandez de tenir jusqu'en juin.",
      },
      {
        t: "La sortir de la mission Dauriac",
        d: "Intercontrat jusqu'à la semaine 6, puis le marché de la métropole. Trois semaines de jours non facturés.",
      },
      {
        t: "La garder sur Dauriac, mais changer le circuit de relecture",
        d: "Peio relit ses livrables avec une grille écrite, et elle présente sa partie au comité. Une demi-journée de Peio par semaine.",
      },
      {
        t: "Lui proposer une prime pour tenir jusqu'à la fin de la mission",
        d: `${eur(COUTS.prime)} en juin, si elle reste jusqu'au bout.`,
      },
    ],
    reactions: [
      [{ ...ILHAM, texte: "Je comprends. Je verrai ce que je fais après mon entretien." }],
      [
        {
          ...ILHAM,
          texte: "Merci. Je vais trouver le temps long trois semaines, mais je respire.",
        },
      ],
      [
        {
          ...ILHAM,
          texte: "Une grille écrite, et présenter ma partie ? C'est exactement ce qui me manquait.",
        },
        { ...PEIO, texte: "D'accord pour relire. Je bloque le mardi après-midi." },
      ],
      [{ ...ILHAM, texte: "C'est gentil. Mais ce n'est pas une question d'argent." }],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "La banque signe un deuxième lot",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...AMAYA,
        heure: "11:00",
        alerte: true,
        texte:
          "Nous signons le lot 2, la qualité des données de risque, de la semaine 6 à fin juin, en régie. Nous comptons sur Maximilien.",
      },
      {
        ...MAXIMILIEN,
        heure: "11:40",
        texte: ctx.maximilienParti
          ? "Je finis mon préavis, mais je peux encore monter le lot 2 : moi et un indépendant de Freelancia, quatre jours par semaine."
          : "Je propose de le faire avec un indépendant de Freelancia que je connais : quatre jours par semaine. Ce sera plus rapide que de former les analystes.",
      },
    ],
    sources: [
      {
        id: "plan",
        titre: "Chiffrer les deux façons de staffer le lot",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Le lot 2 se vend en régie : un jour de senior par semaine et deux analystes à temps plein, à ${eur(700)} par jour d'analyste. Avec Ilham et Neven, leur occupation passerait de ${ctx.occupationJuniors} à plus de 80 %. L'indépendant de Freelancia coûte ${eur(FREELANCE.achat)} par jour et se refacture ${eur(FREELANCE.vente)} : ${eur(FREELANCE.vente - FREELANCE.achat)} de marge par jour, ${eur((FREELANCE.vente - FREELANCE.achat) * FREELANCE.jours)} par semaine, et les analystes restent où ils sont. En pyramide, tout dépend de la façon dont Maximilien délègue et relit : ses analystes travailleraient sous lui à plein temps. Le baromètre des analystes est à ${ctx.engagement} sur 100.`,
      },
      {
        id: "banque",
        titre: "Demander à Ruben si la banque accepterait un autre chef de mission",
        cout: 0.5,
        nature: "utile",
        resultat: `Ruben : « Amaya Marsac a déjà refusé une fois qu'on change son chef de mission. Je dirais moins d'une chance sur deux. Et Maximilien le prendra comme une mise à l'écart : Halden Partners recrute à Bordeaux. »`,
      },
    ],
    question: "Comment staffez-vous le lot 2 ?",
    options: [
      {
        t: "Le laisser staffer comme il le propose : lui et un indépendant",
        d: `Quatre jours de Freelancia par semaine, ${eur((FREELANCE.vente - FREELANCE.achat) * FREELANCE.jours)} de marge par semaine. Ilham et Neven restent où ils sont.`,
      },
      {
        t: "Staffer en pyramide : Maximilien directeur de mission, Ilham et Neven à plein temps",
        d: "Avec un plan de délégation écrit : qui produit quoi, qui relit quoi, qui présente quoi. Un jour de Maximilien par semaine.",
      },
      {
        t: "Proposer à la banque une équipe menée par Peio, sans Maximilien",
        d: "Peio, Ilham et Neven. Il faut l'accord d'Amaya Marsac.",
      },
    ],
    reactions: [
      [{ ...MAXIMILIEN, texte: "Parfait. L'indépendant commence lundi de la semaine 6." }],
      [
        {
          ...MAXIMILIEN,
          texte: "« Un plan de délégation écrit ? » Il l'a relu deux fois, puis il l'a signé.",
        },
        { ...NEVEN, texte: "À plein temps sur Dauriac, sous Maximilien ? On verra bien." },
      ],
      null,
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Qui forme les analystes ?",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...RUBEN,
        heure: "09:00",
        alerte: true,
        texte:
          "La practice lance son parcours de montée en compétence des analystes : un mentor par bureau, deux heures par semaine. Maximilien s'est proposé pour Bordeaux. Techniquement, c'est le meilleur, personne n'en doute. À toi de choisir.",
      },
      {
        ...TEMPORA,
        heure: "18:00",
        texte: `Point du vendredi. Engagement des analystes : ${ctx.engagement} sur 100. Occupation des analystes de ses missions : ${ctx.occupationJuniors}.`,
      },
    ],
    sources: [
      {
        id: "retour",
        titre: "Demander aux RH le bilan des mentorats de l'an dernier",
        cout: 0.5,
        nature: "decisive",
        resultat: `Énora Bidegain : « Dans les cinq practices, quand le mentor avait été recadré et avait changé, ${Math.round(CHANCES.mentorChange * 10)} mentorats sur 10 ont réussi ; sinon, à peine un sur sept, et deux ont fini en démission d'analyste. Le goût de transmettre ne se devine pas : les bureaux qui ont fait un essai court, un atelier co-animé avec un avis anonyme des analystes, ont évité presque tous les échecs. »`,
      },
      {
        id: "essai",
        titre: "Regarder ce que coûterait un essai",
        cout: 0.5,
        nature: "utile",
        resultat: `Deux ateliers techniques des analystes, co-animés avec vous en semaines 7 et 8, puis leur avis anonyme. Une journée de votre temps : vous êtes facturée ${eur(COUTS.essai)} par jour. Le mentorat commencerait en semaine 9 au lieu de la semaine 7.`,
      },
    ],
    question: "À qui confiez-vous le mentorat des analystes ?",
    options: [
      {
        t: "À Maximilien, dès la semaine 7, avec un cadre",
        d: "Des objectifs écrits, un avis des analystes à six semaines, un point mensuel avec vous.",
      },
      {
        t: "Faire d'abord un essai de deux semaines, puis décider",
        d: `Il co-anime deux ateliers avec vous, les analystes donnent leur avis anonymement. ${eur(COUTS.essai)} de votre temps ; le mentorat démarre en semaine 9, avec lui si l'essai est concluant, avec Peio sinon.`,
      },
      {
        t: "À Peio",
        d: "Moins brillant techniquement, apprécié des analystes. Deux heures par semaine prises sur Lagrave.",
      },
      {
        t: "Pas de mentorat ce trimestre",
        d: "Les analystes apprendront sur les missions, comme d'habitude.",
      },
    ],
    reactions: [
      [
        {
          ...MAXIMILIEN,
          texte: "Des objectifs écrits pour du mentorat ? Soit. Je commence lundi.",
        },
      ],
      [{ ...MAXIMILIEN, texte: "Un essai ? Tu me testes. Bon, va pour deux ateliers." }],
      [
        { ...PEIO, texte: "Avec plaisir. Je préviens Maximilien ?" },
        { ...MAXIMILIEN, texte: "Comme tu veux." },
      ],
      [
        {
          ...RUBEN,
          texte:
            "Bordeaux sera le seul bureau sans mentor ce trimestre. Tu as sûrement tes raisons.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "La nuit avant le comité Lagrave",
    jusqua: 10,
    messages: () => [
      {
        ...GAETANE,
        heure: "08:15",
        alerte: true,
        texte:
          "Jeudi, la veille du comité Lagrave, Maximilien a réécrit ma partie dans la nuit, et c'est lui qui l'a présentée. Devant le DSI, il a dit : « On a dû reprendre l'analyse. » Je croyais que ça avait changé.",
      },
      {
        ...MAYEUL,
        heure: "10:30",
        texte:
          "Comité réussi, comme toujours avec Maximilien. Pour information, votre analyste avait l'air gênée.",
      },
    ],
    sources: [
      {
        id: "faits",
        titre: "Reconstituer la semaine dans Tempora et les versions du livrable",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `La version de Gaëtane, déposée mercredi à 18 h, était complète. Maximilien l'a réécrite entre 23 h et 3 h ; Gaëtane n'a présenté aucune diapositive. ${
            ctx.recadre
              ? "Jusqu'à mardi, ses relectures suivaient ce que vous lui aviez demandé en semaine 1 : c'est un écart, sous la pression d'un comité, pas un retour en arrière assumé."
              : "C'est ce qu'il fait depuis des mois : personne ne le lui a jamais dit avec des faits."
          } Un écart laissé sans réponse redevient la norme pour toute l'équipe ; repris tout de suite avec le fait précis, il se referme le plus souvent.`,
      },
      {
        id: "associe",
        titre: "En parler à Ruben",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Ruben : « Un avertissement écrit, je peux le signer. Mais je te préviens : Halden Partners cherche des seniors data à Bordeaux, et Maximilien le sait. Lui retirer Lagrave, c'est lui montrer la porte. »",
      },
    ],
    question: "Que faites-vous après le comité ?",
    options: [
      {
        t: "Laisser passer : un coup de stress avant un comité, il a fait des efforts",
        d: "Vous ne revenez pas dessus. Le comité s'est bien passé, et le client est content.",
      },
      {
        t: "Revenir vers lui lundi avec ce fait précis, et poser une règle pour les rushs",
        d: "Le fait, son effet sur Gaëtane, le rappel de vos attentes, et une règle : pas de réécriture sans l'auteur, relectures rendues avant 18 h la veille d'un comité.",
      },
      {
        t: "Lui adresser un avertissement écrit, signé avec Ruben",
        d: "Une trace formelle au dossier.",
      },
      {
        t: "Le retirer de Lagrave et confier le pilotage à Peio",
        d: "Il garde Dauriac. Le DSI de Lagrave sera prévenu lundi.",
      },
    ],
    reactions: [
      [{ ...GAETANE, texte: "D'accord. J'ai compris comment ça marche ici." }],
      [
        {
          ...MAXIMILIEN,
          texte:
            "Il a contesté l'heure (« c'était 2 h, pas 3 h »), puis il a lu la règle et l'a acceptée : « Tu as raison sur le fond. »",
        },
      ],
      [
        {
          ...MAXIMILIEN,
          texte:
            "« Un avertissement. Après six ans. » Il a signé l'accusé de réception sans un mot.",
        },
      ],
      [
        {
          ...MAYEUL,
          texte:
            "Peio pilote désormais ? Je vous fais confiance, mais j'appelle Maximilien pour comprendre.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Les comités de fin de trimestre",
    jusqua: 13,
    messages: (ctx) => [
      ctx.maximilienParti
        ? {
            ...MAYEUL,
            heure: "09:20",
            alerte: true,
            texte:
              "Notre comité de pilotage de fin de trimestre est fixé au jeudi 25 juin, en semaine 12. Notre directeur général sera là. Maximilien sera encore chez vous ?",
          }
        : {
            ...AMAYA,
            heure: "09:20",
            alerte: true,
            texte:
              "Le comité de pilotage de fin de lot est fixé au jeudi 25 juin, en semaine 12. Mon directeur général sera là.",
          },
      {
        ...NEVEN,
        heure: "14:00",
        texte:
          "J'ai fait toute l'analyse des écarts de données. J'aimerais la présenter moi-même, cette fois.",
      },
    ],
    sources: [],
    question: "Qui présente au comité de juin ?",
    options: [
      {
        t: "Maximilien, seul : le client l'adore",
        d: "Le directeur général du client sera là : vous mettez en avant votre meilleur atout.",
      },
      {
        t: "Les analystes présentent leurs parties, Maximilien en appui",
        d: "Une répétition la veille avec lui ; il ouvre, conclut et prend les questions difficiles.",
      },
      {
        t: "Les analystes présentent seuls, sans Maximilien",
        d: "Pour qu'ils prennent enfin leur place. Maximilien n'est pas invité.",
      },
    ],
    reactions: [
      [{ ...NEVEN, texte: "Bien sûr. Comme d'habitude." }],
      [
        {
          ...NEVEN,
          texte:
            "Maximilien m'a fait répéter deux fois. Il m'a laissé la question sur les écarts, et il a dit au client que l'analyse était de moi.",
        },
      ],
      [
        {
          ...MAXIMILIEN,
          texte: "« Je ne suis pas invité au comité de MA mission ? » Il a raccroché.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Recadrer avec des faits, et suivre", chemin: [1, 2, 1, 1, 1, 1] },
  { nom: "L'écarter des juniors et des clients", chemin: [3, 1, 2, 2, 3, 2] },
  { nom: "Laisser faire : il fait 30 % du chiffre", chemin: [0, 0, 0, 3, 0, 0] },
] as const;

/**
 * Les options réflexes : [décision, option]. Fermer les yeux parce qu'il rapporte (ne rien
 * dire, refuser à Ilham de changer, le laisser staffer à sa main, laisser passer l'écart du
 * comité, le laisser présenter seul), ou son symétrique : l'écarter de ses missions.
 */
export const REFLEXES = [
  [0, 0],
  [0, 3],
  [1, 0],
  [2, 0],
  [4, 0],
  [4, 3],
  [5, 0],
] as const;

export const REPONSES = {
  banqueAccepte: "Va pour Peio, si Maximilien garde un œil sur les livrables.",
  banqueRefuse:
    "Non. Le lot 2, c'est avec Maximilien ou ce n'est pas avec Atlas. Il le montera avec son indépendant.",
  ilhamReste: "J'ai annulé mon deuxième entretien chez Kéroual. Je reste chez Atlas.",
  ilhamPart:
    "Ilham Mebarki a remis sa démission : elle rejoint Kéroual Consulting à la fin de son préavis de trois mois. Le départ est provisionné : 22 k€.",
  gaetanePart:
    "Gaëtane Nakamura a remis sa démission : elle rejoint une société de services numériques de Mérignac. Le départ est provisionné : 22 k€.",
  ylanPart:
    "Neven Gloaguen a remis sa démission après le comité. Il rejoint Kéroual Consulting. Le départ est provisionné : 22 k€.",
  halden:
    "J'ai accepté une offre de Halden Partners. Je pars à la fin de mon préavis, plus tôt si on s'entend.",
  dauriacPerdue:
    "Nous suspendons la mission en cours avec Atlas Conseil et poursuivons avec Halden Partners, où Maximilien nous accompagnera.",
  essaiConcluant:
    "Les avis anonymes des deux ateliers sont bons : « clair », « patient », « enfin des explications ». Maximilien commence le mentorat lundi.",
  essaiRate:
    "Les avis anonymes sont sévères : « il fait à notre place », « on n'ose pas poser de question ». Peio prend le mentorat lundi.",
  repriseReussie:
    "Maximilien m'a rendu sa relecture mardi à 17 h, avec trois remarques précises. Je présenterai ma partie au comité de juin.",
  repriseRatee: "Rien n'a changé : mardi soir, il a encore repris mon travail sans me prévenir.",
  repriseRateeAvertissement:
    "Depuis l'avertissement, il ne relit plus rien : il refait. Plus un mot, plus une remarque.",
  reprise:
    "Votre analyste était bien, mais mon directeur général a demandé où était Maximilien. Nous vous demandons de reprendre deux points du livrable, sans facturation.",
} as const;

export const PERSONNES = {
  MAXIMILIEN,
  ILHAM,
  NEVEN,
  GAETANE,
  PEIO,
  RUBEN,
  ENORA,
  PRUNE,
  AMAYA,
  MAYEUL,
} as const;
