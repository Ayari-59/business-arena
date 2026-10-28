/**
 * FICHE ENSEIGNANT · ÉPISODE 83, LES SORTIES QUI BLOQUENT.
 *
 * Le parcours du patient en soins médicaux et de réadaptation : une durée de
 * séjour qui s'allonge vient de l'aval, pas des soins. Le piège est d'ajouter
 * des lits ou de presser les sorties avant que l'aval soit prêt.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "sorties-qui-bloquent",
  formations: ["bac-pro-agora", "stmg", "but-gea"],
  programme: [
    "Bac pro AGORA · Bloc 1, Gérer des relations avec les clients, les usagers et les adhérents",
    "STMG · Terminale, enseignement commun, Thème 1 · Les organisations et l'activité de production de biens et de services",
    "BUT GEA · Aider à la prise de décision",
  ],
  notion:
    "Une durée moyenne de séjour se décompose : la durée des soins, plus l'attente de la sortie. L'erreur classique consiste à lire un service plein comme un manque de lits, ou comme des médecins qui gardent trop leurs patients, et à répondre par des lits en plus ou par une durée cible. Dans l'épisode, la clinique du Val Solvanne, SMR de 120 lits de l'Association Solvanne à Dijon, est passée de 28 à 34 jours de durée moyenne de séjour, le CHU attend dix jours une place, et le président du conseil d'administration veut rouvrir les quinze lits de l'aile Est. La revue des dossiers du DIM montre que les soins durent toujours 28 jours : 21 patients sur 116 présents sont médicalement sortants, et attendent une place en EHPAD (11), un SSIAD ou une aide (4), un aménagement du domicile (4) ou une mesure de protection (2), parce que les demandes partent le jour où le médecin déclare la sortie. Au rythme d'aujourd'hui, cela fait 1 911 journées de lit bloquées sur le trimestre. L'élève découvre que des lits en plus se remplissent des mêmes séjours bloqués, qu'une sortie avant que l'aide ou le domicile soient prêts fait revenir un patient sur trois par les urgences, et que la durée de séjour se raccourcit en préparant la sortie dès l'entrée, en reprenant les dossiers et en passant des conventions avec l'aval.",
  objectifs: [
    "Je décompose une durée moyenne de séjour en durée des soins et en attente de la sortie, à partir d'une revue des dossiers.",
    "Je calcule des journées bloquées sur une période et je les traduis en admissions refusées.",
    "Je compare une mesure de capacité (des lits) à une mesure de parcours (la sortie préparée) sur ce qu'elle coûte et sur ce qu'elle libère.",
    "Je repère le risque d'une sortie prématurée pour le patient, et je le chiffre avec la source de la qualité.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de parcours de l'usager, de taux d'occupation et de durée moyenne de séjour doivent être connues ; une multiplication suffit pour le calcul. Les acteurs de l'aval (EHPAD, SSIAD, service d'aide à domicile, aide sociale, mesure de protection) peuvent être présentés en quelques minutes avant de jouer.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/sorties-qui-bloquent?hasard=8 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous présentez la clinique en deux phrases (120 lits, 34 jours de séjour contre 28, un conseil qui veut des lits) sans parler de l'aval, et vous demandez de noter sur papier la prévision de journées bloquées de la semaine 1, avec son calcul, et la proposition faite au conseil.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la proposition au conseil (aile Est, sortie préparée, durée cible, attente), la convention de la semaine 5 et la réponse de la semaine 7 aux patients qui attendent des travaux : c'est là que la classe se partage le plus. Un binôme qui a fini tôt reconstitue les 21 patients bloqués par motif d'attente.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées, de la plus basse à la plus haute, puis vous refaites le calcul avec la classe à partir de la revue du DIM : 21 patients, chaque jour, pendant 91 jours. Vous faites expliquer les valeurs éloignées (315, 273 ou 1 365), puis vous vérifiez l'ordre de grandeur par l'autre bout : six jours de séjour en plus pour 24 admissions par semaine donnent à peu près le même total. Vous terminez par la question : combien de patients du CHU ces lits auraient-ils accueillis ?",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 5 et de la semaine 7. Pour l'aile Est, faites calculer ce qu'elle coûte (12 000 € puis 15 500 € par semaine des semaines 5 à 13) et ce qu'elle libère si quatre patients sur dix y attendent aussi leur aval. Pour la convention, rappelez que les directeurs d'EHPAD ont une chance sur deux de signer, et qu'une place réservée part au suivant sans dossier prêt. Pour la semaine 7, faites lire la source de la qualité : un patient sur trois rentré sans aménagement revient par les urgences.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 8, « Préparer la sortie dès l'entrée » finit à 36,9 k€ sous l'EPRD, adressages perdus compris, « Attentiste » à 84,8 k€ sous et « Des lits et une durée cible » à 216,2 k€ sous. Vous prévenez que ce tirage est dur : les directeurs d'EHPAD de l'association refusent la convention, et l'orthopédie du CHU bascule dès la semaine 1, quelles que soient les décisions. Vous faites lire la décision de la semaine 7 : laisser rentrer sans aménagement fait mieux 18 fois sur 30, et perd pourtant 11 k€ en moyenne. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la relation de l'épisode : durée de séjour = soins + attente de la sortie, et journées bloquées = patients médicalement sortants × jours. Vous en tirez la règle : on libère des lits par l'aval (sortie préparée dès l'entrée, dossiers repris, places conventionnées, domicile adapté), jamais par une sortie qui met le patient en danger. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 1911,
    etapes: [
      "Source « Faire avec le DIM une revue des dossiers des patients présents » : le jour de la revue, 21 patients sur 116 sont médicalement sortants (11 attendent une place en EHPAD, 4 un SSIAD ou une aide à domicile, 4 l'aménagement de leur domicile, 2 une mesure de protection).",
      "Même source : depuis trois mois, le nombre de patients bloqués ne baisse pas. Au rythme d'aujourd'hui, 21 lits sont donc occupés chaque jour par un patient qui n'a plus besoin de soins.",
      "Le trimestre compte 13 semaines, soit 13 × 7 = 91 jours.",
      "Journées bloquées sur le trimestre : 21 × 91 = 1 911 journées. Le chiffre ne dépend pas du hasard : toute la classe doit trouver la même valeur ; l'épisode la juge juste à 100 journées près, proche à 300.",
      "Contrôle par la durée de séjour : 34 jours contre 28 de soins, soit 6 jours d'attente pour chacune des 24 admissions de la semaine (source « Reprendre avec Solal les admissions et les demandes ») : 6 × 24 × 13 = 1 872 journées, le même ordre de grandeur.",
    ],
    erreurs: [
      {
        valeur: 315,
        cause:
          "Les 21 patients multipliés par leur attente moyenne de 15 jours : c'est l'attente d'un patient, comptée une seule fois, alors que d'autres patients bloqués prennent leur place tout le trimestre.",
      },
      {
        valeur: 273,
        cause:
          "Les 21 patients multipliés par les 13 semaines : des patients semaines, pas des journées ; il manque le × 7.",
      },
      {
        valeur: 1365,
        cause:
          "Les 21 patients multipliés par 5 jours ouvrés et 13 semaines : un lit bloqué l'est aussi le samedi et le dimanche.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Le CHU attend, les lits sont pleins à 97 %, l'ARS autorise toujours les quinze lits, et le président du conseil le demande.",
      ceQuiLeDejoue:
        "La revue du DIM montre que les soins durent toujours 28 jours et que 21 lits sont pris par des patients médicalement sortants ; Ursule Mauvernay rappelle que le CPOM engage sur la durée de séjour, pas sur le nombre de lits. Eudoxie Rambourg chiffre l'aile à 12 000 € de remise en état et 15 500 € de personnel par semaine dès la semaine 5, pour des lits qui se remplissent des mêmes séjours bloqués. Rejouée sur les trente tirages à la place de la sortie préparée, la réouverture perd 78 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Une durée cible de 28 jours ne coûte rien, et la durée de séjour est l'engagement du CPOM : il suffit de la demander aux médecins.",
      ceQuiLeDejoue:
        "Le Dr Maïder Arrighi le dit dès le lundi : les rééducations ne sont pas plus longues qu'avant, et une durée cible ne trouve pas de place en EHPAD ; elle pousse à sortir ceux qui peuvent rentrer chez eux, prêts ou non. Aude Lantenois chiffre ce que deviennent ces sorties : un sur trois revient par les urgences, 2 800 € chaque fois, et le CHU les compte. Rejouée sur les trente tirages, la durée cible perd 86 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 1,
      pourquoi:
        "Huit patients attendent une aide ou des travaux, leurs familles sont là et prêtes à les reprendre : on libère autant de lits dès la semaine 4.",
      ceQuiLeDejoue:
        "La source « Demander à la qualité ce que deviennent les sorties sans aide prête » : l'an dernier, un patient sur trois rentré avant que son aide ou son aménagement soient en place est revenu par les urgences, le plus souvent après une chute, pour 2 800 € chacun. Ramatoulaye Soumaré indique que 9 des 21 dossiers attendent encore une pièce, et qu'une cellule de sortie les boucle trois fois plus vite pour 3 500 €. Rejoué sur les trente tirages, le retour en famille perd 10 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Ces patients n'ont plus rien à faire à la clinique, les familles sont prêtes, et les artisans parlent de début décembre : pourquoi les garder ?",
      ceQuiLeDejoue:
        "Aude Lantenois redit le chiffre : un patient sur trois qui rentre sans aménagement ni aide revient dans le mois, après une chute le plus souvent. Tifenn Kervadec propose une visite à domicile et des aides techniques louées, avec les passages du SAAD, pour 500 € par semaine : l'attente des travaux passe d'une dizaine de jours à moins de deux. Rejouée sur les trente tirages à la place de l'aménagement provisoire, la sortie sans aménagement fait mieux 18 fois, mais perd 11 k€ en moyenne : quand les retours aux urgences font basculer un service du CHU, la perte dépasse 25 k€.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "L'épidémie arrive, le CHU adresse un cinquième de demandes en plus : dix lits de renfort paraissent la réponse évidente, et l'intérim est disponible.",
      ceQuiLeDejoue:
        "Le devis de Soralis Intérim Santé : 5 000 € de préparation et 12 500 € par semaine des semaines 10 à 13, avec des intérimaires qui ne connaissent pas les patients. Solal Benhamza montre qu'un tiers des sorties se fait après 16 heures et aucune le samedi : sortir avant midi et le samedi fait passer l'occupation de 97 à 99 %, l'équivalent de 2,4 lits, pour 900 € par semaine, avec deux places par jour réservées au CHU. Rejoué sur les trente tirages, le renfort perd 27 k€ en moyenne et ne fait mieux que 2 fois.",
    },
    {
      decision: 5,
      option: 2,
      pourquoi:
        "Beaucoup de patients presque prêts voudraient passer Noël chez eux : des lits libérés avant les fêtes, des familles contentes.",
      ceQuiLeDejoue:
        "La source « Demander à la qualité ce que deviennent les sorties avancées pour Noël » : l'an dernier, un patient sur quatre aux soins écourtés est revenu en janvier, un sur trois parmi ceux dont l'aide n'était pas prête. Ramatoulaye Soumaré montre qu'en programmant les entrées en EHPAD et au SSIAD avant le 23 décembre, avec une permanence à 1 500 €, l'attente reste celle d'un mois ordinaire. Rejouées sur les trente tirages, les sorties de Noël perdent 38 k€ en moyenne et ne font jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu un manque de lits, d'autres des médecins trop lents, d'autres l'aval. Qu'est-ce qui, dans la revue du DIM, permettait de trancher ? Que disaient les 28 jours de soins ?",
    "1 911 journées bloquées : combien de patients du CHU auraient pu entrer dans ces lits, avec des soins de quatre semaines ? Pourquoi quinze lits de plus ne règlent-ils pas ce chiffre ?",
    "Faire rentrer un patient chez lui libère un lit tout de suite. Qu'est-ce qui distingue une sortie préparée d'une sortie prématurée ? Qui paie le retour par les urgences, et qui le reproche ?",
    "Sous le tirage n° 8, les directeurs d'EHPAD de l'association ont refusé la convention, et ceux qui l'ont imposée par le comité de direction ont fini plus haut. Sur les trente tirages, l'imposer fait mieux 13 fois et perd 2,6 k€ en moyenne. Que pèse, en plus, une convention imposée à des directeurs qui ont leurs propres listes d'attente ?",
    "En semaine 7, laisser rentrer sans aménagement fait mieux 18 fois sur 30 et perd 11 k€ en moyenne. Comment une décision peut-elle gagner le plus souvent et rester mauvaise ? Et que vaut ce calcul quand le risque est une chute à domicile ?",
    "Sous le tirage n° 8, « Des lits et une durée cible » finit 179 k€ sous la sortie préparée, et 131 k€ sous l'attente. Comment des mesures prises pour accueillir plus peuvent-elles faire moins bien que ne rien changer ?",
    "Quelle règle présentez-vous au conseil d'administration à la place de l'aile Est ? Formulez-la en une phrase, avec un indicateur dedans.",
  ],
  prolongement: {
    enonce:
      "Un SMR de 80 lits a une durée de soins de 21 jours, et 12 patients médicalement sortants occupent un lit en permanence. Un séjour rapporte 3 000 € de recette nette. 1) Combien de journées bloquées sur un trimestre de 13 semaines ? 2) Combien d'admissions par semaine ces 12 lits permettraient-ils, avec des soins de trois semaines, et combien sur le trimestre ? Quelle recette cela représente-t-il ? 3) On propose d'ouvrir 10 lits pour 10 000 € par semaine pendant 13 semaines ; quatre lits sur dix se remplissent de patients qui attendent eux aussi leur aval. Que rapportent ces lits, et que coûtent-ils ? 4) Préparer la sortie dès l'entrée ramènerait les patients bloqués de 12 à 7, pour 1 000 € par semaine. Que rapporte cette mesure sur le trimestre, et que coûte-t-elle ?",
    corrige:
      "1) 12 × 91 = 1 092 journées. 2) 12 lits / 3 semaines = 4 admissions par semaine, soit 52 sur le trimestre et 52 × 3 000 = 156 000 € de recette. 3) Six lits sur dix servent aux soins : 6 / 3 = 2 admissions par semaine, 26 sur le trimestre, 78 000 € de recette, pour 13 × 10 000 = 130 000 € de coût : 52 000 € de perte. 4) Cinq lits libérés : 5 / 3 ≈ 1,67 admission par semaine, environ 21,7 séjours sur le trimestre, soit environ 65 000 € de recette, pour 13 000 € de coût : environ 52 000 € de gain.",
  },
  evaluation: [
    "La prévision de journées bloquées est juste (21 patients × 91 jours = 1 911), et l'élève sait la vérifier par la durée de séjour.",
    "Le diagnostic sépare la durée des soins, stable à 28 jours, de l'attente de l'aval, avec les chiffres de la revue du DIM.",
    "Chaque mesure de capacité (aile Est, renfort d'hiver) est comparée à une mesure de parcours sur ce qu'elle coûte et sur les lits qu'elle libère vraiment.",
    "Aucune sortie n'est décidée sans que l'aide ou le domicile soient prêts, et l'élève cite le risque chiffré par la qualité.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 8.",
  ],
  vigilance:
    "L'épisode simplifie le financement d'un SMR (une recette d'activité moyenne par séjour, une journée au-delà de la borne haute qui ne rapporte presque rien, une dotation figée) : la réforme du financement des SMR combine dotation et activité, et un enseignant de la filière voudra préciser ce point. Les règles de l'hébergement temporaire en sortie d'hospitalisation (trente jours, reste à charge ramené au forfait journalier, financement de l'ARS), de l'habilitation familiale et de la saisine du juge des tutelles sont reprises telles que l'épisode les pose et sont à vérifier sur les textes en vigueur. La décision de sortie reste médicale : la fiche ne doit pas laisser croire qu'un directeur la prend.",
};
