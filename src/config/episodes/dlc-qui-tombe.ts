/**
 * LES PALETTES QUI PÉRIMENT — le contenu de l'épisode.
 *
 * Ysée Bescond est la responsable supply chain de la Laiterie de Kerbrélan.
 * Elle établit le plan de production des yaourts aromatisés et des desserts
 * lactés de l'usine de Loudéac. Au printemps, la casse a coûté 2,8 % du
 * chiffre d'affaires de ces produits, le double de l'objectif, pendant que le
 * taux de service à Celtis tombait à 96 %. Le directeur de production propose
 * d'allonger les séries et de vendre les surplus aux soldeurs ; le directeur
 * commercial veut du stock partout. Juillet commence. Six décisions, chacune
 * précédée de ce qu'une responsable supply chain reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Les chiffres qu'elles
 * donnent sont ceux du modèle ; un test les recalcule.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";
import {
  ARRET,
  CASSE_DEPART,
  CHANGEMENT,
  COMPENSATION,
  COMPENSATION_SEMAINE,
  COUT_FROID,
  COUT_REVIENT,
  COUT_VARIABLE,
  DESTOCKAGE,
  DESTRUCTION,
  DETAIL_CHANGEMENT,
  DLC,
  DON,
  ERREUR_PROMO,
  ERREUR_PROMO_PARTAGEE,
  ERREUR_REASSORT,
  FENETRE_JOURS,
  FORMAT_PROMO,
  LOT_ACTUEL_REFERENCE,
  OBJECTIF_CASSE,
  OPERATIONS,
  PARTENARIAT,
  PARTS,
  PENALITE,
  PENALITES_PRINTEMPS,
  PRIX,
  REDUCTION_DON,
  REFERENCE_PREVISION,
  REFS,
  REFUS_SERIE_UNIQUE,
  SECURITE_CIBLEE,
  SECURITE_PARTOUT,
  SERVICE_ATTENDU,
  SERVICE_CELTIS_DEPART,
  TRANSPORT,
  AUTOMNE,
  VALEUR_DON,
  VOLUME_TOTAL,
  decomposition,
} from "@/engine/episodes/dlc-qui-tombe";
import { euros, kE, nombre, taux } from "./format";

export const DIAGNOSTICS = [
  {
    id: "plan",
    t: "La casse se fabrique au plan de production : des séries trop longues pour des produits qui ne se stockent pas, des promotions produites à l'aveugle, des faibles rotations produites sur des prévisions qui se trompent",
  },
  {
    id: "promotions",
    t: "Ce sont les promotions : les enseignes annoncent leurs volumes trop tard, et l'usine les produit à l'aveugle",
  },
  {
    id: "entrepots",
    t: "Les entrepôts des enseignes appliquent la règle des deux tiers de DLC trop strictement : c'est elle qu'il faut renégocier",
  },
  {
    id: "capacite",
    t: "Les lignes manquent de capacité : sans stock de sécurité, on ne tient ni le service ni les promotions",
  },
] as const;

/** Un volume en milliers de pots, dit en pots : « 128 000 pots ». */
export const pots = (milliers: number) =>
  `${(Math.round(milliers) * 1000).toLocaleString("fr-FR")} pots`;
