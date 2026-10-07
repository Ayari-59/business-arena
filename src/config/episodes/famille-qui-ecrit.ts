/**
 * LA FAMILLE QUI ÉCRIT À L'ARS — le contenu de l'épisode.
 *
 * Edmée Faucompré dirige l'EHPAD de Dijon-Montchapet, 96 places, à
 * l'Association Solvanne. La fille d'une résidente a écrit à l'ARS et au
 * journal local : toilettes faites tard, sonnettes sans réponse, linge perdu.
 * L'ARS demande des explications sous quinze jours, et l'équipe se sent
 * attaquée. Six décisions, d'avril à juin, chacune précédée de ce qu'une
 * directrice d'EHPAD reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Les chiffres qu'elles
 * donnent sont ceux du modèle (src/engine/episodes/famille-qui-ecrit.ts) ;
 * le test de l'épisode le vérifie.
 *
 * Établissement, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";
import {
  APPELS,
  AS_SEMAINE_MATIN,
  AS_WEEK_END_MATIN,
  COUTS,
  HEURE_AS,
  HEURE_AS_DIMANCHE,
  HEURE_INTERIM,
  INTERIM_WEEK_END,
  LINGE,
  MINIMUM_INTERIM,
  PART_APPELS_LONGS,
  RENFORT_WEEK_END,
} from "@/engine/episodes/famille-qui-ecrit";

const euros = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} €`;
const pct = (v: number) => `${Math.round(v * 100)} %`;

export const DIAGNOSTICS = [
  {
    id: "organisation",
    t: "Les plaintes sont en bonne partie fondées et viennent de l'organisation : trop peu de bras de 7 h à 9 h le week-end, un linge mal suivi depuis le changement de prestataire ; le reste est un malentendu",
  },
  {
    id: "matins",
    t: "Le matin du week-end manque de bras : c'est toute l'explication",
  },
  {
    id: "famille",
    t: "La famille exagère : les soins sont faits, et l'EHPAD est dans la moyenne des réclamations",
  },
  {
    id: "soignante",
    t: "Une aide-soignante du week-end ne fait pas son travail",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "La lettre de l'ARS",
    jusqua: 1,
    messages: () => [
      {
        de: "ARS Bourgogne-Franche-Comté",
        role: "Délégation départementale de la Côte-d'Or",
        heure: "08:10",
        alerte: true,
        texte:
          "Madame la directrice, nous avons été saisis par Mme Ginette Durupt, fille de Mme Berthe Vauchez, résidente de votre établissement. Elle signale des toilettes réalisées tardivement, des appels malades restés sans réponse et des pertes de linge répétées. Nous vous remercions de nous faire parvenir sous quinze jours vos explications et les mesures envisagées.",
      },
      {
        de: "Ursule Mauvernay",
        role: "Directrice générale, Association Solvanne",
        heure: "08:45",
        texte:
          "Edmée, l'article de samedi est sur mon bureau, et l'ARS m'a mise en copie. Je veux voir ta réponse avant qu'elle parte. Et je ne veux pas apprendre la suite par le journal.",
      },
      {
        de: "Briag Prudhon",
        role: "Aide-soignant, élu du CSE",
        heure: "09:20",
        texte:
          "L'équipe a lu l'article. Les filles du week-end le prennent très mal : on est six le dimanche matin pour quatre-vingt-seize, on fait ce qu'on peut. Fatoumata est citée par son prénom, elle a pleuré tout le service.",
      },
      {
        de: "Khadidja Haddouche",
        role: "Infirmière coordinatrice",
        heure: "09:40",
        texte:
          "Je peux sortir ce qu'il faut de Carnéo et du système d'appel. Dis-moi par quoi on commence.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "appels",
        titre: "Extraire le journal des appels malades des huit dernières semaines",
        cout: 0.5,
        nature: "decisive",
        resultat: `De 7 h à 9 h en semaine, on répond à une sonnette en ${APPELS.semaine} minutes en moyenne. Le samedi et le dimanche à la même heure, en ${APPELS.weekEnd} minutes, et ${pct(PART_APPELS_LONGS)} des appels attendent plus d'un quart d'heure. Le reste de la journée, les délais sont comparables à ceux de la semaine. La chambre 214, celle de Mme Vauchez, ne se distingue pas des autres.`,
      },
      {
        id: "plannings",
        titre: "Rapprocher les plannings et les transmissions des week-ends",
        cout: 1,
        nature: "decisive",
        resultat: `En semaine, ${AS_SEMAINE_MATIN} aides-soignantes prennent leur poste à 7 h ; le week-end, ${AS_WEEK_END_MATIN} de 7 h à 9 h, les postes de renfort ne commençant qu'à 9 h depuis la refonte du roulement en septembre. Le week-end, les toilettes se terminent en moyenne à 11 h 40. Pour Mme Vauchez, les transmissions disent autre chose en semaine : sa toilette est faite vers 10 h, à sa demande, comme le prévoit son projet personnalisé (« aime se lever tard ») ; sa fille n'était pas à la réunion de projet d'octobre. Le service des ressources humaines rappelle qu'une heure d'aide-soignante coûte ${euros(HEURE_AS)} charges comprises, ${euros(HEURE_AS_DIMANCHE)} le dimanche avec l'indemnité de dimanche.`,
      },
      {
        id: "linge",
        titre: "Faire le point sur le linge avec la gouvernante",
        cout: 0.5,
        nature: "utile",
        resultat: `Colombe Guenebaud : « Depuis que la Blanchisserie Ondelys a repris le linge des résidents en janvier, ${Math.round(LINGE.depuis * 8)} pièces ont été déclarées perdues en huit semaines, contre une ou deux par semaine avant. ${pct(LINGE.nonMarquees)} n'étaient pas marquées : des vêtements apportés par les familles après l'entrée. Le contrat prévoit une pénalité de ${euros(LINGE.penalite)} par pièce marquée perdue ; on ne l'a jamais réclamée. Nous remboursons ${euros(LINGE.remboursement)} par pièce en moyenne. »`,
      },
      {
        id: "comparaison",
        titre: "Comparer les réclamations avec les autres EHPAD de l'association",
        cout: 1,
        nature: "bruit",
        resultat:
          "Sur l'année écoulée, Montchapet a reçu treize réclamations écrites pour 96 places, Beaune quatorze pour 88, Chalon-sur-Saône douze pour 90. Les taux d'occupation, le GMP et l'absentéisme sont dans la moyenne de l'association.",
      },
      {
        id: "conseil",
        titre: "Appeler Madeleine Sirugue, directrice qualité et gestion des risques",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Madeleine : « Avant d'écrire une ligne à l'ARS, mets les heures à côté des plaintes. Une famille se trompe rarement sur tout, et rarement sur ce qu'elle voit le dimanche matin. Et ne cherche pas de coupable avant d'avoir les faits. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que faites-vous cette semaine ?",
    options: [
      {
        t: "Reprendre les faits avec l'équipe, sans chercher de coupable",
        d: "L'infirmière coordinatrice et vous reprenez plannings, transmissions et journal des appels avec les soignants du week-end. Rien n'est dit à l'ARS ni à la famille avant.",
      },
      {
        t: "Défendre l'équipe en bloc : les soins sont faits, la famille exagère",
        d: "Une note de soutien affichée en salle de pause, et un mot au siège : l'établissement est conforme.",
      },
      {
        t: "Mettre à pied à titre conservatoire l'aide-soignante citée dans la lettre",
        d: "Fatoumata Sawadogo est écartée le temps d'y voir clair, et remplacée en intérim. Un signal fort pour l'ARS et pour la famille.",
      },
      {
        t: "Attendre de voir si la famille se calme",
        d: "L'ARS laisse quinze jours. L'équipe n'en entend pas parler officiellement.",
      },
    ],
    reactions: [
      [
        {
          de: "Khadidja Haddouche",
          role: "Infirmière coordinatrice",
          texte:
            "On a tout repris avec les filles du week-end, chiffres sur la table. Elles l'ont dit elles-mêmes : de 7 h à 9 h, on court d'une sonnette à l'autre. Personne ne s'est senti accusé.",
        },
      ],
      [
        {
          de: "Briag Prudhon",
          role: "Aide-soignant, élu du CSE",
          texte:
            "La note a fait du bien. L'équipe se sent soutenue. Mme Durupt l'a vue en passant devant la salle de pause.",
        },
      ],
      [
        {
          de: "Briag Prudhon",
          role: "Aide-soignant, élu du CSE",
          texte:
            "Fatoumata est rentrée chez elle. Les collègues ne comprennent pas : elle était seule pour seize résidents dimanche. On se demande qui sera la prochaine.",
        },
      ],
      [
        {
          de: "Briag Prudhon",
          role: "Aide-soignant, élu du CSE",
          texte:
            "Personne ne nous a rien dit. Dans les couloirs, chacun a sa version de l'histoire.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · lundi",
    titre: "Mme Durupt demande des comptes",
    jusqua: 2,
    messages: (ctx) => [
      {
        de: "Ginette Durupt",
        role: "Fille de Mme Vauchez, chambre 214",
        heure: "09:05",
        alerte: true,
        texte: ctx.sanction
          ? "Madame la directrice, j'apprends qu'une aide-soignante a été écartée. Je n'ai jamais demandé cela. Je veux savoir pourquoi ma mère attend sa toilette jusqu'à midi, et je veux qu'on me rende ses deux gilets."
          : "Madame la directrice, j'attends toujours une réponse. Je veux savoir pourquoi ma mère attend sa toilette jusqu'à midi, pourquoi personne ne vient quand elle sonne, et je veux qu'on me rende ses deux gilets.",
      },
      {
        de: "Tableau de bord de l'EHPAD",
        role: "Point hebdomadaire",
        heure: "09:30",
        texte: `Appels du week-end, de 7 h à 9 h : ${ctx.appels} en moyenne. Linge déclaré perdu la semaine passée : ${ctx.linge} pièces. Demandes d'admission en attente : ${ctx.liste}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "lettre",
        titre: "Relire la lettre de Mme Durupt à l'ARS, ligne à ligne",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "La lettre est dure, mais précise : trois dimanches datés où sa mère a attendu sa toilette jusqu'à 11 h 30 ou midi, une sonnette restée vingt-cinq minutes sans réponse, deux gilets et un châle disparus. Une phrase revient deux fois : « Je ne demande pas qu'on punisse qui que ce soit. Je demande qu'on me dise ce qui se passe et ce qui va changer. »",
      },
      {
        id: "visites",
        titre: "Demander à l'accueil et à l'équipe du soir comment se passent ses visites",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Mme Durupt vient chaque jour vers 17 h ; elle s'entend bien avec l'équipe du soir. Personne ne lui a expliqué que sa mère avait choisi de se lever tard en semaine : elle ne lit les heures de toilette que comme du retard.${
            ctx.defense
              ? " Elle a lu la note affichée en salle de pause et l'a photographiée : « Alors c'est moi qui exagère ? »"
              : ""
          }`,
      },
    ],
    question: "Comment répondez-vous à Mme Durupt ?",
    options: [
      {
        t: "La recevoir cette semaine avec l'infirmière coordinatrice et le médecin coordonnateur",
        d: "Une heure et demie : ce qui est fondé, ce qui ne l'est pas, ce qui va changer. Un compte rendu écrit.",
      },
      {
        t: "Lui écrire que les soins sont conformes au plan de soins de sa mère",
        d: "Une lettre courte, relue par le siège. Pas de rendez-vous.",
      },
      {
        t: "La recevoir après la réponse à l'ARS",
        d: "Dans trois semaines, quand tout sera écrit.",
      },
      {
        t: "Demander au médecin coordonnateur de l'appeler",
        d: "Le Dr Andrianjafy lui explique au téléphone les soins de sa mère.",
      },
    ],
    reactions: [
      [
        {
          de: "Khadidja Haddouche",
          role: "Infirmière coordinatrice",
          texte: "Rendez-vous pris jeudi à 17 h 30. Le Dr Andrianjafy sera là.",
        },
      ],
      [
        {
          de: "Madeleine Sirugue",
          role: "Directrice qualité et gestion des risques, siège",
          texte:
            "La lettre est partie. Elle est juste sur le fond. Elle ne répond à aucune de ses questions.",
        },
      ],
      [
        {
          de: "Ginette Durupt",
          role: "Fille de Mme Vauchez",
          texte: "Trois semaines. Ma mère, elle, attend tous les dimanches.",
        },
      ],
      [
        {
          de: "Ignace Andrianjafy",
          role: "Médecin coordonnateur",
          texte:
            "Je l'ai eue une demi-heure. Elle m'a écouté sur le plan médical, mais elle m'a demandé qui allait se lever plus tôt le dimanche. Je n'avais pas la réponse.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · lundi",
    titre: "La réponse à l'ARS",
    jusqua: 4,
    messages: (ctx) => [
      {
        de: "Ursule Mauvernay",
        role: "Directrice générale",
        heure: "08:30",
        alerte: true,
        texte:
          "La réponse à l'ARS doit partir mercredi. Envoie-la-moi demain. Quelle ligne prends-tu ?",
      },
      {
        de: "Briag Prudhon",
        role: "Aide-soignant, élu du CSE",
        heure: "10:15",
        texte: ctx.faits
          ? "Les filles demandent juste une chose : que la lettre dise qu'elles étaient six pour quatre-vingt-seize, pas qu'elles ont mal travaillé."
          : "L'équipe veut savoir ce que vous allez écrire à l'ARS. Personne ne veut se retrouver cité.",
      },
      ...(ctx.apaiseeConnue
        ? [
            {
              de: "Ginette Durupt",
              role: "Fille de Mme Vauchez",
              heure: "17:40",
              texte: !ctx.apaisee
                ? "Je n'ai rien appris de nouveau. J'ai rappelé le journal."
                : ctx.recue
                  ? "Merci pour jeudi. Je ne savais pas pour les levers tardifs de ma mère. J'attends de voir ce qui change le dimanche."
                  : "J'ai eu vos explications. J'attends de voir ce qui change le dimanche.",
            },
          ]
        : []),
    ],
    sources: [
      {
        id: "courrier",
        titre: "Relire ce que l'ARS demande exactement",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "L'ARS demande une chronologie, des éléments factuels (plannings, transmissions, relevés des appels malades), l'analyse des causes et les mesures correctrices avec leur calendrier. Elle précise : « À défaut d'éléments probants, une inspection sur place pourra être diligentée. »",
      },
      {
        id: "precedents",
        titre:
          "Demander au siège comment se sont terminées les dernières réclamations transmises par l'ARS",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Madeleine Sirugue : « Dans la région, une réponse factuelle avec un plan daté, appuyée sur des faits vérifiés, fait clore le dossier neuf fois sur dix. Une réponse qui dit que tout est conforme vaut une inspection à peu près deux fois sur trois. Quand d'autres familles ont écrit entre-temps, la balance penche vers l'inspection. »",
      },
    ],
    question: "Quelle réponse envoyez-vous à l'ARS ?",
    options: [
      {
        t: "Une réponse factuelle : la chronologie, les chiffres, ce qui est fondé, et un plan d'action daté",
        d: "Le journal des appels, les plannings, le malentendu sur les levers, les mesures et leurs dates.",
      },
      {
        t: "Une réponse ferme : les soins sont conformes et l'équipe irréprochable",
        d: "Le projet de soins de la résidente, le taux de réclamations dans la moyenne, le soutien à l'équipe.",
      },
      {
        t: "Reconnaître des manquements et annoncer une procédure disciplinaire contre l'aide-soignante citée",
        d: "Montrer à l'ARS que la direction a réagi.",
      },
      {
        t: "Demander un mois de plus pour compléter l'enquête",
        d: "Un courrier d'attente, et une réponse complète en mai.",
      },
    ],
    reactions: [
      [
        {
          de: "Ursule Mauvernay",
          role: "Directrice générale",
          texte:
            "Relue. Tu dis ce qui ne va pas, et tu dis ce que tu fais, avec des dates. C'est ce que j'aurais voulu lire à leur place.",
        },
      ],
      [
        {
          de: "Madeleine Sirugue",
          role: "Directrice qualité et gestion des risques, siège",
          texte: "Partie. Je crains qu'ils ne la lisent comme une fin de non-recevoir.",
        },
      ],
      [
        {
          de: "Briag Prudhon",
          role: "Aide-soignant, élu du CSE",
          texte:
            "On a appris par le siège qu'une procédure est lancée contre Fatoumata. Les filles du week-end sont écœurées.",
        },
      ],
      [
        {
          de: "ARS Bourgogne-Franche-Comté",
          role: "Délégation départementale",
          texte:
            "Nous prenons acte de votre demande et attendons vos éléments dans les meilleurs délais.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · lundi",
    titre: "Le matin du week-end",
    jusqua: 6,
    messages: (ctx) => [
      {
        de: "Khadidja Haddouche",
        role: "Infirmière coordinatrice",
        heure: "08:20",
        alerte: true,
        texte: `Ce week-end encore, ${ctx.appels} en moyenne à la sonnette entre 7 h et 9 h, et deux résidentes retrouvées au sol en se levant seules, sans gravité. On ne peut pas continuer à six.`,
      },
      {
        de: "Tableau de bord de l'EHPAD",
        role: "Point hebdomadaire",
        heure: "09:00",
        texte: `Réclamations reçues depuis le début du trimestre : ${ctx.reclamations}. Absentéisme des soignants : ${ctx.absenteisme}. Demandes d'admission en attente : ${ctx.liste}.`,
      },
    ],
    sources: [
      {
        id: "volontaires",
        titre: "Demander à l'équipe qui serait volontaire pour commencer à 7 h",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.sanction
            ? "Personne ne se porte volontaire. Rodica Clerget, à temps partiel : « Venir plus tôt pour se faire reprocher le retard ? Tant que l'histoire de Fatoumata n'est pas réglée, non. »"
            : `Quatre aides-soignantes à temps partiel sont prêtes à commencer à 7 h un week-end sur deux, en complément d'heures. Rodica Clerget prévient : « En juin, avec les congés et les enfants, on ne promet rien. » À peu près une chance sur cinq que le renfort lâche en juin. Deux heures le samedi et le dimanche : ${euros(RENFORT_WEEK_END)} par week-end.`,
      },
      {
        id: "soralis",
        titre: "Demander un devis à Soralis Intérim Santé",
        cout: 0.5,
        nature: "utile",
        resultat: `Soralis facture une aide-soignante ${euros(HEURE_INTERIM)} de l'heure, avec un minimum de ${MINIMUM_INTERIM} heures par mission : ${euros(INTERIM_WEEK_END)} par week-end, garanti tous les week-ends. Les intérimaires ne connaissent ni les résidents ni leurs habitudes.`,
      },
      {
        id: "apresmidi",
        titre: "Regarder l'après-midi du week-end",
        cout: 0.5,
        nature: "utile",
        resultat:
          "De 14 h à 21 h le week-end, cinq aides-soignantes pour les goûters, les visites et les couchers. Avec une de moins, les couchers commenceraient à 18 h 30 pour finir après 21 h.",
      },
    ],
    question: "Comment renforcez-vous le matin du week-end ?",
    options: [
      {
        t: "Ajouter une aide-soignante de 7 h à 9 h le samedi et le dimanche, avec des temps partiels volontaires",
        d: `Un complément d'heures pour quatre volontaires, à tour de rôle : ${euros(RENFORT_WEEK_END)} par week-end.`,
      },
      {
        t: "Faire venir une intérimaire de Soralis Intérim Santé le samedi et le dimanche matin",
        d: `Quatre heures au moins par mission : ${euros(INTERIM_WEEK_END)} par week-end, assurés tous les week-ends.`,
      },
      {
        t: "Avancer à 7 h un poste d'après-midi du week-end",
        d: "Sans coût : un poste de 14 h à 21 h devient 7 h à 14 h. L'après-midi passe à quatre.",
      },
      {
        t: "Ne rien changer au roulement : l'équipe fait au mieux",
        d: "Le roulement a été validé en septembre avec le CSE.",
      },
    ],
    reactions: [
      [
        {
          de: "Khadidja Haddouche",
          role: "Infirmière coordinatrice",
          texte: "Le planning des volontaires est affiché. Premier renfort samedi à 7 h.",
        },
      ],
      [
        {
          de: "Soralis Intérim Santé",
          role: "Agence d'intérim",
          texte:
            "C'est noté : une aide-soignante chaque samedi et chaque dimanche de 7 h à 11 h, jusqu'à fin juin.",
        },
      ],
      [
        {
          de: "Briag Prudhon",
          role: "Aide-soignant, élu du CSE",
          texte:
            "Le matin respire un peu. L'après-midi, on finit les couchers à 21 h 15, et les familles du goûter le voient.",
        },
      ],
      [
        {
          de: "Khadidja Haddouche",
          role: "Infirmière coordinatrice",
          texte:
            "Je préviens les filles du week-end. Elles ne disent rien. Elles n'y croyaient pas.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · lundi",
    titre: "Le linge",
    jusqua: 8,
    messages: (ctx) => [
      {
        de: "Colombe Guenebaud",
        role: "Gouvernante",
        heure: "08:50",
        alerte: true,
        texte: `Encore ${ctx.linge} pièces déclarées perdues la semaine dernière. Trois familles sont passées à mon bureau vendredi. Je passe mes après-midi à fouiller les chariots d'Ondelys.`,
      },
      {
        de: "Wojciech Kaczmarek",
        role: "Responsable de compte, Blanchisserie Ondelys",
        heure: "11:30",
        texte:
          "Madame la directrice, nous traitons ce qu'on nous confie. Un vêtement sans marquage, nous ne pouvons pas savoir à qui il appartient.",
      },
    ],
    sources: [
      {
        id: "contrat",
        titre: "Relire le contrat d'Ondelys",
        cout: 0.5,
        nature: "decisive",
        resultat: `Le contrat oblige Ondelys à rendre un plan d'amélioration sous quinze jours sur simple demande, et prévoit une pénalité de ${euros(LINGE.penalite)} par pièce marquée perdue. Le marquage des vêtements apportés après l'entrée est à la charge de l'EHPAD : il n'est fait par personne. Ondelys a contesté ses pénalités dans un autre EHPAD de l'agglomération, à peu près une fois sur trois ça se finit en litige.`,
      },
      {
        id: "lingerie",
        titre: "Demander à la gouvernante ce que coûterait le linge en interne",
        cout: 0.5,
        nature: "utile",
        resultat: `Les machines de l'ancienne lingerie fonctionnent encore. Il faudrait une lingère en contrat à durée déterminée à partir de la semaine 9 et des produits : ${euros(COUTS.lingerie)} par semaine. Avant 2025, on perdait une demi-pièce par semaine.`,
      },
    ],
    question: "Que faites-vous pour le linge ?",
    options: [
      {
        t: "Exiger d'Ondelys un plan de correction, appliquer les pénalités, et marquer tout vêtement apporté",
        d: `Une étiqueteuse et deux jours d'agent pour marquer les armoires : ${euros(COUTS.marquage)}. Ondelys acceptera, ou contestera.`,
      },
      {
        t: "Reprendre en interne le linge personnel des résidents",
        d: `Une lingère en contrat à durée déterminée dès la semaine 9 : ${euros(COUTS.lingerie)} par semaine.`,
      },
      {
        t: "Rembourser les familles au prix du neuf, sans discuter",
        d: `${euros(LINGE.prixDuNeuf)} la pièce au lieu de ${euros(LINGE.remboursement)}, sans justificatif. Les familles n'auront plus à se battre.`,
      },
      {
        t: "Ne rien changer : la gouvernante continue de chercher les pièces une à une",
        d: "Remboursement sur justificatif, comme aujourd'hui.",
      },
    ],
    reactions: [
      null,
      [
        {
          de: "Colombe Guenebaud",
          role: "Gouvernante",
          texte:
            "La lingère commence en semaine 9. Les familles qui passent voient le linge plié dans les armoires.",
        },
      ],
      [
        {
          de: "Colombe Guenebaud",
          role: "Gouvernante",
          texte:
            "Les familles sont remboursées sans discuter. Les déclarations de pertes ont augmenté dès la première semaine.",
        },
      ],
      [
        {
          de: "Colombe Guenebaud",
          role: "Gouvernante",
          texte: "Je continue. Les chariots d'Ondelys, eux, arrivent toujours aussi mal triés.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · lundi",
    titre: "Les familles",
    jusqua: 13,
    messages: (ctx) => [
      {
        de: "Fernande Grivot",
        role: "Présidente du conseil de la vie sociale",
        heure: "10:00",
        alerte: true,
        texte: ctx.autres
          ? "Madame la directrice, plusieurs familles m'ont appelée après le deuxième article. Elles ne savent plus quoi croire. Le conseil de la vie sociale ne s'est pas réuni depuis février."
          : "Madame la directrice, des familles me demandent ce qui a changé depuis l'article. Le conseil de la vie sociale ne s'est pas réuni depuis février.",
      },
      {
        de: "Tableau de bord de l'EHPAD",
        role: "Point hebdomadaire",
        heure: "10:30",
        texte: `Appels du week-end, de 7 h à 9 h : ${ctx.appels}. Demandes d'admission en attente : ${ctx.liste}. Coûts engagés depuis avril : ${ctx.couts}.`,
      },
    ],
    sources: [
      {
        id: "cvs",
        titre: "Recevoir la présidente du conseil de la vie sociale",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Fernande Grivot : « Les familles veulent des chiffres et des dates, pas une plaquette. Une séance où on nous montre ce qui a changé vaut mieux que dix courriers, et on pourra suivre à chaque conseil. »${
            ctx.apaisee
              ? " Elle ajoute que Mme Durupt est prête à dire elle-même ce qui a changé pour sa mère."
              : " Elle ajoute que Mme Durupt viendra, et qu'elle a encore beaucoup à dire."
          }`,
      },
      {
        id: "commentaires",
        titre: "Lire les commentaires sous l'article du journal",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Une quarantaine de commentaires. La moitié défend les soignants (« elles font un métier impossible »), l'autre moitié raconte d'autres histoires d'EHPAD, souvent ailleurs qu'à Dijon.",
      },
    ],
    question: "Comment associez-vous les familles ?",
    options: [
      {
        t: "Réunir le conseil de la vie sociale en séance extraordinaire : les faits, le plan d'action, et un suivi avec les familles",
        d: "Ouverte à toutes les familles en semaine 10, chiffres à l'appui, puis un point à chaque séance.",
      },
      {
        t: "Publier un droit de réponse dans le journal : l'établissement est conforme et son équipe exemplaire",
        d: "Une tribune signée de la directrice, relue par le siège.",
      },
      {
        t: "Organiser une journée portes ouvertes et refaire la plaquette",
        d: `${euros(COUTS.portesOuvertes)}. Montrer l'établissement sous son meilleur jour.`,
      },
      {
        t: "Ne rien faire de plus : l'affaire se tasse",
        d: "Le conseil de la vie sociale se réunira à sa date habituelle, en octobre.",
      },
    ],
    reactions: [
      [
        {
          de: "Fernande Grivot",
          role: "Présidente du conseil de la vie sociale",
          texte:
            "Trente-deux familles présentes. Les chiffres des appels du week-end, avant et après, ont fait plus que tous les discours. On se revoit en septembre.",
        },
      ],
      [
        {
          de: "Madeleine Sirugue",
          role: "Directrice qualité et gestion des risques, siège",
          texte:
            "La tribune est parue. Le journaliste a aussitôt appelé Mme Durupt pour avoir sa réaction.",
        },
      ],
      [
        {
          de: "Briag Prudhon",
          role: "Aide-soignant, élu du CSE",
          texte:
            "Les portes ouvertes se sont bien passées. Les familles des résidents, elles, ne sont pas venues : elles connaissent la maison.",
        },
      ],
      [
        {
          de: "Fernande Grivot",
          role: "Présidente du conseil de la vie sociale",
          texte: "Bien. Je dirai aux familles d'attendre octobre.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Établir les faits, corriger, associer les familles", chemin: [0, 0, 0, 0, 0, 0] },
  { nom: "Défendre l'établissement", chemin: [1, 1, 1, 3, 3, 1] },
  { nom: "Attentiste", chemin: [3, 2, 3, 3, 3, 3] },
] as const;

/**
 * Les réflexes du métier sous une réclamation : défendre l'équipe et l'établissement par
 * principe, ou sanctionner aussitôt la soignante mise en cause. [décision, option].
 */
