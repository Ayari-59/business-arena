/**
 * LES CHANGEMENTS QUI MANGENT LA LIGNE — le contenu de l'épisode.
 *
 * Gurvan Kerebel est responsable de production de l'usine de Loudéac de la
 * Laiterie de Kerbrélan. La ligne 3 conditionne des yaourts aromatisés en
 * pots de 125 g, en packs de 4, 8 et 12 ; son TRS est de 57 %, les commandes
 * de l'été ne passeront pas, et le directeur industriel propose une deuxième
 * ligne ou des samedis. Six décisions, d'avril à juin, chacune précédée de ce
 * qu'un responsable de production reçoit vraiment.
 *
 * La notion est la DÉCOMPOSITION DU TRS : disponibilité, performance,
 * qualité. Le relevé des arrêts dit où partent les heures ; sur une ligne de
 * produits frais aux nombreuses références, c'est d'abord aux changements de
 * format et aux nettoyages entre recettes. On les regagne en préparant hors
 * arrêt ce qui peut l'être (SMED) et en ordonnant les recettes, pas avec une
 * ligne de plus ni des heures majorées, et jamais en écourtant un nettoyage.
 * Toutes les données des calculs sont dans les sources ; aucune ne les fait
 * à la place du joueur.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Contexte, Etape } from "./types";

const EFFLAM = { de: "Efflam Jézéquel", role: "Directeur industriel" } as const;
const ERWANN = { de: "Erwann Tromeur", role: "Chef de l'atelier de conditionnement" } as const;
const YSEE = { de: "Ysée Bescond", role: "Responsable supply chain" } as const;
const ANNAIG = { de: "Annaïg Le Dantec", role: "Responsable qualité" } as const;
const KLERVI = { de: "Klervi Nédélec", role: "Responsable maintenance" } as const;
const MAEWENN = { de: "Maëwenn Postec", role: "Directrice des ressources humaines" } as const;
const AZILIS = { de: "Azilis Cozic", role: "Responsable emballages et développement" } as const;
const IWAN = { de: "Iwan Szymanski", role: "Directeur administratif et financier" } as const;
const MAODAN = {
  de: "Maodan Kerdudal",
  role: "Conducteur de la ligne 3, équipe du matin",
} as const;
const DJAMILA = {
  de: "Djamila Hadjadj",
  role: "Conductrice de la ligne 3, équipe d'après-midi",
} as const;
const KOUADIO = { de: "Kouadio Assamoi", role: "Chef d'équipe d'après-midi" } as const;
const WOJTEK = { de: "Wojtek Pawlak", role: "Technicien méthodes" } as const;
const STIJN = { de: "Stijn Vandeweghe", role: "Ingénieur commercial, Ardoform" } as const;
const TABLEAU = { de: "Suivi de la ligne 3", role: "Point hebdomadaire" } as const;

/** Ce que Djamila laisse voir de l'équipe d'après-midi, selon la réponse de la semaine 1. */
export function equipeDApresMidi(ctx: Contexte): string {
  switch (ctx.reponse) {
    case 2:
      return "Djamila, de l'équipe d'après-midi, a déjà dessiné le chariot de changement qu'il faudrait, et noté où ranger chaque outil.";
    case 1:
      return "Djamila, de l'équipe d'après-midi, sort de son premier samedi : « Encore un projet ? On verra quand on aura dormi. »";
    default:
      return "Djamila, de l'équipe d'après-midi, attend de voir ce qu'on leur demandera : « D'habitude, on nous chronomètre, et rien ne change. »";
  }
}

