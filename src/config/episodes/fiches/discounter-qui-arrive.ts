import type { FicheEnseignant } from "./types";

/**
 * FICHE ENSEIGNANT · ÉPISODE 41, LE DISCOUNTER QUI ARRIVE.
 *
 * Riposte concurrentielle et positionnement face à un entrant à bas coûts :
 * mesurer la part de la clientèle réellement exposée, aligner ce qui se
 * compare là où l'on compare, éviter la guerre des prix, renforcer ce que le
 * discounter ne sait pas faire. Les chiffres du corrigé, des réflexes et du
 * débrief se recalculent depuis le modèle de l'épisode
 * (src/engine/episodes/discounter-qui-arrive.ts) ; ceux du hasard de la
 * classe sont ceux de la graine 9.
 */
export const FICHE: FicheEnseignant = {
  code: "discounter-qui-arrive",
  formations: ["dcg", "but-gea"],
  programme: [
    "École de commerce · Stratégie d'entreprise",
    "DCG · UE 7, Management",
    "BUT GEA · Stratégie d'entreprise",
  ],
  notion:
    "Face à l'entrée d'un concurrent à bas coûts, la riposte se dimensionne sur la part de la clientèle réellement exposée, et non sur le chiffre d'affaires total : un discounter en libre-service ne prend que les produits qui se comparent et s'enlèvent, chez les clients qui comparent, près de ses points de vente. L'erreur classique est la baisse générale « pour ne perdre personne » : elle paie une remise à tous ceux qui ne seraient pas partis et, parce qu'elle est large et visible, elle invite un concurrent qui a huit points de frais de structure de moins à suivre, ce qui ramène l'écart de prix et installe la guerre des prix. L'erreur symétrique consiste à ne rien faire en comptant sur la fidélité : elle tient chez les clients livrés, pas chez ceux qui enlèvent et comparent. La riposte juste aligne les seules références comparées dans la zone de chalandise et investit dans ce que l'entrant ne sait pas faire (livraison, crédit, conseil) ; on reconnaît l'opposition, chez Porter, entre une stratégie de domination par les coûts et une stratégie de différenciation. L'épisode place l'élève à la tête d'une région de négoce de matériaux de 36 M€ de chiffre d'affaires, dont 14,7 % seulement sont exposés, et lui fait ensuite réviser sa cible quand les premiers chiffres montrent que ce sont les PME du nord, hors de la zone couverte, qui partent pour les palettes.",
  objectifs: [
    "Je mesure la part de la clientèle exposée à un entrant à bas coûts, par segment, par gamme et par zone, avant de choisir l'ampleur de la riposte.",
    "Je chiffre le coût d'une baisse de prix à volumes constants et la part de ce coût qui va à des clients ou à des produits que l'entrant ne menace pas.",
    "Je prévois la réaction d'un concurrent aux coûts plus bas que les miens, et je choisis une riposte qu'il ne peut pas ou ne veut pas suivre.",
    "Je compare un engagement immédiat et un test préalable en chiffrant ce que coûte l'information et ce qu'elle évite de payer pour rien.",
  ],
  prerequis:
    "Les étudiants doivent avoir vu les stratégies génériques (domination par les coûts, différenciation) et la menace des nouveaux entrants, ainsi que le taux de marque et la marge commerciale ; la notion de segment exposé peut se découvrir en jouant.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/discounter-qui-arrive?hasard=9 : toute la classe joue le même trimestre, sous les mêmes aléas. Les étudiants jouent seuls ou en binôme, au niveau Standard. Vous présentez le cadre en une minute (une enseigne en libre-service ouvre deux dépôts aux portes de la région) et vous demandez de noter, à chaque décision, le chiffre qui l'a emportée.",
    },
    {
      minutes: 40,
      titre: "Jeu",
      detail:
        "Les étudiants jouent les six décisions, de la semaine 1 à la semaine 11. Vous circulez sans donner de réponse et relevez au tableau, sans commentaire, le coût de la baisse générale saisi en semaine 1, puis l'option choisie à chaque décision. Vous repérez en particulier les choix sur la livraison (semaine 2) et sur les premiers chiffres (semaine 6), qui serviront au débrief.",
    },
    {
      minutes: 15,
      titre: "Correction de l'estimation de la semaine 1",
      detail:
        "Vous affichez les estimations de la classe, de la plus basse à la plus haute. Vous reconstruisez l'assiette à partir de l'extraction des ventes par type de client (la base enlevée des artisans et des PME, 8,11 M€, sans les entreprises livrées) puis le coût de 649 k€ par an. Vous faites retrouver d'où viennent les valeurs voisines de 136 k€ et de 1 108 k€, et vous terminez en rapportant ce coût à la part réellement exposée : 14,7 % du chiffre d'affaires.",
    },
    {
      minutes: 25,
      titre: "Les décisions qui ont partagé la classe",
      detail:
        "Vous partez de la décision où la classe s'est le plus divisée, en général la livraison du lendemain (tout de suite ou en test) ou la carte comptoir de la semaine 6. Chaque camp défend son option, puis vous ressortez la source qui tranchait : le retour des régions qui livrent déjà, et l'extraction des achats par agence et par type de client. Vous finissez par l'opération d'hiver, où le réflexe de suivre a coûté cher sous le tirage de la classe, alors qu'il paie 7 fois sur 30.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Vous prévenez la classe que le résultat d'un trimestre est très bruité : sur les 30 tirages, les meilleures décisions vont de −1 050 k€ à −118 k€ de valeur. Sous le tirage 9, elles font −371 k€ et tiennent l'objectif de −600 k€, mieux que leur moyenne de −494 k€. Vous faites comparer, décision par décision, ce que la classe a obtenu et ce que chaque option valait en moyenne.",
    },
    {
      minutes: 15,
      titre: "Synthèse",
      detail:
        "Vous dictez les règles que l'épisode a fait éprouver : mesurer l'exposition avant de riposter, aligner ce qui se compare là où l'on compare, ne pas lancer une baisse qu'un concurrent aux coûts plus bas peut suivre, tester avant d'engager ce qui renforce la différenciation, réviser la cible quand les chiffres la contredisent. Vous distribuez le cas de prolongement, à traiter en classe ou à la maison.",
    },
  ],
  calcul: {
    reponse: 648.96,
    etapes: [
      "« Faire extraire les ventes de la région par type de client » : les artisans au comptoir achètent 3,43 M€ de produits de base par an (3,432 M€ exactement), les PME qui enlèvent par palettes 4,68 M€. Les entreprises livrées sur chantier (5,74 M€ de base) achètent livré, à prix nets négociés à l'année : une baisse « à l'enlèvement » ne les touche pas.",
      "Assiette de la baisse : 3,432 + 4,68 = 8,112 M€ de produits de base enlevés par an, dans les huit agences.",
      "À volumes constants, le coût d'achat ne bouge pas : chaque euro de prix rendu est un euro de marge commerciale perdu. Coût de la baisse : 8 % × 8,112 M€ = 648,96 k€ de marge par an (648,8 k€ avec les montants arrondis de la source). Le résultat ne dépend pas du hasard ; l'épisode le juge juste à 10 k€ près, proche à 40 k€.",
      "Pour mesurer le poids : la base enlevée dégage 21 % × 8,112 = 1,704 M€ de marge, et la baisse en emporte 8 / 21 = 38 %. L'alignement ciblé (8,3 % sur le panier du comptoir, 11,5 % sur les palettes, dans la zone) coûte 328 k€ par an, deux fois moins.",
      "Le chiffre qui compte pour la suite : la base enlevée dans les cinq agences de la zone ne pèse que 14,7 % du chiffre d'affaires de la région, et la source de la semaine 11 dira que 409 k€ des 649 k€ vont à des références que personne ne compare ou à des clients qui ne partent pas.",
    ],
    erreurs: [
      {
        valeur: 136.3,
        cause:
          "Les 8 % sont appliqués à la marge au lieu du prix (8 % × 21 % × 8,112 M€) : une baisse de 8 % du prix enlève 8 % du chiffre d'affaires concerné à la marge, soit 38 % de la marge de ces produits. L'épisode la juge fausse.",
      },
      {
        valeur: 1108.2,
        cause:
          "Toute la gamme de base est comptée, entreprises livrées comprises (8 % × 13,853 M€) : on oublie que la baisse ne vise que ce qui s'enlève, et que les clients livrés à prix négociés ne sont pas concernés.",
      },
      {
        valeur: 956.8,
        cause:
          "La baisse est posée sur tout le chiffre d'affaires des artisans et des PME, produits techniques compris (8 % × 11,96 M€), alors qu'elle ne porte que sur la gamme de base.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "Le directeur commercial le demande, Tarval affiche 10 à 15 % d'écart, et une baisse partout semble la seule façon de ne perdre aucun client.",
      ceQuiLeDejoue:
        "La baisse coûte 649 k€ par an pour protéger une base enlevée dans la zone qui pèse 14,7 % du chiffre d'affaires, et le relevé de Tarval montre qu'en Bourgogne il a suivi une baisse générale en trois semaines. Toutes autres décisions égales, sur les 30 tirages, Tarval la suit 13 fois contre 2 pour l'alignement ciblé, et elle vaut 283 k€ de moins en moyenne.",
    },
    {
      decision: 0,
      option: 2,
      pourquoi:
        "Les clients achètent du service, Tarval n'a que deux dépôts, et le chef de l'agence de Vénissieux dit que ses clients livrés ne lui en parlent pas.",
      ceQuiLeDejoue:
        "La même phrase du chef d'agence ajoute qu'au comptoir tous ont la plaquette : les clients livrés ne bougent pas, ceux qui enlèvent et comparent, si. L'alignement ciblé coûte 328 k€ par an à volumes constants et fait 142 k€ de mieux en moyenne que l'absence de riposte.",
    },
    {
      decision: 1,
      option: 0,
      pourquoi:
        "Il faut que les clients sachent qu'Arvel n'est pas plus cher que Tarval, et une campagne se voit tout de suite.",
      ceQuiLeDejoue:
        "L'agence de communication ne sait pas dire combien de clients la campagne retient, et en Bourgogne Tarval a répondu à une campagne prix par une nouvelle baisse. Elle coûte 100 k€, rend plus probable que Tarval suive la riposte et laisse la livraison de côté : 247 k€ de moins en moyenne que le test.",
    },
    {
      decision: 1,
      option: 1,
      pourquoi:
        "C'est exactement ce que Tarval ne sait pas faire, et chaque semaine de test est une semaine de livraison perdue sur six agences.",
      ceQuiLeDejoue:
        "Le retour des régions qui livrent dit que les clients adoptent la livraison une fois sur deux à peine, et qu'on le sait en six semaines. Le test coûte 17,2 k€ (6 × 1 200 € et 10 k€ de mise en place) et évite d'engager 320 k€ par an sur trois ans pour rien : en moyenne, l'engagement immédiat vaut 113 k€ de moins.",
    },
    {
      decision: 2,
      option: 0,
      pourquoi:
        "Arvel pèse lourd chez le fabricant, et le président le demande : sans plaques ni isolants, le dépôt de Tarval est vide.",
      ceQuiLeDejoue:
        "La juriste du groupe rappelle que c'est le terrain de l'entente et de l'abus de dépendance économique : une plainte une fois sur trois au moins et 120 k€ de provision, plus 20 k€ de coopération commerciale retirée. On renonce en outre à la remise de fin d'année, 98 k€ par an à volumes tenus : 150 k€ de moins en moyenne.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Les artisans de la zone tiennent (98 % de leurs achats de base sous le tirage 9) : le plan marche, et le comité avait prévu la carte.",
      ceQuiLeDejoue:
        "L'extraction par agence et par type de client montre que ce sont les PME du nord qui partent (76 % de leurs achats de base en semaine 6), pas les artisans. La carte rend 3 % sur 3,43 M€ de base, environ 103 k€ par an, à des clients qui restaient : 144 k€ de moins en moyenne que le contrat proposé aux PME du nord.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Si l'on ne suit pas, on perd en six semaines ce qu'on a gardé en deux mois, et les clients demandent si l'on suit.",
      ceQuiLeDejoue:
        "L'analyse des opérations de Bourgogne dit qu'un prix suivi ne remonte presque jamais et que Tarval a prolongé et élargi l'opération six fois sur dix quand il cherchait à s'implanter. Suivre coûte environ 6 k€ de marge par semaine pendant l'opération, et vaut 280 k€ de moins en moyenne que ne pas suivre.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "Des prix garantis égaux à ceux de Tarval donnent de la visibilité aux clients et évitent de courir derrière chaque opération.",
      ceQuiLeDejoue:
        "Un prix affiché égal au sien est une baisse que Tarval peut suivre, et la mesure de ce que chaque baisse a retenu montre qu'une partie de la riposte ne retient personne. Recentrer et reconduire les contrats PME vaut 328 k€ de plus en moyenne que les prix garantis.",
    },
  ],
  debrief: [
    "Quelle part des 36 M€ de chiffre d'affaires Tarval menace-t-il vraiment ? Reconstituez les 14,7 % à partir de l'extraction des ventes, puis dites pourquoi la baisse générale coûte 649 k€ par an quand l'alignement ciblé en coûte 328 k€, et à qui va la différence.",
    "Pourquoi un concurrent qui a huit points de frais de structure de moins suit-il une baisse générale et pas un alignement sur une centaine de références près de ses dépôts ? Toutes autres décisions égales, sur les 30 tirages, Tarval suit la baisse générale 13 fois et l'alignement ciblé 2 fois : qu'est-ce qu'une guerre des prix fait gagner à celui qui l'a déclenchée ?",
    "En semaine 2, que valait l'information du test ? Le test coûte 17,2 k€ et dit en six semaines si les clients adoptent la livraison ; l'engagement immédiat coûte 320 k€ par an sur trois ans. Si vous saviez d'avance que les clients l'adopteraient, que choisiriez-vous ? Et s'ils ne l'adoptaient pas ?",
    "Sous le tirage 9, les clients n'ont pas adopté la livraison : la livraison tout de suite, dans les huit agences, a fait 273 k€ de moins que le test, et « rien de plus » 16 k€ de mieux, à peu près le prix du test. Sur les 30 tirages, l'engagement immédiat bat le test 16 fois, chaque fois que les clients l'adoptent, de 15 à 21 k€, mais perd 262 k€ en moyenne les 14 fois où ils ne l'adoptent pas : il vaut 113 k€ de moins en moyenne. Ceux qui l'ont choisi ont-ils mal décidé, ou seulement manqué de chance ? Et ceux qui n'ont rien lancé ?",
    "En semaine 6, sous le tirage 9, les artisans de la zone gardaient 98 % de leurs achats de base et les PME du nord 76 % : quel chiffre fallait-il regarder pour réviser la cible de la riposte ? Pourquoi le contrat d'un an proposé aux PME du nord bat-il la carte comptoir de 144 k€, et l'attente du comité de décembre de 53 k€, en moyenne ?",
    "Sous le tirage 9, suivre l'opération d'hiver de Tarval a fait 249 k€ de moins que ne pas la suivre : il visait la rentabilité, son opération s'est arrêtée, mais le prix suivi n'est pas remonté. Sur les 30 tirages pourtant, suivre fait mieux 7 fois, et vaut 280 k€ de moins en moyenne. Que valait la garantie écrite aux PME de la zone, qui bat le meilleur choix 11 fois sur 30 pour 12 k€ de moins en moyenne et protège le mieux dans les mauvais tirages ?",
    "Sous le tirage 9, les meilleures décisions font −371 k€ (le 16e tirage sur 30) et tiennent l'objectif de −600 k€ ; sur les 30 tirages, elles font −494 k€ en moyenne, entre −1 050 k€ et −118 k€, et ne le tiennent que 19 fois. L'attentisme fait −690 k€, et la baisse partout −1 643 k€. Que conclure d'un binôme qui a fait −550 k€ et tenu l'objectif ? Peut-on juger une décision stratégique au résultat d'un trimestre ?",
  ],
  prolongement: {
    enonce:
      "Une enseigne régionale de douze jardineries réalise 24 M€ de chiffre d'affaires, dont 9 M€ de produits de base (terreau, engrais, outillage courant) au taux de marque de 30 %, et 15 M€ de végétaux vendus avec conseil. Un discounter en libre-service ouvre près de quatre jardineries, qui font 40 % des ventes de base. Il est 15 % moins cher sur 80 références qui représentent la moitié des ventes de base ; il ne vend pas de végétaux et ne donne aucun conseil. L'étude commandée estime la marge perdue par an : 430 k€ sans riposte ; 110 k€ avec un alignement ciblé ; avec une baisse générale, 60 k€ si le discounter ne suit pas et 380 k€ s'il suit, ce qu'il fait une fois sur deux. 1) Que coûte par an, à volumes constants, une baisse de 10 % de toute la gamme de base dans les douze jardineries ? Quelle part de ce coût va à des achats que le discounter ne menace pas ? 2) Quelle baisse ramène l'écart à 5 % sur les 80 références, et que coûte cet alignement, limité aux quatre jardineries exposées ? 3) Comparez le coût total des trois options, et dites ce que l'enseigne devrait renforcer plutôt que baisser ses prix.",
    corrige:
      "1) 10 % × 9 M€ = 900 k€ de marge par an. Ne sont menacés que les achats des 80 références dans les quatre jardineries exposées, soit 9 × 40 % × 50 % = 1,8 M€ : la baisse leur rend 180 k€, et les 720 k€ restants, 80 % du coût, vont aux huit autres jardineries (540 k€) et aux références non comparées des quatre exposées (180 k€). 2) La baisse vaut 1 − 0,85 / 0,95 = 10,5 %, et l'alignement coûte 10,5 % × 1,8 M€ = 189,5 k€ par an. 3) Sans riposte : 430 k€. Alignement ciblé : 189,5 + 110 = 299,5 k€. Baisse générale : 900 + 0,5 × 60 + 0,5 × 380 = 1 120 k€ en espérance, et une guerre des prix une fois sur deux. On attend l'alignement ciblé, et un renforcement de ce que le discounter ne sait pas faire (le conseil, les végétaux, éventuellement la livraison) ; une bonne copie note que les estimations de fuite de l'étude sont elles-mêmes incertaines et qu'un test sur une jardinerie permettrait de les vérifier.",
  },
  evaluation: [
    "Le coût de la baisse générale est posé sur la bonne assiette (la base enlevée des artisans et des PME) et lu comme une perte de marge à volumes constants.",
    "La riposte est justifiée par une mesure de l'exposition par segment, par gamme et par zone, et non par le chiffre d'affaires total ou par la menace affichée.",
    "La réaction probable du concurrent est prise en compte : l'étudiant explique pourquoi une baisse large et visible a plus de chances d'être suivie.",
    "Le choix entre engagement et test est argumenté par le coût de l'information et par la probabilité d'adoption, et la cible est révisée au vu des premiers chiffres par segment.",
    "L'étudiant distingue, sur le bilan des 30 tirages, la qualité d'une décision de son résultat sous le tirage de la classe.",
  ],
  vigilance:
    "Le trimestre est valorisé par sa marge plus une seule année au régime atteint en semaine 13, sans actualisation ni valeur au-delà, alors que la location des camions court sur trois ans et qu'une guerre des prix pèse plusieurs années : un enseignant de stratégie voudra le dire. Les probabilités (quatre chances sur dix que Tarval vise la part de marché, adoption une fois sur deux, suivi selon l'ampleur de la baisse) sont annoncées par les sources, ce qu'aucun directeur ne connaît aussi nettement, et la pression sur le fabricant est réduite à une plainte probable et une provision, sans l'analyse juridique de l'abus de dépendance économique.",
};
