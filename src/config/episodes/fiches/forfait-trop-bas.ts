/**
 * FICHE ENSEIGNANT · ÉPISODE 71, LE FORFAIT VENDU SOUS SON COÛT.
 *
 * Coût de revient complet d'une journée facturable : un consultant ne facture
 * pas tous ses jours travaillés, et une grille qui divise par 218 vend sous le
 * coût. Le coût marginal, lui, juge une mission d'intercontrat.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "forfait-trop-bas",
  formations: ["dcg", "bts-cg", "but-gea"],
  programme: [
    "DCG · UE 11, Contrôle de gestion",
    "BTS CG · Processus 5, Analyse et prévision de l'activité",
    "BUT GEA · Concevoir des outils de contrôle de gestion",
  ],
  notion:
    "Une entreprise qui vend du temps calcule le coût d'une journée pour fixer ses prix. L'erreur classique est de diviser le coût annuel d'une personne par ses jours travaillés, alors qu'une journée facturable doit payer aussi celles qui ne le sont pas (absences, formation, avant-vente, intercontrat, tâches internes), et de garder une quote-part de frais de structure périmée. Dans l'épisode, Prune Lecoeur, contrôleuse de gestion d'Atlas Conseil, voit les forfaits clos afficher 38 % de marge à la vente et finir à −3 %. La grille de 2019 ajoute 24 000 € de structure au salaire chargé et divise par 218 jours : 550 € pour un consultant senior. Or un senior facture 160 jours, et la structure coûte 36 000 € par consultant : son jour facturable coûte 825 €. La grille sous-estime le coût de 33 à 36 % selon le grade. L'élève découvre qu'il faut fixer un prix plancher au coût complet, dépassement compris, qu'un forfait gagné sous ce plancher est une perte signée pour des mois, qu'il vaut mieux concentrer l'avant-vente sur les consultations qu'on peut gagner, que la pyramide de l'équipe pèse autant que le TJM, et qu'à l'inverse une mission qui occupe un intercontrat certain se juge à son coût marginal, pas à son coût complet.",
  objectifs: [
    "Je calcule le coût de revient complet d'une journée facturable, grade par grade, avec une quote-part de charges de structure à jour.",
    "J'explique l'écart entre la marge affichée à la vente et la marge réelle à la clôture.",
    "Je fixe un prix plancher au coût complet, dépassement moyen compris, et je juge une remise par rapport à lui.",
    "Je distingue le coût complet et le coût marginal, et je sais lequel utiliser pour une capacité qui serait perdue.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de coût complet, de charges directes et indirectes, de coût marginal et de marge doivent avoir été vues en cours. Le vocabulaire du conseil (TJM, forfait, intercontrat, pyramide) est donné par l'épisode.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/forfait-trop-bas?hasard=9 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, le calcul du coût de revient complet d'une journée facturable de consultant senior, et le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger et vous relevez la prévision de la semaine 1, la règle de chiffrage choisie en semaine 1 et la réponse à la biscuiterie en semaine 5. Aux plus rapides, vous demandez de refaire le coût complet d'un analyste et d'un manager.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez les prévisions relevées et reconstruisez le calcul en trois sources : le salaire chargé du senior (grille), la quote-part de structure (direction financière) et les jours facturés (Tempora). Vous faites expliquer les valeurs éloignées de 825 € (605,5, 750 ou 550,5), en montrant que la grille cumule deux erreurs. Vous terminez par la pyramide type : 728,75 € le jour au coût complet, 787 € avec le dépassement moyen, quand le prix moyen pratiqué est de 765 €.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 (la règle), de la semaine 5 (la biscuiterie) et de la semaine 9 (l'accord-cadre). Pour la biscuiterie, vous faites calculer au tableau : 36 000 € pour 78 jours, 461,5 € le jour, sous le coût complet d'un analyste ; mais les trois analystes sont en intercontrat certain, et ce que la mission ajoute aux coûts se limite aux frais (1 800 €) et aux 6 jours du senior (4 950 €). Pour l'accord-cadre : à 700 €, sous le plancher, chacun des 400 jours garantis est une perte.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève. Sous le tirage 9, « Le coût d'un jour facturable » fait 63 k€ de marge des forfaits, « La grille de toujours » −78,7 k€ et ne rien changer −40,8 k€. Vous montrez la mutuelle : sous ce tirage, elle refuse 840 € et part, et pourtant la reconduction à 760 € fait 8,2 k€ de moins ; sur les trente tirages, elle perd 17,2 k€ en moyenne. Puis Valmorin : baisser les TJM avec l'équipe de Lorcan fait mieux 10 fois sur 30 et perd 13,8 k€ en moyenne.",
    },
    {
      minutes: 10,
      titre: "Synthèse",
      detail:
        "Vous écrivez les deux formules au tableau : coût complet d'une journée facturable = (salaire chargé + quote-part de structure) / jours facturables ; prix plancher = coût complet × (1 + dépassement moyen). Puis la règle qui les complète : une capacité qui serait perdue se juge à ce qu'elle ajoute aux coûts, à condition qu'elle le soit vraiment.",
    },
  ],
  calcul: {
    reponse: 825,
    etapes: [
      "Source « Ouvrir la grille de chiffrage » : salaire annuel chargé moyen d'un consultant senior, 96 000 €. La grille y ajoute 24 000 € de structure, chiffre de 2019, et divise par 218 jours (253 jours ouvrés, moins 25 de congés et 10 de RTT).",
      "Source « Demander à la direction financière les charges de structure » : 3,10 M€ de fonctions support et 3,74 M€ d'autres charges, soit 6,84 M€, rapportés aux 190 consultants facturables : 36 000 € par consultant et par an. Coût annuel complet du senior : 96 000 + 36 000 = 132 000 €.",
      "Source « Extraire de Tempora les temps de l'an dernier, par grade » : sur 218 jours, un senior a 7 jours d'absence, 6 de formation, 18 d'avant-vente, 15 d'intercontrat et 12 de tâches internes, soit 58 jours non facturables ; il facture 218 − 58 = 160 jours.",
      "Coût de revient complet d'une journée facturable : 132 000 / 160 = 825 €. Le calcul ne dépend pas du hasard ; l'épisode le juge juste à 10 € près.",
      "Pour comparer : la grille donne (96 000 + 24 000) / 218 ≈ 550 €, un tiers de moins. Les mêmes calculs donnent 562,50 € pour un analyste (90 000 / 160) et 1 000 € pour un manager (152 000 / 152).",
    ],
    erreurs: [
      {
        valeur: 605.5,
        cause:
          "La quote-part est mise à jour, mais le coût est divisé par les 218 jours travaillés au lieu des 160 jours facturés : 132 000 / 218.",
      },
      {
        valeur: 750,
        cause:
          "Les jours facturés sont pris, mais avec la quote-part de structure de 2019 : (96 000 + 24 000) / 160.",
      },
      {
        valeur: 550.5,
        cause:
          "Le coût de la grille est repris tel quel : (96 000 + 24 000) / 218, les deux erreurs ensemble.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Dariush Vahidi le dit : la transformation est tombée à 38 %, Kéroual est 10 % moins cher, la grille marche depuis cinq ans, c'est nos prix qu'il faut baisser.",
      ceQuiLeDejoue:
        "Les trois sources de la semaine 1 donnent 825 € pour un jour de senior, quand la grille en compte 550. Les forfaits clos affichaient 38 % de marge et finissent à −3 % : à 704 € le jour moyen après une baisse de 8 %, chaque forfait se vend sous son coût complet de 728,75 €, et bien sous le plancher de 787 €. Gustave le disait : un consultant ne facture pas ses 218 jours. Rejouée sur les trente tirages à la place du plancher au coût complet, cette règle perd 72,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 1,
      pourquoi:
        "Le Département vient de partir chez Kéroual à 690 € : s'aligner partout où il est en face, ou finir le trimestre sans carnet.",
      ceQuiLeDejoue:
        "L'analyse par type de consultation : quand la technique pèse au moins 60 %, Atlas gagne 42 % des consultations au prix de l'an dernier, et en perd rarement sur le seul prix ; quand le prix pèse la moitié ou plus, Kéroual l'emporte à 690 €, sous notre coût complet de 728,75 € : chaque consultation de ce type gagnée à son prix est une perte signée. Aïssatou Ndour signale l'avant-vente saturée. Rejoué sur les trente tirages à la place du go / no-go, l'alignement perd 63,6 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Le conseil de la coopérative a voté 200 000 €, pas un euro de plus ; Lorcan veut des gens expérimentés pour un client sensible et propose 10,7 % de remise.",
      ceQuiLeDejoue:
        "Chiffrer trois équipes au coût complet de chaque grade : l'équipe de Lorcan, un tiers de managers, coûte 191 000 € avant un dépassement de 7 %, soit environ 204 k€ pour 200 k€ de prix ; des analystes encadrés par les seniors coûtent 164 250 €, environ 179 k€ avec 9 % de dépassement. La pyramide tient le budget sans toucher au prix. Rejoué sur les trente tirages à la place de la pyramide revue, ce choix perd 13,8 k€ en moyenne, même s'il fait mieux 10 fois, quand le comité rappelle le manager.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Dariush le répète : Kéroual répondra à 700 €, et ce sont 400 jours garantis la première année.",
      ceQuiLeDejoue:
        "Le règlement : 60 points de technique, 40 de prix. À 790 €, le prix plancher vaut 35,4 points sur 40, le catalogue à 850 € en vaut 32,9 ; Atlas obtient 50 sur 60 en technique, Kéroual 46, et le go / no-go ajoute 3 points. À 700 €, les 400 jours garantis se vendent sous le coût complet de 728,75 €. Sous le tirage 9, Atlas gagne au catalogue. Rejoué sur les trente tirages à la place du prix plancher, l'alignement perd 43,4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Client historique depuis 2016 : on reconduit à 760 € comme chaque année, on a toujours fait comme ça.",
      ceQuiLeDejoue:
        "La marge réelle de l'an dernier : l'équipe de la mutuelle coûte 755 € le jour, 800 € avec ses 6 % de dépassement habituels ; à 760 €, la mission a coûté environ 10,5 k€. Domenica Marzin a consulté Halden à 980 € et tient à l'équipe : une hausse argumentée autour de 840 € passerait sept fois sur dix. Sous le tirage 9, elle refuse et part, et la reconduction fait encore 8,2 k€ de moins ; sur les trente tirages, elle perd 17,2 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "La grille donne 550 € pour un jour de senior, le bon calcul 825 €. Quelles sont ses deux erreurs, et laquelle pèse le plus ?",
    "Les forfaits affichaient 38 % de marge et finissent à −3 %. Si aucun forfait n'avait dépassé, quelle aurait été la marge réelle ? D'où vient donc l'essentiel de l'écart ?",
    "Baisser les prix de 8 % fait gagner plus de forfaits. Pourquoi cela fait-il perdre plus d'argent ?",
    "La biscuiterie paie 461,5 € le jour, sous le coût complet d'un analyste. Pourquoi l'accepter pour six semaines était-il la meilleure réponse, et pourquoi dix semaines ne l'étaient-elles plus ?",
    "Pour Valmorin, la remise et la pyramide revue tiennent le même budget. Qu'est-ce qui les sépare ?",
    "Sous le tirage 9, la mutuelle a refusé 840 € et elle est partie. Fallait-il donc reconduire à 760 € ? Que dit le rejeu des trente tirages ?",
    "Quelle règle gardez-vous pour chiffrer une journée ? Formulez-la en une phrase, avec un chiffre de l'épisode dedans, et dites quand le coût marginal la remplace.",
  ],
  prolongement: {
    enonce:
      "Un bureau d'études emploie des ingénieurs dont le salaire annuel chargé moyen est de 80 000 €. Les charges de structure représentent 30 000 € par ingénieur. Un ingénieur travaille 218 jours par an et en facture 170. 1) Calculez le coût d'une journée selon une grille qui divise par les jours travaillés, puis le coût de revient complet d'une journée facturable. De combien la grille le sous-estime-t-elle ? 2) Le dépassement moyen des forfaits est de 6 % : quel est le prix plancher d'une journée ? 3) Un client propose 20 jours à 500 € pour un ingénieur en intercontrat certain pendant un mois ; la mission entraîne 30 € de frais non refacturés par jour. Que rapporte-t-elle au bureau ? 4) Même proposition, mais l'ingénieur aurait pu facturer ces 20 jours à 800 € sur une autre mission : que coûte-t-elle alors ?",
    corrige:
      "1) Grille : 110 000 / 218 ≈ 504,59 € ; coût complet d'une journée facturable : 110 000 / 170 ≈ 647,06 € ; la grille le sous-estime de 1 − 504,59 / 647,06 ≈ 22 %. 2) 647,06 × 1,06 ≈ 685,88 € le jour. 3) Le salaire est payé de toute façon : la mission ajoute seulement 20 × 30 = 600 € de frais, et rapporte 20 × 500 = 10 000 € ; elle enrichit le bureau de 9 400 €, bien qu'elle soit vendue sous le coût complet. 4) Elle prend la place de 20 × 800 = 16 000 € de facturation : elle fait perdre 16 000 − 10 000 + 600 = 6 600 € par rapport à l'autre mission. Le coût marginal ne vaut que pour une capacité qui serait vraiment perdue.",
  },
  evaluation: [
    "Le coût de revient complet d'une journée facturable de senior est calculé juste (132 000 / 160), à partir des trois sources nommées.",
    "L'écart entre marge affichée et marge réelle est expliqué par le coût d'une journée et par le dépassement, chiffres à l'appui.",
    "Les décisions de prix sont jugées par rapport au plancher au coût complet, dépassement compris.",
    "La mission d'intercontrat est jugée à son coût marginal, et la limite de la fenêtre d'intercontrat est vue.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage 9.",
  ],
  vigilance:
    "L'épisode retient 218 jours comme forfait annuel d'un cadre (253 jours ouvrés, moins 25 jours de congés et 10 de RTT) : le plafond de 218 jours vient du Code du travail, mais le nombre de jours de repos dépend de l'accord collectif et de l'année. La répartition des charges de structure par consultant, à parts égales entre grades, est une convention de l'épisode, que d'autres clés de répartition discuteraient.",
};
