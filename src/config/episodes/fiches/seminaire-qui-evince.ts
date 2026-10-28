/**
 * FICHE ENSEIGNANT · ÉPISODE 52, LE SÉMINAIRE QUI CHASSE LES CLIENTS.
 *
 * Le coût de déplacement d'un groupe : il se juge sur sa contribution totale
 * (chambres, salles, restauration) moins celle des clients individuels qu'il
 * évince. Le piège : signer ce qui remplit l'hôtel, ou refuser ce qui paraît
 * sous le prix moyen, sans faire le calcul nuit par nuit.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "seminaire-qui-evince",
  formations: ["bts-mhr", "bts-mhr-bc"],
  programme: [
    "BTS MHR · Bloc 2, Mercatique des services en hôtellerie restauration",
    "BTS MHR · Bloc 4, Pilotage de la production de services en hôtellerie restauration",
  ],
  notion:
    "Une chambre ne se vend qu'une fois par nuit : un groupe qui bloque des chambres un soir où l'hôtel se remplirait chasse les clients individuels qui les auraient prises, à un prix plus haut, et qui auraient dîné au restaurant. L'erreur classique a deux faces : signer un groupe parce qu'il remplit l'hôtel, ou le refuser parce que son prix chambre est sous le prix moyen. Dans l'épisode, Anton Leclercq vend les groupes de L'Escale Évian, 66 chambres sur le Léman. Le séminaire des Laboratoires Orvandel demande 55 chambres du 16 au 18 juin à 158 €, quand la prévision attend 58, 61 et 57 clients individuels à 232 € : il en évincerait 143 nuitées, soit environ 29,9 k€ de marge, dîners compris. Le même séminaire, du 26 au 28 mai, où la prévision n'attend que 30 à 34 chambres, n'évince presque personne. À l'inverse, la convention Mélizane paie 145 € la chambre en juillet, mais sa salle garde 90 % de son prix et son gala de 140 couverts couvre largement les clients qu'elle chasse. L'élève découvre qu'un groupe se juge sur sa contribution nette, qu'un bloc sans date limite de libération ni clause d'attrition laisse des chambres vides qui ne se revendent plus, et qu'une série d'été ne vaut que si l'été est mou.",
  objectifs: [
    "Je calcule ce que vaut une nuitée individuelle : prix, commission moyenne, coût variable et marge du dîner.",
    "Je calcule le déplacement d'un groupe nuit par nuit, et sa contribution nette de ce déplacement.",
    "Je fixe un prix de déplacement, et je propose d'autres dates quand le groupe évince trop.",
    "Je protège un bloc par une date limite de libération, une clause d'attrition et un acompte, et je reprends tôt les chambres qu'un groupe annonce libres.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "La marge sur coût variable, le taux d'occupation, le prix moyen et le RevPAR doivent avoir été vus en cours, ainsi que la notion de commission d'une plateforme ou d'une agence. Le déplacement, l'attrition et la date limite de libération peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/seminaire-qui-evince?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous présentez la demande d'Orvandel et vous demandez de noter sur papier, avant de valider la semaine 1, la valeur des clients individuels que le séminaire évincerait en juin et le calcul qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez la réponse à Lacustra en semaine 1 et celle à Tavenne Voyages en semaine 5, où la classe se partage le plus. Un binôme qui a fini tôt chiffre la convention Mélizane ligne par ligne, avec et sans le gala.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées, puis vous reconstruisez le calcul avec la classe : les chambres libres une fois le bloc posé, les nuitées évincées nuit par nuit, puis la valeur d'une nuitée individuelle (prix, commission moyenne, coût variable, dîner). Vous faites expliquer les valeurs éloignées (26,3 k€, 33,2 k€ ou 34,5 k€). Vous mettez enfin le séminaire en face : ses 165 nuitées à 158 €, commission de l'agence et coût variable déduits, laissent environ 18,5 k€ avant ses salles et ses dîners, et 14,4 k€ seulement s'il n'occupe que 78 % de son bloc sans clause.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 (accepter juin, proposer mai ou 228 €, bloc réduit, décliner), de la semaine 4 (Mélizane) et de la semaine 5 (Tavenne). Ceux qui ont refusé Mélizane défendent leur argument du prix moyen ; vous faites calculer au tableau sa salle (2 jours à 2 800 €, 90 % de marge), son gala (140 couverts à 89 €, 63 % de marge, six extras à 190 €) et ce qu'elle évince (17 k€, plus 2 k€ de Table fermée). Pour Tavenne, vous faites lire ce que dit Lucile : +18 k€ si l'été est mou, −7 k€ s'il est conforme, −15 k€ s'il est fort.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 12, l'été est plus fort que prévu et Orvandel a choisi fin mai. « Juger chaque groupe sur sa contribution nette » finit à 1 205 k€ de contribution pour 1 140 k€ attendus ; « Laisser l'été aux individuels » à 1 175 k€ ; « Remplir l'hôtel » à 1 144 k€. Vous montrez la décision où le hasard compte le plus : la série Tavenne. Refuser d'emblée fait mieux que l'analyse de Lucile 18 fois sur 30, mais perd 2,5 k€ en moyenne ; signer tout de suite fait mieux 13 fois, dans les étés mous, et perd 6,6 k€ en moyenne. Vous faites dire pourquoi l'analyse reste la meilleure décision, même quand elle n'a pas le meilleur résultat.",
    },
    {
      minutes: 10,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : contribution nette d'un groupe = sa marge (chambres, salles, restauration) − la marge des individuels qu'il évince. Vous en tirez les gestes : un prix de déplacement par demande, d'autres dates quand le groupe évince trop, une date limite de libération à J-21, une clause d'attrition et un acompte dans chaque contrat, et les chambres annoncées libres remises en vente le jour même. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 29.9,
    etapes: [
      "Source « Lire la prévision d'occupation dans Hostéo » : 58, 61 et 57 chambres individuelles attendues les 16, 17 et 18 juin, sur 66 chambres. Avec un bloc de 55 chambres, il en reste 11 pour les individuels : le séminaire en évince 58 − 11 = 47, 61 − 11 = 50 et 57 − 11 = 46, soit 143 nuitées.",
      "Une nuitée individuelle à 232 € : 45 % passent par Bookalia et Voyagio à 17 %, soit une commission moyenne de 232 × 0,45 × 0,17 = 17,75 € ; le contrôle de gestion donne 30 € de coût variable. Marge de la chambre : 232 − 17,75 − 30 = 184,25 €.",
      "Le dîner (même source) : 45 % des chambres dînent à la Table d'Augustin, à deux couverts de 42 €, avec 65 % de marge : 0,45 × 2 × 42 × 0,65 = 24,57 € par nuitée. Une nuitée individuelle vaut donc 184,25 + 24,57 = 208,82 €.",
      "Valeur des clients évincés : 143 × 208,82 ≈ 29 862 €, soit 29,9 k€. Le chiffre ne dépend pas du hasard : il est calculé sur la prévision ; l'épisode le juge juste à 1,5 k€ près, proche à 4 k€.",
      "Pour comparer : du 26 au 28 mai, la prévision n'attend que 30, 34 et 31 chambres individuelles, à 178 € : le même bloc n'en évince que 19, 23 et 20, sur des nuitées qui valent moins.",
    ],
    erreurs: [
      {
        valeur: 26.3,
        cause:
          "Les dîners oubliés (143 × 184,25) : les clients individuels évincés auraient dîné à la Table d'Augustin, ceux du séminaire dînent en salle.",
      },
      {
        valeur: 33.2,
        cause:
          "Le chiffre d'affaires des chambres pris pour leur valeur (143 × 232) : ni la commission, ni le coût variable, ni le dîner ne sont comptés.",
      },
      {
        valeur: 34.5,
        cause:
          "Toutes les chambres du bloc comptées comme évincées (55 × 3 = 165 nuitées × 208,82) : la prévision laissait 8, 5 et 9 chambres vides chaque nuit.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "55 chambres trois nuits, l'hôtel est plein, la directrice dit qu'un séminaire comme celui-là ne se refuse pas, et le Palais Ombrelle attend.",
      ceQuiLeDejoue:
        "La prévision d'Hostéo attend 58 à 61 clients individuels ces nuits-là, à 232 € : le séminaire en évince 143 nuitées, environ 29,9 k€ de marge dîners compris. Hyacinthe Baud le dit : un groupe se juge à ce qu'il laisse une fois payés les clients qu'il chasse. La source sur l'an dernier rappelle qu'Orvandel a tenu son séminaire fin mai, à L'Escale Lac : ses dates ne sont pas gravées dans le marbre. Rejouée sur les trente tirages à la place de la contre-proposition, l'acceptation de juin perd 11,2 k€ en moyenne, et ne fait mieux que 5 fois.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "C'est ce que signent tous les hôtels de l'agence, et la directrice ne veut pas perdre Lacustra pour une clause.",
      ceQuiLeDejoue:
        "La source « Chiffrer ce que chaque clause protège » : un séminaire occupe 78 % de son bloc, une chambre rendue à J-7 ne se revend qu'une fois sur cinq, à J-21 85 fois sur 100. Sans clause, une douzaine de chambres vides par nuit ne rapportent rien. Cosima Marmier elle-même a signé une date limite à J-21 et une attrition à 10 % au Lac l'an dernier. Rejoué sur les trente tirages à la place des trois clauses, le contrat type perd 2,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "145 € la chambre en juillet, c'est 113 € sous le prix moyen, et la directrice ne veut pas brader juillet.",
      ceQuiLeDejoue:
        "La source « Chiffrer la convention ligne par ligne » : les 30 chambres évincent 17 k€ de marge, mais elles rapportent 10 k€, la salle plénière garde 90 % de ses 2 800 € par jour, les pauses et déjeuners 60 %, et le gala de 140 couverts à 89 € garde 63 % de son prix, six extras à 190 € déduits. Jordi Puigvert chiffre la Table fermée à 2 k€. Le prix chambre n'est qu'une ligne du groupe. Rejoué sur les trente tirages à la place de la convention entière, le refus perd 7,3 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Cinq cents nuitées garanties avec un client fiable, quand le pick-up est en retard : la directrice préfère les avoir dans la poche.",
      ceQuiLeDejoue:
        "Lucile chiffre la série selon l'été : +18 k€ s'il est mou, −7 k€ s'il est conforme, −15 k€ s'il est fort, avec trois, quatre et trois chances sur dix. Son analyse, deux jours et 600 €, voit une vraie baisse neuf fois sur dix, et Tavenne ne part qu'une fois sur dix. Signer tout de suite est l'option la plus sûre, pas la meilleure : rejouée sur les trente tirages à la place de l'analyse, elle perd 6,6 k€ en moyenne, et fait mieux 13 fois, dans les étés mous ; sous le tirage n° 12, l'été est fort, et elle perd 10,7 k€.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Le contrat est signé : ce sont les chambres de Mélizane, et la directrice ne veut pas qu'on y touche.",
      ceQuiLeDejoue:
        "La source « Mesurer ce que rapportent les chambres rendues » : reprise à J-17, une chambre de juillet se revend 85 fois sur 100 et rapporte 233 € de marge ; à J-7, une fois sur cinq. L'attrition fait payer 116 € par nuit, mais la chambre reste vide. Léonie Combaz refuse déjà des clients ces nuits-là, et Tsiory Rakotobe confirme que les chiffres ne bougeront plus. Rejoué sur les trente tirages à la place de la reprise immédiate, tenir le bloc perd 3,8 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Une grille unique à 150 € est simple, lisible, et l'équipe commerciale a calculé qu'elle fait gagner quelques points d'occupation.",
      ceQuiLeDejoue:
        "La source « Calculer le prix de déplacement de chaque demande » : le comité genevois couvre son déplacement dès 31 €, les golfeurs dès 81 €, le club dès 97 €, mais la chorale demande 221 € et l'entreprise lyonnaise 199 €. À 150 € pour tous, ces deux-là coûtent plus qu'ils ne rapportent. L'équipe a fait son calcul sur l'occupation, pas sur la contribution. Rejouée sur les trente tirages à la place de la cotation demande par demande, la grille unique perd 9,5 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu un hôtel à remplir, d'autres un prix trop bas. Qu'est-ce que la prévision d'Hostéo montrait sur les nuits du 16 au 18 juin ? Pourquoi les deux lectures passaient-elles à côté ?",
    "Une nuitée individuelle vaut 208,82 € une fois la commission, le coût variable et le dîner comptés. Pourquoi faut-il compter le dîner, et pourquoi ceux du séminaire ne le remplacent-ils pas à la Table d'Augustin ?",
    "Le même séminaire, au même prix, vaut peu en juin et beaucoup fin mai. Comment l'expliquer en une phrase ? Qu'est-ce que le prix de 228 € en juin devait couvrir ?",
    "Mélizane paie 145 € la chambre en juillet et rapporte pourtant plus que les individuels qu'elle chasse. Quelles lignes pèsent le plus ? Que serait-elle devenue sans le gala ?",
    "Une chambre rendue à J-21 se revend 85 fois sur 100, à J-7 une fois sur cinq. Que protègent la date limite de libération, la clause d'attrition et l'acompte, et pourquoi la garantie totale fait-elle fuir des clients ?",
    "Sous le tirage n° 12, l'été est fort, et ceux qui ont refusé Tavenne d'emblée font aussi bien que ceux qui ont attendu l'analyse de Lucile, sans payer 600 €. Était-ce une meilleure décision ? Que se passe-t-il dans un été mou ?",
    "Quelle règle laissez-vous à Zuzana Holub pour coter les groupes de la saison prochaine ? Formulez-la en une phrase, avec le mot « déplacement » dedans.",
  ],
  prolongement: {
    enonce:
      "Un hôtel de 50 chambres attend 46 clients individuels chacune de deux nuits, à 200 € la chambre. 40 % des nuitées passent par une plateforme qui prend 15 % ; une nuitée occupée coûte 25 € ; la moitié des chambres dînent au restaurant, à deux couverts de 40 €, avec 60 % de marge. Un groupe demande 30 chambres ces deux nuits à 120 € net, une journée de salle à 1 500 € (90 % de marge) et ses 30 participants dînent en salle les deux soirs à 35 € (60 % de marge). 1) Combien de nuitées individuelles le groupe évince-t-il ? 2) Que vaut une nuitée individuelle, et que valent les nuitées évincées ? 3) Quelle est la contribution du groupe, et sa contribution nette du déplacement ? 4) À quel prix chambre le groupe couvrirait-il exactement son déplacement ?",
    corrige:
      "1) Il reste 50 − 30 = 20 chambres pour les individuels : le groupe en évince 46 − 20 = 26 par nuit, soit 52 nuitées. 2) Commission moyenne : 200 × 0,40 × 0,15 = 12 € ; dîner : 0,5 × 2 × 40 × 0,6 = 24 € ; une nuitée vaut 200 − 12 − 25 + 24 = 187 €, et les nuitées évincées 52 × 187 = 9 724 €. 3) Chambres : 60 × (120 − 25) = 5 700 € ; salle : 1 500 × 0,9 = 1 350 € ; dîners : 30 × 2 × 35 × 0,6 = 1 260 € ; contribution 8 310 €, contribution nette 8 310 − 9 724 = −1 414 €. 4) 60 × (p − 25) + 1 350 + 1 260 = 9 724, soit 60 × p = 8 614 et p ≈ 143,57 € : le groupe couvre son déplacement à partir d'environ 144 € la chambre.",
  },
  evaluation: [
    "La valeur des clients évincés est calculée juste, nuit par nuit, avec la commission moyenne, le coût variable et le dîner.",
    "Chaque groupe est jugé sur sa contribution nette du déplacement, toutes lignes comprises (chambres, salles, restauration), et non sur son prix chambre ni sur l'occupation.",
    "Les conditions de vente retenues sont justifiées par l'attrition et la revente des chambres rendues, avec les chiffres de la source.",
    "La réponse à Tavenne est argumentée comme un arbitrage selon le scénario de l'été et la valeur de l'information de Lucile.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "Les clauses de date limite de libération, d'attrition et d'acompte sont présentées par l'épisode comme des usages des contrats de groupe ; leur rédaction et leur portée relèvent du contrat et du droit de la consommation ou du commerce selon le client : à présenter comme des pratiques, pas comme des règles.",
};
