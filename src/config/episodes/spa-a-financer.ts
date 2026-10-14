/**
 * LE SPA QUI NE SE RENTABILISE PAS SEUL — le contenu de l'épisode.
 *
 * Marceau Dupré est le directeur administratif et financier du Groupe Escale.
 * D'octobre à décembre, pendant la préparation du budget, il instruit pour le
 * conseil de famille le projet de spa de L'Escale Évian (4 étoiles,
 * 66 chambres, au bord du Léman) face aux deux autres usages de l'argent :
 * rénover les chambres, ou rien. Il monte aussi le dossier de financement
 * avec la Banque des Aravis. Six décisions, chacune précédée de ce qu'un DAF
 * de groupe hôtelier reçoit vraiment.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : le compte propre du spa, ce qu'un euro de prix moyen
 * rapporte, la VAN selon l'effet prix, le seuil de prix moyen, les marges des
 * séminaires, le surcoût du crédit-bail, les points bas de trésorerie.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import {
  ACCORD,
  CANNIBALISATION_DOSSIER,
  CREDIT_BAIL,
  ETUDE,
  EXTERIEURS,
  GRAND,
  HORIZON,
  HOTEL,
  PRET,
  RENOVATION,
  SEMINAIRES,
  SPA,
  TAUX,
  TAUX_OCCUPATION,
  TRESORERIE,
  ebePropre,
} from "@/engine/episodes/spa-a-financer";
import { euros, kE, nombre, taux } from "./format";
import type { Contexte, Etape } from "./types";

export const PHILIBERT = { de: "Philibert Chavanne", role: "Président du Groupe Escale" } as const;
export const ALIENOR = { de: "Aliénor Duchosal", role: "Directrice de L'Escale Évian" } as const;
export const LUCILE = {
  de: "Lucile Fabbri",
  role: "Responsable revenue management et distribution",
} as const;
export const CALIXTE = { de: "Calixte Rubellin", role: "Directeur d'Escale Événements" } as const;
export const TAINA = {
  de: "Taïna Cottet",
  role: "Directrice de L'Escale Aix-les-Bains",
} as const;
export const DORIANE = {
  de: "Doriane Marullaz",
  role: "Associée, cabinet Lémanis Études",
} as const;
export const SELIM = {
  de: "Selim Dardel",
  role: "Chargé d'affaires entreprises, Banque des Aravis",
} as const;
export const MAYLIS = { de: "Maylis Quétand", role: "Trésorière du groupe" } as const;

/** Le compte propre du spa, tel que le dossier le présente : amortissement linéaire sur l'horizon. */
export const AMORTISSEMENT_SPA = SPA.investissement / HORIZON;
export const RESULTAT_SPA = ebePropre(SPA) - AMORTISSEMENT_SPA;

/** La projection de la directrice pour le grand spa : du chiffre d'affaires, pas des marges. */
export const PROJECTION_DIRECTEUR = {
  forfait: 230,
  effetPrix: 15,
  spa: GRAND.ca,
  forfaits: GRAND.forfaits * 230,
  seminaires: SEMINAIRES.transferes * SEMINAIRES.caEvian,
  prix: 15 * HOTEL.nuitees,
};
export const CA_DU_DIRECTEUR =
  PROJECTION_DIRECTEUR.spa +
  PROJECTION_DIRECTEUR.forfaits +
  PROJECTION_DIRECTEUR.seminaires +
  PROJECTION_DIRECTEUR.prix;

/** Le prix moyen des chambres multiplié par le taux d'occupation. */
export const REVPAR = HOTEL.prixMoyen * TAUX_OCCUPATION;

/** Les abonnements, et les soins de semaine, tels que la directrice et la revenue manager les chiffrent. */
const AB = EXTERIEURS.abonnements;
export const RECETTES_ABONNEMENTS = AB.nombre * AB.prix;

const pct = (v: number) => taux(v, 0);
const EN_LETTRES = [
  "zéro",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
];
/** Un nombre de chances sur dix, en lettres : « neuf sur dix ». */
const surDix = (p: number) => EN_LETTRES[Math.round(p * 10)]!;
const m = (v: number) => `${nombre(v / 1e6, 2)} M€`;

