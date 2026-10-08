/**
 * LA PROMOTION QUI REMPLIT LES CADDIES — le contenu de l'épisode.
 *
 * Morwenna Pellen est cheffe de marque des yaourts Kerbrélan à la Laiterie de
 * Kerbrélan. Les opérations « 2 achetés, le 3e offert » font bondir les ventes
 * de 180 % pendant les semaines de promotion, et le directeur commercial veut
 * en doubler le nombre pour reprendre des parts de marché au Groupe Nordal. De
 * mai à juillet, elle propose les opérations de l'été aux trois enseignes,
 * choisit comment les mesurer, comment les annoncer à l'usine, et répond à
 * Nordal puis à Celtis. Six décisions, chacune précédée de ce qu'une cheffe
 * de marque reçoit vraiment.
 *
 * Tous les chiffres des sources sont tirés des constantes du modèle
 * (src/engine/episodes/promotion-qui-coute.ts) ; le test de l'épisode en
 * recalcule plusieurs.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, enseignes, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

const HADDADI = { de: "Baptistin Haddadi", role: "Directeur commercial" } as const;
const DANIELOU = {
  de: "Herveline Daniélou",
  role: "Directrice marketing et innovation",
} as const;
const BESCOND = { de: "Ysée Bescond", role: "Responsable supply chain" } as const;
const KEREBEL = { de: "Gurvan Kerebel", role: "Responsable de production, Loudéac" } as const;
const LEFEUVRE = { de: "Naïm Lefeuvre", role: "Directeur des grands comptes et des MDD" } as const;
const ADEBAYO = { de: "Folake Adebayo", role: "Chargée d'études marketing" } as const;
const MAINGUENE = {
  de: "Cyrielle Mainguené",
  role: "Acheteuse produits laitiers frais, centrale d'achat de Celtis",
} as const;
const LARVOR = { de: "Tiémoko Larvor", role: "Chef de groupe ultra-frais, Opaline" } as const;
const GOURVENNEC = { de: "Arzhela Gourvennec", role: "Cheffe de secteur, Celtis" } as const;
const TABLEAU = { de: "Tableau de bord de la marque", role: "Point hebdomadaire" } as const;

export const DIAGNOSTICS = [
  {
    id: "decomposition",
    t: "Le pic de ventes n'est pas un gain : les packs de plus sont pris aux autres yaourts de la marque ou aux semaines suivantes, et la remise porte sur tout ce qui se serait vendu sans elle. Le « 2+1 » sur les fruits perd de la marge à chaque opération",
  },
  {
    id: "remise",
    t: "La remise du « 2+1 » est trop profonde : avec une remise plus faible, les mêmes opérations deviendraient rentables",
  },
  {
    id: "frequence",
    t: "Kerbrélan ne fait pas assez d'opérations : Nordal prend des parts de marché pendant que nos yaourts restent au prix normal",
  },
  {
    id: "execution",
    t: "Les opérations sont rentables, mais la casse et les ruptures en mangent le gain : c'est l'exécution qui pèche",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Doubler les opérations de l'été ?",
    jusqua: 2,
    messages: () => [
      {
        ...HADDADI,
        heure: "07:50",
        alerte: true,
        texte:
          "Morwenna, les chiffres de mars sont tombés : +180 % sur les fruits chez Celtis pendant le « 2 achetés, le 3e offert ». Nordal nous a pris deux points de part de marché au rayon ultra-frais depuis janvier. Pour l'été, je veux doubler : toute la gamme, et deux fois plus d'opérations dans les trois enseignes. Il me faut ton plan de mai-juin vendredi, les centrales attendent.",
      },
      {
        ...DANIELOU,
        heure: "08:40",
        texte:
          "Morwenna, le trimestre de mai à juillet est celui des yaourts : la consommation monte avec l'été. Le comité de direction jugera nos promotions sur la marge qu'elles rapportent, pas sur les volumes, et Iwan veut savoir ce que chaque opération gagne vraiment. Garde aussi un œil sur le Brassé fermier, lancé en mars : Celtis le passera en revue de gamme en septembre.",
      },
      {
        ...BESCOND,
        heure: "09:15",
        texte:
          "Pour info : l'opération de mars chez Celtis nous a laissé plus de 10 000 packs déclassés. Les commerciaux l'avaient annoncée à l'usine à +250 % ; elle a fait +180 %.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "sorties",
        titre:
          "Faire décomposer par Folake Adebayo l'opération de mars chez Celtis (sorties de caisse et carte de fidélité)",
        cout: 1.5,
        nature: "decisive",
        resultat:
          "Opération « 2 achetés, le 3e offert » de mars sur les fruits chez Celtis, deux semaines. Hors promotion, le pack de fruits s'y vend à 12 000 exemplaires par semaine ; pendant l'opération, à 33 600 (+180 %). Sur les 21 600 packs de plus par semaine, la carte de fidélité de Celtis montre que 30 % ont été pris aux autres yaourts Kerbrélan (nature, aromatisés, Brassé), que 45 % sont des achats avancés par les acheteurs habituels, qui ont acheté d'autant moins les trois semaines suivantes, et que 25 % viennent de nouveaux acheteurs, pour la plupart des clients de Nordal, qui n'ont pas racheté au prix normal ensuite.",
      },
      {
        id: "compte",
        titre: "Reprendre avec Rufin Sévellec le compte d'une opération",
        cout: 1,
        nature: "decisive",
        resultat:
          "Un pack de fruits est facturé 1,30 € net à l'enseigne ; son coût variable (lait, préparation de fruits, pot, opercule, énergie, main-d'œuvre directe) est de 0,65 €, soit 0,65 € de marge sur coût variable. Les autres yaourts de la gamme ont la même marge ; le Brassé fermier, facturé 1,60 €, en dégage 0,85 €. Dans le « 2+1 », la laiterie rembourse à l'enseigne le pack offert à son prix net : 0,43 € de remise sur chaque pack vendu pendant l'opération. S'y ajoutent 0,03 € de logistique par pack vendu en promotion (préparation, livraisons, palettes de mise en avant) et 3 000 € de participation au prospectus par opération. Il reste 0,19 € de marge sur un pack de fruits vendu en « 2+1 ».",
      },
      {
        id: "plafond",
        titre: "Vérifier avec Naïm Lefeuvre ce que permet le plafond légal",
        cout: 0.5,
        nature: "utile",
        resultat:
          "La loi plafonne la remise à 34 % et le volume vendu en promotion à 25 % du volume annuel prévu à la convention de chaque enseigne. Chez Celtis, le plafond est de 325 000 packs sur l'année : 128 000 ont été vendus en promotion de janvier à avril, 55 000 sont réservés au plan d'août à décembre. Il en reste 142 000 pour mai à juillet, et les deux « 2+1 » du plan en prennent environ 140 000. Opaline et Proxival sont dans le même cas. Les centrales, elles aussi en infraction au-delà, refuseront ce qui dépasse.",
      },
      {
        id: "lait",
        titre: "Demander à Hoel Quiniou où en est la collecte",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "C'est le pic de printemps : la collecte de mai dépasse de 15 % celle de l'hiver, et l'excédent part en lait spot à 290 € les 1 000 litres, quand nous le payons 460 € aux producteurs. Baptistin dit que les promotions « écoulent le lait de mai ». Un pack de quatre pots contient un demi-litre de lait.",
      },
      {
        id: "conseil",
        titre: "Appeler Mona Uguen, ancienne cheffe de marque passée chez un biscuitier",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Mona : « Un pic de ventes, ce sont des packs qui viennent de quelque part. Avant de compter ce qu'une opération vend, compte ce qu'elle prend : aux autres produits de la marque, aux semaines qui suivent, et la remise sur chaque pack qui se serait vendu sans elle. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Quel plan d'opérations proposez-vous pour mai et juin ?",
    options: [
      {
        t: "Doubler, comme le demande Baptistin : le « 2+1 » sur toute la gamme, et trois opérations de plus",
        d: "Six opérations en mai-juin au lieu de trois, chacune sur tous les yaourts Kerbrélan. Les centrales doivent les accepter sous leur plafond.",
      },
      {
        t: "Tenir le plan signé : trois « 2+1 » sur les fruits",
        d: "Celtis en semaines 3 et 4, Proxival en 5 et 6, Opaline en 7 et 8. Rien à renégocier.",
      },
      {
        t: "Recentrer sur le Brassé : « le 2e à −40 % » à la place du « 2+1 » sur les fruits, aux mêmes dates",
        d: "Une remise de 20 % sur la référence lancée en mars, que la plupart des clients n'ont pas encore goûtée. Celtis doit accepter de changer le prospectus de la semaine 3.",
      },
      {
        t: "Garder les trois opérations sur les fruits, mais en « 2e à −40 % »",
        d: "Une remise de 20 % au lieu de 33 %, sur les mêmes packs, aux mêmes dates.",
      },
    ],
    reactions: [
      [
        {
          ...LEFEUVRE,
          texte:
            "J'envoie les avenants aux trois centrales. Celtis m'a déjà prévenu : son service juridique vérifie chaque opération contre le plafond des 25 %.",
        },
      ],
      [
        {
          ...HADDADI,
          texte: "Bon. On tient le plan. Mais je reviendrai à la charge pour juillet.",
        },
      ],
      null,
      [
        {
          ...MAINGUENE,
          texte:
            "Une remise de 20 % sur les fruits, c'est moins accrocheur en prospectus, mais d'accord. Vos opérations restent à leurs dates.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Mesurer avant de généraliser",
    jusqua: 4,
    messages: () => [
      {
        ...HADDADI,
        heure: "09:00",
        alerte: true,
        texte:
          "Le prospectus de Celtis sort lundi. Pour juillet, on décidera sur les chiffres : les ventes de la semaine d'opération contre celles de la semaine d'avant, comme d'habitude. Pas besoin d'en faire une thèse.",
      },
      {
        ...LARVOR,
        heure: "11:20",
        texte:
          "Madame Pellen, nous pouvons vous ouvrir les données de notre carte de fidélité pour un test : 40 magasins avec opération en semaines 3 et 4, 40 magasins comparables sans, et le suivi des mêmes foyers jusqu'à la semaine 6. Il me faut votre réponse lundi.",
      },
      {
        ...ADEBAYO,
        heure: "14:05",
        texte:
          "L'institut de panel m'a envoyé son devis pour une étude de nos opérations du printemps. Je te le transmets avec le reste.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "temoins",
        titre: "Demander à Folake Adebayo ce que mesurerait le test d'Opaline",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Comparer la semaine d'opération à celle d'avant compte comme gain tout ce qui se vend de plus, y compris ce qui est pris aux autres références et ce qui manquera les semaines suivantes. Le test compare 40 magasins avec opération à 40 magasins semblables sans, et suit les mêmes foyers jusqu'à la semaine 6 : il sépare les nouveaux acheteurs des achats avancés. On peut tester les deux mécaniques à la fois, dans des magasins différents : le « 2+1 » sur les fruits, le « 2e à −40 % » sur le Brassé. Sur nos lancements passés, une remise sur un nouveau produit a recruté de nouveaux acheteurs une fois sur deux ; l'autre fois, elle a surtout déplacé ceux de nos autres yaourts, avec la même hausse des ventes en rayon. Coût : 2 500 € de données.",
      },
      {
        id: "avantapres",
        titre: "Relire le bilan commercial de l'opération de mars",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Bilan des commerciaux : « +180 % de ventes sur les fruits chez Celtis, 21 600 packs de plus par semaine, 27 040 € de chiffre d'affaires net en plus sur les deux semaines. Opération très réussie, à reconduire et à étendre. »",
      },
      {
        id: "panel",
        titre: "Lire le devis de l'institut de panel",
        cout: 0.5,
        nature: "utile",
        resultat:
          "L'institut suit 12 000 foyers toute l'année. Il peut décomposer chacune de nos opérations du printemps, y compris celle de lancement du Brassé en mars : achats avancés, cannibalisation, nouveaux acheteurs, rachats. Pas de magasins témoins, mais un an d'historique par foyer. 14 000 €, résultats en semaine 6.",
      },
    ],
    question: "Comment saurez-vous ce que rapporte une opération avant de décider juillet ?",
    options: [
      {
        t: "Lancer le test avec Opaline : 40 magasins testés, 40 témoins, les deux mécaniques",
        d: "2 500 € de données ; résultats en semaine 6, avant les opérations de juillet.",
      },
      {
        t: "Juger comme d'habitude : les ventes de la semaine d'opération contre celles de la semaine d'avant",
        d: "Gratuit, et les chiffres de chaque opération dès le lundi suivant.",
      },
      {
        t: "Commander l'étude de panel sur toutes les opérations du printemps",
        d: "14 000 € ; résultats en semaine 6.",
      },
    ],
    reactions: [
      [
        {
          ...LARVOR,
          texte:
            "C'est parti : 40 magasins en Bretagne et en Pays de la Loire, 40 témoins de même taille et de même clientèle. Vous aurez les résultats en semaine 6.",
        },
      ],
      [
        {
          ...HADDADI,
          texte: "Parfait. Lundi en huit, on aura les chiffres de Celtis.",
        },
      ],
      [
        {
          ...ADEBAYO,
          texte: "Commande passée. L'institut livre en semaine 6.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Les volumes annoncés à l'usine",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...BESCOND,
        heure: "08:30",
        alerte: true,
        texte: ctx.brasseC1
          ? `L'opération de Celtis est finie. Le Brassé avait été annoncé à l'usine à +${ctx.annonceC1} % ; il s'est vendu à +${ctx.liftC1} %. ${ctx.ruptureC1} packs ont manqué en rayon, et Celtis nous applique ses pénalités logistiques.`
          : `L'opération de Celtis est finie : annoncée à l'usine à +${ctx.annonceC1} %, vendue à +${ctx.liftC1} %. ${ctx.casseC1} packs n'ont pas trouvé preneur à temps : déclassés, une partie donnée à la banque alimentaire.`,
      },
      {
        ...KEREBEL,
        heure: "10:10",
        texte:
          "Mes lignes produisent ce qu'on nous annonce. Avec trente jours de DLC et des enseignes qui exigent les deux tiers à réception, je n'ai pas dix jours pour écouler un surplus.",
      },
      {
        ...HADDADI,
        heure: "11:45",
        texte:
          "Mieux vaut trop que pas assez : une rupture en pleine opération, l'enseigne ne nous le pardonne pas.",
      },
    ],
    sources: [
      {
        id: "annonces",
        titre: "Comparer avec Ysée Bescond les volumes annoncés et vendus des dernières opérations",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sur nos dix dernières opérations, les commerciaux ont annoncé à l'usine +250 % sur les « 2+1 », vendus à +180 % en moyenne ; sur le Brassé ou une remise plus faible, ils annoncent prudemment +100 % ou +120 %. Leur chiffre est un objectif, pas une prévision. D'une opération à l'autre, la hausse réelle s'écarte encore d'environ 12 % de la moyenne mesurée. Un pack en trop : 40 % partent dans les commandes suivantes, le reste est déclassé, 0,60 € le pack. Un pack qui manque : 0,40 € de pénalités et de ventes perdues sur un « 2+1 », 1,10 € sur le Brassé, où c'est un nouvel acheteur qui ne goûtera pas le produit.",
      },
      {
        id: "dlc",
        titre: "Faire le point avec Annaïg Le Dantec sur les dates et les dons",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Nos yaourts ont trente jours de DLC, et les enseignes exigent d'en recevoir au moins les deux tiers : un pack doit quitter Loudéac dans les dix jours qui suivent sa fabrication. Passé ce délai, il est déclassé, vendu à un déstockeur ou donné à la banque alimentaire ; jamais livré en rayon avec une date trop courte. Chaque palette garde son numéro de lot : on sait ce qui a été donné, et à qui.",
      },
      {
        id: "pic",
        titre: "Demander à Ysée ce que demanderait une prévision partagée",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Une heure chaque lundi avec la marque et les commerciaux. La prévision part des hausses mesurées en sortie de caisse, opération par opération, avec 4 % de sécurité. Les données hebdomadaires des trois enseignes : 2 500 € pour l'été. Il faut deux semaines pour la mettre en place : elle vaudrait pour les opérations qui démarrent à partir de la semaine 7.",
      },
    ],
    question: "Comment fixez-vous désormais les volumes des opérations ?",
    options: [
      {
        t: "Confier la prévision à la supply chain, à partir des hausses mesurées, revue chaque lundi",
        d: "Une heure par semaine et 2 500 € de données ; 4 % de marge de sécurité. Pour les opérations à partir de la semaine 7.",
      },
      {
        t: "Produire 20 % au-dessus des volumes annoncés par les commerciaux, pour ne jamais rompre",
        d: "Plus de stock à chaque opération ; ce qui ne part pas à temps est déclassé.",
      },
      {
        t: "Produire 10 % sous les volumes annoncés, pour limiter la casse",
        d: "Moins de packs à déclasser, et le risque de manquer en rayon.",
      },
      {
        t: "Garder le fonctionnement actuel",
        d: "Les commerciaux annoncent, l'usine produit.",
      },
    ],
    reactions: [
      [
        {
          ...BESCOND,
          texte:
            "Première réunion lundi à 9 h. Les commerciaux grincent : ils n'aiment pas qu'on « corrige » leurs chiffres.",
        },
      ],
      [
        {
          ...KEREBEL,
          texte:
            "On produira large. Annaïg prévient la banque alimentaire qu'il y aura des palettes.",
        },
      ],
      [
        {
          ...HADDADI,
          texte: "Si on rompt chez Celtis en pleine opération, c'est toi qui appelles l'acheteuse.",
        },
      ],
      [
        {
          ...BESCOND,
          texte: "Entendu. On continue comme avant.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Les opérations de juillet",
    jusqua: 8,
    messages: (ctx) => [
      ctx.mesure
        ? {
            ...ADEBAYO,
            heure: "09:30",
            alerte: true,
            texte: `${ctx.test ? "Résultats du test d'Opaline" : "Résultats de l'étude de panel"}. Le « 2+1 » sur les fruits : 45 % des packs de plus sont des achats avancés, 30 % sont pris aux autres yaourts Kerbrélan, 25 % viennent de nouveaux acheteurs, qui ne rachètent pas. Le « 2e à −40 % » sur le Brassé : même hausse en rayon, +200 %, mais ${
              ctx.recrute
                ? "70 % de nouveaux acheteurs ; chaque pack qu'ils ont acheté en a appelé 0,6 au prix normal dans les six semaines, et en appellera encore 0,8 d'ici la fin de l'année. Le Brassé recrute."
                : "45 % des packs sont pris aux fruits et 45 % sont des achats avancés ; un sur dix seulement vient d'un nouvel acheteur, qui ne rachète pas. Le Brassé déplace nos acheteurs plus qu'il n'en recrute."
            }`,
          }
        : {
            ...HADDADI,
            heure: "09:30",
            alerte: true,
            texte:
              "Les chiffres de nos opérations, semaine d'opération contre semaine d'avant : +180 % sur le « 2+1 », +200 % sur le Brassé. Tout marche, on continue.",
          },
      {
        ...MAINGUENE,
        heure: "11:00",
        texte: `La grande opération d'été est au plan en semaines 9 et 10 : le « 2+1 » ${
          ctx.double ? "sur toute la gamme" : "sur les fruits"
        }, en première page du prospectus. Confirmez-moi la mécanique avant mercredi ; Opaline et Proxival attendent la même réponse pour les semaines 11 et 12.`,
      },
      {
        ...DANIELOU,
        heure: "15:20",
        texte: `Rappel : à la revue de gamme de septembre, Celtis voudra voir le Brassé à 4 500 packs par semaine en moyenne sur les semaines 8 à 13. Il en est à ${ctx.rotation} sur les dernières semaines.`,
      },
    ],
    sources: [
      {
        id: "chiffrage",
        titre: "Chiffrer avec Rufin Sévellec chaque mécanique pour juillet",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Chez Celtis, sur les deux semaines de juillet : le « 2+1 » sur les fruits perdrait environ 30 k€, creux compris. Des dégustations sans remise coûtent 3 000 € par enseigne et font vendre un quart de Brassé de plus au prix normal. ${
            ctx.mesure
              ? ctx.recrute
                ? "Le « 2e à −40 % » sur le Brassé perdrait environ 2 k€ pendant l'opération et ses creux, mais ses nouveaux acheteurs rapporteraient environ 6 k€ de rachats d'ici fin juillet et 8 k€ ensuite."
                : "Le « 2e à −40 % » sur le Brassé perdrait environ 10 k€ : il ne recrute presque personne, et ce qu'il prend aux fruits se vend avec une remise."
              : "Pour le « 2e à −40 % » sur le Brassé, tout dépend de la part de nouveaux acheteurs, que la comparaison avant-après ne donne pas : de −10 k€ s'il déplace nos acheteurs à +11 k€ s'il en recrute, rachats compris."
          }`,
      },
      {
        id: "revue",
        titre: "Relire les règles de la revue de gamme de Celtis",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Celtis juge un nouveau produit sur ses ventes moyennes des six dernières semaines avant la revue (semaines 8 à 13), promotions comprises : il faut 4 500 packs par semaine. En dessous, le Brassé perd la moitié de ses magasins jusqu'à la revue suivante, en janvier : environ 34 k€ de marge. Il en vend aujourd'hui ${ctx.rotation} par semaine chez Celtis ; un « 2+1 » sur les fruits lui prend une partie de ses acheteurs.`,
      },
      {
        id: "emplacements",
        titre: "Demander à Naïm Lefeuvre ce que coûte une opération annulée",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Une opération annulée rend son emplacement à la centrale, qui le propose aussitôt à Nordal : il y fera son « 2+1 » à notre place, et nous prendra des ventes pendant ces deux semaines. La participation au prospectus de Celtis, déjà réservée, reste due.",
      },
    ],
    question: "Que faites-vous des opérations de juillet ?",
    options: [
      {
        t: "Confirmer les opérations de juillet telles qu'elles sont prévues",
        d: "Les « 2+1 » du plan : Celtis en semaines 9 et 10, Opaline et Proxival en 11 et 12.",
      },
      {
        t: "Passer au « 2e à −40 % » sur le Brassé si les chiffres montrent qu'il recrute ; sinon garder les emplacements avec des dégustations sans remise",
        d: "La mécanique se décide sur ce que vous savez des nouveaux acheteurs. Dégustations : 3 000 € par enseigne.",
      },
      {
        t: "Garder les emplacements sans remise : têtes de gondole et dégustations du Brassé dans les trois enseignes",
        d: "3 000 € par enseigne ; aucun prix barré.",
      },
      {
        t: "Annuler les opérations de juillet : elles perdent de l'argent",
        d: "Les emplacements sont rendus aux centrales. La participation au prospectus de Celtis reste due.",
      },
    ],
    reactions: [
      [
        {
          ...HADDADI,
          texte: "Bien. Le « 2+1 » en une du prospectus de Celtis, c'est ce qui fait l'été.",
        },
      ],
      [
        {
          ...MAINGUENE,
          texte:
            "Je prends note : la mécanique de juillet sera celle que vos chiffres justifient. Envoyez-moi la maquette lundi.",
        },
      ],
      [
        {
          ...MAINGUENE,
          texte:
            "Une tête de gondole sans prix barré en juillet… J'accepte, si vos dégustations font venir du monde.",
        },
      ],
      [
        {
          ...LEFEUVRE,
          texte:
            "J'ai prévenu les trois centrales. Celtis a proposé l'emplacement à Nordal dans l'heure.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Nordal attaque",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...GOURVENNEC,
        heure: "08:10",
        alerte: true,
        texte:
          "Le prospectus de Nordal pour les semaines 10 à 12 est tombé : « 2 achetés, le 3e offert » sur tous ses yaourts, chez Celtis et chez Opaline, en têtes de gondole.",
      },
      {
        ...HADDADI,
        heure: "09:05",
        texte:
          "On riposte : le « 2+1 » sur toute notre gamme, mêmes semaines, mêmes enseignes. Sinon on perd en trois semaines ce qu'on a mis un an à gagner.",
      },
      {
        ...LEFEUVRE,
        heure: "10:30",
        texte: `Pour mémoire, il nous reste sous le plafond légal ${ctx.placeCeltis} packs chez Celtis et ${ctx.placeOpaline} chez Opaline jusqu'à fin juillet.`,
      },
    ],
    sources: [
      {
        id: "fevrier",
        titre: "Revoir avec Folake Adebayo l'attaque de Nordal en février",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "En février, l'opération de Nordal chez Celtis nous a pris 16 % des ventes pendant ses trois semaines, et encore 6 % la semaine suivante, puis tout est revenu : nos habitués avaient acheté du Nordal en promotion, l'ont consommé, puis ont repris leurs habitudes. Environ un sur sept est resté chez Nordal. Selon l'ampleur de la campagne, une telle attaque prend entre 8 et 24 % de nos ventes. Et une fois sur deux, Nordal est en rupture la deuxième semaine : là où nos packs sont en rayon, les clients prennent les nôtres, environ 15 % de ventes en plus.",
      },
      {
        id: "riposte",
        titre: "Faire chiffrer une riposte par Rufin Sévellec",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Une riposte en « 2+1 » sur toute la gamme chez Celtis et Opaline, trois semaines : la remise porterait sur environ 135 000 packs qui se seraient vendus de toute façon, soit plus de 60 k€, et nos habitués stockeraient pour les semaines suivantes. L'attaque de Nordal, elle, nous coûtera de 8 à 25 k€ de marge si nous ne faisons rien, sans compter les acheteurs qu'il gardera.",
      },
      {
        id: "coupons",
        titre: "Demander à Tiémoko Larvor ce que permettent les cartes de fidélité",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Celtis et Opaline peuvent émettre en caisse, aux porteurs de carte qui achètent du Nordal, un bon de 0,50 € sur leur prochain pack Kerbrélan : 4 000 € de mise en place, puis 0,50 € par bon utilisé. Environ trois sur dix le sont. Le bon ne touche pas le prix de nos habitués.",
      },
    ],
    question: "Comment répondez-vous à Nordal ?",
    options: [
      {
        t: "Riposter : le « 2+1 » sur toute la gamme chez Celtis et Opaline, semaines 10 à 12",
        d: "Dans ce qui reste du plafond légal de chaque enseigne. Tous nos yaourts au même prix que ceux de Nordal.",
      },
      {
        t: "Ne pas suivre en prix : tenir le rayon",
        d: "Stocks de sécurité pour ne jamais manquer pendant l'attaque, dégustations dans 40 magasins : 6 000 €.",
      },
      {
        t: "Cibler les acheteurs de Nordal : un bon de 0,50 € sur Kerbrélan, émis en caisse",
        d: "4 000 € de mise en place, et 0,50 € par bon utilisé.",
      },
      {
        t: "Ne rien faire : l'attaque passera",
        d: "Aucune dépense.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...GOURVENNEC,
          texte:
            "Les stocks sont en place et les animatrices réservées. On sera là quand les rayons de Nordal se videront.",
        },
      ],
      [
        {
          ...LARVOR,
          texte:
            "Les bons partiront dès lundi aux porteurs de carte qui achètent du Nordal. Celtis fait de même.",
        },
      ],
      [
        {
          ...HADDADI,
          texte: "On regarde Nordal nous prendre nos clients, c'est ça ?",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "La proposition de Celtis",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...MAINGUENE,
        heure: "09:40",
        alerte: true,
        texte:
          "Madame Pellen, finissons juillet en beauté : −34 % sur tous les yaourts Kerbrélan en semaines 12 et 13, en une du prospectus. En échange, la tête de gondole de la rentrée est à vous. Il me faut votre réponse lundi.",
      },
      {
        ...HADDADI,
        heure: "10:15",
        texte: "34 %, c'est le maximum que la loi permet : imbattable. Signe.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Plafond légal chez Celtis : ${ctx.plafond} engagés. Part du volume annuel vendue en promotion, toutes enseignes, avec ce qui est engagé : ${ctx.partPromo}.`,
      },
    ],
    sources: [
      {
        id: "place",
        titre: "Vérifier avec Naïm Lefeuvre ce que la centrale pourra signer",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Il reste ${ctx.placeCeltis} packs sous le plafond chez Celtis. L'opération proposée en prendrait environ 146 000 : toute la gamme, deux semaines de juillet, +170 % de ventes. La centrale ne signera que ce qui tient dessous ; si elle ne peut rien signer, l'échange tombe. Sur un pack de fruits, −34 % laisse 0,18 € de marge, et les habitués stockent pour la rentrée.`,
      },
      {
        id: "habitude",
        titre: "Demander à Folake Adebayo ce que coûte l'habitude du prix promotionnel",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Le panel le montre sur d'autres marques : au-delà de 20 % du volume annuel vendu en promotion, les acheteurs attendent la suivante. Chaque point de plus fait perdre 0,3 % des ventes au prix normal pendant six mois, environ 2 660 € de marge pour nous. Avec ce qui est engagé, nous sommes à ${ctx.partPromo}.`,
      },
      {
        id: "gondole",
        titre: "Demander à Arzhela Gourvennec ce que vaut la tête de gondole",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Une tête de gondole à la rentrée, trois semaines sans remise : +40 % sur les fruits, environ 9 400 € de marge. Celtis l'accorde d'ordinaire contre une animation : des dégustations du Brassé dans 30 hypermarchés, 6 000 €, qui font aussi des ventes au prix normal.",
      },
    ],
    question: "Que répondez-vous à Celtis ?",
    options: [
      {
        t: "Accepter les −34 % sur toute la gamme",
        d: "Semaines 12 et 13, dans la limite du plafond ; la tête de gondole de la rentrée avec.",
      },
      {
        t: "Contre-proposer « le 2e à −40 % » sur les fruits",
        d: "Une remise de 20 % sur le seul pack de fruits, mêmes semaines ; l'échange tient.",
      },
      {
        t: "Refuser la remise, et proposer des dégustations du Brassé en échange de la tête de gondole",
        d: "30 hypermarchés en semaines 12 et 13, 6 000 € ; aucun prix barré.",
      },
      {
        t: "Refuser",
        d: "Pas d'opération de plus ; la tête de gondole ira à un autre fournisseur.",
      },
    ],
    reactions: [
      [
        {
          ...MAINGUENE,
          texte:
            "Je fais vérifier le volume par notre service juridique : vous aurez l'avenant demain.",
        },
      ],
      [
        {
          ...MAINGUENE,
          texte:
            "Moins spectaculaire, mais d'accord : le pack de fruits en page 2, et la tête de gondole pour vous.",
        },
      ],
      [
        {
          ...MAINGUENE,
          texte:
            "Des dégustations en pleine fin de saison… D'accord : la tête de gondole de la rentrée est à vous.",
        },
      ],
      [
        {
          ...MAINGUENE,
          texte: "Dommage. La tête de gondole de septembre ira à Nordal.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Juger chaque opération sur sa marge", chemin: [2, 0, 0, 1, 1, 2] },
  { nom: "Doubler et riposter", chemin: [0, 1, 1, 0, 0, 0] },
  { nom: "Attentiste", chemin: [1, 1, 3, 0, 3, 3] },
] as const;

/**
 * Les réflexes de qui juge une promotion à son volume : doubler les
 * opérations, mesurer par l'avant-après, confirmer le « 2+1 » de juillet,
 * tout annuler d'un coup quand on découvre qu'il perd de l'argent, riposter
 * en prix à Nordal, accepter les −34 %. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [1, 1],
  [3, 0],
  [3, 3],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  prospectusOui:
    "Va pour le Brassé en semaine 3 : la maquette du prospectus n'était pas bouclée. Le « 2e à −40 % » passera en page 4.",
  prospectusNon:
    "Trop tard pour la semaine 3 : le prospectus est à l'impression, avec le « 2+1 » sur les fruits. Je note le Brassé pour la prochaine fois.",
  nordalProlonge:
    "Nordal a vu notre riposte : il prolonge son « 2+1 » de trois semaines, jusqu'à la mi-août.",
  nordalArrete: "Nordal n'a pas bougé : son opération s'arrêtera en semaine 12, comme prévu.",
  prolonge:
    "Nordal prolonge son « 2+1 » de trois semaines chez Celtis et Opaline, jusqu'à la mi-août.",
  emplacements:
    "Celtis a donné notre emplacement de juillet à Nordal : son « 2+1 » est en une du prospectus des semaines 9 et 10. Opaline et Proxival ont fait de même pour les semaines 11 et 12.",
  capture:
    "Nordal est en rupture dans la moitié des magasins : ses têtes de gondole sont vides, et nos packs partent. Les stocks de sécurité tiennent.",
} as const;
