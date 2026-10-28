/**
 * FICHE ENSEIGNANT · ÉPISODE 60, LES SAISONNIERS DE JUILLET.
 *
 * Intégrer une équipe saisonnière : la formation et l'accueil coûtent avant le
 * rush, les erreurs et les départs coûtent pendant, et ce sont les permanents
 * qui rattrapent. Le piège : mettre les saisonniers au comptoir le premier
 * soir « pour ne rien payer avant la saison ».
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "saisonniers-de-juillet",
  formations: ["bts-mhr", "bts-mhr-bc"],
  programme: [
    "BTS MHR · Bloc 3, Management de la production de services en hôtellerie restauration",
    "BTS MHR · Bloc 4, Pilotage de la production de services en hôtellerie restauration",
  ],
  notion:
    "Une semaine de formation avant la saison se voit sur la fiche de paie ; les erreurs d'un saisonnier non formé ne se voient qu'en se cumulant, dans le journal des anomalies, dans les heures des permanents qui rattrapent et dans la note. L'erreur classique consiste à comparer le coût de l'intégration à zéro, et à mettre les saisonniers au comptoir dès leur premier soir. Dans l'épisode, Léonie Combaz, cheffe de réception de L'Escale Évian, 66 chambres, accueille huit saisonniers le 29 juin, la semaine où l'hôtel passe à plus de 90 %. Le journal de l'été dernier chiffre ce que coûte un saisonnier lâché au comptoir : six erreurs de facturation à 45 €, deux erreurs de plan tarifaire à 110 € et un délogement mal conduit toutes les deux semaines à 380 €, soit 680 € par semaine, et cinq fois moins de ventes additionnelles qu'un permanent. Une semaine d'intégration et deux semaines de binôme coûtent 6 000 € puis 1 320 € par semaine ; huit saisonniers non formés en coûtent 5 440 chaque semaine. L'élève découvre que l'intégration se paie avant le rush et se rembourse dès les premières semaines, que l'accueil (le logement, le planning, quelqu'un à qui demander) décide des départs, et qu'un permanent sur chaque soirée vaut mieux que des heures supplémentaires pour tout reprendre.",
  objectifs: [
    "Je calcule ce que coûtent par semaine les erreurs d'un salarié non formé, à partir d'un journal d'anomalies et d'un coût par erreur.",
    "Je compare le coût d'une intégration (formation, binôme) à celui des erreurs et des départs qu'elle évite.",
    "J'organise le planning pour mettre l'expérience là où se font les erreurs.",
    "Je traite un départ annoncé en cherchant sa raison avant de remplacer, et je fidélise jusqu'à la fin de la saison.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "L'organisation d'un service de réception (accueil, facturation, plans tarifaires, délogement) et la notion de contrat saisonnier doivent être connues. Le coût d'une erreur et l'intégration d'un nouveau salarié peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/saisonniers-de-juillet?hasard=16 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous présentez Léonie Combaz et ses huit saisonniers, et vous demandez de noter sur papier, avant de valider la semaine 1, le coût par semaine des erreurs d'un saisonnier mis au comptoir sans formation, et le calcul qui y mène.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez l'accueil choisi en semaine 1 (comptoir le premier soir, module en ligne, semaine d'intégration, binôme en plein rush) et la réponse à Elif en semaine 7, où la classe se partage. Un binôme qui a fini tôt chiffre le coût de la semaine d'intégration contre celui de huit saisonniers non formés pendant trois semaines.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les montants relevés, puis vous ramenez avec la classe le journal de l'été dernier à un saisonnier et à une semaine : 60 erreurs de facturation, 20 de plan tarifaire et 5 délogements pour cinq saisonniers en deux semaines, soit 6, 2 et une demie par saisonnier et par semaine. Vous faites le calcul avec les coûts d'Ilse Montmasson (680 €), puis vous faites expliquer les valeurs éloignées (1 360 €, 3 400 € ou 490 €). Vous terminez par le chiffre qui compte : huit saisonniers, 5 440 € par semaine, à mettre en face des 6 000 € de la semaine d'intégration.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 3 (le logement) et de la semaine 7 (Elif). Pour le logement, vous faites comparer la résidence des saisonniers (1 600 € sur l'été, une chance sur trois de refus), les studios des Mouettes (6 480 €) et les deux chambres côté cour, qui paraissent gratuites mais rapportent 112 € de marge par nuit à plus de 80 % de remplissage. Pour Elif, vous faites lire ce que disaient ceux qui sont partis l'été dernier : deux sur trois seraient restés « si quelqu'un avait demandé ».",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 16, « Intégrer avant le rush » finit à 30,0 k€ de contribution de la réception, au-dessus des 25 k€ visés, sans abandon et avec Elif restée ; « Comme chaque été » finit à −11,9 k€ et « Tenir le rush d'abord » à −24,5 k€, avec deux abandons chacun et plus de trois fois plus d'erreurs. Sur les trente tirages, la première méthode reste toujours positive, les deux autres jamais. Vous montrez ensuite le logement : la résidence des saisonniers fait mieux en moyenne, mais les studios font mieux 7 fois sur 30, quand la commission refuse le dossier. Vous faites dire si un refus aurait rendu le choix de la résidence mauvais.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : avant de compter ce que coûte une semaine de salaires, compter ce que coûte un saisonnier non formé. Vous la déclinez : former avant le rush, loger près de l'hôtel, mettre un permanent sur les soirées, demander avant de remplacer, fidéliser jusqu'au dernier jour. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 680,
    etapes: [
      "Source « Relire le journal des anomalies d'Hostéo de l'été dernier » : sur leurs deux premières semaines, les 5 saisonniers mis au comptoir le premier jour ont fait 60 erreurs de facturation, 20 erreurs de plan tarifaire et 5 délogements mal conduits. Par saisonnier et par semaine (5 × 2 = 10) : 6 erreurs de facturation, 2 de plan tarifaire, 0,5 délogement.",
      "Source « Demander au contrôle de gestion ce que coûte chaque erreur » : 45 € par erreur de facturation, 110 € par erreur de plan tarifaire, 380 € par délogement mal conduit.",
      "Coût par saisonnier et par semaine : 6 × 45 + 2 × 110 + 0,5 × 380 = 270 + 220 + 190 = 680 €. Le chiffre ne dépend pas du hasard : toute la classe doit trouver la même valeur ; l'épisode la juge juste à 20 € près, proche à 80 €.",
      "Pour huit saisonniers : 8 × 680 = 5 440 € par semaine, avant les ventes additionnelles perdues (4,80 € de marge par arrivée au lieu de 24 €) et la note. La semaine d'intégration coûte 6 000 €, puis 1 320 € par semaine de binôme pendant deux semaines.",
    ],
    erreurs: [
      {
        valeur: 1360,
        cause:
          "Les erreurs divisées par les cinq saisonniers mais pas par les deux semaines (6 800 / 5) : le journal couvre deux semaines.",
      },
      {
        valeur: 3400,
        cause:
          "Les erreurs des cinq saisonniers ensemble, sur une semaine (6 800 / 2) : la question porte sur un saisonnier.",
      },
      {
        valeur: 490,
        cause:
          "Les délogements mal conduits oubliés (270 + 220) : un toutes les deux semaines, mais à 380 € chacun.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Aucun coût avant la saison, chaque poste tenu dès le premier jour : ils apprendront sur le tas, comme chaque été.",
      ceQuiLeDejoue:
        "Le journal de l'été dernier chiffre le sur le tas : 680 € d'erreurs par saisonnier et par semaine, et des ventes additionnelles cinq fois plus faibles (4,80 € par arrivée contre 24 €) ; deux saisonniers qui avaient déjà fait une saison dans un 4 étoiles ont fait autant d'erreurs que les autres. Bertilie Mermoud se souvient d'avoir passé juillet à refaire des factures, et Aliénor Duchosal le dit : compte d'abord ce que t'a coûté un saisonnier non formé. Rejoué sur les trente tirages à la place de la semaine d'intégration, le comptoir dès le premier soir perd 17,4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Le planning est publié depuis trois semaines : le changer en plein rush désorganiserait tout, et les permanents tiennent à leurs matinées.",
      ceQuiLeDejoue:
        "Le journal de la semaine, service par service, montre que 70 % des 1 555 € d'erreurs se font entre 18 heures et 23 heures, sur des soirées où le planning ne met aucun permanent. Aglaé Chamoux, à L'Escale Lac, a mis un permanent sur chaque soirée et dix minutes de point à chaque relève : les erreurs du soir ont baissé de moitié, les permanents ont râlé deux semaines, personne n'est parti. Rejoué sur les trente tirages à la place du nouveau planning, tenir le planning publié perd 4,6 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 3,
      pourquoi:
        "Si les permanents reprennent chaque soir les dossiers des saisonniers, aucune erreur n'atteint les clients.",
      ceQuiLeDejoue:
        "Reprendre après coup coûte des heures supplémentaires à 27,50 €, plusieurs heures par soir, et ne fait rien baisser : les erreurs continuent de se faire entre 18 et 23 heures, sans personne à qui demander. Lison Taberlet finit à minuit deux soirs par semaine : la fatigue des permanents monte, et fatigués, ils vendent moins et se trompent davantage. Un permanent au comptoir le soir évite l'erreur au lieu de la corriger. Rejoué sur les trente tirages à la place du nouveau planning, le rattrapage en heures supplémentaires perd 5,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Elif part : la remplacer dès lundi par un extra d'agence tient le poste sans interruption.",
      ceQuiLeDejoue:
        "L'extra coûte 840 € la semaine au lieu de 600 €, plus 400 € de frais, et n'a jamais vu Hostéo ni travaillé dans un 4 étoiles : il refait les erreurs d'un saisonnier non formé. La source sur les départs de l'été dernier donne trois raisons (le bus de Thonon, des horaires connus la veille, une saisonnière humiliée au comptoir sans que personne intervienne), et deux sur trois seraient restés si quelqu'un avait demandé. Sous le tirage n° 16, Elif reste quand on prend une heure avec elle. Rejoué sur les trente tirages à la place de cette heure, l'extra perd 3,6 k€ en moyenne ; il fait mieux 7 fois, quand Elif part quand même.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Le siège le finance, et à L'Escale Lac les surclassements vendus ont augmenté de 40 % : un challenge fait vendre tout le monde.",
      ceQuiLeDejoue:
        "Aglaé Chamoux raconte la suite : les surclassements vendus à 25 % de remise pour gagner au classement, une marge qui n'a presque pas bougé, des réceptionnistes qui se disputent les arrivées, et trois avis Bookalia sur la vente forcée. Lucile Fabbri chiffre chaque dixième sous 8,8 à environ 1 200 € de marge de chambres par semaine. Les saisonniers, formés, vendent déjà comme les permanents (23,27 € contre 22,15 € par arrivée). Rejoué sur les trente tirages à la place de l'argumentaire et de la prime collective, le challenge perd 3,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Les permanents l'ont dit, ils le feront : passer à 44 heures couvre les départs de fin d'été.",
      ceQuiLeDejoue:
        "54 heures de plus par semaine à 27,50 €, 1 485 € la semaine, et Bertilie prévient qu'on finira l'été rincés et qu'on le verra au comptoir. La source sur l'été dernier montre ce qui gardait les étudiants : à L'Escale Lac, une prime de 250 € et la promesse d'être repris l'été suivant en ont gardé trois sur quatre jusqu'au bout. Rejoué sur les trente tirages à la place de la prime, le passage à 44 heures perd 2,5 k€ en moyenne, et ne fait mieux qu'une fois.",
    },
    {
      decision: 5,
      option: 2,
      pourquoi:
        "Deux extras d'agence du 17 au 30 août : les départs seront couverts quoi qu'il arrive, deux mariages compris.",
      ceQuiLeDejoue:
        "Les extras coûtent 4 160 € et ne connaissent pas Hostéo : au comptoir dès leur arrivée, en pleine fin de saison, ils font les erreurs d'un saisonnier du premier jour. Ce qui a fait partir les étudiants l'été dernier n'était pas un manque de bras, mais une fin de saison sans raison de rester ; la prime de fin de saison et la promesse d'être repris traitent cette cause. Rejoués sur les trente tirages à la place de la prime, les extras perdent 6,3 k€ en moyenne et ne font jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu un coût (une semaine de salaires de plus), d'autres un investissement. Qu'est-ce que le journal des anomalies de l'été dernier permettait de chiffrer ?",
    "Un saisonnier non formé coûte 680 € par semaine en erreurs. Combien de semaines faut-il pour que la semaine d'intégration se rembourse, avec huit saisonniers ? Que reste-t-il à compter en plus des erreurs ?",
    "Deux chambres côté cour paraissaient un logement gratuit. Que coûtaient-elles vraiment ? Pourquoi le logement décide-t-il des départs ?",
    "Pourquoi un permanent sur chaque soirée fait-il plus que des permanents qui reprennent tous les dossiers en heures supplémentaires ? Qu'est-ce qui change pour le saisonnier, et pour le permanent ?",
    "Sous le tirage n° 16, la commission a accepté le dossier de la résidence ; une fois sur trois environ, elle le refuse, et les studios font mieux. Un refus aurait-il rendu le choix de la résidence mauvais ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Elif annonce son départ. Pourquoi prendre une heure avec elle avant de chercher un remplaçant ? Qu'est-ce que les départs de l'été dernier avaient en commun ?",
    "Quelle règle laissez-vous à la prochaine cheffe de réception qui accueille des saisonniers ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Un hôtel accueille quatre saisonniers pour une saison de neuf semaines. Non formé, un saisonnier fait chaque semaine cinq erreurs de facturation à 40 €, une erreur et demie de plan tarifaire à 100 € et un délogement mal conduit toutes les quatre semaines à 400 €. Formé, il fait cinq fois moins d'erreurs. La formation coûte une semaine de salaires avant la saison (550 € par saisonnier) et 800 € de formateur, puis deux semaines de binôme à 5 heures de permanent par saisonnier et par semaine, à 27,50 € l'heure. 1) Que coûtent par semaine les erreurs d'un saisonnier non formé ? Et des quatre sur la saison ? 2) Que coûte la formation ? 3) Que coûtent les erreurs des quatre saisonniers formés sur la saison ? 4) Quelle somme la formation fait-elle gagner sur la saison ?",
    corrige:
      "1) 5 × 40 + 1,5 × 100 + 0,25 × 400 = 200 + 150 + 100 = 450 € par semaine ; 4 × 450 × 9 = 16 200 € sur la saison. 2) 4 × 550 + 800 = 3 000 € avant la saison, plus 2 semaines × 4 × 5 heures × 27,50 € = 1 100 € de binôme : 4 100 €. 3) 450 / 5 = 90 € par saisonnier et par semaine : 4 × 90 × 9 = 3 240 €. 4) 16 200 − (4 100 + 3 240) = 8 860 € gagnés, avant même les ventes additionnelles et les départs évités.",
  },
  evaluation: [
    "Le coût hebdomadaire des erreurs d'un saisonnier non formé est calculé juste, à partir du journal des anomalies et du coût de chaque erreur.",
    "L'intégration est jugée en comparant son coût à celui des erreurs, des ventes perdues et des départs qu'elle évite, et non à zéro.",
    "Le planning et l'accueil (logement, point à la relève, permanent sur les soirées) sont argumentés par les sources sur les erreurs et sur les départs.",
    "La réponse au départ d'Elif et la fin de saison s'appuient sur les raisons des départs de l'été dernier.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 16.",
  ],
  vigilance:
    "L'épisode compte les heures supplémentaires des permanents à 27,50 € l'heure sans distinguer de tranches, et propose de les passer à 44 heures pendant trois semaines : la durée du travail et les majorations relèvent de la convention collective des hôtels, cafés et restaurants, qui fixe ses propres seuils, et des durées maximales légales, à rappeler. Le recadrage écrit de la décision 3 est une sanction disciplinaire, qui obéit à une procédure. La retenue d'avantage en nature pour le logement suit des barèmes que l'épisode résume à 70 € par mois.",
};