/** Un coût au centime près : « 0,90 € ». */
export const centimes = (v: number) =>
  `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const part = (x: number, total: number) => taux(x / total, 0);

const YANNIG = { de: "Yannig Le Goaziou", role: "Directeur général" } as const;
const IWAN = { de: "Iwan Szymanski", role: "Directeur administratif et financier" } as const;
const GURVAN = { de: "Gurvan Kerebel", role: "Responsable de production, Loudéac" } as const;
const ERWANN = {
  de: "Erwann Tromeur",
  role: "Chef de l'atelier de conditionnement, Loudéac",
} as const;
const FANCHON = { de: "Fanchon Lozac'h", role: "Directrice de l'usine de Pontivy" } as const;
const ANNAIG = { de: "Annaïg Le Dantec", role: "Responsable qualité" } as const;
const BAPTISTIN = { de: "Baptistin Haddadi", role: "Directeur commercial" } as const;
const MORWENNA = { de: "Morwenna Pellen", role: "Cheffe de marque" } as const;
const NAIM = {
  de: "Naïm Lefeuvre",
  role: "Directeur des grands comptes et des MDD",
} as const;
const ALWENA = { de: "Alwena Coquil", role: "Planificatrice de production, Loudéac" } as const;
const NEDJMA = {
  de: "Nedjma Benhalima",
  role: "Responsable des approvisionnements frais, Celtis",
} as const;
const GLENMOR = {
  de: "Glenmor Le Corre",
  role: "Responsable logistique fournisseurs, Celtis",
} as const;
const GAELIG = {
  de: "Gaëlig Bourhis",
  role: "Responsable des ramasses, Banque alimentaire des Côtes-d'Armor",
} as const;
const TABLEAU = "Tableau de bord de la supply chain";

/** La casse du printemps, par cause, telle que la source la donne. */
const CASSE = decomposition();
const VOLUME_PROMO_RENTREE = 2 * OPERATIONS.find((o) => o.id === "rentree")!.volume;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "La casse à 2,8 %",
    jusqua: 2,
    messages: () => [
      {
        de: TABLEAU,
        role: "Alerte automatique",
        heure: "07:30",
        alerte: true,
        texte: `Casse du deuxième trimestre : ${taux(CASSE_DEPART)} du chiffre d'affaires des yaourts aromatisés et des desserts de Loudéac, pour un objectif de ${taux(OBJECTIF_CASSE)}. Taux de service à Celtis : ${taux(SERVICE_CELTIS_DEPART, 0)}, pour ${taux(SERVICE_ATTENDU)} attendus.`,
      },
      {
        ...YANNIG,
        heure: "08:40",
        texte:
          "Ysée, nous jetons ou bradons près de trois pots sur cent, et Celtis nous facture des pénalités parce qu'il en manque. Les deux en même temps, c'est que nous ne fabriquons pas ce qui se vend. Je veux ton plan vendredi.",
      },
      {
        ...GURVAN,
        heure: "09:15",
        texte:
          "La casse, je n'y peux rien : je fabrique ce que le plan demande. Si on veut baisser les coûts, allongeons les séries : moins de changements, moins de pertes au démarrage, un coût unitaire plus bas. Le surplus, un soldeur de Rennes le prend au quart du prix.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "decomposer",
        titre: "Décomposer la casse du printemps par cause",
        cout: 1,
        nature: "decisive",
        resultat: `Au printemps, la casse a coûté ${taux(CASSE.taux)} du chiffre d'affaires : ${part(CASSE.series, CASSE.total)} viennent des séries trop longues (des pots qui vieillissent en chambre froide, puis que les entrepôts refusent), ${part(CASSE.promo, CASSE.total)} des promotions produites sur l'historique et restées invendues, ${part(CASSE.prevision, CASSE.total)} des écarts de prévision sur les faibles rotations, ${part(CASSE.autre, CASSE.total)} d'incidents divers. Les ${REFS.C.nombre} faibles rotations font ${taux(CASSE.volumeC, 0)} des volumes et ${taux(CASSE.partC, 0)} de la casse : elles sont lancées par séries de trois semaines de ventes, pour limiter les changements, alors qu'un pot doit quitter l'usine au plus ${FENETRE_JOURS} jours après sa fabrication.`,
      },
      {
        id: "lot",
        titre: "Chiffrer un changement de série et la casse de la crème dessert chocolat",
        cout: 1,
        nature: "decisive",
        resultat: `La ${REFERENCE_PREVISION.nom}, première référence de la ligne 4 : ${pots(REFERENCE_PREVISION.demande)} vendus par semaine, régulièrement. Un changement de série (rinçage, réglages, mix et pots perdus au démarrage) arrête la ligne ${CHANGEMENT.minutes} minutes et coûte ${euros(CHANGEMENT.cout)} : ${euros(DETAIL_CHANGEMENT.equipe)} d'équipe, ${euros(DETAIL_CHANGEMENT.nettoyage)} d'eau, de vapeur et de produits de nettoyage, ${euros(DETAIL_CHANGEMENT.demarrage)} de mix et de pots perdus. Un millier de pots gardé une semaine en stock coûte ${centimes(COUT_FROID)} de froid et de manutention ; et ${taux(REFS.A.casseStock, 0)} des pots se cassent par semaine de stock moyen, au coût variable de ${euros(COUT_VARIABLE)} le millier, soit ${centimes(REFS.A.casseStock * COUT_VARIABLE)}. Aujourd'hui, elle est lancée tous les dix jours de ventes, par séries de ${pots(LOT_ACTUEL_REFERENCE)}. Avec une DLC de ${DLC} jours, des centrales qui en exigent les deux tiers à réception et ${TRANSPORT} jour de transport, un pot doit quitter l'usine au plus ${FENETRE_JOURS} jours après sa fabrication.`,
      },
      {
        id: "service",
        titre: "Lire les ruptures et les pénalités de Celtis",
        cout: 0.5,
        nature: "utile",
        resultat: `Les manques chez Celtis viennent surtout des promotions, quand leur volume dépasse l'historique, et des faibles rotations, quand la prévision se trompe ; les fortes rotations n'ont presque pas de stock de sécurité. Le contrat logistique des trois enseignes : une pénalité de ${taux(PENALITE.taux, 0)} de la valeur des produits manquants au-delà de la tolérance de ${taux(1 - SERVICE_ATTENDU)}, plafonnée à ${taux(PENALITE.plafond, 0)} de la valeur commandée. Au printemps : ${kE(PENALITES_PRINTEMPS)} de pénalités, dont plus de la moitié chez Celtis, qui pèse ${taux(PARTS.celtis, 0)} des volumes.`,
      },
      {
        id: "profession",
        titre: "Comparer notre casse à celle des autres laiteries",
        cout: 1,
        nature: "bruit",
        resultat:
          "L'enquête annuelle de la fédération régionale place la casse des produits frais laitiers entre 1 et 4 % du chiffre d'affaires selon les usines. Le Groupe Nordal annonce 1,2 % dans son rapport annuel, sans dire comment il la compte. Rien qui dise d'où vient la nôtre.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Fanchon Lozac'h, directrice de l'usine de Pontivy",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Fanchon : « Une série plus longue coûte moins cher à fabriquer et plus cher à jeter. Mets les deux dans le même calcul, référence par référence, et regarde ensuite si le résultat tient dans la DLC. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que proposez-vous vendredi ?",
    options: [
      {
        t: "Allonger les séries, deux semaines de ventes pour les fortes rotations et quatre pour les faibles, et vendre les surplus aux magasins de déstockage",
        d: "Un quart de changements de série en moins, un coût unitaire plus bas ; les surplus de marque partent chez un soldeur au quart du prix.",
      },
      {
        t: "Recalculer la série de chaque référence : la taille de lot économique, plafonnée par la fenêtre de fraîcheur",
        d: `Des séries d'une semaine de ventes environ pour les fortes rotations, de ${FENETRE_JOURS} jours au plus pour les faibles : deux fois plus de changements de série qu'aujourd'hui.`,
      },
      {
        t: "Passer en petites séries : chaque référence deux fois par semaine, au plus près des commandes",
        d: "Le stock le plus frais possible ; quatre fois plus de changements de série qu'aujourd'hui.",
      },
      {
        t: "Garder le plan actuel, et demander aux commerciaux de pousser les surplus",
        d: "Des séries de dix jours pour les fortes rotations, de trois semaines pour les faibles. Rien ne change à l'usine.",
      },
    ],
    reactions: [
      [
        {
          ...GURVAN,
          texte:
            "Les séries longues tournent bien : la ligne 4 n'a fait que deux changements hier. La chambre froide est pleine, en revanche, et le soldeur passe jeudi.",
        },
      ],
      [
        {
          ...ALWENA,
          texte:
            "Le nouveau plan est en place : la crème chocolat sort toutes les semaines, les faibles rotations jamais plus de huit jours de ventes d'un coup. Les conducteurs trouvent qu'on change souvent de recette ; la chambre froide respire.",
        },
      ],
      [
        {
          ...ERWANN,
          texte:
            "On change de recette toutes les deux heures. Les équipes passent leur temps à rincer et à régler, et on a pris du retard dès mercredi.",
        },
      ],
      [
        {
          ...YANNIG,
          texte:
            "Les commerciaux vont pousser. Mais qu'est-ce qui change, concrètement, pour la casse ?",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Les volumes de Celtis arrivent trop tard",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...NEDJMA,
        heure: "11:20",
        alerte: true,
        texte:
          "Bonjour, voici enfin les volumes définitifs de notre opération desserts des semaines 3 et 4. Désolée pour le délai : nos magasins ont validé leurs commandes tard.",
      },
      {
        ...ALWENA,
        heure: "11:45",
        texte:
          "Les lots promotionnels sont déjà fabriqués, sur l'historique des opérations passées. On saura dans quinze jours s'il y en avait trop ou pas assez.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 2 : casse à ${ctx.casse} du chiffre d'affaires, taux de service à Celtis de ${ctx.service}, lignes chargées à ${ctx.charge}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "celtis",
        titre: "Appeler Nedjma Benhalima, chez Celtis",
        cout: 0.5,
        nature: "decisive",
        resultat: `Celtis partage déjà ses volumes promotionnels et ses commandes fermes à quatre semaines avec deux fournisseurs, dont le Groupe Nordal, contre un engagement de service sur ses promotions et un échange de données chaque semaine. Sans contrepartie, sa direction logistique dit presque toujours non : « Si je vous donne mes volumes, je veux être livrée. » Avec une contrepartie, deux fois sur trois. Les premiers échanges prendraient un mois : pas avant la semaine ${PARTENARIAT.debut}. Celtis pèse ${taux(PARTS.celtis, 0)} de nos volumes.`,
      },
      {
        id: "promos",
        titre: "Relire les huit dernières promotions",
        cout: 0.5,
        nature: "utile",
        resultat: `Produites sur l'historique, les promotions se sont trompées de ${taux(ERREUR_PROMO, 0)} en moyenne (en écart-type), dans les deux sens : trop, et les lots promotionnels invendus, qui portent le marquage de l'opération, ne se vendent plus après ; pas assez, et ce sont des ruptures pendant l'opération, les plus chères en pénalités. Quand l'enseigne donne ses volumes à quatre semaines, l'erreur tombe à ${taux(ERREUR_PROMO_PARTAGEE, 0)}.`,
      },
    ],
    question: "Comment produisez-vous les promotions désormais ?",
    options: [
      {
        t: "Proposer à Celtis une prévision partagée : ses volumes promotionnels et ses commandes fermes à quatre semaines, contre un engagement de service sur ses promotions",
        d: `Un prévisionniste dédié et un échange de données : ${kE(PARTENARIAT.mise)} pour démarrer, puis ${euros(PARTENARIAT.previsionniste)} par semaine. Celtis décidera.`,
      },
      {
        t: "Demander à Celtis ses volumes promotionnels plus tôt, sans contrepartie",
        d: "Un courrier de Baptistin Haddadi à la centrale. Ne coûte rien ; Celtis décidera.",
      },
      {
        t: "Produire chaque promotion 25 % au-dessus de l'historique, pour ne plus manquer",
        d: "Un stock de sécurité de promotion, à partir de l'opération d'Opaline des semaines 6 et 7.",
      },
      {
        t: "Continuer à produire les promotions sur l'historique",
        d: "Rien ne change.",
      },
    ],
    reactions: [
      null,
      null,
      [
        {
          ...ALWENA,
          texte:
            "C'est noté : chaque opération sera fabriquée 25 % au-dessus de l'historique. Il faudra trouver de la place en chambre froide pour les lots promotionnels.",
        },
      ],
      [
        {
          ...ALWENA,
          texte:
            "On garde la règle habituelle. L'opération d'Opaline des semaines 6 et 7 est déjà calée.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Les palettes refusées",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...GLENMOR,
        heure: "07:50",
        alerte: true,
        texte: `Notre entrepôt de Ploërmel a refusé ce matin un camion de vos desserts : moins des deux tiers de DLC à réception. Il repart chez vous. Pour mémoire, notre cahier des charges logistique ne prévoit aucune dérogation.`,
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "12:00",
        texte: `Casse de la semaine 4 : ${ctx.palettes} palettes, ${ctx.casse} du chiffre d'affaires. Pour moitié, des produits encore consommables : refusés pour fraîcheur, ou lots promotionnels invendus.`,
      },
      {
        ...GURVAN,
        heure: "14:30",
        texte:
          "Le soldeur de Rennes prend tout ce qui est sous notre marque, au quart du prix, enlèvement compris. C'est mieux que de payer la méthanisation, non ?",
      },
    ],
    sources: [
      {
        id: "fiscal",
        titre: "Demander à Iwan Szymanski ce que vaut un don",
        cout: 0.5,
        nature: "decisive",
        resultat: `Iwan : « Un don aux associations ouvre une réduction d'impôt de ${taux(REDUCTION_DON, 0)} de la valeur des produits donnés, et cette valeur, c'est leur coût de revient, la valeur en stock : ${euros(COUT_REVIENT)} le millier de pots, pas le prix de vente de ${euros(PRIX)}. Soit ${centimes(REDUCTION_DON * COUT_REVIENT)} par millier, moins ${euros(DON.logistique)} de préparation et de transport en froid : ${centimes(VALEUR_DON)}. Le plafond, 5 ‰ du chiffre d'affaires, est loin. Le soldeur paie ${euros(PRIX * DESTOCKAGE.prix)} le millier, et seulement la marque : un produit sous marque de distributeur ne peut pas sortir du circuit de l'enseigne. La méthanisation coûte ${euros(DESTRUCTION)} le millier. Et dans tous les cas, le pot jeté a coûté ${euros(COUT_VARIABLE)} à fabriquer. »`,
      },
      {
        id: "marque",
        titre: "Demander à Morwenna Pellen ce que le déstockage a fait à la marque",
        cout: 0.5,
        nature: "utile",
        resultat: `Morwenna : « L'an dernier, l'acheteur d'Opaline a photographié nos crèmes desserts à 0,99 € les quatre chez un soldeur de Saint-Brieuc. Il a obtenu ${taux(COMPENSATION.remise, 0)} de remise sur toute la marque pendant deux mois : ${kE(COMPENSATION_SEMAINE * COMPENSATION.semaines)}. Et chaque millier de pots de marque bradé nous a fait perdre environ ${euros(DESTOCKAGE.erosion)} de ventes au prix normal le trimestre suivant : les clients du soldeur ne rachètent plus au prix de l'hypermarché. »`,
      },
      {
        id: "associations",
        titre: "Appeler la Banque alimentaire des Côtes-d'Armor",
        cout: 0.5,
        nature: "utile",
        resultat: `Gaëlig Bourhis : « Nous pouvons prendre ${DON.palettes} palettes par semaine en froid positif, avec au moins dix jours de DLC ; au-delà, nos associations n'ont pas la place. Une palette, c'est ${pots(DON.potsParPalette)}. Il faut une convention de don, et nous vous remettons une attestation pour vos impôts. »`,
      },
    ],
    question: "Que deviennent les surplus encore consommables ?",
    options: [
      {
        t: "Continuer à les détruire en méthanisation",
        d: `Ce qui ne se vend pas est détruit, ${euros(DESTRUCTION)} le millier de pots.`,
      },
      {
        t: "Vendre les surplus de marque aux magasins de déstockage, au quart du prix",
        d: "Le soldeur enlève à l'usine. Les produits sous marque de distributeur restent détruits.",
      },
      {
        t: "Signer une convention de don avec la banque alimentaire et les associations du département",
        d: `Jusqu'à ${DON.palettes} palettes par semaine, préparation et transport en froid à notre charge ; le reste est détruit.`,
      },
    ],
    reactions: [
      [
        {
          ...GURVAN,
          texte: "Bien. Le camion de la méthanisation passe le mardi et le jeudi.",
        },
      ],
      [
        {
          ...GURVAN,
          texte:
            "Le soldeur a enlevé vingt palettes mardi. Il en redemande pour la semaine prochaine.",
        },
      ],
      [
        {
          ...GAELIG,
          texte:
            "La convention est signée. Nos bénévoles viennent chercher les palettes le mardi et le vendredi, et les desserts partent dans les épiceries solidaires du département.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Celtis facture les ruptures",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...GLENMOR,
        heure: "09:10",
        alerte: true,
        texte: `Votre taux de service en semaine 6 : ${ctx.service}, pour ${taux(SERVICE_ATTENDU)} au contrat. Vous recevrez la facture des pénalités logistiques avec le relevé du mois.`,
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "12:00",
        texte: `Pénalités logistiques facturées depuis juillet par les trois enseignes : ${ctx.penalites}. Casse de la semaine 6 : ${ctx.casse}.`,
      },
      {
        ...BAPTISTIN,
        heure: "15:40",
        texte:
          "Ysée, Celtis menace de confier ses faibles rotations à Nordal. Mets trois jours de stock partout : on ne peut plus se permettre de manquer quoi que ce soit.",
      },
    ],
    sources: [
      {
        id: "ruptures",
        titre: "Analyser les ruptures des six dernières semaines avec Alwena Coquil",
        cout: 0.5,
        nature: "decisive",
        resultat: `Alwena : « Les fortes rotations manquent parce qu'elles n'ont presque pas de stock de sécurité ; leur prévision ne se trompe que de ${taux(REFS.A.erreur, 0)}, et ${nombre(SECURITE_CIBLEE * 7)} jour de sécurité suffit à couvrir presque toutes leurs ruptures. Les faibles rotations, elles, se trompent de ${taux(REFS.C.erreur, 0)} d'une semaine sur l'autre : leur stock de sécurité vieillit plus vite qu'il ne sert. Trois jours de stock sur toutes les références, c'est ${pots(SECURITE_PARTOUT * VOLUME_TOTAL)} de plus à fabriquer en deux semaines, et sur une faible rotation, une série plus trois jours de sécurité dépasse la fenêtre de ${FENETRE_JOURS} jours. Ce qui supprime vraiment le stock de sécurité d'une faible rotation, c'est une commande ferme assez tôt pour la produire à la commande. »`,
      },
      {
        id: "commandes",
        titre: "Demander à Celtis comment elle commande les faibles rotations",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.partenariat
            ? `Depuis l'accord, Celtis transmet ses commandes fermes des faibles rotations quatre semaines à l'avance, à partir de la semaine ${PARTENARIAT.debut} : ${taux(PARTS.celtis, 0)} des volumes peuvent être produits à la commande, sans stock de sécurité. Opaline et Proxival commandent toujours la veille pour le lendemain.`
            : "Celtis, comme Opaline et Proxival, commande les faibles rotations la veille pour le lendemain : impossible de les produire à la commande. Sans stock de sécurité, elles manqueront un peu plus souvent ; avec trois jours, elles vieilliront.",
      },
      {
        id: "assortiment",
        titre: "Regarder les dix faibles rotations les moins vendues",
        cout: 0.5,
        nature: "utile",
        resultat: `À elles dix, ${pots(ARRET.volume)} par semaine, et un taux de casse double de la moyenne. Les arrêter au 1er septembre (semaine ${ARRET.debut}) supprime leurs changements de série ; d'après les études de Morwenna, ${taux(ARRET.report, 0)} de leurs acheteurs reporteraient sur une autre de nos références. Naïm prévient : les linéaires libérés iront au Groupe Nordal, ce qui coûterait de l'ordre de ${kE(ARRET.lineaire)} de marge à l'automne.`,
      },
    ],
    question: "Comment remontez-vous le taux de service ?",
    options: [
      {
        t: "Constituer trois jours de stock de sécurité sur toutes les références",
        d: `${pots(SECURITE_PARTOUT * VOLUME_TOTAL)} de stock en plus, fabriqués en semaines 7 et 8.`,
      },
      {
        t: "Un stock de sécurité ciblé sur les fortes rotations ; les faibles rotations sans stock de sécurité, au plus près des commandes",
        d: `${nombre(SECURITE_CIBLEE * 7)} jour de sécurité sur les ${REFS.A.nombre} fortes rotations ; les faibles produites sur les commandes fermes quand l'enseigne en donne.`,
      },
      {
        t: "Proposer aux enseignes d'arrêter les dix faibles rotations les moins vendues",
        d: `Au 1er septembre, en semaine ${ARRET.debut} : des changements de série en moins, des ventes en moins.`,
      },
      {
        t: "Garder la politique de stock, et payer les pénalités",
        d: "Rien ne change.",
      },
    ],
    reactions: [
      [
        {
          ...ERWANN,
          texte:
            "Deux semaines à pleine charge pour constituer le stock : il faudra des samedis. Et la chambre froide est presque pleine.",
        },
      ],
      [
        {
          ...ALWENA,
          texte:
            "Le stock de sécurité des fortes rotations est en place ; les faibles rotations sont planifiées chaque jour sur les commandes reçues.",
        },
      ],
      [
        {
          ...NAIM,
          texte:
            "Les trois centrales ont accepté l'arrêt au 1er septembre. Celtis a déjà proposé les linéaires au Groupe Nordal.",
        },
      ],
      [
        {
          ...GLENMOR,
          texte: "Nous continuerons d'appliquer le contrat.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "L'opération de rentrée",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...NEDJMA,
        heure: "10:05",
        alerte: true,
        texte: `Notre opération de rentrée sur vos desserts est confirmée, semaines 11 et 12 : deux achetés, le troisième offert, en prospectus dans tous nos magasins. Volume attendu : ${pots(VOLUME_PROMO_RENTREE)} sur les deux semaines.`,
      },
      {
        ...MORWENNA,
        heure: "11:30",
        texte: "C'est la plus grosse opération de l'année sur la marque. Pas question de manquer.",
      },
      {
        ...GURVAN,
        heure: "14:10",
        texte: `Je propose une seule série en semaine 10 : un changement de format au lieu de deux, et c'est réglé. Les lignes sont chargées à ${ctx.charge} cette semaine.`,
      },
    ],
    sources: [
      {
        id: "historique",
        titre: "Relire les opérations de rentrée des années passées",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `D'une année sur l'autre, le volume réel d'une grande opération s'écarte du volume annoncé de ${taux(ERREUR_PROMO, 0)} (en écart-type)${ctx.partenariat ? `, ${taux(ERREUR_PROMO_PARTAGEE, 0)} seulement quand Celtis partage ses volumes, comme elle le fait désormais` : ""}. La première semaine annonce la seconde : avec les sorties de caisse des trois premiers jours, la seconde se prévoit à ${taux(ERREUR_REASSORT.seule, 0)} près, à ${taux(ERREUR_REASSORT.partagee, 0)} près avec les données de l'enseigne. Une série unique fabriquée en semaine 10 arrive pour sa seconde moitié avec moins des deux tiers de sa DLC : l'an dernier, ${taux(REFUS_SERIE_UNIQUE, 0)} des pots de la seconde semaine ont été refusés.`,
      },
      {
        id: "lignes",
        titre: "Regarder la charge des lignes en septembre avec Erwann Tromeur",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Les lignes étaient chargées à ${ctx.charge} en semaine 8, et septembre remonte avec la rentrée. Une seconde série demande un changement de format de ${FORMAT_PROMO.minutes} minutes en semaine 11 (${euros(FORMAT_PROMO.cout)}).${ctx.petitesSeries ? " Avec les petites séries, les lignes n'ont plus de place : une seconde série ne passerait qu'en partie, et en retard." : " Il y a la place."}`,
      },
    ],
    question: "Comment produisez-vous l'opération de rentrée ?",
    options: [
      {
        t: "Produire toute l'opération en une seule série, en semaine 10",
        d: "Un changement de format au lieu de deux ; le volume annoncé, fabriqué en une fois.",
      },
      {
        t: "Deux séries : la première pour la semaine 11, la seconde ajustée sur les sorties de caisse des trois premiers jours",
        d: `Un changement de format de plus (${euros(FORMAT_PROMO.cout)}). La seconde série attend les chiffres de la première semaine.`,
      },
      {
        t: "Produire le volume annoncé plus 20 %, pour ne pas manquer",
        d: "Pas de rupture, sauf succès hors normes ; des lots promotionnels en plus.",
      },
      {
        t: "Appliquer la règle habituelle des promotions",
        d: "Comme pour les autres opérations du trimestre.",
      },
    ],
    reactions: [
      [
        {
          ...ERWANN,
          texte:
            "La série de rentrée est sortie : deux jours de ligne d'affilée. Les palettes de la seconde semaine attendent en chambre froide.",
        },
      ],
      [
        {
          ...ALWENA,
          texte:
            "La première série est lancée. La seconde attend les sorties de caisse de lundi à mercredi ; la ligne 4 lui est réservée jeudi.",
        },
      ],
      [
        {
          ...GURVAN,
          texte: "On a de quoi tenir, et même un peu plus. La chambre froide est pleine.",
        },
      ],
      [
        {
          ...ALWENA,
          texte: "L'opération de rentrée suit la même règle que les autres.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "La règle de l'automne",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...YANNIG,
        heure: "08:30",
        alerte: true,
        texte: `Ysée, le budget de l'automne se prépare, et décembre est le pic des desserts. Casse de la semaine : ${ctx.casse}. Je veux une règle pour piloter les lignes à partir d'octobre : propose-la au comité de direction.`,
      },
      {
        ...IWAN,
        heure: "10:15",
        texte:
          "Le plus simple serait un objectif de coût unitaire par ligne, avec une prime aux chefs d'équipe : il se mesure chaque jour, et tout le monde le comprend.",
      },
      {
        ...BAPTISTIN,
        heure: "11:00",
        texte:
          "Nordal annonce ses desserts à 35 jours de DLC. Pourquoi pas nous ? Avec une semaine de plus, la casse fondrait.",
      },
    ],
    sources: [
      {
        id: "pontivy",
        titre: "Demander à Fanchon Lozac'h comment Pontivy pilote ses lignes",
        cout: 0.5,
        nature: "decisive",
        resultat: `Fanchon : « Depuis janvier, nous tenons un plan industriel et commercial chaque mois : les ventes, le marketing, la supply chain et la production arrêtent ensemble les volumes, les promotions et les séries du mois suivant. La casse a baissé de ${nombre(AUTOMNE.pic * 100)} point en un trimestre, de ${nombre(AUTOMNE.picPartage * 100, 2)} point là où l'enseigne partageait ses volumes. Il faut une journée par mois aux équipes. »`,
      },
      {
        id: "qualite",
        titre: "Demander à Annaïg Le Dantec ce que demanderait une DLC de 35 jours",
        cout: 0.5,
        nature: "decisive",
        resultat: `Annaïg : « Une DLC se fixe sur une étude de vieillissement validée : des analyses à 28, 35 et 42 jours sur plusieurs lots, et un test de croissance de Listeria monocytogenes. Nous n'en avons pas pour 35 jours, et nos analyses de libération ne disent rien du 35e jour. Sur nos essais d'il y a deux ans, un lot sur trois dépassait les seuils de flore d'altération à 35 jours. Un lot non conforme en magasin, c'est un retrait, la DDPP, les pénalités des enseignes : ${kE(AUTOMNE.dlcRetrait)} chez un confrère l'an dernier. Une étude prendrait huit semaines. Sans elle, je ne signe pas. »`,
      },
      {
        id: "prime",
        titre: "Demander à Gurvan Kerebel ce qu'avait donné la prime au coût unitaire",
        cout: 0.5,
        nature: "utile",
        resultat: `Gurvan : « En 2023, on avait eu une prime au coût unitaire par ligne. En deux mois, les séries s'étaient allongées de 40 % : moins de changements, un coût unitaire plus bas. La casse avait pris ${nombre(AUTOMNE.coutUnitaire * 100)} point, et la prime a été supprimée à la fin de l'année. »`,
      },
    ],
    question: "Quelle règle proposez-vous pour l'automne ?",
    options: [
      {
        t: "Un plan industriel et commercial mensuel : ventes, marketing, supply chain et production arrêtent ensemble volumes, promotions et séries",
        d: "Une journée par mois pour les équipes, à partir d'octobre ; la préparation commence en semaine 12.",
      },
      {
        t: "Un objectif de coût unitaire par ligne, avec une prime aux chefs d'équipe",
        d: "Un indicateur simple, suivi chaque jour, à partir d'octobre.",
      },
      {
        t: "Porter la DLC des desserts à 35 jours dès octobre, sur la foi des analyses de libération",
        d: "La fenêtre de fraîcheur s'élargit tout de suite ; sans étude de vieillissement.",
      },
      {
        t: "Ne rien engager avant le budget",
        d: "La règle actuelle reste en place.",
      },
    ],
    reactions: [
      [
        {
          ...FANCHON,
          texte:
            "Je t'envoie notre ordre du jour et nos tableaux. Le premier plan du mois se tiendra le 2 octobre, avec Naïm et Morwenna.",
        },
      ],
      [
        {
          ...GURVAN,
          texte:
            "Les chefs d'équipe sont motivés : ils parlent déjà de regrouper les séries pour faire baisser le coût.",
        },
      ],
      [
        {
          ...ANNAIG,
          alerte: true,
          texte:
            "Je prends acte de la décision, et je note par écrit mon désaccord : sans étude de vieillissement, nous ne pouvons pas garantir ces produits jusqu'au 35e jour.",
        },
      ],
      [
        {
          ...YANNIG,
          texte: "Nous en reparlerons au budget.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Produire au plus près de la demande", chemin: [1, 0, 2, 1, 1, 0] },
  { nom: "Grandes séries et stock de sécurité", chemin: [0, 2, 1, 0, 0, 1] },
  { nom: "Attentiste", chemin: [3, 3, 0, 3, 3, 3] },
] as const;

/**
 * Les réflexes du métier sous la pression du coût et du service, [décision, option] :
 * allonger les séries pour baisser le coût unitaire, et brader les surplus en
 * déstockage ; viser un service parfait par du stock (promotions surproduites, trois
 * jours partout, une rentrée « avec de la marge ») ; payer les chefs d'équipe au coût
 * unitaire. Les petites séries (D1) n'y figurent pas : c'est l'excès inverse. La DLC
 * allongée sans étude (D6) non plus : c'est une faute sanitaire, pas un réflexe de
 * planification.
 */
export const REFLEXES = [
  [0, 0],
  [1, 2],
  [2, 1],
  [3, 0],
  [4, 0],
  [4, 2],
  [5, 1],
] as const;

export const REPONSES = {
  accepteContrepartie: `Notre direction logistique est d'accord : nos volumes promotionnels et nos commandes fermes des faibles rotations à quatre semaines, à partir de la semaine ${PARTENARIAT.debut}, contre votre engagement de ${taux(SERVICE_ATTENDU)} sur nos promotions.`,
  refuseContrepartie:
    "Notre direction logistique ne veut pas ouvrir un troisième échange de données cette année. Nous en reparlerons aux négociations de décembre.",
  accepteSimple: `Exceptionnellement, nous vous transmettrons nos volumes promotionnels et nos commandes fermes à quatre semaines, à partir de la semaine ${PARTENARIAT.debut}.`,
  refuseSimple:
    "Nous ne communiquons nos volumes à l'avance qu'aux fournisseurs qui s'engagent sur le service. Rien de nouveau pour l'instant.",
} as const;