export const DIAGNOSTICS = [
  {
    id: "differentiel",
    t: "Le spa se juge sur ce qu'il change à tout l'hôtel : prix moyen des chambres, week-ends de basse saison, séminaires, moins ce qui serait venu de toute façon. Ce sont ces flux différentiels, actualisés, qu'il faut comparer à la rénovation",
  },
  {
    id: "prix",
    t: "Tout se joue sur l'effet du spa sur le prix moyen des chambres : c'est lui qu'il faut établir avant de décider",
  },
  {
    id: "deficit",
    t: "Le spa perd de l'argent sur son propre compte d'exploitation : l'argent du groupe doit aller à des chambres rénovées, qui rapportent directement",
  },
  {
    id: "chiffre",
    t: "Le spa fera gagner plus d'un million de chiffre d'affaires à l'hôtel chaque année : il faut le faire, et le faire en grand",
  },
] as const;

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
/** Le nom du projet sur la table, tel que le contexte le dit. */
const nomDuProjet = (ctx: Contexte) =>
  ctx.projet === "grand" ? "le grand spa" : ctx.projet === "spa" ? "le spa" : "la rénovation";

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Trois usages pour le même argent",
    jusqua: 2,
    messages: () => [
      {
        ...PHILIBERT,
        heure: "08:20",
        alerte: true,
        texte:
          "Marceau, le trimestre est celui du budget : octobre à décembre. Le conseil de famille se réunit vendredi prochain pour décider ce qu'on instruit à Évian. Aliénor veut son spa, l'hôtel a besoin de chambres neuves, et une partie de la famille préfère ne rien dépenser cette année. Je veux ta recommandation, chiffrée, puis le dossier pour la Banque des Aravis d'ici décembre.",
      },
      {
        ...ALIENOR,
        heure: "09:05",
        texte: `Avec un spa, et surtout un bassin extérieur, L'Escale Évian joue enfin dans la cour des 4 étoiles du Léman. J'ai chiffré : plus d'un million de chiffre d'affaires en plus chaque année pour l'hôtel. Les Roselières, à Talloires, ont pris 15 € de prix moyen avec le leur.`,
      },
      {
        ...MAYLIS,
        heure: "11:30",
        texte: `Le compte d'exploitation prévisionnel du spa est arrivé : ${kE(-RESULTAT_SPA)} de perte par an, amortissement compris. Je vois mal le conseil voter ${m(SPA.investissement)} pour un service qui perd de l'argent.`,
      },
    ],
    budget: 5,
    sources: [
      {
        id: "compte",
        titre: "Lire le dossier de l'architecte et le compte d'exploitation du spa",
        cout: 1,
        nature: "decisive",
        resultat: `Le spa : bassin intérieur, sauna, hammam, quatre cabines de soins, salle de fitness ; ${m(SPA.investissement)} de travaux de janvier à avril, ouverture fin avril. Son compte d'exploitation prévisionnel, sur une année pleine : ${kE(SPA.ca)} de chiffre d'affaires (soins et boutique ; les clients de l'hôtel y entrent sans payer), ${kE(SPA.charges)} de charges (personnel ${kE(SPA.postes.personnel)}, produits ${kE(SPA.postes.produits)}, énergie et eau ${kE(SPA.postes.energie)}, linge et entretien ${kE(SPA.postes.linge)}), soit un EBE de ${kE(ebePropre(SPA))} ; avec ${kE(AMORTISSEMENT_SPA)} d'amortissement sur douze ans, un résultat de ${kE(RESULTAT_SPA)} par an. Les équipements se renouvellent la sixième année (${kE(SPA.renouvellement)}) ; au bout de douze ans, le bâti du spa vaut encore ${kE(SPA.residuelle)}. La note de la direction financière : flux de trésorerie avant impôt, en fin d'année, sur ${HORIZON} ans, actualisés à ${pct(TAUX)} ; l'investissement se compte en début de projet.`,
      },
      {
        id: "hotel",
        titre: "Extraire de Hostéo les chiffres de l'hôtel",
        cout: 1,
        nature: "decisive",
        resultat: `Douze derniers mois : ${nombre(HOTEL.nuitees, 0)} nuitées vendues sur ${HOTEL.chambres} chambres, soit un taux d'occupation de ${taux(TAUX_OCCUPATION)}, au prix moyen de ${HOTEL.prixMoyen} € (RevPAR : ${nombre(REVPAR, 0)} €). ${pct(HOTEL.partPlateformes)} des nuitées passent par Bookalia et Voyagio, à ${pct(HOTEL.commission)} de commission en moyenne ; la commission s'applique au prix entier, supplément compris. L'hôtel vend déjà ${nombre(HOTEL.weekEndsHabitues, 0)} nuitées par an de « week-ends au bord du lac » à ses habitués, en basse saison. Une nuitée de plus en basse saison laisse ${HOTEL.margeNuitee} € de marge : chambre et dîner à la Table d'Augustin, coûts variables et commissions déduits. Escale Événements attend du spa ${SPA.seminaires.naturels} séminaires résidentiels de plus par an ; chacun laisse ${euros(SEMINAIRES.margeEvian)} de marge à Évian.`,
      },
      {
        id: "comparables",
        titre: "Appeler trois hôtels de lac qui ont ouvert un spa",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Deux ans après l'ouverture de leur spa, leur prix moyen a gagné sur celui de leur marché : 15 € pour Les Roselières à Talloires, 11 € pour un 4 étoiles du lac du Bourget, 6 € seulement pour un hôtel de Sciez. Chez les trois, la moitié environ des forfaits bien-être sont achetés par des clients qui venaient déjà. Aucun ne regarde le compte propre de son spa : tous sont déficitaires.",
      },
      {
        id: "directeur",
        titre: "Reprendre la projection d'Aliénor Duchosal",
        cout: 1,
        nature: "bruit",
        resultat: `Pour le grand spa, avec bassin extérieur : ${kE(PROJECTION_DIRECTEUR.spa)} de chiffre d'affaires du spa, ${nombre(GRAND.forfaits, 0)} nuitées de forfaits bien-être à ${PROJECTION_DIRECTEUR.forfait} € (${kE(PROJECTION_DIRECTEUR.forfaits)}), ${SEMINAIRES.transferes} séminaires transférés d'Aix-les-Bains et de L'Escale Lac à ${euros(SEMINAIRES.caEvian)} (${kE(PROJECTION_DIRECTEUR.seminaires)}), ${PROJECTION_DIRECTEUR.effetPrix} € de prix moyen en plus sur toutes les nuitées (${kE(PROJECTION_DIRECTEUR.prix)}) : ${m(CA_DU_DIRECTEUR)} de chiffre d'affaires de plus par an pour l'hôtel. Le tableau ne montre ni charges, ni commissions, ni investissement.`,
      },
      {
        id: "conseil",
        titre: "Appeler Albéric Dérobert, administrateur indépendant du groupe",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Albéric Dérobert : « Un spa d'hôtel perd presque toujours de l'argent sur son propre compte ; ce n'est pas la question. Pose l'hôtel avec et sans spa, ligne par ligne : prix moyen, nuitées, séminaires, et retire ce qui serait venu de toute façon. C'est ce différentiel que tu actualises, et que tu compares à la rénovation. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que proposez-vous au conseil de famille ?",
    options: [
      {
        t: "Écarter le spa, déficitaire sur son propre compte, et instruire la rénovation des 66 chambres",
        d: `${kE(RENOVATION.investissement)} de travaux, ${kE(RENOVATION.etudes)} d'études ce trimestre. L'effet d'une rénovation sur le prix moyen est connu par celle d'Annecy-Centre.`,
      },
      {
        t: "Instruire le spa sur ce qu'il change à tout l'hôtel, face à la rénovation et au statu quo",
        d: `${m(SPA.investissement)} de travaux, ${kE(SPA.etudes)} d'avant-projet ce trimestre. Ouverture fin avril si le conseil vote en décembre.`,
      },
      {
        t: "Instruire le grand spa de la directrice, avec bassin extérieur, sur sa projection du chiffre d'affaires",
        d: `${m(GRAND.investissement)} de travaux, ${kE(GRAND.etudes)} d'avant-projet ce trimestre. Ouverture fin avril.`,
      },
      {
        t: "Ne rien engager cette année et garder la trésorerie du groupe",
        d: "Rien n'est instruit ; l'argent reste au groupe.",
      },
    ],
    reactions: [
      [
        {
          ...PHILIBERT,
          texte:
            "Le conseil retient la rénovation pour instruction. La famille est rassurée par un projet « qui ne perd pas d'argent » ; Aliénor, elle, ne décolère pas.",
        },
      ],
      [
        {
          ...PHILIBERT,
          texte:
            "Le conseil te demande d'instruire le spa, l'hôtel avec et sans spa à l'appui. Il votera en décembre. Certains attendent encore qu'on leur explique pourquoi on investirait dans une activité déficitaire.",
        },
      ],
      [
        {
          ...ALIENOR,
          texte:
            "Merci, Marceau ! Le bassin extérieur, c'est ce qui fera la différence sur Bookalia. L'architecte attaque l'avant-projet lundi.",
        },
      ],
      [
        {
          ...PHILIBERT,
          texte:
            "Le conseil prend acte : pas de projet à Évian cette année. Aliénor a pris la nouvelle très mal, et l'a dit.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Combien vaut un spa sur le prix d'une chambre ?",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...DORIANE,
        heure: "10:00",
        alerte: true,
        texte: `Monsieur Dupré, nous avons étudié quatorze hôtels de lac qui ont ouvert un spa. Pour ${euros(ETUDE.prix)}, nous vous disons en semaine ${ETUDE.semaine} de combien le vôtre relèvera votre prix moyen, à 1 € près : panel des comparables, enquête auprès de six cents de vos clients, effet par segment.`,
      },
      {
        ...LUCILE,
        heure: "11:40",
        texte:
          "Je peux te sortir une estimation d'ici la semaine 6, sans rien payer : les prix des comparables sur Bookalia et Voyagio, avant et après leur spa. Elle sera moins précise, à 3 ou 4 € près.",
      },
      ctx.spaInstruit
        ? {
            ...ALIENOR,
            heure: "14:15",
            texte:
              "Une étude ? Les Roselières ont pris 15 € de prix moyen, tout le monde le sait. On perd du temps et de l'argent.",
          }
        : {
            ...ALIENOR,
            heure: "14:15",
            texte:
              "Une étude sur un spa qu'on ne fera pas ? Le conseil veut peut-être se rassurer. Moi, je sais ce que j'aurais fait.",
          },
    ],
    reevaluation: true,
    sources: [
      {
        id: "valeur",
        titre: "Chiffrer le projet selon l'effet du spa sur le prix moyen",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.spaInstruit
            ? `Au dossier (la moitié des forfaits vendus à des habitués, ni plan séminaires ni clients extérieurs), ${nomDuProjet(ctx)} crée ${ctx.vanFaible} de VAN si son effet sur le prix moyen est faible (5 €), ${ctx.vanMoyen} s'il est moyen (10 €), ${ctx.vanFort} s'il est fort (14 €). La rénovation crée ${ctx.vanRenovation}, à peu près sûrement : Annecy-Centre a gagné 8 € de prix moyen après la sienne. Sur les quatorze hôtels du panel du cabinet, environ trois sur dix ont déçu, un sur quatre a dépassé les attentes, les autres ont pris autour de 10 €. En dessous de ${ctx.pivot} d'effet, la rénovation vaut mieux que ${nomDuProjet(ctx)}.`
            : ctx.projet === "renovation"
              ? `Vous avez écarté le spa. La rénovation crée ${ctx.vanRenovation} de VAN, à peu près sûrement : Annecy-Centre a gagné 8 € de prix moyen après la sienne. L'étude du cabinet ne porterait que sur le spa.`
              : "Rien n'est instruit : il n'y a pas de projet à chiffrer.",
      },
      {
        id: "etudes",
        titre: "Comparer l'étude du cabinet et l'estimation du revenue management",
        cout: 0.5,
        nature: "utile",
        resultat: `L'étude : ${euros(ETUDE.prix)}, résultat en semaine ${ETUDE.semaine}, à 1 € près. L'estimation de Lucile Fabbri : gratuite, en semaine 6, à 3 ou 4 € près ; elle peut se tromper de scénario. Le conseil de famille vote en semaine 11. La Banque des Aravis accorde ${surDix(ACCORD.etude)} prêts sur dix aux projets de spa appuyés sur une étude de marché, ${surDix(ACCORD.aucune)} sur dix sans.`,
      },
    ],
    question: "Comment établissez-vous l'effet du spa sur le prix moyen ?",
    options: [
      {
        t: "Commander l'étude du cabinet",
        d: `${euros(ETUDE.prix)}, résultat en semaine ${ETUDE.semaine}, avant le conseil de décembre.`,
      },
      {
        t: "Demander une estimation au revenue management du siège",
        d: "Gratuite, résultat en semaine 6, à 3 ou 4 € près.",
      },
      {
        t: "S'en tenir aux comparables du dossier et à l'expérience de la directrice",
        d: "Rien à payer, rien à attendre.",
      },
    ],
    reactions: [
      [
        {
          ...DORIANE,
          texte: "Lettre de mission signée. L'enquête auprès de vos clients part lundi.",
        },
      ],
      [{ ...LUCILE, texte: "Je m'y mets. Tu auras mes chiffres en semaine 6." }],
      [{ ...ALIENOR, texte: "Enfin ! On avance." }],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Les séminaires d'Évian",
    jusqua: 6,
    messages: (ctx) => [
      ctx.projet
        ? {
            ...CALIXTE,
            heure: "09:30",
            alerte: true,
            texte: `Marceau, avec ${ctx.projet === "renovation" ? "des chambres neuves" : "le spa"}, je peux remplir Évian en semaine : je lui transfère vingt séminaires résidentiels qu'on fait aujourd'hui à Aix-les-Bains et à L'Escale Lac. Ça fait ${kE(PROJECTION_DIRECTEUR.seminaires)} de chiffre d'affaires de plus pour Évian, à mettre dans ton dossier.`,
          }
        : {
            ...CALIXTE,
            heure: "09:30",
            alerte: true,
            texte:
              "Marceau, rien de prévu à Évian cette année ? Je voulais y transférer des séminaires d'Aix, ou recruter quelqu'un pour la Suisse. Ça attendra.",
          },
      {
        ...TAINA,
        heure: "10:15",
        texte:
          "Si Calixte m'enlève mes séminaires, mes semaines de novembre et de mars se vident. Mes clients viennent chez nous pour le prix d'un 3 étoiles et pour les thermes, pas pour le Léman.",
      },
      {
        ...CALIXTE,
        heure: "16:40",
        texte: `L'autre piste : un commercial à mi-temps pour les entreprises de Genève et de Lausanne. ${kE(SEMINAIRES.commercial)} par an, charges comprises. Escale Événements n'a personne sur la Suisse.`,
      },
    ],
    sources: [
      {
        id: "groupe",
        titre: "Compter ce que chaque plan rapporte au groupe, pas seulement à Évian",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Un séminaire résidentiel laisse ${euros(SEMINAIRES.margeEvian)} de marge à Évian, ${euros(SEMINAIRES.margeAix)} à Aix-les-Bains. En transférer ${SEMINAIRES.transferes} fait gagner ${kE(SEMINAIRES.transferes * SEMINAIRES.margeEvian)} de marge à Évian et en fait perdre ${kE(SEMINAIRES.transferes * SEMINAIRES.margeAix)} à Aix, dont les chambres de semaine resteront vides. En 2022, quand L'Escale Lac a repris des séminaires d'Aix, ${surDix(SEMINAIRES.refusDossier)} clients sur dix sont partis à la concurrence plutôt que de payer le tarif d'un 4 étoiles. Le commercial coûte ${kE(SEMINAIRES.commercial)} par an et ${kE(SEMINAIRES.recrutement)} de recrutement ; Escale Événements en attend, en semaine de basse saison, ${SPA.seminaires.commercial} séminaires nouveaux par an à Évian si le spa se fait, ${RENOVATION.seminaires.commercial} si seules les chambres sont rénovées.${
            ctx.projet ? "" : " Rien n'est instruit à Évian : aucun plan ne servirait."
          }`,
      },
      {
        id: "refus",
        titre: "Relire les demandes de séminaires qu'Évian a déclinées",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Sur douze mois, Escale Événements a décliné quatorze demandes de séminaires résidentiels pour Évian : neuf venaient d'entreprises suisses qui voulaient un spa, cinq tombaient sur des week-ends de mariage. Aucune n'a été relancée : personne ne suit la Suisse.",
      },
    ],
    question: "Quel plan séminaires inscrivez-vous au dossier ?",
    options: [
      {
        t: "Transférer à Évian vingt séminaires d'Aix-les-Bains et de L'Escale Lac",
        d: `Rien à recruter ; ${kE(PROJECTION_DIRECTEUR.seminaires)} de chiffre d'affaires de plus à Évian.`,
      },
      {
        t: "Recruter un commercial à mi-temps pour les entreprises de Genève et de Lausanne",
        d: `${kE(SEMINAIRES.commercial)} par an, ${kE(SEMINAIRES.recrutement)} de recrutement. Des séminaires nouveaux, en semaine de basse saison.`,
      },
      {
        t: "Ne rien changer : laisser le projet attirer seul ses séminaires",
        d: "Rien à payer.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...CALIXTE,
          texte:
            "Je lance le recrutement : une annonce à Genève, une à Lausanne. Je te présente les candidats en semaine 6.",
        },
      ],
      [{ ...CALIXTE, texte: "Bien. On verra ce que le projet amène tout seul." }],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Un spa « à l'équilibre »",
    jusqua: 8,
    messages: (ctx) =>
      ctx.spaInstruit
        ? [
            {
              ...PHILIBERT,
              heure: "08:45",
              alerte: true,
              texte: `Marceau, plusieurs membres de la famille me le disent : ils ne voteront pas un spa qui perd ${kE(-RESULTAT_SPA)} par an. Aliénor propose de vendre des abonnements aux habitants. Trouve-moi un spa à l'équilibre.`,
            },
            {
              ...ALIENOR,
              heure: "10:00",
              texte: `${AB.nombre} abonnements à ${AB.prix} € par an pour les habitants d'Évian, de Thonon et de Genève : ${kE(RECETTES_ABONNEMENTS)} de recettes, et le compte du spa passe dans le vert. À Thonon, le centre aquatique a une liste d'attente.`,
            },
            {
              ...LUCILE,
              heure: "11:20",
              texte: `Attention aux week-ends : nos clients paient ${HOTEL.prixMoyen} € la nuit pour le calme d'un 4 étoiles, et ce sont eux qui lisent les avis sur Bookalia.`,
            },
          ]
        : [
            {
              ...ALIENOR,
              heure: "10:00",
              alerte: true,
              texte:
                "Pas de spa à l'ordre du jour, je sais. Mais si un jour on le fait, je vendrai des abonnements aux habitants : à Thonon, le centre aquatique a une liste d'attente.",
            },
          ],
    sources: [
      {
        id: "clients",
        titre: "Lire ce qu'ont vécu les hôtels qui ont ouvert leur spa aux habitants",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Dans les hôtels du panel qui vendent des abonnements, les avis parlent d'un spa « bondé » le week-end : l'effet du spa sur le prix moyen y est inférieur de 30 à 60 % (${pct(AB.geneDossier)} en moyenne), et les forfaits bien-être s'y vendent ${pct(AB.pertesForfaits)} de moins. Ceux qui n'ouvrent aux extérieurs que les soins en semaine, hors vacances scolaires, n'ont presque rien perdu (${pct(EXTERIEURS.semaine.gene)} de l'effet). Les abonnements : ${kE(RECETTES_ABONNEMENTS)} de recettes, ${kE(AB.charges)} de charges (accueil, linge, énergie). Les soins de semaine : ${kE(EXTERIEURS.semaine.ca)} de recettes, ${kE(EXTERIEURS.semaine.charges)} de charges.${
            ctx.spaInstruit
              ? ` Avec l'effet prix du dossier, les abonnements coûteraient ${ctx.pertePrix} par an sur le prix des chambres et ${ctx.perteForfaits} sur les forfaits.`
              : ""
          }`,
      },
      {
        id: "thonon",
        titre: "Appeler le centre aquatique de Thonon",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Quatre cents personnes attendent un abonnement, surtout pour le samedi et le dimanche matin. Les deux cent cinquante abonnements se vendraient en un mois ; les abonnés viendraient d'abord le week-end, comme les clients de l'hôtel.",
      },
    ],
    question: "Que décidez-vous pour les clients extérieurs au spa ?",
    options: [
      {
        t: `Vendre ${AB.nombre} abonnements annuels aux habitants pour équilibrer le compte du spa`,
        d: `${kE(RECETTES_ABONNEMENTS)} de recettes par an, ${kE(AB.charges)} de charges : l'EBE du spa passe de ${kE(ebePropre(SPA))} à ${kE(ebePropre(SPA) + RECETTES_ABONNEMENTS - AB.charges)}.`,
      },
      {
        t: "Ouvrir aux extérieurs les soins en semaine, hors vacances, et garder le spa aux clients de l'hôtel le week-end et l'été",
        d: `${kE(EXTERIEURS.semaine.ca)} de recettes et ${kE(EXTERIEURS.semaine.charges)} de charges par an.`,
      },
      {
        t: "Réserver le spa aux clients de l'hôtel et des séminaires",
        d: `Ni recettes ni charges de plus : l'EBE du spa reste à ${kE(ebePropre(SPA))}.`,
      },
    ],
    reactions: [
      [
        {
          ...ALIENOR,
          texte:
            "Parfait. Les abonnements partiront dès l'ouverture, et le conseil aura son spa à l'équilibre.",
        },
      ],
      [
        {
          ...LUCILE,
          texte:
            "Bon compromis : les soins de semaine remplissent les cabines quand l'hôtel est calme, et le week-end reste à nos clients.",
        },
      ],
      [{ ...ALIENOR, texte: "Dommage pour les recettes. Le compte du spa restera dans le rouge." }],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Le dossier du conseil de famille",
    jusqua: 11,
    messages: (ctx) => [
      {
        ...PHILIBERT,
        heure: "09:00",
        alerte: true,
        texte:
          "Le conseil de famille vote dans trois semaines. Je veux le dossier définitif en début de semaine prochaine : quel projet, quelle valeur, et pourquoi.",
      },
      ...(ctx.spaInstruit
        ? [
            {
              ...ALIENOR,
              heure: "10:30",
              texte: `Les pré-ventes de forfaits bien-être marchent du tonnerre : ${ctx.preVentes} nuitées vendues en trois semaines à notre fichier clients. Ne touche plus au dossier !`,
            },
            ctx.source === "etude"
              ? {
                  ...DORIANE,
                  heure: "14:00",
                  texte: `Notre étude est dans votre boîte : le spa relèverait votre prix moyen de ${ctx.effet}.`,
                }
              : ctx.source === "revenue"
                ? {
                    ...LUCILE,
                    heure: "14:00",
                    texte: `Mon estimation, d'après les comparables : ${ctx.effet} de prix moyen, à 3 ou 4 € près.`,
                  }
                : {
                    ...ALIENOR,
                    heure: "14:00",
                    texte:
                      "Pas besoin d'étude : Les Roselières ont pris 15 €, nous ferons au moins autant.",
                  },
          ]
        : []),
    ],
    sources: [
      {
        id: "chiffres",
        titre: "Recalculer le projet avec les chiffres du trimestre",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.spaInstruit
            ? `Effet sur le prix moyen retenu : ${ctx.effet} (${ctx.sourceTexte}). Les pré-ventes croisées avec le fichier clients de Hostéo : ${ctx.cannibalisation} des nuitées vendues l'ont été à des clients qui avaient déjà séjourné en basse saison, contre ${pct(CANNIBALISATION_DOSSIER)} au dossier. Avec ces chiffres et vos plans, ${nomDuProjet(ctx)} crée ${ctx.vanInstruit} de VAN, la rénovation ${ctx.vanRenovationActuelle}. ${majuscule(nomDuProjet(ctx))} vaut la rénovation à partir de ${ctx.pivotActuel} d'effet.`
            : ctx.projet === "renovation"
              ? `La rénovation crée ${ctx.vanInstruit} de VAN avec vos plans. Le spa, écarté en octobre, n'a pas d'avant-projet : il ne peut plus être présenté cette année.`
              : "Rien n'est instruit : il n'y a pas de dossier à présenter.",
      },
      {
        id: "observatoire",
        titre: "Demander à l'Observatoire du tourisme quand il publie",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le bilan annuel des 4 étoiles du Léman, avec l'effet mesuré des spas sur le prix moyen, sort mi-décembre, quelques jours après le conseil. Un vote reporté à mars le prendrait en compte ; mais les travaux ne pourraient plus se faire cet hiver, et l'ouverture glisserait d'un an.",
      },
    ],
    question: "Que présentez-vous au conseil de famille ?",
    options: [
      {
        t: "Le dossier d'octobre, tel quel : on ne rouvre pas un dossier à trois semaines du vote",
        d: "Le projet instruit depuis octobre, sans changement.",
      },
      {
        t: "Ce que les chiffres du trimestre désignent : le spa s'il bat la rénovation, la rénovation sinon",
        d: `Le dossier est repris avec l'effet prix et les pré-ventes ; ${kE(RENOVATION.etudes)} d'études si la rénovation l'emporte.`,
      },
      {
        t: "Demander au conseil de reporter son vote à mars, après le bilan de l'Observatoire",
        d: "Le conseil votera en sachant ; les travaux glissent d'un an.",
      },
    ],
    reactions: [
      [
        {
          ...PHILIBERT,
          texte: "Entendu. Le dossier d'octobre part tel quel aux membres du conseil.",
        },
      ],
      [
        {
          ...PHILIBERT,
          texte:
            "Entendu. Envoie-moi le dossier repris : les membres du conseil l'auront une semaine avant le vote.",
        },
      ],
      [
        {
          ...PHILIBERT,
          texte:
            "Je proposerai le report. La famille n'aime pas attendre, mais elle aime encore moins se tromper.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Le financement",
    jusqua: 13,
    messages: (ctx) =>
      ctx.projet
        ? [
            {
              ...SELIM,
              heure: "10:00",
              alerte: true,
              texte: `Monsieur Dupré, notre comité de crédit se réunit le 18 décembre. Je peux lui présenter un prêt de ${ctx.montantPret} sur douze ans à ${taux(PRET.taux)}, soit ${pct(PRET.quotite)} du projet. Il me faut votre réponse cette semaine.`,
            },
            {
              ...MAYLIS,
              heure: "11:45",
              texte: `Autre possibilité : le crédit-bail que nous propose Lémabail, ${pct(1)} du projet, ${ctx.loyer} de loyers par an pendant douze ans. Et le groupe peut aussi payer comptant : pas d'intérêts.`,
            },
            ...(ctx.projet !== "renovation"
              ? [
                  {
                    ...ALIENOR,
                    heure: "15:30",
                    texte:
                      "Avec le crédit-bail, les loyers sont couverts par ce que le spa rapporte dès la première année : il se paie tout seul ! Mets-le en première page du dossier.",
                  },
                ]
              : []),
          ]
        : [
            {
              ...MAYLIS,
              heure: "11:45",
              alerte: true,
              texte:
                "Rien à financer à Évian cette année. Je garde la trésorerie pour l'hiver de Megève.",
            },
          ],
    sources: [
      {
        id: "financements",
        titre: "Comparer les trois financements au taux de l'emprunt",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.projet
            ? `La VAN ${ctx.nomAdopteDe}, ${ctx.van}, ne dépend pas de son financement. Le prêt : ${ctx.montantPret} à ${taux(PRET.taux)} sur douze ans, ${ctx.annuitePret} par an, ${ctx.frais} de frais de dossier, ${ctx.apport} d'apport. Le crédit-bail : ${ctx.loyer} par an pendant douze ans, au taux de ${taux(CREDIT_BAIL.taux)} ; actualisés au taux de l'emprunt, ses loyers coûtent ${ctx.surcoutCB} de plus que le prix du projet. Point bas de trésorerie du groupe en mars, si l'hiver est normal : ${ctx.basEmprunt} avec le prêt, ${ctx.basCB} avec le crédit-bail, ${ctx.basComptant} en payant comptant, pour un seuil de sécurité de ${kE(TRESORERIE.seuil)}.`
            : "Rien n'est adopté : rien à financer.",
      },
      {
        id: "megeve",
        titre: "Demander à Maylis Quétand l'état des réservations de Megève et l'avis de la banque",
        cout: 0.5,
        nature: "utile",
        resultat: `Un hiver sur trois environ, Megève démarre mal et le point bas de mars perd ${kE(TRESORERIE.hiver)} de plus. Sous ${kE(TRESORERIE.seuil)}, le groupe tire sa ligne de crise : ${kE(TRESORERIE.coutFixe)} de commissions et d'escomptes perdus, et ${pct(TRESORERIE.tauxCrise)} sur ce qui manque. Selim Dardel : « Nos comités accordent ${surDix(ACCORD.etude)} prêts sur dix aux spas appuyés sur une étude de marché, ${surDix(ACCORD.revenue)} sur dix avec une estimation interne sérieuse, ${surDix(ACCORD.aucune)} sur dix sans. Une rénovation de chambres passe presque toujours. Après un refus, c'est une autre banque, plus chère. »`,
      },
    ],
    question: "Comment financez-vous le projet ?",
    options: [
      {
        t: `Emprunter ${pct(PRET.quotite)} à la Banque des Aravis, sur douze ans`,
        d: `${taux(PRET.taux)}, ${taux(PRET.frais)} de frais de dossier ; ${pct(1 - PRET.quotite)} d'apport pris sur la trésorerie du groupe. Réponse du comité le 18 décembre.`,
      },
      {
        t: "Prendre le crédit-bail : tout est financé, et les loyers sont couverts par les flux du projet",
        d: "Douze ans de loyers ; rien ne sort de la trésorerie du groupe.",
      },
      {
        t: "Payer comptant sur la trésorerie du groupe : pas d'intérêts",
        d: `Ni frais, ni loyers. ${pct(TRESORERIE.avantMars)} des travaux payés avant mars.`,
      },
    ],
    reactions: [
      [
        {
          ...SELIM,
          texte: "Je présente le dossier au comité du 18 décembre. Je vous appelle le soir même.",
        },
      ],
      [
        {
          ...MAYLIS,
          texte:
            "Je signe avec Lémabail. Les premiers loyers tomberont à la livraison du chantier.",
        },
      ],
      [
        {
          ...MAYLIS,
          texte: "Entendu. Je prévois les décaissements des travaux sur la trésorerie du groupe.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Tout l'hôtel, avec et sans projet", chemin: [1, 0, 1, 1, 1, 0] },
  { nom: "Le compte propre du spa", chemin: [0, 2, 0, 0, 0, 1] },
  { nom: "Attentiste", chemin: [3, 2, 2, 2, 0, 2] },
] as const;

/**
 * Les réflexes du métier devant un investissement hôtelier : juger le spa sur
 * son propre compte, ou l'accepter sur le chiffre d'affaires global de
 * l'hôtel ; décider sans établir l'effet prix ; compter des séminaires qui
 * existent déjà ; équilibrer le compte du spa aux dépens de l'hôtel ; ne pas
 * rouvrir le dossier ; croire qu'un financement rend un projet rentable.
 * [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 2],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 1],
] as const;

export const REPONSES = {
  transfert: (refus: number) =>
    `J'ai appelé mes vingt clients : ${EN_LETTRES[refus] ?? refus} refusent d'aller à Évian, trop cher pour eux ; ils iront chez un concurrent du lac du Bourget. Les autres suivront, sans enthousiasme.`,
  accord:
    "Le comité de crédit a accordé le prêt, aux conditions prévues. Les fonds seront disponibles au premier appel de l'entreprise.",
  refus:
    "Le comité de crédit a refusé le prêt : il juge l'effet du projet sur le prix moyen trop peu établi. Une autre banque prend le dossier, à 0,6 point de plus, et il faut tout reprendre.",
  observatoire: {
    faible:
      "L'Observatoire du tourisme publie son bilan des 4 étoiles du Léman : chez ceux qui ont ouvert un spa depuis trois ans, le prix moyen n'a gagné que 5 € de plus qu'ailleurs. L'effet est faible.",
    moyen:
      "L'Observatoire du tourisme publie son bilan des 4 étoiles du Léman : chez ceux qui ont ouvert un spa depuis trois ans, le prix moyen a gagné 10 € de plus qu'ailleurs.",
    fort: "L'Observatoire du tourisme publie son bilan des 4 étoiles du Léman : chez ceux qui ont ouvert un spa depuis trois ans, le prix moyen a gagné 14 € de plus qu'ailleurs. L'effet est fort.",
  },
} as const;
