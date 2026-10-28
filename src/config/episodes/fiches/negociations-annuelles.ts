/**
 * FICHE ENSEIGNANT · ÉPISODE 101, LES NÉGOCIATIONS DU 1ER MARS.
 *
 * La négociation annuelle avec une centrale d'achat : chiffrer ce que vaut
 * vraiment la menace de déréférencement, justifier la part agricole que la
 * loi met hors négociation, et échanger le reste contre des contreparties. Le
 * piège : céder pour garder les références, ou rompre par principe. Les
 * chiffres du hasard de la classe sont ceux de la graine 12, les moyennes
 * celles des 30 tirages du bilan.
 */
import type { FicheEnseignant } from "./types";

export const FICHE: FicheEnseignant = {
  code: "negociations-annuelles",
  formations: ["bts-ndrc", "but-tc"],
  programme: [
    "BTS NDRC · Bloc 1, Relation client et négociation-vente",
    "BUT TC · Vendre une offre commerciale",
    "BUT TC · Participer à la stratégie marketing et commerciale de l'organisation",
  ],
  notion:
    "Une menace se chiffre avant de se craindre : ce qu'un client retire, il ne le retire pas sans perdre lui aussi, et une partie des acheteurs suit la marque dans un autre magasin. L'erreur classique consiste à négocier la menace au lieu de la mesurer : céder sur le prix pour garder ses références, ou rompre par principe en tenant ses conditions générales de vente entières. Dans l'épisode, la Laiterie de Kerbrélan demande +5,8 % à Celtis, qui pèse 30 % de son chiffre d'affaires ; Celtis répond −2 % et menace de retirer douze références au 1er mars. Les trois leaders font 1,02 M€ de marge sur coût variable et 45 % de leurs acheteurs iraient les chercher ailleurs ; les neuf autres font 0,9 M€ et 10 % seulement suivraient : un an de retrait coûterait 1 371 k€, quand chaque point de prix vaut 200 k€ par an. La hausse se décompose en 3,9 points de part agricole, justifiés par les indicateurs du contrat avec l'OP et que la loi met hors négociation, et 1,9 point de reste. L'élève découvre qu'on prépare un dossier avant le premier rendez-vous, qu'on fait attester la part agricole plutôt que la discuter, qu'on échange le reste contre un plan d'affaires et non contre une coopération sans service, et qu'on prépare l'échéance (médiateur, mise en avant chez un autre distributeur) au lieu de la subir.",
  objectifs: [
    "Je chiffre ce que me coûterait le déréférencement de chaque référence menacée, en tenant compte des acheteurs qui changent de magasin.",
    "Je décompose une hausse de tarif entre ce qui se justifie (la part agricole) et ce qui se négocie, et j'en tire la valeur d'un point de prix.",
    "Je propose des contreparties chiffrées en échange d'une concession, sans accorder d'avantage sans service.",
    "Je prépare une solution de repli avant l'échéance d'une négociation.",
    "Je distingue la qualité d'une décision du résultat qu'elle a obtenu sous un tirage donné.",
  ],
  prerequis:
    "Les notions de marge sur coût variable, de conditions générales de vente, de rapport de force et de contrepartie doivent avoir été vues ; un pourcentage et une moyenne pondérée suffisent pour le calcul. Le cadre des négociations annuelles avec la grande distribution (date du 1er mars, part de la matière première agricole) peut être présenté en quelques minutes avant de jouer.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/negociations-annuelles?hasard=12 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Vous présentez la situation en deux phrases (+5,8 % demandés, −2 % répondus, douze références menacées) sans parler de report des acheteurs, et vous demandez de noter sur papier la marge perdue calculée en semaine 1 et la façon d'aborder le premier rendez-vous.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez l'ouverture de la semaine 1 et la position du dernier rendez-vous (semaine 9), où la classe se partage entre la dernière offre de Celtis, la part agricole et les contreparties, la part agricole seule et les CGV entières. Un binôme qui a fini tôt recalcule la part agricole : la moyenne pondérée des trois indicateurs, puis la part du lait dans le tarif.",
    },
    {
      minutes: 15,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous inscrivez au tableau les valeurs relevées, puis vous reconstruisez le calcul avec la classe à partir des marges de chaque référence et de l'étude de Mesurial : la marge des leaders et des faibles, et la part des acheteurs qui vont acheter ailleurs. Vous faites expliquer les valeurs éloignées (1 920, 549 ou 4 890 k€), puis vous mettez le chiffre en face de la valeur d'un point : 1 371 k€, c'est moins de sept points de prix, et Celtis demande à la laiterie d'en abandonner 7,8.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Vous comptez à main levée les choix de la semaine 3 (la part agricole), de la semaine 5 (le reste) et de la semaine 9. Pour la semaine 3, vous faites lire la juriste : la part agricole ne se négocie pas, et l'attestation d'un tiers indépendant est la façon la plus solide de la justifier ; vous faites refaire le calcul de l'acheteuse, qui n'a pris qu'un indicateur sur trois. Pour la semaine 5, vous faites comparer le plan d'affaires et la coopération commerciale : 300 k€ par an rendus à Celtis, sans service.",
    },
    {
      minutes: 15,
      titre: "Le bilan des trente tirages",
      detail:
        "Sous le tirage n° 12, Celtis signe à +5,5 % avec la méthode « Préparer, justifier, échanger », qui finit à 6 049 k€ de marge annuelle attendue ; « Céder pour garder les références » finit à 4 860 k€, sous l'attente du 1er mars (4 892 k€), qui a pourtant fini en rupture. Vous faites lire les neuf réflexes : aucun ne fait mieux que la méthode sur un seul des trente tirages, qu'il cède ou qu'il rompe. Le hasard de l'épisode décide de la réponse de Celtis, pas de la qualité de la préparation : c'est le moment de le dire.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau la règle de l'épisode : chiffrer la menace, justifier ce qui ne se négocie pas, échanger ce qui se négocie, préparer l'échéance. Vous la déclinez en trois gestes : un dossier par référence avant le premier rendez-vous, une attestation plutôt qu'une discussion sur la part agricole, et une contrepartie chiffrée pour chaque concession. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: 1371,
    etapes: [
      "Source « Faire chiffrer la marge de chaque référence chez Celtis » : les trois leaders font 1 020 k€ de marge sur coût variable par an, les neuf autres références menacées 900 k€.",
      "Source « Lire l'étude de Mesurial sur les ruptures en rayon » : quand un leader manque, 45 % de ses acheteurs vont l'acheter dans un autre magasin ; pour les neuf autres, 10 % seulement. Cette marge-là n'est pas perdue pour la laiterie.",
      "Leaders : 1 020 × (1 − 0,45) = 561 k€ perdus. Autres références : 900 × (1 − 0,10) = 810 k€ perdus.",
      "Marge perdue en un an si Celtis retirait les douze références : 561 + 810 = 1 371 k€. Le chiffre ne dépend pas du hasard ; l'épisode le juge juste à 25 k€ près, proche à 120 k€.",
      "Pour comparer : un point de prix sur toute la marque vaut 20 M€ / 100 = 200 k€ de marge par an. Céder la baisse de 2 % au lieu de la hausse de 5,8 %, c'est 7,8 points, soit 1 560 k€ par an : plus que le retrait des douze références pendant un an entier.",
    ],
    erreurs: [
      {
        valeur: 1920,
        cause:
          "Toute la marge des douze références est comptée comme perdue (1 020 + 900) : l'étude de Mesurial montre qu'une partie des acheteurs va les chercher dans un autre magasin.",
      },
      {
        valeur: 549,
        cause:
          "Les taux de report sont pris pour des taux de perte (1 020 × 0,45 + 900 × 0,10) : 45 % des acheteurs des leaders vont ailleurs, c'est donc 55 % de leur marge qui est perdue.",
      },
      {
        valeur: 4890,
        cause:
          "Le chiffre d'affaires remplace la marge sur coût variable (3 000 × 0,55 + 3 600 × 0,90) : un pot qui n'est pas vendu n'est pas fabriqué, la laiterie ne perd que sa marge.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Celtis pèse 30 % du chiffre d'affaires : ouvrir sur sa demande montre de la bonne volonté et met la liste des douze références de côté.",
      ceQuiLeDejoue:
        "Ifig Kerdudo le dit : chiffrer d'abord ce qu'on perdrait vraiment, et ce qu'eux perdraient. Les marges d'Amadou Perrotte et l'étude de Mesurial donnent 1 371 k€ pour un an de retrait, quand chaque point de prix vaut 200 k€ ; et 45 % des acheteurs du seau de fromage blanc changent de magasin avec un panier de 52 €. Ouvrir sur −2 % ancre la discussion sur la baisse. Rejouée sur les trente tirages à la place du dossier de négociation, cette ouverture perd 212 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Les CGV sont justifiées et la loi protège la hausse : un courrier ferme montre que la laiterie ne se laissera pas faire.",
      ceQuiLeDejoue:
        "La loi met hors négociation la part agricole, pas le reste : 1,9 point se négocie, et l'acheteuse attend un plan. Le courrier repousse le premier rendez-vous à janvier sans rien préparer, et Celtis peut retirer neuf références faibles dont 10 % seulement des acheteurs suivraient la marque. Rejoué sur les trente tirages à la place du dossier, le refus de discuter perd 176 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 1,
      pourquoi:
        "L'acheteuse ne reconnaît que 2,1 points : ramener la part agricole à 2,5 points, c'est le geste qui débloque la discussion, et le prix du lait payé aux producteurs ne change pas.",
      ceQuiLeDejoue:
        "Le contrat-cadre relu avec Hoel Quiniou : trois indicateurs pondérés (coûts de production 50 %, valorisation beurre-poudre 30 %, prix moyen national 20 %) donnent +9,3 %, et 42 % de lait dans le tarif font 3,9 points ; l'acheteuse n'a pris que le dernier indicateur. La juriste rappelle que la part agricole n'est pas négociable, et Konogan Kerguéris prévient que la laiterie paiera quand même 460 € les 1 000 litres. Rejoué sur les trente tirages à la place de l'attestation, ce geste perd 292 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 2,
      option: 1,
      pourquoi:
        "1,5 point de coopération commerciale fait passer la hausse : la hausse affichée reste entière, et Celtis a ce qu'elle veut.",
      ceQuiLeDejoue:
        "Naïm Lefeuvre : une coopération doit rémunérer un service réel et identifié ; 1,5 point sans service, ce sont 300 k€ par an rendus à Celtis, que la DGCCRF voit comme un avantage sans contrepartie, et Nordal en a accordé deux points pour se voir quand même retirer trois références. Le plan de Morwenna Pellen rapporte 110 k€ de promotions, 132 k€ de nouveautés et 30 k€ de transport, contre un point sur le reste. Rejouée sur les trente tirages à la place du plan d'affaires, la coopération perd 135 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 1,
      pourquoi:
        "Celtis met des références en sommeil : en retirer soi-même trois faibles, c'est un geste qui sauve les autres.",
      ceQuiLeDejoue:
        "Les sorties de caisse de Mesurial, pour 9 000 € : pendant les ruptures, 45 % des acheteurs du seau de fromage blanc sont allés l'acheter ailleurs avec le reste de leur panier, et les acheteurs de centrale à qui l'on montre ces chiffres retirent souvent leur menace sur les leaders. Retirer trois yaourts, c'est abandonner 1,2 M€ de chiffre d'affaires sans rien obtenir sur le prix. Rejoué sur les trente tirages à la place des données de sortie de caisse, ce retrait perd 152 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "La dernière offre garde les douze références en rayon : c'est à prendre maintenant, au-delà rien n'est garanti pour le 1er mars.",
      ceQuiLeDejoue:
        "La simulation d'Amadou Perrotte met chaque issue en regard : la marge au prix de l'offre, celle avec la part agricole entière, celle avec un point de plus contre le plan, et la perte si Celtis retirait les neuf faibles douze semaines, bien plus petite que l'écart de prix. Les trois leaders, Celtis ne peut pas s'en passer longtemps. Rejouée sur les trente tirages à la place de la part agricole et des contreparties, la dernière offre perd 555 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 3,
      pourquoi:
        "Les CGV sont justifiées ligne à ligne : +5,8 % ou le déréférencement, c'est la position de décembre, et céder serait montrer de la faiblesse.",
      ceQuiLeDejoue:
        "Amadou Perrotte le rappelle : plus la laiterie demande, plus le risque que Celtis refuse de signer monte. Seule la part agricole est hors négociation ; le reste attend une contrepartie, et le plan d'affaires en apportait une. Rejoué sur les trente tirages à la place de la part agricole et des contreparties, le maintien des CGV entières perd 353 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Prévenir Celtis qu'on signera son prix le 28 février, c'est supprimer le suspense : les douze références restent quoi qu'il arrive.",
      ceQuiLeDejoue:
        "Une négociation dont l'issue est annoncée n'en est plus une : Celtis n'a plus de raison de bouger. La juriste décrit l'autre voie : un préavis et le médiateur des relations commerciales agricoles, qui retient la part agricole justifiée et cherche un équilibre sur le reste ; Emerance Delafosse accepte de mettre la marque en avant chez Opaline, 15 000 € à déclencher seulement si Celtis déréférence. Rejouée sur les trente tirages à la place de cette préparation, la promesse de signer perd 435 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 2,
      pourquoi: "Si Celtis veut déréférencer, qu'elle déréférence : la laiterie ne cède plus rien, et le fait savoir.",
      ceQuiLeDejoue:
        "La juriste prévient que, sans dossier prêt, une centrale préfère souvent retirer des références plutôt que d'aller devant le médiateur, et une fois sur trois ce sont les douze. Avec la mise en avant préparée chez Opaline, 60 % des acheteurs des leaders et 20 % des autres retrouveraient Kerbrélan, contre 45 % et 10 % sans rien préparer. Rejeté sur les trente tirages à la place de la préparation, le refus de proposer perd 301 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "En semaine 1, Celtis menaçait douze références. Que valait vraiment cette menace, référence par référence ? Pourquoi le seau de fromage blanc et un yaourt aromatisé ne pèsent-ils pas pareil dans la négociation ?",
    "L'acheteuse calcule 2,1 points de part agricole, la laiterie 3,9. D'où vient l'écart ? Pourquoi la juriste conseille-t-elle une attestation plutôt qu'un courriel avec la formule ?",
    "Un plan d'affaires et une coopération commerciale font tous deux passer une partie de la hausse. Qu'est-ce qui les distingue pour Celtis, pour la laiterie et pour la loi ?",
    "Les neuf réflexes de l'épisode vont dans deux sens opposés : céder pour garder les références, ou rompre par principe. Pourquoi les deux perdent-ils, et sur les trente tirages, aucun ne fait-il jamais mieux que la méthode ?",
    "Sous le tirage n° 12, ceux qui ont attendu le 1er mars sans rien préparer ont fini en rupture, et pourtant au-dessus de ceux qui ont tout cédé (4 892 k€ contre 4 860 k€). Qu'est-ce que cela dit du prix d'une concession ?",
    "Préparer le médiateur et une mise en avant chez Opaline ne coûte rien si Celtis signe. Pourquoi une solution de repli change-t-elle la négociation elle-même ?",
    "Quelle règle gardez-vous pour votre prochaine négociation annuelle ? Formulez-la en une phrase, avec la valeur d'un point dedans.",
  ],
  prolongement: {
    enonce:
      "Une fromagerie réalise 12 M€ de chiffre d'affaires et 3 M€ de marge sur coût variable chez une enseigne. L'enseigne menace de retirer huit références : deux leaders (1,5 M€ de chiffre d'affaires, 480 k€ de marge), dont 40 % des acheteurs iraient les acheter ailleurs, et six autres (1,8 M€, 450 k€), dont 10 % seulement suivraient. La fromagerie demande +4 %, dont 2,5 points de part agricole ; l'enseigne demande −1,5 %. 1) Quelle marge la fromagerie perdrait-elle en un an si les huit références étaient retirées ? 2) Que vaut un point de prix ? 3) Que coûte, sur un an, le fait de céder toute la demande de l'enseigne plutôt que d'obtenir sa hausse ? 4) Si l'enseigne ne retirait en fait que les six références faibles pendant douze semaines, que perdrait la fromagerie, en ne comptant que ces douze semaines ?",
    corrige:
      "1) Leaders : 480 × 0,60 = 288 k€ ; autres : 450 × 0,90 = 405 k€ ; total 693 k€. 2) 12 M€ / 100 = 120 k€ de marge par an. 3) De +4 % à −1,5 %, il y a 5,5 points : 5,5 × 120 = 660 k€ par an, presque autant qu'un an de retrait des huit références. 4) 405 × 12 / 52 ≈ 93 k€ : la menace réelle vaut sept fois moins que la concession demandée.",
  },
  evaluation: [
    "La marge perdue est calculée juste, référence par référence, avec les taux de report de l'étude, et comparée à la valeur d'un point de prix.",
    "La part agricole est justifiée par les indicateurs du contrat et tenue hors de la négociation, et l'élève sait la recalculer.",
    "Chaque concession sur le reste de la hausse est échangée contre une contrepartie chiffrée, sans avantage sans service.",
    "L'échéance du 1er mars est préparée (médiateur, repli chez un autre distributeur), et l'élève explique ce que cette préparation change au rapport de force.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 12.",
  ],
  vigilance:
    "L'épisode s'appuie sur le cadre des lois EGalim (non-négociabilité de la part de la matière première agricole, trois options pour la justifier dont l'attestation d'un tiers indépendant, date butoir du 1er mars, médiateur des relations commerciales agricoles, plafonds des promotions à 34 % de la valeur et 25 % du volume) et sur l'interdiction d'obtenir un avantage sans contrepartie : ces règles ont été modifiées plusieurs fois, notamment sur ce qui se passe sans accord au 1er mars, et un enseignant de droit commercial doit les vérifier dans le code de commerce en vigueur avant de les présenter. L'épisode présente la menace de déréférencement comme un levier de négociation ; la frontière avec la pratique restrictive de concurrence (une menace de rupture brutale pour obtenir des conditions manifestement abusives) mérite d'être précisée aux étudiants.",
};
