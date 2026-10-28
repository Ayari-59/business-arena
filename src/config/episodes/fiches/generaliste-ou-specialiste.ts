/**
 * FICHE ENSEIGNANT · ÉPISODE 81, RESTER GÉNÉRALISTE OU SE SPÉCIALISER.
 *
 * Face à un concurrent moins cher, la baisse de prix se paie euro pour euro
 * quand les coûts sont fixes ; l'avantage se construit là où les références
 * sont rares, par étapes, avec un test et une règle fixée d'avance.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "generaliste-ou-specialiste",
  formations: ["dcg", "dscg", "but-gea"],
  programme: [
    "DCG · UE 7, Management des organisations",
    "DSCG · UE 3, Contrôle de gestion et stratégie",
    "BUT GEA · Concevoir la stratégie de création de valeur",
  ],
  notion:
    "Quand un concurrent arrive avec des prix plus bas, s'aligner paraît protéger les volumes ; mais dans un cabinet dont les salaires font 62 % du chiffre d'affaires et ne bougent pas avec les prix, un euro de TJM perdu est un euro de résultat perdu. Chez Atlas Conseil, baisser de 10 % les 10,53 M€ de missions généralistes coûte 1 053 k€ de marge par an à volumes constants, pour un résultat d'exploitation de 8 % du chiffre d'affaires, et Halden Partners recasse ses prix six fois sur dix quand on le suit. L'erreur inverse consiste à tout réorienter d'un coup vers la santé, où Atlas a ses références (une trentaine d'établissements, 46 % de transformation, des acheteurs qui notent la technique à 60 %), sans savoir si l'agence régionale renforcera, reconduira ou gèlera son plan. L'élève découvre qu'on construit un avantage là où l'on est rare, par étapes, en testant le marché avec une règle fixée d'avance, qu'on garde ses clients historiques par la relation plutôt que par une remise, et qu'on tient son prix là où la référence fait la différence.",
  objectifs: [
    "Je calcule l'effet d'une baisse de prix sur la marge quand les coûts sont fixes, et le volume qu'il faudrait pour la compenser.",
    "Je repère un avantage concurrentiel défendable (références, expertise, critères d'achat des clients) et je le distingue d'un avantage de coût.",
    "Je découpe une stratégie en étapes, avec un test, une règle de décision écrite d'avance et la révision qui en découle.",
    "Je compare des moyens de garder des clients (remise, relation) par ce qu'ils coûtent et le risque qu'ils réduisent.",
  ],
  prerequis:
    "Les notions de chiffre d'affaires, de charges fixes, de marge et de taux de transformation commerciale doivent être connues. Les stratégies génériques (domination par les coûts, différenciation, focalisation) se rappellent en début de séance ; l'espérance d'un gain sur des scénarios se découvre en jouant.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/generaliste-ou-specialiste?hasard=14 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de valider la semaine 1, la marge perdue par an si Atlas baisse de 10 % ses TJM généralistes, à volumes constants, en k€, et le calcul qui y mène.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez le positionnement de la semaine 1 (la baisse de 10 %, le pôle santé par étapes, Atlas Santé, rien), le premier pas de la semaine 2 et la décision de la semaine 8, après le compte des demandes. Aux plus rapides, vous demandez de rejouer en changeant la seule décision de la semaine 4 : l'associé référent, ou rien de particulier.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées et refaites le calcul avec la classe à partir de l'extraction des jours facturés : 11 700 jours à 900 €, 10,53 M€ ; 10 % de moins, 90 € par jour, soit 1 053 k€ par an, entièrement pris sur la marge puisque les salaires ne bougent pas. Vous faites expliquer les valeurs éloignées (1 293, 1 579,5 ou 400), puis vous demandez combien de jours il faudrait vendre en plus pour retrouver le même chiffre d'affaires : 1 300, soit 11 % de plus.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous partez de la semaine 1 : vous faites lire ce que Halden a fait à Lille (prix recassés en moins de deux mois, six fois sur dix ; aucune réponse aux consultations où la technique pèse plus que le prix). Vous enchaînez sur le premier pas de la semaine 2, en comparant la fiabilité de chaque test (11 % d'erreur pour l'étude, 24 % pour la campagne, 19 % pour l'experte, 30 % sans rien), puis sur la semaine 8 : 12 demandes pour une règle à 18, et pourquoi on s'en tient à ce qui existe.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève et sa comparaison aux trente tirages. Sous le tirage n° 14, « La spécialisation par étapes » crée 710 k€ en écart au plan d'avant Halden, « Le prix » en perd 2 355 k€, et l'attentisme 926 k€. Vous montrez ensuite la semaine 4 : ne rien faire pour les clients historiques fait mieux que l'associé référent 23 fois sur 30, et sous le tirage n° 14 aussi, puisque les clients sont restés ; mais la contrôleuse de gestion estime à 30 % le risque qu'ils retirent 1 053 jours par an d'un coup, et la moyenne perd 124 k€. Vous faites dire ce qui distingue la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : ne pas se battre sur le terrain du concurrent, aller là où ses références font la différence, et y aller par étapes. Vous la déclinez en trois gestes : garder ses prix quand ses coûts sont fixes, tester avec une règle écrite d'avance avant d'engager des salaires, et garder ses clients par la relation. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 1053,
    etapes: [
      "Source « Faire extraire les jours facturés et les TJM par type de mission » : missions généralistes de Nantes et de Rennes, 11 700 jours facturés à 900 € de TJM moyen, soit 11 700 × 900 = 10 530 000 €, 10,53 M€.",
      "Une baisse de 10 % des TJM généralistes, à volumes constants : 900 × 0,10 = 90 € de moins par jour, soit 11 700 × 90 = 1 053 000 € de chiffre d'affaires en moins par an. Les prix santé ne bougent pas.",
      "Même source : les salaires font 62 % du chiffre d'affaires et ne bougent pas avec les prix : la marge perdue est égale au chiffre d'affaires perdu, 1 053 k€ par an. Gustave Herbelin rappelle que le résultat d'exploitation ne fait que 8 % du chiffre d'affaires.",
      "Le chiffre ne dépend pas du hasard : 1 053 k€ pour toute la classe. L'épisode le juge juste à 20 k€ près, proche à 100 k€. Pour retrouver le même chiffre d'affaires à 810 €, il faudrait vendre 10 530 000 / 810 = 13 000 jours, 1 300 de plus.",
    ],
    erreurs: [
      {
        valeur: 1293,
        cause:
          "La baisse appliquée à tout le chiffre d'affaires, santé comprise (10 % de 10,53 + 2,40 M€) : seuls les TJM généralistes baissent.",
      },
      {
        valeur: 1579.5,
        cause:
          "L'écart avec Halden, 15 %, au lieu de la baisse proposée de 10 % (0,15 × 10 530) : la question porte sur la proposition de Mahdi.",
      },
      {
        valeur: 400,
        cause:
          "La perte multipliée par la part hors salaires (1 053 × 0,38) : les salaires ne baissent pas avec les prix, toute la baisse tombe sur la marge.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Halden affiche 765 €, 15 % sous nos prix, et Mahdi Ouertani le dit : « Si on les laisse s'installer, on ne les délogera plus. » Baisser de 10 % tout de suite paraît garder les volumes et l'occupation.",
      ceQuiLeDejoue:
        "L'extraction des jours le montre : à volumes constants, la baisse coûte 1 053 k€ de marge par an, puisque les salaires ne bougent pas, pour un résultat d'exploitation de 8 % du chiffre d'affaires. L'étude de Lille ajoute que Halden, avec un associé pour huit consultants presque tous juniors, a recassé ses prix en moins de deux mois quand un cabinet l'a suivi, six fois sur dix, et qu'il n'a pas suivi celui qui s'était concentré sur ses références. Rejouée sur les trente tirages à la place du pôle santé par étapes, la baisse de 10 % perd 1 170 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Si l'avantage est dans la santé, autant y aller franchement : Atlas Santé, 26 généralistes au pôle ce trimestre, un signal que le marché ne peut pas manquer.",
      ceQuiLeDejoue:
        "La fédération hospitalière donne au plan régional un peu plus d'une chance sur trois d'être renforcé, quatre sur dix d'être reconduit, une sur quatre d'être gelé, et l'agence ne l'annonce qu'à la mi-novembre. Florestan Mabire le dit : « Vas-y par étapes : nous avons d'abord monté une équipe de huit, mesuré, puis recruté. » Et Mahdi ne pourra plus couvrir tous les clients généralistes avec 54 consultants. Rejouée sur les trente tirages à la place du pôle renforcé de 10, la bascule perd 468 k€ en moyenne ; elle ne fait mieux qu'une fois sur 30.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Une campagne « Atlas, le conseil des établissements de santé » se voit tout de suite, quand une étude met deux mois, dit Mahdi.",
      ceQuiLeDejoue:
        "La fédération le chiffre : la campagne coûte 90 k€ et fait venir des demandes de toute sorte, si bien que le compte se trompe dans 24 % des cas ; l'étude portée depuis Rennes coûte 35 k€ et se trompe dans 11 % des cas, avec une règle fixée d'avance. Et la campagne inquiète les clients généralistes : « on entend dire qu'Atlas ne fait plus que de l'hôpital ». Rejouée sur les trente tirages à la place de l'étude, la campagne perd 202 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Les clients historiques font 30 % des jours généralistes : leur accorder 10 % sur les renouvellements paraît « le prix de la paix ».",
      ceQuiLeDejoue:
        "Les directeurs de mission le disent : ce qu'ils redoutent, ce n'est pas le prix, c'est de perdre leurs interlocuteurs, et Soumaya Rahmouni demande surtout si son directeur de mission restera le même. La remise coûte 316 k€ par an et ne réduit le risque que de 40 % ; un associé référent le réduit de 70 % pour 60 k€ par an. Halden a rencontré six clients historiques : aucun n'a signé. Rejouée sur les trente tirages à la place de l'associé référent, la remise perd 346 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Sept généralistes sont sans mission et payés de toute façon : un jour vendu à 675 €, même moins cher, vaut mieux qu'un jour perdu, dit Mahdi.",
      ceQuiLeDejoue:
        "Le chiffrage de l'intercontrat rappelle que les clients qui achètent à 675 € garderont ce prix en tête aux renouvellements, et qu'à Lille Halden a recassé ses prix une fois sur quatre de plus quand le cabinet en place s'est mis à brader. Les pré-diagnostics de deux jours avec l'équipe santé, 15 k€ de déplacements, rendraient le pôle visible dans un établissement sur cinq de plus ; la régie chez Kéroual rapporte jusqu'à 58 k€ sans risque. Rejouées sur les trente tirages à la place des pré-diagnostics, les missions à 675 € perdent 414 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Le comité a validé un plan en septembre, les cabinets de recrutement attendent le feu vert : tenir le plan annoncé paraît cohérent et crédible.",
      ceQuiLeDejoue:
        "Le test a donné 12 demandes entrantes en six semaines, sous la règle de 18 écrite d'avance, et la lecture des chiffres ramène à 0 % la probabilité d'un plan régional renforcé. Les six recrutements, 720 k€ de salaires par an, ne vaudraient alors que −433 k€ si le plan est reconduit, −679 k€ s'il est gelé. Un test ne sert que si l'on accepte de réviser sur ce qu'il dit. Rejoué sur les trente tirages à la place de la révision sur les chiffres, tenir le plan perd 273 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Une référence de cette taille dans un GHT « n'a pas de prix », dit Mahdi : accorder les 15 % assure la signature.",
      ceQuiLeDejoue:
        "Le chiffrage des réponses : à 15 %, le programme passe de 546 k€ à 464 k€, et les acheteurs hospitaliers demanderont environ 5 % sur les autres missions santé, 120 k€ par an ; Léopoldine Quéffelec rappelle que les acheteurs des GHT se parlent. Tenir 1 050 € en scindant le programme en une tranche ferme et une tranche optionnelle signe environ 81 fois sur 100 avec les références montrées cette année, et sur nos cinq derniers marchés hospitaliers, quatre ont été gagnés sans être le moins cher. Rejouée sur les trente tirages à la place des deux tranches, la remise de 15 % perd 184 k€ en moyenne ; elle fait mieux 4 fois sur 30.",
    },
  ],
  debrief: [
    "En semaine 1, une baisse de 10 % coûtait 1 053 k€ de marge par an. Pourquoi est-elle entièrement prise sur la marge, et combien de jours faudrait-il vendre en plus pour la compenser ?",
    "Halden gagne au prix sur les missions que « n'importe qui sait faire ». Qu'est-ce qui, dans les sources, rendait la santé défendable pour Atlas et pas pour Halden ?",
    "En semaine 2, l'étude se trompe dans 11 % des cas, la campagne dans 24 %. Pourquoi la fiabilité d'un test compte-t-elle autant que son coût ? À quoi sert une règle écrite d'avance ?",
    "En semaine 8, le test a donné 12 demandes pour une règle à 18. Pourquoi tenir le plan de septembre, malgré ce chiffre, est-il une erreur, même si le comité l'avait validé ?",
    "Ne rien faire pour les clients historiques fait mieux que l'associé référent 23 fois sur 30, et sous le tirage n° 14 aussi. Était-ce pour autant une bonne décision ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Le GHT demande 15 %. Que coûte la remise au-delà de ce programme, et qu'est-ce qui permettait de tenir le prix ?",
    "Quelle règle gardez-vous pour répondre à un concurrent moins cher ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Un cabinet facture 5 000 jours par an à 1 000 €, avec 30 consultants qui peuvent facturer au plus 180 jours chacun ; ses salaires ne bougent pas avec les prix. 1) S'il baisse ses prix de 10 %, que perd-il de marge par an à volumes constants ? 2) Combien de jours devrait-il facturer pour garder le même chiffre d'affaires ? Le peut-il ? 3) Ses clients historiques représentent 1 500 jours par an. On estime à 30 % le risque qu'ils retirent 30 % de leurs volumes. Une remise de 10 % sur leurs missions réduirait ce risque de 40 % ; un associé référent, qui coûte 60 k€ par an, le réduirait de 70 %. Comparez le coût total attendu de chaque solution, et celui de ne rien faire.",
    corrige:
      "1) 5 000 × 100 = 500 000 €, soit 500 k€ par an. 2) 5 000 000 / 900 ≈ 5 556 jours, soit 556 de plus (+11 %) ; sa capacité est de 30 × 180 = 5 400 jours : il ne le peut pas. 3) Perte possible : 0,30 × 1 500 = 450 jours, soit 450 k€. Ne rien faire : 0,30 × 450 = 135 k€ de perte attendue. Remise : 1 500 × 100 = 150 k€ par an, plus 0,30 × 0,60 × 450 = 81 k€, soit 231 k€. Référent : 60 k€, plus 0,30 × 0,30 × 450 = 40,5 k€, soit 100,5 k€. Le référent coûte le moins, la remise coûte plus que de ne rien faire.",
  },
  evaluation: [
    "La marge perdue par une baisse de 10 % est calculée juste (11 700 jours × 90 €, soit 1 053 k€) à partir de la source nommée, salaires fixes compris.",
    "Le positionnement choisi s'appuie sur un avantage défendable tiré des sources (références, critères d'achat, transformation) et non sur le seul prix du concurrent.",
    "La spécialisation est conduite par étapes, avec un test, une règle fixée d'avance et une révision sur ses chiffres.",
    "Les moyens de garder les clients historiques et de répondre au GHT sont comparés par leur coût et le risque qu'ils réduisent.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 14.",
  ],
  vigilance:
    "La négociation du prix avec un acheteur public et le découpage d'un programme en tranche ferme et tranche optionnelle relèvent du Code de la commande publique : selon la procédure suivie, une négociation après remise des offres n'est pas toujours possible. Un enseignant pourra le préciser ; l'épisode ne tranche pas ce point.",
};
