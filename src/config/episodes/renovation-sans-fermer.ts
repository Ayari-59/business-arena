/**
 * LA RÉNOVATION SANS FERMER — le contenu de l'épisode.
 *
 * Ana Sousa dirige L'Escale Chambéry-Gare, l'hôtel d'affaires du Groupe
 * Escale : 72 chambres sur quatre étages, à deux pas de la gare, plein du
 * lundi au jeudi de septembre à juin. Le conseil a voté la rénovation des
 * trois premiers étages (54 chambres) ; tout doit être fini pour la rentrée.
 * Le trimestre va de juin à août. Six décisions, chacune précédée de ce
 * qu'une directrice d'hôtel reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que la
 * joueuse ne voit pas : c'est le bilan qui la lit. Les chiffres qu'elles
 * donnent sont calculés depuis les constantes du modèle.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";
import { euros, kE, nombre, taux } from "./format";
import {
  CHAMBRES,
  CIMALP,
  ETAGE,
  GESTES,
  OCCUPATION,
  ORMEA,
  PART_AFFAIRES,
  PERTE_CIMALP,
  PHASAGES,
  PRIX,
  PROFILS,
  RATTRAPAGE,
  REMISE_VOISINES,
  REMISE_CIMALP,
  SCENARIOS,
  SUIVI,
  TARIF,
  nuitsPerdues,
  type Mois,
} from "@/engine/episodes/renovation-sans-fermer";

export const DIAGNOSTICS = [
  {
    id: "nuisances",
    t: "Le chantier coûtera surtout par ses nuisances sur les clients présents, d'abord les clients d'affaires : il faut le regrouper dans le creux et isoler les clients, quitte à fermer des chambres",
  },
  {
    id: "delai",
    t: "Le vrai risque est que le chantier déborde sur la rentrée : tout doit être organisé pour tenir la date de l'entreprise",
  },
  {
    id: "chambres",
    t: "Chaque chambre fermée est une nuit perdue pour toujours : il faut garder le plus de chambres possible à la vente pendant les travaux",
  },
  {
    id: "prix",
    t: "Un hôtel en travaux fait fuir les clients : il faut baisser les prix pendant le chantier pour tenir le taux d'occupation",
  },
] as const;

const NOMS_DES_MOIS: Record<Mois, string> = {
  juin: "juin",
  juillet: "juillet",
  aout: "août",
  septembre: "septembre",
};

/** Le profil d'un mois, tel que la revenue manager l'écrit. */
const profil = (m: Mois) =>
  `${NOMS_DES_MOIS[m]} : ${PROFILS[m].join(", ")}, à ${euros(PRIX[m])} de prix moyen`;

/** Ce que fermer un étage une semaine de juin fait perdre : les nuits où l'hôtel aurait été plein. */
export const PERTE_ETAGE_JUIN = {
  nuits: nuitsPerdues("juin", CHAMBRES - ETAGE),
  euros: nuitsPerdues("juin", CHAMBRES - ETAGE) * PRIX.juin,
};

/** Une semaine de septembre avec quinze chambres encore en chantier. */
export const SEPTEMBRE_QUINZE = {
  nuits: nuitsPerdues("septembre", CHAMBRES - 15),
  euros: nuitsPerdues("septembre", CHAMBRES - 15) * PRIX.septembre,
};

