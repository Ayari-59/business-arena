import type { FicheEnseignant } from "./types";

/**
 * FICHE ENSEIGNANT · ÉPISODE 36, L'ATELIER SATURÉ.
 *
 * Le facteur rare : marge sur coût variable par heure de la ressource saturée,
 * et prix plancher d'une commande sous contrainte de capacité.
 */
export const FICHE: FicheEnseignant = {
  code: "atelier-sature",
  formations: ["bts-cg", "dcg", "but-gea"],
  programme: [
    "DCG · UE 11, Contrôle de gestion",
    "BTS CG · Processus 5, Analyse et prévision de l'activité",
    "BUT GEA · Contrôle de gestion",
  ],
  notion:
    "Quand une ressource est saturée, un produit ne se juge plus sur sa marge sur coût variable unitaire ni sur son taux de marge, mais sur sa marge sur coût variable par unité de facteur rare ; et une heure de cette ressource vaut ce que rapporte la pièce qu'on refuse pour la libérer. L'erreur classique est de privilégier le produit au plus gros ticket, ou au meilleur taux, et de fixer le prix plancher d'une commande nouvelle à son seul coût variable. Dans l'épisode, un centre d'usinage offre 38 heures par semaine pour 48 demandées, et l'escalier, qui a la plus forte marge unitaire (2 800 €) et le meilleur taux (50 %), est la pièce qui paie le moins bien l'heure de machine : 400 €, contre 810 € pour une fenêtre. Le directeur commercial pousse les escaliers, le service comptable fournit un coût complet et une heure d'arrêt à 38 € ; tout se tranche pourtant par le même calcul. Le prix d'une commande, l'achat d'heures supplémentaires et l'arrêt de la machine se jugent ensuite sur ce coût d'opportunité de 400 € de l'heure.",
  objectifs: [
    "Je repère, à partir de la charge de chaque poste, la ressource qui limite l'activité.",
    "Je calcule la marge sur coût variable par unité de facteur rare et je classe les produits sur ce critère.",
    "Je calcule le prix plancher d'une commande sous contrainte de capacité : son coût variable plus le coût d'opportunité des heures qu'elle prend.",
    "Je valorise une heure de ressource rare, ajoutée ou perdue, à ce que rapporte la dernière pièce servie, et non au salaire de l'opérateur.",
  ],
  prerequis:
    "La distinction entre charges variables et charges fixes, la marge sur coût variable et le taux de marge sur coût variable doivent avoir été vus ; le facteur rare peut être découvert pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/atelier-sature?hasard=12 : toute la classe joue le même trimestre, seule ou en binôme, au niveau Standard. Vous présentez l'atelier en deux phrases (une machine par où tout passe, un carnet qui déborde) sans prononcer les mots « facteur rare ». Vous demandez de noter sur papier la prévision de la semaine 1 et la règle de planning choisie.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans donner de réponse, en relevant au tableau, à main levée ou par une feuille qui passe, la règle de planning retenue en semaine 1 et la réponse au bailleur. Aux plus rapides, vous demandez de rejouer le trimestre en changeant une seule décision.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous affichez la distribution des prévisions de la classe : en général un groupe autour de 400 €, un autre à 2 800 € ou à 129 €. Vous refaites le calcul à partir des fiches de coût, puis vous ajoutez la fenêtre et la porte pour obtenir le classement 810, 650, 400 €. Vous faites dire pourquoi le coût complet ne sert pas ici : les charges fixes réparties sont là quoi qu'on fabrique.",
    },
    {
      minutes: 25,
      titre: "Débrief des décisions",
      detail:
        "Vous partez de la décision où la classe s'est le plus partagée, le planning ou le bailleur dans la plupart des groupes. Chaque camp donne son argument, puis vous faites chiffrer le coût d'opportunité : 400 € de l'heure si le planning est bien classé, environ 591 € au premier arrivé, premier servi. Vous enchaînez sur la broche, en opposant les 38 € du service comptable aux 400 € de Soizic.",
    },
    {
      minutes: 10,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous projetez le bilan d'un élève et sa comparaison aux trente tirages. Vous faites constater que la bonne méthode bat les deux autres sur chacun des trente tirages, et que la broche est la seule décision où les aléas peuvent renverser le jugement. Vous posez la question de l'option qui trompe, absente ici, et faites chercher pourquoi.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau les trois règles : classer par marge sur coût variable par unité de facteur rare ; prix plancher égal au coût variable plus les heures prises valorisées à la marge par heure de la pièce évincée ; une heure ajoutée ou perdue vaut cette même marge. Vous faites dire quand elles cessent de valoir : quand la ressource n'est plus saturée, le coût d'opportunité tombe à zéro. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 400,
    etapes: [
      "Source « Reprendre les fiches de coût des trois produits » : l'escalier se vend 5 600 € HT ; ses coûts variables sont le chêne 1 950 €, la quincaillerie et les fixations 230 €, le vernis et la finition 380 €, la livraison 240 €, soit 2 800 €. Les menuisiers, payés au mois, ne sont pas un coût variable.",
      "Marge sur coût variable unitaire de l'escalier : 5 600 − 2 800 = 2 800 € (taux de marge sur coût variable : 50 %).",
      "Source « Relever la charge de chaque poste de l'atelier » : seul le centre d'usinage est saturé, 48 heures demandées pour 38 disponibles ; c'est le facteur rare. La fiche de coût donne 7 heures de centre d'usinage par escalier (4 pour les limons, 3 pour les marches).",
      "Marge sur coût variable par heure de facteur rare : 2 800 / 7 = 400 € par heure de machine. Pour comparer : fenêtre 405 / 0,5 = 810 €, porte d'entrée 1 300 / 2 = 650 €.",
      "Le résultat ne dépend pas des aléas : 400 € sous la graine 12 comme sous toutes les autres.",
    ],
    erreurs: [
      {
        valeur: 129,
        cause:
          "Le résultat par pièce du coût complet (5 600 − 4 700 = 900 €) divisé par 7 heures : les charges fixes réparties n'ont rien à faire dans un choix de production à capacité donnée.",
      },
      {
        valeur: 2800,
        cause:
          "La marge sur coût variable unitaire, non rapportée aux heures de machine : c'est l'argument du directeur commercial, pas la mesure demandée.",
      },
      {
        valeur: 434,
        cause:
          "La livraison (240 €) oubliée dans les coûts variables : 3 040 / 7 ≈ 434 €. L'écart est proche, mais une charge qui varie avec chaque pièce vendue est un coût variable, qu'elle soit de production ou de distribution.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "L'escalier a la plus forte marge unitaire (2 800 €), le directeur commercial le répète, et un escalier fait six fenêtres de chiffre d'affaires.",
      ceQuiLeDejoue:
        "Rapportée aux 7 heures de machine, sa marge tombe à 400 € de l'heure, contre 810 € pour la fenêtre et 650 € pour la porte. Sur les 10 heures qui manquent chaque semaine, refuser des escaliers coûte 4 000 € de marge, refuser des fenêtres 8 100 €.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Le taux de marge paraît neutraliser l'effet de taille des produits, et l'escalier a aussi le meilleur (50 %).",
      ceQuiLeDejoue:
        "Le taux rapporte la marge au prix, pas à la ressource qui manque. Le classement escalier (50 %), fenêtre (45 %), porte (40 %) ne laisse que 2 heures aux portes : 5 portes refusées, 6 500 € de marge perdue par semaine, contre 4 000 € en refusant des escaliers.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Le prix de 1 350 € couvre largement le coût variable de 900 € : 450 € de marge par porte, 13 500 € sur la commande.",
      ceQuiLeDejoue:
        "Chaque porte prend 1,5 heure retirée aux escaliers, à 400 € de l'heure : le prix plancher est 900 + 1,5 × 400 = 1 500 €. À 1 350 €, chaque porte détruit 150 € de marge, 4 500 € sur les 30 ; la source « Demander à Soizic ce que la machine refuse aujourd'hui » donnait le chiffre.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "La fenêtre a la plus petite marge unitaire (405 €) ; la faire fabriquer ailleurs libère 15 heures de machine pour les escaliers, et le directeur commercial le propose.",
      ceQuiLeDejoue:
        "Achetée 790 €, une fenêtre ne laisse plus que 110 € au lieu de 405 €, et la demi-heure qu'elle libère ne rapporte que 200 € en escaliers ; une demande sur sept, hors cotes standard, part en plus. La deuxième équipe, elle, achète des heures à 120 € (1 200 € pour 10 heures) qui en rapportent 400.",
    },
    {
      decision: 3,
      option: 1,
      pourquoi:
        "C'est le changement le moins cher sur la facture (3 900 € contre 5 900 € le samedi), et le service comptable chiffre l'heure d'arrêt à 38 €, le salaire de l'opérateur.",
      ceQuiLeDejoue:
        "Une heure d'arrêt coûte la dernière pièce servie, 400 € : les 12 heures d'arrêt en semaine valent 4 800 €, soit 8 700 € au total, plus que le samedi. Et laisser tourner restait le meilleur pari en moyenne : une chance sur cinq de payer 6 500 € et deux jours de machine.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Le pic est le moment de faire du chiffre, l'escalier est le gros ticket, et l'historique montre qu'une promotion de 10 % fait 40 % de demandes en plus.",
      ceQuiLeDejoue:
        "La machine est pleine et l'escalier est la dernière pièce servie : la demande en plus n'est pas servie, et chaque escalier servi rapporte 560 € de moins (2 240 €, soit 320 € de l'heure). Le samedi achète 8 heures pour 1 300 €, qui rapportent 3 200 € de marge.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Un escalier, c'est 5 600 € de facture : en fin de trimestre, passer les gros tickets d'abord semble le moyen le plus rapide de remonter vers le budget.",
      ceQuiLeDejoue:
        "Le trimestre est jugé sur la marge, pas sur le chiffre d'affaires, et c'est la règle de la marge unitaire réintroduite : chaque heure donnée à un escalier est prise à une fenêtre (810 €) ou à une porte (650 €). Le promoteur paie (6 800 − 3 000) / 7 ≈ 543 € de l'heure, plus que les 400 € de la dernière pièce servie : 4 000 € de marge en plus sur 28 heures.",
    },
  ],
  debrief: [
    "Qu'est-ce qui limitait l'atelier ? Qui a diagnostiqué un manque de capacité, et pourquoi n'était-ce pas le premier levier tant que les 38 heures existantes allaient à des pièces qui les payaient mal ?",
    "L'escalier a la plus forte marge unitaire et le meilleur taux de marge : comment peut-il être la pièce qui paie le moins bien l'atelier ? Que mesure chacun des trois critères, et lequel convient quand une ressource est saturée ?",
    "Quel était le prix plancher de la porte palière ? Aurait-il été le même si le planning était resté au premier arrivé, premier servi (une heure de machine valait alors environ 591 €, soit un plancher d'environ 1 786 €) ?",
    "Le service comptable chiffre l'heure d'arrêt à 38 €, la contrôleuse de gestion à 400 € : qui a raison, et pourquoi le changement de broche un samedi, plus cher sur la facture, coûte-t-il moins que l'arrêt en semaine ?",
    "Dans d'autres épisodes, une mauvaise option bat la meilleure un tirage sur trois. Ici, pour quatre décisions sur six, la meilleure option fait mieux que toutes les autres sur chacun des trente tirages : pourquoi le résultat récompense-t-il presque toujours la bonne décision ? Et à quelle décision les aléas pouvaient-ils encore renverser le jugement ?",
    "La méthode « raisonner par heure de machine » bat les deux autres sur les trente tirages, et finit pourtant une fois sous son budget. Sur le trimestre joué par la classe, le chemin de la marge par pièce portait 80 % de risque de voir partir l'artisan, qui est resté. Un bon résultat prouvait-il une bonne décision, et un résultat sous le budget une mauvaise ?",
    "Si la deuxième équipe avait porté la capacité au-delà des 48 heures demandées, le classement des produits et le prix plancher du bailleur auraient-ils changé ?",
  ],
  prolongement: {
    enonce:
      "Un atelier de découpe laser dispose de 55 heures de machine par semaine ; aucun autre poste n'est saturé. Produit A : prix 150 €, coût variable 90 €, 0,25 heure de machine, 80 pièces demandées par semaine. Produit B : prix 500 €, coût variable 325 €, 1 heure, 20 pièces. Produit C : prix 1 000 €, coût variable 520 €, 3 heures, 10 pièces. 1) Calculez pour chaque produit la marge sur coût variable unitaire, le taux de marge sur coût variable et la marge sur coût variable par heure de machine. 2) Établissez le programme qui maximise la marge sur coût variable de la semaine et calculez-la. 3) Quelle marge obtient un planning classé par marge unitaire ? par taux de marge ? 4) Un client propose 12 pièces sur mesure, de coût variable 210 € et 1 h 15 de machine chacune : quel est le prix plancher ? 5) Sans cette commande, une heure de machine supplémentaire coûte 120 € : faut-il en ouvrir, et combien ?",
    corrige:
      "1) A : 60 €, 40 %, 240 €/h ; B : 175 €, 35 %, 175 €/h ; C : 480 €, 48 %, 160 €/h. La demande réclame 20 + 20 + 30 = 70 heures pour 55 : la machine est le facteur rare. 2) A puis B puis C : 80 A (20 h), 20 B (20 h), puis 15 heures pour 5 C ; marge 4 800 + 3 500 + 2 400 = 10 700 €. 3) Par marge unitaire (C, B, A) : 10 C (30 h), 20 B (20 h), 20 A (5 h), soit 4 800 + 3 500 + 1 200 = 9 500 €, 1 200 € de moins (15 heures à 240 € au lieu de 160 €). Par taux (C, A, B) : 10 C, 80 A, 5 B, soit 4 800 + 4 800 + 875 = 10 475 €, 225 € de moins. 4) La commande prend 12 × 1,25 = 15 heures, exactement celles des 5 C : coût d'opportunité 15 × 160 = 2 400 €, soit 200 € par pièce ; prix plancher 210 + 200 = 410 €. 5) Une heure de plus sert du C à 160 € pour 120 € : oui, 15 heures (la demande de C non servie), 600 € de marge en plus ; au-delà, la machine n'est plus saturée et l'heure ne rapporte plus rien.",
  },
  evaluation: [
    "La marge sur coût variable par heure de l'escalier est calculée juste, coûts variables détaillés, sans charge fixe répartie.",
    "Le classement des produits est justifié par la marge par unité de facteur rare, et l'élève montre pourquoi ni la marge unitaire ni le taux de marge ne conviennent ici.",
    "Le prix plancher d'une commande est calculé avec le coût d'opportunité, et l'élève dit de quelle pièce évincée il dépend.",
    "Un arrêt ou une heure ajoutée est valorisé à ce que rapporte la dernière pièce servie, pas au salaire de l'opérateur.",
    "L'élève distingue la décision de la broche, un pari sous incertitude, des autres, qui relèvent du calcul.",
  ],
  vigilance:
    "Le modèle traite les pièces comme divisibles (une fraction d'escalier par semaine) et la demande non servie comme perdue, sans report au carnet : le coût d'opportunité de 400 € n'est juste qu'à la marge, tant qu'une commande n'évince que des escaliers. Il impute aussi à la marge de l'atelier la marge de négoce perdue si l'artisan part (9 000 €), une convention commode qu'un enseignant voudra peut-être signaler.",
};
