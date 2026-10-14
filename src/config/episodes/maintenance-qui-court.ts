/**
 * LA MAINTENANCE QUI COURT APRÈS LES PANNES — le contenu de l'épisode.
 *
 * Klervi Nédélec est responsable maintenance de l'usine de Loudéac de la
 * Laiterie de Kerbrélan : douze techniciens pour six lignes de
 * conditionnement. 70 % de leurs heures partent en dépannage ; la ligne de
 * remplissage des desserts perd dix-neuf heures par mois en pannes, et le
 * directeur industriel réclame un technicien de nuit de plus avant le pic des
 * desserts de décembre. Six décisions, de septembre à novembre, chacune
 * précédée de ce qu'une responsable maintenance reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Les chiffres qu'elles donnent
 * sont ceux du modèle ; un test les recalcule.
 *
 * La sécurité des consommateurs et des salariés n'est pas une variable : un
 * fragment de joint dans un pot bloque le lot, un geste fait sans consignation
 * peut blesser, et aucune option ne gagne à les risquer.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "pareto",
    t: "Une poignée d'organes usés font l'essentiel des pannes, et plus personne ne les entretient : la maintenance, absorbée par le dépannage, a laissé filer le préventif",
  },
  {
    id: "pieces",
    t: "Les pannes durent parce que les pièces manquent au magasin",
  },
  {
    id: "nuit",
    t: "La nuit, sans technicien sur place, chaque panne dure trop longtemps",
  },
  {
    id: "vetuste",
    t: "La ligne a quatorze ans : elle est usée de partout, il faut la faire réviser en entier",
  },
] as const;

const EFFLAM = { de: "Efflam Jézéquel", role: "Directeur industriel" } as const;
const GURVAN = { de: "Gurvan Kerebel", role: "Responsable de production, Loudéac" } as const;
const YSEE = { de: "Ysée Bescond", role: "Responsable supply chain" } as const;
const IWAN = { de: "Iwan Szymanski", role: "Directeur administratif et financier" } as const;
const ANNAIG = { de: "Annaïg Le Dantec", role: "Responsable qualité" } as const;
const MAEWENN = { de: "Maëwenn Postec", role: "Directrice des ressources humaines" } as const;
const SULIVAN = {
  de: "Sulivan Daoudal",
  role: "Technicien de maintenance, référent de la ligne des desserts",
} as const;
const FIACRE = {
  de: "Fiacre Pichavant",
  role: "Chef d'équipe de nuit, ligne des desserts",
} as const;
const AZENOR = { de: "Azenor Rioual", role: "Conductrice de ligne, élue au CSE" } as const;
const VARTAN = { de: "Vartan Garo", role: "Conducteur de ligne" } as const;
const AYODELE = { de: "Ayodele Mbemba", role: "Magasinière des pièces détachées" } as const;
const HARTMUT = {
  de: "Hartmut Vogler",
  role: "Technicien du service après-vente, Ostrévan Process",
} as const;
const YEZEKAEL = { de: "Yezekael Bothorel", role: "Technicien de maintenance" } as const;
const TABLEAU = "Tableau de bord de la maintenance";

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Dix-neuf heures par mois",
    jusqua: 2,
    messages: () => [
      {
        de: TABLEAU,
        role: "Alerte automatique",
        heure: "07:30",
        alerte: true,
        texte:
          "Ligne de remplissage des desserts, août : 19 heures d'arrêt pour panne, 17 pannes. Heures de l'équipe de maintenance : 70 % en dépannage. Le trimestre de septembre à novembre précède le pic des desserts de décembre.",
      },
      {
        ...EFFLAM,
        heure: "08:15",
        texte:
          "Klervi, encore trois pannes ce week-end sur la ligne des desserts, dont une de nuit où l'on a attendu l'astreinte. En décembre, on ne pourra pas se le permettre. Je veux un technicien de nuit de plus : lance le recrutement, et dis-moi vendredi ce que tu fais d'autre.",
      },
      {
        ...FIACRE,
        heure: "06:10",
        texte:
          "Nuit difficile : un doseur qui fuit à 2 heures, la cellule de la scelleuse qui se déclenche à 4 heures. L'équipe passe la nuit à attendre la maintenance.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "historique",
        titre: "Extraire et classer l'historique des pannes de la ligne (GMAO, six mois)",
        cout: 1,
        nature: "decisive",
        resultat:
          "Sur 26 semaines, la ligne a fonctionné 2 704 heures et compté 104 pannes, pour 114 heures d'arrêt. Par organe : capteurs de la scelleuse (sondes de température, cellule de présence du film), 38 pannes et 41 heures ; joints des doseurs, 34 pannes et 36 heures ; vérins du distributeur de pots et du transfert, 12 pannes et 21 heures ; les 23 autres organes de la ligne réunis, 20 pannes et 16 heures. Trois familles d'organes font donc 86 % des heures d'arrêt. Quatre pannes ont attendu une pièce absente du magasin, huit heures en moyenne ; 26 pannes sur 104 sont tombées la nuit.",
      },
      {
        id: "heures",
        titre: "Reprendre l'emploi du temps des techniciens dans les bons de travail",
        cout: 1,
        nature: "decisive",
        resultat:
          "Sur 420 heures de techniciens par semaine : 294 en dépannage (70 %), 76 en préventif (18 %), 50 en travaux neufs (12 %). 41 gammes préventives sont en retard, dont toutes celles de la scelleuse, des doseurs et des vérins de la ligne des desserts. La nuit, l'astreinte met une demi-heure à arriver : sur six mois, les 26 pannes de nuit ont attendu 13 heures en tout, à peine plus de 2 heures par mois sur les 19.",
      },
      {
        id: "heure",
        titre: "Chiffrer une heure d'arrêt avec Iwan Szymanski",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Iwan : « Jusqu'à 6 heures par semaine, une heure d'arrêt se rattrape le samedi : 1 500 € d'heures supplémentaires, d'énergie, de NEP et de produit jeté au redémarrage. Au-delà, ou en décembre quand la ligne tourne six jours sur sept, elle ne se rattrape pas : 18 000 pots à 0,11 € de marge sur coût variable, et 1 820 € de pénalités logistiques des enseignes, soit 3 800 € l'heure. Et les desserts ne se produisent pas d'avance : leur DLC est de 30 jours, et les enseignes en exigent les deux tiers à la livraison. »",
      },
      {
        id: "constructeur",
        titre: "Demander l'avis du constructeur de la ligne",
        cout: 1,
        nature: "bruit",
        resultat:
          "Hartmut Vogler, d'Ostrévan Process : « Votre ligne a quatorze ans. Nos lignes récentes atteignent 78 % de TRS. Je vous propose une révision générale : deux de nos techniciens, 16 heures d'arrêt, 34 000 €. »",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Fanchon Lozac'h, directrice de l'usine de Pontivy",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Fanchon : « Avant d'ajouter quelqu'un pour dépanner, compte tes pannes : lesquelles, combien de fois, combien de temps. Calcule le temps moyen entre deux pannes de chaque organe. Tu verras où va ton équipe. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous avant le point de vendredi avec Efflam ?",
    options: [
      {
        t: "Recruter le technicien de nuit qu'Efflam demande",
        d: "Un CDI de plus, de nuit : 4 000 € de cabinet, puis 1 250 € par semaine, salaire chargé et prime de nuit. Arrivée selon le marché : les techniciens sont rares.",
      },
      {
        t: "Sortir deux techniciens du dépannage pour bâtir un plan préventif sur les organes qui tombent le plus",
        d: "Rattraper les gammes en retard, puis tenir le plan : 1,5 heure d'arrêt planifié par semaine jusqu'à la semaine 6, puis trois quarts d'heure ; 1 500 € de pièces par semaine, puis 500 €.",
      },
      {
        t: "Faire réviser toute la ligne par le constructeur",
        d: "Ostrévan Process, en semaine 4 : 34 000 € et 16 heures d'arrêt planifié. Toute la ligne remise en état.",
      },
      {
        t: "Continuer à dépanner au mieux, en priorisant les urgences",
        d: "Rien à engager. L'équipe garde son organisation.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...SULIVAN,
          texte:
            "Yezekael et moi, on a repris les 104 pannes une par une. On commence par les sondes et la cellule de la scelleuse, puis les clapets des doseurs et les vérins. Les gammes en retard sont planifiées sur quatre semaines.",
        },
      ],
      [
        {
          ...HARTMUT,
          texte:
            "Nos deux techniciens seront chez vous en semaine 4. Prévoyez deux postes d'arrêt : nous démontons tout.",
        },
      ],
      [
        {
          ...EFFLAM,
          texte: "Je ne vois pas ce qui change, Klervi. Et mon technicien de nuit ?",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Neuf heures pour un vérin",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...FIACRE,
        heure: "07:05",
        alerte: true,
        texte:
          "Mercredi, 23 heures : le vérin du distributeur de pots a lâché. Pas de vérin au magasin : on a attendu le distributeur de Rennes jusqu'au matin. Neuf heures d'arrêt, l'équipe de nuit renvoyée en nettoyage.",
      },
      {
        ...YSEE,
        heure: "10:40",
        texte:
          "Opaline nous applique des pénalités logistiques pour les crèmes desserts manquées jeudi. Si ça se reproduit en décembre, c'est la rupture en rayon.",
      },
      {
        ...IWAN,
        heure: "14:20",
        texte:
          "Klervi, le stock de pièces détachées de Loudéac est à 310 000 €. Je demande à chaque service de le réduire, pas de l'augmenter.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "17:30",
        texte: `Semaine 2 : ${ctx.arrets} d'arrêt pour panne, ${ctx.pannes} pannes.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "magasin",
        titre: "Passer le magasin de pièces détachées en revue avec Ayodele Mbemba",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Ayodele : « Sur les 310 000 € de stock, 40 % sont des pièces de lignes arrêtées ou de formats abandonnés. Pour la ligne des desserts, il n'y a ni vérin du distributeur, ni sonde de scelleuse, ni cellule, ni joint de doseur du format 125 g. Un stock de ces pièces critiques, pour les trois familles d'organes qui tombent le plus : 14 000 €, livré en semaine 4. Toute la liste de rechange recommandée par le constructeur : 120 000 €, livrée en semaine 6. »",
      },
      {
        id: "delais",
        titre: "Comparer les délais d'approvisionnement et le coût d'un stock",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Sans pièce en stock, une panne attend de 4 à 12 heures, 8 en moyenne. Le distributeur de Rennes propose un contrat de livraison express, de jour comme de nuit : de 3 à 7 heures, pour 1 500 € par mois. La direction financière compte un coût de possession de 25 % par an sur tout stock : financement, magasinage, obsolescence.",
      },
    ],
    question: "Que faites-vous des pièces de rechange ?",
    options: [
      {
        t: "Constituer un stock des pièces critiques des trois familles d'organes",
        d: "Joints, vérins, sondes et cellules de la scelleuse : 14 000 € immobilisés, en magasin en semaine 4.",
      },
      {
        t: "Stocker toute la liste de pièces recommandée par le constructeur",
        d: "120 000 € immobilisés, livrés en semaine 6. Plus rien ne manquera, sur aucun organe.",
      },
      {
        t: "Signer un contrat de livraison express avec le distributeur",
        d: "1 500 € par mois. Les pièces arrivent en 3 à 7 heures, de jour comme de nuit.",
      },
      {
        t: "Ne rien stocker de plus : commander les pièces quand elles cassent",
        d: "Rien à immobiliser. Iwan sera satisfait.",
      },
    ],
    reactions: [
      [
        {
          ...AYODELE,
          texte:
            "Les pièces critiques sont rangées en bord de ligne, dans une armoire étiquetée. Iwan a validé quand je lui ai montré les pièces mortes qu'on sort en échange.",
        },
      ],
      [
        {
          ...IWAN,
          texte:
            "120 000 € de plus en stock ? Je l'accepte, mais je le présenterai au comité de direction comme ton choix.",
        },
      ],
      [
        {
          de: "Distributeur de pièces de Rennes",
          role: "Service client",
          texte:
            "Votre contrat express est actif en semaine 4 : un appel, et un coursier part avec la pièce.",
        },
      ],
      [
        {
          ...FIACRE,
          texte: "Donc la prochaine fois, on attend encore Rennes jusqu'au matin.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Ce que les conducteurs voient",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...SULIVAN,
        heure: "09:50",
        alerte: true,
        texte:
          "Sur les doseurs, une panne sur deux commence par de la crème séchée sur les clapets ou un raccord desserré ; sur la scelleuse, par une cellule encrassée après la NEP. Les conducteurs le voient avant nous, mais personne ne leur a jamais demandé de s'en occuper.",
      },
      {
        ...AZENOR,
        heure: "12:30",
        texte:
          "On entend dire qu'on va nous faire faire le travail de la maintenance. Personne ne nous a rien demandé.",
      },
      {
        ...EFFLAM,
        heure: "16:05",
        texte:
          "Si les conducteurs peuvent s'en charger, fais une note de service : ça ira plus vite qu'une concertation.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "17:30",
        texte: `Semaine 4 : ${ctx.arrets} d'arrêt pour panne, ${ctx.pannes} pannes. MTBF de la ligne sur quatre semaines : ${ctx.mtbf}.`,
      },
    ],
    sources: [
      {
        id: "pontivy",
        titre: "Demander à Pontivy comment se passe la maintenance de premier niveau",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Fanchon Lozac'h : « Sur deux lignes, les conducteurs font le nettoyage, l'inspection et le serrage, en un quart d'heure par poste pendant la NEP. Les standards ont été écrits avec eux, sur les organes que l'historique montrait, et chacun a été formé deux heures : les pannes de ces organes ont baissé d'un quart à un tiers. Ils ne touchent jamais une pièce sans consignation. Sur une troisième ligne, où on avait écrit des standards généraux sans regarder l'historique, le gain a été deux fois moindre. »",
      },
      {
        id: "cse",
        titre: "Recevoir Azenor Rioual, conductrice élue au CSE",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Azenor : « On veut bien, si c'est écrit avec nous, si on est formés, et si ça se fait pendant la NEP, pas sur nos pauses. Une note de service, les équipes ne l'appliqueront pas : l'an dernier, on nous a fait démonter des buses sans nous montrer la consignation. Le document unique dit pourtant que personne ne touche un doseur sans l'avoir consigné. »",
      },
    ],
    question: "Que confiez-vous aux conducteurs ?",
    options: [
      {
        t: "Écrire avec les conducteurs des standards de premier niveau, et les former",
        d: "Nettoyage, inspection, serrage, pendant la NEP. 2 600 € de formation, puis un technicien référent, 300 € par semaine. Le CSE est consulté.",
      },
      {
        t: "Imposer des contrôles de premier niveau par une note de service",
        d: "Dès la semaine 5, sans formation. Rien à payer.",
      },
      {
        t: "Faire faire les tournées de premier niveau par les techniciens",
        d: "À chaque poste, dès la semaine 5 : 1 100 € d'heures supplémentaires par semaine. Les conducteurs restent à la conduite.",
      },
      {
        t: "Laisser les conducteurs à la conduite",
        d: "La maintenance reste l'affaire des techniciens.",
      },
    ],
    reactions: [
      [
        {
          ...AZENOR,
          texte:
            "Le CSE en parle jeudi. On veut voir les standards avant de dire oui, et savoir qui nous forme.",
        },
      ],
      [
        {
          ...VARTAN,
          texte:
            "On a reçu la note. On fera ce qu'on peut, mais personne ne nous a montré comment on ouvre un doseur.",
        },
      ],
      [
        {
          ...SULIVAN,
          texte:
            "On fait les tournées à chaque poste. Ce sont des heures que Yezekael et moi ne passons plus sur les gammes.",
        },
      ],
      [
        {
          ...AZENOR,
          texte: "Rien ne change, alors. On continuera d'appeler la maintenance.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Un morceau de joint",
    jusqua: 8,
    messages: () => [
      {
        ...ANNAIG,
        heure: "10:15",
        alerte: true,
        texte:
          "Mardi, un joint de doseur s'est déchiré ; on en a retrouvé un morceau dans la trémie, avant le remplissage. Rien n'est parti en magasin, mais c'est un presque-accident pour la sécurité des aliments. Je veux savoir comment on change ces joints.",
      },
      {
        ...SULIVAN,
        heure: "11:00",
        texte:
          "On les change quand ils fuient ou quand ils cassent. Il n'y a pas de fréquence de remplacement.",
      },
    ],
    sources: [
      {
        id: "joints",
        titre: "Reprendre l'historique des pannes des doseurs",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Six pannes de doseurs sur dix viennent des joints : sur six mois, 20 joints déchirés pour les six doseurs, soit un joint qui dure en moyenne près de 800 heures, avec de grands écarts. Il existe des joints détectables, que le détecteur de métaux repère : un fragment ne passe plus dans un pot. On peut les remplacer à fréquence fixe, tous les 600 heures, pendant la NEP ; ou les remplacer à l'inspection, quand ils montrent de l'usure, ce qui suppose que quelqu'un les regarde à chaque NEP.",
      },
      {
        id: "qualite",
        titre: "Demander à Annaïg Le Dantec ce que coûte un fragment",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Annaïg : « Un fragment de joint dans le produit, c'est un lot bloqué : tout le poste de production trié, puis détruit, 24 000 €, et deux heures de NEP renforcée. Sur la ligne, environ 3 joints sur 100 qui se déchirent laissent un fragment dans le produit. Avec des joints détectables, le détecteur écarte les pots touchés : il en reste moins d'un sur 100. »",
      },
    ],
    question: "Comment changez-vous les joints des doseurs ?",
    options: [
      {
        t: "Les remplacer systématiquement tous les 600 heures, en joints détectables",
        d: "Pendant la NEP, à partir de la semaine 8 : 1 500 € pour passer aux joints détectables, puis 380 € par semaine et 12 minutes d'arrêt.",
      },
      {
        t: "Les remplacer à l'inspection, quand ils montrent de l'usure",
        d: "À partir de la semaine 8 : 150 € de joints par semaine. Il faut que quelqu'un les regarde à chaque NEP.",
      },
      {
        t: "Les changer quand ils lâchent, comme aujourd'hui",
        d: "Rien à engager.",
      },
      {
        t: "Changer tous les joints maintenant, une fois",
        d: "Trois heures d'arrêt en semaine 7, 2 800 €.",
      },
    ],
    reactions: [
      [
        {
          ...SULIVAN,
          texte:
            "Les kits de joints détectables sont prêts, un par doseur. Le remplacement est inscrit au planning de NEP toutes les 600 heures.",
        },
      ],
      [
        {
          ...SULIVAN,
          texte:
            "Entendu : on changera les joints quand l'inspection montrera de l'usure. Il faudra que la NEP laisse le temps de les regarder.",
        },
      ],
      [
        {
          ...ANNAIG,
          texte: "Je note. J'espère que le prochain ne se déchirera pas au-dessus d'un pot.",
        },
      ],
      [
        {
          ...SULIVAN,
          texte: "Tous les joints changés mardi. On verra combien de temps ils tiennent.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Produire d'avance",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...GURVAN,
        heure: "09:10",
        alerte: true,
        texte: `Klervi, pour décembre, je voudrais produire d'avance. ${
          ctx.plan
            ? "Tes arrêts préventifs me prennent des heures de ligne chaque semaine : suspends-les jusqu'après les fêtes, je les récupère pour faire du stock."
            : "Aucun arrêt d'entretien d'ici les fêtes, d'accord ? Je veux toutes les heures de ligne pour faire du stock."
        }`,
      },
      {
        ...YSEE,
        heure: "11:45",
        texte:
          "Le plan de décembre est arrêté : la ligne des desserts tourne six jours sur sept pendant quatre semaines. Pas une heure de marge.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "17:30",
        texte: `Semaine 8 : ${ctx.arrets} d'arrêt pour panne. MTBF de la ligne sur quatre semaines : ${ctx.mtbf}. Décembre, dans l'état actuel du parc : ${ctx.heuresDecembre} d'arrêts attendus, ${ctx.coutDecembre}.`,
      },
    ],
    sources: [
      {
        id: "nep",
        titre: "Chronométrer une NEP et un changement de format avec Sulivan Daoudal",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "La NEP dure 75 minutes par jour, et la ligne est arrêtée de toute façon. Avec des kits d'intervention préparés d'avance, 70 % des interventions préventives peuvent s'y faire : il ne reste à prendre à la ligne que 30 % du temps d'arrêt planifié. Les pièces d'usure changées en septembre arriveront en fin de vie en décembre si on ne les rechange pas.",
      },
      {
        id: "dlc",
        titre: "Demander à Ysée Bescond ce que deviendrait un stock produit d'avance",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Ysée : « Les crèmes desserts ont une DLC de 30 jours, et les enseignes en exigent les deux tiers à la livraison : ce qui est produit plus de dix jours avant l'expédition n'est plus livrable. Un stock fait en novembre pour décembre finirait déclassé ou donné aux associations : environ 4 000 €. »",
      },
    ],
    question: "Que faites-vous de l'entretien avant le pic ?",
    options: [
      {
        t: "Garder l'entretien, et le caler dans les fenêtres de NEP et de changement de format",
        d: "Kits d'intervention préparés, 1 500 €, à partir de la semaine 9. Sans plan préventif, une campagne de remplacement des pièces d'usure des organes critiques : 3 500 € de plus.",
      },
      {
        t: "Garder le planning d'entretien tel qu'il est",
        d: "Rien ne change.",
      },
      {
        t: "Suspendre les arrêts d'entretien jusqu'après le pic, pour produire d'avance",
        d: "Gurvan récupère les heures d'entretien pour constituer un stock de desserts avant décembre.",
      },
      {
        t: "Faire réviser la scelleuse par le constructeur fin novembre",
        d: "Ostrévan Process, en semaine 12 : 15 000 € et 12 heures d'arrêt.",
      },
    ],
    reactions: [
      [
        {
          ...SULIVAN,
          texte:
            "Les kits sont prêts pour chaque NEP : pièces, outils, mode opératoire. On intervient pendant que le nettoyage tourne sur l'autre partie de la ligne.",
        },
      ],
      [
        {
          ...GURVAN,
          texte: "Dommage. Je ferai mon plan avec les heures qui restent.",
        },
      ],
      [
        {
          ...GURVAN,
          texte: "Merci, Klervi. On lance du stock dès samedi.",
        },
      ],
      [
        {
          ...HARTMUT,
          texte:
            "Nous serons là en semaine 12 pour la scelleuse : têtes de scellage, sondes, cellules.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Le dispositif de décembre",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...EFFLAM,
        heure: "08:40",
        alerte: true,
        texte:
          "Le pic commence dans deux semaines. Il me faut ton dispositif pour décembre. Et je reviens sur la nuit : la DRH peut nous trouver un technicien intérimaire pour les quatre semaines.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "17:30",
        texte: `Semaine 11 : ${ctx.arrets} d'arrêt pour panne. MTBF de la ligne sur quatre semaines : ${ctx.mtbf}. Part du préventif : ${ctx.preventif}.`,
      },
    ],
    sources: [
      {
        id: "etat",
        titre: "Faire le point sur l'état des organes critiques avec Sulivan Daoudal",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Dans l'état actuel du parc, la ligne ferait environ ${ctx.pannesDecembre} pannes en décembre, pour ${ctx.heuresDecembre} d'arrêts attendus à 3 800 € l'heure, ${ctx.coutDecembre}. Un technicien de nuit gagnerait une demi-heure sur chaque panne de nuit, une sur quatre : environ ${ctx.nuitDecembre} sur le mois, pour 7 300 € d'intérim. ${
            ctx.plan
              ? "Au pic, quand la production tient tout le monde, le préventif saute le premier : sans quelqu'un pour le caler chaque semaine dans le plan de production, les organes refaits redeviennent en quelques semaines ceux de l'été."
              : "Les gammes préventives de la ligne sont toujours en retard ; au rythme actuel, les organes s'usent un peu plus chaque semaine."
          }`,
      },
      {
        id: "planificateur",
        titre: "Demander à Fanchon Lozac'h comment Pontivy prépare ses pics",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Fanchon : « Un de nos techniciens est devenu préparateur-planificateur. Chaque semaine, il cale le préventif dans le plan de production et prépare les interventions : pièces, outils, mode opératoire. Une intervention préparée dure un cinquième de moins. Au pic, c'est lui qui empêche le préventif de sauter. »",
      },
    ],
    question: "Quel dispositif proposez-vous pour décembre ?",
    options: [
      {
        t: "Pérenniser : un technicien devient préparateur-planificateur, et le préventif est inscrit chaque semaine au plan de production",
        d: "600 € par semaine dès la semaine 12. Les interventions de décembre sont préparées : pièces, outils, modes opératoires.",
      },
      {
        t: "Prendre le technicien intérimaire de nuit pour le pic",
        d: "Quatre semaines en décembre : 900 € de frais d'agence, puis 1 600 € par semaine.",
      },
      {
        t: "Laisser l'organisation en l'état",
        d: "On fera avec ce qu'on a.",
      },
      {
        t: "Remettre toute l'équipe sur le dépannage en décembre : le préventif reprendra en janvier",
        d: "Plus de techniciens disponibles à chaque panne pendant le pic.",
      },
    ],
    reactions: [
      [
        {
          ...YEZEKAEL,
          texte:
            "Je prends le poste de préparateur-planificateur lundi. Le préventif de décembre est calé avec Gurvan, NEP par NEP.",
        },
      ],
      [
        {
          ...MAEWENN,
          texte:
            "L'agence d'intérim nous propose Orsolya Benedek, technicienne de maintenance, pour les quatre semaines de décembre, de nuit.",
        },
      ],
      [
        {
          ...EFFLAM,
          texte: "Bien. On verra en décembre.",
        },
      ],
      [
        {
          ...SULIVAN,
          texte: "Tout le monde sur les pannes en décembre. Les gammes attendront janvier.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Analyser, prévenir, outiller", chemin: [1, 0, 0, 1, 0, 0] },
  { nom: "Dépanner plus vite", chemin: [0, 2, 3, 2, 2, 1] },
  { nom: "Attentiste", chemin: [3, 3, 3, 2, 1, 2] },
] as const;

/**
 * Les réflexes du métier sous pression, [décision, option] : ajouter des dépanneurs
 * (le technicien de nuit, en CDI ou en intérim) ou repousser l'entretien après le pic.
 * Le contrat express ou la note de service n'y figurent pas : ce sont de moins bonnes
 * réponses, pas celles que la pression du pic dicte.
 */
export const REFLEXES = [
  [0, 0],
  [4, 2],
  [5, 1],
  [5, 3],
] as const;

export const REPONSES = {
  candidatRapide:
    "Le cabinet a trouvé : Edern Kermarrec, technicien de maintenance, prend son poste de nuit en semaine 7.",
  candidatLent:
    "Le cabinet peine : les techniciens de maintenance sont rares dans la région. Pas de prise de poste avant la semaine 11.",
  accord:
    "Le CSE a donné un avis favorable : les standards ont été relus poste par poste. Formation des équipes en semaines 5 et 6, premiers gestes en semaine 7.",
  refus:
    "Le CSE demande à revoir les standards et le temps pris sur la NEP. Les équipes ne commenceront pas avant la semaine 10.",
  repriseApresRefus:
    "Les standards revus ont été acceptés. Les conducteurs sont formés, les premiers gestes commencent en semaine 10.",
} as const;
