/**
 * FICHE ENSEIGNANT · ÉPISODE 97, LE VIRAGE VERS LE DOMICILE.
 *
 * Une stratégie sous incertitude réglementaire : suivre les financements qui
 * se déplacent, par étapes réversibles et testées, plutôt que défendre ses
 * places ou tout transformer d'un coup. Le piège : confondre les recettes
 * qu'une place transformée fait perdre avec ce qu'elle coûte vraiment. Les
 * chiffres du hasard de la classe sont ceux de la graine 17, les moyennes
 * celles des 30 tirages du bilan.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "virage-domiciliaire",
  formations: ["dcg", "but-gea"],
  programme: [
    "DCG · UE 7, Management",
    "BUT GEA · Stratégie d'entreprise",
    "École de commerce · Stratégie d'entreprise",
  ],
  notion:
    "Quand le financeur annonce qu'il déplace l'argent (moins de places d'établissement, plus de solutions à domicile) sans avoir encore voté le budget, deux erreurs se répondent : défendre ses places et en demander d'autres, ou tout transformer d'un coup sur la foi du projet. La bonne stratégie va là où va l'argent, à son pas : par étapes réversibles, en testant ce qu'on sait faire, et en ne transformant que ce qui sera financé. Dans l'épisode, le projet de schéma départemental gèle les places d'EHPAD jusqu'en 2031 ; l'Association Solvanne a 480 places et 210 personnes en liste d'attente à Dijon, Orchidia ouvre une résidence services, et le financement du schéma ne sera voté que le 22 juin : une chance sur deux appliqué, trois sur dix différé, deux sur dix renforcé. Vingt places de Beaune transformées feraient perdre 631 k€ de recettes par an, mais les crédits de soins restent, 17 k€ de charges par place disparaissent et les nouveaux services rapportent 9,6 k€ : sans financement, une place transformée coûte 5,0 k€ par an ; financée à 11 k€, elle rapporte. L'élève découvre qu'une recette perdue n'est pas une perte, qu'une convention avec le concurrent vaut mieux qu'un immeuble à 11 M€, et qu'un engagement se prend par paliers conditionnés au financement voté.",
  objectifs: [
    "Je décompose les recettes d'une place par financeur pour savoir ce qu'une transformation fait vraiment perdre.",
    "Je passe des recettes perdues au coût net d'une décision, en retirant les charges qui disparaissent et en ajoutant les recettes nouvelles.",
    "Je compare des options stratégiques sous plusieurs scénarios de financement pondérés par leur probabilité.",
    "Je préfère une étape réversible et testée à un engagement ferme quand l'information arrive après la décision.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de diagnostic stratégique, d'options stratégiques, de partenariat et de scénario doivent avoir été vues ; un produit et un pourcentage suffisent pour le calcul. Les trois sections tarifaires d'un EHPAD (hébergement, dépendance, soins), le schéma départemental de l'autonomie et le CPOM peuvent être présentés en quelques minutes avant de jouer.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/virage-domiciliaire?hasard=17 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous présentez la situation en deux phrases (le schéma gèle les places d'EHPAD, Orchidia ouvre une résidence services) sans parler de sections tarifaires, et vous demandez de noter sur papier les recettes calculées en semaine 1 et l'orientation proposée au bureau.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez l'orientation de la semaine 1 et la réponse à l'appel à candidatures de la semaine 4, où la classe se partage entre candidater sur trente personnes, en promettre soixante, ou s'abstenir. Un binôme qui a fini tôt passe des 631 k€ de recettes perdues au coût net des vingt places transformées, avec et sans financement.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées, puis vous reconstruisez le calcul avec la classe à partir de la décomposition d'une place de Beaune : hébergement et dépendance, pas les soins, à 92 % d'occupation. Vous faites expliquer les valeurs éloignées (887, 686 ou 100 k€), puis vous écrivez la deuxième ligne de la source : 31,6 k€ de recettes perdues par place, 17 k€ de charges qui disparaissent, 9,6 k€ de participations nouvelles, soit 5,0 k€ de coût net sans financement, et 6,0 k€ de gain avec les 11 k€ du département.",
    },
    {
      minutes: 20,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 (défendre, étapes, grand virage, attente), de la semaine 2 (résidence services, convention, laisser faire, baisse de prix) et de la semaine 4. Pour la semaine 2, vous faites lire le compte de la résidence : 88 % d'occupation pour couvrir ses charges, quand les résidences voisines d'Orchidia tombent à 85 %. Pour la semaine 4, vous faites calculer ce que coûte la promesse de soixante personnes : 30 k€ de déficit chaque année.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 17, le schéma est appliqué, Orchidia accepte la convention et le virage par étapes crée 991 k€ de valeur ; « Défendre nos lits » en détruit 615 k€, l'attente 314 k€. Mais l'ARS n'a pas retenu le dossier de Solvanne : ceux qui n'ont pas candidaté finissent 20 k€ au-dessus, et ceux qui ont promis soixante personnes, retenus, 40 k€ au-dessus. Vous faites lire les trente tirages : ne pas candidater perd 272 k€ en moyenne, la promesse 266 k€. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : aller là où va l'argent, à son pas, par des étapes que l'on peut défaire. Vous la déclinez en trois gestes : chiffrer ce qu'une transformation coûte vraiment, financeur par financeur ; s'allier à ce qu'on ne sait pas faire plutôt que l'imiter ; conditionner chaque engagement au financement voté. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 631.3,
    etapes: [
      "Source « Décomposer, section par section, ce que rapporte une place de Beaune » : une journée se facture 72 € d'hébergement, 22 € de dépendance et 38 € de soins, et l'EHPAD est à 92 % d'occupation.",
      "Même source : dans le CPOM, les crédits de soins d'une place transformée restent à l'association pour le nouveau service ; ce qui disparaît, ce sont l'hébergement et la dépendance, soit 72 + 22 = 94 € par journée facturée.",
      "Par place et par an : 94 × 365 × 0,92 = 31 565,20 €, les 31,6 k€ de la source.",
      "Pour vingt places : 20 × 31 565,20 = 631 304 €, soit 631,3 k€ de recettes perdues chaque année. Le chiffre ne dépend pas du hasard ; l'épisode le juge juste à 10 k€ près, proche à 40 k€.",
      "Ce n'est pas le coût de la transformation : chaque place économise 17 k€ de charges qui suivent la place et rapporte 9,6 k€ de participations aux nouveaux services, soit 31,6 − 17 − 9,6 = 5,0 k€ de coût net par place sans financement, 100 k€ pour vingt places ; avec les 11 k€ du département si le schéma est appliqué, chaque place rapporte 6,0 k€.",
    ],
    erreurs: [
      {
        valeur: 886.5,
        cause:
          "Les 38 € de soins sont comptés (132 € par journée) : le forfait de l'ARS d'une place transformée reste à l'association pour le nouveau service.",
      },
      {
        valeur: 686.2,
        cause:
          "L'occupation est oubliée (20 × 365 × 94) : les places de Beaune sont occupées à 92 %, une place vide ne facture rien.",
      },
      {
        valeur: 100,
        cause:
          "Le coût net sans financement (20 × 5,0 k€) est donné à la place des recettes perdues : la question porte sur les recettes, le coût net en est la suite.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "210 personnes en liste d'attente à Dijon : le besoin est en places d'EHPAD, il faut les défendre et en demander 24 de plus.",
      ceQuiLeDejoue:
        "Le schéma vient d'écrire qu'il n'y aura aucune place d'EHPAD nouvelle jusqu'en 2031, et Anneliese Teyssandier le dit : ne jamais demander ce que l'autorité de tarification vient d'écrire qu'elle ne donnera pas. La direction de l'autonomie prévoit 3 places vides par an hors Dijon si le schéma est appliqué, 5 s'il est renforcé, à 20 k€ chacune, et moins chez ceux qui offrent hébergement temporaire et accueil de jour. Rejouée sur les trente tirages à la place du virage par étapes, la défense des places perd 345 k€ en moyenne et ne fait mieux que 2 fois.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Orchidia va capter les seniors de Dijon : une résidence de 80 logements à côté de Montchapet garde notre public, et la Banque Saônelle suit.",
      ceQuiLeDejoue:
        "Le compte prévisionnel : 1 488 k€ de recettes à pleine occupation pour 600 k€ de charges et 704 k€ d'annuité, soit un seuil de 88 % d'occupation, 91 % avec la caution, quand les résidences voisines d'Orchidia sont restées à 85 %. Eudoxie Rambourg rappelle que 11 M€ font près de quatre fois ce que le plan d'investissement laisse disponible. Orchidia signe une convention sept fois sur dix avec un gestionnaire qui a une offre à domicile, pour 33 k€ par an au SAAD. Rejouée sur les trente tirages à la place de la convention, la résidence perd 472 k€ en moyenne et ne fait mieux qu'une fois.",
    },
    {
      decision: 2,
      option: 2,
      pourquoi:
        "Les infirmières sont à flux tendu avec le pilote, et l'équipe de Montchapet ne se dédouble pas : gardons nos forces pour nos EHPAD.",
      ceQuiLeDejoue:
        "Le cahier des charges : la mission coûte 355 k€ par an pour 400 k€ de dotation, 45 k€ d'excédent, et cofinance le dispositif renforcé à 800 € par personne. Là où un EHPAD voisin a obtenu le centre de ressources, les places vides des autres ont augmenté de 15 % ; là où l'association l'a obtenu, ses EHPAD en ont perdu 30 % de moins. Sous le tirage n° 17, l'ARS a choisi l'EHPAD public et l'abstention finit 20 k€ au-dessus ; rejouée sur les trente tirages à la place d'une candidature à trente personnes, elle perd 272 k€ en moyenne et ne fait mieux que 6 fois.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Les familles sont conquises, aucune hospitalisation évitable en cinq mois : il faut tenir le plan et passer à 50 personnes en septembre.",
      ceQuiLeDejoue:
        "La décomposition du coût : 16 300 € par personne au lieu des 14 000 € du plan, à cause d'une équipe de nuit propre, ramenés à 15 300 € avec la nuit de Montchapet. L'adhésion constatée (environ une famille sur deux, pour 80 % au plan) ne remplit pas 50 places sur 80 familles éligibles, et une place recrutée mais vide coûte le cinquième d'une place pleine. Ysolde Rouzeau ajoute que le dispositif marche pour les personnes qui ont un aidant à demeure. Rejouée sur les trente tirages à la place de l'extension révisée, l'extension du plan perd 270 k€ en moyenne et ne fait mieux qu'une fois.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "L'aile est prête, le CPOM inscrit l'accueil de jour, les familles disent qu'elles viendraient : ouvrir en septembre comme prévu.",
      ceQuiLeDejoue:
        "La comparaison avec les accueils du département : 12 places portent 150 k€ de charges fixes et ne les couvrent qu'au-delà de 63 % de remplissage ; sans transport, ils tournent à 65 % si la demande est forte, 40 % si elle est faible, et personne ne sait laquelle à Beaune. Greta Quenardel l'a entendu : beaucoup d'aidants ne conduisent plus. L'enquête coûte 12 k€ et dit s'il faut 12 places et un minibus ou 6 places portées par les tournées. Rejouée sur les trente tirages à la place de l'enquête, l'ouverture comme prévu perd 189 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Le trésorier le dit : les schémas passent, les murs restent ; signer à l'identique n'engage rien tant que le financement n'est pas voté.",
      ceQuiLeDejoue:
        "Le chiffrage des cadres : la dotation complémentaire du SAAD, 47,5 k€ par an, n'est versée qu'aux gestionnaires engagés dans le schéma, et les paliers ne transforment que les places que le vote finance, avec une clause de revoyure qui permet d'en rouvrir. À l'identique, l'association perd la dotation et garde les places vides que la direction de l'autonomie prévoit. Rejoué sur les trente tirages à la place des paliers, le CPOM à l'identique perd 326 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, le trésorier voyait 210 personnes en attente, la directrice de Beaune des recettes et une équipe à perdre. Qu'est-ce que le projet de schéma changeait à la question, et qu'est-ce qu'il ne disait pas encore ?",
    "Vingt places transformées font perdre 631 k€ de recettes par an, et pourtant chacune ne coûte que 5,0 k€ sans financement. Comment passe-t-on de l'un à l'autre ? Pourquoi le forfait de soins n'est-il pas dans les recettes perdues ?",
    "Face à Orchidia, certains ont construit une résidence, d'autres ont proposé une convention. Qu'est-ce que Solvanne savait faire qu'Orchidia ne savait pas, et inversement ? Que dit un seuil de 88 % d'occupation quand le marché est à 85 % ?",
    "Sous le tirage n° 17, l'ARS a retenu l'EHPAD public : ceux qui n'ont pas candidaté finissent 20 k€ au-dessus de ceux qui l'ont fait. Sur les trente tirages, s'abstenir perd 272 k€ en moyenne. L'abstention était-elle une bonne décision ? Et la promesse de soixante personnes, retenue sous ce tirage ?",
    "Le vote du 22 juin arrive après la plupart de vos décisions. Lesquelles de vos décisions pouvaient se défaire si le schéma était différé ? Lesquelles ne le pouvaient pas ?",
    "Ouvrir l'accueil de jour comme prévu, ou interroger d'abord les aidants : que valait une information à 12 k€ quand on ne savait pas, à une chance sur deux, si la demande était forte ?",
    "Quel mandat recommandez-vous au conseil pour le prochain CPOM ? Formulez la règle en une phrase, avec le vote du financement dedans.",
  ],
  prolongement: {
    enonce:
      "Un accueil de jour de 10 places est ouvert 240 jours par an. Une journée de présence rapporte 75 €, et l'accueil porte 126 000 € de charges fixes par an. 1) Quel taux de remplissage couvre ses charges ? 2) Sans transport, il se remplit à 60 % ; quel est son résultat ? 3) Avec un minibus et un chauffeur, 25 000 € par an, il se remplirait à 90 %. Le minibus vaut-il la peine ? 4) Si la demande était faible, le remplissage serait de 40 % sans transport et de 60 % avec : que conseillez-vous ?",
    corrige:
      "1) Capacité : 10 × 240 = 2 400 journées, soit 180 000 € à pleine occupation ; seuil : 126 000 / 180 000 = 70 %. 2) 0,60 × 180 000 − 126 000 = −18 000 €. 3) 0,90 × 180 000 − 126 000 − 25 000 = +11 000 € : le minibus fait gagner 29 000 €. 4) Sans transport : 0,40 × 180 000 − 126 000 = −54 000 € ; avec : 0,60 × 180 000 − 126 000 − 25 000 = −43 000 €. Dans les deux cas l'accueil de 10 places perd de l'argent : il faut d'abord savoir si la demande est forte, et réduire la taille si elle ne l'est pas.",
  },
  evaluation: [
    "Les recettes perdues sont calculées juste (hébergement et dépendance, soins exclus, occupation de 92 %), et l'élève passe de ces recettes au coût net d'une place transformée, avec et sans financement.",
    "L'orientation choisie est argumentée sous les trois scénarios du schéma, pondérés par leur probabilité, et non sous le seul scénario annoncé.",
    "La réponse à Orchidia compare ce que l'association sait faire, ce qu'elle coûterait à construire et ce qu'une convention rapporte.",
    "Les engagements (extension du pilote, accueil de jour, mandat du CPOM) sont dimensionnés sur ce que les sources ont mesuré et conditionnés au financement voté.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 17.",
  ],
  vigilance:
    "L'épisode simplifie la tarification d'un EHPAD (un prix d'hébergement, un tarif de dépendance et un forfait de soins moyens) et pose que les crédits de soins d'une place transformée restent à l'association dans le CPOM : c'est une hypothèse de l'épisode, qui dépend de ce que l'ARS accepte, et un enseignant de la filière voudra la nuancer. Le schéma départemental de l'autonomie, le centre de ressources territorial et le dispositif renforcé de soutien à domicile existent dans le droit, mais leurs montants et leurs règles sont ceux de l'épisode.",
};
