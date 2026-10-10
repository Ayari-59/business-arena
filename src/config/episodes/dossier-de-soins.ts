/**
 * LE DOSSIER DE SOINS QUE PERSONNE NE REMPLIT — le contenu de l'épisode.
 *
 * Fulbert Ravignan est responsable des systèmes d'information de l'Association
 * Solvanne. Carnéo, le dossier de soins informatisé, est déployé depuis six
 * mois dans les six EHPAD ; à Beaune, Chalon-sur-Saône et Montbard, les
 * transmissions restent sur papier, les plans de soins ne sont pas à jour et
 * la tablette de nuit dort dans un tiroir. Six décisions, d'avril à juin,
 * chacune précédée de ce qu'un responsable des systèmes d'information reçoit
 * vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Les chiffres qu'elles donnent
 * sont ceux du modèle (src/engine/episodes/dossier-de-soins.ts) ; le test de
 * l'épisode le vérifie.
 *
 * Association, personnes et chiffres sont fictifs.
 */
import {
  CHANCE_REPRISE,
  COUT_FORMATION_REFERENTS,
  COUT_HEBDO_REFERENTS,
  COUT_HEURE,
  COUT_MATERIEL,
  COUT_PARAMETRAGE,
  COUTS,
  CREDITS_ARS,
  ETABLISSEMENTS,
  MATERIEL,
  MINUTES_FICHES,
  MINUTES_LECTURE,
  MINUTES_RECOPIE,
  PLACES,
  REMPLACANTS,
  REPRISE_ARS,
  USAGE_DEPART,
} from "@/engine/episodes/dossier-de-soins";
import type { Etape } from "./types";

const fr = (v: number) => Math.round(v).toLocaleString("fr-FR");
const pc = (v: number) => `${Math.round(v * 100)} %`;
const [BEAUNE, CHALON, MONTBARD] = ETABLISSEMENTS;

export const DIAGNOSTICS = [
  {
    id: "terrain",
    t: "Carnéo n'est pas là où se font les soins : une tablette fixée au poste de soins, rien la nuit, des plans de soins qui ne disent pas ce qu'on fait ; on note sur papier pendant le tour, et on recopie en fin de poste",
  },
  {
    id: "parametrage",
    t: "Les plans de soins chargés au déploiement ne correspondent pas aux résidents : les soignants ne retrouvent pas leurs soins dans l'outil",
  },
  {
    id: "formation",
    t: "Les équipes des trois EHPAD ont été mal formées : elles ne savent pas se servir de Carnéo",
  },
  {
    id: "resistance",
    t: "Les équipes résistent au changement, et leurs cadres ne l'imposent pas",
  },
] as const;

