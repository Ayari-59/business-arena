/**
 * FICHE ENSEIGNANT · ÉPISODE 2, L'AGENCE QUI DÉMARRE.
 *
 * Construire une clientèle par le service plutôt que par le prix : une
 * promotion remplit le magasin de chasseurs de prix qui repartent, et donne
 * la remise aux artisans qui seraient venus sans elle ; attendre ne vaut pas
 * mieux.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "agence-qui-demarre",
  formations: ["bts-mco", "bac-pro-mcv", "but-tc"],
  programme: [
    "BTS MCO · Bloc 2, Animer et dynamiser l'offre commerciale",
    "BTS MCO · Bloc 1, Développer la relation client et assurer la vente conseil",
    "Bac pro MCV · Bloc 3, Fidéliser la clientèle et développer la relation client",
  ],
  notion:
    "Un client professionnel ne change pas de fournisseur pour un prix : il change pour un service qui lui manque. L'erreur classique, devant un magasin qui ne décolle pas, consiste à acheter de la fréquentation par la promotion : le chiffre d'affaires monte, le taux de marge s'effondre, et les clients venus pour la remise repartent avec elle ; l'erreur symétrique consiste à attendre qu'une clientèle vienne d'elle-même. Dans l'épisode, Manon Pellerin dirige l'agence Arvel Distribution de Bourgoin-Jallieu, ouverte depuis un mois : 24,2 k€ de chiffre d'affaires la semaine dernière pour 30 k€ au plan, 6,3 k€ de marge brute pour un point mort à 11 k€. Les tickets montrent que les 22 artisans réguliers font 74 % de la marge ; huit artisans sur dix achètent chez Rivoire Matériaux, pour l'ouverture à 6 h 30 (neuf sur dix), la livraison sur chantier (sept sur dix), et le prix n'arrive qu'en quatrième position ; l'agence est déjà 0,9 % moins chère. L'élève découvre qu'une remise de 15 % fait tomber le taux de marge de 27 % à environ 14 %, que la promotion fait le plus gros chiffre d'affaires du trimestre et la plus petite contribution, et que les artisans bien servis en amènent d'autres.",
  objectifs: [
    "Je cherche pourquoi les clients visés achètent ailleurs avant de choisir une action commerciale.",
    "Je calcule le taux de marge qui reste après une remise, et le volume qu'il faudrait pour garder la même marge.",
    "Je distingue le chiffre d'affaires de la contribution : ce qui reste une fois payés la remise, l'acquisition des clients et le stock.",
    "Je négocie avec un gros client des conditions de professionnel (remise, délai, encours plafonné) au lieu d'accepter ou de refuser en bloc.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de chiffre d'affaires, de marge brute, de taux de marge et de point mort doivent être connues ; le calcul d'un pourcentage suffit. Le coût d'une remise sur le taux de marge, la fidélisation et le bouche-à-oreille peuvent être découverts pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/agence-qui-demarre?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous demandez de noter sur papier, avant de valider la semaine 1, le chiffre d'affaires prévu pour la semaine 3, le calcul qui y mène, et le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans donner de piste, et vous relevez deux choses : les sources ouvertes en semaine 1 (les tickets et les dix artisans ont-ils été consultés ?) et la réponse à Morel Bâtiment en semaine 7. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 1.",
    },
    {
      minutes: 15,
      titre: "Correction de la prévision de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées. Vous décomposez avec la classe le chiffre d'affaires d'une semaine : les 22 artisans réguliers, les particuliers et les passages, les derniers clients du flyer d'ouverture. Vous faites constater qu'aucune bonne décision ne change beaucoup la semaine 3 : 24,6 k€ sous le tirage de la classe. Vous faites expliquer les valeurs éloignées : 32 k€ (le plan), 42,3 k€ (le point mort), 17,9 k€ (la part de la marge prise pour une part du chiffre d'affaires).",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1 (promotion, horaires et livraison, courrier, attente), de la semaine 7 (Morel) et de la semaine 9 (parrainage, troisième tournée, portes ouvertes). Pour la promotion, vous faites calculer au tableau le taux de marge à −15 % ; pour Morel, la marge à −12 % (17 %) et l'impayé possible, comparés aux conditions de professionnel que conseillait le service crédit.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer. Sous le tirage n° 12, « Connaître ses clients, puis les servir » finit 5,2 k€ au-dessus du plan avec 54 artisans réguliers, « Casser les prix » 31,9 k€ en dessous avec 23, et l'attente 28,4 k€ en dessous avec 20. Vous faites remarquer que « Casser les prix » fait le plus gros chiffre d'affaires du trimestre (595 k€ contre 471 k€). Vous montrez ensuite les décisions où le hasard compte : Morel fragile ou non, et la force du bouche-à-oreille, faible sous ce tirage.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : demander aux clients visés pourquoi ils achètent ailleurs, leur donner ce qui leur manque, puis faire parler ceux qui sont bien servis. Vous la complétez par deux calculs : le taux de marge après remise, et le volume qu'il faudrait pour compenser. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 24.6,
    etapes: [
      "Point de départ (alerte du tableau de bord) : 24,2 k€ de chiffre d'affaires la semaine dernière, 6,3 k€ de marge brute, soit un taux d'environ 26 %. Les tickets du premier mois : 22 artisans réguliers qui font 74 % de la marge, des particuliers et des clients du flyer d'ouverture qui ne reviennent pas.",
      "Ce que la bonne décision change en trois semaines : l'ouverture à 6 h 30 et la livraison sur chantier démarrent en semaine 2 ; les artisans réguliers achètent un peu plus (environ 8 % par semaine dans le modèle), mais de nouveaux artisans ne viennent qu'au fil des semaines, et le bouche-à-oreille met trois semaines à jouer. En semaine 3, l'agence a toujours 22 artisans réguliers.",
      "Décomposition du modèle en semaine 3, sous le tirage n° 12 : environ 19,3 k€ d'achats des 22 artisans réguliers (un panier d'environ 850 €, une semaine un peu calme), 4,9 k€ de particuliers et de passages, 0,4 k€ des derniers clients du flyer. Total : 24,6 k€ (24,60).",
      "Le chiffre dépend un peu du hasard (de 20,5 à 30,5 k€ selon les trente tirages, 25,1 k€ en moyenne) et des décisions : sous le tirage de la classe, 22,6 k€ pour qui attend, 23,3 k€ pour qui écrit aux artisans, 34,2 k€ pour qui lance la promotion, mais avec 5,1 k€ de marge au lieu de 6,8 k€. L'épisode juge juste à 2 k€ près, proche à 5.",
    ],
    erreurs: [
      {
        valeur: 32,
        cause:
          "Le plan d'affaires pris pour une prévision : il prévoit 30 k€ en semaine 1 et 1 k€ de plus chaque semaine, soit 32 k€ en semaine 3. C'est un objectif, et l'agence en est loin.",
      },
      {
        valeur: 42.3,
        cause:
          "Le chiffre d'affaires du point mort : 11 k€ de marge à couvrir, divisés par un taux d'environ 26 % (6,3 / 24,2). C'est ce qu'il faudrait atteindre, pas ce qui arrivera en trois semaines.",
      },
      {
        valeur: 17.9,
        cause:
          "Les 74 % des artisans réguliers appliqués au chiffre d'affaires (0,74 × 24,2) : c'est leur part de la marge, et les particuliers et les passages font aussi du chiffre.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Gérald Perrin dit qu'une promotion d'envergure se finance, et le magasin se remplit dès la semaine 2 : c'est le moyen le plus visible d'aller vers le point mort.",
      ceQuiLeDejoue:
        "Les dix artisans interrogés mettent le prix en quatrième position, derrière l'ouverture à 6 h 30 (neuf sur dix) et la livraison sur chantier (sept sur dix), et le relevé de cinquante références montre l'agence 0,9 % moins chère que Rivoire. À −15 %, le taux de marge tombe de 27 % à environ 14 %, et la remise va aussi aux 22 artisans qui venaient déjà ; Kevin voit des particuliers faire la queue et deux plombiers attendre vingt minutes. Martine Ferrand l'avait dit : « j'ai perdu six mois en promotions ». Rejouée sur les trente tirages à la place des horaires et de la livraison, la promotion perd 19,5 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi:
        "Les artisans comparent les prix de trente références : les afficher presque au prix coûtant et prévenir par SMS les fera venir, pour 600 €.",
      ceQuiLeDejoue:
        "Le croisement de la liste montre 52 plombiers-chauffagistes et électriciens qui achètent plusieurs fois par semaine et se plaignent des ruptures de Rivoire sur le sanitaire : c'est eux qu'il faut aller voir. Les prix d'appel retirent des points de marge aux artisans qui venaient déjà, et Kevin le constate : des clients jamais vus viennent pour les trente références « et repartent sans rien d'autre ». Rejoués sur les trente tirages à la place de la tournée ciblée, ils perdent 20,2 k€ en moyenne et ne font jamais mieux.",
    },
    {
      decision: 2,
      option: 1,
      pourquoi:
        "Solder les références dormantes à −35 % fait de la trésorerie tout de suite, et vide les allées que personne ne regarde.",
      ceQuiLeDejoue:
        "L'analyse par famille donne la sortie : la plateforme régionale reprend les références dormantes pour 3 000 € de transport, sans rien brader, et renforcer plomberie, électricité et fixations (58 % des ventes pour 22 % du stock, une rupture une semaine sur trois) sert les artisans. Le déstockage attire surtout des particuliers et des revendeurs : « le carrelage part, la marge avec ». Rejoué sur les trente tirages à la place de l'assortiment ajusté, il perd 9,4 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "6 000 € d'achats par semaine, c'est « la moitié du chemin vers le point mort », dit Gérald Perrin : on ne laisse pas filer un tel client.",
      ceQuiLeDejoue:
        "Le service crédit le dit : à −12 %, la marge sur ses achats tombe à 17 % ; Morel a eu deux retards de paiement signalés cette année, et l'on conseille 30 jours et un encours plafonné à 8 000 €. Accepter 60 jours sans plafond expose, si l'entreprise est fragile, à perdre l'essentiel de quatre semaines d'achats, et les conditions de Morel se savent chez les autres artisans. Rejoué sur les trente tirages à la place des conditions de professionnel, tout accepter perd 6,2 k€ en moyenne et fait mieux 7 fois sur 30.",
    },
    {
      decision: 4,
      option: 2,
      pourquoi:
        "Un mois avant le comité, un samedi festif à −20 % fait venir du monde et montre une agence vivante.",
      ceQuiLeDejoue:
        "La source sur l'origine des artisans réguliers montre que, quand le service est là, un sur trois est venu parce qu'un confrère lui en a parlé : c'est ce canal qu'il faut nourrir. Kevin le constate après la journée : quatre cents personnes, « le buffet vidé à 10 heures. Lundi matin, le magasin était vide. » Rejouée sur les trente tirages à la place du parrainage, la journée portes ouvertes perd 10,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Gérald Perrin rappelle que le comité regardera le chiffre d'affaires de fin de trimestre : une dernière promotion de −10 % se monte vite.",
      ceQuiLeDejoue:
        "La liste des artisans qui ne viennent plus montre qu'aucun n'a été rappelé, et que Kevin connaît la raison pour la moitié d'entre eux : une livraison ratée, une rupture, un devis sans réponse. La promotion donne 10 % à tous, et la contrôleuse de gestion le note : le chiffre d'affaires monte, le taux de marge descend. Rejouée sur les trente tirages à la place des rappels, elle perd 11,2 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 3,
      pourquoi:
        "Une agence met un an à trouver sa clientèle, et cette option ne coûte rien : un mois, c'est court.",
      ceQuiLeDejoue:
        "Les tickets montrent que les clients du flyer ne reviennent pas, et que personne ne vient avant 8 h parce que les artisans sont déjà sur leurs chantiers. Les artisans interrogés disent ce qui leur manque : l'ouverture à 6 h 30 et la livraison dans la journée, 900 € par semaine. Gérald Perrin prévient : « le comité, lui, attendra un plan ». Rejouée sur les trente tirages à la place des horaires et de la livraison, l'attente perd 18 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 3,
      pourquoi:
        "Le comptoir a besoin de monde à l'heure où les artisans chargent : garder Bastien au comptoir renforce le service, sans frais de route.",
      ceQuiLeDejoue:
        "L'accompagnement de Bastien chez trois artisans le montre : un artisan vu une fois oublie, vu tous les quinze jours finit par essayer. Deux matinées par semaine chez les plombiers et les électriciens coûtent 250 € et laissent Bastien au comptoir le reste du temps ; Rivoire, lui, a deux commerciaux sur la route. Rejoué sur les trente tirages à la place de la tournée ciblée, garder Bastien au comptoir perd 15,9 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 3,
      pourquoi:
        "Le stock a été dimensionné pour une agence mature : quand la clientèle viendra, on en aura besoin, et le garder ne coûte rien de visible.",
      ceQuiLeDejoue:
        "Anne-Sophie Brunet chiffre ce que coûte le stock dormant : environ 1 500 € par semaine de frais financiers, de casse et de démarque. Samia est en rupture de raccords cuivre deux jours sur cinq pendant que trois allées de carrelage haut de gamme ne se vendent pas : 41 % du stock pour 6 % des ventes. Rejoué sur les trente tirages à la place de l'assortiment ajusté, garder le stock perd 6,8 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 3,
      pourquoi:
        "Ce qui est lancé marche : les horaires et la tournée amènent des artisans, il suffit de laisser faire.",
      ceQuiLeDejoue:
        "Julien Caron demande lui-même ce qu'on peut faire pour son beau-frère plaquiste : les artisans bien servis sont prêts à en amener d'autres, à condition qu'on leur en donne l'occasion. Le parrainage coûte 1 500 € pour lancer, puis 60 € par filleul. Rejoué sur les trente tirages à la place du parrainage, continuer comme avant perd 4,3 k€ en moyenne et ne fait mieux que 2 fois.",
    },
    {
      decision: 5,
      option: 2,
      pourquoi:
        "Le trimestre est presque fini, ce qui devait marcher a marché : il n'y a plus rien à décider.",
      ceQuiLeDejoue:
        "La source « Lister les artisans qui ne viennent plus » donne une liste d'artisans perdus en cours de trimestre, dont la moitié pour une raison connue et réparable, et aucun n'a été rappelé. Un appel et une visite coûtent 400 €, et Kevin le constate chez ceux qui l'ont fait : « ils reviennent, avec des commandes en retard ». Rejoué sur les trente tirages à la place des rappels, ne rien changer perd 3,9 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu un problème de prix, d'autres un problème de notoriété, d'autres un problème de service. Quelle source permettait de trancher ? Que disait Julien Caron de Rivoire ?",
    "À −15 %, que reste-t-il de 100 € de ventes à 27 % de marge ? Combien de ventes en plus faudrait-il pour garder la même marge, sachant que la remise va aussi aux artisans qui venaient déjà ?",
    "« Casser les prix » fait 595 k€ de chiffre d'affaires sur le trimestre, la bonne méthode 471 k€, et pourtant la première finit 37 k€ derrière la seconde. Où passe la différence ? Que regarderait un comité qui ne lit que le chiffre d'affaires ?",
    "Morel demandait −12 % et 60 jours ; le service crédit conseillait 30 jours et un encours plafonné à 8 000 €. Sous le tirage n° 12, Morel n'était pas fragile et a accepté les conditions de professionnel. Sur les trente tirages, tout accepter fait pourtant mieux 7 fois. Que protège l'encours plafonné, et contre quoi ?",
    "Sous le tirage n° 12, le bouche-à-oreille était faible ce trimestre, et le parrainage a quand même fait un peu mieux que la troisième tournée (0,7 k€). Sur les trente tirages, la tournée fait mieux 7 fois. Le choix du parrainage était-il un pari ? Qu'est-ce qui distingue la qualité d'une décision de son résultat ?",
    "Pourquoi un artisan perdu pour une livraison ratée se récupère-t-il pour 400 €, quand un nouvel artisan coûte une tournée de plusieurs semaines ?",
    "Quelle règle gardez-vous pour faire démarrer une clientèle de professionnels ? Formulez-la en une phrase, avec un chiffre dedans.",
  ],
  prolongement: {
    enonce:
      "Un négoce vend à 27 % de taux de marge : sur 100 € de prix de vente, la marchandise coûte 73 €. 1) Une remise de 15 % ramène le prix à 85 € : quel est le nouveau taux de marge ? 2) Combien de fois plus de ventes faut-il pour garder la même marge en euros ? 3) Un gros client achète 6 000 € par semaine et demande −12 % : quel taux de marge reste-t-il, et quelle marge par semaine ? 4) À des conditions de professionnel, il achèterait 4 500 € par semaine à −4 %, et la livraison sur chantier coûterait 1 point de marge : quelle marge par semaine ? 5) Une chance sur trois environ, ce client fait défaut et l'on perd 85 % de ce qu'il doit. Combien perd-on s'il doit quatre semaines d'achats à 6 000 € ? Et si l'encours est plafonné à 8 000 € ?",
    corrige:
      "1) (85 − 73) / 85 ≈ 14,1 %. 2) La marge passe de 27 € à 12 € pour 100 € de prix d'origine : il faut 27 / 12 = 2,25 fois plus de ventes, soit 125 % de plus. 3) Prix de 88 € pour 100 €, marge de 15 € : 15 / 88 ≈ 17,0 % ; 6 000 × 15 / 88 ≈ 1 023 € par semaine. 4) (96 − 73) / 96 ≈ 24,0 %, moins 1 point : 23,0 % ; 4 500 × 0,23 ≈ 1 033 € par semaine, autant qu'avec ses conditions, pour un chiffre d'affaires plus petit. 5) 4 × 6 000 × 0,85 = 20 400 € perdus, soit une vingtaine de semaines de la marge qu'il rapporte ; avec un encours plafonné, la perte ne dépasse pas 8 000 × 0,85 = 6 800 €.",
  },
  evaluation: [
    "Le diagnostic de la semaine 1 s'appuie sur les tickets et sur les artisans interrogés, et l'élève dit pourquoi le relevé de prix écarte la piste du prix.",
    "La prévision du chiffre d'affaires de la semaine 3 est construite par une décomposition écrite (artisans réguliers, passages, clients du flyer), et l'écart avec 24,6 k€ est expliqué.",
    "Chaque remise envisagée est traduite en taux de marge restant et en volume nécessaire pour compenser, et le chiffre d'affaires n'est jamais pris pour la contribution.",
    "La réponse à Morel Bâtiment est justifiée par l'analyse du service crédit : la marge à −12 %, le risque d'impayé, l'encours plafonné.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "Le corrigé de 24,6 k€ est celui du modèle sous le tirage n° 12 : le panier d'environ 850 € par artisan et la part des passages ne figurent pas tels quels dans les sources, et l'élève ne peut que les estimer à partir des 24,2 k€ de la semaine précédente. Le risque d'impayé de Morel et le plafond d'encours sont des conventions de l'épisode ; le délai de paiement de 60 jours demandé par Morel est à rapprocher des plafonds légaux des délais de paiement entre professionnels, que l'épisode ne discute pas.",
};
