/**
 * FICHE ENSEIGNANT · ÉPISODE 66, L'ENSEIGNE QUI FRAPPE À LA PORTE.
 *
 * Franchise et affiliation hôtelière : une marque ne vaut pas la même chose
 * partout. Elle se chiffre hôtel par hôtel, se teste là où la saison parle, et
 * se négocie avec une porte de sortie.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "enseigne-a-la-porte",
  formations: ["dcg", "but-gea", "bts-mhr"],
  programme: [
    "DCG · UE 7, Management",
    "BUT GEA · Concevoir la stratégie de création de valeur",
    "BTS MHR · Bloc 2, Mercatique des services en hôtellerie restauration",
  ],
  notion:
    "Une chaîne propose son enseigne contre des redevances : le réflexe est de raisonner en groupe, soit pour tout affilier et obtenir les meilleures conditions, soit pour tout refuser par attachement à l'indépendance. L'erreur classique est de juger la marque sur une moyenne, alors que ses redevances se paient sur tout le chiffre et que ce qu'elle apporte dépend du client. Dans l'épisode, Isaline Perraud, directrice générale du Groupe Escale (huit hôtels, 24 M€ d'hébergement), reçoit l'offre d'Orméa Hotels : 3 % de redevance de marque au lieu de 4 % et 600 k€ de travaux pour les huit hôtels. Les redevances font 6 % du chiffre, plus 4 % des séjours des membres du programme de fidélité. Dans un hôtel d'affaires, la marque rapatrie 10, 20 ou 24 points de chiffre des plateformes (17 % de commission en moyenne) et apporte −3 %, +12 % ou +17 % de chiffre selon le scénario ; dans une maison de caractère, 3 points, et 1 % de prix moyen perdu. Sous l'effet moyen, l'affiliation rapporte 184 k€ par an à Annemasse et en coûte 351 k€ à L'Escale Lac. L'élève découvre qu'il faut chiffrer hôtel par hôtel, tester sur les hôtels d'affaires pendant leur saison normale, travailler la clientèle directe des maisons de caractère, négocier une clause de sortie et un plafond de travaux, et réviser son périmètre sur les chiffres.",
  objectifs: [
    "Je calcule l'économie de commissions et l'effet net annuel d'une affiliation pour un établissement, en espérance sur plusieurs scénarios.",
    "Je segmente un portefeuille d'établissements selon ce que la marque apporte à leur clientèle.",
    "J'évalue ce que vaut une clause de sortie dans un contrat de franchise.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de franchise ou d'affiliation, de canal de distribution et de commission, et le calcul d'une espérance mathématique doivent être connus. L'actualisation d'un flux constant aide à lire le bilan ; le RevPAR peut être présenté pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/enseigne-a-la-porte?hasard=2 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, le calcul de l'économie de commissions d'Annemasse et de Chambéry-Gare, et le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger et vous relevez la prévision de la semaine 1, la ligne proposée au conseil (les huit, décliner, chiffrer, attendre) et le lieu de l'essai en semaine 2. Aux plus rapides, vous demandez de calculer l'effet net annuel de l'affiliation de L'Escale Lac.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez les prévisions relevées et refaites le calcul : les points rapatriés en espérance (18), sur le chiffre des deux hôtels d'affaires (5,6 M€), à la commission moyenne (17 %). Vous faites expliquer les valeurs éloignées de 171,4 k€ (190,4, 70,6 ou 392,4). Vous ajoutez aussitôt ce que la prévision ne dit pas : les redevances, qui se paient sur tout le chiffre.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 (la ligne), de la semaine 2 (l'essai) et de la semaine 6 (le contrat). Pour l'essai, vous faites relire ce que chaque hôtel peut montrer de janvier à mars : Megève complet, le Lac au tiers, les hôtels d'affaires dans leur saison normale. Pour le contrat, l'analyse de Sibylle Rouget : sortir coûte trois ans de redevances, environ 1,3 M€ pour les deux hôtels d'affaires, et les normes imposent 750 k€ de travaux.",
    },
    {
      minutes: 20,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève. Sous le tirage 2, l'effet de la marque est moyen et Orméa accepte le périmètre : « Chiffrer, tester, négocier hôtel par hôtel » crée 972,6 k€ de valeur, « Tout affilier pour les conditions de groupe » en détruit 4 596 k€, et attendre 361,5 k€. Vous montrez deux décisions où le tirage trompe : décliner fait mieux que chiffrer 18 fois sur 30 et perd 89,4 k€ en moyenne ; conclure aux conditions d'Orméa ne coûte rien sous ce tirage, puisqu'elle accepte, et 397,2 k€ en moyenne.",
    },
    {
      minutes: 10,
      titre: "Synthèse",
      detail:
        "Vous écrivez la règle de l'épisode : une marque vaut ce qu'elle apporte à un client qui ne vous connaît pas encore. Vous la déclinez en quatre gestes : chiffrer établissement par établissement, tester là où la saison est normale, se garder une sortie, et réviser son périmètre sur les chiffres plutôt que tenir ce qu'on a annoncé.",
    },
  ],
  calcul: {
    reponse: 171.4,
    etapes: [
      "Source « Décomposer le chiffre hébergement et les canaux, hôtel par hôtel » : Annemasse fait 3,4 M€ et Chambéry-Gare 2,2 M€ de chiffre hébergement, soit 5,6 M€ pour les deux hôtels d'affaires. Bookalia prend 18 % sur deux réservations de plateforme sur trois, Voyagio 15 % sur la troisième : 2/3 × 18 % + 1/3 × 15 % = 17 %.",
      "Source « Interroger les hôteliers indépendants qu'Orméa a affiliés » : dans les hôtels d'affaires, la marque a rapatrié 10 points de chiffre des plateformes vers son canal trois fois sur dix, 20 points quatre ou cinq fois sur dix, 24 points deux ou trois fois sur dix. En espérance : 0,30 × 10 + 0,45 × 20 + 0,25 × 24 = 3 + 9 + 6 = 18 points.",
      "Économie annuelle de commissions en espérance : 18 % × 5,6 M€ × 17 % = 171 360 €, soit 171,4 k€. Le calcul ne dépend pas du hasard ; l'épisode le juge juste à 8 k€ près.",
      "Pour la suite : cette économie n'est qu'une ligne. Les redevances d'Orméa (6 % du chiffre, plus 4 % du chiffre des membres, trois séjours sur dix) coûtent environ 400 k€ par an aux deux hôtels avant toute hausse de chiffre : c'est l'effet net qui compte.",
    ],
    erreurs: [
      {
        valeur: 190.4,
        cause:
          "Seul le scénario le plus fréquent est retenu (20 points) au lieu de l'espérance : 20 % × 5,6 M€ × 17 %.",
      },
      {
        valeur: 70.6,
        cause:
          "Les 18 points sont appliqués au seul chiffre déjà réservé par les plateformes (2,31 M€) au lieu du chiffre total : 18 % × 2,31 M€ × 17 %.",
      },
      {
        valeur: 392.4,
        cause:
          "Toutes les commissions que paient aujourd'hui les deux hôtels sont prises pour une économie, comme si la marque supprimait les plateformes.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Marceau Dupré le calcule : un point de redevance en moins sur 24 M€, c'est 240 k€ par an, plus 600 k€ pour les travaux. Les conditions de groupe ne valent que pour les huit.",
      ceQuiLeDejoue:
        "La source des références : dans les hôtels de caractère, la marque ne rapatrie que 3 points et fait perdre 1 % de prix moyen, quand les redevances se paient sur tout le chiffre ; or les trois maisons font 12,8 M€, dont 65 % réservés en direct. Hilaire Tissandier : là où tes clients te connaissent, tu paies des redevances sur tes propres habitués. Rejouée sur les trente tirages à la place du chiffrage hôtel par hôtel, cette ligne perd 145,3 k€ en moyenne et ne fait jamais mieux ; la méthode des huit hôtels, poursuivie jusqu'au bout, détruit plus de 4 M€.",
    },
    {
      decision: 0,
      option: 1,
      pourquoi:
        "Le groupe est indépendant depuis 1987, Romy Castellane changerait de métier, et une enseigne nous lierait dix ans.",
      ceQuiLeDejoue:
        "Romuald Aubertin perd des appels d'offres genevois faute de marque, Ana Sousa des grands comptes ferroviaires : la marque apporte quelque chose aux hôtels d'affaires. Et Orméa veut être à Annemasse : éconduite, elle peut s'affilier l'Arcadelle, et 143 k€ de chiffre net par an se perdent. Rejeté sur les trente tirages à la place du chiffrage, le refus fait mieux 18 fois mais perd 89,4 k€ en moyenne : il gagne quand la marque pèse peu, et perd beaucoup quand elle pèse.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi: "Les références d'Orméa sont là, et un essai fait perdre six semaines.",
      ceQuiLeDejoue:
        "Les références disent que trois hôtels d'affaires sur dix ont perdu : on ne sait pas dans quel cas on sera. La source sur la saison : Annemasse et Chambéry-Gare vivent leur saison d'affaires normale, et l'essai donne leurs chiffres en semaine 8, avant la proposition ; sans essai, l'effet n'est connu qu'en semaine 12, après la négociation. L'essai coûte 8 k€ d'interface et 15 % sur les réservations apportées, moins que les 17 % des plateformes. Rejoué sur les trente tirages à la place de l'essai sur les hôtels d'affaires, ce choix perd 187,7 k€ en moyenne et ne fait mieux que 5 fois.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Bookalia met les trois maisons en première page dès la semaine 5 : le planning se remplit plus vite, et cela se voit dès février.",
      ceQuiLeDejoue:
        "Les conditions du programme : 3 points de commission de plus sur 2,1 M€ de réservations Bookalia, soit 64 k€, pour 8 % de réservations en plus dont la moitié viendraient de clients qui réservaient déjà en direct : 28 k€ de moins par an. Le programme de clientèle directe rapporte 80 k€ par an, 90 k€ d'investissement : chaque point rapatrié vers le direct rapporte 15,4 k€. Rejoué sur les trente tirages à la place de la clientèle directe, ce choix perd 376,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Marceau le dit : Orméa n'aime pas qu'on lui envoie des avocats, et un contrat type se signe vite.",
      ceQuiLeDejoue:
        "L'analyse de Sibylle Rouget : sortir avant dix ans coûte trois ans de redevances, environ 1,3 M€ pour Annemasse et Chambéry, et les normes imposent 5 000 € de travaux par chambre dans un hôtel d'affaires, 750 k€ pour les deux. La clause de sortie à trois ans et le plafond de 2 500 € par chambre ont été acceptés dans la plupart des contrats récents d'Orméa. Rejoué sur les trente tirages à la place de cette négociation, le contrat type perd 240 k€ en moyenne, même s'il fait mieux 10 fois.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Aliette le rappelle : le conseil aime qu'on tienne ce qu'on annonce, et changer d'avis tous les quinze jours affaiblit la directrice.",
      ceQuiLeDejoue:
        "Un essai sert à décider : ses chiffres donnent, hôtel par hôtel, le chiffre apporté, les commissions économisées et les redevances. Revoir le périmètre sur ces chiffres, c'est proposer Annemasse et Chambéry-Gare s'ils ont gagné, aucun hôtel sinon. Sous le tirage 2, la ligne annoncée était déjà de chiffrer hôtel par hôtel, et la tenir ne coûte rien ; rejouée sur les trente tirages à la place de la révision, elle perd 155,4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Le 31 mars est dans trois semaines : signer ce qu'Orméa demande nous assure au moins une marque.",
      ceQuiLeDejoue:
        "La source sur ce que chaque issue coûte : quand Orméa exige Évian et Megève en « Orméa Collection », sous son contrat type et sans clause, la valeur détruite sur cinq ans se chiffre ; offrir Annecy-Centre et Aix-les-Bains, elle l'accepte neuf fois sur dix ; tenir le périmètre, elle a signé deux fois sur trois sans rien de plus. Sous le tirage 2, Orméa accepte le périmètre et conclure ne coûte rien ; rejoué sur les trente tirages à la place de la contrepartie, ce choix perd 397,2 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, Marceau voulait signer pour les huit, Romy refusait pour le Lac. Qu'avaient-ils en commun dans leur façon de raisonner ?",
    "Sous l'effet moyen, l'affiliation rapporte 184 k€ par an à Annemasse et en coûte 351 k€ à L'Escale Lac. Avec les mêmes redevances, d'où vient l'écart ?",
    "Pourquoi un essai à L'Escale Lac et à Megève de janvier à mars ne pouvait-il rien dire de ce que vaut la marque ? Où fallait-il le faire, et pourquoi à ce moment-là ?",
    "Pour les maisons de caractère, Bookalia proposait la première page et Romy un fichier clients. Lequel des deux rapatrie les clients, et lequel les paie deux fois ?",
    "Que vaut une clause de sortie, si on ne compte pas s'en servir ? Dans quel scénario rapporte-t-elle ?",
    "Décliner l'offre fait mieux que chiffrer 18 fois sur 30, et perd pourtant 89,4 k€ en moyenne. Comment est-ce possible, et lequel des deux fallait-il recommander au conseil ?",
    "Quelle règle gardez-vous pour répondre à une enseigne qui frappe à la porte ? Formulez-la en une phrase, avec un chiffre de l'épisode dedans.",
  ],
  prolongement: {
    enonce:
      "Un hôtel d'affaires fait 2 M€ de chiffre hébergement. Une chaîne lui propose son enseigne : redevances de 6 % du chiffre hébergement, plus 4 % du chiffre des membres de son programme, qui font 30 % du chiffre. Selon les hôtels comparables, la marque fait varier le chiffre de −3 % (trois chances sur dix), +12 % (quatre et demie) ou +17 % (deux et demie), et rapatrie des plateformes, à 17 % de commission, 10, 20 ou 24 points de chiffre. Une nuitée de plus coûte 16 % de son prix en coûts variables ; le chiffre perdu est du prix et ne coûte rien. 1) Calculez l'effet net annuel de l'affiliation dans chaque scénario : chiffre apporté net des coûts variables, commissions économisées, redevances payées sur le chiffre après l'effet de la marque. 2) Quel est l'effet net annuel espéré ? 3) Sur cinq ans à 8 % (coefficient 3,9927), et avec une clause de sortie qui arrête au bout de trois ans un hôtel qui perd (coefficient 2,5771), que vaut cette clause en espérance ?",
    corrige:
      "1) Scénario faible : chiffre apporté −60 000 €, commissions économisées 0,17 × 0,10 × 2 000 000 = 34 000 €, redevances (6 % + 4 % × 30 %) × 2 000 000 × 0,97 = 139 680 € ; net −165 680 €. Moyen : 2 000 000 × 0,12 × 0,84 = 201 600 €, 68 000 €, 0,072 × 2 240 000 = 161 280 € ; net 108 320 €. Fort : 285 600 €, 81 600 €, 168 480 € ; net 198 720 €. 2) 0,30 × (−165 680) + 0,45 × 108 320 + 0,25 × 198 720 = 48 720 € par an. 3) Dans le scénario faible, l'hôtel perd 165 680 × 3,9927 ≈ 661 512 € sans clause, 165 680 × 2,5771 ≈ 426 973 € avec : la clause évite 234 539 € dans ce scénario, soit 0,30 × 234 539 ≈ 70 362 € en espérance. Elle ne sert à rien dans les deux autres.",
  },
  evaluation: [
    "L'économie de commissions est calculée juste, en espérance, sur le chiffre des deux hôtels d'affaires, à partir des sources nommées.",
    "La recommandation distingue les hôtels selon ce que la marque apporte à leur clientèle, chiffres à l'appui.",
    "Le lieu et le moment de l'essai sont justifiés par la saison de chaque hôtel.",
    "Les termes du contrat (sortie, travaux) sont évalués comme une protection contre le scénario défavorable.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage 2.",
  ],
  vigilance:
    "Le contrat d'affiliation est présenté de façon simplifiée : un enseignant de droit pourra rappeler l'obligation d'information précontractuelle du franchiseur et la portée réelle d'une indemnité de sortie. Les taux de redevances et de commissions sont fictifs.",
};