export const DIAGNOSTICS = [
  {
    id: "changements",
    t: "La ligne perd la moitié de ses heures perdues aux changements de format et aux nettoyages entre recettes : la capacité de l'été est là",
  },
  {
    id: "doseur",
    t: "Les micro-arrêts du doseur font chuter la performance de la ligne",
  },
  {
    id: "capacite",
    t: "La ligne 3 est trop petite pour les volumes de l'été : il faut une deuxième ligne",
  },
  {
    id: "cadence",
    t: "Les équipes ne tiennent pas la cadence : il faut les relancer et suivre le TRS équipe par équipe",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Une ligne à 57 %",
    jusqua: 3,
    messages: () => [
      {
        ...TABLEAU,
        heure: "07:30",
        alerte: true,
        texte:
          "TRS de la ligne 3 sur les quatre dernières semaines : 57 %, pour un objectif d'usine de 70 %. 912 500 pots bons par semaine. Plan industriel et commercial : 920 000 pots commandés cette semaine, 1,2 million attendus fin juin.",
      },
      {
        ...EFFLAM,
        heure: "08:15",
        texte:
          "Gurvan, la ligne 3 ne passera pas l'été. Je vois deux solutions : une deuxième ligne, j'ai un devis d'Ardoform, ou des équipes le samedi dès ce mois-ci. Le comité de direction se réunit vendredi : dis-moi ce que tu proposes.",
      },
      {
        ...YSEE,
        heure: "09:00",
        texte:
          "Les enseignes ont confirmé leurs plans d'été : près d'un tiers de yaourts aromatisés en plus entre avril et fin juin. Celtis, Opaline et Proxival appliquent leurs pénalités logistiques dès que le taux de service passe sous 98,5 % : 20 % de la valeur de chaque pot manquant.",
      },
      {
        ...MAODAN,
        heure: "10:20",
        texte:
          "Hier, trois arrêts pour nettoyer ou changer de pack. Entre deux, la ligne tourne bien, quand le doseur ne bloque pas.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "releve",
        titre: "Dépouiller le relevé des arrêts des quatre dernières semaines",
        cout: 1.5,
        nature: "decisive",
        resultat:
          "Erwann et Maodan ont repris les fiches d'arrêt de quatre semaines, 80 heures d'ouverture chacune. Semaine moyenne : 6 changements de format (outil de découpe, film, fourreaux, réglages), de 65 minutes chacun ; 9 nettoyages en place entre deux recettes, de 70 minutes chacun, dont 45 de cycle validé ; 470 micro-arrêts du doseur, d'une minute et quart en moyenne. Au contrôle d'étanchéité, 7,2 % des pots produits sont écartés, mal scellés ; à chaque redémarrage après un changement ou un NEP, 5 000 pots partent en purge : le mélange d'eau et de produit chassé des tuyauteries, puis les premiers pots, mal dosés ou mal scellés, le temps que la ligne se règle. Pannes longues : aucune sur la période.",
      },
      {
        id: "planning",
        titre: "Relire avec Ysée le planning de fabrication de la semaine dernière",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les recettes passent dans l'ordre des commandes reçues la veille. Sur les 9 NEP de la semaine, 4 ont suivi une recette avec allergène (praliné aux noisettes, biscuit au blé) avant une recette qui n'en contient pas, 3 un parfum foncé (fruits rouges, cerise) avant un clair (vanille, citron), 2 une recette conventionnelle avant une recette bio. Les packs de 4, 8 et 12 alternent au fil des commandes.",
      },
      {
        id: "chrono",
        titre: "Chronométrer un changement de format sur la ligne",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Mardi, changement du pack de 8 au pack de 12 : 66 minutes de ligne arrêtée. On est allé chercher l'outil de découpe au magasin, on a monté la bobine d'opercules du parfum suivant, attendu la recette au poste de mix, puis le feu vert du laboratoire. Une bonne moitié de ces gestes n'avait pas besoin de la ligne arrêtée.",
      },
      {
        id: "devis",
        titre: "Lire le devis d'Ardoform pour une deuxième ligne",
        cout: 1,
        nature: "bruit",
        resultat:
          "Thermoformeuse-remplisseuse-scelleuse de 24 000 pots à l'heure : 2,4 M€ installée. Livraison neuf mois après la commande, soit en janvier au plus tôt, puis trois mois de montée en cadence. Stijn Vandeweghe : « Nos clients laitiers gagnent dix points de TRS dès la première année. »",
      },
      {
        id: "conseil",
        titre: "Appeler Primaël Kerlogot, ancien responsable de production de l'usine",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Primaël Kerlogot : « Un TRS, ça ne se soigne pas d'un bloc. Coupe-le en trois, regarde où partent les heures. Sur une ligne qui fait beaucoup de parfums, c'est rarement la machine qui manque. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que proposez-vous au comité de vendredi ?",
    options: [
      {
        t: "Demander une deuxième ligne de conditionnement",
        d: "2,4 M€, livrée en janvier. 24 000 € d'étude d'ingénierie engagés tout de suite ; la maintenance et les méthodes rédigent le cahier des charges.",
      },
      {
        t: "Ouvrir des équipes le samedi dès la semaine 3",
        d: "Quatre samedis en deux équipes, jusqu'à mi-mai : 16 heures d'ouverture de plus chacun, 6 500 € le samedi.",
      },
      {
        t: "Décomposer les pertes de la ligne avec les équipes, et s'attaquer d'abord aux changements et aux nettoyages",
        d: "Une revue des arrêts avec les conducteurs des deux équipes, puis un chantier sur les changements. Quelques heures de conducteurs par semaine.",
      },
      {
        t: "Attendre les chiffres de mai pour décider",
        d: "Rien d'engagé avant d'y voir plus clair.",
      },
    ],
    reactions: [
      [
        {
          ...EFFLAM,
          texte:
            "Le comité lance l'étude. Ardoform demande notre cahier des charges sous trois semaines : Klervi et Wojtek s'y mettent.",
        },
      ],
      [
        {
          ...MAEWENN,
          texte:
            "Le CSE a été informé. Les volontaires sont trouvés pour les deux équipes du samedi ; certains enchaîneront quatre semaines de six jours.",
        },
      ],
      [
        {
          ...MAODAN,
          texte:
            "On a repris les arrêts ensemble. Personne ne nous avait demandé ce qui nous faisait perdre du temps. Dès cette semaine, on prépare la recette suivante pendant que la ligne tourne.",
        },
      ],
      [
        {
          ...EFFLAM,
          texte: "Le comité prend note. Il m'a demandé ce qu'on ferait si mai déborde.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "Le chantier des changements",
    jusqua: 5,
    messages: (ctx) => [
      {
        ...ERWANN,
        heure: "08:40",
        alerte: true,
        texte: `Gurvan, ${ctx.heures} de changements et de NEP sur la ligne 3 cette semaine. Il faut décider comment on attaque les changements : chaque semaine qui passe, mai se rapproche.`,
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Semaine 3 : TRS ${ctx.trs}, taux de service depuis avril ${ctx.service}. Commandes de la semaine : ${ctx.demande} pots.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "video",
        titre: "Filmer un changement complet avec les conducteurs des deux équipes",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Sur les 65 minutes d'un changement de format, 33 peuvent se faire ligne en marche : l'outil de découpe préparé et préréglé sur un chariot, les bobines d'opercules et les fourreaux du format suivant au pied de la ligne, la recette suivante prête au poste de mix. Sur les 25 minutes d'un NEP qui ne sont pas le cycle validé, 18 sont du démontage et de l'attente : pièces du doseur cherchées, laboratoire prévenu au dernier moment. Maodan : « Ça, on peut le préparer nous-mêmes. » ${equipeDApresMidi(ctx)}`,
      },
      {
        id: "facons",
        titre: "Chiffrer les façons de mener le chantier",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Avec les conducteurs : deux demi-journées de formation par équipe, un chariot de changement et des kits d'outils, 3 500 € ; premiers gains deux semaines après le début, si les deux équipes suivent. Par le service méthodes : Wojtek écrit le standard et le fait afficher, quatre semaines. Par le fabricant : des outils à serrage rapide, 16 000 €, livrés en semaine 8, pour les changements de format seulement ; le changement passerait à 42 minutes.",
      },
    ],
    question: "Comment menez-vous le chantier ?",
    options: [
      {
        t: "Avec les conducteurs et les régleurs des deux équipes",
        d: "Filmer, trier ce qui peut se faire ligne en marche, préparer un chariot et des kits. 3 500 €, deux demi-journées par équipe.",
      },
      {
        t: "Confier au service méthodes l'écriture d'un nouveau standard",
        d: "Wojtek Pawlak l'écrit et le fait afficher au poste. Rien à payer, quatre semaines.",
      },
      {
        t: "Acheter au fabricant des outils à serrage rapide",
        d: "16 000 €, livrés en semaine 8. Les changements de format seulement.",
      },
      {
        t: "Pas de chantier avant l'été",
        d: "Les équipes ont assez à faire avec les volumes.",
      },
    ],
    reactions: [
      [
        {
          ...MAODAN,
          texte:
            "On a filmé le changement de mardi et on l'a regardé à six. Ça fait drôle de se voir chercher une clé pendant huit minutes.",
        },
      ],
      [
        {
          ...WOJTEK,
          texte:
            "Je prends les mesures cette semaine sur les deux équipes. Le standard sera affiché fin avril.",
        },
      ],
      [
        {
          ...STIJN,
          texte: "Commande enregistrée. Les outils à serrage rapide seront livrés en semaine 8.",
        },
      ],
      [
        {
          ...ERWANN,
          texte: "Compris. On fera avec les changements qu'on a.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "L'ordre des recettes",
    jusqua: 7,
    messages: (ctx) => [
      {
        ...YSEE,
        heure: "09:10",
        alerte: true,
        texte: `Mai commence : ${ctx.demande} pots commandés cette semaine, et un taux de service de ${ctx.service} depuis avril. Je refais le planning de fabrication pour la semaine prochaine : dans quel ordre veux-tu les recettes ?`,
      },
      {
        ...EFFLAM,
        heure: "11:30",
        texte:
          "Et si on passait en campagnes ? Un parfum par jour, de longues séries, presque plus de nettoyages : le TRS grimperait d'un coup.",
      },
    ],
    sources: [
      {
        id: "matrice",
        titre: "Reprendre avec Annaïg la matrice des enchaînements de recettes",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Un NEP complet est obligatoire après une recette avec allergène, avant une recette qui n'en contient pas ou un autre allergène ; d'un parfum foncé vers un clair ; d'une recette conventionnelle vers une recette bio. Dans l'autre sens, un rinçage pendant le changement suffit. En enchaînant chaque jour le bio, le nature, les parfums clairs, les foncés, puis le praliné et le biscuit avant le NEP du soir, il ne reste qu'un NEP par jour en production, entre les deux allergènes : 5 par semaine au lieu de 9. Les packs regroupés dans la journée : 5 changements de format au lieu de 6.",
      },
      {
        id: "dlc",
        titre: "Demander à Ysée ce qu'une série longue fait au stock",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "DLC de 30 jours, et les enseignes refusent un pot qui arrive avec moins des deux tiers de sa DLC : il doit partir dans les dix jours. Aujourd'hui, deux jours de stock. En campagnes, chaque parfum fabriqué une fois par semaine : 2 NEP et 3 changements de format, mais cinq jours de stock moyen, la chambre froide pleine et un entrepôt frigorifique chez Kerfroid à 3 500 € la semaine. À Pontivy, des campagnes sur les crèmes desserts avaient fait monter la casse à près de 4 % : palettes refusées pour DLC courte, données aux associations ou détruites, et davantage quand les commandes fléchissent.",
      },
      {
        id: "lignes",
        titre: "Comparer le TRS des autres lignes de l'usine",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Ligne 1, yaourts nature en gros conditionnements : 71 %. Ligne 5, fromage blanc : 68 %. Ligne 2, desserts lactés : 62 %. La ligne 3 est la dernière de l'usine.",
      },
    ],
    question: "Dans quel ordre fabriquez-vous ?",
    options: [
      {
        t: "Passer en campagnes hebdomadaires : un parfum, une longue série",
        d: "2 NEP et 3 changements de format par semaine. Plus de stock en chambre froide, et un entrepôt extérieur.",
      },
      {
        t: "Une roue quotidienne : bio, nature, clairs, foncés, puis les recettes avec allergène avant le NEP du soir",
        d: "Chaque parfum fabriqué chaque jour, dans un ordre fixe. Le planning se refait avec Ysée.",
      },
      {
        t: "Regrouper les recettes avec allergène sur le vendredi",
        d: "Le reste de la semaine dans l'ordre des commandes.",
      },
      {
        t: "Garder l'ordre des commandes",
        d: "Ce qui est commandé la veille se fabrique le lendemain, dans l'ordre.",
      },
    ],
    reactions: [
      [
        {
          ...YSEE,
          texte:
            "Planning en campagnes à partir de lundi. J'ai réservé de la place chez Kerfroid : la chambre froide ne suffira pas.",
        },
      ],
      [
        {
          ...DJAMILA,
          texte:
            "La roue est affichée au poste. On sait ce qui vient après, on le prépare avant : plus de surprise à 15 heures.",
        },
      ],
      [
        {
          ...YSEE,
          texte:
            "Le praliné et le biscuit passent le vendredi. Les enseignes recevront ces deux parfums une fois par semaine.",
        },
      ],
      [
        {
          ...MAODAN,
          texte: "Toujours l'ordre des commandes. Ce matin, trois NEP avant midi.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Juin arrive",
    jusqua: 9,
    messages: (ctx) => [
      {
        ...EFFLAM,
        heure: "08:30",
        alerte: true,
        texte: `Gurvan, en juin les enseignes nous demanderont jusqu'à 1,2 million de pots par semaine ; cette semaine, la ligne peut en livrer ${ctx.capacite}. Qu'est-ce que tu fais pour juin ?`,
      },
      {
        ...KOUADIO,
        heure: "14:50",
        texte:
          "Gurvan, une idée de l'équipe : on fait les NEP entre recettes en 45 minutes au lieu de 70, sans le rinçage acide et avec une désinfection plus courte. Les cuves sont propres à l'œil, on le voit bien.",
      },
      {
        ...KLERVI,
        heure: "16:10",
        texte:
          "Le doseur de la ligne 3 s'arrête toujours autant. Je peux te dire pourquoi, si tu veux.",
      },
    ],
    sources: [
      {
        id: "doseur",
        titre: "Demander à Klervi ce qui fait caler le doseur",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Klervi Nédélec : « Les clapets et les joints du doseur sont usés : il prend de l'air, la sonde de niveau coupe, la ligne cale. Une révision complète prend une journée : on peut la faire un samedi, la ligne ne tourne pas. 6 500 € de pièces, 1 200 € de majorations. Les micro-arrêts passeraient de 9,8 heures à 6,5 heures par semaine dès la semaine 8. »",
      },
      {
        id: "plan",
        titre: "Demander à Annaïg ce que dit le plan de nettoyage",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Annaïg Le Dantec : « Les 45 minutes du cycle sont validées : temps de contact, température et concentration de la soude et de l'acide, désinfection. Les raccourcir, c'est sortir du plan de maîtrise sanitaire. Sur des lignes comparables, près d'une fois sur deux, un prélèvement de surface revient positif à Listeria dans le mois : les lots de trois jours bloqués en attendant les analyses des produits, une journée de décontamination, et la moitié des lots libérés trop tard pour leur DLC. Une cuve propre à l'œil n'est pas une cuve propre. »",
      },
      {
        id: "samedis",
        titre: "Demander à Maëwenn ce que coûtent des samedis en juin",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Un samedi en deux équipes : 6 500 €, heures majorées, laboratoire et maintenance d'astreinte compris, pour 16 heures d'ouverture de plus. Après trois semaines de six jours, les micro-arrêts et les rebuts remontent, et les accidents aussi : l'industrie laitière a un taux de fréquence autour de 30, et il monte avec la fatigue.",
      },
    ],
    question: "Comment préparez-vous juin ?",
    options: [
      {
        t: "Raccourcir les NEP entre recettes de 70 à 45 minutes",
        d: "Le rinçage acide supprimé, la désinfection écourtée. Vingt-cinq minutes de production en plus par NEP, dès la semaine 8.",
      },
      {
        t: "Faire réviser le doseur un samedi : clapets, joints et réglages",
        d: "7 700 €, pièces et majorations. La ligne ne s'arrête pas en semaine.",
      },
      {
        t: "Ouvrir les samedis de juin, semaines 9 à 13",
        d: "Deux équipes, 16 heures d'ouverture de plus chaque samedi. 6 500 € le samedi.",
      },
      {
        t: "Ne rien changer",
        d: "Juin passera avec la ligne telle qu'elle est.",
      },
    ],
    reactions: [
      [
        {
          ...ANNAIG,
          texte:
            "Je note que les NEP de la ligne 3 sortent du cycle validé à partir de lundi. Je renforce les prélèvements de surface ; je ne signerai pas cette dérogation.",
        },
      ],
      [
        {
          ...KLERVI,
          texte:
            "Pièces commandées. La révision se fera samedi de la semaine 7, à deux techniciens.",
        },
      ],
      [
        {
          ...MAEWENN,
          texte:
            "Les samedis de juin sont planifiés. Il a fallu insister pour l'équipe d'après-midi : plusieurs ont des enfants en fin d'année scolaire.",
        },
      ],
      [
        {
          ...EFFLAM,
          texte:
            "Donc on aborde juin comme ça ? J'espère que les commandes seront moins fortes que prévu.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Les pots mal scellés",
    jusqua: 11,
    messages: (ctx) => [
      {
        ...ERWANN,
        heure: "09:20",
        alerte: true,
        texte: `Le contrôle d'étanchéité écarte toujours autour de 7 % des pots. Avec ${ctx.demande} pots commandés cette semaine, ce sont des milliers de pots qui partent en méthanisation chaque jour.`,
      },
      {
        ...AZILIS,
        heure: "11:45",
        texte:
          "Notre fournisseur d'opercules propose un film à plage de scellage plus large : il pardonne mieux les écarts de température de la tête. Je peux lancer un essai lundi.",
      },
    ],
    sources: [
      {
        id: "film",
        titre: "Demander à Azilis ce qu'on sait du nouveau film",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Le film coûte 0,1 centime de plus par pot ; sa déclaration de conformité au contact alimentaire est au dossier. Chez les laiteries qui l'ont essayé, l'essai réussit environ deux fois sur trois : les pots écartés tombent autour de 5 %. Quand il échoue, le film plisse au scellage : deux semaines de réglages avec près de 10 % de pots écartés, puis retour à l'ancien film.",
      },
      {
        id: "tete",
        titre: "Demander à Klervi ce que donnerait un réglage de la tête de scellage",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Klervi Nédélec : « Le fabricant peut régler la tête de scellage et changer ses joints : 4 500 €, six heures d'arrêt en semaine 10. On tomberait à 6 % de pots écartés, sans surprise. Ralentir la ligne de 5 % en ferait gagner un peu, mais on perdrait de la cadence. »",
      },
    ],
    question: "Que faites-vous du scellage ?",
    options: [
      {
        t: "Essayer le nouveau film dès lundi",
        d: "0,1 centime de plus par pot. L'essai réussit, ou il faut revenir à l'ancien film.",
      },
      {
        t: "Faire régler la tête de scellage par le fabricant",
        d: "4 500 € et six heures d'arrêt en semaine 10.",
      },
      {
        t: "Ralentir la ligne de 5 % pour laisser le scellage se faire",
        d: "Rien à payer. La ligne produit moins à l'heure.",
      },
      {
        t: "Ne rien changer",
        d: "Le contrôle d'étanchéité fait son travail : aucun pot mal scellé ne sort.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...KLERVI,
          texte:
            "Le technicien du fabricant passe mardi. Six heures d'arrêt, puis on surveille les pots écartés.",
        },
      ],
      [
        {
          ...MAODAN,
          texte:
            "Ligne ralentie. Les pots sont mieux scellés, mais on court après les commandes en fin de journée.",
        },
      ],
      [
        {
          ...ERWANN,
          texte: "On garde le scellage comme il est. Les bennes de pots écartés se remplissent.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Avant l'été",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...MAEWENN,
        heure: "09:00",
        alerte: true,
        texte:
          "Gurvan, en juillet, neuf des seize conducteurs et opérateurs de la ligne 3 seront en congés par roulement. Sept intérimaires arrivent la semaine 13. Qu'est-ce que tu prévois pour eux ?",
      },
      {
        ...EFFLAM,
        heure: "10:30",
        texte: `Le comité veut savoir si on garde le projet de deuxième ligne pour l'an prochain. Où en est la ligne 3 ? ${ctx.heures} de changements et de NEP cette semaine, TRS ${ctx.trs}.`,
      },
    ],
    sources: [
      {
        id: "ete",
        titre: "Demander à Erwann comment les gains ont tenu ailleurs, l'été dernier",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Erwann Tromeur : « Sur la ligne 1, l'été dernier, le nouveau standard de changement n'a pas tenu : avec les intérimaires, les changements sont revenus à leur durée d'avant en trois semaines, on n'a gardé que la moitié du gain. Sur la ligne 5, chaque intérimaire était formé en binôme par un conducteur et je vérifiais un changement par jour : les gains ont tenu à 90 %. Quand on a envoyé les meilleurs conducteurs former les autres lignes, il en est resté 60 %. »",
      },
      {
        id: "juillet",
        titre: "Demander à Iwan comment il comptera la capacité gagnée",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Iwan Szymanski : « Pour juillet, je ne compte que ce que le plan industriel et commercial chiffre : 1,19 million de pots par semaine. Un pot se vend 19 centimes net, pour 13 centimes de coût variable (lait 6, ingrédients 2,6, emballages 3,2, énergie et produits de NEP 1,2) : la capacité gagnée vaut 6 centimes de marge sur coût variable par pot livré en plus, et les pénalités évitées, pour la part que vous tiendrez pendant les congés. Une ligne livrée en janvier ne compte pas pour cet été. »",
      },
    ],
    question: "Comment préparez-vous l'été ?",
    options: [
      {
        t: "Ancrer les standards avant les congés : fiche au poste, un changement vérifié chaque jour, intérimaires formés en binôme",
        d: "4 200 € d'heures de binôme et de formation, en semaines 12 et 13.",
      },
      {
        t: "Présenter au comité le dossier de la deuxième ligne pour l'an prochain",
        d: "Une étude d'ingénierie de 24 000 €, lancée tout de suite.",
      },
      {
        t: "Étendre tout de suite le chantier aux lignes 1 et 5, avec Maodan et Djamila comme animateurs",
        d: "1 500 €. La ligne 3 se passe de ses deux meilleurs conducteurs quelques heures par semaine.",
      },
      {
        t: "Ne rien changer : les gains sont acquis",
        d: "Les conducteurs connaissent la méthode.",
      },
    ],
    reactions: [
      [
        {
          ...DJAMILA,
          texte:
            "J'ai pris le premier intérimaire en binôme. Il a fait son premier changement seul en 34 minutes, la fiche sous les yeux.",
        },
      ],
      [
        {
          ...IWAN,
          texte:
            "J'inscris l'étude au budget. Pour l'été, le comité compte sur la ligne 3 telle qu'elle est.",
        },
      ],
      [
        {
          ...MAODAN,
          texte:
            "Premier atelier sur la ligne 5 jeudi. Pendant ce temps, Kouadio a fait le changement de la ligne 3 avec un intérimaire : 48 minutes.",
        },
      ],
      [
        {
          ...ERWANN,
          texte: "Les intérimaires arrivent lundi. On leur montrera le chariot.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Décomposer avant de soigner", chemin: [2, 0, 1, 1, 0, 0] },
  { nom: "Des heures et une ligne en plus", chemin: [1, 2, 0, 2, 1, 1] },
  { nom: "Attentiste", chemin: [3, 3, 3, 3, 3, 3] },
] as const;

/**
 * Les réflexes du métier quand une ligne ne suit plus : acheter de la
 * capacité (une deuxième ligne) ou des heures (les samedis) avant d'avoir
 * regardé où partent celles qu'on a. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [0, 1],
  [3, 2],
  [5, 1],
] as const;

export const REPONSES = {
  filmReussi:
    "L'essai est concluant : 5 % de pots écartés dès mardi, et la tête de scellage demande moins de réglages. On garde le nouveau film.",
  filmRate:
    "L'essai ne tient pas : le film plisse au scellage dès que la tête chauffe. Deux semaines de réglages, puis on revient à l'ancien film.",
  etude:
    "Le comité a validé l'étude de la deuxième ligne : 24 000 €. Klervi et Wojtek rédigent le cahier des charges pour Ardoform ; le reste attendra.",
  adhesion:
    "L'équipe d'après-midi a pris le chariot en main : on prépare l'outil, les bobines et la recette pendant que la ligne tourne. Le changement de jeudi a duré 34 minutes.",
  refus:
    "L'équipe d'après-midi n'applique pas le nouveau standard : « on nous a déjà fait le coup ». Le matin, ça marche ; l'après-midi, les changements durent comme avant. Il faudra plus de temps.",
  positive:
    "Un prélèvement de surface sous la remplisseuse de la ligne 3 est revenu positif à Listeria. Les lots des trois derniers jours sont bloqués en attendant les analyses des produits ; la ligne est arrêtée une journée pour décontamination. Les NEP reprennent leur cycle validé.",
  accident:
    "Oronce Plassart, opérateur de conditionnement, s'est coupé à la main en changeant l'outil de découpe, en fin de journée de samedi. Arrêt de travail de trois semaines. Le CSE demande un point sur les samedis.",
  casse:
    "Quatre palettes de yaourts à la framboise refusées cette semaine à notre plateforme de Rennes : moins des deux tiers de leur DLC à la réception. Merci de revoir vos expéditions.",
  doseur:
    "Doseur révisé samedi : clapets et joints neufs, sonde de niveau recalée. Lundi matin, deux micro-arrêts au lieu de quinze.",
} as const;
