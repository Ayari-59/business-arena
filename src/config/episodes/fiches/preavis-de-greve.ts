/**
 * FICHE ENSEIGNANT · ÉPISODE 26, LE PRÉAVIS DE GRÈVE.
 *
 * La négociation salariale sous préavis : ouvrir les chiffres, négocier les
 * intérêts plutôt que les positions, tenir la parole donnée. Le piège : la
 * fermeté de principe, puis la concession sous la menace, qui apprend que la
 * pression paie. Les chiffres du hasard de la classe sont ceux de la graine 12.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "preavis-de-greve",
  formations: ["stmg", "bts-gpme", "dcg"],
  programme: [
    "STMG · Ressources humaines et communication, Thème 3, La recherche de cohésion, un levier d'amélioration des relations de travail et du climat social",
    "BTS GPME · Bloc 3, Gérer le personnel et contribuer à la gestion des ressources humaines de la PME",
    "DCG · UE 3, Droit social",
  ],
  notion:
    "Une revendication est une position ; derrière elle, il y a des intérêts, et c'est sur eux qu'un accord se construit. L'erreur classique consiste à négocier le pourcentage : annoncer un chiffre et s'y tenir « pour ne pas payer tous les ans », puis céder sous la menace, ce qui apprend aux équipes que la pression paie. Dans l'épisode, Christine Lacroix, DRH d'Arvel Distribution en Rhône-Alpes, ouvre la négociation salariale des trois dépôts sous un préavis de grève pour la semaine 4 : 4,5 % d'augmentation générale réclamés, une enveloppe de 3 % de la masse salariale (4,2 M€, soit 126 k€) et une saison haute qui commence en semaine 8. Les sources montrent ce qu'il y a derrière les 4,5 % : les trois premiers niveaux de la grille (48 salariés sur 120) rattrapés par le Smic, un préparateur de six ans de maison qui gagne 38 € de plus qu'un débutant, des samedis annoncés le jeudi pour le samedi, et une étude sur la pénibilité des quais promise l'an dernier et jamais lancée. L'élève découvre qu'un paquet bâti sur ces sujets (1,5 % pour tous, +40 € sur les premiers niveaux, des samedis planifiés quinze jours avant) coûte 97 k€ quand 2,8 % pour tous en coûte 118, qu'une promesse enfin tenue vaut plus qu'un point de pourcentage, et que la confiance, qui part de 30 sur 100, se construit engagement après engagement.",
  objectifs: [
    "Je distingue les positions des intérêts dans une revendication, et je les fais dire en rencontrant les élus hors de la table.",
    "Je chiffre des mesures salariales (augmentation générale, mesure ciblée, prime) en part de la masse salariale, et je compare ce qu'elles coûtent à ce qu'elles valent pour les salariés.",
    "Je construis un paquet de négociation dans une enveloppe, sur les sujets des salariés plutôt qu'en pourcentage.",
    "Je tiens les engagements pris et j'organise leur suivi, parce que la confiance conditionne la négociation suivante.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les acteurs du dialogue social (délégués syndicaux, CSE), la négociation obligatoire sur les salaires et le droit de grève doivent avoir été vus en cours, ainsi que la notion de masse salariale. La négociation sur les intérêts et le coût d'un conflit peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/preavis-de-greve?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous rappelez que personne n'a le mauvais rôle : les élus défendent des salariés rattrapés par le Smic, la direction une enveloppe et une saison. Vous demandez de noter sur papier, avant de valider la semaine 1, l'estimation de la confiance des salariés dans la direction en semaine 3 et ce qui la justifie, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans donner de piste, et vous relevez deux choses : l'ouverture de la négociation en semaine 1 (2,5 %, les chiffres ouverts, 3 % tout de suite, le report) et ce qui est proposé en semaine 5. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 7 : laisser la logistique imposer les samedis annoncés le jeudi.",
    },
    {
      minutes: 15,
      titre: "Correction de l'estimation de la semaine 1",
      detail:
        "Vous inscrivez au tableau les estimations relevées et vous les rapprochez du choix d'ouverture de chacun. Vous partez des 30 sur 100 du baromètre au lendemain du préavis, puis vous donnez ce que le modèle a lu en semaine 3 : 42 en ouvrant les chiffres, 33 en proposant 3 % tout de suite, 24 en demandant le report, 22 en annonçant 2,5 % et pas au-delà. Vous faites expliquer les valeurs éloignées (30, 50).",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 et ceux de la semaine 5. Pour la semaine 5, vous faites refaire au tableau le chiffrage d'Anouk Bouaziz : 1 % d'augmentation générale coûte 42 k€, +40 € par mois sur les trois premiers niveaux 34 k€, une prime de 300 € pour tous 52 k€. Vous faites comparer ce que touche un salarié des premiers niveaux avec 2,8 % pour tous et avec le paquet. Vous enchaînez sur la veille de la grève : le juriste social rappelle que remplacer des grévistes par des intérimaires est interdit, et les chefs d'équipe disent ce qui fera grève lundi.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 12, la méthode « Partager les chiffres, négocier les intérêts, tenir parole » finit 20,4 k€ au-dessus de l'enveloppe, « Attentiste » 113,2 k€ en dessous et « Fermeté, puis concession » 147,6 k€ en dessous ; sur les trente tirages, la première ne tient l'enveloppe que 19 fois, les deux autres jamais. Sous ce tirage, les équipes ont voté la levée du préavis (six chances sur dix avec cette méthode) et l'accord a été signé en semaine 10. Vous montrez la décision où le hasard renverse le plus souvent le jugement : l'avance de 1 % contre la levée du préavis, qui fait mieux que la méthode 11 fois sur 30, parce qu'elle achète la levée presque à coup sûr.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau les trois mouvements de l'épisode : ouvrir (les chiffres, les sujets, avant tout pourcentage), construire sur les intérêts (les premiers niveaux, les samedis, l'étude des quais), tenir (une commission de suivi, un calendrier affiché, un rappel de paie). Vous opposez la fermeté de principe, qui pousse à la grève, et la concession sous la menace, qui la prépare pour l'année suivante. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 42,
    etapes: [
      "Point de départ : au lendemain du préavis, le baromètre social donne une confiance des salariés dans la direction de 30 sur 100. Les sources disent pourquoi : l'an dernier, 2,2 % accordés après deux jours de grève, et l'étude sur la pénibilité des quais promise par écrit, jamais lancée (« Pourquoi on vous croirait cette fois ? »).",
      "Ce que fait l'ouverture des chiffres en semaine 1 : pour la première fois, la direction montre la masse salariale, la grille, les marges et la comparaison avec la branche, et ne met aucun pourcentage sur la table. Laurine Jacquier : « C'est la première fois qu'on nous montre les vrais chiffres. » Le modèle compte 12 points de confiance gagnés en semaine 1.",
      "Ce qui ne bouge pas encore : la décision de la semaine 3 (la méthode et l'étude des quais lancée contre la levée du préavis) ne prend effet qu'en semaine 4, et aucun engagement n'a encore été tenu ou rompu.",
      "Estimation : 30 + 12 = 42 sur 100 en semaine 3. L'épisode juge juste à 4 points près, proche à 10. Le chiffre ne dépend presque pas du hasard : 42 sous le tirage n° 12, de 37 à 42 selon les trente tirages, quand un imprévu tombe avant la semaine 3.",
      "Pour comparer : en annonçant 2,5 % et pas au-delà, 30 − 8 = 22 ; en proposant tout de suite 3 %, 33 ; en demandant le report, 24. La fermeté de principe fait perdre en une semaine ce que l'ouverture fait gagner.",
    ],
    erreurs: [
      {
        valeur: 30,
        cause:
          "Le chiffre du lendemain du préavis reporté tel quel, comme si la façon d'ouvrir la négociation ne changeait rien à ce que les salariés pensent de la direction.",
      },
      {
        valeur: 50,
        cause:
          "L'effet de l'étude des quais, enfin lancée, ajouté dès la semaine 3 : la proposition de la semaine 3 est faite le mercredi et ne compte qu'à partir de la semaine 4, après le vote des équipes.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Hugues Mallet le dit : « Si on lâche à la première menace, on paiera tous les ans. » Annoncer 2,5 % et s'y tenir montre que la direction ne cède pas, en gardant une marge sur l'enveloppe.",
      ceQuiLeDejoue:
        "La rencontre avec les élus hors de la table montre qu'ils parlent peu des 4,5 % : ils parlent des samedis annoncés le jeudi, sept fois l'an dernier, et de l'étude jamais lancée. Jean-Luc Ardouin le résume : « Une revendication, c'est une position. Demande-leur ce qu'il y a derrière. » Le chiffre ferme fait tomber la confiance de 30 à 22 et maintient le préavis (« Alors on laisse »). Rejoué sur les trente tirages à la place des chiffres ouverts, il perd 54,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Céder avant la grève, c'est récompenser la menace : mieux vaut la laisser avoir lieu, en organisant la continuité avec l'encadrement, pour 3 000 €.",
      ceQuiLeDejoue:
        "Les chefs d'équipe disent ce qui fera grève lundi : les samedis et l'étude jamais lancée ; « si la direction lance l'étude cette semaine, la moitié des gars ne voit plus pourquoi perdre deux jours de salaire ». Lancer l'étude, c'est tenir une promesse écrite de l'an dernier, pas céder. Deux jours de grève coûtent des livraisons manquées et des artisans qui ne reviennent pas. Rejoué sur les trente tirages à la place de la méthode et de l'étude, laisser la grève avoir lieu perd 22,9 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 1,
      pourquoi:
        "La saison commence lundi et il faut six samedis : la logistique les impose comme tous les ans, et c'est le moins cher, 1 000 € par semaine.",
      ceQuiLeDejoue:
        "Les samedis annoncés le jeudi sont l'un des sujets mêmes de la négociation, et le paquet de la semaine 5 promet des plannings connus quinze jours avant. Laurine Jacquier prévient : « Aux quais, tout le monde y voit la réponse de la direction à la négociation. » Les chefs d'équipe comptent une trentaine de volontaires sur cent vingt pour des samedis majorés et connus à l'avance. Rejoué sur les trente tirages à la place des samedis volontaires, l'imposition perd 27,3 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 1,
      pourquoi:
        "La négociation s'éternise : constater le désaccord et appliquer la proposition de la direction permet d'en sortir.",
      ceQuiLeDejoue:
        "Laurine Jacquier dit en aparté ce qui manque pour signer, et ce n'est pas forcément du pourcentage : un geste sur les premiers niveaux et une date pour faire le point. Le procès-verbal de désaccord déclenche l'appel à la grève de la semaine suivante, en pleine saison, quand un jour de dépôt arrêté coûte autour de 22 k€ de marge selon Anouk Bouaziz. Rejoué sur les trente tirages à la place du dernier paquet chiffré, il perd 13,8 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Proposer tout de suite toute l'enveloppe, 3 %, désamorce la grève avant qu'elle commence.",
      ceQuiLeDejoue:
        "Mettre toute l'enveloppe en augmentation générale ne laisse rien pour les premiers niveaux, ni pour une mesure ciblée : un pourcentage annoncé ne se reprend pas. Et la leçon que retiennent les équipes est que le préavis a payé, ce qui fait monter ce qu'il faudra pour signer. La grille montrait pourtant le vrai problème : 48 salariés sur 120 rattrapés par le Smic, quand les autres sont 2 % au-dessus de la branche. Rejoué sur les trente tirages à la place des chiffres ouverts, il perd 62 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Emmanuel Kouassi ne veut pas de dépôt à l'arrêt en avril : signer à leurs conditions sauve la saison.",
      ceQuiLeDejoue:
        "Walid Benkhaled le dit en signant : « Les équipes retiendront qu'il suffisait de menacer la saison. Nous aussi. » Les conditions des élus se paient en augmentation générale, durable, au-delà de ce qui manquait vraiment, et le directeur régional avait prévenu : « ne me ramène pas un accord à n'importe quel prix ». Rejoué sur les trente tirages à la place du dernier paquet, signer à leurs conditions perd 28,4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 2,
      pourquoi:
        "Une prime de fin de conflit de 100 € par salarié tourne la page et remercie les équipes.",
      ceQuiLeDejoue:
        "Elle coûte 17 k€ et ne tient aucun engagement : la paie ne peut pas appliquer les nouvelles mesures ce mois-ci, et l'an dernier, après la signature, « plus rien n'avait bougé ». Walid Benkhaled : « Aux quais, on en conclut que le conflit rapporte. » La commission de suivi, le calendrier affiché et le rappel coûtent 2 000 €. Rejouée sur les trente tirages à la place de la commission, la prime perd 24,3 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu une surenchère avant les élections, d'autres un problème de salaires sous le marché, d'autres des attentes précises. Quelles sources permettaient de trancher, et que disait la comparaison avec les accords de la branche ?",
    "Qu'est-ce qu'il y avait derrière les 4,5 % ? Citez les trois sujets que les élus et les chefs d'équipe nomment, et la source de chacun.",
    "Le paquet de la semaine 5 coûte 97 k€, 2,8 % pour tous en coûte 118. Pour un salarié des trois premiers niveaux, lequel des deux rapporte le plus ? Pourquoi la prime de 300 € est-elle moins bien reçue qu'une augmentation de même coût ?",
    "Lancer l'étude des quais la veille de la grève : est-ce céder sous la menace, ou tenir une promesse ? Qu'est-ce qui distingue les deux ?",
    "Sur les trente tirages, l'avance de 1 % contre la levée du préavis fait mieux que la méthode 11 fois, parce qu'elle achète la levée presque à coup sûr ; elle reste moins bonne en moyenne. Sous le tirage n° 12, les équipes ont levé le préavis sans avance. Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "La confiance part de 30 sur 100. Quelles décisions la font monter, lesquelles la font baisser, et pourquoi compte-t-elle au moment de signer ?",
    "Quelle règle gardez-vous pour une négociation salariale sous préavis ? Formulez-la en une phrase, avec un engagement à tenir dedans.",
  ],
  prolongement: {
    enonce:
      "Une entreprise de 120 salariés a une masse salariale annuelle de 4 200 000 €, charges comprises, et une enveloppe de négociation de 3 %. Les 48 salariés des trois premiers niveaux gagnent environ 1 900 € brut par mois. Trois propositions sont possibles. A : 2,8 % pour tous. B : 1,5 % pour tous et une prime de 300 € par salarié. C : 1,5 % pour tous et +40 € brut par mois pour les 48 salariés des premiers niveaux. Les charges patronales représentent 45 % du brut. 1) Que coûte 1 % d'augmentation générale ? Que coûtent la prime de B et la mesure ciblée de C, charges comprises ? 2) Calculez le coût de chaque proposition et ce qu'il reste de l'enveloppe. 3) Combien gagne en plus par mois un salarié des premiers niveaux avec A, et avec C ? 4) Laquelle recommandez-vous, et pourquoi la prime de B ne règle-t-elle pas le problème de la grille ?",
    corrige:
      "1) 1 % = 42 000 €. Prime de B : 300 × 120 × 1,45 = 52 200 €. Mesure ciblée de C : 40 × 12 × 48 × 1,45 = 33 408 €. 2) Enveloppe : 3 % = 126 000 €. A : 2,8 × 42 000 = 117 600 €, reste 8 400 €. B : 1,5 × 42 000 = 63 000 € + 52 200 € = 115 200 €, reste 10 800 €. C : 63 000 + 33 408 = 96 408 €, reste 29 592 €. 3) Avec A, 2,8 % de 1 900 € = 53,20 € par mois ; avec C, 1,5 % de 1 900 € = 28,50 € + 40 € = 68,50 € par mois. 4) C : elle coûte 21 192 € de moins que A et rapporte 15,30 € de plus par mois aux premiers niveaux, ceux que le Smic a rattrapés ; il reste de quoi financer l'organisation des samedis. La prime de B est versée une fois, ne s'ajoute pas au salaire de base et ne rouvre pas l'écart entre un débutant et un salarié de six ans de maison.",
  },
  evaluation: [
    "Le diagnostic de la semaine 1 distingue les positions (les 4,5 %) des intérêts (les premiers niveaux, les samedis, l'étude promise) avec les sources qui les montrent.",
    "L'estimation de la confiance en semaine 3 est raisonnée à partir du baromètre et de la façon d'ouvrir la négociation, et l'écart avec 42 est expliqué.",
    "Les mesures proposées sont chiffrées juste en part de la masse salariale, tiennent dans l'enveloppe, et sont comparées par ce qu'elles valent pour les salariés concernés.",
    "Les engagements pris sont tenus et suivis (l'étude des quais, les samedis planifiés, le calendrier des mesures), et l'élève explique ce qu'ils changent pour la négociation suivante.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "Dans le secteur privé, le Code du travail n'impose pas de préavis avant une grève (il est obligatoire dans les services publics) : le « préavis » de l'épisode est une annonce des délégués, à présenter comme telle. L'interdiction de remplacer des grévistes par des salariés intérimaires, ou en contrat à durée déterminée, est juste. Le travail du samedi n'ouvre pas en lui-même droit à une majoration légale : ce sont les heures supplémentaires qui sont majorées, et le reste relève de la convention collective ou d'un accord. La retenue sur salaire des jours de grève, évoquée par les chefs d'équipe, est proportionnelle à la durée de l'arrêt. La confiance au baromètre est un indicateur du modèle que les sources ne chiffrent pas : c'est le raisonnement qu'il faut corriger.",
};
