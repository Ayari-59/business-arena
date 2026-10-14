/**
 * LE RÉSEAU D'AGENCES À REDESSINER — le contenu de l'épisode.
 *
 * Mathurin Escoffier dirige les opérations du réseau d'Arvel Distribution :
 * trente et une agences en Auvergne-Rhône-Alpes. Ce trimestre, la carte de
 * l'Est lyonnais se redessine : Talvère, un négoce régional qui grandit par
 * ouvertures, cherche un terrain à Mions, où une zone d'aménagement se vote
 * mi-décembre ; la direction financière veut fermer Bron, dernière du
 * classement ; l'agence de Villeurbanne-Nord décidée en juin attend son
 * ordre de service. Six décisions, chacune précédée de ce qu'un directeur
 * des opérations reçoit vraiment.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : le résultat affiché et la marge incrémentale d'une
 * agence à Mions, le compte de Bron et le report qu'il faudrait pour que sa
 * fermeture paie, le coût des deux ripostes à Talvère, la part de clients
 * nouveaux du point de retrait, ce que vaut le terrain du boulevard.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes, concurrents et chiffres sont fictifs.
 */
import type { Etape } from "./types";

const EUSTACHE = { de: "Eustache Lormier", role: "Président d'Arvel Distribution" } as const;
const SOLVEIG = {
  de: "Solveig Arnaudon",
  role: "Directrice administrative et financière",
} as const;
const MARCELLIN = { de: "Marcellin Fabregat", role: "Directeur commercial" } as const;
const ANICET = { de: "Anicet Valloton", role: "Directeur de l'agence de Saint-Priest" } as const;
const ALBERTINE = { de: "Albertine Lepage", role: "Directrice de l'agence de Bron" } as const;
const HIND = {
  de: "Hind Belarbi",
  role: "Responsable du point de retrait de Villeurbanne-Nord",
} as const;
const EDMOND = {
  de: "Edmond Rouvière",
  role: "Gérant de la SCI propriétaire, Villeurbanne-Nord",
} as const;
const ALDRIC = {
  de: "Aldric Pons",
  role: "Directeur de l'aménageur de la zone des Ormeaux",
} as const;
const DAPHNE = { de: "Daphné Roussillon", role: "Directrice des ressources humaines" } as const;
const PRESSE = { de: "Revue de presse", role: "Quotidien régional" } as const;

