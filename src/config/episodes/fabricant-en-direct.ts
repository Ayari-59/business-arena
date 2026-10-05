/**
 * LE FABRICANT QUI VEND EN DIRECT — le contenu de l'épisode.
 *
 * Séverin Chabrol dirige l'offre et les achats d'Arvel Distribution : 112 M€
 * d'achats par an, l'assortiment des trente agences de la région. Mérindal,
 * fabricant de menuiseries et de plaques de plâtre, son premier fournisseur,
 * annonce une plateforme de vente directe aux grandes entreprises du
 * bâtiment. Six décisions, chacune précédée de ce qu'un directeur des achats
 * reçoit vraiment : le président qui veut une riposte, le directeur
 * commercial qui veut punir, la directrice financière qui veut attendre.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : la marge par type de client et sa part exposée,
 * la dépendance des deux côtés, ce que rapportent les services facturés, la
 * marque alternative et la marque propre, ce que coûterait une extension de
 * la vente directe aux artisans.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprises, personnes et chiffres sont fictifs.
 */
import type { Contexte, Etape } from "./types";

const CLOTAIRE = { de: "Clotaire Marcillac", role: "Président-directeur général" } as const;
const HELIA = { de: "Hélia Marcadet", role: "Directrice administrative et financière" } as const;
const THIERNO = { de: "Thierno Bassolé", role: "Directeur commercial" } as const;
const KONRAD = { de: "Konrad Hornecker", role: "Directeur des ventes France, Mérindal" } as const;
const NOAM = { de: "Noam Riboulet", role: "Chef de produit plâtrerie et menuiseries" } as const;
const DOMITILLE = { de: "Domitille Gendron", role: "Cheffe d'agence, Villeurbanne" } as const;
const EVARISTE = {
  de: "Évariste Ardisson",
  role: "Directeur des achats, Corbière Bâtiment",
} as const;
const ORIANE = { de: "Oriane Bachelard", role: "Directrice commerciale, Solvane" } as const;
const ELOUAN = { de: "Elouan Quiviger", role: "Contrôleur de gestion" } as const;
const FIONA = {
  de: "Fiona Mabillon",
  role: "Directrice commerciale, Plâtrières du Vercors",
} as const;

export const DIAGNOSTICS = [
  {
    id: "exposition",
    t: "La plateforme ne peut prendre que les commandes complètes, qui n'ont pas besoin de nos services, et Mérindal dépend de nous autant que nous de lui : il faut chiffrer l'exposition et la dépendance des deux côtés, défendre ce que le négoce apporte, et négocier",
  },
  {
    id: "services",
    t: "Nos clients profitent de nos services sans les payer : il faut les mettre en avant et les facturer à leur juste prix",
  },
  {
    id: "trahison",
    t: "Mérindal devient notre concurrent : tant que nous vendons ses produits, nous finançons sa plateforme ; il faut le remplacer",
  },
  {
    id: "besoin",
    t: "Mérindal a trop besoin de nous pour aller loin : sa plateforme est surtout un moyen de pression avant les négociations annuelles",
  },
] as const;

/** Les chiffres de Solvane, tels que l'équipe les lit en semaine 9, selon ce qui a été référencé. */
const chiffresSolvane = (ctx: Contexte) =>
  ctx.solvane === "aucun"
    ? "Aucun chiffre : Solvane n'a été référencée dans aucune agence. Les négoces qui l'ont fait annoncent un artisan sur quatre passé à la série, un sur vingt au sur-mesure."
    : ctx.solvane === "test"
      ? `Dans les six agences du test, en quatre semaines, Solvane fait ${ctx.serie} des fenêtres et portes de série vendues aux artisans et aux PME, et ${ctx.surMesure} du sur-mesure, avec trois chantiers repris pour erreur de cotes. À l'échelle des trente agences, la série rapporterait ${ctx.serieAnnuel} de marge en plus par an, pour 45 k€ de déploiement ; le sur-mesure, ${ctx.surMesureAnnuel} par an, pour 80 k€ de déploiement et 25 k€ de service après-vente par an.`
      : `Dans les trente agences, depuis la semaine 5, Solvane fait ${ctx.serie} des fenêtres et portes de série vendues aux artisans et aux PME, et ${ctx.surMesure} du sur-mesure, avec trois chantiers repris pour erreur de cotes. La série rapporte ${ctx.serieAnnuel} de marge en plus par an ; le sur-mesure, ${ctx.surMesureAnnuel} par an, pour 25 k€ de service après-vente par an. Les 125 k€ du déploiement sont dépensés ; retirer une famille des rayons coûterait 10 k€.`;

