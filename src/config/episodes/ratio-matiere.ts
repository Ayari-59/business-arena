/**
 * LE RATIO MATIÈRE QUI DÉRAPE — le contenu de l'épisode.
 *
 * Nina Sabatier gère La Table d'Augustin d'Annecy, la bistronomie du Groupe
 * Escale dans la vieille ville : 90 couverts, un chef, une brigade de sept,
 * une équipe de salle. La clôture d'août affiche 36,4 % de ratio matière pour
 * un objectif de 30 %, le siège propose d'augmenter la carte, le chef accuse
 * le grossiste. Six décisions, de septembre à novembre, chacune précédée de
 * ce qu'une gérante reçoit vraiment.
 *
 * La notion est le DIAGNOSTIC D'UN RATIO MATIÈRE : coût matière consommé
 * (stock initial + achats − stock final) rapporté au chiffre d'affaires
 * nourriture HT, puis l'écart au ratio théorique des fiches techniques
 * décomposé entre la mesure (l'inventaire), les prix d'achat, les pertes et
 * les grammages. Les chiffres que les sources donnent sont ceux du modèle :
 * un test le vérifie.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

const THEO = {
  de: "Théo Garrigues",
  role: "Directeur de la restauration, Groupe Escale",
} as const;
const KADIATOU = {
  de: "Kadiatou Sidibé",
  role: "Contrôleuse de gestion restauration, siège",
} as const;
const SERAPHIN = { de: "Séraphin Mermillod", role: "Chef de cuisine" } as const;
const PHILEMON = { de: "Philémon Gruffaz", role: "Second de cuisine" } as const;
const ANOUAR = { de: "Anouar Benkirane", role: "Maître d'hôtel" } as const;
const TIPHAINE = { de: "Tiphaine Pernoud", role: "Acheteuse, siège" } as const;
const THIBERT = { de: "Thibert Quiblier", role: "Commercial, Les Halles du Semnoz" } as const;

export const DIAGNOSTICS = [
  {
    id: "carte",
    t: "La carte est trop longue : trente-quatre mises en place, et des produits frais jetés chaque semaine",
  },
  {
    id: "grammages",
    t: "Les portions ont dérivé : les plats signatures partent plus garnis que leur fiche technique",
  },
  {
    id: "fournisseur",
    t: "Les Halles du Semnoz ont augmenté leurs prix : c'est le coût d'achat qui a dérapé",
  },
  {
    id: "inventaire",
    t: "Il n'y a pas de vraie dérive : l'inventaire d'août est faux, et le ratio avec lui",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "36,4 % de ratio matière",
    jusqua: 2,
    messages: () => [
      {
        ...KADIATOU,
        heure: "08:10",
        alerte: true,
        texte:
          "Clôture d'août, Table d'Augustin d'Annecy : chiffre d'affaires nourriture 140,0 k€ HT, coût matière consommé 50,96 k€, soit un ratio matière de 36,4 % pour un objectif de 30 %. Le plus haut des cinq Tables.",
      },
      {
        ...THEO,
        heure: "08:45",
        texte:
          "Nina, 6,4 points au-dessus de l'objectif, c'est près de 9 k€ de marge envolés sur le seul mois d'août. Le siège propose de passer la carte à +8 %, comme les autres Tables au printemps. J'attends ton plan vendredi : on part sur septembre-novembre, la fin de la saison et le retour de nos clients d'ici.",
      },
      {
        ...SERAPHIN,
        heure: "10:20",
        texte:
          "Ce n'est pas la cuisine, Nina. Les Halles ont encore augmenté le beurre et le veau. Et ma carte d'automne est prête : huit plats nouveaux, cèpes, gibier, courge.",
      },
      {
        ...ANOUAR,
        heure: "11:05",
        texte:
          "Les derniers cars de touristes repartent. À partir d'octobre, ce sont nos habitués du midi et les Annéciens du soir qui feront la salle.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "inventaire",
        titre: "Reprendre l'inventaire du 31 août avec le second",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Stock au 31 juillet : 16 800 €. Achats nourriture d'août : 47 320 €. Stock compté le 31 août : 13 160 €, par Soren Magnin, commis, seul, le dimanche soir après le service. Philémon relit la feuille : la chambre froide négative du sous-sol n'y figure pas. Sa fiche de stock, tenue à jour, indique 4 200 € de veau, de féra, de fonds et de glaces. Chiffre d'affaires nourriture d'août : 140 000 € HT.",
      },
      {
        id: "cuisine",
        titre: "Passer un service du soir et un midi en cuisine",
        cout: 1,
        nature: "decisive",
        resultat:
          "Trente-quatre plats à la carte, chacun sa mise en place ; onze se vendent moins de quatre fois par semaine. Le bac à pertes pesé deux services de suite : sauces de la veille, garnitures, poisson ouvert pour rien. Au rythme d'août, près de 950 € de produits jetés par semaine, 3,0 % du chiffre d'affaires nourriture, quand une cuisine bien tenue en jette 0,6 %. Les fiches techniques, elles, donnent un ratio théorique de 28,5 % sur les ventes d'août. Au passe, la féra et la côte de veau partent plus garnies que sur la photo de leur fiche.",
      },
      {
        id: "factures",
        titre: "Éplucher les factures des Halles du Semnoz",
        cout: 1,
        nature: "utile",
        resultat:
          "Les prix des Halles sont stables depuis le printemps, sauf deux produits depuis juillet : le beurre AOP, +25 % (3 000 € d'achats en août), et le veau, +15 % (4 600 €). Le surcoût du mois : 1 200 €, soit 0,9 point de ratio. Les autres grossistes ont suivi : c'est la cotation du marché.",
      },
      {
        id: "tables",
        titre: "Comparer avec les autres Tables d'Augustin",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Ratios matière d'août : Chambéry 30,8 %, Aix-les-Bains 31,6 %, Évian 29,9 %, Megève 33,0 %. Chaque Table a sa carte, ses prix et sa clientèle ; Megève sort de sa saison d'été.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à la gérante d'Évian",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Liv Duperthuy, gérante de la Table d'Évian : « Avant de toucher aux prix, refais le calcul toi-même : stock, achats, stock. Puis sépare ce qui vient des achats, de la poubelle et des assiettes. À Chambéry, +7 % en octobre l'an dernier leur ont coûté 16 % de leurs habitués en novembre. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous avant le point de vendredi ?",
    options: [
      {
        t: "Augmenter les prix de la carte de 8 % dès la semaine prochaine",
        d: "Comme les autres Tables au printemps. Le ticket moyen nourriture passe de 29 € à 31,32 € HT ; nouvelle carte imprimée en deux jours.",
      },
      {
        t: "Réduire de 10 % les portions de toute la carte",
        d: "Une consigne du chef à la brigade, dès demain : un dixième de moins dans chaque assiette.",
      },
      {
        t: "Recompter le stock du 31 août et faire peser les pertes à chaque service",
        d: "Ce lundi, restaurant fermé, avec Philémon ; puis un bac pesé et noté à chaque service pendant deux semaines. Deux heures de second par semaine.",
      },
      {
        t: "Attendre la clôture de septembre avant de toucher à quoi que ce soit",
        d: "Un mois ne fait pas une tendance. Rien ne change d'ici là.",
      },
    ],
    reactions: [
      [
        {
          ...ANOUAR,
          texte:
            "La nouvelle carte est en salle. Les touristes ne regardent pas les prix. Nos habitués du midi, si : M. Ducrettet m'a demandé si on avait changé de propriétaire.",
        },
      ],
      [
        {
          ...SERAPHIN,
          texte:
            "J'ai passé la consigne. Les assiettes partent plus vides, et la salle m'en renvoie avec des remarques. Je n'aime pas ça.",
        },
      ],
      [
        {
          ...PHILEMON,
          texte:
            "Recompté ce matin : la négative du sous-sol n'était pas sur la feuille, 4 200 € de stock. J'ai tout étiqueté par date, on l'écoule en priorité. Le bac à pertes est près de la plonge, on note tout.",
        },
      ],
      [
        {
          ...THEO,
          texte: "Attendre, d'accord. Mais le comité regardera la clôture de septembre de près.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "La carte d'automne",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...SERAPHIN,
        heure: "15:30",
        alerte: true,
        texte:
          "Ma carte d'automne part mardi : huit plats nouveaux, cèpes, gibier, courge, omble. J'en retire six de l'été. Trente-six plats : une vraie carte de saison. Tu valides ?",
      },
      {
        de: "Tableau de bord de la Table",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 2 : ${ctx.couverts} couverts, ratio matière de la semaine ${ctx.ratio}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "pertes",
        titre: "Lire ce que la cuisine jette, plat par plat",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.pese
            ? `La semaine dernière, le bac pesé à chaque service a reçu ${ctx.pertes} de produits. Huit plats sur trente-quatre font les deux tiers des pertes : ceux qui ont une mise en place à eux seuls et se vendent moins de cinq fois par semaine. Douze plats partagent leurs produits avec d'autres et ne jettent presque rien.`
            : "Personne n'a pesé : on ne sait que ce qui se vend. Onze plats partent moins de quatre fois par semaine ; lesquels jettent le plus, personne ne peut le dire. Philémon : « À l'œil, les poissons et les garnitures. Mais je ne mettrais pas ma main au feu. »",
      },
      {
        id: "habitues",
        titre: "Demander au maître d'hôtel ce que commandent les habitués",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Anouar : « Nos habitués du midi tournent sur une douzaine de plats. L'an dernier, quand on a retiré le diot au vin blanc, deux tables de bureau ont espacé leurs visites pendant un mois. Une carte plus courte, je suis pour ; mais certains réclameront leur plat. »",
      },
    ],
    question: "Quelle carte pour l'automne ?",
    options: [
      {
        t: "Valider la carte d'automne du chef : 36 plats",
        d: "Huit nouveautés, six plats retirés. Le chef est content ; la brigade a deux mises en place de plus.",
      },
      {
        t: "Resserrer la carte à 22 plats, en gardant ceux qui partagent leurs produits",
        d: "Douze plats retirés, dont certains que des habitués aiment. Un tiers de mises en place en moins.",
      },
      {
        t: "Garder 28 plats et une ardoise du jour qui écoule la mise en place",
        d: "Six plats retirés, et trois suggestions chaque jour selon ce qui reste en chambre froide.",
      },
      {
        t: "Laisser le chef remplacer plat pour plat : 34 plats",
        d: "La carte d'automne garde la longueur de celle d'été.",
      },
    ],
    reactions: [
      [
        {
          ...SERAPHIN,
          texte:
            "Merci, Nina. La brigade est fière de cette carte. Le gibier demande sa mise en place à lui, mais ça vaut le coup.",
        },
      ],
      null,
      [
        {
          ...PHILEMON,
          texte:
            "L'ardoise part bien : ce midi, le parmentier de joue a vidé le reste de braisage d'hier. Ce qui finissait au bac finit dans l'assiette.",
        },
      ],
      [{ ...SERAPHIN, texte: "Trente-quatre plats, comme d'habitude. La carte est imprimée." }],
    ],
  },
  {
    moment: "Semaine 5 · lundi",
    titre: "Septembre clôturé, les assiettes au passe",
    jusqua: 5,
    messages: (ctx) => [
      {
        ...KADIATOU,
        heure: "09:15",
        alerte: true,
        texte: `Clôture de septembre, Table d'Augustin d'Annecy : ratio matière ${ctx.ratioMois}.${
          ctx.ratioMoisBeau
            ? " Presque à l'objectif : beau redressement."
            : " Toujours loin des 30 %."
        }`,
      },
      {
        ...SERAPHIN,
        heure: "10:40",
        texte: ctx.ratioMoisBeau
          ? "Tu vois : c'est réglé. On peut arrêter de chercher des poux à la cuisine. Et mes deux plats signatures, on n'y touche pas : la féra et la côte de veau, c'est pour elles qu'on vient."
          : "Je sais, septembre n'est pas bon. Mais mes deux plats signatures, on n'y touche pas : la féra et la côte de veau, c'est pour elles qu'on vient.",
      },
    ],
    sources: [
      {
        id: "septembre",
        titre: "Refaire le calcul de septembre",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.ecartMois
            ? `Le stock initial de septembre est celui de l'inventaire du 31 août : la négative du sous-sol n'y est pas. Avec 4 200 € de stock en moins au départ, la consommation de septembre paraît d'autant plus faible. Corrigé, le ratio de septembre est de ${ctx.ratioMoisReel}, pas de ${ctx.ratioMois}.`
            : `Le stock initial de septembre a été recompté, la négative comprise : le ratio de ${ctx.ratioMois} est le bon. Il reste loin des 28,5 % des fiches techniques.`,
      },
      {
        id: "passe",
        titre: "Peser dix assiettes au passe pendant le coup de feu",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Filet de féra : 185 g servis en moyenne pour 150 g à la fiche, et une louche et demie de beurre blanc au lieu d'une. Côte de veau : 330 g pour 280 g. Les deux plats font 24 % des plats vendus ; leur surplus coûte 1,0 point de ratio, et il grossit d'environ 3 % par semaine depuis l'été. Personne ne pèse au passe : chacun dresse à l'œil.",
      },
    ],
    question: "Que faites-vous des deux plats signatures ?",
    options: [
      {
        t: "Refaire leurs fiches avec le chef, et une balance au passe",
        d: "Grammages repesés ensemble, photo de dressage affichée, une balance au passe : le chef vérifie au coup de feu.",
      },
      {
        t: "Augmenter de 4 € le prix de ces deux plats",
        d: "Ce sont les plus demandés : ils peuvent le porter. Nouvelle carte imprimée.",
      },
      {
        t: "Retirer les deux plats de la carte",
        d: "Plus de dérive possible. Ce sont aussi les deux plats qu'on cite dans les avis.",
      },
      {
        t: "Laisser le chef : la générosité fait la maison",
        d: "Les clients reviennent pour ces assiettes. Rien ne change.",
      },
    ],
    reactions: [
      [
        {
          ...SERAPHIN,
          texte:
            "J'ai râlé, mais tu avais raison : 150 g de féra, c'est une belle assiette quand c'est bien dressé. La balance est au passe, les commis s'y sont faits en deux services.",
        },
      ],
      [
        {
          ...ANOUAR,
          texte:
            "Les nouveaux prix sont en salle. Deux tables d'habitués ont pris l'omble au lieu de la féra ce midi, en le disant.",
        },
      ],
      [
        {
          ...ANOUAR,
          texte:
            "On me demande la féra tous les jours. Une habituée a reposé la carte : « Vous n'avez plus la côte de veau ? »",
        },
      ],
      [
        {
          ...SERAPHIN,
          texte: "Merci de me faire confiance. Ces deux plats, c'est la signature de la maison.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Changer de grossiste ?",
    jusqua: 7,
    messages: () => [
      {
        ...TIPHAINE,
        heure: "09:00",
        alerte: true,
        texte:
          "Nina, Maison Vallorin, grossiste à Chambéry, propose 3 % de moins que les Halles du Semnoz sur tout son catalogue si on lui confie les achats d'Annecy. Je peux lancer la bascule dès la semaine prochaine.",
      },
      {
        ...THIBERT,
        heure: "11:30",
        texte:
          "Madame Sabatier, je sais que le beurre et le veau vous font mal. Ils suivent la cotation, comme partout. Le reste de notre tarif n'a pas bougé depuis mars.",
      },
    ],
    sources: [
      {
        id: "contrat",
        titre: "Relire le contrat des Halles du Semnoz",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Une remise de fin d'année de 1,5 % des achats annuels, versée en janvier si l'on reste client jusqu'au 31 décembre. Annecy achète environ 300 000 € par an aux Halles : 4 500 €, que la comptabilité provisionne chaque mois. Partir en octobre, c'est les perdre. Les Halles livrent six jours sur sept avant 7 heures ; Vallorin, trois fois par semaine.",
      },
      {
        id: "cotations",
        titre: "Comparer le beurre et le veau chez trois fournisseurs",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Chez Vallorin, le beurre AOP est au même prix que chez les Halles, et le veau 14 % plus cher qu'au printemps : la hausse vient de la cotation. Les Halles fournissent 60 % des achats de la Table : 3 % de moins sur cette part, c'est 0,5 point de ratio. Un beurre de laiterie pour la cuisson coûte 40 % de moins que l'AOP, qu'on peut garder pour la table et le beurre blanc ; la Boucherie Pollet, à Rumilly, vend le quasi de veau au prix de la côte d'avant la hausse. Ensemble, ils effacent les quatre cinquièmes du surcoût.",
      },
    ],
    question: "Que faites-vous des achats ?",
    options: [
      {
        t: "Basculer chez Maison Vallorin, 3 % moins cher",
        d: "Tout le catalogue, à partir de la semaine 6. Trois semaines pour caler les livraisons et les références.",
      },
      {
        t: "Garder les Halles et traiter les deux produits : beurre de laiterie en cuisson, veau chez un boucher",
        d: "Le beurre AOP reste sur la table et dans le beurre blanc ; le quasi de veau vient de la Boucherie Pollet. Deux fiches techniques à refaire.",
      },
      {
        t: "Répercuter la hausse : 2 € de plus sur les six plats au beurre et au veau",
        d: "Nouvelle carte imprimée en deux jours.",
      },
      {
        t: "Accepter la hausse : la cotation finira par redescendre",
        d: "Rien ne change.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...SERAPHIN,
          texte:
            "Le quasi de Pollet est superbe, et personne ne voit la différence de beurre dans une sauce montée. Les fiches sont à jour.",
        },
      ],
      [
        {
          ...ANOUAR,
          texte:
            "Les six plats ont pris 2 €. Les touristes ne disent rien ; les habitués commandent autre chose, ou viennent moins.",
        },
      ],
      [{ ...THIBERT, texte: "Merci de votre fidélité, Madame Sabatier. On se revoit en janvier." }],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Novembre s'annonce creux",
    jusqua: 9,
    messages: (ctx) => [
      {
        ...ANOUAR,
        heure: "16:00",
        alerte: true,
        texte:
          "Les réservations de novembre sont 17 % sous celles d'octobre. Après la Toussaint, il ne reste plus que nos clients d'ici, et ils regardent à la dépense.",
      },
      {
        ...THEO,
        heure: "17:20",
        texte: `Nina, le comité veut aligner Annecy sur les autres Tables pour l'hiver : +8 % sur la carte au 1er novembre. Ton ratio de la semaine est à ${ctx.ratio}. Qu'est-ce que tu proposes ?`,
      },
    ],
    sources: [
      {
        id: "commandes",
        titre: "Regarder comment la cuisine passe ses commandes",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Le chef commande et prépare sur les volumes des trois dernières semaines. Quand la salle baisse, la mise en place reste celle d'une semaine pleine : chaque couvert prévu qui ne vient pas fait jeter environ 6,60 € de produits. En novembre, avec 17 % de couverts en moins, c'est là que partent les pertes. Les réservations, elles, sont connues trois jours à l'avance.",
      },
      {
        id: "chambery",
        titre: "Appeler la gérante de la Table de Chambéry",
        cout: 0.5,
        nature: "utile",
        resultat:
          "« +7 % en octobre l'an dernier : 16 % de nos habitués en moins en novembre, et la moitié seulement revenus en mars. Notre formule du midi a ramené du monde, mais surtout des clients qui venaient déjà, à moindre prix. »",
      },
    ],
    question: "Comment préparez-vous novembre ?",
    options: [
      {
        t: "Caler commandes et mises en place sur les réservations",
        d: "Un point chaque matin entre le chef et Anouar, des commandes trois fois par semaine, la mise en place par petites quantités.",
      },
      {
        t: "Lancer une formule du midi à 19,50 € pour les actifs du quartier",
        d: "Entrée-plat ou plat-dessert sur l'ardoise, à partir de la semaine 9. Un prix d'appel : une partie viendra de la carte.",
      },
      {
        t: "Augmenter la carte de 8 % au 1er novembre",
        d: "Comme le propose le comité. Nouvelle carte imprimée.",
      },
      {
        t: "Ne rien changer",
        d: "Novembre est toujours creux. On passera le cap.",
      },
    ],
    reactions: [
      [
        {
          ...PHILEMON,
          texte:
            "Le point du matin avec Anouar prend dix minutes. On prépare pour ce qui est réservé, plus une marge, et le bac à pertes a fondu.",
        },
      ],
      null,
      [
        {
          ...ANOUAR,
          texte:
            "La nouvelle carte est en salle pour novembre. Deux tables d'habitués ont demandé l'addition sans dessert.",
        },
      ],
      [{ ...SERAPHIN, texte: "On fait comme chaque année. Novembre passera." }],
    ],
  },
  {
    moment: "Semaine 10 · lundi",
    titre: "Avant la fermeture pour travaux",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...KADIATOU,
        heure: "09:00",
        alerte: true,
        texte: `Clôture d'octobre, Table d'Augustin d'Annecy : ratio matière ${ctx.ratioMois}.`,
      },
      {
        ...SERAPHIN,
        heure: "10:15",
        texte:
          "Le nouveau piano arrive le 1er décembre : la cuisine ferme dix jours. Qu'est-ce qu'on fait du stock d'ici là ?",
      },
    ],
    sources: [
      {
        id: "stock",
        titre: "Faire le point du stock frais avec le second",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Avec la carte actuelle, la cuisine tient en moyenne ${ctx.stockFrais} de produits frais en chambre froide. Sans plan, six dixièmes ne passeront pas les dix jours de fermeture. Congelés, on en perd quatre sur dix : la texture des poissons et des légumes, et ce qui a déjà été décongelé ne se recongèle pas. Commandé au jour le jour les deux dernières semaines, avec une ardoise qui vide les chambres froides, il ne resterait presque rien.`,
      },
    ],
    question: "Comment finissez-vous le trimestre ?",
    options: [
      {
        t: "Un plan de fin de stock : commandes au jour le jour, ardoise qui vide les chambres froides",
        d: "À partir de la semaine 12, et un inventaire à deux, par zone, le dernier soir.",
      },
      {
        t: "Commander normalement jusqu'au bout, et congeler ce qui reste",
        d: "Sous vide et étiqueté, le dernier samedi. Une soirée de travail pour la brigade.",
      },
      {
        t: "Une remise de 20 % sur la carte les deux dernières semaines pour écouler le stock",
        d: "Annoncée en salle et sur les réseaux, semaines 12 et 13.",
      },
      {
        t: "Ne rien prévoir : on jettera ce qui ne tiendra pas",
        d: "La cuisine tourne normalement jusqu'au 30 novembre.",
      },
    ],
    reactions: [
      [
        {
          ...PHILEMON,
          texte:
            "On commande pour le lendemain, l'ardoise vide la chambre froide. L'inventaire du 30 se fera à deux, zone par zone, sous-sol compris.",
        },
      ],
      [
        {
          ...PHILEMON,
          texte:
            "On congèlera le dernier samedi. Je préviens : les poissons et les légumes n'en sortiront pas comme ils y sont entrés.",
        },
      ],
      [
        {
          ...ANOUAR,
          texte:
            "La remise est annoncée. Du monde en plus, oui, mais les habitués paient 20 % de moins ce qu'ils auraient payé plein tarif.",
        },
      ],
      [{ ...SERAPHIN, texte: "On verra le 30 au soir ce qu'il reste." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Mesurer, puis traiter la cause", chemin: [2, 1, 0, 1, 0, 0] },
  { nom: "Corriger par le prix", chemin: [0, 0, 1, 0, 2, 2] },
  { nom: "Attentiste", chemin: [3, 3, 3, 3, 3, 3] },
] as const;

/**
 * Les options réflexes : corriger le ratio par le prix de vente ou par le fournisseur,
 * sans avoir séparé la mesure, les achats, les pertes et les grammages. [décision, option].
 */
