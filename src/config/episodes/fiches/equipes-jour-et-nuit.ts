/**
 * FICHE ENSEIGNANT · ÉPISODE 94, L'ÉQUIPE DE JOUR ET L'ÉQUIPE DE NUIT.
 *
 * Un conflit entre deux équipes qui ne se voient pas se règle sur les faits
 * (qui fait quoi, à quelle heure, qui l'a décidé) et par des temps communs,
 * pas en tranchant pour l'une. Le piège : prendre une organisation pour un
 * conflit de personnes. Les chiffres du hasard de la classe sont ceux de la
 * graine 2, les moyennes celles des 30 tirages du bilan.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "equipes-jour-et-nuit",
  formations: ["stmg", "bts-sam"],
  programme: [
    "STMG · Terminale, ressources humaines et communication, Thème 3, La recherche de cohésion, un levier d'amélioration des relations de travail et du climat social",
    "BTS SAM · Bloc 3, Collaboration à la gestion des ressources humaines",
  ],
  notion:
    "Deux équipes qui se renvoient la faute ne souffrent presque jamais d'un conflit de caractères : elles se partagent mal une tâche que personne n'a répartie, et elles ne se parlent pas assez pour s'en apercevoir. L'erreur classique consiste à trancher pour l'une des deux par une note de service, à chercher une coupable quand un incident arrive, ou à imposer une rotation pour que « chacun comprenne le travail de l'autre ». Dans l'épisode, à l'EHPAD de Dijon-Grésilles, la nuit lève 18 résidents avant 6 h 45, dont 13 sur une « liste des 5 h 30 » écrite par l'équipe du matin et jamais validée ; le matin, cinq aides-soignants tiennent 40 toilettes pour 42 à faire, et les transmissions durent trois minutes debout. Deux veilleuses ont demandé leur mutation, et un poste de veilleuse tenu en intérim coûte 26,5 k€ le trimestre, pour une enveloppe de 65 k€. L'élève découvre que les faits mis sur la table devant les deux équipes, des transmissions protégées, des plans de soins révisés ensemble et des temps communs inscrits au roulement valent mieux qu'une décision d'autorité, et qu'un événement indésirable se lit sur l'organisation, pas sur la personne qui a suivi la liste.",
  objectifs: [
    "Je distingue un conflit de personnes d'un problème d'organisation, à partir des faits de l'activité (qui fait quoi, à quelle heure, sur quelle règle).",
    "Je calcule le coût d'un remplacement en intérim, taxe non récupérable comprise, pour mesurer ce que coûte un départ.",
    "Je choisis un mode de régulation qui fait travailler les deux parties sur les faits plutôt que de trancher pour l'une d'elles.",
    "J'analyse un événement indésirable sans chercher de coupable, et je réponds à la famille en disant ce qui change.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de climat social, de cohésion, de communication interne et de conflit doivent avoir été vues ; un produit et une majoration en pourcentage suffisent pour le calcul. Les transmissions entre équipes et le projet personnalisé d'un résident peuvent être présentés en quelques minutes avant de jouer.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/equipes-jour-et-nuit?hasard=2 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous présentez l'EHPAD en deux phrases (deux équipes qui se renvoient la faute, deux demandes de mutation) sans parler de la liste des 5 h 30, et vous demandez de noter sur papier le coût calculé en semaine 1 et la réponse faite à la directrice.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la réponse de la semaine 1 (trancher pour le jour, trancher pour la nuit, réunir, apaiser) et celle de la semaine 8 à la chute de Mme Sarkissian. Un binôme qui a fini tôt refait le compte des toilettes du matin : 60 à faire, 18 levées la nuit, 40 tenues par le jour.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées, puis vous reconstruisez le calcul avec la classe à partir de la source des ressources humaines : les heures d'une veilleuse sur le trimestre, l'heure d'intérim hors taxes, la TVA que l'association ne récupère pas. Vous faites expliquer les valeurs éloignées (22,1, 24,2 ou 53 k€), puis vous mettez le chiffre en face de l'enveloppe : deux veilleuses parties, c'est déjà les quatre cinquièmes des 65 k€.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 et de la semaine 8. Pour la semaine 1, vous faites lire la relecture des plans de soins : treize levers sur une liste que ni l'IDEC ni le médecin coordonnateur n'ont validée, et deux toilettes par jour que le jour met sur le compte de la nuit. Pour la semaine 8, vous faites lire l'analyse de Madeleine Sirugue : le plan de soins disait 8 h, la liste disait 5 h 30, et la tension basse notée la veille n'est jamais arrivée à la nuit.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 2, « Faire travailler les deux équipes ensemble » finit 9,3 k€ sous l'enveloppe (55,7 k€ de coût), « Trancher et imposer » la dépasse de 25,8 k€ et l'attente de 14,6 k€ : trancher fait pire que ne rien faire. Vous montrez ensuite l'avertissement de la semaine 8 : il fait mieux que l'analyse sans coupable 11 fois sur 30, et perd 3,4 k€ en moyenne. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : avant de trancher un conflit, regarder qui fait quoi, à quelle heure, et qui l'a décidé. Vous la déclinez en trois gestes : mettre les faits sur la table devant les deux équipes, protéger un temps où elles se parlent, et l'inscrire au roulement pour qu'il passe l'hiver. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 26.48,
    etapes: [
      "Source « Chiffrer avec les ressources humaines le remplacement d'une veilleuse » : une veilleuse à temps plein fait sept nuits de dix heures par quinzaine, soit 3,5 nuits et 35 heures par semaine.",
      "Sur un trimestre de 13 semaines : 35 × 13 = 455 heures de nuit.",
      "Même source : Soralis Intérim Santé facture l'heure 48,50 € hors taxes, et l'association ne récupère pas la TVA à 20 % : 48,50 × 1,20 = 58,20 € par heure.",
      "Coût du poste tenu en intérim tout le trimestre : 455 × 58,20 = 26 481 €, soit 26,48 k€. Le chiffre ne dépend pas du hasard ; l'épisode le juge juste à 0,5 k€ près, proche à 2 k€.",
      "Pour comparer : la même veilleuse salariée coûte 455 × 29 = 13 195 €. Chaque départ double à peu près le coût de son poste, et l'enveloppe du trimestre est de 65 k€.",
    ],
    erreurs: [
      {
        valeur: 22.07,
        cause:
          "Le tarif hors taxes est retenu (455 × 48,50) : l'association ne récupère pas la TVA, elle paie 58,20 € de l'heure.",
      },
      {
        valeur: 24.21,
        cause:
          "La règle des trois nuits sur quatre est appliquée (trois quarts d'intérim à 58,20 €, un quart de rappels sur repos à 38,25 €) : c'est ce qui se passera, mais la question porte sur un poste tenu en intérim tout le trimestre.",
      },
      {
        valeur: 52.96,
        cause:
          "Sept nuits par semaine au lieu de sept nuits par quinzaine (7 × 13 × 10 × 58,20) : c'est le coût de deux veilleuses.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Les toilettes de la liste ne sont pas faites, et une note de service règle la question dès lundi, sans rien coûter.",
      ceQuiLeDejoue:
        "La relecture des plans de soins montre que la liste des 5 h 30 a été écrite par l'équipe du matin en octobre, jamais validée par l'IDEC ni par le médecin coordonnateur, et que 12 des 31 chutes de l'automne ont eu lieu entre 5 h et 8 h chez des résidents levés avant 6 h 45. Smaranda le dit : ce n'est pas la nuit qu'elle fuit, ce sont les levers de 5 h 30 pour une équipe qui l'accuse. Rejouée sur les trente tirages à la place des deux réunions, la note perd 13 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 1,
      pourquoi:
        "Une résidente a chuté à 5 h 40, la famille parle de l'ARS : un avertissement montre que la direction prend l'incident au sérieux.",
      ceQuiLeDejoue:
        "L'analyse de Madeleine Sirugue : le plan de soins de Mme Sarkissian dit qu'elle dort jusqu'à 8 h, Penda Diabaté l'a levée comme la liste le demandait, et la tension basse notée la veille n'est jamais arrivée à la nuit. L'événement tient à l'organisation ; les familles reçues pour entendre ce qui change ne saisissent presque jamais l'ARS, contre une fois sur deux avec un courrier. Rejoué sur les trente tirages à la place de l'analyse sans coupable, l'avertissement perd 3,4 k€ en moyenne et ne fait mieux que 11 fois sur 30.",
    },
    {
      decision: 5,
      option: 1,
      pourquoi:
        "Avec quatre semaines de nuit par trimestre pour chacun, plus de demandes de mutation, et chacun comprendrait enfin le travail de l'autre.",
      ceQuiLeDejoue:
        "L'enquête auprès des deux équipes : cinq veilleuses sur huit ont choisi la nuit pour leurs enfants ou un conjoint en horaires de jour, et une douzaine d'aides-soignants de jour ne connaissent pas les résidents à 3 h. À Chalon-sur-Saône, une rotation imposée a fait partir trois veilleuses et deux aides-soignants de jour dans le trimestre. Ce que les équipes demandent, ce sont des temps pour se parler, à 500 € la réunion mensuelle. Rejouée sur les trente tirages à la place des temps communs, la rotation perd 7,4 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, Rokhaya accuse la nuit et Penda accuse le jour. Qu'est-ce qui, dans les plans de soins, montrait que ni l'une ni l'autre ne mentait, et que le problème venait d'une liste que personne n'avait décidée ?",
    "Le questionnaire de climat ne distinguait pas Grésilles des autres EHPAD. Pourquoi une mesure du climat ne dit-elle rien de la cause d'un conflit ? Quelle source le disait ?",
    "Une veilleuse en intérim coûte 26,5 k€ le trimestre, et Soralis ne fournit que trois nuits sur quatre. Que vous coûtait un départ de nuit, et qu'est-ce qui, dans les entretiens de Smaranda et Nacéra, aurait pu les retenir ?",
    "Pourquoi des transmissions écrites dans Carnéo ne remplacent-elles pas quinze minutes assises ? Que mesure chacun des deux chiffres : une aide-soignante sur trois qui lit les notes avant 10 h, trois minutes debout dans le couloir ?",
    "Sous le tirage n° 2, trancher et imposer finit plus loin de l'enveloppe que ne rien faire (−25,8 k€ contre −14,6 k€). Comment des décisions rapides et gratuites peuvent-elles coûter plus que l'attente ?",
    "L'avertissement à Penda fait mieux que l'analyse sans coupable 11 fois sur 30. Le fait d'avoir eu de bons résultats prouve-t-il qu'il était juste ? Qu'est-ce qu'un avertissement fait à la déclaration des événements suivants ?",
    "Quelle règle gardez-vous pour un conflit entre deux équipes qui ne se croisent qu'un quart d'heure ? Formulez-la en une phrase.",
  ],
  prolongement: {
    enonce:
      "Un service de soins de suite emploie six infirmières de nuit. Une infirmière à temps plein fait 3,5 nuits de dix heures par semaine ; salariée, son heure coûte 34 € chargés ; une agence facture l'heure de nuit 55 € hors taxes, et l'établissement ne récupère pas la TVA à 20 %. 1) Que coûte une infirmière de nuit tenue en intérim pendant un trimestre de 13 semaines ? 2) Combien de plus qu'une infirmière salariée ? 3) Deux infirmières demandent leur mutation de jour ; un temps commun mensuel d'une heure avec l'équipe de jour coûte 450 € la réunion. Combien de réunions mensuelles paie le surcoût d'un seul départ sur le trimestre ?",
    corrige:
      "1) 3,5 × 13 × 10 = 455 heures ; 55 × 1,20 = 66 € de l'heure ; 455 × 66 = 30 030 €. 2) Salariée : 455 × 34 = 15 470 € ; surcoût de 30 030 − 15 470 = 14 560 €. 3) 14 560 / 450 ≈ 32 réunions, soit plus de deux ans et demi de réunions mensuelles pour le surcoût d'un trimestre d'intérim.",
  },
  evaluation: [
    "Le coût du poste de veilleuse en intérim est calculé juste (heures du trimestre, tarif hors taxes, TVA non récupérable), à partir de la source nommée.",
    "Le diagnostic s'appuie sur les faits de l'activité (la liste des 5 h 30, les toilettes du matin, les transmissions) et non sur les caractères ou le climat déclaré.",
    "La régulation choisie fait travailler les deux équipes sur ces faits, et les temps communs sont inscrits dans l'organisation pour durer.",
    "La réponse à la chute de Mme Sarkissian porte sur l'organisation, sans faute individuelle, et dit à la famille ce qui change.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 2.",
  ],
  vigilance:
    "L'épisode fixe le temps plein d'une veilleuse à sept nuits de dix heures par quinzaine, la majoration d'une heure de rappel sur repos à 25 % plus une prime, et pose que l'association ne récupère pas la TVA sur l'intérim : ce sont des conventions de l'épisode. La durée des postes de nuit, les repos et les majorations relèvent du code du travail et de la convention collective applicable, qu'un enseignant voudra vérifier avant de les présenter comme une règle. Un avertissement est une sanction disciplinaire encadrée par une procédure : l'épisode n'en détaille pas les conditions.",
};
