/**
 * LE FORFAIT VENDU SOUS SON COÛT — le contenu de l'épisode.
 *
 * Prune Lecoeur est contrôleuse de gestion d'Atlas Conseil, à Nantes. Les
 * forfaits du cabinet affichent 38 % de marge à la vente et finissent en
 * perte ; la grille de chiffrage des propositions, construite en 2019, divise
 * le coût d'un consultant par 218 jours. De janvier à mars, six décisions,
 * chacune précédée de ce qu'une contrôleuse de gestion reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Tous les chiffres qu'elles
 * donnent sont calculés depuis les constantes du modèle.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape, Message } from "./types";
import { euros, nombre } from "./format";
import {
  ACCORD,
  ARMORINE,
  CHANCE,
  CHARGES_STRUCTURE,
  CONGES,
  CONSULTANTS,
  COUT_COMPLET_MISSION,
  COUT_JOUR,
  COUT_JOUR_ARMORINE,
  COUT_JOUR_ARMORINE_NOUVELLE,
  DEPASSEMENT,
  FACTURABLES,
  GRADES,
  JOURS_MISSION,
  JOURS_OUVRES,
  JOURS_TRAVAILLES,
  MARGE_AFFICHEE,
  MARGE_REELLE_2024,
  MARGE_SANS_DEPASSEMENT,
  MISSION,
  NOMS_GRADES,
  PLANCHER,
  PRIX,
  PRIX_JOUR_MISSION,
  QUOTE_PART,
  QUOTE_PART_GRILLE,
  RTT,
  SALAIRE_CHARGE,
  STRUCTURE,
  TEMPS,
  TJM,
  VALMORIN,
  catalogue,
  coutComplet,
  coutEquipe,
  coutGrille,
  joursDe,
  notePrix,
  type Grade,
} from "@/engine/episodes/forfait-trop-bas";

/** Un pourcentage entier, signe moins typographique compris. */
export const pourcent = (v: number) =>
  `${v < 0 ? "−" : ""}${Math.abs(Math.round(v * 100)).toLocaleString("fr-FR")} %`;
/** Des millions d'euros, à deux décimales. */
export const millions = (v: number) => `${nombre(v / 1e6, 2)} M€`;

const GUSTAVE = { de: "Gustave Herbelin", role: "Directeur administratif et financier" } as const;
const DARIUSH = { de: "Dariush Vahidi", role: "Associé, directeur commercial" } as const;
const LORCAN = {
  de: "Lorcan Brévalaire",
  role: "Associé, practice Performance opérationnelle",
} as const;
const AISSATOU = { de: "Aïssatou Ndour", role: "Responsable du staffing" } as const;
const ONDREJ = {
  de: "Ondrej Plessix",
  role: "Directeur industriel, Biscuiterie Lancelin",
} as const;
const GAID = {
  de: "Gaïd Douarin",
  role: "Directrice supply chain, Coopérative Valmorin",
} as const;
const LUCETTE = { de: "Lucette Rozenblum", role: "Acheteuse, Achats Publics de l'Ouest" } as const;
const DOMENICA = { de: "Domenica Marzin", role: "Directrice générale, Mutuelle Armorine" } as const;

export const PERSONNES = { GUSTAVE, DARIUSH, LORCAN, AISSATOU, ONDREJ, GAID, LUCETTE, DOMENICA };

/** Ce que coûtent, au coût complet, les trois équipes chiffrées pour Valmorin. */
export const COUT_VALMORIN = {
  associe: coutEquipe(VALMORIN.associe),
  revue: coutEquipe(VALMORIN.revue),
  prudente: coutEquipe(VALMORIN.prudente),
} as const;
/** La perte de la mission de la mutuelle l'an dernier, dépassement habituel compris. */
export const PERTE_ARMORINE_2024 =
  ARMORINE.jours * (COUT_JOUR_ARMORINE * (1 + ARMORINE.depassement.moyen) - ARMORINE.prix2024);
/** La remise sur le catalogue qu'il faut à l'équipe de l'associé pour tenir le budget de Valmorin. */
export const REMISE_VALMORIN = 1 - VALMORIN.budget / catalogue(VALMORIN.associe);