export const REFLEXES = [
  [0, 0],
  [3, 0],
  [4, 2],
] as const;

export const REPONSES = {
  carteAcceptee:
    "Première semaine de la carte courte : les habitués ont trouvé leurs plats, et la cuisine respire. Personne n'a rien réclamé.",
  carteRejetee:
    "Trois tables d'habitués ont demandé où était passé le tartare de truite. Deux bureaux du quartier déjeunent ailleurs le jeudi, « en attendant qu'il revienne ».",
  rodageLeger:
    "Vallorin livre depuis lundi. Deux références manquaient la première semaine, le chef a adapté l'ardoise. Ça se met en place.",
  rodageLourd:
    "Vallorin livre trois fois par semaine, et jamais avant 9 heures : deux services sans féra, des dépannages au cash and carry tous les deux jours. Le chef ne décolère pas.",
  formuleSucces:
    "La formule du midi fait le plein : des bureaux du quartier qu'on ne voyait jamais. Une partie de nos habitués de la carte la prennent aussi.",
  formuleTiede:
    "La formule du midi démarre doucement : quelques nouveaux, et surtout des habitués qui la prennent à la place de la carte.",
  critique:
    "Billet du jour : « La Table d'Augustin d'Annecy, plus chère et moins généreuse qu'en juin. Dommage pour une adresse qu'on aimait. » Partagé quatre cents fois.",
  critiqueNovembre:
    "Nouveau billet : « Deuxième hausse de l'année à la Table d'Augustin. Les Annéciens apprécieront. » Les commentaires citent deux bistrots de la rue voisine.",
  negativePerdue:
    "En rangeant la négative du sous-sol, j'ai trouvé des fonds, de la féra et du veau à date dépassée : 1 500 € à la poubelle. Personne ne savait qu'ils étaient là.",
} as const;
