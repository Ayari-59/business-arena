/**
 * FICHE ENSEIGNANT · ÉPISODE 27, LE PROJET QUI GLISSE.
 *
 * Piloter un projet de système d'information en retard : mesurer le reste à
 * faire réel, geler le périmètre, découper pour tenir la date, protéger la
 * recette. Le piège : ajouter du monde ou des heures, qui retarde d'abord.
 * Les chiffres du hasard de la classe sont ceux de la graine 11.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "projet-qui-glisse",
  formations: ["stmg", "bts-sam", "but-gaco"],
  programme: [
    "STMG · Systèmes d'information de gestion, Thème 2, Management du système d'information et performance",
    "BTS SAM · Bloc 2, Gestion de projet",
    "BUT GACO · Gérer un projet interne ou externe à l'organisation",
  ],
  notion:
    "Un projet en retard ne manque pas d'abord de bras : il reçoit presque autant de travail qu'il en abat. L'erreur classique consiste à répondre au retard par des renforts ou des heures supplémentaires, alors qu'un renfort prend du temps aux anciens pendant des semaines (la loi de Brooks), puis à rogner la recette pour tenir la date, ce qui envoie les défauts en production. Dans l'épisode, Camille Ferrand pilote Arvel Pro, le portail de commande en ligne des artisans d'Arvel Distribution, promis pour la semaine 13 : le planning affiche 48 % d'avancement pour 55 % prévus et 150 jours-homme de reste à faire. Recompté tâche par tâche, le reste à faire est de 220 jh : 19 demandes des agences ont été acceptées par les développeurs sans être replanifiées, et l'équipe abat 24 jh par semaine, dont un cinquième en corrections, pendant qu'il en rentre près de 9. L'élève découvre qu'un comité qui tranche chaque demande rend à l'équipe sa vitesse, que le prestataire n'y est pour rien (96 % des tâches livrées), que seuls les utilisateurs clés trouvent les vrais défauts, et qu'ouvrir l'essentiel à la date (catalogue, prix remisés, commande, suivi) vaut mieux que de tout promettre en retard.",
  objectifs: [
    "Je mesure le reste à faire réel d'un projet et je le compare au planning affiché.",
    "Je calcule une vitesse nette (ce que l'équipe abat moins ce qui entre) et j'en tire une date de fin réaliste.",
    "Je gèle et je découpe un périmètre : ce qui est indispensable à l'ouverture, ce qui part dans un lot suivant, et qui en décide.",
    "J'explique pourquoi ajouter des personnes à un projet en retard le retarde d'abord, et pourquoi une recette sautée se paie après la mise en service.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de projet, de jalon, de périmètre, de recette et de jour-homme doivent avoir été vues en cours. La vitesse nette, la loi de Brooks et le coût d'un défaut selon le moment où il est trouvé peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/projet-qui-glisse?hasard=11 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous demandez de noter sur papier, avant de valider la semaine 1, l'estimation du reste à faire en fin de semaine 3, en jours-homme, avec le calcul qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans donner de piste, et vous relevez deux choses : la décision de la semaine 1 (renfort, gel du périmètre, heures supplémentaires, garder le plan) et ce qui est proposé au comité de pilotage en semaine 7. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 7 : accepter les trois développeurs de la DSI au lieu de découper.",
    },
    {
      minutes: 20,
      titre: "Correction de l'estimation de la semaine 1",
      detail:
        "Vous inscrivez au tableau les estimations relevées. Vous faites d'abord trouver le vrai point de départ (220 jh et non 150), puis vous faites le calcul semaine par semaine en deux colonnes : ce qui entre (les demandes, les découvertes) et ce que l'équipe abat (24 jh, moins les corrections et le temps perdu sur les défauts). Vous montrez que le comité ne siège qu'à partir de la semaine 2 : la première semaine se fait encore au fil de l'eau. Sous le tirage n° 11, le modèle donne 204 jh avec le gel, 215 avec les heures supplémentaires, 221 en gardant le plan, 229 avec les renforts. Vous faites expliquer les valeurs éloignées (150, 175, 220).",
    },
    {
      minutes: 20,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 et ceux de la semaine 7. Les élèves qui ont pris des renforts défendent leur choix, puis la classe lit la réponse de Dieudonné Meunier : « Je passe mes journées à leur expliquer le code : j'ai écrit dix lignes cette semaine », et sa source de la semaine 7 : sur le projet de l'entrepôt, les renforts ont mis trois semaines à devenir utiles. Vous enchaînez sur le devis en ligne de Bruno Castel : 35 jh dans le cœur de l'outil pour 9 artisans sur 120 qui l'ont cité.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 11, « Mesurer, geler, découper » finit 154,5 k€ au-dessus du budget, « Attentiste » 16,3 k€ en dessous, « Renforcer et faire plaisir » 119,2 k€ en dessous ; sur les trente tirages, la première le tient les 30 fois, l'attentiste 14 fois, les renforts jamais. Vous montrez ensuite les décisions où le hasard peut renverser le jugement : attendre que les utilisateurs clés se libèrent fait presque aussi bien que payer des remplaçants au comptoir une fois sur deux, et accepter le devis en ligne fait mieux que le renvoyer au lot 2 5 fois sur 30.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau les trois mécanismes de l'épisode : le périmètre qui gonfle (la vitesse nette, pas la vitesse brute), le renfort qui retarde d'abord, la recette sautée qui se paie trois fois plus cher en production. Vous les reliez à trois gestes : recompter et geler, découper l'essentiel pour tenir la date, protéger la recette et ouvrir d'abord à des agences pilotes. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 204,
    etapes: [
      "Point de départ (source « Recompter le reste à faire avec l'équipe ») : 220 jh, et non les 150 du planning, parce que 19 demandes des agences ont été acceptées sans être replanifiées.",
      "Ce que l'équipe abat (même source) : 24 jh par semaine, dont un cinquième en corrections, soit environ 19 jh de développement ; un peu moins tant que des défauts que personne n'a trouvés ralentissent le code. Ce qui entre : près de 9 jh par semaine en moyenne, mais le registre compte 14 demandes en attente, de 4 à 5 jh chacune, et les développeurs en prennent une partie chaque semaine tant que personne ne trie.",
      "Semaine 1 : le comité ne siège qu'à partir de la semaine 2 ; les développeurs prennent encore une part des demandes en attente. Sous le tirage n° 11, il entre 20,5 jh et l'équipe en abat 16,1 : 220 + 20,5 − 16,1 = 224,5 jh.",
      "Semaines 2 et 3 : le comité ne laisse entrer que l'indispensable (quatre demandes sur dix-neuf jugées indispensables par l'équipe) ; il n'entre plus que des découvertes et quelques demandes, 12,3 puis 6,2 jh, pour 17,8 puis 20,9 jh abattus : 224,5 + 12,3 − 17,8 = 218,9, puis 218,9 + 6,2 − 20,9 = 204,2 jh, soit environ 204 jh.",
      "L'épisode juge juste à 10 jh près, proche à 25 ; selon les trente tirages, la même méthode donne de 183 à 216 jh. Sans gel, en gardant le plan, le reste à faire ne baisse presque pas en trois semaines (221 jh) : c'est la leçon du chiffre.",
    ],
    erreurs: [
      {
        valeur: 150,
        cause:
          "Le reste à faire du planning pris pour point de départ : il ignore les 19 demandes acceptées sans être replanifiées, que le recomptage tâche par tâche fait apparaître.",
      },
      {
        valeur: 175,
        cause:
          "Les 24 jh abattus comptés en entier et les 9 jh entrants retirés (220 − 3 × 15) : c'est oublier qu'un cinquième de la capacité part en corrections et que la semaine 1 se fait encore sans comité, avec 14 demandes en attente.",
      },
      {
        valeur: 220,
        cause:
          "Le reste à faire recompté reporté tel quel, comme si le gel du périmètre ne changeait rien : c'est vrai sans comité, faux dès qu'il trie les demandes.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Le projet a sept points de retard : deux développeurs de plus chez le prestataire rattraperont le temps perdu, et le comité de direction verra qu'on agit.",
      ceQuiLeDejoue:
        "Le recomptage montre que le problème est ce qui entre (près de 9 jh par semaine), pas ce que l'équipe abat ; et le prestataire livre déjà 96 % de ses tâches dans les délais. Un renfort ne connaît ni le code ni le négoce : pendant trois semaines il prend du temps aux anciens, puis il ajoute de la coordination et des défauts. Isabelle Fontaine l'avait dit : « Avant de demander du monde ou du temps, sache combien il reste vraiment à faire, et ce qui rentre chaque semaine. » Rejoué sur les trente tirages à la place du gel, le renfort perd 87,6 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Deux heures de plus par jour pour les quatre développeurs internes, c'est 20 % de capacité en plus tout de suite, pour 1 800 € par semaine.",
      ceQuiLeDejoue:
        "Sarah Belkacem le dit dès la première semaine : « On finit tard, et le matin on corrige ce qu'on a écrit la veille au soir. » Les heures en plus laissent plus de défauts par jour de développement, la fatigue grignote le gain, et les demandes continuent d'entrer sans tri : le reste à faire baisse à peine. Rejouées sur les trente tirages à la place du gel, les heures supplémentaires perdent 75,6 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi:
        "Les utilisateurs clés ne peuvent pas venir en pleine saison : qu'ils testent tout en bloc à partir de la semaine 10, quand tout sera prêt.",
      ceQuiLeDejoue:
        "La source « Regarder qui trouve quels défauts » le dit : les utilisateurs clés trouvent les vrais défauts (un prix remisé faux, un bon sans adresse de chantier), et un défaut trouvé en semaine 3 se corrige en une demi-journée, en semaine 12 en une journée entière. Les directeurs d'agence ne refusent pas : il leur faut un remplaçant au comptoir, 1 200 € par semaine. Rejoué sur les trente tirages à la place des remplaçants, le report de la recette perd 18,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "C'est le directeur commercial, et ses commerciaux sont formels : sans devis en ligne, les gros artisans ne passeront pas sur Arvel Pro.",
      ceQuiLeDejoue:
        "Le panel du lancement : sur 120 artisans, 9 ont cité le devis en ligne, 104 la commande, le suivi de livraison et leurs prix remisés. Dieudonné chiffre le devis à « 35 jh au bas mot », dans le panier et les prix déjà testés. Proposé en tête du lot 2, chiffres du panel à l'appui, il est accepté par Bruno Castel sous le tirage de la classe. Rejoué sur les trente tirages à la place du lot 2, l'accepter pour l'ouverture perd 31,6 k€ en moyenne ; il fait mieux 5 fois, quand le directeur commercial serait de toute façon passé par la direction générale.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Antoine Lefèvre prête trois développeurs dès lundi : six semaines avant la fin, c'est le renfort qui sauvera la date.",
      ceQuiLeDejoue:
        "Dieudonné répond dans la source de la semaine 7 : « Ils ne connaissent ni le code ni le négoce. Sur le projet de l'entrepôt, les renforts ont mis trois semaines à devenir utiles, et je passerais la moitié de mon temps à les former. » À six semaines de la fin, trois semaines d'apprentissage en prennent la moitié. La projection au rythme réel montre que le cœur de l'outil tient dans les six semaines s'il passe en premier. Rejoué sur les trente tirages à la place du découpage, le prêt de la DSI perd 55,8 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Ne tester que les parcours principaux fait gagner une semaine et demie, et ce sont eux qui comptent pour les clients.",
      ceQuiLeDejoue:
        "La source « Chiffrer ce que coûte un défaut livré » : six défauts sur dix touchent la commande ou les prix remisés, et chaque défaut parti en production a coûté 1 800 € en moyenne sur le dernier projet du groupe, quand le même défaut trouvé en recette coûte une journée de développeur. Nathalie Perrin le résume : « Les remises chantier, les retours, les bons multiples : on verra en production. » Rejouée sur les trente tirages à la place des deux semaines de corrections, la recette réduite perd 9,2 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 2,
      pourquoi:
        "Ce sont de petites demandes, et les agences seront contentes le jour de l'ouverture.",
      ceQuiLeDejoue:
        "Une dizaine de petites demandes, c'est 28 jh dans le cœur de l'outil deux semaines avant l'ouverture, des défauts en plus, et des développeurs qui « finissent à 22 heures ». Le registre classait déjà le logo de l'agence sur les bons et l'export de plus dans le confort. Ouvrir d'abord à deux agences pilotes en semaine 12 fait trouver un prix remisé faux et une adresse qui saute avant l'ouverture générale. Rejouées sur les trente tirages à la place des pilotes, les dernières demandes perdent 32,1 k€ en moyenne et ne font jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu une équipe trop petite, d'autres un prestataire en retard, d'autres un périmètre qui gonfle. Quelles sources permettaient de trancher, et que disait le contrôle des livraisons de Studio Lumen ?",
    "Le planning affichait 150 jh de reste à faire, le recomptage en trouve 220. D'où viennent les 70 jh d'écart, et pourquoi personne ne les voyait ?",
    "Pourquoi deux développeurs de plus font-ils d'abord avancer le projet moins vite ? Au bout de combien de semaines un renfort devient-il utile, et que reste-t-il alors avant la date ?",
    "Bruno Castel veut le devis en ligne. Comment lui dire non sans le perdre ? Qu'est-ce qui, dans le panel et dans le comité de tri, rendait la réponse « en tête du lot 2 » défendable ?",
    "Sous le tirage n° 11, attendre que les utilisateurs clés se libèrent aurait coûté à peine moins que payer des remplaçants ; sur les trente tirages, cette attente fait mieux une fois sur deux, mais perd 3,5 k€ en moyenne. Qui avait raison ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Découper, c'est ouvrir l'essentiel à la date et le reste ensuite. Qu'est-ce qui le rend possible en semaine 7, et qu'aurait-il fallu pour le faire en semaine 1 ?",
    "Quelle règle gardez-vous pour un projet qui glisse ? Formulez-la en une phrase, avec la vitesse nette dedans.",
  ],
  prolongement: {
    enonce:
      "Une équipe de cinq développeurs abat 4 jh chacun par semaine, dont un quart part en corrections. Le reste à faire réel est de 180 jh, dont 100 jh pour le cœur de l'outil et 80 jh pour le reste ; il entre 8 jh de demandes nouvelles par semaine. La mise en service est dans 8 semaines. 1) Calculez la vitesse brute de développement, la vitesse nette, et le nombre de semaines nécessaires pour tout finir à ce rythme. 2) Un comité de tri ramène les entrées à 2 jh par semaine : même calcul. 3) Avec le comité, combien de jh l'équipe développe-t-elle en 8 semaines ? Si elle travaille sur tout le périmètre à la fois, en proportion de ce qui reste, le cœur est-il fini à la date ? Et si elle découpe et finit le cœur d'abord ? 4) Que recommandez-vous au comité de pilotage ?",
    corrige:
      "1) Vitesse brute : 5 × 4 = 20 jh, dont 15 jh de développement ; vitesse nette : 15 − 8 = 7 jh par semaine ; 180 / 7 ≈ 25,7 semaines. 2) Vitesse nette : 15 − 2 = 13 jh par semaine ; 180 / 13 ≈ 13,8 semaines, encore trop pour 8. 3) En 8 semaines, 8 × 13 = 104 jh. Sur tout le périmètre à la fois, le cœur n'en reçoit que 100 / 180, soit environ 57,8 jh : il en reste 42 à la date. En découpant, les 100 jh du cœur sont finis en 100 / 13 ≈ 7,7 semaines, avant la date. 4) Geler le périmètre et découper : ouvrir le cœur à la date, et le reste dans un lot 2, plutôt que de tout promettre avec six semaines de retard.",
  },
  evaluation: [
    "Le reste à faire réel est retrouvé à partir des sources (220 jh et non 150), et l'élève explique d'où vient l'écart.",
    "L'estimation de la semaine 3 est construite par un calcul semaine par semaine de ce qui entre et de ce qui est abattu, et l'écart avec 204 jh est expliqué.",
    "Les réponses au retard (renfort, heures, gel, découpage, report) sont comparées par leur effet sur la vitesse nette et sur la date, avec les sources.",
    "La recette est protégée, et l'élève chiffre ce que coûte un défaut trouvé en recette et un défaut livré.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 11.",
  ],
  vigilance:
    "La source de la semaine 1 donne une vitesse brute de 24 jh par semaine, dont un cinquième en corrections, et des entrées de près de 9 jh : un calcul fait sur ces seules moyennes fait baisser le reste à faire d'environ 10 jh par semaine, même sans gel, alors que le modèle, qui compte aussi les 14 demandes en attente et le temps perdu sur les défauts, le laisse presque stable. Le corrigé suit le modèle ; c'est la méthode (ce qui entre, ce qui est abattu, semaine par semaine) qu'il faut évaluer.",
};