export const DIAGNOSTICS = [
  {
    id: "reseau",
    t: "Un site neuf prend d'abord ses clients aux agences voisines, et une agence fermée n'emporte pas tous les siens : il faut juger chaque site sur la marge qu'il ajoute au réseau, et proportionner l'engagement à une demande qui n'est pas sûre",
  },
  {
    id: "incertitude",
    t: "La croissance de Mions dépend d'un vote incertain : il faut un format qui puisse grandir avec la zone, ou attendre d'y voir clair",
  },
  {
    id: "terrain",
    t: "Le premier installé à Mions gardera la zone : il faut y être avant Talvère, et en grand",
  },
  {
    id: "papier",
    t: "Le réseau porte trop d'agences qui perdent de l'argent : il faut d'abord fermer les dernières du classement, à commencer par Bron",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Talvère cherche un terrain à Mions",
    jusqua: 2,
    messages: () => [
      {
        ...EUSTACHE,
        heure: "07:50",
        alerte: true,
        texte:
          "Mathurin, Talvère cherche un terrain à Mions. Si la zone des Ormeaux se fait, c'est le meilleur secteur de l'Est lyonnais pour dix ans. Je veux ta recommandation au comité de vendredi : on y va, et sous quelle forme ?",
      },
      {
        ...MARCELLIN,
        heure: "08:40",
        texte:
          "L'étude de zone est formelle : une agence complète à Mions, c'est 2,6 M€ de chiffre et 244 k€ de résultat par an. Si on n'y va pas, Talvère y sera au printemps. Occupons le terrain.",
      },
      {
        ...ANICET,
        heure: "09:30",
        texte:
          "Une agence à Mions ? La moitié de mes maçons y habitent. Ils passent chez moi le matin parce que c'est sur leur route… Ils passeraient chez elle.",
      },
      {
        ...SOLVEIG,
        heure: "10:05",
        texte:
          "Pour le même comité : le classement des agences après frais de siège est sorti. Bron est dernière, à −60 k€. Le président voudra en parler aussi.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "etude",
        titre: "Lire l'étude de zone du cabinet",
        cout: 1,
        nature: "decisive",
        resultat:
          "Une agence complète à Mions (1 500 m², parc à matériaux, livraison sur chantier) ferait 2,6 M€ de chiffre d'affaires à maturité. Coûts fixes propres : 380 k€ par an (loyer, sept personnes, véhicules, frais financiers du stock) ; travaux et aménagement : 350 k€. Avec le taux de marge sur coûts variables du réseau, 24 %, le cabinet affiche 244 k€ de résultat par an. Un comptoir-point de retrait de 300 m², réapprovisionné chaque nuit par Saint-Priest, ferait 1,35 M€, pour 140 k€ de coûts fixes et 80 k€ de travaux. L'étude ne dit pas d'où viendraient les clients.",
      },
      {
        id: "adresses",
        titre: "Croiser les adresses de livraison et les comptes clients de la zone",
        cout: 1,
        nature: "decisive",
        resultat:
          "Les artisans et entreprises installés dans la zone de Mions font déjà 1,2 M€ par an chez Arvel : 0,8 M€ à Saint-Priest, 0,4 M€ à Vénissieux. Sur le réseau, une agence ouverte à moins de 10 km de deux agences existantes leur a repris les trois quarts du chiffre qu'elles faisaient dans sa zone ; un comptoir, la moitié. Ces clients-là changeraient de site, pas de fournisseur : leur chiffre n'est pas nouveau pour le réseau.",
      },
      {
        id: "marche",
        titre: "Interroger le cabinet du vice-président à l'urbanisme, et ce qu'on sait de Talvère",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Mélusine Barral, directrice de cabinet : la zone des Ormeaux (1 600 logements, 20 hectares d'activités, le tram prolongé) se vote mi-décembre, et le financement du tram n'est pas bouclé : « une chance sur deux, honnêtement ». Si elle se fait, un négoce bien placé y fera 1 M€ de chiffre de plus par an. Talvère : sept ouvertures en cinq ans. Dans les zones sans négoce à moins de 5 km qu'elle a repérées, elle est venue sept fois sur dix ; une tournée de livraison ne l'a guère arrêtée. Face à un comptoir déjà ouvert, elle a renoncé deux fois sur trois ; face à une agence, elle n'est venue qu'une fois sur six ou sept. Là où elle s'est installée face à un négoce en place, elle lui a pris environ 12 % de son chiffre dans la zone.",
      },
      {
        id: "immobilier",
        titre: "Visiter le bâtiment proposé par Cassandre Ivanov, conseil en immobilier commercial",
        cout: 1,
        nature: "bruit",
        resultat:
          "1 800 m² sur la route de Lyon, quai de chargement, parking de quarante places, loyer négociable. « Talvère l'a visité la semaine dernière. Si vous le voulez, il faut signer avant Noël. » Le bâtiment est beau ; il ne dit rien de ce qu'une agence y gagnerait.",
      },
      {
        id: "conseil",
        titre: "Appeler Joséphine Carlier, qui a dirigé le réseau avant vous",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Joséphine Carlier : « Le compte d'exploitation d'une agence neuve se trompe toujours dans le même sens : il compte comme nouveau tout ce qu'elle vend. Demande-toi ce que le réseau vend de plus, une fois déduits les clients qu'elle prend aux voisines. Et quand la demande n'est pas sûre, commence petit : un comptoir s'agrandit, une agence ne rapetisse pas. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que recommandez-vous au comité pour Mions ?",
    options: [
      {
        t: "Ouvrir une agence complète à Mions au printemps, avant Talvère",
        d: "350 k€ de travaux, 380 k€ de coûts fixes par an, un bail de neuf ans. Ouverture en avril.",
      },
      {
        t: "Desservir la zone par une tournée quotidienne depuis Saint-Priest",
        d: "Un camion-grue et un chauffeur de plus : 80 k€ par an. Aucun site à Mions.",
      },
      {
        t: "Ouvrir un comptoir-point de retrait à Mions, qu'on agrandira si la zone se fait",
        d: "80 k€ de travaux dans un local existant, 140 k€ de coûts fixes par an. Ouvert en semaine 7.",
      },
      {
        t: "Attendre le vote de la zone d'aménagement avant d'engager quoi que ce soit",
        d: "Rien n'est dépensé ce trimestre. On reparlera de Mions en janvier.",
      },
    ],
    reactions: [
      [
        {
          ...EUSTACHE,
          texte:
            "Le comité valide l'agence de Mions : 350 k€ de travaux, ouverture en avril. Marcellin a déjà dessiné l'enseigne.",
        },
        {
          ...ANICET,
          texte: "Je vais présenter mes maçons de Mions à leur nouveau directeur, alors.",
        },
      ],
      [
        {
          ...ANICET,
          texte:
            "Le camion part demain à 6 h 30. Les artisans de Mions seront livrés avant 9 h, comme ceux de Saint-Priest.",
        },
      ],
      [
        {
          ...EUSTACHE,
          texte:
            "Va pour le comptoir. C'est petit, mais on y est. Marcellin aurait voulu plus grand ; il s'en remettra.",
        },
      ],
      [
        {
          ...MARCELLIN,
          texte: "On attend, donc. Talvère, elle, n'attendra pas.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Bron, dernière du classement",
    jusqua: 4,
    messages: () => [
      {
        ...SOLVEIG,
        heure: "08:30",
        alerte: true,
        texte:
          "Le président veut acter la fermeture de Bron au comité de lundi : −60 k€ cette année, la dernière des trente et une. Le bail arrive en fin de période triennale : pour partir au 30 juin, le préavis doit partir avant fin décembre.",
      },
      {
        ...ALBERTINE,
        heure: "09:15",
        texte:
          "J'ai appris par la rumeur que Bron était sur la liste. Mes artisans passent au comptoir à 7 h, en camionnette ; Saint-Priest, c'est vingt minutes de bouchons. Beaucoup ne suivront pas.",
      },
      {
        ...ANICET,
        heure: "11:00",
        texte:
          "Si Bron ferme, je prends ses clients avec plaisir. Il me faudra un vendeur et un chauffeur de plus.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "compte",
        titre: "Décomposer le compte de Bron",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Chiffre d'affaires : 2,0 M€ ; marge sur coûts variables (24 %) : 480 k€. Coûts fixes propres : 360 k€ (loyer, sept personnes, véhicules, énergie) ; ils disparaissent si l'agence ferme. Contribution de Bron : +120 k€. Frais de siège et de plateforme répartis au prorata du chiffre : 180 k€ ; ils ne disparaissent pas, ils se répartiront sur les trente autres agences. D'où le −60 k€. Fermer coûterait 90 k€ (indemnités, remise en état, transfert du stock), et Saint-Priest aurait besoin d'un vendeur et d'un chauffeur de plus : 75 k€ par an.",
      },
      {
        id: "report",
        titre: "Chercher ce que sont devenus les clients des agences fermées",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Quand le réseau a fermé Oullins, Saint-Genis-Laval (5 km) a gardé 52 % de son chiffre ; à Neuville, Caluire (8 km), 44 %, et moins encore quand un concurrent a repris le local laissé vide ; à Rive-de-Gier, Givors (14 km), 31 %. À Bron, 55 % du chiffre se fait au comptoir, des artisans du quartier qui passent le matin : ce sont eux qui partent. Pour que la fermeture rapporte quelque chose au réseau, sur cinq ans et frais de fermeture compris, il faudrait que plus de ${ctx.seuilFermeture} du chiffre suive à Saint-Priest. Personne ne peut le dire d'avance. Un test de six semaines — livraisons faites par Saint-Priest, comptoir fermé l'après-midi, suivi compte par compte — le mesurerait, pour 25 k€ ; le préavis pourrait encore partir en semaine 8.`,
      },
    ],
    question: "Que proposez-vous pour Bron ?",
    options: [
      {
        t: "Garder Bron telle quelle",
        d: "Rien ne change ; l'agence reste à −60 k€ dans le classement.",
      },
      {
        t: "Fermer Bron au 30 juin, comme le propose la direction financière",
        d: "Préavis envoyé lundi ; 90 k€ de frais de fermeture, un vendeur et un chauffeur de plus à Saint-Priest.",
      },
      {
        t: "Mesurer d'abord le report : six semaines de test, puis fermer seulement si plus de la moitié du chiffre suit",
        d: "25 k€ pour le test ; la décision tombe en semaine 8, avant la date du préavis.",
      },
    ],
    reactions: [
      [
        {
          ...SOLVEIG,
          texte:
            "Bron reste. Je la laisse dans le classement à −60 k€ ; le président me la redemandera l'an prochain.",
        },
      ],
      [
        {
          ...ALBERTINE,
          texte:
            "J'annonce la nouvelle à l'équipe lundi. Les artisans l'apprendront avant la fin de la semaine.",
        },
      ],
      [
        {
          ...ALBERTINE,
          texte:
            "Le test démarre lundi : Saint-Priest livre nos chantiers, le comptoir ferme à midi. Je note qui revient, et qui ne revient pas.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Talvère annonce Mions",
    jusqua: 6,
    messages: () => [
      {
        ...PRESSE,
        heure: "07:00",
        texte:
          "Ferdinand Oriol, directeur régional de Talvère : « Nous ouvrirons à Mions au printemps. L'Est lyonnais est notre priorité pour les trois ans qui viennent. »",
      },
      {
        ...EUSTACHE,
        heure: "09:20",
        alerte: true,
        texte:
          "Tu as lu Oriol ? Je ne veux pas apprendre en avril qu'on a perdu Mions. Marcellin propose de baisser nos prix sur toute la zone Est. Qu'est-ce que tu recommandes ?",
      },
      {
        ...MARCELLIN,
        heure: "10:00",
        texte:
          "Moins 3 % sur la zone Est jusqu'au printemps : ils comprendront qu'il n'y a pas de place pour eux.",
      },
      {
        ...ANICET,
        heure: "11:40",
        texte:
          "Mes vingt-cinq plus gros clients de la zone, je peux les engager sur un contrat annuel. Il faudra leur donner quelque chose.",
      },
    ],
    sources: [
      {
        id: "historique",
        titre: "Reprendre ce que Talvère a annoncé, et ce qu'elle a fait",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `En cinq ans, Talvère a annoncé douze ouvertures et en a fait sept, presque toutes dans des zones sans négoce à moins de 5 km. Face à un comptoir déjà ouvert, elle a renoncé deux fois sur trois ; face à une agence, elle n'est venue qu'une fois sur six ou sept. À Vienne, le négoce en place a baissé ses prix de 4 % dès l'annonce : Talvère a ouvert quand même, et les prix ne sont jamais remontés tout à fait. Vu ce qu'Arvel a décidé pour Mions (${ctx.presence}), le contrôle de gestion estime sa chance d'y ouvrir à ${ctx.chanceTalvere}.`,
      },
      {
        id: "ripostes",
        titre: "Chiffrer les deux ripostes",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Baisser les prix de 3 % sur la zone Est (5 M€ de chiffre par an) pendant six mois : 75 k€, plus un demi-point qui ne remontera pas l'an prochain, 25 k€. Là où Talvère s'est installée malgré une baisse, elle a pris 11 % au lieu de 12. Des contrats annuels avec les vingt-cinq plus gros comptes (3 M€ de chiffre) : 2,5 % de remise de fin d'année, 75 k€ ; là où Talvère s'est installée, les clients sous contrat sont partis deux fois moins. Si Talvère n'ouvre pas, ni l'une ni l'autre ne sert à rien.",
      },
    ],
    question: "Comment répondez-vous à l'annonce de Talvère ?",
    options: [
      {
        t: "Engager les vingt-cinq plus gros comptes de la zone par des contrats annuels",
        d: "2,5 % de remise de fin d'année ; ils s'engagent sur leurs volumes.",
      },
      {
        t: "Ne pas répondre à une annonce : suivre ce que Talvère fait vraiment (permis, recrutements)",
        d: "Rien à payer. La veille est confiée au contrôle de gestion.",
      },
      {
        t: "Baisser les prix de 3 % sur toute la zone Est jusqu'au printemps",
        d: "Effet immédiat sur les marges de Saint-Priest et de Vénissieux ; un message clair à Talvère.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...EUSTACHE,
          texte: "Soit. Mais si Talvère pose une pierre à Mions, je veux le savoir le jour même.",
        },
      ],
      [
        {
          ...MARCELLIN,
          texte: "Les nouveaux prix sont en agence lundi. Les artisans apprécient.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Villeurbanne-Nord : les premiers chiffres",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...HIND,
        heure: "08:00",
        texte: `Huit semaines d'ouverture : ${ctx.hebdoPR} de chiffre par semaine, pour 10 k€ au plan. Les artisans adorent : ils commandent la veille, ils retirent à 6 h 30.`,
      },
      {
        ...MARCELLIN,
        heure: "09:10",
        alerte: true,
        texte: `Le point de retrait fait ${ctx.depassement} de plus que le plan. Le permis est obtenu, l'entreprise attend l'ordre de service pour l'agence décidée en juin. On lance les travaux lundi ?`,
      },
      {
        ...EDMOND,
        heure: "15:00",
        texte:
          "Monsieur Escoffier, la condition suspensive est levée avec le permis. Je compte sur votre ordre de service, comme convenu en juin.",
      },
    ],
    sources: [
      {
        id: "comptes",
        titre:
          "Croiser les comptes clients du point de retrait avec ceux de Villeurbanne et de Vaulx",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${ctx.partReprise} du chiffre du point de retrait vient de clients qui achetaient déjà à Villeurbanne (2,5 km) ou à Vaulx-en-Velin : leurs achats chez Arvel n'ont pas bougé, ils ont changé de comptoir. Les clients vraiment nouveaux font ${ctx.partNouvelle} du chiffre. Le plan de juin comptait les 2 M€ de l'agence comme entièrement nouveaux, d'où ses 250 k€ de résultat par an. Une agence complète attire aussi des clients que le point de retrait ne voit pas : sur le réseau, sa part de clients nouveaux a dépassé d'une vingtaine de points celle de son point de retrait d'essai. Ici, cela ferait ${ctx.caNouveauAgence} de chiffre nouveau, pour 230 k€ de coûts fixes par an et 100 k€ de travaux.`,
      },
      {
        id: "secteur",
        titre: "Demander au contrôle de gestion l'état du marché de Villeurbanne-Nord",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Gauvain Pecqueur, contrôleur de gestion du réseau : quatre négoces dans un rayon de 3 km, dont deux agences Arvel ; les permis de construire du secteur baissent de 2 % par an depuis trois ans. Une zone saturée : un nouveau site y déplace des clients plus qu'il n'en crée. Garder le point de retrait coûte 40 k€ par an. Sortir du bail coûte trois mois de loyer, 27 k€ ; le bailleur négociera peut-être.",
      },
    ],
    question: "Que décidez-vous pour Villeurbanne-Nord ?",
    options: [
      {
        t: "Lancer les travaux de l'agence comme prévu : le test dépasse ses objectifs",
        d: "100 k€ de travaux, 230 k€ de coûts fixes par an ; le point de retrait déménage dans l'agence en avril.",
      },
      {
        t: "Renoncer à l'agence et garder le point de retrait",
        d: "Le bail se rompt contre une indemnité ; le point de retrait continue, 40 k€ de coûts fixes par an.",
      },
      {
        t: "Renoncer à tout : rompre le bail et fermer le point de retrait à la fin de l'essai",
        d: "L'indemnité du bail ; plus rien à Villeurbanne-Nord en janvier.",
      },
    ],
    reactions: [
      [
        {
          ...MARCELLIN,
          texte: "Ordre de service signé. On inaugure en avril !",
        },
      ],
      null,
      null,
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Le terrain du boulevard",
    jusqua: 10,
    messages: () => [
      {
        ...ALDRIC,
        heure: "09:00",
        alerte: true,
        texte:
          "Monsieur Escoffier, il me reste un lot commercial sur le futur boulevard des Ormeaux : 5 000 m², 900 k€. Talvère l'a visité mardi. Je peux vous le vendre, ou vous le réserver un an pour 35 k€, déduits du prix si vous l'achetez. Le vote est le 12 décembre.",
      },
      {
        ...EUSTACHE,
        heure: "10:30",
        texte:
          "Achète-le. Si la zone se fait, c'est le meilleur emplacement de l'Est lyonnais ; si Talvère l'a, on a perdu Mions pour vingt ans.",
      },
      {
        ...SOLVEIG,
        heure: "11:15",
        texte:
          "900 k€, c'est 60 % de l'enveloppe du plan de réseau. Et si la zone ne se fait pas, un terrain nu en bordure de champ, ça se revend mal.",
      },
    ],
    sources: [
      {
        id: "valeur",
        titre: "Chiffrer ce que vaut le terrain, selon le vote",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Si la zone est votée, une agence sur le boulevard ferait 1,2 M€ de chiffre de plus par an que sans la zone ; sur un autre emplacement, trouvé plus tard, 1 M€. ${ctx.usageTerrain} Si la zone est repoussée, le terrain acheté se revendrait 20 % sous son prix, soit 180 k€ de perte, et la réservation serait perdue : 35 k€. Si elle est votée, l'achat et la réservation mènent au même terrain, au même prix.`,
      },
      {
        id: "vote",
        titre: "Rappeler Mélusine Barral sur le vote",
        cout: 0.5,
        nature: "utile",
        resultat:
          "« Toujours une chance sur deux. Le tram dépend de l'État, qui ne répondra pas avant le vote. » Talvère n'a pas fait d'offre sur le terrain : d'après l'aménageur, elle attend le vote, elle aussi. Qu'Arvel achète le lot lui retirerait le meilleur emplacement, pas la zone.",
      },
    ],
    question: "Que faites-vous du terrain du boulevard ?",
    options: [
      {
        t: "Réserver le terrain pour un an",
        d: "35 k€ non remboursables, déduits du prix si l'on achète.",
      },
      {
        t: "Acheter le terrain tout de suite, pour que Talvère ne l'ait pas",
        d: "900 k€ engagés, 60 % de l'enveloppe du plan de réseau.",
      },
      {
        t: "Ne rien prendre : attendre le vote",
        d: "Rien à payer. Après le vote, le lot ira au premier qui le demandera.",
      },
    ],
    reactions: [
      [
        {
          ...ALDRIC,
          texte:
            "Réservation enregistrée jusqu'à la fin de l'an prochain. Le lot est à vous si vous le voulez.",
        },
      ],
      [
        {
          ...ALDRIC,
          texte: "Compromis signé. Je préviens Talvère que le lot est vendu.",
        },
      ],
      [
        {
          ...ALDRIC,
          texte: "Entendu. Je ne peux rien vous promettre après le 12.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Les primes des directeurs d'agence",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...DAPHNE,
        heure: "09:00",
        alerte: true,
        texte:
          "Les règles de prime des directeurs d'agence pour l'an prochain partent en décembre. Aujourd'hui, chacun touche sur le résultat de son agence. On garde ?",
      },
      {
        ...ANICET,
        heure: "11:20",
        texte: ctx.mionsOuvert
          ? `Mathurin, le site de Mions ${ctx.format === "comptoir" ? "me prend" : "va me prendre"} mes clients, et c'est moi qu'on jugera sur la baisse. J'ai déjà fait quelques remises pour en garder.${
              ctx.vnDispute
                ? " Je ne suis pas le seul : à Villeurbanne, ils font pareil avec le point de retrait."
                : ""
            }`
          : ctx.vnDispute
            ? "À Villeurbanne, ils font des remises pour garder les clients que le point de retrait leur prend. Entre sites Arvel, ça ne rapporte rien à personne."
            : "De mon côté, rien ne bouge entre nos sites cette année. Les primes, ça me va comme elles sont.",
      },
      {
        ...SOLVEIG,
        heure: "14:30",
        texte:
          "Si tu veux neutraliser leurs pertes de chiffre dans les objectifs, c'est une prime payée deux fois sur le même chiffre.",
      },
    ],
    sources: [
      {
        id: "remises",
        titre: "Mesurer ce que coûte le chiffre disputé entre nos propres sites",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.dispute
            ? `L'an prochain, ${ctx.disputeKE} de chiffre passeront d'un site Arvel à un autre (Mions, Villeurbanne-Nord). Avec des primes sur le résultat de chaque agence, les directeurs se le disputent : remises entre sites, clients renvoyés de l'un à l'autre. Sur le réseau, cela a coûté 4,5 % du chiffre disputé, soit ${ctx.coutChacun} ici. Neutraliser le chiffre transféré dans les objectifs, c'est une prime payée deux fois : 1,8 %, ${ctx.coutNeutraliser}. Une part de la prime sur la marge du bassin (Saint-Priest, Vénissieux, Bron, Mions, Villeurbanne) ne laisse que 0,6 % de flottement la première année, ${ctx.coutBassin}.`
            : "Aucun chiffre ne passera d'un site Arvel à un autre l'an prochain : la règle des primes ne coûtera rien de plus, quelle qu'elle soit.",
      },
      {
        id: "pratiques",
        titre: "Demander à Daphné Roussillon ce que font les autres réseaux",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les réseaux qui ouvrent des comptoirs ont presque tous mis une part de la prime sur le bassin, 30 à 40 %. Ceux qui ont gardé la prime à l'agence ont vu leurs directeurs refuser d'envoyer des clients au nouveau site.",
      },
    ],
    question: "Quelle règle de prime retenez-vous ?",
    options: [
      {
        t: "Mettre 40 % de la prime sur la marge du bassin de l'Est lyonnais",
        d: "Les directeurs jugés aussi sur ce que leurs agences gagnent ensemble.",
      },
      {
        t: "Neutraliser dans les objectifs le chiffre parti vers les nouveaux sites",
        d: "Les directeurs qui perdent des clients au profit d'un site Arvel gardent leur prime sur ce chiffre.",
      },
      {
        t: "Garder la règle : chaque directeur jugé sur le résultat de son agence",
        d: "Rien ne change ; chacun reste responsable de son compte.",
      },
    ],
    reactions: [
      [
        {
          ...ANICET,
          texte:
            "Le bassin, je veux bien. À condition que Mions et Villeurbanne jouent le jeu aussi.",
        },
      ],
      [
        {
          ...SOLVEIG,
          texte: "Je provisionne les primes. Deux fois, sur le même chiffre.",
        },
      ],
      [
        {
          ...ANICET,
          texte: "Alors je défends mes clients. Chacun pour soi.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "La marge du réseau", chemin: [2, 2, 1, 1, 0, 0] },
  { nom: "Occuper le terrain, couper ce qui perd", chemin: [0, 1, 2, 0, 1, 2] },
  { nom: "Attentiste", chemin: [3, 0, 1, 0, 2, 2] },
] as const;

/**
 * Les réflexes du comité devant une carte de réseau : ouvrir en grand là où
 * le concurrent arrive, fermer la dernière du classement, riposter par les
 * prix, poursuivre un plan que les chiffres démentent, acheter le terrain
 * pour l'empêcher d'y venir, laisser chaque directeur défendre son compte.
 * [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [1, 1],
  [2, 2],
  [3, 0],
  [4, 1],
  [5, 2],
] as const;

export const REPONSES = {
  contrats: (n: number) =>
    `${n} des 25 comptes ont signé leur contrat annuel. Les autres « réfléchissent » : ils attendent de voir si Talvère vient vraiment.`,
  deditEntier:
    "Le bailleur exige ses trois mois de loyer : 27 k€. « Je refusais d'autres locataires pour vous. »",
  deditMoitie:
    "Après discussion, le bailleur accepte la moitié, 13,5 k€ : il a déjà un autre candidat pour le bâtiment.",
  prFerme:
    "Le point de retrait fermera à la fin de l'essai. Hind Belarbi rejoint l'agence de Villeurbanne.",
  prGarde: "Le point de retrait continue. Hind Belarbi garde son équipe de deux.",
  testFerme: (report: string) =>
    `Six semaines de test : ${report} du chiffre des clients de Bron est passé par Saint-Priest. Plus de la moitié : le préavis part lundi, Bron fermera au 30 juin.`,
  testGarde: (report: string) =>
    `Six semaines de test : ${report} seulement du chiffre des clients de Bron est passé par Saint-Priest. Moins de la moitié : Bron reste ouverte, le comptoir rouvre l'après-midi.`,
  reportMesure: (report: string) =>
    `Depuis l'annonce de la fermeture, ${report} du chiffre des clients de Bron passe déjà par Saint-Priest. Les autres sont partis chez les négoces de Bron et de Villeurbanne.`,
  localRepris:
    "Le bailleur de Bron a reloué le local à un négoce concurrent, qui ouvre en juillet : une partie des clients qui devaient suivre à Saint-Priest resteront dans le quartier, chez lui.",
  localLibre:
    "Le local de Bron n'a pas trouvé preneur : aucun concurrent ne s'installe à la place.",
  talvereOuvre: "Talvère a signé un bail à Mions, route de Lyon. Ouverture prévue en mai.",
  talvereRenonce:
    "Talvère renonce à Mions : elle ouvrira finalement à Heyrieux, à quinze kilomètres, hors de notre zone.",
  projetVote:
    "Le conseil de la Métropole a voté la zone des Ormeaux : 1 600 logements, 20 hectares d'activités, le tram prolongé. Les premiers chantiers démarrent au printemps.",
  projetRepousse:
    "Le conseil de la Métropole repousse la zone des Ormeaux : le financement du tram n'est pas bouclé. Rien avant deux ou trois ans.",
  comptoir:
    "Le comptoir de Mions a ouvert lundi. Une quarantaine d'artisans sont passés la première semaine ; la moitié venaient de Saint-Priest.",
} as const;