const ligneGrille = (g: Grade) =>
  `${NOMS_GRADES[g].toLowerCase()}, ${euros(SALAIRE_CHARGE[g])} chargés → ${euros(coutGrille(g))} le jour`;
const ligneTemps = (g: Grade) => {
  const t = TEMPS[g];
  return `${NOMS_GRADES[g].toLowerCase()} : ${FACTURABLES[g]} jours facturés (${t.absences} d'absence, ${t.formation} de formation, ${t.avantVente} d'avant-vente, ${t.intercontrat} d'intercontrat, ${t.interne} de tâches internes)`;
};

export const DIAGNOSTICS = [
  {
    id: "cout",
    t: "La grille sous-estime le coût d'une journée : elle répartit le coût d'un consultant sur 218 jours alors qu'il en facture environ 160, avec une quote-part de structure de 2019",
  },
  {
    id: "depassements",
    t: "Les forfaits dépassent les jours vendus : les chefs de mission ne tiennent pas leurs budgets",
  },
  {
    id: "prix",
    t: "Nos TJM sont trop hauts face à Kéroual : nous perdons les bonnes propositions et ne gardons que les difficiles",
  },
  {
    id: "occupation",
    t: "Le taux d'occupation est trop bas : l'intercontrat des consultants plombe les forfaits",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Les forfaits finissent en perte",
    jusqua: 3,
    messages: () => [
      {
        ...GUSTAVE,
        heure: "08:10",
        alerte: true,
        texte: `Prune, la clôture de l'an dernier est sortie : nos 23 forfaits clos affichaient ${pourcent(MARGE_AFFICHEE)} de marge à la vente, et ils finissent à ${pourcent(MARGE_REELLE_2024)}. Le comité de direction veut comprendre avant de valider les propositions de janvier à mars. C'est sur la marge des forfaits de ce trimestre qu'on nous jugera.`,
      },
      {
        ...DARIUSH,
        heure: "09:20",
        texte:
          "Notre taux de transformation est tombé à 38 %. Kéroual Consulting nous passe sous le nez avec des prix 10 % plus bas. La grille de chiffrage marche depuis cinq ans : c'est nos prix qu'il faut baisser, pas l'outil qu'il faut changer.",
      },
      {
        ...LORCAN,
        heure: "10:05",
        texte:
          "Trois propositions partent d'ici quinze jours : Conserverie Gravelot, le Syndicat des eaux du Vignoble et les Chantiers Kerdavel. Il me faut la règle de chiffrage avant jeudi.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "grille",
        titre: "Ouvrir la grille de chiffrage des propositions",
        cout: 0.5,
        nature: "decisive",
        resultat: `La grille date de 2019. Pour chaque grade, elle ajoute au salaire annuel chargé ${euros(QUOTE_PART_GRILLE)} de quote-part de frais de structure, puis divise par ${JOURS_TRAVAILLES} jours : ${GRADES.map(ligneGrille).join(" ; ")}. Au TJM catalogue (${GRADES.map((g) => euros(TJM[g])).join(", ")}), elle affiche ${GRADES.map((g) => pourcent(1 - coutGrille(g) / TJM[g])).join(", ")} de marge. Commentaire de la cellule : « ${JOURS_TRAVAILLES} jours = forfait annuel d'un cadre, ${JOURS_OUVRES} jours ouvrés moins ${CONGES} de congés et ${RTT} de RTT ».`,
      },
      {
        id: "tempora",
        titre: "Extraire de Tempora les temps de l'an dernier, par grade",
        cout: 1,
        nature: "decisive",
        resultat: `Sur les ${JOURS_TRAVAILLES} jours du forfait annuel, en moyenne : ${GRADES.map(ligneTemps).join(" ; ")}. Taux de facturation : ${GRADES.map((g) => pourcent(FACTURABLES[g] / JOURS_TRAVAILLES)).join(", ")}.`,
      },
      {
        id: "comptes",
        titre: "Demander à la direction financière les charges de structure de l'an dernier",
        cout: 0.5,
        nature: "decisive",
        resultat: `Charges de structure de l'an dernier : ${millions(CHARGES_STRUCTURE)}, dont ${millions(STRUCTURE.support)} de salaires des fonctions support et ${millions(STRUCTURE.autres)} de locaux, système d'information, assurances, honoraires et marketing. Rapportées aux ${CONSULTANTS} consultants facturables : ${euros(QUOTE_PART)} par consultant et par an. La quote-part de la grille a été calculée en 2019, avant l'ouverture du bureau de Paris et la refonte du système d'information.`,
      },
      {
        id: "keroual",
        titre: "Comparer nos prix à ceux de Kéroual Consulting",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Sur les neuf propositions perdues face à Kéroual l'an dernier, son prix était inférieur au nôtre de 11 % en moyenne. Son TJM affiché pour un consultant senior : 860 €. Kéroual compte une soixantaine de consultants et a ouvert un bureau à Rennes en septembre.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Gustave",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Gustave : « Un consultant ne facture pas ses 218 jours. Avant de toucher aux prix, regarde combien de jours chacun facture vraiment, et ce que coûte la maison autour de lui. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Quelle règle de chiffrage pour les propositions du trimestre ?",
    options: [
      {
        t: "Garder la grille et baisser les prix de 8 % pour regagner des forfaits",
        d: `Comme le demande Dariush : la grille qui marche depuis 2019, et un prix moyen ramené à ${euros(PRIX.baisse)} le jour.`,
      },
      {
        t: "Ajouter 5 % de jours à chaque chiffrage pour couvrir les dépassements",
        d: `Sans toucher au coût d'une journée. Le prix moyen monte à ${euros(PRIX.provision)} le jour.`,
      },
      {
        t: "Recalculer le coût de chaque grade sur ses jours facturables, et fixer un prix plancher au coût complet",
        d: `Quote-part de structure à jour, dépassement moyen compris. Les remises sous le plancher deviennent impossibles ; le prix moyen remonte vers ${euros(PRIX.plancher)} le jour.`,
      },
      {
        t: "Garder la grille et la remise habituelle jusqu'au bilan annuel",
        d: `Rien ne change pour les associés : ${euros(PRIX.actuel)} le jour en moyenne.`,
      },
    ],
    reactions: [
      [
        {
          ...DARIUSH,
          texte:
            "Merci. Les associés ont la consigne : 8 % de mieux sur toutes les propositions. On va remonter la pente.",
        },
      ],
      [
        {
          ...LORCAN,
          texte:
            "Cinq pour cent de jours en plus, je sais le défendre devant un client : c'est de la prudence.",
        },
      ],
      [
        {
          ...DARIUSH,
          texte: `Ta nouvelle grille fait passer un consultant senior de ${euros(coutGrille("senior"))} à ${euros(coutComplet("senior"))} le jour. Les associés râlent : certaines remises ne passent plus. On verra ce que ça donne.`,
        },
      ],
      [{ ...LORCAN, texte: "Bon. Je chiffre comme d'habitude." }],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "Des propositions perdues au prix",
    jusqua: 5,
    messages: (ctx) => [
      {
        ...DARIUSH,
        heure: "17:40",
        alerte: true,
        texte: `Le Département a attribué son audit organisationnel à Kéroual, à 690 € le jour moyen. Depuis janvier : ${ctx.remises} proposition${Number(ctx.remises) > 1 ? "s" : ""} remise${Number(ctx.remises) > 1 ? "s" : ""}, ${ctx.gagnees} gagnée${Number(ctx.gagnees) > 1 ? "s" : ""}. On s'aligne sur Kéroual partout où il est en face, ou on finit le trimestre sans carnet.`,
      },
      {
        ...AISSATOU,
        heure: "18:05",
        texte:
          "Pour info : l'avant-vente est saturée. Les managers ont rédigé cinq mémoires en trois semaines, dont deux pour des consultations où le prix pèse plus de la moitié de la note.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "pertes",
        titre: "Analyser les propositions de l'an dernier, par type de consultation",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Quand la note technique pèse au moins 60 %, Atlas gagne ${pourcent(CHANCE.technique.base)} des consultations au prix de l'an dernier, et en perd rarement sur le seul prix. Quand le prix pèse la moitié de la note ou plus, Kéroual l'emporte à 690 € le jour moyen : sous notre coût complet de ${euros(COUT_JOUR)} à la pyramide type. Chaque consultation de ce type gagnée à son prix est une perte signée. ${
            ctx.grilleCorrigee
              ? "Les forfaits gagnés depuis janvier au nouveau prix plancher ont une marge réelle positive."
              : `Les forfaits gagnés depuis janvier ont une marge réelle de ${ctx.margeReelle}.`
          }`,
      },
      {
        id: "forfaits",
        titre: "Rapprocher les forfaits clos de l'an dernier : vendu contre réalisé",
        cout: 0.5,
        nature: "utile",
        resultat: `23 forfaits clos. Marge affichée par la grille à la vente : ${pourcent(MARGE_AFFICHEE)}. Marge réelle à la clôture : ${pourcent(MARGE_REELLE_2024)}. Dépassement moyen : ${pourcent(DEPASSEMENT)} des jours vendus. Sans un seul jour de dépassement, la marge réelle n'aurait été que de ${pourcent(MARGE_SANS_DEPASSEMENT)} : l'essentiel de l'écart vient du coût d'une journée.`,
      },
    ],
    question: "Que décidez-vous pour la suite du trimestre ?",
    options: [
      {
        t: "Garder la règle de chiffrage, et ne répondre qu'aux consultations où la technique pèse au moins 60 %",
        d: "Un go / no-go à chaque consultation : moins de propositions, plus de temps de manager par mémoire.",
      },
      {
        t: "S'aligner sur Kéroual : baisser de 8 % les propositions en concurrence",
        d: `Retour à ${euros(PRIX.baisse)} le jour moyen, quelle que soit la grille.`,
      },
      {
        t: "Garder la règle de chiffrage et continuer de répondre à tout",
        d: "Le rythme habituel d'avant-vente.",
      },
      {
        t: "Garder la règle, mais laisser les associés accorder 5 % sur les comptes qu'ils jugent stratégiques",
        d: "Environ 3 % de moins sur le prix moyen.",
      },
    ],
    reactions: [
      [
        {
          ...AISSATOU,
          texte:
            "Merci. Les managers vont enfin avoir le temps d'écrire des mémoires qui se lisent.",
        },
      ],
      [{ ...DARIUSH, texte: "Enfin. Les associés repartent au combat." }],
      [{ ...AISSATOU, texte: "On continue de tout faire. Les managers rédigent le week-end." }],
      [{ ...LORCAN, texte: "Tous mes comptes sont stratégiques, tu t'en doutes." }],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Trois analystes sans mission",
    jusqua: 7,
    messages: () => [
      {
        ...AISSATOU,
        heure: "09:15",
        alerte: true,
        texte: `Le programme Vendée Ports se termine ce soir. Trois analystes n'ont rien jusqu'au démarrage du programme hospitalier, en semaine 12.`,
      },
      {
        ...ONDREJ,
        heure: "11:30",
        texte: `Nous voulons un diagnostic de nos deux entrepôts avant l'été : six semaines, trois analystes et un peu d'encadrement. Notre budget est de ${euros(MISSION.prix)}. Nous préférerions dix semaines, pour ${euros(MISSION.prix + MISSION.prolongation.prix)}.`,
      },
      {
        ...GUSTAVE,
        heure: "14:00",
        texte: `${euros(MISSION.prix)} pour ${JOURS_MISSION + MISSION.joursSenior} jours, c'est ${euros(PRIX_JOUR_MISSION)} le jour : sous le coût complet d'un analyste. On ne vient pas de décider qu'on ne vendait plus sous le coût ?`,
      },
    ],
    sources: [
      {
        id: "planning",
        titre: "Regarder le plan de charge des trois analystes dans Tempora",
        cout: 0.5,
        nature: "decisive",
        resultat: `Les trois analystes sont libres des semaines ${MISSION.de} à ${MISSION.a}, et aucune proposition en cours ne peut les occuper avant : les forfaits qu'on signera démarrent avec les équipes qui sortent d'autres missions. Leurs salaires sont payés, qu'ils travaillent ou non. Dès la semaine 12, ils sont attendus sur le programme hospitalier, déjà signé : les garder ailleurs obligerait à prendre des analystes de Freelancia, à ${euros(MISSION.freelance)} le jour.`,
      },
      {
        id: "chiffrage",
        titre: "Chiffrer la mission poste par poste",
        cout: 0.5,
        nature: "utile",
        resultat: `${JOURS_MISSION} jours d'analystes (trois, quatre jours par semaine, six semaines) et ${MISSION.joursSenior} jours de consultant senior pour encadrer. Au coût complet : ${euros(COUT_COMPLET_MISSION)}. Les frais de déplacement non refacturés : ${euros(MISSION.frais)} par jour d'analyste. Le senior, lui, n'est pas en intercontrat : ses jours sont pris sur d'autres missions.`,
      },
    ],
    question: "Que répondez-vous à la biscuiterie ?",
    options: [
      {
        t: `Refuser : ${euros(PRIX_JOUR_MISSION)} le jour, c'est sous notre coût complet`,
        d: "Les trois analystes restent en intercontrat jusqu'en semaine 12.",
      },
      {
        t: "Accepter, sur les dix semaines que la biscuiterie préfère",
        d: `${euros(MISSION.prix + MISSION.prolongation.prix)}. Les analystes restent chez le client quatre semaines après le démarrage du programme hospitalier.`,
      },
      {
        t: `Contre-proposer ${euros(MISSION.contre)} pour six semaines : le coût complet, plus 8 %`,
        d: "Un prix qu'on peut défendre devant le comité de direction. La biscuiterie dira oui, ou pas.",
      },
      {
        t: `Accepter ${euros(MISSION.prix)} pour six semaines fermes, présentées comme un prix d'intercontrat`,
        d: `Des semaines ${MISSION.de} à ${MISSION.a}, sans reconduction au même prix.`,
      },
    ],
    reactions: [
      [{ ...ONDREJ, texte: "Dommage. Nous allons voir avec un consultant indépendant." }],
      [{ ...ONDREJ, texte: "Parfait : dix semaines nous laissent le temps de bien faire." }],
      null,
      [
        {
          ...ONDREJ,
          texte:
            "Six semaines, c'est serré, mais d'accord. J'ai bien noté que la suite se discutera à un autre prix.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Le budget de Valmorin",
    jusqua: 9,
    messages: (ctx) => [
      {
        ...GAID,
        heure: "10:20",
        alerte: true,
        texte: `Votre soutenance nous a convaincus. Mais notre conseil d'administration a voté ${euros(VALMORIN.budget)} pour le schéma directeur logistique, pas un euro de plus. Votre proposition est à ${euros(catalogue(VALMORIN.associe))}.`,
      },
      {
        ...LORCAN,
        heure: "11:05",
        texte: `J'ai chiffré ${joursDe(VALMORIN.associe)} jours : ${VALMORIN.associe.analyste} d'analystes, ${VALMORIN.associe.senior} de seniors, ${VALMORIN.associe.manager} de managers. C'est un client sensible, je veux des gens expérimentés. On baisse les TJM de ${pourcent(REMISE_VALMORIN)} et on signe.`,
      },
      {
        ...GUSTAVE,
        heure: "16:30",
        texte: `Point de mi-trimestre : la marge des forfaits, carnet compris, est à ${ctx.marge}.`,
      },
    ],
    sources: [
      {
        id: "equipes",
        titre: "Chiffrer trois équipes au coût complet de chaque grade",
        cout: 0.5,
        nature: "decisive",
        resultat: `L'équipe de Lorcan (${VALMORIN.associe.analyste} / ${VALMORIN.associe.senior} / ${VALMORIN.associe.manager} jours d'analystes, de seniors et de managers) : ${euros(COUT_VALMORIN.associe)} au coût complet. Des analystes encadrés par les seniors, un manager à ${VALMORIN.revue.manager} jours (${VALMORIN.revue.analyste} / ${VALMORIN.revue.senior} / ${VALMORIN.revue.manager}, ${joursDe(VALMORIN.revue)} jours en tout) : ${euros(COUT_VALMORIN.revue)}. Un manager gardé sur chaque comité (${VALMORIN.prudente.analyste} / ${VALMORIN.prudente.senior} / ${VALMORIN.prudente.manager}) : ${euros(COUT_VALMORIN.prudente)}. Avant dépassement.`,
      },
      {
        id: "retours",
        titre: "Relire les bilans des forfaits menés avec une équipe jeune",
        cout: 0.5,
        nature: "utile",
        resultat: `Avec moins de 10 % de jours de manager, le dépassement moyen est de ${pourcent(VALMORIN.depassement.revue.moyen)}, contre ${pourcent(VALMORIN.depassement.associe.moyen)} pour une équipe expérimentée ; et près d'un comité de pilotage sur trois a réclamé le retour du manager, environ ${VALMORIN.joursComite} jours de plus jusqu'à la fin de la mission. Avec un manager à chaque comité, le dépassement reste autour de ${nombre(VALMORIN.depassement.prudente.moyen * 100)} %, sans rappel.`,
      },
    ],
    question: "Comment tenez-vous le budget de la coopérative ?",
    options: [
      {
        t: `Tenir les ${euros(VALMORIN.budget)} en baissant les TJM, avec l'équipe de Lorcan`,
        d: `${joursDe(VALMORIN.associe)} jours, un tiers de managers. Une remise de ${pourcent(REMISE_VALMORIN)} sur le catalogue.`,
      },
      {
        t: "Revoir la pyramide, en gardant un manager sur chaque comité",
        d: `${VALMORIN.prudente.analyste} jours d'analystes, ${VALMORIN.prudente.senior} de seniors, ${VALMORIN.prudente.manager} de manager, au budget de la coopérative.`,
      },
      {
        t: "Revoir franchement la pyramide : des analystes encadrés par les seniors",
        d: `${VALMORIN.revue.analyste} jours d'analystes, ${VALMORIN.revue.senior} de seniors, ${VALMORIN.revue.manager} de manager, au budget de la coopérative.`,
      },
      {
        t: `Maintenir ${euros(catalogue(VALMORIN.associe))} et l'équipe de Lorcan : à prendre ou à laisser`,
        d: "Le prix catalogue. La coopérative peut aller voir Halden Partners.",
      },
    ],
    reactions: [
      [{ ...GAID, texte: "Merci pour l'effort. Nous signons la semaine prochaine." }],
      [
        {
          ...GAID,
          texte:
            "Votre manager à chaque comité, c'est ce que mon conseil voulait entendre. Nous signons.",
        },
      ],
      [
        {
          ...GAID,
          texte:
            "Une équipe plus jeune, mais au budget. Nous signons ; je compte sur votre manager aux moments clés.",
        },
      ],
      null,
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "L'accord-cadre des collectivités",
    jusqua: 11,
    messages: () => [
      {
        ...LUCETTE,
        heure: "09:00",
        texte: `Achats Publics de l'Ouest lance la consultation pour un accord-cadre d'études d'organisation au profit des collectivités adhérentes, sur deux ans. Remise des offres en semaine 10, attribution en semaine ${ACCORD.attribution}.`,
      },
      {
        ...DARIUSH,
        heure: "10:30",
        alerte: true,
        texte: `Kéroual répondra à ${euros(ACCORD.prixKeroual)} le jour, comme partout. Si on ne s'aligne pas, on perd. Ce sont ${ACCORD.minimumJours} jours garantis la première année !`,
      },
    ],
    sources: [
      {
        id: "reglement",
        titre: "Lire le règlement de la consultation",
        cout: 0.5,
        nature: "decisive",
        resultat: `Note sur 100 : ${ACCORD.poidsTechnique} points pour la valeur technique, ${ACCORD.poidsPrix} pour le prix (${ACCORD.poidsPrix} × prix le plus bas ÷ prix proposé). Un minimum de commandes de ${ACCORD.minimumJours} jours la première année, au prix moyen du bordereau. Si Kéroual est à ${euros(ACCORD.prixKeroual)}, un prix de ${euros(ACCORD.prix.plancher)} vaut ${nombre(notePrix(ACCORD.prix.plancher, ACCORD.prixKeroual))} points sur ${ACCORD.poidsPrix}, et notre catalogue, ${euros(ACCORD.prix.catalogue)}, en vaut ${nombre(notePrix(ACCORD.prix.catalogue, ACCORD.prixKeroual))}.`,
      },
      {
        id: "notes",
        titre: "Retrouver les notes techniques des marchés publics de l'an dernier",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `En moyenne, Atlas obtient ${ACCORD.techAtlas} sur ${ACCORD.poidsTechnique} pour la valeur technique, Kéroual ${ACCORD.techKeroual}, Halden Partners ${ACCORD.techHalden} (à ${euros(ACCORD.prixHalden)} le jour), à quelques points près selon le jury. ${
            ctx.goNoGo
              ? `Depuis que l'avant-vente ne répond plus à tout, les managers ont le temps de soigner les mémoires : comptez ${ACCORD.bonusGoNoGo} points de mieux.`
              : "Ce mémoire-ci sera rédigé entre deux autres, comme d'habitude."
          }`,
      },
    ],
    question: "À quel prix répondez-vous ?",
    options: [
      {
        t: `S'aligner sur Kéroual, à ${euros(ACCORD.prix.aligne)} le jour`,
        d: `La note prix pleine. Au moins ${ACCORD.minimumJours} jours la première année à ce prix.`,
      },
      {
        t: `Répondre au prix plancher, ${euros(ACCORD.prix.plancher)} le jour`,
        d: `Le coût complet à la pyramide type, dépassement compris (${euros(PLANCHER)}), arrondi.`,
      },
      {
        t: `Répondre au catalogue, ${euros(ACCORD.prix.catalogue)} le jour, avec un mémoire soigné`,
        d: "Moins de points sur le prix ; tout se joue sur la valeur technique.",
      },
      {
        t: "Ne pas répondre",
        d: "L'avant-vente se consacre aux consultations privées.",
      },
    ],
    reactions: [
      [
        {
          ...DARIUSH,
          texte: `Offre déposée à ${euros(ACCORD.prix.aligne)}. Celui-là, on va le gagner.`,
        },
      ],
      [{ ...AISSATOU, texte: "Offre déposée. Le mémoire est propre." }],
      [
        {
          ...AISSATOU,
          texte: `Offre déposée à ${euros(ACCORD.prix.catalogue)}. Eloan Kastler a passé trois jours sur le mémoire.`,
        },
      ],
      [{ ...LUCETTE, texte: "Nous prenons note que vous ne répondez pas à cette consultation." }],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "La mutuelle veut reconduire",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...DOMENICA,
        heure: "10:00",
        texte: `Nous souhaitons reconduire l'accompagnement de nos agences pour l'année : ${ARMORINE.jours} jours, aux conditions de l'an dernier, ${euros(ARMORINE.prix2024)} le jour. Merci de nous confirmer avant la fin du mois.`,
      },
      {
        ...DARIUSH,
        heure: "11:15",
        alerte: true,
        texte:
          "Client historique depuis 2016. On reconduit, comme chaque année : on a toujours fait comme ça.",
      },
      {
        ...GUSTAVE,
        heure: "17:00",
        texte: `Deux semaines avant la clôture : la marge des forfaits, carnet compris, est à ${ctx.marge}.`,
      },
    ],
    sources: [
      {
        id: "historique",
        titre: "Reprendre la marge réelle de la mission de l'an dernier",
        cout: 0.5,
        nature: "decisive",
        resultat: `L'équipe : ${pourcent(ARMORINE.pyramide.analyste)} de jours d'analystes, ${pourcent(ARMORINE.pyramide.senior)} de seniors, ${pourcent(ARMORINE.pyramide.manager)} de manager. Coût complet : ${euros(COUT_JOUR_ARMORINE)} le jour ; avec les ${pourcent(ARMORINE.depassement.moyen)} de dépassement habituels de cette mission, ${euros(COUT_JOUR_ARMORINE * (1 + ARMORINE.depassement.moyen))}. À ${euros(ARMORINE.prix2024)}, la mutuelle a coûté ${euros(PERTE_ARMORINE_2024)} l'an dernier. Avec ${pourcent(ARMORINE.nouvelle.analyste)} d'analystes, ${pourcent(ARMORINE.nouvelle.senior)} de seniors et ${pourcent(ARMORINE.nouvelle.manager)} de manager, sur un périmètre recentré : ${euros(COUT_JOUR_ARMORINE_NOUVELLE)} le jour.`,
      },
      {
        id: "client",
        titre: "Demander au directeur de compte ce que la mutuelle accepterait",
        cout: 0.5,
        nature: "utile",
        resultat: `Domenica Marzin a consulté Halden Partners il y a deux ans : 980 € le jour. Elle tient à l'équipe en place. Une hausse argumentée, autour de ${euros(ARMORINE.prixPropose)}, passerait probablement, sept fois sur dix à son avis ; au-delà, elle relancerait une consultation.`,
      },
    ],
    question: "Que répondez-vous à la mutuelle ?",
    options: [
      {
        t: `Reconduire à ${euros(ARMORINE.prix2024)} avec la même équipe`,
        d: `Comme chaque année depuis 2016 : ${ARMORINE.jours} jours, ${euros(ARMORINE.jours * ARMORINE.prix2024)}.`,
      },
      {
        t: `Proposer ${euros(ARMORINE.prixPropose)} le jour, chiffres à l'appui`,
        d: `Le coût complet de l'équipe en place, dépassement compris, plus 5 % : ${euros(ARMORINE.jours * ARMORINE.prixPropose)}. La mutuelle peut refuser.`,
      },
      {
        t: `Garder ${euros(ARMORINE.prix2024)}, avec une équipe plus junior et un périmètre recentré`,
        d: `${pourcent(ARMORINE.nouvelle.analyste)} d'analystes, ${pourcent(ARMORINE.nouvelle.senior)} de seniors, ${pourcent(ARMORINE.nouvelle.manager)} de manager. La mutuelle garde son prix.`,
      },
      {
        t: "Laisser partir la mutuelle",
        d: "Elle ne couvre pas ses coûts : on ne renouvelle pas.",
      },
    ],
    reactions: [
      [{ ...DOMENICA, texte: "Parfait. Rendez-vous en avril pour le lancement." }],
      null,
      [
        {
          ...DOMENICA,
          texte:
            "Une équipe plus jeune ? Si l'agence de Vannes garde la même consultante senior, d'accord.",
        },
      ],
      [
        {
          ...DOMENICA,
          texte: "Nous sommes surpris, après tant d'années. Nous lancerons une consultation.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Le coût d'un jour facturable", chemin: [2, 0, 3, 2, 2, 1] },
  { nom: "La grille de toujours", chemin: [0, 1, 1, 0, 0, 0] },
  { nom: "Attentiste", chemin: [3, 2, 0, 0, 3, 0] },
] as const;

/**
 * Les options réflexes : garder le coût d'une journée sur 218 jours et baisser les prix pour
 * gagner des forfaits, [décision, option]. Refuser la mission d'intercontrat « sous le coût
 * complet » (D3) n'y figure pas : c'est le piège dans l'autre sens, que le dernier constat juge.
 */
export const REFLEXES = [
  [0, 0],
  [1, 1],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  contreOui: `D'accord pour ${euros(MISSION.contre)}, six semaines. Notre directeur financier a tiqué, mais votre équipe nous a convaincus.`,
  contreNon:
    "Nous n'irons pas au-delà de notre budget. Nous confions le diagnostic à un consultant indépendant.",
  catalogueOui: `Votre équipe nous rassure : le conseil accepte ${euros(catalogue(VALMORIN.associe))}. Nous signons.`,
  catalogueNon:
    "Notre conseil ne bougera pas. Nous signons avec Halden Partners, qui tient le budget.",
  armorineOui: `Vos chiffres sont clairs. Va pour ${euros(ARMORINE.prixPropose)} le jour.`,
  armorineNon:
    "C'est trop pour nous cette année. Nous allons lancer une consultation et voir d'autres cabinets.",
  comite: `Le comité de pilotage de Valmorin exige que le manager anime chaque atelier jusqu'à la fin de la mission : ${VALMORIN.joursComite} jours de plus, que le forfait ne paiera pas.`,
} as const;

/** Un message d'attribution de l'accord-cadre, notes à l'appui. */
export function messageAttribution(a: {
  gagnant: "atlas" | "keroual" | "halden";
  atlas: number;
  keroual: number;
  halden: number;
}): Message {
  const nom = { atlas: "Atlas Conseil", keroual: "Kéroual Consulting", halden: "Halden Partners" };
  return {
    ...LUCETTE,
    heure: `sem. ${ACCORD.attribution}`,
    alerte: a.gagnant !== "atlas",
    texte: `L'accord-cadre est attribué à ${nom[a.gagnant]}. Notes sur 100 : Atlas Conseil ${nombre(a.atlas)}, Kéroual Consulting ${nombre(a.keroual)}, Halden Partners ${nombre(a.halden)}.`,
  };
}