export const ROLES = {
  aymar: {
    de: "Aymar Mollaret",
    role: "Directeur des opérations, Groupe Escale",
  },
  brice: { de: "Brice Tchamba", role: "Conducteur de travaux, Mérandaz Second Œuvre" },
  ilias: { de: "Ilias Benchekroun", role: "Chef de réception" },
  rosalba: { de: "Rosalba Mendoza", role: "Gouvernante générale" },
  lucile: { de: "Lucile Fabbri", role: "Revenue manager du groupe, siège d'Annecy" },
  yse: { de: "Ysé Durafour", role: "Responsable des déplacements, Cimalp Ingénierie" },
} as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Trois étages à refaire avant la rentrée",
    jusqua: 2,
    messages: () => [
      {
        ...ROLES.aymar,
        heure: "08:15",
        alerte: true,
        texte:
          "Ana, le conseil a voté la rénovation des étages 1 à 3 : 54 chambres, salles de bains, sols, literie. Tout doit être fini pour la rentrée du 31 août, nos comptes d'affaires reviennent ce jour-là. Le trimestre de juin à août est à toi : envoie-moi ton phasage vendredi.",
      },
      {
        ...ROLES.brice,
        heure: "09:30",
        texte:
          "Madame Sousa, notre proposition : on garde votre hôtel ouvert et on rénove étage par étage, par lots de six chambres, de juin à fin août. Vous ne perdez presque aucune nuit. Une équipe, douze semaines, on démarre lundi prochain si vous signez.",
      },
      {
        ...ROLES.ilias,
        heure: "10:05",
        texte:
          "Juin est plein du lundi au jeudi. Si on ferme quoi que ce soit avant juillet, je refuse du monde tous les soirs.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "previsions",
        titre: "Lire les prévisions de réservations nuit par nuit, de juin à septembre",
        cout: 1,
        nature: "decisive",
        resultat: `Lucile a sorti de Hostéo les chambres demandées pour une semaine-type, du dimanche au samedi, toutes chambres ouvertes : ${profil("juin")} ; ${profil("juillet")} ; ${profil("aout")} ; ${profil("septembre")}. Une chambre fermée ne fait perdre une nuit que le soir où l'hôtel aurait été plein : fermer un étage une semaine de juin coûte ${PERTE_ETAGE_JUIN.nuits} nuits, ${kE(PERTE_ETAGE_JUIN.euros)}. Pour juillet et août, il donne une chance sur quatre d'un été fort (+${taux(SCENARIOS[0].facteur - 1, 0)} de touristes et de groupes), une sur deux d'un été comme l'an dernier, une sur quatre d'un été creux (−${taux(1 - SCENARIOS[2].facteur, 0)}).`,
      },
      {
        id: "chantier",
        titre: "Revoir avec Brice Tchamba les cadences et les retards de ses derniers chantiers",
        cout: 1,
        nature: "decisive",
        resultat: `Sur un étage fermé, une équipe rénove six chambres par semaine ; en site occupé, quatre et demie, entre les protections à refaire, le mobilier à déplacer et les arrêts à chaque plainte. Sur ses trois derniers hôtels rénovés en site occupé, Mérandaz a fini avec une à trois semaines de retard ; sur étages fermés, entre zéro et une semaine et demie le plus souvent. Les lots coûtent ${kE(PHASAGES[0]!.surcout)} de protections et de déménagements ; deux équipes en août, ${kE(PHASAGES[2]!.surcout)} de prime d'été ; trois pour fermer l'hôtel, ${kE(PHASAGES[3]!.surcout)}.`,
      },
      {
        id: "avis",
        titre: "Lire les avis laissés pendant d'autres rénovations en site occupé",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Sur les plateformes, les clients logés au-dessus, au-dessous ou à côté d'un chantier notent en moyenne plus d'un point de moins que les autres ; ceux qu'on a prévenus à la réservation, trois fois moins. Les clients d'affaires sont les plus sévères : ils sont là à 7 heures et le soir, et beaucoup travaillent dans leur chambre. Les touristes d'été sont sortis de 9 heures à 18 heures.",
      },
      {
        id: "ormea-prix",
        titre: "Relever les prix de l'Orméa Hotels de la gare",
        cout: 1,
        nature: "bruit",
        resultat:
          "L'Orméa Hotels, 110 chambres de l'autre côté du parvis, vend 104 € la nuit en semaine et 79 € le week-end, petit-déjeuner compris. Ses prix bougent peu en été.",
      },
      {
        id: "conseil",
        titre: "Appeler Hermine Collomb, ancienne directrice d'un hôtel lyonnais rénové ouvert",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Hermine : « Ne comptez pas seulement les chambres que vous fermez : comptez les clients que vous logez à côté du chantier, et ce qu'ils vous coûteront. Et cherchez les semaines où l'hôtel est à moitié vide. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Quel phasage envoyez-vous au siège ?",
    options: [
      {
        t: "Garder tout l'hôtel ouvert : rénover étage par étage, par lots de six chambres, de juin à fin août",
        d: `Le planning de l'entreprise : une équipe, six chambres hors service à la fois, fin prévue en semaine 13. ${kE(PHASAGES[0]!.surcout)} de protections et de déménagements.`,
      },
      {
        t: "Fermer un étage à la fois, de la semaine 2 à la semaine 10",
        d: `Une équipe, trois semaines par étage : ${ETAGE} chambres hors vente pendant neuf semaines, juin compris. Fin prévue en semaine 10. ${kE(PHASAGES[1]!.surcout)} de protections.`,
      },
      {
        t: "Rien en juin ; fermer le 3e étage de mi-juillet au 2 août, puis le 1er et le 2e ensemble en août",
        d: `${ETAGE} chambres hors vente en juillet, ${2 * ETAGE} en août, deux équipes en août. Fin prévue en semaine 12. ${kE(PHASAGES[2]!.surcout)} de prime d'été.`,
      },
      {
        t: "Fermer l'hôtel trois semaines en août et tout faire d'un coup",
        d: `Trois équipes du 3 au 23 août, les ${CHAMBRES} chambres fermées. Fin prévue en semaine 12. ${kE(PHASAGES[3]!.surcout)} de surcoût.`,
      },
    ],
    reactions: [
      [
        {
          ...ROLES.brice,
          texte:
            "Parfait. On attaque lundi au 1er étage, six chambres à la fois. On fera au plus propre.",
        },
      ],
      [
        {
          ...ROLES.ilias,
          texte: "Le 1er étage ferme lundi. J'ai déjà dû refuser deux entreprises pour mardi soir.",
        },
      ],
      [
        {
          ...ROLES.brice,
          texte:
            "Entendu : on prépare tout en juin, les commandes partent cette semaine, et on attaque le 3e étage le 13 juillet. Je bloque deux équipes pour août.",
        },
      ],
      [
        {
          ...ROLES.aymar,
          texte:
            "Fermer trois semaines en août… Je te suis si les chiffres tiennent. Préviens les équipes : congés posés pendant la fermeture.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Que dire aux clients ?",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...ROLES.lucile,
        heure: "09:40",
        alerte: true,
        texte:
          "Ana, les fiches de L'Escale Chambéry-Gare sur Bookalia et Voyagio ne disent rien des travaux, et nos confirmations non plus. Je mets quoi, et à partir de quand ?",
      },
      ctx.travauxEnJuin
        ? {
            ...ROLES.ilias,
            heure: "18:30",
            texte: `Première semaine de chantier : ${ctx.plaintes} clients sont venus se plaindre à la réception. Un ingénieur de Cimalp a demandé à changer de chambre à 7 heures.`,
          }
        : {
            ...ROLES.ilias,
            heure: "18:30",
            texte:
              "Des comptes d'affaires demandent déjà si les travaux vont les gêner cet été. Je ne sais pas quoi leur répondre.",
          },
    ],
    reevaluation: true,
    sources: [
      {
        id: "cimalp",
        titre: "Relire le contrat de Cimalp Ingénierie, votre premier compte",
        cout: 0.5,
        nature: "decisive",
        resultat: `Les ingénieurs de Cimalp suivent les chantiers ferroviaires de la Maurienne : du lundi au jeudi, une douzaine de nuits par semaine en juin, ${CIMALP.parSemaine.juillet} en juillet, ${CIMALP.parSemaine.aout} en août. Le contrat d'automne, ${CIMALP.nuitees} nuitées de septembre à décembre à ${euros(CIMALP.prix)}, se renouvelle fin septembre. S'il partait, l'hôtel ne revendrait qu'environ ${taux(CIMALP.revente, 0)} de ces nuits : ${kE(PERTE_CIMALP)} de chiffre d'affaires perdu.`,
      },
      {
        id: "plateformes",
        titre: "Lire ce que Bookalia et Voyagio exigent quand un hôtel a des travaux",
        cout: 0.5,
        nature: "utile",
        resultat: `Les deux plateformes demandent de signaler tout chantier qui peut gêner le séjour. Un client qui découvre un chantier non signalé peut exiger d'être relogé aux frais de l'hôtel : environ ${euros(GESTES.delogement)} la nuit, différence de prix et taxi compris.`,
      },
    ],
    question: "Que dites-vous aux clients et aux comptes d'affaires ?",
    options: [
      {
        t: "Ne rien annoncer : la réception gère les plaintes au cas par cas",
        d: "Rien ne change sur les fiches ni dans les confirmations. On rembourse quand un client se plaint.",
      },
      {
        t: "Annoncer le chantier partout, prévoir un geste pour chaque chambre exposée, et appeler les comptes d'affaires",
        d: `Dates et étages sur les fiches et dans les confirmations, le petit-déjeuner offert aux chambres voisines du chantier (${euros(GESTES.petitDejeuner)} de coût de revient), un appel à chaque compte.`,
      },
      {
        t: "Annoncer le chantier sur les fiches et dans les confirmations, et rembourser à la plainte",
        d: "Dates et étages affichés. La réception rembourse quand un client se plaint.",
      },
      {
        t: "Baisser tous les prix de 10 % pendant le chantier, sans rien annoncer",
        d: "Le site et les plateformes passent à −10 % pendant les semaines de travaux.",
      },
    ],
    reactions: [
      [
        {
          ...ROLES.ilias,
          texte: "Compris. On fera au mieux à l'arrivée.",
        },
      ],
      [
        {
          ...ROLES.ilias,
          texte:
            "J'ai appelé nos douze premiers comptes. Cimalp a apprécié qu'on prévienne avant ; deux autres ont demandé des chambres au 4e.",
        },
      ],
      [
        {
          ...ROLES.lucile,
          texte: "Les fiches sont à jour : dates, étages, horaires du chantier.",
        },
      ],
      [
        {
          ...ROLES.lucile,
          texte:
            "Les prix sont passés à −10 % sur les semaines de chantier. Le pick-up remonte un peu sur les week-ends.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Qui loger où ?",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...ROLES.rosalba,
        heure: "11:20",
        alerte: true,
        texte: ctx.travauxEnJuin
          ? `Ana, Hostéo attribue les chambres comme d'habitude, étage par étage, chantier ou pas. Cette semaine, ${ctx.exposees} des nuitées vendues étaient voisines du chantier. Mes femmes de chambre se font interpeller dans les couloirs.`
          : ctx.fermeture
            ? "Ana, pendant la fermeture d'août on ne loge personne. Mais d'ici là et à la réouverture, Hostéo attribuera les chambres comme d'habitude. On fixe des règles maintenant ?"
            : "Ana, le chantier démarre au 3e étage le 13 juillet. Hostéo attribue les chambres comme d'habitude, étage par étage : il mettra des clients au 2e et au 4e, juste au-dessous et au-dessus. On fixe des règles avant ?",
      },
      {
        ...ROLES.brice,
        heure: "15:00",
        texte:
          "Pour info, nos gars attaquent la dépose des salles de bains à 7 h 30. C'est le plus bruyant : marteau-piqueur et carottage.",
      },
    ],
    sources: [
      {
        id: "etages",
        titre: "Faire avec Rosalba le plan des étages et des chambres voisines du chantier",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Un étage en travaux s'entend à l'étage du dessus et à celui du dessous. ${
            ctx.travauxEnJuin
              ? `En juin, le chantier ne laisse que ${ETAGE} à ${2 * ETAGE} chambres loin du bruit selon l'étage en travaux (une vingtaine avec des lots sur tous les étages), et les clients d'affaires font ${taux(PART_AFFAIRES.juin, 0)} des clients : une quarantaine par nuit en semaine. Il n'y a pas la place de tous les loger loin du chantier.`
              : `En juillet et en août, il ne reste que ${ETAGE} chambres loin du chantier (le 1er étage, puis le 4e), mais les clients d'affaires ne font que ${taux(PART_AFFAIRES.juillet, 0)} des clients en juillet et ${taux(PART_AFFAIRES.aout, 0)} en août : ils y tiennent tous, en semaine.`
          } Les chambres voisines se vendent déjà ${taux(REMISE_VOISINES, 0)} moins cher.`,
      },
      {
        id: "horaires",
        titre: "Demander à Brice ce que coûteraient des horaires de chantier",
        cout: 0.5,
        nature: "utile",
        resultat: `Les travaux bruyants entre 9 h 30 et 17 h, quand les clients sont sortis : le bruit perçu baisse d'un tiers. Mais l'équipe avance moins vite : environ ${nombre(OCCUPATION.horaires.retard * 7, 0)} jours de plus sur tout le chantier.`,
      },
    ],
    question: "Comment répartissez-vous les clients pendant le chantier ?",
    options: [
      {
        t: "Laisser Hostéo attribuer les chambres comme d'habitude",
        d: "Aucune règle nouvelle : on remplit tous les étages ouverts, sans perdre une nuit.",
      },
      {
        t: "Un plan d'occupation : les clients d'affaires loin du chantier, les chambres voisines vendues en dernier, le bruit entre 9 h 30 et 17 h",
        d: "La réception attribue les chambres à la main ; l'entreprise perd environ deux jours sur le chantier.",
      },
      {
        t: `Afficher un tarif « travaux » à −${taux(TARIF.remise, 0)} sur toutes les chambres voisines du chantier`,
        d: `−${taux(TARIF.remise, 0)} au lieu de −15 %, annoncé à la réservation : les clients choisissent en connaissance de cause.`,
      },
      {
        t: "Poser des portes acoustiques et des joints sur les étages voisins",
        d: `${kE(OCCUPATION.protections.cout)}, posés en une semaine.`,
      },
    ],
    reactions: [
      [
        {
          ...ROLES.rosalba,
          texte: "Bien. On continue comme d'habitude, et on s'excuse dans les couloirs.",
        },
      ],
      [
        {
          ...ROLES.ilias,
          texte:
            "Le plan est affiché à la réception : les comptes d'affaires d'abord au 4e et au 1er, les voisins du chantier en dernier. Brice a décalé la dépose à 9 h 30.",
        },
      ],
      [
        {
          ...ROLES.lucile,
          texte:
            "Le tarif « travaux » est en ligne. Les chambres voisines partent en premier, maintenant.",
        },
      ],
      [
        {
          ...ROLES.brice,
          texte: "Portes et joints posés. Ça étouffe les voix, moins le marteau-piqueur.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Suivre le chantier",
    jusqua: 8,
    messages: (ctx) => [
      ctx.fermeture
        ? {
            ...ROLES.brice,
            heure: "16:45",
            texte:
              "Compte rendu : commandes passées, trois équipes réservées pour le 3 août. Tout est calé.",
          }
        : ctx.creux
          ? {
              ...ROLES.brice,
              heure: "16:45",
              texte:
                "Compte rendu : matériel livré, l'équipe attaque le 3e étage lundi. Je vous envoie un compte rendu chaque vendredi.",
            }
          : {
              ...ROLES.brice,
              heure: "16:45",
              texte: `Compte rendu n° 5 : ${ctx.livrees} chambres livrées, quelques jours de décalage sur les finitions, rattrapables. Rien d'inquiétant.`,
            },
      {
        ...ROLES.aymar,
        heure: "18:10",
        alerte: true,
        texte:
          "Ana, le conseil veut être sûr que tout sera prêt le 31 août. Comment est-ce que tu suis le chantier ?",
      },
    ],
    sources: [
      {
        id: "comptes-rendus",
        titre: "Relire les comptes rendus de Mérandaz sur ses chantiers précédents",
        cout: 0.5,
        nature: "decisive",
        resultat: `Sur ses quatre derniers chantiers, les comptes rendus de l'entreprise annonçaient à mi-parcours environ ${taux(SUIVI[0]!.vu, 0)} du retard réel. Le reste apparaissait dans les trois dernières semaines, quand il était trop tard pour renforcer.`,
      },
      {
        id: "economiste",
        titre: "Demander un devis à un économiste de la construction",
        cout: 0.5,
        nature: "utile",
        resultat: `Baltazar Quénel pointe l'avancement chambre par chambre chaque lundi, poste par poste, et chiffre le retard réel en jours : ${euros(SUIVI[1]!.cout)} jusqu'à la fin du chantier. « Un conducteur de travaux voit ce qui est commencé ; moi, je compte ce qui est fini. »`,
      },
    ],
    question: "Comment suivez-vous l'avancement ?",
    options: [
      {
        t: "S'en tenir aux comptes rendus de l'entreprise",
        d: "Un compte rendu chaque vendredi, sans frais.",
      },
      {
        t: "Faire pointer l'avancement chaque semaine par un économiste de la construction",
        d: `Baltazar Quénel, ${euros(SUIVI[1]!.cout)} jusqu'à la fin du chantier.`,
      },
      {
        t: "Faire vous-même le tour du chantier chaque lundi avec Rosalba",
        d: "Une heure par semaine, sans frais.",
      },
      {
        t: "Imposer par avenant des pénalités de retard de 500 € par jour",
        d: `L'entreprise accepte, et ajoute ${euros(SUIVI[3]!.cout)} à son prix pour le risque.`,
      },
    ],
    reactions: [
      [{ ...ROLES.brice, texte: "Très bien. Vous aurez votre compte rendu chaque vendredi." }],
      [
        {
          de: "Baltazar Quénel",
          role: "Économiste de la construction",
          texte:
            "Premier pointage lundi à 8 heures. Je vous envoie le retard en jours, poste par poste.",
        },
      ],
      [
        {
          ...ROLES.rosalba,
          texte: "Je bloque le lundi à 14 heures. On regardera les chambres une par une.",
        },
      ],
      [
        {
          ...ROLES.brice,
          texte:
            "Signé. Mais ne vous attendez pas à ce que je vous annonce des retards tous les vendredis, hein.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Le chantier a du retard",
    jusqua: 10,
    messages: (ctx) => [
      ctx.tournee
        ? {
            ...ROLES.rosalba,
            heure: "15:10",
            alerte: true,
            texte: `Ana, avec la tournée de lundi, j'ai compté les chambres vraiment finies : à vue de nez, ${ctx.retardVu} de retard. Brice dit que ce sont les finitions.`,
          }
        : ctx.pointage
          ? {
              de: "Baltazar Quénel",
              role: "Économiste de la construction",
              heure: "08:30",
              alerte: true,
              texte: `Pointage de lundi : le chantier a ${ctx.retardVu} de retard sur le planning, poste par poste. Les salles de bains sont en cause.`,
            }
          : {
              ...ROLES.brice,
              heure: "16:30",
              alerte: true,
              texte: ctx.fermeture
                ? `Le fournisseur des meubles de salle de bains annonce du retard : je l'estime à ${ctx.retardVu} sur notre fermeture d'août. On rattrapera.`
                : `Je ne vais pas vous mentir : on a ${ctx.retardVu} de retard. Les salles de bains. On rattrapera.`,
            },
      {
        ...ROLES.aymar,
        heure: "18:00",
        texte:
          "Ana, si le chantier déborde sur septembre, ce sont nos meilleures semaines qui y passent. Qu'est-ce que tu décides ?",
      },
    ],
    sources: [
      {
        id: "rattrapage",
        titre: "Chiffrer avec Brice ce que coûterait de rattraper",
        cout: 0.5,
        nature: "decisive",
        resultat: `Une équipe de renfort et les samedis : ${euros(RATTRAPAGE.mobilisation)} de mobilisation, puis ${euros(RATTRAPAGE.renfort)} par semaine de retard rattrapée. Mais en août, le bâtiment est en congés : Brice n'aura une équipe libre qu'une fois sur deux, à peine plus ; sinon, les samedis seuls rattrapent ${taux(RATTRAPAGE.partSamedis, 0)} du retard, à ${euros(RATTRAPAGE.samedis)} la semaine. Un retard qu'on laisse courir grossit d'un quart d'ici la fin, l'expérience de Brice le dit.`,
      },
      {
        id: "septembre",
        titre: "Chiffrer une semaine de chantier en septembre",
        cout: 0.5,
        nature: "utile",
        resultat: `En septembre, l'hôtel est plein du lundi au jeudi : quinze chambres encore en chantier une semaine de septembre font perdre ${SEPTEMBRE_QUINZE.nuits} nuits, ${kE(SEPTEMBRE_QUINZE.euros)}, sans compter le bruit pour les clients d'affaires revenus. Les clients déjà réservés sur ces chambres sont à reloger à ${euros(GESTES.delogement)} la nuit, si l'on n'a pas fermé la vente à temps.`,
      },
    ],
    question: "Que décidez-vous ?",
    options: [
      {
        t: "Maintenir le plan : Brice s'engage à rattraper",
        d: "Aucun surcoût. L'entreprise réorganise ses équipes.",
      },
      {
        t: "Rattraper tout de suite : une équipe de renfort et les samedis, à la mesure du retard constaté",
        d: `${euros(RATTRAPAGE.mobilisation)} de mobilisation, puis ${euros(RATTRAPAGE.renfort)} par semaine rattrapée ; les samedis seuls si aucune équipe n'est libre.`,
      },
      {
        t: "Décaler la fin en septembre : fermer dès maintenant à la vente les chambres concernées et prévenir les clients",
        d: "Aucun surcoût de chantier. Des chambres fermées en septembre.",
      },
      {
        t: "Forcer la cadence : travaux autorisés dès 7 h 30 et le samedi jusqu'à la fin",
        d: `${euros(RATTRAPAGE.coutCadence)} de majorations, plus 600 € par semaine restante ; les équipes travaillent moitié plus.`,
      },
    ],
    reactions: [
      [
        {
          ...ROLES.brice,
          texte: "Faites-nous confiance. On a déjà fini des chantiers plus en retard que ça.",
        },
      ],
      null,
      [
        {
          ...ROLES.ilias,
          texte:
            "Les chambres concernées sont fermées à la vente pour septembre. J'ai prévenu les clients déjà réservés : la plupart ont accepté une autre chambre.",
        },
      ],
      [
        {
          ...ROLES.rosalba,
          texte:
            "Marteau-piqueur à 7 h 30 et le samedi… J'ai prévenu la réception : il va falloir encaisser.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Cimalp prépare la rentrée",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...ROLES.yse,
        heure: "10:15",
        alerte: true,
        texte: `Madame Sousa, je prépare nos contrats d'automne. ${
          ctx.cimalpGene
            ? "Nos ingénieurs m'ont beaucoup parlé de votre chantier cet été. "
            : "Nos ingénieurs ne se sont pas plaints de votre chantier. "
        }L'Orméa Hotels de la gare nous fait une offre. Je décide fin septembre.`,
      },
      {
        ...ROLES.aymar,
        heure: "12:00",
        texte: "Cimalp, c'est notre premier compte. Ne le perds pas.",
      },
    ],
    sources: [
      {
        id: "ingenieurs",
        titre: "Relire les nuits des ingénieurs de Cimalp depuis juin",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Depuis juin, ${ctx.cimalpExposes} des nuits des ingénieurs de Cimalp ont été passées à côté du chantier. ${
            ctx.debord
              ? `Au rythme actuel, le chantier débordera d'environ ${ctx.debordJours} jours sur septembre, quand ils reviennent du lundi au jeudi.`
              : "Au rythme actuel, le chantier sera fini avant leur retour de septembre."
          }`,
      },
      {
        id: "ormea-offre",
        titre: "Se renseigner sur l'offre de l'Orméa Hotels",
        cout: 0.5,
        nature: "utile",
        resultat:
          "L'Orméa propose 89 € et des chambres garanties du lundi au jeudi. Ysé Durafour a toujours dit tenir d'abord à des nuits calmes : ses ingénieurs partent à 6 heures sur les chantiers.",
      },
    ],
    question: "Que proposez-vous à Cimalp ?",
    options: [
      {
        t: "Lui proposer 10 % de remise sur le contrat d'automne",
        d: `Environ ${euros(Math.round(REMISE_CIMALP / 100) * 100)} sur l'automne, si elle signe.`,
      },
      {
        t: "L'inviter à visiter les étages rénovés, avec le planning de fin de chantier et des chambres garanties pour ses ingénieurs",
        d: "Une heure de visite, aucune remise.",
      },
      {
        t: "Loger ses ingénieurs à l'Orméa, à vos frais, tant que dure le chantier",
        d: `${euros(ORMEA.fixe)} de réservation garantie, puis ${euros(ORMEA.parSemaine)} par semaine de chantier en septembre.`,
      },
      {
        t: "Attendre la rentrée : son contrat court jusqu'en décembre",
        d: "Rien à faire d'ici là.",
      },
    ],
    reactions: [
      [{ ...ROLES.yse, texte: "C'est noté. Je mets votre remise dans la balance." }],
      [
        {
          ...ROLES.yse,
          texte:
            "Merci pour la visite. Les chambres sont réussies, et vous m'avez montré les dates. J'en parle à nos chefs de projet.",
        },
      ],
      [
        {
          ...ROLES.yse,
          texte: "C'est un geste rare. Je le note.",
        },
      ],
      [{ ...ROLES.yse, texte: "Très bien. Nous verrons en septembre." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare la joueuse, sous son hasard. */
export const REFERENCES = [
  { nom: "Regrouper, isoler, suivre", chemin: [2, 1, 1, 1, 1, 1] },
  { nom: "Ne perdre aucune nuit", chemin: [0, 3, 0, 0, 0, 0] },
  { nom: "Laisser faire l'entreprise", chemin: [0, 0, 0, 0, 0, 3] },
] as const;

/**
 * Les réflexes du métier, [décision, option] : garder tout ouvert pour ne
 * perdre aucune nuit, taire le chantier ou le compenser par le prix, remplir
 * comme d'habitude, croire l'entreprise sur parole, persister quand le retard
 * apparaît, acheter le client par une remise.
 */
export const REFLEXES = [
  [0, 0],
  [1, 0],
  [1, 3],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  renfort:
    "Bonne nouvelle : j'ai récupéré une équipe qui finissait un chantier à Aix. Elle arrive lundi, et on travaille les samedis jusqu'à la fin.",
  samedis:
    "Désolé, toutes mes équipes sont en congés jusqu'au 24 août, comme tout le bâtiment. On fera les samedis avec la mienne : ça rattrapera une partie.",
  avis: "Un avis titré « Réveillé au marteau-piqueur » est en tête de notre fiche Bookalia depuis trois jours, et il a été repris sur Voyagio. La note de l'hôtel a perdu un quart de point d'un coup.",
  cimalpReste:
    "Nous renouvelons notre contrat d'automne chez vous. Mes ingénieurs ont hâte de découvrir les étages rénovés.",
  cimalpPart:
    "Après réflexion, nous signons avec l'Orméa Hotels pour l'automne. Mes ingénieurs ont eu un été difficile chez vous ; nous en reparlerons l'an prochain.",
} as const;
