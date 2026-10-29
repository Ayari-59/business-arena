/**
 * FICHE ENSEIGNANT · ÉPISODE 8, LE FOURNISSEUR QUI AUGMENTE.
 *
 * Négocier une hausse de prix d'achat en la décomposant, avec une solution de
 * repli que le fournisseur peut voir : accepter, basculer chez le moins cher
 * ou répercuter tout sur les clients coûtent plus que la hausse elle-même.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "fournisseur-qui-augmente",
  formations: ["bts-gpme", "bts-mco", "but-gea"],
  programme: [
    "BTS GPME · Bloc 1, Gérer la relation avec les clients et les fournisseurs de la PME",
    "BTS MCO · Bloc 3, Assurer la gestion opérationnelle",
    "BUT GEA · Analyser les processus de l'organisation dans son environnement",
  ],
  notion:
    "Une hausse de prix d'un fournisseur n'est pas un bloc : elle se décompose en coûts identifiables, qui n'évoluent pas tous dans le même sens, et en points qui ne correspondent à rien. L'erreur classique consiste à la traiter comme un chiffre unique, à accepter « pour préserver la relation », ou au contraire à tout basculer chez le moins cher sans savoir s'il peut livrer ; la seconde consiste à répercuter toute la hausse sur un produit que les clients comparent au centime. Dans l'épisode, Élodie Marchal achète la plâtrerie-isolation d'Arvel Distribution ; Placova, 70 % des achats de la famille, annonce +12 %. La reconstitution du coût d'une plaque en attribue 7 points au gaz (au prix de juillet, déjà en recul et donné en baisse d'un tiers d'ici décembre), 3 au papier et au gypse, et 2 à rien. Brévent est 9 % moins cher que le nouveau tarif, mais ne peut livrer qu'un tiers des volumes ; la BA13 standard se compare à 3 % près. L'élève découvre qu'un essai chez Brévent rend crédible une indexation sur le gaz de la seule part énergie, qu'une plaque livrée en retard coûte plus que trois plaques achetées 9 % moins cher n'en rapportent, et qu'on tient le prix de la BA13 en augmentant les références que personne ne compare.",
  objectifs: [
    "Je décompose une hausse de prix d'achat en coûts identifiables, et je repère la part qui n'est pas justifiée.",
    "Je construis une solution de repli crédible avant de négocier, et je propose une formule indexée plutôt qu'un chiffre unique.",
    "Je compare deux fournisseurs en coût complet : prix, capacité, retards, dépannages et ventes perdues.",
    "Je répercute une hausse sur les prix de vente en tenant compte de ce que les clients comparent.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de prix d'achat, de marge brute, de coût de revient et de conditions générales de vente doivent être connues ; le calcul d'une moyenne pondérée et d'un pourcentage suffit. L'indexation d'un prix, la solution de repli et le coût complet d'un fournisseur peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/fournisseur-qui-augmente?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de valider la semaine 1, la hausse du prix d'achat moyen des plaques prévue pour la semaine 6, le calcul qui y mène, et le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans donner de piste, et vous relevez deux choses : la réponse à Placova en semaine 1 et la demande faite en semaine 2 (compromis, indexation, ultimatum, remise de fin d'année). Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 4, les prix de vente.",
    },
    {
      minutes: 15,
      titre: "Correction de la prévision de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées. Vous refaites la décomposition avec la classe (7 points de gaz, 3 de matières, 2 sans justification), puis la formule indexée : 3 points fermes et 7 points qui suivent le gaz. Vous montrez ce qu'a fait le gaz sous le tirage de la classe (environ un tiers de baisse dès la semaine 6), et le poids de l'essai chez Brévent : 7,5 %. Vous faites expliquer les valeurs éloignées : 12 %, 10 %, 4,8 %.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 2 (la demande à Placova), de la semaine 4 (les prix de vente) et de la semaine 11 (les réserves). Pour la semaine 2, vous faites dire ce qui rend une menace crédible : un camion de Brévent que le commercial de Placova a croisé à Vénissieux. Pour la semaine 4, vous faites calculer ce que deviennent les volumes de BA13 si Ferrat tient ses prix et que l'on passe +7 % sur toute la famille.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 12, « Décomposer, qualifier, indexer » finit à 229,9 k€ de marge pour un budget révisé de 230 k€, « Accepter et attendre » à 170,1 k€ et « Tout basculer chez le moins cher » à 153,3 k€. Vous montrez ensuite les décisions où le hasard a joué : Placova a accepté l'indexation même chez ceux qui avaient signé, et a cédé à l'ultimatum. C'est le moment de séparer la qualité d'une décision de son résultat.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : demander de quoi la hausse est faite, ne négocier qu'avec une solution de repli visible, comparer les fournisseurs en coût complet, et répercuter là où le client ne compare pas. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 7.5,
    etapes: [
      "Source « Reconstituer le coût de revient d'une plaque » : sur les 12 points annoncés, environ 7 tiennent au gaz des fours, au prix de juillet, 3 au papier et au gypse, et 2 ne correspondent à aucun coût identifiable.",
      "La bonne méthode demande la décomposition, lance un essai chez Brévent (un camion par semaine, 5 % des volumes, à un prix 9 % sous le nouveau tarif, soit environ 2 % au-dessus de l'ancien), puis propose en semaine 2 une formule indexée : 3 points fermes pour les matières, 7 points qui suivent le prix du gaz, rien pour les 2 points sans justification. Avec l'essai, Placova l'accepte presque toujours, à partir de la semaine 3.",
      "Le gaz a déjà reculé depuis l'été et les contrats à terme le donnent en baisse d'un tiers d'ici décembre. En le prolongeant régulièrement, il aurait perdu environ 15 % en semaine 6 : hausse de Placova ≈ 3 + 7 × 0,85 ≈ 9 %, et 0,95 × 9 + 0,05 × 2 ≈ 8,6 % en moyenne avec Brévent. Cette estimation est jugée juste.",
      "Sous le tirage n° 12, le gaz baisse plus vite : il est à 0,68 de son prix du jour de l'annonce en semaine 6. Hausse de Placova : 3 + 7 × 0,68 ≈ 7,75 % ; moyenne avec les 5 % de Brévent : 0,95 × 7,75 + 0,05 × 2 ≈ 7,5 % (7,46) au-dessus de l'ancien tarif.",
      "Le chiffre dépend du hasard (de 7,3 % à 11,5 % selon les trente tirages, 8,9 % en moyenne) et des décisions : 9,1 % avec le compromis ferme, 12 % pour qui a signé et attend, 11,8 % pour qui a tout basculé chez Brévent, dépannages compris. L'épisode juge juste à 1,5 point près, proche à 3 : la tolérance couvre l'écart entre la tendance du gaz, que les sources donnent, et sa baisse plus rapide sous ce tirage.",
    ],
    erreurs: [
      {
        valeur: 12,
        cause:
          "Le tarif annoncé pris pour le prix payé en semaine 6, comme si la négociation et le gaz n'y changeaient rien.",
      },
      {
        valeur: 10,
        cause:
          "Les 2 points sans justification retirés, mais le gaz figé au prix de juillet : la part énergie est traitée comme un coût ferme alors qu'il baisse déjà.",
      },
      {
        valeur: 4.8,
        cause:
          "Seule la part énergie comptée (7 × 0,68), les 3 points de papier et de gypse oubliés : ils restent fermes dans la formule.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Placova fournit 70 % de la famille, et toute la presse annonce 8 à 15 % chez tous les fabricants : accepter préserve la relation avec le partenaire principal.",
      ceQuiLeDejoue:
        "La reconstitution du coût montre 2 points sans justification et 7 points de gaz déjà en baisse ; Philippe Arnaud conseille de demander de quoi la hausse est faite et de ne jamais négocier « sans une solution de repli que Placova puisse voir ». Une signature en semaine 1 retire tout levier : sans essai chez Brévent, Placova accepte rarement une indexation. Rejouée sur les trente tirages à la place de la décomposition et de l'essai, la signature perd 17 k€ en moyenne et ne fait jamais mieux ; sous le tirage n° 12, Placova a pourtant accepté l'indexation, et la perte n'est que de 3,7 k€.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Brévent est 9 % moins cher que le nouveau tarif : basculer tout le volume dès la semaine 2, c'est 9 % gagnés sur 70 % des achats.",
      ceQuiLeDejoue:
        "Samia Ouali le dit elle-même : l'usine ne peut livrer que 25 à 30 000 € par semaine, un tiers des volumes au plus. Julien Morel le constate : un camion sur cinq à l'heure, des dépannages chez Placova en express au tarif public. Le calcul du coût complet le chiffre : une plaque en retard se dépanne près de 30 % au-dessus de l'ancien tarif, et une sur quatre fait partir le chantier. Rejouée sur les trente tirages à la place de l'essai, la bascule perd 35,1 k€ en moyenne, la plus grosse perte de l'épisode, et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 3,
      pourquoi:
        "Accepter les 12 % contre 2 % de remise de fin d'année : Placova y gagne, nous aussi, et la remise « compensera largement ».",
      ceQuiLeDejoue:
        "Une remise de 2 % ne reprend qu'une partie des 2 points sans justification, et laisse les 7 points de gaz au prix de juillet alors que l'indice a encore perdu 4 % depuis l'annonce et que les contrats à terme le donnent en baisse d'un tiers. Elle est versée en fin de trimestre, à condition de garder l'exclusivité : Brévent en sort. Rejouée sur les trente tirages à la place de la formule indexée, elle perd 18 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 2,
      pourquoi:
        "Les agences le demandent : si on augmente, Ferrat récupère les plaquistes dans la semaine. Ne rien répercuter garde les clients.",
      ceQuiLeDejoue:
        "Le relevé chez Ferrat montre la marge de manœuvre : 1 % au-dessus sur la BA13 standard, mais 6 % en dessous sur les plaques hydrofuges et phoniques. Le panier des plaquistes le confirme : la BA13 fait un peu plus de la moitié des volumes et c'est le seul prix comparé ; le reste se vend au chantier. Tenir la BA13 et augmenter le reste de 3 % en moyenne garde les clients et une partie de la marge. Rejoué sur les trente tirages à la place de cette répercussion partielle, ne rien répercuter perd 27,4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 1,
      pourquoi:
        "Sur le papier, chaque point de volume passé chez Brévent fait gagner de la marge, dit la contrôleuse de gestion : autant tout lui confier.",
      ceQuiLeDejoue:
        "Le bilan des livraisons d'essai est bon (quatre camions sur cinq à l'heure), mais Samia Ouali confirme qu'au-delà de 25 à 30 000 € par semaine l'usine ne suit plus. Au-delà de cette capacité, chaque plaque en retard se dépanne chez Placova au tarif public plus 15 %, ou fait partir le chantier. Trente pour cent chez Brévent, c'est ce qu'il sait tenir. Rejoué sur les trente tirages à la place des 30 %, tout confier à Brévent perd 31,9 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 2,
      pourquoi:
        "Le contrat de l'an prochain se négocie dans un mois : réclamer des avoirs maintenant tendrait la relation pour quelques milliers d'euros.",
      ceQuiLeDejoue:
        "Le tri des bons de livraison montre que huit réserves sur dix sont signées par le chauffeur et photographiées : elles tiennent devant n'importe quel fournisseur, et les conditions générales de Placova prévoient leur réclamation sous trente jours, preuves à l'appui. Réclamer coûte deux jours de travail, environ 1 000 €, et Placova n'a « rien à redire » à un dossier complet. Rejoué sur les trente tirages à la place des réclamations, laisser tomber perd 5,6 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, Placova annonçait +12 % « en raison de nos coûts d'énergie et de matières ». Que disait la reconstitution du coût d'une plaque ? Pourquoi la presse professionnelle n'apprenait-elle rien ?",
    "Une indexation fait varier le prix chaque semaine avec le gaz, dans un sens ou dans l'autre. Pourquoi est-elle meilleure en moyenne qu'un prix ferme modéré ? Que se passe-t-il si le gaz flambe, comme en semaine 10 sous le tirage de la classe ?",
    "Sous le tirage n° 12, Placova a accepté l'indexation même chez ceux qui avaient signé en semaine 1, et a cédé à l'ultimatum, qui finit 5,1 k€ au-dessus de l'indexation. Sur les trente tirages, l'ultimatum perd 4,1 k€ en moyenne, et signer en semaine 1 perd 17 k€. Leur choix était-il bon ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Ferrat a tenu ses prix sous ce tirage : ceux qui ont passé +7 % sur toute la famille perdent 30,9 k€ face à la répercussion partielle. Qu'est-ce qui, dans le relevé des prix de Ferrat et le panier des plaquistes, permettait de l'anticiper ?",
    "Brévent est 9 % moins cher. Pourquoi 30 % des volumes, et pas 100 % ? Appuyez-vous sur le calcul du coût complet d'une plaque livrée en retard.",
    "Déduire d'office les réserves des prochaines factures fait mieux que les réclamer 17 fois sur 30, mais coûte 14,1 k€ sous le tirage de la classe, où Placova bloque les livraisons. Qu'est-ce qui rend ce choix risqué, quoi qu'il arrive en moyenne ?",
    "Quelle règle gardez-vous avant de répondre à une hausse de prix d'un fournisseur ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Un fournisseur annonce +12 % sur 70 000 € d'achats par semaine à l'ancien tarif : 7 points de gaz, 3 points de matières, 2 points sans justification. L'acheteur propose une formule : 3 points fermes, plus 7 points multipliés par l'indice du gaz (1 au jour de l'annonce). 1) Que coûtent les achats d'une semaine au tarif annoncé ? 2) Avec la formule, que coûtent-ils si l'indice du gaz vaut 0,8 ? Et 1,3 ? 3) Le fournisseur propose plutôt un prix ferme à +9,5 %. Que coûte une semaine ? 4) L'acheteur estime que l'indice vaudra 0,6 avec une chance sur deux, 0,8 avec trois chances sur dix, 1,3 avec deux chances sur dix. Quelle hausse moyenne la formule donne-t-elle ? Que choisissez-vous, et que craignez-vous ?",
    corrige:
      "1) 70 000 × 1,12 = 78 400 €. 2) Indice 0,8 : 3 + 7 × 0,8 = 8,6 %, soit 76 020 € ; indice 1,3 : 3 + 7 × 1,3 = 12,1 %, soit 78 470 €, à peine plus que le tarif annoncé. 3) 70 000 × 1,095 = 76 650 €. 4) Indice moyen : 0,5 × 0,6 + 0,3 × 0,8 + 0,2 × 1,3 = 0,8 ; hausse moyenne de 3 + 7 × 0,8 = 8,6 %, contre 9,5 % ferme : la formule fait gagner environ 630 € par semaine en moyenne. Le risque est une flambée du gaz, qui la porte vers 12 % pendant quelques semaines : on le prend si la trésorerie le supporte, ou l'on plafonne la formule.",
  },
  evaluation: [
    "Le diagnostic de la semaine 1 s'appuie sur la décomposition de la hausse et sur l'appel à Brévent, et l'élève dit pourquoi la presse professionnelle ne départage rien.",
    "La prévision de la hausse en semaine 6 est construite par un calcul écrit (part ferme, part indexée, trajectoire du gaz, poids de Brévent), et l'écart avec 7,5 % est expliqué.",
    "La négociation avec Placova s'appuie sur une solution de repli réelle, et la part confiée à Brévent est justifiée par sa capacité et le coût complet d'un retard.",
    "La répercussion sur les prix de vente distingue la BA13, que les clients comparent, des références qu'ils ne comparent pas.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "Le délai de trente jours pour réclamer les réserves vient des conditions générales de Placova dans l'épisode ; la réception des marchandises, les réserves au transporteur et la déduction d'office d'une somme sur une facture sans l'accord du fournisseur relèvent du droit commercial (le code de commerce encadre ces déductions entre professionnels), à faire relire par un professeur de droit avant d'en tirer une règle générale.",
};
