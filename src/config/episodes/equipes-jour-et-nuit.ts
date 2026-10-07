/**
 * L'ÉQUIPE DE JOUR ET L'ÉQUIPE DE NUIT — le contenu de l'épisode.
 *
 * Hélier Thévenaud est cadre de santé de l'EHPAD de Dijon-Grésilles, l'un
 * des six EHPAD de l'Association Solvanne : soixante-douze places sur deux
 * étages et une unité protégée. L'équipe de nuit et l'équipe de jour se
 * renvoient les toilettes non faites et les résidents levés trop tôt ; les
 * transmissions de 6 h 45 durent trois minutes et deux veilleuses ont demandé
 * leur mutation. Le trimestre va de janvier à mars, en pleine saison des
 * épidémies. Six décisions, chacune précédée de ce qu'un cadre de santé
 * reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Les chiffres qu'elles
 * donnent sont ceux du modèle ; un test les recalcule.
 *
 * Association, établissement, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "frontiere",
    t: "Les tâches à la frontière des deux postes n'ont jamais été réparties : la charge du matin a glissé sur la nuit par une liste que personne n'a décidée, et des transmissions de trois minutes entretiennent le reproche",
  },
  {
    id: "matin",
    t: "L'équipe du matin est sous-dimensionnée : cinq aides-soignants ne tiennent pas les toilettes de 6 h 45 à 11 h",
  },
  {
    id: "nuit",
    t: "L'équipe de nuit ne fait pas sa part : les toilettes de la liste ne sont pas toutes faites",
  },
  {
    id: "personnes",
    t: "Un conflit de personnes entre quelques fortes têtes des deux équipes",
  },
] as const;

const ADALGISE = { de: "Adalgise Ansquer", role: "Directrice de l'EHPAD" } as const;
const PENDA = { de: "Penda Diabaté", role: "Aide-soignante de nuit" } as const;
const SMARANDA = { de: "Smaranda Vornicu", role: "Aide-soignante de nuit" } as const;
const NACERA = { de: "Nacéra Bouadjar", role: "Aide-soignante de nuit" } as const;
const ROKHAYA = { de: "Rokhaya Brugnot", role: "Aide-soignante de jour, premier étage" } as const;
const SALIHA = { de: "Saliha Mekhloufi", role: "Infirmière" } as const;
const SALIOU = { de: "Saliou Ndao", role: "Médecin coordonnateur" } as const;
const MADELEINE = {
  de: "Madeleine Sirugue",
  role: "Directrice qualité et gestion des risques, siège",
} as const;
const OKSANA = { de: "Oksana Hrytsenko", role: "Ressources humaines, siège" } as const;
const TIGRAN = { de: "Tigran Sarkissian", role: "Fils de Mme Sarkissian, résidente" } as const;
const TABLEAU = "Carnéo, tableau de bord du service";

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Deux équipes qui se renvoient la faute",
    jusqua: 2,
    messages: () => [
      {
        ...PENDA,
        heure: "06:50",
        texte:
          "Hélier, on a encore levé dix-huit résidents ce matin, Mme Sarkissian à 5 h 35. Et à 6 h 45, trois minutes debout dans le couloir, et le jour file aux petits-déjeuners. Smaranda et Nacéra ont demandé leur mutation : je les comprends.",
      },
      {
        de: TABLEAU,
        role: "Alerte automatique",
        heure: "07:05",
        alerte: true,
        texte:
          "Décembre : 18 résidents levés avant 6 h 45 chaque matin, dont 5 à leur demande. Dernier trimestre : 31 chutes, 9 réclamations de familles. Transmissions de 6 h 45 : 3 minutes en moyenne.",
      },
      {
        ...ROKHAYA,
        heure: "07:40",
        texte:
          "Ce matin encore, des toilettes de la liste n'étaient pas faites. On est cinq pour soixante-douze : si la nuit ne fait pas sa part, on ne tient pas.",
      },
      {
        ...ADALGISE,
        heure: "09:15",
        texte:
          "Hélier, j'ai deux demandes de mutation de veilleuses sur mon bureau, et je n'ai aucune candidature de nuit. Le trimestre va de janvier à mars, en pleine saison des épidémies. Dites-moi jeudi ce que vous faites de ce conflit.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "plans",
        titre: "Relire les plans de soins et l'heure de lever de chaque résident",
        cout: 1,
        nature: "decisive",
        resultat:
          "60 résidents ont besoin d'aide pour leur toilette du matin. La nuit en lève et en lave 18 avant 6 h 45 : 5 sont des lève-tôt, comme le dit leur projet personnalisé ; les 13 autres sont sur une « liste des 5 h 30 » écrite par l'équipe du matin en octobre, jamais validée par l'IDEC ni par le médecin coordonnateur. Restent 42 toilettes pour 5 aides-soignants de 6 h 45 à 11 h, petits-déjeuners compris : chacun en tient 8, soit 40. Deux toilettes par jour sont reportées ou bâclées, et le jour les met sur le compte de la nuit. L'après-midi, de 14 h à 16 h 30, aucune toilette n'est planifiée : toutes les douches se font le matin.",
      },
      {
        id: "interim",
        titre: "Chiffrer avec les ressources humaines le remplacement d'une veilleuse",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Oksana Hrytsenko : « Une veilleuse à temps plein fait sept nuits de dix heures par quinzaine. Salariée, son heure coûte 29 € chargés, majoration de nuit comprise. Soralis Intérim Santé facture l'heure d'aide-soignante de nuit 48,50 € hors taxes, et l'association ne récupère pas la TVA, à 20 %. Soralis ne fournit que trois nuits demandées sur quatre : le reste se fait en rappels sur repos des autres veilleuses. Notre dernière annonce de nuit n'a reçu aucune candidature en onze semaines. »",
      },
      {
        id: "evenements",
        titre: "Lire les déclarations d'événements indésirables de l'automne",
        cout: 0.5,
        nature: "utile",
        resultat:
          "31 chutes au dernier trimestre, dont 12 entre 5 h et 8 h chez des résidents levés avant 6 h 45 ; 9 réclamations de familles, dont 6 sur des levers trop matinaux ; 26 événements déclarés « défaut de transmission » : une chute de 3 h apprise à 10 h, une fièvre non signalée, un refus de boire de toute une nuit. Le service qualité estime une chute à 700 € pour l'établissement (temps soignant et médical, transport, et une fois sur huit une hospitalisation), une réclamation à 450 €, un défaut de transmission à 400 €.",
      },
      {
        id: "climat",
        titre: "Faire passer un questionnaire de climat aux deux équipes",
        cout: 1,
        nature: "bruit",
        resultat:
          "Taux de réponse : 74 %. Les deux équipes disent aimer leur métier (82 % de jour, 79 % de nuit) et se sentir peu reconnues (61 % et 68 %). Les commentaires libres parlent de fatigue, de l'hiver, du manque de temps auprès des résidents. Rien ne distingue Grésilles des autres EHPAD de l'association.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Greta Quenardel, cadre de santé à Beaune",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Greta : « Quand mes deux équipes se disputaient, ce n'était jamais une affaire de caractères. Regarde ce que chacune fait entre 5 h et 8 h, et qui l'a décidé. Et n'oublie pas qu'une veilleuse, ça ne se remplace pas en un mois. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que faites-vous de ce conflit avant de répondre à Adalgise jeudi ?",
    options: [
      {
        t: "Trancher pour l'équipe de jour : une note de service rappelle que les levers de la liste font partie du poste de nuit",
        d: "Effet dès lundi. Ne coûte rien.",
      },
      {
        t: "Trancher pour l'équipe de nuit : plus aucune toilette avant 7 h, sauf pour les lève-tôt, dès lundi",
        d: "Treize toilettes de plus chaque matin pour l'équipe de jour. Ne coûte rien.",
      },
      {
        t: "Réunir les deux équipes : deux réunions jour-nuit de deux heures, les faits sur la table (plans de soins, heures de lever, charge du matin), une répartition à construire ensemble",
        d: "Les veilleuses payées pour venir de jour : 1 600 € par réunion. Rien ne change avant la semaine 3.",
      },
      {
        t: "Recevoir chaque équipe séparément pour apaiser, sans rien changer pour l'instant",
        d: "Deux entretiens collectifs, environ 400 € d'heures.",
      },
    ],
    reactions: [
      [
        {
          ...PENDA,
          texte:
            "La note est affichée en salle de soins. Smaranda l'a lue deux fois, puis elle est partie sans un mot.",
        },
      ],
      [
        {
          ...ROKHAYA,
          texte:
            "À 11 h 30, quatre résidents attendaient encore leur toilette. Et c'est encore nous qu'on montre du doigt.",
        },
      ],
      [
        {
          ...PENDA,
          texte:
            "Première fois en six ans que je m'assois à la même table que l'équipe du matin. Ils servent les petits-déjeuners à cinq pour soixante-douze : je ne le savais pas. On arrête dès maintenant de lever tôt les quatre résidents qui tombent, et les agents de service prennent les petits-déjeuners.",
        },
      ],
      [
        {
          ...ADALGISE,
          texte:
            "Les deux équipes se sont senties écoutées, c'est déjà ça. Mais demain matin, rien n'aura changé.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Trois minutes à 6 h 45",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...SALIHA,
        heure: "10:20",
        alerte: true,
        texte:
          "Un résident du deuxième a chuté à 3 h cette nuit : je l'ai appris à 10 h, par sa fille. Rien dans les transmissions, rien dans Carnéo.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 2 : ${ctx.levers} résidents levés avant 6 h 45, transmissions de ${ctx.minutes} minutes, ${ctx.chutes} chutes.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "transmissions",
        titre: "Assister aux transmissions de 6 h 45 trois matins de suite",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Trois minutes debout dans le couloir, la moitié de l'équipe du matin déjà aux chariots. Les veilleuses parlent de ce qui leur reste à faire, pas des résidents. Le chevauchement de quinze minutes existe sur le planning ; il est mangé par les derniers levers. Des transmissions ciblées, assises, sur les seuls résidents qui ont changé, tiendraient en quinze minutes. ${
            ctx.leversListe
              ? "Mais tant que la liste des 5 h 30 existe, la nuit finit ses toilettes à 6 h 40 : un chevauchement protégé serait mangé à moitié."
              : "Depuis que la nuit ne fait plus toute la liste des 5 h 30, elle a fini ses soins à 6 h 30 : le quart d'heure est libre."
          }`,
      },
      {
        id: "carneo",
        titre: "Regarder ce que l'équipe de jour lit dans Carnéo",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les veilleuses écrivent leurs observations chaque nuit. Le matin, une aide-soignante sur trois les ouvre avant 10 h. Les notes du soir, elles, sont lues par la nuit à 23 h, une fois la première ronde faite. L'écrit garde la trace ; il ne fait pas se parler deux équipes qui ne se voient pas.",
      },
    ],
    question: "Comment organisez-vous les transmissions ?",
    options: [
      {
        t: "Protéger un chevauchement de quinze minutes à 6 h 45 et à 21 h : transmissions ciblées, assises, en salle de soins, sur les résidents qui ont changé",
        d: "Environ dix heures de veilleuses en plus par semaine, 290 €, et une demi-journée de formation aux transmissions ciblées pour les deux équipes, 1 200 €.",
      },
      {
        t: "Tout passer par écrit dans Carnéo : chacun lit le dossier à sa prise de poste",
        d: "Une heure de formation, 600 €. Plus de transmission orale.",
      },
      {
        t: "Ouvrir un cahier de liaison entre les deux équipes",
        d: "Ne coûte rien.",
      },
      {
        t: "Garder les transmissions telles qu'elles sont",
        d: "Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...SALIHA,
          texte:
            "Quinze minutes assises, et j'ai su avant 7 h qu'un résident avait refusé de boire toute la nuit. Penda et Rokhaya se sont même dit bonjour.",
        },
      ],
      [
        {
          ...PENDA,
          texte:
            "On écrit tout. Mais le matin, qui lit ? Ce matin, personne n'avait ouvert nos notes avant 10 h.",
        },
      ],
      [
        {
          ...ROKHAYA,
          texte:
            "Le cahier, on l'a ouvert lundi. Il y a déjà trois pages de reproches, des deux côtés.",
        },
      ],
      [
        {
          ...SALIHA,
          texte: "Trois minutes ce matin encore.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Les deux demandes de mutation",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...OKSANA,
        heure: "09:30",
        alerte: true,
        texte:
          "Hélier, il me faut une réponse sur les mutations de Smaranda Vornicu et de Nacéra Bouadjar : j'ai deux postes de jour à Dijon-Montchapet. Si je les accorde, elles partent en semaine 7, et je n'ai toujours aucune candidature de nuit.",
      },
      {
        ...SMARANDA,
        heure: "21:05",
        texte:
          "Ce n'est pas la nuit que je fuis, Hélier. C'est de lever des gens à 5 h 30 pour une équipe qui dit ensuite qu'on ne fait rien.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 4 : ${ctx.levers} résidents levés avant 6 h 45, ${ctx.remplacements} nuits tenues en intérim ou en rappel, transmissions de ${ctx.minutes} minutes.`,
      },
    ],
    sources: [
      {
        id: "entretiens",
        titre: "Recevoir Smaranda et Nacéra, chacune à son tour",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Ni l'une ni l'autre ne veut quitter la nuit pour le jour : Nacéra a deux enfants et un mari en horaires de journée, Smaranda aime le calme des nuits. Ce qui les fait partir, ce sont les levers de 5 h 30 et le sentiment d'être l'équipe qu'on accuse. Elles resteraient si elles avaient une vraie part dans la répartition des tâches. ${
            ctx.noteDeService
              ? "Depuis la note de service, elles n'y croient plus guère : « On a déjà eu la réponse, elle est affichée. »"
              : ctx.reunion
                ? "Depuis les deux réunions, elles veulent bien y croire : « Pour la première fois, le jour a vu ce qu'on fait. »"
                : "Elles attendent de voir ce que vous ferez de la liste des 5 h 30."
          }`,
      },
      {
        id: "recrutement",
        titre: "Faire le point sur le recrutement de nuit",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Oksana : « Aucune candidature de nuit depuis onze semaines. Orchidia Résidences recrute des veilleuses à Dijon avec une prime de nuit plus forte que la nôtre. Il faut compter deux à trois mois pour remplacer une veilleuse ; en attendant, c'est Soralis et les rappels sur repos. »",
      },
    ],
    question: "Que répondez-vous aux deux demandes de mutation ?",
    options: [
      {
        t: "Accepter les deux mutations et lancer le recrutement de deux veilleuses",
        d: "Elles partent en semaine 7 ; d'ici les recrutements, leurs nuits en intérim.",
      },
      {
        t: "Recevoir chacune, et leur confier avec deux aides-soignants de jour le groupe de travail sur la répartition des tâches",
        d: "Trois heures payées par semaine pour quatre personnes, 360 € par semaine jusqu'à la semaine 8.",
      },
      {
        t: "Refuser les mutations : l'effectif de nuit ne le permet pas",
        d: "Un courrier de la direction. Ne coûte rien.",
      },
      {
        t: "Leur demander d'attendre la fin de l'hiver",
        d: "Rien ne change d'ici là.",
      },
    ],
    reactions: [
      [
        {
          ...OKSANA,
          texte:
            "Mutations accordées, l'annonce de nuit est relancée et Soralis est prévenu. Je ne vous promets rien avant avril.",
        },
      ],
      [
        {
          ...NACERA,
          texte:
            "D'accord pour le groupe, avec Rokhaya. Mais je veux voir la liste des 5 h 30 disparaître, pas seulement en parler.",
        },
      ],
      [
        {
          ...SMARANDA,
          texte: "J'ai reçu le courrier. Je l'ai lu.",
        },
      ],
      [
        {
          ...NACERA,
          texte: "Attendre quoi, exactement ?",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Qui fait quoi, et à quelle heure",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...SALIOU,
        heure: "11:10",
        alerte: true,
        texte:
          "J'ai revu les treize résidents de la liste des 5 h 30 : neuf ont un risque de chute élevé, et aucun n'a demandé à être levé si tôt. Cette liste n'a pas de fondement médical.",
      },
      {
        ...ROKHAYA,
        heure: "14:40",
        texte:
          "On veut bien arrêter la liste. Mais alors il faut nous dire qui fait ces toilettes, parce qu'à cinq, le matin, on ne les fera pas.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 6 : ${ctx.levers} résidents levés avant 6 h 45, ${ctx.chutes} chutes, ${ctx.remplacements} nuits tenues en intérim ou en rappel. Coût depuis janvier : ${ctx.cout}, pour ${ctx.enveloppe} d'enveloppe à date.`,
      },
    ],
    sources: [
      {
        id: "journee",
        titre: "Suivre une journée de soins de 5 h à 21 h",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `De 14 h à 16 h 30, l'équipe de l'après-midi n'a aucune toilette planifiée : huit résidents qui préfèrent leur douche l'après-midi pourraient l'y avoir, si leur projet personnalisé le dit. L'équipe du soir pourrait préparer six résidents qui préfèrent leur toilette le soir. La nuit ne garderait que les lève-tôt et un résident de plus : le matin retomberait à 40 toilettes, ce que cinq aides-soignants tiennent. Greta Quenardel, à Beaune : « Des plans de soins révisés par le cadre seul n'ont pas tenu trois semaines. Révisés avec les deux équipes, ils tiennent trois fois sur quatre. » ${
            ctx.reunion
              ? "Les deux équipes ont déjà commencé à lister ensemble qui préfère quoi."
              : "Les deux équipes ne se sont encore jamais assises ensemble pour en parler."
          }`,
      },
      {
        id: "renfort",
        titre: "Demander aux ressources humaines le coût d'un renfort du matin",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Oksana : « Une aide-soignante en CDD de 7 h à 12 h, six matins sur sept : 30 heures par semaine à 28 € chargés, soit 840 € par semaine. J'ai une candidate disponible en semaine 7. Elle tiendrait huit toilettes par matin. »",
      },
    ],
    question: "Comment répartissez-vous les soins du matin ?",
    options: [
      {
        t: "Réviser les plans de soins avec les deux équipes : l'heure de lever de chacun selon ses habitudes, huit douches l'après-midi, six résidents préparés le soir",
        d: "Deux semaines de travail, IDEC et médecin coordonnateur compris : 1 300 € par semaine. En place en semaine 9.",
      },
      {
        t: "Recruter une aide-soignante en renfort du matin, de 7 h à 12 h, et arrêter les levers de la liste",
        d: "Un CDD six matins sur sept, 840 € par semaine dès la semaine 7.",
      },
      {
        t: "Trancher par une note : la nuit garde dix levers, aucun avant 6 h, le jour fait le reste",
        d: "Effet en semaine 7. Ne coûte rien.",
      },
      {
        t: "Laisser les équipes s'arranger entre elles",
        d: "Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...ROKHAYA,
          texte:
            "Le groupe a repris les soixante-douze plans de soins avec Saliha et le docteur Ndao. Les huit douches de l'après-midi sont affichées. Reste à voir si l'équipe de l'après-midi suivra.",
        },
      ],
      [
        {
          ...OKSANA,
          texte: "Le CDD est signé : elle commence lundi à 7 h, au premier étage.",
        },
      ],
      [
        {
          ...PENDA,
          texte:
            "Dix levers au lieu de dix-huit, et toujours personne pour nous demander notre avis.",
        },
      ],
      [
        {
          ...ROKHAYA,
          texte: "Chacun fait comme avant. La liste est toujours punaisée dans la salle de soins.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Une chute à 5 h 40",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...MADELEINE,
        heure: "09:05",
        alerte: true,
        texte:
          "Déclaration d'événement indésirable : Mme Arpine Sarkissian, 91 ans, a chuté à 5 h 40 dans sa chambre, levée à 5 h 30 et installée au fauteuil. Fracture du poignet, retour des urgences à 14 h. Son fils a écrit à la direction ; il parle de saisir l'ARS.",
      },
      {
        ...TIGRAN,
        heure: "12:30",
        texte:
          "Ma mère a toujours dormi jusqu'à 8 h. Je voudrais comprendre pourquoi on la lève à 5 h 30, et être sûr que cela ne recommencera pas.",
      },
      {
        ...ROKHAYA,
        heure: "15:15",
        texte: ctx.leversListe
          ? "C'est la nuit qui l'a levée. Nous, on n'y est pour rien."
          : "Elle était encore sur la liste. On aurait dû la retirer avec les autres.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 8 : ${ctx.levers} résidents levés avant 6 h 45, ${ctx.chutes} chutes, transmissions de ${ctx.minutes} minutes.`,
      },
    ],
    sources: [
      {
        id: "analyse",
        titre: "Reprendre l'événement avec Madeleine Sirugue",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Le plan de soins de Mme Sarkissian dit qu'elle dort jusqu'à 8 h ; elle était pourtant sur la liste des 5 h 30. Penda Diabaté l'a levée comme la liste le demandait. L'infirmière de jour avait noté la veille une tension basse : l'information n'est jamais arrivée à la nuit. L'événement tient à l'organisation, pas à une personne. Madeleine : « Les familles qui saisissent l'ARS le font une fois sur deux quand on leur répond par courrier, presque jamais quand on les reçoit pour leur dire ce qui change. »",
      },
      {
        id: "famille",
        titre: "Appeler Tigran Sarkissian",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Tigran Sarkissian ne cherche pas de coupable : il veut savoir ce qui s'est passé et ce qui changera pour sa mère. Il a entendu parler d'une « liste » par une autre famille du deuxième étage.",
      },
    ],
    question: "Comment répondez-vous à cette chute ?",
    options: [
      {
        t: "Analyser l'événement avec les deux équipes, sans chercher de coupable, et recevoir le fils avec le médecin coordonnateur pour lui dire ce qui change",
        d: "Une demi-journée d'analyse, environ 700 € d'heures.",
      },
      {
        t: "Adresser un avertissement à la veilleuse qui l'a levée",
        d: "Une procédure disciplinaire. Ne coûte rien.",
      },
      {
        t: "Répondre au fils par un courrier d'excuses de la direction",
        d: "Un courrier signé d'Adalgise Ansquer.",
      },
      {
        t: "Rappeler par une note que les levers doivent se faire en sécurité",
        d: "Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...TIGRAN,
          texte:
            "Merci de m'avoir reçu avec le docteur Ndao. Ma mère sera levée à 7 h 45, et je sais pourquoi c'est arrivé. Je n'irai pas plus loin.",
        },
      ],
      [
        {
          ...PENDA,
          texte:
            "Vingt-deux ans de nuits, et un avertissement pour avoir suivi la liste que le jour a écrite. Je ne l'oublierai pas.",
        },
      ],
      null,
      [
        {
          ...PENDA,
          texte: "La note dit « en sécurité ». La liste, elle, est toujours là.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Le roulement du printemps",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...ADALGISE,
        heure: "10:00",
        alerte: true,
        texte:
          "Hélier, pour avril je pense à une rotation jour-nuit pour tous : chacun quatre semaines de nuit par trimestre. Plus de demandes de mutation, et chacun comprendrait enfin le travail de l'autre. Le roulement se publie la semaine prochaine.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 10 : ${ctx.levers} résidents levés avant 6 h 45, transmissions de ${ctx.minutes} minutes, ${ctx.chutes} chutes. Coût depuis janvier : ${ctx.cout}, pour ${ctx.enveloppe} d'enveloppe à date.`,
      },
    ],
    sources: [
      {
        id: "rotation",
        titre: "Interroger les deux équipes sur une rotation jour-nuit",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Cinq veilleuses sur huit ont choisi la nuit pour leurs enfants ou un conjoint en horaires de jour ; une douzaine d'aides-soignants de jour n'ont jamais travaillé de nuit et ne connaissent pas les résidents à 3 h. À Chalon-sur-Saône, une rotation imposée il y a deux ans a fait partir trois veilleuses et deux aides-soignants de jour dans le trimestre, et les chutes de nuit ont monté le temps que chacun apprenne. Ce que les deux équipes demandent, ce sont des temps pour se parler, pas d'échanger leurs horaires.",
      },
      {
        id: "suivi",
        titre: "Relire les semaines depuis la nouvelle organisation",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `${ctx.levers} résidents levés avant 6 h 45 cette semaine, transmissions de ${ctx.minutes} minutes. Greta Quenardel : « À Auxonne, ce qui n'était pas inscrit au roulement n'a pas passé l'hiver : en trois semaines, les douches de l'après-midi avaient disparu et la nuit relevait. »`,
      },
    ],
    question: "Que mettez-vous dans le roulement d'avril ?",
    options: [
      {
        t: "Inscrire les temps communs dans le roulement : une réunion jour-nuit d'une heure par mois, le chevauchement, un binôme de transmission par étage, la revue des plans de soins chaque trimestre",
        d: "500 € par réunion mensuelle, le reste à heures constantes.",
      },
      {
        t: "Imposer une rotation jour-nuit à tous à partir d'avril",
        d: "Chacun quatre semaines de nuit par trimestre. Annoncée dès la semaine 11.",
      },
      {
        t: "Arrêter les réunions et le chevauchement pour rendre les heures",
        d: "Environ 290 € d'heures économisées par semaine.",
      },
      {
        t: "Ne rien formaliser : les équipes ont pris le pli",
        d: "Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...PENDA,
          texte:
            "La réunion de mars est au roulement, avec mon nom et celui de Rokhaya pour le binôme du deuxième. C'est la première fois que la nuit est sur le même papier que le jour.",
        },
      ],
      null,
      [
        {
          ...SALIHA,
          texte: "Ce matin, trois minutes debout dans le couloir. Comme en décembre.",
        },
      ],
      [
        {
          ...ROKHAYA,
          texte: "On continue comme on peut. L'après-midi a déjà sauté deux douches cette semaine.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Faire travailler les deux équipes ensemble", chemin: [2, 0, 1, 0, 0, 0] },
  { nom: "Trancher et imposer", chemin: [0, 1, 2, 2, 1, 1] },
  { nom: "Attentiste", chemin: [3, 3, 3, 3, 3, 3] },
] as const;

/**
 * Les réflexes du métier sous pression, [décision, option] : trancher pour l'équipe de jour
 * (la note de service, l'avertissement à la veilleuse qui a suivi la liste), ou imposer une
 * rotation jour-nuit à tous. Trancher pour la nuit, refuser les mutations ou tout passer par
 * écrit sont des erreurs, pas le réflexe que l'épisode nomme.
 */
export const REFLEXES = [
  [0, 0],
  [4, 1],
  [5, 1],
] as const;

export const REPONSES = {
  saisine:
    "Monsieur Sarkissian nous informe qu'il a transmis sa réclamation à l'ARS. L'agence nous demande une réponse écrite et un plan d'actions sous quinze jours.",
  apaise:
    "Monsieur Sarkissian remercie la direction pour son courrier. Il demande seulement que sa mère ne soit plus levée avant 7 h 30.",
  rotationAucun:
    "Le roulement d'avril est annoncé. Personne n'a démissionné ; mais trois arrêts de travail sont arrivés cette semaine, et deux veilleuses m'ont demandé un rendez-vous.",
} as const;
