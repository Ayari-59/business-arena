/**
 * FICHE ENSEIGNANT · ÉPISODE 34, LE SEUIL QUI BOUGE.
 *
 * Seuil de rentabilité, marge de sécurité et levier opérationnel, face à une
 * demande incertaine : chaque charge variable transformée en charge fixe est
 * moins chère au volume du plan, et plus dangereuse dans le scénario bas.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "seuil-qui-bouge",
  formations: ["bts-cg", "dcg", "but-gea"],
  programme: [
    "BTS CG · Processus 5, Analyse et prévision de l'activité",
    "DCG · UE 11, Contrôle de gestion",
    "BUT GEA · Contrôle de gestion",
  ],
  notion:
    "Le seuil de rentabilité n'est pas une donnée de l'entreprise : il dépend de sa structure de coûts, et chaque décision le déplace. L'erreur classique consiste à choisir la structure la moins chère au volume du plan d'affaires, en transformant des charges variables en charges fixes (salariés à la place de l'intérim, loyer fixe à la place d'un loyer indexé, matériel en crédit-bail à la place de la location), sans regarder ce qu'elle coûte si le volume n'arrive pas ; la seconde consiste à baisser les prix pour « passer le seuil », alors qu'avec un taux de marge sur coût variable de 20 % une baisse de 5 % retire le quart de la marge et fait monter le seuil. Le drive matériaux de l'épisode tourne à 254 retraits par semaine pour un plan à 300, avec une marge de sécurité de 13 % et un levier opérationnel proche de 8 : la direction régionale pousse vers la structure du plan, et la demande peut monter, plafonner ou décrocher. L'élève découvre que la meilleure structure en moyenne garde un socle fixe que le volume probable remplit, que la plus sûre est toute variable et ne coûte que peu de plus, et qu'un volume en plus se juge à sa marge sur coût variable, non à son coût complet.",
  objectifs: [
    "Je sépare les charges d'un compte de résultat en charges variables et charges fixes, et j'en tire la marge sur coût variable et son taux.",
    "Je calcule un seuil de rentabilité en chiffre d'affaires et en volume, une marge de sécurité et un levier opérationnel.",
    "Je mesure ce qu'une charge fixe ajoutée ou une baisse de prix fait au seuil et au résultat dans le scénario de demande le plus bas.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un aléa donné.",
  ],
  prerequis:
    "La distinction entre charges variables et charges fixes, la marge sur coût variable et le calcul du seuil de rentabilité doivent avoir été vus en cours ; la marge de sécurité et le levier opérationnel peuvent être introduits pendant la séance.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/seuil-qui-bouge?hasard=12 : toute la classe joue le même trimestre, sous le même aléa. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, le calcul du seuil de rentabilité mensuel, et le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez sur une feuille deux choses : la prévision de seuil saisie en semaine 1, et la réponse à Bâtir Nord-Isère en semaine 8, la décision où la classe se partage le plus souvent. Un binôme qui a fini tôt calcule le seuil de chacun des trois loyers de la semaine 2.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées, de la plus basse à la plus haute, puis vous reconstruisez le calcul avec la classe à partir du compte du premier mois : ventilation des charges, marge sur coût variable, taux, seuil en euros et en retraits. Vous faites expliquer d'où viennent les valeurs éloignées de 240 k€. Vous terminez par la marge de sécurité (35 k€, 12,7 %) et le levier (7,9) : une baisse de 10 % du chiffre d'affaires emporte près de 80 % du résultat.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix sur le bail (semaine 2), la réponse à Brenaz (semaine 4) et le contrat de Bâtir Nord-Isère (semaine 8). Pour le bail, vous faites calculer au tableau les trois seuils avec les chiffres d'Inaya ; pour Bâtir, la marge sur coût variable d'un retrait à −8 % et à −4 %. Les élèves qui ont refusé Bâtir défendent leur raisonnement en coût complet, et la classe le confronte au calcul marginal.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer, et vous lisez avec la classe le rejeu de chaque décision sous trente aléas. Vous prévenez : le résultat de cet épisode est très bruité, la trajectoire de la demande pèse plus que toutes les décisions réunies, et presque personne ne tient le budget de 31,5 k€. C'est le moment de séparer la qualité d'une décision de son résultat, en partant de la contre-proposition à −4 %.",
    },
    {
      minutes: 10,
      titre: "Synthèse",
      detail:
        "Vous écrivez les trois formules (seuil, marge de sécurité, levier opérationnel) et la règle qui les relie : chaque charge fixe ajoutée rapproche le seuil du chiffre d'affaires et élève le levier. Vous rappelez que fixer une charge n'est pas une faute en soi : le chariot en crédit-bail, rentable dès 440 retraits par mois, l'est encore dans le scénario bas. La consigne qui reste : refaire son compte à 40 % sous le rythme actuel avant d'engager une charge fixe.",
    },
  ],
  calcul: {
    reponse: 240,
    etapes: [
      "Charges variables du premier mois (source « Reprendre le compte de résultat du premier mois, charges fixes et variables séparées ») : achats des marchandises vendues 203 500 € + préparation par l'intérim au coup par coup 11 000 € + chariot loué à l'heure 2 750 € + encaissement, film et palettes perdues 2 750 € = 220 000 €, soit 200 € par retrait.",
      "Marge sur coût variable : 275 000 − 220 000 = 55 000 €, soit 50 € par retrait ; taux de marge sur coût variable : 55 000 / 275 000 = 20 %.",
      "Charges fixes du mois : convention d'occupation précaire 16 000 € + salaires de l'équipe permanente 21 000 € + énergie, informatique et assurances 4 500 € + amortissements 6 500 € = 48 000 €. Contrôle : 55 000 − 48 000 = 7 000 €, le résultat du compte.",
      "Seuil de rentabilité mensuel : charges fixes / taux de marge sur coût variable = 48 000 / 0,20 = 240 000 € de chiffre d'affaires, soit 240 k€ ; en volume, 48 000 / 50 = 960 retraits par mois, environ 222 par semaine. Le calcul ne dépend pas des aléas.",
      "Pour la suite : marge de sécurité = 275 000 − 240 000 = 35 000 €, soit un indice de sécurité de 12,7 % ; levier opérationnel = 55 000 / 7 000 ≈ 7,9.",
    ],
    erreurs: [
      {
        valeur: 228.6,
        cause:
          "Les frais d'encaissement, de film et de palettes (2 750 €) sont oubliés : le taux de marge sur coût variable monte à 21 %, et 48 000 / 0,21 donne 228,6 k€.",
      },
      {
        valeur: 248.1,
        cause:
          "L'intérim, le chariot et l'encaissement (16 500 €) sont classés en charges fixes parce qu'ils sont payés chaque mois : charges fixes de 64 500 € pour un taux de 26 % (le taux de marque), soit 248,1 k€.",
      },
      {
        valeur: 184.6,
        cause:
          "Seuls les achats sont retenus comme charges variables, et les 16 500 € d'intérim, de chariot et d'encaissement disparaissent du calcul : 48 000 / 0,26 = 184,6 k€.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Un CDI revient à 6,92 € le retrait contre 10 € en intérim : c'est le plan, et c'est moins cher.",
      ceQuiLeDejoue:
        "Les 6,92 € supposent 100 retraits par semaine et par préparateur, donc le volume du plan : au rythme du premier mois (1 100 retraits), les 9 000 € reviennent à 8,18 € le retrait, et à 13,64 € dans le mois à 40 % de moins que conseille Clotilde Abeillon (660 retraits), quand le contrat-cadre reste à 8 €.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Au volume du plan, le loyer fixe coûte 13 000 € contre 13 100 € pour le binaire et 15 600 € pour le variable : c'est le moins cher.",
      ceQuiLeDejoue:
        "À 660 retraits, le fixe reste à 13 000 € quand le binaire tombe à 9 900 € et le variable à 7 920 € (« Calculer les trois loyers à plusieurs volumes »). Avec les chiffres d'Inaya, le seuil vaut 225 k€ avec le fixe (45 000 / 20 %), 214,4 k€ avec le binaire (38 600 / 18 %) et 210,5 k€ avec le variable (32 000 / 15,2 %).",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "S'aligner sur tous les prix garde les artisans, et c'est le volume qui éloigne du seuil.",
      ceQuiLeDejoue:
        "À −5 %, le panier passe à 237,50 € pour 200 € de coût variable : la marge d'un retrait tombe de 50 à 37,50 €, il faudrait un tiers de retraits en plus pour la retrouver, et Chambéry n'en a gagné que 2 %. Avec la structure de départ, le seuil passe de 240 à 304 k€, et l'alignement sur les trente références comparées (20 % du chiffre d'affaires) limitait les départs à 2 %.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Au volume cible, deux chariots en crédit-bail coûtent moins que la location à l'heure, et le second quai supprime la file.",
      ceQuiLeDejoue:
        "Un chariot en crédit-bail est rentable dès 440 retraits par mois : le premier l'est même dans le scénario bas. Le second ne sert qu'au-delà d'environ 200 retraits par semaine ; à 254, il ne charge qu'environ 230 retraits par mois, soit moins de 600 € à l'heure, contre 1 100 € de crédit-bail et 2 000 € de travaux pour une capacité de 420 retraits que la demande n'atteint pas.",
    },
    {
      decision: 4,
      option: 2,
      pourquoi:
        "À −8 %, ces retraits ne couvrent pas leur part des charges fixes : on vendrait sous le coût de revient complet.",
      ceQuiLeDejoue:
        "Un retrait de Bâtir rapporte 276 € pour 222 € d'achats, 2,50 € d'encaissement et le seul coût variable que la structure fait payer en plus : il laisse de 35,48 € (intérim en contrat-cadre, chariot à l'heure, loyer binaire) à 51,50 € (trois CDI, deux chariots, loyer fixe) de marge sur coût variable, soit 1,4 à 2,1 k€ par semaine pour quarante retraits. Les charges fixes sont payées que Bâtir vienne ou non.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi: "La fin d'année sera creuse : une remise de 8 % fera venir du monde et du volume.",
      ceQuiLeDejoue:
        "La remise retire 20 € à chaque retrait, habitués compris, sur 50 € de marge sur coût variable : pour 100 retraits qui rapportaient 5 000 €, les 110 que promet l'expérience de Villefranche ne rapportent plus que 3 300 €.",
    },
    {
      decision: 5,
      option: 1,
      pourquoi:
        "À 45 % d'une semaine normale, la semaine de Noël est sous le seuil : la fermer évite de perdre de l'argent.",
      ceQuiLeDejoue:
        "Le loyer, les salaires et les amortissements courent que le drive ouvre ou non : fermer n'évite que 2 000 €, alors qu'une semaine à 45 %, c'est encore plus d'une centaine de retraits et environ 5 k€ de marge sur coût variable. Ouvrir le matin seulement évite 1 500 € et garde neuf retraits sur dix.",
    },
  ],
  debrief: [
    "En semaine 1, certains ont vu un problème de volume, d'autres un problème de structure. Lequel des deux Rachid pouvait-il décider ? Que reste-t-il à faire quand le volume ne se commande pas ?",
    "Le loyer fixe est le moins cher au volume du plan et donne pourtant le seuil le plus haut des trois. Comment un loyer indexé peut-il baisser le seuil alors qu'il réduit le taux de marge sur coût variable ?",
    "Ceux qui ont baissé tous leurs prix ont vu Brenaz répondre par une baisse plus forte. Sans cette réponse, la décision aurait-elle été bonne ? Combien de retraits en plus fallait-il pour garder la même marge ?",
    "Sous l'aléa de la classe, la contre-proposition à −4 % a été acceptée, et, toutes choses égales par ailleurs, ceux qui l'ont faite finissent environ 1,6 k€ au-dessus de ceux qui ont accepté −8 %. Sur les trente tirages, elle fait mieux 15 fois sur 30, et pourtant elle perd 1,4 k€ en moyenne : pourquoi ? (Avec la structure de la meilleure méthode, un retrait à −4 % laisse 47,24 € contre 35,48 € à −8 % ; mais une fois sur deux Bâtir part, et la moitié de 47,24 € ne vaut que 23,62 €.) Le bilan la classe en « Chance » : qu'est-ce que cela veut dire ?",
    "La meilleure méthode finit à environ 4 k€ sous le budget sous l'aléa 12, mais, en écart au budget, entre −54 k€ et +21 k€ selon les trente tirages, quand l'écart moyen avec la structure du plan est de 38 k€. Si l'on comparait deux directeurs de drive sur leur seul résultat, sous deux aléas différents, que jugerait-on ?",
    "Le budget de 31,5 k€ était bâti sur 270 retraits par semaine, et aucune des trois méthodes du bilan ne l'atteint en moyenne. Que dit cet écart du budget lui-même, et de la façon d'évaluer celui qui doit le tenir ?",
    "Quelle charge fixe gardez-vous, et à quelle condition ? Formulez la règle en une phrase, avec le scénario bas dedans.",
  ],
  prolongement: {
    enonce:
      "Un traiteur livre des plateaux-repas aux entreprises d'une zone d'activité : 25 € le plateau, 9 € d'ingrédients, 1 € d'emballage, 5 € par plateau payés à des coursiers indépendants. Ses charges fixes sont de 18 000 € par mois, et il vend 2 400 plateaux par mois ; son plan d'affaires en prévoit 3 000. On lui propose d'embaucher des livreurs salariés pour 12 000 € par mois, ce qui supprime les 5 € de coursier. 1) Pour chaque structure, calculez le seuil de rentabilité mensuel en euros et en plateaux, la marge de sécurité, son indice et le levier opérationnel à 2 400 plateaux. 2) Calculez le résultat de chaque structure à 3 000 plateaux, puis à 1 440 (40 % de moins qu'aujourd'hui). 3) À partir de quel volume les livreurs salariés deviennent-ils moins chers ? 4) Si les ventes ont trois chances sur dix d'atteindre le plan, 45 % de rester à 2 400 et 25 % de tomber à 1 440, quelle structure recommandez-vous ?",
    corrige:
      "1) Coursiers : marge sur coût variable de 10 € par plateau (25 − 15), taux de 40 % ; seuil de 18 000 / 0,40 = 45 000 €, soit 1 800 plateaux ; à 2 400 plateaux (60 000 €), résultat de 24 000 − 18 000 = 6 000 €, marge de sécurité de 15 000 €, indice de 25 %, levier de 24 000 / 6 000 = 4. Livreurs salariés : marge de 15 € (taux de 60 %), charges fixes de 30 000 € ; seuil de 50 000 €, soit 2 000 plateaux ; résultat de 36 000 − 30 000 = 6 000 €, marge de sécurité de 10 000 €, indice de 16,7 %, levier de 36 000 / 6 000 = 6. 2) À 3 000 plateaux : 30 000 − 18 000 = 12 000 € avec les coursiers, 45 000 − 30 000 = 15 000 € avec les salariés. À 1 440 : 14 400 − 18 000 = −3 600 € et 21 600 − 30 000 = −8 400 €. 3) 12 000 / 5 = 2 400 plateaux : c'est le volume d'aujourd'hui, où les deux résultats sont égaux. 4) Espérance de résultat : coursiers 0,30 × 12 000 + 0,45 × 6 000 + 0,25 × (−3 600) = 5 400 € ; salariés 0,30 × 15 000 + 0,45 × 6 000 + 0,25 × (−8 400) = 5 100 €. Les coursiers l'emportent en moyenne et perdent 4 800 € de moins dans le scénario bas : la structure salariée n'est la meilleure qu'au volume du plan.",
  },
  evaluation: [
    "Les charges du compte du premier mois sont correctement ventilées entre variables et fixes, et le seuil de rentabilité est juste en euros et en retraits.",
    "La marge de sécurité et le levier opérationnel sont calculés et traduits en risque : ce que coûte au résultat une baisse de 10 % du chiffre d'affaires.",
    "Chaque engagement d'une charge fixe est justifié par un calcul au volume probable et dans le scénario bas, pas seulement au volume du plan.",
    "Le volume supplémentaire de Bâtir Nord-Isère est jugé sur sa marge sur coût variable, en tenant compte de la structure déjà choisie.",
    "L'élève sait dire si une décision était bonne indépendamment du résultat obtenu sous l'aléa de la classe, en s'appuyant sur le rejeu des trente tirages.",
  ],
  vigilance:
    "L'épisode appelle « marge de sécurité » le rapport (chiffre d'affaires − seuil) / chiffre d'affaires, que la plupart des manuels nomment indice de sécurité, la marge de sécurité s'exprimant en euros : à préciser aux élèves. Les redevances de crédit-bail et le loyer fixe y sont traités comme des charges fixes du compte de résultat, sans retraitement en immobilisation.",
};
