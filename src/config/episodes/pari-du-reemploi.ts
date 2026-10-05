/**
 * LE PARI DU RÉEMPLOI — le contenu de l'épisode.
 *
 * Ysaline Okoye dirige la RSE et les nouvelles activités d'Arvel
 * Distribution. Un projet de décret oblige les distributeurs à reprendre les
 * déchets triés de leurs clients et leur fixera peut-être un objectif de
 * réemploi : une activité s'ouvre, collecter, trier et revendre les
 * matériaux de réemploi de la métropole. Faut-il y aller en premier, ou
 * suivre ? Six décisions, chacune précédée de ce qu'une directrice reçoit
 * vraiment : le comité de direction, deux démolisseurs courtisés par un
 * concurrent, un accord-cadre public, le premier bilan, l'offre d'un
 * éco-organisme, un fabricant de plateformes de tri.
 *
 * La leçon n'est ni « soyez premier » ni « soyez suiveur » : ce qui est rare
 * et se signe une fois (les gisements, une référence publique) se prend
 * tôt ; ce qui s'achète à tout moment (l'équipement, les comptoirs) se
 * décide sur les chiffres.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : le volume accessible, la marge d'une tonne, le
 * coût net de l'accord-cadre, l'offre d'Orréa, la VAN des équipements.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprises, personnes et chiffres sont fictifs.
 */
import {
  ACCORD,
  ANNONCE,
  CAPACITE_DEUX,
  CAPACITE_SIX,
  COMPTOIRS,
  DEDIT,
  DEMOLISSEURS,
  FILIERE,
  GISEMENT,
  LIGNE,
  OBJECTIF_REEMPLOI,
  PILOTE,
  PLATEFORME,
  PRIX_DU_PLAN,
  PRIX_PRUDENT,
  REPRISE,
  SENSIBILITE_ECOULEMENT,
  SUBVENTION,
  VALEUR_RESIDUELLE,
  coutAccord,
  margeParTonne,
  ECOULEMENT,
  REEMPLOI_METROPOLE,
} from "@/engine/episodes/pari-du-reemploi";
import { kE, nombre, taux } from "./format";
import type { Etape } from "./types";

const BERTILLE = { de: "Bertille Charvet", role: "Directrice générale" } as const;
const OCTAVIEN = { de: "Octavien Rouanet", role: "Directeur administratif et financier" } as const;
const SOLENN = { de: "Solenn Le Goff", role: "Directrice du réseau d'agences" } as const;
const TIDIANE = { de: "Tidiane Sarr", role: "Chef de projet réemploi" } as const;
const GONZAGUE = { de: "Thadée Sartel", role: "Président, Sartel Déconstruction" } as const;
const HENRIETTE = { de: "Henriette Grollier", role: "Gérante, Grollier Démolition" } as const;
const AUGUSTIN = { de: "Isidore Ferrari-Lebel", role: "Acheteur public, Métropole" } as const;
const SIXTINE = { de: "Mélisande Delabarre", role: "Directrice régionale, Orréa" } as const;
const AMEDEE = { de: "Amédée Pruvost", role: "Délégué régional, fédération du négoce" } as const;
const LUDWIG = {
  de: "Ludwig Haberkorn",
  role: "Ingénieur commercial, fabricant de plateformes de tri",
} as const;

/** Un nombre entier à la française : « 1 400 ». */
const n0 = (v: number) => nombre(Math.round(v), 0);
const pct = (v: number) => taux(v, 0);

