/**
 * FICHE ENSEIGNANT · ÉPISODE 4, LE PRIX QUI NE PASSE PLUS.
 *
 * Construire une hausse de prix famille par famille, selon ce que les clients
 * comparent, et l'empêcher de fuir par les remises dérogatoires : une hausse
 * uniforme fait partir ceux qui comparent, et le taux de marge ne le montre pas.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "prix-qui-ne-passe-plus",
  formations: ["bts-mco", "but-tc", "stmg"],
  programme: [
    "BTS MCO · Bloc 3, Assurer la gestion opérationnelle",
    "BUT TC · Conduire les actions marketing",
    "STMG · Terminale mercatique, Thème 1, La définition de l'offre",
  ],
  notion:
    "Tous les prix ne se comparent pas : un client connaît au centime le prix des produits qu'il achète souvent et qu'un concurrent affiche, et presque jamais celui du reste. L'erreur classique, quand les coûts montent, consiste à passer la même hausse sur tout le tarif, ou à répercuter le coût famille par famille, ce qui augmente le plus les produits qui se comparent le plus ; l'erreur symétrique consiste à ne rien augmenter « pour ne perdre personne ». Dans l'épisode, Malik Ziani construit le tarif de la région lyonnaise d'Arvel Distribution : les achats ont pris 6 %, le taux de marge commerciale est passé de 29,9 % à 24,2 % en un an, les remises dérogatoires de 1,5 % à 3,4 % du chiffre d'affaires. La dernière hausse de 4 % sur tout a fait perdre 11 % de volume au gros œuvre en six semaines, et rien aux livraisons ; Altinéo n'annonce que +2 % sur le gros œuvre ; 58 % des dérogations portent sur la technique et les services, que personne ne fait chiffrer. L'élève découvre qu'une hausse différenciée (+2 %, +9 %, +15 %) rend autant de taux de marge qu'une hausse de 6 % partout sans faire partir les maçons, qu'une hausse fuit par les remises si personne ne l'encadre, et qu'un taux de marge qui remonte peut cacher des volumes qui partent.",
  objectifs: [
    "Je distingue les produits que les clients comparent de ceux qu'ils ne comparent pas, à partir des ventes et des devis.",
    "Je calcule un taux de marge commerciale après une hausse de prix, et je le confronte aux volumes perdus.",
    "Je construis une hausse différenciée par famille plutôt qu'une hausse uniforme ou une simple répercussion des coûts.",
    "J'encadre les remises dérogatoires par des niveaux de délégation, un motif et une pièce justificative, au lieu de les interdire ou de les laisser filer.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de prix de vente, de coût d'achat, de marge commerciale et de taux de marge doivent être connues ; le calcul d'un pourcentage d'évolution suffit. La sensibilité des clients au prix, les prix d'appel et la délégation des remises peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/prix-qui-ne-passe-plus?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de valider la semaine 1, le taux de marge commerciale prévu pour la semaine 3, le calcul qui y mène, et le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans donner de piste, et vous relevez deux choses : la hausse construite en semaine 1, et la réponse aux dérogations en semaine 3. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 1, et compare les volumes du gros œuvre en semaine 5.",
    },
    {
      minutes: 15,
      titre: "Correction de la prévision de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées. Vous refaites le calcul avec la classe : le coût d'achat représente aujourd'hui 75,8 % du prix encaissé ; une hausse moyenne d'environ 6 % le ramène vers 71,5 %, et les remises qui montent encore reprennent un peu. Vous faites constater que +6 % partout donne presque le même taux en semaine 3 (28,2 %) : la différence est dans les volumes. Vous faites expliquer les valeurs éloignées : 30,2 %, 29,9 %, 24,2 %.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 (+6 %, différencié, rien, répercussion), de la semaine 3 (interdire, encadrer, laisser faire, prime sur la marge) et de la semaine 7 (Altinéo). Pour la hausse, vous faites lire la source sur la hausse de 2024 et comparer l'écart avec Altinéo sur le gros œuvre dans chaque option ; pour les dérogations, l'expérience des régions Alpes (1,7 %) et Est (deux grands comptes perdus).",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 12, « Différencier, encadrer, accompagner » finit 29,1 k€ au-dessus du budget, « Le prix d'un seul bloc » 100 k€ en dessous et l'attentiste 115,7 k€ en dessous ; sur les trente tirages, la première tient le budget 30 fois, les deux autres jamais. Vous montrez ensuite la décision où le hasard a épargné l'attente : sous ce tirage, Altinéo n'a pas lancé son opération chez qui avait différencié, et ne rien préparer n'a rien coûté.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : augmenter peu ce qui se compare, davantage ce qui ne se compare pas, encadrer les remises, et donner aux vendeurs de quoi expliquer. Vous ajoutez la mise en garde : un taux de marge se lit avec les volumes. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 28.3,
    etapes: [
      "Point de départ (alerte de la semaine 1) : taux de marge commerciale de 24,2 % la semaine dernière ; le coût d'achat représente donc 100 − 24,2 = 75,8 % du chiffre d'affaires encaissé. Les achats ont déjà pris 6 %, rien n'a été répercuté, et les remises dérogatoires sont à 3,4 % du chiffre d'affaires.",
      "La bonne décision (+2 % sur le gros œuvre, +9 % sur la technique, +15 % sur les services) vise une hausse moyenne d'environ 6 %, comme la demande de la direction, mais répartie selon ce que les clients comparent. Elle s'applique dès la semaine 2.",
      "Taux attendu si la hausse passe entière : 1 − 75,8 / 106 ≈ 28,5 %. Les remises dérogatoires continuent de monter un peu (de 3,4 % à environ 3,8 % en semaine 3, la règle de la semaine 3 n'agissant qu'ensuite) : la hausse réellement encaissée n'est que d'environ 5,9 %, et le taux tombe à 28,3 %.",
      "Sous le tirage n° 12, le modèle donne 28,3 % (28,29) en semaine 3. Le chiffre ne dépend presque pas du hasard (de 26 % à 28,3 % selon les trente tirages), et à peine de la forme de la hausse : 28,2 % avec +6 % partout, 28,3 % avec la répercussion famille par famille, 24 % sans hausse. Ce qui change, ce sont les volumes du gros œuvre : 1,02 de leur niveau d'avant avec la hausse différenciée, 0,87 avec +6 %, 0,80 avec la répercussion. L'épisode juge juste à 1 point près, proche à 2,5.",
    ],
    erreurs: [
      {
        valeur: 30.2,
        cause:
          "Les 6 % de hausse de prix ajoutés en points au taux de marge (24,2 + 6) : une hausse de prix de 6 % n'ajoute pas 6 points de taux, parce que le taux se calcule sur le nouveau prix.",
      },
      {
        valeur: 29.9,
        cause:
          "Le retour au taux d'il y a un an, comme si la hausse rattrapait tout : les remises dérogatoires, passées de 1,5 % à 3,4 %, en reprennent une partie.",
      },
      {
        valeur: 24.2,
        cause:
          "Le taux de la semaine dernière reporté tel quel, comme si la hausse décidée ne changeait rien d'ici la semaine 3.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "C'est la demande de la direction, telle quelle : les coûts ont pris 6 %, les prix prennent 6 %, une hausse simple à annoncer et la même pour tous.",
      ceQuiLeDejoue:
        "La source sur la dernière hausse le montre : en 2024, +4 % sur tout le tarif, le gros œuvre a perdu 11 % de volume en six semaines, et les maçons partis ont emporté une partie de leurs achats de technique ; les livraisons et les découpes n'ont rien perdu. Altinéo n'annonce que +2 % sur le gros œuvre, et sept devis comparés sur dix portent sur quarante références de gros œuvre. À +6 %, le ciment passe au-dessus d'Altinéo, et Florian prévient qu'il perdra la moitié de ses maçons. Rejouée sur les trente tirages à la place de la hausse différenciée, elle perd 42,4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Ne rien augmenter, c'est ne perdre aucun client : la marge absorbera la hausse des coûts le temps d'y voir clair.",
      ceQuiLeDejoue:
        "Les achats ont déjà pris 6 % : sans hausse, le taux de marge reste autour de 24 %, loin du budget, et les remises dérogatoires continuent de monter (« c'est devenu une habitude », dit Mamadou). La technique et les services, que personne ne fait chiffrer ailleurs, pouvaient monter sans perte : Altinéo y est 4 à 9 % plus cher. Rejouée sur les trente tirages à la place de la hausse différenciée, l'absence de hausse perd 113,1 k€ en moyenne, la plus grosse perte de l'épisode, et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Les remises ont plus que doublé en un an : les interdire toutes, dès lundi, rend tout de suite de la marge.",
      ceQuiLeDejoue:
        "Un devis concurrent est joint dans un cas sur six : certaines dérogations sont justifiées, et Florian a deux clients avec un devis d'Altinéo sur le bureau. La région Est a tout interdit l'an dernier et a perdu deux grands comptes en un mois ; la région Alpes, avec une grille de délégation (3 % le commercial, 6 % le chef d'agence, un devis au-delà de 3 %), tient ses dérogations à 1,7 % sans perdre de volume. Rejouée sur les trente tirages à la place de la grille, l'interdiction perd 8 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 2,
      pourquoi:
        "Si les prix montent, il faut vendre plus : un objectif de +5 % de tonnage par commercial compense la marge perdue.",
      ceQuiLeDejoue:
        "L'accompagnement de Dimitri en tournée le montre : six clients sur neuf parlent des prix, il n'a rien d'autre à répondre que « c'est la direction », et propose une remise dans quatre cas. Un objectif de volume ne lui donne pas d'argument, et Florian le dit : « je vais le trouver sur le ciment, avec une remise ». La demi-journée d'équipe (3 000 €) donne l'argumentaire, les lettres de hausse des fournisseurs et les alternatives. Rejoué sur les trente tirages à la place de la formation, l'objectif de volume perd 10 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Si Altinéo attaque le gros œuvre, autant le devancer : 5 % de baisse sur toute la famille, et il n'a plus d'argument.",
      ceQuiLeDejoue:
        "Ce n'est qu'une rumeur, et la mesure de l'exposition la chiffre : les quarante références d'appel font 40 % du chiffre d'affaires du gros œuvre, et lors de la dernière opération d'Altinéo, un client sur cinq est allé voir pendant trois semaines et un sur dix n'est pas revenu. Baisser toute la famille coûte 5 % sur tout le gros œuvre jusqu'à la fin du trimestre, opération ou pas ; la riposte ciblée ne coûte que si l'opération démarre, et seulement sur les clients qui montrent l'offre. Rejouée sur les trente tirages à la place de la riposte prête, la baisse perd 19,2 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Garon Bâtiment est le plus gros client de la région, 9 % du chiffre d'affaires : lui rendre ses anciens prix le garde à coup sûr.",
      ceQuiLeDejoue:
        "L'analyse de ses achats montre que seuls ses 60 % de gros œuvre sont chiffrés chez Altinéo ; ses 40 % de technique ne l'ont jamais été, et ses chefs de chantier veulent les fixations et la livraison à 7 heures. Il a menacé deux fois en trois ans, et consulté une fois, pour moitié. Florian rapporte qu'après un geste accordé à Garon l'an dernier, deux grands comptes ont demandé « les conditions de Garon » dans le mois. Rejoué sur les trente tirages à la place du rendez-vous avec un prix ferme contre un engagement, céder perd 4,3 k€ en moyenne et ne fait mieux qu'une fois.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Mamadou propose 3 % sur tout pour finir le trimestre en volume : des commandes en plus et des commerciaux contents.",
      ceQuiLeDejoue:
        "Le rapprochement des bons de livraison et des factures trouve environ 2 800 € par semaine de livraisons express, de découpes et de palettes faites sans être facturées : de la marge à reprendre sans rien céder. Les 3 % s'appliquent à toutes les ventes des deux dernières semaines. Rejouée sur les trente tirages à la place de la facturation des prestations, la remise de fin de trimestre perd 11,2 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, la direction demandait +6 % « comme les coûts ». Qu'est-ce que la hausse de 2024 et le relevé des prix d'Altinéo disaient des familles qui se comparent ? Pourquoi répercuter le coût famille par famille faisait-il pire que +6 % partout ?",
    "En semaine 3, le taux de marge est presque le même avec +6 % partout et avec la hausse différenciée (28,2 % et 28,3 %). Où se voit la différence ? Qu'aurait conclu une direction qui ne lit que le taux de marge ?",
    "Interdire toutes les dérogations, les encadrer, ou laisser faire : que montraient les régions Alpes et Est ? Pourquoi un devis concurrent exigé au-delà de 3 % change-t-il ce que les commerciaux accordent ?",
    "Dimitri répond « c'est la direction » et propose une remise dans quatre cas sur neuf. Qu'est-ce qu'une demi-journée d'équipe lui donne que la note de deux pages ne lui donne pas ?",
    "Sous le tirage n° 12, Altinéo n'a pas lancé son opération chez ceux qui avaient différencié la hausse : ceux qui n'ont rien préparé finissent au même résultat que ceux qui ont préparé la riposte. Sur les trente tirages, ne rien faire perd pourtant 6,6 k€ en moyenne et ne fait jamais mieux. Leur choix était-il bon ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Garon voulait ses anciens prix. Que gagnait-on à tenir la technique et à offrir un prix ferme sur le gros œuvre contre un engagement de volume ? Que coûtait un geste qui se sait chez les autres grands comptes ?",
    "Quelle règle gardez-vous pour construire une hausse de prix ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Un négoce vend chaque semaine 100 000 € de gros œuvre, dont le coût d'achat représente 84 % du prix, et 80 000 € de technique, dont le coût représente 67 %. 1) Quelle marge commerciale fait-il par semaine, et quel taux de marge ? 2) Option A : +6 % sur tout. Le gros œuvre, qui passe au-dessus du concurrent, perd 12 % de volume ; la technique en perd 3 %. Calculez le chiffre d'affaires, la marge et le taux de marge. 3) Option B : +2 % sur le gros œuvre, aligné sur le concurrent, sans perte de volume ; +10 % sur la technique, qui perd 5 % de volume. Mêmes calculs. 4) Quelle option a le meilleur taux de marge ? Laquelle rapporte le plus ? Que concluez-vous ? 5) Les remises dérogatoires sont à 3,4 % du chiffre d'affaires de l'option B ; une grille de délégation les ramène à 1,7 %. Combien la marge gagne-t-elle par semaine ?",
    corrige:
      "1) 100 000 × 16 % + 80 000 × 33 % = 16 000 + 26 400 = 42 400 € par semaine, soit 23,6 % de 180 000 €. 2) Gros œuvre : 100 000 × 0,88 × 1,06 = 93 280 € de chiffre d'affaires pour 84 000 × 0,88 = 73 920 € d'achats, soit 19 360 € ; technique : 80 000 × 0,97 × 1,06 = 82 256 € pour 53 600 × 0,97 = 51 992 €, soit 30 264 €. Total : 175 536 € de chiffre d'affaires, 49 624 € de marge, 28,3 %. 3) Gros œuvre : 102 000 − 84 000 = 18 000 € ; technique : 80 000 × 0,95 × 1,10 = 83 600 € pour 50 920 € d'achats, soit 32 680 €. Total : 185 600 € de chiffre d'affaires, 50 680 € de marge, 27,3 %. 4) A a le meilleur taux, B rapporte 1 056 € de plus par semaine et garde les clients du gros œuvre : le taux de marge ne suffit pas à juger une hausse. 5) (3,4 − 1,7) % × 185 600 ≈ 3 155 € de marge en plus par semaine.",
  },
  evaluation: [
    "Le diagnostic de la semaine 1 s'appuie sur la hausse de 2024 et sur l'analyse des dérogations, et l'élève dit pourquoi la comparaison avec les autres régions n'apprend rien.",
    "La prévision du taux de marge en semaine 3 est construite par un calcul écrit (coût rapporté au prix, hausse moyenne, remises), et l'écart avec 28,3 % est expliqué.",
    "La hausse construite distingue les familles que les clients comparent de celles qu'ils ne comparent pas, avec les chiffres des sources, et l'élève lit le taux de marge avec les volumes.",
    "La réponse aux dérogations, à Altinéo et à Garon Bâtiment est argumentée comme une règle ou une contrepartie, pas comme un alignement général.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "Le corrigé de 28,3 % est celui du modèle : les poids des familles dans le chiffre d'affaires ne figurent pas dans les sources, et l'élève ne peut viser qu'une hausse moyenne d'environ 6 %. La facturation de prestations jusque-là offertes (livraison sous 250 €, livraisons express, découpes) et la garantie écrite d'alignement sur toute offre concurrente supposent que les conditions générales de vente et l'information des clients le prévoient : l'épisode ne discute pas ce point de droit commercial.",
};
