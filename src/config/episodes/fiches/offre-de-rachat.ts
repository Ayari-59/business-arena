/**
 * FICHE ENSEIGNANT · ÉPISODE 113, L'OFFRE DE RACHAT.
 *
 * Évaluer une offre sur l'entreprise contre trois repères : la valeur
 * indépendante sur un plan réaliste, le multiple des transactions comparables,
 * et les conditions derrière le prix. Le piège : signer l'exclusivité avant
 * l'expiration, ou refuser par principe ; puis croire au prix affiché.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "offre-de-rachat",
  formations: ["dscg", "dcg"],
  programme: [
    "DSCG · UE 2, Finance",
    "DCG · UE 6, Finance d'entreprise",
    "École de commerce · Stratégie d'entreprise",
  ],
  notion:
    "Une offre de rachat ne se juge ni à son montant ni à son délai, mais contre trois repères : ce que vaut l'entreprise si ses actionnaires la gardent, sur un plan réaliste et actualisé ; ce que d'autres acquéreurs paieraient, lu sur les transactions comparables ; et ce qu'il y a derrière le prix (la dette reprise, la baisse demandée après l'audit, le complément de prix, la garantie, les engagements). L'erreur classique consiste à signer l'exclusivité « avant que l'offre n'expire », ou à la refuser par attachement, puis à croire au prix affiché le plus haut. Dans l'épisode, Yannig Le Goaziou, directeur général de la Laiterie de Kerbrélan, reçoit du Groupe Nordal une offre à 7,5 fois l'EBE, 97,5 M€ de valeur d'entreprise, valable six semaines ; la famille Guivarc'h est divisée. L'élève découvre que les cessions comparables donnent 8,1 fois l'EBE en médiane, soit 105,3 M€, que le plan réaliste pondéré par trois scénarios et les points faibles donne 94 M€ (78 M€ pour les titres, dette de 16 M€ déduite), que Nordal peut payer jusqu'à 8,5 fois et relève face à un rival crédible, qu'un complément de prix sur l'EBE vaut bien moins que les 4 M€ de prix ferme qu'il remplace, et que les producteurs, sans garanties écrites, peuvent faire jouer une clause de 8 M€.",
  objectifs: [
    "J'estime une valeur d'entreprise par la méthode des comparables, en choisissant la médiane, et je passe de la valeur d'entreprise à la valeur des titres.",
    "Je calcule une valeur indépendante par l'espérance de plusieurs scénarios, points faibles déduits, et je la compare à une offre.",
    "Je lis les conditions d'une offre (exclusivité, audit, complément de prix, garantie d'actif et de passif) et j'en chiffre la valeur espérée.",
    "Je conduis une négociation de cession en mettant en concurrence sans enchère ouverte et en protégeant les informations sensibles.",
  ],
  prerequis:
    "Les méthodes d'évaluation d'une entreprise (comparables, actualisation des flux), la distinction entre valeur d'entreprise et valeur des titres, et le calcul d'une espérance doivent avoir été vus en cours. Le complément de prix, la garantie d'actif et de passif et l'audit d'acquisition peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/offre-de-rachat?hasard=8 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, la valeur d'entreprise de la laiterie au multiple d'EBE des transactions comparables et le calcul qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez deux choses : la recommandation de la semaine 1 (accepter avec exclusivité, décliner, ni oui ni non, enchères) et la structure de prix choisie en semaine 8, où la classe se partage entre le prix affiché, le tout ferme et le complément sur les volumes. Un binôme qui a fini tôt calcule la valeur indépendante de la laiterie et la valeur des titres dans chaque voie.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées, de la plus basse à la plus haute, et refaites le calcul avec la classe à partir des comparables : les cinq multiples rangés (7,4, 7,8, 8,1, 8,5, 10,9), la médiane 8,1, fois 13 M€ d'EBE, 105,3 M€. Vous faites expliquer les valeurs éloignées (111, 97,5, 89,3), puis vous construisez avec la classe les deux autres repères : 94 M€ de valeur indépendante, et la valeur des titres de chaque voie, dette de 16 M€ déduite.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 4 (accepter la meilleure offre, second tour, prolongation, expiration) et de la semaine 8. Pour la semaine 4, vous faites lire ce que Nordal peut payer : jusqu'à 8,5 fois l'EBE, et environ 0,35 fois de plus qu'un rival crédible dans un second tour discret. Pour la semaine 8, vous faites calculer la valeur espérée du complément sur l'EBE : environ 1,9 M€ pour 4 M€ de prix ferme abandonnés.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 8, le marché laitier se dégrade, la station d'épuration demande des travaux, Kérouval offre 7,9 fois l'EBE : « Juger l'offre contre ses trois repères » obtient 84,3 M€ pour les titres, « Signer avant l'expiration » 63,8 M€ (les producteurs ne renouvellent pas, la clause de 8 M€ joue), l'attentisme 54,9 M€. Sur les trente tirages, 85,1 M€ en moyenne contre 70,6 et 78,2 M€. Vous faites remarquer que garder la laiterie fait mieux 11 fois, le plus souvent quand le marché est porteur : le hasard révèle le marché, il ne dit pas s'il fallait parier dessus.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de Pétronille Le Scouarnec : une offre se juge contre ce que vaut l'entreprise gardée, calculé honnêtement, ce que d'autres paieraient, et ce qu'il y a derrière le prix ; ne pas donner l'exclusivité avant de savoir, ne pas refuser avant d'avoir calculé. Vous la déclinez sur les six décisions : repères, audit vendeur et data room restreinte, second tour discret, baisse ramenée au coût réel, prix ferme, engagements écrits. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 105.3,
    etapes: [
      "Source « Rassembler les cessions de laiteries comparables » : cinq cessions depuis quatre ans, à 7,4, 7,8, 8,1, 8,5 et 10,9 fois l'EBE.",
      "Les praticiens retiennent la médiane, qu'un cas hors norme ne déplace pas : rangés dans l'ordre, les cinq multiples ont pour valeur centrale 8,1. La marque biologique très disputée, à 10,9, tirerait la moyenne vers le haut (8,54).",
      "Même source : EBE de la laiterie au dernier exercice, 13,0 M€ (7 % de 185 M€ de chiffre d'affaires).",
      "Valeur d'entreprise au multiple des comparables : 8,1 × 13,0 = 105,3 M€. Le chiffre ne dépend ni du hasard ni des décisions ; l'épisode le juge juste à 2 M€ près, proche à 5.",
      "Les deux autres repères : l'offre de Nordal, 7,5 × 13 = 97,5 M€ ; la valeur indépendante, 0,3 × 112 + 0,45 × 97 + 0,25 × 78 = 96,75 M€ selon le plan réaliste d'Iwan Szymanski, moins les points faibles attendus (0,5 × 3,5 + 0,4 × 2,5 = 2,75 M€), soit 94 M€. Pour les titres, dette nette de 16 M€ déduite : 89,3 M€ aux comparables, 81,5 M€ à l'offre, 78 M€ en restant indépendant.",
    ],
    erreurs: [
      {
        valeur: 111,
        cause:
          "La moyenne des cinq multiples (8,54 × 13 ≈ 111 M€) au lieu de la médiane : la cession très disputée à 10,9 la tire vers le haut.",
      },
      {
        valeur: 97.5,
        cause:
          "Le multiple de l'offre de Nordal (7,5) pris pour celui du marché : l'offre est le chiffre à juger, pas le repère qui la juge.",
      },
      {
        valeur: 89.3,
        cause:
          "La dette nette de 16 M€ retirée : c'est la valeur des titres, pas la valeur d'entreprise que la question demande.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Alanig Guivarc'h le dit : 97,5 M€, c'est inespéré avec le prix du lait, et une offre qui expire ne se représente pas.",
      ceQuiLeDejoue:
        "Les comparables donnent 105,3 M€ en médiane, et Nordal peut payer jusqu'à 8,5 fois l'EBE ; ses derniers rachats montrent qu'il relève face à un rival discret (de 7,2 à 8,0 en Normandie) mais qu'il demande toujours l'exclusivité d'emblée, qui lui ôte toute raison de le faire. Pétronille Le Scouarnec : « Ne donne pas l'exclusivité avant de savoir. » Rejouée sur les trente tirages à la place de « ni oui ni non », l'acceptation avec exclusivité laisse 7,8 M€ de moins en moyenne aux actionnaires et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 1,
      pourquoi:
        "Gaïdig Guivarc'h le dit : la laiterie a été fondée avec trois cents producteurs du Méné, et Nordal ferme ce qu'il achète.",
      ceQuiLeDejoue:
        "Le plan réaliste d'Iwan Szymanski donne 94 M€ de valeur indépendante, points faibles comptés, soit 78 M€ pour les titres, sous les 81,5 M€ de l'offre et les 89,3 M€ des comparables ; le plan de la direction à 121 M€ suppose un marché porteur et aucun point faible. Refuser sans avoir calculé, c'est parier sur le marché porteur. Sous le tirage n° 8, le marché se dégrade et le refus laisse 29,5 M€ de moins ; sur les trente tirages, 6,8 M€ de moins en moyenne, et il fait mieux 11 fois, presque toujours quand le marché est porteur.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Chaque jour perdu est un risque que Nordal retire son offre : ouvrir toute la data room dès lundi tient le délai.",
      ceQuiLeDejoue:
        "Maître Albiach le rappelle : Nordal est le premier concurrent, et s'il voit les marges par enseigne et les prix MDD sans acheter, il saura où attaquer aux prochains appels d'offres (environ 1,5 M€ de valeur chez un fromager du Finistère). Nathanaëlle Kerleroux ajoute qu'un point faible découvert par l'acquéreur se paie 1,4 à 2 fois son coût, et qu'un audit vendeur à 350 k€ le ramène à son coût. Rejouée sur les trente tirages à la place de l'audit vendeur, l'ouverture totale laisse 1,1 M€ de moins en moyenne ; elle fait mieux 8 fois, quand l'audit ne trouve rien et que les 350 k€ étaient de trop.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Il y a une offre ferme sur la table : la prendre avant que celle de Nordal n'expire, c'est ne rien risquer.",
      ceQuiLeDejoue:
        "La source sur Nordal le chiffre : face à une offre concurrente crédible, dans un second tour discret, il a suivi presque à chaque fois en passant devant d'environ 0,35 fois l'EBE, jusqu'à 8,5 ; sous le tirage n° 8, Kérouval offre 7,9 fois. Accepter la meilleure offre sans second tour laisse cette surenchère sur la table. Rejoué sur les trente tirages à la place du second tour, l'accepter tout de suite laisse 2,6 M€ de moins en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Quelques millions, ce n'est rien à côté du prix, et refuser risque de faire partir l'acquéreur.",
      ceQuiLeDejoue:
        "Le rapprochement de la baisse demandée avec le coût réel des points trouvés le montre : l'acquéreur demande plus que le coût, le reste est une provision et un levier. Maître Albiach explique que contester le chiffre se fait : avec un audit vendeur, la baisse se ramène au coût réel. Sous le tirage n° 8, la station d'épuration coûte 2,5 M€. Rejouée sur les trente tirages à la place de la concession limitée au coût, l'acceptation de la baisse laisse 0,7 M€ de moins en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "C'est le prix affiché le plus haut depuis le début : 2 M€ de plus que le prix ferme.",
      ceQuiLeDejoue:
        "La source sur le complément le chiffre : il se verse de 0 à 6 M€ quand l'EBE 2027 passe de 13,0 à 14,6 M€, et le plan réaliste prévoit 13,4 M€ en marché moyen et 11,6 en marché dégradé, avant les frais de groupe que l'acquéreur imputera ; il vaut environ 1,9 M€ en espérance avec Nordal, pour 4 M€ de prix ferme abandonnés. La garantie sans plafond sur cinq ans laisse en plus tout le passif caché au vendeur. Rejouée sur les trente tirages à la place du complément limité sur les volumes, la structure proposée laisse 2,6 M€ de moins en moyenne ; elle fait mieux 10 fois, quand le marché est porteur.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Alanig le dit : ils bluffent, où iraient-ils vendre leur lait ? Rouvrir le protocole, c'est risquer la vente.",
      ceQuiLeDejoue:
        "Hoel Quiniou connaît ceux qui ont voté : trois fois sur cinq, ils partiront vraiment, un collecteur de la Manche les attend. Remplacer 86 millions de litres au spot coûterait 3,44 M€ par an, et la clause d'approvisionnement fait baisser le prix de 8 M€ si moins de 90 % du lait est sous contrat au 31 décembre ; écrire les garanties coûte 1,2 M€ de prix. Sous le tirage n° 8, signer tel quel laisse 6,8 M€ de moins ; sur les trente tirages, 3,1 M€ en moyenne, et il fait mieux 13 fois, quand les producteurs renouvellent quand même.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu une fenêtre à saisir, d'autres une indépendance à préserver. Quels étaient les trois repères qui permettaient de juger l'offre, et que valait chacun ?",
    "Pourquoi retenir la médiane des comparables plutôt que leur moyenne ? Et pourquoi passer de la valeur d'entreprise à la valeur des titres avant de comparer ce que la famille reçoit ?",
    "Le plan de la direction donnait 121 M€, le banquier promettait 130 M€, le plan réaliste 94 M€. Qu'est-ce qui sépare ces chiffres, et lequel sert de repère ?",
    "Pourquoi l'exclusivité signée d'emblée ôte-t-elle à Nordal toute raison de relever son prix, quand un second tour discret le fait monter ? Pourquoi une enchère ouverte le fait-elle partir ?",
    "2 M€ de plus affichés, dont 6 M€ de complément sur l'EBE 2027 contre 4 M€ de prix ferme : que vaut ce complément en espérance, et qui en porte le risque ?",
    "Sur les trente tirages, garder la laiterie fait mieux 11 fois, et signer le protocole sans garanties 13 fois. Ces choix étaient-ils bons ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Quelle règle gardez-vous pour juger une offre sur votre entreprise ? Formulez-la en une phrase, avec les trois repères dedans.",
  ],
  prolongement: {
    enonce:
      "Une fromagerie dégage 4 M€ d'EBE et porte 5 M€ de dette financière nette. Un groupe offre 6,5 fois l'EBE. Les cessions comparables se sont faites à 6,2, 6,8, 7,0, 7,4 et 11,0 fois l'EBE. Le plan réaliste donne une valeur d'entreprise de 32 M€ dans un marché porteur (3 chances sur 10), 27 M€ dans un marché moyen (5 sur 10), 20 M€ dans un marché dégradé (2 sur 10) ; une chaudière en fin de vie coûterait 1 M€ une fois sur deux. 1) Calculez la valeur d'entreprise aux comparables, avec la médiane puis avec la moyenne. 2) Calculez la valeur indépendante. 3) Calculez la valeur des titres dans chaque cas : offre, comparables (médiane), indépendante. 4) L'acquéreur propose de remplacer 2 M€ de prix ferme par un complément de 3 M€, versé si l'EBE dépasse 4,5 M€ dans deux ans, ce qui arrive quatre fois sur dix. Que vaut ce complément en espérance ? Que recommandez-vous ?",
    corrige:
      "1) Médiane : 7,0 × 4 = 28 M€. Moyenne : (6,2 + 6,8 + 7,0 + 7,4 + 11,0) / 5 = 7,68, soit 30,72 M€, tirée par la cession à 11,0. 2) 0,3 × 32 + 0,5 × 27 + 0,2 × 20 = 9,6 + 13,5 + 4 = 27,1 M€, moins 0,5 × 1 = 0,5 M€ de point faible attendu : 26,6 M€. 3) Offre : 6,5 × 4 = 26 M€, soit 21 M€ pour les titres ; comparables : 28 − 5 = 23 M€ ; indépendante : 26,6 − 5 = 21,6 M€. L'offre est sous la valeur indépendante et sous les comparables. 4) 0,4 × 3 = 1,2 M€ en espérance, pour 2 M€ de prix ferme abandonnés : à refuser. Recommandation : ne pas accepter l'offre telle quelle ; chercher un second acquéreur au voisinage des comparables (28 M€), en prix ferme.",
  },
  evaluation: [
    "La valeur aux comparables est calculée juste (médiane 8,1 × 13 M€ = 105,3 M€), et l'élève justifie la médiane et passe correctement à la valeur des titres.",
    "La valeur indépendante est construite par l'espérance des scénarios, points faibles déduits, et comparée à l'offre et aux comparables.",
    "Les conditions de l'offre (exclusivité, audit, complément de prix, garantie, engagements envers les producteurs) sont chiffrées en valeur espérée, et non jugées sur le prix affiché.",
    "La conduite de la négociation est argumentée : mise en concurrence discrète, informations sensibles protégées, baisse ramenée au coût réel.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 8.",
  ],
  vigilance:
    "L'épisode ne traite pas deux obligations qu'une cession réelle de cette taille poserait : l'information et la consultation du CSE avant la décision de cession, et, l'acquéreur étant le premier concurrent de la laiterie, le contrôle de l'opération par l'autorité de la concurrence. La garantie d'actif et de passif, le complément de prix et la clause d'approvisionnement y sont simplifiés ; un enseignant de droit des affaires doit relire ces notions avant de les présenter comme des règles.",
};
