/**
 * FICHE ENSEIGNANT · ÉPISODE 95, RECONSTRUIRE OU REGROUPER.
 *
 * Un choix d'investissement se juge sur ses flux différentiels actualisés et
 * sur ce qu'il fait payer, pas sur son coût de construction : dans un EHPAD
 * habilité à l'aide sociale, les résidents paient l'immobilier par le prix de
 * journée, sous le plafond du département. Les chiffres du hasard de la
 * classe sont ceux de la graine 12, les moyennes celles des 30 tirages du
 * bilan.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "reconstruire-ou-regrouper",
  formations: ["dcg", "bts-cg", "but-gea"],
  programme: [
    "DCG · UE 6, Finance d'entreprise",
    "BTS CG · Processus 6, Analyse de la situation financière",
    "BUT GEA · Aider à la prise de décision",
  ],
  notion:
    "Trois projets immobiliers ne se comparent ni à leur coût de construction ni à leur taille : ils se comparent à ce que chacun change pour l'organisation, année après année (les flux différentiels), actualisés, et, dans un établissement dont les résidents paient l'immobilier, à la hausse de prix qu'ils imposent. L'erreur classique consiste à choisir la voie la moins chère à construire, ou la plus grande « pour les économies d'échelle », puis à déposer vite un dossier d'aide et à présenter ses charges sans regarder le plafond. Dans l'épisode, l'Association Solvanne doit traiter deux EHPAD vétustes, Auxonne (64 places) et Montbard (70 places) : rénover les deux coûte 7,2 M€, regrouper à Is-sur-Tille 17,6 M€, reconstruire Montbard et transformer Auxonne 12,05 M€ ; le département plafonne la hausse du prix de journée à 10 € par jour à la mise en service, puis à 1,50 € de rattrapage par an. Reconstruire Montbard impose, hors aide, une hausse de 17,75 € par jour. L'élève découvre que la voie la plus chère à construire peut créer le plus de valeur, que l'aide à l'investissement se gagne par un dossier fondé sur les besoins et l'avis des élus, et qu'un écart au plafond se traite par un rattrapage prévu au plan, pas en sortant des places de l'habilitation.",
  objectifs: [
    "Je calcule la hausse du prix de journée qu'impose un investissement, à partir des amortissements, des intérêts, des charges qui disparaissent et des journées retenues par le financeur.",
    "Je compare des projets sur leurs flux différentiels actualisés, et non sur leur coût de construction.",
    "Je confronte une hausse de prix à une contrainte réglementaire (un plafond, un rattrapage, une réserve) et j'en tire le déficit qui reste.",
    "Je décide de ce que j'attends d'une information (une étude, des sondages, un schéma) avant de figer un programme.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "L'amortissement linéaire, les intérêts d'un emprunt, l'actualisation et la VAN doivent avoir été vus en cours. La tarification de l'hébergement en EHPAD (prix de journée, habilitation à l'aide sociale, rôle du département) peut être présentée en quelques minutes avant de jouer.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/reconstruire-ou-regrouper?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous présentez les deux EHPAD en deux phrases (vétustes, des chambres doubles, trois ans pour les normes incendie) sans parler de prix de journée, et vous demandez de noter sur papier la hausse calculée en semaine 1 et la voie recommandée au conseil.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la voie de la semaine 1 et la façon de présenter la hausse en semaine 4, où la classe se partage entre la hausse entière, le rattrapage et la sortie de l'habilitation. Un binôme qui a fini tôt calcule la hausse de Montbard avec une aide de 25 % du coût.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées, puis vous reconstruisez le calcul avec la classe à partir du plan de financement et de la règle du département : amortissements, intérêts de la première année, charges qui disparaissent, économies, journées à 97 %. Vous faites expliquer les valeurs éloignées (21,4, 21,8 ou 16 €), puis vous mettez le chiffre en face du plafond : 7,75 € au-dessus de ce que le département accepte à l'ouverture.",
    },
    {
      minutes: 20,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 (rénover, regrouper, reconstruire et transformer, normes seules) et de la semaine 2 (déposer vite, étude et concertation, concertation seule). Pour la semaine 1, vous faites relire ce que la rénovation laisse : 48 places en chambres doubles et des dépassements que le plan ne couvre pas. Pour la semaine 2, vous faites lire ce que le comité a financé l'an dernier : six dossiers retenus sur sept avaient une étude de besoins et l'avis des élus, et la date de dépôt ne compte pas.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 12, la méthode des flux différentiels crée 1 416 k€ de valeur : l'aide de 2,6 M€ a été accordée, le département a accepté un rattrapage sur cinq ans, et la friche du bourg n'avait pas d'argiles. La voie la moins chère détruit 684 k€, l'attente 1 453 k€. Vous prévenez que ce résultat est très bruité (de −373 à +1 996 k€ selon les tirages) et vous montrez le dépôt immédiat du dossier : il fait mieux que la concertation 16 fois sur 30, et perd pourtant 482 k€ en moyenne.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : comparer des voies sur ce qu'elles changent, actualisé, et sur ce qu'elles font payer, au regard du plafond. Vous la déclinez en trois gestes : refaire soi-même la hausse avec les charges qui disparaissent, gagner l'aide par un dossier fondé sur les besoins, et dire tôt aux familles ce qui change et ce qui les protège. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 17.75,
    etapes: [
      "Source « Relire le plan de financement de Montbard et la règle du département » : 8,75 M€ toutes dépenses comprises, amortis par composants sur trente-cinq ans en moyenne, soit 8 750 000 / 35 = 250 000 € d'amortissements par an.",
      "Même source : 0,75 M€ de fonds propres et 8,0 M€ d'emprunt à 3,5 % ; intérêts de la première année : 8 000 000 × 0,035 = 280 000 €.",
      "Ce qui disparaît avec l'ancien bâtiment : 62 000 € de charges par an ; ce que le neuf économise : 28 000 € d'énergie et d'entretien. Charge nette à couvrir : 250 000 + 280 000 − 62 000 − 28 000 = 440 000 €.",
      "Journées retenues par le département, à 97 % d'occupation : 70 × 365 × 0,97 = 24 783,5 journées.",
      "Hausse du prix de journée hébergement, hors aide : 440 000 / 24 783,5 ≈ 17,75 € par jour. Le chiffre ne dépend pas du hasard ; l'épisode le juge juste à 0,50 € près, proche à 1,50 €. Il dépasse de 7,75 € le plafond de 10 € à la mise en service.",
    ],
    erreurs: [
      {
        valeur: 21.39,
        cause:
          "Les charges qui disparaissent (62 000 €) et les économies (28 000 €) sont oubliées : 530 000 / 24 783,5. C'est le conseil de Mihaela Vasilescu : refaire la hausse avec ce qui disparaît.",
      },
      {
        valeur: 21.79,
        cause:
          "Le bâtiment est amorti sur la durée de l'emprunt, vingt-cinq ans (350 000 € par an) au lieu de trente-cinq : (350 000 + 280 000 − 90 000) / 24 783,5.",
      },
      {
        valeur: 15.95,
        cause:
          "L'annuité de l'emprunt (environ 485 400 € par an sur vingt-cinq ans à 3,5 %) remplace les amortissements et les intérêts : la règle du département porte sur les charges du compte de résultat, pas sur le remboursement du capital.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "7,2 M€, la moitié du reste, et la seule voie sous le plafond de 10 € : Eudoxie Rambourg le dit avant le conseil, c'est la raison.",
      ceQuiLeDejoue:
        "La mise au même format des trois voies : la rénovation laisse 48 places en chambres doubles, gèle 540 k€ de places pendant trente mois de travaux en site occupé, dépasse en moyenne de 9 % au-delà des aléas, jusqu'à 22 %, et son occupation tombe à 89,5 % si le domicile se développe. L'ARS finance une rénovation à l'identique sur six. Rejouée sur les trente tirages à la place de la reconstruction de Montbard et de la transformation d'Auxonne, elle perd 2 171 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 1,
      pourquoi:
        "Les groupes privés font des établissements de 120 places : un seul EHPAD, c'est une équipe de nuit, une cuisine et une direction de moins.",
      ceQuiLeDejoue:
        "Le regroupement coûte 17,6 M€ et impose 15 € de hausse ; ses économies d'échelle (150 k€ par an) ne paient pas 820 k€ de transition, quatre salariés sur dix qui ne feront pas 45 minutes de route, et le transfert des autorisations peut être refusé. Le comité de l'ARS n'a financé aucun regroupement qui éloignait l'offre d'un canton rural. Rejoué sur les trente tirages à la place de la voie mixte, le regroupement perd 1 306 k€ en moyenne et ne fait mieux que 10 fois sur 30.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "L'enveloppe est limitée : déposer tout de suite, c'est être parmi les premiers servis, et cela ne coûte rien.",
      ceQuiLeDejoue:
        "L'ARS dit ce que le comité a financé l'an dernier : sept dossiers sur dix-neuf, dont six avec une étude de besoins récente et l'avis des élus et du conseil de la vie sociale, et la date de dépôt ne compte pas. L'étude coûte 32 k€ quand l'aide vaut 20 à 25 % du coût. Sous le tirage n° 12, le dépôt immédiat perd l'aide et 1 441 k€ ; rejoué sur les trente tirages à la place de l'étude et de la concertation, il perd 482 k€ en moyenne, même s'il fait mieux 16 fois sur 30.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Nos charges d'investissement sont opposables : présentons-les en entier, le département suivra.",
      ceQuiLeDejoue:
        "La règle du département est écrite dans le plan de financement : la hausse est plafonnée à 10 € par jour à la mise en service, puis à 1,50 € de rattrapage par an si le rattrapage est prévu au plan et l'écart couvert par la réserve de compensation de 1,2 M€. Présentée en une fois, la hausse est ramenée à 10 €, et l'écart reste au déficit d'hébergement pendant dix-huit ans. Rejouée sur les trente tirages à la place du rattrapage, la hausse entière perd 766 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Le conseil a voté un programme, l'architecte doit le figer : le rouvrir tous les mois, c'est ne jamais construire.",
      ceQuiLeDejoue:
        "L'architecte chiffre ce qu'un ajustement change : 30 k€ par an de mieux si le besoin monte, 10 k€ s'il est stable, 40 k€ si le domicile se développe, et le comité de l'ARS donne plus de chances à un programme ajusté aux besoins. Le dossier ne part que fin octobre : une semaine de reprise des plans ne le retarde pas. Rejoué sur les trente tirages à la place de l'ajustement, le maintien perd 413 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "La zone d'activités, c'est 250 k€ de moins, un terrain plat et sondé : pour une fois, le moins cher ne se discute pas.",
      ceQuiLeDejoue:
        "La comparaison des terrains : à trois kilomètres du bourg, sans commerce ni transport, les admissions perdraient environ 5 points d'occupation, et le comité de l'ARS regarde l'insertion dans la ville ; 33 des 41 familles qui ont répondu viennent à pied ou en passant. Le risque de la friche (des argiles, 1,5 M€) se lit dans les sondages de la semaine 10. Rejouée sur les trente tirages à la place de la friche, la zone d'activités perd 329 k€ en moyenne et ne fait mieux que 8 fois sur 30.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "L'aide n'est pas votée, le prix non plus : annoncer une hausse aujourd'hui, c'est inquiéter pour rien.",
      ceQuiLeDejoue:
        "À Beaune, rien n'avait été dit pendant six mois : un article a annoncé une « hausse de 30 % », trois familles ont retiré leur demande, deux résidents et deux soignantes sont partis. Le conseil de la vie sociale doit être consulté sur les travaux et l'évolution des prix, et les bénéficiaires de l'aide sociale ne paient pas la hausse. Rejoué sur les trente tirages à la place de la présentation au conseil de la vie sociale, le silence perd 55 k€ en moyenne, même s'il fait mieux 14 fois sur 30, quand la rumeur ne part pas.",
    },
  ],
  debrief: [
    "En semaine 1, Eudoxie Rambourg défendait la voie la moins chère et le président celle des économies d'échelle. Qu'est-ce que la mise au même format des trois voies permettait de comparer, que le coût de construction ne dit pas ?",
    "La hausse de Montbard vaut 17,75 € par jour hors aide. Pourquoi le département la calcule-t-il sur les amortissements et les intérêts, et pas sur l'annuité de l'emprunt ? Pourquoi sur des journées à 97 % et non sur l'occupation réelle ?",
    "Un écart de 7,75 € au-dessus du plafond : que devient-il si la hausse est présentée en entier, avec un rattrapage prévu au plan, ou en sortant 30 % des places de l'habilitation ? Qui le paie dans chaque cas ?",
    "Sous le tirage n° 12, l'aide a été accordée et la friche n'avait pas d'argiles. Le dépôt immédiat fait mieux que la concertation 16 fois sur 30 et perd pourtant 482 k€ en moyenne : comment est-ce possible ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "La VAN de la meilleure méthode va de −373 à +1 996 k€ selon les tirages. Si l'on jugeait la directrice du patrimoine sur le seul résultat de son trimestre, que jugerait-on ?",
    "En semaine 6, l'étude de besoins ou les demandes d'admission disaient un scénario. Que vaut une information qui arrive avant le dépôt du dossier, et une autre (le schéma départemental) qui arrive après ?",
    "Quelle règle présentez-vous au conseil d'administration pour choisir entre plusieurs projets immobiliers ? Formulez-la en une phrase, avec le plafond dedans.",
  ],
  prolongement: {
    enonce:
      "Un EHPAD de 50 places, toutes habilitées à l'aide sociale, est reconstruit pour 5,6 M€, amortis sur trente-cinq ans. Il est financé par 0,6 M€ de fonds propres et 5,0 M€ d'emprunt à 3 %. Avec l'ancien bâtiment disparaissent 40 000 € de charges par an, et le neuf économise 20 000 €. Le département calcule la hausse du prix de journée sur les amortissements et les intérêts de la première année, moins ces charges, divisés par les journées à 97 % d'occupation, et la plafonne à 10 € à la mise en service. 1) Calculez la hausse hors aide. 2) Une aide de 1,2 M€ est accordée ; elle se déduit de l'emprunt et des amortissements. Calculez la nouvelle hausse. 3) Dans chaque cas, quel écart annuel reste au déficit d'hébergement si la hausse est ramenée au plafond sans rattrapage ?",
    corrige:
      "1) Amortissements : 5 600 000 / 35 = 160 000 € ; intérêts : 5 000 000 × 0,03 = 150 000 € ; charge nette : 160 000 + 150 000 − 40 000 − 20 000 = 250 000 € ; journées : 50 × 365 × 0,97 = 17 702,5 ; hausse : 250 000 / 17 702,5 ≈ 14,12 € par jour. 2) Amortissements : 4 400 000 / 35 ≈ 125 714 € ; intérêts : 0,03 × 3 800 000 = 114 000 € ; charge nette ≈ 179 714 € ; hausse ≈ 10,15 € par jour. 3) Le plafond couvre 10 × 17 702,5 = 177 025 € : il reste 72 975 € par an sans aide, et environ 2 690 € avec l'aide. L'aide ne réduit pas seulement la hausse : elle fait presque disparaître le déficit.",
  },
  evaluation: [
    "La hausse du prix de journée de Montbard est calculée juste (amortissements, intérêts de la première année, charges qui disparaissent, journées à 97 %), à partir de la source nommée, et comparée au plafond.",
    "Le choix de la voie est argumenté par ses flux différentiels et la hausse qu'elle impose, pas par son coût de construction ou sa taille.",
    "Le traitement de l'écart au plafond est justifié par la règle du département, et l'élève dit qui paie l'écart selon la présentation retenue.",
    "Le dossier d'aide et le programme sont bâtis sur les besoins du territoire et l'avis des élus et du conseil de la vie sociale, avec l'information disponible avant le dépôt.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "La règle de calcul de la hausse, le plafond de 10 € par jour, le rattrapage de 1,50 € par an, la réserve de compensation des charges d'amortissement et les taux d'aide sont ceux de l'épisode : la tarification de l'hébergement en EHPAD habilité à l'aide sociale relève du code de l'action sociale et des familles et des règles propres à chaque département, qu'un enseignant de la filière voudra vérifier. La déduction fiscale d'une partie des frais d'hébergement, citée par une source, a ses conditions et ses plafonds, que l'épisode ne détaille pas.",
};
