/**
 * FICHE ENSEIGNANT · ÉPISODE 59, LA RÉNOVATION SANS FERMER.
 *
 * Phaser un chantier dans un hôtel ouvert : une chambre fermée ne coûte que les
 * nuits où l'hôtel aurait été plein, et les nuisances coûtent plus que les
 * chambres fermées. Le piège : garder tout ouvert « pour ne perdre aucune
 * nuit », et croire les comptes rendus de l'entreprise.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "renovation-sans-fermer",
  formations: ["bts-mhr", "bts-mhr-bc"],
  programme: [
    "BTS MHR · Bloc 2, Mercatique des services en hôtellerie restauration",
    "BTS MHR · Bloc 4, Pilotage de la production de services en hôtellerie restauration",
  ],
  notion:
    "Une nuit invendue est perdue pour toujours : d'où l'idée qu'un chantier doit fermer le moins de chambres possible. L'erreur classique consiste à compter les chambres fermées au lieu des nuits où l'hôtel aurait été plein, et à oublier ce que coûtent les clients logés à côté du chantier. Dans l'épisode, L'Escale Chambéry-Gare, 72 chambres sur quatre étages, doit rénover 54 chambres avant la rentrée. L'entreprise propose de garder l'hôtel ouvert, par lots de six chambres, de juin à fin août. Mais en juin, du lundi au jeudi, l'hôtel est plein de clients d'affaires : fermer un étage une semaine y coûte 58 nuits ; en août, fermer deux étages pendant quatre semaines ne coûte que 232 nuits à 86 €, environ 20 k€, parce que la demande ne dépasse les 36 chambres restantes que quelques soirs. Les nuisances, elles, se paient partout : un client voisin du chantier note plus d'un point de moins, se plaint, obtient un geste, et son entreprise s'en souvient à la rentrée, comme Cimalp, 26 k€ en jeu. L'élève découvre qu'on regroupe le chantier dans le creux, qu'on isole les clients d'affaires, qu'on prévient avant la plainte, et qu'on mesure l'avancement soi-même : les comptes rendus de l'entreprise n'ont montré à mi-parcours qu'environ 30 % du retard réel.",
  objectifs: [
    "Je calcule le chiffre d'affaires perdu par une fermeture de chambres à partir de la demande nuit par nuit, et non du nombre de chambres fermées.",
    "Je compare le coût des chambres fermées à celui des nuisances sur les clients présents.",
    "J'informe les clients d'un chantier avant leur séjour, et je loge les clients les plus sensibles loin des travaux.",
    "Je suis l'avancement d'un chantier par une mesure indépendante, et je décide tôt de rattraper un retard.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Le taux d'occupation, le prix moyen et la notion de capacité doivent être connus ; un tableau de demande nuit par nuit suffit pour le calcul. Le phasage d'un chantier et le coût d'opportunité d'une chambre fermée peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/renovation-sans-fermer?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous présentez Ana Sousa et les 54 chambres à rénover avant le 31 août, et vous demandez de noter sur papier, avant de valider la semaine 1, le chiffre d'affaires perdu si l'on ferme deux étages pendant les quatre semaines d'août, et le calcul qui y mène.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez le phasage choisi en semaine 1 (lots en site ouvert, un étage à la fois, août, fermeture totale) et la réponse au retard en semaine 8, où la classe se partage. Un binôme qui a fini tôt calcule le coût d'une semaine de fermeture d'un étage en juin, puis en août.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous recopiez au tableau la semaine-type d'août (36, 40, 42, 42, 40, 50 et 60 chambres demandées), puis vous tracez la ligne des 36 chambres restantes : seules les nuits au-dessus de la ligne sont perdues, 58 par semaine. Vous faites le calcul (58 × 4 × 86 € = 19 952 €) et vous faites expliquer les valeurs éloignées (86,7 k€, 22,7 k€ ou 5,0 k€). Vous refaites le même calcul pour un étage en juin (58 nuits en une semaine, à 98 €, soit 5,7 k€) : en une seule semaine de juin, un étage coûte plus du quart de ce que coûtent deux étages pendant tout le mois d'août.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 2 (que dire aux clients) et de la semaine 8 (le retard). Ceux qui ont gardé l'hôtel ouvert défendent leur argument ; vous faites lire la source sur les avis pendant d'autres rénovations (plus d'un point de moins pour les voisins du chantier, trois fois moins s'ils ont été prévenus) et le conseil d'Hermine Collomb. Pour le retard, vous faites lire ce que Mérandaz annonçait à mi-parcours sur ses quatre derniers chantiers : 30 % du retard réel.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 12, l'été est normal. « Regrouper, isoler, suivre » finit à 370,7 k€, sans débordement en septembre et sans perdre Cimalp ; « Laisser faire l'entreprise » finit à 266,1 k€ et « Ne perdre aucune nuit » à 246,4 k€ : chantier débordé de plus d'une semaine et demie en septembre, une note tombée sous 7,5, Cimalp parti. Vous faites remarquer que le chiffre d'affaires des trois mois est proche ; c'est la rentrée qui fait l'écart. Vous montrez ensuite le retard : en semaine 8, décaler la fin en septembre fait mieux que rattraper 12 fois sur 30, quand l'équipe de renfort n'est pas libre en août, mais perd 7,7 k€ en moyenne.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : une chambre fermée ne coûte que les nuits où l'hôtel aurait été plein ; un client exposé coûte toujours. Vous la déclinez : regrouper le chantier dans le creux, prévenir avant la plainte, loger les clients d'affaires loin des travaux, pointer l'avancement soi-même, rattraper tôt. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 19.95,
    etapes: [
      "Source « Lire les prévisions de réservations nuit par nuit » : en août, une semaine-type demande 36, 40, 42, 42, 40, 50 et 60 chambres, du dimanche au samedi, à 86 € de prix moyen.",
      "Fermer deux étages (36 chambres) en laisse 72 − 36 = 36 à vendre. Une nuit n'est perdue que le soir où la demande dépasse 36 : 0, 4, 6, 6, 4, 14 et 24 chambres, soit 58 nuits par semaine.",
      "Sur les quatre semaines d'août : 58 × 4 = 232 nuits perdues.",
      "Chiffre d'affaires perdu : 232 × 86 = 19 952 €, soit environ 20,0 k€. Le chiffre ne dépend pas du hasard : il est calculé sur la prévision d'un été comme l'an dernier ; l'épisode le juge juste à 0,5 k€ près, proche à 2 k€.",
      "Pour comparer : fermer un seul étage une semaine de juin, du lundi au jeudi plein d'affaires, fait perdre 58 nuits à 98 €, soit 5,7 k€ en une semaine ; la même source le dit, environ 6 k€.",
    ],
    erreurs: [
      {
        valeur: 86.7,
        cause:
          "Toutes les chambres fermées comptées comme des nuits perdues (36 × 7 × 4 × 86 €) : en août, l'hôtel n'aurait pas rempli les étages fermés la plupart des soirs.",
      },
      {
        valeur: 22.7,
        cause:
          "Le prix moyen de juin, 98 €, appliqué aux nuits d'août (232 × 98) : en août, le prix moyen est de 86 €.",
      },
      {
        valeur: 5,
        cause:
          "Une seule semaine comptée (58 × 86 €) : la question porte sur les quatre semaines d'août.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "L'entreprise le propose, on ne perd presque aucune nuit, et la réception refuse de fermer quoi que ce soit en juin.",
      ceQuiLeDejoue:
        "Les lots de six chambres exposent presque tous les clients pendant treize semaines, juin compris, quand l'hôtel est plein de clients d'affaires, les plus sévères : la source sur les avis compte plus d'un point de moins pour les voisins d'un chantier. Brice Tchamba lui-même donne la cadence : quatre chambres et demie par semaine en site occupé contre six sur étage fermé, et une à trois semaines de retard sur ses trois derniers hôtels. Hermine Collomb l'avait dit : comptez les clients logés à côté du chantier. Rejoués sur les trente tirages à la place du chantier regroupé dans le creux, les lots perdent 41,9 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Annoncer le chantier ferait fuir les clients : mieux vaut gérer les plaintes au cas par cas, à l'arrivée.",
      ceQuiLeDejoue:
        "Bookalia et Voyagio exigent de signaler tout chantier qui peut gêner le séjour ; un client qui découvre un chantier non signalé peut exiger d'être relogé, environ 75 € la nuit. La source sur les avis montre qu'un client prévenu se plaint trois fois moins. Un appel aux comptes d'affaires et un petit-déjeuner offert aux chambres voisines (4 € de coût de revient) coûtent peu. Rejoué sur les trente tirages à la place de l'annonce avec un geste prévu, le silence perd 9,4 k€ en moyenne et ne fait jamais mieux ; sous le tirage n° 12, il perd 33,7 k€.",
    },
    {
      decision: 1,
      option: 3,
      pourquoi:
        "Un hôtel en travaux fait fuir les clients : baisser tous les prix de 10 % tient le taux d'occupation, sans avoir à parler du chantier.",
      ceQuiLeDejoue:
        "La baisse porte sur toutes les chambres, y compris celles qui ne sont pas exposées, alors que les chambres voisines se vendent déjà 15 % moins cher ; et elle ne prévient personne, ce que les plateformes exigent. La perte de cet été ne vient pas du taux d'occupation : en août, la demande ne dépasse les chambres ouvertes que quelques soirs. Rejouée sur les trente tirages à la place de l'annonce avec un geste prévu, la baisse de 10 % perd 22 k€ en moyenne et ne fait jamais mieux ; sous le tirage n° 12, elle perd 45,9 k€.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Remplir tous les étages ouverts, sans règle nouvelle, c'est ne perdre aucune nuit.",
      ceQuiLeDejoue:
        "Le plan des étages fait avec Rosalba Mendoza montre qu'un étage en travaux s'entend au-dessus et au-dessous ; en juillet et en août, il reste 18 chambres loin du chantier, et les clients d'affaires ne font que 35 % puis 15 % des clients : il y a la place de les y loger tous en semaine. Brice ajoute que la dépose commence à 7 h 30, au marteau-piqueur ; décaler le bruit entre 9 h 30 et 17 h ne coûte qu'environ deux jours de chantier. Rejoué sur les trente tirages à la place du plan d'occupation, Hostéo laissé à lui-même perd 6,5 k€ en moyenne et ne fait jamais mieux ; sous le tirage n° 12, il perd 30,9 k€.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "L'entreprise envoie un compte rendu chaque vendredi, sans frais : « rien d'inquiétant », dit Brice.",
      ceQuiLeDejoue:
        "La source sur les comptes rendus de Mérandaz : sur ses quatre derniers chantiers, ils annonçaient à mi-parcours environ 30 % du retard réel, le reste apparaissant dans les trois dernières semaines, trop tard pour renforcer. Baltazar Quénel pointe chambre par chambre pour 1 500 € : « je compte ce qui est fini ». Rejoué sur les trente tirages à la place du pointage, s'en tenir aux comptes rendus perd 11 k€ en moyenne ; il fait mieux 7 fois, quand le chantier n'a presque pas de retard.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Brice s'engage à rattraper, il a déjà fini des chantiers plus en retard, et maintenir le plan ne coûte rien.",
      ceQuiLeDejoue:
        "Brice lui-même le dit dans la source sur le rattrapage : un retard qu'on laisse courir grossit d'un quart d'ici la fin. Une semaine de chantier en septembre fait perdre 54 nuits, environ 6 k€, sans compter le bruit pour les clients d'affaires revenus et les clients à reloger à 75 € la nuit. Rattraper tout de suite coûte 1 500 € de mobilisation et 5 000 € par semaine rattrapée. Rejoué sur les trente tirages à la place du rattrapage, maintenir le plan perd 19,7 k€ en moyenne ; il fait mieux 6 fois, quand le retard était minime ; sous le tirage n° 12, il perd 30,3 k€.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "L'Orméa propose 89 € : une remise de 10 % sur le contrat d'automne garde Cimalp au même prix.",
      ceQuiLeDejoue:
        "Ysé Durafour l'a toujours dit : elle tient d'abord à des nuits calmes, ses ingénieurs partent à 6 heures sur les chantiers ; ce qu'elle attend, c'est la preuve que le chantier sera fini à leur retour, et des chambres garanties. La visite des étages rénovés avec le planning ne coûte qu'une heure, la remise environ 4 400 €. Rejouée sur les trente tirages à la place de la visite, la remise perd 5,7 k€ en moyenne et ne fait mieux qu'une fois ; sous le tirage n° 12, elle perd 26,5 k€.",
    },
  ],
  debrief: [
    "En semaine 1, l'entreprise proposait de ne fermer presque aucune chambre. Qu'est-ce que le tableau de la demande nuit par nuit montrait sur juin et sur août ? Pourquoi la même chambre fermée coûte-t-elle si différemment ?",
    "Fermer deux étages en août coûte environ 20 k€. Que coûte un client d'affaires logé à côté du chantier en juin ? Avec quelles sources pouvait-on le chiffrer ?",
    "Pourquoi un client prévenu se plaint-il trois fois moins qu'un client surpris, même avec le même bruit ? Qu'est-ce qui change pour lui ?",
    "Les comptes rendus de l'entreprise montraient environ 30 % du retard réel à mi-parcours. Qu'est-ce qu'un pointage indépendant apporte, et pourquoi le retard se voit-il tard et se rattrape-t-il tôt ?",
    "Sous le tirage n° 12, l'équipe de renfort était libre en août. Sur les trente tirages, décaler la fin en septembre fait mieux 12 fois, quand elle ne l'est pas. Rattraper restait-il la bonne décision ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Le chiffre d'affaires des trois mois est proche entre les trois méthodes du bilan ; c'est la rentrée qui fait l'écart. Pourquoi le siège a-t-il raison de compter l'effet sur la clientèle d'affaires de septembre ?",
    "Quelle règle laissez-vous au prochain directeur qui rénove sans fermer ? Formulez-la en une phrase, avec le mot « creux » dedans.",
  ],
  prolongement: {
    enonce:
      "Un hôtel de 40 chambres doit fermer un étage de 12 chambres pendant trois semaines. Une semaine-type de juillet demande 30, 34, 36, 36, 32, 26 et 28 chambres, du dimanche au samedi, à 80 € ; une semaine-type d'août, 22, 26, 28, 28, 26, 30 et 34 chambres, à 75 €. 1) Combien de nuits et de chiffre d'affaires perd-on par semaine en fermant l'étage en juillet ? En août ? 2) Que coûtent les trois semaines de chantier en juillet, et en août ? 3) On propose de garder l'étage ouvert en juillet et de faire les travaux par lots : 25 chambres occupées voisines du chantier chaque nuit pendant les trois semaines, vendues 15 % moins cher. Que coûte la seule remise ?",
    corrige:
      "1) Il reste 28 chambres. En juillet, les nuits au-dessus de 28 : 2, 6, 8, 8, 4, 0 et 0, soit 28 nuits × 80 € = 2 240 € par semaine. En août : 0, 0, 0, 0, 0, 2 et 6, soit 8 nuits × 75 € = 600 € par semaine. 2) Juillet : 3 × 2 240 = 6 720 € ; août : 3 × 600 = 1 800 €. 3) 25 × 7 × 3 = 525 nuitées exposées, à 15 % de 80 €, soit 12 € de remise chacune : 6 300 €, presque autant que la fermeture en juillet, et plus de trois fois la fermeture en août, avant même les plaintes, les gestes et les avis.",
  },
  evaluation: [
    "Le chiffre d'affaires perdu en août est calculé juste, nuit par nuit, à partir de la demande qui dépasse les chambres restantes.",
    "Le phasage choisi est argumenté par la comparaison entre les nuits perdues et les clients exposés, selon le mois et la clientèle.",
    "L'information des clients et la répartition des chambres sont justifiées par les sources sur les avis et sur les clients d'affaires.",
    "Le suivi du chantier et la réponse au retard s'appuient sur une mesure de l'avancement réel et sur le coût d'un débordement en septembre.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "L'épisode pose que les plateformes exigent de signaler un chantier et qu'un client non prévenu peut exiger d'être relogé : ce sont les règles des plateformes telles que l'épisode les formule, à côté de l'obligation générale d'informer le client des caractéristiques essentielles de la prestation avant la réservation. Les horaires de chantier et le travail du samedi sont pris comme des options commerciales ; ils dépendent aussi des règles locales sur le bruit et du droit du travail des entreprises du bâtiment.",
};
