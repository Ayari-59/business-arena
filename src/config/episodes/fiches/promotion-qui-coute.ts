import type { FicheEnseignant } from "./types";

/**
 * FICHE ENSEIGNANT · ÉPISODE 102, LA PROMOTION QUI REMPLIT LES CADDIES.
 *
 * Une démonstration de la Découverte (config/episodes/demos.ts) : la marge
 * incrémentale d'une promotion, la cannibalisation et les achats avancés, la
 * mesure par magasins témoins et le plafond légal des promotions. Les
 * chiffres du hasard de la classe sont ceux de la graine 16, les moyennes
 * celles des 30 tirages du bilan.
 */
export const FICHE: FicheEnseignant = {
  code: "promotion-qui-coute",
  formations: ["but-tc", "bts-mco"],
  programme: [
    "BUT TC · Conduire les actions marketing",
    "BUT TC · Participer à la stratégie marketing et commerciale de l'organisation",
    "BTS MCO · Bloc 2, Animer et dynamiser l'offre commerciale",
  ],
  notion:
    "Le pic de ventes d'une promotion n'est pas son gain. Chaque pack vendu de plus vient de quelque part : des autres produits de la marque (la cannibalisation), d'achats que les habitués avancent et ne feront pas les semaines suivantes, ou de nouveaux acheteurs ; seuls les derniers ajoutent de la marge, et la remise porte aussi sur tout ce qui se serait vendu sans elle. Une promotion se juge donc à sa marge incrémentale : ce qu'elle rapporte de plus qu'une période sans elle. L'erreur classique consiste à la juger à son volume, en comparant la semaine d'opération à celle d'avant, puis à doubler ce qui « marche ». Dans l'épisode, les « 2 achetés, le 3e offert » sur les yaourts aux fruits Kerbrélan font +180 % de ventes chez Celtis, et le directeur commercial veut doubler les opérations de l'été pour reprendre des parts de marché à Nordal. La carte de fidélité montre que, sur les packs de plus, 30 % sont pris aux autres yaourts de la marque, 45 % sont des achats avancés et 25 % viennent de nouveaux acheteurs qui ne rachètent pas : l'opération de deux semaines perd 27 k€ de marge. L'élève découvre qu'une promotion rentable se choisit (la référence qui recrute, une remise juste assez forte), qu'elle se teste avec des magasins témoins avant d'être généralisée, et que la loi plafonne la remise à 34 % et le volume vendu en promotion à 25 % du volume annuel.",
  objectifs: [
    "Je décompose les ventes supplémentaires d'une promotion en cannibalisation, achats avancés et nouveaux acheteurs.",
    "Je calcule la marge incrémentale d'une opération : la marge des packs vendus en promotion, moins celle qu'auraient faite sans elle la base, les références cannibalisées et les achats avancés, moins les frais de l'opération.",
    "Je choisis une mesure qui sépare les nouveaux acheteurs des achats avancés (magasins témoins, panel) plutôt qu'une comparaison avant-après.",
    "Je réponds à une promotion concurrente ou à une demande d'enseigne en comparant ce que la remise coûte sur les ventes acquises à ce qu'elle protège, dans les limites du plafond légal.",
  ],
  prerequis:
    "La marge sur coût variable unitaire et le calcul d'une remise doivent être acquis. La cannibalisation, les achats avancés et la marge incrémentale peuvent être découverts pendant la séance ; le plafond légal des promotions (34 % de remise, 25 % du volume annuel) est donné par une source de l'épisode.",
  dureeMinutes: 120,
  deroule: [
    {
      minutes: 10,
      titre: "Lancement",
      detail:
        "Vous envoyez le lien /entreprises/episode/promotion-qui-coute?hasard=16 : toute la classe joue le même trimestre, sous les mêmes aléas. Les élèves jouent seuls ou en binôme. Sans licence, la démonstration se joue au niveau Découverte : un repère de méthode accompagne chaque étape, et chaque décision montre aussitôt ce qu'elle a changé par rapport à ne rien changer. Vous présentez la marque en deux phrases (des yaourts, des promotions qui font +180 %) sans parler de marge incrémentale, et vous demandez de noter sur papier le compte de l'opération de Celtis fait en semaine 1 et le plan proposé pour mai et juin.",
    },
    {
      minutes: 40,
      titre: "Le trimestre",
      detail:
        "Les élèves jouent les six décisions et lisent leur bilan. Vous circulez sans corriger, et vous relevez le plan de la semaine 1 (doubler, tenir le plan signé, recentrer sur le Brassé ou baisser la remise) et la réponse à Nordal en semaine 8. Aux plus rapides, vous demandez de rejouer en changeant la seule décision de la semaine 2 : le test d'Opaline ou l'avant-après.",
    },
    {
      minutes: 20,
      titre: "Correction du calcul de la semaine 1",
      detail:
        "Vous affichez les estimations et vous les rangez : au-dessus de zéro (le volume, ou la marge des seuls packs vendus), autour de −27 k€, et entre les deux (une partie seulement de ce qui se serait vendu sans l'opération). Vous reconstruisez le compte au tableau en trois colonnes : ce que l'opération a vendu, ce qui se serait vendu sans elle (la base, les packs pris aux autres yaourts, les achats avancés), les frais. Vous faites dire pourquoi seuls les nouveaux acheteurs ajoutent de la marge, et pourquoi la remise coûte aussi sur les 24 000 packs de la base.",
    },
    {
      minutes: 25,
      titre: "Les décisions où la classe s'est partagée",
      detail:
        "Partez de la semaine 1 : faites défendre le doublement et le recentrage sur le Brassé par un élève qui l'a choisi. Faites lire la source du plafond légal (142 000 packs restants chez Celtis pour mai à juillet, dont environ 140 000 déjà pris par le plan) : doubler n'était pas seulement coûteux, c'était en grande partie impossible. Enchaînez sur la riposte à Nordal : un « 2+1 » sur toute la gamme porterait la remise sur environ 135 000 packs qui se seraient vendus de toute façon, plus de 60 k€, pour une attaque qui coûte de 8 à 25 k€.",
    },
    {
      minutes: 15,
      titre: "Le bilan des 30 tirages",
      detail:
        "Sous le tirage n° 16, « Juger chaque opération sur sa marge » finit à −61 k€ de marge incrémentale, « Doubler et riposter » à −223 k€, et le plan signé, tenu tel quel, à −233 k€ : la bonne méthode perd 172 k€ de moins que le plan. Sur les trente tirages, elle ne finit au-dessus de zéro que 7 fois, pour −41 k€ en moyenne, contre −204 k€ pour « Doubler et riposter ». Vous faites constater que, sous ce tirage, le Brassé n'a pas recruté : c'est ce que le test d'Opaline permettait de savoir avant juillet.",
    },
    {
      minutes: 10,
      titre: "Synthèse",
      detail:
        "Vous écrivez au tableau le compte d'une opération en une ligne (marge des packs vendus, moins la marge qu'auraient faite la base, les références cannibalisées et les achats avancés, moins les frais) et les trois questions à poser avant toute promotion : d'où viendront les packs de plus, comment le mesurer, combien il reste sous le plafond. Le prolongement peut être donné en travail personnel.",
    },
  ],
  calcul: {
    reponse: -27.12,
    etapes: [
      "Source « Faire décomposer par Folake Adebayo l'opération de mars » : hors promotion, 12 000 packs de fruits par semaine chez Celtis ; pendant les deux semaines d'opération, 33 600 (+180 %). Base : 24 000 packs ; packs de plus : 2 × 21 600 = 43 200 ; volume vendu en promotion : 67 200.",
      "Source « Reprendre avec Rufin Sévellec le compte d'une opération » : 0,65 € de marge sur coût variable par pack ; dans le « 2+1 », la laiterie rembourse le pack offert, soit un tiers du prix net de 1,30 € (0,43 €) sur chaque pack vendu, et paie 0,03 € de logistique. Il reste 0,65 − 0,433 − 0,03 ≈ 0,187 € par pack ; marge des packs vendus : 67 200 × 0,187 ≈ 12 544 €.",
      "Ce qui se serait vendu sans l'opération, à 0,65 € de marge : la base (24 000 packs), les achats avancés (45 % de 43 200, soit 19 440 packs que les habitués n'achèteront pas les semaines suivantes) et les packs pris aux autres yaourts Kerbrélan (30 %, soit 12 960). (24 000 + 19 440 + 12 960) × 0,65 = 56 400 × 0,65 = 36 660 €. Seuls les 25 % de nouveaux acheteurs (10 800 packs) sont un vrai supplément, et ils ne rachètent pas.",
      "Marge incrémentale = 12 544 − 36 660 − 3 000 de participation au prospectus = −27 116 €, soit −27,1 k€. Avec la marge arrondie de la source (0,19 €), on trouve −26,9 k€, que l'épisode accepte : il juge juste à 3 k€ près, proche à 8.",
      "Le chiffre ne dépend pas du hasard : toute la classe doit trouver la même valeur. Une opération qui fait +180 % de ventes perd 27 k€ : c'est le chiffre qui condamne le doublement.",
    ],
    erreurs: [
      {
        valeur: 9.54,
        cause:
          "La marge des seuls packs vendus en promotion, prospectus déduit (12 544 − 3 000) : on oublie que la base, les achats avancés et les packs pris aux autres yaourts se seraient vendus sans remise.",
      },
      {
        valeur: -6.06,
        cause:
          "Seule la base retirée (12 544 − 24 000 × 0,65 − 3 000) : on traite tous les packs de plus comme un vrai supplément, alors que les trois quarts se seraient vendus sans l'opération, plus tard ou sous une autre référence.",
      },
      {
        valeur: -14.48,
        cause:
          "Les achats avancés oubliés (12 544 − (24 000 + 12 960) × 0,65 − 3 000) : on retire la cannibalisation, mais pas le creux des trois semaines qui suivent, que les habitués ont acheté d'avance.",
      },
    ],
  },
  reflexes: [
    {
      decision: 0,
      option: 0,
      pourquoi:
        "+180 % de ventes, deux points de part de marché pris par Nordal, et des centrales qui attendent : si une opération marche, deux fois plus d'opérations sur toute la gamme devraient marcher deux fois plus.",
      ceQuiLeDejoue:
        "Le compte d'une opération montre qu'un « 2+1 » sur les fruits perd 27 k€ : le doubler double surtout la perte. Et la source du plafond légal le rend en grande partie impossible : chez Celtis, il reste 142 000 packs sous les 25 % pour mai à juillet, et le plan signé en prend déjà environ 140 000 ; les centrales refusent ce qui dépasse. Rejoué sur les trente tirages à la place du recentrage sur le Brassé, le doublement perd 121 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 1,
      option: 1,
      pourquoi:
        "C'est gratuit, c'est la méthode habituelle, et les chiffres de chaque opération arrivent dès le lundi suivant.",
      ceQuiLeDejoue:
        "Comparer la semaine d'opération à celle d'avant compte comme gain les packs pris aux autres références et ceux qui manqueront les semaines suivantes ; et le Brassé fait la même hausse en rayon qu'il recrute de nouveaux acheteurs ou qu'il déplace ceux des fruits, une fois sur deux chacune. Le test d'Opaline, 2 500 €, le dit avant juillet. Quand le Brassé recrute, l'avant-après fait mieux que le test de ces 2,5 k€ ; quand il ne recrute pas, il perd le plus souvent de 13 à 15 k€ (13,4 k€ sous le tirage de la classe). Rejoué sur les trente tirages, il fait mieux 16 fois et perd pourtant 4,8 k€ en moyenne.",
    },
    {
      decision: 3,
      option: 0,
      pourquoi:
        "Le « 2+1 » en une du prospectus de Celtis, c'est ce qui fait l'été, et les trois enseignes attendent la réponse : confirmer ne demande rien.",
      ceQuiLeDejoue:
        "Le chiffrage de Rufin pour juillet est sans appel : le « 2+1 » sur les fruits perdrait environ 30 k€ chez Celtis sur les deux semaines, creux compris. Garder les emplacements, avec la mécanique que les chiffres justifient ou des dégustations sans remise à 3 000 € par enseigne, évite la perte sans rendre la place à Nordal. Rejoué sur les trente tirages à la place de cette option, confirmer perd 100 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 3,
      option: 3,
      pourquoi:
        "Les opérations perdent de l'argent : les annuler toutes paraît la conclusion logique de ce qu'on vient d'apprendre.",
      ceQuiLeDejoue:
        "La source sur les opérations annulées le dit : l'emplacement rendu, la centrale le propose aussitôt à Nordal, qui y fait son « 2+1 » à la place de Kerbrélan et lui prend des ventes pendant deux semaines ; la participation au prospectus de Celtis reste due. Garder les emplacements sans remise, avec des dégustations, protège le rayon pour 3 000 € par enseigne. Rejoué sur les trente tirages à la place de cette option, annuler perd 40 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 4,
      option: 0,
      pourquoi:
        "Nordal attaque en « 2+1 » sur tous ses yaourts chez Celtis et Opaline : sans riposte, dit le directeur commercial, on perd en trois semaines ce qu'on a mis un an à gagner.",
      ceQuiLeDejoue:
        "En février, l'attaque de Nordal a pris 16 % des ventes pendant trois semaines et 6 % la semaine suivante, puis tout est revenu, à un acheteur sur sept près ; et une fois sur deux, Nordal est en rupture la deuxième semaine. La riposte porterait la remise sur environ 135 000 packs qui se seraient vendus de toute façon, plus de 60 k€, pour une attaque qui coûte de 8 à 25 k€ ; tenir le rayon coûte 6 000 €. Rejouée sur les trente tirages à la place de cette option, la riposte perd 92 k€ en moyenne et ne fait jamais mieux.",
    },
    {
      decision: 5,
      option: 0,
      pourquoi:
        "34 %, c'est le maximum que la loi permet, en une du prospectus, et la tête de gondole de la rentrée vient avec : l'offre paraît imbattable.",
      ceQuiLeDejoue:
        "La centrale ne signera que ce qui tient sous le plafond : l'opération prendrait environ 146 000 packs, et si rien ne tient, l'échange tombe. Sur un pack de fruits, −34 % ne laisse que 0,18 € de marge, les habitués stockent pour la rentrée, et au-delà de 20 % du volume annuel en promotion, chaque point de plus coûte environ 2 660 € de marge. La tête de gondole, qui vaut environ 9 400 €, s'obtient d'ordinaire contre des dégustations du Brassé à 6 000 €. Rejouée sur les trente tirages à la place de cette contre-proposition, l'acceptation perd 36 k€ en moyenne et ne fait jamais mieux.",
    },
  ],
  debrief: [
    "+180 % de ventes et 27 k€ de marge perdue : comment les deux peuvent-ils être vrais en même temps ? D'où vient chaque pack de plus, et lequel des trois ajoute de la marge ?",
    "Pourquoi la remise du « 2+1 » coûte-t-elle aussi sur les 24 000 packs de la base ? Qu'aurait changé une remise de 20 % au lieu d'un tiers ?",
    "Sous le tirage n° 16, le Brassé n'a pas recruté : il a surtout pris aux fruits. Ceux qui ont lancé le test d'Opaline l'ont su en semaine 6 ; les autres ont vu la même hausse en rayon. Comment deux opérations qui font la même hausse des ventes peuvent-elles avoir des marges de signe opposé ?",
    "Juger avant-après fait mieux que le test sur 16 tirages sur 30, et perd pourtant 4,8 k€ en moyenne. Pourquoi ? Que paie-t-on quand on paie une mesure ?",
    "Doubler les opérations était-il seulement coûteux, ou aussi impossible ? Qu'est-ce que le plafond de 25 % du volume annuel change à la façon de choisir ses opérations ?",
    "Toutes les méthodes finissent sous zéro sous le tirage n° 16, la meilleure à −61 k€. Un trimestre de promotions qui perd de la marge est-il un échec ? À quoi faut-il comparer le résultat ?",
    "Quelle règle gardez-vous pour décider une promotion ? Formulez-la en une phrase, avec la mesure dedans.",
  ],
  prolongement: {
    enonce:
      "Un fabricant de biscuits vend à une enseigne 10 000 paquets par semaine d'une référence, au prix net de 2,00 €, pour un coût variable de 1,20 €. Il prépare une opération « le 2e à −50 % » d'une semaine : la remise vaut en moyenne 25 % du prix net sur chaque paquet vendu en promotion, la logistique 0,05 € par paquet, la participation au prospectus 2 000 €. L'enseigne prévoit 22 000 paquets vendus pendant la semaine. Un test avec des magasins témoins montre que, sur les paquets de plus, 20 % sont pris aux autres biscuits de la marque (même marge sur coût variable), 50 % sont des achats avancés et 30 % viennent de nouveaux acheteurs. 1) Calculez la marge sur coût variable d'un paquet au prix normal et d'un paquet vendu en promotion. 2) Calculez la marge incrémentale de l'opération. 3) Le commercial juge l'opération sur la hausse des ventes, semaine d'opération contre semaine d'avant, en valorisant les paquets de plus à la marge du prix normal, prospectus déduit : quel gain annonce-t-il ? 4) Chaque nouvel acheteur rachèterait 0,8 paquet au prix normal dans les six semaines : la marge incrémentale devient-elle positive ?",
    corrige:
      "1) Au prix normal : 2,00 − 1,20 = 0,80 € ; en promotion : 0,80 − 0,25 × 2,00 − 0,05 = 0,25 €. 2) Base 10 000 paquets, paquets de plus 12 000 ; marge des paquets vendus : 22 000 × 0,25 = 5 500 € ; marge qu'auraient faite sans l'opération la base, les achats avancés et les paquets pris aux autres biscuits : (10 000 + 6 000 + 2 400) × 0,80 = 14 720 € ; marge incrémentale = 5 500 − 14 720 − 2 000 = −11 220 €. 3) 12 000 × 0,80 − 2 000 = 7 600 € de gain annoncé, soit 18 820 € d'écart avec la réalité. 4) 30 % de 12 000 = 3 600 paquets de nouveaux acheteurs ; rachats : 3 600 × 0,8 = 2 880 paquets à 0,80 €, soit 2 304 € ; −11 220 + 2 304 = −8 916 € : l'opération reste perdante.",
  },
  evaluation: [
    "La marge incrémentale de l'opération de Celtis est calculée en distinguant les trois origines des packs de plus, avec les chiffres des sources nommées, et l'écart entre l'estimation déposée et −27,1 k€ est expliqué.",
    "L'élève explique pourquoi une comparaison avant-après surestime le gain d'une promotion, et ce qu'une mesure avec magasins témoins apporte de plus.",
    "Chaque réponse à Nordal et à Celtis est justifiée par la comparaison de ce que la remise coûte sur les ventes acquises et de ce qu'elle protège, plafond légal compris.",
    "L'élève distingue, sur une de ses décisions, la qualité du choix lue sur les trente tirages et le résultat obtenu sous le tirage n° 16.",
  ],
  vigilance:
    "Les parts de la décomposition (30 % de cannibalisation, 45 % d'achats avancés, 25 % de nouveaux acheteurs qui ne rachètent pas) sont celles de l'opération de mars, pas une loi générale. La remise d'un « 2+1 » y est comptée au tiers du prix net sur chaque pack vendu, et le plafond légal à 34 % de remise et à 25 % du volume annuel prévu à la convention de chaque enseigne : un enseignant de droit commercial voudra peut-être préciser les règles en vigueur et leurs exceptions.",
};