export const DIAGNOSTICS = [
  {
    id: "gisements",
    t: "L'avantage durable, ce sont les gisements : six démolisseurs, des conventions de cinq ans qui ne se signent qu'une fois. Ils se prennent maintenant ; l'équipement s'achète plus tard, sur des volumes connus",
  },
  {
    id: "premier",
    t: "Il faut entrer avant Vercoran : sur ce marché, le premier arrivé prend la place",
  },
  {
    id: "capacite",
    t: "Le marché ira à qui aura la capacité de tri : il faut investir avant les autres, et le faire savoir",
  },
  {
    id: "decret",
    t: "Tant que le décret n'est pas définitif, tout engagement est un pari : mieux vaut suivre que précéder",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Premier ou suiveur ?",
    jusqua: 2,
    messages: () => [
      {
        ...BERTILLE,
        heure: "08:10",
        alerte: true,
        texte:
          "Ysaline, le projet de décret sur la reprise des déchets du bâtiment est sorti vendredi. Le comité de direction de mardi prochain attend ta position : est-ce qu'on y va, comment, et quand. Vercoran fait déjà parler de lui.",
      },
      {
        ...OCTAVIEN,
        heure: "09:05",
        texte: `Le fabricant de la plateforme de tri expose au salon Bâtir circulaire jeudi : ${kE(PLATEFORME.prix)}, ${n0(PLATEFORME.capacite)} t par an, en service en juin. Si on doit être les premiers, soyons les premiers visibles. Sinon, attendons le texte définitif : je n'aime pas investir sur un projet de décret.`,
      },
      {
        ...SOLENN,
        heure: "10:30",
        texte:
          "Les artisans demandent déjà où rapporter les menuiseries et les sanitaires qu'ils déposent. Mes chefs d'agence de Gerland et de Villeurbanne voudraient tester un coin réemploi.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "etude",
        titre: "Lire l'étude de l'observatoire régional des déchets",
        cout: 1,
        nature: "decisive",
        resultat: `La métropole produit ${n0(GISEMENT.dechets)} t de déchets du bâtiment par an, travaux publics non compris. Les diagnostics avant démolition classent ${pct(GISEMENT.deposables)} de ce tonnage en produits et équipements déposables (menuiseries, sanitaires, radiateurs, bois de charpente, carrelage), dont ${pct(GISEMENT.reemployables)} en état d'être réemployés ; le reste part au recyclage. Six démolisseurs traitent ${pct(GISEMENT.partDesSix)} de ce gisement réemployable : Sartel Déconstruction (${n0(DEMOLISSEURS.sartel)} t par an), Grollier Démolition (${n0(DEMOLISSEURS.grollier)} t), et quatre entreprises moyennes d'environ ${n0(DEMOLISSEURS.parMoyen)} t chacune, réparties sur une quarantaine de chantiers.`,
      },
      {
        id: "grenoble",
        titre: "Appeler le directeur de l'agence de Grenoble",
        cout: 1,
        nature: "decisive",
        resultat:
          "Quand le projet de décret a circulé, Vercoran a signé en sept semaines les trois plus grands démolisseurs du bassin grenoblois : cinq ans, en exclusivité, avec un prix garanti. Sa plateforme de tri de 12 000 t, ouverte trois ans plus tôt, ne tourne qu'à 55 % : ce sont les conventions qui ont fait la différence, pas la machine. Les démolisseurs moyens, eux, sont toujours libres. Notre agence achète désormais ses matériaux de réemploi chez Vercoran, 15 % plus cher que le prix public de Lyon.",
      },
      {
        id: "salon",
        titre: "Écouter la conférence d'ouverture du salon Bâtir circulaire",
        cout: 1,
        nature: "bruit",
        resultat:
          "Quitterie Lambesc, consultante : « Le gisement du réemploi dans la métropole, c'est 60 000 t par an. Le marché ira au premier qui aura l'outil industriel pour le traiter : les autres sous-traiteront chez lui. » Ses 60 000 t sont les produits déposables, réemployables ou non.",
      },
      {
        id: "decret",
        titre: "Interroger la fédération du négoce sur le décret",
        cout: 0.5,
        nature: "utile",
        resultat: `Amédée Pruvost : « Le texte paraîtra mi-décembre. À peu près une chance sur trois qu'il soit durci : un objectif de réemploi chiffré, ${n0(OBJECTIF_REEMPLOI.tonnes)} t par an pour un distributeur de votre taille, avec ${OBJECTIF_REEMPLOI.contribution} € de contribution par tonne manquante. Une sur deux qu'il soit maintenu tel quel : la reprise obligatoire au 1er juillet. Une sur quatre qu'il soit repoussé de deux ans. » La Région ouvrira en novembre un appel à projets : ${pct(SUBVENTION)} des équipements de tri, pour les dossiers déposés avant toute commande.`,
      },
      {
        id: "conseil",
        titre: "Appeler Barnabé Courtial, ancien directeur général d'un négoce",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Barnabé Courtial : « Être premier n'est pas être le plus gros. Demande-toi ce qui sera encore libre dans un an, et ce qui s'achètera toujours. Ce qui se signe une fois se prend tôt ; ce qui s'achète peut attendre d'avoir des volumes. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Quelle position défendez-vous au comité ?",
    options: [
      {
        t: "Commander dès maintenant la plateforme de tri et l'annoncer au salon : être le premier, et le faire savoir",
        d: `${kE(PLATEFORME.prix)} engagés, ${n0(PLATEFORME.capacite)} t de capacité, en service en juin ; ${kE(ANNONCE)} de stand et de communication.`,
      },
      {
        t: "Prendre d'abord les gisements : négocier avec les démolisseurs, trier en sous-traitance, décider de l'équipement sur les volumes",
        d: `Une équipe de deux personnes dès ce trimestre, ${kE(FILIERE.animation)} par an ; rien d'autre d'engagé.`,
      },
      {
        t: "Attendre le décret définitif et un marché prouvé, puis suivre avec une offre éprouvée",
        d: "Ni équipe ni budget avant la publication, prévue mi-décembre.",
      },
      {
        t: "Lancer un pilote dans deux agences avec nos artisans, sans partenaire extérieur, pour apprendre",
        d: `${kE(PILOTE)} de bennes, d'aménagement et de temps ; trois mois de retours d'expérience.`,
      },
    ],
    reactions: [
      [
        {
          ...BERTILLE,
          texte:
            "Le comité valide. Octavien signe le bon de commande au salon jeudi, et la presse professionnelle titre sur « Arvel, pionnier du réemploi ».",
        },
      ],
      [
        {
          ...BERTILLE,
          texte:
            "Le comité valide : une équipe de deux, et carte blanche pour négocier avec les démolisseurs. La plateforme attendra les volumes.",
        },
      ],
      [
        {
          ...BERTILLE,
          texte:
            "Le comité préfère attendre le texte définitif : ni équipe ni budget avant la publication. Tu peux discuter avec qui tu veux.",
        },
      ],
      [
        {
          ...SOLENN,
          texte:
            "Le pilote démarre lundi à Gerland et à Villeurbanne. Les chefs d'agence ont déjà choisi l'emplacement des bennes.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Sartel et Grollier veulent une réponse",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...GONZAGUE,
        heure: "09:20",
        alerte: true,
        texte:
          "Madame Okoye, Vercoran est venu me voir mardi avec une convention de cinq ans, en exclusivité. Je préfère travailler avec un négociant de Lyon, mais il me faut une réponse avant le 15. Grollier est dans le même cas.",
      },
      ctx.attente
        ? {
            ...BERTILLE,
            heure: "11:00",
            texte:
              "Le comité a gelé les moyens jusqu'au décret, mais une convention n'est pas un investissement : signe si tu le juges utile. L'équipe ne sera recrutée qu'après la publication ; les collectes ne démarreront qu'en juillet.",
          }
        : {
            ...OCTAVIEN,
            heure: "11:00",
            texte: ctx.plateforme
              ? "La plateforme est commandée, il faudra la remplir. Mais cinq ans d'exclusivité avec un prix garanti, avant même le décret ? Un accord d'essai d'un an me paraîtrait plus sage."
              : "Cinq ans d'exclusivité avec un prix garanti, avant même le décret ? Un accord d'essai d'un an me paraîtrait plus sage.",
          },
      {
        ...TIDIANE,
        heure: "14:40",
        texte:
          "Grollier accepterait les mêmes conditions que Sartel. Si on signe, leurs premières bennes partent dans quinze jours.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "convention",
        titre: "Chiffrer la convention proposée",
        cout: 0.5,
        nature: "decisive",
        resultat: `Cinq ans, exclusivité, prix garanti de ${FILIERE.prixGaranti} € par tonne : ${n0(DEMOLISSEURS.sartel)} t par an chez Sartel, ${n0(DEMOLISSEURS.grollier)} t chez Grollier, ${kE(FILIERE.bennes)} de bennes par démolisseur. Au plan — ${pct(ECOULEMENT.plan)} des matériaux revendus ${FILIERE.prix} € la tonne, collecte ${FILIERE.collecte} €, tri sous-traité ${FILIERE.triSousTraite} €, recyclage de l'invendu ${FILIERE.recyclage} € — une tonne collectée rapporte ${n0(margeParTonne(ECOULEMENT.plan))} € ; chaque point d'écoulement en moins en retire ${nombre(SENSIBILITE_ECOULEMENT, 1)} €. Un accord d'essai d'un an se fait sans prix garanti ; à son terme, le démolisseur demandera ${FILIERE.prixRenouvele} € la tonne, s'il est encore libre.`,
      },
      {
        id: "vercoran",
        titre: "Comprendre ce que Vercoran cherche à Lyon",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Sa plateforme de Grenoble tourne à 55 % : il lui manque environ 5 000 t par an. Lyon est à cent kilomètres ; sous 2 000 t par partenaire, le transport mange la marge, et les quatre démolisseurs moyens, dispersés sur une quarantaine de chantiers, ne paient pas le voyage à eux seuls. Son président l'a dit à la fédération : « Nous irons là où les grands volumes sont libres. »${
            ctx.plateforme
              ? " Depuis l'annonce d'Arvel au salon, ses commerciaux appellent tous les démolisseurs de la métropole."
              : ctx.attente
                ? " Il sait qu'Arvel a gelé le sujet jusqu'au décret."
                : ""
          }`,
      },
    ],
    question: "Que répondez-vous aux deux démolisseurs ?",
    options: [
      {
        t: "Signer avec les deux, pour cinq ans, en exclusivité, avec le prix garanti",
        d: `${n0(DEMOLISSEURS.sartel + DEMOLISSEURS.grollier)} t par an pendant cinq ans à ${FILIERE.prixGaranti} €/t ; ${kE(2 * FILIERE.bennes)} de bennes.`,
      },
      {
        t: "Proposer un accord d'essai d'un an, sans exclusivité : on s'engagera quand le décret sera connu",
        d: `${n0(DEMOLISSEURS.sartel + DEMOLISSEURS.grollier)} t la première année, sans prix garanti ; ${kE(2 * FILIERE.bennes)} de bennes. Ensuite, tout se renégocie.`,
      },
      {
        t: "Attendre le décret avant de signer quoi que ce soit",
        d: "Rien d'engagé ; Sartel et Grollier restent libres.",
      },
      {
        t: "Signer Sartel seul, le plus gros, pour cinq ans",
        d: `${n0(DEMOLISSEURS.sartel)} t par an pendant cinq ans à ${FILIERE.prixGaranti} €/t ; ${kE(FILIERE.bennes)} de bennes. Grollier reste libre.`,
      },
    ],
    reactions: [
      [
        {
          ...GONZAGUE,
          texte: "Marché conclu. Nos premières bennes partent chez vous dans quinze jours.",
        },
        { ...HENRIETTE, texte: "Pour nous aussi : je signe lundi." },
      ],
      [
        {
          ...GONZAGUE,
          texte:
            "Un an, sans exclusivité… Je signe, mais je ne refuserai pas de recevoir Vercoran l'an prochain.",
        },
      ],
      [
        {
          ...GONZAGUE,
          texte: "Je comprends. Je ne pourrai pas faire attendre Vercoran indéfiniment.",
        },
      ],
      [
        { ...GONZAGUE, texte: "Marché conclu. Nos premières bennes partent dans quinze jours." },
        { ...HENRIETTE, texte: "Dommage pour nous. On verra avec qui on travaillera." },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "L'accord-cadre de la Métropole",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...AUGUSTIN,
        heure: "10:00",
        alerte: true,
        texte: `La Métropole publie son accord-cadre de dépose et de réemploi : ${n0(Number(ctx.volumeAccord))} t par an pendant quatre ans, sur les bâtiments qu'elle démolit. Prix à la tonne, ferme quatre ans ; le titulaire garde la revente. Offres en semaine 6, attribution en semaine 10.`,
      },
      {
        ...TIDIANE,
        heure: "11:30",
        texte: `J'ai repris le plan : à ${pct(REEMPLOI_METROPOLE.plan)} de réemploi, la tonne nous coûte ${n0(coutAccord(REEMPLOI_METROPOLE.plan))} € nette de la revente. À ${n0(PRIX_DU_PLAN)} € la tonne, on est les moins chers, et on gagne.`,
      },
      {
        ...OCTAVIEN,
        heure: "15:10",
        texte:
          "Une première référence publique, ça n'a pas de prix. Mais un prix ferme quatre ans sur des bâtiments que personne n'a visités…",
      },
    ],
    sources: [
      {
        id: "cahier",
        titre: "Lire le cahier des charges et poser le coût d'une tonne",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Dépose soignée, tri et transport : ${ACCORD.depose} € la tonne. Chaque tonne réemployée se revend ${FILIERE.prix} € ; le reste part au recyclage, ${FILIERE.recyclage} € la tonne. Coût net d'une tonne : ${ACCORD.depose} − ${FILIERE.prix} × taux de réemploi + ${FILIERE.recyclage} × (1 − taux). Au taux du plan (${pct(REEMPLOI_METROPOLE.plan)}), ${n0(coutAccord(REEMPLOI_METROPOLE.plan))} € ; chaque point de réemploi en moins coûte ${nombre(SENSIBILITE_ECOULEMENT, 1)} € de plus. Critères : prix 60 %, références 40 % (conventions de gisement, tonnages déjà traités)${
            ctx.aDesConventions
              ? " : vos conventions comptent"
              : " : vous n'avez aucune convention à faire valoir"
          }. La Métropole se réserve de déclarer la consultation sans suite si le décret est repoussé. Un bureau d'études peut caractériser trois bâtiments avant la remise des offres : ${kE(ACCORD.caracterisation)}.`,
      },
      {
        id: "ancien",
        titre: "Déjeuner avec un ancien responsable de Vercoran",
        cout: 0.5,
        nature: "utile",
        resultat: `Joris Vandamme : « Sur les bâtiments publics des années soixante-dix, on a mesuré entre ${pct(REEMPLOI_METROPOLE.min)} et ${pct(REEMPLOI_METROPOLE.max)} de réemploi selon les sites, ${pct(REEMPLOI_METROPOLE.moyen)} en moyenne. Les candidats sérieux visitent, mesurent, et chiffrent au coût réel avec ${ACCORD.margeConcurrents} € de marge. Celui qui chiffre au plan gagne… les mauvais lots. »`,
      },
    ],
    question: "Comment répondez-vous à la Métropole ?",
    options: [
      {
        t: `Remettre l'offre du plan, ${n0(PRIX_DU_PLAN)} € la tonne, pour être sûrs de gagner`,
        d: `${kE(ACCORD.preparation)} de préparation ; prix ferme quatre ans.`,
      },
      {
        t: `Faire caractériser trois bâtiments, puis chiffrer au coût mesuré plus ${ACCORD.marge} € la tonne`,
        d: `${kE(ACCORD.caracterisation)} d'études et ${kE(ACCORD.preparation)} de préparation ; le prix suivra la mesure.`,
      },
      {
        t: "Ne pas répondre : trop tôt pour s'engager quatre ans sur un prix",
        d: "Rien à dépenser ; pas de référence publique.",
      },
      {
        t: `Remettre une offre prudente : le prix du plan plus ${ACCORD.securite} € de marge de sécurité, ${n0(PRIX_PRUDENT)} € la tonne`,
        d: `${kE(ACCORD.preparation)} de préparation ; prix ferme quatre ans.`,
      },
    ],
    reactions: [
      [{ ...AUGUSTIN, texte: "Offre reçue. Attribution en semaine 10." }],
      null,
      [{ ...AUGUSTIN, texte: "Nous prenons note. D'autres candidats ont répondu." }],
      [{ ...AUGUSTIN, texte: "Offre reçue. Attribution en semaine 10." }],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Le premier bilan",
    jusqua: 8,
    messages: (ctx) => [
      ctx.aDesGisements
        ? {
            ...TIDIANE,
            heure: "09:00",
            alerte: true,
            texte: `Premier bilan des collectes : ${ctx.ecoulement} des matériaux se revendent, pas ${pct(ECOULEMENT.plan)}. Et Gerland et Villeurbanne font 82 % des premières ventes.`,
          }
        : {
            ...TIDIANE,
            heure: "09:00",
            alerte: true,
            texte: `Nous n'avons pas de collecte à mesurer, mais la place de marché d'Orréa publie ses chiffres pour la métropole : ${ctx.ecoulement} des matériaux se revendent, pas ${pct(ECOULEMENT.plan)}. Et deux agences sur trente font l'essentiel des ventes.`,
          },
      {
        ...SOLENN,
        heure: "11:20",
        texte: `Les comptoirs du plan doivent être commandés cette semaine pour ouvrir au printemps : ${kE(COMPTOIRS.amenagement)} d'aménagement chacun, un vendeur à temps partiel. Mes six chefs d'agence sont prêts.`,
      },
      {
        ...BERTILLE,
        heure: "16:45",
        texte:
          "Le plan a été présenté avec six comptoirs. Reculer maintenant, c'est un mauvais signal pour les agences et pour nos partenaires.",
      },
    ],
    sources: [
      {
        id: "bilan",
        titre: "Lire le bilan des premières semaines",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Taux d'écoulement mesuré : ${ctx.ecoulement}. Ventes : Gerland et Villeurbanne 82 %, les quatre autres agences du plan 18 % à elles quatre. ${
            ctx.aDesGisements
              ? `À ce taux, vos ${ctx.volumeFiliere} t collectées par an donnent ${ctx.vendables} t à vendre.`
              : "Sans gisement, vous n'aurez presque rien à vendre l'an prochain."
          } Deux comptoirs à Gerland et Villeurbanne vendent ${n0(2 * COMPTOIRS.capaciteBon)} t par an, la vente directe aux maîtres d'ouvrage ${n0(COMPTOIRS.direct)} t : ${n0(CAPACITE_DEUX)} t au plein prix. Les quatre autres comptoirs en ajoutent ${n0(4 * COMPTOIRS.capaciteAutre)}, pour ${kE(4 * COMPTOIRS.amenagement)} d'aménagement et ${kE(4 * COMPTOIRS.fixe)} par an de vendeurs. Ce qui ne passe pas en comptoir part sur la place de marché d'Orréa, ${pct(1 - COMPTOIRS.placeDeMarche)} moins cher.`,
      },
      {
        id: "plan",
        titre: "Relire les hypothèses du plan présenté au comité",
        cout: 0.5,
        nature: "utile",
        resultat: `Le plan supposait ${pct(ECOULEMENT.plan)} d'écoulement et des ventes réparties également entre six agences. À ${pct(ECOULEMENT.plan)}, les gisements du plan donnaient ${n0(ECOULEMENT.plan * (DEMOLISSEURS.sartel + DEMOLISSEURS.grollier + REPRISE.reemployables))} t à vendre par an : plus que les ${n0(CAPACITE_DEUX)} t de deux comptoirs, d'où les six (${n0(CAPACITE_SIX)} t avec la vente directe). Aucune de ces hypothèses n'avait été mesurée.`,
      },
    ],
    question: "Quel rythme d'ouverture des comptoirs retenez-vous ?",
    options: [
      {
        t: "Tenir le plan : six comptoirs au printemps, les ventes suivront",
        d: `${kE(6 * COMPTOIRS.amenagement)} d'aménagement, ${kE(6 * COMPTOIRS.fixe)} par an de vendeurs.`,
      },
      {
        t: "Deux comptoirs à Gerland et Villeurbanne et la vente directe ; les quatre autres, décidés sur les ventes de juin",
        d: `${kE(2 * COMPTOIRS.amenagement)} d'aménagement, ${kE(2 * COMPTOIRS.fixe)} par an de vendeurs.`,
      },
      {
        t: "N'ouvrir aucun comptoir cette année : vente directe et place de marché d'Orréa",
        d: `Rien à aménager ; la place de marché prend ${pct(1 - COMPTOIRS.placeDeMarche)} du prix.`,
      },
      {
        t: "Commander les six comptoirs, mais n'en ouvrir que deux au printemps et les quatre autres à l'automne",
        d: `${kE(6 * COMPTOIRS.amenagement)} d'aménagement ; les vendeurs des quatre derniers à mi-temps la première année.`,
      },
    ],
    reactions: [
      [{ ...SOLENN, texte: "Six comptoirs au printemps : je préviens les chefs d'agence." }],
      [
        {
          ...SOLENN,
          texte:
            "Gerland et Villeurbanne au printemps. Les quatre autres attendront juin ; je leur explique pourquoi.",
        },
      ],
      [
        {
          ...SOLENN,
          texte: "Pas de comptoir cette année. Les artisans iront sur la place de marché.",
        },
      ],
      [
        {
          ...SOLENN,
          texte: "Commande passée pour les six ; deux ouvrent au printemps, quatre à l'automne.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "L'offre d'Orréa",
    jusqua: 11,
    messages: () => [
      {
        ...SIXTINE,
        heure: "09:30",
        alerte: true,
        texte: `Madame Okoye, Orréa propose aux distributeurs de prendre en charge toute la reprise obligatoire : bennes en agence, collecte, traitement, déclarations, ${REPRISE.cleEnMain} € la tonne pour cinq ans, flux réemployables compris. L'offre est réservée aux trois premiers distributeurs qui signent ; deux l'ont fait.`,
      },
      {
        ...OCTAVIEN,
        heure: "10:15",
        texte: `${REPRISE.cleEnMain} € la tonne, zéro souci, la conformité garantie. Nous sommes un négoce, pas un recycleur : signons.`,
      },
      {
        ...AMEDEE,
        heure: "14:00",
        texte:
          "Le décret paraîtra mi-décembre. Rien ne presse : la plupart de nos adhérents attendent le texte avant de signer quoi que ce soit.",
      },
    ],
    sources: [
      {
        id: "orrea",
        titre: "Lire l'offre d'Orréa en détail",
        cout: 0.5,
        nature: "decisive",
        resultat: `Les agences reprendront ${n0(REPRISE.dechets)} t de déchets triés par an, dont ${n0(REPRISE.reemployables)} t de matériaux réemployables. Clé en main : ${REPRISE.cleEnMain} €/t sur ${n0(REPRISE.dechets)} t, soit ${kE(REPRISE.cleEnMain * REPRISE.dechets)} par an, et les flux réemployables reviennent à Orréa pour cinq ans. Variante : ${REPRISE.cleEnMain} €/t sur les seuls ${n0(REPRISE.dechets - REPRISE.reemployables)} t non réemployables, soit ${kE(REPRISE.cleEnMain * (REPRISE.dechets - REPRISE.reemployables))} par an ; Arvel garde les ${n0(REPRISE.reemployables)} t. Sans contrat, le tarif standard d'Orréa : ${REPRISE.standard} €/t, soit ${kE(REPRISE.standard * REPRISE.dechets)} par an. Avec nos propres prestataires : ${REPRISE.propre} €/t. Tous ces contrats ne prennent effet qu'avec l'obligation : si le décret est repoussé, personne ne paie rien.`,
      },
      {
        id: "flux",
        titre: "Chiffrer ce que valent les flux réemployables des agences",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Collectés en agence (${FILIERE.collecteAgence} €/t), triés en sous-traitance (${FILIERE.triSousTraite} €/t), revendus à ${ctx.ecoulement}, les ${n0(REPRISE.reemployables)} t rapportent ${ctx.margeAgence} € la tonne, soit ${ctx.valeurAgence} par an${
            ctx.aDesGisements
              ? ", davantage avec un équipement de tri, et ils grossissent les volumes de la filière"
              : " ; sans filière, ils se vendent en direct ou sur la place de marché"
          }.`,
      },
    ],
    question: "Que répondez-vous à Orréa ?",
    options: [
      {
        t: "Signer l'offre clé en main : toute la reprise à Orréa, flux réemployables compris",
        d: `${REPRISE.cleEnMain} €/t sur ${n0(REPRISE.dechets)} t, ${kE(REPRISE.cleEnMain * REPRISE.dechets)} par an si l'obligation s'applique.`,
      },
      {
        t: "Confier à Orréa les seuls déchets non réemployables, garder les flux réemployables pour notre filière",
        d: `${REPRISE.cleEnMain} €/t sur ${n0(REPRISE.dechets - REPRISE.reemployables)} t, ${kE(REPRISE.cleEnMain * (REPRISE.dechets - REPRISE.reemployables))} par an ; ${n0(REPRISE.reemployables)} t à collecter en agence.`,
      },
      {
        t: "Tout organiser nous-mêmes, avec nos propres prestataires",
        d: `${REPRISE.propre} €/t sur ${n0(REPRISE.dechets - REPRISE.reemployables)} t, ${kE(REPRISE.propre * (REPRISE.dechets - REPRISE.reemployables))} par an ; les flux réemployables restent à nous.`,
      },
      {
        t: "Attendre le décret pour répondre",
        d: `Rien de signé avant mi-décembre ; si l'offre n'est plus ouverte, le tarif standard est de ${REPRISE.standard} €/t.`,
      },
    ],
    reactions: [
      [{ ...SIXTINE, texte: "Contrat signé : nos bennes arrivent dans vos agences en juin." }],
      [
        {
          ...SIXTINE,
          texte:
            "C'est entendu : nous reprenons les déchets non réemployables, vous gardez le reste. Contrat signé.",
        },
      ],
      [{ ...SIXTINE, texte: "Nous restons à votre disposition, au tarif standard, si besoin." }],
      [
        {
          ...SIXTINE,
          texte:
            "Je ne peux pas vous garantir que l'offre sera encore ouverte en décembre. Il reste une place.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "La plateforme, maintenant ?",
    jusqua: 13,
    messages: (ctx) => [
      ctx.plateforme
        ? {
            ...LUDWIG,
            heure: "09:00",
            alerte: true,
            texte: `Madame Okoye, votre plateforme est en fabrication, livraison en juin. Si vous voulez la ramener à une ligne modulaire de ${n0(LIGNE.capacite)} t, c'est ${kE(DEDIT.reduire)} de dédit ; l'annuler, ${kE(DEDIT.annuler)}.`,
          }
        : {
            ...LUDWIG,
            heure: "09:00",
            alerte: true,
            texte: `Madame Okoye, l'appel à projets de la Région ferme le 31 décembre : ${ctx.subvention} de subvention. Notre plateforme de ${n0(PLATEFORME.capacite)} t à ${kE(PLATEFORME.prix)}, ou la ligne modulaire de ${n0(LIGNE.capacite)} t à ${kE(LIGNE.prix)}, extensible. Avec le décret, les volumes vont exploser : prenez la plateforme.`,
          },
      {
        ...OCTAVIEN,
        heure: "10:40",
        texte: ctx.plateforme
          ? "On ne revient pas sur une commande annoncée au salon. Ce serait reconnaître une erreur devant toute la profession."
          : "La subvention ne repassera peut-être pas. Une aide pareille, c'est maintenant ou jamais.",
      },
      {
        ...TIDIANE,
        heure: "15:30",
        texte: `À nos volumes sous contrat (${ctx.volumeFiliere} t par an), le tri sous-traité nous coûte ${FILIERE.triSousTraite} € la tonne.`,
      },
    ],
    sources: [
      {
        id: "dimensionnement",
        titre: "Calculer la VAN de chaque équipement à nos volumes",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Sur cinq ans, au taux du groupe, valeur au bout des cinq ans comprise (${pct(VALEUR_RESIDUELLE)} du prix), ${ctx.volumes} : ${
            ctx.plateforme
              ? `garder la plateforme commandée, ${ctx.vanGarder} ; la réduire à une ligne, dédit compris, ${ctx.vanReduire} ; l'annuler, ${ctx.vanAnnuler}. La commande passée avant le dossier rend l'une et l'autre inéligibles à la subvention.`
              : `la ligne de ${n0(LIGNE.capacite)} t, subvention déduite, ${ctx.vanLigne} ; la plateforme de ${n0(PLATEFORME.capacite)} t, ${ctx.vanPlateforme} ; rester en sous-traitance, 0 k€. Chaque tonne triée chez soi économise ${FILIERE.triSousTraite - LIGNE.variable} € sur la ligne, ${FILIERE.triSousTraite - PLATEFORME.variable} € sur la plateforme, qui coûte ${kE(PLATEFORME.fixe)} par an à faire tourner, contre ${kE(LIGNE.fixe)}.`
          }`,
      },
      {
        id: "fabricant",
        titre: "Recevoir le fabricant pour une démonstration",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Ludwig Haberkorn : « Nos clients ont triplé leurs volumes en trois ans. Une ligne modulaire, c'est bien pour commencer, mais vous la regretterez quand le marché décollera. » Ses références sont des recycleurs de déchets inertes, pas des négociants.",
      },
    ],
    question: "Quel équipement de tri retenez-vous ?",
    options: [
      {
        t: `La plateforme de ${n0(PLATEFORME.capacite)} t : prendre la capacité d'avance`,
        d: `${kE(PLATEFORME.prix)}, subventionnés par la Région si le dossier part avant toute commande. Déjà commandée : on la garde.`,
      },
      {
        t: `Une ligne de tri modulaire de ${n0(LIGNE.capacite)} t, à la taille des gisements signés, extensible`,
        d: `${kE(LIGNE.prix)}, subventionnés par la Région si le dossier part avant toute commande. Plateforme déjà commandée : on la réduit, contre ${kE(DEDIT.reduire)} de dédit.`,
      },
      {
        t: "Rester en tri sous-traité un an de plus, et décider sur les volumes de l'an prochain",
        d: `Rien à engager. Plateforme déjà commandée : on l'annule, contre ${kE(DEDIT.annuler)} de dédit.`,
      },
    ],
    reactions: [
      [{ ...LUDWIG, texte: "Excellent choix. Mise en service au printemps prochain." }],
      [
        {
          ...LUDWIG,
          texte: `C'est noté : une ligne modulaire de ${n0(LIGNE.capacite)} t, extensible.`,
        },
      ],
      [{ ...TIDIANE, texte: "Nous restons chez le trieur. Je préviens Sartel et Grollier." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Les gisements d'abord, l'équipement ensuite", chemin: [1, 0, 1, 1, 1, 1] },
  { nom: "Le premier visible", chemin: [0, 1, 0, 0, 0, 0] },
  { nom: "Attentiste", chemin: [2, 2, 2, 2, 3, 2] },
] as const;

/**
 * Les réflexes devant une réglementation qui crée un marché, [décision,
 * option] : suivre la mode (la plateforme commandée et annoncée, l'offre au
 * prix du plan, les six comptoirs tenus, la grande plateforme pour la
 * subvention, toute la reprise confiée à l'éco-organisme), ou attendre que
 * tout soit prouvé (le comité qui gèle, les démolisseurs qu'on fait
 * attendre ou qu'on n'engage qu'un an, l'offre d'Orréa laissée en suspens).
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 1],
  [1, 2],
  [2, 0],
  [3, 0],
  [4, 0],
  [4, 3],
  [5, 0],
] as const;

export const REPONSES = {
  caracterisation: (reemploi: number, prix: number) =>
    `Caractérisation des trois bâtiments : ${pct(reemploi)} de réemploi en moyenne. Coût net : ${n0(coutAccord(reemploi))} € la tonne ; votre offre part à ${n0(prix)} €.`,
  offreRecue: "Offre reçue. Attribution en semaine 10.",
} as const;
