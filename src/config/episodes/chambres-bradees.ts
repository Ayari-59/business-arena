/**
 * LES CHAMBRES QU'ON BRADE — le contenu de l'épisode.
 *
 * Romy Castellane dirige L'Escale Lac, l'hôtel 4 étoiles du Groupe Escale au
 * bord du lac d'Annecy : 84 chambres, un restaurant, une clientèle de loisirs
 * très saisonnière. Avril commence, le rythme des réservations paraît en
 * retard sur l'an dernier, et tout le monde lui propose de baisser les prix.
 * Six décisions, chacune précédée de ce qu'une directrice d'hôtel reçoit
 * vraiment : le rapport de Hostéo, la directrice générale, la revenue manager
 * du siège, la cheffe de réception, le responsable des ventes, les plateformes.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Les chiffres qu'elles
 * donnent sont calculés sur le modèle (src/engine/episodes/chambres-bradees.ts).
 *
 * Groupe, hôtels, plateformes, personnes et chiffres sont fictifs.
 */
import {
  ALLOTEMENT,
  ANALYSE,
  ANNULATIONS,
  BRENVAL,
  CHAMBRES,
  COMMISSION,
  COMMISSION_PREFERENCE,
  COMPARENT,
  COUT_DIRECT,
  DEMANDE,
  DEPLACEMENT_BRENVAL,
  ETE,
  GAIN_MEMBRE,
  GROUPES,
  MEMBRE,
  NET_PONT,
  NUITS,
  NUITS_DE_PONTS,
  PART_PLATEFORMES,
  PLAFOND,
  PRIX,
  SCENARIOS,
  SEMINAIRE_PERDU,
  SITE_MOINS_CHER,
  carnetDeDepart,
  chiffresAllotement,
  dejaReserve,
  effetVenteFlash,
  netDirect,
  netPlateforme,
} from "@/engine/episodes/chambres-bradees";
import type { Etape } from "./types";
import { euros, kE, nombre, taux } from "./format";

/** Un écart signé, en pourcentage : « +6,4 % », « −10,6 % ». */
export const ecart = (v: number, d = 1) => `${v >= 0 ? "+" : "−"}${taux(Math.abs(v), d)}`;
/** Des milliers d'euros signés : « +69 k€ », « −22 k€ ». */
export const kESigne = (v: number) => (v >= 0 ? `+${kE(v)}` : kE(v));
/** Des euros au centime. */
export const centimes = (v: number) =>
  `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

const ISALINE = { de: "Isaline Perraud", role: "Directrice générale du Groupe Escale" } as const;
const LUCILE = { de: "Lucile Fabbri", role: "Revenue manager, siège" } as const;
const LUDMILA = { de: "Ludmila Ferrouillat", role: "Cheffe de réception" } as const;
const CLODOMIR = { de: "Clodomir Jolivet", role: "Responsable des ventes" } as const;
const KERSTIN = { de: "Kerstin Aaltonen", role: "Chargée de compte, Bookalia" } as const;
const ALBIN = { de: "Albin Cachat", role: "Directeur, Autocars Brenval" } as const;
const MARIJKE = { de: "Marijke Hoogstraten", role: "Achats hôtels, Meerland Reizen" } as const;
const HOSTEO = { de: "Hostéo", role: "Rapport hebdomadaire" } as const;

/* ---------------------------------------------------------------------------
 * LES CHIFFRES DES SOURCES, calculés une fois sur le modèle.
 * ------------------------------------------------------------------------- */
export const CARNET = {
  pont: carnetDeDepart("pont"),
  weekend: carnetDeDepart("weekend"),
  semaine: carnetDeDepart("semaine"),
  groupes: carnetDeDepart("groupes"),
} as const;
/** La part des chambres des ponts déjà vendue au premier lundi, à l'occupation de l'an dernier. */
export const PONTS_VENDUS = CARNET.pont.cette / (NUITS_DE_PONTS * CHAMBRES * PLAFOND.pont);
/** La part des nuitées de semaine du trimestre déjà réservée au premier lundi. */
export const SEMAINE_RESERVEE =
  CARNET.semaine.cette / NUITS.semaine.reduce((s, n, w) => s + n * DEMANDE.semaine[w]!, 0);
/** Les nuits de l'Ascension, déjà vendues en fin de semaine 2. */
export const ASCENSION_VENDUE =
  (dejaReserve("pont", BRENVAL.semainePont - 2) * DEMANDE.pont[BRENVAL.semainePont]!) /
  (CHAMBRES * PLAFOND.pont);
/** Les nuits de semaine après le pont : l'occupation habituelle, et les chambres libres. */
const occupationApresPont =
  (DEMANDE.semaine[BRENVAL.semaineContre]! +
    GROUPES[BRENVAL.semaineContre]! / NUITS.semaine[BRENVAL.semaineContre]!) /
  CHAMBRES;
export const LIBRES_APRES_PONT = Math.round(CHAMBRES * (1 - occupationApresPont));
export const OCCUPATION_APRES_PONT = occupationApresPont;
/** Une nuitée d'été, nette, aux prix de la grille. */
export const NET_ETE =
  ETE.prix *
  (ETE.partPlateformes * (1 - COMMISSION) + (1 - ETE.partPlateformes) * (1 - COUT_DIRECT));
export const ALLOTEMENT_12 = chiffresAllotement(ALLOTEMENT.chambres);
export const ALLOTEMENT_6 = chiffresAllotement(ALLOTEMENT.chambres / 2);
export const VENTE_FLASH_SEMAINE = effetVenteFlash();
const trois = (c: { parScenario: readonly number[] }) =>
  `${kESigne(c.parScenario[0]!)} si l'été est plein, ${kESigne(c.parScenario[1]!)} s'il est normal, ${kESigne(c.parScenario[2]!)} s'il est creux`;