export const REFLEXES = [
  [0, 1],
  [0, 2],
  [1, 1],
  [2, 1],
  [2, 2],
  [5, 1],
] as const;

export const REPONSES = {
  apaisee:
    "Merci de m'avoir reçue. Je ne savais pas que ma mère avait choisi de se lever tard en semaine ; personne ne me l'avait dit. Pour le dimanche, j'attends de voir. Je ne réécrirai pas au journal.",
  apaiseeADistance:
    "Bien. J'attends de voir ce qui change le dimanche matin. Je ne réécrirai pas au journal d'ici là.",
  facheeADistance:
    "On me répond, on ne m'écoute pas. Personne ne m'a dit qui viendrait plus tôt le dimanche. J'ai rappelé le journal.",
  fachee:
    "Je suis repartie avec des mots, pas avec des réponses. Je continue de tenir mon cahier, dimanche après dimanche.",
  autres:
    "Trois autres familles ont écrit à l'ARS cette semaine, et le journal publie un deuxième article : « À Montchapet, les familles s'inquiètent ».",
  cloture:
    "Au vu de vos éléments et du plan d'action transmis, nous clôturons l'instruction de cette réclamation. Nous vous demandons un point d'étape à six mois.",
  inspection:
    "Les éléments transmis ne permettent pas de clore la réclamation. Une inspection sur place sera conduite les mardi et mercredi de la semaine 7.",
  visite:
    "Les deux inspectrices de l'ARS ont passé deux jours dans l'établissement : plannings, transmissions, relevés d'appels, entretiens avec l'équipe et des familles.",
  injonction:
    "Suite à l'inspection : injonction de renforcer l'effectif soignant du week-end matin sous un mois, et de faire conduire un audit externe de l'organisation des soins et du linge.",
  renfortLache:
    "Deux des volontaires se retirent pour juin : congés, enfants, fatigue. Les week-ends de juin repartent à six le matin.",
  renfortAbsent: "Aucune volontaire ne s'est présentée. Le renfort du week-end n'a pas démarré.",
  relance:
    "Une famille nous a signalé que le renfort du week-end matin, inscrit dans votre plan d'action, n'est plus assuré. Une visite d'inspection aura lieu cette semaine.",
  prestataireAccepte:
    "Nous avons reçu votre demande. Notre plan vous parvient sous huit jours, et nous appliquerons les pénalités prévues pour les pièces marquées.",
  prestataireConteste:
    "Nous contestons ces pénalités : le marquage relève de l'établissement. Nous transmettons le dossier à notre service juridique.",
  arrets:
    "Deux aides-soignantes de l'équipe du week-end sont en arrêt de travail pour deux semaines. Remplacées en intérim.",
  depart:
    "Une aide-soignante de l'équipe du week-end a remis sa démission : « Je ne veux pas être la prochaine. » Elle part à la fin de son préavis.",
} as const;
