/**
 * FICHE ENSEIGNANT · ÉPISODE 74, LE CONSULTANT STAR.
 *
 * Recadrer un comportement avec des faits datés, sans le taire parce qu'il
 * rapporte ni l'écarter parce qu'il dérange : le coût caché d'un talent qui
 * abîme l'équipe se compte en départs d'analystes et en jours non facturés.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "consultant-star",
  formations: ["bts-sam", "but-gea", "dcg", "bts-gpme"],
  programme: [
    "BTS SAM · Bloc 3, Collaboration à la gestion des ressources humaines",
    "BUT GEA · Gérer le développement des ressources humaines",
    "DCG · UE 7, Management des organisations",
  ],
  notion:
    "Un collaborateur brillant qui abîme son équipe pose deux tentations opposées : se taire parce qu'il fait 30 % du chiffre, ou l'écarter des juniors et des clients pour avoir la paix. Les deux coûtent plus cher que de lui parler. Dans l'équipe Data et SI de Bordeaux d'Atlas Conseil, Maximilien Harismendy est adoré de la Banque Dauriac et de Lagrave Aérostructures, mais il réécrit seul les livrables des analystes : ses quatre équipiers sont occupés à 55 % quand le plan de staffing vendu en prévoyait 85 %, l'engagement des analystes est à 44 sur 100 et Ilham a déjà un entretien chez Kéroual Consulting. Un départ d'analyste coûte 22 k€ au cabinet. L'élève découvre qu'un recadrage se prépare avec des faits datés et des attentes écrites, qu'il se suit (un écart sous la pression d'un comité se reprend tout de suite), et que le placard fait perdre le talent sans protéger l'équipe.",
  objectifs: [
    "Je calcule le coût d'un départ : recrutement, poste vacant et montée en compétence du remplaçant.",
    "Je prépare un recadrage avec des faits datés, leur effet sur l'équipe et des attentes écrites, plutôt qu'un reproche sur le ton.",
    "Je relie un comportement managérial à des indicateurs de gestion : occupation des analystes, jours non facturés, risque de départ.",
    "Je réponds à un écart après un recadrage au bon moment et à la bonne mesure, sans laisser faire ni sanctionner d'emblée.",
  ],
  prerequis:
    "Les notions de taux d'occupation, de coût salarial journalier et de marge d'une mission doivent être connues. Les bases de l'entretien de recadrage (les faits, leurs effets, les attentes, le suivi) peuvent être rappelées en début de séance ; le coût d'un départ se construit pendant le calcul.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/consultant-star?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de valider la semaine 1, le coût d'un départ d'analyste pour l'équipe, en k€, et le calcul qui y mène.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la réponse de la semaine 1 (se taire, recadrer avec des faits, un mot sur le ton, l'avant-vente) et celle de la semaine 8, après la nuit du comité Lagrave. Aux plus rapides, vous demandez de rejouer en changeant la seule décision de la semaine 6 : le mentorat confié tout de suite à Maximilien, ou après un essai.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées et refaites le calcul avec la classe à partir de la source de Prune Lecoeur : 8 400 € de cabinet de recrutement, 5 200 € de poste vacant, 8 400 € de montée en compétence, soit 22 k€. Vous faites expliquer les valeurs éloignées (55,6, 28 ou 8,4), en insistant sur le poste vacant : on perd le chiffre de l'analyste, mais on ne paie plus son salaire.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous partez de la semaine 1 : se taire, un mot sur le ton, le recadrage préparé ou l'avant-vente. Vous faites relire les relectures (64 commentaires dont 11 « niveau stage », un livrable réécrit et envoyé sous son seul nom, Neven coupé quatre fois en vingt minutes) et l'extraction de Tempora (55 % contre 85 % vendus). Vous enchaînez sur la semaine 8 : laisser passer, revenir avec le fait précis, l'avertissement écrit ou le retrait de Lagrave, et ce que chaque réponse dit à l'équipe.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève et sa comparaison aux trente tirages. Sous le tirage n° 12, « Recadrer avec des faits, et suivre » fait 118 k€ de marge départs déduits pour un budget de 90 k€, « L'écarter des juniors et des clients » 17 k€, et « Laisser faire » 21 k€. Vous montrez ensuite la semaine 6 : confier le mentorat à Maximilien sans essai fait mieux 16 fois sur 30, et perd pourtant 8 k€ en moyenne, parce qu'un mentorat raté finit parfois en démission. Vous faites dire ce qui distingue la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : un talent qui abîme l'équipe ne se protège ni par le silence ni par le placard. Vous la déclinez en trois gestes : des faits datés et des attentes écrites, un suivi qui reprend chaque écart tout de suite, et une place donnée aux juniors (relecture avec une grille, présentation de leur partie). Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 22,
    etapes: [
      "Source « Demander au contrôle de gestion ce que coûte un départ d'analyste » : le cabinet de recrutement prend 20 % du salaire annuel brut d'un analyste, 42 000 € : 0,20 × 42 000 = 8 400 €.",
      "Le poste vacant : 20 jours ouvrés sans facturer l'analyste (700 € par jour, occupé à 80 %, soit 560 € par jour) mais sans payer son salaire (300 € par jour ouvré charges comprises) : 20 × (560 − 300) = 20 × 260 = 5 200 €.",
      "La montée en compétence : les 15 premiers jours du remplaçant ne sont pas facturables, alors qu'il est payé : 15 × 560 = 8 400 € de chiffre perdu.",
      "Total : 8 400 + 5 200 + 8 400 = 22 000 €, soit 22 k€, provisionnés dès la démission. Le chiffre ne dépend pas du hasard. L'épisode le juge juste à 1,5 k€ près, proche à 4 k€.",
    ],
    erreurs: [
      {
        valeur: 55.6,
        cause:
          "Les 42 000 € lus comme les honoraires du cabinet (42 + 5,2 + 8,4) : c'est le salaire annuel brut, dont le cabinet prend 20 %.",
      },
      {
        valeur: 28,
        cause:
          "Le poste vacant compté au chiffre perdu sans déduire le salaire économisé (8,4 + 20 × 0,56 + 8,4) : pendant la vacance, on ne paie plus l'analyste.",
      },
      {
        valeur: 8.4,
        cause:
          "Le seul cabinet de recrutement : le poste vacant et les 15 jours non facturables du remplaçant coûtent davantage que lui.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Maximilien fait 30 % du chiffre de l'équipe, les clients le notent 9,6 et 9,2 sur 10, et Ruben Esnault a dit de le ménager : attendre les comités de juin paraît prudent.",
      ceQuiLeDejoue:
        "Tempora montre ce que coûte le silence : ses quatre équipiers sont à 55 % quand le plan vendu en prévoyait 85 %, parce qu'il fait lui-même l'analyse, et ces jours vendus ne se rattrapent pas. Les RH signalent qu'Ilham a posé une demi-journée pour un entretien extérieur, et un départ d'analyste coûte 22 k€. Ruben le précise lui-même : « Je t'ai dit de le ménager, pas de te taire. » Rejoué sur les trente tirages à la place du recadrage fondé sur des faits, le silence perd 53 k€ en moyenne ; il ne fait mieux que 2 fois sur 30.",
    },
    {
      decision: 0,
      option: 3,
      pourquoi:
        "Le sortir de ses missions et le mettre en avant-vente règle le problème à coup sûr : plus de relectures humiliantes, et Peio sait reprendre Dauriac et Lagrave.",
      ceQuiLeDejoue:
        "Ruben le dit : « Un talent qui abîme l'équipe ne se protège ni par le silence ni par le placard. » Amaya Marsac a déjà refusé une fois qu'on change son chef de mission, et Halden Partners recrute des seniors data à Bordeaux. Les relectures montrent des faits datés qui peuvent se dire : rien n'a encore été dit à Maximilien. Rejoué sur les trente tirages à la place du recadrage, le placard perd 84 k€ en moyenne, le pire choix de la semaine ; il ne fait mieux que 2 fois sur 30.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "On ne change pas une équipe en cours de mission : la banque connaît Ilham, et Maximilien a besoin d'elle jusqu'en juin.",
      ceQuiLeDejoue:
        "L'entretien avec Ilham dit ce qui la fait partir : « Ce n'est pas la mission, elle me plaît. C'est la façon dont mon travail est relu et présenté. » Une relecture par Peio avec une grille écrite et sa partie présentée au comité la retiendraient, pour une demi-journée de Peio par semaine. Rejoué sur les trente tirages à la place du nouveau circuit de relecture, le refus perd 20 k€ en moyenne ; il fait mieux 11 fois sur 30, quand Ilham reste malgré tout.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Maximilien propose un indépendant qu'il connaît : ce sera plus rapide que de former les analystes, et il laisse 600 € de marge par semaine sans rien déranger.",
      ceQuiLeDejoue:
        "Le chiffrage du lot 2 : en régie, deux analystes à temps plein se facturent 700 € par jour et feraient passer l'occupation d'Ilham et de Neven de 62 % à plus de 80 %, quand l'indépendant ne laisse que 150 € par jour. Avec un plan de délégation écrit, la pyramide fait travailler les analystes au lieu de les contourner. Rejoué sur les trente tirages à la place de la pyramide, l'indépendant perd 6 k€ en moyenne ; il fait mieux 4 fois sur 30.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Il a fait des efforts depuis la semaine 1, c'était un coup de stress avant un comité, et le DSI de Lagrave est ravi : revenir dessus paraît mesquin.",
      ceQuiLeDejoue:
        "Les versions du livrable le montrent : celle de Gaëtane était complète mercredi à 18 h, il l'a réécrite entre 23 h et 3 h, et elle n'a présenté aucune diapositive. La source précise qu'un écart laissé sans réponse redevient la norme pour toute l'équipe, et que repris tout de suite avec le fait précis, il se referme le plus souvent. Gaëtane l'a compris : « J'ai compris comment ça marche ici. » Rejoué sur les trente tirages à la place du retour du lundi avec une règle pour les rushs, laisser passer perd 26 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 3,
      pourquoi:
        "Après un recadrage qui n'a pas tenu, lui retirer Lagrave paraît la seule réponse ferme, et Peio peut piloter.",
      ceQuiLeDejoue:
        "La reconstitution de la semaine montre que ses relectures suivaient vos attentes jusqu'au mardi : c'est un écart sous la pression d'un comité, pas un retour en arrière assumé. Ruben prévient : « Lui retirer Lagrave, c'est lui montrer la porte », et Halden Partners cherche des seniors data à Bordeaux. Rejoué sur les trente tirages à la place du retour avec le fait précis, le retrait perd 46 k€ en moyenne ; il ne fait mieux qu'une fois sur 30.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Le directeur général de la banque sera là, et le client adore Maximilien : on met en avant son meilleur atout.",
      ceQuiLeDejoue:
        "Neven a fait toute l'analyse des écarts et demande à la présenter ; Ilham disait déjà en semaine 2 que présenter sa partie la ferait rester. Avec une répétition la veille, Maximilien ouvre, conclut et prend les questions difficiles : le client garde son atout et les analystes prennent leur place. Rejoué sur les trente tirages à la place des analystes présentant avec Maximilien en appui, Maximilien seul perd 6 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, qu'est-ce qui, dans les sources, permettait de parler à Maximilien de faits plutôt que de son ton ? Citez-en un, avec sa date.",
    "Ses analystes sont occupés à 55 % quand le plan en vendait 85 %. En quoi ce chiffre de gestion décrit-il un comportement ?",
    "Un départ d'analyste coûte 22 k€. Pourquoi le poste vacant coûte-t-il moins que le chiffre perdu, et pourquoi la montée en compétence du remplaçant coûte-t-elle autant que le recrutement ?",
    "La nuit avant le comité Lagrave, il a réécrit la partie de Gaëtane. Laisser passer, revenir lundi avec le fait, l'avertissement écrit ou le retrait de la mission : qu'est-ce que chaque réponse dit au reste de l'équipe ?",
    "Confier le mentorat à Maximilien sans essai fait mieux 16 fois sur 30 et perd pourtant en moyenne. Que coûte l'essai, et contre quoi protège-t-il ?",
    "Sous le tirage n° 12, ceux qui ont laissé faire finissent à 21 k€, et ceux qui l'ont écarté à 17 k€. Si l'un d'eux a gardé toute son équipe, sa décision était-elle bonne pour autant ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Quelle règle gardez-vous pour manager un talent qui abîme son équipe ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Dans un cabinet d'audit, un consultant gagne 50 000 € brut par an et coûte 350 € par jour ouvré charges comprises ; il est facturé 850 € par jour et occupé à 75 %. Un départ coûte : un cabinet de recrutement à 20 % du salaire annuel brut, 30 jours ouvrés de poste vacant, et 20 premiers jours du remplaçant non facturables. 1) Calculez le coût d'un départ. 2) Deux consultants de l'équipe ont six chances sur dix de partir dans l'année si rien ne change ; un recadrage de leur manager, qui coûte une journée d'associé facturée 1 100 €, ramènerait ce risque à deux sur dix. Que rapporte le recadrage, en espérance ?",
    corrige:
      "1) Cabinet : 0,20 × 50 000 = 10 000 €. Poste vacant : le chiffre perdu est de 850 × 0,75 = 637,50 € par jour, moins les 350 € de salaire économisés, soit 287,50 € par jour : 30 × 287,50 = 8 625 €. Intégration : 20 × 637,50 = 12 750 €. Total : 10 000 + 8 625 + 12 750 = 31 375 €. 2) Sans recadrage : 2 × 0,6 × 31 375 = 37 650 € de coût attendu ; avec : 2 × 0,2 × 31 375 = 12 550 €. Le recadrage évite 25 100 € en espérance et coûte 1 100 € : il rapporte 24 000 €.",
  },
  evaluation: [
    "Le coût d'un départ d'analyste est calculé juste (8 400 €, 5 200 €, 8 400 €, soit 22 k€) à partir de la source nommée, salaire économisé déduit.",
    "Le recadrage de la semaine 1 s'appuie sur des faits datés tirés des sources et fixe des attentes vérifiables, plutôt qu'un jugement sur la personne.",
    "La réponse à l'écart de la semaine 8 est proportionnée : elle reprend le fait précis sans le laisser passer ni sanctionner d'emblée.",
    "Les choix de staffing et de présentation (lot 2, comité de juin) sont reliés à l'occupation et au maintien des analystes.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "Un avertissement écrit est une sanction disciplinaire au sens du Code du travail : il suppose une faute, s'inscrit dans des délais et des formes que l'enseignant de droit social relira avec la classe. La source de Prune Lecoeur écrit « 20 % du salaire annuel brut, 42 000 € pour un analyste » : le modèle lit 42 000 € comme le salaire, et la phrase peut se lire autrement ; c'est la cause de l'erreur à 55,6 k€.",
};
