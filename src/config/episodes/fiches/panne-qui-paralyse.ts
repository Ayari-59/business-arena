/**
 * FICHE ENSEIGNANT · ÉPISODE 16, LA PANNE QUI PARALYSE.
 *
 * Continuité d'activité quand le système d'information tombe : un mode dégradé
 * organisé, une communication honnête, un redémarrage nettoyé par étapes. Le
 * piège : aller vite et rassurer, au risque de tout perdre une seconde fois.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "panne-qui-paralyse",
  formations: ["stmg", "bts-gpme"],
  programme: [
    "STMG Thème 2 · Management du système d'information et performance",
    "BTS GPME · Bloc 2, Participer à la gestion des risques de la PME",
  ],
  notion:
    "Quand le système d'information tombe, la performance ne dépend plus de la vitesse à laquelle il revient, mais de ce que l'organisation sait faire sans lui, et de la façon dont on le relance. L'erreur classique consiste à courir après le système : tout relancer depuis les sauvegardes sans nettoyer, payer la rançon pour en finir, promettre aux clients un retour sous huit jours, et faire tenir les équipes en heures supplémentaires. Dans l'épisode, Céline Rochat dirige les opérations d'Arvel Distribution pour la région lyonnaise, six agences et cent quarante personnes, quand une cyberattaque chiffre le système de gestion. Les sauvegardes de jeudi sont intactes, mais l'intrus est entré par un accès à distance resté ouvert et a circulé sur une trentaine de postes : relancer sans nettoyer, c'est risquer de tout perdre une seconde fois. Les vendeurs connaissent de mémoire le stock des 200 références qui font 70 % des ventes ; ce qui manque, c'est de savoir quel client servir d'abord et quelle agence a quoi. L'élève découvre qu'une cellule de crise aux rôles écrits et un mode dégradé par priorités tiennent l'activité, que l'honnêteté garde les clients mieux qu'une promesse, et qu'un redémarrage nettoyé par étapes vaut mieux qu'un retour rapide qui peut s'effondrer.",
  objectifs: [
    "J'organise un mode dégradé : des rôles écrits, des priorités clients, une information partagée sur les stocks.",
    "J'estime l'activité qu'une organisation maintient pendant une panne, semaine par semaine, et je la compare au réalisé.",
    "Je compare des façons de redémarrer un système en tenant compte du risque qu'elles font courir, pas seulement de leur vitesse.",
    "Je communique honnêtement pendant une crise : ce qu'on sait, ce qu'on ne sait pas, comment faire en attendant.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Le rôle du système d'information dans le fonctionnement d'une organisation et la notion de sauvegarde doivent avoir été vus en cours. Le plan de continuité d'activité, le mode dégradé et la cellule de crise peuvent être découverts pendant la séance. L'épisode ne dit rien de la manière dont une attaque se mène : la séance porte sur la décision.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/panne-qui-paralyse?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme, au niveau Standard. Vous demandez de noter sur papier, avant de saisir la prévision de la semaine 1, l'activité maintenue en moyenne sur les quatre premières semaines et le raisonnement qui y mène, puis le choix fait à chacune des six décisions.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent l'épisode jusqu'au bilan. Vous circulez sans corriger, et vous relevez deux choses : l'organisation choisie le lundi de la semaine 1, et la décision de redémarrage de la semaine 2, où la classe se partage souvent entre tout relancer, payer et nettoyer. Un binôme qui a fini tôt rejoue le trimestre en changeant la seule décision de la semaine 2 : tout relancer lundi au lieu du redémarrage par étapes.",
    },
    {
      minutes: 15,
      titre: "Correction de la prévision de la semaine 1",
      detail:
        "Vous inscrivez au tableau les prévisions relevées. Vous refaites le raisonnement avec la classe : un mode dégradé organisé sert environ 70 % de l'activité, un peu moins la première semaine, et rien ne redémarre avant la décision de la semaine 2. Sous le tirage n° 12, le modèle donne 61 %, 60 %, 63 % puis 92 % : 69 % en moyenne. Vous montrez ensuite que ceux qui ont tout relancé ont eu plus (environ 77 %) sur ces quatre semaines, puis tout reperdu en semaine 5 : la prévision n'est pas le jugement.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 1, de la semaine 2 (prévenir honnêtement, annoncer huit jours, se taire, seulement les grands comptes) et du redémarrage. Vous faites lire le rapport du prestataire et l'appel à l'assureur : une trentaine de postes à vérifier, une rançon non couverte, une clé qui ne déchiffre tout qu'une fois sur deux, et un intrus que payer n'a jamais fait partir. Vous enchaînez sur Ferrand Habitat : un plan de livraison qu'on peut tenir, ou une promesse.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Vous projetez le bilan d'un élève qui accepte de le montrer, en prévenant que toutes les méthodes finissent sous la marge d'un trimestre normal : la crise coûte toujours. Sous le tirage n° 12, « Cellule de crise et redémarrage par étapes » perd 219,1 k€, « Aller vite et rassurer » 542,5 k€ et l'attentisme 451,8 k€. Vous séparez la qualité d'une décision de son résultat sur le redémarrage : tout relancer fait mieux 11 fois sur 30, quand l'intrus est parti, et perd 108,8 k€ en moyenne ; payer la rançon n'a coûté que 41,1 k€ de plus sous le tirage de la classe, et 177,3 k€ en moyenne.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau les quatre temps de l'épisode : s'organiser pour vivre sans le système (cellule de crise, priorités, information partagée) ; dire aux clients ce qu'on sait et ce qu'on ne sait pas ; redémarrer propre, par étapes ; ménager les équipes et rapprocher les bons des livraisons avant de tourner la page. Vous terminez sur le retour d'expérience et le plan de continuité, qui préparent la crise suivante.",
    },
  ],
  calcul: {
    reponse: 69,
    etapes: [
      "Source « Faire le point avec Agricol Ferreira » : deux à six semaines pour un redémarrage propre, moins par étapes. Rien ne redémarre avant la décision de la fin de semaine 2 : les semaines 1 à 3 se jouent, pour l'essentiel, sans système.",
      "Source « Appeler les six chefs d'agence » : Villeurbanne, qui a ressorti les carnets, sert déjà les deux tiers de ses clients, et les vendeurs connaissent le stock des 200 références qui font 70 % des ventes. Un mode dégradé organisé (bons numérotés, tableau partagé des stocks, clients prioritaires) tient environ 70 % de l'activité, un peu moins la première semaine, le temps de s'installer.",
      "Le redémarrage par étapes remet en service les commandes et la facturation pendant la semaine 4, avant la fin du nettoyage : l'activité remonte nettement cette semaine-là.",
      "Sous le tirage n° 12, le modèle donne 61,3 %, 60,3 %, 62,8 % puis 91,9 % d'une semaine normale : (61,3 + 60,3 + 62,8 + 91,9) / 4 ≈ 69 %. Un raisonnement sans redémarrage avant la semaine 5 donne environ 68 %, dans la marge.",
      "L'épisode juge juste à 5 points près, proche à 12. Selon les trente tirages du bilan, la meilleure méthode en tient de 60 % à 73 %.",
    ],
    erreurs: [
      {
        valeur: 0,
        cause:
          "« Plus rien ne fonctionne » pris à la lettre : sans système, les agences servent encore, sur bons papier, si on les organise.",
      },
      {
        valeur: 55,
        cause:
          "La part de la marge que font les cinquante premiers clients (55 %) prise pour l'activité maintenue : servir d'abord les prioritaires ne veut pas dire ne servir qu'eux.",
      },
      {
        valeur: 80,
        cause:
          "Le système supposé revenu en entier dès la semaine 3 ((61 + 60 + 100 + 100) / 4) : c'est la promesse de tout relancer lundi, que l'intrus encore présent peut ruiner.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 1,
      pourquoi: "Chaque client compte : tout servir comme avant, sur papier, en heures supplémentaires, pour ne perdre personne.",
      ceQuiLeDejoue:
        "Les chefs d'agence le disaient : ce qui manque n'est pas l'effort, c'est de savoir quel client servir d'abord et quelle agence a quoi. Tout servir à la main coûte 4 000 € d'heures par semaine de panne, use les équipes deux fois plus vite, et les bons s'empilent « dans un carton » qu'il faudra ressaisir. Marc-Antoine Vidal : « Organise-toi pour vivre sans lui quelques semaines, et que chacun sache ce qu'il décide. » Rejoué sur les trente tirages à la place de la cellule de crise, il perd 91 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 1,
      pourquoi: "Les clients sont inquiets : un message rassurant, tout de suite, retour à la normale sous huit jours.",
      ceQuiLeDejoue:
        "Agricol Ferreira avait donné son estimation honnête : deux à six semaines. Le service juridique : « il est imprudent de promettre une date qu'on ne connaît pas ». La promesse se juge en semaine 4, et quand le système n'est pas revenu, la confiance s'effondre. Rejouée sur les trente tirages à la place de l'information honnête, elle perd 23,7 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 2,
      pourquoi: "Sabrina Haddou le dit : « Si on dit qu'on s'est fait pirater, on est morts. » Mieux vaut se taire tant qu'on n'en sait pas plus.",
      ceQuiLeDejoue:
        "Les vingt appels écoutés : « Ce qui énerve les clients n'est pas la panne : c'est de ne pas savoir. » Deux artisans ont déjà appris l'attaque par un concurrent. Et le service juridique rappelait que les clients dont les données ont pu être touchées devront être informés. Rejoué sur les trente tirages à la place de l'information honnête, le silence perd 18,9 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi: "Les sauvegardes sont intactes : tout relancer lundi, et le système revient en quelques jours pour 8 000 €.",
      ceQuiLeDejoue:
        "Le rapport du prestataire : l'intrus est entré par un accès à distance resté ouvert et a circulé sur une trentaine de postes ; tant que chacun n'est pas vérifié, ce qui redémarre peut être chiffré de nouveau. Sous le tirage de la classe, c'est arrivé pendant la semaine 5 : tout chiffré une seconde fois, système revenu en semaine 9 seulement. Rejoué sur les trente tirages à la place du redémarrage par étapes, tout relancer perd 108,8 k€ en moyenne ; il fait mieux 11 fois sur 30, quand l'intrus était parti.",
    },
    {
      decision: 2,
      option: 1,
      pourquoi: "Une partie du conseil veut payer pour en finir : 90 000 € contre une clé promise sous 48 heures.",
      ceQuiLeDejoue:
        "L'assureur : le contrat ne couvre pas la rançon, la clé ne déchiffre tout qu'une fois sur deux dans les dossiers qu'il suit, et payer n'a jamais fait partir un intrus. Sous le tirage de la classe, la clé a fonctionné et l'intrus n'est pas revenu : payer n'a coûté que 41,1 k€ de plus. Rejoué sur les trente tirages, il perd 177,3 k€ en moyenne, la plus grosse perte de l'épisode, et ne fait mieux que 4 fois.",
    },
    {
      decision: 3,
      option: 2,
      pourquoi: "Ferrand Habitat pèse 11 % de la région : lui promettre que tout sera rentré dans l'ordre sous quinze jours ne coûte rien.",
      ceQuiLeDejoue:
        "Le tableau partagé des stocks montrait qu'à trois agences, on couvre 90 % des besoins de ses trois chantiers sur deux semaines, en réservant les références critiques : un plan qu'on peut tenir. La promesse, elle, dépend du système, et Nathalie Brun prévient : « quinze jours, pas un de plus ». Sous le tirage de la classe, Ferrand est parti après la promesse, quand le plan l'aurait gardé. Rejouée sur les trente tirages à la place du plan de livraison, elle perd 23,6 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 1,
      pourquoi: "Payer des heures supplémentaires majorées, sur la base du volontariat, pour tout ressaisir vite.",
      ceQuiLeDejoue:
        "Le point avec les ressources humaines : onze personnes ont déjà dépassé le plafond annuel d'heures supplémentaires, l'agence d'intérim peut fournir quatre opérateurs de saisie dès lundi et la région Auvergne prête deux vendeurs. La mesure de la charge le confirme : confiée à des renforts, la saisie irait moitié plus vite, sans user ceux qui servent les clients. Rejouées sur les trente tirages à la place des renforts, les heures supplémentaires perdent 55 k€ en moyenne et ne font jamais mieux.",
    },
  ],
  debrief: [
    "Le lundi de la semaine 1, certains ont vu un problème d'informatique, d'autres un problème d'organisation. Lequel Céline Rochat pouvait-elle régler elle-même, ce jour-là ? Qu'est-ce qui distinguait Villeurbanne de Vénissieux ?",
    "Ceux qui ont tout relancé ont eu plus d'activité sur les quatre premières semaines que ceux qui ont nettoyé par étapes. Pourquoi ont-ils pourtant fini bien plus bas ? Qu'aurait-il fallu savoir, et où était-ce écrit ?",
    "Sous le tirage de la classe, la clé de la rançon a fonctionné et l'intrus n'est pas revenu. Payer était-il pour autant une bonne décision ? Que disait l'assureur ?",
    "Promettre une date aux clients, se taire, ou dire ce qu'on sait et ce qu'on ne sait pas : laquelle des trois réponses aux clients résiste à une panne qui dure ? Pourquoi ?",
    "Face à Ferrand Habitat, un plan de livraison chantier par chantier a tenu là où une promesse a échoué. Qu'est-ce que la décision de la semaine 1 avait préparé pour rendre ce plan possible ?",
    "Toutes les méthodes du bilan finissent sous la marge d'un trimestre normal. Comment juger une décision prise dans une crise qui coûte de toute façon ? Par rapport à quoi la comparer ?",
    "Quelle règle gardez-vous pour une panne du système d'information ? Formulez-la en une phrase, avec le redémarrage et les clients dedans.",
  ],
  prolongement: {
    enonce:
      "Une entreprise fait 70 000 € de marge par semaine normale. Son système est tombé ; en mode dégradé organisé, elle tient 70 % de son activité. On raisonne sur les semaines 3 à 8. Option A : tout relancer depuis les sauvegardes, 8 000 €. Si l'intrus est parti (4 chances sur 10), l'activité est normale dès la semaine 3. S'il est encore là (6 chances sur 10), la semaine 3 est à 90 %, puis tout est chiffré de nouveau : les semaines 4 à 8 se font en mode dégradé, et il faut 70 000 € de prestataire en urgence. Option B : nettoyer et redémarrer par étapes, 42 000 € ; les semaines 3 et 4 se font en mode dégradé, l'activité est normale à partir de la semaine 5, sans risque notable. 1) Pour chaque cas, calculez la marge perdue et le coût total sur les semaines 3 à 8. 2) Calculez le coût attendu de l'option A. 3) Quelle option recommandez-vous ? Un élève qui a choisi A et dont l'intrus était parti a-t-il pris la bonne décision ?",
    corrige:
      "Une semaine en mode dégradé fait perdre 30 % × 70 000 = 21 000 € de marge ; une semaine à 90 %, 7 000 €. 1) A, intrus parti : aucune marge perdue, coût 8 000 €. A, intrus encore là : 7 000 + 5 × 21 000 = 112 000 € de marge perdue, plus 8 000 + 70 000 € de dépenses, soit 190 000 €. B : 2 × 21 000 = 42 000 € de marge perdue, plus 42 000 €, soit 84 000 €. 2) 0,4 × 8 000 + 0,6 × 190 000 = 3 200 + 114 000 = 117 200 €. 3) B coûte 84 000 € contre 117 200 € attendus pour A : B est la meilleure décision. L'élève qui a choisi A et dont l'intrus était parti a obtenu un bon résultat (8 000 €), mais sa décision restait la plus chère en moyenne : il a eu de la chance.",
  },
  evaluation: [
    "La prévision de la semaine 1 s'appuie sur ce qu'un mode dégradé sait servir et sur le calendrier du redémarrage, pas sur la date espérée du retour du système.",
    "L'organisation de crise est décrite avec des rôles, des priorités et une information partagée, chiffrées à partir des sources.",
    "Le choix du redémarrage est argumenté sur le risque de réinfection et ce qu'il coûterait, pas seulement sur la vitesse.",
    "La communication aux clients et la réponse à Ferrand Habitat reposent sur ce qu'on sait et ce qu'on peut tenir.",
    "L'élève sait dire si une décision était bonne indépendamment du résultat obtenu sous le tirage de la classe, en s'appuyant sur le rejeu des trente tirages.",
  ],
  vigilance:
    "L'épisode dit que les autorités ont été prévenues et que les clients dont les données ont pu être touchées devront être informés ; les délais et conditions de notification d'une violation de données personnelles (règlement général sur la protection des données) et les conditions d'assurance du risque cyber sont à relire avant de les préciser aux élèves. Le « plafond annuel d'heures supplémentaires » renvoie au contingent annuel, que l'on peut dépasser sous conditions, et la majoration de 50 % est celle de l'épisode : à vérifier par un enseignant de droit du travail.",
};
