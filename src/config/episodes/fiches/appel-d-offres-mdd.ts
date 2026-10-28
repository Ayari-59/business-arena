/**
 * FICHE ENSEIGNANT · ÉPISODE 103, LA MARQUE DU DISTRIBUTEUR.
 *
 * Un contrat de marque de distributeur se juge à sa marge sur coût variable
 * et à ce qui peut la détruire (le lait, la capacité réelle de décembre, les
 * frais que le contrat ajoute), ni au coût complet ni au remplissage de
 * l'usine. Le piège : refuser parce que le prix est sous le coût de revient,
 * ou tout accepter pour remplir Pontivy. Les chiffres du hasard de la classe
 * sont ceux de la graine 3, les moyennes celles des 30 tirages du bilan.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "appel-d-offres-mdd",
  formations: ["bts-cg", "dcg", "but-tc"],
  programme: [
    "BTS CG · Processus 5, Analyse et prévision de l'activité",
    "DCG · UE 11, Contrôle de gestion",
    "BUT TC · Participer à la stratégie marketing et commerciale de l'organisation",
  ],
  notion:
    "Un prix sous le coût de revient complet n'est pas forcément une vente à perte : les frais fixes de l'usine sont payés avec ou sans le contrat, et ce qui compte est la marge sur coût variable qu'il ajoute, moins les seuls frais fixes qu'il crée. Mais une marge mince se détruit vite : une hausse de la matière première mal répercutée, une capacité moins grande que celle du planning, un pic de décembre qui fait manquer la marque. Les deux erreurs classiques se répondent : refuser au nom du coût complet, ou tout accepter pour « remplir l'usine ». Dans l'épisode, Opaline lance l'appel d'offres de son fromage blanc à marque propre, 4 200 tonnes par an pendant deux ans, à 1,56 € le kilo livré, 22 % sous Kerbrélan. Le coût variable livré est de 1,46 € : 10 centimes de marge par kilo, 420 k€ par an, quand le coût complet de 1,71 € fait annoncer au directeur financier 630 k€ de perte. La capacité libre est de 410 tonnes par mois au planning, 360 au rythme réel, et 220 en décembre, pour 420 demandées. L'élève découvre qu'un contrat se chiffre avant de se signer, que la clause du lait et le plafond de décembre valent plus que quelques centimes de prix, que la MDD sortira de toute façon, et qu'une seconde MDD qui demande une équipe de nuit se juge sur ce qu'elle ajoute.",
  objectifs: [
    "Je calcule la marge sur coût variable d'un produit à partir de la décomposition de son coût, et je la distingue du résultat en coût complet.",
    "Je n'impute à une commande que les frais fixes qu'elle ajoute, et je dis pourquoi les autres n'entrent pas dans la décision.",
    "Je confronte un volume à la capacité réelle d'une ligne, au mois le plus chargé, et je chiffre ce qui manque.",
    "J'évalue ce qu'une clause de révision ou une baisse de prix fait à une marge mince, sous plusieurs scénarios.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "La distinction entre charges variables et charges fixes, la marge sur coût variable et le coût de revient complet doivent avoir été vus ; une soustraction suffit pour le calcul. La marque de distributeur, l'appel d'offres d'une enseigne et le TRS d'une ligne peuvent être présentés en quelques minutes avant de jouer.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/appel-d-offres-mdd?hasard=3 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous présentez la situation en deux phrases (un appel d'offres de 4 200 tonnes, un prix cible 22 % sous la marque) sans parler de marge sur coût variable, et vous demandez de noter sur papier la marge calculée en semaine 1 et la réponse proposée au comité.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez la réponse de la semaine 1 (prix cible au contrat type, pas de réponse, prix cible avec clause et plafond, coût complet) et celle de la semaine 11 à Celtis. Un binôme qui a fini tôt refait le compte de décembre : 1 000 tonnes théoriques, 65 % de TRS, 430 tonnes pour Kerbrélan, 420 pour la MDD.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées, puis vous reconstruisez le calcul avec la classe à partir de la fiche de coût d'Iwan Szymanski : le lait, les ferments, l'emballage, l'énergie, le transport. Vous faites expliquer les valeurs éloignées (−15, 15 ou 54 centimes), puis vous écrivez les deux comptes côte à côte : 420 k€ de marge sur coût variable par an, 80 k€ de cellule MDD, et les 630 k€ de « perte » en coût complet, qui ne disparaîtraient pas si l'on refusait.",
    },
    {
      minutes: 20,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 3 (baisser de 4 %, de 2 %, tenir, lâcher les conditions) et de la semaine 11. Pour la semaine 3, vous faites calculer ce que coûte un point de baisse : 1,56 centime par kilo, 131 k€ sur les deux ans, quand la marge est de 10 centimes. Pour la semaine 11, vous faites calculer la MDD de Celtis : 6 centimes par kilo à 1,52 €, 150 k€ par an, pour une équipe de nuit de 300 k€.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 3, Opaline attribue le contrat à Kerbrélan avec sa clause trimestrielle et son plafond de décembre : « Chiffrer avant de remplir » vaut 365 k€ ; « Remplir l'usine » détruit 1 259 k€, avec 197 tonnes manquantes en décembre et la MDD de Celtis signée à perte ; « Protéger la marque par principe » détruit 348 k€, Kerbrélan perdant ses ventes face à une MDD fabriquée par Nordal. Vous montrez ensuite la commande de douze mois d'emballages : elle fait mieux que la clause de reprise 11 fois sur 30, et perd 52 k€ en moyenne. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : un contrat se juge à la marge sur coût variable qu'il ajoute, moins les frais fixes qu'il crée, et moins ce qui peut la détruire. Vous la déclinez en trois gestes : refaire la fiche de coût, compter la capacité au mois le plus chargé et au TRS réel, écrire la clause de la matière première comme si elle allait monter. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 10,
    etapes: [
      "Source « Décomposer avec Iwan Szymanski le coût d'un kilo de fromage blanc » : lait, 2,5 litres par kilo à 460 € les 1 000 litres, soit 2,5 × 0,460 = 1,15 €.",
      "Même source : ferments et ingrédients 0,06 € ; emballage aux couleurs d'Opaline 0,13 € ; énergie 0,07 € ; transport jusqu'aux entrepôts d'Opaline 0,05 €. Coût variable livré : 1,15 + 0,06 + 0,13 + 0,07 + 0,05 = 1,46 € le kilo.",
      "Marge sur coût variable au prix cible : 1,56 − 1,46 = 0,10 €, soit 10 centimes par kilo. Le chiffre ne dépend pas du hasard ; l'épisode le juge juste à 1 centime près, proche à 3.",
      "Les frais fixes de Pontivy (9,2 M€ répartis sur 36 800 tonnes, 0,25 € par kilo) sont payés avec ou sans le contrat : ils n'entrent pas dans la marge. Le contrat ajoute 4 200 000 × 0,10 = 420 000 € de marge par an, moins la cellule MDD de 80 000 € qu'il crée.",
      "Pour la suite : un point de baisse retire 1,56 centime par kilo, et une hausse de 10 % du lait, mal répercutée par le contrat type, en laisserait environ 10,4 centimes à la charge de la laiterie : la marge est réelle, mais mince.",
    ],
    erreurs: [
      {
        valeur: -15,
        cause:
          "Le coût de revient complet de 1,71 € est retenu (1,56 − 1,71) : c'est le raisonnement du directeur financier, qui répartit sur le contrat des frais fixes payés de toute façon.",
      },
      {
        valeur: 15,
        cause:
          "Le transport Kerfroid est oublié (1,56 − 1,41) : le prix cible est un prix livré entrepôt, le transport fait partie du coût variable.",
      },
      {
        valeur: 54,
        cause:
          "Le prix de cession de Kerbrélan (2,00 €) remplace le prix cible (2,00 − 1,46) : l'appel d'offres porte sur la MDD, 22 % moins chère.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Yannig Le Goaziou veut remplir Pontivy : 4 200 tonnes, c'est l'usine pleine et le coût de revient qui tombe à 1,68 €. Le contrat type est la réponse la plus simple à comparer.",
      ceQuiLeDejoue:
        "Fanchon Lozac'h reprend la capacité réelle : 360 tonnes libres par mois au TRS des douze derniers mois, pour 350 demandées, et 220 en décembre pour 420, quand chaque tonne qui manque à Kerbrélan coûte environ 700 €. Hoel Quiniou lit la clause du contrat type : une révision une fois par an, au-delà de 8 %, qui laisserait à la laiterie environ 10,4 centimes par kilo d'une hausse de 10 % du lait, plus que la marge. Rejoué sur les trente tirages à la place de l'offre avec clause et plafond, le contrat type perd 211 k€ en moyenne et ne fait mieux que 6 fois.",
    },
    {
      decision: 0,
      option: 1,
      pourquoi:
        "Morwenna Pellen le dit : une MDD 22 % sous Kerbrélan, dans les mêmes rayons, c'est notre marque qu'on attaque ; mieux vaut ne pas la fabriquer.",
      ceQuiLeDejoue:
        "Gwenvred Dagorn le rappelle : la MDD sortira, que la laiterie la fabrique ou non. Ne pas répondre laisse le contrat à Nordal, ses 420 k€ de marge sur coût variable par an avec, et Kerbrélan subit quand même la MDD en rayon. L'étude d'image citée par la cheffe de marque date de deux ans et ne dit rien du report face à une MDD moins chère. Rejoué sur les trente tirages à la place de l'offre avec clause et plafond, le refus de répondre perd 223 k€ en moyenne et ne fait mieux que 10 fois.",
    },
    {
      decision: 0,
      option: 3,
      pourquoi:
        "Iwan Szymanski ne voit pas comment signer sous le coût de revient : à 1,71 €, pas un kilo n'est vendu à perte.",
      ceQuiLeDejoue:
        "Sa propre fiche de coût le dit : les frais fixes de Pontivy, salaires mensualisés, amortissements et structure, sont payés avec ou sans le contrat, qui n'en ajoute qu'un, la cellule MDD de 80 k€. Nordal, qui transporte de plus loin, est attendu entre 1,55 et 1,65 € : une offre à 1,71 € ne sera pas retenue, et la laiterie perd 420 k€ de marge par an sans économiser un euro de frais fixes. Rejouée sur les trente tirages à la place de l'offre avec clause et plafond, l'offre au coût complet perd 241 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "L'acheteuse dit que Kerbrélan n'est pas le mieux-disant, et le directeur général ne veut pas perdre 4 200 tonnes pour quelques centimes : 4 % de baisse, et elle n'aura plus d'argument.",
      ceQuiLeDejoue:
        "Baptistin Haddadi raconte comment Zineb Hascoët négocie : elle dit à chaque candidat, à chaque tour, qu'il n'est pas le mieux-disant. Nordal descend rarement sous le prix cible, et ne le peut guère plus que Kerbrélan. Iwan Szymanski chiffre la baisse : 4 % retirent 6,24 centimes sur 10 de marge, 524 k€ sur les deux ans. Rejouée sur les trente tirages à la place de l'offre tenue, la baisse de 4 % perd 442 k€ en moyenne et ne fait mieux qu'une fois.",
    },
    {
      decision: 1,
      option: 3,
      pourquoi:
        "Une offre au contrat type, plus simple à comparer, garde le prix : lâcher la clause du lait et le plafond de décembre, c'est un geste qui ne coûte rien.",
      ceQuiLeDejoue:
        "Il coûte ce que les deux clauses protégeaient : environ 10,4 centimes par kilo si le lait monte de 10 %, trois fois sur dix selon l'OP, et les tonnes de décembre qui manqueraient à Kerbrélan, à 700 € chacune. Opaline ne compte la variante qu'un point plus cher que le contrat type, et Nordal est attendu dans toute la fourchette de 1,55 à 1,65 €. Rejoué sur les trente tirages à la place de l'offre tenue, l'abandon des conditions perd 211 k€ en moyenne et ne fait mieux que 6 fois.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Pontivy a toujours passé ses pics : pourquoi engager des frais avant d'avoir le contrat ?",
      ceQuiLeDejoue:
        "Les essais industriels donnent le TRS de décembre, et Fanchon Lozac'h refait le mois : la ligne ne libère pas les tonnes que la MDD demandera, et chaque tonne manquante coûte environ 700 € de ruptures et de pénalités, deux décembres sur la durée du contrat. Les renforts ne s'engagent que si le contrat est signé : la suppléance du week-end coûte 50 k€ par décembre pour 130 tonnes. Rejoué sur les trente tirages à la place de la suppléance, tenir le plan de charge perd 55 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 3,
      pourquoi:
        "Douze mois d'emballages d'un coup, c'est 1,1 centime de moins par kilo : le prix le plus bas.",
      ceQuiLeDejoue:
        "Azilis Cozic mesure le risque : Opaline refond ses chartes tous les trois ou quatre ans, la dernière a quatre ans, une chance sur deux qu'elle change d'ici l'été, et un changement rend inutilisable en moyenne la moitié du stock imprimé, 273 k€ pour douze mois. Opaline a accepté une clause de reprise trois fois sur quatre. Sous le tirage n° 3, la charte a changé et la commande de douze mois coûte 248 k€ de plus ; sur les trente tirages, 52 k€ de plus en moyenne, même si elle fait mieux 11 fois sur 30.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "La MDD arrive en rayon 22 % sous Kerbrélan : doubler le plan de Morwenna, c'est ne laisser aucun client à la MDD.",
      ceQuiLeDejoue:
        "Morwenna Pellen revoit ce que les promotions ont rendu : face à une clientèle fidèle, le plan doublé ne retient que 15 % du report, pour 100 k€ par an ; il ne vaut la peine que face à une clientèle sensible au prix. L'étude d'Ifeoma Bozec, pour 12 k€, dit quel profil est celui de Kerbrélan chez Opaline et où le report se fait, magasin par magasin. Sous le tirage n° 3, la clientèle était fidèle ; rejoué sur les trente tirages à la place de l'étude, le plan doublé perd 90 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 1,
      pourquoi: "Le plan de lancement est prêt et coûte 50 k€ par an : rien de plus à décider.",
      ceQuiLeDejoue:
        "Le plan prévu retient 10 % du report face à une clientèle fidèle, 45 % face à une clientèle moyenne, 55 % face à une clientèle sensible au prix : sa valeur dépend du profil, que personne n'a mesuré. L'étude de report le mesure avant la mise en rayon et permet de doubler, garder ou supprimer le plan, ciblé sur les magasins où le report se fait. Rejoué sur les trente tirages à la place de l'étude, le plan prévu perd 44 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Opaline et Celtis, c'est Pontivy qui tourne jour et nuit et le coût de revient qui fond : on prend.",
      ceQuiLeDejoue:
        "Fanchon Lozac'h calcule ce que Celtis demande à Pontivy : avec Opaline, la ligne est pleine, et les 208 tonnes par mois de Celtis exigent une équipe de nuit toute l'année, 300 k€. À 1,52 €, Celtis rapporte 6 centimes par kilo, 150 k€ par an : moins que l'équipe de nuit, qu'il faudrait 1,58 € pour couvrir. Morwenna Pellen ajoute que l'acheteur de Celtis connaîtrait les coûts de la laiterie à la prochaine négociation annuelle. Rejouée sur les trente tirages à la place de la contre-proposition, l'acceptation perd 335 k€ en moyenne et ne fait mieux que 4 fois.",
    },
    {
      decision: 5,
      option: 1,
      pourquoi: "Une deuxième MDD, c'est trop de dépendance aux enseignes : mieux vaut refuser.",
      ceQuiLeDejoue:
        "Baptistin Haddadi explique comment Celtis achète : elle veut un second fournisseur et l'origine Bretagne, que Nordal ne peut pas lui donner, et ses acheteurs acceptent une contre-proposition argumentée environ une fois sur deux. À 1,62 €, sa MDD couvre l'équipe de nuit et reste 19 % sous Kerbrélan. Sous le tirage n° 3, Celtis a refusé la contre-proposition, et le refus finit au même niveau ; rejoué sur les trente tirages, il perd 167 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, le directeur général voulait remplir l'usine, le directeur financier voyait une vente à perte et la cheffe de marque une attaque contre Kerbrélan. Chacun avait un chiffre : lequel répondait à la question « que gagne la laiterie à signer » ?",
    "Le contrat rapporte 10 centimes par kilo de marge sur coût variable, et 15 centimes de perte en coût complet. Que deviendraient les 0,25 € de frais fixes par kilo si la laiterie refusait le contrat ? Quels frais fixes le contrat ajoute-t-il vraiment ?",
    "Le planning affiche 410 tonnes libres par mois, le TRS réel 360, décembre 220. Pourquoi faut-il juger la capacité au mois le plus chargé, et au TRS mesuré plutôt qu'à celui du planning ?",
    "Une baisse de 4 % au second tour, ou tenir son offre : que dit la façon dont l'acheteuse négocie ? Que coûtait chaque point de baisse rapporté à la marge ?",
    "Sous le tirage n° 3, la charte d'Opaline a changé : ceux qui ont commandé douze mois d'emballages ont perdu 248 k€ de plus que la clause de reprise. Sur les trente tirages, cette commande fait pourtant mieux 11 fois. Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "La MDD de Celtis à 1,52 € rapporte 150 k€ par an et demande une équipe de nuit de 300 k€. Pourquoi la même commande pouvait-elle être bonne sans le contrat d'Opaline, et mauvaise avec ?",
    "Quelle règle présentez-vous au comité de direction pour la prochaine MDD ? Formulez-la en une phrase, avec la marge sur coût variable et la capacité dedans.",
  ],
  prolongement: {
    enonce:
      "Une biscuiterie répond à l'appel d'offres d'une enseigne pour des sablés à sa marque : 2 000 tonnes par an, au prix cible de 2,20 € le kilo livré. Le coût variable livré est de 1,95 € le kilo, dont 1,20 € de farine, de beurre et de sucre. Les frais fixes de l'usine, 6 M€ par an, sont répartis sur 20 000 tonnes ; le contrat demanderait une cellule MDD de 60 000 € par an, et la capacité suffit. 1) Calculez la marge sur coût variable par kilo et le coût de revient complet. Le contrat est-il « vendu à perte » ? 2) Que rapporte le contrat par an ? 3) Les matières premières montent de 10 % et le contrat ne les répercute pas la première année : que rapporte-t-il alors ? 4) Que coûte, sur un an, une baisse de 2 % du prix accordée pour gagner l'appel d'offres ?",
    corrige:
      "1) Marge sur coût variable : 2,20 − 1,95 = 0,25 € par kilo ; frais fixes par kilo : 6 000 000 / 20 000 000 = 0,30 € ; coût complet : 2,25 €. En coût complet, le contrat « perd » 5 centimes par kilo, mais les 0,30 € de frais fixes sont payés avec ou sans lui. 2) 2 000 000 × 0,25 − 60 000 = 440 000 € par an. 3) La hausse retire 0,12 € par kilo : 2 000 000 × 0,13 − 60 000 = 200 000 €, moins de la moitié. 4) 2 % de 2,20 € = 4,4 centimes par kilo, soit 88 000 € par an : une clause de révision sur les matières premières protège davantage la marge qu'elle ne coûte en compétitivité.",
  },
  evaluation: [
    "La marge sur coût variable d'un kilo est calculée juste à partir de la fiche de coût, et l'élève explique pourquoi le coût complet ne décide pas du contrat.",
    "La décision de répondre s'appuie sur la marge que le contrat ajoute, moins les seuls frais fixes qu'il crée, et sur la capacité réelle de la ligne au mois le plus chargé.",
    "Les conditions du contrat (clause du lait, plafond de décembre, emballages) sont évaluées par ce qu'elles protègent sous les scénarios des sources.",
    "La réponse à Celtis est jugée sur ce que sa MDD ajoute à Pontivy, une fois le contrat d'Opaline pris en compte.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 3.",
  ],
  vigilance:
    "L'épisode pose que la loi impose aux contrats MDD une clause de révision automatique liée au prix de la matière première agricole, en laissant la formule aux parties, et cite les plafonds des promotions (34 % en valeur, 25 % du volume) : ces règles issues des lois EGalim ont été modifiées à plusieurs reprises, et un enseignant de droit commercial doit les vérifier avant de les présenter. La règle des deux tiers de DLC à réception est une exigence contractuelle de l'enseigne dans l'épisode. Le passage du coût complet à la marge sur coût variable suppose que les frais fixes ne bougent pas avec le volume, sauf la cellule MDD et une équipe de nuit : c'est une simplification à dire aux étudiants.",
};