const DG = { de: "Ursule Mauvernay", role: "Directrice générale" } as const;
const IDEC = {
  de: "Ernestine Vaillandet",
  role: "Infirmière coordinatrice, EHPAD de Chalon-sur-Saône",
} as const;
const FLEUR = { de: "Fleur Mabillot", role: "Aide-soignante, EHPAD de Chalon-sur-Saône" } as const;
const MONTBARD_DIR = {
  de: "Valère Bellefontaine",
  role: "Directeur de l'EHPAD de Montbard",
} as const;
const CADRE = { de: "Greta Quenardel", role: "Cadre de santé, EHPAD de Beaune" } as const;
const EDITEUR = { de: "Halina Ostrowska", role: "Cheffe de projet, éditeur de Carnéo" } as const;
const TECHNICIEN = { de: "Odon Sabran", role: "Technicien des systèmes d'information" } as const;
const TABLEAU = { de: "Tableau de bord de Carnéo", role: "Point hebdomadaire" } as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "La tablette de nuit dort dans un tiroir",
    jusqua: 2,
    messages: () => [
      {
        ...DG,
        heure: "08:10",
        alerte: true,
        texte:
          "Fulbert, six mois après le déploiement, Carnéo marche à Montchapet, aux Grésilles et à Auxonne, pas à Beaune, Chalon et Montbard. L'évaluation de la qualité de Beaune est prévue à l'automne, et les évaluateurs regarderont la traçabilité des soins. Je veux ton plan vendredi.",
      },
      {
        ...MONTBARD_DIR,
        heure: "09:20",
        texte:
          "Mes équipes disent que Carnéo leur prend du temps. Ce qu'il faut, c'est une règle : saisie obligatoire, et les cadres qui contrôlent chaque jour.",
      },
      {
        de: "Ndeye Quillardet",
        role: "Aide-soignante de nuit, EHPAD de Beaune",
        heure: "06:45",
        texte:
          "La tablette de nuit est dans le tiroir du poste de soins, au rez-de-chaussée. La nuit, on fait le tour des trois étages avec le chariot et la lampe ; on écrit dans le cahier en redescendant.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "journaux",
        titre:
          "Extraire les journaux de connexion de Carnéo, établissement par établissement et heure par heure",
        cout: 1.5,
        nature: "decisive",
        resultat: `À Montchapet, aux Grésilles et à Auxonne, 81 % des transmissions sont saisies dans l'heure du soin, sur les tablettes des chariots. À Beaune, Chalon-sur-Saône et Montbard, ${pc(USAGE_DEPART)} seulement. La moitié des postes ouvrent Carnéo dans la dernière demi-heure du poste, ou après, pour une session de ${MINUTES_RECOPIE} minutes en moyenne : ils y recopient ce qu'ils ont écrit sur papier. Les 40 % restants n'y entrent pas. Aucune connexion entre 21 h 30 et 6 h 30 à Beaune et à Chalon. À Montbard, toutes les sessions ouvertes au deuxième étage et dans l'unité protégée se coupent : le Wi-Fi n'y passe pas.`,
      },
      {
        id: "tour",
        titre: "Suivre un tour de soins du matin à Chalon-sur-Saône",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "La seule tablette de l'étage est fixée au mur du poste de soins, au bout du couloir. Fleur Mabillot, aide-soignante, note chambre après chambre sur une feuille pliée dans sa poche. Dans Carnéo, les plans de soins de l'étage sont ceux chargés au déploiement : « toilette complète à 7 h » pour les trente résidents, aucun change de nuit, aucun soin de bouche. « Je ne peux pas valider ce que je fais, alors j'écris sur ma feuille, et je recopie à 13 h 30 si j'ai le temps. »",
      },
      {
        id: "connexions",
        titre: "Comparer le nombre de connexions par soignant entre les six EHPAD",
        cout: 1,
        nature: "bruit",
        resultat:
          "1,1 connexion par soignant et par poste à Beaune, Chalon et Montbard, contre 1,3 dans les trois autres EHPAD. L'écart paraît faible.",
      },
      {
        id: "planning",
        titre: "Demander aux cadres le planning type des trois EHPAD",
        cout: 0.5,
        nature: "utile",
        resultat: `Matin, après-midi et nuit compris, ${BEAUNE.postes} postes de soignants par jour à Beaune (${BEAUNE.places} places), ${CHALON.postes} à Chalon-sur-Saône (${CHALON.places} places), ${MONTBARD.postes} à Montbard (${MONTBARD.places} places), sept jours sur sept. Une heure de soignant coûte ${COUT_HEURE} € chargés en moyenne. À chaque relève, on lit le cahier, puis l'écran : ${MINUTES_LECTURE} minutes de plus par poste.`,
      },
      {
        id: "conseil",
        titre: "Demander conseil à Edmée Faucompré, directrice de l'EHPAD de Montchapet",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Edmée : « Avant de parler d'obligation, va voir où sont les tablettes chez nous, et où elles sont à Chalon. Et demande qui a écrit nos plans de soins. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que proposez-vous à la directrice générale vendredi ?",
    options: [
      {
        t: "Rendre la saisie obligatoire à chaque poste, avec un contrôle quotidien par les cadres",
        d: `Une note de la direction générale ; chaque cadre de santé vérifie les saisies de la veille, trente minutes par jour. ${fr(COUTS.controle)} € par semaine de temps de cadre.`,
      },
      {
        t: "Mettre Carnéo là où se font les soins",
        d: `${MATERIEL.tablettes} tablettes durcies sur les chariots de soins, ${MATERIEL.telephones} téléphones pour les soignants de nuit, ${MATERIEL.bornes} bornes Wi-Fi à Montbard ; et, avec chaque équipe, les moments de saisie dans le tour. ${fr(COUT_MATERIEL)} €, installé en semaine 2.`,
      },
      {
        t: "Commander à l'éditeur le module de « saisie rapide »",
        d: `Des écrans de transmission simplifiés, livrés en semaine 7. ${fr(COUTS.saisieRapide)} €.`,
      },
      {
        t: "Laisser les directeurs d'EHPAD avancer à leur rythme",
        d: "Rien à engager. On refera le point en mai.",
      },
    ],
    reactions: [
      [
        {
          ...CADRE,
          texte:
            "Je contrôle chaque matin. Les saisies sont là, à 13 h 45 et à 20 h 50, presque toutes pareilles : « RAS, résident calme ». Et l'équipe me regarde de travers.",
        },
      ],
      [
        {
          ...FLEUR,
          texte:
            "Les tablettes sont sur les chariots depuis mardi. On a décidé ensemble : on saisit en sortant de chaque chambre. Il reste les plans de soins : on n'y retrouve toujours pas nos soins.",
        },
      ],
      [
        {
          ...EDITEUR,
          texte: "Commande enregistrée : le module de saisie rapide sera installé en semaine 7.",
        },
      ],
      [
        {
          ...MONTBARD_DIR,
          texte: "Merci de la confiance. Pour l'instant, rien ne change chez nous.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "Des plans de soins qui ne disent pas ce qu'on fait",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...IDEC,
        heure: "14:30",
        alerte: true,
        texte:
          "Fulbert, les plans de soins de Carnéo sont ceux que l'éditeur a chargés en octobre. Personne n'a eu le temps de les reprendre. Les équipes ne retrouvent pas leurs soins, alors elles écrivent sur papier.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Semaine 3 : ${ctx.usage} des transmissions saisies au moment du soin ; ${ctx.heuresDouble} de recopie dans la semaine.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "plans",
        titre: "Ouvrir vingt plans de soins au hasard à Beaune et à Chalon",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Dix-sept sur vingt sont le plan type du déploiement, jamais modifié depuis octobre : mêmes horaires de toilette pour tous, ni changes de nuit, ni retournements, ni surveillance de l'alimentation. À Montchapet, l'infirmière coordinatrice a refait les 96 plans avec deux aides-soignants de chaque équipe, jour et nuit : une heure de soignants par résident, en trois semaines. ${
            ctx.materiel
              ? "Avec les tablettes au chariot, les soignants cherchent à valider leurs soins dans le plan : quand le soin n'y est pas, ils reprennent la feuille."
              : "Mais à Montchapet, les plans se valident au chariot ; ici, la tablette est au bout du couloir."
          }`,
      },
      {
        id: "editeur",
        titre: "Demander à l'éditeur ce que valent ses plans types",
        cout: 0.5,
        nature: "utile",
        resultat: `Halina Ostrowska propose de recharger une bibliothèque de plans types plus détaillés : ${fr(COUTS.plansTypes)} €, en place en semaine 5. « Ils conviennent à un résident sur trois sans retouche ; pour les autres, il faut les reprendre avec les équipes. »`,
      },
    ],
    question: "Que faites-vous des plans de soins ?",
    options: [
      {
        t: "Faire recharger par l'éditeur des plans types plus détaillés",
        d: `${fr(COUTS.plansTypes)} €, en place en semaine 5. Personne à libérer.`,
      },
      {
        t: "Refaire les plans de soins avec chaque équipe, résident par résident",
        d: `L'infirmière coordinatrice, un aide-soignant du matin, un de l'après-midi et un de nuit : une heure de soignants par résident, remplacée, pour les ${PLACES} résidents. ${fr(COUT_PARAMETRAGE)} € sur trois semaines.`,
      },
      {
        t: "Confier la mise à jour aux trois infirmières coordinatrices, sur leur temps",
        d: "Rien à payer. Elles s'y mettront entre deux urgences.",
      },
      {
        t: "Garder les plans actuels : les équipes s'y feront",
        d: "Rien ne change.",
      },
    ],
    reactions: [
      [{ ...EDITEUR, texte: "Les nouveaux plans types seront chargés le lundi de la semaine 5." }],
      [
        {
          ...IDEC,
          texte:
            "On a commencé par le premier étage. Les aides-soignantes de nuit ont ajouté les changes et les retournements : personne ne les avait jamais écrits.",
        },
      ],
      [{ ...IDEC, texte: "Je m'y mets le soir. À ce rythme, il me faudra l'été." }],
      [
        {
          ...FLEUR,
          texte: "Toujours « toilette complète à 7 h » pour tout le monde. On garde la feuille.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Qui accompagne les équipes ?",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...DG,
        heure: "10:00",
        alerte: true,
        texte:
          "Le conseil d'administration m'a demandé où en est Carnéo. Les trois directeurs disent que leurs équipes ont besoin d'être accompagnées. Que proposes-tu ?",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Semaine 5 : ${ctx.usage} des transmissions saisies au moment du soin ; ${ctx.heuresDouble} de recopie ; absentéisme des soignants : ${ctx.absenteisme}.`,
      },
    ],
    sources: [
      {
        id: "montchapet",
        titre: "Demander à Montchapet comment l'usage a pris",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Edmée Faucompré : « Deux référents, une aide-soignante de jour et une de nuit, formées deux jours par l'éditeur, avec deux heures par semaine pour aider les collègues au chariot. Les premières semaines, rien ne bougeait ; deux semaines après leur formation, l'usage a commencé à monter, et il a triplé en six semaines. La journée de formation en salle de l'automne nous avait donné trois points, partis un mois plus tard. »",
      },
      {
        id: "volontaires",
        titre: "Sonder les équipes sur des volontaires",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Deux volontaires à Beaune et à Chalon, un de jour et un de nuit. À Montbard, une aide-soignante de jour s'est proposée ; pour la nuit, personne encore.",
      },
    ],
    question: "Qui accompagne les équipes ?",
    options: [
      {
        t: "Former deux référents par EHPAD, un de jour et un de nuit, avec deux heures par semaine pour leurs collègues",
        d: `Deux jours de formation pour six soignants, ${fr(COUT_FORMATION_REFERENTS)} €, puis ${fr(COUT_HEBDO_REFERENTS)} € par semaine de temps dégagé. Prêts en semaine 8.`,
      },
      {
        t: "Faire venir le formateur de l'éditeur une journée dans chaque EHPAD, pour toutes les équipes",
        d: `Trois journées à 1 400 € et deux heures de formation en salle pour 120 soignants : ${fr(COUTS.formateur)} €.`,
      },
      {
        t: "Confier l'accompagnement aux trois infirmières coordinatrices",
        d: "Rien à payer : elles connaissent les équipes.",
      },
      {
        t: "Ne rien ajouter : les équipes ont été formées au déploiement",
        d: "Rien à engager.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...FLEUR,
          texte:
            "Une journée en salle, devant un grand écran. On sait déjà où cliquer ; ce qui nous manque, c'est de pouvoir le faire dans le couloir.",
        },
      ],
      [
        {
          ...IDEC,
          texte:
            "Je veux bien. Mais entre les admissions, les plans de soins et les médecins, je passerai peu de temps au chariot.",
        },
      ],
      [
        {
          ...MONTBARD_DIR,
          texte: "Les équipes ont compris qu'on ne les aiderait pas davantage.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · jeudi",
    titre: "Un pansement non refait",
    jusqua: 8,
    messages: () => [
      {
        ...IDEC,
        heure: "11:40",
        alerte: true,
        texte:
          "Un événement indésirable au deuxième étage : le médecin avait modifié mardi le pansement d'une résidente ; l'infirmière du matin l'a noté dans le cahier, l'équipe de l'après-midi a suivi le plan de soins de Carnéo. Le pansement n'a pas été refait pendant deux jours. Pas de conséquence grave, la plaie est reprise ; la famille demande des explications.",
      },
      {
        ...DG,
        heure: "16:00",
        texte:
          "Les directeurs veulent une règle claire. Certains disent : revenons au papier, au moins tout le monde sait où lire. Ta proposition pour lundi ?",
      },
    ],
    sources: [
      {
        id: "analyse",
        titre: "Relire l'analyse de l'événement avec l'infirmière coordinatrice",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Le soin modifié figurait sur papier à 10 h 15, dans Carnéo à 20 h 50, recopié en fin de poste. Deux supports, aucun complet : l'équipe du matin écrivait dans l'un, celle de l'après-midi lisait l'autre. Dans les trois EHPAD qui ont retiré le cahier, ce type d'événement est devenu rare. Cette semaine, ${ctx.usage} des transmissions des trois EHPAD sont saisies au moment du soin ; ${
            ctx.materiel
              ? "les tablettes sont sur les chariots."
              : "les tablettes sont toujours au poste de soins."
          }`,
      },
      {
        id: "bascules",
        titre: "Demander comment les autres EHPAD ont retiré le cahier papier",
        cout: 0.5,
        nature: "utile",
        resultat:
          "À Montchapet et à Auxonne, un établissement à la fois, avec l'éditeur et Odon Sabran deux jours sur place et une procédure dégradée sur papier en cas de panne. Aux Grésilles, deux unités avaient basculé le même jour : deux semaines difficiles. L'éditeur et le technicien ne peuvent être que dans un EHPAD à la fois. Là où les tablettes n'étaient pas au chariot, la bascule a fini en notes sur des bouts de papier.",
      },
      {
        id: "ars",
        titre: "Relire la convention de crédits de l'ARS",
        cout: 0.5,
        nature: "utile",
        resultat: `L'ARS a financé le déploiement par ${fr(CREDITS_ARS)} € de crédits non reconductibles. Leur emploi est vérifié à l'état réalisé des recettes et des dépenses : un abandon dans trois EHPAD exposerait à la reprise de leur part, ${fr(REPRISE_ARS)} €. Au dialogue de gestion de juin, une reprise de ce genre a été demandée ${CHANCE_REPRISE === 0.5 ? "une fois sur deux" : pc(CHANCE_REPRISE)} ces dernières années.`,
      },
    ],
    question: "Quelle règle fixez-vous pour les transmissions ?",
    options: [
      {
        t: "Revenir au papier dans les trois EHPAD jusqu'à la rentrée : un seul support, celui que tout le monde connaît",
        d: "Le cahier et les plans de soins papier dès lundi ; Carnéo reste installé.",
      },
      {
        t: "Retirer le cahier papier dans les trois EHPAD en même temps, en semaine 9",
        d: `Carnéo seul, avec une procédure dégradée en cas de panne. L'éditeur et le technicien deux jours sur place : ${fr(COUTS.bascule)} €.`,
      },
      {
        t: "Retirer le cahier un EHPAD après l'autre : Beaune en semaine 9, Chalon en semaine 11, Montbard en semaine 13",
        d: `Le même accompagnement, établissement par établissement, avec une procédure dégradée : ${fr(COUTS.bascule + 600)} €.`,
      },
      {
        t: "Rappeler à l'équipe la consigne de tout reporter dans Carnéo, et garder les deux supports",
        d: "Une réunion à Chalon. Rien d'autre ne change.",
      },
    ],
    reactions: [
      [
        {
          ...FLEUR,
          texte:
            "Le cahier est revenu. On sait où écrire. Carnéo, plus personne ne l'ouvre, et les plans de soins papier datent d'avant le déploiement.",
        },
      ],
      [
        {
          ...TECHNICIEN,
          texte:
            "Bascule le lundi de la semaine 9 dans les trois EHPAD. Halina et moi serons partagés entre les trois sites.",
        },
      ],
      [
        {
          ...TECHNICIEN,
          texte:
            "Beaune bascule en semaine 9. Ce qu'on y apprendra servira pour Chalon et Montbard.",
        },
      ],
      [
        {
          ...IDEC,
          texte:
            "La consigne est rappelée. Mais tant qu'il y a deux supports, on écrira dans les deux, et on lira dans l'un.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "La veille canicule commence",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...DG,
        heure: "09:00",
        alerte: true,
        texte:
          "La veille saisonnière canicule commence le 1er juin, et les prévisions annoncent un mois de juin chaud. Chaque EHPAD applique son plan bleu : hydratation, pesées, signes d'alerte. Comment le suivez-vous dans les trois EHPAD ?",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Semaine 9 : ${ctx.usage} des transmissions saisies au moment du soin ; ${ctx.erreurs} erreurs de soins déclarées depuis avril.`,
      },
    ],
    sources: [
      {
        id: "eteDernier",
        titre: "Relire le retour d'expérience de l'été dernier",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `L'été dernier, les fiches d'hydratation papier étaient complètes pour 70 % des résidents ; à Montchapet, depuis que les rappels d'hydratation sont dans le plan de soins de Carnéo, sur la tablette du chariot, pour 92 %. Mais un rappel ne sert qu'au soignant qui a la tablette en main au moment du soin : la semaine dernière, ${ctx.usage} des transmissions des trois EHPAD étaient saisies au moment du soin, et ${
            ctx.materiel
              ? "les tablettes sont sur les chariots."
              : "les tablettes sont restées au poste de soins."
          }`,
      },
    ],
    question: "Comment suivez-vous l'hydratation des résidents cet été ?",
    options: [
      {
        t: "Mettre le plan canicule dans Carnéo : hydratation et signes d'alerte dans le plan de soins de chaque résident, avec un rappel sur la tablette du chariot",
        d: `Paramétré en une journée par les infirmières coordinatrices et les référents. ${fr(COUTS.canicule)} €.`,
      },
      {
        t: "Mettre des fiches d'hydratation papier dans les chambres, et les reporter dans Carnéo en fin de poste",
        d: `Tout se voit d'un coup d'œil dans la chambre ; ${MINUTES_FICHES} minutes de plus par poste jusqu'à la fin de l'été.`,
      },
      {
        t: "Appliquer le plan bleu habituel, avec ses fiches papier",
        d: "Comme chaque été. Rien à paramétrer.",
      },
    ],
    reactions: [
      [
        {
          ...IDEC,
          texte:
            "Le plan canicule est dans Carnéo. En entrant dans une chambre, la tablette rappelle le verre d'eau et l'heure de la dernière prise.",
        },
      ],
      [
        {
          ...FLEUR,
          texte:
            "Les fiches sont dans les chambres. On les remplit, puis on les recopie : encore une colonne de plus en fin de poste.",
        },
      ],
      [
        {
          ...CADRE,
          texte: "Les fiches du plan bleu sont ressorties. Les équipes les connaissent.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "L'été et ses remplaçants",
    jusqua: 13,
    messages: (ctx) => [
      {
        de: "Eudoxie Rambourg",
        role: "Directrice administrative et financière",
        heure: "11:00",
        alerte: true,
        texte: `Planning de l'été : ${REMPLACANTS} remplaçants en juillet et en août dans les trois EHPAD, en contrat court ou par Soralis Intérim Santé, un poste sur cinq environ. Aucun n'a de compte Carnéo.`,
      },
      {
        ...MONTBARD_DIR,
        heure: "15:30",
        texte:
          "Avec autant de remplaçants, je propose qu'on suspende Carnéo l'été et qu'on reprenne en septembre.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Semaine 11 : ${ctx.usage} des transmissions saisies au moment du soin ; ${ctx.heuresDouble} de recopie dans la semaine.`,
      },
    ],
    sources: [
      {
        id: "gresilles",
        titre: "Demander aux Grésilles comment s'est passé l'été dernier",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les remplaçants sans compte écrivaient sur papier ; les titulaires recopiaient leurs transmissions dans Carnéo, et l'usage a perdu un cinquième en août. Créer un compte nominatif prend dix minutes ; une demi-heure d'accueil au chariot suffit pour les transmissions.",
      },
      {
        id: "dpo",
        titre: "Demander l'avis du délégué à la protection des données",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Chaque accès au dossier de soins doit être nominatif : un compte partagé ne permet plus de savoir qui a écrit quoi. Après une erreur ou une réclamation, l'association ne pourrait pas reconstituer les faits. Un compte temporaire coûte 15 € de licence pour l'été.",
      },
    ],
    question: "Comment passez-vous l'été ?",
    options: [
      {
        t: "Créer un compte nominatif pour chaque remplaçant, avec une demi-heure d'accueil au chariot par un référent ou l'infirmière coordinatrice",
        d: `15 € de licence et une demi-heure de deux soignants par remplaçant : ${fr(COUTS.comptes)} € pour les ${REMPLACANTS}.`,
      },
      {
        t: "Suspendre Carnéo pendant l'été dans les trois EHPAD, et reprendre en septembre",
        d: `Le cahier papier en juillet et en août ; une relance en septembre : ${fr(COUTS.relance)} €.`,
      },
      {
        t: "Donner aux remplaçants un compte partagé par EHPAD",
        d: "Prêt lundi, rien à payer.",
      },
      {
        t: "Laisser chaque EHPAD s'organiser avec ses remplaçants",
        d: "Rien à engager.",
      },
    ],
    reactions: [
      [
        {
          ...TECHNICIEN,
          texte: `Les ${REMPLACANTS} comptes sont prêts. Chaque remplaçant aura sa demi-heure au chariot le premier jour.`,
        },
      ],
      [{ ...MONTBARD_DIR, texte: "Merci. On ressortira les cahiers en juillet." }],
      [
        {
          ...TECHNICIEN,
          texte:
            "Trois comptes partagés créés, un par EHPAD. Le délégué à la protection des données demande à en parler.",
        },
      ],
      [{ ...IDEC, texte: "On fera comme l'an dernier aux Grésilles, j'imagine." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Mettre l'outil dans le travail réel", chemin: [1, 1, 0, 1, 0, 0] },
  { nom: "Obliger, puis revenir au papier", chemin: [0, 0, 1, 0, 1, 1] },
  { nom: "Attentiste", chemin: [3, 3, 3, 3, 2, 3] },
] as const;

/**
 * Les réflexes du métier : obliger et contrôler, former en salle, revenir au papier
 * (après l'erreur de soins, ou pour l'été) — [décision, option].
 */
export const REFLEXES = [
  [0, 0],
  [2, 1],
  [3, 0],
  [5, 1],
] as const;

export const REPONSES = {
  volontaireOui:
    "Une aide-soignante de nuit de Montbard s'est finalement proposée. Les six référents partent en formation en semaine 6.",
  volontaireNon:
    "Personne de l'équipe de nuit de Montbard ne s'est proposé : cinq référents partent en formation, la nuit de Montbard restera sans relais.",
  demarrageSimultane:
    "La bascule s'est mal passée à Chalon et à Montbard : comptes bloqués, procédure dégradée mal connue, l'éditeur ne pouvait être partout. Deux semaines difficiles, et une semaine de renfort de l'éditeur.",
  demarrageProgressif:
    "La bascule de Beaune a été difficile la première semaine ; on a corrigé la procédure dégradée avant Chalon.",
  depart:
    "Ndeye Quillardet, aide-soignante de nuit depuis douze ans, a donné sa démission : « Je ne suis pas venue dans ce métier pour remplir des cases à 6 h du matin. » Ses nuits seront tenues en intérim jusqu'au recrutement.",
  reprise: `Au dialogue de gestion, l'ARS a constaté le retour au papier dans trois EHPAD et demande la reprise de ${fr(REPRISE_ARS)} € de crédits non reconductibles.`,
  pasDeReprise:
    "Au dialogue de gestion, l'ARS a pris note du retour au papier ; elle attend un nouveau calendrier pour septembre.",
  incident:
    "Une famille conteste une transmission sur un traitement ; elle est signée « remplaçant Montbard ». Impossible de savoir qui l'a écrite : analyse, mise en conformité des accès, réponse à la famille.",
} as const;