export const DIAGNOSTICS = [
  { id: "prix", t: "L'Escale Lac est trop chère face à l'Orméa et aux 4 étoiles du lac" },
  {
    id: "segments",
    t: "Le retard est un trompe-l'œil : les ponts et les week-ends sont en avance, l'écart vient d'un séminaire non reconduit et de nuits de semaine qui se réservent tard",
  },
  { id: "visibilite", t: "L'hôtel n'est pas assez visible sur Bookalia et Voyagio" },
  {
    id: "semaine",
    t: "Les nuits de semaine se vendent mal : c'est la dernière minute de semaine qu'il faut travailler",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le pick-up est en retard",
    jusqua: 2,
    messages: (ctx) => [
      {
        ...HOSTEO,
        heure: "07:30",
        alerte: true,
        texte: `Réservé à date pour avril, mai et juin : ${ctx.carnet} nuitées, ${ctx.pickup} sur l'an dernier à la même date. Semaine dernière : taux d'occupation ${ctx.to}, prix moyen ${ctx.pm}, RevPAR ${ctx.revpar}.`,
      },
      {
        ...ISALINE,
        heure: "08:45",
        texte: `Romy, ton pick-up est à ${ctx.pickup} sur l'an dernier : le plus mauvais du groupe. L'Orméa d'en face vient de passer à −15 % sur Bookalia pour mai. Je ne veux pas d'un printemps à moitié vide : dis-moi vendredi ce que tu fais.`,
      },
      {
        ...LUCILE,
        heure: "09:10",
        texte:
          "Je peux passer −15 % sur Bookalia et Voyagio ce soir dans le gestionnaire de canaux, pour tout le trimestre. Chambéry l'a fait l'an dernier et son taux d'occupation a pris six points. Tu me dis ?",
      },
      {
        ...LUDMILA,
        heure: "09:40",
        texte:
          "Le trimestre démarre : les vacances de printemps samedi, quatre ponts en mai (le 1er et le 8 tombent un vendredi, l'Ascension le jeudi 14, la Pentecôte le lundi 25), puis l'avant-saison de juin. Et c'est maintenant que juillet et août se réservent.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "pickup",
        titre: "Décomposer le pick-up par segment",
        cout: 1,
        nature: "decisive",
        resultat: `Réservé à date, cette année contre l'an dernier : ponts de mai ${nombre(CARNET.pont.cette, 0)} nuitées contre ${nombre(CARNET.pont.derniere, 0)} (${ecart(CARNET.pont.ecart)}) ; week-ends ${nombre(CARNET.weekend.cette, 0)} contre ${nombre(CARNET.weekend.derniere, 0)} (${ecart(CARNET.weekend.ecart)}) ; nuits de semaine ${nombre(CARNET.semaine.cette, 0)} contre ${nombre(CARNET.semaine.derniere, 0)} (${ecart(CARNET.semaine.ecart)}) ; groupes ${nombre(CARNET.groupes.cette, 0)} contre ${nombre(CARNET.groupes.derniere, 0)} (${ecart(CARNET.groupes.ecart)}). Les ${SEMINAIRE_PERDU.nuitees} nuitées d'écart des groupes sont le séminaire des Laboratoires Sérandal, l'an dernier en semaine ${SEMINAIRE_PERDU.semaine}, qui ne revient pas. Les nuits de semaine se réservent à quelques jours : à cette date, ${taux(SEMAINE_RESERVEE, 0)} seulement de leurs nuitées sont réservées, comme chaque année. Les douze nuits de ponts sont déjà vendues à ${taux(PONTS_VENDUS, 0)} ; l'an dernier, elles avaient fini à ${taux(PLAFOND.pont, 0)} d'occupation, au prix moyen de ${euros(PRIX.pont)}.`,
      },
      {
        id: "canaux",
        titre: "Lire la production par canal et ce qu'elle rapporte",
        cout: 1,
        nature: "decisive",
        resultat: `Sur les ponts et les week-ends, ${taux(PART_PLATEFORMES.pont, 0)} des nuitées passent par Bookalia et Voyagio ; en semaine, ${taux(PART_PLATEFORMES.semaine, 0)}. Les deux plateformes prennent ${taux(COMMISSION, 0)} de commission ; le site coûte ${taux(COUT_DIRECT, 0)} (moteur de réservation et paiement). Une nuitée de pont à ${euros(PRIX.pont)} rapporte ${euros(netPlateforme(PRIX.pont))} par une plateforme, ${euros(netDirect(PRIX.pont))} sur le site. L'enquête clients de l'an dernier : ${taux(COMPARENT, 0)} des clients du site regardent Bookalia avant de réserver. En semaine et le week-end, ${taux(ANNULATIONS.taux, 0)} des réservations des plateformes sont annulées dans les 48 heures ; la moitié ne se revend pas.`,
      },
      {
        id: "ormea",
        titre: "Relever les prix de l'Orméa et des 4 étoiles du lac",
        cout: 1,
        nature: "bruit",
        resultat:
          "L'Orméa Annecy Lac affiche −15 % sur Bookalia pour mai ; les trois autres 4 étoiles du lac sont entre −5 % et +4 % sur l'an dernier selon les dates. Vos prix sont dans la moyenne haute du lac, comme l'an dernier.",
      },
      {
        id: "reception",
        titre: "Faire le point avec Ludmila, cheffe de réception",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Sur les ponts de l'an dernier, des réservations d'une seule nuit — le samedi surtout — ont laissé des chambres vides le vendredi et le dimanche : des nuits orphelines, alors qu'on refusait du monde. En semaine, des clients demandent au téléphone un tarif moins cher, quitte à payer d'avance et à ne pas pouvoir annuler.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Aliénor Duchosal, directrice de L'Escale Évian",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Aliénor : « Avant de toucher à un prix, regarde qui est en retard, et par quel canal. Une baisse sur un pont, tu la paies sur chaque chambre que tu aurais vendue de toute façon. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous avant le point de vendredi avec Isaline ?",
    options: [
      {
        t: "Baisser de 15 % tous les prix sur Bookalia et Voyagio, dès ce soir",
        d: "Pour tout le trimestre. Lucile le paramètre ce soir ; le site et le téléphone gardent leurs prix.",
      },
      {
        t: "Baisser de 10 % tous les prix, sur tous les canaux",
        d: "Site, plateformes et téléphone au même prix : la parité est gardée. Pour tout le trimestre.",
      },
      {
        t: "Garder les prix ; imposer une durée minimale de séjour sur les ponts et ouvrir un tarif non remboursable à −10 % sur les nuits de semaine",
        d: "Deux nuits minimum sur les ponts, trois sur l'Ascension. Le non remboursable est payé à la réservation, sur tous les canaux. Quelques clients d'une seule nuit seront refusés sur les ponts.",
      },
      {
        t: "Ne rien changer, et suivre le pick-up chaque lundi",
        d: "Les grilles restent celles de mars.",
      },
    ],
    reactions: [
      [
        {
          ...LUCILE,
          texte: "C'est en ligne. Les réservations repartent dès ce soir, surtout sur Bookalia.",
        },
        {
          ...LUDMILA,
          texte:
            "Deux habitués ont annulé leur réservation faite sur notre site pour reprendre la même chambre sur Bookalia, moins chère.",
        },
      ],
      [
        {
          ...CLODOMIR,
          texte:
            "Tout est à −10 %. Les premiers clients des ponts paient moins cher des chambres qu'ils avaient déjà en vue.",
        },
      ],
      [
        {
          ...LUDMILA,
          texte:
            "Les restrictions sont en place. Deux clients ont râlé pour une nuit seule le samedi de l'Ascension ; ils ont pris deux nuits.",
        },
        {
          ...LUCILE,
          texte: "Le non remboursable part bien en semaine, surtout le mardi et le mercredi.",
        },
      ],
      [
        {
          ...ISALINE,
          texte: "Rien ne change ? On en reparle vendredi prochain.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Un groupe sur le pont de l'Ascension",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...CLODOMIR,
        heure: "10:20",
        alerte: true,
        texte: `Autocars Brenval me demande ${BRENVAL.chambres} chambres pour trois nuits, du mercredi 13 au samedi 16 mai, sur le pont de l'Ascension : un circuit des lacs alpins, ${euros(BRENVAL.prix)} la chambre, petit-déjeuner compris, sans commission. ${BRENVAL.chambres * BRENVAL.nuits} nuitées d'un coup : de quoi rattraper le séminaire perdu. Je signe ?`,
      },
      {
        ...ISALINE,
        heure: "11:05",
        texte: `Un groupe de ${BRENVAL.chambres * BRENVAL.nuits} nuitées quand le pick-up est en retard, ça ne se refuse pas.`,
      },
      {
        ...HOSTEO,
        heure: "18:00",
        texte: `Semaine 2 : taux d'occupation ${ctx.to}, prix moyen ${ctx.pm}, RevPAR ${ctx.revpar}. Réservé pour le reste du trimestre : ${ctx.pickup} sur l'an dernier.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "ascension",
        titre: "Regarder le pick-up de l'Ascension, et ce que rapportent ces nuits",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Les quatre nuits de l'Ascension sont déjà vendues à ${taux(ASCENSION_VENDUE, 0)}, en avance sur l'an dernier, qui avait fini à ${taux(PLAFOND.pont, 0)}${
            ctx.dureeMin ? " ; avec la durée minimale, Lucile attend 98 %" : ""
          }. Une nuitée de pont vendue par les canaux habituels rapporte en moyenne ${euros(NET_PONT)} net. Chaque nuitée du groupe prendrait la place de l'une d'elles : ${euros(NET_PONT - BRENVAL.prix)} de moins par nuitée, soit ${nombre(DEPLACEMENT_BRENVAL / 1000)} k€ sur les ${BRENVAL.chambres * BRENVAL.nuits}.`,
      },
      {
        id: "apres",
        titre: "Regarder les nuits de semaine qui suivent le pont",
        cout: 0.5,
        nature: "utile",
        resultat: `Du lundi 18 au jeudi 21 mai, juste après le pont, l'hôtel finit d'habitude autour de ${taux(OCCUPATION_APRES_PONT, 0)} d'occupation : il y reste près de ${LIBRES_APRES_PONT} chambres libres par nuit, que personne ne réserve à l'avance.`,
      },
    ],
    question: "Que répondez-vous à Autocars Brenval ?",
    options: [
      {
        t: `Signer aux dates demandées, à ${euros(BRENVAL.prix)}`,
        d: `${BRENVAL.chambres * BRENVAL.nuits} nuitées sur le pont de l'Ascension, contrat signé lundi.`,
      },
      {
        t: "Refuser : le pont se vendra seul",
        d: "Clodomir le dira à Brenval avec les formes.",
      },
      {
        t: `Proposer les nuits du lundi 18 au jeudi 21 mai, à ${euros(BRENVAL.contre)}`,
        d: "Juste après le pont, quand l'hôtel a de la place. Brenval acceptera, ou ira ailleurs.",
      },
    ],
    reactions: [
      [
        {
          ...CLODOMIR,
          texte:
            "Signé. Brenval est ravi : il n'avait trouvé personne d'autre sur le pont, tout le lac est plein.",
        },
      ],
      [
        {
          ...ALBIN,
          texte: "Dommage. Nous chercherons du côté de Talloires.",
        },
      ],
      null,
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Bookalia propose son programme",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...KERSTIN,
        heure: "11:00",
        alerte: true,
        texte: `Bonjour Madame Castellane. Votre pick-up mérite un coup de pouce : avec le programme Préférence, L'Escale Lac passe en tête des résultats sur Annecy pendant trois mois, pour une commission de ${taux(COMMISSION_PREFERENCE, 0)} au lieu de ${taux(COMMISSION, 0)}. Les hôtels du programme gagnent en moyenne 12 % de réservations Bookalia.`,
      },
      {
        ...CLODOMIR,
        heure: "14:30",
        texte:
          "Moi, je pousserais notre site : un tarif membre, et les 11 000 anciens clients du fichier, qu'on n'a jamais relancés. Le prestataire du site peut le faire en dix jours.",
      },
      {
        ...HOSTEO,
        heure: "18:00",
        texte: `Semaine 4 : RevPAR ${ctx.revpar}, taux d'occupation ${ctx.to}, part des réservations directes ${ctx.direct}.`,
      },
    ],
    sources: [
      {
        id: "origine",
        titre: "Regarder qui sont les clients que Bookalia compte comme gagnés",
        cout: 0.5,
        nature: "decisive",
        resultat: `Bookalia compte toutes les réservations faites chez elle : six clients Bookalia sur dix, l'an dernier, étaient déjà venus ou avaient visité le site de l'hôtel avant de réserver. Sur les ponts, les week-ends et l'été, l'hôtel est plein ou presque : une meilleure place n'y ajoute rien, mais les trois points se paient sur chaque nuitée Bookalia, soit ${centimes(PRIX.pont * (COMMISSION_PREFERENCE - COMMISSION))} sur une nuitée de pont, ${centimes(ETE.prix * (COMMISSION_PREFERENCE - COMMISSION))} sur une nuitée d'été.`,
      },
      {
        id: "membre",
        titre: "Chiffrer un tarif membre avec le prestataire du site",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Un tarif à −${taux(MEMBRE.remise, 0)} réservé aux clients inscrits, avec un départ tardif et un verre d'accueil ; les prix publics restent les mêmes sur tous les canaux, la parité est respectée. ${euros(MEMBRE.cout)} de mise en place et de campagne. Une nuitée qui passe d'une plateforme au site, au tarif membre, rapporte ${taux(GAIN_MEMBRE, 0)} de plus à l'hôtel. À L'Escale Évian, la part directe a gagné sept points en quatre mois : ça prend du temps.${
            ctx.plateformesMoinsCheres
              ? " Mais aujourd'hui, Bookalia et Voyagio affichent 15 % de moins que le site : un tarif membre à −5 % y resterait plus cher qu'elles."
              : ""
          }`,
      },
      {
        id: "parite",
        titre: "Demander au siège ce que dit le contrat Bookalia sur la parité",
        cout: 0.5,
        nature: "utile",
        resultat: `Depuis la loi de 2015, rien n'interdit à un hôtel français d'afficher moins cher sur son propre site. Mais Bookalia classe les hôtels selon leur « compétitivité tarifaire » : à Évian, un site moins cher que Bookalia a fait reculer l'hôtel de deux pages pendant deux mois. Un tarif réservé aux inscrits, lui, n'est pas un prix public.`,
      },
    ],
    question: "Que faites-vous de vos canaux de distribution ?",
    options: [
      {
        t: "Adhérer au programme Préférence de Bookalia",
        d: `Trois mois, ${taux(COMMISSION_PREFERENCE, 0)} de commission au lieu de ${taux(COMMISSION, 0)} sur chaque nuitée Bookalia, et la tête des résultats sur Annecy.`,
      },
      {
        t: "Lancer le tarif membre sur le site, et écrire aux anciens clients",
        d: `−${taux(MEMBRE.remise, 0)} pour les inscrits, un départ tardif et un verre d'accueil ; prix publics identiques partout. ${euros(MEMBRE.cout)}, et quelques semaines avant que ça prenne.`,
      },
      {
        t: `Afficher sur le site des prix publics ${taux(SITE_MOINS_CHER.remise, 0)} sous ceux des plateformes`,
        d: `Le site devient le moins cher pour tous les visiteurs. ${euros(SITE_MOINS_CHER.cout)} pour refaire les pages. Bookalia le verra.`,
      },
      {
        t: "Ne rien changer à la distribution",
        d: "Les canaux restent ce qu'ils sont.",
      },
    ],
    reactions: [
      [
        {
          ...KERSTIN,
          texte:
            "Bienvenue dans Préférence ! L'Escale Lac est en tête des résultats depuis ce matin.",
        },
        {
          ...LUDMILA,
          texte:
            "Deux clients qui réservaient d'habitude par téléphone sont passés par Bookalia cette semaine.",
        },
      ],
      [
        {
          ...CLODOMIR,
          texte:
            "Le tarif membre est en ligne et le courriel est parti aux 11 000 anciens clients : 600 inscrits le premier week-end.",
        },
      ],
      [
        {
          ...CLODOMIR,
          texte:
            "Le site affiche 8 % de moins que Bookalia. Les réservations directes montent déjà.",
        },
      ],
      [
        {
          ...KERSTIN,
          texte: "Je reste à votre disposition si vous changez d'avis.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Un allotement pour l'été",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...MARIJKE,
        heure: "09:40",
        alerte: true,
        texte: `Nous cherchons ${ALLOTEMENT.chambres} chambres par nuit pour juillet et août, soit ${nombre(ALLOTEMENT.chambres * ETE.nuits, 0)} nuitées, à ${euros(ALLOTEMENT.prix)} nets la chambre, petit-déjeuner compris, avec une remise des chambres non vendues à ${ALLOTEMENT.release} jours. Il me faut votre réponse avant vendredi prochain ; nous regardons aussi un autre hôtel sur le lac.`,
      },
      {
        ...ISALINE,
        heure: "10:15",
        texte: `Un allotement en plein été, c'est ${kE(ALLOTEMENT.chambres * ETE.nuits * ALLOTEMENT.prix)} de chiffre d'affaires assuré. Signe, Romy : on ne sait jamais ce que l'été nous réserve.`,
      },
      {
        ...LUCILE,
        heure: "11:30",
        texte: `À cette date, le pick-up de juillet-août ne dit pas grand-chose : ${ctx.pickupEte} sur l'an dernier, dans le bruit. Je peux faire l'analyse par marché et par canal, avec les données de recherche de Bookalia et celles de l'office de tourisme : une semaine, et ${euros(ANALYSE.cout)} de données.`,
      },
    ],
    sources: [
      {
        id: "etes",
        titre: "Relire les étés des cinq dernières années",
        cout: 0.5,
        nature: "decisive",
        resultat: `En gros, un été sur trois, l'hôtel aurait vendu plus de chambres qu'il n'en a ; un sur deux, il finit autour de ${taux(SCENARIOS[1]!.demande / (CHAMBRES * ETE.nuits), 0)} d'occupation ; un sur cinq, autour de ${taux(SCENARIOS[2]!.demande / (CHAMBRES * ETE.nuits), 0)}. Une nuitée d'été rapporte en moyenne ${euros(NET_ETE)} net aux prix de la grille.`,
      },
      {
        id: "allotement",
        titre: "Chiffrer l'allotement selon l'été",
        cout: 0.5,
        nature: "decisive",
        resultat: `À grille inchangée, ${ALLOTEMENT.chambres} chambres allouées changent la valeur de l'été de ${trois(ALLOTEMENT_12)} : ${kESigne(ALLOTEMENT_12.esperance)} en moyenne. Six chambres : ${trois(ALLOTEMENT_6)}, soit ${kESigne(ALLOTEMENT_6.esperance)} en moyenne. Dans un été plein, chaque chambre de Meerland prend la place d'un client à ${euros(NET_ETE)} ; dans un été creux, elle remplit une chambre qui serait restée vide.`,
      },
      {
        id: "meerland",
        titre: "Appeler un directeur qui a travaillé avec Meerland",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le directeur d'un hôtel d'Évian : « Ils tiennent parole et remplissent bien leurs chambres quand l'été est bon. Mais quand ils veulent une réponse, ils la veulent : l'an dernier, ils ont signé ailleurs après quatre jours d'attente. » À son avis, ils attendront une semaine à peu près deux fois sur trois.",
      },
    ],
    question: "Que répondez-vous à Meerland Reizen ?",
    options: [
      {
        t: `Signer les ${ALLOTEMENT.chambres} chambres tout de suite`,
        d: `${nombre(ALLOTEMENT.chambres * ETE.nuits, 0)} nuitées à ${euros(ALLOTEMENT.prix)}, remise des invendus à ${ALLOTEMENT.release} jours.`,
      },
      {
        t: "Refuser : l'été se vendra seul",
        d: "Les chambres restent aux clients individuels.",
      },
      {
        t: `Signer ${ALLOTEMENT.chambres / 2} chambres seulement`,
        d: `${nombre((ALLOTEMENT.chambres / 2) * ETE.nuits, 0)} nuitées à ${euros(ALLOTEMENT.prix)}, remise des invendus à ${ALLOTEMENT.release} jours. Meerland en voulait douze, mais prendra six.`,
      },
      {
        t: "Commander l'analyse de Lucile, puis répondre : 12 chambres si l'été s'annonce creux, 6 s'il est normal, aucune s'il est plein",
        d: `${euros(ANALYSE.cout)} et une semaine. Meerland attendra, ou signera ailleurs.`,
      },
    ],
    reactions: [
      [{ ...MARIJKE, texte: "Parfait : le contrat part ce soir." }],
      [{ ...MARIJKE, texte: "Dommage. Nous allons voir ailleurs sur le lac." }],
      [
        {
          ...MARIJKE,
          texte: "Six chambres, c'est moins que ce que nous voulions, mais d'accord.",
        },
      ],
      null,
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "L'été se dessine",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...LUCILE,
        heure: "09:00",
        alerte: true,
        texte: `Pick-up de juillet-août à fin mai : ${ctx.pickupEte} sur l'an dernier à la même date. ${
          ctx.scenario === 0
            ? "Les dates du 10 juillet au 20 août se remplissent plus vite que jamais."
            : ctx.scenario === 2
              ? "Les marchés étrangers sont en net retard."
              : "Dans la ligne de l'an dernier, avec quelques creux début juillet et fin août."
        }`,
      },
      {
        ...ISALINE,
        heure: "10:30",
        texte:
          "La grille d'été a été construite en mars avec le siège : ne la touchons pas au premier frémissement. Si le pick-up faiblit, Lucile fera une offre « Réservez tôt » sur les plateformes.",
      },
      {
        ...HOSTEO,
        heure: "18:00",
        texte: `Semaine 8 : RevPAR ${ctx.revpar}, taux d'occupation ${ctx.to}, prix moyen ${ctx.pm}. Part des réservations directes : ${ctx.direct}.`,
      },
    ],
    sources: [
      {
        id: "marches",
        titre: "Lire le pick-up de l'été par marché et par canal",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.scenario === 0
            ? "Par marché : la France +6 points, la Suisse +11, le Royaume-Uni et le Benelux +14 ; le site et Bookalia en avance d'autant. À ce rythme, la demande dépassera les chambres du 10 juillet au 20 août : des séjours d'une ou deux nuits prendront des chambres que des séjours d'une semaine auraient remplies, et la grille de mars vend ces dates au prix d'un été ordinaire."
            : ctx.scenario === 2
              ? "Par marché : la France au niveau de l'an dernier, le Royaume-Uni et le Benelux à −20 %, sur toutes les plateformes. Les nuits de semaine de juillet sont en retard de quinze points ; le 14 juillet et le 15 août restent pleins. Les clients qui réservent encore regardent les prix et les conditions d'annulation."
              : "Par marché : la France et la Suisse au niveau de l'an dernier, le Royaume-Uni et le Benelux légèrement en avance. Les deux premières semaines de juillet et la dernière d'août sont en retard ; du 14 juillet au 15 août, l'hôtel est en avance et sera plein.",
      },
      {
        id: "grille",
        titre: "Relire la grille d'été",
        cout: 0.5,
        nature: "utile",
        resultat: `La grille de mars : ${euros(ETE.prix)} en moyenne, les mêmes prix du 1er juillet au 31 août à jour de semaine égal, sans durée minimale de séjour. Elle a été construite sur l'été de l'an dernier et n'a pas bougé depuis.`,
      },
    ],
    question: "Que faites-vous de l'été ?",
    options: [
      {
        t: "Garder la grille d'été fixée en mars",
        d: "Elle a été construite avec le siège ; on la jugera en septembre.",
      },
      {
        t: "Revoir l'été date par date selon le pick-up",
        d: "Monter les dates en avance, trois nuits minimum là où la demande dépasse les chambres, un non remboursable sur les dates en retard.",
      },
      {
        t: "Lancer « Réservez tôt » : −15 % sur Bookalia et Voyagio pour tout l'été",
        d: "Pour sécuriser l'été dès maintenant. Le site garde ses prix.",
      },
      {
        t: "Monter toute la grille d'été de 10 %",
        d: "Toutes les dates, tous les canaux.",
      },
    ],
    reactions: [
      [{ ...LUCILE, texte: "La grille reste celle de mars." }],
      [
        {
          ...LUCILE,
          texte: "C'est fait : les 62 dates revues une par une. Je les relirai chaque lundi.",
        },
      ],
      [
        {
          ...LUDMILA,
          texte:
            "L'offre est en ligne. J'ai déjà eu deux appels de clients du site qui veulent le prix de Bookalia.",
        },
      ],
      [{ ...LUCILE, texte: "Grille montée de 10 % sur toutes les dates." }],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Le taux d'occupation de juin",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...ISALINE,
        heure: "08:30",
        alerte: true,
        texte: `Le comité regarde le taux d'occupation de juin : le groupe annonce 76 %, L'Escale Lac est à ${ctx.to} cette semaine. Annemasse a fait une vente flash l'an dernier, son occupation a pris douze points. Fais pareil.`,
      },
      {
        ...LUDMILA,
        heure: "09:15",
        texte:
          "Les week-ends de juin sont presque pleins. Ce sont les nuits du dimanche au jeudi qui restent ouvertes, comme chaque année : elles se réservent à quelques jours.",
      },
    ],
    sources: [
      {
        id: "flash",
        titre: "Refaire sur L'Escale Lac le calcul de la vente flash d'Annemasse",
        cout: 0.5,
        nature: "decisive",
        resultat: `−25 % sur Bookalia et Voyagio. Sur nos nuits de semaine : ${ecart(VENTE_FLASH_SEMAINE.nuitees, 0)} de nuitées, mais ${ecart(VENTE_FLASH_SEMAINE.net)} de revenu net : un client du site sur deux passerait par la vente flash, et chaque nuitée vendue rapporte un quart de moins, commission en plus. Sur les week-ends, presque pleins, elle ne ferait que baisser le prix de chambres qui se seraient vendues. Annemasse avait gagné douze points d'occupation ; son revenu net avait baissé.`,
      },
      {
        id: "fichier",
        titre: "Regarder ce que peut donner le fichier clients",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.tarifMembre
            ? `${ctx.membres} clients se sont inscrits au tarif membre depuis fin avril. Une offre réservée aux inscrits — deux nuits en semaine à −15 %, non remboursable — ne se voit pas sur les plateformes et ne baisse aucun prix public. À Évian, elle a rempli une vingtaine de chambres de plus par semaine en juin dernier.`
            : "Le fichier des 11 000 anciens clients n'a jamais été relancé, et beaucoup d'adresses sont anciennes. Sans clients inscrits, une offre envoyée à froid touche peu de monde : quelques chambres par semaine, au mieux.",
      },
      {
        id: "etude",
        titre: "Demander à Clodomir ce qu'il peut vendre aux entreprises",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Clodomir : « Des journées d'étude avec une nuit, pour les entreprises d'Annecy et de Genève. Il me faut trois semaines pour les signer : une trentaine de nuitées fin juin, au tarif groupe. »",
      },
    ],
    question: "Que faites-vous pour juin ?",
    options: [
      {
        t: "Vente flash : −25 % sur Bookalia et Voyagio pour toutes les nuits de juin",
        d: "Trois semaines, week-ends compris. Le taux d'occupation montera.",
      },
      {
        t: "Une offre de semaine réservée aux membres et aux anciens clients : deux nuits à −15 %, non remboursable",
        d: "Envoyée par courriel, invisible sur les plateformes.",
      },
      {
        t: "Demander à Clodomir de vendre des journées d'étude aux entreprises",
        d: "Une nuit et une salle, au tarif groupe ; trois semaines pour signer.",
      },
      {
        t: "Tenir les prix et les restrictions jusqu'à fin juin",
        d: "Le taux d'occupation de juin restera ce qu'il est.",
      },
    ],
    reactions: [
      [
        {
          ...LUCILE,
          texte:
            "La vente flash est en ligne. Les réservations affluent dès le premier soir, week-ends compris.",
        },
      ],
      [
        {
          ...CLODOMIR,
          texte:
            "L'offre est partie ce matin. Les premières réservations viennent d'habitués qu'on n'avait pas vus depuis deux ans.",
        },
      ],
      [
        {
          ...CLODOMIR,
          texte:
            "Deux journées d'étude signées pour fin juin : une banque genevoise et un fabricant de skis de Rumilly.",
        },
      ],
      [
        {
          ...ISALINE,
          texte:
            "Je dirai au comité que L'Escale Lac tient ses prix. J'espère que tu sais ce que tu fais.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Lire le pick-up, segmenter, vendre en direct", chemin: [2, 2, 1, 3, 1, 1] },
  { nom: "Baisser dès que le pick-up recule", chemin: [0, 0, 0, 0, 2, 0] },
  { nom: "Attentiste", chemin: [3, 1, 3, 1, 0, 3] },
] as const;

/**
 * Les options que le réflexe de l'épisode fait choisir : [décision, option].
 * Remplir à tout prix quand le pick-up recule — baisser sur les plateformes ou
 * partout, signer un groupe sur un pont déjà plein, payer plus de commission
 * pour plus de visibilité, signer l'allotement les yeux fermés, brader l'été,
 * faire une vente flash pour le taux d'occupation — et, devant le signal de
 * l'été, ne rien réviser.
 */
export const REFLEXES = [
  [0, 0],
  [0, 1],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [4, 2],
  [5, 0],
] as const;

export const REPONSES = {
  brenvalOui:
    "Va pour le lundi 18 au jeudi 21 mai : nos clients sont surtout des retraités, la semaine leur convient même mieux. Nous signons.",
  brenvalNon:
    "Nos clients ont posé leurs congés sur le pont : nous ne pouvons pas décaler. Nous trouverons ailleurs.",
  meerlandAttend: "Nous attendrons votre réponse jusqu'à vendredi prochain, pas plus.",
  meerlandPart:
    "Nous ne pouvons pas attendre une semaine : nous signons avec l'Orméa Annecy Lac. Une autre fois, peut-être.",
  bookaliaSanctionne:
    "Notre algorithme a relevé que votre site affiche des prix inférieurs aux nôtres. L'Escale Lac n'est plus mise en avant dans les résultats d'Annecy.",
  bookaliaPrevient:
    "Nous avons noté un écart entre vos prix et ceux de votre site. Nous restons attentifs à la compétitivité tarifaire de nos partenaires.",
} as const;

/** Ce que l'analyse de Lucile dit de l'été, et ce que Romy en fait. */
export const ANALYSE_ETE = [
  "L'analyse est prête : l'été s'annonce plein, le Royaume-Uni et le Benelux réservent plus tôt que jamais. Nous déclinons l'allotement.",
  "L'analyse est prête : l'été s'annonce normal, avec des creux début juillet et fin août. Nous signons six chambres avec Meerland.",
  "L'analyse est prête : l'été s'annonce creux, les marchés étrangers sont en net retard. Nous signons les douze chambres avec Meerland.",
] as const;