/** Ce que Mérindal peut accepter en fin de trimestre, selon sa réaction et ce que nous avons montré. */
function cequIlPeutAccepter(ctx: Contexte): string {
  const levier = ctx.solvaneEnRayon
    ? " Solvane en rayon pèse en notre faveur."
    : " Sans seconde marque en rayon, nous n'avons pas grand-chose à mettre en face.";
  const piques = ctx.surMesureEnRayon
    ? " Notre sur-mesure Solvane, son cœur de métier, l'a piqué au vif : il sera moins conciliant."
    : "";
  const silence = ctx.laisse
    ? " Nous n'avons rien montré depuis l'annonce : il n'a aucune raison de nous faire un cadeau."
    : "";
  const enjeu =
    " La commission rendrait 35 % de la marge que la plateforme nous prend. Sans engagement écrit sur les artisans, une chance sur trois qu'il leur ouvre sa plateforme l'an prochain : 185 k€ de marge par an, un peu moins si nos services sont facturés à part.";
  if (ctx.derefere) {
    return `Notre déréférencement prend effet au 1er janvier. Mérindal reviendrait sur la rupture avec un accord complet quatre fois sur dix, avec le seul partage des grands comptes six fois sur dix.${levier}${enjeu}`;
  }
  if (ctx.reaction === "accord") {
    return `Mérindal propose lui-même un partage : un accord limité au partage et à la commission, il le signera presque à coup sûr. Un accord complet, avec l'engagement de ne pas vendre aux artisans, sept fois sur dix ; un refus le braquerait, et il nous retirerait un point et demi de remise de fin d'année, 168 k€ par an.${levier}${piques}${silence}${enjeu}`;
  }
  if (ctx.reaction === "conflit") {
    return `Mérindal nous a retiré un point et demi de remise de fin d'année : 168 k€ par an. Un accord limité au partage, il le signerait sept fois sur dix ; un accord complet, quatre fois sur dix. Signé, l'un comme l'autre rétablit la remise.${levier}${piques}${silence}${enjeu}`;
  }
  return `Mérindal a annoncé l'ouverture de sa plateforme aux artisans et aux PME au printemps : 185 k€ de marge par an en jeu. Seul un accord complet, avec l'engagement de ne pas leur vendre, la ferait annuler ; il le signerait un peu plus d'une fois sur trois. Un accord limité, six fois sur dix, sauverait le partage des grands comptes, pas les artisans.${levier}${piques}${silence}`;
}

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Mérindal vend en direct",
    jusqua: 2,
    messages: () => [
      {
        ...KONRAD,
        heure: "07:45",
        texte:
          "Monsieur Chabrol, je tenais à vous prévenir avant la presse : Mérindal ouvre dans trois semaines Mérindal Pro Direct, une plateforme de commande pour les grandes entreprises du bâtiment. Rien ne change pour nos partenaires négociants.",
      },
      {
        ...CLOTAIRE,
        heure: "08:30",
        alerte: true,
        texte:
          "Séverin, tu as vu l'annonce de Mérindal. Notre premier fournisseur devient notre concurrent. Le comité de direction se réunit vendredi : je veux ta riposte, et ce qu'on risque, en chiffres.",
      },
      {
        ...THIERNO,
        heure: "09:10",
        texte:
          "On ne va pas financer celui qui nous attaque. On sort Mérindal de nos agences au 1er janvier : Solvane et deux autres fabricants ne demandent que ça.",
      },
      {
        ...HELIA,
        heure: "10:05",
        texte:
          "Ne nous affolons pas. Mérindal a autant besoin de nous que nous de lui : qui livrera ses artisans ? À mon avis, c'est un coup de pression avant les négociations annuelles.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "ventes",
        titre: "Décomposer les ventes Mérindal par type de client et de commande",
        cout: 1,
        nature: "decisive",
        resultat:
          "Sur douze mois, 14 M€ de ventes de produits Mérindal, 2,8 M€ de marge. Grands comptes : 5 M€ à 13 % de marge, soit 650 k€, dont 60 % sur des commandes de semi-remorques complètes livrées sur chantier. PME du bâtiment : 4 M€ à 20 %, soit 800 k€, dont 20 % sur des commandes complètes. Artisans : 5 M€ à 27 %, soit 1 350 k€ ; aucun ne commande par semi : ils prennent au comptoir, en livraison fractionnée, à crédit, avec du conseil. La plateforme ne sert que des commandes complètes, livrées depuis l'usine sous trois semaines, payées à trente jours.",
      },
      {
        id: "dependance",
        titre: "Chiffrer la dépendance des deux côtés",
        cout: 1,
        nature: "decisive",
        resultat:
          "Mérindal, c'est 11,2 M€ d'achats, 10 % des 112 M€ que nous achetons : notre premier fournisseur. Nous pesons 35 % de ses 32 M€ de ventes en négoce dans la région, un peu moins de 3 % de ses ventes en France ; il n'a aucun dépôt ici pour servir ses 4 000 artisans. Mais sept artisans sur dix demandent ses menuiseries sur mesure par leur nom, un sur six ses plaques. Ailleurs, sa plateforme a pris la première année un cinquième des commandes complètes en Belgique, près de la moitié aux Pays-Bas, plus des deux tiers en Suisse : chez nous, à peu près une chance sur trois que ce soit peu, une sur deux autour de la moitié, une sur cinq bien plus. En Belgique, le premier négoce, qui venait de référencer une seconde marque, a signé avec lui un partage des grands comptes ; en Suisse, le négoce n'a rien fait, et un an après la plateforme vendait aux artisans.",
      },
      {
        id: "plaquette",
        titre: "Lire la présentation de Mérindal Pro Direct",
        cout: 1,
        nature: "bruit",
        resultat:
          "« Jusqu'à 12 % d'économies sur vos chantiers, une commande en trois clics, un interlocuteur unique. » La plaquette compare ses prix au tarif public des négoces, pas à nos prix grands comptes ; elle ne dit rien des délais, du crédit, ni des retours.",
      },
      {
        id: "agences",
        titre: "Faire le tour de six chefs d'agence",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Domitille Gendron, à Villeurbanne : « Mes artisans s'en moquent : ils viennent pour le stock, le conseil et le crédit. » À Saint-Priest et à Vénissieux, des grands comptes ont déjà reçu la visite de Mérindal. Corbière Bâtiment, notre premier client, demande un rendez-vous.",
      },
      {
        id: "conseil",
        titre: "Appeler Eudes Dumontet, ancien directeur des achats d'un négoce du Sud-Ouest",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Eudes Dumontet : « On a vécu ça avec un fabricant de tuiles. Ne casse rien sous le coup de la colère, et ne fais pas semblant de ne rien voir. Chiffre ce qu'il peut vraiment te prendre, client par client, et ce que tu pèses pour lui. Ensuite, fais payer ce que tu apportes, et va le voir avec une autre marque dans ta poche. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Quelle riposte proposez-vous au comité de direction ?",
    options: [
      {
        t: "Déréférencer Mérindal au 1er janvier, menuiseries et plaques, et passer à d'autres fabricants",
        d: "Rien à engager ce trimestre. Mérindal est prévenu cette semaine : trois mois de préavis.",
      },
      {
        t: "Ne rien changer : Mérindal a trop besoin de nous pour aller loin",
        d: "Rien à engager. On regarde venir.",
      },
      {
        t: "S'aligner sur la plateforme : 5 % de remise aux grands comptes et sur les commandes complètes des PME",
        d: "290 k€ de marge par an. Nos prix grands comptes rejoignent ceux de Mérindal.",
      },
      {
        t: "Chiffrer ce que la plateforme peut prendre, défendre ce que le négoce apporte, et ouvrir la discussion avec Mérindal",
        d: "15 k€ d'étude et de visites des quarante grands comptes ; un rendez-vous demandé à Mérindal.",
      },
    ],
    reactions: [
      [
        {
          ...CLOTAIRE,
          texte:
            "Le comité valide : Mérindal est prévenu que nous le déréférençons au 1er janvier. Thierno est ravi.",
        },
        {
          ...KONRAD,
          texte:
            "Nous prenons acte de votre décision, que nous regrettons. Nous en tirerons les conséquences.",
        },
      ],
      [
        {
          ...HELIA,
          texte: "Sage décision. On en reparlera aux négociations annuelles.",
        },
      ],
      [
        {
          ...THIERNO,
          texte:
            "Les nouveaux prix partent lundi chez les grands comptes et les PME. Au moins, on ne perdra personne sur le prix.",
        },
      ],
      [
        {
          ...CLOTAIRE,
          texte:
            "Le comité te suit : on chiffre, on défend, on discute. Tiens-moi au courant de chaque rendez-vous avec Mérindal.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Les grands comptes demandent un geste",
    jusqua: 4,
    messages: () => [
      {
        ...THIERNO,
        heure: "09:20",
        alerte: true,
        texte:
          "Séverin, Mérindal a fait ses offres à nos grands comptes : 8 % sous nos prix sur les semis complets. J'ai trois appels ce matin. Une remise de 3 % aux vingt premiers, et on n'en parle plus.",
      },
      {
        ...EVARISTE,
        heure: "11:05",
        texte:
          "Monsieur Chabrol, l'offre de Mérindal est sérieuse sur nos semis. Mais vos livraisons fractionnées, le stock que vous gardez pour nos chantiers et votre crédit nous servent. Qu'est-ce que vous nous proposez ?",
      },
      {
        ...ELOUAN,
        heure: "14:30",
        texte:
          "Premiers retours des commerciaux : Mérindal ne démarche que pour des semis complets, livrés sur chantier. Aucune PME pour du réassort, aucun artisan.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "services",
        titre: "Mesurer qui, chez les grands comptes, se sert de nos services",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Quatre commandes de grands comptes sur dix demandent une livraison fractionnée, un stock réservé chantier ou un crédit au-delà de trente jours ; nous ne facturons rien. Facturés à leur coût, ces services rapporteraient 130 k€ par an. Baisser de 3 % les commandes complètes, 3,8 M€ par an, coûterait 114 k€. Dans le Sud-Ouest, le négoce qui a séparé ainsi ses prix a gardé quatre commandes complètes sur dix que la plateforme lui aurait prises. Étendre ces services gratuits à tous les grands comptes, sans limite, coûterait 110 k€ de plus par an et n'en garderait qu'une sur six ou sept ; une remise de 3 % aux vingt premiers, 105 k€ par an, deux sur dix.",
      },
      {
        id: "corbiere",
        titre: "Revoir le compte de Corbière Bâtiment",
        cout: 0.5,
        nature: "utile",
        resultat:
          "1,5 M€ de produits Mérindal par an, à 13 % de marge : 195 k€. 60 % en semis complets pour ses chantiers de logements, 40 % en réassort, en urgences et en livraisons fractionnées : 78 k€ de marge que la plateforme ne sait pas servir, mais que Corbière emporterait s'il partait fâché.",
      },
    ],
    question: "Que proposez-vous aux grands comptes ?",
    options: [
      {
        t: "Étendre à tous les grands comptes, sans supplément, la livraison fractionnée, un stock réservé par chantier et le crédit à soixante jours",
        d: "110 k€ de plus par an de services offerts ; les prix ne bougent pas.",
      },
      {
        t: "Séparer le prix du produit et celui des services : 3 % de moins sur les commandes complètes, les services facturés à qui s'en sert",
        d: "114 k€ de baisse sur les commandes complètes ; livraison fractionnée, stock chantier et crédit long deviennent payants.",
      },
      {
        t: "Ne rien changer : nos grands comptes savent ce qu'ils nous doivent",
        d: "Rien à engager.",
      },
      {
        t: "Une remise de 3 % aux vingt premiers grands comptes, pour les garder",
        d: "105 k€ de marge par an.",
      },
    ],
    reactions: [
      [
        {
          ...EVARISTE,
          texte:
            "Livraisons fractionnées, stock réservé et crédit à soixante jours offerts : c'est apprécié. Nous gardons quand même un œil sur Mérindal pour les semis.",
        },
      ],
      null,
      [
        {
          ...THIERNO,
          texte: "Si on perd Corbière, je ne veux pas qu'on me dise que je n'avais pas prévenu.",
        },
      ],
      [
        {
          ...EVARISTE,
          texte:
            "Trois pour cent, c'est un geste. Mérindal reste 8 % sous vous sur les semis, mais nous restons, pour l'instant.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Une seconde marque de menuiseries",
    jusqua: 6,
    messages: () => [
      {
        ...ORIANE,
        heure: "08:50",
        alerte: true,
        texte:
          "Monsieur Chabrol, Solvane est prête à entrer chez Arvel : fenêtres et portes de série, et notre sur-mesure avec son configurateur. Sept points de marge de plus que ce que vous faites sur Mérindal, livraison en dix jours.",
      },
      {
        ...THIERNO,
        heure: "10:15",
        texte:
          "On référence tout, partout, tout de suite. Que Mérindal voie dès lundi qu'on a une autre marque en rayon.",
      },
      {
        ...NOAM,
        heure: "11:40",
        texte:
          "Attention au sur-mesure : un artisan qui a ses habitudes sur le configurateur de Mérindal, ses cotes et son service après-vente ne change pas comme ça.",
      },
    ],
    sources: [
      {
        id: "bascule",
        titre: "Interroger les négoces qui ont référencé une seconde marque de menuiseries",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sur la série, un artisan sur quatre est passé à la seconde marque la première année, entre un sur dix et quatre sur dix selon les négoces. Sur le sur-mesure, un sur vingt : les cotes, le configurateur et le service après-vente le retiennent. Chez nous, la série Mérindal vendue aux artisans et aux PME pèse 3 M€ par an, le sur-mesure 2,5 M€. À un quart de bascule, la série rapporterait 52,5 k€ de marge en plus par an, pour 45 k€ de déploiement ; le sur-mesure, à un sur vingt, 8,75 k€ par an, pour 80 k€ de déploiement et 25 k€ de service après-vente par an.",
      },
      {
        id: "test",
        titre: "Chiffrer un test dans six agences",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Six agences sur trente, quatre semaines, toute la gamme en exposition : 25 k€. Les chiffres seraient connus en semaine 9, avant la négociation de fin d'année. Mérindal le saura aussi : ses commerciaux passent dans toutes nos agences.",
      },
    ],
    question: "Que faites-vous de l'offre de Solvane ?",
    options: [
      {
        t: "Référencer toute la gamme Solvane dans les trente agences, dès maintenant",
        d: "125 k€ de déploiement : 45 k€ pour la série, 80 k€ pour le sur-mesure. En rayon en semaine 5.",
      },
      {
        t: "Tester toute la gamme dans six agences pendant quatre semaines, puis déployer",
        d: "25 k€. Les chiffres du test en semaine 9.",
      },
      {
        t: "Ne pas référencer de seconde marque : nos artisans veulent Mérindal",
        d: "Rien à engager.",
      },
    ],
    reactions: [
      [
        {
          ...ORIANE,
          texte:
            "Merci de votre confiance : la gamme complète sera dans vos trente agences la semaine prochaine.",
        },
      ],
      [
        {
          ...ORIANE,
          texte:
            "Six agences, quatre semaines : nous jouons le jeu, et nous regarderons les chiffres ensemble.",
        },
      ],
      [
        {
          ...ORIANE,
          texte: "Dommage. Notre offre tient jusqu'à la fin de l'année, si vous changez d'avis.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Une marque propre ?",
    jusqua: 9,
    messages: () => [
      {
        ...FIONA,
        heure: "09:30",
        alerte: true,
        texte:
          "Monsieur Chabrol, les Plâtrières du Vercors peuvent fabriquer vos plaques standard sous votre marque, BA13 et hydrofuges, avec la même certification que les grandes marques. Neuf points de marge de plus que sur Mérindal.",
      },
      {
        ...THIERNO,
        heure: "10:45",
        texte:
          "Allons au bout : une marque Arvel pour les plaques et pour les menuiseries. On reprend la main sur tout.",
      },
      {
        ...DOMITILLE,
        heure: "12:10",
        texte:
          "Mes plaquistes prennent la plaque la moins chère qui tient la norme. Pour les fenêtres, c'est une autre histoire : ils veulent une marque qui répond au téléphone en cas de souci.",
      },
    ],
    sources: [
      {
        id: "marque",
        titre: "Étudier les marques propres des négoces voisins",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "En plaques standard, les marques de négoce prennent de 15 à 35 % des ventes aux artisans et aux PME, un quart en moyenne : la plaque est normée, l'artisan regarde le prix. Chez nous, 3,5 M€ de plaques Mérindal vendues aux artisans et aux PME : à un quart, et neuf points de marge de plus, 79 k€ de marge par an, pour 60 k€ de lancement. En menuiseries, une marque de négoce ne dépasse pas 4 % des ventes : sur nos 4 M€, à huit points de plus, 13 k€ par an pour 120 k€ de lancement, garantie décennale et service après-vente à notre charge.",
      },
      {
        id: "usine",
        titre: "Visiter les Plâtrières du Vercors",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Une usine récente, deux lignes, des négociants clients dans trois régions. Pas d'engagement de volume la première année. Les premières palettes seraient en agence en semaine 8, les premiers chiffres de vente connus en semaine 11.",
      },
    ],
    question: "Lancez-vous une marque propre ?",
    options: [
      {
        t: "Lancer une marque propre en plaques et en menuiseries",
        d: "180 k€ de lancement : 60 k€ pour les plaques, 120 k€ pour les menuiseries. En rayon en semaine 8.",
      },
      {
        t: "Lancer une marque propre sur les seules plaques standard, fabriquées par les Plâtrières du Vercors",
        d: "60 k€ de lancement. En rayon en semaine 8.",
      },
      {
        t: "Pas de marque propre : les artisans achètent des marques",
        d: "Rien à engager.",
      },
    ],
    reactions: [
      [
        {
          ...NOAM,
          texte:
            "Les plaques seront prêtes en semaine 8. Pour les menuiseries, j'ai trouvé un atelier dans l'Ain, mais la garantie sera à notre nom.",
        },
      ],
      [{ ...FIONA, texte: "Parfait : vos premières palettes partent en semaine 8." }],
      [{ ...FIONA, texte: "Entendu. Notre proposition tient, si vous changez d'avis." }],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Les premiers chiffres",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...ELOUAN,
        heure: "08:30",
        alerte: true,
        texte: `Huit semaines de plateforme : elle nous prend déjà ${ctx.captee} de marge par an au rythme actuel. D'après ses premiers chiffres, elle s'installe vers ${ctx.prise} des commandes complètes de la région : ${ctx.scenario}.`,
      },
      ctx.solvane === "aucun"
        ? {
            ...NOAM,
            heure: "10:00",
            texte:
              "Pas de chiffres Solvane : nous n'avons rien référencé. L'offre d'Oriane Bachelard tient jusqu'à la fin de l'année.",
          }
        : {
            ...NOAM,
            heure: "10:00",
            texte: `Les chiffres de Solvane sont là : ${ctx.serie} de la série, ${ctx.surMesure} du sur-mesure.`,
          },
      {
        ...THIERNO,
        heure: "11:30",
        texte:
          ctx.solvane === "aucun"
            ? "Il est encore temps de mettre Solvane partout, toute la gamme. Ce serait un signal."
            : ctx.solvane === "test"
              ? "On a annoncé au comité Solvane dans les trente agences, toute la gamme. On ne va pas se déjuger maintenant."
              : "Toute la gamme Solvane est en rayon, comme on l'a annoncé au comité. On ne va pas se déjuger maintenant.",
      },
    ],
    sources: [
      {
        id: "resultats",
        titre: "Lire les chiffres de Solvane, famille par famille",
        cout: 0.5,
        nature: "decisive",
        resultat: chiffresSolvane,
      },
      {
        id: "plateforme",
        titre: "Analyser les huit premières semaines de la plateforme",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Toutes les commandes passées par la plateforme sont des semis complets, de grands comptes et de quelques PME. Délais tenus à trois semaines, mais aucune livraison fractionnée, aucun retour accepté : deux chantiers de grands comptes ont dû se dépanner chez nous. Rythme actuel : ${ctx.captee} de marge prise par an.`,
      },
    ],
    question: "Que faites-vous de Solvane ?",
    options: [
      {
        t: "Déployer toute la gamme Solvane dans les trente agences, comme annoncé au comité",
        d: "45 k€ pour la série, 80 k€ pour le sur-mesure, s'ils ne sont pas déjà en rayon ; 25 k€ de service après-vente par an pour le sur-mesure.",
      },
      {
        t: "Ne garder que ce que les chiffres valident : la série si elle a pris, le sur-mesure laissé à Mérindal",
        d: "45 k€ si la série se déploie ; 10 k€ par famille à retirer des rayons.",
      },
      {
        t: "Arrêter Solvane et s'en tenir à Mérindal",
        d: "10 k€ par famille à retirer des rayons ; plus de seconde marque.",
      },
      {
        t: "Prolonger le test d'un trimestre avant de trancher",
        d: "15 k€ si le test continue ; ce qui est en rayon y reste, le déploiement glisse au printemps.",
      },
    ],
    reactions: [
      [{ ...ORIANE, texte: "La gamme complète part dans les trente agences." }],
      [
        {
          ...NOAM,
          texte:
            "La série part dans les trente agences si elle a pris ; le sur-mesure reste chez Mérindal. Je préviens Solvane.",
        },
      ],
      [{ ...ORIANE, texte: "Nous regrettons. Nous restons à votre disposition." }],
      [{ ...ORIANE, texte: "Un trimestre de plus, soit. Ce qui est en rayon y reste." }],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Mérindal à la table",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...KONRAD,
        heure: "09:00",
        alerte: true,
        texte: ctx.derefere
          ? "Monsieur Chabrol, votre déréférencement prend effet au 1er janvier. Notre direction générale accepte de vous recevoir une dernière fois avant cette date."
          : ctx.reaction === "accord"
            ? "Monsieur Chabrol, notre direction générale vous propose un partage : nous servons en direct les commandes complètes de vos quinze premiers grands comptes, vous livrez et stockez pour notre plateforme dans la région, contre une commission. Nous gardons notre liberté pour le reste."
            : ctx.reaction === "conflit"
              ? "Monsieur Chabrol, je vous confirme que notre remise de fin d'année passe de 3 % à 1,5 % au 1er janvier. Notre plateforme poursuit son développement. Notre direction générale reste ouverte à la discussion."
              : "Monsieur Chabrol, je vous confirme que Mérindal Pro Direct s'ouvrira aux artisans et aux PME au printemps, avec des points de retrait. Notre direction générale reste ouverte à la discussion.",
      },
      {
        ...THIERNO,
        heure: "10:20",
        texte: "Cette fois, on rompt. Ils nous ont assez baladés, et on a de quoi les remplacer.",
      },
      {
        ...HELIA,
        heure: "11:45",
        texte:
          "Prends ce qu'on peut obtenir sans risque : un accord signé vaut mieux qu'un accord rêvé.",
      },
    ],
    sources: [
      {
        id: "position",
        titre: "Peser ce que Mérindal peut accepter",
        cout: 0.5,
        nature: "decisive",
        resultat: cequIlPeutAccepter,
      },
      {
        id: "juridique",
        titre: "Demander l'avis de la juriste sur une rupture",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Clémentine Royo : « Mérindal nous livre depuis vingt-deux ans. Rompre une relation commerciale établie sans préavis écrit suffisant engage notre responsabilité, au titre de l'article L. 442-1, II du code de commerce ; un préavis de dix-huit mois nous mettrait à l'abri, trois mois non. Des quatre distributeurs qui l'ont déréférencé sans préavis en dix ans, Mérindal en a assigné deux ; les deux affaires se sont réglées par une transaction, autour de 250 k€. »",
      },
    ],
    question: "Que mettez-vous sur la table ?",
    options: [
      {
        t: "Rompre : annoncer à Mérindal son déréférencement au 1er janvier",
        d: "Trois mois de préavis. Solvane et les autres fabricants prennent le relais.",
      },
      {
        t: "Proposer un accord complet : le partage des grands comptes, une commission sur les livraisons de la plateforme, et l'engagement écrit de ne pas vendre aux artisans",
        d: "Rien à payer. Mérindal répondra la semaine prochaine.",
      },
      {
        t: "Proposer un accord limité au partage des grands comptes et à la commission, sans clause sur les artisans",
        d: "Rien à payer. Mérindal répondra la semaine prochaine.",
      },
      {
        t: "Ne rien signer cette année : attendre un an de chiffres",
        d: "Rien à payer ; la situation reste en l'état.",
      },
    ],
    reactions: [
      [{ ...KONRAD, texte: "Nous prenons acte. Notre service juridique reviendra vers vous." }],
      [
        {
          ...KONRAD,
          texte: "Je transmets à notre direction générale. Réponse la semaine prochaine.",
        },
      ],
      [
        {
          ...KONRAD,
          texte: "Je transmets à notre direction générale. Réponse la semaine prochaine.",
        },
      ],
      [{ ...KONRAD, texte: "Comme vous voudrez. Notre plateforme, elle, n'attend pas." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Chiffrer, défendre, négocier", chemin: [3, 1, 1, 1, 1, 1] },
  { nom: "Punir le fabricant", chemin: [0, 3, 0, 0, 0, 0] },
  { nom: "Attentiste", chemin: [1, 2, 2, 2, 3, 3] },
] as const;

/**
 * Les réflexes d'un comité sous pression devant un fournisseur qui vend en
 * direct : le punir, ou l'ignorer parce qu'il « a besoin de nous » ; acheter
 * la fidélité par une remise ; référencer sans savoir ce que les artisans
 * feront ; tout passer en marque propre ; tenir le plan annoncé malgré les
 * chiffres ; rompre brutalement. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [0, 1],
  [1, 3],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  corbiereAccepte:
    "Un prix de semi proche de celui de Mérindal, et les services payés quand on s'en sert : c'est clair, et c'est honnête. Nous restons chez vous.",
  corbiereRefuse:
    "Payer la livraison fractionnée qu'on avait pour rien ? Nos semis partent chez Mérindal, et le reste avec.",
  corbierePart:
    "Corbière Bâtiment passe ses semis chez Mérindal, et son réassort chez un confrère : 78 k€ de marge par an en moins, en plus des commandes complètes.",
  corbiereReste:
    "Corbière Bâtiment reste client : il fait jouer Mérindal sur quelques semis, mais garde chez nous son réassort et ses services.",
  corbiereRevient:
    "Trois semaines de délai, pas de livraison fractionnée : deux chantiers à l'arrêt. Nous gardons Mérindal pour les semis, mais le réassort et le stock chantier reviennent chez vous, au tarif des services.",
  lancement:
    "Mérindal Pro Direct est ouverte : commandes de semis complets, livrées sur chantier sous trois semaines, payées à trente jours.",
  miseEnDemeure:
    "Mérindal conteste le préavis de trois mois : après vingt-deux ans de relation, ses avocats parlent de rupture brutale.",
  reactionAccord:
    "Notre direction générale souhaite vous rencontrer avant la fin de l'année : elle a une proposition de partage des grands comptes à vous faire.",
  reactionConflit:
    "Au vu de vos choix récents, notre remise de fin d'année passera de 3 % à 1,5 % au 1er janvier, et nos commerciaux renforcent leur présence chez vos grands comptes.",
  reactionExtension:
    "Je vous informe que Mérindal Pro Direct s'ouvrira aux artisans et aux PME au printemps, avec des points de retrait dans la région.",
  accordComplet:
    "Nous signons : partage des quinze premiers grands comptes, commission sur les livraisons de la plateforme, et pas de vente aux artisans pendant trois ans.",
  accordLimite:
    "Nous signons le partage des grands comptes et la commission. Pour le reste, Mérindal garde sa liberté.",
  refusComplet:
    "Nous ne signerons aucun engagement sur les artisans. Puisque vous posez des conditions, notre remise de fin d'année passera à 1,5 %.",
  refus: "Pas d'accord cette année. Notre plateforme poursuit son développement.",
  retourAccepte:
    "Nous prenons acte de votre retour sur le déréférencement, et nous signons. Repartons sur de bonnes bases.",
  assignation:
    "Mérindal nous assigne pour rupture brutale d'une relation commerciale établie. Nos avocats estiment une transaction autour de 250 k€.",
  pasDAssignation:
    "Mérindal ne nous assignera pas : il préfère consacrer son énergie à sa plateforme.",
} as const;
